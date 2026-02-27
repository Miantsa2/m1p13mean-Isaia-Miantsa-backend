const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const Boutique = require("../models/Boutique");
const Produit = require("../models/Produit");
const Stock = require("../models/Stock");
const auth = require('../middlewares/Auth');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const multer = require('multer');
const path = require('path');

// Lire tous les produits
router.get("/getProduits", auth(["admin", "boutique", "client"]), async (req, res) => {
  try {
    const produits = await Produit.find()
      .populate("boutique")
      .populate("categorie");

    res.json(produits);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Lire un produit par ID
router.get("/getProduit/:id", auth(["admin", "boutique", "client"]), async (req, res) => {
  try {
    const produit = await Produit.findById(req.params.id)
      .populate("boutique")
      .populate("categorie");

    if (!produit) {
      return res.status(404).json({ message: "Produit not found" });
    }

    res.json(produit);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Lire les produits d'une boutique
router.get("/getProduitsByBoutique/:boutiqueId", async (req, res) => {
  try {
    const produits = await Produit.find({ boutique: req.params.boutiqueId, isAvailable: true })
      .populate("boutique")
      .populate("categorie")
      .lean();

    const produitsAvecStock = await Promise.all(produits.map(async (p) => {
      if (p.stock === null || p.stock === undefined) {
          return { ...p, availableQty: null }; 
      }

      const mouvements = await Stock.find({ produit: p._id });
      const totalIn = mouvements.filter(m => m.est_entree === 1).reduce((acc, curr) => acc + curr.quantite, 0);
      const totalOut = mouvements.filter(m => m.est_entree === 0).reduce((acc, curr) => acc + curr.quantite, 0);

      const currentQty = (Number(p.stock) || 0) + totalIn - totalOut;

      return { ...p, availableQty: currentQty };
    }));

    res.json(produitsAvecStock);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Lire les catégories utilisées par une boutique ( pour filtre )
router.get("/getCategoriesByBoutique/:boutiqueId", auth(["admin", "boutique", "client"]), async (req, res) => {
  try {
    const categories = await Produit.aggregate([
      {
        $match: {
          boutique: new mongoose.Types.ObjectId(req.params.boutiqueId)
        }
      },
      {
        $group: {
          _id: "$categorie"
        }
      },
      {
        $lookup: {
          from: "categories",
          localField: "_id",
          foreignField: "_id",
          as: "categorie"
        }
      },
      {
        $unwind: "$categorie"
      },
      {
        $replaceRoot: { newRoot: "$categorie" }
      }
    ]);

    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); 
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// Création d'un produit
router.post("/createProduit", auth(["boutique"]),upload.single('image'), async (req, res) => {
  try {
    const boutique = await Boutique.findById(req.body.boutique);
    if (!boutique) {
      return res.status(404).json({ message: "Boutique not found" });
    }

    const produitData = {
      ...req.body,
      description: req.file ? `/uploads/${req.file.filename}` : req.body.description
    };

    const produit = new Produit(produitData);
    await produit.save();
    res.status(201).json(produit);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Modifier un produit
router.put("/updateProduit/:id", auth(["boutique"]), async (req, res) => {
  try {
    const produit = await Produit.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!produit) {
      return res.status(404).json({ message: "Produit not found" });
    }

    res.json(produit);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

//Supprimer un produit
router.delete("/deleteProduit/:id", auth(["boutique"]), async (req, res) => {
  try {
    const produit = await Produit.findById(req.params.id);

    if (!produit) {
      return res.status(404).json({ message: "Produit not found" });
    }

    await produit.deleteOne();

    res.json({ message: "Produit deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mettre à jour la disponibilité d'un produit
router.patch("/updateAvailability/:id", auth(["boutique"]), async (req, res) => {
    try {
        const produit = await Produit.findById(req.params.id);
        if (!produit) return res.status(404).json({ message: "Product not found" });

        produit.isAvailable = !produit.isAvailable;
        await produit.save();
        
        res.json({ isAvailable: produit.isAvailable });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Route pour mettre à jour la promotion
router.put("/updatePromo/:id", auth(["boutique"]), async (req, res) => {
  try {
    const { promotions } = req.body;
    const produit = await Produit.findByIdAndUpdate(
      req.params.id,
      { promotions },
      { new: true }
    );
    res.json(produit);
  }catch(error) {
    res.status(500).json({ message: error.message});
  }
});

// Route pour creer la facture du sponsor 
router.post("/makeInvoiceSponsor/:id", auth(["boutique"]), async (req, res) => {
  try {
    const { sponsorData } = req.body; // dateDebut et dateFin
    const produit = await Produit.findById(req.params.id);
    if (!produit) {
      return res.status(404).json({ message: "Product not found" });
    }

    const now = new Date();
    if (produit.sponsor?.dateFin && new Date(produit.sponsor.dateFin) >= now) {
      return res.status(400).json({ message: "already sponsorized" });
    }

    const debut = new Date(sponsorData.dateDebut);
    const fin = new Date(sponsorData.dateFin);
    const duree = Math.ceil((fin.getTime() - debut.getTime()) / (1000 * 60 * 60 * 24));
    const amount = duree * 0.01 * produit.prix;
 
    

    const invoice = {
      produitId: produit._id,
      produitNom: produit.nom,
      produitPrix: produit.prix,
      dateDebut: debut,
      dateFin: fin,
      duree,
      amount,
      currency: "eur"
    };

    console.log("here", Math.round(invoice.amount * 100))

     const paymentIntent = await stripe.paymentIntents.create({
      amount:Math.round(invoice.amount * 100),
      currency: "eur",
      description: `sponsor ${produit.nom} `,
    });


     res.status(200).json({
      invoice,
      clientSecret: paymentIntent.client_secret,
    });;
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


router.get("/getSponsorisedProduit", auth(["admin", "boutique", "client"]), async (req, res) => {
  try {
    const now = new Date();

    const produits = await Produit.find({
      isAvailable: true,
      "sponsor.dateDebut": { $lte: now },
      "sponsor.dateFin": { $gte: now }
    })
      .populate("boutique")
      .populate("categorie");

    res.json(produits);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


module.exports = router;