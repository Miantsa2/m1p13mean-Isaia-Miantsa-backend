const mongoose = require("mongoose");

const StockSchema = new mongoose.Schema({
    produit: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Produit",
        required: true
    },
    est_entree: Number,
    quantite: Number,
}, { timestamps: true });

module.exports = mongoose.model("Stock", StockSchema);