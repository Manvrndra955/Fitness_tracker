// routes/waterRoutes.js
const express = require("express");
const auth = require("../middleware/authMiddleware");
const WaterLog = require("../models/WaterLog");

const router = express.Router();

const DAILY_GOAL_GLASSES = 8;

// helper: today's start/end
function getTodayRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

// GET /api/water/today  → today's glasses for logged-in user
router.get("/today", auth, async (req, res) => {
  try {
    const { start, end } = getTodayRange();

    const log = await WaterLog.findOne({
      userId: req.userId,
      date: { $gte: start, $lte: end },
    });

    res.json({
      glasses: log ? log.glasses : 0,
      goal: DAILY_GOAL_GLASSES,
    });
  } catch (err) {
    console.error("Water today error:", err);
    res.status(500).json({ message: "Failed to fetch water data" });
  }
});

// POST /api/water/add  → add 1 glass (or custom) for today
router.post("/add", auth, async (req, res) => {
  try {
    const increment = Number(req.body.increment) || 1;
    const { start, end } = getTodayRange();

    const log = await WaterLog.findOneAndUpdate(
      {
        userId: req.userId,
        date: { $gte: start, $lte: end },
      },
      {
        $setOnInsert: { userId: req.userId, date: new Date() },
        $inc: { glasses: increment },
      },
      { new: true, upsert: true }
    );

    res.json({
      message: "Water updated",
      glasses: log.glasses,
      goal: DAILY_GOAL_GLASSES,
    });
  } catch (err) {
    console.error("Water add error:", err);
    res.status(500).json({ message: "Failed to update water" });
  }
});

// ⭐ NEW: POST /api/water/reset → reset today's glasses to 0
router.post("/reset", auth, async (req, res) => {
  try {
    const { start, end } = getTodayRange();

    const log = await WaterLog.findOneAndUpdate(
      {
        userId: req.userId,
        date: { $gte: start, $lte: end },
      },
      {
        $setOnInsert: { userId: req.userId, date: new Date() },
        $set: { glasses: 0 },
      },
      { new: true, upsert: true }
    );

    res.json({
      message: "Water reset for today",
      glasses: log.glasses,
      goal: DAILY_GOAL_GLASSES,
    });
  } catch (err) {
    console.error("Water reset error:", err);
    res.status(500).json({ message: "Failed to reset water" });
  }
});

module.exports = router;
