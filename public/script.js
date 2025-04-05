// Function to toggle between Sign Up, Log In, and Forgot Password forms
document.getElementById("show-login").addEventListener("click", function() {
    document.getElementById("signup-form").style.display = "none";
    document.getElementById("login-form").style.display = "block";
});

document.getElementById("show-signup").addEventListener("click", function() {
    document.getElementById("login-form").style.display = "none";
    document.getElementById("signup-form").style.display = "block";
});

document.getElementById("show-forgot-password").addEventListener("click", function() {
    document.getElementById("login-form").style.display = "none";
    document.getElementById("forgot-password-form").style.display = "block";
});

document.getElementById("back-to-login").addEventListener("click", function() {
    document.getElementById("forgot-password-form").style.display = "none";
    document.getElementById("login-form").style.display = "block";
});

// Form submission logic

// Sign Up Form Submission
document.getElementById("signup").addEventListener("submit", function(e) {
    e.preventDefault();
    
    // Get values from form inputs
    const username = document.getElementById("signup-username").value;
    const email = document.getElementById("signup-email").value;
    const password = document.getElementById("signup-password").value;
    const refCode = document.getElementById("signup-ref-code").value;

    // Simulate sending data and show confirmation (you would replace this with API calls)
    console.log("Sign Up Info:", { username, email, password, refCode
