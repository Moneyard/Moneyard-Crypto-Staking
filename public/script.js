// Mock deposit addresses for TRC20 and BEP20 networks
const depositAddresses = {
  TRC20: 'TNCYhLZyXbY8rbxTZdqZdksDFcp1tdQik2',
  BEP20: '0x9b0cD90c9bD94d6E953D5c1f27819f5a107d8468'
};

// Get Deposit Address based on selected network
function getDepositAddress() {
  const network = document.getElementById('network').value;
  const depositAddressElement = document.getElementById('deposit-address');
  const copyButton = document.getElementById('copy-button');
  
  if (network === '') {
    depositAddressElement.textContent = 'Please select a network.';
    copyButton.style.display = 'none';
  } else {
    const address = depositAddresses[network];
    depositAddressElement.textContent = address;
    copyButton.style.display = 'block'; // Show the Copy button when an address is displayed
  }
}

// Calculate Earnings based on deposit amount
function calculateEarnings() {
  const depositAmount = parseFloat(document.getElementById('deposit-input').value);
  const earningsElement = document.getElementById('calculated-earnings');
  
  if (isNaN(depositAmount) || depositAmount <= 0) {
    earningsElement.textContent = 'Please enter a valid deposit amount.';
  } else {
    // Example calculation: 1% daily earnings
    const dailyEarnings = depositAmount * 0.01;
    earningsElement.textContent = `Your daily earnings will be ${dailyEarnings.toFixed(2)} USDT.`;
  }
}

// Copy deposit address to clipboard
function copyToClipboard() {
  const depositAddress = document.getElementById('deposit-address').textContent;
  navigator.clipboard.writeText(depositAddress)
    .then(() => {
      alert('Deposit address copied to clipboard!');
    })
    .catch(err => {
      alert('Failed to copy address: ' + err);
    });
}
