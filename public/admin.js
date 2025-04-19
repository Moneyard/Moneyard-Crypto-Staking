// Fetch and display pending deposits
window.onload = function() {
  fetch('/admin/deposits')
    .then(response => response.json())
    .then(deposits => {
      const tableBody = document.getElementById('deposit-table').getElementsByTagName('tbody')[0];

      deposits.forEach(deposit => {
        const row = document.createElement('tr');
        
        // Create table data for each deposit
        row.innerHTML = `
          <td>${deposit.user_id}</td>
          <td>${deposit.amount}</td>
          <td>${deposit.txid}</td>
          <td>${deposit.status}</td>
          <td>
            <button onclick="approveDeposit(${deposit.id})">Approve</button>
            <button onclick="rejectDeposit(${deposit.id})">Reject</button>
          </td>
        `;
        
        tableBody.appendChild(row);
      });
    })
    .catch(error => console.error('Error fetching deposits:', error));
};

// Approve deposit function
function approveDeposit(depositId) {
  fetch('/admin/approve-deposit', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ depositId })
  })
  .then(response => response.json())
  .then(data => {
    alert(data.message);
    window.location.reload(); // Reload page to see updated status
  })
  .catch(error => console.error('Error approving deposit:', error));
}

// Reject deposit function
function rejectDeposit(depositId) {
  fetch('/admin/reject-deposit', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ depositId })
  })
  .then(response => response.json())
  .then(data => {
    alert(data.message);
    window.location.reload(); // Reload page to see updated status
  })
  .catch(error => console.error('Error rejecting deposit:', error));
}

