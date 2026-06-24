// models/WeightEntry.js
const mongoose = require("mongoose");

const weightEntrySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: { type: Date, required: true },
    weightKg: { type: Number, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("WeightEntry", weightEntrySchema);
