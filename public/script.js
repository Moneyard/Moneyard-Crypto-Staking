// Toggle between Sign Up and Login Forms
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

// Sign-Up Function
function signup() {
  const username = document.getElementById('signup-username').value;
  const password = document.getElementById('signup-password').value;
  const refcode = document.getElementById('signup-refcode').value;

  // Validate fields
  if (!username || !password) {
    alert('Username and password are required.');
    return;
  }

  // Send sign-up request to the backend
  fetch('/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, refcode })
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      alert('Sign up successful!');
      toggleForms(); // Switch to Login form
    } else {
      alert('Sign up failed: ' + data.error);
    }
  })
  .catch(error => {
    console.error('Error during sign-up:', error);
    alert('An error occurred during sign up');
  });
}

// Login Function
function login() {
  const username = document.getElementById('login-username').value;
  const password = document.getElementById('login-password').value;

  // Send login request to the backend
  fetch('/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      alert('Login successful!');
      // Optionally redirect to the dashboard or home page
    } else {
      alert('Login failed: ' + data.error);
    }
  })
  .catch(error => {
    console.error('Error during login:', error);
    alert('An error occurred during login');
  });
}
