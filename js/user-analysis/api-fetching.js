// ==================== API FETCHING AND DATA PROCESSING ====================
// Handles fetching POI data from Overpass API, logo fetching from Wikipedia and Logo.dev,
// processing and filtering POIs, and enriching them with logos.
import { 
    osmTags, 
    FAMOUS_LOCATIONS, 
    FAMOUS_BRANDS,  // ✅ ADD THIS
    LOGODEV_API_KEY 
} from './constants.js';
import { 
    selectedSiteLocation, 
    analysisParams,
    allPOIsDataByCategory,
    setAllPOIsDataByCategory,
    selectedPOIs,
    setSelectedPOIs,
    highwayData,
    setHighwayData,
    selectedHighways,
    setSelectedHighways
} from './state.js';
import { calculateDistance, delay, formatAddress } from './utilities.js';

/**
 * Fetch with retry logic for failed requests
 */
export async function fetchWithRetry(url, options, retries = 3, delayMs = 3000) {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url, options);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error('Response is not JSON');
            }

            return await response.json();
        } catch (error) {
            console.warn(`Attempt ${i + 1} failed:`, error.message);

            if (i === retries - 1) {
                throw error;
            }

            await new Promise(resolve => setTimeout(resolve, delayMs * (i + 1)));
        }
    }
}


/**
 * Fetch logo from Wikipedia API - ONLY brand logos, not random photos
 */
export async function fetchLogoFromWikipedia(companyName) {
    if (!companyName) return null;
    
    try {
        console.log(`Searching Wikipedia for LOGO of: ${companyName}`);
        
        // Step 1: Search Wikipedia for the company
        const searchUrl = `https://en.wikipedia.org/w/api.php?` + 
            `action=query&list=search&srsearch=${encodeURIComponent(companyName)}` +
            `&format=json&origin=*`;
        
        const searchResponse = await fetch(searchUrl);
        if (!searchResponse.ok) {
            console.log(`Wikipedia search failed for ${companyName}`);
            return null;
        }
        
        const searchData = await searchResponse.json();
        
        if (!searchData.query || !searchData.query.search || searchData.query.search.length === 0) {
            console.log(`No Wikipedia page found for ${companyName}`);
            return null;
        }
        
        const pageTitle = searchData.query.search[0].title;
        console.log(`Found Wikipedia page: ${pageTitle}`);
        
        // Step 2: Get page content to find logo
        const pageUrl = `https://en.wikipedia.org/w/api.php?` +
            `action=parse&page=${encodeURIComponent(pageTitle)}` +
            `&prop=text&format=json&origin=*`;
        
        const pageResponse = await fetch(pageUrl);
        if (!pageResponse.ok) {
            console.log(`Failed to fetch Wikipedia page content for ${companyName}`);
            return null;
        }
        
        const pageData = await pageResponse.json();
        
        if (!pageData.parse || !pageData.parse.text) {
            return null;
        }
        
        // Step 3: Parse HTML to find LOGO specifically
        const htmlContent = pageData.parse.text['*'];
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, 'text/html');
        
        // Priority 1: Look for infobox logo row specifically
        const infobox = doc.querySelector('table.infobox');
        if (infobox) {
            // Look for rows with "logo" in the header
            const logoRows = Array.from(infobox.querySelectorAll('tr')).filter(row => {
                const th = row.querySelector('th');
                return th && th.textContent.toLowerCase().includes('logo');
            });
            
            if (logoRows.length > 0) {
                const img = logoRows[0].querySelector('img');
                if (img && img.src && isValidLogoImage(img.src, img.alt)) {
                    let logoUrl = img.src;
                    if (logoUrl.startsWith('//')) {
                        logoUrl = 'https:' + logoUrl;
                    }
                    console.log(`✅ Found logo in Wikipedia infobox logo row for ${companyName}`);
                    return logoUrl;
                }
            }
            
            // Fallback: First image in infobox (usually the logo)
            const firstImg = infobox.querySelector('img');
            if (firstImg && firstImg.src && isValidLogoImage(firstImg.src, firstImg.alt)) {
                let logoUrl = firstImg.src;
                if (logoUrl.startsWith('//')) {
                    logoUrl = 'https:' + logoUrl;
                }
                console.log(`✅ Found logo as first image in Wikipedia infobox for ${companyName}`);
                return logoUrl;
            }
        }
        
        // Priority 2: Look for images with 'logo' specifically in filename or alt text
        const allImages = Array.from(doc.querySelectorAll('img'));
        const logoImages = allImages.filter(img => {
            const src = img.src || '';
            const alt = img.alt || '';
            
            // Check if filename contains 'logo'
            const hasLogoInFilename = src.toLowerCase().includes('logo');
            
            // Check if alt text contains 'logo' but NOT 'location', 'map', 'photo', 'portrait'
            const hasLogoInAlt = alt.toLowerCase().includes('logo') &&
                !alt.toLowerCase().includes('location') &&
                !alt.toLowerCase().includes('map') &&
                !alt.toLowerCase().includes('photo') &&
                !alt.toLowerCase().includes('portrait');
            
            return (hasLogoInFilename || hasLogoInAlt) && isValidLogoImage(src, alt);
        });
        
        if (logoImages.length > 0) {
            let logoUrl = logoImages[0].src;
            if (logoUrl.startsWith('//')) {
                logoUrl = 'https:' + logoUrl;
            }
            console.log(`✅ Found logo by filename/alt text on Wikipedia for ${companyName}`);
            return logoUrl;
        }
        
        console.log(`❌ No specific logo found on Wikipedia for ${companyName} (avoiding random photos)`);
        return null;
        
    } catch (error) {
        console.log(`Wikipedia error for ${companyName}:`, error.message);
        return null;
    }
}

