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
});
let selectedPlan = null;

function selectPlan(plan, apy) {
  selectedPlan = { name: plan, apy };
  document.getElementById('selectedPlanName').innerText = plan;
  document.getElementById('selectedPlanApy').innerText = apy;
  document.getElementById('stakeFormSection').style.display = 'block';
}

function submitStake() {
  const amount = parseFloat(document.getElementById('stakeAmount').value);
  if (!selectedPlan || isNaN(amount) || amount <= 0) {
    alert("Enter a valid amount and select a plan.");
    return;
  }

  fetch('/stake', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ plan: selectedPlan.name, apy: selectedPlan.apy, amount })
  })
  .then(res => res.json())
  .then(data => {
    alert(data.message);
    fetchUserStakes();
  });
}

function fetchUserStakes() {
  fetch('/user-stakes')
    .then(res => res.json())
    .then(data => {
      const container = document.getElementById('userStakes');
      container.innerHTML = '';
      data.forEach(stake => {
        const div = document.createElement('div');
        div.className = 'stake-entry';
        div.innerHTML = `
          <p>${stake.plan} - $${stake.amount} - ${stake.apy}% APY</p>
          <p>Start: ${stake.start_date} | Ends: ${stake.end_date || 'N/A'}</p>
          <p>Status: ${stake.status}</p>
          ${stake.status === 'active' ? `<button onclick="unstake(${stake.id})">Unstake</button>` : ''}
        `;
        container.appendChild(div);
      });
    });
}

function unstake(id) {
  fetch('/unstake', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ stake_id: id })
  })
  .then(res => res.json())
  .then(data => {
    alert(data.message);
    fetchUserStakes();
  });
}

document.addEventListener('DOMContentLoaded', fetchUserStakes);
