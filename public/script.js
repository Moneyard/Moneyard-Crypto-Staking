document.getElementById('show-login').addEventListener('click', () => {
  document.getElementById('signup-box').classList.add('hidden');
  document.getElementById('login-box').classList.remove('hidden');
});

document.getElementById('show-signup').addEventListener('click', () => {
  document.getElementById('login-box').classList.add('hidden');
  document.getElementById('signup-box').classList.remove('hidden');
});

document.getElementById('register-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('register-username').value;
  const password = document.getElementById('register-password').value;

  const response = await fetch('/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  const data = await response.json();
  alert(data.message || data.error);

  if (data.message) {
    document.getElementById('register-form').reset();
    document.getElementById('signup-box').classList.add('hidden');
    document.getElementById('login-box').classList.remove('hidden');
  }
});

document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('login-username').value;
  const password = document.getElementById('login-password').value;

  const response = await fetch('/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  const data = await response.json();
  alert(data.message || data.error);

  if (data.token) {
    localStorage.setItem('token', data.token);
    window.location.href = '/dashboard.html'; // Create this later if needed
  }
});
