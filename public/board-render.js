import * as THREE from 'three';

// Reality Check – Casual Mode Board Renderer (Vanilla JS + SVG)
// Enhanced with player tracking and interactive elements

const RINGS = [
  { label: "Career", cusps: 3, R: 120, color: "#ff6b6b" },
  { label: "Health", cusps: 4, R: 100, color: "#feca57" },
  { label: "Social", cusps: 5, R: 80, color: "#48dbfb" },
  { label: "Personal", cusps: 6, R: 60, color: "#1dd1a1" },
  { label: "BabelEvents", cusps: 2, R: 40, color: "#5f27cd" },
];

const SEGMENTS = 10; // tiles per ring
const STEPS_PER_RING = 720; // resolution of curve

let current3DParams = {
  R: 120,
  r: 40,
  d: 60,
  steps: 800,
  color: 0x48dbfb
};
let currentRenderer = null;

// Generate hypocycloid points
function generateHypocycloid(R, r, steps) {
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const t = (Math.PI * 2 * i) / steps;
    const x = (R - r) * Math.cos(t) + r * Math.cos(((R - r) / r) * t);
    const y = (R - r) * Math.sin(t) - r * Math.sin(((R - r) / r) * t);
    pts.push([x, y]);
  }
  return pts;
}

function pathFromPoints(pts) {
  return pts.map((p, idx) => (idx === 0 ? `M ${p[0]} ${p[1]}` : `L ${p[0]} ${p[1]}`)).join(" ") + " Z";
}

function createSVGElement(tag, attrs) {
  const el = document.createElementNS("http://www.w3.org/2000/svg", tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  return el;
}

// Store tile positions for player movement
let tilePositions = [];

function drawBoard() {
  const svg = document.getElementById("board");
  svg.innerHTML = ""; // clear
  tilePositions = [];

  RINGS.forEach((ring, ringIndex) => {
    const r = ring.R / ring.cusps;
    const pts = generateHypocycloid(ring.R, r, STEPS_PER_RING);

    // Draw the ring path
    const path = createSVGElement("path", {
      d: pathFromPoints(pts),
      fill: "none",
      stroke: ring.color,
      "stroke-width": 2,
      opacity: 0.7
    });
    svg.appendChild(path);

    // Place tile markers and store positions
    for (let i = 0; i < SEGMENTS; i++) {
      const idx = Math.floor((pts.length / SEGMENTS) * i);
      const [x, y] = pts[idx];

      const tile = createSVGElement("circle", {
        cx: x,
        cy: y,
        r: 6,
        fill: ring.color,
        stroke: "#fff",
        "stroke-width": 1,
        class: `tile tile-${ring.label.toLowerCase()}`,
        "data-ring": ring.label,
        "data-tile": i
      });
      svg.appendChild(tile);

      // Store tile position for player movement
      tilePositions.push({
        x: x,
        y: y,
        ring: ring.label,
        tileIndex: i,
        globalIndex: tilePositions.length
      });
    }
  });

  // Add center starting point
  const centerTile = createSVGElement("circle", {
    cx: 0,
    cy: 0,
    r: 10,
    fill: "#fff",
    stroke: "#333",
    "stroke-width": 2,
    class: "start-tile"
  });
  svg.appendChild(centerTile);

  const startLabel = createSVGElement("text", {
    x: 0,
    y: 25,
    "text-anchor": "middle",
    fill: "#fff",
    "font-size": "12px",
    "font-weight": "bold"
  });
  startLabel.textContent = "START";
  svg.appendChild(startLabel);
}

// Render player overlay with personal modifiers
function renderPlayerOverlay(mods, color = "#ffffff44") {
  const svg = document.getElementById("board");

  Object.entries(mods).forEach(([label, mult]) => {
    const base = RINGS.find((r) => r.label === label);
    if (!base) return;

    const newR = base.R * mult;
    const r = newR / base.cusps;
    const pts = generateHypocycloid(newR, r, STEPS_PER_RING);

    svg.appendChild(
      createSVGElement("path", {
        d: pathFromPoints(pts),
        fill: "none",
        stroke: color,
        "stroke-width": 1,
        "stroke-dasharray": "4 4",
        opacity: 0.6
      })
    );
  });
}

// Player movement and visualization
function movePlayerToPosition(playerId, position) {
  const svg = document.getElementById("board");

  // Remove existing player marker
  const existingMarker = svg.querySelector(`#player-${playerId}`);
  if (existingMarker) {
    existingMarker.remove();
  }

  // Calculate position on board
  let targetPos = { x: 0, y: 0 }; // default to center

  if (position > 0 && position <= tilePositions.length) {
    const tilePos = tilePositions[position - 1];
    targetPos = { x: tilePos.x, y: tilePos.y };
  }

  // Create player marker
  const playerMarker = createSVGElement("circle", {
    id: `player-${playerId}`,
    cx: targetPos.x,
    cy: targetPos.y,
    r: 8,
    fill: getPlayerColor(playerId),
    stroke: "#fff",
    "stroke-width": 2,
    class: "player-marker"
  });

  svg.appendChild(playerMarker);

  // Add player label
  const playerLabel = createSVGElement("text", {
    x: targetPos.x,
    y: targetPos.y - 15,
    "text-anchor": "middle",
    fill: "#fff",
    "font-size": "10px",
    "font-weight": "bold",
    class: "player-label"
  });
  playerLabel.textContent = playerId.substring(0, 3);
  svg.appendChild(playerLabel);
}

function getPlayerColor(playerId) {
  const colors = ["#e74c3c", "#3498db", "#2ecc71", "#f39c12", "#9b59b6"];
  const hash = playerId.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  return colors[Math.abs(hash) % colors.length];
}

function highlightRingEvents(triggeredRings) {
  const svg = document.getElementById("board");

  // Reset all ring highlights
  svg.querySelectorAll('.ring-highlight').forEach(el => el.remove());

  // Highlight triggered rings
  triggeredRings.forEach(ringName => {
    const ring = RINGS.find(r => r.label === ringName);
    if (!ring) return;

    const r = ring.R / ring.cusps;
    const pts = generateHypocycloid(ring.R, r, STEPS_PER_RING);

    const highlight = createSVGElement("path", {
      d: pathFromPoints(pts),
      fill: "none",
      stroke: ring.color,
      "stroke-width": 4,
      opacity: 1,
      class: "ring-highlight",
      style: "animation: pulse 1s infinite"
    });

    svg.appendChild(highlight);
  });
}

// Initialize board when page loads
document.addEventListener('DOMContentLoaded', () => {
  drawBoard();

  // Add CSS for animations
  const style = document.createElement('style');
  style.textContent = `
    @keyframes pulse {
      0% { opacity: 1; }
      50% { opacity: 0.5; }
      100% { opacity: 1; }
    }
    .player-marker {
      transition: all 0.5s ease;
    }
    .tile:hover {
      r: 8;
      cursor: pointer;
    }
  `;
  document.head.appendChild(style);
});