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


router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);


router.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {

    const token = createToken(req.user);
    
    // res.redirect(`http://localhost:4200/login`);
    res.redirect(`http://localhost:4200/auth/callback?token=${token}&role=${req.user.role}`
);


  }
);

module.exports = router;