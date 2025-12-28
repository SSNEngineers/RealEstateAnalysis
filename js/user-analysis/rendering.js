// ==================== CANVAS RENDERING FUNCTIONS ====================
import {
  ctx,
  MAP_WIDTH,
  MAP_HEIGHT,
  selectedSiteLocation,
  allPOIsDataByCategory,
  highwayData,
  selectedHighways,
  selectedPOIs,
  poiClusters,
  analysisParams,
  isBreakLinesMode,
  selectedLineForBreaking
} from "./state.js";
import { latLngToPixel } from "./coordinates.js";
import { getHighwayColor, isWithinMapBounds, loadImage } from "./utilities.js";
import { checkCollisionWithHighways, findSafePosition } from "./clustering.js";
import { isDragMode } from "./state.js";
import { drawBreakLine, highlightSelectedLine } from "./break-lines.js";
import { getHighwayRotation } from './rotate-highway.js';

// Logo cache for performance
const logoCache = new Map();

/**
 * Load image with caching
 */
export async function loadImageCached(url) {
  if (logoCache.has(url)) {
    return logoCache.get(url);
  }
  try {
    const img = await loadImage(url);
    logoCache.set(url, img);
    return img;
  } catch (error) {
    console.warn(`Failed to load image: ${url}`);
    throw error;
  }
}

/**
 * Draw site marker (green circle with 'S')
 */
