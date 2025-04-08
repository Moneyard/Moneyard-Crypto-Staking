document.addEventListener('DOMContentLoaded', function () {
    // Toggle between Sign Up and Login forms
    const signUpForm = document.getElementById('signup-form');
    const loginForm = document.getElementById('login-form');
    const signupButton = document.getElementById('signup-button');
    const loginButton = document.getElementById('login-button');
    const signUpToLoginLink = document.getElementById('sign-up-to-login');
    const loginToSignUpLink = document.getElementById('login-to-signup');
    
    // Show login form after successful sign up
    signupButton.addEventListener('click', function (e) {
        e.preventDefault(); // Prevent default form submission
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        
        if (email && password) {
            // Send POST request to register
            fetch('/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            }).then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Show login form after successful sign-up
                    signUpForm.style.display = 'none';
                    loginForm.style.display = 'block';
                } else {
                    alert('Sign up failed: ' + data.error);
                }
            });
        }
    });
    
    // Handle Login
    loginButton.addEventListener('click', function (e) {
        e.preventDefault(); // Prevent default form submission
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        
        if (email && password) {
            // Send POST request to log in
            fetch('/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            }).then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Redirect to dashboard after login
                    window.location.href = '/dashboard';
                } else {
                    alert('Login failed: ' + data.error);
                }
            });
        }
    });

    // Toggle between forms
    signUpToLoginLink.addEventListener('click', function (e) {
        e.preventDefault();
        signUpForm.style.display = 'none';
        loginForm.style.display = 'block';
    });

    loginToSignUpLink.addEventListener('click', function (e) {
        e.preventDefault();
        loginForm.style.display = 'none';
        signUpForm.style.display = 'block';
    });
});
