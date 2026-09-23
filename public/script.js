// Base URL of your backend API
const API_URL = "/api";

/* ===========================
   HELPER: GET STORED AUTH DATA
   =========================== */
function getStoredToken() {
  return localStorage.getItem("token");
}

function getStoredUser() {
  const raw = localStorage.getItem("user");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/* ===========================
   REGISTER USER (fitness.html)
   =========================== */
async function registerUser() {
  const nameInput = document.getElementById("name");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const errorEl = document.getElementById("error");

  if (!nameInput || !emailInput || !passwordInput) {
    console.error("Registration inputs not found on this page.");
    return;
  }

  const name = nameInput.value.trim();
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (errorEl) {
    errorEl.style.color = "#fecaca"; // red
    errorEl.textContent = "";
  }

  if (!name || !email || !password) {
    if (errorEl) errorEl.textContent = "Please fill in all fields.";
    return;
  }

  if (!email.endsWith("@gmail.com") && !email.endsWith("@gla.ac.in")) {
    if (errorEl) errorEl.textContent = "Use @gmail.com or @gla.ac.in email.";
    return;
  }

  if (password.length < 6) {
    if (errorEl) errorEl.textContent = "Password must be at least 6 characters.";
    return;
  }

  try {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json();
    console.log("Register response:", data);

    if (!res.ok) {
      if (errorEl) errorEl.textContent = data.message || "Registration failed.";
      return;
    }

    if (errorEl) {
      errorEl.style.color = "#4ade80";
      errorEl.textContent = data.message || "Registered successfully!";
    }

    if (data.token && data.user) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
    }

    nameInput.value = "";
    emailInput.value = "";
    passwordInput.value = "";

    setTimeout(() => {
      window.location.href = "dashboard.html";
    }, 800);
  } catch (err) {
    console.error("Register error:", err);
    if (errorEl) errorEl.textContent = "Could not connect to server. Try again.";
  }
}

/* =======================
   LOGIN USER (login.html)
   ======================= */
async function loginUser() {
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const errorEl = document.getElementById("error");

  if (!emailInput || !passwordInput) {
    console.error("Login inputs not found on this page.");
    return;
  }

  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (errorEl) errorEl.textContent = "";

  if (!email || !password) {
    if (errorEl) errorEl.textContent = "Please enter email and password.";
    else alert("Please enter email and password.");
    return;
  }

  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    console.log("Login response:", data);

    if (!res.ok) {
      if (errorEl) errorEl.textContent = data.message || "Login failed.";
      else alert(data.message || "Login failed.");
      return;
    }

    if (data.token && data.user) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
    }

    window.location.href = "dashboard.html";
  } catch (err) {
    console.error("Login error:", err);
    if (errorEl) errorEl.textContent = "Could not connect to server. Try again.";
    else alert("Could not connect to server. Try again.");
  }
}

/* ===========================
   DASHBOARD SETUP (dashboard)
   =========================== */
function setupDashboard() {
  const user = getStoredUser();
  const token = getStoredToken();
  const userNameSpan = document.getElementById("user-name");

  // If we're on dashboard and not logged in → redirect
  if (userNameSpan && !token) {
    window.location.href = "login.html";
    return;
  }

  document.body.style.opacity = "1";

  if (userNameSpan && user && user.name) {
    userNameSpan.textContent = user.name;
  }

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "login.html";
    });
  }
}

/* ===========================
   PROFILE + BMI
   =========================== */
function calculateBMI(heightCm, weightKg) {
  if (!heightCm || !weightKg) return { bmi: null, category: "—" };

  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);

  let category = "";
  if (bmi < 18.5) category = "Underweight";
  else if (bmi < 25) category = "Normal";
  else if (bmi < 30) category = "Overweight";
  else category = "Obese";

  return { bmi: Number(bmi.toFixed(1)), category };
}

function estimateCalories(heightCm, weightKg, age, gender, activityLevel) {
  if (!heightCm || !weightKg || !age || !gender) return null;

  // Mifflin-St Jeor
  let bmr;
  if (gender === "male") {
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
  } else {
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
  }

  const factors = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
  };

  const factor = factors[activityLevel] || 1.2;
  return Math.round(bmr * factor);
}

