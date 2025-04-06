window.onload = function() {
  const userId = localStorage.getItem("userId"); // Assumed to be saved in localStorage during login
  if (!userId) {
    window.location.href = 'index.html'; // Redirect to login page if no user is logged in
  }
  
  // Fetch user data
  fetch(`/user/${userId}`)
    .then(response => response.json())
    .then(data => {
      document.getElementById('user-name').textContent = data.username;
      document.getElementById('account-balance').textContent = data.balance;
      loadTransactionHistory(userId);
    });

  document.getElementById('deposit-btn').addEventListener('click', deposit);
  document.getElementById('withdraw-btn').addEventListener('click', withdraw);
  document.getElementById('logout-btn').addEventListener('click', logout);
};

// Deposit function
function deposit() {
  const amount = prompt("Enter the amount to deposit (15-1000 USDT):");
  if (amount >= 15 && amount <= 1000) {
    const network = prompt("Enter the network (TRC20/BEP20):");
    fetch("/deposit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        userId: localStorage.getItem("userId"),
        amount: amount,
        network: network
      })
    })
      .then(response => response.json())
      .then(data => alert(data.message));
  } else {
    alert("Deposit amount must be between 15 and 1000 USDT.");
  }
}

// Withdraw function
function withdraw() {
  const amount = prompt("Enter the amount to withdraw:");
  const password = prompt("Enter your password:");
  fetch("/withdraw", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      userId: localStorage.getItem("userId"),
      amount: amount,
      password: password
    })
  })
    .then(response => response.json())
    .then(data => alert(data.message));
}

// Transaction History
function loadTransactionHistory(userId) {
  fetch(`/transactions/${userId}`)
    .then(response => response.json())
    .then(data => {
      const transactionsList = document.getElementById("transactions-list");
      data.transactions.forEach(transaction => {
        const li = document.createElement("li");
        li.textContent = `${transaction.type} - ${transaction.amount} USDT on ${transaction.date}`;
        transactionsList.appendChild(li);
      });
    })
    .catch(err => console.error("Error fetching transactions:", err));
}

// Logout
function logout() {
  localStorage.removeItem('userId');
  window.location.href = 'index.html'; // Redirect to login page
}
