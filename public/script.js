// Client-side Configuration
const API_BASE_URL = window.location.origin; // Auto-detect Heroku/production URL
let authToken = null;

// Initialize authentication state
document.addEventListener('DOMContentLoaded', () => {
  authToken = localStorage.getItem('token');
  if (authToken) {
    checkTokenValidity();
    updateAuthUI(true);
  } else {
    updateAuthUI(false);
  }

  // Add event listener for the earnings calculation input field
  const depositInput = document.getElementById('deposit-input');
  if (depositInput) {
    depositInput.addEventListener('input', calculateEarnings);
  }
});

// UI Management
function updateAuthUI(isLoggedIn) {
  const authElements = document.querySelectorAll('[data-auth]');
  authElements.forEach(element => {
    element.style.display = element.dataset.auth === (isLoggedIn ? 'authenticated' : 'anonymous') 
      ? 'block' 
      : 'none';
  });
}

// Form Navigation
function showForm(formId) {
  document.querySelectorAll('.auth-form').forEach(form => {
    form.style.display = form.id === formId ? 'block' : 'none';
  });
}

// ===== EARNINGS CALCULATOR =====
function calculateEarnings() {
  const amount = parseFloat(document.getElementById('deposit-input').value);
  console.log(`Calculating earnings for amount: ${amount}`);  // Debugging log
  
  const minDeposit = 15;
  
  if (isNaN(amount) || amount < minDeposit) {
    showToast(`Minimum deposit is ${minDeposit} USDT`, 'error');
    document.getElementById('calculated-earnings').innerHTML = '';  // Clear previous results
    console.log('Invalid amount');  // Debugging log
    return;
  }
  
  // Assuming 0.08% daily return, adjust this if necessary
  const dailyEarnings = amount * 0.08;  
  const monthlyEarnings = dailyEarnings * 30;  // Calculate monthly earnings
  
  console.log(`Daily Earnings: ${dailyEarnings.toFixed(2)} USDT`);  // Debugging log
  console.log(`Monthly Earnings: ${monthlyEarnings.toFixed(2)} USDT`);  // Debugging log
  
  // Update earnings display with both daily and monthly estimates
  document.getElementById('calculated-earnings').innerHTML = `
    Daily Earnings: <strong>${dailyEarnings.toFixed(2)} USDT</strong><br>
    Estimated Monthly Earnings: <strong>${monthlyEarnings.toFixed(2)} USDT</strong>
  `;
}

// ===== UTILITY FUNCTIONS =====
function showLoader(loaderId) {
  document.getElementById(loaderId).style.display = 'block';
}

function hideLoader(loaderId) {
  document.getElementById(loaderId).style.display = 'none';
}

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => toast.remove(), 5000);
}

function displayErrorMessages(errors) {
  const errorContainer = document.getElementById('password-error');
  errorContainer.innerHTML = errors.join('<br>');
  errorContainer.style.display = 'block';
}

// Simple email validation function
function validateEmail(email) {
  const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailPattern.test(email);
}

// Initial Form State
document.addEventListener('DOMContentLoaded', () => {
  if (localStorage.getItem('currentUser')) {
    window.location.href = 'dashboard.html';
  }
});
