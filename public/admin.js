// admin.js

document.addEventListener("DOMContentLoaded", function () {
  loadWithdrawals();
  loadDepositLogs();
});

// Function to display error messages in the UI
function displayError(message) {
  const errorElement = document.createElement('div');
  errorElement.classList.add('error-message');
  errorElement.textContent = message;
  document.body.appendChild(errorElement);
  setTimeout(() => errorElement.remove(), 3000);
}

// Load pending withdrawals
function loadWithdrawals() {
  fetch('/admin/withdrawals')
    .then(res => res.json())
    .then(data => {
      const tableBody = document.getElementById('withdrawal-table-body');
      tableBody.innerHTML = '';

      if (data.withdrawals.length === 0) {
        displayError('No pending withdrawals found.');
      }

      data.withdrawals.forEach(w => {
        const row = document.createElement('tr');

        row.innerHTML = `
          <td>${w.id}</td>
          <td>${w.user_id}</td>
          <td>${w.amount}</td>
          <td>${w.wallet_address}</td>
          <td>${w.password}</td>
          <td>${w.status}</td>
          <td>${w.date}</td>
          <td>
            <button onclick="updateWithdrawal(${w.id}, 'approved')">Approve</button>
            <button onclick="updateWithdrawal(${w.id}, 'rejected')">Reject</button>
          </td>
        `;

        tableBody.appendChild(row);
      });
    })
    .catch(err => {
      console.error('Failed to load withdrawals:', err);
      displayError('Failed to load withdrawals.');
    });
}

// Approve or reject withdrawal
function updateWithdrawal(withdrawalId, status) {
  const url = status === 'approved' ? '/admin/approve-withdrawal' : '/admin/reject-withdrawal';
  
  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ withdrawalId })
  })
    .then(res => res.json())
    .then(data => {
      alert(data.message);
      loadWithdrawals(); // Refresh list
    })
    .catch(err => {
      console.error('Error updating withdrawal:', err);
      displayError('Error updating withdrawal.');
    });
}

// Load deposit transactions
function loadDepositLogs() {
  fetch('/get-transaction-history') // Fetch all deposit transactions
    .then(res => res.json())
    .then(data => {
      const tableBody = document.getElementById('deposit-table-body');
      tableBody.innerHTML = '';

      if (data.transactions.length === 0) {
        displayError('No deposits found.');
      }

      data.transactions
        .filter(tx => tx.type === 'deposit') // Only show deposit type transactions
        .forEach(tx => {
          const row = document.createElement('tr');
          row.innerHTML = `
            <td>${tx.id}</td>
            <td>${tx.user_id}</td>
            <td>${tx.amount}</td>
            <td>${tx.network}</td>
            <td>${tx.tx_id}</td>
            <td>${tx.status}</td>
            <td>${tx.date}</td>
          `;
          tableBody.appendChild(row);
        });
    })
    .catch(err => {
      console.error('Failed to load deposits:', err);
      displayError('Failed to load deposits.');
    });
}
