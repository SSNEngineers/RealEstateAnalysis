const API_URL = 'http://localhost:5000/api';

console.log('📧 Admin contacts page loaded');

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
    
    loadContacts();
});

// Load all contacts
async function loadContacts() {
    const token = getAdminToken();
    const contactsList = document.getElementById('contactsList');
    const loadingDiv = document.getElementById('loading');
    const emptyState = document.getElementById('emptyState');
    const contactCount = document.getElementById('contactCount');
    
    try {
        loadingDiv.style.display = 'block';
        contactsList.style.display = 'none';
        emptyState.style.display = 'none';
        
        const response = await fetch(`${API_URL}/contact/all`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (data.success && data.contacts.length > 0) {
            contactCount.textContent = data.count;
            displayContacts(data.contacts);
            contactsList.style.display = 'block';
        } else {
            emptyState.style.display = 'block';
        }
        
    } catch (error) {
        console.error('❌ Load contacts error:', error);
        showNotification('Error loading contacts', 'error');
    } finally {
        loadingDiv.style.display = 'none';
    }
}

// Display contacts in table
function displayContacts(contacts) {
    const tbody = document.getElementById('contactsTableBody');
    tbody.innerHTML = '';
    
    contacts.forEach((contact, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>
                <div class="contact-name">${escapeHtml(contact.fullname)}</div>
                <div class="contact-email">${escapeHtml(contact.email)}</div>
            </td>
            <td>${escapeHtml(contact.subject)}</td>
            <td>
                <div class="contact-message">${escapeHtml(contact.description)}</div>
            </td>
            <td>${contact.address ? escapeHtml(contact.address) : 'Not provided'}</td>
            <td>
                <span class="status-badge status-${contact.status}">${contact.status}</span>
            </td>
            <td>${formatDate(contact.createdAt)}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn-status" onclick="updateStatus('${contact._id}', '${contact.status}')" title="Update Status">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-delete" onclick="deleteContact('${contact._id}')" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Update contact status
async function updateStatus(contactId, currentStatus) {
    const statuses = ['new', 'read', 'resolved'];
    const currentIndex = statuses.indexOf(currentStatus);
    const nextStatus = statuses[(currentIndex + 1) % statuses.length];
    
    const token = getAdminToken();
    
    try {
        const response = await fetch(`${API_URL}/contact/${contactId}/status`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: nextStatus })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Status updated successfully', 'success');
            loadContacts();
        } else {
            showNotification(data.message || 'Failed to update status', 'error');
        }
        
    } catch (error) {
        console.error('❌ Update status error:', error);
        showNotification('Error updating status', 'error');
    }
}

// Delete single contact
async function deleteContact(contactId) {
    if (!confirm('Are you sure you want to delete this contact?')) {
        return;
    }
    
    const token = getAdminToken();
    
    try {
        const response = await fetch(`${API_URL}/contact/${contactId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Contact deleted successfully', 'success');
            loadContacts();
        } else {
            showNotification(data.message || 'Failed to delete contact', 'error');
        }
        
    } catch (error) {
        console.error('❌ Delete contact error:', error);
        showNotification('Error deleting contact', 'error');
    }
}

// Delete all contacts
async function deleteAllContacts() {
    if (!confirm('⚠️ WARNING: This will delete ALL contact forms permanently. Are you absolutely sure?')) {
        return;
    }
    
    if (!confirm('This action cannot be undone. Type "DELETE ALL" to confirm.')) {
        return;
    }
    
    const token = getAdminToken();
    
    try {
        const response = await fetch(`${API_URL}/contact/delete-all/confirm`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification(data.message, 'success');
            loadContacts();
        } else {
            showNotification(data.message || 'Failed to delete contacts', 'error');
        }
        
    } catch (error) {
        console.error('❌ Delete all contacts error:', error);
        showNotification('Error deleting contacts', 'error');
    }
}

// Export contacts to CSV
function exportContacts() {
    showNotification('Export feature coming soon', 'info');
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
window.deleteContact = deleteContact;
window.deleteAllContacts = deleteAllContacts;
window.exportContacts = exportContacts;
window.updateStatus = updateStatus;
window.logout = logout;
