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

// Handle form submissions
document.getElementById("signup").addEventListener("submit", function(e) {
    e.preventDefault();
    console.log("Sign Up successful!");
    document.getElementById("signup-form").style.display = "none";
    document.getElementById("login-form").style.display = "block";
});

document.getElementById("login").addEventListener("submit", function(e) {
    e.preventDefault();
    console.log("Log In successful!");
});

document.getElementById("forgot-password").addEventListener("submit", function(e) {
    e.preventDefault();
    console.log("Password reset link sent!");
    document.getElementById("forgot-password-form").style.display = "none";
    document.getElementById("login-form").style.display = "block";
});
