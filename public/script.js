// For Sign Up
function signup() {
  const username = document.getElementById('signup-username').value;
  const password = document.getElementById('signup-password').value;
  const refcode = document.getElementById('signup-refcode').value;

  if (username && password) {
    // Send the sign-up data to the server
    fetch('/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, refcode })
    })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          alert("Sign Up Successful! You can now log in.");
          toggleForms();  // Hide sign-up form, show login form
        } else {
          alert(data.message);
        }
      })
      .catch(error => {
        console.error('Error:', error);
        alert('Sign up failed. Please try again.');
      });
  } else {
    alert("Please fill in all the required fields.");
  }
}

// For Login
function login() {
  const username = document.getElementById('login-username').value;
  const password = document.getElementById('login-password').value;

  if (username && password) {
    // Send the login data to the server
    fetch('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          localStorage.setItem('userId', data.userId); // Store user ID in localStorage
          window.location.href = '/dashboard'; // Redirect to dashboard
        } else {
          alert('Invalid credentials');
        }
      })
      .catch(error => {
        console.error('Error:', error);
        alert('Login failed. Please try again.');
      });
  } else {
    alert("Please fill in all the required fields.");
  }
}

// Toggling Forms between SignUp and Login
function toggleForms() {
  const signupForm = document.getElementById('signup-form');
  const loginForm = document.getElementById('login-form');

  signupForm.style.display = signupForm.style.display === 'none' ? 'block' : 'none';
  loginForm.style.display = loginForm.style.display === 'none' ? 'block' : 'none';
}
