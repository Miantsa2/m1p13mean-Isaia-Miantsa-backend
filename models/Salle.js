const mongoose = require("mongoose");

const SalleSchema = new mongoose.Schema({
    reference:String,
    tailleMetreCarre: Number,
    statut: {
    type: String,
    enum: ["libre", "occupee"]
  }
    
  
}, { timestamps: true });

module.exports = mongoose.model("Salle", SalleSchema);