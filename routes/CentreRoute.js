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



router.put("/updateCenter/:id",auth(["admin"]), async (req, res) => {
  try {
    const centre = await Centre.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!centre) {
      return res.status(404).json({ message: "Center not found" });
    }
    res.json(centre);
  } catch (error) {
    res.status(400).json({ message: error.message });
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
