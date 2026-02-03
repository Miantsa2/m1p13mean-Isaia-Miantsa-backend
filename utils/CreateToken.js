// utils/createToken.js
const jwt = require("jsonwebtoken");
require('dotenv').config();

const createToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

module.exports = createToken;