async function loadProfile() {
  const token = getStoredToken();
  const nameEl = document.getElementById("profile-name");
  const ageEl = document.getElementById("profile-age");
  const heightEl = document.getElementById("profile-height");
  const weightEl = document.getElementById("profile-weight");
  const genderEl = document.getElementById("profile-gender");
  const activityEl = document.getElementById("profile-activity");

  if (!token || !nameEl) return; // not on this page

  try {
    const res = await fetch(`${API_URL}/users/profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const user = await res.json();
    console.log("Profile loaded:", user);

    if (!res.ok) {
      console.warn("Failed to load profile:", user.message);
      return;
    }

    if (user.name) nameEl.value = user.name;
    if (user.age != null) ageEl.value = user.age;
    if (user.heightCm != null) heightEl.value = user.heightCm;
    if (user.weightKg != null) weightEl.value = user.weightKg;
    if (user.gender) genderEl.value = user.gender;
    if (user.activityLevel) activityEl.value = user.activityLevel;

    updateBMIAndCalories();
  } catch (err) {
    console.error("Load profile error:", err);
  }
}

async function saveProfile(e) {
  e.preventDefault();

  const token = getStoredToken();
  const msgEl = document.getElementById("profile-message");
  if (!token || !msgEl) return;

  const name = document.getElementById("profile-name").value.trim();
  const age = Number(document.getElementById("profile-age").value) || null;
  const heightCm =
    Number(document.getElementById("profile-height").value) || null;
  const weightKg =
    Number(document.getElementById("profile-weight").value) || null;
  const gender = document.getElementById("profile-gender").value;
  const activityLevel = document.getElementById("profile-activity").value;

  msgEl.textContent = "Saving...";

  try {
    const res = await fetch(`${API_URL}/users/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name,
        age,
        heightCm,
        weightKg,
        gender,
        activityLevel,
      }),
    });

    const data = await res.json();
    console.log("Profile save response:", data);

    if (!res.ok) {
      msgEl.textContent = data.message || "Failed to update profile.";
      return;
    }

    msgEl.textContent = "Profile updated ✔";
    // update stored user name if changed
    if (data.user && data.user.name) {
      const stored = getStoredUser() || {};
      stored.name = data.user.name;
      localStorage.setItem("user", JSON.stringify(stored));

      const userNameSpan = document.getElementById("user-name");
      if (userNameSpan) userNameSpan.textContent = data.user.name;
    }

    updateBMIAndCalories();
  } catch (err) {
    console.error("Save profile error:", err);
    msgEl.textContent = "Error saving profile.";
  }
}

function updateBMIAndCalories() {
  const heightCm = Number(document.getElementById("profile-height")?.value);
  const weightKg = Number(document.getElementById("profile-weight")?.value);
  const age = Number(document.getElementById("profile-age")?.value);
  const gender = document.getElementById("profile-gender")?.value;
  const activityLevel = document.getElementById("profile-activity")?.value;
  const name = document.getElementById("profile-name")?.value;

  const bmiSpan = document.getElementById("bmi-value");
  const bmiCatSpan = document.getElementById("bmi-category");
  const calSpan = document.getElementById("calorie-estimate");
  const bmiTag = document.getElementById("bmi-tag");

  const { bmi, category } = calculateBMI(heightCm, weightKg);
  const calories = estimateCalories(
    heightCm,
    weightKg,
    age,
    gender,
    activityLevel
  );

  if (bmiSpan) bmiSpan.textContent = bmi ?? "—";
  if (bmiCatSpan) bmiCatSpan.textContent = category;
  if (calSpan) calSpan.textContent = calories ?? "—";
  if (bmiTag) bmiTag.textContent = bmi ? `${bmi} (${category})` : "—";

  // Profile progress tracking
  let filledFields = 0;
  let totalFields = 6;
  if (name) filledFields++;
  if (age) filledFields++;
  if (heightCm) filledFields++;
  if (weightKg) filledFields++;
  if (gender) filledFields++;
  if (activityLevel) filledFields++;

  const pct = Math.round((filledFields / totalFields) * 100);
  const progressText = document.getElementById("profile-progress-percent");
  const progressFill = document.getElementById("profile-progress-fill");
  if (progressText) progressText.textContent = `${pct}%`;
  if (progressFill) progressFill.style.width = `${pct}%`;
}

/* ===========================
   WORKOUT PLAN
   =========================== */
