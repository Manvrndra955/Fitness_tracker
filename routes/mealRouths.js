// routes/mealRoutes.js
const express = require("express");
const Meal = require("../models/Meal");
const auth = require("../middleware/authMiddleware");

const router = express.Router();

// All routes protected
router.use(auth);

// ✅ GET /api/meals → get all meals for logged-in user
router.get("/", async (req, res) => {
  try {
    const meals = await Meal.find({ userId: req.userId }).sort({
      date: -1,
    });

    res.json(meals);
  } catch (err) {
    console.error("Fetch meals error:", err);
    res.status(500).json({ message: "Failed to fetch meals" });
  }
});

// ✅ POST /api/meals → add a new meal
router.post("/", async (req, res) => {
  try {
    const { name, calories } = req.body;

    if (!name || calories == null) {
      return res
        .status(400)
        .json({ message: "Meal name and calories are required" });
    }

    const meal = await Meal.create({
      userId: req.userId,
      name,
      calories,
    });

    res.status(201).json(meal);
  } catch (err) {
    console.error("Create meal error:", err);
    res.status(500).json({ message: "Failed to create meal" });
  }
});

module.exports = router;
