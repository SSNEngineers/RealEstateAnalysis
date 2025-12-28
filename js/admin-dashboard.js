const API_URL = 'http://localhost:5000/api';

// ✅ Get token from storage
function getAdminToken() {
    return sessionStorage.getItem('adminToken') || localStorage.getItem('adminToken');
}

// ✅ Get admin from storage
function getAdmin() {
    const adminStr = sessionStorage.getItem('admin') || localStorage.getItem('admin');
    return adminStr ? JSON.parse(adminStr) : null;
}

// Load admin info and stats when page loads
document.addEventListener('DOMContentLoaded', function() {
    const admin = getAdmin();
    const token = getAdminToken();
    
    if (!admin || !token) {
        alert('Admin access required. Redirecting to login.');
        window.location.href = 'login.html';
        return;
    }
    
    loadAdminInfo();
    loadStatsFromBackend();
    
    // Refresh stats every 30 seconds
    setInterval(loadStatsFromBackend, 30000);
});

function loadAdminInfo() {
    const adminData = getAdmin();
    
    const adminNameElement = document.getElementById('adminName');
    if (adminNameElement && adminData && adminData.username) {
        adminNameElement.textContent = adminData.username;
    } else if (adminNameElement) {
        adminNameElement.textContent = 'Admin';
    }
    
    console.log('✅ Admin info loaded:', adminData.username || 'Admin');
}

// ✅ Load stats from backend
async function loadStatsFromBackend() {
    const token = getAdminToken();
    
    if (!token) {
        console.error('No admin token found');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/admin/stats`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch stats');
        }
        
        const data = await response.json();
        
        if (data.success) {
            // Update stats in UI
            const totalAnalyses = document.getElementById('totalAnalyses');
            const totalUsers = document.getElementById('totalUsers');
            const recentActivity = document.getElementById('recentActivity');
            
            if (totalAnalyses) {
                totalAnalyses.textContent = data.stats.totalAnalyses || 0;
                animateNumber(totalAnalyses, data.stats.totalAnalyses);
            }
            
            if (totalUsers) {
                totalUsers.textContent = data.stats.totalUsers || 0;
                animateNumber(totalUsers, data.stats.totalUsers);
            }
            
            if (recentActivity) {
                recentActivity.textContent = data.stats.recentActivity || 0;
                animateNumber(recentActivity, data.stats.recentActivity);
            }
            
            console.log('✅ Stats loaded:', data.stats);
            
            // Show additional info in console
            console.log('📊 Detailed Stats:');
            console.log('   - Completed:', data.stats.completedAnalyses);
            console.log('   - Pending:', data.stats.pendingAnalyses);
            console.log('   - Processing:', data.stats.processingAnalyses);
            console.log('   - Total Contacts:', data.stats.totalContacts);
            console.log('   - Recent Signins:', data.stats.recentSignins);
            console.log('   - Recent Contacts:', data.stats.recentContacts);
            
            if (data.topUsers && data.topUsers.length > 0) {
                console.log('👥 Top Active Users:');
                data.topUsers.forEach((user, idx) => {
                    console.log(`   ${idx + 1}. ${user.username} - ${user.analysisCount} analyses`);
                });
            }
            
            if (data.recentAnalyses && data.recentAnalyses.length > 0) {
                console.log('📋 Recent Analyses:');
                data.recentAnalyses.forEach((analysis, idx) => {
                    const userName = analysis.userId ? analysis.userId.username : 'Unknown';
                    console.log(`   ${idx + 1}. ${userName} - ${analysis.address} (${analysis.status})`);
                });
            }
            
            if (data.recentContacts && data.recentContacts.length > 0) {
                console.log('📧 Recent Contacts:');
                data.recentContacts.forEach((contact, idx) => {
                    console.log(`   ${idx + 1}. ${contact.fullname} - ${contact.subject} (${contact.status})`);
                });
            }
        }
        
    } catch (error) {
        console.error('❌ Error loading stats:', error);
        
        // Set default values on error
        const totalAnalyses = document.getElementById('totalAnalyses');
        const totalUsers = document.getElementById('totalUsers');
        const recentActivity = document.getElementById('recentActivity');
        
        if (totalAnalyses) totalAnalyses.textContent = '0';
        if (totalUsers) totalUsers.textContent = '0';
        if (recentActivity) recentActivity.textContent = '0';
    }
}

// ✅ Animate number change
function animateNumber(element, targetNumber) {
    const currentNumber = parseInt(element.textContent) || 0;
    
    if (currentNumber === targetNumber) return;
    
    const duration = 1000; // 1 second
    const steps = 20;
    const increment = (targetNumber - currentNumber) / steps;
    const stepDuration = duration / steps;
    
    let currentStep = 0;
    
    const interval = setInterval(() => {
        currentStep++;
        const newValue = Math.round(currentNumber + (increment * currentStep));
        element.textContent = newValue;
        
        if (currentStep >= steps) {
            element.textContent = targetNumber;
            clearInterval(interval);
        }
    }, stepDuration);
}

function goToHistory() {
    showNotification('History page coming soon', 'info');
    // window.location.href = 'admin-history.html';
}

// ✅ NEW: Navigate to Manage Users
function goToManageUsers() {
    window.location.href = 'admin-manage-users.html';
}

// ✅ NEW: Navigate to Contact Forms
function goToContacts() {
    window.location.href = 'admin-contacts.html';
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        sessionStorage.removeItem('adminToken');
        sessionStorage.removeItem('admin');
        localStorage.removeItem('adminToken');
        localStorage.removeItem('admin');
        
        console.log('✅ Admin logged out');
        window.location.href = 'login.html';
    }
}

function showNotification(message, type = 'info') {
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 
                        type === 'error' ? 'fa-exclamation-circle' : 
                        'fa-info-circle'}"></i>
        <span>${message}</span>
    `;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: ${type === 'success' ? '#28a745' : 
                      type === 'error' ? '#dc3545' : '#17a2b8'};
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
    }, 3000);
}

// Add CSS animations
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

// Make functions globally available
window.goToContacts = goToContacts;
window.goToManageUsers = goToManageUsers;