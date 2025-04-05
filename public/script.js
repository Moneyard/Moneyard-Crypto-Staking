// Toggle between Sign Up, Log In, and Forgot Password forms
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

// Handle Sign Up Form Submission
document.getElementById("signup").addEventListener("submit", function(e) {
    e.preventDefault();
    console.log("Sign Up successful!");
    // Hide sign-up form and show login form after submission
    document.getElementById("signup-form").style.display = "none";
    document.getElementById("login-form").style.display = "block";
});

// Handle Log In Form Submission
document.getElementById("login").addEventListener("submit", function(e) {
    e.preventDefault();
    console.log("Log In successful!");
    // After successful login, redirect to another page (can be dashboard or home)
    window.location.href = '/dashboard';  // You can modify this to your desired route
});

// Handle Forgot Password Form Submission
document.getElementById("forgot-password").addEventListener("submit", function(e) {
    e.preventDefault();
    console.log("Password reset link sent!");
    document.getElementById("forgot-password-form").style.display = "none";
    document.getElementById("login-form").style.display = "block";
});
