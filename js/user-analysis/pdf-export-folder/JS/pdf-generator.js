// ==================== PDF GENERATOR MAIN (WITH SATELLITE MAP) ====================

import {
  addEnhancedHeader,
  addEnhancedFooter,
  addPageNumber,
} from "./pdf-styles.js";
import { formatNumber, formatDecimal, formatCurrency } from "./pdf-helpers.js";
import { generatePDFSatelliteMap } from "./google-satellite-map.js";

/**
 * Generate complete PDF with census data
 * 🛰️ NOW USES GOOGLE SATELLITE MAP FOR PAGE 1
 * @param {Object} censusResults - Census data results
 * @param {Object} formData - Form data from footer form
 * @param {HTMLCanvasElement} mapCanvas - Canvas with map
 * @param {Object} selectedSiteLocation - Site location data
 */
export async function generatePDF(
  censusResults,
  formData,
  mapCanvas,
  selectedSiteLocation
) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF("landscape", "mm", "a4");
  const pageW = 297;
  const pageH = 210;
  const margin = 10;

  // Get original address from session storage
  const analysisParams = JSON.parse(sessionStorage.getItem('analysis_params'));
  const originalAddress = analysisParams ? analysisParams.address : selectedSiteLocation.address;

  // Extract location name
  const locationName = originalAddress.split(",")[0].trim();

  // ==================== 🛰️ GENERATE SATELLITE MAP FOR PAGE 1 ====================
  console.log('🛰️ Generating Google Satellite map for PDF page 1...');
  
  let mapDataUrl;
  
  try {
    // Get rectangleBounds from state
    const stateModule = await import('../../state.js');
    const rectangleBounds = stateModule.rectangleBounds;
    
    // Generate satellite map with overlays
    mapDataUrl = await generatePDFSatelliteMap(
      selectedSiteLocation,
      rectangleBounds,
      mapCanvas
    );
    
    console.log('✅ Using Google Satellite map for PDF page 1');
    
  } catch (error) {
    console.error('❌ Satellite map generation failed:', error);
    console.warn('⚠️ Falling back to OpenStreetMap');
    
    // Fallback to original canvas
    mapDataUrl = mapCanvas.toDataURL("image/png", 1.0);
  }

  // ==================== PAGE 1: FULL MAP (NOW SATELLITE VIEW) ====================
  addEnhancedHeader(doc, pageW, "Retailer Map");

  // Add full map with border
  const mapStartY = 20;
  const mapHeight = pageH - mapStartY - 35;
  const borderWidth = 0.5;
  const borderColor = [139, 0, 0];

  // Draw map image (satellite view)
  doc.addImage(
    mapDataUrl,
    "PNG",
    margin,
    mapStartY,
    pageW - margin * 2,
    mapHeight
  );

  // Draw dark red border around map
  doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
  doc.setLineWidth(borderWidth);
  doc.rect(margin, mapStartY, pageW - margin * 2, mapHeight);

  addEnhancedFooter(
    doc,
    pageW,
    pageH,
    formData.agent1,
    formData.agent2,
    formData.location
  );
  addPageNumber(doc, 1, 2, pageW, pageH);

  // ==================== PAGE 2: DEMOGRAPHIC REPORT ====================
  // 📝 Page 2 uses OpenStreetMap (same as before)
  doc.addPage();
  addEnhancedHeader(doc, pageW, "Demographic Analysis Report");

  // Add small overview map on right (OpenStreetMap)
  await addSmallOverviewMap(doc, pageW, pageH, selectedSiteLocation);

  // Add site location info - PASS ORIGINAL ADDRESS
  addSiteLocationInfo(doc, margin, pageW, originalAddress);

  // Add demographic tables
  addPopulationTable(doc, margin, pageW, censusResults);
  addHouseholdTable(doc, margin, pageW, censusResults);

  addEnhancedFooter(
    doc,
    pageW,
    pageH,
    formData.agent1,
    formData.agent2,
    formData.location
  );
  addPageNumber(doc, 2, 2, pageW, pageH);

  // Save PDF
  const dateStr = new Date().toISOString().slice(0, 10);
  const fileName = `Retailer_Map_${locationName.replace(
    /[^a-z0-9]/gi,
    "_"
  )}_${dateStr}.pdf`;
  doc.save(fileName);

  console.log("✅ PDF generated successfully with satellite map");
  console.log("💰 Google Maps API called ONCE for page 1 only");
}

/**
 * Add small overview map with radius circles
 * 🗺️ USES OPENSTREETMAP (unchanged)
 */