/**
 * Validate if an image is likely a logo (not a photo, map, or portrait)
 */
function isValidLogoImage(src, alt) {
    if (!src) return false;
    
    const srcLower = src.toLowerCase();
    const altLower = (alt || '').toLowerCase();
    
    // Reject common non-logo images
    const rejectPatterns = [
        'map', 'location', 'building', 'headquarters',
        'portrait', 'photo', 'ceo', 'founder',
        'graph', 'chart', 'diagram',
        'screenshot', 'commons', 'wikimedia/commons'
    ];
    
    for (const pattern of rejectPatterns) {
        if (srcLower.includes(pattern) || altLower.includes(pattern)) {
            return false;
        }
    }
    
    // Accept images that look like logos
    const acceptPatterns = [
        'logo', 'brand', 'emblem', 'symbol', 'icon'
    ];
    
    for (const pattern of acceptPatterns) {
        if (srcLower.includes(pattern) || altLower.includes(pattern)) {
            return true;
        }
    }
    
    // If in infobox and no reject patterns, probably a logo
    return true;
}

/**
 * Fetch POIs for a specific category from Overpass API
 */
export async function fetchPOIsForCategory(category) {
    const tag = osmTags[category];
    const radiusMeters = analysisParams.radius * 1609.34;

    let query;
    if (category === 'popularLocations') {
        // For popular locations, search for multiple types
        query = `[out:json][timeout:15];(
            node["tourism"="attraction"](around:${radiusMeters},${selectedSiteLocation.lat},${selectedSiteLocation.lng});
            way["tourism"="attraction"](around:${radiusMeters},${selectedSiteLocation.lat},${selectedSiteLocation.lng});
            node["leisure"="park"]["name"](around:${radiusMeters},${selectedSiteLocation.lat},${selectedSiteLocation.lng});
            way["leisure"="park"]["name"](around:${radiusMeters},${selectedSiteLocation.lat},${selectedSiteLocation.lng});
            node["shop"="department_store"](around:${radiusMeters},${selectedSiteLocation.lat},${selectedSiteLocation.lng});
            way["shop"="department_store"](around:${radiusMeters},${selectedSiteLocation.lat},${selectedSiteLocation.lng});
            node["shop"="mall"](around:${radiusMeters},${selectedSiteLocation.lat},${selectedSiteLocation.lng});
            way["shop"="mall"](around:${radiusMeters},${selectedSiteLocation.lat},${selectedSiteLocation.lng});
        );out center;`;
    } else if (category === 'school') {
        query = `[out:json][timeout:15];(
            node["amenity"="school"](around:${radiusMeters},${selectedSiteLocation.lat},${selectedSiteLocation.lng});
            way["amenity"="school"](around:${radiusMeters},${selectedSiteLocation.lat},${selectedSiteLocation.lng});
            node["amenity"="university"](around:${radiusMeters},${selectedSiteLocation.lat},${selectedSiteLocation.lng});
            way["amenity"="university"](around:${radiusMeters},${selectedSiteLocation.lat},${selectedSiteLocation.lng});
            node["amenity"="college"](around:${radiusMeters},${selectedSiteLocation.lat},${selectedSiteLocation.lng});
            way["amenity"="college"](around:${radiusMeters},${selectedSiteLocation.lat},${selectedSiteLocation.lng});
        );out center;`;
    } else {
        // Handle multiple tags separated by |
        const tags = tag.split('|');
        let nodeQueries = '';
        let wayQueries = '';
        
        tags.forEach(t => {
            const [key, value] = t.split('=');
            nodeQueries += `node["${key}"="${value}"](around:${radiusMeters},${selectedSiteLocation.lat},${selectedSiteLocation.lng});`;
            wayQueries += `way["${key}"="${value}"](around:${radiusMeters},${selectedSiteLocation.lat},${selectedSiteLocation.lng});`;
        });
        
        query = `[out:json][timeout:15];(${nodeQueries}${wayQueries});out center;`;
    }

    try {
        const data = await fetchWithRetry('https://overpass-api.de/api/interpreter', {
            method: 'POST',
            body: query,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        console.log(`✓ ${category}: received ${data.elements ? data.elements.length : 0} results`);
        let processed = processPOIData(data.elements || [], category);
        processed = limitDuplicatePOIs(processed, 3);
        return processed;
    } catch (error) {
        console.error(`✗ Failed to fetch ${category} after retries:`, error.message);
        return [];
    }
}

/**
 * Process raw POI data from Overpass API
 */
export function processPOIData(elements, category) {
    return elements.map(el => {
        const pos = el.lat ? { lat: el.lat, lng: el.lon } : { lat: el.center.lat, lng: el.center.lon };
        const tags = el.tags || {};
        const name = tags.name || category.replace(/_/g, ' ').toUpperCase();
        const distance = calculateDistance(selectedSiteLocation.lat, selectedSiteLocation.lng, pos.lat, pos.lng);
        const distanceMiles = distance / 1.60934;

        return {
            id: el.id,
            name,
            lat: pos.lat,
            lng: pos.lng,
            website: tags.website || tags['contact:website'] || tags.brand,
            brand: tags.brand || null, // ✅ ADD THIS LINE
            category,
            distanceMiles,
            logoUrl: null,
            coordinates: `${pos.lat.toFixed(6)}, ${pos.lng.toFixed(6)}`,
            address: formatAddress(tags),
            postalCode: tags['addr:postcode'] || 'N/A',
            pixelX: 0,
            pixelY: 0,
            logoSize: 40
        };
    }).sort((a, b) => a.distanceMiles - b.distanceMiles);
}


/**
 * Calculate popularity score for a POI (higher = more popular)
 * 🌟 PRIORITY: Famous brands get bonus points (EXCEPT for popularLocations category)
 * @param {Object} poi - POI object
 * @param {Array} allPOIs - All POIs in category
 * @param {string} category - Category name
 */
function calculatePopularityScore(poi, allPOIs, category) {
    let score = 0;
    
    // 🌟 NEW: Famous brand bonus (+100 points) - ONLY for non-popularLocations
    if (category !== 'popularLocations' && isFamousBrand(poi.name)) {
        score += 100;
        console.log(`🌟 ${poi.name} is a FAMOUS BRAND! Bonus: +100 points`);
    }
    
    // 🔥 Has official website = likely a brand (+30 points)
    if (poi.website) {
        score += 30;
    }
    
    // 🔥 Has brand tag in OSM = confirmed chain (+40 points)
    if (poi.brand) {
        score += 40;
    }
    
    // 🔥 Chain detection - count similar names (+10 per location, max 50)
    const similarCount = allPOIs.filter(p => {
        const name1 = poi.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        const name2 = p.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        return name1 === name2;
    }).length;
    
    if (similarCount > 1) {
        score += Math.min(similarCount * 10, 50);
    }
    
    // 🔥 Shorter names = more memorable brands (+points inversely proportional to length)
    const nameLength = poi.name.length;
    if (nameLength < 15) {
        score += 20;
    } else if (nameLength < 25) {
        score += 10;
    }
    
    // 🔥 No numbers/special chars = cleaner brand name (+10 points)
    if (!/\d|#/.test(poi.name)) {
        score += 10;
    }
    
    console.log(`📊 ${poi.name}: popularity score = ${score}`);
    
    return score;
}
/**
 * Limit duplicate POIs with same name
 */
export function limitDuplicatePOIs(pois, maxDuplicates = 3) {
    const nameCounts = {};
    const filteredPOIs = [];

    for (const poi of pois) {
        const baseName = poi.name
            .replace(/\s+(#\d+|Store|Location|Branch)/gi, '')
            .trim()
            .toLowerCase();

        if (!nameCounts[baseName]) {
            nameCounts[baseName] = 0;
        }

        if (nameCounts[baseName] < maxDuplicates) {
            filteredPOIs.push(poi);
            nameCounts[baseName]++;
        } else {
            console.log(`Skipping duplicate: ${poi.name} (already have ${maxDuplicates})`);
        }
    }

    console.log(`Filtered ${pois.length} POIs down to ${filteredPOIs.length} (max ${maxDuplicates} per name)`);
    return filteredPOIs;
}
/**
 * Fetch logo from Logo.dev API ONLY (no fallback)
 */
export async function fetchLogoFromLogoDev(website) {
    if (!website) return null;
    
    try {
        let domain = website.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
        const response = await fetch(`https://img.logo.dev/${domain}?token=${LOGODEV_API_KEY}&size=200`);
        
        if (response.ok) {
            const blob = await response.blob();
            
            // Only accept logos that are reasonably sized (not tiny placeholders)
            if (blob.size < 500) {
                console.log(`Logo.dev returned small image for ${domain}, rejecting`);
                return null;
            }
            
            return response.url;
        } else {
            console.log(`Logo.dev failed for ${domain} (HTTP ${response.status})`);
            return null;
        }
    } catch (error) {
        console.log(`Logo.dev error for ${website}:`, error.message);
        return null;
    }
}


/**
 * Enrich single POI with logo - Local images for specific categories, then API search
 */
export async function enrichPOIWithLogo(poi) {
    // ✅ PRIORITY 1: Check if category should use local image
    const localImageCategories = {
        'gym': '/Images/gym.jpg',
        'park': '/Images/park.jpg',
        'police_station': '/Images/police.jpg',
        'fire_station': '/Images/firestation.png'
    };
    
    if (localImageCategories[poi.category]) {
        poi.logoUrl = localImageCategories[poi.category];
        console.log(`✅ Using local image for ${poi.name} (${poi.category}): ${poi.logoUrl}`);
        return true;
    }
    
    // For all other categories, search for logos
    if (poi.website || poi.name) {
        let logoUrl = null;
        
        // PRIORITY 2: Try Logo.dev first with website
        if (poi.website) {
            console.log(`Trying Logo.dev for ${poi.name}...`);
            logoUrl = await fetchLogoFromLogoDev(poi.website);
        }
        
        // PRIORITY 3: If Logo.dev fails, try Wikipedia (LOGO ONLY)
        if (!logoUrl) {
            console.log(`Logo.dev failed for ${poi.name}, trying Wikipedia for LOGO...`);
            logoUrl = await fetchLogoFromWikipedia(poi.name);
        }
        
        // PRIORITY 4: If no website, try Logo.dev with name-based domain
        if (!logoUrl && !poi.website && poi.name) {
            console.log(`Trying Logo.dev with name-based domain for ${poi.name}...`);
            const simplifiedName = poi.name.toLowerCase()
                .replace(/[^a-z0-9\s]/g, '')
                .split(' ')[0];
            logoUrl = await fetchLogoFromLogoDev(simplifiedName + '.com');
        }
        
        if (logoUrl) {
            poi.logoUrl = logoUrl;
            console.log(`✅ Logo found for ${poi.name}: ${logoUrl.substring(0, 50)}...`);
            return true;
        } else {
            console.log(`❌ No logo found for ${poi.name}`);
        }
    }
    return false;
}

/**
 * Enrich multiple POIs with logos
 */
export async function enrichPOIsWithLogos(pois) {
    console.log(`Enriching ${pois.length} POIs with logos (Wikipedia → Logo.dev fallback)...`);
    
    // Process POIs sequentially to avoid rate limiting
    for (let i = 0; i < pois.length; i++) {
        const poi = pois[i];
        await enrichPOIWithLogo(poi);
        
        // Add delay between requests to avoid overwhelming APIs
        if (i < pois.length - 1) {
            await delay(2000); // 2 second delay between each POI
        }
    }
    
    const foundCount = pois.filter(p => p.logoUrl).length;
    console.log(`✅ Logo enrichment complete: ${foundCount}/${pois.length} logos found`);
}

/**
 * Check if POI name matches famous location list
 */
function isFamousLocation(poiName) {
    const poiNameLower = poiName.toLowerCase();
    
    return FAMOUS_LOCATIONS.some(famousName =>
        poiNameLower.includes(famousName.toLowerCase()) ||
        famousName.toLowerCase().includes(poiNameLower)
    );
}

/**
 * Check if POI matches famous BRAND list - EXACT FULL NAME MATCH ONLY
 * @param {string} poiName - POI name to check
 * @returns {boolean} True if matches famous brand (exact match)
 */
export function isFamousBrand(poiName) {
    // Normalize POI name: lowercase, remove special chars, trim, collapse multiple spaces
    const poiNameNormalized = poiName.toLowerCase()
        .replace(/[^a-z0-9\s]/g, '') // Remove special characters
        .replace(/\s+/g, ' ') // Collapse multiple spaces to single space
        .trim();
    
    return FAMOUS_BRANDS.some(famousBrand => {
        // Normalize brand name the same way
        const brandNormalized = famousBrand.toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
        
        // ✅ ONLY exact full name match
        // Example: "McDonald's" will match "mcdonalds" but NOT "McDonald's Downtown"
        // "Universal Parks and Resorts" will match exactly, but "Park" will NOT match
        return poiNameNormalized === brandNormalized;
    });
}

/**
 * Filter to only famous locations with logos for popularLocations category
 */
export async function filterOnlyFamousLocations(pois, category) {
    if (category !== 'popularLocations') return pois;
    
    console.log(`Filtering for famous locations only in ${category}...`);
    
    // First enrich all with logos
    await enrichPOIsWithLogos(pois);
    
    // Filter to only famous locations from the list that have logos
    const famousWithLogos = pois.filter(poi => {
        const isFamous = isFamousLocation(poi.name);  // ⭐ No category parameter
        const hasLogo = !!poi.logoUrl;
        return isFamous && hasLogo;
    });
    
    console.log(`${category}: Found ${famousWithLogos.length} famous locations with logos out of ${pois.length} total`);
    
    return famousWithLogos;
}
/**
 * Remove POIs without logos (with +5 fetch and brand diversity)
 * 🌟 LOGIC: Fetch N+5, prioritize diverse brands, max 3 instances per brand
 */
export async function removeWithoutLogos(pois, category) {
    const desiredCount = analysisParams.pois[category];
    const priorityListSize = desiredCount + 5; // Priority list size
    
    console.log(`Processing ${category} POIs - need ${desiredCount} with logos (priority list: ${priorityListSize})...`);
    
    // ✅ SKIP brand prioritization for popularLocations category
    if (category === 'popularLocations') {
        console.log(`ℹ️ ${category}: Using standard processing (no brand prioritization)`);
        
        const poisWithScores = pois.map(poi => ({
            poi,
            score: calculatePopularityScore(poi, pois, category)
        }));
        
        poisWithScores.sort((a, b) => b.score - a.score);
        
        const sortedPois = poisWithScores.map(item => item.poi);
        const withLogos = [];
        
        for (let i = 0; i < sortedPois.length; i++) {
            const poi = sortedPois[i];
            await enrichPOIWithLogo(poi);
            
            if (poi.logoUrl) {
                withLogos.push(poi);
                if (withLogos.length >= desiredCount) break;
            }
            if (i < sortedPois.length - 1) await delay(2000);
        }
        
        return withLogos;
    }
    
    // ✅ BRAND PRIORITIZATION + DIVERSITY for all other categories
    console.log(`🌟 ${category}: Using brand prioritization with diversity`);
    
    // Calculate popularity scores for all POIs
    const poisWithScores = pois.map(poi => ({
        poi,
        score: calculatePopularityScore(poi, pois, category),
        isFamousBrand: isFamousBrand(poi.name),
        brandName: extractBrandName(poi.name)
    }));
    
    // Sort by: Famous brand first, then by score
    poisWithScores.sort((a, b) => {
        if (a.isFamousBrand && !b.isFamousBrand) return -1;
        if (!a.isFamousBrand && b.isFamousBrand) return 1;
        return b.score - a.score;
    });
    
    // ✅ STEP 0: Separate first instances from duplicates
    const firstInstances = []; // First instance of each brand
    const duplicates = []; // 2nd and 3rd instances
    const brandInstanceCount = new Map();
    
    poisWithScores.forEach(item => {
        const brandName = item.brandName;
        const currentCount = brandInstanceCount.get(brandName) || 0;
        
        if (currentCount === 0) {
            // First instance - add to priority group
            firstInstances.push(item);
            brandInstanceCount.set(brandName, 1);
        } else if (currentCount < 3) {
            // 2nd or 3rd instance - add to overflow
            duplicates.push(item);
            brandInstanceCount.set(brandName, currentCount + 1);
        }
        // Skip 4th+ instances completely
    });
    
    // Take first priorityListSize items from first instances
    const priorityList = firstInstances.slice(0, priorityListSize);
    
    console.log(`✅ Priority list - top ${priorityList.length} (first instance of each brand):`);
    priorityList.forEach((item, i) => {
        const star = item.isFamousBrand ? '🌟' : '  ';
        console.log(`   ${star} ${i + 1}. ${item.poi.name} (score: ${item.score})`);
    });
    
    // ✅ STEP 1: Fetch logos for ALL items in priority list (no overflow yet)
    console.log(`\n📥 Fetching logos for ALL ${priorityList.length} POIs in priority list...`);
    const withLogos = [];
    
    for (let i = 0; i < priorityList.length; i++) {
        const item = priorityList[i];
        const poi = item.poi;
        
        console.log(`[${i + 1}/${priorityList.length}] Checking ${poi.name}...`);
        await enrichPOIWithLogo(poi);
        
        if (poi.logoUrl) {
            withLogos.push(item);
            console.log(`✅ Logo found! (${withLogos.length} total)`);
        } else {
            console.log(`❌ No logo found`);
        }
        
        // Stop early if we already have enough
        if (withLogos.length >= desiredCount) {
            console.log(`\n🎉 Got ${desiredCount} logos! Stopping early.`);
            break;
        }
        
        if (i < priorityList.length - 1) {
            await delay(2000);
        }
    }
    
    console.log(`\n📊 Total POIs with logos from priority list: ${withLogos.length}`);
    
    // ✅ STEP 2: ONLY use duplicates if we still don't have enough after trying ALL priority list
    if (withLogos.length < desiredCount && duplicates.length > 0) {
        const needed = desiredCount - withLogos.length;
        console.log(`\n📥 Still need ${needed} more. Now using duplicates (2nd/3rd instances)...`);
        
        for (let i = 0; i < duplicates.length; i++) {
            const item = duplicates[i];
            const poi = item.poi;
            
            console.log(`[Duplicate ${i + 1}] Checking ${poi.name}...`);
            await enrichPOIWithLogo(poi);
            
            if (poi.logoUrl) {
                withLogos.push(item);
                console.log(`✅ Logo found! (${withLogos.length} total)`);
                
                if (withLogos.length >= desiredCount) break;
            }
            
            if (i < duplicates.length - 1) {
                await delay(2000);
            }
        }
    }
    
    console.log(`\n📊 Final POIs with logos: ${withLogos.length}`);
    
    // ✅ STEP 3: Return up to desiredCount POIs (respecting 3 per brand limit)
    const finalResult = [];
    const finalBrandCount = new Map();
    const MAX_INSTANCES = 3;
    
    for (const item of withLogos) {
        const brandName = item.brandName;
        const currentCount = finalBrandCount.get(brandName) || 0;
        
        if (currentCount < MAX_INSTANCES) {
            finalResult.push(item.poi);
            finalBrandCount.set(brandName, currentCount + 1);
            console.log(`✅ [${finalResult.length}] ${item.poi.name} (${currentCount + 1}/${MAX_INSTANCES} of ${brandName})`);
        } else {
            console.log(`⏭️  Skipped ${item.poi.name} (already have ${MAX_INSTANCES} of ${brandName})`);
        }
        
        if (finalResult.length >= desiredCount) {
            break;
        }
    }
    
    // ✅ Final summary
    console.log(`\n📊 ${category}: Final result - ${finalResult.length} POIs`);
    console.log(`   🌟 Famous brands: ${finalResult.filter(p => isFamousBrand(p.name)).length}`);
    console.log(`   📍 Other POIs: ${finalResult.filter(p => !isFamousBrand(p.name)).length}`);
    
    // Show brand distribution
    const finalBrandDistribution = new Map();
    finalResult.forEach(poi => {
        const brand = extractBrandName(poi.name);
        finalBrandDistribution.set(brand, (finalBrandDistribution.get(brand) || 0) + 1);
    });
    
    console.log(`   📊 Brand distribution:`);
    finalBrandDistribution.forEach((count, brand) => {
        console.log(`      - ${brand}: ${count}`);
    });
    
    return finalResult;
}

/**
 * Extract base brand name from POI name
 * Example: "Starbucks Downtown" -> "starbucks"
 */
function extractBrandName(poiName) {
    // Normalize and take first significant word(s)
    const normalized = poiName.toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    
    // Take first 1-2 words as brand identifier
    const words = normalized.split(' ');
    return words.slice(0, Math.min(2, words.length)).join(' ');
}

/**
 * Fetch all POIs for all selected categories
 */
export async function fetchAllPOIs() {
    const categories = Object.keys(analysisParams.pois);

    for (let i = 0; i < categories.length; i++) {
        const cat = categories[i];
        console.log(`\nFetching category ${i + 1}/${categories.length}: ${cat}`);

        let pois = await fetchPOIsForCategory(cat);

        // Special handling for popularLocations - only show famous ones from list
        if (cat === 'popularLocations') {
            pois = await filterOnlyFamousLocations(pois, cat);
        } else {
            // For all other categories, remove POIs without logos
            pois = await removeWithoutLogos(pois, cat);
        }

        pois = pois.slice(0, analysisParams.pois[cat]);
        allPOIsDataByCategory[cat] = pois;

        if (!selectedPOIs[cat]) selectedPOIs[cat] = {};
        pois.forEach((poi, idx) => {
            selectedPOIs[cat][idx] = true;
        });

        if (i < categories.length - 1) {
            console.log('Waiting 5 seconds before next request...');
            await delay(5000);
        }
    }

    console.log('\n✓ All POI categories fetched');
    console.log('Summary:', Object.entries(allPOIsDataByCategory).map(
        ([cat, pois]) => `${cat}: ${pois.length}`
    ).join(', '));
}

/**
 * Wait for all POI logos to be fully loaded before proceeding
 */
export async function waitForAllLogosToLoad() {
    const allLoadPromises = [];
    
    for (const [category, pois] of Object.entries(allPOIsDataByCategory)) {
        pois.forEach(poi => {
            if (poi.logoUrl) {
                const loadPromise = new Promise((resolve) => {
                    const img = new Image();
                    img.onload = () => resolve(true);
                    img.onerror = () => {
                        console.warn(`Failed to load logo for ${poi.name}`);
                        resolve(false);
                    };
                    img.src = poi.logoUrl;
                });
                allLoadPromises.push(loadPromise);
            }
        });
    }
    
    await Promise.all(allLoadPromises);
    console.log('✓ All logos loaded and verified');
}