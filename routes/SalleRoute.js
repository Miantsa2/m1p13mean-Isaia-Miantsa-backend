const express = require("express");
const router = express.Router();
const Salle = require("../models/Salle");
const auth= require('../middlewares/Auth');

// Lire tous les salles
router.get('/getRoom', auth(["admin"]), async (req, res) => {
  try {
    const salles = await Salle.find();
    res.json(salles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Créer un salle
router.post("/createRoom",auth(["admin"]), async (req, res) => {
  try {
    const salle = new Salle(req.body);
    await salle.save();
    res.status(201).json(salle);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

//get une salle par id
router.get("getRoomById/:id",auth(["admin"]), async (req, res) => {
  try {
    const salle = await Salle.findById(req.params.id);
    if (!salle) {
      return res.status(404).json({ message: "Room not found" });
    }
    res.json(salle);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mettre à jour une salle
router.put("/updateRoom/:id", auth(["admin"]), async (req, res) => {
  try {
    const salle = await Salle.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!salle) {
      return res.status(404).json({ message: "Room not found" });
    }
    res.json(salle);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});



// Supprimer une salle
router.delete("/deleteRoom/:id",auth(["admin"]), async (req, res) => {
  try {
    const salle = await Salle.findByIdAndDelete(req.params.id);
    if (!salle) {
      return res.status(404).json({ message: "Room not found" });
    }
    res.json({ message: "Delete room success" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


//salle dispo

router.get("/freeRoom", auth(["admin"]), async (req, res) => {
  try {
    const sallesDisponibles = await Salle.find({ statut: "libre" });
    res.json(sallesDisponibles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// filtre : statut, date creation (ordre), metre carre

router.get("/filterRoom",auth(["admin"]), async (req, res) => {
  try {
    const { statut, ordre, taille } = req.query;
    const filter = {};

    if (statut && statut !== "null" && statut !== "") {
      filter.statut = statut;
    }

    if (taille) {
      filter.tailleMetreCarre = { $gte: parseFloat(taille) };
    }
    const sortOrder = ordre === "asc" ? 1 : -1;

    const salles = await Salle.find(filter).sort({ createdAt: sortOrder });

    res.json(salles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});



module.exports = router;
