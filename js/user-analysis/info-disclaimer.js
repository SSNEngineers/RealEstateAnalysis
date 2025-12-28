// ==================== INFO DISCLAIMER POPUP ====================
// js/user-analysis/info-disclaimer.js

/**
 * Show disclaimer popup
 */
export function showDisclaimerPopup() {
    // Check if already exists
    if (document.getElementById('disclaimerPopupOverlay')) return;
    
    const overlay = document.createElement('div');
    overlay.className = 'disclaimer-popup-overlay';
    overlay.id = 'disclaimerPopupOverlay';
    
    overlay.innerHTML = `
        <div class="disclaimer-popup">
            <div class="disclaimer-popup-header">
                <h2>
                    <i class="fas fa-exclamation-triangle"></i>
                    Important Notice
                </h2>
                <button class="disclaimer-popup-close" onclick="closeDisclaimerPopup()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div class="disclaimer-popup-content">
                <div class="disclaimer-message">
                    <i class="fas fa-info-circle"></i>
                    <p>
                        <strong>INTELLIGENT ANALYSIS SYSTEM IS A MACHINE AND MACHINES MAKE MISTAKES.</strong>
                    </p>
                    <p>
                        The system provides logos based on available databases and fallback databases. 
                        Some logos can be unusual and faulty. Please unselect any incorrect items.
                    </p>
                    <p>
                        We apologize for any inconvenience caused.
                    </p>
                </div>
            </div>

            <div class="disclaimer-popup-footer">
                <button class="disclaimer-close-btn" onclick="closeDisclaimerPopup()">
                    <i class="fas fa-check"></i>
                    I Understand
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    // Close on overlay click
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            closeDisclaimerPopup();
        }
    });
    
    console.log('ℹ️ Disclaimer popup shown');
}

/**
 * Close disclaimer popup
 */
export function closeDisclaimerPopup() {
    const overlay = document.getElementById('disclaimerPopupOverlay');
    if (overlay) {
        overlay.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => overlay.remove(), 300);
        console.log('✅ Disclaimer popup closed');
    }
}

/**
 * Setup global functions
 */
export function setupGlobalDisclaimerFunctions() {
    window.showDisclaimerPopup = showDisclaimerPopup;
    window.closeDisclaimerPopup = closeDisclaimerPopup;
}