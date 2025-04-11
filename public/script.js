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

// Example using localStorage
window.addEventListener('DOMContentLoaded', () => {
  // Load username from localStorage if available
  const username = localStorage.getItem('username');
  if (username) {
    document.getElementById('summary-username').textContent = username;
  } else {
    document.getElementById('summary-username').textContent = 'Loading...'; // Default text if username is not found
  }
});

// After a successful login API call, store the username in localStorage
function handleLoginSuccess(response) {
  if (response.success) {
    localStorage.setItem('username', response.username); // Store username in localStorage
    localStorage.setItem('userId', response.userId); // Store userId in localStorage
    window.location.href = "/dashboard"; // Redirect to dashboard after login
  } else {
    alert(response.error || "Login failed.");
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
      const username = localStorage.getItem('username') || 'User';  // Default to 'User' if username is not set
      document.getElementById('summary-username').innerText = username;
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
  localStorage.removeItem('username'); // Remove username from localStorage
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
      handleLoginSuccess(data);
    });
  }
});
