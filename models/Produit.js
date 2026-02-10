const mongoose = require("mongoose");

const ProduitSchema = new mongoose.Schema({
    nom: String,
    description: String,
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
