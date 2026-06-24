// routes/workoutRoutes.js
const express = require("express");
const Activity = require("../models/Activity");
const auth = require("../middleware/authMiddleware");

const router = express.Router();

// All routes are protected
router.use(auth);

// ✅ GET /api/workouts → get all workouts for logged-in user
router.get("/", async (req, res) => {
  try {
    const workouts = await Activity.find({ userId: req.userId }).sort({
      date: -1,
    });

    res.json(workouts);
  } catch (err) {
    console.error("Fetch workouts error:", err);
    res.status(500).json({ message: "Failed to fetch workouts" });
  }
});

// ✅ POST /api/workouts → add new workout (accumulate same-day activities of same type)
router.post("/", async (req, res) => {
  try {
    const { type, duration, calories } = req.body;

    if (!type || duration == null) {
      return res
        .status(400)
        .json({ message: "Type and duration are required" });
    }

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    let workout = await Activity.findOne({
      userId: req.userId,
      type: { $regex: new RegExp(`^${type}$`, "i") },
      date: { $gte: startOfToday }
    });

    if (workout) {
      workout.duration += Number(duration);
      workout.calories += Number(calories || 0);
      workout = await workout.save();
      res.status(200).json(workout);
    } else {
      workout = await Activity.create({
        userId: req.userId,
        type,
        duration,
        calories: calories || 0,
        completed: false
      });
      res.status(201).json(workout);
    }
  } catch (err) {
    console.error("Create workout error:", err);
    res.status(500).json({ message: "Failed to create workout" });
  }
});

module.exports = router;
