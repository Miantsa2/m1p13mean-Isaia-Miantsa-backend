const express = require("express");
const router = express.Router();
const UserController = require("../controllers/UserController");
const client = require("../models/Client");
const passport = require("passport");
const createToken = require("../utils/CreateToken");


// Inscription client
router.post("/signup", UserController.signup);

// Connexion client
router.post("/login", UserController.login);


module.exports = router;