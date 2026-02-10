const express = require("express");
const router = express.Router();
const Charge = require("../models/Charge");
const auth= require('../middlewares/Auth');

// Lire tous charges
router.get('/getCharge', auth(["boutique"]),async (req, res) => {
  try {
    const charges = await Charge.find().populate("boutique");
    res.json(charges);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/createCharge",auth(["boutique"]), async (req, res) => {
  try {
    const charge = new Charge(req.body);
    await charge.save();
    res.status(201).json(charge);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.get("/getChargeById/:id",auth(["boutique"]), async (req, res) => {
  try {
    const charge = await Charge.findById(req.params.id);
    if (!charge) {
      return res.status(404).json({ message: "Charge not found" });
    }
    res.json(charge);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});



router.put("/updateCharge/:id", auth(["boutique"]), async (req, res) => {
  try {
    const charge = await Charge.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!charge) {
      return res.status(404).json({ message: "charge not found" });
    }
    res.json(charge);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});


router.delete("/deleteCharge/:id",auth(["boutique"]), async (req, res) => {
  try {
    const charge = await Charge.findByIdAndDelete(req.params.id);
    if (!charge) {
      return res.status(404).json({ message: "charge not found" });
    }
    res.json({ message: "charge room success" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


router.get("/filterCharge", auth(["boutique"]), async (req, res) => {
  try {
    const { duCentre, ordre, boutiqueId } = req.query;
    const filter = {};

    if (duCentre !== undefined) {
      filter.du_centre = duCentre === "true";
    }

 

    filter.boutiqueId= boutiqueId;

    const sortOrder = ordre === "asc" ? 1 : -1;

    const charges = await Charge
      .find(filter)
      .sort({ createdAt: sortOrder });

    res.status(200).json(charges);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});


router.get("/getChargeByBoutiqueId/:boutiqueId", async (req, res) => {
  try {
    const charges = await Charge.find({
      boutique: req.params.boutiqueId
    }).populate("boutique");

    res.status(200).json(charges);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


module.exports = router;