async function addSmallOverviewMap(doc, pageW, pageH, selectedSiteLocation) {
  const smallMapWidth = (pageW - 20) * 0.35;
  const smallMapHeight = 65;
  const smallMapX = pageW - 10 - smallMapWidth;
  const smallMapY = 24;

  const tempCanvas = document.createElement("canvas");
  const tempCtx = tempCanvas.getContext("2d");
  tempCanvas.width = 800;
  tempCanvas.height = 600;

  try {
    const lat = selectedSiteLocation.lat;
    const lng = selectedSiteLocation.lng;
    
    // Use zoom level 13 for better overview
    const zoom = 13;

    // Draw map tiles (OpenStreetMap)
    await drawMapTiles(tempCtx, lat, lng, zoom);

    // Draw radius circles with better visibility
    const metersPerPixelAtZoom0 = 156543.03392 * Math.cos((lat * Math.PI) / 180);
    const metersPerPixel = metersPerPixelAtZoom0 / Math.pow(2, zoom);
    
    const radius1Mile = (1609.34 / metersPerPixel);
    const radius3Mile = (4828.03 / metersPerPixel);
    const radius5Mile = (8046.72 / metersPerPixel);

    // Draw circles with white outline for visibility on satellite
    tempCtx.strokeStyle = "rgba(255, 255, 255, 0.9)";
    tempCtx.lineWidth = 6;
    [radius5Mile, radius3Mile, radius1Mile].forEach((r) => {
      tempCtx.beginPath();
      tempCtx.arc(400, 300, r, 0, 2 * Math.PI);
      tempCtx.stroke();
    });
    
    // Draw red circles on top
    tempCtx.strokeStyle = "rgba(255, 0, 0, 0.85)";
    tempCtx.lineWidth = 4;
    [radius5Mile, radius3Mile, radius1Mile].forEach((r) => {
      tempCtx.beginPath();
      tempCtx.arc(400, 300, r, 0, 2 * Math.PI);
      tempCtx.stroke();
    });

    // Draw site marker with white outline
    tempCtx.fillStyle = "white";
    tempCtx.beginPath();
    tempCtx.arc(400, 300, 14, 0, 2 * Math.PI);
    tempCtx.fill();
    
    tempCtx.fillStyle = "red";
    tempCtx.beginPath();
    tempCtx.arc(400, 300, 12, 0, 2 * Math.PI);
    tempCtx.fill();
    
    tempCtx.strokeStyle = "white";
    tempCtx.lineWidth = 3;
    tempCtx.stroke();

    const smallMapDataUrl = tempCanvas.toDataURL("image/png", 1.0);
    doc.addImage(
      smallMapDataUrl,
      "PNG",
      smallMapX,
      smallMapY,
      smallMapWidth,
      smallMapHeight
    );

    // Add decorative border
    doc.setDrawColor(139, 0, 0);
    doc.setLineWidth(1);
    doc.rect(smallMapX, smallMapY, smallMapWidth, smallMapHeight);
    
  } catch (error) {
    console.warn("Failed to generate overview map:", error);
    // Draw fallback placeholder
    tempCtx.fillStyle = "#f0f0f0";
    tempCtx.fillRect(0, 0, 800, 600);
    const fallbackUrl = tempCanvas.toDataURL("image/png", 1.0);
    doc.addImage(
      fallbackUrl,
      "PNG",
      smallMapX,
      smallMapY,
      smallMapWidth,
      smallMapHeight
    );
  }
}

/**
 * Draw map tiles on canvas (OpenStreetMap)
 */
async function drawMapTiles(ctx, lat, lng, zoom) {
  const deg2tile = (lat, lon, zoom) => {
    const latRad = (lat * Math.PI) / 180;
    const n = Math.pow(2, zoom);
    return [
      ((lon + 180) / 360) * n,
      ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) *
        n,
    ];
  };

  const [centerTileX, centerTileY] = deg2tile(lat, lng, zoom);
  const startX = Math.floor(centerTileX - 2);
  const startY = Math.floor(centerTileY - 2);
  const endX = startX + 5;
  const endY = startY + 5;

  const tileCanvas = document.createElement("canvas");
  tileCanvas.width = 1280;
  tileCanvas.height = 1280;
  const tileCtx = tileCanvas.getContext("2d");

  const tilePromises = [];
  for (let x = startX; x < endX; x++) {
    for (let y = startY; y < endY; y++) {
      const tileUrl = `https://tile.openstreetmap.org/${zoom}/${x}/${y}.png`;
      tilePromises.push(
        new Promise((resolve) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => {
            tileCtx.drawImage(
              img,
              (x - startX) * 256,
              (y - startY) * 256,
              256,
              256
            );
            resolve();
          };
          img.onerror = () => resolve();
          img.src = tileUrl;
        })
      );
    }
  }
  await Promise.all(tilePromises);

  const sitePixelX = (centerTileX - startX) * 256;
  const sitePixelY = (centerTileY - startY) * 256;
  const offsetX = sitePixelX - 400;
  const offsetY = sitePixelY - 300;
  ctx.drawImage(tileCanvas, -offsetX, -offsetY);
}

