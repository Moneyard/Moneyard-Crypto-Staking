// === Utils ===
function getToken() {
  return localStorage.getItem('token');
}

function setToken(token) {
  localStorage.setItem('token', token);
}

function removeToken() {
  localStorage.removeItem('token');
}

function getUserEmail() {
  return localStorage.getItem('userEmail') || '';
}

function setUserEmail(email) {
  localStorage.setItem('userEmail', email);
}

function removeUserEmail() {
  localStorage.removeItem('userEmail');
}

function authHeaders() {
  const token = getToken();
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

// === Signup ===
async function handleSignup(event) {
  event.preventDefault();

  const email = document.getElementById('signupEmail').value.trim();
  const password = document.getElementById('signupPassword').value.trim();
  const refCode = document.getElementById('signupRefCode')?.value.trim() || '';

  if (!email || !password) {
    alert('Please fill email and password.');
    return;
  }

  try {
    const res = await fetch('/api/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, refCode })
    });
    const data = await res.json();

    if (data.success) {
      alert('Signup successful! Please login.');
      toggleForms('login');
      document.getElementById('loginEmail').value = email;
    } else {
      alert(data.message || 'Signup failed.');
    }
  } catch (err) {
    console.error('Signup error:', err);
    alert('Signup error occurred.');
  }
}

// === Login ===
async function handleLogin(event) {
  event.preventDefault();

  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value.trim();
  const rememberMe = document.getElementById('rememberMe')?.checked || false;

  if (!email || !password) {
    alert('Please enter email and password.');
    return;
  }

  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();

    if (data.success && data.token) {
      setToken(data.token);
      if (rememberMe) setUserEmail(email);
      else removeUserEmail();
      window.location.href = 'dashboard.html';
    } else {
      alert(data.message || 'Login failed.');
    }
  } catch (err) {
    console.error('Login error:', err);
    alert('Login error occurred.');
  }
}

// === Token-based login (raw version for compatibility) ===
function legacyLogin(email, password) {
  fetch('/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })
  .then(res => res.json())
  .then(data => {
    if (data.token) {
      localStorage.setItem('token', data.token);
      window.location.href = '/dashboard.html';
    } else {
      alert('Login failed');
    }
  });
}

// === Auth check on dashboard load ===
function checkDashboardAuth() {
  fetch('/dashboard', {
    method: 'GET',
    headers: {
      'Authorization': 'Bearer ' + localStorage.getItem('token')
    }
  })
  .then(res => {
    if (res.status !== 200) {
      alert('Unauthorized. Please log in.');
      window.location.href = '/index.html';
    }
  });
}

// === Logout ===
function handleLogout() {
  removeToken();
  window.location.href = 'index.html';
}

// === Toggle Signup/Login Forms ===
function toggleForms(formToShow) {
  const signupForm = document.getElementById('signupForm');
  const loginForm = document.getElementById('loginForm');

  if (formToShow === 'signup') {
    signupForm.style.display = 'block';
    loginForm.style.display = 'none';
  } else {
    signupForm.style.display = 'none';
    loginForm.style.display = 'block';
  }
}

// === Deposit Submit ===
async function handleDeposit(event) {
  event.preventDefault();

  const amount = parseFloat(document.getElementById('depositAmount').value);
  const method = document.getElementById('depositNetwork').value.trim();
  const txId = document.getElementById('depositTxId').value.trim();

  if (!amount || amount <= 0 || !method || !txId) {
    alert('Please fill all deposit fields correctly.');
    return;
  }

  try {
    const res = await fetch('/api/deposit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders()
      },
      body: JSON.stringify({ amount, method, txId })
    });
    const data = await res.json();

    if (data.success) {
      alert('Deposit submitted successfully. Await admin approval.');
      document.getElementById('depositForm').reset();
      loadUserBalance();
      loadTransactionHistory();
    } else {
      alert(data.message || 'Deposit failed.');
    }
  } catch (err) {
    console.error('Deposit error:', err);
    alert('Deposit error occurred.');
  }
}

// === Withdraw Submit ===
async function handleWithdraw(event) {
  event.preventDefault();

  const amount = parseFloat(document.getElementById('withdrawAmount').value);
  const password = document.getElementById('withdrawPassword').value.trim();

  if (!amount || amount <= 0 || !password) {
    alert('Please fill all withdrawal fields correctly.');
    return;
  }

  try {
    const res = await fetch('/api/withdraw', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders()
      },
      body: JSON.stringify({ amount, password })
    });
    const data = await res.json();

    if (data.success) {
      alert('Withdrawal requested successfully. Await admin approval.');
      document.getElementById('withdrawForm').reset();
      loadUserBalance();
      loadTransactionHistory();
    } else {
      alert(data.message || 'Withdrawal failed.');
    }
  } catch (err) {
    console.error('Withdrawal error:', err);
    alert('Withdrawal error occurred.');
  }
}

