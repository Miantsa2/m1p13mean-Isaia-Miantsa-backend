const mongoose = require("mongoose");

const CentreSchema = new mongoose.Schema({
    nom: String,
    adresse: String,
    telephone: String,
    email: String,
    placeParking: Number,
    logo: String,
    description: String,
    horaires: [
        {
            jour: String,
            ouverture: String,
            fermeture: String
        }
    ],
    salles: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Salle"
        }
    ],
    prixMetreCarre: Number

   
  
}, { timestamps: true });

module.exports = mongoose.model("Centre", CentreSchema);