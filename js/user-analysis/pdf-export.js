// ==================== PDF EXPORT - MAIN ENTRY POINT ====================
// js/user-analysis/pdf-export.js

import { exportPDFEnhanced } from './pdf-export-folder/JS/pdf-export-main.js';
import { mapCanvas, selectedSiteLocation } from './state.js';

/**
 * Setup global export function
 * This is called from user-analysis.js during initialization
 */
export function setupGlobalExportFunction() {
    window.exportPDF = async () => {
        await exportPDFEnhanced(mapCanvas, selectedSiteLocation);
    };
    
    console.log('✅ PDF export function registered globally');
}