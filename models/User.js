// models/User.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: { type: String, required: true },

    // NEW: fitness profile fields
    heightCm: { type: Number }, // height in cm
    weightKg: { type: Number }, // weight in kg
    age: { type: Number },
    gender: {
      type: String,
      enum: ["male", "female", "other", ""],
      default: "",
    },
    activityLevel: {
      type: String,
      enum: ["sedentary", "light", "moderate", "active", "very_active", ""],
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
