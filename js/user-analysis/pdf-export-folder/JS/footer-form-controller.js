// ==================== PDF FOOTER FORM CONTROLLER ====================
// js/user-analysis/pdf-export-folder/JS/footer-form-controller.js

import { createFormHTML } from '../Html/footer-form-template.js';

/**
 * Create and show the PDF footer form
 * @returns {Promise} Promise that resolves with form data when submitted
 */
export function showFooterForm() {
    return new Promise((resolve, reject) => {
        // Create form container
        const formContainer = document.createElement('div');
        formContainer.id = 'pdf-footer-form-container';
        
        // Add HTML content
        formContainer.innerHTML = createFormHTML();
        
        // Append to body
        document.body.appendChild(formContainer);
        
        // Load CSS dynamically
        loadFormCSS();
        
        // Get form elements
        const submitBtn = document.getElementById('form-submit');
        const cancelBtn = document.getElementById('form-cancel');
        
        // Handle submit
        submitBtn.addEventListener('click', () => {
            const formData = collectFormData();
            formContainer.remove();
            resolve(formData);
        });
        
        // Handle cancel
        cancelBtn.addEventListener('click', () => {
            formContainer.remove();
            reject(new Error('Form cancelled'));
        });
        
        // Handle escape key
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                formContainer.remove();
                document.removeEventListener('keydown', handleEscape);
                reject(new Error('Form cancelled'));
            }
        };
        document.addEventListener('keydown', handleEscape);
    });
}

/**
 * Collect data from form inputs
 * @returns {Object} Form data object
 */
function collectFormData() {
    return {
        agent1: {
            name: document.getElementById('agent1-name').value.trim(),
            phone: document.getElementById('agent1-phone').value.trim(),
            email: document.getElementById('agent1-email').value.trim()
        },
        agent2: {
            name: document.getElementById('agent2-name').value.trim(),
            phone: document.getElementById('agent2-phone').value.trim(),
            email: document.getElementById('agent2-email').value.trim()
        },
        location: {
            name: document.getElementById('location-name').value.trim(),
            address: document.getElementById('location-address').value.trim()
        }
    };
}

/**
 * Load CSS file for the form
 */
function loadFormCSS() {
    // Check if CSS is already loaded
    if (document.getElementById('pdf-footer-form-css')) {
        return;
    }
    
    const link = document.createElement('link');
    link.id = 'pdf-footer-form-css';
    link.rel = 'stylesheet';
    link.href = '/js/user-analysis/pdf-export-folder/CSS/footer-form-styles.css';
    document.head.appendChild(link);
}

/**
 * Validate form data
 * @param {Object} formData - Form data to validate
 * @returns {Object} Validation result with isValid flag and errors array
 */
export function validateFormData(formData) {
    const errors = [];
    
    // Agent 1 is required
    if (!formData.agent1.name) {
        errors.push('Primary agent name is required');
    }
    
    // Email validation for agent 1 if provided
    if (formData.agent1.email && !isValidEmail(formData.agent1.email)) {
        errors.push('Primary agent email is invalid');
    }
    
    // Email validation for agent 2 if provided
    if (formData.agent2.email && !isValidEmail(formData.agent2.email)) {
        errors.push('Secondary agent email is invalid');
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}