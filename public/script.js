// Show Signup/Login Forms
function showForm(formId) {
  document.querySelectorAll('.form').forEach(form => form.style.display = 'none');
  document.getElementById(formId).style.display = 'block';
}

// SIGNUP - Send data to backend
async function signup() {
  const username = document.getElementById('signup-username').value;
  const email = document.getElementById('signup-email').value;
  const password = document.getElementById('signup-password').value;
  const refcode = document.getElementById('signup-refcode').value;

  if (!username || !email || !password) {
    alert("Please fill in all required fields.");
    return;
  }

  try {
    const response = await fetch('/api/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password, refcode })
    });

    const data = await response.json();

    if (response.ok) {
      alert("Registration successful! Please log in.");
      showForm('login-form');
    } else {
      alert(data.error || "Signup failed.");
    }
  } catch (err) {
    console.error("Signup Error:", err);
    alert("Server error. Please try again later.");
  }
}

// LOGIN - Send data to backend
async function login() {
  const username = document.getElementById('login-username').value;
  const password = document.getElementById('login-password').value;

  if (!username || !password) {
    alert("Please enter both username and password.");
    return;
  }

  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();

    if (response.ok) {
      localStorage.setItem('userId', data.userId);
      localStorage.setItem('username', username);
      window.location.href = 'dashboard.html';
    } else {
      alert(data.error || "Login failed.");
    }
  } catch (err) {
    console.error("Login Error:", err);
    alert("Server error. Please try again later.");
  }
}

// RESET PASSWORD (Still using localStorage for now)
function resetPassword() {
  const email = document.getElementById('recovery-email').value;
  const newPassword = document.getElementById('new-password').value;
  const confirmPassword = document.getElementById('confirm-password').value;

  try {
    document.querySelectorAll('.form-message').forEach(msg => msg.style.display = 'none');

    if (newPassword !== confirmPassword) {
      throw new Error('Passwords do not match');
    }

    const users = JSON.parse(localStorage.getItem('users')) || [];
    const userIndex = users.findIndex(u => u.email === email);

    if (userIndex === -1) {
      throw new Error('No account found with this email');
    }

    users[userIndex].password = newPassword;
    localStorage.setItem('users', JSON.stringify(users));

    document.getElementById('password-success').textContent = 'Password updated successfully!';
    document.getElementById('password-success').style.display = 'block';
    setTimeout(() => showForm('login-form'), 1500);

  } catch (error) {
    document.getElementById('password-error').textContent = error.message;
    document.getElementById('password-error').style.display = 'block';
  }
}
