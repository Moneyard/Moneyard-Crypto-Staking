// Unified Form Navigation
function showForm(formId) {
  document.querySelectorAll('.form').forEach(form => form.style.display = 'none');
  document.getElementById(formId).style.display = 'block';
}

// Signup handler (Uses server API)
async function signup() {
  const username = document.getElementById('signup-username').value;
  const email = document.getElementById('signup-email').value;
  const password = document.getElementById('signup-password').value;
  const refcode = document.getElementById('signup-refcode').value;

  try {
    if (!username || !email || !password) {
      throw new Error('All required fields must be filled');
    }

    const response = await fetch('/api/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password, refcode })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Signup failed');

    alert('Registration successful! Please login.');
    showForm('login-form');
  } catch (error) {
    alert(error.message);
    console.error('Signup Error:', error);
  }
}

// Login handler (Uses server API)
async function login() {
  const username = document.getElementById('login-username').value;
  const password = document.getElementById('login-password').value;

  try {
    if (!username || !password) {
      throw new Error('Please enter both username and password');
    }

    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Login failed');

    // Save userId and username
    localStorage.setItem('userId', data.userId);
    localStorage.setItem('username', username);
    window.location.href = 'dashboard.html';
  } catch (error) {
    alert(error.message);
    console.error('Login Error:', error);
  }
}

// Password Reset (Local only)
function resetPassword() {
  const email = document.getElementById('recovery-email').value;
  const newPassword = document.getElementById('new-password').value;
  const confirmPassword = document.getElementById('confirm-password').value;

  try {
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
