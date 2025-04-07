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
    fetch('/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        alert('Signup successful! Please login.');
        toggleForms();
      } else {
        alert(data.error || 'Signup failed.');
      }
    })
    .catch(err => {
      alert('Error during signup: ' + err.message);
    });
  } else {
    alert('Please fill in all required fields.');
  }
}

// Login handler
function login() {
  const username = document.getElementById('login-username').value;
  const password = document.getElementById('login-password').value;

  if (username && password) {
    fetch('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        localStorage.setItem('token', data.token);
        window.location.href = 'dashboard.html';
      } else {
        alert(data.error || 'Login failed.');
      }
    })
    .catch(err => {
      alert('Error during login: ' + err.message);
    });
  } else {
    alert('Please fill in all required fields.');
  }
}

// Fetch user info and load username
function loadUserSummary() {
  const token = localStorage.getItem('token');
  if (!token) {
    alert('Please log in to view your account.');
    window.location.href = 'index.html'; // Redirect to login if not logged in
    return;
  }

  fetch('/user-info', {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` },
  })
  .then(res => res.json())
  .then(data => {
    if (data.username) {
      document.getElementById('summary-username').innerText = data.username;
    } else {
      alert('Failed to load user info.');
    }
  })
  .catch(err => {
    console.error('Error loading user info:', err);
    alert('Error loading user info.');
  });
}

// Check if the user is logged in (i.e., token exists in localStorage)
function isUserLoggedIn() {
  const token = localStorage.getItem('token');
  return token !== null;
}

// On DOMContentLoaded, call the function to load user summary if logged in
document.addEventListener("DOMContentLoaded", function () {
  if (isUserLoggedIn()) {
    loadUserSummary();
  } else {
    console.log('User is not logged in. Skipping user summary load.');
  }
});
