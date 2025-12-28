// ==================== BREAK LINES FUNCTIONALITY ====================
// js/user-analysis/break-lines.js

import { saveBreakPoints } from "./backend-helpers.js";

import {
  isBreakLinesMode,
  selectedLineForBreaking,
  breakPoints,
  activeBendPoint,
  setBreakLinesMode,
  setSelectedLineForBreaking,
  addBreakPoint,
  removeBreakPoint,
  setActiveBendPoint,
  updateBreakPointPosition,
  mapCanvas,
  MAP_WIDTH,
  MAP_HEIGHT,
  poiClusters,
  allPOIsDataByCategory,
  selectedPOIs,
  highwayData,
  selectedHighways,
  permanentDraggedPositions,
  isDragMode,
  isResizeMode,
} from "./state.js";
import { showNotification } from "./utilities.js";
import { redrawStaticMapSmooth } from "./main-render.js";

const BREAK_POINT_RADIUS = 8;
const LINE_CLICK_TOLERANCE = 10;

/**
 * Toggle break lines mode on/off
 */
export function toggleBreakLinesMode() {
  const newMode = !isBreakLinesMode;
  setBreakLinesMode(newMode);

  const btn = document.getElementById("breakLinesBtn");
  const btnText = document.getElementById("breakLinesBtnText");
  const instructions = document.getElementById("breakLinesInstructions");

  // Get other mode buttons
  const dragBtn = document.getElementById("dragModeBtn");
  const resizeBtn = document.getElementById("resizeModeBtn");

  if (newMode) {
    // Enable break lines mode
    btn.classList.add("active");
    btnText.textContent = "Disable Break Lines";
    instructions.classList.add("show");
    document.body.classList.add("break-lines-mode-active");

    // Disable other mode buttons
    if (dragBtn) {
      dragBtn.disabled = true;
      dragBtn.style.opacity = "0.5";
      dragBtn.style.cursor = "not-allowed";
    }
    if (resizeBtn) {
      resizeBtn.disabled = true;
      resizeBtn.style.opacity = "0.5";
      resizeBtn.style.cursor = "not-allowed";
    }

    // Add event listeners
    mapCanvas.addEventListener("mousedown", handleBreakLinesMouseDown);
    mapCanvas.addEventListener("mousemove", handleBreakLinesMouseMove);
    mapCanvas.addEventListener("mouseup", handleBreakLinesMouseUp);
    mapCanvas.addEventListener("contextmenu", handleBreakLinesRightClick);
    document.addEventListener("keydown", handleBreakLinesKeyboard);

    mapCanvas.style.cursor = "crosshair";

    console.log("✅ Break Lines mode ENABLED");
    showNotification(
      "Break Lines mode enabled! Click on any dragged line to start breaking.",
      "success"
    );
  } else {
    // Disable break lines mode
    btn.classList.remove("active");
    btnText.textContent = "Break Lines";
    instructions.classList.remove("show");
    document.body.classList.remove("break-lines-mode-active");

    // Enable other mode buttons
    if (dragBtn) {
      dragBtn.disabled = false;
      dragBtn.style.opacity = "1";
      dragBtn.style.cursor = "pointer";
    }
    if (resizeBtn) {
      resizeBtn.disabled = false;
      resizeBtn.style.opacity = "1";
      resizeBtn.style.cursor = "pointer";
    }

    // Remove event listeners
    mapCanvas.removeEventListener("mousedown", handleBreakLinesMouseDown);
    mapCanvas.removeEventListener("mousemove", handleBreakLinesMouseMove);
    mapCanvas.removeEventListener("mouseup", handleBreakLinesMouseUp);
    mapCanvas.removeEventListener("contextmenu", handleBreakLinesRightClick);
    document.removeEventListener("keydown", handleBreakLinesKeyboard);

    mapCanvas.style.cursor = "default";
    setSelectedLineForBreaking(null);
    setActiveBendPoint(null);

    console.log("✅ Break Lines mode DISABLED");
  }
}

/**
 * Handle mouse down - select line or break point
 */
