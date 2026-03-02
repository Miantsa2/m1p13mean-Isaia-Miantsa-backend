const mongoose = require("mongoose");

const ClientSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    nom: String,
    prenom: String,
    genre: { type: String, enum: ["H", "F"] },
    dateNaissance: Date,
    adresse: String
}, { timestamps: true   });

module.exports = mongoose.model("Client", ClientSchema);