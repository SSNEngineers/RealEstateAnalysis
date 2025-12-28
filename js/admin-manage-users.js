const API_URL = 'http://localhost:5000/api';

console.log('👥 Admin manage users page loaded');

// Get admin token
function getAdminToken() {
    return sessionStorage.getItem('adminToken') || localStorage.getItem('adminToken');
}

// Check admin authentication
document.addEventListener('DOMContentLoaded', function() {
    const token = getAdminToken();
    
    if (!token) {
        alert('Admin access required. Redirecting to login.');
        window.location.href = 'login.html';
        return;
    }
    
    loadUsers();
});

// Load all users
async function loadUsers() {
    const token = getAdminToken();
    const usersList = document.getElementById('usersList');
    const loadingDiv = document.getElementById('loading');
    const emptyState = document.getElementById('emptyState');
    const userCount = document.getElementById('userCount');
    
    try {
        loadingDiv.style.display = 'block';
        usersList.style.display = 'none';
        emptyState.style.display = 'none';
        
        const response = await fetch(`${API_URL}/admin/users`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (data.success && data.users.length > 0) {
            userCount.textContent = data.count;
            displayUsers(data.users);
            usersList.style.display = 'block';
        } else {
            emptyState.style.display = 'block';
        }
        
    } catch (error) {
        console.error('❌ Load users error:', error);
        showNotification('Error loading users', 'error');
    } finally {
        loadingDiv.style.display = 'none';
    }
}

// Display users in table
function displayUsers(users) {
    const tbody = document.getElementById('usersTableBody');
    tbody.innerHTML = '';
    
    users.forEach((user, index) => {
        const row = document.createElement('tr');
        const lastActivity = user.lastActivity ? formatDate(user.lastActivity) : 'Never';
        const createdAt = formatDate(user.createdAt);
        
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>
                <div class="user-name">${escapeHtml(user.fullname)}</div>
                <div class="user-username">@${escapeHtml(user.username)}</div>
            </td>
            <td>${escapeHtml(user.email)}</td>
            <td>
                <span class="role-badge role-${user.role}">${user.role}</span>
            </td>
            <td>${user.analysisCount || 0}</td>
            <td>${lastActivity}</td>
            <td>${createdAt}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn-view" onclick="viewUserDetails('${user._id}')" title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-delete" onclick="deleteUser('${user._id}', '${escapeHtml(user.username)}')" title="Delete User">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// View user details
function viewUserDetails(userId) {
    const token = getAdminToken();
    
    fetch(`${API_URL}/admin/users`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            const user = data.users.find(u => u._id === userId);
            if (user) {
                showUserModal(user);
            }
        }
    })
    .catch(error => {
        console.error('Error fetching user:', error);
        showNotification('Error loading user details', 'error');
    });
}

// Show user details modal
function showUserModal(user) {
    const modal = document.createElement('div');
    modal.className = 'user-modal';
    modal.innerHTML = `
        <div class="modal-overlay" onclick="closeUserModal()"></div>
        <div class="modal-content">
            <div class="modal-header">
                <h2><i class="fas fa-user-circle"></i> User Details</h2>
                <button class="modal-close" onclick="closeUserModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="user-detail-item">
                    <label>Full Name:</label>
                    <span>${escapeHtml(user.fullname)}</span>
                </div>
                <div class="user-detail-item">
                    <label>Username:</label>
                    <span>@${escapeHtml(user.username)}</span>
                </div>
                <div class="user-detail-item">
                    <label>Email:</label>
                    <span>${escapeHtml(user.email)}</span>
                </div>
                <div class="user-detail-item">
                    <label>Role:</label>
                    <span class="role-badge role-${user.role}">${user.role}</span>
                </div>
                <div class="user-detail-item">
                    <label>Total Analyses:</label>
                    <span>${user.analysisCount || 0}</span>
                </div>
                <div class="user-detail-item">
                    <label>Last Activity:</label>
                    <span>${user.lastActivity ? formatDate(user.lastActivity) : 'Never'}</span>
                </div>
                <div class="user-detail-item">
                    <label>Account Created:</label>
                    <span>${formatDate(user.createdAt)}</span>
                </div>
                <div class="user-detail-item">
                    <label>User ID:</label>
                    <span style="font-family: monospace; font-size: 0.9em;">${user._id}</span>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closeUserModal()">Close</button>
            </div>
        </div>
    `;
    
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
    `;
    
    document.body.appendChild(modal);
}

function closeUserModal() {
    const modal = document.querySelector('.user-modal');
    if (modal) {
        modal.remove();
    }
}

// Delete user
async function deleteUser(userId, username) {
    if (!confirm(`Are you sure you want to delete user "@${username}"?\n\nThis will also delete all their analyses.`)) {
        return;
    }
    
    if (!confirm('This action cannot be undone. Are you absolutely sure?')) {
        return;
    }
    
    const token = getAdminToken();
    
    try {
        const response = await fetch(`${API_URL}/admin/users/${userId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification(`User "@${username}" deleted successfully`, 'success');
            loadUsers();
        } else {
            showNotification(data.message || 'Failed to delete user', 'error');
        }
        
    } catch (error) {
        console.error('❌ Delete user error:', error);
        showNotification('Error deleting user', 'error');
    }
}

// Search users
function searchUsers() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const rows = document.querySelectorAll('#usersTableBody tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

// Utility functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
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
    
    let bgColor = type === 'success' ? '#28a745' : 
                  type === 'error' ? '#dc3545' : '#17a2b8';
    
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
    }, 3000);
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        sessionStorage.clear();
        localStorage.clear();
        window.location.href = 'login.html';
    }
}

// Make functions globally available
window.viewUserDetails = viewUserDetails;
window.closeUserModal = closeUserModal;
window.deleteUser = deleteUser;
window.searchUsers = searchUsers;
window.logout = logout;