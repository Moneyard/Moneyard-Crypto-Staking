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
  const refCode = document.getElementById('signup-refcode').value;

  if (username && password) {
    fetch('/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, refCode })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          alert("Signup successful! Please login.");
          toggleForms();
        } else {
          alert(data.error || "Signup failed.");
        }
      });
  } else {
    alert("Please fill in all required fields.");
  }
}

// Login handler
function login() {
  const username = document.getElementById('login-username').value;
  const password = document.getElementById('login-password').value;

  if (!username || !password) {
    alert("Please enter both username and password.");
    return;
  }

  fetch('/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  })
    .then(res => res.json())
    .then(data => {
      if (data.success && data.token) {
        localStorage.setItem('token', data.token);
        window.location.href = 'dashboard.html';
      } else {
        alert(data.error || "Login failed.");
      }
    });
}

// Check if user is logged in
function isUserLoggedIn() {
  return !!localStorage.getItem('token');
}

// Fetch deposit address based on selected network
function getDepositAddress() {
  const network = document.getElementById('network').value;
  let depositAddress = '';
  let networkLabel = '';

  if (network === 'Tron') {
    depositAddress = 'TJREgZTuTnvRrw5Fme4DDd6hSwCEwxQV3f';
    networkLabel = 'Tron Network (TRC20)';
  } else if (network === 'BNB') {
    depositAddress = '0x2837db956aba84eb2670d00aeea5c0d8a9e20a01';
    networkLabel = 'BNB Smart Chain (BEP20)';
  }

  if (depositAddress) {
    document.getElementById('deposit-address').innerText = `Network: ${networkLabel}\nDeposit Address: ${depositAddress}`;
    document.getElementById('copy-button').style.display = 'inline-block';
    document.getElementById('deposit-address').setAttribute('data-copy-text', depositAddress);
  } else {
    document.getElementById('deposit-address').innerText = '';
    alert("Please select a valid network.");
    document.getElementById('copy-button').style.display = 'none';
  }
}

// Copy to clipboard function
function copyToClipboard() {
  const depositAddress = document.getElementById('deposit-address').getAttribute('data-copy-text');

  if (depositAddress) {
    const tempTextArea = document.createElement('textarea');
    tempTextArea.value = depositAddress;
    document.body.appendChild(tempTextArea);
    tempTextArea.select();
    document.execCommand('copy');
    document.body.removeChild(tempTextArea);

    alert("Deposit address copied to clipboard!");
  }
}

// Log deposit without manual TxID
function logDeposit() {
  const amount = parseFloat(document.getElementById('deposit-amount').value);
  const network = document.getElementById('network').value;
  const token = localStorage.getItem('token');

  if (!amount || amount < 15 || amount > 1000) {
    alert("Enter a valid amount between 15 and 1000 USDT.");
    return;
  }

  fetchTransactionId().then(txId => {
    fetch('/log-deposit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ amount, network, txId })
    })
      .then(res => res.json())
      .then(data => {
        alert(data.message || data.error);
      })
      .catch(err => {
        alert('Error logging deposit: ' + err.message);
      });
  });
}

// Simulate async TxID fetch (to be replaced with real API)
function fetchTransactionId() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve('0x123456789abcdef');
    }, 2000);
  });
}

// Calculate earnings (8% daily)
function calculateEarnings() {
  const depositAmount = parseFloat(document.getElementById('deposit-input').value);

  if (!depositAmount || depositAmount < 15 || depositAmount > 1000) {
    alert("Please enter a valid deposit amount between 15 and 1000 USDT.");
    return;
  }

  const dailyEarnings = depositAmount * 0.08;
  const earningsMessage = `Your daily earnings are: ${dailyEarnings.toFixed(2)} USDT.`;

  document.getElementById('calculated-earnings').innerText = earningsMessage;
}

// Load user info including username
function loadUserSummary() {
  const token = localStorage.getItem('token');
  if (!token) return;

  fetch('/user-info', {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })
    .then(res => res.json())
    .then(data => {
      if (data.username) {
        document.getElementById('summary-username').innerText = data.username;
      } else {
        document.getElementById('summary-username').innerText = 'Unknown';
      }
    })
    .catch(() => {
      document.getElementById('summary-username').innerText = 'Error loading username';
    });
}

// DOM Ready
document.addEventListener("DOMContentLoaded", function () {
  if (isUserLoggedIn()) {
    loadUserSummary();
  }
});
