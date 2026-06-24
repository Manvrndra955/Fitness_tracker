// routes/nutritionRoutes.js
const express = require("express");
const router = express.Router();

const NUTRITION_API_KEY = process.env.NUTRITION_API_KEY;

// GET /api/nutrition?food=apple
router.get("/", async (req, res) => {
  try {
    const food = req.query.food;

    if (!food) {
      return res.status(400).json({ message: "Food query is required" });
    }

    if (!NUTRITION_API_KEY) {
      console.error("❌ NUTRITION_API_KEY is not set in .env");
      return res
        .status(500)
        .json({ message: "Nutrition API key not configured on server" });
    }

    const url = `https://api.api-ninjas.com/v1/nutrition?query=${encodeURIComponent(
      food
    )}`;

    // In Node 18+ (you have v22), fetch is built-in
    const response = await fetch(url, {
      headers: {
        "X-Api-Key": NUTRITION_API_KEY,
      },
    });

    const text = await response.text();

    console.log("Nutrition API status:", response.status);
    console.log("Nutrition API raw body:", text);

    if (!response.ok) {
      return res.status(500).json({
        message:
          "Server error fetching nutrition data (external API error).",
        status: response.status,
      });
    }

    const data = JSON.parse(text);
    return res.json(data);
  } catch (err) {
    console.error("Nutrition API error:", err);
    return res
      .status(500)
      .json({ message: "Server error fetching nutrition data" });
  }
});

module.exports = router;
