
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const errorMessage = document.getElementById('errorMessage');
    const signupErrorMessage = document.getElementById('signupErrorMessage');
    const signupSuccessMessage = document.getElementById('signupSuccessMessage');

    // Login form handler
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearMessages();

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const role = document.getElementById('role').value;

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password, role }),
            });

            const data = await response.json();

            if (response.ok) {
                // Login successful
                localStorage.setItem('token', data.token);
                localStorage.setItem('userRole', role);
                localStorage.setItem('userId', data.userId);
                localStorage.setItem('userName', data.userName);
                window.location.href = '/';
            } else {
                errorMessage.textContent = data.message || 'Login failed.';
            }
        } catch (error) {
            console.error('Error during login:', error);
            errorMessage.textContent = 'An error occurred. Please try again later.';
        }
    });

    // Signup form handler
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearMessages();

        const name = document.getElementById('signupName').value;
        const email = document.getElementById('signupEmail').value;
        const password = document.getElementById('signupPassword').value;
        const confirmPassword = document.getElementById('signupConfirmPassword').value;
        const role = document.getElementById('signupRole').value;

        // Validate passwords match
        if (password !== confirmPassword) {
            signupErrorMessage.textContent = 'Passwords do not match.';
            return;
        }

        // Validate password length
        if (password.length < 6) {
            signupErrorMessage.textContent = 'Password must be at least 6 characters long.';
            return;
        }

        try {
            const response = await fetch('/api/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, email, password, role }),
            });

            const data = await response.json();

            if (response.ok) {
                signupSuccessMessage.textContent = 'Account created successfully! You can now sign in.';
                // Switch to login form after successful signup
                setTimeout(() => {
                    toggleAuthForm();
                    // Pre-fill the email field
                    document.getElementById('email').value = email;
                    document.getElementById('role').value = role;
                }, 2000);
            } else {
                signupErrorMessage.textContent = data.message || 'Signup failed.';
            }
        } catch (error) {
            console.error('Error during signup:', error);
            signupErrorMessage.textContent = 'An error occurred. Please try again later.';
        }
    });

    function clearMessages() {
        errorMessage.textContent = '';
        signupErrorMessage.textContent = '';
        signupSuccessMessage.textContent = '';
    }
});

// Toggle between login and signup forms
function toggleAuthForm() {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const toggleText = document.getElementById('toggleText');
    const toggleButton = document.getElementById('toggleButton');

    if (loginForm.classList.contains('hidden')) {
        // Switch to login
        loginForm.classList.remove('hidden');
        signupForm.classList.add('hidden');
        toggleText.textContent = "Don't have an account?";
        toggleButton.textContent = "Create New Account";
    } else {
        // Switch to signup
        loginForm.classList.add('hidden');
        signupForm.classList.remove('hidden');
        toggleText.textContent = "Already have an account?";
        toggleButton.textContent = "Sign In";
    }
}
