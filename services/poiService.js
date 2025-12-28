// backend/services/poiService.js
// CREATE THIS NEW FILE IN: backend/services/poiService.js
// This moves ALL POI processing to backend (hidden from browser)

const fetch = require('node-fetch'); // You need to install: npm install node-fetch@2

// ✅ HIDDEN FROM BROWSER - API Key stored on server
const LOGODEV_API_KEY = process.env.LOGODEV_API_KEY || "pk_Mugixd0DTQO4N80QR6b0_g";

// ✅ HIDDEN FROM BROWSER - OSM Tags
const osmTags = {
    school: "amenity=school|amenity=university|amenity=college",
    hospital: "amenity=hospital|amenity=clinic|healthcare=hospital",
    fast_food: "amenity=fast_food|amenity=restaurant",
    supermarket: "shop=supermarket|shop=grocery|shop=convenience",
    shopping_mall: "shop=mall|shop=department_store",
    coffee_shop: "amenity=cafe|shop=coffee",
    gas_station: "amenity=fuel|shop=gas",
    police_station: "amenity=police",
    fire_station: "amenity=fire_station",
    bank: "amenity=bank",
    park: "leisure=park|leisure=garden",
    pharmacy: "amenity=pharmacy|shop=pharmacy|shop=chemist",
    gym: "leisure=fitness_centre|leisure=sports_centre|leisure=gym|amenity=gym",
};

// ✅ HIDDEN FROM BROWSER - Famous brands list
const FAMOUS_BRANDS = [
    "Walmart", "Target", "Costco", "Sam's Club", "BJ's Wholesale Club",
    "McDonald's", "Burger King", "Wendy's", "KFC", "Subway",
    "Starbucks", "Dunkin'", "Pizza Hut", "Domino's", "Papa John's",
    "Marco's Pizza", "Culver's", "IHOP", "LongHorn Steakhouse",
    // ... add more
];

/**
 * ✅ HIDDEN: Calculate distance between coordinates
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

/**
 * ✅ HIDDEN: Fetch POIs from Overpass API
 */
