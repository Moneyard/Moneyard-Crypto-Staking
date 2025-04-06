document.getElementById("show-login").addEventListener("click", function() {
    document.getElementById("signup-form").style.display = "none";
    document.getElementById("login-form").style.display = "block";
});

document.getElementById("show-signup").addEventListener("click", function() {
    document.getElementById("login-form").style.display = "none";
    document.getElementById("signup-form").style.display = "block";
});

document.getElementById("back-to-login").addEventListener("click", function() {
    document.getElementById("forgot-password-form").style.display = "none";
    document.getElementById("login-form").style.display = "block";
});

document.getElementById("login").addEventListener("submit", function(e) {
    e.preventDefault();
    
    // Simulate login process
    const email = e.target.email.value;
    const password = e.target.password.value;
    
    if (email === "test@example.com" && password === "password123") {
        // Redirect to dashboard page
        window.location.href = "/dashboard";
    } else {
        alert("Invalid login credentials.");
    }
});
