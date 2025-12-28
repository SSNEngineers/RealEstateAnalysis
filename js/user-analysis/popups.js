// ==================== POPUP MANAGEMENT ====================
// js/user-analysis/popups.js

/**
 * Show instructions popup when analysis completes
 */
export function showInstructionsPopup() {
    const overlay = document.createElement('div');
    overlay.className = 'instruction-popup-overlay';
    overlay.id = 'instructionPopupOverlay';
    
    overlay.innerHTML = `
        <div class="instruction-popup">
            <div class="instruction-popup-header">
                <h2>
                    <i class="fas fa-info-circle"></i>
                    How to Use the Analysis Tools
                </h2>
                <button class="instruction-popup-close" onclick="closeInstructionsPopup()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div class="instruction-popup-content">
                <!-- Warning Section -->
                <div class="instruction-warning">
                    <h3>
                        <i class="fas fa-exclamation-triangle"></i>
                        Important Notes
                    </h3>
                    <p><strong>i)</strong> POIs (Points of Interest) refer to clusters, logos, highways, and markers.</p>
                    <p><strong>ii)</strong> Once lines are broken and set using right-click, you cannot click them again. 
                    If you wish to edit again, you need to click on the original coordinates point of the given POIs. it will
                    activate the points again</p>
                </div>

                <!-- Drag Mode -->
                <div class="instruction-section">
                    <h3>
                        <i class="fas fa-arrows-alt"></i>
                        1. Drag Mode
                    </h3>
                    <div class="instruction-item">
                        <h4><i class="fas fa-hand-rock"></i> How to Drag POIs</h4>
                        <ol>
                            <li>Left-click on any POI (cluster, logo, highway, or marker)</li>
                            <li>Hold and drag the POI to your desired location</li>
                            <li>Release the left-click to drop it in the new position</li>
                        </ol>
                    </div>
                </div>

                <!-- Resize Mode -->
                <div class="instruction-section">
                    <h3>
                        <i class="fas fa-expand-arrows-alt"></i>
                        2. Resize Mode
                    </h3>
                    <div class="instruction-item">
                        <h4><i class="fas fa-search-plus"></i> How to Resize POIs</h4>
                        <ol>
                            <li>Click on any POI to select it</li>
                            <li>Use mouse wheel up/down or +/- keys to increase or decrease size</li>
                            <li>The changing POI size will be shown in the top-right corner</li>
                        </ol>
                    </div>
                </div>

                <!-- Break Lines Mode -->
                <div class="instruction-section">
                    <h3>
                        <i class="fas fa-cut"></i>
                        3. Break Lines Mode
                    </h3>
                    <div class="instruction-item">
                        <h4><i class="fas fa-project-diagram"></i> How to Break Lines</h4>
                        <ol>
                            <li>Enable the Break Lines mode (read instructions below the button)</li>
                            <li><strong>Note:</strong> Lines that are NOT dragged cannot be clicked</li>
                            <li>Click on any dragged line to create break points</li>
                            <li>Broken lines are shown with orange points</li>
                            <li>Drag the orange points to adjust the line shape</li>
                            <li>Right-click to set and release the break point</li>
                            <li>Press <kbd>ESC</kbd> to restore the line to its original position</li>
                        </ol>
                    </div>
                </div>

                <!-- PDF Export -->
                <div class="instruction-section">
                    <h3>
                        <i class="fas fa-file-pdf"></i>
                        4. Export PDF
                    </h3>
                    <div class="instruction-item">
                        <h4><i class="fas fa-download"></i> Generate Report</h4>
                        <ol>
                            <li>After designing your map layout, click the "Export PDF" button</li>
                            <li>Fill in the agent and location information form</li>
                            <li>Your customized report will be generated and downloaded</li>
                        </ol>
                    </div>
                </div>
            </div>

            <div class="instruction-footer">
                <button onclick="closeInstructionsPopup()">
                    <i class="fas fa-check"></i>
                    Got It! Let's Start
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    // Close on overlay click
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            closeInstructionsPopup();
        }
    });
    
    console.log('✅ Instructions popup shown');
}

/**
 * Close instructions popup
 */
export function closeInstructionsPopup() {
    const overlay = document.getElementById('instructionPopupOverlay');
    if (overlay) {
        overlay.style.animation = 'fadeOutOverlay 0.3s ease';
        setTimeout(() => overlay.remove(), 300);
        console.log('✅ Instructions popup closed');
    }
}

/**
 * Show loading delay warning popup with dynamic message based on POI category count
 * @param {number} poiCategoryCount - Number of POI categories selected
 */
export function showLoadingDelayPopup(poiCategoryCount = 0) {
    // Check if already exists
    if (document.getElementById('loadingDelayPopup')) return;
    
    // Determine message based on POI category count
    let message = '';
    
    if (poiCategoryCount < 5) {
        message = `
            🕐 <strong>Analysis In Progress</strong><br><br>
            The analysis may be taking longer than usual due to heavy network traffic. 
            Please be patient while we gather and process data. The processing time depends 
            on the number of requested POI categories and current server load.
        `;
    } else if (poiCategoryCount >= 5 && poiCategoryCount <= 8) {
        message = `
            🕐 <strong>Extended Analysis Time Required</strong><br><br>
            The analysis is taking longer due to the number of POI categories selected. 
            Please be patient as we perform an intelligent analysis to fetch the most 
            relevant points of interest. Processing time may range from 5 to 10 minutes 
            depending on the requested data volume.
        `;
    } else {
        message = `
            🕐 <strong>Comprehensive Analysis In Progress</strong><br><br>
            The analysis requires additional time due to the high number of POI categories selected. 
            Please remain patient while we process your request. Larger datasets with multiple 
            categories and higher item counts require extended processing time. 
            The analysis may take between 5 to 10 minutes depending on your specifications.
        `;
    }
    
    const popup = document.createElement('div');
    popup.className = 'loading-delay-popup';
    popup.id = 'loadingDelayPopup';
    
    popup.innerHTML = `
        <h3>
            <i class="fas fa-hourglass-half"></i>
            Please Wait
        </h3>
        <p>${message}</p>
    `;
    
    document.body.appendChild(popup);
    
    console.log(`⏳ Loading delay popup shown (${poiCategoryCount} POI categories)`);
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
        removeLoadingDelayPopup();
    }, 10000);
}

/**
 * Remove loading delay popup with animation
 */
export function removeLoadingDelayPopup() {
    const popup = document.getElementById('loadingDelayPopup');
    if (popup) {
        popup.classList.add('fade-out');
        setTimeout(() => popup.remove(), 500);
        console.log('✅ Loading delay popup removed');
    }
}

/**
 * Setup loading delay popup interval
 * Shows popup every 30 seconds until analysis completes
 * @param {number} poiCategoryCount - Number of POI categories selected
 */
export function setupLoadingDelayPopups(poiCategoryCount = 0) {
    let delayCheckInterval;
    let startTime = Date.now();
    
    delayCheckInterval = setInterval(() => {
        const elapsedTime = Date.now() - startTime;
        
        // Check if analysis is complete
        if (window.analysisComplete) {
            clearInterval(delayCheckInterval);
            removeLoadingDelayPopup();
            console.log('✅ Analysis complete, stopped delay popups');
            return;
        }
        
        // Show popup every 30 seconds
        if (elapsedTime >= 30000) {
            showLoadingDelayPopup(poiCategoryCount);
            startTime = Date.now(); // Reset timer
        }
    }, 1000); // Check every second
    
    console.log(`⏳ Loading delay popup system started (${poiCategoryCount} POI categories)`);
    
    // Cleanup function
    return () => {
        clearInterval(delayCheckInterval);
        removeLoadingDelayPopup();
    };
}

/**
 * Setup global popup functions
 */
export function setupGlobalPopupFunctions() {
    window.closeInstructionsPopup = closeInstructionsPopup;
}















