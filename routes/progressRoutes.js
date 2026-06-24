// routes/progressRoutes.js
const express = require("express");
const auth = require("../middleware/authMiddleware");
const WeightEntry = require("../models/WeightEntry");
const Activity = require("../models/Activity");

const router = express.Router();

// helper: last N days dates array
function getLastNDates(n) {
  const days = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    days.push(d);
  }
  return days;
}

// POST /api/progress/weight  { weightKg }
router.post("/weight", auth, async (req, res) => {
  try {
    const weightKg = Number(req.body.weightKg);
    if (!weightKg) {
      return res.status(400).json({ message: "weightKg is required" });
    }

    const entry = await WeightEntry.create({
      userId: req.userId,
      date: new Date(),
      weightKg,
    });

    res.status(201).json(entry);
  } catch (err) {
    console.error("Weight log error:", err);
    res.status(500).json({ message: "Failed to log weight" });
  }
});

// GET /api/progress/weight?days=7
router.get("/weight", auth, async (req, res) => {
  try {
    const days = Number(req.query.days) || 7;
    const dates = getLastNDates(days);

    const start = new Date(dates[0]);
    const end = new Date(dates[dates.length - 1]);
    end.setHours(23, 59, 59, 999);

    const entries = await WeightEntry.find({
      userId: req.userId,
      date: { $gte: start, $lte: end },
    }).sort({ date: 1 });

    const dataMap = {};
    entries.forEach((e) => {
      const key = e.date.toISOString().slice(0, 10);
      dataMap[key] = e.weightKg;
    });

    const labels = dates.map((d) => d.toISOString().slice(0, 10));
    const data = labels.map((label) => dataMap[label] ?? null);

    res.json({ labels, data });
  } catch (err) {
    console.error("Weight progress error:", err);
    res.status(500).json({ message: "Failed to fetch weight progress" });
  }
});

// GET /api/progress/activity?days=7
// returns calories+minutes per day based on Activity collection
router.get("/activity", auth, async (req, res) => {
  try {
    const days = Number(req.query.days) || 7;
    const dates = getLastNDates(days);

    const start = new Date(dates[0]);
    const end = new Date(dates[dates.length - 1]);
    end.setHours(23, 59, 59, 999);

    const activities = await Activity.find({
      userId: req.userId,
      date: { $gte: start, $lte: end },
    });

    const map = {};
    dates.forEach((d) => {
      const key = d.toISOString().slice(0, 10);
      map[key] = { calories: 0, minutes: 0 };
    });

    activities.forEach((a) => {
      const key = a.date.toISOString().slice(0, 10);
      if (!map[key]) map[key] = { calories: 0, minutes: 0 };
      map[key].calories += a.calories || 0;
      map[key].minutes += a.duration || 0;
    });

    const labels = dates.map((d) => d.toISOString().slice(0, 10));
    const calories = labels.map((l) => map[l].calories);
    const minutes = labels.map((l) => map[l].minutes);

    res.json({ labels, calories, minutes });
  } catch (err) {
    console.error("Activity progress error:", err);
    res.status(500).json({ message: "Failed to fetch activity progress" });
  }
});

module.exports = router;
