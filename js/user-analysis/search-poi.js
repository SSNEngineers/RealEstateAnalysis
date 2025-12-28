// ==================== SEARCH POI FUNCTIONALITY ====================

import { analysisParams, selectedSiteLocation, allPOIsDataByCategory, selectedPOIs } from './state.js';
import { fetchWithRetry, enrichPOIWithLogo, processPOIData } from './api-fetching.js';
import { calculateDistance } from './utilities.js';
import { showNotification } from './utilities.js';
import { calculateAllPixelCoordinates } from './coordinates.js';
import { redrawStaticMapSmooth } from './main-render.js';
import { updateInfoPanels } from './ui-updates.js';
import { osmTags } from './constants.js';

/**
 * Show search POI popup
 */
export function showSearchPOIPopup() {
    const overlay = document.createElement('div');
    overlay.className = 'search-poi-overlay';
    overlay.id = 'searchPOIOverlay';
    
    overlay.innerHTML = `
        <div class="search-poi-popup">
            <div class="search-poi-header">
                <h2><i class="fas fa-search"></i> Search for POI</h2>
                <button class="search-poi-close" onclick="closeSearchPOIPopup()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div class="search-poi-content">
                <p class="search-poi-description">
                    Enter the name of a business or place you want to find within your search area (3 miles).
                </p>
                
                <div class="search-poi-input-group">
                    <label for="searchPOIInput">POI Name</label>
                    <input 
                        type="text" 
                        id="searchPOIInput" 
                        class="search-poi-input"
                        placeholder="e.g., Aldi, Target, Starbucks"
                    >
                </div>
                
                <button id="searchPOIBtn" class="search-poi-button" onclick="performPOISearch()">
                    <i class="fas fa-search"></i> Search
                </button>
                
                <div id="searchPOIResult" class="search-poi-result"></div>
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    // Focus input
    setTimeout(() => {
        document.getElementById('searchPOIInput').focus();
    }, 100);
    
    // Handle Enter key
    document.getElementById('searchPOIInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performPOISearch();
        }
    });
    
    // Close on overlay click
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            closeSearchPOIPopup();
        }
    });
}

/**
 * Close search POI popup
 */
export function closeSearchPOIPopup() {
    const overlay = document.getElementById('searchPOIOverlay');
    if (overlay) {
        overlay.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => overlay.remove(), 300);
    }
}

/**
 * Check if POI already exists in the map (improved matching)
 */
function checkPOIExists(poiName, lat, lng) {
    const searchNameLower = poiName.toLowerCase().trim();
    
    for (const [category, pois] of Object.entries(allPOIsDataByCategory)) {
        for (const poi of pois) {
            const poiNameLower = poi.name.toLowerCase().trim();
            
            // Check by name similarity (case-insensitive, substring match)
            const nameMatches = 
                poiNameLower === searchNameLower || 
                poiNameLower.includes(searchNameLower) || 
                searchNameLower.includes(poiNameLower);
            
            // Check location (within 100 meters)
            const distance = calculateDistance(lat, lng, poi.lat, poi.lng);
            const locationClose = distance < 0.1; // 100 meters in km
            
            if (nameMatches && locationClose) {
                return { exists: true, category: category, poi: poi };
            }
        }
    }
    return { exists: false };
}

/**
 * Detect POI category from OSM tags
 */
function detectPOICategory(tags) {
    // Check each category's OSM tags
    for (const [category, tagString] of Object.entries(osmTags)) {
        const categoryTags = tagString.split('|');
        
        for (const tagPair of categoryTags) {
            const [key, value] = tagPair.split('=');
            
            if (tags[key] === value) {
                return category;
            }
        }
    }
    
    // Default to 'other' if no match found
    return 'other';
}

/**
 * Perform POI search - finds next available location if duplicates exist
 */
export async function performPOISearch() {
    const input = document.getElementById('searchPOIInput');
    const searchName = input.value.trim();
    
    if (!searchName) {
        showNotification('Please enter a POI name', 'warning');
        return;
    }
    
    const btn = document.getElementById('searchPOIBtn');
    const resultDiv = document.getElementById('searchPOIResult');
    
    // Show loading
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Searching...';
    resultDiv.innerHTML = '<div class="search-loading"><i class="fas fa-spinner fa-spin"></i> Searching within 3 miles...</div>';
    
    try {
        // ✅ Use Nominatim for faster, more reliable search
        const radiusMeters = 3 * 1609.34; // 3 miles in meters
        
        // Step 1: Use Nominatim to search for ALL instances of this place
        const nominatimUrl = `https://nominatim.openstreetmap.org/search?` +
            `q=${encodeURIComponent(searchName)}` +
            `&format=json` +
            `&limit=50` + // ✅ Get more results to find multiple locations
            `&viewbox=${selectedSiteLocation.lng - 0.05},${selectedSiteLocation.lat - 0.05},${selectedSiteLocation.lng + 0.05},${selectedSiteLocation.lat + 0.05}` +
            `&bounded=1`;
        
        console.log('🔍 Searching with Nominatim:', nominatimUrl);
        
        const nominatimResponse = await fetch(nominatimUrl, {
            headers: {
                'User-Agent': 'SSN-AI-Retailer-Map/1.0'
            }
        });
        
        if (!nominatimResponse.ok) {
            throw new Error('Nominatim search failed');
        }
        
        const nominatimData = await nominatimResponse.json();
        
        console.log('📦 Nominatim response:', nominatimData.length, 'results');
        
        if (!nominatimData || nominatimData.length === 0) {
            resultDiv.innerHTML = `
                <div class="search-result-not-found">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>No results found for "${searchName}" within 3 miles</p>
                    <small>Try a different spelling or search term</small>
                </div>
            `;
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-search"></i> Search';
            showNotification('POI not found', 'error');
            return;
        }
        
        // Step 2: Filter results within 3 miles and sort by distance
        const resultsWithinRadius = [];
        
        for (const result of nominatimData) {
            const lat = parseFloat(result.lat);
            const lon = parseFloat(result.lon);
            
            const distance = calculateDistance(
                selectedSiteLocation.lat,
                selectedSiteLocation.lng,
                lat,
                lon
            );
            
            const distanceMiles = distance / 1.60934;
            
            // Only consider results within 3 miles
            if (distanceMiles <= 3) {
                resultsWithinRadius.push({
                    ...result,
                    lat,
                    lon,
                    distanceMiles,
                    distance
                });
            }
        }
        
        if (resultsWithinRadius.length === 0) {
            resultDiv.innerHTML = `
                <div class="search-result-not-found">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Found "${searchName}" but all locations are outside the 3 mile radius</p>
                    <small>Try searching for a closer location</small>
                </div>
            `;
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-search"></i> Search';
            showNotification('POI too far away', 'warning');
            return;
        }
        
        // Sort by distance (closest first)
        resultsWithinRadius.sort((a, b) => a.distance - b.distance);
        
        console.log(`📍 Found ${resultsWithinRadius.length} locations within 3 miles`);
        
        // ✅ Step 3: Find the first location that DOESN'T already exist on the map
        let selectedResult = null;
        let allExist = true;
        
        for (const result of resultsWithinRadius) {
            const name = result.display_name.split(',')[0].trim();
            const existsCheck = checkPOIExists(name, result.lat, result.lon);
            
            if (!existsCheck.exists) {
                // Found a location that doesn't exist yet!
                selectedResult = result;
                allExist = false;
                break;
            } else {
                console.log(`⏭️  Skipping ${name} at ${result.distanceMiles.toFixed(2)} miles (already exists)`);
            }
        }
        
        // ✅ If ALL locations already exist, show appropriate message
        if (allExist || !selectedResult) {
            const totalFound = resultsWithinRadius.length;
            resultDiv.innerHTML = `
                <div class="search-result-warning">
                    <i class="fas fa-check-circle"></i>
                    <p>All ${totalFound} location(s) of "${searchName}" already exist on the map</p>
                    <small>No new locations to add within 3 miles</small>
                </div>
            `;
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-search"></i> Search';
            showNotification('All locations already on map', 'info');
            return;
        }
        
        const name = selectedResult.display_name.split(',')[0].trim();
        
        console.log(`✅ Selected NEW location: ${name} at ${selectedResult.distanceMiles.toFixed(2)} miles`);
        
        // Step 4: Get detailed info from Overpass (simplified query)
        resultDiv.innerHTML = '<div class="search-loading"><i class="fas fa-spinner fa-spin"></i> Fetching details...</div>';
        
        const osmId = selectedResult.osm_id;
        const osmType = selectedResult.osm_type; // node, way, or relation
        
        let overpassQuery;
        if (osmType === 'node') {
            overpassQuery = `[out:json][timeout:15];node(${osmId});out body;`;
        } else if (osmType === 'way') {
            overpassQuery = `[out:json][timeout:15];way(${osmId});out center;`;
        } else {
            // For relations, just use Nominatim data
            overpassQuery = null;
        }
        
        let tags = {};
        
        if (overpassQuery) {
            try {
                const overpassData = await fetchWithRetry('https://overpass-api.de/api/interpreter', {
                    method: 'POST',
                    body: overpassQuery,
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                }, 2, 3000);
                
                if (overpassData.elements && overpassData.elements.length > 0) {
                    tags = overpassData.elements[0].tags || {};
                }
            } catch (error) {
                console.warn('Could not fetch Overpass details, using Nominatim data:', error);
            }
        }
        
        // ✅ ALWAYS USE "other" CATEGORY FOR SEARCH RESULTS
        const category = 'other';
        
        console.log(`🏷️ Category: ${category}`);
        
        // Create POI object
        const newPOI = {
            id: osmId || Date.now(),
            name: name,
            lat: selectedResult.lat,
            lng: selectedResult.lon,
            website: tags.website || tags['contact:website'] || tags.brand || null,
            brand: tags.brand || null,
            category: category,
            distanceMiles: selectedResult.distanceMiles,
            logoUrl: null,
            coordinates: `${selectedResult.lat.toFixed(6)}, ${selectedResult.lon.toFixed(6)}`,
            address: formatAddress(tags) || selectedResult.display_name,
            postalCode: tags['addr:postcode'] || 'N/A',
            pixelX: 0,
            pixelY: 0,
            logoSize: 50,
            isSearchResult: true
        };
        
        // Enrich with logo
        resultDiv.innerHTML = '<div class="search-loading"><i class="fas fa-spinner fa-spin"></i> Fetching logo...</div>';
        
        await enrichPOIWithLogo(newPOI);
        
        if (!newPOI.logoUrl) {
            resultDiv.innerHTML = `
                <div class="search-result-warning">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Found "${name}" but no logo available</p>
                    <small>Distance: ${selectedResult.distanceMiles.toFixed(2)} miles away</small>
                    <button onclick="addPOIWithoutLogo('${btoa(JSON.stringify(newPOI))}')" 
                            style="margin-top: 10px; padding: 8px 16px; background: #ffc107; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">
                        Add Without Logo
                    </button>
                </div>
            `;
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-search"></i> Search';
            showNotification('POI found but no logo available', 'warning');
            return;
        }
        
        console.log(`✅ Logo found for ${name}`);
        
        // ✅ ADD TO "other" CATEGORY
        if (!allPOIsDataByCategory[category]) {
            allPOIsDataByCategory[category] = [];
        }
        allPOIsDataByCategory[category].push(newPOI);
        
        // ✅ SELECT IT
        if (!selectedPOIs[category]) {
            selectedPOIs[category] = {};
        }
        selectedPOIs[category][allPOIsDataByCategory[category].length - 1] = true;
        
        // Update map
        calculateAllPixelCoordinates();
        redrawStaticMapSmooth();
        updateInfoPanels();
        
        // Show success with location count
        const totalLocations = resultsWithinRadius.length;
        const existingCount = resultsWithinRadius.length - (allExist ? 0 : 1);
        
        resultDiv.innerHTML = `
            <div class="search-result-success">
                <i class="fas fa-check-circle"></i>
                <p>Added "${name}" to map!</p>
                <small>
                    Distance: ${selectedResult.distanceMiles.toFixed(2)} miles away<br>
                    ${totalLocations > 1 ? `Found ${totalLocations} locations, ${existingCount} already on map` : ''}
                </small>
            </div>
        `;
        
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-search"></i> Search Again';
        input.value = '';
        
        showNotification(`Added: ${name}`, 'success');
        
        // Auto-close after 2.5 seconds
        setTimeout(() => {
            closeSearchPOIPopup();
        }, 2500);
        
    } catch (error) {
        console.error('❌ Search error:', error);
        resultDiv.innerHTML = `
            <div class="search-result-error">
                <i class="fas fa-times-circle"></i>
                <p>Search failed: ${error.message}</p>
                <small>Please try again or check your connection</small>
            </div>
        `;
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-search"></i> Search';
        showNotification('Search failed', 'error');
    }
}

