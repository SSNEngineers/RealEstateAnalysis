// js/user-analysis/resize-functionality.js - UPDATED WITH BACKEND SAVE
// Add this import at the top

import { saveResizedSizes } from './backend-helpers.js';

// ... rest of the imports remain the same ...
import {
    isResizeMode,
    resizedItem,
    mapCanvas,
    MAP_WIDTH,
    MAP_HEIGHT,
    poiClusters,
    allPOIsDataByCategory,
    selectedPOIs,
    highwayData,
    selectedHighways,
    selectedSiteLocation,
    permanentResizedSizes,
    setResizeMode,
    setResizedItem,
    updatePermanentResizedSizes,
    isDragMode
} from './state.js';
import { latLngToPixel } from './coordinates.js';
import { showNotification } from './utilities.js';
import { redrawStaticMapSmooth } from './main-render.js';
import { toggleDragMode } from './drag-functionality.js';

// ... all existing code remains the same until resize helper functions ...
// Resize constraints
const MIN_SIZE = 20;
const MAX_SIZE = 150;
const MAX_CLUSTER_SIZE = 250;  // ⭐ NEW: Larger max for clusters
const RESIZE_STEP = 5;

/**
 * Toggle resize mode on/off
 */
export function toggleResizeMode() {
    const newMode = !isResizeMode;
    
    // Disable drag mode if it's active
    if (newMode && isDragMode) {
        toggleDragMode();
        showNotification('Drag mode disabled. Resize mode enabled.', 'info');
    }
    
    setResizeMode(newMode);

    const btn = document.getElementById('resizeModeBtn');
    const btnText = document.getElementById('resizeBtnText');
    const instructions = document.getElementById('resizeInstructions');

    // Disable/Enable other controls
    toggleOtherControls(!newMode);

    if (newMode) {
        // Enable resize mode
        btn.classList.add('active');
        btnText.textContent = 'Disable Resize Mode';
        instructions.classList.add('show');
        document.body.classList.add('resize-mode-active');

        // Add resize listeners to canvas
        mapCanvas.addEventListener('click', handleResizeClick);
        mapCanvas.addEventListener('wheel', handleResizeWheel, { passive: false });

        mapCanvas.style.cursor = 'pointer';  // ⭐ CHANGED: Use pointer instead

        console.log('✓ Resize mode ENABLED');
        showNotification('Resize mode enabled! Click on items to resize them, or use scroll wheel.', 'success');
    } else {
        // Disable resize mode
        btn.classList.remove('active');
        btnText.textContent = 'Enable Resize Mode';
        instructions.classList.remove('show');
        document.body.classList.remove('resize-mode-active');

        // Remove resize listeners
        mapCanvas.removeEventListener('click', handleResizeClick);
        mapCanvas.removeEventListener('wheel', handleResizeWheel);

        mapCanvas.style.cursor = 'default';
        setResizedItem(null);

        console.log('✓ Resize mode DISABLED');
        showNotification('Resize mode disabled', 'info');
    }
}

/**
 * Handle click to select item for resizing
 */
export function handleResizeClick(e) {
    if (!isResizeMode) return;

    const rect = mapCanvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const item = findItemAtPosition(mouseX, mouseY);
    
    if (item) {
        setResizedItem(item);
        showNotification(`Selected: ${item.type} - Use scroll wheel or +/- keys to resize`, 'info');
        console.log(`✓ Selected ${item.type} for resizing:`, item.name || item.data.name);
        
        // ⭐ CHANGED: Set cursor to resize when item selected
        mapCanvas.style.cursor = 'nwse-resize';
        
        // Add keyboard listeners for selected item
        document.addEventListener('keydown', handleResizeKeyboard);
    } else {
        setResizedItem(null);
        
        // ⭐ CHANGED: Reset cursor to pointer when deselected
        mapCanvas.style.cursor = 'pointer';
        
        document.removeEventListener('keydown', handleResizeKeyboard);
    }
    
    redrawStaticMapSmooth();
}

/**
 * Handle mouse wheel for resizing
 */
