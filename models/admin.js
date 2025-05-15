const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const adminSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    email: {
      type: String,
      unique: true,
      required: true,
      minlength: 10,
      maxlength: 255,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      maxlength: 1024,
    },
  },
  { timestamps: true }
);

adminSchema.methods.generateTokens = function () {
  return jwt.sign({ _id: this._id }, process.env.ACCES_TOKEN, {
    expiresIn: process.env.JWT_EXP,
  });
};

module.exports = mongoose.model("Admin", adminSchema);