async function loadWorkoutPlan() {
  const token = getStoredToken();
  const goalSelect = document.getElementById("goal-select");
  const listEl = document.getElementById("workout-plan-list");
  if (!goalSelect || !listEl || !token) return;

  listEl.innerHTML = "<li>Loading...</li>";

  const goal = goalSelect.value || "weight_loss";

  try {
    const res = await fetch(`${API_URL}/plans/workouts?goal=${goal}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    console.log("Workout plan:", data);

    if (!res.ok) {
      listEl.innerHTML = `<li>${data.message || "Failed to load plan."}</li>`;
      return;
    }

    if (!data.plan || data.plan.length === 0) {
      listEl.innerHTML = "<li>No plan available.</li>";
      return;
    }

    listEl.innerHTML = data.plan
      .map(
        (d) =>
          `<li><strong>${d.day} – ${d.focus}:</strong> ${d.details}</li>`
      )
      .join("");
  } catch (err) {
    console.error("Workout plan error:", err);
    listEl.innerHTML = "<li>Error loading plan.</li>";
  }
}


/* ===========================
   MEAL PLANNER
   =========================== */
async function loadMealPlan() {
  const token = getStoredToken();
  const dietSelect = document.getElementById("diet-select");
  const listEl = document.getElementById("meal-plan-list");
  const totalEl = document.getElementById("meal-plan-total");
  if (!dietSelect || !listEl || !token) return;

  listEl.innerHTML = "<li>Loading...</li>";
  if (totalEl) totalEl.textContent = "";

  const diet = dietSelect.value || "vegetarian";

  try {
    const res = await fetch(`${API_URL}/plans/meals?diet=${diet}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    console.log("Meal plan:", data);

    if (!res.ok) {
      listEl.innerHTML = `<li>${data.message || "Failed to load meals."}</li>`;
      return;
    }

    if (!data.meals || data.meals.length === 0) {
      listEl.innerHTML = "<li>No meals available.</li>";
      return;
    }

    listEl.innerHTML = data.meals
      .map(
        (m) =>
          `<li><strong>${m.meal}:</strong> ${m.name} – ${m.calories || "—"} kcal</li>`
      )
      .join("");

    if (totalEl) {
      totalEl.textContent = `Approx. daily calories: ${
        data.totalCalories ?? "—"
      } kcal`;
    }
  } catch (err) {
    console.error("Meal plan error:", err);
    listEl.innerHTML = "<li>Error loading meals.</li>";
  }
}


/* ===========================
   PROGRESS CHARTS (Chart.js)
   =========================== */
let weightChartInstance;
let caloriesChartInstance;
let minutesChartInstance;

async function loadProgressCharts() {
  const token = getStoredToken();
  const weightCanvas = document.getElementById("weightChart");
  const caloriesCanvas = document.getElementById("caloriesChart");
  const minutesCanvas = document.getElementById("minutesChart");

  if (!token || !weightCanvas || !caloriesCanvas || !minutesCanvas) return;

  try {
    const [weightRes, activityRes] = await Promise.all([
      fetch(`${API_URL}/progress/weight?days=7`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
      fetch(`${API_URL}/progress/activity?days=7`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ]);

    const weightData = await weightRes.json();
    const activityData = await activityRes.json();

    console.log("Weight progress:", weightData);
    console.log("Activity progress:", activityData);

    // Destroy old charts if exist
    if (weightChartInstance) weightChartInstance.destroy();
    if (caloriesChartInstance) caloriesChartInstance.destroy();
    if (minutesChartInstance) minutesChartInstance.destroy();

    // Weight chart
    weightChartInstance = new Chart(weightCanvas.getContext("2d"), {
      type: "line",
      data: {
        labels: weightData.labels || [],
        datasets: [
          {
            label: "Weight (kg)",
            data: weightData.data || [],
            borderColor: "#6366f1",
            backgroundColor: "rgba(99, 102, 241, 0.1)",
            fill: true,
            tension: 0.4,
            borderWidth: 3,
            pointBackgroundColor: "#ffffff",
            pointHoverRadius: 7,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
        },
        scales: {
          x: {
            grid: { color: "rgba(255, 255, 255, 0.05)" },
            ticks: { color: "#9ca3af" }
          },
          y: {
            beginAtZero: false,
            grid: { color: "rgba(255, 255, 255, 0.05)" },
            ticks: { color: "#9ca3af" }
          },
        },
      },
    });

    // Calories chart
    caloriesChartInstance = new Chart(caloriesCanvas.getContext("2d"), {
      type: "bar",
      data: {
        labels: activityData.labels || [],
        datasets: [
          {
            label: "Calories",
            data: activityData.calories || [],
            backgroundColor: "rgba(16, 185, 129, 0.85)",
            hoverBackgroundColor: "#10b981",
            borderRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: "#9ca3af" }
          },
          y: {
            beginAtZero: true,
            grid: { color: "rgba(255, 255, 255, 0.05)" },
            ticks: { color: "#9ca3af" }
          },
        },
      },
    });

    // Minutes chart
    minutesChartInstance = new Chart(minutesCanvas.getContext("2d"), {
      type: "bar",
      data: {
        labels: activityData.labels || [],
        datasets: [
          {
            label: "Minutes",
            data: activityData.minutes || [],
            backgroundColor: "rgba(99, 102, 241, 0.85)",
            hoverBackgroundColor: "#6366f1",
            borderRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: "#9ca3af" }
          },
          y: {
            beginAtZero: true,
            grid: { color: "rgba(255, 255, 255, 0.05)" },
            ticks: { color: "#9ca3af" }
          },
        },
      },
    });
  } catch (err) {
    console.error("Progress charts error:", err);
  }
}


/* ===========================
   WATER TRACKER
   =========================== */
async function loadTodayWater() {
  const token = getStoredToken();
  const countEl = document.getElementById("water-count");
  const goalEl = document.getElementById("water-goal");
  const barFill = document.getElementById("water-bar-fill");
  const summaryEl = document.getElementById("water-summary");
  const tagEl = document.getElementById("water-tag");

  if (!token || !countEl || !goalEl) return;

  try {
    const res = await fetch(`${API_URL}/water/today`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await res.json();
    console.log("Water today:", data);

    if (!res.ok) {
      console.warn("Water error:", data.message);
      return;
    }

    const glasses = data.glasses ?? 0;
    const goal = data.goal ?? 8;

    countEl.textContent = glasses;
    goalEl.textContent = goal;
    if (summaryEl) summaryEl.textContent = `${glasses} / ${goal} glasses`;
    if (tagEl) tagEl.textContent = `${glasses} / ${goal} glasses`;
    if (barFill) {
      const pct = Math.min(100, (glasses / goal) * 100);
      barFill.style.width = `${pct}%`;
    }
  } catch (err) {
    console.error("Load water error:", err);
  }
}

async function addWaterGlasses(increment = 1) {
  const token = getStoredToken();
  const msgEl = document.getElementById("water-message");
  if (!token) return;

  if (msgEl) msgEl.textContent = "Updating...";

  try {
    const res = await fetch(`${API_URL}/water/add`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ increment }),
    });

    const data = await res.json();
    console.log("Water add:", data);

    if (!res.ok) {
      if (msgEl) msgEl.textContent = data.message || "Failed to update water.";
      return;
    }

    if (msgEl) msgEl.textContent = "Nice! Keep hydrating 💧";
    await loadTodayWater();
  } catch (err) {
    console.error("Add water error:", err);
    if (msgEl) msgEl.textContent = "Error updating water.";
  }
}

