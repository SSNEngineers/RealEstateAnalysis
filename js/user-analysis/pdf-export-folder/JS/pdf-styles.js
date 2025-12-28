// ==================== PDF STYLING FUNCTIONS ====================
// js/user-analysis/pdf-export-folder/JS/pdf-styles.js

/**
 * Add enhanced header to PDF page
 * @param {jsPDF} doc - jsPDF document instance
 * @param {number} pageWidth - Page width
 * @param {string} title - Header title
 * @param {string} subtitle - Optional subtitle
 */
export function addEnhancedHeader(doc, pageWidth, title, subtitle = null) {
    const margin = 10;
    
    // Simple solid background
    doc.setFillColor(139, 0, 0);
    doc.rect(0, 0, pageWidth, 18, 'F');
    
    // Main title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.text(title, pageWidth / 2, 12, { align: 'center' });
    
    // Reset text color
    doc.setTextColor(0, 0, 0);
}

/**
 * Add enhanced footer to PDF page
 * @param {jsPDF} doc - jsPDF document instance
 * @param {number} pageWidth - Page width
 * @param {number} pageHeight - Page height
 * @param {Object} agent1 - Agent 1 data
 * @param {Object} agent2 - Agent 2 data
 * @param {Object} location - Location data
 */
export function addEnhancedFooter(doc, pageWidth, pageHeight, agent1, agent2, location) {
    const margin = 10;
    const footerStartY = pageHeight - 22;
    
    // Simple top line separator
    doc.setDrawColor(100, 100, 100);
    doc.setLineWidth(0.3);
    doc.line(margin, footerStartY - 5, pageWidth - margin, footerStartY - 5);
    
    // Agent 1 Section
    if (agent1.name) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(40, 40, 40);
        doc.text(agent1.name, margin, footerStartY + 1);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(80, 80, 80);
        if (agent1.phone) doc.text(`Office Number: ${agent1.phone}`, margin, footerStartY + 5);
        if (agent1.email) doc.text(`Email: ${agent1.email}`, margin, footerStartY + 8);
    }
    
    // Agent 2 Section (middle)
    if (agent2.name) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(40, 40, 40);
        doc.text(agent2.name, pageWidth / 2 - 20, footerStartY + 1);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(80, 80, 80);
        if (agent2.phone) doc.text(`Office Number: ${agent2.phone}`, pageWidth / 2 - 20, footerStartY + 5);
        if (agent2.email) doc.text(`Email: ${agent2.email}`, pageWidth / 2 - 20, footerStartY + 8);
    }
    
    // Location Section (right)
    if (location.name) {
        doc.setLineWidth(0.2);
        doc.line(pageWidth - 85, footerStartY - 4, pageWidth - 85, footerStartY + 10);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(40, 40, 40);
        doc.text(location.name, pageWidth - 75, footerStartY + 1);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(80, 80, 80);
        if (location.address) {
            const addressLines = doc.splitTextToSize(location.address, 70);
            doc.text(addressLines, pageWidth - 75, footerStartY + 5);
        }
    }
    
    // Add company logo in bottom right corner
    addFooterLogo(doc, pageWidth, footerStartY);
}

/**
 * Add company logo to footer
 */
function addFooterLogo(doc, pageWidth, footerStartY) {
    const logoImg = document.getElementById('pdfLogo');
    if (logoImg && logoImg.complete) {
        const maxLogoWidth = 25;
        const maxLogoHeight = 10;
        const imgAspect = logoImg.naturalWidth / logoImg.naturalHeight;
        
        let logoWidth = maxLogoWidth;
        let logoHeight = maxLogoWidth / imgAspect;
        
        if (logoHeight > maxLogoHeight) {
            logoHeight = maxLogoHeight;
            logoWidth = maxLogoHeight * imgAspect;
        }
        
        const margin = 10;
        doc.addImage(logoImg, 'PNG', pageWidth - logoWidth - margin, footerStartY + 10, logoWidth, logoHeight);
    }
}

/**
 * Add page number to footer
 */
export function addPageNumber(doc, pageNum, totalPages, pageWidth, pageHeight) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(
        `Page ${pageNum} of ${totalPages}`,
        pageWidth / 2,
        pageHeight - 5,
        { align: 'center' }
    );
}