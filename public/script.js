document.addEventListener("DOMContentLoaded", () => {
    // Handle form switching
    document.getElementById("goToSignup").addEventListener("click", () => {
        document.getElementById("loginForm").style.display = "none";
        document.getElementById("signupForm").style.display = "block";
    });

    document.getElementById("goToLogin").addEventListener("click", () => {
        document.getElementById("signupForm").style.display = "none";
        document.getElementById("loginForm").style.display = "block";
    });

    document.getElementById("forgotPasswordLink").addEventListener("click", () => {
        document.getElementById("loginForm").style.display = "none";
        document.getElementById("forgotPasswordForm").style.display = "block";
    });

    document.getElementById("goToLoginFromForgot").addEventListener("click", () => {
        document.getElementById("forgotPasswordForm").style.display = "none";
        document.getElementById("loginForm").style.display = "block";
    });

    // Signup form handler
    const signupForm = document.getElementById("signupFormElement");
    if (signupForm) {
        signupForm.addEventListener("submit", function (e) {
            e.preventDefault();
            const username = document.getElementById("signupUsername").value;
            const email = document.getElementById("signupEmail").value;
            const password = document.getElementById("signupPassword").value;

            fetch("/api/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, email, password })
            })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        alert("Signup successful. Please log in.");
                        document.getElementById("signupForm").style.display = "none";
                        document.getElementById("loginForm").style.display = "block";
                    } else {
                        alert(data.error || "Signup failed.");
                    }
                })
                .catch(() => alert("Signup request failed."));
        });
    }

    // Login form handler
    const loginForm = document.getElementById("loginFormElement");
    if (loginForm) {
        loginForm.addEventListener("submit", function (e) {
            e.preventDefault();
            const email = document.getElementById("loginEmail").value;
            const password = document.getElementById("loginPassword").value;

            fetch("/api/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        alert("Login successful!");
                        localStorage.setItem("userId", data.userId);
                        localStorage.setItem("username", data.username);
                        window.location.href = "/dashboard"; // Redirect to dashboard after successful login
                    } else {
                        alert(data.error || "Unable to login");
                    }
                })
                .catch(() => alert("Login request failed."));
        });
    }

    // Forgot Password form handler
    const resetBtn = document.getElementById("sendResetLink");
    if (resetBtn) {
        resetBtn.addEventListener("click", async () => {
            const email = document.getElementById("resetEmail").value;
            const res = await fetch('/api/request-password-reset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const data = await res.json();
            alert(data.message || data.error);
        });
    }
});