/**
 * Add site location information box with properly formatted address
 */
function addSiteLocationInfo(doc, margin, pageW, originalAddress) {
  const locationBoxWidth = (pageW - 20) * 0.6;
  let locationStartY = 29;

  // Section title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(139, 0, 0);
  doc.text("Site Location Information", margin + 5, locationStartY);

  // Parse the ORIGINAL address from dashboard form
  const addressLines = parseAddressToLines(originalAddress);

  // Calculate box height based on number of address lines
  const lineHeight = 5;
  const boxHeight = 8 + (addressLines.length * lineHeight);

  // Info box background
  doc.setFillColor(240, 245, 255);
  doc.setDrawColor(139, 0, 0);
  doc.setLineWidth(0.5);
  doc.rect(margin + 5, locationStartY + 3, locationBoxWidth - 5, boxHeight, "FD");

  // Address details
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  let locationY = locationStartY + 10;

  doc.setFont("helvetica", "bold");
  doc.text("Address:", margin + 10, locationY);
  
  // Draw each address line
  doc.setFont("helvetica", "normal");
  addressLines.forEach((line, index) => {
    const yPos = locationY + (index * lineHeight);
    doc.text(line, margin + 35, yPos);
  });
}

/**
 * Parse address into formatted lines
 */
function parseAddressToLines(address) {
  if (!address || address.trim() === '') {
    return ['N/A'];
  }

  const parts = address.split(',').map(part => part.trim()).filter(Boolean);
  
  if (parts.length === 0) {
    return ['N/A'];
  }

  const lines = [];
  
  if (parts.length >= 6) {
    const streetLine = `${parts[0]} ${parts[1]}`;
    lines.push(streetLine);
    const cityStateZip = `${parts[2]}, ${parts[3]} ${parts[4]}`;
    lines.push(cityStateZip);
    lines.push(parts[5]);
    
  } else if (parts.length === 5) {
    const secondPart = parts[1].toLowerCase();
    
    if (secondPart.length <= 3 || /^\d/.test(parts[1])) {
      lines.push(parts[0]);
      const cityStateZip = `${parts[1]}, ${parts[2]} ${parts[3]}`;
      lines.push(cityStateZip);
      lines.push(parts[4]);
    } else {
      const streetLine = `${parts[0]} ${parts[1]}`;
      lines.push(streetLine);
      const cityStateZip = `${parts[2]}, ${parts[3]} ${parts[4]}`;
      lines.push(cityStateZip);
      lines.push('USA');
    }
    
  } else if (parts.length === 4) {
    lines.push(parts[0]);
    const stateZipPattern = /^([A-Z]{2})\s+(\d{5}(-\d{4})?)$/;
    const stateZipMatch = parts[2].match(stateZipPattern);
    
    if (stateZipMatch) {
      const cityStateZip = `${parts[1]}, ${parts[2]}`;
      lines.push(cityStateZip);
      lines.push(parts[3]);
    } else {
      if (parts[2].length === 2 && /^[A-Z]{2}$/.test(parts[2])) {
        const cityState = `${parts[1]}, ${parts[2]}`;
        lines.push(cityState);
        lines.push(parts[3]);
      } else {
        lines.push(parts[0]);
        lines.push(`${parts[1]}, ${parts[2]}`);
        lines.push(parts[3]);
      }
    }
    
  } else if (parts.length === 3) {
    lines.push(parts[0]);
    lines.push(parts[1]);
    lines.push(parts[2]);
    
  } else if (parts.length === 2) {
    lines.push(parts[0]);
    lines.push(parts[1]);
    lines.push('USA');
    
  } else if (parts.length === 1) {
    lines.push(parts[0]);
  }
  
  if (lines.length === 0) {
    lines.push(address);
  }
  
  return lines;
}

/**
 * Add population and age table
 */
