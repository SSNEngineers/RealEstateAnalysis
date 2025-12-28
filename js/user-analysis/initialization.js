// js/user-analysis/initialization.js - FINAL FIXED VERSION
// REPLACE THE ENTIRE FILE WITH THIS CODE

import {
  setAnalysisParams,
  setSelectedSiteLocation,
  setRectangleBounds,
  analysisParams,
} from "./state.js";
import {
  calculateRectangleBounds,
  calculateAllPixelCoordinatesWithValidation,
} from "./coordinates.js";
import {
  showInstructionsPopup,
  setupLoadingDelayPopups,
} from "./popups.js";
import { fetchAllPOIs, waitForAllLogosToLoad } from "./api-fetching.js";
import { fetchHighways } from "./highway-fetching.js";
import { createPOIClusters } from "./clustering.js";
import { updateInfoPanels } from "./ui-updates.js";
import { renderStaticMap } from "./main-render.js";
import { delay } from "./utilities.js";
import { debounce } from "./utilities.js";
import { updateCanvasSize } from "./canvas-setup.js";
import { redrawStaticMap } from "./main-render.js";

const API_URL = 'http://localhost:5000/api';

// ✅ Get token from storage
function getToken() {
  return sessionStorage.getItem('token') || localStorage.getItem('token');
}

// ✅ Get user from storage
function getUser() {
  const userStr = sessionStorage.getItem('user') || localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
}

// ✅ Get current analysis ID
function getAnalysisId() {
  return sessionStorage.getItem('current_analysis_id');
}

// ✅ Convert MongoDB Map to plain object
function convertMapToObject(mapData) {
  if (!mapData) return {};
  
  // If it's already a plain object, return it
  if (typeof mapData === 'object' && !Array.isArray(mapData)) {
    return mapData;
  }
  
  // If it's a Map, convert it
  if (mapData instanceof Map) {
    return Object.fromEntries(mapData);
  }
  
  return mapData;
}