export function drawSiteMarker() {
  const siteCoords = latLngToPixel(
    selectedSiteLocation.lat,
    selectedSiteLocation.lng
  );
  console.log("Drawing site marker at:", siteCoords);
  const markerRadius = window.siteMarkerPosition?.radius || 20;
  if (
    siteCoords.x < 0 ||
    siteCoords.x > MAP_WIDTH ||
    siteCoords.y < 0 ||
    siteCoords.y > MAP_HEIGHT
  ) {
    console.error("⚠️ Site marker position is outside canvas!");
    return;
  }
  
  let drawX = siteCoords.x;
  let drawY = siteCoords.y;
  if (window.siteMarkerPosition && window.siteMarkerPosition.isDragged) {
    drawX = window.siteMarkerPosition.x;
    drawY = window.siteMarkerPosition.y;
    
    // Draw line with break points support
    const lineData = {
        type: 'siteMarker',
        id: 'siteMarker',
        startX: siteCoords.x,
        startY: siteCoords.y,
        endX: drawX,
        endY: drawY
    };
    
    // Draw green circle at original position
    ctx.fillStyle = "#48ff00ff";
    ctx.strokeStyle = "white";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(lineData.startX, lineData.startY, 6, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
    
    // Highlight if selected in break lines mode
    if (isBreakLinesMode) {
        highlightSelectedLine(ctx, lineData);
    }
    
    // Draw line with break points
    drawBreakLine(ctx, lineData);
  }
  
  // Store site marker position globally
  if (!window.siteMarkerPosition) {
    window.siteMarkerPosition = { x: drawX, y: drawY, radius: 25 };
  } else {
    window.siteMarkerPosition.x = drawX;
    window.siteMarkerPosition.y = drawY;
  }
  
  // Draw green circle with 'S'
  ctx.fillStyle = "#48ff00ff";
  ctx.strokeStyle = "white";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(drawX, drawY, markerRadius, 0, 2 * Math.PI);
  ctx.fill();
  ctx.stroke();
  
  // Draw 'S' letter
  ctx.fillStyle = "white";
  ctx.font = `bold ${Math.floor(markerRadius * 0.9)}px Arial`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("S", drawX, drawY);
  console.log("✓ Site marker drawn");
}

/**
 * Draw highways (static enhanced version)
 */
export function drawHighwaysStaticEnhanced() {
  console.log(`
Drawing ${highwayData.length} highways...`);
  let drawnCount = 0;
  highwayData.forEach((hw, idx) => {
    if (!selectedHighways[idx]) return;
    if (!hw.pixelPath || hw.pixelPath.length < 2) {
      console.warn(`Highway ${hw.name} has insufficient path points`);
      return;
    }
    // Draw highway path
    ctx.strokeStyle = getHighwayColor(hw.type);
    ctx.lineWidth = 4;
    ctx.beginPath();
    let validPoints = 0;
    hw.pixelPath.forEach((point, i) => {
      if (isWithinMapBounds(point[0], point[1], MAP_WIDTH, MAP_HEIGHT)) {
        if (i === 0 || validPoints === 0) {
          ctx.moveTo(point[0], point[1]);
        } else {
          ctx.lineTo(point[0], point[1]);
        }
        validPoints++;
      }
    });
    if (validPoints >= 2) {
      ctx.stroke();
      drawnCount++;
      if (isWithinMapBounds(hw.pixelX, hw.pixelY, MAP_WIDTH, MAP_HEIGHT)) {
        drawHighwayLabel(hw);
      }
    } else {
      console.warn(`Highway ${hw.name} has no valid points within bounds`);
    }
  });
  console.log(`✓ Drew ${drawnCount} highways`);
}

/**
 * Draw highway label
 */
export function drawHighwayLabel(hw) {
  const label = hw.ref || hw.name.substring(0, 10);
  const color = getHighwayColor(hw.type);
  const fontSize = hw.labelSize || 14;
  ctx.font = `bold ${fontSize}px Arial`;
  const metrics = ctx.measureText(label);
  const padding = 10;
  const boxWidth = metrics.width + padding * 2;
  const boxHeight = 28;
  let labelX = hw.pixelX;
  let labelY = hw.pixelY - 20;
  
  // Get rotation angle
  const hwIndex = highwayData.indexOf(hw);
  const rotation = getHighwayRotation(hwIndex);
  
  if (hw.isDragged) {
    labelX = hw.draggedX;
    labelY = hw.draggedY;
    
    // Draw line with break points support
    const lineData = {
        type: 'highway',
        id: `highway-${highwayData.indexOf(hw)}`,
        startX: hw.originalPixelX || hw.pixelX,
        startY: hw.originalPixelY || hw.pixelY,
        endX: labelX,
        endY: labelY
    };
    
    ctx.fillStyle = "#8B0000";
    ctx.strokeStyle = "white";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(lineData.startX, lineData.startY, 6, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
    
    if (isBreakLinesMode) {
        highlightSelectedLine(ctx, lineData);
    }
    
    drawBreakLine(ctx, lineData);
  }
  // ✅ REMOVED: Collision avoidance code - highways stay at original position
  
  // Apply rotation
  ctx.save();
  ctx.translate(labelX, labelY);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.translate(-labelX, -labelY);
  
  // Draw label box
  ctx.fillStyle = color;
  ctx.strokeStyle = "white";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(
    labelX - boxWidth / 2,
    labelY - boxHeight / 2,
    boxWidth,
    boxHeight,
    6
  );
  ctx.fill();
  ctx.stroke();
  
  // Draw text
  ctx.fillStyle = "white";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, labelX, labelY);
  
  ctx.restore();
}


/**
 * Draw individual POIs WITHOUT collision avoidance (logos at exact coordinates)
 */
export function drawIndividualPOIsEnhanced() {
  console.log("Drawing individual POIs at exact coordinates (no collision avoidance)...");
  let drawnCount = 0;
  
  for (const [category, pois] of Object.entries(allPOIsDataByCategory)) {
    for (let idx = 0; idx < pois.length; idx++) {
      if (!selectedPOIs[category] || !selectedPOIs[category][idx]) continue;
      const poi = pois[idx];
      
      // Check if POI is in a cluster
      const isInCluster = poiClusters.some((cluster) =>
        cluster.pois.some((p) => p.poi === poi)
      );
      
      // Only draw if NOT in cluster, has logo, and within bounds
      if (
        !isInCluster &&
        poi.logoUrl &&
        isWithinMapBounds(poi.pixelX, poi.pixelY, MAP_WIDTH, MAP_HEIGHT)
      ) {
        // ✅ Draw at exact coordinates (dragged or original)
        drawPOILogoStaticCached(poi);
        drawnCount++;
      }
    }
  }
  
  console.log(`✅ Drew ${drawnCount} individual POIs at exact coordinates`);
}

/**
 * Draw POI logo at exact coordinates (no green dots or arrows)
 */
export function drawPOILogoStaticCached(poi) {
  // Only proceed if logo exists
  if (!poi.logoUrl) {
    return; // Skip POIs without logos
  }
  
  // Use dragged position if exists, otherwise original position
  let x = poi.pixelX;
  let y = poi.pixelY;
  
  if (poi.isDragged) {
    x = poi.draggedX;
    y = poi.draggedY;
    
    // Draw line with break points support (only if manually dragged)
    const lineData = {
        type: 'poi',
        id: `${poi.category}-${poi.id}`,
        startX: poi.originalPixelX || poi.pixelX,
        startY: poi.originalPixelY || poi.pixelY,
        endX: x,
        endY: y
    };
    
    // Draw red circle at original position
    ctx.fillStyle = "#8B0000";
    ctx.strokeStyle = "white";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(lineData.startX, lineData.startY, 6, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
    
    // Highlight if selected in break lines mode
    if (isBreakLinesMode) {
        highlightSelectedLine(ctx, lineData);
    }
    
    // Draw line with break points
    drawBreakLine(ctx, lineData);
  }
  
  const size = poi.logoSize || 40;
  if (!isWithinMapBounds(x, y, MAP_WIDTH, MAP_HEIGHT)) return;
  
  loadImageCached(poi.logoUrl)
    .then((img) => {
      // Calculate aspect ratio
      const imgAspect = img.width / img.height;
      let logoWidth = size;
      let logoHeight = size;
      if (imgAspect > 1) {
        logoHeight = size / imgAspect;
      } else {
        logoWidth = size * imgAspect;
      }
      
      // ✅ TIGHT FIT: Minimal padding
      const boxPadding = 4;
      const boxWidth = logoWidth + boxPadding * 2;
      const boxHeight = logoHeight + boxPadding * 2;
      
      // Draw white rounded rectangle box
      ctx.shadowColor = "rgba(0, 0, 0, 0.2)";
      ctx.shadowBlur = 10;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      ctx.fillStyle = "white";
      ctx.strokeStyle = "#8B0000";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(
        x - boxWidth / 2,
        y - boxHeight / 2,
        boxWidth,
        boxHeight,
        5
      );
      ctx.fill();
      ctx.stroke();
      
      // Reset shadow
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      
      // Draw logo centered in box
      ctx.drawImage(
        img,
        x - logoWidth / 2,
        y - logoHeight / 2,
        logoWidth,
        logoHeight
      );
    })
    .catch(() => {
      console.warn(`Failed to load logo for ${poi.name}, skipping`);
    });
}

/**
 * Clear logo cache
 */
export function clearLogoCache() {
  logoCache.clear();
}