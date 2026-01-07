/**
 * Closo Auth Pages - JavaScript
 */

document.addEventListener('DOMContentLoaded', function() {
    // Toggle password visibility
    initPasswordToggles();

    // Password strength indicator
    initPasswordStrength();

    // Form validation
    initFormValidation();
});

/**
 * Initialize password visibility toggles
 */
function initPasswordToggles() {
    const toggleButtons = document.querySelectorAll('.toggle-password');

    toggleButtons.forEach(button => {
        button.addEventListener('click', function() {
            const input = this.closest('.input-wrapper').querySelector('input');
            const eyeOpen = this.querySelector('.eye-open');
            const eyeClosed = this.querySelector('.eye-closed');

            if (input.type === 'password') {
                input.type = 'text';
                eyeOpen.style.display = 'none';
                eyeClosed.style.display = 'block';
            } else {
                input.type = 'password';
                eyeOpen.style.display = 'block';
                eyeClosed.style.display = 'none';
            }
        });
    });
}

/**
 * Initialize password strength indicator
 */
function initPasswordStrength() {
    const passwordInput = document.getElementById('password');
    const strengthBar = document.querySelector('.strength-bar');

    if (!passwordInput || !strengthBar) return;

    passwordInput.addEventListener('input', function() {
        const password = this.value;
        const strength = calculatePasswordStrength(password);

        strengthBar.className = 'strength-bar';

        if (password.length === 0) {
            strengthBar.style.width = '0';
        } else if (strength < 2) {
            strengthBar.classList.add('weak');
        } else if (strength < 4) {
            strengthBar.classList.add('medium');
        } else {
            strengthBar.classList.add('strong');
        }
    });
}

/**
 * Calculate password strength
 * @param {string} password
 * @returns {number} Strength score (0-5)
 */
function calculatePasswordStrength(password) {
    let strength = 0;

    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    return strength;
}

/**
 * Initialize form validation
 */
function initFormValidation() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    if (loginForm) {
        loginForm.addEventListener('submit', handleLoginSubmit);
    }

    if (registerForm) {
        registerForm.addEventListener('submit', handleRegisterSubmit);

        // Real-time password confirmation
        const passwordConfirm = document.getElementById('password-confirm');
        if (passwordConfirm) {
            passwordConfirm.addEventListener('input', validatePasswordMatch);
        }
    }
}

/**
 * Handle login form submission
 */