function addPopulationTable(doc, margin, pageW, censusResults) {
  const locationBoxWidth = (pageW - 20) * 0.6;
  let table1Y = 60;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(139, 0, 0);
  doc.text("Population & Age Demographics", margin + 5, table1Y);
  table1Y += 5;

  doc.setFillColor(139, 0, 0);
  doc.rect(margin + 5, table1Y, locationBoxWidth - 5, 8, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);

  const colMetric = margin + 8;
  const col1Mile = margin + 60;
  const col3Mile = margin + 80;
  const col5Mile = margin + 100;
  table1Y += 6;

  doc.text("Metric", colMetric, table1Y);
  doc.text("1 Mile", col1Mile, table1Y);
  doc.text("3 Mile", col3Mile, table1Y);
  doc.text("5 Mile", col5Mile, table1Y);

  const populationData = [
    {
      metric: "Total Population",
      oneMile: formatNumber(censusResults["1_mile"].population),
      threeMile: formatNumber(censusResults["3_mile"].population),
      fiveMile: formatNumber(censusResults["5_mile"].population),
    },
    {
      metric: "Avg Age",
      oneMile: formatDecimal(censusResults["1_mile"].avg_age),
      threeMile: formatDecimal(censusResults["3_mile"].avg_age),
      fiveMile: formatDecimal(censusResults["5_mile"].avg_age),
    },
    {
      metric: "Avg Age (Male)",
      oneMile: formatDecimal(censusResults["1_mile"].avg_age_male),
      threeMile: formatDecimal(censusResults["3_mile"].avg_age_male),
      fiveMile: formatDecimal(censusResults["5_mile"].avg_age_male),
    },
    {
      metric: "Avg Age (Female)",
      oneMile: formatDecimal(censusResults["1_mile"].avg_age_female),
      threeMile: formatDecimal(censusResults["3_mile"].avg_age_female),
      fiveMile: formatDecimal(censusResults["5_mile"].avg_age_female),
    },
  ];

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  table1Y += 4;

  populationData.forEach((row, idx) => {
    doc.setFillColor(idx % 2 === 0 ? 240 : 255, idx % 2 === 0 ? 245 : 255, 255);
    doc.rect(margin + 5, table1Y - 3, locationBoxWidth - 5, 6, "F");
    doc.setFont("helvetica", "bold");
    doc.text(row.metric, colMetric, table1Y);
    doc.setFont("helvetica", "normal");
    doc.text(row.oneMile, col1Mile, table1Y);
    doc.text(row.threeMile, col3Mile, table1Y);
    doc.text(row.fiveMile, col5Mile, table1Y);
    table1Y += 6;
  });

  doc.setDrawColor(150, 150, 150);
  doc.setLineWidth(0.3);
  doc.rect(margin + 5, 65, locationBoxWidth - 5, table1Y - 65);
}

/**
 * Add household and income table
 */
function addHouseholdTable(doc, margin, pageW, censusResults) {
  const locationBoxWidth = (pageW - 20) * 0.6;
  let table2Y = 105;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(139, 0, 0);
  doc.text("Households & Income", margin + 5, table2Y);
  table2Y += 5;

  doc.setFillColor(139, 0, 0);
  doc.rect(margin + 5, table2Y, locationBoxWidth - 5, 8, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);

  const colMetric = margin + 8;
  const col1Mile = margin + 60;
  const col3Mile = margin + 80;
  const col5Mile = margin + 100;
  table2Y += 6;

  doc.text("Metric", colMetric, table2Y);
  doc.text("1 Mile", col1Mile, table2Y);
  doc.text("3 Mile", col3Mile, table2Y);
  doc.text("5 Mile", col5Mile, table2Y);

  const householdData = [
    {
      metric: "Total Households",
      oneMile: formatNumber(censusResults["1_mile"].households),
      threeMile: formatNumber(censusResults["3_mile"].households),
      fiveMile: formatNumber(censusResults["5_mile"].households),
    },
    {
      metric: "Persons per HH",
      oneMile: formatDecimal(censusResults["1_mile"].avg_hh_size),
      threeMile: formatDecimal(censusResults["3_mile"].avg_hh_size),
      fiveMile: formatDecimal(censusResults["5_mile"].avg_hh_size),
    },
    {
      metric: "Avg HH Income",
      oneMile: formatCurrency(censusResults["1_mile"].avg_median_income),
      threeMile: formatCurrency(censusResults["3_mile"].avg_median_income),
      fiveMile: formatCurrency(censusResults["5_mile"].avg_median_income),
    },
    {
      metric: "Avg Home Value",
      oneMile: formatCurrency(censusResults["1_mile"].avg_median_home_value),
      threeMile: formatCurrency(censusResults["3_mile"].avg_median_home_value),
      fiveMile: formatCurrency(censusResults["5_mile"].avg_median_home_value),
    },
  ];

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  table2Y += 4;

  householdData.forEach((row, idx) => {
    doc.setFillColor(idx % 2 === 0 ? 240 : 255, idx % 2 === 0 ? 245 : 255, 255);
    doc.rect(margin + 5, table2Y - 3, locationBoxWidth - 5, 6, "F");
    doc.setFont("helvetica", "bold");
    doc.text(row.metric, colMetric, table2Y);
    doc.setFont("helvetica", "normal");
    doc.text(row.oneMile, col1Mile, table2Y);
    doc.text(row.threeMile, col3Mile, table2Y);
    doc.text(row.fiveMile, col5Mile, table2Y);
    table2Y += 6;
  });

  doc.setDrawColor(150, 150, 150);
  doc.setLineWidth(0.3);
  doc.rect(margin + 5, 110, locationBoxWidth - 5, table2Y - 110);

  const noteY = table2Y + 6;
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text("* Data derived from U.S. Census Bureau", margin + 5, noteY);
}