/* ===================================================
   PER-ACTIVITY TIMER & ACTIONS (Start, Remove, Delete)
   =================================================== */
const activeItemTimers = {};

function playChime() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.12);
      gain.gain.setValueAtTime(0.001, ctx.currentTime + i * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + i * 0.12 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.12 + 0.6);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.12);
      osc.stop(ctx.currentTime + i * 0.12 + 0.65);
    });
  } catch (e) {
    console.warn("Audio chime failed:", e);
  }
}

window.toggleActivityTimer = function(id, defaultMins = 15) {
  const timerBadgeEl = document.getElementById(`timer-display-${id}`);
  const startBtnEl = document.getElementById(`start-btn-${id}`);

  if (activeItemTimers[id]) {
    // If running -> pause
    if (activeItemTimers[id].running) {
      clearInterval(activeItemTimers[id].interval);
      activeItemTimers[id].running = false;
      if (startBtnEl) {
        startBtnEl.innerHTML = `<i data-lucide="play" style="width:13px; height:13px;"></i> Resume`;
        startBtnEl.classList.remove("running");
      }
      if (timerBadgeEl) {
        timerBadgeEl.style.color = "#f59e0b";
      }
    } else {
      // If paused -> resume
      activeItemTimers[id].running = true;
      startItemInterval(id);
      if (startBtnEl) {
        startBtnEl.innerHTML = `<i data-lucide="pause" style="width:13px; height:13px;"></i> Pause`;
        startBtnEl.classList.add("running");
      }
      if (timerBadgeEl) {
        timerBadgeEl.style.color = "#4ade80";
      }
    }
  } else {
    // Start fresh timer for this item
    const initialSeconds = Number(defaultMins) * 60;
    activeItemTimers[id] = {
      seconds: initialSeconds > 0 ? initialSeconds : 15 * 60,
      running: true,
      interval: null
    };
    startItemInterval(id);
    if (startBtnEl) {
      startBtnEl.innerHTML = `<i data-lucide="pause" style="width:13px; height:13px;"></i> Pause`;
      startBtnEl.classList.add("running");
    }
    if (timerBadgeEl) {
      timerBadgeEl.classList.remove("hidden");
      timerBadgeEl.style.color = "#4ade80";
    }
  }
  if (typeof lucide !== "undefined") lucide.createIcons();
};

