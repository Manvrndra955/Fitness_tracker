// routes/nutritionRoutes.js
const express = require("express");
const router = express.Router();

// GET /api/nutrition?food=apple
router.get("/", async (req, res) => {
  try {
    const food = req.query.food;
    const apiKey = process.env.NUTRITION_API_KEY;

    if (!food) {
      return res.status(400).json({ message: "Food query is required" });
    }

    if (!apiKey) {
      console.error("❌ NUTRITION_API_KEY is not set in environment variables");
      return res.status(500).json({
        message: "Nutrition API key is not configured on the server. Please add NUTRITION_API_KEY in Vercel project Environment Variables.",
      });
    }

    const url = `https://api.api-ninjas.com/v1/nutrition?query=${encodeURIComponent(
      food
    )}`;

    // In Node 18+ (you have v22), fetch is built-in
    const response = await fetch(url, {
      headers: {
        "X-Api-Key": apiKey,
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
