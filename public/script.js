// Toggle between the Sign Up and Login forms
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

// Sign up function
async function signup() {
  const username = document.getElementById('signup-username').value;
  const password = document.getElementById('signup-password').value;
  const refCode = document.getElementById('signup-refcode').value;

  if (!username || !password) {
    alert('Please enter both a username and password.');
    return;
  }

  try {
    const response = await fetch('/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password, refCode }),
    });

    const result = await response.json();
    if (result.success) {
      alert('Sign up successful! Please log in.');
      toggleForms();
    } else {
      alert('An error occurred during sign up: ' + result.error);
    }
  } catch (error) {
    console.error('Error:', error);
    alert('An error occurred during sign up.');
  }
}

// Login function
async function login() {
  const username = document.getElementById('login-username').value;
  const password = document.getElementById('login-password').value;

  if (!username || !password) {
    alert('Please enter both username and password.');
    return;
  }

  try {
    const response = await fetch('/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    const result = await response.json();
    if (result.success) {
      window.location.href = '/dashboard.html'; // Redirect to dashboard
    } else {
      alert('Invalid username or password.');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('An error occurred during login.');
  }
}
