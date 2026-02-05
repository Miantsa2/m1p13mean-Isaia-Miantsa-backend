
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const express = require('express');
const passport = require('passport');
const session = require('express-session');
require('./passport');


const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Session
app.use(session({
  secret: 'tonSecret',
  resave: false,
  saveUninitialized: true,
}));

// Passport
app.use(passport.initialize());
app.use(passport.session());



// Connexion à MongoDB
mongoose.connect(process.env.MONGO_URI)
 .then(() => console.log("MongoDB connecté"))
 .catch(err => console.log(err));

// Routes
app.use('/mean/auth', require('./routes/AuthRoute'));
app.use('/mean/client', require('./routes/ClientRoute'));
app.use('/mean/user', require('./routes/UserRoute'));
app.use('/mean/room', require('./routes/SalleRoute'));



app.listen(PORT, () => console.log(`Serveur démarré sur le port
${PORT}`));

