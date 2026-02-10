
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

app.use('/assets', express.static('assets'));

// Routes
app.use('/mean/auth', require('./routes/AuthRoute'));
app.use('/mean/client', require('./routes/ClientRoute'));
app.use('/mean/user', require('./routes/UserRoute'));
app.use('/mean/center', require('./routes/CentreRoute'));
app.use('/mean/room', require('./routes/SalleRoute'));
app.use('/mean/categorie', require('./routes/CategorieRoute'));
app.use('/mean/boutique', require('./routes/BoutiqueRoute'));
app.use('/mean/produit', require('./routes/ProduitRoute'));
app.use('/mean/event', require('./routes/EvenementRoute'));
app.use('/mean/stock', require('./routes/StockRoute'));
app.use('/mean/charge', require('./routes/ChargeRoute'));





app.listen(PORT, () => console.log(`Serveur démarré sur le port
${PORT}`));

