const express = require("express");
const router = express.Router();
const UserController = require("../controllers/UserController");
const Client = require("../models/Client");
const user = require("../models/User");
const auth= require('../middlewares/Auth');


// Supprimer 
router.delete('/:id', auth(["admin"]), async (req, res) => {
 try {
    await Client.findByIdAndDelete(req.params.id);
    res.json({ message: "Client supprimé" });
 } catch (error) {
    res.status(500).json({ message: error.message });
 }
});


//lire tous les clients
router.get('/', auth(["admin", "client", "boutique"]), async (req, res) => {
 try {
 const clients = await Client.find();
 res.json(clients);
 } catch (error) {
 res.status(500).json({ message: error.message });
 }
});
module.exports = router;

// get client par le user connecté
router.get("/user/:userId", auth(["admin", "client", "boutique"]), async (req, res) => {
    try {
      console.log("Recherche pour userId:", req.params.userId);
      const client = await Client.findOne({ user: req.params.userId });
      if (!client) return res.status(404).json({ message: "Client not found" });
      res.status(200).json(client);
    } catch (err) {
      console.error("Erreur serveur:", err);
      res.status(500).json(err);
    }
});