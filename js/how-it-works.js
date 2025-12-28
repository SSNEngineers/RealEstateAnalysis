// ==================== CIRCULAR WHEEL INTERACTION ====================

document.addEventListener('DOMContentLoaded', function() {
    const wheel = document.getElementById('circularWheel');
    const stepNodes = document.querySelectorAll('.step-node');
    const stepDetails = document.querySelectorAll('.step-detail');
    
    let currentStep = 1;
    let currentRotation = 0;
    const totalSteps = 7;
    const degreesPerStep = 360 / totalSteps;
    
    // Initialize
    updateStep(currentStep);
    
    // Mouse wheel scroll event
    wheel.addEventListener('wheel', function(e) {
        e.preventDefault();
        
        if (e.deltaY > 0) {
            // Scroll down - go to next step (clockwise)
            currentStep++;
            if (currentStep > totalSteps) currentStep = 1;
        } else {
            // Scroll up - go to previous step (counter-clockwise)
            currentStep--;
            if (currentStep < 1) currentStep = totalSteps;
        }
        
        updateStep(currentStep);
    }, { passive: false });
    
    // Touch/drag events for mobile
    let touchStartY = 0;
    let touchStartRotation = 0;
    
    wheel.addEventListener('touchstart', function(e) {
        touchStartY = e.touches[0].clientY;
        touchStartRotation = currentRotation;
    });
    
    wheel.addEventListener('touchmove', function(e) {
        e.preventDefault();
        const touchCurrentY = e.touches[0].clientY;
        const deltaY = touchStartY - touchCurrentY;
        
        if (Math.abs(deltaY) > 50) {
            if (deltaY > 0) {
                currentStep++;
                if (currentStep > totalSteps) currentStep = 1;
            } else {
                currentStep--;
                if (currentStep < 1) currentStep = totalSteps;
            }
            
            updateStep(currentStep);
            touchStartY = touchCurrentY;
        }
    }, { passive: false });
    
    // Click on step nodes
    stepNodes.forEach(node => {
        node.addEventListener('click', function() {
            const step = parseInt(this.getAttribute('data-step'));
            currentStep = step;
            updateStep(currentStep);
        });
    });
    
    // Keyboard navigation
    document.addEventListener('keydown', function(e) {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
            e.preventDefault();
            currentStep++;
            if (currentStep > totalSteps) currentStep = 1;
            updateStep(currentStep);
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
            e.preventDefault();
            currentStep--;
            if (currentStep < 1) currentStep = totalSteps;
            updateStep(currentStep);
        }
    });
    
    /**
     * Update the wheel and step details
     */
    function updateStep(step) {
        // Calculate rotation to bring selected step to the right
        // Step 1 is at 0 degrees (right side)
        const targetRotation = -degreesPerStep * (step - 1);
        currentRotation = targetRotation;
        
        // Rotate wheel
        wheel.style.transform = `rotate(${currentRotation}deg)`;
        
        // Update active states
        stepNodes.forEach(node => {
            const nodeStep = parseInt(node.getAttribute('data-step'));
            if (nodeStep === step) {
                node.classList.add('active');
            } else {
                node.classList.remove('active');
            }
        });
        
        // Update step details
        stepDetails.forEach(detail => {
            const detailStep = parseInt(detail.getAttribute('data-step'));
            if (detailStep === step) {
                detail.classList.add('active');
            } else {
                detail.classList.remove('active');
            }
        });
        
        // Add animation pulse effect
        const activeNode = wheel.querySelector(`.step-node[data-step="${step}"]`);
        if (activeNode) {
            activeNode.style.animation = 'none';
            setTimeout(() => {
                activeNode.style.animation = '';
            }, 10);
        }
    }
    
    /**
     * Auto-rotate demo (optional - uncomment to enable)
     */
    /*
    let autoRotateInterval = setInterval(() => {
        currentStep++;
        if (currentStep > totalSteps) currentStep = 1;
        updateStep(currentStep);
    }, 4000);
    
    // Stop auto-rotate on user interaction
    wheel.addEventListener('wheel', () => clearInterval(autoRotateInterval), { once: true });
    wheel.addEventListener('touchstart', () => clearInterval(autoRotateInterval), { once: true });
    stepNodes.forEach(node => {
        node.addEventListener('click', () => clearInterval(autoRotateInterval), { once: true });
    });
    */
});

// ==================== SMOOTH SCROLL TO SECTIONS ====================

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});