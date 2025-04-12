document.addEventListener('DOMContentLoaded', () => {
  // Load animated sections
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

  // Signup
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

  // Login
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
        localStorage.setItem("userId", data.userId);
        localStorage.setItem("email", email);
        window.location.href = "/dashboard";
      } else {
        alert(data.error || "Login failed.");
      }
    });
  }

  // Load stake plans
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

  // Staking form
  const stakeForm = document.getElementById("stakeForm");
  if (stakeForm) {
    stakeForm.addEventListener("submit", async (e) => {
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
  }

  // Load active stakes
  if (document.getElementById("active-stakes")) {
    loadActiveStakes();
  }
});

// Select a plan
function selectStakePlan(name, apy, duration) {
  document.getElementById("selectedPlanName").value = name;
  document.getElementById("selectedPlanInfo").innerText =
    `Selected: ${name} | APY: ${apy}% | Duration: ${duration} days`;
}

// Load active stakes
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

// Unstake handler
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

// Forgot password
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

// Toggle forms
function toggleForms(type) {
  const signup = document.getElementById("signup-form");
  const login = document.getElementById("login-form");
  signup.style.display = type === 'login' ? 'none' : 'block';
  login.style.display = type === 'login' ? 'block' : 'none';
}

// Load user summary
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

// Earnings calculator
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
// ========== GOALS TRACKER ==========

// Load goals from localStorage or backend (optional DB)
function loadGoals() {
  const goals = JSON.parse(localStorage.getItem('goals')) || [];
  const goalsList = document.getElementById('goals-list');
  goalsList.innerHTML = '';

  goals.forEach((goal, index) => {
    const percent = ((goal.progress / goal.target) * 100).toFixed(1);
    const goalDiv = document.createElement('div');
    goalDiv.style.marginBottom = '12px';
    goalDiv.innerHTML = `
      <strong>${goal.name}</strong><br>
      <progress value="${goal.progress}" max="${goal.target}" style="width: 100%;"></progress>
      <p>${goal.progress} / ${goal.target} USDT (${percent}%)</p>
    `;
    goalsList.appendChild(goalDiv);
  });
}

// Add a new goal
function addGoal() {
  const name = document.getElementById('goal-name').value.trim();
  const target = parseFloat(document.getElementById('goal-target').value);
  const progress = parseFloat(document.getElementById('goal-progress').value);

  if (!name || isNaN(target) || isNaN(progress) || target <= 0 || progress < 0) {
    alert('Please enter valid goal details.');
    return;
  }

  const goals = JSON.parse(localStorage.getItem('goals')) || [];
  goals.push({ name, target, progress });
  localStorage.setItem('goals', JSON.stringify(goals));

  // Clear inputs and reload
  document.getElementById('goal-name').value = '';
  document.getElementById('goal-target').value = '';
  document.getElementById('goal-progress').value = '';
  loadGoals();
}

// Load goals when page is ready
document.addEventListener('DOMContentLoaded', loadGoals);


// ========== REFERRAL EARNINGS ==========

function loadReferralData() {
  const referralCode = localStorage.getItem('referralCode') || generateReferralCode();
  document.getElementById('referral-code').value = `https://moneyard.com/signup?ref=${referralCode}`;

  // Simulated data — in real use, fetch from backend
  const totalReferrals = parseInt(localStorage.getItem('totalReferrals') || '3');
  const earnings = totalReferrals * 5; // Example: 5 USDT per referral

  document.getElementById('total-referrals').textContent = totalReferrals;
  document.getElementById('referral-earnings').textContent = earnings + ' USDT';
}

function generateReferralCode() {
  const code = 'MY' + Math.random().toString(36).substr(2, 6).toUpperCase();
  localStorage.setItem('referralCode', code);
  return code;
}

function copyReferralLink() {
  const link = document.getElementById('referral-code');
  link.select();
  link.setSelectionRange(0, 99999); // for mobile
  document.execCommand('copy');
  alert('Referral link copied to clipboard!');
}

// Load referral info when page is ready
document.addEventListener('DOMContentLoaded', loadReferralData);


// Counter animation
function animateCounters() {
  const counters = document.querySelectorAll(".counter");
  counters.forEach(counter => {
    const update = () => {
      const target = +counter.getAttribute("data-target");
      const count = +counter.innerText;
      const increment = target / 100;

      if (count < target) {
        counter.innerText = Math.ceil(count + increment);
        setTimeout(update, 30);
      } else {
        counter.innerText = target;
      }
    };

    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        update();
        observer.disconnect();
      }
    }, { threshold: 1 });

    observer.observe(counter);
  });
}

// Navigation
function navigateTo(page) {
  const pages = {
    home: "dashboard.html",
    referral: "referral.html",
    stake: "stake.html",
    assets: "assets.html",
  };
  if (pages[page]) window.location.href = pages[page];
}

// Logout
function logout() {
  localStorage.removeItem("userId");
  localStorage.removeItem("email");
  window.location.href = "index.html";
}
