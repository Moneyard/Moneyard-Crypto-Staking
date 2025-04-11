document.addEventListener("DOMContentLoaded", () => {
  // Set background color
  document.body.style.backgroundColor = '#FFA94D';

  // Only attempt to load the user summary if the user is logged in
  if (isUserLoggedIn()) {
    loadUserSummary();
  } else {
    console.log('User is not logged in. Skipping user summary load.');
  }

  // Observer animation for sections (optional, used for animated sections)
  const sections = document.querySelectorAll('.animated-section');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        if (entry.target.id === 'growth-tracker') {
          animateCounters();
        }
      }
    });
  }, { threshold: 0.1 });

  sections.forEach(section => observer.observe(section));
});

// Utility: Check if user is logged in
function isUserLoggedIn() {
  return !!localStorage.getItem('userId') && !!localStorage.getItem('username');
}

// Load and display the user summary
function loadUserSummary() {
  const userId = localStorage.getItem('userId');
  const username = localStorage.getItem('username');

  if (!userId || !username) {
    console.log("Missing userId or username. Redirecting to login.");
    window.location.href = "index.html";
    return;
  }

  // Display username immediately
  const usernameElement = document.getElementById('summary-username');
  if (usernameElement) {
    usernameElement.innerText = username;
  }

  // Fetch user summary from backend
  fetch(`/user-summary?userId=${userId}`)
    .then(response => response.json())
    .then(data => {
      if (data && data.totalDeposit !== undefined && data.balance !== undefined) {
        document.getElementById('summary-total').innerText = `${data.totalDeposit.toFixed(2)} USDT`;
        document.getElementById('summary-balance').innerText = `${data.balance.toFixed(2)} USDT`;
      } else {
        console.log("No valid summary data returned.");
      }
    })
    .catch(error => {
      console.error("Error fetching user summary:", error);
    });
}

// Logout function
function logout() {
  localStorage.removeItem('userId');
  localStorage.removeItem('username');
  window.location.href = "index.html";
}

// Deposit logic
function getDepositAddress() {
  const network = document.getElementById('network').value;
  const addressEl = document.getElementById('deposit-address');
  const copyBtn = document.getElementById('copy-button');

  if (!network) {
    addressEl.innerText = "Please select a network.";
    copyBtn.style.display = "none";
    return;
  }

  // Sample static addresses (replace with API if needed)
  const addresses = {
    Tron: "TXXxyTronAddress12345",
    BNB: "bnb1qwertyBep20Address"
  };

  const address = addresses[network];
  addressEl.innerText = `Deposit Address: ${address}`;
  copyBtn.style.display = "inline-block";
}

// Copy address to clipboard
function copyToClipboard() {
  const text = document.getElementById('deposit-address').innerText.replace("Deposit Address: ", "");
  navigator.clipboard.writeText(text)
    .then(() => alert("Address copied!"))
    .catch(() => alert("Failed to copy address"));
}

// Submit deposit
function logDeposit() {
  const userId = localStorage.getItem('userId');
  const amount = parseFloat(document.getElementById('deposit-amount').value);
  const network = document.getElementById('network').value;

  if (!userId || isNaN(amount) || amount < 15 || amount > 1000 || !network) {
    alert("Please enter a valid amount (15 - 1000 USDT) and select a network.");
    return;
  }

loginForm.addEventListener("submit", function (e) {
  e.preventDefault();
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        alert("Login successful!");
        // You can redirect or save token here if you implement one
        window.location.href = "/dashboard";
      } else {
        alert(data.error || "Unable to login");
      }
    })
    .catch(() => alert("Login request failed."));
});


fetch('/deposit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, amount, network })
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        alert("Deposit submitted!");
        loadUserSummary();
      } else {
        alert(data.message || "Deposit failed.");
      }
    })
    .catch(() => alert("Deposit error. Try again."));
}

// Submit withdrawal
function submitWithdrawal() {
  const userId = localStorage.getItem('userId');
  const amount = parseFloat(document.getElementById('withdraw-amount').value);
  const address = document.getElementById('withdraw-address').value;
  const password = document.getElementById('withdraw-password').value;

  if (!userId || isNaN(amount) || amount < 10 || !address || !password) {
    alert("Fill in all fields correctly. Minimum withdrawal is 10 USDT.");
    return;
  }

  fetch('/withdraw', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, amount, address, password })
  })
    .then(res => res.json())
    .then(data => {
      alert(data.message || "Withdrawal requested.");
    })
    .catch(() => alert("Error processing withdrawal."));
}

// Earnings calculator
function calculateEarnings() {
  const deposit = parseFloat(document.getElementById('deposit-input').value);
  const resultEl = document.getElementById('calculated-earnings');

  if (isNaN(deposit) || deposit <= 0) {
    resultEl.innerText = "Enter a valid deposit amount.";
    return;
  }

  const dailyEarnings = deposit * 0.01; // Example: 1% daily
  resultEl.innerText = `Estimated Daily Earnings: ${dailyEarnings.toFixed(2)} USDT`;
}
function animateCounters() {
  const counters = document.querySelectorAll('.counter');
  counters.forEach(counter => {
    const updateCount = () => {
      const target = +counter.getAttribute('data-target');
      const count = +counter.innerText;
      const increment = target / 100;

      if (count < target) {
        counter.innerText = Math.ceil(count + increment);
        setTimeout(updateCount, 50);
      } else {
        counter.innerText = target;
      }
    };
    updateCount();
  });
}

document.addEventListener('DOMContentLoaded', () => {
  // Existing observer animation
  const sections = document.querySelectorAll('.animated-section');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        if (entry.target.id === 'growth-tracker') {
          animateCounters();
        }
      }
    });
  }, { threshold: 0.1 });

  sections.forEach(section => observer.observe(section));
});
