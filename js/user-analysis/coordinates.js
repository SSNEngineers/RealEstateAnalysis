// ==================== COORDINATE PROJECTION AND CALCULATIONS ====================

import { 
    rectangleBounds, 
    selectedSiteLocation,
    MAP_WIDTH, 
    MAP_HEIGHT,
    allPOIsDataByCategory,
    highwayData
} from './state.js';

/**
 * Calculate rectangle bounds from center point and radius
 */
export function calculateRectangleBounds(lat, lng, radiusMiles) {
    const radiusKm = radiusMiles * 1.60934;

    // Calculate degrees of latitude (constant at ~111.32 km per degree)
    const latDiff = radiusKm / 111.32;

    // Calculate degrees of longitude (varies with latitude)
    const lngDiff = radiusKm / (111.32 * Math.cos(lat * Math.PI / 180));

    // For Web Mercator, we need to account for the projection distortion
    // Add 10% padding to ensure the circle fits when projected
    const paddingFactor = 1.10;

    return {
        north: lat + (latDiff * paddingFactor),
        south: lat - (latDiff * paddingFactor),
        east: lng + (lngDiff * paddingFactor),
        west: lng - (lngDiff * paddingFactor),
        topLeft: {
            lat: lat + (latDiff * paddingFactor),
            lng: lng - (lngDiff * paddingFactor)
        },
        topRight: {
            lat: lat + (latDiff * paddingFactor),
            lng: lng + (lngDiff * paddingFactor)
        },
        bottomLeft: {
            lat: lat - (latDiff * paddingFactor),
            lng: lng - (lngDiff * paddingFactor)
        },
        bottomRight: {
            lat: lat - (latDiff * paddingFactor),
            lng: lng + (lngDiff * paddingFactor)
        }
    };
}

/**
 * Convert lat/lng to pixel coordinates using Web Mercator projection
 */
export function latLngToPixel(lat, lng) {
    // Web Mercator projection (same as Leaflet/OpenStreetMap)
    const EARTH_RADIUS = 6378137; // meters
    const MAX_LATITUDE = 85.0511287798;

    // Clamp latitude to valid Mercator range
    const clampedLat = Math.max(Math.min(MAX_LATITUDE, lat), -MAX_LATITUDE);

    // Convert to radians
    const latRad = clampedLat * Math.PI / 180;
    const lngRad = lng * Math.PI / 180;

    // Web Mercator projection formulas
    const mercatorX = lngRad;
    const mercatorY = Math.log(Math.tan(Math.PI / 4 + latRad / 2));

    // Calculate bounds in Mercator coordinates
    const boundsWestRad = rectangleBounds.west * Math.PI / 180;
    const boundsEastRad = rectangleBounds.east * Math.PI / 180;
    const boundsNorthRad = Math.max(Math.min(MAX_LATITUDE, rectangleBounds.north), -MAX_LATITUDE) * Math.PI / 180;
    const boundsSouthRad = Math.max(Math.min(MAX_LATITUDE, rectangleBounds.south), -MAX_LATITUDE) * Math.PI / 180;

    const boundsNorthMerc = Math.log(Math.tan(Math.PI / 4 + boundsNorthRad / 2));
    const boundsSouthMerc = Math.log(Math.tan(Math.PI / 4 + boundsSouthRad / 2));

    // Convert to pixel coordinates
    const x = ((mercatorX - boundsWestRad) / (boundsEastRad - boundsWestRad)) * MAP_WIDTH;
    const y = ((boundsNorthMerc - mercatorY) / (boundsNorthMerc - boundsSouthMerc)) * MAP_HEIGHT;

    return { x, y };
}

/**
 * Calculate all pixel coordinates for POIs and highways
 */
export function calculateAllPixelCoordinates() {
    console.log('Converting coordinates to pixels...');

    // Convert POIs
    for (const [category, pois] of Object.entries(allPOIsDataByCategory)) {
        pois.forEach(poi => {
            const coords = latLngToPixel(poi.lat, poi.lng);
            poi.pixelX = coords.x;
            poi.pixelY = coords.y;
        });
    }

    // Convert highways
    highwayData.forEach(hw => {
        const coords = latLngToPixel(hw.center.lat, hw.center.lng);
        hw.pixelX = coords.x;
        hw.pixelY = coords.y;

        // Convert path points
        hw.pixelPath = hw.path.map(([lat, lng]) => {
            const p = latLngToPixel(lat, lng);
            return [p.x, p.y];
        });
    });

    console.log('✓ Coordinate conversion complete');
}

