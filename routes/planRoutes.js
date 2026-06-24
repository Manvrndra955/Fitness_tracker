// routes/planRoutes.js
const express = require("express");
const auth = require("../middleware/authMiddleware");
const router = express.Router();

// Simple static templates. You can tweak later.
const WORKOUT_PLANS = {
  weight_loss: [
    { day: "Day 1", focus: "Full-body HIIT", details: "20 min HIIT + 20 min brisk walk" },
    { day: "Day 2", focus: "Lower body", details: "Squats, lunges, glute bridges, step-ups" },
    { day: "Day 3", focus: "Active rest", details: "30–40 min light walk or cycling" },
    { day: "Day 4", focus: "Upper body", details: "Push-ups, dumbbell rows, shoulder presses" },
    { day: "Day 5", focus: "Core & cardio", details: "Planks, mountain climbers, Russian twists" },
    { day: "Day 6", focus: "Full-body strength", details: "Compound movements, 3 sets each" },
    { day: "Day 7", focus: "Rest / mobility", details: "Stretching + foam rolling" },
  ],
  muscle_gain: [
    { day: "Day 1", focus: "Chest & Triceps", details: "Bench press, push-ups, dips, tricep extensions" },
    { day: "Day 2", focus: "Back & Biceps", details: "Pull-ups, rows, curls" },
    { day: "Day 3", focus: "Legs", details: "Squats, lunges, deadlifts, calf raises" },
    { day: "Day 4", focus: "Rest / light cardio", details: "20–30 min light walk" },
    { day: "Day 5", focus: "Shoulders & Core", details: "Shoulder press, lateral raises, planks" },
    { day: "Day 6", focus: "Full upper body", details: "Compound lifts, 3–4 sets" },
    { day: "Day 7", focus: "Rest", details: "Complete rest" },
  ],
  endurance: [
    { day: "Day 1", focus: "Moderate run", details: "25–30 min at easy pace" },
    { day: "Day 2", focus: "Cross-train", details: "Cycling / swimming 30–40 min" },
    { day: "Day 3", focus: "Intervals", details: "5×2 min fast, 2 min easy" },
    { day: "Day 4", focus: "Active rest", details: "Light walk + stretching" },
    { day: "Day 5", focus: "Tempo run", details: "20 min slightly faster than easy pace" },
    { day: "Day 6", focus: "Long run", details: "40–60 min at comfortable pace" },
    { day: "Day 7", focus: "Rest", details: "Full rest or very easy walk" },
  ],
};

const MEAL_PLANS = {
  vegetarian: [
    { meal: "Breakfast", name: "Oats with fruits & nuts", calories: 350 },
    { meal: "Snack", name: "Greek yogurt + berries", calories: 150 },
    { meal: "Lunch", name: "Dal, brown rice, salad", calories: 500 },
    { meal: "Snack", name: "Roasted chana / nuts", calories: 150 },
    { meal: "Dinner", name: "Paneer + veggies + roti", calories: 450 },
  ],
  keto: [
    { meal: "Breakfast", name: "Scrambled eggs + avocado", calories: 400 },
    { meal: "Snack", name: "Nuts mix", calories: 200 },
    { meal: "Lunch", name: "Grilled chicken + salad", calories: 450 },
    { meal: "Snack", name: "Cheese cubes", calories: 150 },
    { meal: "Dinner", name: "Fish + sautéed veggies", calories: 450 },
  ],
  high_protein: [
    { meal: "Breakfast", name: "Protein shake + banana", calories: 350 },
    { meal: "Snack", name: "Boiled eggs", calories: 150 },
    { meal: "Lunch", name: "Chicken + quinoa + veggies", calories: 550 },
    { meal: "Snack", name: "Paneer cubes / tofu", calories: 200 },
    { meal: "Dinner", name: "Lentil soup + salad", calories: 400 },
  ],
};

// GET /api/plans/workouts?goal=weight_loss
router.get("/workouts", auth, (req, res) => {
  const goal = (req.query.goal || "weight_loss").toLowerCase();
  const key =
    goal === "muscle_gain" || goal === "endurance" ? goal : "weight_loss";

  res.json({
    goal: key,
    plan: WORKOUT_PLANS[key],
  });
});

// GET /api/plans/meals?diet=vegetarian
router.get("/meals", auth, (req, res) => {
  const diet = (req.query.diet || "vegetarian").toLowerCase();
  let key = "vegetarian";

  if (diet === "keto") key = "keto";
  else if (diet === "high_protein" || diet === "high-protein") key = "high_protein";

  const meals = MEAL_PLANS[key] || MEAL_PLANS.vegetarian;
  const totalCalories = meals.reduce((sum, m) => sum + (m.calories || 0), 0);

  res.json({
    diet: key,
    meals,
    totalCalories,
  });
});

module.exports = router;
