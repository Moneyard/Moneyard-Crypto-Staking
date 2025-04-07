// admin.js

document.addEventListener("DOMContentLoaded", function () {
  loadWithdrawals();
  loadDepositLogs();
});

// Load pending withdrawals
function loadWithdrawals() {
  fetch('/admin/withdrawals')
    .then(res => res.json())
    .then(data => {
      const tableBody = document.getElementById('withdrawal-table-body');
      tableBody.innerHTML = '';

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
    .catch(err => console.error('Failed to load withdrawals:', err));
}

// Approve or reject withdrawal
function updateWithdrawal(withdrawalId, status) {
  fetch('/admin/update-withdrawal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: withdrawalId, status })
  })
    .then(res => res.json())
    .then(data => {
      alert(data.message);
      loadWithdrawals(); // Refresh list
    })
    .catch(err => console.error('Error updating withdrawal:', err));
}

// Load deposit transactions
function loadDepositLogs() {
  fetch('/get-transaction-history?userId=1') // Or a way to get all deposits
    .then(res => res.json())
    .then(data => {
      const tableBody = document.getElementById('deposit-table-body');
      tableBody.innerHTML = '';

      data.transactions
        .filter(tx => tx.type === 'deposit')
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
    .catch(err => console.error('Failed to load deposits:', err));
}
