const mongoose = require("mongoose");
const EvenementSchema = new mongoose.Schema({
    reference: String,
    description:String,
    dateDebut: Date,
    dateFin: Date,
    statut: {
        type: String,
        enum: ["valide", "refuse", "en_attente", "termine"]
    },
    centre: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Centre"
    },
    boutique: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Boutique"
    },
   
  
}, { timestamps: true });

module.exports = mongoose.model("Evenement", EvenementSchema);