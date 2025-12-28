const API_URL = 'http://localhost:5000/api';

console.log('🔐 Admin login.js loaded');

// Check if already logged in
document.addEventListener('DOMContentLoaded', function() {
    const adminToken = sessionStorage.getItem('adminToken') || localStorage.getItem('adminToken');
    if (adminToken) {
        console.log('✅ Admin already logged in');
        window.location.href = 'admin-dashboard.html';
    }
});

function togglePassword(fieldId = 'password') {
    const field = document.getElementById(fieldId);
    const icon = document.getElementById('toggleIcon');
    
    if (!field || !icon) return;
    
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
        box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        gap: 0.75rem;
        z-index: 10000;
        animation: slideIn 0.3s ease;
        max-width: 400px;
        white-space: pre-line;
    `;
    
    document.body.appendChild(notification);
    
    const duration = type === 'error' ? 6000 : 3000;
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, duration);
}

// Add animations
const styleSheet = document.createElement('style');
styleSheet.textContent = `
    @keyframes slideIn {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(400px); opacity: 0; }
    }
`;
document.head.appendChild(styleSheet);

// Check if backend is running
async function checkBackend() {
    try {
        const response = await fetch(`http://localhost:5000/health`);
        return response.ok;
    } catch (error) {
        return false;
    }
}

// ADMIN LOGIN FORM HANDLER
const loginForm = document.getElementById('loginForm');

if (loginForm) {
    loginForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        
        console.log('🔐 Admin login form submitted');

        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        const email = document.getElementById('officialEmail').value.trim();
        const officeId = document.getElementById('officeId').value.trim();
        const remember = document.getElementById('remember')?.checked || false;

        // Basic validation
        if (!username || !password || !email || !officeId) {
            showNotification('Please fill in all fields', 'error');
            return false;
        }

        const submitBtn = this.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying...';
        submitBtn.disabled = true;

        // Check if backend is running
        const backendRunning = await checkBackend();
        if (!backendRunning) {
            showNotification('Error: Backend server is not running!', 'error');
            submitBtn.innerHTML = originalBtnText;
            submitBtn.disabled = false;
            return false;
        }

        try {
            console.log('📡 Sending admin login request...');
            
            const response = await fetch(`${API_URL}/admin/login`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    username,
                    password,
                    officialEmail: email,
                    officeId
                })
            });
            
            console.log('Response status:', response.status);
            
            const data = await response.json();
            console.log('Response data:', data);
            
            if (data.success) {
                console.log('✅ Admin credentials VALID');
                
                const storage = remember ? localStorage : sessionStorage;
                storage.setItem('adminToken', data.token);
                storage.setItem('admin', JSON.stringify(data.admin));
                
                showNotification('✅ Admin login successful! Redirecting to dashboard...', 'success');
                
                setTimeout(() => {
                    console.log('🚀 Redirecting to admin-dashboard.html');
                    window.location.href = 'admin-dashboard.html';
                }, 1000);
                
                return true;
                
            } else {
                console.log('❌ Admin credentials INVALID');
                
                showNotification(
                    data.message || 'Invalid admin credentials. Please check all fields.',
                    'error'
                );
                
                submitBtn.innerHTML = originalBtnText;
                submitBtn.disabled = false;
                return false;
            }
            
        } catch (error) {
            console.error('❌ Admin login error:', error);
            showNotification(
                'Network error! Make sure backend server is running.',
                'error'
            );
            submitBtn.innerHTML = originalBtnText;
            submitBtn.disabled = false;
            return false;
        }
    });
}

window.togglePassword = togglePassword;

console.log('✅ Admin login system ready');