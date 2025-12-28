// js/dashboard.js - UPDATED TO USE BACKEND

const API_URL = 'http://localhost:5000/api';

const categoryIcons = {
  school: "🏫",
  hospital: "🏥",
  fast_food: "🍔",
  supermarket: "🛒",
  shopping_mall: "🏬",
  coffee_shop: "☕",
  gas_station: "⛽",
  police_station: "👮",
  fire_station: "🚒",
  bank: "🏦",
  park: "🌳",
  pharmacy: "💊",
  gym: "💪",
};

let currentMode = "separate";
let validatedAddress = null;

// ✅ Get token from storage
function getToken() {
  return sessionStorage.getItem('token') || localStorage.getItem('token');
}

// ✅ Get user from storage
function getUser() {
  const userStr = sessionStorage.getItem('user') || localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
}

// ✅ Check authentication on page load
document.addEventListener('DOMContentLoaded', function() {
  const user = getUser();
  const token = getToken();
  
  if (!user || !token) {
    alert('Please sign in to access dashboard');
    window.location.href = 'signup.html';
    return;
  }
  
  // Display user name
  if (user) {
    document.getElementById("userName").textContent =
      user.fullname || user.username || "User";
  }
  
  buildPOICategories();
});

function logout() {
  if (confirm("Are you sure you want to logout?")) {
    sessionStorage.clear();
    localStorage.clear();
    window.location.href = "/index.html";
  }
}

function showAnalysisForm() {
  document.getElementById("analysisModal").style.display = "flex";
  validatedAddress = null;
  clearValidationResults();
}

function closeAnalysisForm() {
  document.getElementById("analysisModal").style.display = "none";
  validatedAddress = null;
  clearValidationResults();
}

function toggleAddressMode(mode) {
  currentMode = mode;
  const separateMode = document.getElementById("separateMode");
  const fullMode = document.getElementById("fullMode");
  const toggleBtns = document.querySelectorAll(".toggle-btn");

  toggleBtns.forEach((btn) => btn.classList.remove("active"));

  if (mode === "separate") {
    separateMode.style.display = "block";
    fullMode.style.display = "none";
    toggleBtns[0].classList.add("active");
  } else {
    separateMode.style.display = "none";
    fullMode.style.display = "block";
    toggleBtns[1].classList.add("active");
  }
  
  validatedAddress = null;
  clearValidationResults();
}

function buildPOICategories() {
  const maxLimits = {
    park: 3,
    gym: 3,
    police_station: 2,
    fire_station: 2,
  };

  const container = document.getElementById("poiCategories");
  Object.keys(categoryIcons).forEach((cat) => {
    const maxValue = maxLimits[cat] || 15;

    const div = document.createElement("div");
    div.className = "poi-category-item";
    div.innerHTML = `
            <label>
                <input type="checkbox" name="poi_${cat}" value="${cat}">
                <span class="poi-icon">${categoryIcons[cat]}</span>
                <span class="poi-name">${cat.replace(/_/g, " ")}</span>
                <input type="number" class="poi-count" min="0" max="${maxValue}" value="0" disabled>
            </label>
        `;
    container.appendChild(div);

    const checkbox = div.querySelector('input[type="checkbox"]');
    const countInput = div.querySelector(".poi-count");
    checkbox.addEventListener("change", function () {
      if (this.checked) {
        countInput.disabled = false;
        countInput.value = Math.min(3, maxValue);
        countInput.focus();
      } else {
        countInput.disabled = true;
        countInput.value = 0;
      }
    });
  });
}

function selectAllPOIs() {
  document.querySelectorAll(".poi-category-item").forEach((item) => {
    const checkbox = item.querySelector('input[type="checkbox"]');
    const countInput = item.querySelector(".poi-count");

    checkbox.checked = true;
    countInput.disabled = false;

    const maxValue = parseInt(countInput.getAttribute("max"));
    countInput.value = Math.min(3, maxValue);
  });

  showNotification(
    "All POI categories selected (respecting max limits)",
    "success"
  );
}

function deselectAllPOIs() {
  document.querySelectorAll(".poi-category-item").forEach((item) => {
    const checkbox = item.querySelector('input[type="checkbox"]');
    const countInput = item.querySelector(".poi-count");

    checkbox.checked = false;
    countInput.disabled = true;
    countInput.value = 0;
  });

  showNotification("All POI categories deselected", "success");
}