async function fetchPOIsForCategory(category, lat, lng, radiusMiles) {
    const radiusMeters = radiusMiles * 1609.34;
    const tag = osmTags[category];
    
    if (!tag) {
        throw new Error(`Unknown category: ${category}`);
    }
    
    // Build Overpass query
    const tags = tag.split('|');
    let nodeQueries = '';
    let wayQueries = '';
    
    tags.forEach(t => {
        const [key, value] = t.split('=');
        nodeQueries += `node["${key}"="${value}"](around:${radiusMeters},${lat},${lng});`;
        wayQueries += `way["${key}"="${value}"](around:${radiusMeters},${lat},${lng});`;
    });
    
    const query = `[out:json][timeout:15];(${nodeQueries}${wayQueries});out center;`;
    
    try {
        const response = await fetch('https://overpass-api.de/api/interpreter', {
            method: 'POST',
            body: query,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        
        const data = await response.json();
        return data.elements || [];
    } catch (error) {
        console.error(`Error fetching ${category}:`, error.message);
        return [];
    }
}

/**
 * ✅ HIDDEN: Calculate popularity score
 */
function calculatePopularityScore(poi, allPOIs) {
    let score = 0;
    
    // Famous brand bonus
    if (FAMOUS_BRANDS.some(brand => poi.name.toLowerCase().includes(brand.toLowerCase()))) {
        score += 100;
    }
    
    // Has website
    if (poi.website) score += 30;
    
    // Has brand tag
    if (poi.brand) score += 40;
    
    // Chain detection
    const similarCount = allPOIs.filter(p => {
        const name1 = poi.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        const name2 = p.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        return name1 === name2;
    }).length;
    
    if (similarCount > 1) {
        score += Math.min(similarCount * 10, 50);
    }
    
    return score;
}

/**
 * ✅ HIDDEN: Fetch logo from Wikipedia
 */
async function fetchLogoFromWikipedia(companyName) {
    if (!companyName) return null;
    
    try {
        const searchUrl = `https://en.wikipedia.org/w/api.php?` + 
            `action=query&list=search&srsearch=${encodeURIComponent(companyName)}` +
            `&format=json&origin=*`;
        
        const searchResponse = await fetch(searchUrl);
        const searchData = await searchResponse.json();
        
        if (!searchData.query || !searchData.query.search || searchData.query.search.length === 0) {
            return null;
        }
        
        const pageTitle = searchData.query.search[0].title;
        
        const pageUrl = `https://en.wikipedia.org/w/api.php?` +
            `action=parse&page=${encodeURIComponent(pageTitle)}` +
            `&prop=text&format=json&origin=*`;
        
        const pageResponse = await fetch(pageUrl);
        const pageData = await pageResponse.json();
        
        if (!pageData.parse || !pageData.parse.text) {
            return null;
        }
        
        // Parse HTML to find logo (simplified - you can expand this)
        const htmlContent = pageData.parse.text['*'];
        
        // Look for logo in infobox
        const logoMatch = htmlContent.match(/upload\.wikimedia\.org\/wikipedia\/[^"]+\.(?:png|jpg|jpeg|svg)/i);
        
        if (logoMatch) {
            return 'https://' + logoMatch[0];
        }
        
        return null;
    } catch (error) {
        return null;
    }
}

/**
 * ✅ HIDDEN: Fetch logo from Logo.dev
 */
async function fetchLogoFromLogoDev(website) {
    if (!website) return null;
    
    try {
        let domain = website.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
        const response = await fetch(`https://img.logo.dev/${domain}?token=${LOGODEV_API_KEY}&size=200`);
        
        if (response.ok) {
            return response.url;
        }
        
        return null;
    } catch (error) {
        return null;
    }
}

/**
 * ✅ MAIN FUNCTION: Process POIs for a category (ALL LOGIC HIDDEN)
 */
async function processPOIsForCategory(category, lat, lng, radiusMiles, count) {
    console.log(`Processing ${category} (hidden from browser)...`);
    
    // 1. Fetch POIs from Overpass
    const elements = await fetchPOIsForCategory(category, lat, lng, radiusMiles);
    
    // 2. Process and score POIs
    const pois = elements.map(el => {
        const pos = el.lat ? { lat: el.lat, lng: el.lon } : { lat: el.center.lat, lng: el.center.lon };
        const tags = el.tags || {};
        const name = tags.name || category.replace(/_/g, ' ').toUpperCase();
        const distance = calculateDistance(lat, lng, pos.lat, pos.lng);
        const distanceMiles = distance / 1.60934;
        
        return {
            id: el.id,
            name,
            lat: pos.lat,
            lng: pos.lng,
            website: tags.website || tags['contact:website'] || tags.brand,
            brand: tags.brand || null,
            category,
            distanceMiles,
            logoUrl: null
        };
    }).sort((a, b) => a.distanceMiles - b.distanceMiles);
    
    // 3. Calculate scores and prioritize
    const poisWithScores = pois.map(poi => ({
        poi,
        score: calculatePopularityScore(poi, pois)
    })).sort((a, b) => b.score - a.score);
    
    // 4. Get top N with logos
    const results = [];
    for (let i = 0; i < poisWithScores.length && results.length < count; i++) {
        const item = poisWithScores[i];
        const poi = item.poi;
        
        // Try to get logo
        let logoUrl = null;
        
        if (poi.website) {
            logoUrl = await fetchLogoFromLogoDev(poi.website);
        }
        
        if (!logoUrl) {
            logoUrl = await fetchLogoFromWikipedia(poi.name);
        }
        
        if (logoUrl) {
            poi.logoUrl = logoUrl;
            results.push(poi);
        }
    }
    
    console.log(`✅ ${category}: ${results.length} POIs with logos (logic hidden)`);
    return results;
}

/**
 * ✅ MAIN EXPORT: Fetch all POIs
 */
async function fetchAllPOIsForAnalysis(analysisParams) {
    const { address, radius, pois } = analysisParams;
    
    // Geocode address
    const geoResponse = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
    );
    const geoData = await geoResponse.json();
    
    if (!geoData || geoData.length === 0) {
        throw new Error('Address not found');
    }
    
    const location = {
        lat: parseFloat(geoData[0].lat),
        lng: parseFloat(geoData[0].lon),
        address: geoData[0].display_name
    };
    
    // Fetch POIs for each category
    const allPOIsData = {};
    
    for (const [category, count] of Object.entries(pois)) {
        if (count > 0) {
            allPOIsData[category] = await processPOIsForCategory(
                category,
                location.lat,
                location.lng,
                radius,
                count
            );
            
            // Delay between requests
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
    
    return {
        location,
        allPOIsData
    };
}

module.exports = {
    fetchAllPOIsForAnalysis
};