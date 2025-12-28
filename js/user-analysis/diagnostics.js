// ==================== DIAGNOSTIC AND DEBUG FUNCTIONS ====================

import { 
    mapCanvas, 
    ctx, 
    MAP_WIDTH, 
    MAP_HEIGHT,
    selectedSiteLocation,
    rectangleBounds,
    allPOIsDataByCategory,
    highwayData,
    poiClusters,
    analysisParams
} from './state.js';

/**
 * Run diagnostic check
 */
export function diagnosticCheck() {
    console.log('\n========== DIAGNOSTIC CHECK ==========');
    console.log('Canvas:', mapCanvas ? 'OK' : 'MISSING');
    console.log('Context:', ctx ? 'OK' : 'MISSING');
    console.log('Map Size:', `${MAP_WIDTH}x${MAP_HEIGHT}`);
    console.log('Site Location:', selectedSiteLocation);
    console.log('Rectangle Bounds:', rectangleBounds);
    console.log('\nPOIs by Category:');
    Object.entries(allPOIsDataByCategory).forEach(([cat, pois]) => {
        console.log(`  ${cat}: ${pois.length} items`);
        if (pois.length > 0) {
            const first = pois[0];
            console.log(`    Sample:`, {
                name: first.name,
                coords: [first.lat, first.lng],
                pixels: [first.pixelX, first.pixelY]
            });
        }
    });
    console.log('\nHighways:', highwayData.length);
    if (highwayData.length > 0) {
        const first = highwayData[0];
        console.log(`  Sample:`, {
            name: first.name,
            pathPoints: first.pixelPath ? first.pixelPath.length : 0,
            center: [first.pixelX, first.pixelY]
        });
    }
    console.log('\nClusters:', poiClusters.length);
    console.log('======================================\n');
}

/**
 * Log complete analysis state
 */
export function logAnalysisState() {
    console.log('=== ANALYSIS STATE ===');
    console.log('Analysis Params:', analysisParams);
    console.log('Site Location:', selectedSiteLocation);
    console.log('Rectangle Bounds:', rectangleBounds);
    console.log('POIs by Category:', Object.keys(allPOIsDataByCategory).map(cat => `${cat}: ${allPOIsDataByCategory[cat].length}`));
    console.log('Highways:', highwayData.length);
    console.log('Clusters:', poiClusters.length);
    console.log('Map Size:', `${MAP_WIDTH}x${MAP_HEIGHT}`);
    console.log('====================');
}

/**
 * Export diagnostics to console
 */
export function exportDiagnostics() {
    const diagnostics = {
        timestamp: new Date().toISOString(),
        canvas: {
            exists: !!mapCanvas,
            context: !!ctx,
            width: MAP_WIDTH,
            height: MAP_HEIGHT
        },
        location: selectedSiteLocation,
        bounds: rectangleBounds,
        pois: Object.keys(allPOIsDataByCategory).reduce((acc, cat) => {
            acc[cat] = {
                count: allPOIsDataByCategory[cat].length,
                sample: allPOIsDataByCategory[cat][0] || null
            };
            return acc;
        }, {}),
        highways: {
            count: highwayData.length,
            sample: highwayData[0] || null
        },
        clusters: {
            count: poiClusters.length
        },
        analysisParams: analysisParams
    };

    console.log('=== DIAGNOSTIC EXPORT ===');
    console.log(JSON.stringify(diagnostics, null, 2));
    console.log('========================');

    return diagnostics;
}

/**
 * Setup global diagnostic functions
 */
export function setupGlobalDiagnostics() {
    window.runDiagnostic = diagnosticCheck;
    window.logState = logAnalysisState;
    window.exportDiagnostics = exportDiagnostics;
}

/**
 * Performance monitoring
 */
export class PerformanceMonitor {
    constructor() {
        this.metrics = {};
    }

    start(label) {
        this.metrics[label] = {
            start: performance.now()
        };
    }

    end(label) {
        if (this.metrics[label]) {
            this.metrics[label].end = performance.now();
            this.metrics[label].duration = this.metrics[label].end - this.metrics[label].start;
            console.log(`⏱️ ${label}: ${this.metrics[label].duration.toFixed(2)}ms`);
        }
    }

    getMetrics() {
        return this.metrics;
    }

    reset() {
        this.metrics = {};
    }
}

// Create global performance monitor
export const perfMonitor = new PerformanceMonitor();

/**
 * Setup global performance monitor
 */
export function setupGlobalPerformanceMonitor() {
    window.perfMonitor = perfMonitor;
}