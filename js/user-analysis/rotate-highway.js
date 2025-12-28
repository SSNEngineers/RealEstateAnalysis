// ==================== ROTATE HIGHWAY FUNCTIONALITY ====================

import { saveRotations } from './backend-helpers.js';

import {
    isRotateMode,
    rotatedHighway,
    permanentRotations,
    setRotateMode,
    setRotatedHighway,
    updatePermanentRotation,
    mapCanvas,
    highwayData,
    selectedHighways,
    isDragMode,
    isResizeMode,
    isBreakLinesMode
} from './state.js';
import { showNotification } from './utilities.js';
import { redrawStaticMapSmooth } from './main-render.js';

const ROTATION_STEP = 5; // degrees per wheel scroll

/**
 * Toggle rotate mode on/off
 */
export function toggleRotateMode() {
    const newMode = !isRotateMode;
    setRotateMode(newMode);

    const btn = document.getElementById('rotateBtn');

    // Get other mode buttons
    const dragBtn = document.getElementById('dragModeBtn');
    const resizeBtn = document.getElementById('resizeModeBtn');
    const breakLinesBtn = document.getElementById('breakLinesBtn');
    const reshapeBtn = document.getElementById('reshapeBtn');

    if (newMode) {
        // Enable rotate mode
        btn.classList.add('active');
        document.body.classList.add('rotate-mode-active');

        // Disable other mode buttons
        [dragBtn, resizeBtn, breakLinesBtn, reshapeBtn].forEach(b => {
            if (b) {
                b.disabled = true;
                b.style.opacity = '0.5';
                b.style.cursor = 'not-allowed';
            }
        });

        // Add event listeners
        mapCanvas.addEventListener('mousedown', handleRotateClick);
        mapCanvas.addEventListener('wheel', handleRotateWheel, { passive: false });
        mapCanvas.addEventListener('contextmenu', handleRotateRightClick);
        document.addEventListener('keydown', handleRotateKeyboard);

        mapCanvas.style.cursor = 'pointer';

        console.log('✅ Rotate Highway mode ENABLED');
        showNotification('Rotate mode enabled! Left-click on highway to select, use scroll wheel or +/- to rotate.', 'success');
    } else {
        // Disable rotate mode
        btn.classList.remove('active');
        document.body.classList.remove('rotate-mode-active');

        // Enable other mode buttons
        [dragBtn, resizeBtn, breakLinesBtn, reshapeBtn].forEach(b => {
            if (b) {
                b.disabled = false;
                b.style.opacity = '1';
                b.style.cursor = 'pointer';
            }
        });

        // Remove event listeners
        mapCanvas.removeEventListener('mousedown', handleRotateClick);
        mapCanvas.removeEventListener('wheel', handleRotateWheel);
        mapCanvas.removeEventListener('contextmenu', handleRotateRightClick);
        document.removeEventListener('keydown', handleRotateKeyboard);

        mapCanvas.style.cursor = 'default';
        setRotatedHighway(null);

        console.log('✅ Rotate Highway mode DISABLED');
    }
}

/**
 * Handle left-click to select highway
 */
function handleRotateClick(e) {
    if (!isRotateMode) return;

    const rect = mapCanvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const highway = findHighwayAtPosition(mouseX, mouseY);

    if (highway) {
        setRotatedHighway(highway);
        showNotification(`Highway "${highway.data.name}" selected. Use scroll wheel or +/- keys to rotate.`, 'success');
        redrawStaticMapSmooth();
    } else if (rotatedHighway) {
        setRotatedHighway(null);
        showNotification('Highway deselected', 'info');
        redrawStaticMapSmooth();
    }
}

/**
 * Handle mouse wheel for rotation
 */
function handleRotateWheel(e) {
    if (!isRotateMode || !rotatedHighway) return;

    e.preventDefault();

    const delta = e.deltaY > 0 ? -ROTATION_STEP : ROTATION_STEP;
    rotateHighway(rotatedHighway, delta);
}

/**
 * Handle right-click to set rotation
 */
function handleRotateRightClick(e) {
    e.preventDefault();

    if (!isRotateMode || !rotatedHighway) return;

    // Set rotation and release
    showNotification('Rotation set! You can click the highway again to rotate more.', 'success');
    setRotatedHighway(null);
    redrawStaticMapSmooth();
}

/**
 * Handle keyboard shortcuts
 */
function handleRotateKeyboard(e) {
    if (!isRotateMode || !rotatedHighway) return;

    let delta = 0;

    if (e.key === '+' || e.key === '=') {
        delta = ROTATION_STEP;
    } else if (e.key === '-' || e.key === '_') {
        delta = -ROTATION_STEP;
    } else if (e.key === 'Escape') {
        // Reset to original
        const hwIndex = rotatedHighway.index;
        delete permanentRotations[hwIndex];
        setRotatedHighway(null);
        showNotification('Highway rotation reset to original', 'success');
        redrawStaticMapSmooth();
        return;
    }

    if (delta !== 0) {
        e.preventDefault();
        rotateHighway(rotatedHighway, delta);
    }
}


function rotateHighway(highway, delta) {
    const hwIndex = highway.index;
    let currentRotation = permanentRotations[hwIndex] || 0;

    currentRotation += delta;

    if (currentRotation >= 360) currentRotation -= 360;
    if (currentRotation < 0) currentRotation += 360;

    updatePermanentRotation(hwIndex, currentRotation);

    // ✅ ADD THIS LINE:
    saveRotations(permanentRotations);

    console.log(`Highway ${highway.data.name} rotated to: ${currentRotation}°`);
    showNotification(`Rotation: ${currentRotation}°`, 'info', 1000);

    redrawStaticMapSmooth();
}

/**
 * Find highway at position
 */
function findHighwayAtPosition(x, y) {
    const clickRadius = 50;

    for (let idx = 0; idx < highwayData.length; idx++) {
        if (!selectedHighways[idx]) continue;

        const hw = highwayData[idx];
        let checkX = hw.isDragged ? hw.draggedX : hw.pixelX;
        let checkY = hw.isDragged ? hw.draggedY : hw.pixelY;

        const dist = Math.sqrt(Math.pow(x - checkX, 2) + Math.pow(y - checkY, 2));

        if (dist < clickRadius) {
            return {
                index: idx,
                data: hw,
                x: checkX,
                y: checkY
            };
        }
    }

    return null;
}

/**
 * Get rotation for highway
 */
export function getHighwayRotation(hwIndex) {
    return permanentRotations[hwIndex] || 0;
}

/**
 * Setup global functions
 */
export function setupGlobalRotateFunctions() {
    window.toggleRotateMode = toggleRotateMode;
}