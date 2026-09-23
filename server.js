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

// Ensure DB connection before handling API requests
let dbConnectingPromise = null;
const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI environment variable is not defined on the server!");
  }
  if (!dbConnectingPromise) {
    dbConnectingPromise = mongoose.connect(process.env.MONGO_URI).then(() => {
      console.log("✅ MongoDB Connected");
    }).catch((err) => {
      dbConnectingPromise = null;
      throw err;
    });
  }
  await dbConnectingPromise;
};

app.use(async (req, res, next) => {
  if (req.path.startsWith("/api")) {
    try {
      await connectDB();
    } catch (err) {
      console.error("❌ Database connection error:", err.message);
      return res.status(500).json({
        message: `Database connection failed: ${err.message}. Please check MONGO_URI in server environment variables and MongoDB Atlas IP access rules.`,
      });
    }
  }
  next();
});

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
const chatRoutes = require("./routes/chatRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);      
app.use("/api/activities", activityRoutes);
app.use("/api/workouts", workoutRoutes);
app.use("/api/meals", mealRoutes);
app.use("/api/nutrition", nutritionRoutes);
app.use("/api/water", waterRoutes);     
app.use("/api/plans", planRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/chat", chatRoutes);

// Test route
app.get("/", (req, res) => {
  res.render("fitness_landing");
});

app.get("/index.html", (req, res) => {
  res.redirect("/");
});

// Start local server if not running on serverless
const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== "production") {
  connectDB()
    .then(() => {
      app.listen(PORT, () =>
        console.log(`🚀 Server running on http://localhost:${PORT}`)
      );
    })
    .catch((err) => console.error("❌ MongoDB Error:", err));
}

module.exports = app;
