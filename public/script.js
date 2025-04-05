// Toggle visibility of forms
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

// Form submission (you can add actual API calls here later)
document.getElementById("signup").addEventListener("submit", function(e) {
    e.preventDefault();
    alert("Sign Up Successful!");
    document.getElementById("signup-form").style.display = "none";
    document.getElementById("login-form").style.display = "block";
});

document.getElementById("login").addEventListener("submit", function(e) {
    e.preventDefault();
    alert("Login Successful!");
});

document.getElementById("forgot-password").addEventListener("submit", function(e) {
    e.preventDefault();
    alert("Password reset link sent!");
    document.getElementById("forgot-password-form").style.display = "none";
    document.getElementById("login-form").style.display = "block";
});
