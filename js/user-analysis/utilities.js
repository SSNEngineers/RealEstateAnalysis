// ==================== UTILITY FUNCTIONS ====================

/**
 * Calculate distance between two coordinates using Haversine formula
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

/**
 * Delay execution for specified milliseconds
 */
export function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Load image with cross-origin support
 */
export function loadImage(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = url;
    });
}

/**
 * Get highway color based on type
 */
export function getHighwayColor(type) {
    switch (type) {
        case 'motorway': return '#E60000';
        case 'trunk': return '#FF8C00';
        case 'primary': return '#0066FF';
        case 'tertiary': return '#9933FF';
        default: return '#808080';
    }
}

/**
 * Categorize route type to human-readable format
 */
export function categorizeRoute(type) {
    switch (type) {
        case 'motorway': return 'Highway';
        case 'trunk': return 'Expressway';
        case 'primary': return 'Main Road';
        case 'tertiary': return 'Local Road';
        default: return type.charAt(0).toUpperCase() + type.slice(1);
    }
}

/**
 * Format address from OSM tags
 */
export function formatAddress(tags) {
    const parts = [
        tags['addr:housenumber'],
        tags['addr:street'],
        tags['addr:city'],
        tags['addr:state'],
        tags['addr:postcode']
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'N/A';
}


export function showNotification(message, type = 'info', duration = 3000) {
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: ${type === 'success' ? '#28a745' : 
                      type === 'error' ? '#dc3545' : 
                      type === 'warning' ? '#ffc107' : '#17a2b8'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 
                        type === 'error' ? 'fa-exclamation-circle' : 
                        type === 'warning' ? 'fa-exclamation-triangle' :
                        'fa-info-circle'}"></i>
        <span style="margin-left: 10px;">${message}</span>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, duration);  // ✅ Use custom duration
}

/**
 * Check if point is within map bounds
 */
export function isWithinMapBounds(x, y, MAP_WIDTH, MAP_HEIGHT) {
    return x >= 0 && x <= MAP_WIDTH && y >= 0 && y <= MAP_HEIGHT;
}

/**
 * Debounce function for performance optimization
 */
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Add roundRect support for older browsers
 */
export function polyfillRoundRect() {
    if (!CanvasRenderingContext2D.prototype.roundRect) {
        CanvasRenderingContext2D.prototype.roundRect = function (x, y, width, height, radius) {
            if (width < 2 * radius) radius = width / 2;
            if (height < 2 * radius) radius = height / 2;
            this.beginPath();
            this.moveTo(x + radius, y);
            this.arcTo(x + width, y, x + width, y + height, radius);
            this.arcTo(x + width, y + height, x, y + height, radius);
            this.arcTo(x, y + height, x, y, radius);
            this.arcTo(x, y, x + width, y, radius);
            this.closePath();
            return this;
        };
    }
}