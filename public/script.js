document.addEventListener("DOMContentLoaded", () => {
  const signupForm = document.getElementById("signup-form");
  const loginForm = document.getElementById("login-form");
  const signupBox = document.getElementById("signup-box");
  const loginBox = document.getElementById("login-box");
  const switchToLogin = document.getElementById("switch-to-login");
  const switchToSignup = document.getElementById("switch-to-signup");

  // Switch forms
  switchToLogin?.addEventListener("click", () => {
    signupBox.style.display = "none";
    loginBox.style.display = "block";
  });

  switchToSignup?.addEventListener("click", () => {
    loginBox.style.display = "none";
    signupBox.style.display = "block";
  });

  // Signup Handler
  signupForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fullName = document.getElementById("signup-name").value;
    const email = document.getElementById("signup-email").value;
    const password = document.getElementById("signup-password").value;

    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, password })
      });

      const data = await res.json();
      if (res.ok) {
        alert("Signup successful! Please log in.");
        signupBox.style.display = "none";
        loginBox.style.display = "block";
      } else {
        alert(data.error || "Signup failed.");
      }
    } catch (err) {
      console.error("Signup error:", err);
      alert("Something went wrong.");
    }
  });

  // Login Handler
  loginForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        window.location.href = "/dashboard.html";
      } else {
        alert(data.error || "Login failed.");
      }
    } catch (err) {
      console.error("Login error:", err);
      alert("Something went wrong.");
    }
  });

  // Dashboard name display
  if (window.location.pathname.includes("dashboard.html")) {
    const userData = JSON.parse(localStorage.getItem("user"));
    const nameDisplay = document.getElementById("user-name");

    if (userData && nameDisplay) {
      nameDisplay.textContent = userData.fullName || userData.email || "User";
    }
  }
});
