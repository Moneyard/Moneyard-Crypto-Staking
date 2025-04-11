<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Moneyard | Sign Up or Log In</title>
  <style>
    body {
      font-family: 'Segoe UI', sans-serif;
      background: #FFA94D;
      margin: 0;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      overflow-x: hidden;
    }
    .auth-container {
      background: #fff;
      padding: 2rem;
      border-radius: 12px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.2);
      width: 100%;
      max-width: 400px;
      transition: all 0.5s ease;
      position: relative;
    }
    .form {
      display: none;
      flex-direction: column;
      gap: 1rem;
      opacity: 0;
      transform: translateY(20px);
      transition: all 0.4s ease-in-out;
    }
    .form.active {
      display: flex;
      opacity: 1;
      transform: translateY(0);
    }
    input {
      padding: 0.75rem;
      border-radius: 6px;
      border: 1px solid #ccc;
      outline: none;
    }
    button {
      padding: 0.75rem;
      background: #2b8a3e;
      color: white;
      font-weight: bold;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      transition: background 0.3s;
    }
    button:hover {
      background: #237032;
    }
    .toggle-link {
      text-align: center;
      margin-top: 10px;
      color: #0077cc;
      cursor: pointer;
    }
    h2 {
      text-align: center;
      color: #2b8a3e;
    }
  </style>
</head>
<body>

<div class="auth-container">
  <!-- Login Form -->
  <form id="loginForm" class="form active">
    <h2>Log In</h2>
    <input type="email" id="loginEmail" placeholder="Email" required />
    <input type="password" id="loginPassword" placeholder="Password" required />
    <button type="submit">Log In</button>
    <div class="toggle-link" id="goToSignup">Don't have an account? Sign Up</div>
    <div class="toggle-link" id="forgotPasswordLink">Forgot Password?</div>
  </form>

  <!-- Sign Up Form -->
  <form id="signupForm" class="form">
    <h2>Sign Up</h2>
    <input type="text" id="signupUsername" placeholder="Username" required />
    <input type="email" id="signupEmail" placeholder="Email" required />
    <input type="password" id="signupPassword" placeholder="Password" required />
    <button type="submit">Create Account</button>
    <div class="toggle-link" id="goToLogin">Already have an account? Log In</div>
  </form>

  <!-- Forgot Password Form -->
  <div id="forgotPasswordForm" class="form">
    <h2>Reset Password</h2>
    <input type="email" id="resetEmail" placeholder="Enter your email" required />
    <button id="sendResetLink">Send Reset Link</button>
    <div class="toggle-link" id="backToLogin">Back to Login</div>
  </div>
</div>

<script>
  // Toggle between forms
  document.getElementById("goToSignup").addEventListener("click", () => {
    toggleForm("signupForm");
  });
  document.getElementById("goToLogin").addEventListener("click", () => {
    toggleForm("loginForm");
  });
  document.getElementById("forgotPasswordLink").addEventListener("click", () => {
    toggleForm("forgotPasswordForm");
  });
  document.getElementById("backToLogin").addEventListener("click", () => {
    toggleForm("loginForm");
  });

  function toggleForm(id) {
    document.querySelectorAll(".form").forEach(f => f.classList.remove("active"));
    document.getElementById(id).classList.add("active");
  }
</script>

<script src="script.js"></script>
</body>
</html>
