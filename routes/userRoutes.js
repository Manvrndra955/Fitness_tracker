// routes/userRoutes.js
const express = require("express");
const User = require("../models/User");
const auth = require("../middleware/authMiddleware");

const router = express.Router();

// GET /api/users/profile  → current user's profile
router.get("/profile", auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select(
      "-password -createdAt -updatedAt -__v"
    );
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (err) {
    console.error("Get profile error:", err);
    res.status(500).json({ message: "Failed to fetch profile" });
  }
});

// PUT /api/users/profile  → update fitness profile
router.put("/profile", auth, async (req, res) => {
  try {
    const { name, heightCm, weightKg, age, gender, activityLevel } = req.body;

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (heightCm !== undefined) updates.heightCm = heightCm;
    if (weightKg !== undefined) updates.weightKg = weightKg;
    if (age !== undefined) updates.age = age;
    if (gender !== undefined) updates.gender = gender;
    if (activityLevel !== undefined) updates.activityLevel = activityLevel;

    const user = await User.findByIdAndUpdate(req.userId, updates, {
      new: true,
      runValidators: true,
      select: "-password -createdAt -updatedAt -__v",
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "Profile updated", user });
  } catch (err) {
    console.error("Update profile error:", err);
    res.status(500).json({ message: "Failed to update profile" });
  }
});

module.exports = router;
