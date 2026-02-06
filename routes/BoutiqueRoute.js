const express = require("express");
const router = express.Router();
const Boutique = require("../models/Boutique");
const Salle = require("../models/Salle")
const auth = require("../middlewares/Auth");
const User = require("../models/User");

// Lire toutes les boutiques
router.get("/getBoutiques", auth(["admin"]), async (req, res) => {
  try {
    const boutiques = await Boutique.find()
      .populate("user")
      .populate("categorie")
      .populate({
        path: "salle",
        select: "reference tailleMetreCarre"
    });

    res.json(boutiques);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// Lire une boutique par ID
router.get("/getBoutique/:id", auth(["admin"]), async (req, res) => {
  try {
    const boutique = await Boutique.findById(req.params.id)
      .populate("user")
      .populate("categorie")
      .populate("salle");

    if (!boutique) {
      return res.status(404).json({ message: "Boutique not found" });
    }

    res.json(boutique);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// Créer une boutique
router.post("/createBoutique", auth(["admin"]), async (req, res) => {
  try {
    const boutique = new Boutique(req.body);
    await boutique.save();

    if (req.body.salle) {
      await Salle.findByIdAndUpdate(
        req.body.salle,
        { statut: "occupee" },
        { new: true }
      );
    }

    res.status(201).json(boutique);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});


// Modifier une boutique
router.put("/updateBoutique/:id", auth(["admin"]), async (req, res) => {
  try {
    const boutique = await Boutique.findById(req.params.id);
    if(!boutique) return res.status(404).json({ message: "Boutique not found" });

    if(req.body.salle && req.body.salle.toString() !== (boutique.salle?._id.toString() || '')) {
      if(boutique.salle) {
        await Salle.findByIdAndUpdate(boutique.salle, { statut: "libre" });
      }

      await Salle.findByIdAndUpdate(req.body.salle, { statut: "occupee" });
    }

    boutique.salle = req.body.salle;
    await boutique.save();

    await boutique.populate("salle");

    res.json(boutique);
  } catch(err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});


// Supprimer une boutique
router.delete("/deleteBoutique/:id", auth(["admin"]), async (req, res) => {
  try {
    const boutique = await Boutique.findById(req.params.id);

    if (!boutique) {
      return res.status(404).json({ message: "Boutique not found" });
    }

    // Libérer la salle
    const salleId =
      typeof boutique.salle === "object"
        ? boutique.salle._id
        : boutique.salle;

    if (salleId) {
      await Salle.findByIdAndUpdate(salleId, { statut: "libre" });
    }

    // Supprimer le user associé
    if(boutique.user) {
      await User.findByIdAndDelete(boutique.user);
    }

    // Supprimer la boutique à la fin
    await boutique.deleteOne();

    res.json({ message: "Boutique deleted successfully and room free again" });
  } catch (error) {
    console.error("DELETE BOUTIQUE ERROR:", error);
    res.status(500).json({ message: error.message });
  }
});


module.exports = router;