// ==================== USER AUTHENTICATION LOGIC (SIGNUP ONLY) ====================
// NOTE: Admin login is handled by login.js
// This file only handles USER signup and general auth utilities

// ==================== PASSWORD VISIBILITY TOGGLE ====================
function togglePassword(fieldId = 'password') {
    const field = document.getElementById(fieldId);
    let icon;
    
    // Handle different icon IDs for different pages
    if (fieldId === 'password') {
        icon = document.getElementById('toggleIcon');
    } else if (fieldId === 'confirmPassword') {
        icon = document.getElementById('toggleIcon2');
    }
    
    if (!field) return;
    
    if (field.type === 'password') {
        field.type = 'text';
        if (icon) {
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        }
    } else {
        field.type = 'password';
        if (icon) {
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    }
}

// Make globally available
window.togglePassword = togglePassword;

// ==================== USER SIGNUP FORM HANDLER ====================
// Only runs if signup form exists (not on admin login page)
const signupForm = document.getElementById('signupForm');

if (signupForm) {
    signupForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const fullname = document.getElementById('fullname').value;
        const email = document.getElementById('email').value;
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const termsAccepted = document.getElementById('terms')?.checked;
        
        // Validate passwords match
        if (password !== confirmPassword) {
            showNotification('Passwords do not match!', 'error');
            return;
        }
        
        // Validate terms (if checkbox exists)
        if (termsAccepted === false) {
            showNotification('Please accept the terms and conditions', 'error');
            return;
        }
        
        // Store user data (in real app, this would register with backend)
        const userData = {
            fullname: fullname,
            email: email,
            username: username,
            loggedIn: true,
            loginTime: new Date().toISOString(),
            role: 'user' // Mark as regular user
        };
        
        sessionStorage.setItem('ssnai_user', JSON.stringify(userData));
        
        // Show success message
        showNotification('Account created successfully! Redirecting...', 'success');
        
        // Redirect to user dashboard
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1000);
    });
}

// ==================== GOOGLE LOGIN/SIGNUP (PLACEHOLDER) ====================
function loginWithGoogle() {
    showNotification('Google Sign-In will be implemented with backend', 'info');
}

function signupWithGoogle() {
    showNotification('Google Sign-Up will be implemented with backend', 'info');
}

// Make globally available
window.loginWithGoogle = loginWithGoogle;
window.signupWithGoogle = signupWithGoogle;

// ==================== NOTIFICATION SYSTEM ====================
function showNotification(message, type = 'info') {
    // Remove existing notification
    const existing = document.querySelector('.notification');
    if (existing) {
        existing.remove();
    }
    
    // Create notification
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    let icon = 'fa-info-circle';
    if (type === 'success') icon = 'fa-check-circle';
    if (type === 'error') icon = 'fa-exclamation-circle';
    if (type === 'warning') icon = 'fa-exclamation-triangle';
    
    notification.innerHTML = `
        <i class="fas ${icon}"></i>
        <span>${message}</span>
    `;
    
    let bgColor = '#17a2b8';
    if (type === 'success') bgColor = '#28a745';
    if (type === 'error') bgColor = '#dc3545';
    if (type === 'warning') bgColor = '#ffc107';
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: ${bgColor};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        display: flex;
        align-items: center;
        gap: 0.75rem;
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

console.log('✅ auth.js loaded - User signup handler ready');