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

// Sign Up Form Submission
document.getElementById("signup").addEventListener("submit", function(e) {
    e.preventDefault();
    
    const username = document.getElementById("signup-username").value;
    const email = document.getElementById("signup-email").value;
    const password = document.getElementById("signup-password").value;
    const refCode = document.getElementById("signup-ref-code").value;

    console.log("Sign Up Info:", { username, email, password, refCode });
    alert("Sign Up Successful!");

    document.getElementById("signup-form").style.display = "none";
    document.getElementById("login-form").style.display = "block";
});

// Log In Form Submission
document.getElementById("login").addEventListener("submit", function(e) {
    e.preventDefault();

    const loginEmail = document.getElementById("login-email").value;
    const loginPassword = document.getElementById("login-password").value;

    console.log("Login Info:", { email: loginEmail, password: loginPassword });
    alert("Login Successful!");
});

// Forgot Password Form Submission
document.getElementById("forgot-password").addEventListener("submit", function(e) {
    e.preventDefault();

    const forgotPasswordEmail = document.getElementById("forgot-password-email").value;

    console.log("Password Reset Request for:", { email: forgotPasswordEmail });
    alert("Password reset link sent!");

    document.getElementById("forgot-password-form").style.display = "none";
    document.getElementById("login-form").style.display = "block";
});
