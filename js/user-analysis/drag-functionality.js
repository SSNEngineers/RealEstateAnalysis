// js/user-analysis/drag-functionality.js - UPDATED WITH BACKEND SAVE
// Add this import at the top of the file

import { saveDraggedPositions } from './backend-helpers.js';

// ... rest of the imports remain the same ...
import {
    isDragMode,
    draggedItem,
    dragStartX,
    dragStartY,
    dragOffsetX,
    dragOffsetY,
    setDragMode,
    setDraggedItem,
    setDragCoordinates,
    mapCanvas,
    MAP_WIDTH,
    MAP_HEIGHT,
    poiClusters,
    allPOIsDataByCategory,
    selectedPOIs,
    highwayData,
    selectedHighways,
    selectedSiteLocation,
    permanentDraggedPositions,
    updatePermanentDraggedPositions,
    clearPermanentDraggedPosition,
    isResizeMode,
    isReshapeMode
} from './state.js';
import { latLngToPixel } from './coordinates.js';
import { showNotification } from './utilities.js';
import { redrawStaticMapSmooth } from './main-render.js';

// ... all existing code remains the same until handleDragEnd function ...
/**
 * Toggle drag mode on/off
 */
export function toggleDragMode() {
    const newMode = !isDragMode;
    setDragMode(newMode);

    const btn = document.getElementById('dragModeBtn');
    const btnText = document.getElementById('dragBtnText');
    const instructions = document.getElementById('dragInstructions');
    
    // Get resize button
    const resizeBtn = document.getElementById('resizeModeBtn');

    if (newMode) {
        // Enable drag mode
        btn.classList.add('active');
        btnText.textContent = 'Disable Drag Mode';
        instructions.classList.add('show');
        document.body.classList.add('drag-mode-active');

        // Disable resize button
        if (resizeBtn) {
            resizeBtn.disabled = true;
            resizeBtn.style.opacity = '0.5';
            resizeBtn.style.cursor = 'not-allowed';
        }

        // Add drag listeners to canvas
        mapCanvas.addEventListener('mousedown', handleDragStart);
        mapCanvas.addEventListener('mousemove', handleDragMove);
        mapCanvas.addEventListener('mouseup', handleDragEnd);
        mapCanvas.addEventListener('mouseleave', handleDragEnd);

        mapCanvas.removeEventListener('click', handleCanvasClick);
        mapCanvas.style.cursor = 'move';

        console.log('✓ Drag mode ENABLED');
    } else {
        // Disable drag mode
        btn.classList.remove('active');
        btnText.textContent = 'Enable Drag Mode';
        instructions.classList.remove('show');
        document.body.classList.remove('drag-mode-active');

        // Enable resize button
        if (resizeBtn) {
            resizeBtn.disabled = false;
            resizeBtn.style.opacity = '1';
            resizeBtn.style.cursor = 'pointer';
        }

        // Remove drag listeners
        mapCanvas.removeEventListener('mousedown', handleDragStart);
        mapCanvas.removeEventListener('mousemove', handleDragMove);
        mapCanvas.removeEventListener('mouseup', handleDragEnd);
        mapCanvas.removeEventListener('mouseleave', handleDragEnd);

        mapCanvas.addEventListener('click', handleCanvasClick);
        mapCanvas.style.cursor = 'default';
        setDraggedItem(null);

        console.log('✓ Drag mode DISABLED');
    }
}

/**
 * Handle drag start
 */
export function handleDragStart(e) {
    if (!isDragMode) return;

    const rect = mapCanvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const item = findItemAtPosition(mouseX, mouseY);
    setDraggedItem(item);

    if (item) {
        let currentX = item.x;
        let currentY = item.y;

        // Use dragged position if it exists
        if (item.type === 'cluster' && item.data.isDragged) {
            currentX = item.data.draggedX;
            currentY = item.data.draggedY;
        } else if (item.type === 'poi' && item.data.isDragged) {
            currentX = item.data.draggedX;
            currentY = item.data.draggedY;
        } else if (item.type === 'highway' && item.data.isDragged) {
            currentX = item.data.draggedX;
            currentY = item.data.draggedY;
        } else if (item.type === 'siteMarker' && window.siteMarkerPosition.isDragged) {
            currentX = window.siteMarkerPosition.x;
            currentY = window.siteMarkerPosition.y;
        }
        setDragCoordinates(mouseX, mouseY, mouseX - currentX, mouseY - currentY);

        item.dragStartX = currentX;
        item.dragStartY = currentY;

        mapCanvas.style.cursor = 'grabbing';
        mapCanvas.style.opacity = '0.95'; // Slight transparency during drag

        console.log(`✓ Started dragging ${item.type} from: ${currentX.toFixed(1)}, ${currentY.toFixed(1)}`);
    }
}

