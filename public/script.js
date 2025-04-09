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
  } else {
    depositAddress = '';
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

// Log deposit
function logDeposit() {
  const userId = localStorage.getItem('userId') || 1;
  const amount = parseFloat(document.getElementById('deposit-amount').value);
  const network = document.getElementById('network').value;

  if (!amount || amount < 15 || amount > 1000) {
    alert("Enter a valid amount between 15 and 1000 USDT.");
    return;
  }

  fetchTransactionId().then(txId => {
    fetch('/log-deposit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, amount, network, txId })
    })
    .then(res => res.json())
    .then(data => {
      alert(data.message || data.error);
    });
  }).catch(err => {
    alert('Error fetching TxID: ' + err.message);
  });
}

// Simulate fetching TxID
function fetchTransactionId() {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const txId = '0x123456789abcdef';
      resolve(txId);
    }, 2000);
  });
}

// Calculate earnings
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

// Load user summary
function loadUserSummary() {
  const userId = localStorage.getItem('userId');

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

// Logout function
function logout() {
  localStorage.clear();
  alert("You have been logged out.");
  window.location.href = "index.html";
}

// On page load
document.addEventListener("DOMContentLoaded", function () {
  if (isUserLoggedIn()) {
    loadUserSummary();
  } else {
    console.log('User is not logged in. Skipping user summary load.');
  }
});
