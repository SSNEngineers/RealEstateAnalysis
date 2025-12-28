// ==================== LOCATION FORM LOGIC ====================
const categoryIcons = {
    popularLocations: "⭐",
    school: "🏫",
    hospital: "🏥",
    fast_food: "🍔",
    supermarket: "🛒",
    shopping_mall: "🏬",
    coffee_shop: "☕"
};

let currentMode = 'separate';

// Initialize POI categories
document.addEventListener('DOMContentLoaded', function() {
    buildPOICategories();
    setupFormHandlers();
});

// Build POI categories grid
function buildPOICategories() {
    const container = document.getElementById('poiCategories');
    if (!container) return;
    
    Object.keys(categoryIcons).forEach(cat => {
        const div = document.createElement('div');
        div.className = 'poi-category-item';
        div.innerHTML = `
            <label>
                <input type="checkbox" name="poi_${cat}" value="${cat}">
                <span class="poi-icon">${categoryIcons[cat]}</span>
                <span class="poi-name">${cat.replace(/_/g, ' ')}</span>
                <input type="number" class="poi-count" min="0" max="7" value="0" placeholder="0">
            </label>
        `;
        container.appendChild(div);
    });
}

// Toggle between separate and full address mode
function toggleAddressMode(mode) {
    currentMode = mode;
    const separateMode = document.getElementById('separateMode');
    const fullMode = document.getElementById('fullMode');
    const toggleBtns = document.querySelectorAll('.toggle-btn');
    
    toggleBtns.forEach(btn => btn.classList.remove('active'));
    
    if (mode === 'separate') {
        separateMode.style.display = 'block';
        fullMode.style.display = 'none';
        toggleBtns[0].classList.add('active');
        clearFullAddress();
    } else {
        separateMode.style.display = 'none';
        fullMode.style.display = 'block';
        toggleBtns[1].classList.add('active');
        clearSeparateFields();
    }
}

// Clear full address field
function clearFullAddress() {
    document.getElementById('fullAddress').value = '';
}

// Clear separate fields
function clearSeparateFields() {
    document.getElementById('streetNumber').value = '';
    document.getElementById('streetName').value = '';
    document.getElementById('city').value = '';
    document.getElementById('state').value = '';
    document.getElementById('zipCode').value = '';
}

// Setup form input handlers
function setupFormHandlers() {
    // Separate fields handler
    const separateFields = ['streetNumber', 'streetName', 'city', 'state', 'zipCode', 'country'];
    separateFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.addEventListener('input', function() {
                if (this.value) {
                    document.getElementById('fullAddress').disabled = true;
                } else {
                    const allEmpty = separateFields.every(id => !document.getElementById(id).value);
                    if (allEmpty) {
                        document.getElementById('fullAddress').disabled = false;
                    }
                }
            });
        }
    });
    
    // Full address handler
    const fullAddress = document.getElementById('fullAddress');
    if (fullAddress) {
        fullAddress.addEventListener('input', function() {
            if (this.value) {
                separateFields.forEach(fieldId => {
                    const field = document.getElementById(fieldId);
                    if (field) field.disabled = true;
                });
            } else {
                separateFields.forEach(fieldId => {
                    const field = document.getElementById(fieldId);
                    if (field) field.disabled = false;
                });
            }
        });
    }
    
    // Radius validation
    const radiusInput = document.getElementById('searchRadius');
    if (radiusInput) {
        radiusInput.addEventListener('input', function() {
            if (parseFloat(this.value) > 3) {
                this.value = 3;
                showNotification('Maximum radius is 3 miles', 'warning');
            }
        });
    }
    
    // POI checkboxes handler
    const poiCheckboxes = document.querySelectorAll('.poi-category-item input[type="checkbox"]');
    poiCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const countInput = this.parentElement.querySelector('.poi-count');
            if (this.checked) {
                countInput.value = countInput.value || 3;
                countInput.disabled = false;
            } else {
                countInput.value = 0;
                countInput.disabled = true;
            }
        });
    });
}

// Form submission handler
document.getElementById('locationForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    let address = '';
    
    // Get address based on mode
    if (currentMode === 'separate') {
        const streetNumber = document.getElementById('streetNumber').value;
        const streetName = document.getElementById('streetName').value;
        const city = document.getElementById('city').value;
        const state = document.getElementById('state').value;
        const zipCode = document.getElementById('zipCode').value;
        const country = document.getElementById('country').value || 'USA';
        
        if (!streetNumber && !streetName && !city && !state && !zipCode) {
            showNotification('Please fill in at least one address field', 'error');
            return;
        }
        
        address = [streetNumber, streetName, city, state, zipCode, country]
            .filter(Boolean)
            .join(', ');
    } else {
        address = document.getElementById('fullAddress').value.trim();
        if (!address) {
            showNotification('Please enter an address', 'error');
            return;
        }
    }
    
    // Get radius
    let radius = parseFloat(document.getElementById('searchRadius').value);
    if (radius > 3) radius = 3;
    
    // Get selected POI categories
    const selectedPOIs = {};
    document.querySelectorAll('.poi-category-item').forEach(item => {
        const checkbox = item.querySelector('input[type="checkbox"]');
        const countInput = item.querySelector('.poi-count');
        if (checkbox.checked && countInput.value > 0) {
            selectedPOIs[checkbox.value] = parseInt(countInput.value);
        }
    });
    
    if (Object.keys(selectedPOIs).length === 0) {
        showNotification('Please select at least one POI category', 'error');
        return;
    }
    
    // Store analysis parameters
    const analysisParams = {
        address: address,
        radius: radius,
        pois: selectedPOIs,
        timestamp: new Date().toISOString()
    };
    
    sessionStorage.setItem('analysis_params', JSON.stringify(analysisParams));
    
    // Show success and redirect
    showNotification('Starting analysis...', 'success');
    setTimeout(() => {
        window.location.href = 'map-analysis.html';
    }, 1000);
});

// Notification function (reuse from auth.js)
function showNotification(message, type = 'info') {
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 
                        type === 'error' ? 'fa-exclamation-circle' : 
                        type === 'warning' ? 'fa-exclamation-triangle' :
                        'fa-info-circle'}"></i>
        <span>${message}</span>
    `;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: ${type === 'success' ? '#28a745' : 
                      type === 'error' ? '#dc3545' : 
                      type === 'warning' ? '#ffc107' : '#17a2b8'};
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