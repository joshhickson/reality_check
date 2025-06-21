
// Hypocycloid Board Designer
// Interactive tool for fine-tuning Reality Check board parameters

const DEFAULT_RINGS = [
  { label: "Career", cusps: 3, R: 142, color: "#ff6b6b" },
  { label: "Health", cusps: 4, R: 99, color: "#feca57" },
  { label: "Social", cusps: 5, R: 47, color: "#48dbfb" },
  { label: "Personal", cusps: 6, R: 150, color: "#1dd1a1" },
  { label: "BabelEvents", cusps: 2, R: 160, color: "#5f27cd" },
];

let designerRings = JSON.parse(JSON.stringify(DEFAULT_RINGS));
const DESIGNER_SEGMENTS = 10;
const DESIGNER_STEPS = 360;

// Rotating hand parameters
let handSettings = {
  tickInterval: 1,     // seconds between movements
  handLength: 178,     // length of the hand
  handColor: "#ffffff",
  handWidth: 1,
  enabled: true,
  rotationSpeed: 1     // degrees per tick
};

let handRotation = 0;  // current angle in degrees
let lastTickTime = 0;
let animationId = null;
let boardPoints = [];  // Will store all point positions and data
let countdownInterval = null;
let currentPoint = 0;  // current point index for hand tracking

// Advanced point control system
let manualPointMode = false;
let pointEditMode = false;
let customPointPositions = {}; // ring -> [custom positions]
let draggedPoint = null;
let selectedRing = null;
let pointCounts = {}; // ring -> custom point count
let overlappingPoints = []; // points currently overlapped by hand

// Generate hypocycloid points for designer
function generateDesignerHypocycloid(R, cusps, steps) {
  const r = R / cusps;
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const t = (Math.PI * 2 * i) / steps;
    const x = (R - r) * Math.cos(t) + r * Math.cos(((R - r) / r) * t);
    const y = (R - r) * Math.sin(t) - r * Math.sin(((R - r) / r) * t);
    pts.push([x, y]);
  }
  return pts;
}

