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

document.addEventListener('DOMContentLoaded', () => {
  const sections = document.querySelectorAll('.animated-section');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1 });

  sections.forEach(section => observer.observe(section));
});

// Toggle between signup and login forms
function toggleForms() {
  const signupForm = document.getElementById('signup-form');
  const loginForm = document.getElementById('login-form');

  signupForm.style.display = signupForm.style.display === 'none' ? 'block' : 'none';
  loginForm.style.display = loginForm.style.display === 'none' ? 'block' : 'none';
}

// Signup handler
function signup() {
  const username = document.getElementById('signup-username').value;
  const password = document.getElementById('signup-password').value;

  if (username && password) {
    localStorage.setItem('username', username);
    localStorage.setItem('password', password);
    alert("Signup successful! Please login.");
    toggleForms();
  } else {
    alert("Please fill in all required fields.");
  }
}

// Login handler
function login() {
  const username = document.getElementById('login-username').value;
  const password = document.getElementById('login-password').value;

  const storedUser = localStorage.getItem('username');
  const storedPass = localStorage.getItem('password');

  if (username === storedUser && password === storedPass) {
    localStorage.setItem('userId', 1); // Static userId for now
    window.location.href = "dashboard.html";
  } else {
    alert("Invalid credentials. Please try again.");
  }
}

// Check if the user is logged in (i.e., userId exists in localStorage)
function isUserLoggedIn() {
  const userId = localStorage.getItem('userId');
  return userId !== null;
}

// Calculate earnings (8% daily)
function calculateEarnings() {
  const depositAmount = parseFloat(document.getElementById('deposit-input').value);

  if (!depositAmount || depositAmount < 15 || depositAmount > 1000) {
    alert("Please enter a valid deposit amount between 15 and 1000 USDT.");
    return;
  }

  const dailyEarnings = depositAmount * 0.08; // 8% daily earnings
  const earningsMessage = `Your daily earnings are: ${dailyEarnings.toFixed(2)} USDT.`;

  document.getElementById('calculated-earnings').innerText = earningsMessage;
}

// Fetch user summary (username, total deposit, balance)
function loadUserSummary() {
  const userId = localStorage.getItem('userId');
  
  // If userId is not found, do not load the summary
  if (!userId) {
    console.log('User is not logged in, skipping summary load');
    return;
  }

  fetch(`/user-summary?userId=${userId}`)
    .then(res => res.json())
    .then(data => {
      if (data.totalDeposit !== undefined && data.balance !== undefined) {
        // Display the username and balance in the dashboard
        document.getElementById('summary-username').innerText = localStorage.getItem('username');
        document.getElementById('summary-total').innerText = `${data.totalDeposit.toFixed(2)} USDT`;
        document.getElementById('summary-balance').innerText = `${data.balance.toFixed(2)} USDT`;
      } else {
        alert("Failed to load user summary.");
      }
    })
    .catch(err => {
      console.error("Error loading user summary:", err);
      alert("Failed to load user summary.");
    });
}

// Call loadUserSummary only if user is logged in
document.addEventListener("DOMContentLoaded", function () {
  // Only attempt to load the user summary if the user is logged in
  if (isUserLoggedIn()) {
    loadUserSummary();
  } else {
    console.log('User is not logged in. Skipping user summary load.');
  }
});
// Logout function
function logout() {
  localStorage.removeItem('userId');
  window.location.href = "index.html";
}

function navigateTo(page) {
  switch (page) {
    case 'home':
      window.location.href = 'dashboard.html'; // change to your actual home page
      break;
    case 'referral':
      window.location.href = 'referral.html'; // or open referral section
      break;
    case 'stake':
      window.location.href = 'stake.html';
      break;
    case 'assets':
      window.location.href = 'assets.html';
      break;
    default:
      break;
  }
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
// Scroll-based animation for sections
document.addEventListener("DOMContentLoaded", () => {
  const animatedSections = document.querySelectorAll('.animated-section');

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.2 });

  animatedSections.forEach(section => {
    observer.observe(section);
  });

  // Counter Animation
  const counters = document.querySelectorAll('.counter');

  counters.forEach(counter => {
    const updateCount = () => {
      const target = +counter.getAttribute('data-target');
      const current = +counter.innerText;
      const increment = target / 100;

      if (current < target) {
        counter.innerText = Math.ceil(current + increment);
        setTimeout(updateCount, 30);
      } else {
        counter.innerText = target;
      }
    };

    const counterObserver = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        updateCount();
        counterObserver.disconnect(); // Run only once
      }
    });

    counterObserver.observe(counter);
  });
});
document.addEventListener("DOMContentLoaded", () => {
  // Scroll reveal for animated sections
  const animatedSections = document.querySelectorAll('.animated-section');

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1 });

  animatedSections.forEach(section => {
    observer.observe(section);
  });

  // Counter animation
  const counters = document.querySelectorAll('.counter');

  counters.forEach(counter => {
    const updateCount = () => {
      const target = +counter.getAttribute('data-target');
      const count = +counter.innerText;
      const speed = 20;
      const increment = target / speed;

      if (count < target) {
        counter.innerText = Math.ceil(count + increment);
        setTimeout(updateCount, 50);
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
});
function handleForgotPassword() {
  const email = document.getElementById('email').value;
  if (!email) {
    alert('Please enter your email first so we can send the reset link.');
    return;
  }

  // Send email to backend to start password reset
  fetch('/api/forgot-password', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({email})
  })
  .then(res => res.json())
  .then(data => {
    alert(data.message || 'If this email exists, a reset link has been sent.');
  })
  .catch(() => alert('Failed to send reset link. Please try again.'));
}
document.addEventListener("DOMContentLoaded", () => {
    const signupForm = document.getElementById("signupForm");
    const loginForm = document.getElementById("loginForm");

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
                document.getElementById("signupSection").style.display = "none";
                document.getElementById("loginSection").style.display = "block";
            } else {
                alert(data.error || "Signup failed.");
            }
        });
    }

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
