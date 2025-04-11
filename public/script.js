document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const signupForm = document.getElementById("signupForm");
  const forgotPasswordForm = document.getElementById("forgotPasswordForm");

  const loginEmail = document.getElementById("loginEmail");
  const loginPassword = document.getElementById("loginPassword");
  const signupUsername = document.getElementById("signupUsername");
  const signupEmail = document.getElementById("signupEmail");
  const signupPassword = document.getElementById("signupPassword");
  const resetEmail = document.getElementById("resetEmail");

  // Toggle function
  function toggleForm(formId) {
    document.querySelectorAll(".form").forEach(f => f.classList.remove("active"));
    document.getElementById(formId).classList.add("active");
  }

  // Signup
  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const response = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: signupUsername.value,
        email: signupEmail.value,
        password: signupPassword.value,
      }),
    });
    const result = await response.json();
    alert(result.message);
    if (response.ok) {
      signupForm.reset();
      toggleForm("loginForm");
    }
  });

  // Login
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: loginEmail.value,
        password: loginPassword.value,
      }),
    });
    const result = await response.json();
    if (response.ok && result.token) {
      localStorage.setItem("token", result.token);
      window.location.href = "dashboard.html";
    } else {
      alert(result.message || "Login failed.");
    }
  });

  // Forgot Password
  const sendResetBtn = document.getElementById("sendResetLink");
  sendResetBtn.addEventListener("click", async () => {
    if (!resetEmail.value) return alert("Please enter your email.");
    const response = await fetch("/api/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: resetEmail.value }),
    });
    const result = await response.json();
    alert(result.message);
    if (response.ok) {
      forgotPasswordForm.reset();
      toggleForm("loginForm");
    }
  });
});
