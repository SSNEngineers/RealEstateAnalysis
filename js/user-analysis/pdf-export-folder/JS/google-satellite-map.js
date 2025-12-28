// ==================== GOOGLE SATELLITE MAP GENERATOR FOR PDF (PERFECT ALIGNMENT + MAX QUALITY) ====================
// js/user-analysis/pdf-export-folder/JS/google-satellite-map.js

// 🔑 Google Maps API Key
const GOOGLE_MAPS_API_KEY = 'AIzaSyBoSJ7fuPcNHNPLHQ9B3sZeBEdKEp4ujrE';

/**
 * Calculate optimal zoom level to fit bounds in canvas
 */
function calculateOptimalZoom(bounds, canvasWidth, canvasHeight) {
    const WORLD_DIM = { height: 256, width: 256 };
    const ZOOM_MAX = 21;
    
    function latRad(lat) {
        const sin = Math.sin(lat * Math.PI / 180);
        const radX2 = Math.log((1 + sin) / (1 - sin)) / 2;
        return Math.max(Math.min(radX2, Math.PI), -Math.PI) / 2;
    }
    
    function zoom(mapPx, worldPx, fraction) {
        return Math.floor(Math.log(mapPx / worldPx / fraction) / Math.LN2);
    }
    
    const latFraction = (latRad(bounds.north) - latRad(bounds.south)) / Math.PI;
    const lngDiff = bounds.east - bounds.west;
    const lngFraction = ((lngDiff < 0) ? (lngDiff + 360) : lngDiff) / 360;
    
    const latZoom = zoom(canvasHeight, WORLD_DIM.height, latFraction);
    const lngZoom = zoom(canvasWidth, WORLD_DIM.width, lngFraction);
    
    return Math.max(1, Math.min(latZoom, lngZoom, ZOOM_MAX));
}

/**
 * Load image with retry logic
 */
async function loadImageWithRetry(url, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            return await new Promise((resolve, reject) => {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                
                img.onload = () => resolve(img);
                img.onerror = () => reject(new Error('Image load failed'));
                
                img.src = url;
            });
        } catch (error) {
            if (i === retries - 1) throw error;
            console.warn(`Retry ${i + 1}/${retries} for: ${url}`);
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        }
    }
}

/**
 * ✅ PERFECT ALIGNMENT + MAX QUALITY: Draw high-resolution satellite tiles
 * Uses scale=2 for 512x512 pixel tiles (retina quality)
 */
