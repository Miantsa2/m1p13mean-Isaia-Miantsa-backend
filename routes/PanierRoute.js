const express = require("express");
const router = express.Router();
const Panier = require("../models/Panier");
const Stock = require("../models/Stock");
const Produit = require("../models/Produit");

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
        }).populate("produits.id");

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
module.exports = router;