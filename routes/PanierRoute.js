const express = require("express");
const router = express.Router();
const Panier = require("../models/Panier");
const Stock = require("../models/Stock");
const Produit = require("../models/Produit");
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);


// 1. AJOUTER / UPDATE
router.post("/add", async (req, res) => {
    try {
        const { clientId, produitId, prix } = req.body; // Quantité 1 par défaut
        let panier = await Panier.findOne({ client: clientId, statut: "en_cours" });

        if (!panier) {
            panier = new Panier({ client: clientId, produits: [], total: 0 });
        }

        const itemIndex = panier.produits.findIndex(p => p.id.toString() === produitId);

        if (itemIndex > -1) {
            panier.produits[itemIndex].quantite += 1;
            panier.produits[itemIndex].sous_total = panier.produits[itemIndex].quantite * prix;
        } else {
            panier.produits.push({ id: produitId, quantite: 1, sous_total: prix });
        }

        panier.total = panier.produits.reduce((acc, p) => acc + p.sous_total, 0);
        await panier.save();
        res.status(200).json(panier);
    } catch (err) { res.status(500).json(err); }
});

// 2. UPDATE QUANTITÉ 
router.put("/update-quantity", async (req, res) => {
    const { clientId, produitId, nouvelleQuantite, prix } = req.body;
    const panier = await Panier.findOne({ client: clientId, statut: "en_cours" });
    
    const item = panier.produits.find(p => p.id.toString() === produitId);
    item.quantite = nouvelleQuantite;
    item.sous_total = nouvelleQuantite * prix;
    
    panier.total = panier.produits.reduce((acc, p) => acc + p.sous_total, 0);
    await panier.save();
    res.status(200).json(panier);
});

// 3. Supprimer un produit
router.delete("/remove-product/:clientId/:produitId", async (req, res) => {
    const panier = await Panier.findOne({ client: req.params.clientId, statut: "en_cours" });
    panier.produits = panier.produits.filter(p => p.id.toString() !== req.params.produitId);
    panier.total = panier.produits.reduce((acc, p) => acc + p.sous_total, 0);
    await panier.save();
    res.status(200).json(panier);
});

// 4. Vide le panier
router.delete("/clear/:clientId", async (req, res) => {
    await Panier.findOneAndDelete({ client: req.params.clientId, statut: "en_cours" });
    res.status(200).json({ message: "Deleted cart" });
});

// 5. Récupérer le panier d'un client
router.get("/client/:clientId", async (req, res) => {
    try {
        const panier = await Panier.findOne({ 
            client: req.params.clientId, 
            statut: "en_cours" 
        }).populate({
          path: "produits.id",
          populate: {
            path: "boutique"
          }
        });
        if (!panier) {
            return res.status(200).json({ produits: [], total: 0 });
        }
        res.status(200).json(panier);
    } catch (err) {
        res.status(500).json(err);
    }
});

// 6. Validation d'un panier
router.post("/validate", async (req, res) => {
    try {
        const { clientId } = req.body;
        const panier = await Panier.findOne({ client: clientId, statut: "en_cours" }).populate("produits.id");

        if (!panier || panier.produits.length === 0) {
            return res.status(400).json({ message: "Cart is empty" });
        }

        for(const item of panier.produits) {
            const produit = item.id;
            if(produit.stock !== null && produit.stock !== undefined) {
                const mouvementSortie = new Stock({
                    produit: produit._id,
                    est_entree: 0,
                    quantite: item.quantite
                });

                await mouvementSortie.save();
            }
        }

        panier.statut = "valide";
        await panier.save();

        res.status(200).json({ message: "Cart validated and stock updated" });
    }catch(err) {
        console.error(err);
        res.status(500).json(err);
    }
});

// 7. Pour voir les historiques de tous les paniers par client
router.get("/history/:clientId", async (req, res) => {
    try {
        const historique = await Panier.find({ 
            client: req.params.clientId, 
            statut: "valide" 
        }).populate("produits.id");
        
        res.status(200).json(historique);
    } catch (err) {
        res.status(500).json(err);
    }
});

// 8. Pour ne pas dépasser les quantités en stock
router.get("/check-stock/:produitId", async (req, res) => {
    try {
        const p = await Produit.findById(req.params.produitId);
        if (!p) return res.status(404).json({ message: "Product not found" });

        if (p.stock === null || p.stock === undefined) {
            return res.json({ availableQty: 9999 });
        }

        const mouvements = await Stock.find({ produit: p._id });
        const totalIn = mouvements.filter(m => m.est_entree === 1).reduce((acc, curr) => acc + curr.quantite, 0);
        const totalOut = mouvements.filter(m => m.est_entree === 0).reduce((acc, curr) => acc + curr.quantite, 0);

        const currentQty = (Number(p.stock) || 0) + totalIn - totalOut;
        res.json({ availableQty: currentQty });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});



// Ajouter ou modifier la localisation de récupération
router.put("/set-recuperation/:panierId", async (req, res) => {
  try {
    const { panierId } = req.params;
    const { coo_x, coo_y } = req.body;

    if (!coo_x || !coo_y) {
      return res.status(400).json({ message: "Coordinates are required" });
    }

    const panier = await Panier.findByIdAndUpdate(
      panierId,
      {
        recuperation: { coo_x, coo_y }
      },
      { new: true }
    );

    if (!panier) {
      return res.status(404).json({ message: "Panier not found" });
    }

    res.json({
      message: "Recuperation updated successfully",
      panier
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});


function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // rayon de la Terre en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // distance en km
}

function calculateDeliveryPrice(lat2, lon2){
    const centre = {
      lat: -18.8792,
      lng: 47.5079 
    }; 
    const distance = calculateDistance(
        centre.lat,
        centre.lng,
        lat2,
        lon2
      );

    return  distance * 0.5; // 0.5 euro par km 
}



router.get("/makeInvoice/cart/:id", async (req, res) => {
  try {
    const panier = await Panier.findById(req.params.id)
      .populate("produits.id"); // <-- ici on utilise "id"

    if (!panier) {
      return res.status(404).json({ message: "Panier not found" });
    }

    let total = 0;

    const produits = panier.produits.map(item => {
      if (!item.id) return null; // ignore si produit supprimé
      const prix = item.id.prix || 0;
      const quantite = item.quantite || 0;
      const subtotal = prix * quantite;
      total += subtotal;

      return {
        produitId: item.id._id,
        nom: item.id.nom,
        quantite,
        prixUnitaire: prix,
        subtotal
      };
    }).filter(Boolean); 

    // Livraison
    let livraison = 0;
    if (panier.recuperation?.coo_x && panier.recuperation?.coo_y) {
      livraison = calculateDeliveryPrice(
        panier.recuperation.coo_x,
        panier.recuperation.coo_y
      );
    }

    const totalAPayer = total + livraison;

     const paymentIntent = await stripe.paymentIntents.create({
      amount:Math.round(totalAPayer * 100),
      currency: "eur",
      description: `cart `,
    });


    res.status(200).json({
      produits,
      totalPanier: total,
      prixLivraison: livraison,
      totalAPayer,
      clientSecret: paymentIntent.client_secret,
    });

  } catch (error) {
    console.error("Erreur serveur makeInvoice:", error);
    res.status(500).json({ message: "Server error", error });
  }
});




module.exports = router;