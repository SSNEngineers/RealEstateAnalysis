// ==================== RESHAPE CLUSTER FUNCTIONALITY ====================

import { saveReshapes } from './backend-helpers.js';

import {
    isReshapeMode,
    reshapedCluster,
    permanentReshapes,
    setReshapeMode,
    setReshapedCluster,
    updatePermanentReshape,
    mapCanvas,
    poiClusters,
    isDragMode,
    isResizeMode,
    isBreakLinesMode
} from './state.js';
import { showNotification } from './utilities.js';
import { redrawStaticMapSmooth } from './main-render.js';

const RESHAPE_STEP = 10; // pixels per adjustment

/**
 * Toggle reshape mode on/off
 */
export function toggleReshapeMode() {
    const newMode = !isReshapeMode;
    setReshapeMode(newMode);

    const btn = document.getElementById('reshapeBtn');

    // Get other mode buttons
    const dragBtn = document.getElementById('dragModeBtn');
    const resizeBtn = document.getElementById('resizeModeBtn');
    const breakLinesBtn = document.getElementById('breakLinesBtn');
    const rotateBtn = document.getElementById('rotateBtn');

    if (newMode) {
        // Enable reshape mode
        btn.classList.add('active');
        document.body.classList.add('reshape-mode-active');

        // Disable other mode buttons
        [dragBtn, resizeBtn, breakLinesBtn, rotateBtn].forEach(b => {
            if (b) {
                b.disabled = true;
                b.style.opacity = '0.5';
                b.style.cursor = 'not-allowed';
            }
        });

        // Add event listeners
        mapCanvas.addEventListener('mousedown', handleReshapeClick);
        mapCanvas.addEventListener('contextmenu', handleReshapeRightClick);
        document.addEventListener('keydown', handleReshapeKeyboard);

        mapCanvas.style.cursor = 'pointer';

        console.log('✅ Reshape Cluster mode ENABLED');
        showNotification('Reshape mode enabled! Left-click cluster, use arrow keys: ← → (width), ↑ ↓ (height)', 'success', 5000);
    } else {
        // Disable reshape mode
        btn.classList.remove('active');
        document.body.classList.remove('reshape-mode-active');

        // Enable other mode buttons
        [dragBtn, resizeBtn, breakLinesBtn, rotateBtn].forEach(b => {
            if (b) {
                b.disabled = false;
                b.style.opacity = '1';
                b.style.cursor = 'pointer';
            }
        });

        // Remove event listeners
        mapCanvas.removeEventListener('mousedown', handleReshapeClick);
        mapCanvas.removeEventListener('contextmenu', handleReshapeRightClick);
        document.removeEventListener('keydown', handleReshapeKeyboard);

        mapCanvas.style.cursor = 'default';
        setReshapedCluster(null);

        console.log('✅ Reshape Cluster mode DISABLED');
    }
}

/**
 * Handle left-click to select cluster
 */
function handleReshapeClick(e) {
    if (!isReshapeMode) return;

    const rect = mapCanvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const cluster = findClusterAtPosition(mouseX, mouseY);

    if (cluster) {
        setReshapedCluster(cluster);
        const dims = permanentReshapes[cluster.id] || { widthAdd: 0, heightAdd: 0 };
        showNotification(`Cluster selected. Width: ${dims.widthAdd > 0 ? '+' : ''}${dims.widthAdd}, Height: ${dims.heightAdd > 0 ? '+' : ''}${dims.heightAdd}. Use arrow keys.`, 'success', 3000);
        redrawStaticMapSmooth();
    } else if (reshapedCluster) {
        setReshapedCluster(null);
        showNotification('Cluster deselected', 'info');
        redrawStaticMapSmooth();
    }
}

/**
 * Handle right-click to set reshape
 */
function handleReshapeRightClick(e) {
    e.preventDefault();

    if (!isReshapeMode || !reshapedCluster) return;

    // Set reshape and release
    showNotification('Shape set! Click cluster again to reshape more.', 'success');
    setReshapedCluster(null);
    redrawStaticMapSmooth();
}

/**
 * Handle keyboard shortcuts
 */
function handleReshapeKeyboard(e) {
    if (!isReshapeMode || !reshapedCluster) return;

    let widthDelta = 0;
    let heightDelta = 0;

    switch (e.key) {
        case 'ArrowRight':
            widthDelta = RESHAPE_STEP;
            e.preventDefault();
            break;
        case 'ArrowLeft':
            widthDelta = -RESHAPE_STEP;
            e.preventDefault();
            break;
        case 'ArrowUp':
            heightDelta = RESHAPE_STEP;
            e.preventDefault();
            break;
        case 'ArrowDown':
            heightDelta = -RESHAPE_STEP;
            e.preventDefault();
            break;
        case 'Escape':
            // Reset to original
            delete permanentReshapes[reshapedCluster.id];
            setReshapedCluster(null);
            showNotification('Cluster shape reset to original', 'success');
            redrawStaticMapSmooth();
            return;
    }

    if (widthDelta !== 0 || heightDelta !== 0) {
        reshapeCluster(reshapedCluster, widthDelta, heightDelta);
    }
}

function reshapeCluster(cluster, widthDelta, heightDelta) {
    const currentShape = permanentReshapes[cluster.id] || { widthAdd: 0, heightAdd: 0 };

    const newWidthAdd = currentShape.widthAdd + widthDelta;
    const newHeightAdd = currentShape.heightAdd + heightDelta;

    const constrainedWidth = Math.max(-200, Math.min(300, newWidthAdd));
    const constrainedHeight = Math.max(-200, Math.min(300, newHeightAdd));

    updatePermanentReshape(cluster.id, {
        widthAdd: constrainedWidth,
        heightAdd: constrainedHeight
    });

    // ✅ ADD THIS LINE:
    saveReshapes(permanentReshapes);

    console.log(`Cluster ${cluster.id} reshaped: W:${constrainedWidth > 0 ? '+' : ''}${constrainedWidth}, H:${constrainedHeight > 0 ? '+' : ''}${constrainedHeight}`);
    
    showNotification(`W: ${constrainedWidth > 0 ? '+' : ''}${constrainedWidth}, H: ${constrainedHeight > 0 ? '+' : ''}${constrainedHeight}`, 'info', 1000);

    redrawStaticMapSmooth();
}

/**
 * Find cluster at position
 */
function findClusterAtPosition(x, y) {
    const clickRadius = 50;

    for (let cluster of poiClusters) {
        let checkX = cluster.isDragged ? cluster.draggedX : cluster.clusterX;
        let checkY = cluster.isDragged ? cluster.draggedY : cluster.clusterY;

        const dist = Math.sqrt(Math.pow(x - checkX, 2) + Math.pow(y - checkY, 2));

        if (dist < clickRadius) {
            return cluster;
        }
    }

    return null;
}

/**
 * Get reshape dimensions for cluster
 * Returns the ADDED dimensions, not absolute dimensions
 */
export function getClusterReshape(clusterId) {
    return permanentReshapes[clusterId] || { widthAdd: 0, heightAdd: 0 };
}

/**
 * Setup global functions
 */
export function setupGlobalReshapeFunctions() {
    window.toggleReshapeMode = toggleReshapeMode;
}