function handleBreakLinesMouseDown(e) {
  if (!isBreakLinesMode) return;

  const rect = mapCanvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  // Check if clicking on existing break point
  if (selectedLineForBreaking) {
    const clickedBendPoint = findBreakPointAtPosition(
      mouseX,
      mouseY,
      selectedLineForBreaking
    );

    if (clickedBendPoint) {
      setActiveBendPoint(clickedBendPoint);
      showNotification(
        "Dragging break point. Right-click or press S to release.",
        "info"
      );
      return;
    }
  }

  // Check if clicking on a line
  const clickedLine = findDraggedLineAtPosition(mouseX, mouseY);

  if (clickedLine) {
    setSelectedLineForBreaking(clickedLine);
    showBreakPointPrompt();
    redrawStaticMapSmooth();
    console.log("✅ Line selected:", clickedLine.type);
  }
}

/**
 * Handle mouse move - drag break point
 */
function handleBreakLinesMouseMove(e) {
  if (!isBreakLinesMode || !activeBendPoint) return;

  const rect = mapCanvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  // Constrain to canvas bounds
  const constrainedX = Math.max(20, Math.min(MAP_WIDTH - 20, mouseX));
  const constrainedY = Math.max(20, Math.min(MAP_HEIGHT - 20, mouseY));

  // Update break point position
  updateBreakPointPosition(
    selectedLineForBreaking.id,
    activeBendPoint.index,
    constrainedX,
    constrainedY
  );

  // Throttle redraws
  if (!window.breakLineAnimationFrame) {
    window.breakLineAnimationFrame = requestAnimationFrame(() => {
      redrawStaticMapSmooth();
      window.breakLineAnimationFrame = null;
    });
  }
}

function handleBreakLinesMouseUp(e) {
  if (!isBreakLinesMode) return;

  const rect = mapCanvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  if (activeBendPoint) {
    setActiveBendPoint(null);
    showNotification("Break point released", "success");

    // ✅ ADD THIS LINE:
    saveBreakPoints(breakPoints);

    return;
  }

  if (selectedLineForBreaking) {
    if (isPointNearLine(mouseX, mouseY, selectedLineForBreaking)) {
      addBreakPoint(selectedLineForBreaking.id, mouseX, mouseY);
      showNotification(
        "Break point added! Click to move, right-click to release.",
        "success"
      );
      redrawStaticMapSmooth();

      // ✅ ADD THIS LINE:
      saveBreakPoints(breakPoints);
    }
  }
}

/**
 * Handle right-click - release break point or deselect line
 */
function handleBreakLinesRightClick(e) {
  e.preventDefault();

  if (!isBreakLinesMode) return;

  if (activeBendPoint) {
    setActiveBendPoint(null);
    showNotification("Break point released", "success");
  } else if (selectedLineForBreaking) {
    setSelectedLineForBreaking(null);
    showNotification("Line deselected", "info");
    redrawStaticMapSmooth();
  }
}

/**
 * Handle keyboard shortcuts
 */
function handleBreakLinesKeyboard(e) {
  if (!isBreakLinesMode) return;

  const rect = mapCanvas.getBoundingClientRect();
  const mousePos = {
    x: window.lastMouseX - rect.left,
    y: window.lastMouseY - rect.top,
  };

  switch (e.key.toLowerCase()) {
    case "a": // Left click (add/drag break point)
      e.preventDefault();
      if (activeBendPoint) {
        // Release bend point
        setActiveBendPoint(null);
        showNotification("Break point released", "success");
      } else if (selectedLineForBreaking) {
        // Check if near a break point
        const bendPoint = findBreakPointAtPosition(
          mousePos.x,
          mousePos.y,
          selectedLineForBreaking
        );
        if (bendPoint) {
          setActiveBendPoint(bendPoint);
          showNotification(
            "Break point selected. Move mouse and press A to release.",
            "info"
          );
        } else if (
          isPointNearLine(mousePos.x, mousePos.y, selectedLineForBreaking)
        ) {
          // Add new break point
          addBreakPoint(selectedLineForBreaking.id, mousePos.x, mousePos.y);
          showNotification("Break point added!", "success");
          redrawStaticMapSmooth();
        }
      }
      break;

    case "s": // Right click (release/deselect)
      e.preventDefault();
      if (activeBendPoint) {
        setActiveBendPoint(null);
        showNotification("Break point released", "success");
      } else if (selectedLineForBreaking) {
        setSelectedLineForBreaking(null);
        showNotification("Line deselected", "info");
        redrawStaticMapSmooth();
      }
      break;

    case "escape":
      e.preventDefault();
      if (selectedLineForBreaking) {
        removeBreakPoint(selectedLineForBreaking.id);
        setSelectedLineForBreaking(null);
        setActiveBendPoint(null);
        showNotification("Line restored to original", "success");
        redrawStaticMapSmooth();

        // ✅ ADD THIS LINE:
        saveBreakPoints(breakPoints);
      }
      break;
  }
}

