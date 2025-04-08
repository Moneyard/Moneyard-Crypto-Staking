// Client-side Configuration
const API_BASE_URL = window.location.origin;
let authToken = null;

// Initialize authentication state
document.addEventListener('DOMContentLoaded', () => {
  authToken = localStorage.getItem('token');
  if (authToken) {
    checkTokenValidity();
    window.location.href = 'dashboard.html';
  } else {
    showForm('signup-form');
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

// Show specific form
function showForm(formId) {
  document.querySelectorAll('.auth-form').forEach(form => {
    form.classList.remove('active');
  });
  document.getElementById(formId).classList.add('active');
}

// API Handler
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
      throw new Error(data.error || 'Request failed');
    }
    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// Sign Up
async function signup() {
  const loader = document.getElementById('signup-loader');
  try {
    loader.style.display = 'block';
    const userData = {
      username: document.getElementById('signup-username').value.trim(),
      email: document.getElementById('signup-email').value.trim().toLowerCase(),
      password: document.getElementById('signup-password').value,
      refcode: document.getElementById('signup-refcode').value.trim()
    };

    if (!userData.username || !userData.email || !userData.password) {
      throw new Error('All required fields must be filled');
    }

    const response = await apiRequest('/signup', 'POST', userData);
    localStorage.setItem('token', response.token);
    localStorage.setItem('userId', response.user.id);
    localStorage.setItem('username', response.user.username);
    authToken = response.token;

    showToast('Signup successful! Redirecting...', 'success');
    setTimeout(() => window.location.href = 'dashboard.html', 1500);
  } catch (err) {
    showToast(`Signup failed: ${err.message}`, 'error');
  } finally {
    loader.style.display = 'none';
  }
}

// Login
async function login() {
  const loader = document.getElementById('login-loader');
  try {
    loader.style.display = 'block';
    const credentials = {
      username: document.getElementById('login-username').value.trim(),
      password: document.getElementById('login-password').value
    };

    const response = await apiRequest('/login', 'POST', credentials);
    localStorage.setItem('token', response.token);
    localStorage.setItem('userId', response.user.id);
    localStorage.setItem('username', response.user.username);
    authToken = response.token;

    showToast('Login successful! Redirecting...', 'success');
    setTimeout(() => window.location.href = 'dashboard.html', 1500);
  } catch (err) {
    const message = err.status === 401 ? 'Invalid credentials' : err.message;
    showToast(`Login failed: ${message}`, 'error');
  } finally {
    loader.style.display = 'none';
  }
}

// Password Reset
async function resetPassword() {
  const loader = document.getElementById('reset-password-loader');
  try {
    loader.style.display = 'block';
    const email = document.getElementById('recovery-email').value.trim();
    if (!email) throw new Error('Email is required');

    await apiRequest('/reset-password', 'POST', { email });

    const success = document.getElementById('password-success');
    success.textContent = 'Reset link sent to your email.';
    success.style.display = 'block';
  } catch (err) {
    const errorBox = document.getElementById('password-error');
    errorBox.textContent = err.message;
    errorBox.style.display = 'block';
  } finally {
    loader.style.display = 'none';
  }
}

// Token Checker
function checkTokenValidity() {
  try {
    const payload = JSON.parse(atob(authToken.split('.')[1]));
    if (payload.exp * 1000 < Date.now()) {
      localStorage.clear();
      window.location.reload();
    }
  } catch {
    localStorage.clear();
    window.location.reload();
  }
}

// Toast
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

// Logout
window.logout = () => {
  localStorage.clear();
  window.location.href = 'index.html';
};
