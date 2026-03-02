const mongoose = require("mongoose");

const EvenementSchema = new mongoose.Schema({
    reference: String,
    description: String,
    dateDebut: Date,
    dateFin: Date,
    statut: {
        type: String,
        enum: ["approuved", "refused", "pending", "finished"],
        default: "pending"
    },
    boutique: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Boutique"
    },
     email_envoye: {
        type: Boolean,
        default: false,
    },

}, { timestamps: true });

module.exports = mongoose.model("Evenement", EvenementSchema);