export function handleResizeWheel(e) {
    if (!isResizeMode || !resizedItem) return;

    e.preventDefault();
    
    // Throttle wheel events to prevent excessive redraws
    const now = Date.now();
    if (window.lastResizeTime && now - window.lastResizeTime < 50) {
        return; // Skip if less than 50ms since last resize
    }
    window.lastResizeTime = now;
    
    const delta = e.deltaY > 0 ? -RESIZE_STEP : RESIZE_STEP;
    resizeItem(resizedItem, delta);
}

/**
 * Handle keyboard for resizing
 */
export function handleResizeKeyboard(e) {
    if (!isResizeMode || !resizedItem) return;

    let delta = 0;
    
    if (e.key === '+' || e.key === '=') {
        delta = RESIZE_STEP;
    } else if (e.key === '-' || e.key === '_') {
        delta = -RESIZE_STEP;
    } else if (e.key === 'Escape') {
        setResizedItem(null);
        mapCanvas.style.cursor = 'pointer';
        document.removeEventListener('keydown', handleResizeKeyboard);
        showNotification('Deselected item', 'info');
        redrawStaticMapSmooth();
        return;
    }

    if (delta !== 0) {
        e.preventDefault();
        
        // Throttle keyboard events
        const now = Date.now();
        if (window.lastResizeTime && now - window.lastResizeTime < 50) {
            return;
        }
        window.lastResizeTime = now;
        
        resizeItem(resizedItem, delta);
    }
}

/**
 * Resize selected item
 */
function resizeItem(item, delta) {
    if (!item) return;

    if (item.type === 'cluster') {
        resizeCluster(item.data, delta);
    } else if (item.type === 'poi') {
        resizePOI(item.data, delta);
    } else if (item.type === 'highway') {
        resizeHighway(item.data, delta);
    } else if (item.type === 'siteMarker') {
        resizeSiteMarker(delta);
    }

    // Use requestAnimationFrame for smooth rendering
    if (!window.resizeAnimationFrame) {
        window.resizeAnimationFrame = requestAnimationFrame(() => {
            redrawStaticMapSmooth();
            window.resizeAnimationFrame = null;
        });
    }
}

/**
 * Resize cluster - UPDATED TO SAVE TO BACKEND
 */
function resizeCluster(cluster, delta) {
    let currentSize = cluster.size || 80;
    
    if (permanentResizedSizes.clusters[cluster.id]) {
        currentSize = permanentResizedSizes.clusters[cluster.id];
    }

    let newSize = Math.max(MIN_SIZE, Math.min(MAX_CLUSTER_SIZE, currentSize + delta));

    cluster.size = newSize;
    updatePermanentResizedSizes('cluster', cluster.id, newSize);

    // ✅ NEW: Save to backend
    saveResizedSizes(permanentResizedSizes);

    console.log(`Cluster ${cluster.id} resized to: ${newSize}px (base zoom)`);
    
    clearTimeout(window.resizeNotificationTimeout);
    window.resizeNotificationTimeout = setTimeout(() => {
        showNotification(`Cluster zoom: ${newSize}px`, 'info');
    }, 200);
}

/**
 * Resize individual POI - UPDATED TO SAVE TO BACKEND
 */
function resizePOI(poi, delta) {
    let currentSize = poi.logoSize || 40;
    
    const key = `${poi.category}-${poi.id}`;
    if (permanentResizedSizes.pois[key]) {
        currentSize = permanentResizedSizes.pois[key];
    }

    let newSize = Math.max(MIN_SIZE, Math.min(MAX_SIZE, currentSize + delta));

    poi.logoSize = newSize;
    updatePermanentResizedSizes('poi', key, newSize);

    // ✅ NEW: Save to backend
    saveResizedSizes(permanentResizedSizes);

    console.log(`POI ${poi.name} resized to: ${newSize}px`);
    
    clearTimeout(window.resizeNotificationTimeout);
    window.resizeNotificationTimeout = setTimeout(() => {
        showNotification(`${poi.name} size: ${newSize}px`, 'info');
    }, 200);
}

