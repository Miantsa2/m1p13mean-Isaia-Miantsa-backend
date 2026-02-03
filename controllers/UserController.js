const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Client = require("../models/Client");

const createToken = require("../utils/CreateToken");

exports.signup = async (req, res) => {
  try {
    const { email, password, nom, prenom, genre, dateNaissance, adresse } = req.body;

    // Vérifier email
    const exist = await User.findOne({ email });
    if (exist) {
      return res.status(400).json({ message: "Email déjà utilisé" });
    }
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({
      email,
      password: hash,
      role: "client"
    });
    const client = await Client.create({
      user: user._id,
      nom,
      prenom,
      genre,
      dateNaissance,
      adresse
    });

    const token = createToken(user);


    res.status(201).json({
      message: "Compte client créé",
      token,
      userId: user._id,
      clientId: client._id,

    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "Utilisateur introuvable" });
    }

  
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.status(401).json({ message: "Mot de passe incorrect" });
    }

    const token = createToken(user);

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role
      }
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
