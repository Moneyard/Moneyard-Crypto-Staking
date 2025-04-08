// Client-side Configuration
const API_BASE_URL = window.location.origin; // Auto-detect Heroku/production URL
let authToken = null;

// Initialize authentication state
document.addEventListener('DOMContentLoaded', () => {
  authToken = localStorage.getItem('token');
  if (authToken) {
    checkTokenValidity();
    updateAuthUI(true);
  } else {
    updateAuthUI(false);
  }

  // Add event listener for the earnings calculation input field
  const depositInput = document.getElementById('deposit-input');
  if (depositInput) {
    depositInput.addEventListener('input', calculateEarnings);
  }
});

// UI Management
function updateAuthUI(isLoggedIn) {
  const authElements = document.querySelectorAll('[data-auth]');
  authElements.forEach(element => {
    element.style.display = element.dataset.auth === (isLoggedIn ? 'authenticated' : 'anonymous') 
      ? 'block' 
      : 'none';
  });
}

// Form Navigation
function showForm(formId) {
  document.querySelectorAll('.auth-form').forEach(form => {
    form.style.display = form.id === formId ? 'block' : 'none';
  });
}

// Signup functionality
function signup() {
  const username = document.getElementById('signup-username').value;
  const email = document.getElementById('signup-email').value;
  const password = document.getElementById('signup-password').value;
  const refcode = document.getElementById('signup-refcode').value;

  if (!username || !email || !password) {
    showToast('Please fill all fields.', 'error');
    return;
  }

  // Show loader
  showLoader('signup-loader');

  // Send signup request (API endpoint should be configured)
  fetch(`${API_BASE_URL}/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password, refcode }),
  })
  .then(response => response.json())
  .then(data => {
    hideLoader('signup-loader');
    if (data.success) {
      showToast('Account created successfully!', 'success');
      showForm('login-form');
    } else {
      showToast(data.message || 'Error creating account.', 'error');
    }
  })
  .catch(error => {
    hideLoader('signup-loader');
    showToast('Error: ' + error.message, 'error');
  });
}

// Login functionality
function login() {
  const username = document.getElementById('login-username').value;
  const password = document.getElementById('login-password').value;

  if (!username || !password) {
    showToast('Please fill all fields.', 'error');
    return;
  }

  // Show loader
  showLoader('login-loader');

  // Send login request (API endpoint should be configured)
  fetch(`${API_BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  .then(response => response.json())
  .then(data => {
    hideLoader('login-loader');
    if (data.success) {
      localStorage.setItem('token', data.token); // Store token
      authToken = data.token;
      updateAuthUI(true);
      showToast('Logged in successfully!', 'success');
    } else {
      showToast(data.message || 'Error logging in.', 'error');
    }
  })
  .catch(error => {
    hideLoader('login-loader');
    showToast('Error: ' + error.message, 'error');
  });
}

// Reset Password functionality
function resetPassword() {
  const email = document.getElementById('recovery-email').value;
  if (!email) {
    showToast('Please provide your email address.', 'error');
    return;
  }

  // Show loader
  showLoader('reset-password-loader');

  // Send password reset request (API endpoint should be configured)
  fetch(`${API_BASE_URL}/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })
  .then(response => response.json())
  .then(data => {
    hideLoader('reset-password-loader');
    if (data.success) {
      showToast('Password reset link sent to your email.', 'success');
      showForm('login-form');
    } else {
      showToast(data.message || 'Error resetting password.', 'error');
    }
  })
  .catch(error => {
    hideLoader('reset-password-loader');
    showToast('Error: ' + error.message, 'error');
  });
}

// Earnings Calculator
function calculateEarnings() {
  const depositAmount = parseFloat(document.getElementById('deposit-input').value);
  if (isNaN(depositAmount) || depositAmount <= 0) {
    document.getElementById('calculated-earnings').textContent = '';
    return;
  }

  // Assuming daily return is 0.08%
  const dailyEarnings = depositAmount * 0.0008;
  const monthlyEarnings = dailyEarnings * 30;

  document.getElementById('calculated-earnings').innerHTML = `
    Estimated Daily Earnings: ${dailyEarnings.toFixed(2)} USDT
    <br>
    Estimated Monthly Earnings: ${monthlyEarnings.toFixed(2)} USDT
  `;
}

// Toast Notification
function showToast(message, type) {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.getElementById('toast-container').appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// Loader Management
function showLoader(id) {
  document.getElementById(id).style.display = 'block';
}

function hideLoader(id) {
  document.getElementById(id).style.display = 'none';
}