// ✅ Save data to backend
async function saveAnalysisData(analysisId, dataType, data) {
  const token = getToken();
  if (!token) {
    console.error('No token found');
    return false;
  }

  try {
    const response = await fetch(`${API_URL}/analysis/${analysisId}/${dataType}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();
    
    if (!result.success) {
      console.error(`Failed to save ${dataType}:`, result.message);
      return false;
    }

    console.log(`✅ Saved ${dataType} to backend`);
    return true;
  } catch (error) {
    console.error(`❌ Error saving ${dataType}:`, error);
    return false;
  }
}

// ✅ Load analysis from backend
async function loadAnalysisFromBackend(analysisId) {
  const token = getToken();
  if (!token) {
    console.error('No token found');
    return null;
  }

  try {
    const response = await fetch(`${API_URL}/analysis/${analysisId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const result = await response.json();
    
    if (!result.success) {
      console.error('Failed to load analysis:', result.message);
      return null;
    }

    console.log('✅ Analysis loaded from backend');
    return result.analysis;
  } catch (error) {
    console.error('❌ Error loading analysis:', error);
    return null;
  }
}

/**
 * Main initialization on window load
 */
export async function initializeAnalysis() {
  try {
    // START TIMER
    if (window.startAnalysisTimer) {
      window.startAnalysisTimer();
    }

    // ✅ Check authentication
    const user = getUser();
    const token = getToken();
    
    if (!user || !token) {
      console.error('No authentication found');
      alert('Please sign in to access analysis');
      window.location.href = 'signup.html';
      return;
    }

    // ✅ Get analysis ID from session
    const analysisId = getAnalysisId();
    
    if (!analysisId) {
      console.error('No analysis ID found');
      alert('No analysis found. Please create a new analysis.');
      window.location.href = 'dashboard.html';
      return;
    }

    console.log('📊 Loading analysis:', analysisId);

    // ✅ Try to load existing analysis data from backend
    const existingAnalysis = await loadAnalysisFromBackend(analysisId);
    
    if (existingAnalysis && existingAnalysis.status === 'completed') {
      console.log('✅ Found completed analysis, restoring...');
      await restoreCompletedAnalysis(existingAnalysis);
      return;
    }

    // ✅ If no completed analysis, start new analysis
    if (!existingAnalysis) {
      console.error('Analysis not found in backend');
      alert('Analysis not found. Please create a new analysis.');
      window.location.href = 'dashboard.html';
      return;
    }

    // Get analysis parameters from backend (MongoDB stores Map as object)
    const params = {
      address: existingAnalysis.address,
      radius: existingAnalysis.radius,
      pois: convertMapToObject(existingAnalysis.selectedPOIs)
    };

    setAnalysisParams(params);

    // Start analysis
    await performAnalysis(analysisId);
    
  } catch (error) {
    console.error("Initialization error:", error);
    alert("Error initializing analysis: " + error.message);
  }
}

/**
 * Restore completed analysis from backend
 */
async function restoreCompletedAnalysis(analysis) {
  try {
    console.log('🔄 Restoring completed analysis...');

    // Set analysis parameters (MongoDB Map → plain object)
    setAnalysisParams({
      address: analysis.address,
      radius: analysis.radius,
      pois: convertMapToObject(analysis.selectedPOIs)
    });

    // Set site location
    if (analysis.siteLocation) {
      setSelectedSiteLocation(analysis.siteLocation);
    }

    // Set rectangle bounds
    if (analysis.rectangleBounds) {
      setRectangleBounds(analysis.rectangleBounds);
    }

    // Restore all POIs data (MongoDB Map → plain object)
    if (analysis.allPOIsData) {
      const allPOIsDataByCategory = convertMapToObject(analysis.allPOIsData);
      const { setAllPOIsDataByCategory } = await import('./state.js');
      setAllPOIsDataByCategory(allPOIsDataByCategory);
    }

    // Restore highway data
    if (analysis.highwayData) {
      const { setHighwayData } = await import('./state.js');
      setHighwayData(analysis.highwayData);
    }

    // Restore selected POIs (MongoDB Map → plain object)
    if (analysis.selectedPOIsState) {
      const { setSelectedPOIs } = await import('./state.js');
      setSelectedPOIs(convertMapToObject(analysis.selectedPOIsState));
    }

    // Restore selected highways
    if (analysis.selectedHighways) {
      const { setSelectedHighways } = await import('./state.js');
      setSelectedHighways(analysis.selectedHighways);
    }

    // Restore clusters
    if (analysis.clusters) {
      const { setPOIClusters } = await import('./state.js');
      setPOIClusters(analysis.clusters);
    }

    // Restore dragged positions
    if (analysis.draggedPositions) {
      const { permanentDraggedPositions } = await import('./state.js');
      Object.assign(permanentDraggedPositions, {
        pois: convertMapToObject(analysis.draggedPositions.pois),
        clusters: convertMapToObject(analysis.draggedPositions.clusters),
        highways: convertMapToObject(analysis.draggedPositions.highways),
        siteMarker: analysis.draggedPositions.siteMarker
      });
    }

    // Restore resized sizes
    if (analysis.resizedSizes) {
      const { permanentResizedSizes } = await import('./state.js');
      Object.assign(permanentResizedSizes, {
        pois: convertMapToObject(analysis.resizedSizes.pois),
        clusters: convertMapToObject(analysis.resizedSizes.clusters),
        highways: convertMapToObject(analysis.resizedSizes.highways),
        siteMarker: analysis.resizedSizes.siteMarker
      });
    }

    // Restore break points (MongoDB Map → plain object)
    if (analysis.breakPoints) {
      const { breakPoints } = await import('./state.js');
      Object.assign(breakPoints, convertMapToObject(analysis.breakPoints));
    }

    // Restore rotations (MongoDB Map → plain object)
    if (analysis.rotations) {
      const { permanentRotations } = await import('./state.js');
      Object.assign(permanentRotations, convertMapToObject(analysis.rotations));
    }

    // Restore reshapes (MongoDB Map → plain object)
    if (analysis.reshapes) {
      const { permanentReshapes } = await import('./state.js');
      Object.assign(permanentReshapes, convertMapToObject(analysis.reshapes));
    }

    // Hide loading, show content
    document.getElementById("loadingOverlay").style.display = "none";
    document.getElementById("mainContent").style.display = "grid";

    console.log("Updating UI panels...");
    updateInfoPanels();

    console.log("Rendering restored map...");
    await renderStaticMap();

    window.analysisComplete = true;

    console.log("✅ Analysis restored from backend!");

    // STOP TIMER
    if (window.stopAnalysisTimer) {
      window.stopAnalysisTimer();
    }

    // Show instructions popup
    setTimeout(() => {
      showInstructionsPopup();
    }, 1000);

  } catch (error) {
    console.error('❌ Error restoring analysis:', error);
    alert('Error restoring analysis. Please try again.');
    window.location.href = 'dashboard.html';
  }
}

/**
 * Main analysis flow
 */
export async function performAnalysis(analysisId) {
  try {
    // ✅ START loading delay popup system with POI category count
    const poiCategoryCount = Object.keys(analysisParams.pois).length;
    const stopLoadingPopups = setupLoadingDelayPopups(poiCategoryCount);
    console.log(`📊 Analysis started with ${poiCategoryCount} POI categories`);

    // Geocode address
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        analysisParams.address
      )}&limit=1`
    );
    const data = await response.json();

    if (data && data.length > 0) {
      const location = {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
        address: data[0].display_name,
      };
      setSelectedSiteLocation(location);

      console.log(`Site location: ${location.lat}, ${location.lng}`);

      // Calculate rectangle bounds with padding
      const bounds = calculateRectangleBounds(
        location.lat,
        location.lng,
        analysisParams.radius
      );
      setRectangleBounds(bounds);

      console.log("Rectangle bounds calculated:", bounds);

      // ✅ Save site location and bounds to backend
      await saveAnalysisData(analysisId, 'data', {
        siteLocation: location,
        rectangleBounds: bounds,
        status: 'processing'
      });

      // Fetch all data
      console.log("Fetching POIs...");
      await fetchAllPOIs();

      console.log("Waiting before highway fetch...");
      await delay(2000);

      console.log("Fetching highways...");
      await fetchHighways();

      // Calculate pixel coordinates with validation
      console.log("Calculating coordinates...");
      calculateAllPixelCoordinatesWithValidation();

      // Wait for all logos to be fully loaded before clustering
      console.log("Waiting for all logos to load...");
      await waitForAllLogosToLoad();

      // Create clusters AFTER all logos are loaded
      console.log("Creating clusters...");
      createPOIClusters();

      // ✅ Save all data to backend
      const { allPOIsDataByCategory, highwayData, selectedPOIs, selectedHighways, poiClusters } = await import('./state.js');
      
      await saveAnalysisData(analysisId, 'data', {
        allPOIsData: allPOIsDataByCategory,
        highwayData: highwayData,
        selectedPOIsState: selectedPOIs,
        selectedHighways: selectedHighways,
        clusters: poiClusters,
        status: 'completed'
      });

      // ✅ Mark analysis as completed (updates user stats)
      const token = getToken();
      await fetch(`${API_URL}/analysis/${analysisId}/complete`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('✅ Analysis marked as completed in backend');

      // Hide loading, show content
      document.getElementById("loadingOverlay").style.display = "none";
      document.getElementById("mainContent").style.display = "grid";

      console.log("Updating UI panels...");
      updateInfoPanels();

      console.log("Rendering static map...");
      await renderStaticMap();

      window.analysisComplete = true;

      console.log("✅ Analysis complete!");

      // STOP TIMER
      if (window.stopAnalysisTimer) {
        window.stopAnalysisTimer();
      }

      // ✅ Stop loading popups
      stopLoadingPopups();

      // ✅ Show instructions popup after 1 second
      setTimeout(() => {
        showInstructionsPopup();
      }, 1000);
    } else {
      alert("Location not found");
      window.location.href = "dashboard.html";
    }
  } catch (error) {
    console.error("Analysis error:", error);
    alert("Error performing analysis: " + error.message);
    console.error("Stack trace:", error.stack);
  }
}

/**
 * Setup window resize handler
 */
export function setupResizeHandler() {
  const handleResize = debounce(() => {
    console.log("Window resized, updating canvas...");
    updateCanvasSize();

    if (window.analysisComplete) {
      calculateAllPixelCoordinatesWithValidation();
      createPOIClusters();
      redrawStaticMap();
    }
  }, 300);

  window.addEventListener("resize", handleResize);
}

/**
 * Setup error handlers
 */
export function setupErrorHandlers() {
  window.addEventListener("error", (event) => {
    console.error("Global error caught:", event.error);

    const loadingOverlay = document.getElementById("loadingOverlay");
    if (loadingOverlay) {
      loadingOverlay.innerHTML = `
        <div class="loading-content">
          <h2 style="color: #dc3545;">Error</h2>
          <p>Something went wrong: ${event.error.message}</p>
          <button onclick="window.location.href='dashboard.html'" 
                  style="margin-top: 20px; padding: 10px 20px; background: white; color: #8B0000; border: none; border-radius: 5px; cursor: pointer;">
            Return to Dashboard
          </button>
        </div>
      `;
    }
  });

  window.addEventListener("unhandledrejection", (event) => {
    console.error("Unhandled promise rejection:", event.reason);
  });
}

/**
 * Cleanup on page unload
 */
export function setupCleanupHandlers() {
  window.addEventListener("beforeunload", () => {
    console.log("Cleaning up...");
  });
}

// ✅ Export save function for other modules to use
export { saveAnalysisData, getAnalysisId };