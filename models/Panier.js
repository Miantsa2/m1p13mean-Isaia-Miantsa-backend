const mongoose = require("mongoose");

const PanierSchema = new mongoose.Schema({
    statut: {
        type: String,
        enum: ["en_cours", "valide", "annule"],
        default: "en_cours"
    },
    total: Number,
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Client"
    },
    produits: [
    {
        id:{ type:mongoose.Schema.Types.ObjectId, ref:"Produit" },
        quantite: Number, sous_total: Number,
        date_recuperation: Date,
        checked: { type: Boolean, default: false }
    }
    ],
   recuperation: {
        coo_x: Number,
        coo_y: Number
    }
  
}, { timestamps: true });

module.exports = mongoose.model("Panier", PanierSchema);


