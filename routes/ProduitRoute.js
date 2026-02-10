const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const Boutique = require("../models/Boutique");
const Categorie = require("../models/Categorie");
const Produit = require("../models/Produit");
const auth = require('../middlewares/Auth');


// Lire tous les produits
router.get("/getProduits", auth(["admin", "boutique"]), async (req, res) => {
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
router.get("/getProduit/:id", auth(["admin", "boutique"]), async (req, res) => {
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
router.get("/getProduitsByBoutique/:boutiqueId", auth(["admin", "boutique"]), async (req, res) => {
  try {
    const produits = await Produit.find({ boutique: req.params.boutiqueId })
      .populate("boutique")
      .populate("categorie");

    res.json(produits);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Lire les catégories utilisées par une boutique ( pour filtre )
router.get("/getCategoriesByBoutique/:boutiqueId", auth(["admin", "boutique"]), async (req, res) => {
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

// Création d'un produit
router.post("/createProduit", auth(["boutique"]), async (req, res) => {
  try {
    // Vérifier que la boutique existe
    const boutique = await Boutique.findById(req.body.boutique);
    if (!boutique) {
      return res.status(404).json({ message: "Boutique not found" });
    }

    const produit = new Produit(req.body);
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

module.exports = router;