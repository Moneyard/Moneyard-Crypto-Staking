// script.js

// Toggle between Sign Up and Login forms
function toggleForm() {
  document.getElementById('sign-up-form').style.display = 
    document.getElementById('sign-up-form').style.display === 'none' ? 'block' : 'none';
  document.getElementById('login-form').style.display = 
    document.getElementById('login-form').style.display === 'none' ? 'block' : 'none';
}

// Handle Registration
document.getElementById('register-form').addEventListener('submit', function (e) {
  e.preventDefault();
  
  const username = document.getElementById('username').value;
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  fetch('/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password })
  })
  .then(response => response.json())
  .then(data => alert(data.message))
  .catch(error => alert('Error: ' + error.message));
});

// Handle Login
document.getElementById('login-form-submit').addEventListener('submit', function (e) {
  e.preventDefault();
  
  const username = document.getElementById('login-username').value;
  const password = document.getElementById('login-password').value;

  fetch('/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  })
  .then(response => response.json())
  .then(data => {
    if (data.token) {
      localStorage.setItem('token', data.token);
      alert('Logged in successfully');
    } else {
      alert('Login failed');
    }
  })
  .catch(error => alert('Error: ' + error.message));
});

// Reset Password
function resetPassword() {
  const email = prompt('Enter your email to reset password:');
  if (email) {
    fetch('/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    })
    .then(response => response.json())
    .then(data => alert(data.message))
    .catch(error => alert('Error: ' + error.message));
  }
}