/**
 * Track mouse position globally
 */
document.addEventListener("mousemove", (e) => {
  window.lastMouseX = e.clientX;
  window.lastMouseY = e.clientY;
});

/**
 * Show prompt to click on line to break
 */
function showBreakPointPrompt() {
  showNotification("Click on any point of the line to break it", "info", 5000);
}

/**
 * Find dragged line at position (only lines that have been dragged)
 */
function findDraggedLineAtPosition(x, y) {
  // Check clusters with dragged lines
  for (let cluster of poiClusters) {
    if (!cluster.isDragged) continue;

    const startX = cluster.meanX;
    const startY = cluster.meanY;
    const endX = cluster.draggedX;
    const endY = cluster.draggedY;

    if (isPointNearLineSegment(x, y, startX, startY, endX, endY)) {
      return {
        type: "cluster",
        id: cluster.id,
        data: cluster,
        startX,
        startY,
        endX,
        endY,
      };
    }
  }

  // Check individual POIs with dragged lines
  for (const [category, pois] of Object.entries(allPOIsDataByCategory)) {
    for (let idx = 0; idx < pois.length; idx++) {
      if (!selectedPOIs[category] || !selectedPOIs[category][idx]) continue;

      const poi = pois[idx];
      if (!poi.isDragged) continue;

      // Skip if in cluster
      const isInCluster = poiClusters.some((cluster) =>
        cluster.pois.some((p) => p.poi === poi)
      );
      if (isInCluster) continue;

      const startX = poi.originalPixelX || poi.pixelX;
      const startY = poi.originalPixelY || poi.pixelY;
      const endX = poi.draggedX;
      const endY = poi.draggedY;

      if (isPointNearLineSegment(x, y, startX, startY, endX, endY)) {
        return {
          type: "poi",
          id: `${category}-${poi.id}`,
          data: poi,
          startX,
          startY,
          endX,
          endY,
        };
      }
    }
  }

  // Check highways with dragged lines
  for (let idx = 0; idx < highwayData.length; idx++) {
    if (!selectedHighways[idx]) continue;

    const hw = highwayData[idx];
    if (!hw.isDragged) continue;

    const startX = hw.originalPixelX || hw.pixelX;
    const startY = hw.originalPixelY || hw.pixelY;
    const endX = hw.draggedX;
    const endY = hw.draggedY;

    if (isPointNearLineSegment(x, y, startX, startY, endX, endY)) {
      return {
        type: "highway",
        id: `highway-${idx}`,
        data: hw,
        startX,
        startY,
        endX,
        endY,
      };
    }
  }

  // Check site marker with dragged line
  if (window.siteMarkerPosition && window.siteMarkerPosition.isDragged) {
    const startX = window.siteMarkerPosition.originalX;
    const startY = window.siteMarkerPosition.originalY;
    const endX = window.siteMarkerPosition.x;
    const endY = window.siteMarkerPosition.y;

    if (isPointNearLineSegment(x, y, startX, startY, endX, endY)) {
      return {
        type: "siteMarker",
        id: "siteMarker",
        data: window.siteMarkerPosition,
        startX,
        startY,
        endX,
        endY,
      };
    }
  }

  return null;
}

/**
 * Find break point at position
 */
function findBreakPointAtPosition(x, y, line) {
  const lineBreakPoints = breakPoints[line.id] || [];

  for (let i = 0; i < lineBreakPoints.length; i++) {
    const bp = lineBreakPoints[i];
    const dist = Math.sqrt(Math.pow(x - bp.x, 2) + Math.pow(y - bp.y, 2));

    if (dist < BREAK_POINT_RADIUS + 5) {
      return { index: i, ...bp };
    }
  }

  return null;
}

