// Toggle between signup and login forms
function toggleForms() {
  const signupForm = document.getElementById('signup-form');
  const loginForm = document.getElementById('login-form');

  signupForm.style.display = signupForm.style.display === 'none' ? 'block' : 'none';
  loginForm.style.display = loginForm.style.display === 'none' ? 'block' : 'none';
}

// Signup handler
function signup() {
  const username = document.getElementById('signup-username').value;
  const password = document.getElementById('signup-password').value;

  if (username && password) {
    localStorage.setItem('username', username);
    localStorage.setItem('password', password);
    alert("Signup successful! Please login.");
    toggleForms();
  } else {
    alert("Please fill in all required fields.");
  }
}

// Login handler
function login() {
  const username = document.getElementById('login-username').value;
  const password = document.getElementById('login-password').value;

  const storedUser = localStorage.getItem('username');
  const storedPass = localStorage.getItem('password');

  if (username === storedUser && password === storedPass) {
    localStorage.setItem('userId', 1); // Static userId for now
    window.location.href = "dashboard.html";
  } else {
    alert("Invalid credentials. Please try again.");
  }
}

// Check if the user is logged in (i.e., userId exists in localStorage)
function isUserLoggedIn() {
  const userId = localStorage.getItem('userId');
  return userId !== null;
}

// Fetch deposit address based on selected network (Tron or BNB Smart Chain)
function getDepositAddress() {
  const network = document.getElementById('network').value;  // Get selected network
  const userId = localStorage.getItem('userId') || 1;

  // Check if network is selected
  if (!network) {
    alert("Please select a network.");
    return;
  }

  // Define deposit addresses for the selected networks
  let depositAddress = '';
  if (network === 'Tron') {
    depositAddress = 'TJREgZTuTnvRrw5Fme4DDd6hSwCEwxQV3f';  // Tron (TRC20)
  } else if (network === 'BNB') {
    depositAddress = '0x2837db956aba84eb2670d00aeea5c0d8a9e20a01';  // BNB Smart Chain (BEP20)
  } else {
    alert("Unsupported network selected.");
    return;
  }

  // Display the deposit address on the page
  document.getElementById('deposit-address').innerText = 'Send USDT to: ' + depositAddress;
}

// Log deposit
function logDeposit() {
  const userId = localStorage.getItem('userId') || 1;
  const amount = parseFloat(document.getElementById('deposit-amount').value);
  const txId = document.getElementById('txId').value;
  const network = document.getElementById('network').value;

  if (!amount || amount < 15 || amount > 1000) {
    alert("Enter a valid amount between 15 and 1000 USDT.");
    return;
  }

  if (!txId) {
    alert("Please enter the transaction ID.");
    return;
  }

  fetch('/log-deposit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, amount, network, txId })
  })
    .then(res => res.json())
    .then(data => {
      alert(data.message || data.error);
    });
}

// Calculate earnings (8% daily)
function calculateEarnings() {
  const depositAmount = parseFloat(document.getElementById('deposit-input').value);

  if (!depositAmount || depositAmount < 15 || depositAmount > 1000) {
    alert("Please enter a valid deposit amount between 15 and 1000 USDT.");
    return;
  }

  const dailyEarnings = depositAmount * 0.08; // 8% daily earnings
  const earningsMessage = `Your daily earnings are: ${dailyEarnings.toFixed(2)} USDT.`;

  document.getElementById('calculated-earnings').innerText = earningsMessage;
}

// Fetch user summary (username, total deposit, balance)
function loadUserSummary() {
  const userId = localStorage.getItem('userId');
  
  // If userId is not found, do not load the summary
  if (!userId) {
    console.log('User is not logged in, skipping summary load');
    return;
  }

  fetch(`/user-summary?userId=${userId}`)
    .then(res => res.json())
    .then(data => {
      if (data.totalDeposit !== undefined && data.balance !== undefined) {
        document.getElementById('summary-username').innerText = localStorage.getItem('username');
        document.getElementById('summary-total').innerText = `${data.totalDeposit.toFixed(2)} USDT`;
        document.getElementById('summary-balance').innerText = `${data.balance.toFixed(2)} USDT`;
      } else {
        alert("Failed to load user summary.");
      }
    })
    .catch(err => {
      console.error("Error loading user summary:", err);
      alert("Failed to load user summary.");
    });
}

// Call loadUserSummary only if user is logged in
document.addEventListener("DOMContentLoaded", function () {
  // Only attempt to load the user summary if the user is logged in
  if (isUserLoggedIn()) {
    loadUserSummary();
  } else {
    console.log('User is not logged in. Skipping user summary load.');
  }
});
