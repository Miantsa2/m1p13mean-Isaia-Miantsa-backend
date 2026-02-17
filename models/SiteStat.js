const mongoose = require("mongoose");

const SiteStatSchema = new mongoose.Schema({
  nombre_visite: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model("SiteStat", SiteStatSchema);
