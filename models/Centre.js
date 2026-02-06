const mongoose = require("mongoose");
const CentreSchema = new mongoose.Schema({
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
                enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] // Sécurité supplémentaire
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
    prixMetreCarre: { type: Number, required: true, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model("Centre", CentreSchema);