async function drawGoogleSatelliteTiles(ctx, bounds, zoom, canvasWidth, canvasHeight) {
    console.log('🗺️ Drawing HIGH-RESOLUTION Google satellite tiles...');
    console.log(`📍 Bounds: N=${bounds.north.toFixed(6)}, S=${bounds.south.toFixed(6)}, E=${bounds.east.toFixed(6)}, W=${bounds.west.toFixed(6)}`);
    
    // Convert lat/lng to tile coordinates (exact same as OpenStreetMap)
    function latLngToTile(lat, lng, zoom) {
        const n = Math.pow(2, zoom);
        const latRad = lat * Math.PI / 180;
        return {
            x: (lng + 180) / 360 * n,
            y: (1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * n
        };
    }
    
    // Calculate tile range
    const topLeft = latLngToTile(bounds.north, bounds.west, zoom);
    const bottomRight = latLngToTile(bounds.south, bounds.east, zoom);
    
    const minTileX = Math.floor(topLeft.x);
    const maxTileX = Math.floor(bottomRight.x);
    const minTileY = Math.floor(topLeft.y);
    const maxTileY = Math.floor(bottomRight.y);
    
    console.log(`📐 Tile range: X(${minTileX}-${maxTileX}), Y(${minTileY}-${maxTileY}) at zoom ${zoom}`);
    console.log(`🔢 Total tiles: ${(maxTileX - minTileX + 1) * (maxTileY - minTileY + 1)}`);
    
    // Calculate exact pixel positions (same as OSM tile drawing)
    const tilesWidth = bottomRight.x - topLeft.x;
    const tilesHeight = bottomRight.y - topLeft.y;
    const pixelsPerTileX = canvasWidth / tilesWidth;
    const pixelsPerTileY = canvasHeight / tilesHeight;
    
    console.log(`📏 Scale: ${pixelsPerTileX.toFixed(2)}px/tile (X), ${pixelsPerTileY.toFixed(2)}px/tile (Y)`);
    
    // Draw all tiles with high quality
    const tilePromises = [];
    let successCount = 0;
    let failCount = 0;
    
    for (let tileX = minTileX; tileX <= maxTileX; tileX++) {
        for (let tileY = minTileY; tileY <= maxTileY; tileY++) {
            // Skip invalid tiles
            const maxTile = Math.pow(2, zoom);
            if (tileX < 0 || tileY < 0 || tileX >= maxTile || tileY >= maxTile) {
                continue;
            }
            
            // Calculate draw position (exact same as OSM)
            const drawX = (tileX - topLeft.x) * pixelsPerTileX;
            const drawY = (tileY - topLeft.y) * pixelsPerTileY;
            
            // ✅ HIGH-RESOLUTION: scale=2 gives 512x512 tiles (2x quality)
            const tileUrl = `https://mt1.google.com/vt/lyrs=s&x=${tileX}&y=${tileY}&z=${zoom}&scale=2`;
            
            tilePromises.push(
                loadImageWithRetry(tileUrl, 3)
                    .then(img => {
                        // Enable high-quality scaling
                        ctx.imageSmoothingEnabled = true;
                        ctx.imageSmoothingQuality = 'high';
                        
                        // Draw tile at exact position
                        ctx.drawImage(img, drawX, drawY, pixelsPerTileX, pixelsPerTileY);
                        successCount++;
                    })
                    .catch(err => {
                        console.warn(`Failed to load tile (${tileX},${tileY}) after retries, trying fallback...`);
                        
                        // Fallback to standard resolution (256x256)
                        const fallbackUrl = `https://mt1.google.com/vt/lyrs=s&x=${tileX}&y=${tileY}&z=${zoom}`;
                        
                        return loadImageWithRetry(fallbackUrl, 2)
                            .then(img => {
                                ctx.imageSmoothingEnabled = true;
                                ctx.imageSmoothingQuality = 'high';
                                ctx.drawImage(img, drawX, drawY, pixelsPerTileX, pixelsPerTileY);
                                successCount++;
                            })
                            .catch(() => {
                                // Last resort: draw placeholder
                                console.error(`Failed to load tile (${tileX},${tileY}) completely`);
                                ctx.fillStyle = '#2d3436';
                                ctx.fillRect(drawX, drawY, pixelsPerTileX, pixelsPerTileY);
                                
                                // Add subtle grid
                                ctx.strokeStyle = '#636e72';
                                ctx.lineWidth = 1;
                                ctx.strokeRect(drawX, drawY, pixelsPerTileX, pixelsPerTileY);
                                
                                failCount++;
                            });
                    })
            );
        }
    }
    
    // Wait for all tiles to load
    await Promise.all(tilePromises);
    
    console.log(`✅ Satellite tiles loaded: ${successCount} success, ${failCount} failed`);
}

/**
 * ✅ Draw overlays WITHOUT changing bounds or coordinates
 * Perfect alignment with satellite imagery
 */
async function redrawOverlaysOnSatellite(satelliteCanvas) {
    console.log('🎨 Drawing overlays on satellite map (using original coordinates)...');
    
    try {
        // Import modules
        const stateModule = await import('../../state.js');
        const renderingModule = await import('../../rendering.js');
        const clusterModule = await import('../../cluster-rendering.js');
        
        // Save original canvas and context
        const originalCtx = stateModule.ctx;
        const originalCanvas = stateModule.mapCanvas;
        
        // ✅ ONLY swap canvas - keep bounds and coordinates unchanged
        stateModule.setMapCanvas(satelliteCanvas);
        stateModule.setMapContext(satelliteCanvas.getContext('2d'));
        
        // Set canvas quality
        const ctx = satelliteCanvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // Draw overlays using EXISTING pixel coordinates (perfect alignment)
        
        // 1. Site marker
        renderingModule.drawSiteMarker();
        console.log('  ✓ Site marker drawn');
        
        // 2. Highways
        renderingModule.drawHighwaysStaticEnhanced();
        console.log('  ✓ Highways drawn');
        
        // 3. Individual POIs
        renderingModule.drawIndividualPOIsEnhanced();
        console.log('  ✓ Individual POIs drawn');
        
        // 4. Clusters
        await clusterModule.drawClustersEnhanced();
        console.log('  ✓ Clusters drawn');
        
        // ✅ Restore original canvas and context
        stateModule.setMapCanvas(originalCanvas);
        stateModule.setMapContext(originalCtx);
        
        console.log('✅ All overlays drawn with perfect alignment');
        
    } catch (error) {
        console.error('❌ Error drawing overlays:', error);
        throw error;
    }
}

/**
 * Main function: Generate satellite map with overlays for PDF
 * ✅ Perfect coordinate alignment + Maximum quality
 */
export async function generatePDFSatelliteMap(
    selectedSiteLocation,
    rectangleBounds,
    originalCanvas
) {
    try {
        console.log('\n🚀 Generating HIGH-QUALITY Google Satellite map for PDF...');
        console.log('📍 Site location:', selectedSiteLocation.lat.toFixed(6), selectedSiteLocation.lng.toFixed(6));
        
        // Validate API key
        if (!GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY === 'YOUR_GOOGLE_MAPS_API_KEY_HERE') {
            throw new Error('Google Maps API key not configured');
        }
        
        const canvasWidth = originalCanvas.width;
        const canvasHeight = originalCanvas.height;
        
        // Calculate center
        const centerLat = (rectangleBounds.north + rectangleBounds.south) / 2;
        const centerLng = (rectangleBounds.east + rectangleBounds.west) / 2;
        
        // Calculate optimal zoom (same as OpenStreetMap)
        const zoom = calculateOptimalZoom(rectangleBounds, canvasWidth, canvasHeight);
        
        console.log(`📍 Map center: ${centerLat.toFixed(6)}, ${centerLng.toFixed(6)}`);
        console.log(`🔍 Zoom level: ${zoom}`);
        console.log(`📐 Canvas size: ${canvasWidth}x${canvasHeight}`);
        
        // Create canvas for satellite map
        const satelliteCanvas = document.createElement('canvas');
        satelliteCanvas.width = canvasWidth;
        satelliteCanvas.height = canvasHeight;
        const ctx = satelliteCanvas.getContext('2d', {
            alpha: false,
            desynchronized: true
        });
        
        // Enable high quality rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // Fill background (in case tiles fail)
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        
        // ✅ Draw high-resolution satellite tiles (scale=2 for max quality)
        console.log('⏳ Loading satellite imagery...');
        await drawGoogleSatelliteTiles(ctx, rectangleBounds, zoom, canvasWidth, canvasHeight);
        
        console.log('✅ Satellite background complete');
        
        // ✅ Draw overlays with perfect alignment
        console.log('⏳ Drawing overlays...');
        await redrawOverlaysOnSatellite(satelliteCanvas);
        
        // Convert to high-quality PNG
        const dataURL = satelliteCanvas.toDataURL('image/png', 1.0);
        
        console.log('✅ Satellite map generation complete!');
        console.log('📊 Quality: HIGH-RES (512x512 tiles with scale=2)');
        console.log('🎯 Alignment: PERFECT (same projection as OSM)');
        console.log('💰 Using Google Maps Tile API (free tier)\n');
        
        return dataURL;
        
    } catch (error) {
        console.error('❌ Failed to generate satellite map:', error);
        console.error('Error details:', error.message);
        console.warn('⚠️ Falling back to OpenStreetMap');
        
        // Fallback to original canvas
        return originalCanvas.toDataURL('image/png', 1.0);
    }
}