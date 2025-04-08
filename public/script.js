// Unified Form Navigation
function showForm(formId) {
  document.querySelectorAll('.form').forEach(form => form.style.display = 'none');
  document.getElementById(formId).style.display = 'block';
}

// User Management System
const userManager = {
  getUsers: () => JSON.parse(localStorage.getItem('users')) || [],
  saveUser: (user) => {
    const users = userManager.getUsers();
    users.push(user);
    localStorage.setItem('users', JSON.stringify(users));
  },
  findUser: (username) => userManager.getUsers().find(u => u.username === username),
  findUserByEmail: (email) => userManager.getUsers().find(u => u.email === email)
};

// Signup handler (Client-side only)
function signup() {
  const username = document.getElementById('signup-username').value;
  const email = document.getElementById('signup-email').value;
  const password = document.getElementById('signup-password').value;
  const refcode = document.getElementById('signup-refcode').value;

  try {
    // Validation
    if (!username || !email || !password) {
      throw new Error('All required fields must be filled');
    }

    // Check existing users
    if (userManager.findUser(username)) {
      throw new Error('Username already exists');
    }
    if (userManager.findUserByEmail(email)) {
      throw new Error('Email already registered');
    }

    // Create new user
    const newUser = {
      userId: Date.now().toString(),
      username,
      email,
      password,
      refcode,
      joined: new Date().toISOString(),
      balance: 0,
      deposits: []
    };

    userManager.saveUser(newUser);
    alert('Registration successful! Please login.');
    showForm('login-form');

  } catch (error) {
    alert(error.message);
    console.error('Signup Error:', error);
  }
}

// Login handler (Client-side only)
function login() {
  const username = document.getElementById('login-username').value;
  const password = document.getElementById('login-password').value;

  try {
    if (!username || !password) {
      throw new Error('Please enter both username and password');
    }

    const user = userManager.findUser(username);
    
    if (!user || user.password !== password) {
      throw new Error('Invalid credentials');
    }

    localStorage.setItem('userId', user.userId);
    localStorage.setItem('username', user.username);
    window.location.href = 'dashboard.html';

  } catch (error) {
    alert(error.message);
    console.error('Login Error:', error);
  }
}

// Password Reset (Client-side only)
function resetPassword() {
  const email = document.getElementById('recovery-email').value;
  const newPassword = document.getElementById('new-password').value;
  const confirmPassword = document.getElementById('confirm-password').value;

  try {
    // Clear messages
    document.querySelectorAll('.form-message').forEach(msg => msg.style.display = 'none');

    // Validation
    if (newPassword !== confirmPassword) {
      throw new Error('Passwords do not match');
    }

    const users = userManager.getUsers();
    const userIndex = users.findIndex(u => u.email === email);

    if (userIndex === -1) {
      throw new Error('No account found with this email');
    }

    // Update password
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

// Rest of your existing functions (deposit, transactions, etc.) remain unchanged