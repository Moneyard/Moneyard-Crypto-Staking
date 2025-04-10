<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Moneyard</title>
  <link rel="stylesheet" href="styles.css" />
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
</head>
<body>

  <!-- Top-Right Menu Bar -->
  <div class="top-menu">
    <button id="menuToggle" class="menu-button">☰</button>
    <div id="menuDropdown" class="menu-dropdown">
      <div class="menu-section left">
        <h3 id="learning-header"><i class="fas fa-graduation-cap"></i> Moneyard Learning</h3>
        <ul id="learning-content" style="display: none;">
          <li>Learn about Crypto Staking</li>
          <li>High-Yield Savings Tools</li>
          <li>Micro-Investing Data</li>
        </ul>
      </div>

      <div class="menu-section right">
        <h3 id="account-header"><i class="fas fa-user"></i> My Account</h3>
        <div id="account-content" style="display: none;">
          <button class="login-button" onclick="showAuthForm('login')">Login</button>
          <button class="login-button" onclick="showAuthForm('signup')">Sign Up</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Main Content Area -->
  <div class="main-content">
    <h1>Welcome to Moneyard</h1>
    <p>Your trusted crypto staking platform.</p>

    <!-- Auth Form Box -->
    <div id="auth-form" style="display: none;">
      <!-- Login Form -->
      <div id="login-form-section">
        <h2>Login</h2>
        <form id="loginForm" onsubmit="handleLogin(event)">
          <input type="email" id="loginEmail" placeholder="Email" required><br>
          <input type="password" id="loginPassword" placeholder="Password" required><br>
          <button type="submit">Login</button>
        </form>
        <a href="#" id="forgot-password-link">Forgot Password?</a><br>
        <p>No account? <a href="#" onclick="showAuthForm('signup')">Sign Up</a></p>
      </div>

      <!-- Signup Form -->
      <div id="signup-form-section" style="display: none;">
        <h2>Sign Up</h2>
        <form id="signupForm" onsubmit="handleSignup(event)">
          <input type="email" id="signupEmail" placeholder="Email" required><br>
          <input type="password" id="signupPassword" placeholder="Password" required><br>
          <button type="submit">Sign Up</button>
        </form>
        <p>Already have an account? <a href="#" onclick="showAuthForm('login')">Login</a></p>
      </div>
    </div>

    <!-- Forgot Password Modal -->
    <div id="forgot-password-modal" style="display: none;">
      <h2>Forgot Password</h2>
      <form id="forgot-password-form">
        <input type="email" id="forgot-password-email" placeholder="Enter your email" required />
        <button type="submit">Send Reset Link</button>
      </form>
      <button onclick="closeForgotPasswordModal()">Close</button>
    </div>
  </div>

  <!-- Inline Styles -->
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 60px 20px 20px;
    }

    .top-menu {
      position: fixed;
      top: 10px;
      right: 10px;
      z-index: 1000;
    }

    .menu-button {
      background-color: #007a5a;
      color: white;
      font-size: 24px;
      padding: 6px 12px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
    }

    .menu-dropdown {
      position: absolute;
      top: 40px;
      right: 0;
      background: white;
      border: 1px solid #ddd;
      border-radius: 8px;
      display: none;
      flex-direction: column;
      width: 320px;
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
      padding: 16px;
      gap: 12px;
    }

    .menu-dropdown.show {
      display: flex;
    }

    .menu-section h3 {
      margin-top: 0;
      font-size: 16px;
      color: #007a5a;
      margin-bottom: 8px;
      cursor: pointer;
    }

    .menu-section ul li {
      font-size: 14px;
      margin-bottom: 6px;
      list-style: disc;
    }

    .login-button {
      background-color: #28a745;
      color: white;
      padding: 10px 14px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      margin: 4px 0;
    }

    .main-content {
      max-width: 600px;
      margin: auto;
      text-align: center;
    }

    #auth-form input {
      width: 80%;
      padding: 10px;
      margin: 6px 0;
      border: 1px solid #ccc;
      border-radius: 4px;
    }

    #auth-form button {
      background-color: #007a5a;
      color: white;
      padding: 10px 20px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
    }

    a {
      color: #007a5a;
    }

    #forgot-password-modal {
      background: white;
      border: 1px solid #ccc;
      padding: 20px;
      max-width: 400px;
      margin: 20px auto;
      border-radius: 8px;
    }
  </style>

  <!-- Scripts -->
  <script>
    document.addEventListener("DOMContentLoaded", () => {
      const toggleButton = document.getElementById('menuToggle');
      const menuDropdown = document.getElementById('menuDropdown');
      const learningHeader = document.getElementById('learning-header');
      const learningContent = document.getElementById('learning-content');
      const accountHeader = document.getElementById('account-header');
      const accountContent = document.getElementById('account-content');

      toggleButton.addEventListener('click', (e) => {
        e.stopPropagation();
        menuDropdown.classList.toggle('show');
      });

      document.addEventListener('click', (e) => {
        if (!document.querySelector('.top-menu').contains(e.target)) {
          menuDropdown.classList.remove('show');
        }
      });

      learningHeader.addEventListener('click', () => {
        learningContent.style.display = learningContent.style.display === 'none' ? 'block' : 'none';
      });

      accountHeader.addEventListener('click', () => {
        accountContent.style.display = accountContent.style.display === 'none' ? 'block' : 'none';
      });

      document.getElementById("forgot-password-link").onclick = () => {
        document.getElementById("forgot-password-modal").style.display = "block";
      };

      document.getElementById("forgot-password-form").onsubmit = function(e) {
        e.preventDefault();
        const email = document.getElementById("forgot-password-email").value;
        fetch('/api/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        })
        .then(res => res.json())
        .then(data => {
          alert(data.success ? "Reset link sent!" : "Error: " + data.message);
          closeForgotPasswordModal();
        })
        .catch(err => alert("Error: " + err.message));
      };
    });

    function closeForgotPasswordModal() {
      document.getElementById("forgot-password-modal").style.display = "none";
    }

    function showAuthForm(type) {
      document.getElementById('auth-form').style.display = 'block';
      if (type === 'login') {
        document.getElementById('login-form-section').style.display = 'block';
        document.getElementById('signup-form-section').style.display = 'none';
      } else {
        document.getElementById('signup-form-section').style.display = 'block';
        document.getElementById('login-form-section').style.display = 'none';
      }
    }

    function handleLogin(e) {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value;
      const password = document.getElementById('loginPassword').value;
      localStorage.setItem('moneyard_user_email', email);
      fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      .then(res => res.json())
      .then(data => alert(data.message || 'Logged in!'))
      .catch(() => alert('Login failed!'));
    }

    function handleSignup(e) {
      e.preventDefault();
      const email = document.getElementById('signupEmail').value;
      const password = document.getElementById('signupPassword').value;
      fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      .then(res => res.json())
      .then(data => {
        alert(data.message || 'Signup successful!');
        showAuthForm('login');
      })
      .catch(() => alert('Signup failed!'));
    }
  </script>

</body>
</html>