function startItemInterval(id) {
  if (activeItemTimers[id].interval) clearInterval(activeItemTimers[id].interval);
  activeItemTimers[id].interval = setInterval(() => {
    if (!activeItemTimers[id]) return;
    if (activeItemTimers[id].seconds > 0) {
      activeItemTimers[id].seconds--;
      const m = Math.floor(activeItemTimers[id].seconds / 60);
      const s = activeItemTimers[id].seconds % 60;
      const formatted = `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
      
      const timerBadgeEl = document.getElementById(`timer-display-${id}`);
      if (timerBadgeEl) {
        timerBadgeEl.textContent = `⏱️ ${formatted}`;
        timerBadgeEl.classList.remove("hidden");
      }
    } else {
      clearInterval(activeItemTimers[id].interval);
      activeItemTimers[id].running = false;
      const timerBadgeEl = document.getElementById(`timer-display-${id}`);
      if (timerBadgeEl) {
        timerBadgeEl.textContent = `🎉 Goal Achieved!`;
        timerBadgeEl.style.color = "#38bdf8";
      }
      playChime();
      alert(`🎉 Goal Achieved!\n\nCongratulations! You finished your workout goal! 💪`);
      
      // Auto complete when timer finishes
      window.completeActivity(id, true);
    }
  }, 1000);
}

async function loadRecentActivities() {
  const token = getStoredToken();
  const listEl = document.querySelector(".activity-list");
  const badgeEl = document.getElementById("activity-badge");
  const emptyStateEl = document.querySelector(".empty-state");
  const workoutCountEl = document.getElementById("workouts-completed-count");
  const workoutSubTextEl = document.getElementById("workout-sub-text");

  if (!token || !listEl) return;

  try {
    const res = await fetch(`${API_URL}/activities`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const activities = await res.json();
    console.log("Recent activities loaded:", activities);

    if (!res.ok) {
      console.warn("Failed to load activities:", activities.message);
      return;
    }

    if (!activities || activities.length === 0) {
      if (emptyStateEl) emptyStateEl.classList.remove("hidden");
      listEl.innerHTML = "";
      if (badgeEl) badgeEl.textContent = "No data yet";
      if (workoutCountEl) workoutCountEl.textContent = "0";
      if (workoutSubTextEl) workoutSubTextEl.textContent = "No workouts logged this week yet.";
      return;
    }

    if (emptyStateEl) emptyStateEl.classList.add("hidden");
    if (badgeEl) badgeEl.textContent = `${activities.length} logs`;
    
    if (workoutCountEl) workoutCountEl.textContent = activities.length;
    if (workoutSubTextEl) {
      workoutSubTextEl.textContent = `Excellent! You logged ${activities.length} workout activities.`;
    }

    listEl.innerHTML = activities
      .slice(0, 10)
      .map((activity) => {
        const dateStr = new Date(activity.date).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
        
        const isCompleted = activity.completed === true || activity.status === "completed";
        const isIncomplete = activity.status === "incomplete";

        let statusClass = "activity-pending";
        if (isCompleted) statusClass = "activity-completed";
        if (isIncomplete) statusClass = "activity-incomplete";

        const activeTimer = activeItemTimers[activity._id];
        let timerDisplay = "";
        let isRunning = false;
        if (activeTimer) {
          const m = Math.floor(activeTimer.seconds / 60);
          const s = activeTimer.seconds % 60;
          timerDisplay = `⏱️ ${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
          isRunning = activeTimer.running;
        }

        const startBtnText = isRunning
          ? `<i data-lucide="pause" style="width:13px; height:13px;"></i> Pause`
          : activeTimer
          ? `<i data-lucide="play" style="width:13px; height:13px;"></i> Resume`
          : `<i data-lucide="play" style="width:13px; height:13px;"></i> Start`;

        let actionButtonsHtml = "";

        if (isCompleted) {
          actionButtonsHtml = `
            <span class="activity-completed-badge"><i data-lucide="check-circle" style="width:16px; height:16px;"></i> Goal Achieved! Done</span>
            <button class="activity-cross-btn" onclick="deleteActivity('${activity._id}')" title="Delete Activity">&times;</button>
          `;
        } else if (isIncomplete) {
          actionButtonsHtml = `
            <div style="display: flex; align-items: center; gap: 6px;">
              <span class="activity-incomplete-badge"><i data-lucide="alert-circle" style="width:16px; height:16px;"></i> Incomplete</span>
              <button id="start-btn-${activity._id}" class="activity-start-btn" onclick="toggleActivityTimer('${activity._id}', ${activity.duration})"><i data-lucide="play" style="width:13px; height:13px;"></i> Restart</button>
              <button class="activity-cross-btn" onclick="deleteActivity('${activity._id}')" title="Delete Activity">&times;</button>
            </div>
          `;
        } else {
          actionButtonsHtml = `
            <div style="display: flex; align-items: center; gap: 6px;">
              <span id="timer-display-${activity._id}" class="activity-timer-badge ${activeTimer ? '' : 'hidden'}" style="font-size:0.8rem; font-weight:700; color:#4ade80;">${timerDisplay}</span>
              <button id="start-btn-${activity._id}" class="activity-start-btn ${isRunning ? 'running' : ''}" onclick="toggleActivityTimer('${activity._id}', ${activity.duration})">${startBtnText}</button>
              <button class="activity-remove-btn" onclick="completeActivity('${activity._id}')">Remove</button>
              <button class="activity-cross-btn" onclick="deleteActivity('${activity._id}')" title="Delete Activity">&times;</button>
            </div>
          `;
        }

        return `
          <li class="activity-item ${statusClass}" id="activity-item-${activity._id}">
            <div class="activity-item-details">
              <strong>${activity.type}</strong>
              <span class="activity-item-meta">${activity.duration} mins · +${activity.calories || 0} kcal · ${dateStr}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              ${actionButtonsHtml}
            </div>
          </li>
        `;
      })
      .join("");

    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  } catch (err) {
    console.error("Load recent activities error:", err);
  }
}

