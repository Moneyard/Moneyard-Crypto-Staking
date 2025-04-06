// Toggle between Sign Up and Login forms
function toggleForms() {
  const signupForm = document.getElementById('signup-form');
  const loginForm = document.getElementById('login-form');

  if (signupForm.style.display === 'none') {
    signupForm.style.display = 'block';
    loginForm.style.display = 'none';
  } else {
    signupForm.style.display = 'none';
    loginForm.style.display = 'block';
  }
}

// Handle sign up
function signup() {
  const username = document.getElementById('signup-username').value;
  const password = document.getElementById('signup-password').value;
  const email = document.getElementById('signup-email').value;

  const data = { username, password, email };

  fetch('/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  .then(response => response.json())
  .then(data => {
    if (data.message) {
      alert(data.message);
      toggleForms(); // Switch to login form after successful sign up
    } else {
      alert('Error: ' + data.error);
    }
  })
  .catch(error => console.error('Error:', error));
}

// Handle login
function login() {
  const username = document.getElementById('login-username').value;
  const password = document.getElementById('login-password').value;

  const data = { username, password };

  fetch('/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  .then(response => response.json())
  .then(data => {
    if (data.token) {
      alert('Login successful!');
      localStorage.setItem('token', data.token); // Store token
      window.location.href = '/dashboard'; // Redirect to dashboard
    } else {
      alert('Error: ' + data.error);
    }
  })
  .catch(error => console.error('Error:', error));
}

// Handle password reset request
function forgotPassword() {
  const email = prompt('Enter your email for password reset:');
  
  if (!email) {
    alert('Email is required!');
    return;
  }

  fetch('/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  })
  .then(response => response.json())
  .then(data => {
    alert(data.message);
  })
  .catch(error => console.error('Error:', error));
}
