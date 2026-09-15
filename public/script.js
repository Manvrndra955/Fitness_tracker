// Base URL of your backend API
const API_URL = "http://localhost:5000/api";

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
      workoutSubTextEl.textContent = `Excellent! You completed ${activities.length} workouts.`;
    }

    listEl.innerHTML = activities
      .slice(0, 5)
      .map((activity) => {
        const dateStr = new Date(activity.date).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
        const isCompleted = activity.completed === true;
        const statusClass = isCompleted ? "activity-completed" : "activity-pending";
        const actionHtml = isCompleted
          ? `<span class="activity-completed-badge"><i data-lucide="check-circle" style="width:16px; height:16px; margin-right:4px;"></i> Done</span>`
          : `<button class="activity-done-btn" onclick="completeActivity('${activity._id}')">Done</button>`;

        return `
          <li class="activity-item ${statusClass}">
            <div class="activity-item-details">
              <strong>${activity.type}</strong>
              <span class="activity-item-meta">${activity.duration} mins · ${dateStr}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 12px;">
              <span class="activity-item-value">+${activity.calories || 0} kcal</span>
              ${actionHtml}
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

window.completeActivity = async function(id) {
  const token = getStoredToken();
  if (!token) return;

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

/* ===================================================
   ACTIVITY LOG CLOCK & TIMER FEATURE
   =================================================== */
function setupActivityLogClock() {
  const container = document.querySelector(".activity-timer-box");
  if (!container) return;

  const typeInput = document.getElementById("activity-clock-type");
  const minsInput = document.getElementById("activity-clock-mins");
  const badgeEl = document.getElementById("activity-clock-badge");
  const digitsEl = document.getElementById("activity-clock-digits");
  const startBtn = document.getElementById("activity-clock-start-btn");
  const startIcon = document.getElementById("activity-clock-start-icon");
  const startText = document.getElementById("activity-clock-start-text");
  const stopBtn = document.getElementById("activity-clock-stop-btn");
  const alertBox = document.getElementById("activity-clock-alert");
  const alertMsg = document.getElementById("activity-clock-alert-msg");

  let clockInterval = null;
  let clockState = "ready"; // 'ready', 'running', 'paused', 'completed'
  let totalSeconds = 15 * 60;
  let remainingSeconds = 15 * 60;

  function formatTime(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

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

  function readTimeConfig() {
    let m = parseInt(minsInput ? minsInput.value : "15", 10);
    if (isNaN(m) || m < 1) m = 1;
    if (minsInput) minsInput.value = m;
    totalSeconds = m * 60;
    remainingSeconds = totalSeconds;
    renderClock();
  }

  function renderClock() {
    if (digitsEl) digitsEl.textContent = formatTime(remainingSeconds);
    container.classList.remove("running", "paused");

    if (clockState === "ready") {
      if (badgeEl) {
        badgeEl.textContent = "Ready";
        badgeEl.style.color = "#86efac";
      }
      if (startText) startText.textContent = "Start Clock";
      if (startIcon) startIcon.setAttribute("data-lucide", "play");
    } else if (clockState === "running") {
      container.classList.add("running");
      if (badgeEl) {
        badgeEl.textContent = "Running... ⏱️";
        badgeEl.style.color = "#4ade80";
      }
      if (startText) startText.textContent = "Pause";
      if (startIcon) startIcon.setAttribute("data-lucide", "pause");
    } else if (clockState === "paused") {
      container.classList.add("paused");
      if (badgeEl) {
        badgeEl.textContent = "Paused ⏸️";
        badgeEl.style.color = "#f59e0b";
      }
      if (startText) startText.textContent = "Resume";
      if (startIcon) startIcon.setAttribute("data-lucide", "play");
    } else if (clockState === "completed") {
      if (badgeEl) {
        badgeEl.textContent = "Done ✅";
        badgeEl.style.color = "#38bdf8";
      }
      if (startText) startText.textContent = "Start Again";
      if (startIcon) startIcon.setAttribute("data-lucide", "play");
    }

    if (typeof lucide !== "undefined") lucide.createIcons();
  }

  async function handleTimerCompletion() {
    clearInterval(clockInterval);
    clockState = "completed";
    renderClock();

    playChime();

    const type = typeInput ? typeInput.value.trim() || "Workout" : "Workout";
    const minsDone = Math.max(1, Math.round(totalSeconds / 60));
    const calories = minsDone * 8; // ~8 kcal/min

    // Show congratulations alert popup
    alert(`🎉 Congratulations! Workout completed successfully!\n\nYou finished your set time of ${minsDone} mins for ${type}. Great job staying active! 💪`);

    // Show alert banner in UI
    if (alertMsg) alertMsg.textContent = `You finished your set time of ${minsDone}m for ${type}. The activity log shows work is done!`;
    if (alertBox) alertBox.classList.remove("hidden");

    // Save and log activity as completed in MongoDB so activity log updates
    try {
      await logWorkout(type, minsDone, calories);
    } catch (err) {
      console.error("Auto log activity error:", err);
    }
  }

  function startClock() {
    if (clockState === "ready" || clockState === "completed") {
      readTimeConfig();
      if (alertBox) alertBox.classList.add("hidden");
    }

    clockState = "running";
    renderClock();

    clearInterval(clockInterval);
    clockInterval = setInterval(() => {
      if (remainingSeconds > 0) {
        remainingSeconds--;
        renderClock();
      }

      if (remainingSeconds <= 0) {
        handleTimerCompletion();
      }
    }, 1000);
  }

  function stopClock() {
    clearInterval(clockInterval);
    clockState = "ready";
    if (alertBox) alertBox.classList.add("hidden");
    readTimeConfig();
  }

  if (startBtn) {
    startBtn.addEventListener("click", () => {
      if (clockState === "ready" || clockState === "paused" || clockState === "completed") {
        startClock();
      } else if (clockState === "running") {
        clearInterval(clockInterval);
        clockState = "paused";
        renderClock();
      }
    });
  }

  if (stopBtn) {
    stopBtn.addEventListener("click", stopClock);
  }

  if (minsInput) {
    minsInput.addEventListener("input", () => {
      if (clockState === "ready" || clockState === "completed") {
        readTimeConfig();
      }
    });
  }

  readTimeConfig();
}

/* ===========================
   GLOBAL INITIALIZATION
   =========================== */
document.addEventListener("DOMContentLoaded", () => {
  setupDashboard();
  setupActivityLogClock();

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

  // Workout Presets & Quick Logging
  const presetButtons = document.querySelectorAll(".quick-workout-preset");
  presetButtons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const type = btn.getAttribute("data-type");
      const duration = Number(btn.getAttribute("data-duration"));
      const calories = Number(btn.getAttribute("data-calories"));
      logWorkout(type, duration, calories);
    });
  });

  const toggleManualBtn = document.getElementById("toggle-manual-workout-btn");
  const manualForm = document.getElementById("manual-workout-form");
  if (toggleManualBtn && manualForm) {
    toggleManualBtn.addEventListener("click", (e) => {
      e.preventDefault();
      manualForm.classList.toggle("hidden");
      if (manualForm.classList.contains("hidden")) {
        toggleManualBtn.innerHTML = '<i data-lucide="edit-3"></i> Log Custom Activity';
      } else {
        toggleManualBtn.innerHTML = '<i data-lucide="chevron-up"></i> Hide Manual Log';
      }
      lucide.createIcons();
    });
  }

  if (manualForm) {
    manualForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const type = document.getElementById("workout-type").value.trim();
      const duration = Number(document.getElementById("workout-duration").value);
      const calories = Number(document.getElementById("workout-calories").value);
      logWorkout(type, duration, calories);
      manualForm.reset();
      manualForm.classList.add("hidden");
      toggleManualBtn.innerHTML = '<i data-lucide="edit-3"></i> Log Custom Activity';
      lucide.createIcons();
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

  // Initialize Lucide icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
});
