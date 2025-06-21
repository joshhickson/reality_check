// Reality Check – Casual Mode Board Renderer (Vanilla JS + SVG)
// ------------------------------------------------------------------
// Now supports **Personal Sub‑Ring Modifiers** so each player can have
// tweaked hypocycloid radii without redrawing the global board.
// ------------------------------------------------------------------
/*
Embed this snippet in an HTML file:

<body>
  <svg id="board" width="600" height="600" viewBox="-300 -300 600 600"></svg>
  <script src="board.js"></script>
</body>

Personal modifiers are passed in as an object where keys are ring labels
and values are a percentage radius tweak. Example:

const myMods = {
  Career: 1.1,   // +10% radius ⇒ bigger swings in Career tiles
  Health: 0.9,   // -10% radius ⇒ tighter Health loop
  Social: 1.0,
  Personal: 1.2,
  BabelEvents: 1.0,
};
renderPlayerOverlay(myMods, "#ffffff44");
*/

// --- BASE RING CONFIG ------------------------------------------
const RINGS = [
  { label: "Career",        cusps: 3,  R: 120, color: "#ff6b6b" },
  { label: "Health",        cusps: 4,  R: 100, color: "#feca57" },
  { label: "Social",        cusps: 5,  R:  80, color: "#48dbfb" },
  { label: "Personal",      cusps: 6,  R:  60, color: "#1dd1a1" },
  { label: "BabelEvents",   cusps: 2,  R:  40, color: "#5f27cd" },
];

const SEGMENTS = 10;          // tile count per ring
const STEPS_PER_RING = 720;   // curve resolution

// --- HYPOCYCLOID GENERATOR -------------------------------------
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

function svgPath(pts) {
  return pts.map((p, i) => (i === 0 ? `M ${p[0]} ${p[1]}` : `L ${p[0]} ${p[1]}`)).join(" ") + " Z";
}

function svgElem(tag, attrs) {
  const e = document.createElementNS("http://www.w3.org/2000/svg", tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  return e;
}

// --- GLOBAL BOARD ----------------------------------------------
function drawBoard() {
  const svg = document.getElementById("board");
  svg.innerHTML = "";

  RINGS.forEach((ring) => {
    const r = ring.R / ring.cusps;
    const pts = generateHypocycloid(ring.R, r, STEPS_PER_RING);

    svg.appendChild(svgElem("path", {
      d: svgPath(pts), fill: "none", stroke: ring.color, "stroke-width": 2,
    }));

    // place tile markers
    for (let i = 0; i < SEGMENTS; i++) {
      const idx = Math.floor((pts.length / SEGMENTS) * i);
      const [x, y] = pts[idx];
      svg.appendChild(svgElem("circle", { cx: x, cy: y, r: 4, fill: ring.color }));
    }
  });
}

document.addEventListener("DOMContentLoaded", drawBoard);

// --- PERSONAL OVERLAY -----------------------------------------
// mods: { Career:1.1, Health:0.9, ... }, color = overlay stroke color
export function renderPlayerOverlay(mods, color = "#ffffff88") {
  const svg = document.getElementById("board");
  Object.entries(mods).forEach(([label, mult]) => {
    const base = RINGS.find((r) => r.label === label);
    if (!base) return;
    const newR = base.R * mult;
    const r = newR / base.cusps;
    const pts = generateHypocycloid(newR, r, STEPS_PER_RING);
    svg.appendChild(
      svgElem("path", {
        d: svgPath(pts),
        fill: "none",
        stroke: color,
        "stroke-width": 1,
        "stroke-dasharray": "4 4",
      })
    );
  });
}