function clearValidationResults() {
  const separateResult = document.querySelector('#separateMode .address-validation-result');
  if (separateResult) {
    separateResult.classList.remove('show', 'success', 'error', 'warning');
    separateResult.innerHTML = '';
  }
  
  const fullResult = document.querySelector('#fullMode .address-validation-result');
  if (fullResult) {
    fullResult.classList.remove('show', 'success', 'error', 'warning');
    fullResult.innerHTML = '';
  }
}

function getValidationResultDiv() {
  if (currentMode === "separate") {
    return document.querySelector('#separateMode .address-validation-result');
  } else {
    return document.querySelector('#fullMode .address-validation-result');
  }
}

async function checkAddress() {
  const resultDiv = getValidationResultDiv();
  const btn = document.querySelector(
    currentMode === "separate" 
      ? "#separateMode .btn-check-address" 
      : "#fullMode .btn-check-address"
  );

  let address = "";
  if (currentMode === "separate") {
    const parts = [
      document.getElementById("streetNumber").value,
      document.getElementById("streetName").value,
      document.getElementById("city").value,
      document.getElementById("state").value,
      document.getElementById("zipCode").value,
      document.getElementById("country").value || "USA",
    ].filter(Boolean);
    address = parts.join(", ");
  } else {
    address = document.getElementById("fullAddress").value.trim();
  }

  if (!address) {
    showNotification("Please enter an address first", "warning");
    return false;
  }

  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Checking...';
  resultDiv.className = "address-validation-result show";
  resultDiv.innerHTML =
    '<i class="fas fa-spinner fa-spin"></i> Validating address...';

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        address
      )}&limit=1`
    );
    const data = await response.json();

    if (data && data.length > 0) {
      validatedAddress = {
        original: address,
        validated: data[0].display_name,
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
      };

      resultDiv.className = "address-validation-result show success";
      resultDiv.innerHTML = `
                <i class="fas fa-check-circle"></i>
                <p>✅ Address Found!</p>
                <small>${data[0].display_name}</small>
            `;

      showNotification("Address validated successfully", "success");
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-check-circle"></i> Check Address';
      return true;
    } else {
      const suggestionResponse = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          address
        )}&limit=5`
      );
      const suggestions = await suggestionResponse.json();

      if (suggestions && suggestions.length > 0) {
        const suggestion = suggestions[0];

        resultDiv.className = "address-validation-result show warning";
        resultDiv.innerHTML = `
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>⚠️ Address Not Found</p>
                    <small>Did you mean:</small>
                    <p style="margin-top: 10px; font-weight: bold;">${
                      suggestion.display_name
                    }</p>
                    <div class="address-suggestion-buttons">
                        <button class="btn-accept-suggestion" onclick="acceptSuggestion('${btoa(
                          suggestion.display_name
                        )}', ${suggestion.lat}, ${suggestion.lon})">
                            <i class="fas fa-check"></i> Yes, Use This
                        </button>
                        <button class="btn-reject-suggestion" onclick="rejectSuggestion()">
                            <i class="fas fa-times"></i> No, Keep Mine
                        </button>
                    </div>
                `;
        
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-check-circle"></i> Check Address';
        return false;
      } else {
        resultDiv.className = "address-validation-result show error";
        resultDiv.innerHTML = `
                    <i class="fas fa-times-circle"></i>
                    <p>❌ Address Not Found</p>
                    <small>Please check your address and try again</small>
                `;
        validatedAddress = null;
        
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-check-circle"></i> Check Address';
        return false;
      }
    }
  } catch (error) {
    console.error("Address validation error:", error);
    resultDiv.className = "address-validation-result show error";
    resultDiv.innerHTML = `
            <i class="fas fa-times-circle"></i>
            <p>Error checking address</p>
            <small>Please try again</small>
        `;
    validatedAddress = null;
    
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-check-circle"></i> Check Address';
    return false;
  }
}