/**
 * Resize highway label - UPDATED TO SAVE TO BACKEND
 */
function resizeHighway(hw, delta) {
    let currentSize = hw.labelSize || 14;
    
    const hwIndex = highwayData.indexOf(hw);
    if (permanentResizedSizes.highways[hwIndex]) {
        currentSize = permanentResizedSizes.highways[hwIndex];
    }

    let newSize = Math.max(10, Math.min(30, currentSize + delta));

    hw.labelSize = newSize;
    updatePermanentResizedSizes('highway', hwIndex, newSize);

    // ✅ NEW: Save to backend
    saveResizedSizes(permanentResizedSizes);

    console.log(`Highway ${hw.name} label resized to: ${newSize}px`);
    
    clearTimeout(window.resizeNotificationTimeout);
    window.resizeNotificationTimeout = setTimeout(() => {
        showNotification(`Highway label size: ${newSize}px`, 'info');
    }, 200);
}

/**
 * Resize site marker - UPDATED TO SAVE TO BACKEND
 */
function resizeSiteMarker(delta) {
    let currentRadius = window.siteMarkerPosition?.radius || 20;
    
    if (permanentResizedSizes.siteMarker) {
        currentRadius = permanentResizedSizes.siteMarker;
    }

    let newRadius = Math.max(15, Math.min(50, currentRadius + delta));

    if (window.siteMarkerPosition) {
        window.siteMarkerPosition.radius = newRadius;
    }

    updatePermanentResizedSizes('siteMarker', null, newRadius);

    // ✅ NEW: Save to backend
    saveResizedSizes(permanentResizedSizes);

    console.log(`Site marker resized to: ${newRadius}px`);
    
    clearTimeout(window.resizeNotificationTimeout);
    window.resizeNotificationTimeout = setTimeout(() => {
        showNotification(`Site marker size: ${newRadius}px`, 'info');
    }, 200);
}

// ... rest of the code remains exactly the same ...

// NOTE: All other functions (toggleResizeMode, handleResizeClick, handleResizeWheel,
// handleResizeKeyboard, resizeItem, findItemAtPosition, toggleOtherControls,
// restoreResizedSizes, resetAllSizes, setupGlobalResizeFunctions) 
// remain EXACTLY the same as before. Only the four resize helper functions were modified.

/**
 * Find item at position for resizing
 */
function findItemAtPosition(x, y) {
    const clickRadius = 50;

    // Check site marker
    if (window.siteMarkerPosition) {
        let checkX, checkY;
        
        if (window.siteMarkerPosition.isDragged) {
            checkX = window.siteMarkerPosition.x;
            checkY = window.siteMarkerPosition.y;
        } else {
            const coords = latLngToPixel(selectedSiteLocation.lat, selectedSiteLocation.lng);
            checkX = coords.x;
            checkY = coords.y;
        }

        const dist = Math.sqrt(Math.pow(x - checkX, 2) + Math.pow(y - checkY, 2));

        if (dist < clickRadius) {
            return {
                type: 'siteMarker',
                name: 'Site Marker',
                data: window.siteMarkerPosition
            };
        }
    }

    // Check clusters
    for (let cluster of poiClusters) {
        let checkX = cluster.isDragged ? cluster.draggedX : cluster.clusterX;
        let checkY = cluster.isDragged ? cluster.draggedY : cluster.clusterY;

        const dist = Math.sqrt(Math.pow(x - checkX, 2) + Math.pow(y - checkY, 2));

        if (dist < clickRadius) {
            return {
                type: 'cluster',
                name: `Cluster (${cluster.pois.length} items)`,
                data: cluster
            };
        }
    }

    // Check individual POIs
    for (const [category, pois] of Object.entries(allPOIsDataByCategory)) {
        for (let idx = 0; idx < pois.length; idx++) {
            if (!selectedPOIs[category] || !selectedPOIs[category][idx]) continue;

            const poi = pois[idx];

            // Skip if in cluster
            const isInCluster = poiClusters.some(cluster =>
                cluster.pois.some(p => p.poi === poi)
            );
            if (isInCluster) continue;

            let checkX = poi.isDragged ? poi.draggedX : poi.pixelX;
            let checkY = poi.isDragged ? poi.draggedY : poi.pixelY;

            const dist = Math.sqrt(Math.pow(x - checkX, 2) + Math.pow(y - checkY, 2));

            if (dist < clickRadius) {
                return {
                    type: 'poi',
                    name: poi.name,
                    data: poi
                };
            }
        }
    }

    // Check highways
    for (let idx = 0; idx < highwayData.length; idx++) {
        if (!selectedHighways[idx]) continue;

        const hw = highwayData[idx];
        let checkX = hw.isDragged ? hw.draggedX : hw.pixelX;
        let checkY = hw.isDragged ? hw.draggedY : hw.pixelY;

        const dist = Math.sqrt(Math.pow(x - checkX, 2) + Math.pow(y - checkY, 2));

        if (dist < clickRadius) {
            return {
                type: 'highway',
                name: hw.name,
                data: hw
            };
        }
    }

    return null;
}

