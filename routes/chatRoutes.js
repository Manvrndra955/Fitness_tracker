// routes/chatRoutes.js
const express = require("express");
const ChatMessage = require("../models/ChatMessage");
const auth = require("../middleware/authMiddleware");

const router = express.Router();
router.use(auth);

// GET /api/chat/history -> Fetch user's chat history
router.get("/history", async (req, res) => {
  try {
    const history = await ChatMessage.find({ userId: req.userId })
      .sort({ createdAt: 1 })
      .limit(50);
    res.json(history);
  } catch (err) {
    console.error("Fetch chat history error:", err);
    res.status(500).json({ message: "Failed to fetch chat history" });
  }
});

// POST /api/chat/send -> Process message and get AI response
router.post("/send", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ message: "Message is required" });
    }

    const cleanMsg = message.trim();

    // 1. Save user message
    await ChatMessage.create({
      userId: req.userId,
      sender: "user",
      message: cleanMsg,
    });

    let replyText = "";

    // 2. Try Google Gemini API if key exists
    if (process.env.GEMINI_API_KEY) {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
        const response = await fetch(geminiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [
                  {
                    text: `You are FitTrack AI, an expert, encouraging, and highly detailed personal fitness and nutrition coach. Provide clear, structured, actionable, and reasonable guidance with bold headers, bullet points, and key tips where applicable. Keep your answer engaging, well-formatted, and informative. User query: ${cleanMsg}`,
                  },
                ],
              },
            ],
          }),
        });

        const data = await response.json();
        if (
          data.candidates &&
          data.candidates[0] &&
          data.candidates[0].content &&
          data.candidates[0].content.parts &&
          data.candidates[0].content.parts[0]
        ) {
          replyText = data.candidates[0].content.parts[0].text;
        } else if (data.error && data.error.message) {
          console.warn("Gemini API error notice:", data.error.message);
        }
      } catch (geminiErr) {
        console.error("Gemini fetch error:", geminiErr);
      }
    }

    // 3. Fallback to OpenAI if OPENAI_API_KEY exists and Gemini didn't produce text
    if (!replyText && process.env.OPENAI_API_KEY) {
      try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: [
              { role: "system", content: "You are FitTrack AI, an expert fitness & nutrition coach. Provide structured, detailed, and reasonable advice with bullet points." },
              { role: "user", content: cleanMsg },
            ],
          }),
        });
        const data = await response.json();
        replyText = data.choices?.[0]?.message?.content;
      } catch (openAiErr) {
        console.error("OpenAI fetch error:", openAiErr);
      }
    }

    // 4. Rich, detailed rule-based fallback if AI key response fails
    if (!replyText) {
      const q = cleanMsg.toLowerCase();
      if (q.includes("weight loss") || q.includes("fat loss") || q.includes("lose weight")) {
        replyText = `### 🏋️ Complete Weight Loss & Fat Burn Strategy\n\n* **Caloric Deficit**: Consume 300–500 kcal below your Maintenance Calorie level daily.\n* **High Protein Intake**: Target 1.6g–2.0g protein per kg of body weight to preserve muscle.\n* **Combined Training**: Perform 3–4 days of resistance/strength training + 20-30m moderate cardio.\n* **Hydration**: Drink 2.5–3.5 liters of water daily to enhance metabolism and control appetite.\n* **Consistency**: Log your daily workouts and meals on your FitTrack dashboard to track progress!`;
      } else if (q.includes("muscle") || q.includes("protein") || q.includes("gain") || q.includes("bulk")) {
        replyText = `### 💪 Muscle Building & Hypertrophy Guide\n\n* **Progressive Overload**: Increase weights, reps, or control tempo every 1–2 weeks.\n* **Protein Target**: Eat 1.8g–2.2g of protein per kg of bodyweight (e.g. eggs, chicken, paneer, whey).\n* **Caloric Surplus**: Maintain a slight surplus of +250 to +400 kcal per day for optimal growth.\n* **Rest & Recovery**: Get 7–8 hours of quality sleep for muscle recovery and hormone synthesis.\n* **Tracking**: Use FitTrack's workout logging tool to log your sets and progression!`;
      } else if (q.includes("water") || q.includes("hydrate") || q.includes("drink")) {
        replyText = `### 💧 Optimal Hydration & Performance Guide\n\n* **Daily Target**: Aim for 8–10 glasses (2.5–3 Liters) of water per day.\n* **Pre-Workout**: Drink 500ml of water 1–2 hours before training.\n* **During Workout**: Take small sips every 15 minutes to prevent endurance drop.\n* **Benefits**: Hydration keeps joints lubricated, prevents muscle cramps, and accelerates fat metabolism!\n* **Tip**: Use the Water Tracker card on your dashboard to log each glass!`;
      } else if (q.includes("hello") || q.includes("hi") || q.includes("hey")) {
        replyText = "Hello! 👋 I'm your **FitTrack AI Coach**! How can I assist you with your fitness, nutrition, or workout goals today? Feel free to ask anything!";
      } else {
        replyText = `### ⚡ FitTrack Personal Coaching Advice\n\nRegarding **"${cleanMsg}"**:\n\n* **Consistency is Key**: Great fitness results come from daily small efforts logged continuously.\n* **Balance Nutrition**: Combine complex carbs, lean protein, and healthy fats in every meal.\n* **Stay Active**: Aim for at least 30 minutes of intentional training or activity daily.\n* **Track Everything**: Keep your workout logs and nutrition entries updated on your dashboard to see your progress chart grow! 💪`;
      }
    }

    // Save bot reply
    const botMessage = await ChatMessage.create({
      userId: req.userId,
      sender: "bot",
      message: replyText,
    });

    res.json(botMessage);
  } catch (err) {
    console.error("Chat send error:", err);
    res.status(500).json({ message: "Error processing chat message" });
  }
});

module.exports = router;
