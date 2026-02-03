const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true 
  },
  role: {
    type: String,
    enum: ["client", "boutique", "admin"],
    default: "client"
  },

}, { timestamps: true });
module.exports = mongoose.model("User", UserSchema);