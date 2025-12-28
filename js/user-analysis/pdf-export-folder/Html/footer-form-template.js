// ==================== PDF FOOTER FORM HTML TEMPLATE ====================
// js/user-analysis/pdf-export-folder/Html/footer-form-template.js

/**
 * Create the HTML structure for the PDF footer form
 * @returns {string} HTML string for the form
 */
export function createFormHTML() {
    return `
        <div class="pdf-form-wrapper">
            <!-- Header Section -->
            <div class="pdf-form-header">
                <h2>
                    <i class="fas fa-file-pdf"></i>
                    Customize Your PDF Report
                </h2>
                <p>Add professional details to your exported report</p>
            </div>

            <!-- Form Content with Scroll -->
            <div class="pdf-form-content">
                <div class="pdf-form-grid">
                    <!-- Agent 1 Section -->
                    <div class="pdf-form-section agent-1">
                        <div class="pdf-section-header">
                            <div class="pdf-section-icon">1</div>
                            <h3 class="pdf-section-title">Primary Agent</h3>
                        </div>
                        
                        <div class="pdf-form-group">
                            <label class="pdf-form-label">Full Name</label>
                            <div class="pdf-input-container">
                                <input 
                                    type="text" 
                                    id="agent1-name" 
                                    class="pdf-form-input"
                                    placeholder="Enter agent's full name"
                                >
                                <i class="fas fa-user"></i>
                            </div>
                        </div>
                        
                        <div class="pdf-form-group">
                            <label class="pdf-form-label">Office Number</label>
                            <div class="pdf-input-container">
                                <input 
                                    type="text" 
                                    id="agent1-phone" 
                                    class="pdf-form-input"
                                    placeholder="(999) 999-9999"
                                >
                                <i class="fas fa-phone"></i>
                            </div>
                        </div>
                        
                        <div class="pdf-form-group">
                            <label class="pdf-form-label">Email Address</label>
                            <div class="pdf-input-container">
                                <input 
                                    type="email" 
                                    id="agent1-email" 
                                    class="pdf-form-input"
                                    placeholder="agent@example.com"
                                >
                                <i class="fas fa-envelope"></i>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Agent 2 Section -->
                    <div class="pdf-form-section agent-2">
                        <div class="pdf-section-header">
                            <div class="pdf-section-icon">2</div>
                            <h3 class="pdf-section-title">Secondary Agent (Optional)</h3>
                        </div>
                        
                        <div class="pdf-form-group">
                            <label class="pdf-form-label">Full Name</label>
                            <div class="pdf-input-container">
                                <input 
                                    type="text" 
                                    id="agent2-name" 
                                    class="pdf-form-input"
                                    placeholder="Enter agent's full name (optional)"
                                >
                                <i class="fas fa-user"></i>
                            </div>
                        </div>
                        
                        <div class="pdf-form-group">
                            <label class="pdf-form-label">Office Number</label>
                            <div class="pdf-input-container">
                                <input 
                                    type="text" 
                                    id="agent2-phone" 
                                    class="pdf-form-input"
                                    placeholder="(999) 999-9999 (optional)"
                                >
                                <i class="fas fa-phone"></i>
                            </div>
                        </div>
                        
                        <div class="pdf-form-group">
                            <label class="pdf-form-label">Email Address</label>
                            <div class="pdf-input-container">
                                <input 
                                    type="email" 
                                    id="agent2-email" 
                                    class="pdf-form-input"
                                    placeholder="agent@example.com (optional)"
                                >
                                <i class="fas fa-envelope"></i>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Location Address Section -->
                    <div class="pdf-form-section location">
                        <div class="pdf-section-header">
                            <div class="pdf-section-icon">
                                <i class="fas fa-map-marker-alt"></i>
                            </div>
                            <h3 class="pdf-section-title">Location Address</h3>
                        </div>
                        
                        <div class="pdf-form-group">
                            <label class="pdf-form-label">Location Name</label>
                            <div class="pdf-input-container">
                                <input 
                                    type="text" 
                                    id="location-name" 
                                    class="pdf-form-input"
                                    placeholder="Property or Business Name"
                                >
                                <i class="fas fa-building"></i>
                            </div>
                        </div>
                        
                        <div class="pdf-form-group">
                            <label class="pdf-form-label">Full Address</label>
                            <div class="pdf-input-container">
                                <textarea 
                                    id="location-address" 
                                    rows="4" 
                                    class="pdf-form-input"
                                    placeholder="123 Main Street, City, State ZIP"
                                ></textarea>
                                <i class="fas fa-map-marked-alt"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Footer Buttons -->
            <div class="pdf-form-footer">
                <div class="pdf-form-info">
                    <i class="fas fa-info-circle"></i>
                    <span>Agent 2 is optional. Leave fields empty if not needed.</span>
                </div>
                <div class="pdf-form-buttons">
                    <button id="form-cancel" class="pdf-form-button pdf-form-cancel">
                        <i class="fas fa-times"></i> 
                        Cancel
                    </button>
                    <button id="form-submit" class="pdf-form-button pdf-form-submit">
                        <i class="fas fa-check"></i> 
                        Generate PDF
                    </button>
                </div>
            </div>
        </div>
    `;
}