/**
 * Handle drag move
 */
export function handleDragMove(e) {
    if (!isDragMode || !draggedItem) return;

    const rect = mapCanvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Calculate new position
    let newX = mouseX - dragOffsetX;
    let newY = mouseY - dragOffsetY;

    // Keep within bounds
    newX = Math.max(20, Math.min(MAP_WIDTH - 20, newX));
    newY = Math.max(20, Math.min(MAP_HEIGHT - 20, newY));

    // Update both draggedItem AND the actual data object
    if (draggedItem.type === 'cluster') {
        draggedItem.data.isDragged = true;
        draggedItem.data.draggedX = newX;
        draggedItem.data.draggedY = newY;
        draggedItem.x = newX;
        draggedItem.y = newY;
    } else if (draggedItem.type === 'poi') {
        draggedItem.data.isDragged = true;
        draggedItem.data.draggedX = newX;
        draggedItem.data.draggedY = newY;
        draggedItem.x = newX;
        draggedItem.y = newY;
    } else if (draggedItem.type === 'highway') {
        draggedItem.data.isDragged = true;
        draggedItem.data.draggedX = newX;
        draggedItem.data.draggedY = newY;
        draggedItem.x = newX;
        draggedItem.y = newY;
    } else if (draggedItem.type === 'siteMarker') {
        window.siteMarkerPosition.isDragged = true;
        window.siteMarkerPosition.x = newX;
        window.siteMarkerPosition.y = newY;
        draggedItem.x = newX;
        draggedItem.y = newY;
    }

    // Update permanent storage in real-time
    updatePermanentPositionHelper(draggedItem, newX, newY);

    // Throttle redraws using requestAnimationFrame
    if (!window.dragAnimationFrame) {
        window.dragAnimationFrame = requestAnimationFrame(() => {
            redrawStaticMapSmooth();
            window.dragAnimationFrame = null;
        });
    }
}


/**
 * Handle drag end - UPDATED TO SAVE TO BACKEND
 */
export function handleDragEnd(e) {
    if (!isDragMode) return;

    if (draggedItem) {
        console.log(`✅ ${draggedItem.type} repositioned to: ${draggedItem.x.toFixed(1)}, ${draggedItem.y.toFixed(1)}`);

        // Store final position in permanent storage
        if (draggedItem.type === 'cluster') {
            updatePermanentDraggedPositions('cluster', draggedItem.data.id, {
                x: draggedItem.x,
                y: draggedItem.y,
                originalX: draggedItem.originalX,
                originalY: draggedItem.originalY
            });
            draggedItem.data.isDragged = true;
            draggedItem.data.draggedX = draggedItem.x;
            draggedItem.data.draggedY = draggedItem.y;

        } else if (draggedItem.type === 'poi') {
            const key = `${draggedItem.data.category}-${draggedItem.data.id}`;
            updatePermanentDraggedPositions('poi', key, {
                x: draggedItem.x,
                y: draggedItem.y,
                originalX: draggedItem.originalX,
                originalY: draggedItem.originalY
            });
            draggedItem.data.isDragged = true;
            draggedItem.data.draggedX = draggedItem.x;
            draggedItem.data.draggedY = draggedItem.y;

        } else if (draggedItem.type === 'highway') {
            const hwIndex = highwayData.indexOf(draggedItem.data);
            updatePermanentDraggedPositions('highway', hwIndex, {
                x: draggedItem.x,
                y: draggedItem.y,
                originalX: draggedItem.originalX,
                originalY: draggedItem.originalY
            });
            draggedItem.data.isDragged = true;
            draggedItem.data.draggedX = draggedItem.x;
            draggedItem.data.draggedY = draggedItem.y;

        } else if (draggedItem.type === 'siteMarker') {
            updatePermanentDraggedPositions('siteMarker', null, {
                x: draggedItem.x,
                y: draggedItem.y,
                originalX: draggedItem.originalX,
                originalY: draggedItem.originalY
            });
            window.siteMarkerPosition.isDragged = true;
            window.siteMarkerPosition.x = draggedItem.x;
            window.siteMarkerPosition.y = draggedItem.y;
        }

        // ✅ NEW: Save to backend after drag complete
        saveDraggedPositions(permanentDraggedPositions);

        setDraggedItem(null);
        setDragCoordinates(0, 0, 0, 0);

        if (window.dragAnimationFrame) {
            cancelAnimationFrame(window.dragAnimationFrame);
            window.dragAnimationFrame = null;
        }
    }

    mapCanvas.style.cursor = 'move';
    mapCanvas.style.opacity = '1';
}

