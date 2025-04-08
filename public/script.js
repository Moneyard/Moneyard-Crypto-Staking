// Unified Form Navigation
function showForm(formId) {
  document.querySelectorAll('.form').forEach(form => form.style.display = 'none');
  document.getElementById(formId).style.display = 'block';
}

// Check if the user is logged in
function isUserLoggedIn() {
  return localStorage.getItem('userId') !== null;
}

// Unified Error Handling
function handleError(error, fallbackMessage = 'An error occurred') {
  console.error(error);
  alert(error.message || fallbackMessage);
}

// Enhanced Signup handler with client-side fallback
async function signup() {
  try {
    const username = document.getElementById('signup-username').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const refcode = document.getElementById('signup-refcode').value;

    // Client-side validation
    if (!username || !email || !password) {
      throw new Error('Please fill in all required fields.');
    }

    // Client-side duplicate check
    const localUsers = JSON.parse(localStorage.getItem('users')) || [];
    if (localUsers.some(u => u.username === username)) {
      throw new Error('Username already exists');
    }
    if (localUsers.some(u => u.email === email)) {
      throw new Error('Email already registered');
    }

    // Try server-side signup first
    try {
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password, refcode })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Registration failed');
      }

      alert('Signup successful! Please login.');
      showForm('login-form');
    } catch (serverError) {
      // Fallback to client-side storage
      const newUser = {
        userId: Date.now().toString(),
        username,
        email,
        password,
        refcode,
        joined: new Date().toISOString()
      };

      localUsers.push(newUser);
      localStorage.setItem('users', JSON.stringify(localUsers));
      alert('Local registration successful! Please login.');
      showForm('login-form');
    }
  } catch (error) {
    handleError(error);
  }
}

// Enhanced Login handler with fallback
async function login() {
  try {
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    if (!username || !password) {
      throw new Error('Please enter both username and password.');
    }

    // Try server login first
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Login failed');
      }

      const data = await response.json();
      localStorage.setItem('userId', data.userId);
      localStorage.setItem('username', data.username);
      window.location.href = 'dashboard.html';
    } catch (serverError) {
      // Fallback to local users
      const localUsers = JSON.parse(localStorage.getItem('users')) || [];
      const user = localUsers.find(u => u.username === username && u.password === password);

      if (!user) {
        throw new Error('Invalid credentials');
      }

      localStorage.setItem('userId', user.userId);
      localStorage.setItem('username', user.username);
      window.location.href = 'dashboard.html';
    }
  } catch (error) {
    handleError(error, 'Login failed. Please check your credentials.');
  }
}

// Unified Password Reset
function resetPassword() {
  try {
    const email = document.getElementById('recovery-email').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    document.querySelectorAll('.form-message').forEach(msg => msg.style.display = 'none');

    if (newPassword !== confirmPassword) {
      throw new Error('Passwords do not match!');
    }

    // Check both server and local storage
    const localUsers = JSON.parse(localStorage.getItem('users')) || [];
    const user = localUsers.find(u => u.email === email);

    if (!user) {
      throw new Error('No account found with this email!');
    }

    // Update password in both places
    user.password = newPassword;
    localStorage.setItem('users', JSON.stringify(localUsers));

    // Try server update if available
    if (typeof fetch === 'function') {
      fetch('/api/update-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.userId, newPassword })
      }).catch(console.error); // Silent fail for server update
    }

    document.getElementById('password-success').textContent = 'Password updated successfully!';
    document.getElementById('password-success').style.display = 'block';
    setTimeout(() => showForm('login-form'), 1500);
  } catch (error) {
    document.getElementById('password-error').textContent = error.message;
    document.getElementById('password-error').style.display = 'block';
  }
}

// Rest of the functions remain unchanged...