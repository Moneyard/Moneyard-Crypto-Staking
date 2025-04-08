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
  document.querySelectorAll('.form').forEach(form => {
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

// Signup Handler
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

    // Client-side validation
    if (!userData.username || !userData.email || !userData.password) {
      throw new Error('All fields marked with * are required');
    }

    const response = await apiRequest('/signup', 'POST', userData);
    
    localStorage.setItem('token', response.token);
    localStorage.setItem('userId', response.user.id);
    localStorage.setItem('username', response.user.username);
    authToken = response.token;
    
    showToast('Registration successful! Redirecting...', 'success');
    setTimeout(() => window.location.href = 'dashboard.html', 1500);
  } catch (error) {
    showToast(`Signup failed: ${error.message}`, 'error');
  } finally {
    loader.style.display = 'none';
  }
}

// Login Handler
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
  } catch (error) {
    const message = error.status === 401 ? 'Invalid username or password' : error.message;
    showToast(`Login failed: ${message}`, 'error');
  } finally {
    loader.style.display = 'none';
  }
}

// Password Reset Handler
async function resetPassword() {
  const loader = document.getElementById('reset-password-loader');
  try {
    loader.style.display = 'block';
    
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    if (newPassword !== confirmPassword) {
      throw new Error('Password confirmation does not match');
    }

    await apiRequest('/reset-password', 'POST', { newPassword });
    
    document.getElementById('password-success').textContent = 'Password updated successfully!';
    document.getElementById('password-success').style.display = 'block';
    setTimeout(() => showForm('login-form'), 1500);
  } catch (error) {
    document.getElementById('password-error').textContent = error.message;
    document.getElementById('password-error').style.display = 'block';
  } finally {
    loader.style.display = 'none';
  }
}

// Token Management
function checkTokenValidity() {
  try {
    const payload = JSON.parse(atob(authToken.split('.')[1]));
    const isExpired = payload.exp * 1000 < Date.now();
    
    if (isExpired) {
      localStorage.clear();
      authToken = null;
      window.location.reload();
    }
  } catch (error) {
    localStorage.clear();
    authToken = null;
    window.location.reload();
  }
}

// UI Helpers
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => toast.remove(), 5000);
}

// Auto-redirect Logic
if (window.location.pathname.endsWith('index.html') && authToken) {
  window.location.href = 'dashboard.html';
}

// Logout Functionality
window.logout = () => {
  localStorage.clear();
  authToken = null;
  window.location.href = 'index.html';
};