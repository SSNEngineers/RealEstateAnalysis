// ==================== GLOBAL STATE MANAGEMENT ====================

// Analysis parameters
export let analysisParams = null;
export let selectedSiteLocation = null;
export let rectangleBounds = null;

// Data storage
export let allPOIsDataByCategory = {};
export let highwayData = [];

// Canvas references
export let mapCanvas = null;
export let ctx = null;

// Map projection
export let MAP_WIDTH = 0;
export let MAP_HEIGHT = 0;

// Selection tracking
export let selectedPOIs = {};
export let selectedHighways = [];

// Clustering
export let poiClusters = [];

// ⭐ NEW: Preserve original cluster assignments
export let originalClusterAssignments = null; // Stores permanent cluster data
export let clusteringComplete = false; // Flag to prevent re-clustering

// Drag mode state
export let isDragMode = false;
export let draggedItem = null;
export let dragStartX = 0;
export let dragStartY = 0;
export let dragOffsetX = 0;
export let dragOffsetY = 0;

// Permanent dragged positions storage
export let permanentDraggedPositions = {
  pois: {},
  clusters: {},
  highways: {},
  siteMarker: null,
};

// Resize mode state
export let isResizeMode = false;
export let resizedItem = null;

// Permanent resized sizes storage
export let permanentResizedSizes = {
  pois: {},
  clusters: {},
  highways: {},
  siteMarker: null,
};

// Break Lines mode state
export let isBreakLinesMode = false;
export let selectedLineForBreaking = null;
export let breakPoints = {}; // { lineId: [{x, y}, {x, y}] }
export let activeBendPoint = null;

// Rotate Highway mode state
export let isRotateMode = false;
export let rotatedHighway = null;
export let permanentRotations = {}; // { highwayIndex: rotationAngle }

// Reshape Cluster mode state
export let isReshapeMode = false;
export let reshapedCluster = null;
export let permanentReshapes = {}; // { clusterId: { width: number, height: number } }

// Setters
export function setRotateMode(mode) {
  isRotateMode = mode;
}

export function setRotatedHighway(highway) {
  rotatedHighway = highway;
}

export function updatePermanentRotation(highwayIndex, angle) {
  permanentRotations[highwayIndex] = angle;
}

export function setReshapeMode(mode) {
  isReshapeMode = mode;
}

export function setReshapedCluster(cluster) {
  reshapedCluster = cluster;
}

export function updatePermanentReshape(clusterId, dimensions) {
  permanentReshapes[clusterId] = dimensions;
}

// Original positions for reset
export let originalPositions = {
  clusters: [],
  pois: {},
  highways: [],
  siteMarker: null,
};

// Setters for state updates
export function setAnalysisParams(params) {
  analysisParams = params;
}

export function setSelectedSiteLocation(location) {
  selectedSiteLocation = location;
}

export function setRectangleBounds(bounds) {
  rectangleBounds = bounds;
}

export function setAllPOIsDataByCategory(data) {
  allPOIsDataByCategory = data;
}

export function setHighwayData(data) {
  highwayData = data;
}

export function setMapCanvas(canvas) {
  mapCanvas = canvas;
}

export function setMapContext(context) {
  ctx = context;
}

export function setMapDimensions(width, height) {
  MAP_WIDTH = width;
  MAP_HEIGHT = height;
}

export function setSelectedPOIs(pois) {
  selectedPOIs = pois;
}

export function setSelectedHighways(highways) {
  selectedHighways = highways;
}

export function setPOIClusters(clusters) {
  poiClusters = clusters;
}

// ⭐ NEW: Setters for cluster preservation
export function setOriginalClusterAssignments(assignments) {
  originalClusterAssignments = assignments;
}

export function setClusteringComplete(complete) {
  clusteringComplete = complete;
}

export function setDragMode(mode) {
  isDragMode = mode;
}

export function setDraggedItem(item) {
  draggedItem = item;
}

export function setDragCoordinates(startX, startY, offsetX, offsetY) {
  dragStartX = startX;
  dragStartY = startY;
  dragOffsetX = offsetX;
  dragOffsetY = offsetY;
}

export function setResizeMode(mode) {
  isResizeMode = mode;
}

export function setResizedItem(item) {
  resizedItem = item;
}

export function updatePermanentResizedSizes(type, key, size) {
  if (type === "poi") {
    permanentResizedSizes.pois[key] = size;
  } else if (type === "cluster") {
    permanentResizedSizes.clusters[key] = size;
  } else if (type === "highway") {
    permanentResizedSizes.highways[key] = size;
  } else if (type === "siteMarker") {
    permanentResizedSizes.siteMarker = size;
  }
}

export function clearPermanentResizedSize(type, key) {
  if (type === "poi") {
    delete permanentResizedSizes.pois[key];
  } else if (type === "cluster") {
    delete permanentResizedSizes.clusters[key];
  } else if (type === "highway") {
    delete permanentResizedSizes.highways[key];
  } else if (type === "siteMarker") {
    permanentResizedSizes.siteMarker = null;
  }
}

export function updatePermanentDraggedPositions(type, key, position) {
  if (type === "poi") {
    permanentDraggedPositions.pois[key] = position;
  } else if (type === "cluster") {
    permanentDraggedPositions.clusters[key] = position;
  } else if (type === "highway") {
    permanentDraggedPositions.highways[key] = position;
  } else if (type === "siteMarker") {
    permanentDraggedPositions.siteMarker = position;
  }
}

export function clearPermanentDraggedPosition(type, key) {
  if (type === "poi") {
    delete permanentDraggedPositions.pois[key];
  } else if (type === "cluster") {
    delete permanentDraggedPositions.clusters[key];
  } else if (type === "highway") {
    delete permanentDraggedPositions.highways[key];
  } else if (type === "siteMarker") {
    permanentDraggedPositions.siteMarker = null;
  }
}

export function setBreakLinesMode(mode) {
  isBreakLinesMode = mode;
}

export function setSelectedLineForBreaking(line) {
  selectedLineForBreaking = line;
}

export function addBreakPoint(lineId, x, y) {
  if (!breakPoints[lineId]) {
    breakPoints[lineId] = [];
  }
  breakPoints[lineId].push({ x, y });
}

export function removeBreakPoint(lineId) {
  delete breakPoints[lineId];
}

export function setActiveBendPoint(bendPoint) {
  activeBendPoint = bendPoint;
}

export function updateBreakPointPosition(lineId, index, x, y) {
  if (breakPoints[lineId] && breakPoints[lineId][index]) {
    breakPoints[lineId][index].x = x;
    breakPoints[lineId][index].y = y;
  }
}
