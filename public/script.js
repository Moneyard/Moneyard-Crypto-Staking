function toggleForms() {
    const signupForm = document.getElementById("signup-form");
    const loginForm = document.getElementById("login-form");

    signupForm.style.display = signupForm.style.display === "none" ? "block" : "none";
    loginForm.style.display = loginForm.style.display === "none" ? "block" : "none";
}

function signup() {
    const username = document.getElementById("signup-username").value;
    const password = document.getElementById("signup-password").value;
    const refcode = document.getElementById("signup-refcode").value;

    // Validate input fields
    if (!username || !password) {
        alert("Please enter both username and password.");
        return;
    }

    // Send signup request
    fetch("/signup", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password, refcode }),
    })
        .then((response) => response.json())
        .then((data) => {
            if (data.success) {
                alert("Sign Up Successful! Now you can log in.");
                toggleForms();  // Switch to the login form
            } else {
                alert(data.error);
            }
        })
        .catch((error) => {
            console.error("Error:", error);
        });
}

function login() {
    const username = document.getElementById("login-username").value;
    const password = document.getElementById("login-password").value;

    // Validate input fields
    if (!username || !password) {
        alert("Please enter both username and password.");
        return;
    }

    // Send login request
    fetch("/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
    })
        .then((response) => response.json())
        .then((data) => {
            if (data.success) {
                alert("Login successful!");
                // Optionally, redirect to the dashboard page
                window.location.href = "/dashboard";
            } else {
                alert(data.error);
            }
        })
        .catch((error) => {
            console.error("Error:", error);
        });
}