/**
 * Toggle other controls (disable during resize mode)
 */
function toggleOtherControls(enabled) {
    // Disable/Enable drag mode button
    const dragBtn = document.getElementById('dragModeBtn');
    if (dragBtn) {
        dragBtn.disabled = !enabled;
        if (!enabled) {
            dragBtn.style.opacity = '0.5';
            dragBtn.style.cursor = 'not-allowed';
        } else {
            dragBtn.style.opacity = '1';
            dragBtn.style.cursor = 'pointer';
        }
    }

    // Disable/Enable all checkboxes in right panel
    const checkboxes = document.querySelectorAll('.panel-content input[type="checkbox"]');
    checkboxes.forEach(cb => {
        cb.disabled = !enabled;
    });

    console.log(`Other controls ${enabled ? 'enabled' : 'disabled'}`);
}

/**
 * Restore resized sizes after redraw
 */
export function restoreResizedSizes() {
    console.log('Restoring resized sizes...');

    // Restore POIs
    for (const [category, pois] of Object.entries(allPOIsDataByCategory)) {
        pois.forEach(poi => {
            const key = `${category}-${poi.id}`;
            if (permanentResizedSizes.pois[key]) {
                poi.logoSize = permanentResizedSizes.pois[key];
            }
        });
    }

    // Restore clusters
    poiClusters.forEach(cluster => {
        if (permanentResizedSizes.clusters[cluster.id]) {
            cluster.size = permanentResizedSizes.clusters[cluster.id];
        }
    });

    // Restore highways
    highwayData.forEach((hw, index) => {
        if (permanentResizedSizes.highways[index]) {
            hw.labelSize = permanentResizedSizes.highways[index];
        }
    });

    // Restore site marker
    if (permanentResizedSizes.siteMarker && window.siteMarkerPosition) {
        window.siteMarkerPosition.radius = permanentResizedSizes.siteMarker;
    }

    console.log('✓ Resized sizes restored');
}

/**
 * Reset all sizes to default
 */
export function resetAllSizes() {
    if (!confirm('Reset all item sizes to default?')) return;

    // Clear permanent storage
    permanentResizedSizes.pois = {};
    permanentResizedSizes.clusters = {};
    permanentResizedSizes.highways = {};
    permanentResizedSizes.siteMarker = null;

    // Reset POIs
    for (const [category, pois] of Object.entries(allPOIsDataByCategory)) {
        pois.forEach(poi => {
            poi.logoSize = 40;
        });
    }

    // Reset clusters
    poiClusters.forEach(cluster => {
        cluster.size = 80;
    });

    // Reset highways
    highwayData.forEach(hw => {
        hw.labelSize = 14;
    });

    // Reset site marker
    if (window.siteMarkerPosition) {
        window.siteMarkerPosition.radius = 20;
    }

    showNotification('All sizes reset to default', 'success');
    redrawStaticMapSmooth();
}

/**
 * Setup global resize functions
 */
export function setupGlobalResizeFunctions() {
    window.toggleResizeMode = toggleResizeMode;
    window.resetAllSizes = resetAllSizes;
}