const API_URL = 'http://localhost:5000/api';

function togglePassword() {
    const field = document.getElementById('password');
    const icon = document.getElementById('toggleIcon');
    
    if (field && icon) {
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
if (!document.getElementById('auth-animations')) {
    const animationStyle = document.createElement('style');
    animationStyle.id = 'auth-animations';
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

function loginWithGoogle() {
    showNotification('Google Sign-In will be implemented later', 'error');
}

// Check if backend is running
async function checkBackend() {
    try {
        const response = await fetch(`http://localhost:5000/health`);
        return response.ok;
    } catch (error) {
        return false;
    }
}

// User Signin Form
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        const remember = document.getElementById('remember')?.checked || false;
        
        if (!username || !password) {
            showNotification('Please enter username and password', 'error');
            return;
        }
        
        const submitBtn = this.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing In...';
        submitBtn.disabled = true;
        
        // Check if backend is running
        const backendRunning = await checkBackend();
        if (!backendRunning) {
            showNotification('Error: Backend server is not running!', 'error');
            submitBtn.innerHTML = originalBtnText;
            submitBtn.disabled = false;
            return;
        }
        
        try {
            console.log('Sending signin request to:', `${API_URL}/auth/signin`);
            
            const response = await fetch(`${API_URL}/auth/signin`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });
            
            console.log('Response status:', response.status);
            
            const data = await response.json();
            console.log('Response data:', data);
            
            if (data.success) {
                const storage = remember ? localStorage : sessionStorage;
                storage.setItem('token', data.token);
                storage.setItem('user', JSON.stringify(data.user));
                
                console.log('✅ User token stored:', data.token);
                console.log('✅ User data stored:', data.user);
                
                showNotification('Login successful! Redirecting to dashboard...', 'success');
                
                setTimeout(() => {
                    console.log('🚀 Redirecting to dashboard.html');
                    window.location.href = 'dashboard.html';
                }, 1500);
            } else {
                showNotification(data.message || 'Login failed. Invalid credentials.', 'error');
                submitBtn.innerHTML = originalBtnText;
                submitBtn.disabled = false;
            }
            
        } catch (error) {
            console.error('Login error:', error);
            showNotification('Network error! Make sure backend server is running.', 'error');
            submitBtn.innerHTML = originalBtnText;
            submitBtn.disabled = false;
        }
    });
}

window.togglePassword = togglePassword;
window.loginWithGoogle = loginWithGoogle;

console.log('✅ User signin handler ready');