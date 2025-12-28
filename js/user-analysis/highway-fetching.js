// ==================== HIGHWAY DATA FETCHING AND PROCESSING ====================

import { selectedSiteLocation, analysisParams, setHighwayData, setSelectedHighways } from './state.js';
import { calculateDistance } from './utilities.js';
import { fetchWithRetry } from './api-fetching.js';

/**
 * Fetch highways from Overpass API
 */
export async function fetchHighways() {
    const radiusMeters = analysisParams.radius * 1609.34;
    const query = `[out:json][timeout:15];(
        way["highway"~"tertiary|secondary|primary|trunk|motorway"](around:${radiusMeters},${selectedSiteLocation.lat},${selectedSiteLocation.lng});
    );out body;>;out skel qt;`;

    try {
        console.log('Fetching highways (attempt 1/3)...');

        const data = await fetchWithRetry('https://overpass-api.de/api/interpreter', {
            method: 'POST',
            body: query,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        console.log(`✓ Highways: received ${data.elements ? data.elements.length : 0} results`);

        const processedHighways = processHighwayData(data.elements || []);
        setHighwayData(processedHighways);

        // Initialize all highways as selected
        setSelectedHighways(processedHighways.map(() => true));

        console.log(`✓ Processed ${processedHighways.length} highways`);
    } catch (error) {
        console.error('✗ Failed to fetch highways after retries:', error.message);
        setHighwayData([]);
        setSelectedHighways([]);
    }
}

/**
 * Process highway data from Overpass API
 */
export function processHighwayData(elements) {
    const nodes = {};
    elements.forEach(el => {
        if (el.type === 'node') {
            nodes[el.id] = { lat: el.lat, lng: el.lon };
        }
    });

    const highways = elements.filter(el => el.type === 'way' && el.tags && el.tags.highway);
    let processed = highways.map(way => {
        const path = way.nodes.map(nodeId => {
            const node = nodes[nodeId];
            return node ? [node.lat, node.lng] : null;
        }).filter(Boolean);

        if (path.length === 0) return null;

        const center = {
            lat: path.reduce((sum, p) => sum + p[0], 0) / path.length,
            lng: path.reduce((sum, p) => sum + p[1], 0) / path.length
        };
        const distanceMiles = calculateDistance(
            selectedSiteLocation.lat, 
            selectedSiteLocation.lng, 
            center.lat, 
            center.lng
        ) / 1.60934;

        return {
            id: way.id,
            type: way.tags.highway,
            name: way.tags.name || 'Unnamed Road',
            ref: way.tags.ref,
            path,
            center,
            distanceMiles,
            pixelX: 0,
            pixelY: 0,
            pixelPath: []
        };
    }).filter(h => h && h.path.length > 1).sort((a, b) => a.distanceMiles - b.distanceMiles);

    const result = [];
    const targetTypes = ['motorway', 'trunk', 'primary', 'tertiary'];

    for (const targetType of targetTypes) {
        const found = processed.find(hw => hw.type === targetType);
        if (found) {
            result.push(found);
        }
    }

    return result.slice(0, 4);
}