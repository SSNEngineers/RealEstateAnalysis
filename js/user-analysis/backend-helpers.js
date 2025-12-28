// js/user-analysis/backend-helpers.js - NEW FILE
// Helper functions for saving UI changes to backend

const API_URL = 'http://localhost:5000/api';

// ✅ Get token
function getToken() {
  return sessionStorage.getItem('token') || localStorage.getItem('token');
}

// ✅ Get current analysis ID
function getAnalysisId() {
  return sessionStorage.getItem('current_analysis_id');
}

// ✅ Debounce function to prevent too many requests
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// ✅ Save dragged positions to backend
export const saveDraggedPositions = debounce(async (draggedPositions) => {
  const analysisId = getAnalysisId();
  const token = getToken();
  
  if (!analysisId || !token) {
    console.log('⚠️ Cannot save: No analysis ID or token');
    return;
  }

  try {
    const response = await fetch(`${API_URL}/analysis/${analysisId}/dragged`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ draggedPositions })
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Dragged positions saved to backend');
    }
  } catch (error) {
    console.error('❌ Error saving dragged positions:', error);
  }
}, 1000); // Wait 1 second after last change

// ✅ Save resized sizes to backend
export const saveResizedSizes = debounce(async (resizedSizes) => {
  const analysisId = getAnalysisId();
  const token = getToken();
  
  if (!analysisId || !token) {
    console.log('⚠️ Cannot save: No analysis ID or token');
    return;
  }

  try {
    const response = await fetch(`${API_URL}/analysis/${analysisId}/resized`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ resizedSizes })
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Resized sizes saved to backend');
    }
  } catch (error) {
    console.error('❌ Error saving resized sizes:', error);
  }
}, 1000);

// ✅ Save break points to backend
export const saveBreakPoints = debounce(async (breakPoints) => {
  const analysisId = getAnalysisId();
  const token = getToken();
  
  if (!analysisId || !token) {
    console.log('⚠️ Cannot save: No analysis ID or token');
    return;
  }

  try {
    const response = await fetch(`${API_URL}/analysis/${analysisId}/breakpoints`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ breakPoints })
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Break points saved to backend');
    }
  } catch (error) {
    console.error('❌ Error saving break points:', error);
  }
}, 1000);

// ✅ Save rotations to backend
export const saveRotations = debounce(async (rotations) => {
  const analysisId = getAnalysisId();
  const token = getToken();
  
  if (!analysisId || !token) {
    console.log('⚠️ Cannot save: No analysis ID or token');
    return;
  }

  try {
    const response = await fetch(`${API_URL}/analysis/${analysisId}/rotations`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ rotations })
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Rotations saved to backend');
    }
  } catch (error) {
    console.error('❌ Error saving rotations:', error);
  }
}, 1000);

// ✅ Save reshapes to backend
export const saveReshapes = debounce(async (reshapes) => {
  const analysisId = getAnalysisId();
  const token = getToken();
  
  if (!analysisId || !token) {
    console.log('⚠️ Cannot save: No analysis ID or token');
    return;
  }

  try {
    const response = await fetch(`${API_URL}/analysis/${analysisId}/reshapes`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ reshapes })
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Reshapes saved to backend');
    }
  } catch (error) {
    console.error('❌ Error saving reshapes:', error);
  }
}, 1000);

// ✅ Save POI selection changes to backend
export const savePOISelection = debounce(async (selectedPOIsState, selectedHighways) => {
  const analysisId = getAnalysisId();
  const token = getToken();
  
  if (!analysisId || !token) {
    console.log('⚠️ Cannot save: No analysis ID or token');
    return;
  }

  try {
    const response = await fetch(`${API_URL}/analysis/${analysisId}/data`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ 
        selectedPOIsState,
        selectedHighways
      })
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('✅ POI selection saved to backend');
    }
  } catch (error) {
    console.error('❌ Error saving POI selection:', error);
  }
}, 2000); // Wait 2 seconds to batch multiple changes