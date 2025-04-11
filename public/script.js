document.addEventListener("DOMContentLoaded", () => {
  document.body.style.backgroundColor = '#FFA94D';

  if (isUserLoggedIn()) {
    loadUserSummary();
  } else {
    console.log('User is not logged in. Skipping user summary load.');
  }

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

  // Forgot password handler
  const forgotLink = document.getElementById('forgotPasswordLink');
  const resetBtn = document.getElementById('sendResetLink');

  if (forgotLink) {
    forgotLink.addEventListener('click', () => {
      document.getElementById('forgotPasswordForm').style.display = 'block';
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', async () => {
      const email = document.getElementById('resetEmail').value;
      const res = await fetch('/api/request-password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      alert(data.message || data.error);
    });
  }

  // Login form handler
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
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
            localStorage.setItem('userId', data.user.id);
            localStorage.setItem('username', data.user.username);
            window.location.href = "/dashboard";
          } else {
            alert(data.error || "Unable to login");
          }
        })
        .catch(() => alert("Login request failed."));
    });
  }

  // Signup form handler
  const signupForm = document.getElementById('signupForm');
  if (signupForm) {
    signupForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const username = document.getElementById("signupUsername").value;
      const email = document.getElementById("signupEmail").value;
      const password = document.getElementById("signupPassword").value;
      const refCode = document.getElementById("signupReferral").value;

      fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password, referralCode: refCode })
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            alert("Signup successful! Please log in.");
            document.getElementById("signupForm").style.display = "none";
            document.getElementById("loginForm").style.display = "block";
          } else {
            alert(data.error || "Signup failed");
          }
        })
        .catch(() => alert("Signup request failed."));
    });
  }
});

// Utility
function isUserLoggedIn() {
  return !!localStorage.getItem('userId') && !!localStorage.getItem('username');
}

function loadUserSummary() {
  const userId = localStorage.getItem('userId');
  const username = localStorage.getItem('username');

  if (!userId || !username) {
    window.location.href = "index.html";
    return;
  }

  const usernameElement = document.getElementById('summary-username');
  if (usernameElement) usernameElement.innerText = username;

  fetch(`/user-summary?userId=${userId}`)
    .then(response => response.json())
    .then(data => {
      if (data && data.totalDeposit !== undefined && data.balance !== undefined) {
        document.getElementById('summary-total').innerText = `${data.totalDeposit.toFixed(2)} USDT`;
        document.getElementById('summary-balance').innerText = `${data.balance.toFixed(2)} USDT`;
      }
    })
    .catch(error => console.error("Error fetching user summary:", error));
}

function logout() {
  localStorage.clear();
  window.location.href = "index.html";
}

// Deposit
function getDepositAddress() {
  const network = document.getElementById('network').value;
  const addressEl = document.getElementById('deposit-address');
  const copyBtn = document.getElementById('copy-button');

  const addresses = {
    Tron: "TXXxyTronAddress12345",
    BNB: "bnb1qwertyBep20Address"
  };

  if (!network || !addresses[network]) {
    addressEl.innerText = "Please select a valid network.";
    copyBtn.style.display = "none";
    return;
  }

  addressEl.innerText = `Deposit Address: ${addresses[network]}`;
  copyBtn.style.display = "inline-block";
}

function copyToClipboard() {
  const text = document.getElementById('deposit-address').innerText.replace("Deposit Address: ", "");
  navigator.clipboard.writeText(text)
    .then(() => alert("Address copied!"))
    .catch(() => alert("Failed to copy address"));
}

function logDeposit() {
  const userId = localStorage.getItem('userId');
  const amount = parseFloat(document.getElementById('deposit-amount').value);
  const network = document.getElementById('network').value;

  if (!userId || isNaN(amount) || amount < 15 || amount > 1000 || !network) {
    alert("Please enter a valid amount (15 - 1000 USDT) and select a network.");
    return;
  }

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

// Withdraw
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

// Calculator
function calculateEarnings() {
  const deposit = parseFloat(document.getElementById('deposit-input').value);
  const resultEl = document.getElementById('calculated-earnings');

  if (isNaN(deposit) || deposit <= 0) {
    resultEl.innerText = "Enter a valid deposit amount.";
    return;
  }

  const dailyEarnings = deposit * 0.01;
  resultEl.innerText = `Estimated Daily Earnings: ${dailyEarnings.toFixed(2)} USDT`;
}

// Animated counters
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
