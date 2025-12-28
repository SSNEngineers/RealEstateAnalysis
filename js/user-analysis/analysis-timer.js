// ==================== ANALYSIS TIMER ====================
// js/user-analysis/analysis-timer.js

let timerInterval = null;
let startTime = null;

/**
 * Start the analysis timer
 */
export function startAnalysisTimer() {
    // Create timer element
    const timerDiv = document.createElement('div');
    timerDiv.id = 'analysisTimer';
    timerDiv.className = 'analysis-timer';
    timerDiv.innerHTML = '<i class="fas fa-clock"></i> <span id="timerText">0 sec</span>';
    
    // Insert after navbar (below SSN AI)
    const navbar = document.querySelector('.navbar');
    if (navbar && navbar.parentNode) {
        navbar.parentNode.insertBefore(timerDiv, navbar.nextSibling);
    } else {
        document.body.prepend(timerDiv);
    }
    
    // Start counting
    startTime = Date.now();
    updateTimer();
    
    timerInterval = setInterval(updateTimer, 1000);
    
    console.log('⏱️ Analysis timer started');
}

/**
 * Update timer display
 */
function updateTimer() {
    const timerText = document.getElementById('timerText');
    if (!timerText) return;
    
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    
    if (elapsed < 60) {
        timerText.textContent = `${elapsed} sec`;
    } else {
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        timerText.textContent = `${minutes} min ${seconds} sec`;
    }
}

/**
 * Stop and remove the timer
 */
export function stopAnalysisTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    
    const timerDiv = document.getElementById('analysisTimer');
    if (timerDiv) {
        timerDiv.style.animation = 'fadeOut 0.5s ease';
        setTimeout(() => timerDiv.remove(), 500);
    }
    
    console.log('✅ Analysis timer stopped');
}

/**
 * Setup global timer functions
 */
export function setupGlobalTimerFunctions() {
    window.startAnalysisTimer = startAnalysisTimer;
    window.stopAnalysisTimer = stopAnalysisTimer;
}