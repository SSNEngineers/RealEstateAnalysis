// ==================== USER ANALYSIS - MAIN ENTRY POINT ====================
// This file imports and orchestrates all modular components

// Import constants and configuration
import { LOGODEV_API_KEY, osmTags, categoryIcons, FAMOUS_LOCATIONS, GRID_ROWS, GRID_COLS } from './user-analysis/constants.js';

// Import state management
import * as State from './user-analysis/state.js';

// Import utilities
import * as Utilities from './user-analysis/utilities.js';

// Import coordinate functions
import * as Coordinates from './user-analysis/coordinates.js';

// Import API fetching
import * as ApiFetching from './user-analysis/api-fetching.js';

// Import highway fetching
import * as HighwayFetching from './user-analysis/highway-fetching.js';

// Import clustering
import * as Clustering from './user-analysis/clustering.js';

// Import canvas setup
import * as CanvasSetup from './user-analysis/canvas-setup.js';

// Import map tiles
import * as MapTiles from './user-analysis/map-tiles.js';

// Import rendering
import * as Rendering from './user-analysis/rendering.js';

// Import cluster rendering
import * as ClusterRendering from './user-analysis/cluster-rendering.js';

// Import drag functionality
import * as DragFunctionality from './user-analysis/drag-functionality.js';

// ==================== ADD RESIZE IMPORT HERE ====================
// Import resize functionality
import * as ResizeFunctionality from './user-analysis/resize-functionality.js';
// ==================== END RESIZE IMPORT ====================

// Import break lines functionality
import * as BreakLines from './user-analysis/break-lines.js';


// Import UI updates
import * as UiUpdates from './user-analysis/ui-updates.js';

// Import PDF export
import * as PdfExport from './user-analysis/pdf-export.js';

// Import main rendering
import * as MainRender from './user-analysis/main-render.js';

// Import initialization
import * as Initialization from './user-analysis/initialization.js';

// Import diagnostics
import * as Diagnostics from './user-analysis/diagnostics.js';

// Import popups
import * as Popups from './user-analysis/popups.js';

import * as SearchPOI from './user-analysis/search-poi.js';

// Import timer
import * as AnalysisTimer from './user-analysis/analysis-timer.js';

// Import disclaimer
import * as InfoDisclaimer from './user-analysis/info-disclaimer.js';
// Import how to use
import * as HowToUse from './user-analysis/how-to-use.js';

// Import rotate functionality
import * as RotateFunctionality from './user-analysis/rotate-highway.js';

// Import reshape functionality
import * as ReshapeFunctionality from './user-analysis/reshape-cluster.js';
// ==================== INITIALIZATION ====================

console.log('✓ user-analysis.js loaded successfully');
console.log('✓ All modules imported');

// Setup global functions
UiUpdates.setupGlobalToggleFunctions();
PdfExport.setupGlobalExportFunction();
Diagnostics.setupGlobalDiagnostics();
Diagnostics.setupGlobalPerformanceMonitor();
Popups.setupGlobalPopupFunctions();  // ✅ ADD THIS LINE
SearchPOI.setupGlobalSearchFunctions();
AnalysisTimer.setupGlobalTimerFunctions();
InfoDisclaimer.setupGlobalDisclaimerFunctions();
HowToUse.setupGlobalHowToUseFunctions();


// Make drag toggle globally available
window.toggleDragMode = DragFunctionality.toggleDragMode;

// ==================== ADD RESIZE SETUP HERE ====================
// Make resize toggle globally available
window.toggleResizeMode = ResizeFunctionality.toggleResizeMode;
ResizeFunctionality.setupGlobalResizeFunctions();
// ==================== END RESIZE SETUP ====================

// Make rotate toggle globally available
window.toggleRotateMode = RotateFunctionality.toggleRotateMode;
RotateFunctionality.setupGlobalRotateFunctions();

// Make reshape toggle globally available
window.toggleReshapeMode = ReshapeFunctionality.toggleReshapeMode;
ReshapeFunctionality.setupGlobalReshapeFunctions();

// Make break lines toggle globally available
window.toggleBreakLinesMode = BreakLines.toggleBreakLinesMode;
BreakLines.setupGlobalBreakLinesFunctions();


// Setup handlers
Initialization.setupResizeHandler();
Initialization.setupErrorHandlers();
Initialization.setupCleanupHandlers();

// Initialize on window load
window.addEventListener('load', async function() {
    console.log('Window loaded, starting initialization...');
    
    // Setup canvas click listener
    const canvas = document.getElementById('mapCanvas');
    if (canvas) {
        canvas.addEventListener('click', DragFunctionality.handleCanvasClick);
    }
    
    // Start analysis
    await Initialization.initializeAnalysis();
});

// ==================== EXPORTED API ====================
// Export main functions for external use if needed
export {
    // State
    State,
    // Utilities
    Utilities,
    // Coordinates
    Coordinates,
    // API
    ApiFetching,
    HighwayFetching,
    // Clustering
    Clustering,
    // Canvas
    CanvasSetup,
    MapTiles,
    // Rendering
    Rendering,
    ClusterRendering,
    // Interactions
    DragFunctionality,
    ResizeFunctionality, 
     RotateFunctionality,  // ⭐ ADD THIS LINE
    ReshapeFunctionality, // ⭐ ADD THIS LINE // ⭐ ADD THIS LINE

     BreakLines,

    // UI
    UiUpdates,
    PdfExport,
    // Main
    MainRender,
    Initialization,
    // Debug
    Diagnostics,
    Popups
};
console.log('✓ All systems ready');