function toggleForms() {
    const signup = document.getElementById('signup-form');
    const login = document.getElementById('login-form');
    signup.style.display = signup.style.display === 'none' ? 'block' : 'none';
    login.style.display = login.style.display === 'none' ? 'block' : 'none';
}

function signup() {
    const username = document.getElementById('signup-username').value;
    const password = document.getElementById('signup-password').value;

    if (username && password) {
        localStorage.setItem('username', username);
        localStorage.setItem('password', password);
        alert('Signup successful. You can now log in.');
        toggleForms();
    } else {
        alert('Please fill in both username and password.');
    }
}

function login() {
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    const savedUser = localStorage.getItem('username');
    const savedPass = localStorage.getItem('password');

    if (username === savedUser && password === savedPass) {
        window.location.href = "dashboard.html";
    } else {
        alert('Invalid login credentials.');
    }
}
