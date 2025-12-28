const API_URL = 'http://localhost:5000/api';

function togglePassword() {
    const field = document.getElementById('password');
    const icon = document.getElementById('toggleIcon');
    
    if (field.type === 'password') {
        field.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        field.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

function showNotification(message, type) {
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    let bgColor = type === 'success' ? '#28a745' : '#dc3545';
    
    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    
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
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

// Add CSS animations only if not already added
if (!document.getElementById('register-animations')) {
    const animationStyle = document.createElement('style');
    animationStyle.id = 'register-animations';
    animationStyle.textContent = `
        @keyframes slideIn {
            from { transform: translateX(400px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(400px); opacity: 0; }
        }
    `;
    document.head.appendChild(animationStyle);
}

// Check if backend is running
async function checkBackend() {
    try {
        const response = await fetch(`http://localhost:5000/health`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        return response.ok;
    } catch (error) {
        return false;
    }
}

// User Signup Form
const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const fullname = document.getElementById('fullname').value.trim();
        const email = document.getElementById('email').value.trim();
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        
        // Validation
        if (!fullname || !email || !username || !password) {
            showNotification('Please fill in all fields', 'error');
            return;
        }
        
        if (password.length < 8) {
            showNotification('Password must be at least 8 characters', 'error');
            return;
        }
        
        const submitBtn = this.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Account...';
        submitBtn.disabled = true;
        
        // Check if backend is running
        const backendRunning = await checkBackend();
        if (!backendRunning) {
            showNotification('Error: Backend server is not running! Please start the server.', 'error');
            submitBtn.innerHTML = originalBtnText;
            submitBtn.disabled = false;
            return;
        }
        
        try {
            console.log('Sending signup request to:', `${API_URL}/auth/signup`);
            
            const response = await fetch(`${API_URL}/auth/signup`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ 
                    fullname, 
                    email, 
                    username, 
                    password 
                })
            });
            
            console.log('Response status:', response.status);
            
            const data = await response.json();
            console.log('Response data:', data);
            
            if (data.success) {
                // Store token and user data
                sessionStorage.setItem('token', data.token);
                sessionStorage.setItem('user', JSON.stringify(data.user));
                
                console.log('✅ User token stored:', data.token);
                console.log('✅ User data stored:', data.user);
                
                showNotification('Account created successfully! Redirecting to dashboard...', 'success');
                
                setTimeout(() => {
                    console.log('🚀 Redirecting to dashboard.html');
                    window.location.href = 'dashboard.html';
                }, 1500);
            } else {
                showNotification(data.message || 'Signup failed. Please try again.', 'error');
                submitBtn.innerHTML = originalBtnText;
                submitBtn.disabled = false;
            }
            
        } catch (error) {
            console.error('Signup error:', error);
            showNotification('Network error! Make sure the backend server is running on port 5000.', 'error');
            submitBtn.innerHTML = originalBtnText;
            submitBtn.disabled = false;
        }
    });
}

window.togglePassword = togglePassword;

console.log('✅ User signup handler ready');