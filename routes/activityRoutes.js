// routes/activityRoutes.js
const express = require("express");
const Activity = require("../models/Activity");
const auth = require("../middleware/authMiddleware");

const router = express.Router();

// All routes below require authentication
router.use(auth);

// POST /api/activities  → Add activity for logged-in user
router.post("/", async (req, res) => {
  try {
    const { type, duration, calories, date } = req.body;

    if (!type || duration == null) {
      return res
        .status(400)
        .json({ message: "Type and duration are required" });
    }

    const activity = await Activity.create({
      userId: req.userId,
      type,
      duration,
      calories: calories || 0,
      date: date || Date.now(),
    });

    res.status(201).json(activity);
  } catch (err) {
    console.error("Error adding activity:", err);
    res.status(500).json({ message: "Failed to add activity" });
  }
});

// GET /api/activities  → Get activities for logged-in user (filtered to today by default)
router.get("/", async (req, res) => {
  try {
    const { all } = req.query;
    let query = { userId: req.userId };

    if (all !== "true") {
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      query.date = { $gte: startOfToday };
    }

    const activities = await Activity.find(query).sort({
      date: -1,
    });
    res.json(activities);
  } catch (err) {
    console.error("Error fetching activities:", err);
    res.status(500).json({ message: "Failed to fetch activities" });
  }
});

// PUT /api/activities/:id/complete  → Mark activity as completed
router.put("/:id/complete", async (req, res) => {
  try {
    const activity = await Activity.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { completed: true },
      { new: true }
    );
    if (!activity) {
      return res.status(404).json({ message: "Activity not found" });
    }
    res.json(activity);
  } catch (err) {
    console.error("Error completing activity:", err);
    res.status(500).json({ message: "Failed to complete activity" });
  }
});

// POST /api/activities/clear-today  → Clear all today's activity logs for user
router.post("/clear-today", async (req, res) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    await Activity.deleteMany({
      userId: req.userId,
      date: { $gte: startOfToday }
    });

    res.json({ message: "Today's activity logs cleared successfully" });
  } catch (err) {
    console.error("Error clearing activities:", err);
    res.status(500).json({ message: "Failed to clear today's activities" });
  }
});

module.exports = router;
