const authMessage = document.getElementById("authMessage");

function showMessage(message, isError = false) {
  if (!authMessage) return;
  authMessage.textContent = message;
  authMessage.className = `auth-message ${isError ? "error" : "success"}`;
}

function saveSession(data) {
  localStorage.setItem("homeiq_token", data.token);
  localStorage.setItem("homeiq_user", JSON.stringify(data.user));
}

const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(loginForm).entries());

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      const result = await res.json();

      if (!res.ok) return showMessage(result.message || "Login failed", true);
      saveSession(result);
      showMessage("Login successful. Opening dashboard...");
      setTimeout(() => (window.location.href = "/"), 500);
    } catch (error) {
      showMessage("Server not connected. Start npm run dev.", true);
    }
  });
}

const registerForm = document.getElementById("registerForm");
if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(registerForm).entries());

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      const result = await res.json();

      if (!res.ok) return showMessage(result.message || "Registration failed", true);
      saveSession(result);
      showMessage("Account created. Opening dashboard...");
      setTimeout(() => (window.location.href = "/"), 600);
    } catch (error) {
      showMessage("Server not connected. Start npm run dev.", true);
    }
  });
}


// Auth page dark/light theme switch
const authThemeToggle = document.getElementById("authThemeToggle");

function updateAuthThemeButton() {
  if (!authThemeToggle) return;
  authThemeToggle.textContent = document.body.classList.contains("dark") ? "☀️ Light" : "🌙 Dark";
}

function loadAuthTheme() {
  if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark");
  }
  updateAuthThemeButton();
}

if (authThemeToggle) {
  authThemeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    localStorage.setItem("theme", document.body.classList.contains("dark") ? "dark" : "light");
    updateAuthThemeButton();
  });
}

loadAuthTheme();
