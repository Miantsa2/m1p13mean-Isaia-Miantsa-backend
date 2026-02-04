const express = require("express");
const router = express.Router();
const UserController = require("../controllers/UserController");
const client = require("../models/Client");
const user = require("../models/User");
const auth= require('../middlewares/Auth');

// router.get("/home", auth(["client"]), (req, res) => {
//   res.json({ message: `Bienvenue ${req.user.email} sur l'accueil client` });
// });

// router.get("/test", auth(["admin"]), (req, res) => {
//   res.json({ message: `Bienvenue ${req.user.email} sur l'accueil admin` });
// });

// Supprimer 
router.delete('/:id', async (req, res) => {
 try {
    await client.findByIdAndDelete(req.params.id);
    res.json({ message: "Client supprimé" });
 } catch (error) {
    res.status(500).json({ message: error.message });
 }
});


//lire tous les clients
router.get('/', async (req, res) => {
 try {
 const clients = await client.find();
 res.json(clients);
 } catch (error) {
 res.status(500).json({ message: error.message });
 }
});
module.exports = router;

