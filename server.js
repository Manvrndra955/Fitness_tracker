const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();

// ✅ FIRST create the app
const app = express();

// Configure view engine to render HTML files using EJS
app.engine("html", require("ejs").renderFile);
app.set("view engine", "html");
app.set("views", path.join(__dirname, "public"));

// ✅ THEN use middleware
app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, "public")));

// Routes
const authRoutes = require("./routes/authRouths");
const activityRoutes = require("./routes/activityRoutes");
const workoutRoutes = require("./routes/workout");
const mealRoutes = require("./routes/mealRouths");
const nutritionRoutes = require("./routes/nutritionRoutes");
const userRoutes = require("./routes/userRoutes");
const waterRoutes = require("./routes/waterRoutes");
const planRoutes = require("./routes/planRoutes");
const progressRoutes = require("./routes/progressRoutes");


app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);      
app.use("/api/activities", activityRoutes);
app.use("/api/workouts", workoutRoutes);
app.use("/api/meals", mealRoutes);
app.use("/api/nutrition", nutritionRoutes);
app.use("/api/water", waterRoutes);     
app.use("/api/plans", planRoutes);
app.use("/api/progress", progressRoutes);



// Test route
app.get("/", (req, res) => {
  res.render("fitness_landing");
});

app.get("/index.html", (req, res) => {
  res.redirect("/");
});

// MongoDB & server start
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB Connected");
    app.listen(PORT, () =>
      console.log(`🚀 Server running on http://localhost:${PORT}`)
    );
  })
  .catch((err) => console.error("❌ MongoDB Error:", err));
