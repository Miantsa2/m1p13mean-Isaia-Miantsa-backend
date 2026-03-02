const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const auth = require('../middlewares/Auth');

// Lire tous les users
router.get('/', auth(["admin", "boutique", "client"]), async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Créer un user
router.post('/', auth(["admin", "client"]), async (req, res) => {
  try {
    const hash = await bcrypt.hash(req.body.password, 10);

     const user = new User({
      email: req.body.email,
      password: hash,
      role: req.body.role
    });

    await user.save();
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Mettre à jour un user
router.put('/:id', auth(["admin"]), async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Supprimer un user
router.delete('/:id', auth(["admin"]), async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User supprimé" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