/**
 * Check if point is near line segment
 */
function isPointNearLineSegment(px, py, x1, y1, x2, y2) {
  const dist = distanceToLineSegment(px, py, x1, y1, x2, y2);
  return dist < LINE_CLICK_TOLERANCE;
}

/**
 * Check if point is near line (considering break points)
 */
function isPointNearLine(px, py, line) {
  const lineBreakPoints = breakPoints[line.id] || [];

  if (lineBreakPoints.length === 0) {
    return isPointNearLineSegment(
      px,
      py,
      line.startX,
      line.startY,
      line.endX,
      line.endY
    );
  }

  // Check all segments
  const points = [
    { x: line.startX, y: line.startY },
    ...lineBreakPoints,
    { x: line.endX, y: line.endY },
  ];

  for (let i = 0; i < points.length - 1; i++) {
    if (
      isPointNearLineSegment(
        px,
        py,
        points[i].x,
        points[i].y,
        points[i + 1].x,
        points[i + 1].y
      )
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Calculate distance from point to line segment
 */
function distanceToLineSegment(px, py, x1, y1, x2, y2) {
  const A = px - x1;
  const B = py - y1;
  const C = x2 - x1;
  const D = y2 - y1;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;

  if (lenSq !== 0) param = dot / lenSq;

  let xx, yy;

  if (param < 0) {
    xx = x1;
    yy = y1;
  } else if (param > 1) {
    xx = x2;
    yy = y2;
  } else {
    xx = x1 + param * C;
    yy = y1 + param * D;
  }

  const dx = px - xx;
  const dy = py - yy;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Setup global break lines functions
 */
export function setupGlobalBreakLinesFunctions() {
  window.toggleBreakLinesMode = toggleBreakLinesMode;
}

/**
 * Draw break line with bend points
 */
export function drawBreakLine(ctx, line) {
  const lineBreakPoints = breakPoints[line.id] || [];

  if (lineBreakPoints.length === 0) {
    // Draw normal line
    ctx.strokeStyle = line.type === "siteMarker" ? "#48ff00ff" : "#8B0000";
    ctx.lineWidth = 3;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(line.startX, line.startY);
    ctx.lineTo(line.endX, line.endY);
    ctx.stroke();
    return;
  }

  // Draw line with break points
  const points = [
    { x: line.startX, y: line.startY },
    ...lineBreakPoints,
    { x: line.endX, y: line.endY },
  ];

  // ✅ Draw the actual broken line (ALWAYS shown)
  ctx.strokeStyle = line.type === "siteMarker" ? "#48ff00ff" : "#8B0000";
  ctx.lineWidth = 3;
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);

  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.stroke();

  // ✅ ONLY draw break point circles if this line is currently selected
  if (selectedLineForBreaking && selectedLineForBreaking.id === line.id) {
    ctx.fillStyle = "#FFA500";
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;

    lineBreakPoints.forEach((bp, index) => {
      ctx.beginPath();
      ctx.arc(bp.x, bp.y, BREAK_POINT_RADIUS, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();

      // Highlight active bend point
      if (activeBendPoint && activeBendPoint.index === index) {
        ctx.strokeStyle = "#FF0000";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(bp.x, bp.y, BREAK_POINT_RADIUS + 3, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.strokeStyle = "white";
        ctx.lineWidth = 2;
      }
    });
  }
}

/**
 * Highlight selected line
 */
export function highlightSelectedLine(ctx, line) {
  if (!selectedLineForBreaking || selectedLineForBreaking.id !== line.id)
    return;

  const lineBreakPoints = breakPoints[line.id] || [];
  const points = [
    { x: line.startX, y: line.startY },
    ...lineBreakPoints,
    { x: line.endX, y: line.endY },
  ];

  // Draw thick highlight
  ctx.strokeStyle = "#FFD700";
  ctx.lineWidth = 6;
  ctx.globalAlpha = 0.5;
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);

  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.stroke();
  ctx.globalAlpha = 1.0;
}
