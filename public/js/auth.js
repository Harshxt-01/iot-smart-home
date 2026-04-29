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
      setTimeout(() => (window.location.href = "/dashboard.html"), 500);
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
      setTimeout(() => (window.location.href = "/dashboard.html"), 600);
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

const forgotPasswordForm = document.getElementById("forgotPasswordForm");
if (forgotPasswordForm) {
  forgotPasswordForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(forgotPasswordForm).entries());
    const resetLinkBox = document.getElementById("resetLinkBox");
    const resetLink = document.getElementById("resetLink");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      const result = await res.json();

      if (!res.ok) return showMessage(result.message || "Could not generate reset link", true);
      showMessage(result.message || "Reset link generated.");

      if (result.resetLink && resetLinkBox && resetLink) {
        resetLink.href = result.resetLink;
        resetLink.textContent = result.resetLink;
        resetLinkBox.hidden = false;
      }
    } catch (error) {
      showMessage("Server not connected. Start npm run dev.", true);
    }
  });
}

const resetPasswordForm = document.getElementById("resetPasswordForm");
if (resetPasswordForm) {
  const tokenInput = document.getElementById("resetToken");
  const token = new URLSearchParams(window.location.search).get("token") || "";
  if (tokenInput) tokenInput.value = token;
  if (!token) showMessage("Reset token missing. Generate a new reset link.", true);

  resetPasswordForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(resetPasswordForm).entries());

    if (!data.token) return showMessage("Reset token missing. Generate a new reset link.", true);
    if (data.password !== data.confirmPassword) return showMessage("Passwords do not match", true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: data.token, password: data.password })
      });
      const result = await res.json();

      if (!res.ok) return showMessage(result.message || "Password reset failed", true);
      localStorage.removeItem("homeiq_token");
      localStorage.removeItem("homeiq_user");
      showMessage(result.message || "Password reset successful.");
      setTimeout(() => (window.location.href = "/login.html"), 1000);
    } catch (error) {
      showMessage("Server not connected. Start npm run dev.", true);
    }
  });
}
