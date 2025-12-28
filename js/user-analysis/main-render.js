// ==================== MAIN RENDERING ORCHESTRATION ====================

import { 
    mapCanvas, 
    ctx,
    setMapCanvas,
    setMapContext
} from './state.js';
import { initializeCanvas, updateCanvasSize, clearCanvas } from './canvas-setup.js';
import { calculateAllPixelCoordinatesWithValidation, diagnosticMapAlignment } from './coordinates.js';
import { drawMapTilesOptimized } from './map-tiles.js';
import { drawSiteMarker, drawHighwaysStaticEnhanced, drawIndividualPOIsEnhanced } from './rendering.js';
import { drawClustersEnhanced, drawClusters } from './cluster-rendering.js';
import { createPOIClusters, optimizeClusterPositions } from './clustering.js';
import { restoreDraggedPositions } from './drag-functionality.js';
import { restoreResizedSizes } from './resize-functionality.js';

/**
 * Render static map (main entry point)
 */
export async function renderStaticMap() {
    const success = initializeCanvas();
    if (!success) return;

    // Calculate projections with validation
    calculateAllPixelCoordinatesWithValidation();

    // ADD THIS LINE: Run diagnostic check
    diagnosticMapAlignment();

    // Load map tiles
    console.log('Loading map tiles...');
    await drawMapTilesOptimized();

    console.log('✓ Map tiles loaded');

    // Create clusters
    createPOIClusters();

    // Render complete map
    await redrawStaticMapComplete();

    console.log('✓ Static map rendered');
}

/**
 * Complete map redraw with full recalculation
 */
export async function redrawStaticMapComplete() {
    console.log('\n========== REDRAWING MAP ==========');

    if (!ctx || !mapCanvas) {
        console.error('Canvas or context not available!');
        return;
    }

    // Clear canvas
    console.log('1. Clearing canvas...');
    clearCanvas();

    // Draw map tiles
    console.log('2. Drawing map tiles...');
    await drawMapTilesOptimized();

    // Restore dragged positions
    console.log('3. Restoring dragged positions...');
    restoreDraggedPositions();

    // Restore resized sizes
    console.log('3.5. Restoring resized sizes...');
    restoreResizedSizes();

    // Draw site marker
    console.log('4. Drawing site marker...');
    drawSiteMarker();

    // Draw highways
    console.log('6. Drawing highways...');
    drawHighwaysStaticEnhanced();

    // Draw individual POIs
    console.log('7. Drawing individual POIs...');
    drawIndividualPOIsEnhanced();

    // Optimize cluster positions
    console.log('8. Optimizing cluster positions...');
    optimizeClusterPositions();

    // Draw clusters
    console.log('9. Drawing clusters...');
    drawClustersEnhanced();

    console.log('========== MAP REDRAW COMPLETE ==========\n');
}

/**
 * Smooth redraw without position reset (for drag operations)
 */
export async function redrawStaticMapSmooth() {
    console.log('\n========== SMOOTH REDRAW (No Position Reset) ==========');

    if (!ctx || !mapCanvas) {
        console.error('Canvas or context not available!');
        return;
    }

    // Clear canvas
    clearCanvas();

    // Draw map tiles
    await drawMapTilesOptimized();

    // Restore all dragged positions
    restoreDraggedPositions();
    // Restore all resized sizes
    restoreResizedSizes();

    // Draw everything
    drawSiteMarker();
    drawHighwaysStaticEnhanced();
    drawIndividualPOIsEnhanced();
    drawClustersEnhanced();

    console.log('========== SMOOTH REDRAW COMPLETE ==========\n');
}

/**
 * Basic static map redraw
 */
export async function redrawStaticMap() {
    if (!ctx || !mapCanvas) return;

    // Clear canvas
    clearCanvas();

    // Redraw map tiles
    await drawMapTilesOptimized();

    // Draw all elements
    drawSiteMarker();
    drawHighwaysStaticEnhanced();
    drawIndividualPOIsEnhanced();
    drawClusters();
}