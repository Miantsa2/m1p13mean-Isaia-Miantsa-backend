// utils/createToken.js
const jwt = require("jsonwebtoken");
require('dotenv').config();

const createToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '2h' }
  );
};

module.exports = createToken;