async function logWorkout(type, duration, calories) {
  const token = getStoredToken();
  const msgEl = document.getElementById("workout-log-message");
  if (!token) return;

  if (msgEl) msgEl.textContent = "Logging workout...";

  try {
    const res = await fetch(`${API_URL}/workouts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ type, duration, calories }),
    });

    const data = await res.json();
    console.log("Workout logged:", data);

    if (!res.ok) {
      if (msgEl) msgEl.textContent = data.message || "Failed to log workout.";
      return;
    }

    if (msgEl) {
      msgEl.style.color = "#10b981";
      msgEl.textContent = "Workout logged successfully! 💪";
      setTimeout(() => {
        msgEl.textContent = "";
      }, 3000);
    }

    await Promise.all([
      loadProgressCharts(),
      loadRecentActivities()
    ]);
  } catch (err) {
    console.error("Log workout error:", err);
    if (msgEl) msgEl.textContent = "Error saving workout.";
  }
}

window.markActivityIncomplete = async function(id) {
  const token = getStoredToken();
  if (!token) return;

  if (activeItemTimers[id]) {
    clearInterval(activeItemTimers[id].interval);
    delete activeItemTimers[id];
  }

  try {
    const res = await fetch(`${API_URL}/activities/${id}/incomplete`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();
    console.log("Activity marked incomplete:", data);

    if (!res.ok) {
      alert(data.message || "Failed to mark activity incomplete");
      return;
    }

    await Promise.all([
      loadProgressCharts(),
      loadRecentActivities()
    ]);
  } catch (err) {
    console.error("Mark activity incomplete error:", err);
  }
};

window.completeActivity = async function(id, isTimerFinished = false) {
  const token = getStoredToken();
  if (!token) return;

  const timer = activeItemTimers[id];
  const isPremature = !isTimerFinished && (!timer || timer.seconds > 0);

  if (activeItemTimers[id]) {
    clearInterval(activeItemTimers[id].interval);
    delete activeItemTimers[id];
  }

  // If user clicked Remove or stopped before timer finished -> mark as Incomplete
  if (isPremature) {
    return window.markActivityIncomplete(id);
  }

  try {
    const res = await fetch(`${API_URL}/activities/${id}/complete`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();
    console.log("Activity completed:", data);

    if (!res.ok) {
      alert(data.message || "Failed to complete activity");
      return;
    }

    await Promise.all([
      loadProgressCharts(),
      loadRecentActivities()
    ]);
  } catch (err) {
    console.error("Complete activity error:", err);
  }
};

window.deleteActivity = async function(id) {
  const token = getStoredToken();
  if (!token) return;

  if (!confirm("Are you sure you want to delete this activity?")) return;

  if (activeItemTimers[id]) {
    clearInterval(activeItemTimers[id].interval);
    delete activeItemTimers[id];
  }

  try {
    const res = await fetch(`${API_URL}/activities/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();
    console.log("Activity deleted:", data);

    if (!res.ok) {
      alert(data.message || "Failed to delete activity");
      return;
    }

    await Promise.all([
      loadProgressCharts(),
      loadRecentActivities()
    ]);
  } catch (err) {
    console.error("Delete activity error:", err);
  }
};


async function resetWaterGlasses() {
  const token = getStoredToken();
  const msgEl = document.getElementById("water-message");
  if (!token) return;

  if (msgEl) msgEl.textContent = "Resetting...";

  try {
    const res = await fetch(`${API_URL}/water/reset`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();
    console.log("Water reset:", data);

    if (!res.ok) {
      if (msgEl) msgEl.textContent = data.message || "Failed to reset water.";
      return;
    }

    if (msgEl) msgEl.textContent = "Water reset for today 💧";
    await loadTodayWater();
  } catch (err) {
    console.error("Reset water error:", err);
    if (msgEl) msgEl.textContent = "Error resetting water.";
  }
}


/* ===================================
   NUTRITION TOOL (on dashboard.html)
   =================================== */
async function handleNutritionSearch() {
  const foodInput = document.getElementById("food-query");
  const errorEl = document.getElementById("nutrition-error");
  const resultEl = document.getElementById("nutrition-result");

  if (!foodInput || !errorEl || !resultEl) return;

  const food = foodInput.value.trim();

  errorEl.textContent = "";
  resultEl.innerHTML = "";
  resultEl.classList.add("hidden");

  if (!food) {
    errorEl.textContent = "Please enter a food name.";
    return;
  }

  try {
    const res = await fetch(
      `${API_URL}/nutrition?food=${encodeURIComponent(food)}`,
      {
        headers: {
          "Content-Type": "application/json",
          // If you protect the route:
          // Authorization: `Bearer ${getStoredToken()}`,
        },
      }
    );

    const data = await res.json();
    console.log("Nutrition data:", data);

    if (!res.ok) {
      errorEl.textContent = data.message || "Failed to fetch nutrition data.";
      return;
    }

    if (!Array.isArray(data) || data.length === 0) {
      errorEl.textContent = "No nutrition data found for that food.";
      return;
    }

    const item = data[0];

    resultEl.innerHTML = `
      <h3>${item.name || food}</h3>
      <p class="small-text">Serving size: ${item.serving_size_g ?? "—"} g</p>
      <div class="nutrition-grid">
        <div><strong>Total Fat:</strong> ${item.fat_total_g ?? "—"} g</div>
        <div><strong>Saturated Fat:</strong> ${item.fat_saturated_g ?? "—"} g</div>
        <div><strong>Carbs:</strong> ${item.carbohydrates_total_g ?? "—"} g</div>
        <div><strong>Sugar:</strong> ${item.sugar_g ?? "—"} g</div>
        <div><strong>Fiber:</strong> ${item.fiber_g ?? "—"} g</div>
        <div><strong>Sodium:</strong> ${item.sodium_mg ?? "—"} mg</div>
        <div><strong>Potassium:</strong> ${item.potassium_mg ?? "—"} mg</div>
        <div><strong>Cholesterol:</strong> ${item.cholesterol_mg ?? "—"} mg</div>
      </div>
    `;

    resultEl.classList.remove("hidden");
  } catch (err) {
    console.error("Nutrition fetch error:", err);
    errorEl.textContent = "Error connecting to server.";
  }
}

/* ===========================
   GLOBAL INITIALIZATION
   =========================== */
document.addEventListener("DOMContentLoaded", () => {
  setupDashboard();

  // Profile form
  const profileForm = document.getElementById("profile-form");
  if (profileForm) {
    profileForm.addEventListener("submit", saveProfile);
    loadProfile();
  }

  // Water tracker
  const waterBtn = document.getElementById("water-add-btn");
  if (waterBtn) {
    waterBtn.addEventListener("click", (e) => {
      e.preventDefault();
      addWaterGlasses(1);
    });
    loadTodayWater();
  }

  const waterBottleBtn = document.getElementById("water-add-bottle-btn");
  if (waterBottleBtn) {
    waterBottleBtn.addEventListener("click", (e) => {
      e.preventDefault();
      addWaterGlasses(2);
    });
  }

  const waterResetBtn = document.getElementById("water-reset-btn");
  if (waterResetBtn) {
    waterResetBtn.addEventListener("click", (e) => {
      e.preventDefault();
      resetWaterGlasses();
    });
  }


  // Nutrition
  const nutritionBtn = document.getElementById("check-nutrition-btn");
  if (nutritionBtn) {
    nutritionBtn.addEventListener("click", (e) => {
      e.preventDefault();
      handleNutritionSearch();
    });
  }

  // Workout plan
  const workoutBtn = document.getElementById("load-workout-plan");
  if (workoutBtn) {
    workoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      loadWorkoutPlan();
    });
    loadWorkoutPlan();
  }

  // Meal planner
  const mealBtn = document.getElementById("load-meal-plan");
  if (mealBtn) {
    mealBtn.addEventListener("click", (e) => {
      e.preventDefault();
      loadMealPlan();
    });
    loadMealPlan();
  }

  // Workout Presets & Custom Activity Training Time Logging
  const presetButtons = document.querySelectorAll(".quick-workout-preset");
  const typeInput = document.getElementById("workout-type");
  const durationInput = document.getElementById("workout-duration");
  const caloriesInput = document.getElementById("workout-calories");

  let currentCalorieRate = 10; // default kcal/min for running

  function updateEstimatedCalories() {
    if (durationInput && caloriesInput) {
      const mins = Number(durationInput.value) || 0;
      caloriesInput.value = Math.round(mins * currentCalorieRate);
    }
  }

  presetButtons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const type = btn.getAttribute("data-type");
      const rate = Number(btn.getAttribute("data-rate")) || 8;
      if (typeInput) typeInput.value = type;
      currentCalorieRate = rate;
      updateEstimatedCalories();
    });
  });

  const quickTimeButtons = document.querySelectorAll(".quick-time-btn");
  quickTimeButtons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const mins = Number(btn.getAttribute("data-mins"));
      if (durationInput) {
        durationInput.value = mins;
        updateEstimatedCalories();
      }
    });
  });

  if (durationInput) {
    durationInput.addEventListener("input", updateEstimatedCalories);
  }

  const manualForm = document.getElementById("manual-workout-form");
  if (manualForm) {
    manualForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const type = typeInput ? typeInput.value.trim() || "Workout" : "Workout";
      const duration = Number(durationInput ? durationInput.value : 20) || 20;
      const calories = Number(caloriesInput ? caloriesInput.value : 0) || Math.round(duration * currentCalorieRate);
      logWorkout(type, duration, calories);
    });
  }

  const clearTodayBtn = document.getElementById("clear-today-btn");
  if (clearTodayBtn) {
    clearTodayBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      if (!confirm("Are you sure you want to clear today's activity logs?")) return;
      
      const token = getStoredToken();
      if (!token) return;

      try {
        const res = await fetch(`${API_URL}/activities/clear-today`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();
        console.log("Clear today's activities:", data);

        if (!res.ok) {
          alert(data.message || "Failed to clear today's activities");
          return;
        }

        await Promise.all([
          loadProgressCharts(),
          loadRecentActivities()
        ]);
      } catch (err) {
        console.error("Clear activities error:", err);
      }
    });
  }

  // Charts & Activities
  loadProgressCharts();
  loadRecentActivities();

  // Search Debouncing
  let debounceTimeout;
  const foodInput = document.getElementById("food-query");
  if (foodInput) {
    foodInput.addEventListener("input", () => {
      clearTimeout(debounceTimeout);
      debounceTimeout = setTimeout(() => {
        const val = foodInput.value.trim();
        if (val.length >= 3) {
          handleNutritionSearch();
        }
      }, 500);
    });

    foodInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        clearTimeout(debounceTimeout);
        handleNutritionSearch();
      }
    });
  }

  // Setup Floating AI Chat Coach Widget
  setupChatWidget();

  // Initialize Lucide icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
});

