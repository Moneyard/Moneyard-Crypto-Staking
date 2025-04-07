// Fetch and display user summary (username, total deposit, available balance)
function loadUserSummary() {
  const userId = 1;  // Replace with actual userId from authentication session or token

  // Fetch user summary from API
  fetch(`/user-summary?userId=${userId}`)
    .then(response => response.json())
    .then(data => {
      // Update user summary fields with the fetched data
      document.getElementById("summary-username").textContent = "Username"; // Replace with actual username
      document.getElementById("summary-total").textContent = `${data.totalDeposit} USDT`;
      document.getElementById("summary-balance").textContent = `${data.balance} USDT`;
    })
    .catch(error => {
      console.error("Error fetching user summary:", error);
    });
}

// Handle signup form submission
function signup() {
  const username = document.getElementById("signup-username").value;
  const password = document.getElementById("signup-password").value;
  const refCode = document.getElementById("signup-refcode").value;

  // Send signup data to the server
  fetch('/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, refCode })
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      alert("Sign up successful! Please log in.");
      toggleForms();
    } else {
      alert("Signup failed. Please try again.");
    }
  })
  .catch(error => {
    console.error("Signup error:", error);
    alert("An error occurred during signup.");
  });
}

// Handle login form submission
function login() {
  const username = document.getElementById("login-username").value;
  const password = document.getElementById("login-password").value;

  // Send login data to the server
  fetch('/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      alert("Login successful!");
      loadUserSummary();
    } else {
      alert("Login failed. Please check your credentials.");
    }
  })
  .catch(error => {
    console.error("Login error:", error);
    alert("An error occurred during login.");
  });
}

// Toggle between Sign Up and Login forms
function toggleForms() {
  const signupForm = document.getElementById("signup-form");
  const loginForm = document.getElementById("login-form");
  signupForm.style.display = signupForm.style.display === "none" ? "block" : "none";
  loginForm.style.display = loginForm.style.display === "none" ? "block" : "none";
}

// Copy deposit address to clipboard
function copyToClipboard() {
  const depositAddress = document.getElementById("deposit-address").textContent;
  navigator.clipboard.writeText(depositAddress)
    .then(() => {
      alert("Deposit address copied to clipboard.");
    })
    .catch(err => {
      console.error("Failed to copy text: ", err);
    });
}

// Get deposit address based on selected network
function getDepositAddress() {
  const userId = 1;  // Replace with actual userId
  const network = document.getElementById("network").value;

  fetch('/get-deposit-address', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, network })
  })
  .then(response => response.json())
  .then(data => {
    document.getElementById("deposit-address").textContent = data.address;
    document.getElementById("copy-button").style.display = "inline";
  })
  .catch(error => {
    console.error("Error fetching deposit address:", error);
  });
}

// Handle deposit submission
function logDeposit() {
  const userId = 1;  // Replace with actual userId
  const amount = document.getElementById("deposit-amount").value;

  fetch('/log-deposit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, amount })
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      alert("Deposit logged successfully.");
    } else {
      alert("Failed to log deposit.");
    }
  })
  .catch(error => {
    console.error("Error logging deposit:", error);
    alert("An error occurred during deposit.");
  });
}

// Handle withdrawal request
function submitWithdrawal() {
  const userId = 1;  // Replace with actual userId
  const amount = document.getElementById("withdraw-amount").value;
  const address = document.getElementById("withdraw-address").value;
  const password = document.getElementById("withdraw-password").value;

  fetch('/log-withdrawal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, amount, address, password })
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      alert("Withdrawal request submitted.");
    } else {
      alert("Failed to submit withdrawal request.");
    }
  })
  .catch(error => {
    console.error("Error submitting withdrawal request:", error);
    alert("An error occurred during withdrawal.");
  });
}

// Load user summary when the page is ready
window.onload = function() {
  loadUserSummary();
};
