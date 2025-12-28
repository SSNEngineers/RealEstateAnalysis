// ==================== HOW TO USE POPUP ====================
// js/user-analysis/how-to-use.js

/**
 * Show how to use popup with YouTube videos
 */
export function showHowToUsePopup() {
    // Check if already exists
    if (document.getElementById('howToUsePopupOverlay')) return;
    
    const overlay = document.createElement('div');
    overlay.className = 'how-to-use-popup-overlay';
    overlay.id = 'howToUsePopupOverlay';
    
    overlay.innerHTML = `
        <div class="how-to-use-popup">
            <div class="how-to-use-popup-header">
                <h2>
                    <i class="fab fa-youtube"></i>
                    Video Tutorials
                </h2>
                <button class="how-to-use-popup-close" onclick="closeHowToUsePopup()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div class="how-to-use-popup-content">
                <p class="coming-soon-message">
                    <i class="fas fa-film"></i>
                    Tutorial videos coming soon! 
                    We're preparing comprehensive guides to help you make the most of our analysis tools.
                </p>
                
                <!-- Placeholder for future videos -->
                <div class="video-list-placeholder">
                    <div class="video-item-placeholder">
                        <div class="video-thumbnail-placeholder">
                            <i class="fab fa-youtube"></i>
                        </div>
                        <div class="video-info-placeholder">
                            <h4>Getting Started Guide</h4>
                            <p>Learn the basics of site analysis</p>
                        </div>
                    </div>
                    
                    <div class="video-item-placeholder">
                        <div class="video-thumbnail-placeholder">
                            <i class="fab fa-youtube"></i>
                        </div>
                        <div class="video-info-placeholder">
                            <h4>Advanced Features Tutorial</h4>
                            <p>Master drag, resize, and break lines</p>
                        </div>
                    </div>
                    
                    <div class="video-item-placeholder">
                        <div class="video-thumbnail-placeholder">
                            <i class="fab fa-youtube"></i>
                        </div>
                        <div class="video-info-placeholder">
                            <h4>PDF Export Guide</h4>
                            <p>Create professional reports</p>
                        </div>
                    </div>
                </div>
            </div>

            <div class="how-to-use-popup-footer">
                <button class="how-to-use-close-btn" onclick="closeHowToUsePopup()">
                    <i class="fas fa-check"></i>
                    Got It
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    // Close on overlay click
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            closeHowToUsePopup();
        }
    });
    
    console.log('📺 How to Use popup shown');
}

/**
 * Close how to use popup
 */
export function closeHowToUsePopup() {
    const overlay = document.getElementById('howToUsePopupOverlay');
    if (overlay) {
        overlay.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => overlay.remove(), 300);
        console.log('✅ How to Use popup closed');
    }
}

/**
 * Setup global functions
 */
export function setupGlobalHowToUseFunctions() {
    window.showHowToUsePopup = showHowToUsePopup;
    window.closeHowToUsePopup = closeHowToUsePopup;
}