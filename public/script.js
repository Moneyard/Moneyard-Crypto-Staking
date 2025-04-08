// Toggle between signup and login forms
function toggleForms() {
  const signupForm = document.getElementById('signup-form');
  const loginForm = document.getElementById('login-form');

  signupForm.style.display = signupForm.style.display === 'none' ? 'block' : 'none';
  loginForm.style.display = loginForm.style.display === 'none' ? 'block' : 'none';
}

// Signup handler
async function signup(event) {
  event.preventDefault();  // Prevent form submission

  const username = document.getElementById('signup-username').value;
  const password = document.getElementById('signup-password').value;

  if (username && password) {
    // Call the backend API to create a new user
    const response = await fetch('/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    const result = await response.json();
    if (result.success) {
      alert("Signup successful! Please login.");
      toggleForms();
    } else {
      alert(result.error || "Signup failed.");
    }
  } else {
    alert("Please fill in all required fields.");
  }
}

// Login handler
async function login(event) {
  event.preventDefault();  // Prevent form submission

  const username = document.getElementById('login-username').value;
  const password = document.getElementById('login-password').value;

  // Call the backend API to login the user
  const response = await fetch('/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  });

  const result = await response.json();
  if (result.success) {
    localStorage.setItem('userId', result.userId);
    window.location.href = "dashboard.html";
  } else {
    alert(result.error || "Login failed.");
  }
}

// Add event listeners for form buttons
document.getElementById('signup-button').addEventListener('click', signup);
document.getElementById('login-button').addEventListener('click', login);
