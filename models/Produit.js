const mongoose = require("mongoose");

const ProduitSchema = new mongoose.Schema({
    nom: String,
    description: String, // référence pour une image
    prix: Number,
    stock: Number,
    isAvailable: { 
        type: Boolean, 
        default: true 
    },
    boutique: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Boutique",
        required: true
    },
    promotions: {
        pourcentage: Number,
        dateDebut: Date,
        dateFin: Date
    },
    categorie: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Categorie"
    },
    sponsor: {
        dateDebut: Date,
        dateFin: Date
    },
  
}, { timestamps: true });

module.exports = mongoose.model("Produit", ProduitSchema);
