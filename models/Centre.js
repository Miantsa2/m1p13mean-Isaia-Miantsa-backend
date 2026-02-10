const mongoose = require("mongoose");
const CentreSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },  
    nom: { type: String, required: true },
    adresse: String,
    telephone: String,
    email: String,
    placeParking: { type: Number, default: 0 },
    logo: String,
    description: String,
    horaires: [
        {
            jour: { 
                type: String, 
                required: [true, "Day required"],
                enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] 
            },
            ouverture: { 
                type: String, 
                required: [true, "Open Time required"] 
            },
            fermeture: { 
                type: String, 
                required: [true, "Close Time required"] 
            }
        }
    ],
    salles: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Salle"
        }
    ],
    prixMetreCarre: { type: Number, required: true, default: 0 },

    notifications: [{
        description: String,
        date_envoyee: { type: Date, default: Date.now },
        titre: String,
        envoyeur: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        est_lue: { type: Boolean, default: false }
      }]
}, { timestamps: true });

module.exports = mongoose.model("Centre", CentreSchema);