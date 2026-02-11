const express = require("express");
const router = express.Router();
const Categorie = require('../models/Categorie');
const auth = require('../middlewares/Auth');

// Lire toutes les catégories
router.get('/getCategorie',async (req, res) => {
  try {
    const categories = await Categorie.find();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Créer une catégorie
router.post("/createCategorie",auth(["admin", "boutique"]), async (req, res) => {
  try {
    const categorie = new Categorie(req.body);
    await categorie.save();
    res.status(201).json(categorie);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// get un categorie par id
router.get("/getCategorieId/:id",auth(["admin", "boutique"]), async (req, res) => {
  try {
    const categorie = await Categorie.findById(req.params.id);
    if (!categorie) {
      return res.status(404).json({ message: "Room not found" });
    }
    res.json(categorie);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Supprimer une catégorie
router.delete("/deleteCategorie/:id",auth(["admin", "boutique"]), async (req, res) => {
  try {
    const categorie = await Categorie.findByIdAndDelete(req.params.id);
    if (!categorie) {
      return res.status(404).json({ message: "Categorie not found" });
    }
    res.json({ message: "Delete room success" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;