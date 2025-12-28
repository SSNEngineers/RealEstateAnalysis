// ==================== CANVAS SETUP AND MANAGEMENT ====================

import { 
    mapCanvas, 
    ctx,
    MAP_WIDTH,
    MAP_HEIGHT,
    setMapCanvas, 
    setMapContext, 
    setMapDimensions 
} from './state.js';
import { polyfillRoundRect } from './utilities.js';

/**
 * Update canvas size based on container
 */
export function updateCanvasSize() {
    const container = document.getElementById('mapContainer');

    // Use full container size
    const width = container.clientWidth;
    const height = container.clientHeight;

    setMapDimensions(width, height);

    if (mapCanvas) {
        mapCanvas.width = width;
        mapCanvas.height = height;
    }

    console.log(`Canvas size: ${width} x ${height}`);
}

/**
 * Set canvas quality settings for high-quality rendering
 */
export function setCanvasQuality() {
    if (!ctx) return;

    // Enable high-quality rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Set text rendering quality
    ctx.textRendering = 'optimizeLegibility';

    console.log('✓ Canvas quality settings applied');
}

/**
 * Initialize canvas with quality settings
 */
export function initializeCanvas() {
    const canvas = document.getElementById('mapCanvas');
    if (!canvas) {
        console.error('Canvas element not found');
        return false;
    }

    const context = canvas.getContext('2d', {
        alpha: false,
        desynchronized: true
    });

    if (!context) {
        console.error('Could not get 2D context');
        return false;
    }

    setMapCanvas(canvas);
    setMapContext(context);

    console.log('✓ Canvas initialized successfully');

    // Apply polyfills
    polyfillRoundRect();

    // Set canvas size
    updateCanvasSize();

    // Apply quality settings
    setCanvasQuality();

    return true;
}

/**
 * Clear the entire canvas
 */
export function clearCanvas() {
    if (ctx && mapCanvas) {
        ctx.clearRect(0, 0, MAP_WIDTH, MAP_HEIGHT);
    }
}

/**
 * Update canvas size with quality settings
 */
export function updateCanvasSizeWithQuality() {
    updateCanvasSize();
    setCanvasQuality();
}