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

// Fetch deposit address based on selected network
function getDepositAddress() {
  const network = document.getElementById('network').value;
  let depositAddress = '';
  let networkLabel = '';

  // Match deposit address based on selected network
  if (network === 'Tron') {
    depositAddress = 'TJREgZTuTnvRrw5Fme4DDd6hSwCEwxQV3f';  // Tron (TRC20)
    networkLabel = 'Tron Network (TRC20)';
  } else if (network === 'BNB') {
    depositAddress = '0x2837db956aba84eb2670d00aeea5c0d8a9e20a01';  // BNB Smart Chain (BEP20)
    networkLabel = 'BNB Smart Chain (BEP20)';
  } else {
    depositAddress = '';  // No address if no valid network is selected
  }

  // Display the selected network and deposit address if it's found
  if (depositAddress) {
    document.getElementById('deposit-address').innerText = `Network: ${networkLabel}\nDeposit Address: ${depositAddress}`;
    document.getElementById('copy-button').style.display = 'inline-block'; // Enable the "Copy" button
    document.getElementById('deposit-address').setAttribute('data-copy-text', depositAddress); // Save the address for copying
  } else {
    document.getElementById('deposit-address').innerText = '';  // Clear address if network is invalid
    alert("Please select a valid network.");
    document.getElementById('copy-button').style.display = 'none';  // Hide the copy button
  }
}

// Copy to clipboard function
function copyToClipboard() {
  const depositAddress = document.getElementById('deposit-address').getAttribute('data-copy-text');
  
  if (depositAddress) {
    const tempTextArea = document.createElement('textarea');
    tempTextArea.value = depositAddress;
    document.body.appendChild(tempTextArea);
    tempTextArea.select();
    document.execCommand('copy');
    document.body.removeChild(tempTextArea);

    alert("Deposit address copied to clipboard!");
  }
}

// Log deposit (without requiring TxID input)
function logDeposit() {
  const userId = localStorage.getItem('userId') || 1;
  const amount = parseFloat(document.getElementById('deposit-amount').value);
  const network = document.getElementById('network').value;

  // Validate deposit amount
  if (!amount || amount < 15 || amount > 1000) {
    alert("Enter a valid amount between 15 and 1000 USDT.");
    return;
  }

  // Automatically fetch the TxID
  fetchTransactionId().then(txId => {
    // Log deposit with the fetched TxID
    fetch('/log-deposit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, amount, network, txId })
    })
    .then(res => res.json())
    .then(data => {
      alert(data.message || data.error);
    });
  }).catch(err => {
    alert('Error fetching TxID: ' + err.message);
  });
}

// Simulate fetching TxID (Replace with a real API call to fetch TxID)
function fetchTransactionId() {
  return new Promise((resolve, reject) => {
    // Simulate async call to get TxID (in a real-world scenario, this would be a call to a blockchain API)
    setTimeout(() => {
      const txId = '0x123456789abcdef'; // Example TxID
      resolve(txId);
    }, 2000); // Simulate delay
  });
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