// ... rest of the code remains exactly the same ...

// NOTE: All other functions (toggleDragMode, handleDragStart, handleDragMove, 
// findItemAtPosition, restoreDraggedPositions, handleCanvasClick, etc.) 
// remain EXACTLY the same as before. Only handleDragEnd was modified.
/**
 * Find item at position for dragging
 */
export function findItemAtPosition(x, y) {
    const clickRadius = 50;

    // Check site marker
    if (window.siteMarkerPosition) {
        let checkX, checkY, originalX, originalY;

        if (permanentDraggedPositions.siteMarker) {
            checkX = permanentDraggedPositions.siteMarker.x;
            checkY = permanentDraggedPositions.siteMarker.y;
            originalX = permanentDraggedPositions.siteMarker.originalX;
            originalY = permanentDraggedPositions.siteMarker.originalY;
        } else if (window.siteMarkerPosition.isDragged) {
            checkX = window.siteMarkerPosition.x;
            checkY = window.siteMarkerPosition.y;
            const originalCoords = latLngToPixel(selectedSiteLocation.lat, selectedSiteLocation.lng);
            originalX = originalCoords.x;
            originalY = originalCoords.y;
        } else {
            const coords = latLngToPixel(selectedSiteLocation.lat, selectedSiteLocation.lng);
            checkX = coords.x;
            checkY = coords.y;
            originalX = coords.x;
            originalY = coords.y;
        }

        const dist = Math.sqrt(Math.pow(x - checkX, 2) + Math.pow(y - checkY, 2));

        if (dist < clickRadius) {
            return {
                type: 'siteMarker',
                x: checkX,
                y: checkY,
                originalX: originalX,
                originalY: originalY,
                data: window.siteMarkerPosition
            };
        }
    }

    // Check clusters
    for (let cluster of poiClusters) {
        let checkX, checkY;

        if (permanentDraggedPositions.clusters[cluster.id]) {
            checkX = permanentDraggedPositions.clusters[cluster.id].x;
            checkY = permanentDraggedPositions.clusters[cluster.id].y;
        } else if (cluster.isDragged) {
            checkX = cluster.draggedX;
            checkY = cluster.draggedY;
        } else {
            checkX = cluster.clusterX;
            checkY = cluster.clusterY;
        }

        const dist = Math.sqrt(Math.pow(x - checkX, 2) + Math.pow(y - checkY, 2));

        if (dist < clickRadius) {
            return {
                type: 'cluster',
                x: checkX,
                y: checkY,
                originalX: cluster.meanX,
                originalY: cluster.meanY,
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

            let checkX, checkY;
            const key = `${category}-${poi.id}`;

            if (permanentDraggedPositions.pois[key]) {
                checkX = permanentDraggedPositions.pois[key].x;
                checkY = permanentDraggedPositions.pois[key].y;
            } else if (poi.isDragged) {
                checkX = poi.draggedX;
                checkY = poi.draggedY;
            } else {
                checkX = poi.pixelX;
                checkY = poi.pixelY;
            }

            const dist = Math.sqrt(Math.pow(x - checkX, 2) + Math.pow(y - checkY, 2));

            if (dist < clickRadius) {
                if (!poi.originalPixelX) {
                    poi.originalPixelX = poi.pixelX;
                    poi.originalPixelY = poi.pixelY;
                }

                return {
                    type: 'poi',
                    x: checkX,
                    y: checkY,
                    originalX: poi.originalPixelX,
                    originalY: poi.originalPixelY,
                    data: poi
                };
            }
        }
    }

    // Check highways
    for (let idx = 0; idx < highwayData.length; idx++) {
        if (!selectedHighways[idx]) continue;

        const hw = highwayData[idx];
        let checkX, checkY;

        if (permanentDraggedPositions.highways[idx]) {
            checkX = permanentDraggedPositions.highways[idx].x;
            checkY = permanentDraggedPositions.highways[idx].y;
        } else if (hw.isDragged) {
            checkX = hw.draggedX;
            checkY = hw.draggedY;
        } else {
            checkX = hw.pixelX;
            checkY = hw.pixelY;
        }

        const dist = Math.sqrt(Math.pow(x - checkX, 2) + Math.pow(y - checkY, 2));

        if (dist < clickRadius) {
            if (!hw.originalPixelX) {
                hw.originalPixelX = hw.pixelX;
                hw.originalPixelY = hw.pixelY;
            }

            return {
                type: 'highway',
                x: checkX,
                y: checkY,
                originalX: hw.originalPixelX,
                originalY: hw.originalPixelY,
                data: hw
            };
        }
    }

    return null;
}

/**
 * Update permanent position helper
 */
function updatePermanentPositionHelper(item, x, y) {
    if (!item) return;

    if (item.type === 'cluster') {
        updatePermanentDraggedPositions('cluster', item.data.id, {
            x: x,
            y: y,
            originalX: item.originalX,
            originalY: item.originalY
        });
    } else if (item.type === 'poi') {
        const key = `${item.data.category}-${item.data.id}`;
        updatePermanentDraggedPositions('poi', key, {
            x: x,
            y: y,
            originalX: item.originalX,
            originalY: item.originalY
        });
    } else if (item.type === 'highway') {
        const hwIndex = highwayData.indexOf(item.data);
        if (hwIndex !== -1) {
            updatePermanentDraggedPositions('highway', hwIndex, {
                x: x,
                y: y,
                originalX: item.originalX,
                originalY: item.originalY
            });
        }
    } else if (item.type === 'siteMarker') {
        updatePermanentDraggedPositions('siteMarker', null, {
            x: x,
            y: y,
            originalX: item.originalX,
            originalY: item.originalY
        });
    }
}

/**
 * Restore dragged positions after redraw
 */
export function restoreDraggedPositions() {
    console.log('Restoring dragged positions...');

    // Restore POIs
    for (const [category, pois] of Object.entries(allPOIsDataByCategory)) {
        pois.forEach(poi => {
            const key = `${category}-${poi.id}`;
            if (permanentDraggedPositions.pois[key]) {
                const saved = permanentDraggedPositions.pois[key];
                poi.isDragged = true;
                poi.draggedX = saved.x;
                poi.draggedY = saved.y;
                poi.originalPixelX = saved.originalX;
                poi.originalPixelY = saved.originalY;
            }
        });
    }

    // Restore clusters
    poiClusters.forEach(cluster => {
        if (permanentDraggedPositions.clusters[cluster.id]) {
            const saved = permanentDraggedPositions.clusters[cluster.id];
            cluster.isDragged = true;
            cluster.draggedX = saved.x;
            cluster.draggedY = saved.y;
        }
    });

    // Restore highways
    highwayData.forEach((hw, index) => {
        if (permanentDraggedPositions.highways[index]) {
            const saved = permanentDraggedPositions.highways[index];
            hw.isDragged = true;
            hw.draggedX = saved.x;
            hw.draggedY = saved.y;
            hw.originalPixelX = saved.originalX;
            hw.originalPixelY = saved.originalY;
        }
    });

    // Restore site marker
    if (permanentDraggedPositions.siteMarker && window.siteMarkerPosition) {
        const saved = permanentDraggedPositions.siteMarker;
        window.siteMarkerPosition.isDragged = true;
        window.siteMarkerPosition.x = saved.x;
        window.siteMarkerPosition.y = saved.y;
    }

    console.log('✓ Dragged positions restored');
}

/**
 * Canvas click handler (for popups when not in drag mode)
 */
export function handleCanvasClick(event) {
    if (isDragMode || isResizeMode || isReshapeMode) return;

    // ⭐ ADD THIS: Check if resize mode is active

    const rect = mapCanvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;

    console.log(`Canvas clicked at: ${clickX}, ${clickY}`);

    // Check if clicked on site marker
    if (window.siteMarkerPosition) {
        let siteX, siteY;

        if (window.siteMarkerPosition.isDragged) {
            siteX = window.siteMarkerPosition.x;
            siteY = window.siteMarkerPosition.y;
        } else {
            const coords = latLngToPixel(selectedSiteLocation.lat, selectedSiteLocation.lng);
            siteX = coords.x;
            siteY = coords.y;
        }

        const distance = Math.sqrt(
            Math.pow(clickX - siteX, 2) +
            Math.pow(clickY - siteY, 2)
        );

        if (distance < 30) {
            showSiteMarkerPopup(event.clientX, event.clientY);
            return;
        }
    }

    // Check if clicked on any POI
    for (const [category, pois] of Object.entries(allPOIsDataByCategory)) {
        for (let idx = 0; idx < pois.length; idx++) {
            if (!selectedPOIs[category] || !selectedPOIs[category][idx]) continue;

            const poi = pois[idx];
            const poiX = poi.isDragged ? poi.draggedX : poi.pixelX;
            const poiY = poi.isDragged ? poi.draggedY : poi.pixelY;

            const distance = Math.sqrt(
                Math.pow(clickX - poiX, 2) +
                Math.pow(clickY - poiY, 2)
            );

            if (distance < poi.logoSize / 2 + 10) {
                showPOIPopup(poi, event.clientX, event.clientY);
                return;
            }
        }
    }

    // Check clusters
    poiClusters.forEach(cluster => {
        const clusterX = cluster.isDragged ? cluster.draggedX : cluster.clusterX;
        const clusterY = cluster.isDragged ? cluster.draggedY : cluster.clusterY;

        const distance = Math.sqrt(
            Math.pow(clickX - clusterX, 2) +
            Math.pow(clickY - clusterY, 2)
        );

        if (distance < cluster.size / 2) {
            showClusterPopup(cluster, event.clientX, event.clientY);
        }
    });
}

/**
 * Show POI popup
 */
function showPOIPopup(poi, clientX, clientY) {
    const existing = document.getElementById('poiPopup');
    if (existing) existing.remove();

    const popup = document.createElement('div');
    popup.id = 'poiPopup';
    popup.style.cssText = `
        position: fixed;
        left: ${clientX + 10}px;
        top: ${clientY + 10}px;
        background: white;
        border: 3px solid #8B0000;
        border-radius: 10px;
        padding: 15px;
        padding-top: 35px;
        box-shadow: 0 8px 30px rgba(0,0,0,0.3);
        z-index: 10000;
        max-width: 300px;
        font-family: 'Segoe UI', sans-serif;
    `;

    popup.innerHTML = `
        <button onclick="removePOIFromPopup('${poi.category}', ${poi.id})" 
                style="position: absolute; top: 5px; left: 10px; background: #dc3545; color: white; border: none; padding: 5px 12px; border-radius: 5px; font-size: 12px; font-weight: bold; cursor: pointer;">
            <i class="fas fa-trash-alt"></i> Remove
        </button>
        <button onclick="document.getElementById('poiPopup').remove()" 
                style="position: absolute; top: 5px; right: 10px; background: none; border: none; font-size: 24px; cursor: pointer; color: #8B0000; padding: 0; line-height: 1;">&times;</button>
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
            ${poi.logoUrl ? `<img src="${poi.logoUrl}" style="width: 40px; height: 40px; border-radius: 5px;">` : '<span style="font-size: 30px;">⭐</span>'}
            <strong style="color: #8B0000; font-size: 16px;">${poi.name}</strong>
        </div>
        <div style="font-size: 13px; line-height: 1.6; color: #333;">
            <div style="margin-bottom: 8px;">
                <i class="fas fa-map-marker-alt" style="color: #8B0000; width: 20px;"></i>
                <strong>Address:</strong><br>
                <span style="margin-left: 25px;">${poi.address || 'N/A'}</span>
            </div>
            <div style="margin-bottom: 8px;">
                <i class="fas fa-mail-bulk" style="color: #8B0000; width: 20px;"></i>
                <strong>Zip Code:</strong> ${poi.postalCode || 'N/A'}
            </div>
            <div style="margin-bottom: 8px;">
                <i class="fas fa-crosshairs" style="color: #8B0000; width: 20px;"></i>
                <strong>Coordinates:</strong><br>
                <span style="margin-left: 25px;">${poi.coordinates}</span>
            </div>
            <div>
                <i class="fas fa-route" style="color: #8B0000; width: 20px;"></i>
                <strong>Distance:</strong> ${poi.distanceMiles.toFixed(2)} miles
            </div>
        </div>
    `;

    document.body.appendChild(popup);

    setTimeout(() => {
        if (document.getElementById('poiPopup')) {
            popup.remove();
        }
    }, 10000);
}

/**
 * Show cluster popup with individual remove and split buttons for each POI
 */
function showClusterPopup(cluster, clientX, clientY) {
    const existing = document.getElementById('poiPopup');
    if (existing) existing.remove();

    const popup = document.createElement('div');
    popup.id = 'poiPopup';
    popup.style.cssText = `
        position: fixed;
        left: ${clientX + 10}px;
        top: ${clientY + 10}px;
        background: white;
        border: 3px solid #8B0000;
        border-radius: 10px;
        padding: 15px;
        padding-top: 35px;
        box-shadow: 0 8px 30px rgba(0,0,0,0.3);
        z-index: 10000;
        max-width: 400px;
        max-height: 450px;
        overflow-y: auto;
        font-family: 'Segoe UI', sans-serif;
    `;

    let content = `
        <button onclick="document.getElementById('poiPopup').remove()" 
                style="position: absolute; top: 5px; right: 10px; background: none; border: none; font-size: 24px; cursor: pointer; color: #8B0000; padding: 0; line-height: 1;">&times;</button>
        <h4 style="color: #8B0000; margin-bottom: 10px;">Cluster (${cluster.pois.length} locations)</h4>
    `;

    cluster.pois.forEach((poiData, idx) => {
        const poi = poiData.poi;
        const category = poiData.category;
        const poiIdx = poiData.idx;
        
        content += `
            <div style="padding: 10px; margin-bottom: 8px; background: #f8f9fa; border-radius: 5px; font-size: 12px; position: relative; padding-left: 90px;">
                <div style="position: absolute; left: 8px; top: 50%; transform: translateY(-50%); display: flex; gap: 4px;">
                    <button onclick="removePOIFromCluster('${category}', ${poiIdx}, '${cluster.id}')" 
                            title="Remove from map"
                            style="background: #dc3545; color: white; border: none; padding: 6px 8px; border-radius: 4px; font-size: 10px; cursor: pointer; display: flex; align-items: center; gap: 4px;">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                    <button onclick="splitPOIFromCluster('${category}', ${poiIdx}, '${cluster.id}')" 
                            title="Split from cluster"
                            style="background: #ffc107; color: #333; border: none; padding: 6px 8px; border-radius: 4px; font-size: 10px; cursor: pointer; display: flex; align-items: center; gap: 4px; font-weight: bold;">
                        <i class="fas fa-cut"></i>
                    </button>
                </div>
                <strong>${idx + 1}. ${poi.name}</strong><br>
                <span style="color: #666;">📍 ${poi.address || 'N/A'}</span><br>
                <span style="color: #666;">📮 ${poi.postalCode || 'N/A'}</span><br>
                <span style="color: #666;">🎯 ${poi.distanceMiles.toFixed(2)} mi</span>
            </div>
        `;
    });

    popup.innerHTML = content;
    document.body.appendChild(popup);
}

/**
 * Show site marker popup with address only
 */
function showSiteMarkerPopup(clientX, clientY) {
    const existing = document.getElementById('poiPopup');
    if (existing) existing.remove();

    const popup = document.createElement('div');
    popup.id = 'poiPopup';
    popup.style.cssText = `
        position: fixed;
        left: ${clientX + 10}px;
        top: ${clientY + 10}px;
        background: white;
        border: 3px solid #00FF00;
        border-radius: 10px;
        padding: 15px;
        padding-top: 35px;
        box-shadow: 0 8px 30px rgba(0,0,0,0.3);
        z-index: 10000;
        max-width: 350px;
        font-family: 'Segoe UI', sans-serif;
    `;

    popup.innerHTML = `
        <button onclick="document.getElementById('poiPopup').remove()" 
                style="position: absolute; top: 5px; right: 10px; background: none; border: none; font-size: 24px; cursor: pointer; color: #00FF00; padding: 0; line-height: 1;">&times;</button>
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
            <span style="font-size: 30px;">📍</span>
            <strong style="color: #00FF00; font-size: 16px;">Site Location</strong>
        </div>
        <div style="font-size: 13px; line-height: 1.6; color: #333;">
            <div style="margin-bottom: 8px;">
                <i class="fas fa-map-marker-alt" style="color: #00FF00; width: 20px;"></i>
                <strong>Address:</strong><br>
                <span style="margin-left: 25px;">${selectedSiteLocation.address}</span>
            </div>
        </div>
    `;

    document.body.appendChild(popup);

    setTimeout(() => {
        if (document.getElementById('poiPopup')) {
            popup.remove();
        }
    }, 10000);
}

/**
 * Remove POI from popup - unselect it from UI panel
 */
window.removePOIFromPopup = function(category, poiId) {
    // Close popup
    const popup = document.getElementById('poiPopup');
    if (popup) popup.remove();
    
    // Find POI index
    const pois = allPOIsDataByCategory[category];
    const poiIndex = pois.findIndex(p => p.id === poiId);
    
    if (poiIndex !== -1) {
        // Uncheck in selectedPOIs
        selectedPOIs[category][poiIndex] = false;
        
        // Update checkbox in UI
        const checkbox = document.querySelector(`input[type="checkbox"][data-category="${category}"][data-index="${poiIndex}"]`);
        if (checkbox) {
            checkbox.checked = false;
        }
        
        // Redraw map
        import('./coordinates.js').then(module => {
            module.calculateAllPixelCoordinates();
        });
        import('./clustering.js').then(module => {
            module.createPOIClusters();
        });
        import('./drag-functionality.js').then(module => {
            module.restoreDraggedPositions();
        });
        import('./main-render.js').then(module => {
            module.redrawStaticMapSmooth();
        });
        
        showNotification(`POI removed from map`, 'success');
        console.log(`✅ POI ${poiId} removed from category ${category}`);
    }
};

/**
 * Remove individual POI from cluster - unselect it from UI panel
 */
window.removePOIFromCluster = function(category, poiIdx, clusterId) {
    console.log(`Removing POI from cluster: category=${category}, idx=${poiIdx}, cluster=${clusterId}`);
    
    // Close popup
    const popup = document.getElementById('poiPopup');
    if (popup) popup.remove();
    
    // Uncheck in selectedPOIs
    if (selectedPOIs[category]) {
        selectedPOIs[category][poiIdx] = false;
    }
    
    // Update checkbox in UI
    const checkbox = document.querySelector(`input[type="checkbox"][data-category="${category}"][data-index="${poiIdx}"]`);
    if (checkbox) {
        checkbox.checked = false;
    }
    
    // Get POI data for notification
    const poi = allPOIsDataByCategory[category]?.[poiIdx];
    const poiName = poi ? poi.name : 'POI';
    
    // Clear dragged position
    if (poi) {
        const key = `${category}-${poi.id}`;
        clearPermanentDraggedPosition('poi', key);
    }
    
    // Redraw map
    import('./coordinates.js').then(module => {
        module.calculateAllPixelCoordinates();
        return import('./clustering.js');
    }).then(module => {
        module.createPOIClusters();
        return import('./drag-functionality.js');
    }).then(module => {
        module.restoreDraggedPositions();
        return import('./main-render.js');
    }).then(module => {
        module.redrawStaticMapSmooth();
    });
    
    showNotification(`${poiName} removed from cluster`, 'success');
    console.log(`✅ POI ${poiIdx} removed from cluster ${clusterId} (category: ${category})`);
};



/**
 * Split individual POI from cluster - show it individually at its original coordinates
 */
window.splitPOIFromCluster = function(category, poiIdx, clusterId) {
    console.log(`Splitting POI from cluster: category=${category}, idx=${poiIdx}, cluster=${clusterId}`);
    
    // Close popup
    const popup = document.getElementById('poiPopup');
    if (popup) popup.remove();
    
    // Get POI data
    const poi = allPOIsDataByCategory[category]?.[poiIdx];
    if (!poi) {
        console.error('POI not found');
        return;
    }
    
    const poiName = poi.name;
    
    // The POI remains selected (checkbox stays checked)
    // We just need to recalculate clusters, which will exclude this POI from the cluster
    // because clustering only runs once and is preserved
    
    // Mark this POI as "should not cluster"
    if (!poi.preventClustering) {
        poi.preventClustering = true;
    }
    
    // Recalculate coordinates
    import('./coordinates.js').then(module => {
        module.calculateAllPixelCoordinates();
        
        // Force re-clustering with this POI excluded
        return import('./clustering.js');
    }).then(module => {
        // Temporarily remove from cluster by modifying cluster assignments
        const cluster = poiClusters.find(c => c.id === clusterId);
        if (cluster) {
            // Remove this POI from cluster's pois array
            cluster.pois = cluster.pois.filter(p => 
                !(p.category === category && p.idx === poiIdx)
            );
            
            // If cluster now has less than 2 POIs, remove it entirely
            if (cluster.pois.length < 2) {
                const clusterIndex = poiClusters.indexOf(cluster);
                poiClusters.splice(clusterIndex, 1);
            }
        }
        
        return import('./drag-functionality.js');
    }).then(module => {
        module.restoreDraggedPositions();
        return import('./main-render.js');
    }).then(module => {
        module.redrawStaticMapSmooth();
    });
    
    showNotification(`${poiName} split from cluster and shown individually`, 'success');
    console.log(`✅ POI ${poiIdx} split from cluster ${clusterId} (category: ${category})`);
};


/**
 * Remove cluster from popup - unselect all POIs in cluster
 */
window.removeClusterFromPopup = function(clusterId) {
    // Close popup
    const popup = document.getElementById('poiPopup');
    if (popup) popup.remove();
    
    // Find cluster
    import('./state.js').then(stateModule => {
        const cluster = stateModule.poiClusters.find(c => c.id === clusterId);
        
        if (cluster) {
            // Unselect all POIs in cluster
            cluster.pois.forEach(poiData => {
                const category = poiData.category;
                const idx = poiData.idx;
                
                stateModule.selectedPOIs[category][idx] = false;
                
                // Update checkbox in UI
                const checkbox = document.querySelector(`input[type="checkbox"][data-category="${category}"][data-index="${idx}"]`);
                if (checkbox) {
                    checkbox.checked = false;
                }
            });
            
            // Redraw map
            import('./coordinates.js').then(module => {
                module.calculateAllPixelCoordinates();
            });
            import('./clustering.js').then(module => {
                module.createPOIClusters();
            });
            import('./drag-functionality.js').then(module => {
                module.restoreDraggedPositions();
            });
            import('./main-render.js').then(module => {
                module.redrawStaticMapSmooth();
            });
            
            showNotification(`Cluster removed from map (${cluster.pois.length} POIs)`, 'success');
            console.log(`✅ Cluster ${clusterId} removed (${cluster.pois.length} POIs)`);
        }
    });
};