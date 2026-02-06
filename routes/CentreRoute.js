const express = require("express");
const router = express.Router();
const Centre = require("../models/Centre");
const auth= require('../middlewares/Auth');

router.post("/createCenter", auth(["admin"]), async (req, res) => {
  try {
    const centre = new Centre(req.body);
    await centre.save();
    res.status(201).json(centre);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.get("/getCenter", async (req, res) => {
  try {
    const centres = await Centre.find().populate("salles");
    res.json(centres);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


router.put("/updateCenter/:id", async (req, res) => {
  try {
    const updatedCentre = await Centre.findByIdAndUpdate(
      req.params.id,
      { $set: req.body }, // $set permet de mettre à jour uniquement les champs envoyés
      { new: true, runValidators: true }
    );

    if (!updatedCentre) {
      return res.status(404).json({ message: "Centre non trouvé" });
    }
    res.json(updatedCentre);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});


router.put("/updatePrice/:id", auth(["admin"]), async (req, res) => {
  try {
    const { prixMetreCarre } = req.body;

    if (prixMetreCarre === undefined || prixMetreCarre < 0) {
      return res.status(400).json({ message: "Prix invalide" });
    }

    const centre = await Centre.findByIdAndUpdate(
      req.params.id,
      { prixMetreCarre: prixMetreCarre }
     
    );

    if (!centre) {
      return res.status(404).json({ message: "Centre non trouvé" });
    }

    res.json(centre);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


router.delete("/deleteCenter/:id",auth(["admin"]), async (req, res) => {
  try {
    const centre = await Centre.findByIdAndDelete(req.params.id);
    if (!centre) {
      return res.status(404).json({ message: "Center not found" });
    }
    res.json({ message: "Delete Center success" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
