// ==================== MAP TILE LOADING AND CACHING ====================

import { ctx, MAP_WIDTH, MAP_HEIGHT, rectangleBounds } from './state.js';
import { loadImage } from './utilities.js';

// Tile cache for performance
const tileCache = new Map();

/**
 * Load tile with caching
 */
export async function loadTileCached(tileUrl) {
    if (tileCache.has(tileUrl)) {
        return tileCache.get(tileUrl);
    }

    try {
        const img = await loadImage(tileUrl);
        tileCache.set(tileUrl, img);
        return img;
    } catch (error) {
        console.warn(`Failed to load tile: ${tileUrl}`);
        throw error;
    }
}

/**
 * Draw map tiles scaled to match rectangle bounds exactly
 */
export async function drawMapTilesOptimized() {
    const zoom = 14;
    const tileSize = 256;

    console.log('Drawing map tiles with bounds scaling...');
    console.log('Rectangle bounds:', rectangleBounds);
    console.log('Canvas size:', MAP_WIDTH, 'x', MAP_HEIGHT);

    // Fill background
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT);

    // Convert bounds to tile coordinates
    const minTileX = Math.floor((rectangleBounds.west + 180) / 360 * Math.pow(2, zoom));
    const maxTileX = Math.ceil((rectangleBounds.east + 180) / 360 * Math.pow(2, zoom));
    
    const minTileY = Math.floor((1 - Math.log(Math.tan(rectangleBounds.north * Math.PI / 180) + 
                     1 / Math.cos(rectangleBounds.north * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom));
    const maxTileY = Math.ceil((1 - Math.log(Math.tan(rectangleBounds.south * Math.PI / 180) + 
                    1 / Math.cos(rectangleBounds.south * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom));

    console.log('Tile range:', `X: ${minTileX}-${maxTileX}, Y: ${minTileY}-${maxTileY}`);

    // Calculate exact pixel positions for bounds corners
    const westTileCoord = (rectangleBounds.west + 180) / 360 * Math.pow(2, zoom);
    const eastTileCoord = (rectangleBounds.east + 180) / 360 * Math.pow(2, zoom);
    const northTileCoord = (1 - Math.log(Math.tan(rectangleBounds.north * Math.PI / 180) + 
                           1 / Math.cos(rectangleBounds.north * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom);
    const southTileCoord = (1 - Math.log(Math.tan(rectangleBounds.south * Math.PI / 180) + 
                           1 / Math.cos(rectangleBounds.south * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom);

    // Calculate scale factors to stretch tiles to canvas
    const tilesWidth = eastTileCoord - westTileCoord;
    const tilesHeight = southTileCoord - northTileCoord;
    const pixelsPerTileX = MAP_WIDTH / tilesWidth;
    const pixelsPerTileY = MAP_HEIGHT / tilesHeight;

    console.log('Scale factors:', `X: ${pixelsPerTileX.toFixed(2)}, Y: ${pixelsPerTileY.toFixed(2)}`);

    const tilePromises = [];

    // Draw tiles with proper scaling
    for (let tileX = minTileX; tileX <= maxTileX; tileX++) {
        for (let tileY = minTileY; tileY <= maxTileY; tileY++) {
            // Skip invalid tiles
            if (tileX < 0 || tileY < 0 || tileX >= Math.pow(2, zoom) || tileY >= Math.pow(2, zoom)) {
                continue;
            }

            const tileUrl = `https://tile.openstreetmap.org/${zoom}/${tileX}/${tileY}.png`;

            // Calculate pixel position and size for this tile
            const drawX = (tileX - westTileCoord) * pixelsPerTileX;
            const drawY = (tileY - northTileCoord) * pixelsPerTileY;
            const drawWidth = pixelsPerTileX;
            const drawHeight = pixelsPerTileY;

            tilePromises.push(
                loadTileCached(tileUrl)
                    .then(img => {
                        ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
                    })
                    .catch(() => {
                        // Draw placeholder for failed tiles
                        ctx.fillStyle = '#e0e0e0';
                        ctx.fillRect(drawX, drawY, drawWidth, drawHeight);
                    })
            );
        }
    }

    await Promise.all(tilePromises);
    console.log('✓ Map tiles loaded and scaled to bounds');
}

/**
 * Draw basic map tiles
 */
export async function drawMapTiles() {
    await drawMapTilesOptimized();
}

/**
 * Clear tile cache
 */
export function clearTileCache() {
    tileCache.clear();
}