/* ===================================================
   FLOATING AI CHAT COACH WIDGET
   =================================================== */
function setupChatWidget() {
  const toggleBtn = document.getElementById("chat-toggle-btn");
  const closeBtn = document.getElementById("chat-close-btn");
  const chatWindow = document.getElementById("chat-window");
  const chatForm = document.getElementById("chat-form");
  const chatInput = document.getElementById("chat-input");
  const messagesContainer = document.getElementById("chat-messages");

  if (!toggleBtn || !chatWindow) return;

  toggleBtn.addEventListener("click", () => {
    chatWindow.classList.toggle("hidden");
    if (!chatWindow.classList.contains("hidden")) {
      loadChatHistory();
      if (chatInput) chatInput.focus();
    }
  });

  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      chatWindow.classList.add("hidden");
    });
  }

  // Suggestion chips handler
  const suggestionChips = document.querySelectorAll(".suggestion-chip");
  suggestionChips.forEach((chip) => {
    chip.addEventListener("click", () => {
      const query = chip.getAttribute("data-query");
      if (query && chatInput) {
        chatInput.value = query;
        if (chatForm) {
          chatForm.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
        }
      }
    });
  });

  async function loadChatHistory() {
    const token = getStoredToken();
    if (!token || !messagesContainer) return;

    try {
      const res = await fetch(`${API_URL}/chat/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const history = await res.json();
      if (res.ok && Array.isArray(history) && history.length > 0) {
        messagesContainer.innerHTML = history
          .map(
            (msg) => `
            <div class="chat-bubble ${msg.sender === 'user' ? 'user-bubble' : 'bot-bubble'}">
              ${msg.sender === 'user' ? escapeHtml(msg.message) : formatMarkdown(msg.message)}
            </div>
          `
          )
          .join("");
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }
    } catch (e) {
      console.error("Load chat error:", e);
    }
  }

  if (chatForm) {
    chatForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const message = chatInput.value.trim();
      if (!message) return;

      // Append user bubble
      messagesContainer.innerHTML += `
        <div class="chat-bubble user-bubble">${escapeHtml(message)}</div>
      `;
      chatInput.value = "";
      messagesContainer.scrollTop = messagesContainer.scrollHeight;

      // Show typing indicator
      const typingId = "typing-" + Date.now();
      messagesContainer.innerHTML += `
        <div class="chat-bubble bot-bubble" id="${typingId}">
          <em>AI Coach is thinking... 💭</em>
        </div>
      `;
      messagesContainer.scrollTop = messagesContainer.scrollHeight;

      try {
        const token = getStoredToken();
        const res = await fetch(`${API_URL}/chat/send`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ message }),
        });

        const data = await res.json();
        const typingEl = document.getElementById(typingId);
        if (typingEl) typingEl.remove();

        if (res.ok && data.message) {
          messagesContainer.innerHTML += `
            <div class="chat-bubble bot-bubble">${formatMarkdown(data.message)}</div>
          `;
        } else {
          messagesContainer.innerHTML += `
            <div class="chat-bubble bot-bubble">Sorry, could not process request right now. Try again!</div>
          `;
        }
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      } catch (err) {
        console.error("Send chat message error:", err);
        const typingEl = document.getElementById(typingId);
        if (typingEl) typingEl.remove();
        messagesContainer.innerHTML += `
          <div class="chat-bubble bot-bubble">Network error. Please check connection.</div>
        `;
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }
    });
  }
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str).replace(/[&<>"']/g, (m) => {
    return {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }[m];
  });
}

function formatMarkdown(str) {
  if (!str) return "";
  let html = str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Headers (### Header)
  html = html.replace(/^### (.*$)/gim, "<h3>$1</h3>");
  html = html.replace(/^## (.*$)/gim, "<h3>$1</h3>");

  // Bold (**text**)
  html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

  // Italics (*text*)
  html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");

  // Bullet points
  html = html.replace(/^\* (.*$)/gim, "• $1");
  html = html.replace(/^- (.*$)/gim, "• $1");

  // Line breaks
  html = html.replace(/\n\n/g, "<br/><br/>");
  html = html.replace(/\n/g, "<br/>");

  return html;
}
