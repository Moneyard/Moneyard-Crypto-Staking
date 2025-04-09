// Toggle Deposit Modal
function togglePaymentModal() {
  const modal = document.getElementById('payment-modal');
  modal.style.display = modal.style.display === 'none' ? 'block' : 'none';
}

// Copy wallet address
function copyToClipboard(elementId) {
  const text = document.getElementById(elementId).innerText;
  navigator.clipboard.writeText(text).then(() => {
    alert(`Copied: ${text}`);
  }).catch(err => {
    alert('Failed to copy');
  });
}

// Dummy values for demo
let balance = 100;
const balanceDisplay = document.getElementById('balance');
balanceDisplay.textContent = `${balance} USDT`;

// Earnings Calculator
function calculateEarnings() {
  const amount = parseFloat(document.getElementById('stake-amount').value);
  if (isNaN(amount) || amount <= 0) {
    document.getElementById('earnings-result').textContent = 'Please enter a valid amount.';
    return;
  }
  const apy = 15; // 15% APY
  const earnings = (amount * apy) / 100;
  document.getElementById('earnings-result').textContent = `Estimated annual earnings: ${earnings.toFixed(2)} USDT`;
}

// Dummy transaction history
const transactions = [
  { type: 'Deposit', amount: 100, date: '2025-04-01' },
  { type: 'Earnings', amount: 5, date: '2025-04-07' },
];

const transactionList = document.getElementById('transaction-list');
transactions.forEach(tx => {
  const li = document.createElement('li');
  li.textContent = `${tx.date}: ${tx.type} of ${tx.amount} USDT`;
  transactionList.appendChild(li);
});
