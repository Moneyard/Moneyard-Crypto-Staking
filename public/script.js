// This function runs when the user clicks "Sign Up"
function signup() {
    const username = document.getElementById('signup-username').value;
    const password = document.getElementById('signup-password').value;
    const refcode = document.getElementById('signup-refcode').value;

    if (!username || !password) {
        alert('Username and password are required.');
        return;
    }

    const data = { username, password, refcode };

    fetch('/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Sign-up successful! Please log in.');
            toggleForms();
        } else {
            alert(data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Something went wrong during sign-up!');
    });
}

// This function runs when the user clicks "Login"
function login() {
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    if (!username || !password) {
        alert('Username and password are required.');
        return;
    }

    const data = { username, password };

    fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Login successful!');
            // Redirect to dashboard or user-specific page
            window.location.href = '/dashboard';
        } else {
            alert(data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Something went wrong during login!');
    });
}

// Function to toggle between the sign-up and login forms
function toggleForms() {
    const signupForm = document.getElementById('signup-form');
    const loginForm = document.getElementById('login-form');

    if (signupForm.style.display === 'none') {
        signupForm.style.display = 'block';
        loginForm.style.display = 'none';
    } else {
        signupForm.style.display = 'none';
        loginForm.style.display = 'block';
    }
}
