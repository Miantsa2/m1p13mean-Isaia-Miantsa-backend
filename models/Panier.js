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
        quantite: Number, sous_total: Number
    }
    ],
    recuperation: {
        date_recuperation: Date,
        coo_x: String,
        coo_y: String
    }
  
}, { timestamps: true });

module.exports = mongoose.model("Panier", PanierSchema);
