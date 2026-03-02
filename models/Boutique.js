const mongoose = require("mongoose");

const BoutiqueSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  nom: String,
  description: String,
  telephone: String,
  logo: String,
  categorie: { type: mongoose.Schema.Types.ObjectId, ref: "Categorie" },
  salle: { type: mongoose.Schema.Types.ObjectId, ref: "Salle" },
  horaires: [{
    jour: String,
    ouverture: String,
    fermeture: String
  }],
  notifications: [{
    description: String,
    date_envoyee: { type: Date, default: Date.now },
    titre: String,
    envoyeur: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    est_lue: { type: Boolean, default: false }
  }]
}, { timestamps: true });

module.exports = mongoose.model("Boutique", BoutiqueSchema);