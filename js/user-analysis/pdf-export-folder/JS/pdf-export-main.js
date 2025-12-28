// ==================== PDF EXPORT MAIN CONTROLLER ====================
// js/user-analysis/pdf-export-folder/JS/pdf-export-main.js

import { showFooterForm } from './footer-form-controller.js';
import { getCensusDataByRadius, getSampleCensusData } from './census-data-fetcher.js';
import { generatePDF } from './pdf-generator.js';

/**
 * Main PDF export function - called from UI
 * @param {HTMLCanvasElement} mapCanvas - Canvas element with map
 * @param {Object} selectedSiteLocation - Site location data
 */
export async function exportPDFEnhanced(mapCanvas, selectedSiteLocation) {
    try {
        // Get export button and update its state
        const exportBtn = document.querySelector('button[onclick="exportPDF()"]');
        if (exportBtn) {
            exportBtn.disabled = true;
            exportBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Fetching Census Data...';
        }
        
        // Fetch census data
        const lat = selectedSiteLocation.lat;
        const lng = selectedSiteLocation.lng;
        let censusResults;
        
        try {
            console.log('Fetching census data from API...');
            censusResults = await getCensusDataByRadius(lat, lng);
            console.log('✅ Census data fetched successfully');
        } catch (censusError) {
            console.error('Census API Error:', censusError);
            alert('Could not fetch census data: ' + censusError.message + '. Using sample data.');
            censusResults = getSampleCensusData();
        }
        
        // Update button state
        if (exportBtn) {
            exportBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Preparing PDF Export...';
        }
        
        // Show footer form and wait for user input
        try {
            const formData = await showFooterForm();
            console.log('Form data received:', formData);
            
            // Update button state
            if (exportBtn) {
                exportBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating PDF...';
            }
            
            // Generate PDF
            await generatePDF(censusResults, formData, mapCanvas, selectedSiteLocation);
            
            console.log('✅ PDF export complete');
            
        } catch (formError) {
            console.log('Form cancelled or error:', formError);
            // User cancelled - this is not an error
        }
        
        // Reset button state
        if (exportBtn) {
            exportBtn.disabled = false;
            exportBtn.innerHTML = '<i class="fas fa-file-pdf"></i> Export PDF';
        }
        
    } catch (error) {
        console.error('PDF export error:', error);
        alert('Error generating PDF: ' + (error.message || 'Unknown error'));
        
        // Reset button state
        const exportBtn = document.querySelector('button[onclick="exportPDF()"]');
        if (exportBtn) {
            exportBtn.disabled = false;
            exportBtn.innerHTML = '<i class="fas fa-file-pdf"></i> Export PDF';
        }
    }
}

/**
 * Setup global export function
 */
export function setupGlobalExportFunction(mapCanvas, selectedSiteLocation) {
    window.exportPDF = () => exportPDFEnhanced(mapCanvas, selectedSiteLocation);
}