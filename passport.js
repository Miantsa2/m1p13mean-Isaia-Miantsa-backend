
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const User = require("./models/User");
const Client = require("./models/Client");
const bcrypt = require("bcryptjs");

const express = require('express');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;



 // Serialize et deserialize user
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));


// Google Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.URI_GOOGLE,
  
},
async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await User.findOne({ email: profile.emails[0].value });

    if (!user) {
  
      const hash = await bcrypt.hash("google_oauth", 10);

      user = await User.create({
        email: profile.emails[0].value,
        password: hash,
        role: "client"
      });
    }

    let client = await Client.findOne({ user: user._id });

    if (!client) {
      client = await Client.create({
        user: user._id,
        nom: profile.name.familyName,
        prenom: profile.name.givenName,
        genre: null,
        dateNaissance: null,
        adresse: null
      });
    }
    return done(null, user);

  } catch (err) {
    return done(err, null);
  }
}));



