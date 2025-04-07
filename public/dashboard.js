document.addEventListener("DOMContentLoaded", function () {
  loadStakingPlans();
  loadAPY();
  loadUserSummary();
  loadTransactionHistory();
  loadPendingWithdrawals();
});

// Load staking plans and display them
function loadStakingPlans() {
  const stakingPlans = [
    { id: 1, name: "Plan A", duration: "30 days", interestRate: "5%" },
    { id: 2, name: "Plan B", duration: "60 days", interestRate: "10%" },
    { id: 3, name: "Plan C", duration: "90 days", interestRate: "15%" },
  ];

  const stakingPlansTable = document.getElementById('staking-plans-table-body');
  stakingPlansTable.innerHTML = '';

  stakingPlans.forEach(plan => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${plan.name}</td>
      <td>${plan.duration}</td>
      <td>${plan.interestRate}</td>
      <td><button onclick="selectStakingPlan(${plan.id})">Select</button></td>
    `;
    stakingPlansTable.appendChild(row);
  });
}

// Select a staking plan
function selectStakingPlan(planId) {
  alert(`You selected Staking Plan ${planId}`);
  // Further logic for selecting a plan can go here (e.g., submitting to the server)
}

// Load the Annual Percentage Yield (APY) and display it
function loadAPY() {
  const APY = 12;  // Example APY value
  const apyElement = document.getElementById('apy');
  apyElement.innerText = `${APY}%`;
}

// Load user summary (e.g., total deposit and balance)
function loadUserSummary() {
  const userId = 1;  // Get the actual user ID based on session or login
  
  fetch(`/user-summary?userId=${userId}`)
    .then(res => res.json())
    .then(data => {
      const totalDepositElement = document.getElementById('total-deposit');
      const balanceElement = document.getElementById('balance');
      totalDepositElement.innerText = `Total Deposit: ${data.totalDeposit} USDT`;
      balanceElement.innerText = `Available Balance: ${data.balance} USDT`;
    })
    .catch(err => console.error('Failed to load user summary:', err));
}

// Load transaction history
function loadTransactionHistory() {
  const userId = 1;  // Get the actual user ID based on session or login
  
  fetch(`/get-transaction-history?userId=${userId}`)
    .then(res => res.json())
    .then(data => {
      const transactionHistoryTable = document.getElementById('transaction-history-table-body');
      transactionHistoryTable.innerHTML = '';
      
      data.transactions.forEach(tx => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${tx.id}</td>
          <td>${tx.amount}</td>
          <td>${tx.network}</td>
          <td>${tx.tx_id}</td>
          <td>${tx.status}</td>
          <td>${tx.date}</td>
        `;
        transactionHistoryTable.appendChild(row);
      });
    })
    .catch(err => console.error('Failed to load transaction history:', err));
}

// Load pending withdrawals (for the admin panel or the user dashboard)
function loadPendingWithdrawals() {
  const userId = 1;  // For user-specific withdrawals, this would be dynamic
  
  fetch(`/get-pending-withdrawals?userId=${userId}`)
    .then(res => res.json())
    .then(data => {
      const withdrawalsTable = document.getElementById('withdrawals-table-body');
      withdrawalsTable.innerHTML = '';
      
      data.withdrawals.forEach(w => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${w.id}</td>
          <td>${w.amount}</td>
          <td>${w.wallet_address}</td>
          <td>${w.status}</td>
          <td>${w.date}</td>
        `;
        withdrawalsTable.appendChild(row);
      });
    })
    .catch(err => console.error('Failed to load pending withdrawals:', err));
}
