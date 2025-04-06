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

// Fetch deposit address
function getDepositAddress() {
  const network = document.getElementById('network').value;
  const userId = localStorage.getItem('userId') || 1;

  fetch('/get-deposit-address', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, network })
  })
    .then(res => res.json())
    .then(data => {
      if (data.address) {
        document.getElementById('deposit-address').innerText = 'Send USDT to: ' + data.address;
      } else {
        alert(data.error || "Something went wrong.");
      }
    });
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

// Submit withdrawal request
function submitWithdrawal() {
  const userId = localStorage.getItem('userId') || 1;
  const amount = parseFloat(document.getElementById('withdraw-amount').value);
  const address = document.getElementById('withdraw-address').value;
  const password = document.getElementById('withdraw-password').value;

  if (!amount || amount <= 0) {
    alert("Please enter a valid withdrawal amount.");
    return;
  }

  if (!address) {
    alert("Please enter your wallet address.");
    return;
  }

  if (!password) {
    alert("Please enter your security password.");
    return;
  }

  fetch('/request-withdrawal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, amount, address, password })
  })
    .then(res => res.json())
    .then(data => {
      alert(data.message || data.error);
    });
}