// === Load User Balance & Summary ===
async function loadUserBalance() {
  try {
    const res = await fetch('/api/user/summary', {
      headers: authHeaders()
    });
    const data = await res.json();

    if (data.success) {
      document.getElementById('balance').textContent = data.balance.toFixed(2);
      document.getElementById('totalDeposits').textContent = data.totalDeposits.toFixed(2);
      document.getElementById('totalWithdrawals').textContent = data.totalWithdrawals.toFixed(2);
    } else {
      console.warn('Failed to load user summary.');
    }
  } catch (err) {
    console.error('Error loading user summary:', err);
  }
}

// === Load Transaction History ===
async function loadTransactionHistory() {
  try {
    const res = await fetch('/api/transactions', {
      headers: authHeaders()
    });
    const txs = await res.json();

    const container = document.getElementById('transactionHistory');
    container.innerHTML = '';

    if (!txs.length) {
      container.innerHTML = '<p>No transactions yet.</p>';
      return;
    }

    txs.forEach(tx => {
      const div = document.createElement('div');
      div.className = 'transaction';
      div.innerHTML = `
        <p>Type: ${tx.type}</p>
        <p>Amount: ${tx.amount.toFixed(2)}</p>
        <p>Status: ${tx.status}</p>
        <p>Date: ${new Date(tx.created_at).toLocaleString()}</p>
      `;
      container.appendChild(div);
    });
  } catch (err) {
    console.error('Error loading transaction history:', err);
  }
}

// === Admin: Load Pending Deposits ===
async function loadAdminDeposits() {
  try {
    const res = await fetch('/api/admin/deposits', {
      headers: authHeaders()
    });
    const deposits = await res.json();

    const tableBody = document.getElementById('depositTableBody');
    tableBody.innerHTML = '';

    if (!deposits.length) {
      tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No pending deposits.</td></tr>';
      return;
    }

    deposits.forEach(dep => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${dep.amount.toFixed(2)}</td>
        <td>${dep.method}</td>
        <td>${dep.tx_id}</td>
        <td>${dep.status}</td>
        <td><button onclick="approveDeposit(${dep.id})">Approve</button></td>
        <td><button onclick="rejectDeposit(${dep.id})">Reject</button></td>
      `;
      tableBody.appendChild(tr);
    });
  } catch (err) {
    console.error('Error loading admin deposits:', err);
  }
}

async function approveDeposit(id) {
  try {
    const res = await fetch(`/api/admin/deposits/${id}/approve`, {
      method: 'POST',
      headers: authHeaders()
    });
    const data = await res.json();
    if (data.message) alert(data.message);
    loadAdminDeposits();
  } catch (err) {
    console.error('Error approving deposit:', err);
  }
}

async function rejectDeposit(id) {
  try {
    const res = await fetch(`/api/admin/deposits/${id}/reject`, {
      method: 'POST',
      headers: authHeaders()
    });
    const data = await res.json();
    if (data.message) alert(data.message);
    loadAdminDeposits();
  } catch (err) {
    console.error('Error rejecting deposit:', err);
  }
}

// === Page Initialization ===
window.onload = () => {
  document.getElementById('loginEmail').value = getUserEmail();

  document.getElementById('signupForm')?.addEventListener('submit', handleSignup);
  document.getElementById('loginForm')?.addEventListener('submit', handleLogin);
  document.getElementById('depositForm')?.addEventListener('submit', handleDeposit);
  document.getElementById('withdrawForm')?.addEventListener('submit', handleWithdraw);

  if (document.body.id === 'dashboardPage') {
    checkDashboardAuth();
    loadUserBalance();
    loadTransactionHistory();
  }

  if (document.body.id === 'adminPage') {
    loadAdminDeposits();
  }
};
// Example login code in script.js
async function handleLogin(event) {
  event.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;

  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (data.success) {
      // Save token before redirecting
      localStorage.setItem('token', data.token);
      window.location.href = '/dashboard';
    } else {
      alert(data.message || 'Login failed');
    }
  } catch (err) {
    console.error('Login error:', err);
    alert('Login failed');
  }
}
