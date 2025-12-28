// ==================== PDF HELPER FUNCTIONS ====================
// js/user-analysis/pdf-export-folder/JS/pdf-helpers.js

/**
 * Format number with commas
 * @param {number} num - Number to format
 * @returns {string} Formatted number or 'N/A'
 */
export function formatNumber(num) {
    if (!num || isNaN(num)) return 'N/A';
    return Math.round(num).toLocaleString('en-US');
}

/**
 * Format number to decimal places
 * @param {number} num - Number to format
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted decimal or 'N/A'
 */
export function formatDecimal(num, decimals = 1) {
    if (!num || isNaN(num)) return 'N/A';
    return num.toFixed(decimals);
}

/**
 * Format number as currency
 * @param {number} num - Number to format
 * @returns {string} Formatted currency or 'N/A'
 */
export function formatCurrency(num) {
    if (!num || isNaN(num)) return 'N/A';
    return '$' + Math.round(num).toLocaleString('en-US');
}

/**
 * Calculate distance between two coordinates
 * @param {number} lat1 - Latitude 1
 * @param {number} lon1 - Longitude 1
 * @param {number} lat2 - Latitude 2
 * @param {number} lon2 - Longitude 2
 * @returns {number} Distance in miles
 */
export function getDistanceInMiles(lat1, lon1, lat2, lon2) {
    const R = 3958.8; // Earth radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

/**
 * Aggregate census data for multiple tracts
 * @param {Array} geoidList - List of geoid strings
 * @param {Map} dataMap - Map of tract data
 * @returns {Object} Aggregated data
 */
export function aggregateData(geoidList, dataMap) {
    let totalPop = 0, totalMale = 0, totalFemale = 0, totalHouseholds = 0, totalOwners = 0;
    let weightedIncomeSum = 0, weightedHomeValueSum = 0, weightedAgeSum = 0;
    let weightedAgeMaleSum = 0, weightedAgeFemaleSum = 0, weightedHHSizeSum = 0;
    let ageCount = 0, ageMaleCount = 0, ageFemaleCount = 0, hhSizeCount = 0;
    
    geoidList.forEach(geoid => {
        const d = dataMap.get(geoid);
        if (d) {
            totalPop += d.pop;
            totalMale += d.male;
            totalFemale += d.female;
            totalHouseholds += d.households;
            totalOwners += d.owners;
            
            if (d.income > 0) weightedIncomeSum += (d.income * d.households);
            if (d.homeValue > 0) weightedHomeValueSum += (d.homeValue * d.owners);
            
            if (d.medianAge > 0 && d.pop > 0) {
                weightedAgeSum += (d.medianAge * d.pop);
                ageCount += d.pop;
            }
            if (d.medianAgeMale > 0 && d.male > 0) {
                weightedAgeMaleSum += (d.medianAgeMale * d.male);
                ageMaleCount += d.male;
            }
            if (d.medianAgeFemale > 0 && d.female > 0) {
                weightedAgeFemaleSum += (d.medianAgeFemale * d.female);
                ageFemaleCount += d.female;
            }
            if (d.avgHHSize > 0 && d.households > 0) {
                weightedHHSizeSum += (d.avgHHSize * d.households);
                hhSizeCount += d.households;
            }
        }
    });
    
    return {
        population: totalPop,
        male: totalMale,
        female: totalFemale,
        households: totalHouseholds,
        avg_median_income: totalHouseholds > 0 ? Math.round(weightedIncomeSum / totalHouseholds) : 0,
        avg_median_home_value: totalOwners > 0 ? Math.round(weightedHomeValueSum / totalOwners) : 0,
        avg_age: ageCount > 0 ? (weightedAgeSum / ageCount) : 0,
        avg_age_male: ageMaleCount > 0 ? (weightedAgeMaleSum / ageMaleCount) : 0,
        avg_age_female: ageFemaleCount > 0 ? (weightedAgeFemaleSum / ageFemaleCount) : 0,
        avg_hh_size: hhSizeCount > 0 ? (weightedHHSizeSum / hhSizeCount) : 0
    };
}