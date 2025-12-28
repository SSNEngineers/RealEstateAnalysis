// ==================== CENSUS DATA FETCHER ====================
// js/user-analysis/pdf-export-folder/JS/census-data-fetcher.js

import { getDistanceInMiles, aggregateData } from './pdf-helpers.js';

const CENSUS_API_KEY = 'f51b9aea95c15ea41fcdb2208d47feb3bf8b6c2a';

/**
 * Fetch census data by radius
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {Promise<Object>} Census data for 1, 3, and 5 mile radii
 */
export async function getCensusDataByRadius(lat, lon) {
    console.log(`Fetching census data for location: ${lat}, ${lon}...`);
    
    try {
        // Step 1: Get state and county FIPS codes
        const geoUrl = `https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/tigerWMS_Current/MapServer/8/query?geometry=${lon},${lat}&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelIntersects&outFields=STATE,COUNTY,TRACT&returnGeometry=false&f=json`;
        
        const geoResponse = await fetch(geoUrl);
        const geoData = await geoResponse.json();
        
        if (!geoData.features || geoData.features.length === 0) {
            throw new Error('Location not found or outside U.S. Census coverage');
        }
        
        const stateFips = geoData.features[0].attributes.STATE;
        const countyFips = geoData.features[0].attributes.COUNTY;
        
        // Step 2: Get all tracts in the county with their centroids
        const tigerUrl = `https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/tigerWMS_Current/MapServer/8/query?where=STATE='${stateFips}'+AND+COUNTY='${countyFips}'&outFields=STATE,COUNTY,TRACT,CENTLAT,CENTLON&returnGeometry=false&f=json`;
        
        const tigerResponse = await fetch(tigerUrl);
        const tigerData = await tigerResponse.json();
        
        if (!tigerData.features) {
            throw new Error('Could not fetch tract geometry');
        }
        
        // Step 3: Filter tracts by distance
        const tracts1Mile = [];
        const tracts3Mile = [];
        const tracts5Mile = [];
        
        tigerData.features.forEach(feature => {
            const tractLat = parseFloat(feature.attributes.CENTLAT);
            const tractLon = parseFloat(feature.attributes.CENTLON);
            const distance = getDistanceInMiles(lat, lon, tractLat, tractLon);
            const geoid = feature.attributes.STATE + feature.attributes.COUNTY + feature.attributes.TRACT;
            
            if (distance <= 1) tracts1Mile.push(geoid);
            if (distance <= 3) tracts3Mile.push(geoid);
            if (distance <= 5) tracts5Mile.push(geoid);
        });
        
        console.log(`Found tracts: 1-mile: ${tracts1Mile.length}, 3-mile: ${tracts3Mile.length}, 5-mile: ${tracts5Mile.length}`);
        
        // Step 4: Fetch ACS data for all tracts in the county
        const variables = 'B01003_001E,B01001_002E,B01001_026E,B19013_001E,B11001_001E,B25077_001E,B25003_002E,B01002_001E,B01002_002E,B01002_003E,B25010_001E';
        const acsUrl = `https://api.census.gov/data/2022/acs/acs5?get=${variables}&for=tract:*&in=state:${stateFips}&in=county:${countyFips}&key=${CENSUS_API_KEY}`;
        
        const acsResponse = await fetch(acsUrl);
        const acsData = await acsResponse.json();
        
        if (!acsData || acsData.length < 2) {
            throw new Error('No ACS data returned');
        }
        
        // Step 5: Parse ACS data into a map
        const header = acsData[0];
        const dataMap = new Map();
        
        for (let i = 1; i < acsData.length; i++) {
            const row = acsData[i];
            const tractGeoid = row[header.indexOf('state')] + 
                              row[header.indexOf('county')] + 
                              row[header.indexOf('tract')];
            
            dataMap.set(tractGeoid, {
                pop: parseInt(row[header.indexOf('B01003_001E')] || 0),
                male: parseInt(row[header.indexOf('B01001_002E')] || 0),
                female: parseInt(row[header.indexOf('B01001_026E')] || 0),
                income: parseInt(row[header.indexOf('B19013_001E')] || 0),
                households: parseInt(row[header.indexOf('B11001_001E')] || 0),
                homeValue: parseInt(row[header.indexOf('B25077_001E')] || 0),
                owners: parseInt(row[header.indexOf('B25003_002E')] || 0),
                medianAge: parseFloat(row[header.indexOf('B01002_001E')] || 0),
                medianAgeMale: parseFloat(row[header.indexOf('B01002_002E')] || 0),
                medianAgeFemale: parseFloat(row[header.indexOf('B01002_003E')] || 0),
                avgHHSize: parseFloat(row[header.indexOf('B25010_001E')] || 0)
            });
        }
        
        // Step 6: Aggregate data for each radius
        return {
            '1_mile': aggregateData(tracts1Mile, dataMap),
            '3_mile': aggregateData(tracts3Mile, dataMap),
            '5_mile': aggregateData(tracts5Mile, dataMap)
        };
        
    } catch (error) {
        console.error('Census data error:', error);
        throw error;
    }
}

/**
 * Get sample census data (fallback)
 * @returns {Object} Sample census data
 */
export function getSampleCensusData() {
    console.warn('Using sample census data');
    return {
        '1_mile': { 
            population: 12500, 
            male: 6100, 
            female: 6400, 
            households: 4800, 
            avg_median_income: 68500, 
            avg_median_home_value: 285000,
            avg_age: 38.5, 
            avg_age_male: 37.2, 
            avg_age_female: 39.8, 
            avg_hh_size: 2.6
        },
        '3_mile': { 
            population: 45800, 
            male: 22400, 
            female: 23400, 
            households: 18200, 
            avg_median_income: 72300, 
            avg_median_home_value: 310000,
            avg_age: 39.2, 
            avg_age_male: 38.1, 
            avg_age_female: 40.3, 
            avg_hh_size: 2.5
        },
        '5_mile': { 
            population: 128000, 
            male: 62500, 
            female: 65500, 
            households: 52000, 
            avg_median_income: 75800, 
            avg_median_home_value: 335000,
            avg_age: 40.1, 
            avg_age_male: 38.9, 
            avg_age_female: 41.2, 
            avg_hh_size: 2.5
        }
    };
}








