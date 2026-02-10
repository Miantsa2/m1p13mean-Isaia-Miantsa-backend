const mongoose = require("mongoose");

const ChargeSchema = new mongoose.Schema({
    description:String,
    valeur: Number,
    reference: String,
    boutique: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Boutique"
    },
    du_centre: Boolean,
    date_limite: Date,
    statut: {
        type: String,
        enum: ["paye", "non_paye"]
    }
    
  
}, { timestamps: true });

module.exports = mongoose.model("Charge", ChargeSchema);