function acceptSuggestion(encodedAddress, lat, lng) {
  const suggestedAddress = atob(encodedAddress);

  if (currentMode === "separate") {
    const parts = suggestedAddress.split(", ");
    if (parts.length >= 4) {
      document.getElementById("streetNumber").value = parts[0] || "";
      document.getElementById("streetName").value = parts[1] || "";
      document.getElementById("city").value = parts[2] || "";
      document.getElementById("state").value = parts[3] || "";
      if (parts.length >= 5) {
        document.getElementById("zipCode").value = parts[4] || "";
      }
    }
  } else {
    document.getElementById("fullAddress").value = suggestedAddress;
  }

  validatedAddress = {
    original: suggestedAddress,
    validated: suggestedAddress,
    lat: lat,
    lng: lng,
  };

  const resultDiv = getValidationResultDiv();
  resultDiv.className = "address-validation-result show success";
  resultDiv.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <p>✅ Address Updated!</p>
        <small>${suggestedAddress}</small>
    `;

  showNotification("Address updated successfully", "success");
}

function rejectSuggestion() {
  const resultDiv = getValidationResultDiv();
  resultDiv.className = "address-validation-result show";
  resultDiv.innerHTML = `
        <i class="fas fa-info-circle"></i>
        <p>Please correct your address and check again</p>
    `;
  validatedAddress = null;
}

// ✅ UPDATED: Form submission with backend integration
document
  .getElementById("locationForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault();

    // Get address
    let address = "";
    if (currentMode === "separate") {
      const parts = [
        document.getElementById("streetNumber").value,
        document.getElementById("streetName").value,
        document.getElementById("city").value,
        document.getElementById("state").value,
        document.getElementById("zipCode").value,
        document.getElementById("country").value || "USA",
      ].filter(Boolean);
      address = parts.join(", ");
    } else {
      address = document.getElementById("fullAddress").value.trim();
    }

    if (!address) {
      showNotification("Please enter an address", "error");
      return;
    }

    // If address not validated yet, validate it first
    if (!validatedAddress) {
      showNotification("Validating address...", "info");
      const isValid = await checkAddress();

      if (!isValid) {
        const resultDiv = getValidationResultDiv();
        if (resultDiv.classList.contains("warning")) {
          showNotification(
            "Please accept or reject the suggested address",
            "warning"
          );
        } else {
          showNotification(
            "Address not found. Please check the address first.",
            "error"
          );
        }
        return;
      }
    }

    // Validate radius
    let radius = parseFloat(document.getElementById("searchRadius").value);
    if (radius > 3) radius = 3;

    // Get selected POIs
    const selectedPOIs = {};
    document.querySelectorAll(".poi-category-item").forEach((item) => {
      const checkbox = item.querySelector('input[type="checkbox"]');
      const countInput = item.querySelector(".poi-count");
      if (checkbox.checked && countInput.value > 0) {
        const count = Math.min(parseInt(countInput.value), 15);
        selectedPOIs[checkbox.value] = count;
      }
    });

    if (Object.keys(selectedPOIs).length === 0) {
      showNotification(
        "Please select at least one POI category with count > 0",
        "error"
      );
      return;
    }

    // ✅ NEW: Create analysis in backend
    const token = getToken();
    if (!token) {
      showNotification('Authentication required', 'error');
      window.location.href = 'signup.html';
      return;
    }

    try {
      showNotification("Creating analysis...", "info");
      
      const response = await fetch(`${API_URL}/analysis/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          address: address,
          radius: radius,
          pois: selectedPOIs
        })
      });

      const data = await response.json();

      if (!data.success) {
        showNotification(data.message || 'Failed to create analysis', 'error');
        return;
      }

      console.log('✅ Analysis created:', data.analysisId);

      // ✅ Store analysisId in sessionStorage for user-analysis page
      sessionStorage.setItem('current_analysis_id', data.analysisId);

      showNotification("Analysis created! Redirecting...", "success");

      setTimeout(() => {
        console.log("Redirecting to user-analysis.html");
        window.location.href = "user-analysis.html";
      }, 1000);

    } catch (error) {
      console.error('❌ Create analysis error:', error);
      showNotification('Network error. Please try again.', 'error');
    }
  });

function showNotification(message, type) {
  const existing = document.querySelector(".notification");
  if (existing) existing.remove();

  const notification = document.createElement("div");
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
        <i class="fas ${
          type === "success" ? "fa-check-circle" : "fa-exclamation-circle"
        }"></i>
        <span>${message}</span>
    `;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = "slideOut 0.3s ease";
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}