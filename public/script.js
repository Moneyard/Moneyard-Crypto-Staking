// Toggle between signup and login forms
function toggleForms() {
  const signupForm = document.getElementById('signup-form');
  const loginForm = document.getElementById('login-form');

  signupForm.style.display = signupForm.style.display === 'none' ? 'block' : 'none';
  loginForm.style.display = loginForm.style.display === 'none' ? 'block' : 'none';
}

// Signup handler
function signup(event) {
  event.preventDefault();  // Prevent the form from refreshing the page

  const username = document.getElementById('signup-username').value;
  const password = document.getElementById('signup-password').value;

  if (username && password) {
    // Send signup request to server
    fetch('https://moneyard-backend-431ef6895316.herokuapp.com/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
    .then(res => res.json())
    .then(data => {
      if (data.message === 'Signup successful') {
        alert("Signup successful! Please login.");
        toggleForms();
      } else {
        alert(data.error);
      }
    })
    .catch(err => {
      console.error('Error during signup:', err);
      alert("Signup failed. Please try again.");
    });
  } else {
    alert("Please fill in all required fields.");
  }
}

// Login handler
function login(event) {
  event.preventDefault();  // Prevent the form from refreshing the page

  const username = document.getElementById('login-username').value;
  const password = document.getElementById('login-password').value;

  if (username && password) {
    // Send login request to server
    fetch('https://moneyard-backend-431ef6895316.herokuapp.com/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
    .then(res => res.json())
    .then(data => {
      if (data.message === 'Login successful') {
        localStorage.setItem('userId', data.userId);
        window.location.href = "dashboard.html";
      } else {
        alert(data.error);
      }
    })
    .catch(err => {
      console.error('Error during login:', err);
      alert("Login failed. Please try again.");
    });
  } else {
    alert("Please enter your username and password.");
  }
}

// Add event listeners to Sign Up and Login buttons
document.getElementById('signup-button').addEventListener('click', signup);
document.getElementById('login-button').addEventListener('click', login);

// Call toggleForms when the page loads to ensure the correct form is shown
document.addEventListener("DOMContentLoaded", function () {
  toggleForms();
});
