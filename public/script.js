// Client-side Auth Management
let authToken = null;

// Initialize auth state
document.addEventListener('DOMContentLoaded', () => {
  authToken = localStorage.getItem('token');
  if (authToken) checkTokenValidity();
});

// Form Navigation
function showForm(formId) {
  document.querySelectorAll('.form').forEach(form => form.style.display = 'none');
  document.getElementById(formId).style.display = 'block';
}

// API Request Handler
async function apiRequest(url, method, body) {
  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Request failed');
    return data;
  } catch (error) {
    throw new Error(error.message);
  }
}

// Signup Handler
async function signup() {
  try {
    const userData = {
      username: document.getElementById('signup-username').value,
      email: document.getElementById('signup-email').value,
      password: document.getElementById('signup-password').value,
      refcode: document.getElementById('signup-refcode').value
    };

    const response = await apiRequest('/api/signup', 'POST', userData);
    
    localStorage.setItem('token', response.token);
    localStorage.setItem('userId', response.user.id);
    localStorage.setItem('username', response.user.username);
    
    alert('Registration successful! Redirecting...');
    window.location.href = 'dashboard.html';
  } catch (error) {
    alert(`Signup failed: ${error.message}`);
  }
}

// Login Handler
async function login() {
  try {
    const credentials = {
      username: document.getElementById('login-username').value,
      password: document.getElementById('login-password').value
    };

    const response = await apiRequest('/api/login', 'POST', credentials);
    
    localStorage.setItem('token', response.token);
    localStorage.setItem('userId', response.user.id);
    localStorage.setItem('username', response.user.username);
    
    alert('Login successful! Redirecting...');
    window.location.href = 'dashboard.html';
  } catch (error) {
    alert(`Login failed: ${error.message}`);
  }
}

// Password Reset Handler
async function resetPassword() {
  try {
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    if (newPassword !== confirmPassword) throw new Error('Passwords do not match');

    await apiRequest('/api/reset-password', 'POST', { newPassword });
    
    document.getElementById('password-success').textContent = 'Password updated successfully!';
    document.getElementById('password-success').style.display = 'block';
    setTimeout(() => showForm('login-form'), 1500);
  } catch (error) {
    document.getElementById('password-error').textContent = error.message;
    document.getElementById('password-error').style.display = 'block';
  }
}

// Token Validation
function checkTokenValidity() {
  try {
    const payload = JSON.parse(atob(authToken.split('.')[1]));
    if (payload.exp * 1000 < Date.now()) {
      localStorage.clear();
      window.location.reload();
    }
  } catch (error) {
    localStorage.clear();
    window.location.reload();
  }
}

// Auto-redirect if logged in
if (window.location.pathname === '/index.html' && authToken) {
  window.location.href = 'dashboard.html';
}