function createDesignerSVGElement(tag, attrs) {
  const el = document.createElementNS("http://www.w3.org/2000/svg", tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  return el;
}

function pathFromDesignerPoints(pts) {
  return pts.map((p, idx) => (idx === 0 ? `M ${p[0]} ${p[1]}` : `L ${p[0]} ${p[1]}`)).join(" ") + " Z";
}

function drawDesignerBoard() {
  const svg = document.getElementById("designerBoard");
  if (!svg) return;
  
  svg.innerHTML = "";
  boardPoints = []; // Reset board points array

  designerRings.forEach((ring, ringIndex) => {
    const pts = generateDesignerHypocycloid(ring.R, ring.cusps, DESIGNER_STEPS);
    
    // Draw the ring path
    const path = createDesignerSVGElement("path", {
      d: pathFromDesignerPoints(pts),
      fill: "none",
      stroke: ring.color,
      "stroke-width": 2,
      opacity: 0.8,
      "data-ring": ring.label
    });
    svg.appendChild(path);

    // Get point count for this ring (custom or default)
    const pointCount = pointCounts[ring.label] || DESIGNER_SEGMENTS;
    
    // Add tile markers and store point data
    for (let i = 0; i < pointCount; i++) {
      const position = getPointPosition(ring, i, pointCount, pts);
      const x = position.x;
      const y = position.y;
      
      // Store point data for hand targeting
      const pointData = {
        x: x,
        y: y,
        ring: ring.label,
        ringIndex: ringIndex,
        pointIndex: i,
        globalIndex: boardPoints.length,
        color: ring.color,
        angle: Math.atan2(y, x) * 180 / Math.PI,
        curveParam: position.curveParam // parameter along curve (0-1)
      };
      boardPoints.push(pointData);
      
      const tile = createDesignerSVGElement("circle", {
        cx: x,
        cy: y,
        r: 3,
        fill: ring.color,
        stroke: "#fff",
        "stroke-width": 0.5,
        "data-point-index": pointData.globalIndex,
        "data-ring": ring.label,
        "data-point-local": i,
        class: selectedRing === ring.label ? "selected-ring-point" : ""
      });
      
      // Make points interactive for selection and editing
      tile.style.cursor = "pointer";
      tile.addEventListener('click', (e) => selectPoint(pointData, e));
      
      svg.appendChild(tile);
    }
  });

  // Add center point
  const center = createDesignerSVGElement("circle", {
    cx: 0,
    cy: 0,
    r: 6,
    fill: "#fff",
    stroke: "#333",
    "stroke-width": 1
  });
  svg.appendChild(center);
  
  // Draw rotating hand if enabled
  if (handSettings.enabled) {
    drawRotatingHand(svg);
  }
  
  // Add ring selection highlights
  if (selectedRing) {
    highlightSelectedRing();
  }
  
  updateCodeOutput();
}

function drawRotatingHand(svg) {
  // Calculate hand end position based on rotation angle
  const angleRad = (handRotation - 90) * Math.PI / 180; // -90 to start at top
  const endX = Math.cos(angleRad) * handSettings.handLength;
  const endY = Math.sin(angleRad) * handSettings.handLength;
  
  // Hand line
  const handLine = createDesignerSVGElement("line", {
    x1: 0,
    y1: 0,
    x2: endX,
    y2: endY,
    stroke: handSettings.handColor,
    "stroke-width": handSettings.handWidth,
    "stroke-linecap": "round"
  });
  svg.appendChild(handLine);
  
  // Hand tip
  const handTip = createDesignerSVGElement("circle", {
    cx: endX,
    cy: endY,
    r: 6,
    fill: handSettings.handColor,
    stroke: "#000",
    "stroke-width": 2
  });
  svg.appendChild(handTip);
  
  // Check if hand is near any points and highlight them
  highlightNearbyPoints(endX, endY);
}

function highlightNearbyPoints(handX, handY) {
  const svg = document.getElementById("designerBoard");
  const threshold = 15; // distance threshold for "landing on" a point
  overlappingPoints = []; // Reset overlap tracking
  
  boardPoints.forEach(point => {
    const distance = Math.sqrt((handX - point.x)**2 + (handY - point.y)**2);
    const pointElement = svg.querySelector(`[data-point-index="${point.globalIndex}"]`);
    
    if (pointElement) {
      if (distance <= threshold) {
        // Hand is near this point - highlight it and track overlap
        pointElement.setAttribute("r", "5");
        pointElement.setAttribute("fill", "#ffff00");
        pointElement.setAttribute("stroke-width", "2");
        overlappingPoints.push(point);
      } else {
        // Reset to normal
        const baseRadius = selectedRing === point.ring ? "4" : "3";
        pointElement.setAttribute("r", baseRadius);
        pointElement.setAttribute("fill", point.color);
        pointElement.setAttribute("stroke-width", "0.5");
      }
    }
  });
  
  // Update overlap display
  updateOverlapDisplay();
}

function updateOverlapDisplay() {
  const overlapElement = document.getElementById("overlap-counter");
  if (overlapElement) {
    if (overlappingPoints.length > 0) {
      const rings = [...new Set(overlappingPoints.map(p => p.ring))];
      overlapElement.textContent = `Overlapping ${overlappingPoints.length} point(s) across ${rings.length} ring(s): ${rings.join(', ')}`;
      overlapElement.style.color = "#ffff00";
    } else {
      overlapElement.textContent = "No points overlapped";
      overlapElement.style.color = "#888";
    }
  }
}

function animateHand(currentTime) {
  if (!lastTickTime) lastTickTime = currentTime;
  const deltaTime = currentTime - lastTickTime;
  
  if (handSettings.enabled && handSettings.tickInterval > 0) {
    // Update countdown display
    const timeUntilNextTick = handSettings.tickInterval - (deltaTime / 1000);
    updateCountdownDisplay(Math.max(0, timeUntilNextTick));
    
    // Check if it's time to rotate
    if (deltaTime >= handSettings.tickInterval * 1000) {
      handRotation = (handRotation + handSettings.rotationSpeed) % 360;
      lastTickTime = currentTime;
      drawDesignerBoard();
      
      // Check if hand landed on any points
      checkHandLanding();
    }
  }
  
  animationId = requestAnimationFrame(animateHand);
}

function checkHandLanding() {
  const angleRad = (handRotation - 90) * Math.PI / 180;
  const handX = Math.cos(angleRad) * handSettings.handLength;
  const handY = Math.sin(angleRad) * handSettings.handLength;
  const threshold = 15;
  
  boardPoints.forEach(point => {
    const distance = Math.sqrt((handX - point.x)**2 + (handY - point.y)**2);
    if (distance <= threshold) {
      console.log(`Hand landed near point ${point.globalIndex}:`, point);
      onHandLandedOnPoint(point);
    }
  });
}

function updateCountdownDisplay(timeRemaining) {
  const countdownElement = document.getElementById("countdown-timer");
  if (countdownElement) {
    countdownElement.textContent = `Next tick in: ${timeRemaining.toFixed(1)}s`;
    
    // Color-code based on time remaining
    if (timeRemaining < 3) {
      countdownElement.style.color = "#ff6b6b";
    } else if (timeRemaining < 5) {
      countdownElement.style.color = "#feca57";
    } else {
      countdownElement.style.color = "#48dbfb";
    }
  }
}

function startHandAnimation() {
  if (animationId) {
    cancelAnimationFrame(animationId);
  }
  lastTickTime = 0;
  animationId = requestAnimationFrame(animateHand);
}

function stopHandAnimation() {
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
  
  // Reset countdown display
  const countdownElement = document.getElementById("countdown-timer");
  if (countdownElement) {
    countdownElement.textContent = "Hand stopped";
    countdownElement.style.color = "#888";
  }
}

function setupDesignerControls() {
  const container = document.getElementById("ringControls");
  if (!container) return;
  
  container.innerHTML = "";
  
  // Add hand controls first
  const handControlDiv = document.createElement("div");
  handControlDiv.className = "ring-control";
  handControlDiv.style.borderLeftColor = "#ffffff";
  handControlDiv.innerHTML = `
    <h4 style="margin: 0 0 10px 0; color: #ffffff;">⏱️ Ticking Hand</h4>
    <div id="countdown-timer" style="font-size: 14px; font-weight: bold; margin-bottom: 10px; padding: 5px; background: rgba(0,0,0,0.3); border-radius: 3px; text-align: center;">
      Next tick in: ${handSettings.tickInterval.toFixed(1)}s
    </div>
    <label>
      <input type="checkbox" ${handSettings.enabled ? 'checked' : ''} 
             onchange="updateHandParameter('enabled', this.checked)"> Enable Hand
    </label>
    <label>
      Tick Interval: <span id="hand-tick-val">${handSettings.tickInterval}s</span>
      <input type="range" min="1" max="60" step="1" value="${handSettings.tickInterval}" 
             oninput="updateHandParameter('tickInterval', parseInt(this.value)); document.getElementById('hand-tick-val').textContent = this.value + 's';">
    </label>
    <label>
      Rotation: <span id="hand-rotation-val">${Math.round(handRotation)}°</span>
      <input type="range" min="0" max="359" value="${Math.round(handRotation)}" 
             oninput="updateHandParameter('handRotation', parseInt(this.value)); document.getElementById('hand-rotation-val').textContent = this.value + '°';">
    </label>
    <label>
      Speed: <span id="rotation-speed-val">${handSettings.rotationSpeed}°/tick</span>
      <input type="range" min="1" max="36" value="${handSettings.rotationSpeed}" 
             oninput="updateHandParameter('rotationSpeed', parseInt(this.value)); document.getElementById('rotation-speed-val').textContent = this.value + '°/tick';">
    </label>
    <label>
      Length: <span id="hand-length-val">${handSettings.handLength}</span>
      <input type="range" min="50" max="200" value="${handSettings.handLength}" 
             oninput="updateHandParameter('handLength', parseInt(this.value)); document.getElementById('hand-length-val').textContent = this.value;">
    </label>
    <label>
      Width: <span id="hand-width-val">${handSettings.handWidth}px</span>
      <input type="range" min="1" max="8" value="${handSettings.handWidth}" 
             oninput="updateHandParameter('handWidth', parseInt(this.value)); document.getElementById('hand-width-val').textContent = this.value + 'px';">
    </label>
    <label>
      Color: <input type="color" value="${handSettings.handColor}" 
                   onchange="updateHandParameter('handColor', this.value)">
    </label>
    <div style="margin-top: 10px;">
      <button onclick="resetHandPosition()" style="font-size: 12px; padding: 5px 10px;">Reset Position</button>
      <button onclick="simulatePlayerTurn()" style="font-size: 12px; padding: 5px 10px;">Simulate Turn</button>
    </div>
    <div style="margin-top: 15px; border-top: 1px solid rgba(255,255,255,0.3); padding-top: 15px;">
      <h4 style="margin: 0 0 10px 0; color: #ffffff;">🎯 Point Management</h4>
      <div id="overlap-counter" style="font-size: 12px; margin-bottom: 10px; padding: 5px; background: rgba(0,0,0,0.3); border-radius: 3px;">
        No points overlapped
      </div>
      <label>
        Ring Selection:
        <select onchange="selectRingForEditing(this.value)" style="margin-left: 5px;">
          <option value="">Select Ring...</option>
          ${designerRings.map(ring => `<option value="${ring.label}" ${selectedRing === ring.label ? 'selected' : ''}>${ring.label}</option>`).join('')}
        </select>
      </label>
      <div id="ring-point-controls" style="margin-top: 10px; display: ${selectedRing ? 'block' : 'none'};">
        <label>
          Point Count: <span id="point-count-display">${selectedRing ? (pointCounts[selectedRing] || DESIGNER_SEGMENTS) : DESIGNER_SEGMENTS}</span>
          <input type="range" min="2" max="20" value="${selectedRing ? (pointCounts[selectedRing] || DESIGNER_SEGMENTS) : DESIGNER_SEGMENTS}" 
                 oninput="updatePointCount(this.value)" style="width: 100px;">
        </label>
        <div style="margin-top: 5px;">
          <button onclick="addPointToRing()" style="font-size: 12px; padding: 3px 8px;">Add Point</button>
          <button onclick="removePointFromRing()" style="font-size: 12px; padding: 3px 8px;">Remove Point</button>
          <button onclick="resetRingPoints()" style="font-size: 12px; padding: 3px 8px;">Reset Ring</button>
        </div>
      </div>
      <label style="margin-top: 10px; display: block;">
        <input type="checkbox" ${manualPointMode ? 'checked' : ''} 
               onchange="toggleManualPointMode(this.checked)"> Enable Curve Snapping
      </label>
      <div style="margin-top: 10px;">
        <button onclick="enterPointEditMode()" style="font-size: 12px; padding: 5px 10px;">Edit Mode</button>
        <button onclick="resetAllPoints()" style="font-size: 12px; padding: 5px 10px;">Reset All</button>
        <button onclick="distributePointsEvenly()" style="font-size: 12px; padding: 5px 10px;">Even Distribution</button>
      </div>
    </div>
    <div style="margin-top: 15px; border-top: 1px solid rgba(255,255,255,0.3); padding-top: 15px;">
      <h4 style="margin: 0 0 10px 0; color: #ffffff;">📊 Math Tools</h4>
      <button onclick="calculateProbabilities()" style="font-size: 12px; padding: 5px 10px;">Event Probabilities</button>
      <button onclick="analyzePlayerPaths()" style="font-size: 12px; padding: 5px 10px;">Path Analysis</button>
      <button onclick="showNetworkTheory()" style="font-size: 12px; padding: 5px 10px;">Network Effects</button>
    </div>
  `;
  container.appendChild(handControlDiv);
  
  designerRings.forEach((ring, index) => {
    const controlDiv = document.createElement("div");
    controlDiv.className = "ring-control";
    controlDiv.style.borderLeftColor = ring.color;
    
    controlDiv.innerHTML = `
      <h4 style="margin: 0 0 10px 0; color: ${ring.color};">${ring.label}</h4>
      <label>
        Cusps: <input type="number" min="2" max="12" value="${ring.cusps}" 
                     onchange="updateRingParameter(${index}, 'cusps', parseInt(this.value))">
      </label>
      <label>
        Radius (R): <span id="radius-val-${index}">${ring.R}</span>
        <input type="range" min="20" max="150" value="${ring.R}" 
               oninput="updateRingParameter(${index}, 'R', parseInt(this.value)); document.getElementById('radius-val-${index}').textContent = this.value;">
      </label>
      <label>
        Color: <input type="color" value="${ring.color}" 
                     onchange="updateRingParameter(${index}, 'color', this.value)">
      </label>
    `;
    
    container.appendChild(controlDiv);
  });
}

function updateRingParameter(ringIndex, parameter, value) {
  designerRings[ringIndex][parameter] = value;
  drawDesignerBoard();
  setupDesignerControls(); // Refresh to update color indicators
}

function updateHandParameter(parameter, value) {
  if (parameter === 'handRotation') {
    handRotation = value;
  } else {
    handSettings[parameter] = value;
  }
  
  if (parameter === 'enabled') {
    if (value) {
      lastTickTime = 0; // Reset timer
      startHandAnimation();
    } else {
      stopHandAnimation();
      drawDesignerBoard(); // Redraw without hand
    }
  } else {
    drawDesignerBoard();
  }
}

// Event handler for when hand lands on a point
function onHandLandedOnPoint(pointData) {
  // This function will be called every time the hand moves to a new point
  // You can add your game logic here
  console.log(`🎯 Hand landed on ${pointData.ring} Ring, Point ${pointData.pointIndex}`);
  
  // Example: Flash the current point
  const svg = document.getElementById("designerBoard");
  const pointElement = svg.querySelector(`[data-point-index="${pointData.globalIndex}"]`);
  if (pointElement) {
    pointElement.style.transition = "r 0.2s ease";
    pointElement.setAttribute("r", "8");
    setTimeout(() => {
      pointElement.setAttribute("r", "5");
    }, 200);
  }
  
  // Add your custom event logic here:
  // - Trigger card draws
  // - Update player stats
  // - Display notifications
  // - Save game state
}

function resetHandPosition() {
  handRotation = 0;
  lastTickTime = 0;
  drawDesignerBoard();
}

function simulatePlayerTurn() {
  // Stop the hand temporarily
  const wasEnabled = handSettings.enabled;
  handSettings.enabled = false;
  stopHandAnimation();
  
  // Show current ring the hand is pointing to
  const currentRing = getCurrentRingFromHand();
  alert(`Hand stopped! Player would land on: ${currentRing ? currentRing.label : 'Center'} Ring`);
  
  // Resume animation
  if (wasEnabled) {
    handSettings.enabled = true;
    startHandAnimation();
  }
}

function getCurrentRingFromHand() {
  const angle = handRotation * Math.PI / 180;
  const handX = Math.cos(angle - Math.PI/2) * handSettings.handLength;
  const handY = Math.sin(angle - Math.PI/2) * handSettings.handLength;
  const distance = Math.sqrt(handX * handX + handY * handY);
  
  // Find which ring the hand is closest to
  let closestRing = null;
  let minDiff = Infinity;
  
  designerRings.forEach(ring => {
    const diff = Math.abs(distance - ring.R);
    if (diff < minDiff) {
      minDiff = diff;
      closestRing = ring;
    }
  });
  
  return closestRing;
}

function updateCodeOutput() {
  const codeTextarea = document.getElementById("codeOutput");
  if (!codeTextarea) return;
  
  // Generate point management configuration
  const pointCountsStr = Object.keys(pointCounts).length > 0 
    ? `\n// Custom Point Counts\nconst POINT_COUNTS = ${JSON.stringify(pointCounts, null, 2)};\n`
    : '';
  
  const customPositionsStr = Object.keys(customPointPositions).length > 0
    ? `\n// Custom Point Positions\nconst CUSTOM_POINT_POSITIONS = ${JSON.stringify(customPointPositions, null, 2)};\n`
    : '';
  
  const pointConfigStr = `
// Point Management Configuration
const POINT_MANAGEMENT = {
  manualPointMode: ${manualPointMode},
  selectedRing: ${selectedRing ? `"${selectedRing}"` : 'null'},
  defaultSegments: ${DESIGNER_SEGMENTS}
};`;

  const code = `// Generated Hypocycloid Ring Configuration
const RINGS = [
${designerRings.map(ring => `  { label: "${ring.label}", cusps: ${ring.cusps}, R: ${ring.R}, color: "${ring.color}" }`).join(',\n')}
];

// Ticking Hand Configuration
const HAND_SETTINGS = {
  tickInterval: ${handSettings.tickInterval},   // seconds between movements
  handLength: ${handSettings.handLength},       // length of the hand
  handColor: "${handSettings.handColor}",       // hand color
  handWidth: ${handSettings.handWidth},         // hand thickness
  enabled: ${handSettings.enabled},             // hand animation enabled
  rotationSpeed: ${handSettings.rotationSpeed}, // degrees per tick
  currentRotation: ${Math.round(handRotation)}  // current hand position
};${pointCountsStr}${customPositionsStr}${pointConfigStr}

// Hypocycloid generation function
function generateHypocycloid(R, cusps, steps = 720) {
  const r = R / cusps;
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const t = (Math.PI * 2 * i) / steps;
    const x = (R - r) * Math.cos(t) + r * Math.cos(((R - r) / r) * t);
    const y = (R - r) * Math.sin(t) - r * Math.sin(((R - r) / r) * t);
    pts.push([x, y]);
  }
  return pts;
}

// Point positioning with custom support
function getPointPosition(ring, pointIndex, totalPoints, precomputedPts = null) {
  // Check for custom positions first
  if (POINT_MANAGEMENT.manualPointMode && CUSTOM_POINT_POSITIONS[ring.label] && CUSTOM_POINT_POSITIONS[ring.label][pointIndex]) {
    const customPos = CUSTOM_POINT_POSITIONS[ring.label][pointIndex];
    return { x: customPos.x, y: customPos.y, curveParam: customPos.curveParam || 0 };
  }
  
  // Default mathematical position along curve
  const pts = precomputedPts || generateHypocycloid(ring.R, ring.cusps, 360);
  const curveParam = pointIndex / totalPoints;
  const idx = Math.floor((pts.length - 1) * curveParam);
  const [x, y] = pts[idx];
  
  return { x, y, curveParam, curveIndex: idx };
}

// Hand tick logic
function animateHand(currentTime, currentPoint, lastTickTime, boardPoints) {
  if (!lastTickTime) lastTickTime = currentTime;
  const deltaTime = currentTime - lastTickTime;
  
  if (HAND_SETTINGS.enabled && HAND_SETTINGS.tickInterval > 0) {
    if (deltaTime >= HAND_SETTINGS.tickInterval * 1000) {
      currentPoint = (currentPoint + 1) % boardPoints.length;
      lastTickTime = currentTime;
      
      // Trigger event when hand lands on point
      if (boardPoints[currentPoint]) {
        onHandLandedOnPoint(boardPoints[currentPoint]);
      }
    }
  }
  
  return { currentPoint, lastTickTime };
}

// Board generation with custom point support
function generateBoard() {
  const boardPoints = [];
  
  RINGS.forEach((ring, ringIndex) => {
    const pts = generateHypocycloid(ring.R, ring.cusps, 360);
    const pointCount = POINT_COUNTS[ring.label] || POINT_MANAGEMENT.defaultSegments;
    
    for (let i = 0; i < pointCount; i++) {
      const position = getPointPosition(ring, i, pointCount, pts);
      boardPoints.push({
        x: position.x,
        y: position.y,
        ring: ring.label,
        ringIndex: ringIndex,
        pointIndex: i,
        globalIndex: boardPoints.length,
        color: ring.color,
        angle: Math.atan2(position.y, position.x) * 180 / Math.PI,
        curveParam: position.curveParam
      });
    }
  });
  
  return boardPoints;
}

// Mathematical ratios for current configuration:
${designerRings.map(ring => `// ${ring.label}: R:r = ${ring.cusps}:1 (${ring.cusps}-cusp hypocycloid)`).join('\n')}
// Total board points: ${boardPoints.length}
// Custom point counts: ${Object.keys(pointCounts).length > 0 ? Object.entries(pointCounts).map(([ring, count]) => `${ring}=${count}`).join(', ') : 'None'}`;

  codeTextarea.value = code;
}

function resetToDefaults() {
  designerRings = JSON.parse(JSON.stringify(DEFAULT_RINGS));
  setupDesignerControls();
  drawDesignerBoard();
}

function copyCode() {
  const codeTextarea = document.getElementById("codeOutput");
  codeTextarea.select();
  document.execCommand('copy');
  
  // Visual feedback
  const button = event.target;
  const originalText = button.textContent;
  button.textContent = "Copied!";
  button.style.background = "#2ecc71";
  setTimeout(() => {
    button.textContent = originalText;
    button.style.background = "#ff6b6b";
  }, 1000);
}

// Manual Point Placement Functions
function toggleManualPointMode(enabled) {
  manualPointMode = enabled;
  const manualControls = document.getElementById("manual-controls");
  if (manualControls) {
    manualControls.style.display = enabled ? 'block' : 'none';
  }
  drawDesignerBoard();
  setupDesignerControls();
}

function enterPointEditMode() {
  pointEditMode = !pointEditMode;
  if (pointEditMode) {
    enablePointDragging();
    alert("Point Edit Mode: Click and drag points to reposition them!");
  } else {
    disablePointDragging();
  }
  drawDesignerBoard();
}

function enablePointDragging() {
  const svg = document.getElementById("designerBoard");
  svg.style.cursor = "crosshair";
  
  svg.addEventListener('mousedown', startPointDrag);
  svg.addEventListener('mousemove', dragPoint);
  svg.addEventListener('mouseup', endPointDrag);
}

function disablePointDragging() {
  const svg = document.getElementById("designerBoard");
  svg.style.cursor = "default";
  
  svg.removeEventListener('mousedown', startPointDrag);
  svg.removeEventListener('mousemove', dragPoint);
  svg.removeEventListener('mouseup', endPointDrag);
}

function startPointDrag(event) {
  if (!pointEditMode) return;
  
  const svg = document.getElementById("designerBoard");
  const rect = svg.getBoundingClientRect();
  const x = event.clientX - rect.left - rect.width/2;
  const y = event.clientY - rect.top - rect.height/2;
  
  // Find nearest point
  let nearestPoint = null;
  let minDistance = Infinity;
  
  boardPoints.forEach(point => {
    const distance = Math.sqrt((x - point.x)**2 + (y - point.y)**2);
    if (distance < 20 && distance < minDistance) {
      minDistance = distance;
      nearestPoint = point;
    }
  });
  
  if (nearestPoint) {
    draggedPoint = nearestPoint;
    svg.style.cursor = "grabbing";
  }
}

function dragPoint(event) {
  if (!draggedPoint) return;
  
  const svg = document.getElementById("designerBoard");
  const rect = svg.getBoundingClientRect();
  const x = event.clientX - rect.left - rect.width/2;
  const y = event.clientY - rect.top - rect.height/2;
  
  // Update point position
  draggedPoint.x = x;
  draggedPoint.y = y;
  
  // Store custom position
  const ringLabel = draggedPoint.ring;
  if (!customPointPositions[ringLabel]) {
    customPointPositions[ringLabel] = {};
  }
  customPointPositions[ringLabel][draggedPoint.pointIndex] = {x, y};
  
  drawDesignerBoard();
}

function endPointDrag() {
  if (draggedPoint) {
    draggedPoint = null;
    const svg = document.getElementById("designerBoard");
    svg.style.cursor = "crosshair";
  }
}

function resetToMathematicalPoints() {
  customPointPositions = {};
  drawDesignerBoard();
}

function randomizePoints() {
  designerRings.forEach(ring => {
    customPointPositions[ring.label] = {};
    for (let i = 0; i < DESIGNER_SEGMENTS; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = ring.R * (0.7 + Math.random() * 0.6); // ±30% variance
      customPointPositions[ring.label][i] = {
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius
      };
    }
  });
  drawDesignerBoard();
}

// Point Management Functions
function selectRingForEditing(ringLabel) {
  selectedRing = ringLabel || null;
  drawDesignerBoard();
  setupDesignerControls();
}

function selectPoint(pointData, event) {
  event.stopPropagation();
  console.log('Selected point:', pointData);
  
  // Highlight selected point
  const svg = document.getElementById("designerBoard");
  const pointElement = svg.querySelector(`[data-point-index="${pointData.globalIndex}"]`);
  if (pointElement) {
    pointElement.setAttribute("stroke", "#ffff00");
    pointElement.setAttribute("stroke-width", "3");
  }
}

function updatePointCount(newCount) {
  if (!selectedRing) return;
  
  pointCounts[selectedRing] = parseInt(newCount);
  document.getElementById("point-count-display").textContent = newCount;
  drawDesignerBoard();
}

function addPointToRing() {
  if (!selectedRing) return;
  
  const currentCount = pointCounts[selectedRing] || DESIGNER_SEGMENTS;
  pointCounts[selectedRing] = Math.min(currentCount + 1, 50);
  drawDesignerBoard();
  setupDesignerControls();
}

function removePointFromRing() {
  if (!selectedRing) return;
  
  const currentCount = pointCounts[selectedRing] || DESIGNER_SEGMENTS;
  pointCounts[selectedRing] = Math.max(currentCount - 1, 1);
  drawDesignerBoard();
  setupDesignerControls();
}

function resetRingPoints() {
  if (!selectedRing) return;
  
  delete pointCounts[selectedRing];
  if (customPointPositions[selectedRing]) {
    delete customPointPositions[selectedRing];
  }
  drawDesignerBoard();
  setupDesignerControls();
}

function resetAllPoints() {
  pointCounts = {};
  customPointPositions = {};
  selectedRing = null;
  drawDesignerBoard();
  setupDesignerControls();
}

function distributePointsEvenly() {
  if (!selectedRing) return;
  
  // Remove custom positions to force even mathematical distribution
  if (customPointPositions[selectedRing]) {
    delete customPointPositions[selectedRing];
  }
  drawDesignerBoard();
}

function highlightSelectedRing() {
  if (!selectedRing) return;
  
  const svg = document.getElementById("designerBoard");
  const ring = designerRings.find(r => r.label === selectedRing);
  if (!ring) return;
  
  const pts = generateDesignerHypocycloid(ring.R, ring.cusps, DESIGNER_STEPS);
  
  const highlight = createDesignerSVGElement("path", {
    d: pathFromDesignerPoints(pts),
    fill: "none",
    stroke: "#ffff00",
    "stroke-width": 3,
    opacity: 0.7,
    "stroke-dasharray": "8 4",
    class: "selected-ring-highlight"
  });
  
  svg.appendChild(highlight);
}

// Mathematical Analysis Tools
function calculateProbabilities() {
  const analysis = {
    handLandingProbs: {},
    alignmentPatterns: [],
    chaosMetrics: {}
  };
  
  // Calculate probability of landing on each ring
  designerRings.forEach(ring => {
    const ringPoints = boardPoints.filter(p => p.ring === ring.label);
    analysis.handLandingProbs[ring.label] = (ringPoints.length / boardPoints.length * 100).toFixed(1) + '%';
  });
  
  // Find alignment patterns (points that line up)
  for (let angle = 0; angle < 360; angle += 5) {
    const alignedPoints = boardPoints.filter(point => 
      Math.abs(point.angle - angle) < 2 || Math.abs(point.angle - angle + 360) < 2
    );
    if (alignedPoints.length > 2) {
      analysis.alignmentPatterns.push({
        angle: angle,
        points: alignedPoints.length,
        rings: [...new Set(alignedPoints.map(p => p.ring))]
      });
    }
  }
  
  console.log("📊 Probability Analysis:", analysis);
  alert(`Ring Landing Probabilities:\n${Object.entries(analysis.handLandingProbs).map(([ring, prob]) => `${ring}: ${prob}`).join('\n')}\n\nAlignment Patterns: ${analysis.alignmentPatterns.length} found`);
}

function analyzePlayerPaths() {
  // Simulate player movement patterns
  const pathAnalysis = {
    averageDistance: 0,
    ringTransitions: {},
    hotSpots: []
  };
  
  // Calculate average distance between consecutive points
  let totalDistance = 0;
  for (let i = 0; i < boardPoints.length; i++) {
    const current = boardPoints[i];
    const next = boardPoints[(i + 1) % boardPoints.length];
    totalDistance += Math.sqrt((next.x - current.x)**2 + (next.y - current.y)**2);
  }
  pathAnalysis.averageDistance = (totalDistance / boardPoints.length).toFixed(1);
  
  // Find points with high intersection potential
  boardPoints.forEach(point => {
    const nearbyPoints = boardPoints.filter(p => 
      p !== point && Math.sqrt((p.x - point.x)**2 + (p.y - point.y)**2) < 30
    );
    if (nearbyPoints.length > 2) {
      pathAnalysis.hotSpots.push({
        point: point.globalIndex,
        ring: point.ring,
        nearby: nearbyPoints.length
      });
    }
  });
  
  console.log("🗺️ Path Analysis:", pathAnalysis);
  alert(`Average point distance: ${pathAnalysis.averageDistance}px\nHot spots found: ${pathAnalysis.hotSpots.length}`);
}

function showNetworkTheory() {
  // Calculate network properties of the board
  const networkMetrics = {
    clustering: 0,
    centrality: {},
    smallWorld: false
  };
  
  // Calculate clustering coefficient (how connected nearby points are)
  let totalClustering = 0;
  boardPoints.forEach(point => {
    const neighbors = boardPoints.filter(p => 
      Math.sqrt((p.x - point.x)**2 + (p.y - point.y)**2) < 50
    );
    
    if (neighbors.length > 1) {
      let connections = 0;
      for (let i = 0; i < neighbors.length; i++) {
        for (let j = i + 1; j < neighbors.length; j++) {
          const dist = Math.sqrt(
            (neighbors[i].x - neighbors[j].x)**2 + 
            (neighbors[i].y - neighbors[j].y)**2
          );
          if (dist < 50) connections++;
        }
      }
      const maxConnections = neighbors.length * (neighbors.length - 1) / 2;
      totalClustering += connections / maxConnections;
    }
  });
  
  networkMetrics.clustering = (totalClustering / boardPoints.length).toFixed(3);
  networkMetrics.smallWorld = networkMetrics.clustering > 0.1;
  
  console.log("🕸️ Network Theory Analysis:", networkMetrics);
  alert(`Clustering coefficient: ${networkMetrics.clustering}\nSmall world network: ${networkMetrics.smallWorld ? 'Yes' : 'No'}`);
}

// Enhanced point positioning with curve parameter control
function getPointPosition(ring, pointIndex, totalPoints, precomputedPts = null) {
  // Check for custom positions first
  if (manualPointMode && customPointPositions[ring.label] && customPointPositions[ring.label][pointIndex]) {
    const customPos = customPointPositions[ring.label][pointIndex];
    // Snap custom position to nearest point on curve
    return snapToNearestCurvePoint(ring, customPos.x, customPos.y);
  }
  
  // Default mathematical position along curve
  const pts = precomputedPts || generateDesignerHypocycloid(ring.R, ring.cusps, DESIGNER_STEPS);
  const curveParam = pointIndex / totalPoints; // parameter from 0 to 1
  const idx = Math.floor((pts.length - 1) * curveParam);
  const [x, y] = pts[idx];
  
  return { 
    x, 
    y, 
    curveParam,
    curveIndex: idx
  };
}

function snapToNearestCurvePoint(ring, targetX, targetY) {
  const pts = generateDesignerHypocycloid(ring.R, ring.cusps, DESIGNER_STEPS);
  let minDistance = Infinity;
  let bestPoint = null;
  let bestIndex = 0;
  
  pts.forEach(([x, y], index) => {
    const distance = Math.sqrt((x - targetX) ** 2 + (y - targetY) ** 2);
    if (distance < minDistance) {
      minDistance = distance;
      bestPoint = { x, y };
      bestIndex = index;
    }
  });
  
  return {
    x: bestPoint.x,
    y: bestPoint.y,
    curveParam: bestIndex / (pts.length - 1),
    curveIndex: bestIndex
  };
}

// Initialize designer when page loads
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    setupDesignerControls();
    drawDesignerBoard();
    if (handSettings.enabled) {
      startHandAnimation();
    }
  }, 100);
});