async function handleLoginSubmit(e) {
    e.preventDefault();

    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const email = form.querySelector('#email').value;
    const password = form.querySelector('#password').value;

    // Clear previous errors
    clearErrors(form);

    // Validate
    let hasErrors = false;

    if (!isValidEmail(email)) {
        showError(form.querySelector('#email'), 'Adresse email invalide');
        hasErrors = true;
    }

    if (password.length < 1) {
        showError(form.querySelector('#password'), 'Mot de passe requis');
        hasErrors = true;
    }

    if (hasErrors) return;

    // Submit
    submitBtn.classList.add('loading');
    submitBtn.disabled = true;

    try {
        const formData = new URLSearchParams();
        formData.append('username', email);
        formData.append('password', password);

        const response = await fetch(`${API_BASE_URL}/auth/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData,
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('access_token', data.access_token);

            // Recuperer les infos utilisateur
            const userResponse = await fetch(`${API_BASE_URL}/users/me`, {
                headers: {
                    'Authorization': `Bearer ${data.access_token}`
                }
            });

            if (userResponse.ok) {
                const user = await userResponse.json();
                localStorage.setItem('user', JSON.stringify(user));
            }

            // Redirect to return URL or app.html
            const returnUrl = localStorage.getItem('returnUrl');
            localStorage.removeItem('returnUrl');
            window.location.href = returnUrl || 'app.html';
        } else {
            showFormError(form, data.detail || 'Email ou mot de passe incorrect');
        }
    } catch (error) {
        showFormError(form, 'Une erreur est survenue. Veuillez reessayer.');
    } finally {
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
    }
}

/**
 * Handle register form submission
 */
async function handleRegisterSubmit(e) {
    e.preventDefault();

    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const username = form.querySelector('#username').value;
    const email = form.querySelector('#email').value;
    const password = form.querySelector('#password').value;
    const passwordConfirm = form.querySelector('#password-confirm').value;
    const terms = form.querySelector('#terms').checked;

    // Clear previous errors
    clearErrors(form);

    // Validate
    let hasErrors = false;

    if (username.length < 3) {
        showError(form.querySelector('#username'), 'Nom d\'utilisateur trop court (min. 3 caracteres)');
        hasErrors = true;
    }

    if (!isValidEmail(email)) {
        showError(form.querySelector('#email'), 'Adresse email invalide');
        hasErrors = true;
    }

    if (password.length < 8) {
        showError(form.querySelector('#password'), 'Minimum 8 caracteres');
        hasErrors = true;
    }

    if (password !== passwordConfirm) {
        showError(form.querySelector('#password-confirm'), 'Les mots de passe ne correspondent pas');
        hasErrors = true;
    }

    if (!terms) {
        showError(form.querySelector('#terms'), 'Vous devez accepter les conditions');
        hasErrors = true;
    }

    if (hasErrors) return;

    // Submit
    submitBtn.classList.add('loading');
    submitBtn.disabled = true;

    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, email, password }),
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('access_token', data.access_token);

            // Recuperer les infos utilisateur
            const userResponse = await fetch(`${API_BASE_URL}/users/me`, {
                headers: {
                    'Authorization': `Bearer ${data.access_token}`
                }
            });

            if (userResponse.ok) {
                const user = await userResponse.json();
                localStorage.setItem('user', JSON.stringify(user));
            }

            window.location.href = 'app.html';
        } else {
            showFormError(form, data.detail || 'Une erreur est survenue');
        }
    } catch (error) {
        showFormError(form, 'Une erreur est survenue. Veuillez reessayer.');
    } finally {
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
    }
}

/**
 * Validate password match in real-time
 */
function validatePasswordMatch() {
    const password = document.getElementById('password').value;
    const confirmPassword = this.value;
    const field = this.closest('.form-field');

    field.classList.remove('error', 'success');

    if (confirmPassword.length > 0) {
        if (password === confirmPassword) {
            field.classList.add('success');
        } else {
            field.classList.add('error');
        }
    }
}

/**
 * Validate email format
 */
function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

/**
 * Show error for a specific field
 */
function showError(input, message) {
    const field = input.closest('.form-field');
    field.classList.add('error');

    // Remove existing error message
    const existingError = field.querySelector('.error-message');
    if (existingError) existingError.remove();

    // Add error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
            <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <circle cx="12" cy="16" r="1" fill="currentColor"/>
        </svg>
        <span>${message}</span>
    `;
    field.appendChild(errorDiv);
}

/**
 * Show form-level error
 */
function showFormError(form, message) {
    // Remove existing form error
    const existingError = form.querySelector('.form-error');
    if (existingError) existingError.remove();

    // Add form error at top
    const errorDiv = document.createElement('div');
    errorDiv.className = 'form-error';
    errorDiv.style.cssText = `
        background: #fef2f2;
        border: 1px solid #fecaca;
        color: #dc2626;
        padding: 12px 16px;
        border-radius: 8px;
        font-size: 14px;
        margin-bottom: 16px;
        display: flex;
        align-items: center;
        gap: 8px;
    `;
    errorDiv.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
            <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <circle cx="12" cy="16" r="1" fill="currentColor"/>
        </svg>
        <span>${message}</span>
    `;
    form.insertBefore(errorDiv, form.firstChild);
}

/**
 * Clear all errors from form
 */
function clearErrors(form) {
    form.querySelectorAll('.form-field.error').forEach(field => {
        field.classList.remove('error');
    });
    form.querySelectorAll('.error-message').forEach(error => {
        error.remove();
    });
    form.querySelectorAll('.form-error').forEach(error => {
        error.remove();
    });
}

