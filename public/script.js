// Unified Form Navigation
function showForm(formId) {
  document.querySelectorAll('.form').forEach(form => form.style.display = 'none');
  document.getElementById(formId).style.display = 'block';
}

// Check if the user is logged in
function isUserLoggedIn() {
  return localStorage.getItem('userId') !== null;
}

// Signup handler
function signup() {
  const username = document.getElementById('signup-username').value;
  const password = document.getElementById('signup-password').value;
  const email = document.getElementById('signup-email')?.value || '';

  if (username && password && email) {
    let users = JSON.parse(localStorage.getItem('users')) || [];

    if (users.find(u => u.username === username)) {
      alert("Username already exists. Please login.");
      showForm('login-form');
      return;
    }

    users.push({ username, password, email });
    localStorage.setItem('users', JSON.stringify(users));
    localStorage.setItem('username', username); // optional for dashboard display
    alert("Signup successful! Please login.");
    showForm('login-form');
  } else {
    alert("Please fill in all required fields.");
  }
}

// Login handler
function login() {
  const username = document.getElementById('login-username').value;
  const password = document.getElementById('login-password').value;

  const users = JSON.parse(localStorage.getItem('users')) || [];
  const user = users.find(u => u.username === username && u.password === password);

  if (user) {
    localStorage.setItem('userId', 1); // Static userId for now
    localStorage.setItem('username', user.username);
    window.location.href = "dashboard.html";
  } else {
    alert("Invalid credentials. Please try again.");
  }
}

// Password Reset
function resetPassword() {
  const email = document.getElementById('recovery-email').value;
  const newPassword = document.getElementById('new-password').value;
  const confirmPassword = document.getElementById('confirm-password').value;

  document.querySelectorAll('.form-message').forEach(msg => msg.style.display = 'none');

  if (newPassword !== confirmPassword) {
    document.getElementById('password-error').textContent = 'Passwords do not match!';
    document.getElementById('password-error').style.display = 'block';
    return;
  }

  const users = JSON.parse(localStorage.getItem('users')) || [];
  const user = users.find(u => u.email === email);

  if (!user) {
    document.getElementById('password-error').textContent = 'No account found with this email!';
    document.getElementById('password-error').style.display = 'block';
    return;
  }

  user.password = newPassword;
  localStorage.setItem('users', JSON.stringify(users));

  document.getElementById('password-success').textContent = 'Password updated successfully!';
  document.getElementById('password-success').style.display = 'block';
  setTimeout(() => showForm('login-form'), 1500);
}

// Deposit Address Fetching
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

// Copy deposit address to clipboard
function copyToClipboard() {
  const address = document.getElementById('deposit-address').getAttribute('data-copy-text');
  if (address) {
    const textarea = document.createElement('textarea');
    textarea.value = address;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    alert("Deposit address copied to clipboard!");
  }
}

// Simulate TxID fetch
function fetchTransactionId() {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve('0x123456789abcdef');
    }, 2000);
  });
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
    .then(data => alert(data.message || data.error))
    .catch(err => alert('Error: ' + err.message));
  });
}

// Earnings Calculator
function calculateEarnings() {
  const amount = parseFloat(document.getElementById('deposit-input').value);
  if (!amount || amount < 15 || amount > 1000) {
    alert("Please enter a valid deposit amount between 15 and 1000 USDT.");
    return;
  }
  const earnings = amount * 0.08;
  document.getElementById('calculated-earnings').innerText = `Your daily earnings are: ${earnings.toFixed(2)} USDT.`;
}

// Load user summary
function loadUserSummary() {
  const userId = localStorage.getItem('userId');
  if (!userId) return;

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

// Auto-load summary if logged in
document.addEventListener("DOMContentLoaded", () => {
  if (isUserLoggedIn()) {
    loadUserSummary();
  }
});
