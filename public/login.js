const API_URL = "/api";

async function loginUser() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!email || !password) {
    alert("⚠️ Please fill in all fields!");
    return;
  }

  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    console.log("Login Response:", data);

    if (res.ok) {
      alert("✅ Login successful!");
      // Save token and user in localStorage
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      window.location.href = "dashboard.html"; // Redirect to dashboard
    } else {
      alert("❌ " + data.message);
    }
  } catch (err) {
    console.error("Fetch error:", err);
    alert("⚠️ Something went wrong while logging in.");
  }
}