/**
 * Validate and fix coordinates to ensure they're within bounds
 */
export function validateAndFixCoordinates() {
    console.log('Validating coordinates...');

    // Validate POIs
    for (const [category, pois] of Object.entries(allPOIsDataByCategory)) {
        pois.forEach(poi => {
            // Ensure coordinates are within bounds
            if (poi.lat < rectangleBounds.south || poi.lat > rectangleBounds.north ||
                poi.lng < rectangleBounds.west || poi.lng > rectangleBounds.east) {
                console.warn(`POI ${poi.name} is outside bounds, adjusting...`);
                poi.lat = Math.max(rectangleBounds.south, Math.min(rectangleBounds.north, poi.lat));
                poi.lng = Math.max(rectangleBounds.west, Math.min(rectangleBounds.east, poi.lng));
            }

            // Recalculate pixel coordinates
            const coords = latLngToPixel(poi.lat, poi.lng);
            poi.pixelX = coords.x;
            poi.pixelY = coords.y;
        });
    }

    // Validate highways
    highwayData.forEach(hw => {
        // Filter path points to only include those within bounds
        hw.path = hw.path.filter(([lat, lng]) => {
            return lat >= rectangleBounds.south && lat <= rectangleBounds.north &&
                lng >= rectangleBounds.west && lng <= rectangleBounds.east;
        });

        // Recalculate center if needed
        if (hw.path.length > 0) {
            hw.center.lat = hw.path.reduce((sum, p) => sum + p[0], 0) / hw.path.length;
            hw.center.lng = hw.path.reduce((sum, p) => sum + p[1], 0) / hw.path.length;

            const coords = latLngToPixel(hw.center.lat, hw.center.lng);
            hw.pixelX = coords.x;
            hw.pixelY = coords.y;

            hw.pixelPath = hw.path.map(([lat, lng]) => {
                const p = latLngToPixel(lat, lng);
                return [p.x, p.y];
            });
        }
    });

    console.log('✓ Coordinates validated');
}

/**
 * Recalculate projection after resize or changes
 */
export function recalculateProjection() {
    calculateAllPixelCoordinates();
}

/**
 * Calculate pixel coordinates with validation
 */
export function calculateAllPixelCoordinatesWithValidation() {
    calculateAllPixelCoordinates();
    validateAndFixCoordinates();
}
/**
 * Diagnostic check for map alignment
 */
export function diagnosticMapAlignment() {
    console.log('\n========== MAP ALIGNMENT CHECK ==========');
    
    // Calculate rectangle center
    const rectCenterLat = (rectangleBounds.north + rectangleBounds.south) / 2;
    const rectCenterLng = (rectangleBounds.east + rectangleBounds.west) / 2;
    
    console.log('Rectangle Center (lat/lng):', rectCenterLat, rectCenterLng);
    console.log('Site Location (lat/lng):', selectedSiteLocation.lat, selectedSiteLocation.lng);
    
    // Project both to pixels
    const rectCenterPixel = latLngToPixel(rectCenterLat, rectCenterLng);
    const sitePixel = latLngToPixel(selectedSiteLocation.lat, selectedSiteLocation.lng);
    
    console.log('Rectangle Center (pixels):', rectCenterPixel);
    console.log('Site Location (pixels):', sitePixel);
    console.log('Canvas Center:', MAP_WIDTH / 2, MAP_HEIGHT / 2);
    
    // Check if rectangle center is near canvas center
    const centerOffsetX = Math.abs(rectCenterPixel.x - MAP_WIDTH / 2);
    const centerOffsetY = Math.abs(rectCenterPixel.y - MAP_HEIGHT / 2);
    
    console.log('Offset from canvas center (pixels):', centerOffsetX.toFixed(1), centerOffsetY.toFixed(1));
    
    if (centerOffsetX > 50 || centerOffsetY > 50) {
        console.error('⚠️ WARNING: Rectangle center is NOT near canvas center!');
        console.error('This means map tiles are misaligned with coordinate projection!');
    } else {
        console.log('✓ Rectangle center is correctly aligned with canvas');
    }
    
    console.log('======================================\n');
}