/**
 * Add POI without logo (fallback option)
 */
window.addPOIWithoutLogo = function(encodedPOI) {
    try {
        const newPOI = JSON.parse(atob(encodedPOI));
        const category = 'other';
        
        // Add placeholder logo
        newPOI.logoUrl = '/Images/placeholder-logo.png';
        
        // Add to category
        if (!allPOIsDataByCategory[category]) {
            allPOIsDataByCategory[category] = [];
        }
        allPOIsDataByCategory[category].push(newPOI);
        
        // Select it
        if (!selectedPOIs[category]) {
            selectedPOIs[category] = {};
        }
        selectedPOIs[category][allPOIsDataByCategory[category].length - 1] = true;
        
        // Update map
        calculateAllPixelCoordinates();
        redrawStaticMapSmooth();
        updateInfoPanels();
        
        showNotification(`Added: ${newPOI.name} (no logo)`, 'success');
        closeSearchPOIPopup();
    } catch (error) {
        console.error('Error adding POI without logo:', error);
        showNotification('Failed to add POI', 'error');
    }
};

/**
 * Format address from tags
 */
function formatAddress(tags) {
    const parts = [
        tags['addr:housenumber'],
        tags['addr:street'],
        tags['addr:city'],
        tags['addr:state'],
        tags['addr:postcode']
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'N/A';
}

/**
 * Setup global functions
 */
export function setupGlobalSearchFunctions() {
    window.showSearchPOIPopup = showSearchPOIPopup;
    window.closeSearchPOIPopup = closeSearchPOIPopup;
    window.performPOISearch = performPOISearch;
}