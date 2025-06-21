
// Hypocycloid Board Designer
// Interactive tool for fine-tuning Reality Check board parameters

const DEFAULT_RINGS = [
  { label: "Career", cusps: 3, R: 120, color: "#ff6b6b" },
  { label: "Health", cusps: 4, R: 100, color: "#feca57" },
  { label: "Social", cusps: 5, R: 80, color: "#48dbfb" },
  { label: "Personal", cusps: 6, R: 60, color: "#1dd1a1" },
  { label: "BabelEvents", cusps: 2, R: 40, color: "#5f27cd" },
];

let designerRings = JSON.parse(JSON.stringify(DEFAULT_RINGS));
const DESIGNER_SEGMENTS = 10;
const DESIGNER_STEPS = 360;

// Rotating hand parameters
let handSettings = {
  rotationSpeed: 2,    // seconds per full rotation
  handLength: 140,     // length of the hand
  handColor: "#ffffff",
  handWidth: 3,
  enabled: true
};

let handRotation = 0;
let lastTime = 0;
let animationId = null;

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

    // Add tile markers
    for (let i = 0; i < DESIGNER_SEGMENTS; i++) {
      const idx = Math.floor((pts.length / DESIGNER_SEGMENTS) * i);
      const [x, y] = pts[idx];
      
      const tile = createDesignerSVGElement("circle", {
        cx: x,
        cy: y,
        r: 3,
        fill: ring.color,
        stroke: "#fff",
        "stroke-width": 0.5
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
  const angle = handRotation * Math.PI / 180;
  const endX = Math.cos(angle - Math.PI/2) * handSettings.handLength;
  const endY = Math.sin(angle - Math.PI/2) * handSettings.handLength;
  
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
    r: 4,
    fill: handSettings.handColor,
    stroke: "#000",
    "stroke-width": 1
  });
  svg.appendChild(handTip);
}

function animateHand(currentTime) {
  if (!lastTime) lastTime = currentTime;
  const deltaTime = currentTime - lastTime;
  lastTime = currentTime;
  
  if (handSettings.enabled && handSettings.rotationSpeed > 0) {
    // Calculate rotation increment based on speed (degrees per millisecond)
    const degreesPerSecond = 360 / handSettings.rotationSpeed;
    const increment = (degreesPerSecond * deltaTime) / 1000;
    
    handRotation = (handRotation + increment) % 360;
    drawDesignerBoard();
  }
  
  animationId = requestAnimationFrame(animateHand);
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
    <h4 style="margin: 0 0 10px 0; color: #ffffff;">⏱️ Rotating Hand</h4>
    <label>
      <input type="checkbox" ${handSettings.enabled ? 'checked' : ''} 
             onchange="updateHandParameter('enabled', this.checked)"> Enable Hand
    </label>
    <label>
      Speed: <span id="hand-speed-val">${handSettings.rotationSpeed}s</span>
      <input type="range" min="0.5" max="10" step="0.1" value="${handSettings.rotationSpeed}" 
             oninput="updateHandParameter('rotationSpeed', parseFloat(this.value)); document.getElementById('hand-speed-val').textContent = this.value + 's';">
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
  handSettings[parameter] = value;
  
  if (parameter === 'enabled') {
    if (value) {
      startHandAnimation();
    } else {
      stopHandAnimation();
      drawDesignerBoard(); // Redraw without hand
    }
  } else {
    drawDesignerBoard();
  }
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

// Rotating Hand Configuration
const HAND_SETTINGS = {
  rotationSpeed: ${handSettings.rotationSpeed}, // seconds per full rotation
  handLength: ${handSettings.handLength},       // length of the hand
  handColor: "${handSettings.handColor}",       // hand color
  handWidth: ${handSettings.handWidth},         // hand thickness
  enabled: ${handSettings.enabled}              // hand animation enabled
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

// Hand animation logic
function animateHand(currentTime, handRotation, lastTime) {
  if (!lastTime) lastTime = currentTime;
  const deltaTime = currentTime - lastTime;
  
  if (HAND_SETTINGS.enabled && HAND_SETTINGS.rotationSpeed > 0) {
    const degreesPerSecond = 360 / HAND_SETTINGS.rotationSpeed;
    const increment = (degreesPerSecond * deltaTime) / 1000;
    handRotation = (handRotation + increment) % 360;
  }
  
  return { handRotation, lastTime: currentTime };
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
