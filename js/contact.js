const API_URL = 'http://localhost:5000/api';

console.log('📧 Contact form handler loaded');

// Contact Form Submission
document.addEventListener('DOMContentLoaded', function() {
    const contactForm = document.getElementById('contactForm');
    
    if (contactForm) {
        contactForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            console.log('📝 Contact form submitted');
            
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalContent = submitBtn.innerHTML;
            
            // Add loading state
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
            submitBtn.disabled = true;
            
            // Get form data
            const formData = {
                fullname: document.getElementById('fullname').value.trim(),
                email: document.getElementById('email').value.trim(),
                address: document.getElementById('address').value.trim(),
                subject: document.getElementById('subject').value.trim(),
                description: document.getElementById('description').value.trim()
            };
            
            try {
                const response = await fetch(`${API_URL}/contact/submit`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });
                
                const data = await response.json();
                
                if (data.success) {
                    console.log('✅ Contact form submitted successfully');
                    
                    // Show success message
                    showSuccessMessage();
                    
                    // Reset form
                    contactForm.reset();
                    
                } else {
                    console.error('❌ Contact submission failed:', data.message);
                    showNotification(data.message || 'Failed to submit contact form', 'error');
                }
                
            } catch (error) {
                console.error('❌ Contact submission error:', error);
                showNotification('Network error. Please try again later.', 'error');
            } finally {
                // Reset button
                submitBtn.innerHTML = originalContent;
                submitBtn.disabled = false;
            }
        });
    }
});

function showSuccessMessage() {
    const form = document.getElementById('contactForm');
    const successMsg = document.createElement('div');
    successMsg.className = 'form-success-message';
    successMsg.innerHTML = `
        <i class="fas fa-check-circle"></i> 
        Thank you! Your message has been sent successfully. 
        We'll get back to you soon.
    `;
    
    successMsg.style.cssText = `
        background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
        color: white;
        padding: 1.5rem;
        border-radius: 12px;
        margin-bottom: 1.5rem;
        display: flex;
        align-items: center;
        gap: 1rem;
        box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);
        animation: slideDown 0.5s ease;
    `;
    
    form.insertBefore(successMsg, form.firstChild);
    
    // Remove after 5 seconds
    setTimeout(() => {
        successMsg.style.animation = 'slideUp 0.5s ease';
        setTimeout(() => successMsg.remove(), 500);
    }, 5000);
}

function showNotification(message, type = 'info') {
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    
    let bgColor = type === 'success' ? '#28a745' : '#dc3545';
    
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
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 4000);
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
    @keyframes slideDown {
        from { transform: translateY(-20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
    }
    @keyframes slideUp {
        from { transform: translateY(0); opacity: 1; }
        to { transform: translateY(-20px); opacity: 0; }
    }
`;
document.head.appendChild(styleSheet);