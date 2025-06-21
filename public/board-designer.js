
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
  
  updateCodeOutput();
}

function setupDesignerControls() {
  const container = document.getElementById("ringControls");
  if (!container) return;
  
  container.innerHTML = "";
  
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

function updateCodeOutput() {
  const codeTextarea = document.getElementById("codeOutput");
  if (!codeTextarea) return;
  
  const code = `// Generated Hypocycloid Ring Configuration
const RINGS = [
${designerRings.map(ring => `  { label: "${ring.label}", cusps: ${ring.cusps}, R: ${ring.R}, color: "${ring.color}" }`).join(',\n')}
];

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
  }, 100);
});
