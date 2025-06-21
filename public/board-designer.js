
// Hypocycloid Board Designer
// Interactive tool for fine-tuning Reality Check board parameters

const DEFAULT_RINGS = [
  { label: "Career", cusps: 3, R: 127, color: "#ff6b6b" },
  { label: "Health", cusps: 4, R: 137, color: "#feca57" },
  { label: "Social", cusps: 5, R: 150, color: "#48dbfb" },
  { label: "Personal", cusps: 6, R: 150, color: "#1dd1a1" },
  { label: "BabelEvents", cusps: 2, R: 150, color: "#5f27cd" },
];

let designerRings = JSON.parse(JSON.stringify(DEFAULT_RINGS));
const DESIGNER_SEGMENTS = 10;
const DESIGNER_STEPS = 360;

// Rotating hand parameters
let handSettings = {
  tickInterval: 20,    // seconds between point movements
  handLength: 140,     // length of the hand
  handColor: "#ffffff",
  handWidth: 3,
  enabled: true,
  totalPoints: 50      // total points on the board (10 per ring × 5 rings)
};

let handRotation = 0;
let currentPoint = 0;
let lastTickTime = 0;
let animationId = null;
let boardPoints = [];  // Will store all point positions and data
let countdownInterval = null;

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
      opacity: 0.8
    });
    svg.appendChild(path);

    // Add tile markers and store point data
    for (let i = 0; i < DESIGNER_SEGMENTS; i++) {
      const idx = Math.floor((pts.length / DESIGNER_SEGMENTS) * i);
      const [x, y] = pts[idx];
      
      // Store point data for hand targeting
      const pointData = {
        x: x,
        y: y,
        ring: ring.label,
        ringIndex: ringIndex,
        pointIndex: i,
        globalIndex: boardPoints.length,
        color: ring.color,
        angle: Math.atan2(y, x) * 180 / Math.PI
      };
      boardPoints.push(pointData);
      
      const tile = createDesignerSVGElement("circle", {
        cx: x,
        cy: y,
        r: currentPoint === pointData.globalIndex ? 5 : 3,
        fill: currentPoint === pointData.globalIndex ? "#ffff00" : ring.color,
        stroke: "#fff",
        "stroke-width": currentPoint === pointData.globalIndex ? 2 : 0.5,
        "data-point-index": pointData.globalIndex
      });
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
  
  updateCodeOutput();
}

function drawRotatingHand(svg) {
  if (boardPoints.length === 0) return;
  
  const targetPoint = boardPoints[currentPoint];
  const endX = targetPoint.x;
  const endY = targetPoint.y;
  
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
}

function animateHand(currentTime) {
  if (!lastTickTime) lastTickTime = currentTime;
  const deltaTime = currentTime - lastTickTime;
  
  if (handSettings.enabled && handSettings.tickInterval > 0) {
    // Update countdown display
    const timeUntilNextTick = handSettings.tickInterval - (deltaTime / 1000);
    updateCountdownDisplay(Math.max(0, timeUntilNextTick));
    
    // Check if it's time to move to next point
    if (deltaTime >= handSettings.tickInterval * 1000) {
      currentPoint = (currentPoint + 1) % handSettings.totalPoints;
      lastTickTime = currentTime;
      drawDesignerBoard();
      
      // Trigger point landed event
      if (boardPoints[currentPoint]) {
        console.log(`Hand landed on point ${currentPoint}:`, boardPoints[currentPoint]);
        onHandLandedOnPoint(boardPoints[currentPoint]);
      }
    }
  }
  
  animationId = requestAnimationFrame(animateHand);
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
  lastTime = 0;
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
      Current Point: <span id="current-point-val">${currentPoint}</span>
      <input type="range" min="0" max="${handSettings.totalPoints - 1}" value="${currentPoint}" 
             oninput="updateHandParameter('currentPoint', parseInt(this.value)); document.getElementById('current-point-val').textContent = this.value;">
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
  if (parameter === 'currentPoint') {
    currentPoint = value;
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
  
  const code = `// Generated Hypocycloid Ring Configuration
const RINGS = [
${designerRings.map(ring => `  { label: "${ring.label}", cusps: ${ring.cusps}, R: ${ring.R}, color: "${ring.color}" }`).join(',\n')}
];

// Ticking Hand Configuration
const HAND_SETTINGS = {
  tickInterval: ${handSettings.tickInterval},   // seconds between point movements
  handLength: ${handSettings.handLength},       // length of the hand
  handColor: "${handSettings.handColor}",       // hand color
  handWidth: ${handSettings.handWidth},         // hand thickness
  enabled: ${handSettings.enabled},             // hand animation enabled
  totalPoints: ${handSettings.totalPoints}      // total points on board
};

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

// Hand tick logic
function animateHand(currentTime, currentPoint, lastTickTime, boardPoints) {
  if (!lastTickTime) lastTickTime = currentTime;
  const deltaTime = currentTime - lastTickTime;
  
  if (HAND_SETTINGS.enabled && HAND_SETTINGS.tickInterval > 0) {
    if (deltaTime >= HAND_SETTINGS.tickInterval * 1000) {
      currentPoint = (currentPoint + 1) % HAND_SETTINGS.totalPoints;
      lastTickTime = currentTime;
      
      // Trigger event when hand lands on point
      if (boardPoints[currentPoint]) {
        onHandLandedOnPoint(boardPoints[currentPoint]);
      }
    }
  }
  
  return { currentPoint, lastTickTime };
}

// Mathematical ratios for current configuration:
${designerRings.map(ring => `// ${ring.label}: R:r = ${ring.cusps}:1 (${ring.cusps}-cusp hypocycloid)`).join('\n')}`;

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
