// Toggle between signup and login forms
function toggleForms(type) {
  const signup = document.getElementById('signup-form');
  const login = document.getElementById('login-form');
  if (type === 'login') {
    signup.style.display = 'none';
    login.style.display = 'block';
  } else {
    signup.style.display = 'block';
    login.style.display = 'none';
  }
}

// Handle forgot password
function handleForgotPassword() {
  const email = document.getElementById('email').value;
  if (!email) {
    alert('Please enter your email first so we can send the reset link.');
    return;
  }

  fetch('/api/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  })
    .then(res => res.json())
    .then(data => {
      alert(data.message || 'If this email exists, a reset link has been sent.');
    })
    .catch(() => alert('Failed to send reset link. Please try again.'));
}

// Calculate earnings (8% daily)
function calculateEarnings() {
  const depositAmount = parseFloat(document.getElementById('deposit-input').value);
  if (!depositAmount || depositAmount < 15 || depositAmount > 1000) {
    alert("Please enter a valid deposit amount between 15 and 1000 USDT.");
    return;
  }
  const dailyEarnings = depositAmount * 0.08;
  document.getElementById('calculated-earnings').innerText =
    `Your daily earnings are: ${dailyEarnings.toFixed(2)} USDT.`;
}

// Load user summary
function loadUserSummary() {
  const userId = localStorage.getItem('userId');
  if (!userId) return;

  fetch(`/user-summary?userId=${userId}`)
    .then(res => res.json())
    .then(data => {
      document.getElementById('summary-username').innerText = localStorage.getItem('email');
      document.getElementById('summary-total').innerText = `${data.totalDeposit.toFixed(2)} USDT`;
      document.getElementById('summary-balance').innerText = `${data.balance.toFixed(2)} USDT`;
    })
    .catch(err => {
      console.error("Error loading summary:", err);
      alert("Failed to load user summary.");
    });
}

// Counter animation
function animateCounters() {
  const counters = document.querySelectorAll('.counter');
  counters.forEach(counter => {
    const updateCount = () => {
      const target = +counter.getAttribute('data-target');
      const count = +counter.innerText;
      const increment = target / 100;

      if (count < target) {
        counter.innerText = Math.ceil(count + increment);
        setTimeout(updateCount, 30);
      } else {
        counter.innerText = target;
      }
    };

    const counterObserver = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        updateCount();
        counterObserver.disconnect();
      }
    }, { threshold: 1 });

    counterObserver.observe(counter);
  });
}

// Navigation handler
function navigateTo(page) {
  const pages = {
    home: 'dashboard.html',
    referral: 'referral.html',
    stake: 'stake.html',
    assets: 'assets.html'
  };
  if (pages[page]) window.location.href = pages[page];
}

// Logout
function logout() {
  localStorage.removeItem('userId');
  localStorage.removeItem('email');
  window.location.href = "index.html";
}

// DOMContentLoaded for all setup
document.addEventListener('DOMContentLoaded', () => {
  // Animate sections
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

  // Load summary if logged in
  if (localStorage.getItem('userId')) {
    loadUserSummary();
  }

  // Signup form
  const signupForm = document.getElementById("signupForm");
  if (signupForm) {
    signupForm.addEventListener("submit", async (e) => {
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
  }

  // Login form
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
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
        alert("Login successful!");
        localStorage.setItem("userId", data.userId);
        localStorage.setItem("email", email);
        window.location.href = "/dashboard";
      } else {
        alert(data.error || "Login failed.");
      }
    });
  }

  // Stake: Load plans
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
      })
      .catch(err => {
        console.error("Failed to load stake plans:", err);
      });
  }

  // Stake: Form handler
  const stakeForm = document.getElementById("stakeForm");
  if (stakeForm) {
    stakeForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const amount = parseFloat(document.getElementById("stakeAmount").value);
      const planName = document.getElementById("selectedPlanName").value;
      const userId = localStorage.getItem("userId");

      if (!amount || amount < 10) {
        alert("Please enter a valid staking amount (min 10 USDT).");
        return;
      }

      const res = await fetch("/api/stake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, amount, planName }),
      });

      const data = await res.json();
      if (data.success) {
        alert("Staking successful!");
        stakeForm.reset();
        loadUserStakes();
      } else {
        alert(data.error || "Staking failed.");
      }
    });
  }

  // Load active stakes
  if (document.getElementById("active-stakes")) {
    loadUserStakes();
  }
});

// Stake: Select plan
function selectStakePlan(name, apy, duration) {
  document.getElementById("selectedPlanName").value = name;
  document.getElementById("selectedPlanDetails").innerText = `${name} Plan - ${apy}% for ${duration} days`;
}

// Stake: Load user stakes
function loadUserStakes() {
  const userId = localStorage.getItem("userId");
  if (!userId) return;

  fetch(`/api/user-stakes?userId=${userId}`)
    .then(res => res.json())
    .then(data => {
      const container = document.getElementById("active-stakes");
      container.innerHTML = "";
      if (!data.length) {
        container.innerHTML = "<p>No active stakes found.</p>";
        return;
      }
      data.forEach(stake => {
        const div = document.createElement("div");
        div.className = "stake-item";
        div.innerHTML = `
          <p>Plan: ${stake.plan}</p>
          <p>Amount: ${stake.amount} USDT</p>
          <p>Start: ${new Date(stake.startDate).toLocaleDateString()}</p>
          <p>Ends: ${new Date(stake.endDate).toLocaleDateString()}</p>
          <p>Earnings: ${stake.earnings.toFixed(2)} USDT</p>
          <button onclick="unstake(${stake.id})">Unstake</button>
        `;
        container.appendChild(div);
      });
    })
    .catch(err => {
      console.error("Failed to load stakes:", err);
    });
}

// Stake: Unstake
function unstake(stakeId) {
  if (!confirm("Are you sure you want to unstake?")) return;

  fetch(`/api/unstake/${stakeId}`, { method: "POST" })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        alert("Unstaked successfully!");
        loadUserStakes();
      } else {
        alert(data.error || "Unstake failed.");
      }
    })
    .catch(() => alert("Unstake request failed."));
}
document.getElementById('stake-form').addEventListener('submit', async function (e) {
  e.preventDefault();

  const plan = document.getElementById('stake-plan').value;
  const amount = parseFloat(document.getElementById('stake-amount').value);
  const userId = localStorage.getItem('userId');

  if (!userId) {
    alert('Please log in to stake funds.');
    return;
  }

  if (!amount || amount < 10) {
    alert('Please enter a valid amount greater than 10 USDT.');
    return;
  }

  const response = await fetch('/api/stake', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, plan, amount })
  });

  const data = await response.json();

  if (data.success) {
    alert('Stake successful!');
    document.getElementById('stake-form').reset();
    document.getElementById('stake-result').innerText = `You have successfully staked ${amount} USDT in the ${plan} plan.`;
  } else {
    alert(data.error || 'Stake failed.');
  }
});
