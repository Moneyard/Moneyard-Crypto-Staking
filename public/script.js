window.onload = function() {
  // Check if user is logged in
  const storedUser = localStorage.getItem('username');
  const storedBalance = localStorage.getItem('balance') || 0;

  if (storedUser) {
    document.getElementById('user-name').textContent = storedUser;
    document.getElementById('account-balance').textContent = storedBalance;

    // Example: Adding dummy stakes
    const stakes = [
      { stakeAmount: 100, date: '2025-04-01' },
      { stakeAmount: 200, date: '2025-03-28' }
    ];
    
    const stakesList = document.getElementById('stakes-list');
    stakes.forEach(stake => {
      const stakeDiv = document.createElement('div');
      stakeDiv.innerHTML = `<p>Staked: ${stake.stakeAmount} USD on ${stake.date}</p>`;
      stakesList.appendChild(stakeDiv);
    });
  } else {
    window.location.href = 'index.html'; // Redirect to login if not logged in
  }

  // Event Listeners
  document.getElementById('logout-btn').addEventListener('click', logout);
  document.getElementById('deposit-btn').addEventListener('click', deposit);
  document.getElementById('withdraw-btn').addEventListener('click', withdraw);
};

// Logout functionality
function logout() {
  localStorage.removeItem('username');
  localStorage.removeItem('balance');
  window.location.href = 'index.html'; // Redirect to login page
}

// Deposit functionality (just an example)
function deposit() {
  const depositAmount = prompt('Enter the amount to deposit (USD):');
  if (depositAmount) {
    const currentBalance = parseFloat(localStorage.getItem('balance')) || 0;
    const newBalance = currentBalance + parseFloat(depositAmount);
    localStorage.setItem('balance', newBalance);
    alert(`Deposited ${depositAmount} USD! New balance: ${newBalance} USD.`);
    window.location.reload(); // Reload to update dashboard with new balance
  }
}

// Withdraw functionality (just an example)
function withdraw() {
  const withdrawAmount = prompt('Enter the amount to withdraw (USD):');
  if (withdrawAmount) {
    const currentBalance = parseFloat(localStorage.getItem('balance')) || 0;
    if (currentBalance >= withdrawAmount) {
      const newBalance = currentBalance - parseFloat(withdrawAmount);
      localStorage.setItem('balance', newBalance);
      alert(`Withdrew ${withdrawAmount} USD! New balance: ${newBalance} USD.`);
      window.location.reload(); // Reload to update dashboard with new balance
    } else {
      alert('Insufficient balance to withdraw.');
    }
  }
}
