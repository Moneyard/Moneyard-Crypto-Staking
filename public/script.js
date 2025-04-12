// ========== DEPOSIT FUNCTIONALITY ==========
document.getElementById('depositForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const userId = localStorage.getItem('userId');
  const amount = parseFloat(document.getElementById('depositAmount').value);
  const network = document.getElementById('depositNetwork').value;
  const txId = document.getElementById('depositTxId').value;

  if (!userId || !amount || !network || !txId) {
    alert('Please fill all fields.');
    return;
  }

  try {
    const res = await fetch('/api/deposit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, amount, network, txId })
    });

    const data = await res.json();
    if (data.success) {
      alert('Deposit successful and balance updated!');
      closeDepositModal();
      loadUserBalance(); // reload balance
    } else {
      alert(data.error || 'Deposit failed');
    }
  } catch (err) {
    alert('Error: ' + err.message);
  }
});

function closeDepositModal() {
  document.getElementById('depositModal').style.display = 'none';
}

async function loadUserBalance() {
  const userId = localStorage.getItem('userId');
  if (!userId) return;

  try {
    const res = await fetch(`/api/balance?userId=${userId}`);
    const data = await res.json();
    if (data.balance !== undefined) {
      document.getElementById('userBalance').textContent = `$${data.balance.toFixed(2)}`;
    }
  } catch (err) {
    console.error("Balance load error", err);
  }
}

// ========== DOMContentLoaded LOGIC ==========
document.addEventListener('DOMContentLoaded', () => {
  const sections = document.querySelectorAll('.animated-section');
  const sectionObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        if (entry.target.id === 'growth-tracker') {
          animateCounters();
        }
      }
    });
  }, { threshold: 0.1 });

  sections.forEach(section => sectionObserver.observe(section));

  if (localStorage.getItem('userId')) {
    loadUserSummary();
    loadUserBalance();
  }

  // Signup
  const signupForm = document.getElementById("signupForm");
  signupForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("signupEmail").value;
    const password = document.getElementById("signupPassword").value;

    const res = await fetch("/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (data.success) {
      alert("Signup successful! Please login.");
      signupForm.reset();
      toggleForms('login');
    } else {
      alert(data.error || "Signup failed.");
    }
  });

  // Login
  const loginForm = document.getElementById("loginForm");
  loginForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    const res = await fetch("/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (data.success) {
      localStorage.setItem("userId", data.userId);
      localStorage.setItem("email", email);
      window.location.href = "/dashboard";
    } else {
      alert(data.error || "Login failed.");
    }
  });

  // Stake plans
  const stakePlansContainer = document.getElementById("stake-plans");
  if (stakePlansContainer) {
    fetch("/api/stake-plans")
      .then(res => res.json())
      .then(plans => {
        stakePlansContainer.innerHTML = "";
        plans.forEach(plan => {
          const card = document.createElement("div");
          card.className = "stake-plan-card";
          card.innerHTML = `
            <h3>${plan.name}</h3>
            <p>APY: ${plan.apy}%</p>
            <p>Duration: ${plan.durationDays} days</p>
            <button onclick="selectStakePlan('${plan.name}', ${plan.apy}, ${plan.durationDays})">Choose Plan</button>
          `;
          stakePlansContainer.appendChild(card);
        });
      });
  }

  const stakeForm = document.getElementById("stakeForm");
  stakeForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const amount = parseFloat(document.getElementById("stakeAmount").value);
    const planName = document.getElementById("selectedPlanName").value;
    const userId = localStorage.getItem("userId");

    if (!amount || amount < 10) {
      alert("Minimum stake is 10 USDT.");
      return;
    }

    const res = await fetch("/api/stake", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, plan: planName, amount }),
    });

    const data = await res.json();
    if (res.ok) {
      alert("Staking successful!");
      stakeForm.reset();
      loadActiveStakes();
    } else {
      alert(data.message || "Staking failed.");
    }
  });

  if (document.getElementById("active-stakes")) {
    loadActiveStakes();
  }
});

// ========== OTHER FEATURES ==========
function selectStakePlan(name, apy, duration) {
  document.getElementById("selectedPlanName").value = name;
  document.getElementById("selectedPlanInfo").innerText =
    `Selected: ${name} | APY: ${apy}% | Duration: ${duration} days`;
}

async function loadActiveStakes() {
  const userId = localStorage.getItem('userId');
  const container = document.getElementById("active-stakes");
  container.innerHTML = "<p>Loading...</p>";

  try {
    const res = await fetch(`/api/active-stakes?userId=${userId}`);
    const data = await res.json();

    if (Array.isArray(data)) {
      container.innerHTML = "";
      if (data.length === 0) {
        container.innerHTML = "<p>No active stakes yet.</p>";
        return;
      }

      data.forEach(stake => {
        const div = document.createElement("div");
        div.className = "stake-item";
        div.innerHTML = `
          <p><strong>Plan:</strong> ${stake.plan}</p>
          <p><strong>Amount:</strong> ${stake.amount} USDT</p>
          <p><strong>Start:</strong> ${new Date(stake.startDate).toLocaleDateString()}</p>
          <p><strong>Status:</strong> ${stake.status}</p>
          <button onclick="unstake('${stake.id}')">Unstake</button>
        `;
        container.appendChild(div);
      });
    } else {
      container.innerHTML = "<p>Failed to load stakes.</p>";
    }
  } catch (err) {
    container.innerHTML = "<p>Error loading stakes.</p>";
  }
}

async function unstake(stakeId) {
  if (!confirm("Unstake this plan?")) return;

  const res = await fetch(`/api/unstake/${stakeId}`, { method: "POST" });
  const data = await res.json();

  if (res.ok) {
    alert("Unstaked successfully.");
    loadActiveStakes();
  } else {
    alert(data.message || "Unstake failed.");
  }
}

function handleForgotPassword() {
  const email = document.getElementById("email").value;
  if (!email) {
    alert("Enter your email to receive reset link.");
    return;
  }

  fetch("/api/forgot-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  })
    .then(res => res.json())
    .then(data => alert(data.message || "Reset link sent."))
    .catch(() => alert("Error sending reset link."));
}

function toggleForms(type) {
  const signup = document.getElementById("signup-form");
  const login = document.getElementById("login-form");
  signup.style.display = type === 'login' ? 'none' : 'block';
  login.style.display = type === 'login' ? 'block' : 'none';
}

function loadUserSummary() {
  const userId = localStorage.getItem("userId");
  if (!userId) return;

  fetch(`/user-summary?userId=${userId}`)
    .then(res => res.json())
    .then(data => {
      document.getElementById("summary-username").innerText = localStorage.getItem("email");
      document.getElementById("summary-total").innerText = `${data.totalDeposit.toFixed(2)} USDT`;
      document.getElementById("summary-balance").innerText = `${data.balance.toFixed(2)} USDT`;
    });
}

function calculateEarnings() {
  const amount = parseFloat(document.getElementById("deposit-input").value);
  if (!amount || amount < 15 || amount > 1000) {
    alert("Enter an amount between 15 and 1000 USDT.");
    return;
  }
  const daily = amount * 0.08;
  document.getElementById("calculated-earnings").innerText =
    `Daily earnings: ${daily.toFixed(2)} USDT`;
}
