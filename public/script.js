// Toggle between signup and login forms
function toggleForms() {
  const signupForm = document.getElementById('signup-form');
  const loginForm = document.getElementById('login-form');

  signupForm.style.display = signupForm.style.display === 'none' ? 'block' : 'none';
  loginForm.style.display = loginForm.style.display === 'none' ? 'block' : 'none';
}

// Signup handler
function signup() {
  const username = document.getElementById('signup-username').value;
  const password = document.getElementById('signup-password').value;

  if (username && password) {
    localStorage.setItem('username', username);
    localStorage.setItem('password', password);
    alert("Signup successful! Please login.");
    toggleForms();
  } else {
    alert("Please fill in all required fields.");
  }
}

// Login handler
function login() {
  const username = document.getElementById('login-username').value;
  const password = document.getElementById('login-password').value;

  const storedUser = localStorage.getItem('username');
  const storedPass = localStorage.getItem('password');

  if (username === storedUser && password === storedPass) {
    localStorage.setItem('userId', 1); // Static userId for now
    window.location.href = "dashboard.html";
  } else {
    alert("Invalid credentials. Please try again.");
  }
}

// Fetch deposit address
function getDepositAddress() {
  const network = document.getElementById('network').value;
  const userId = localStorage.getItem('userId') || 1;

  fetch('/get-deposit-address', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, network })
  })
    .then(res => res.json())
    .then(data => {
      if (data.address) {
        document.getElementById('deposit-address').innerText = 'Send USDT to: ' + data.address;
      } else {
        alert(data.error || "Something went wrong.");
      }
    });
}

// Log deposit
function logDeposit() {
  const userId = localStorage.getItem('userId') || 1;
  const amount = parseFloat(document.getElementById('deposit-amount').value);
  const txId = document.getElementById('txId').value;
  const network = document.getElementById('network').value;

  if (!amount || amount < 15 || amount > 1000) {
    alert("Enter a valid amount between 15 and 1000 USDT.");
    return;
  }

  if (!txId) {
    alert("Please enter the transaction ID.");
    return;
  }

  fetch('/log-deposit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, amount, network, txId })
  })
    .then(res => res.json())
    .then(data => {
      alert(data.message || data.error);
    });
}

// Calculate earnings (8% daily)
function calculateEarnings() {
  const depositAmount = parseFloat(document.getElementById('deposit-input').value);

  if (!depositAmount || depositAmount < 15 || depositAmount > 1000) {
    alert("Please enter a valid deposit amount between 15 and 1000 USDT.");
    return;
  }

  const dailyEarnings = depositAmount * 0.08; // 8% daily earnings
  const earningsMessage = `Your daily earnings are: ${dailyEarnings.toFixed(2)} USDT.`;

  document.getElementById('calculated-earnings').innerText = earningsMessage;
}

// Admin: Fetch all pending withdrawals
function fetchPendingWithdrawals() {
  fetch('/admin/withdrawals')
    .then(res => res.json())
    .then(data => {
      const table = document.getElementById('admin-withdrawal-table-body');
      table.innerHTML = ''; // Clear old rows
      data.withdrawals.forEach(tx => {
        const row = `
          <tr>
            <td>${tx.id}</td>
            <td>${tx.user_id}</td>
            <td>${tx.amount}</td>
            <td>${tx.network}</td>
            <td>${tx.tx_id || 'N/A'}</td>
            <td>${tx.status}</td>
            <td>${tx.date}</td>
            <td>
              <button onclick="updateWithdrawalStatus(${tx.id}, 'approved')">Approve</button>
              <button onclick="updateWithdrawalStatus(${tx.id}, 'rejected')">Reject</button>
            </td>
          </tr>
        `;
        table.innerHTML += row;
      });
    });
}

// Admin: Update withdrawal status
function updateWithdrawalStatus(id, status) {
  fetch('/admin/update-withdrawal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, status })
  })
    .then(res => res.json())
    .then(data => {
      alert(data.message || 'Status updated');
      fetchPendingWithdrawals(); // Refresh table
    });
}

// === Admin Panel Functions ===

// Fetch all pending withdrawals
function fetchWithdrawals() {
  fetch('/admin/get-withdrawals')
    .then(res => res.json())
    .then(data => {
      const tableBody = document.getElementById('withdrawals-body');
      tableBody.innerHTML = '';

      data.withdrawals.forEach(wd => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${wd.id}</td>
          <td>${wd.user_id}</td>
          <td>${wd.amount}</td>
          <td>${wd.network}</td>
          <td>${wd.status}</td>
          <td>${wd.date}</td>
          <td>
            <button onclick="updateWithdrawal(${wd.id}, 'approved')">Approve</button>
            <button onclick="updateWithdrawal(${wd.id}, 'rejected')">Reject</button>
          </td>
        `;
        tableBody.appendChild(row);
      });
    });
}

// Approve or reject a withdrawal
function updateWithdrawal(id, newStatus) {
  fetch('/admin/update-withdrawal', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ id, status: newStatus })
  })
    .then(res => res.json())
    .then(data => {
      alert(data.message || "Action completed");
      fetchWithdrawals(); // Refresh table
    });
}

// Auto-load if on admin panel
if (window.location.pathname.includes('admin.html')) {
  fetchWithdrawals();
}
