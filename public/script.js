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

// Enhanced API Handler
async function apiRequest(endpoint, method, body) {
  try {
    const url = `${API_BASE_URL}/api${endpoint}`;
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();
    
    if (!response.ok) {
      const error = new Error(data.error || 'Request failed');
      error.status = response.status;
      throw error;
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// ===== AUTHENTICATION FUNCTIONS =====
async function signup() {
  try {
    showLoader('signup-loader');
    const userData = {
      username: document.getElementById('signup-username').value.trim(),
      email: document.getElementById('signup-email').value.trim().toLowerCase(),
      password: document.getElementById('signup-password').value,
      refcode: document.getElementById('signup-refcode').value.trim()
    };

    // Client-side validation
    let errors = [];
    if (!userData.username) errors.push("Username is required");
    if (!userData.email || !validateEmail(userData.email)) errors.push("A valid email is required");
    if (!userData.password || userData.password.length < 6) errors.push("Password must be at least 6 characters");

    if (errors.length > 0) {
      displayErrorMessages(errors);
      return;
    }

    // Check existing users
    const users = JSON.parse(localStorage.getItem('users')) || [];
    if (users.some(u => u.username === userData.username)) {
      throw new Error('Username already exists');
    }
    if (users.some(u => u.email === userData.email)) {
      throw new Error('Email already registered');
    }

    // Create new user
    const newUser = {
      id: Date.now().toString(),
      ...userData,
      balance: 0,
      deposits: []
    };
    
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    localStorage.setItem('currentUser', JSON.stringify(newUser));
    
    showToast('Registration successful! Redirecting...', 'success');
    setTimeout(() => window.location.href = 'dashboard.html', 1500);
  } catch (error) {
    showToast(`Signup failed: ${error.message}`, 'error');
  } finally {
    hideLoader('signup-loader');
  }
}

async function login() {
  try {
    showLoader('login-loader');
    const credentials = {
      username: document.getElementById('login-username').value.trim(),
      password: document.getElementById('login-password').value
    };

    let errors = [];
    if (!credentials.username) errors.push("Username is required");
    if (!credentials.password) errors.push("Password is required");

    if (errors.length > 0) {
      displayErrorMessages(errors);
      return;
    }

    const users = JSON.parse(localStorage.getItem('users')) || [];
    const user = users.find(u => u.username === credentials.username && u.password === credentials.password);

    if (!user) throw new Error('Invalid credentials');

    localStorage.setItem('currentUser', JSON.stringify(user));
    showToast('Login successful!', 'success');
    setTimeout(() => window.location.href = 'dashboard.html', 1000);
  } catch (error) {
    showToast(`Login failed: ${error.message}`, 'error');
  } finally {
    hideLoader('login-loader');
  }
}

// ===== PASSWORD RESET =====
async function resetPassword() {
  try {
    showLoader('reset-password-loader');
    const email = document.getElementById('recovery-email').value.trim();
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    let errors = [];
    if (!email || !validateEmail(email)) errors.push("A valid email is required");
    if (newPassword !== confirmPassword) errors.push("Passwords do not match");

    if (errors.length > 0) {
      displayErrorMessages(errors);
      return;
    }

    const users = JSON.parse(localStorage.getItem('users')) || [];
    const userIndex = users.findIndex(u => u.email === email);
    
    if (userIndex === -1) throw new Error('Email not found');
    
    users[userIndex].password = newPassword;
    localStorage.setItem('users', JSON.stringify(users));
    
    showToast('Password updated successfully!', 'success');
    setTimeout(() => showForm('login-form'), 1500);
  } catch (error) {
    showToast(`Password reset failed: ${error.message}`, 'error');
  } finally {
    hideLoader('reset-password-loader');
  }
}

// ===== DEPOSIT FUNCTIONS =====
function getDepositAddress() {
  const network = document.getElementById('network').value;
  const addresses = {
    'Tron': 'TJREgZTuTnvRrw5Fme4DDd6hSwCEwxQV3f',
    'BNB': '0x2837db956aba84eb2670d00aeea5c0d8a9e20a01'
  };
  
  if (!network) {
    showToast('Please select a network', 'error');
    return;
  }

  const addressElement = document.getElementById('deposit-address');
  addressElement.textContent = addresses[network];
  document.getElementById('copy-button').style.display = 'inline-block';
}

function copyToClipboard() {
  const address = document.getElementById('deposit-address').textContent;
  navigator.clipboard.writeText(address);
  showToast('Address copied to clipboard!', 'success');
}

// ===== EARNINGS CALCULATOR =====
function calculateEarnings() {
  const amount = parseFloat(document.getElementById('deposit-input').value);
  if (!amount || amount < 15) {
    showToast('Minimum deposit is 15 USDT', 'error');
    return;
  }
  
  const dailyEarnings = amount * 0.08;
  document.getElementById('calculated-earnings').innerHTML = `
    Daily Earnings: <strong>${dailyEarnings.toFixed(2)} USDT</strong>
  `;
}

// ===== UTILITY FUNCTIONS =====
function showLoader(loaderId) {
  document.getElementById(loaderId).style.display = 'block';
}

function hideLoader(loaderId) {
  document.getElementById(loaderId).style.display = 'none';
}

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => toast.remove(), 5000);
}

function displayErrorMessages(errors) {
  const errorContainer = document.getElementById('password-error');
  errorContainer.innerHTML = errors.join('<br>');
  errorContainer.style.display = 'block';
}

// Simple email validation function
function validateEmail(email) {
  const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailPattern.test(email);
}

// Initial Form State
document.addEventListener('DOMContentLoaded', () => {
  if (localStorage.getItem('currentUser')) {
    window.location.href = 'dashboard.html';
  }
});
