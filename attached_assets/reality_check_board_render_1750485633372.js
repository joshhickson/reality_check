// Reality Check – Casual Mode Board Renderer (Vanilla JS + SVG)
// -------------------------------------------------------------
// This file renders the Chaos Circle with nested hypocycloid rings.
// Copy‑paste into an <html> file or a JS bundler and open in any browser.

/*
HTML snippet to include in your document:

<body>
  <svg id="board" width="600" height="600" viewBox="-300 -300 600 600"></svg>
  <script src="board.js"></script>
</body>
*/

// --- CONFIG --------------------------------------------------
const RINGS = [
  { label: "Career",        cusps: 3,  R: 120, color: "#ff6b6b" },
  { label: "Health",        cusps: 4,  R: 100, color: "#feca57" },
  { label: "Social",        cusps: 5,  R:  80, color: "#48dbfb" },
  { label: "Personal",      cusps: 6,  R:  60, color: "#1dd1a1" },
  { label: "BabelEvents",   cusps: 2,  R:  40, color: "#5f27cd" },
];
// tiles per ring (10 equal arc‑length segments)
const SEGMENTS = 10;
const STEPS_PER_RING = 720; // resolution of curve

// --- HELPER ---------------------------------------------------
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

// --- MAIN DRAW -----------------------------------------------
function drawBoard() {
  const svg = document.getElementById("board");
  svg.innerHTML = ""; // clear

  RINGS.forEach((ring) => {
    const r = ring.R / ring.cusps; // r = R / cusps maintains cusp count
    const pts = generateHypocycloid(ring.R, r, STEPS_PER_RING);
    const path = createSVGElement("path", {
      d: pathFromPoints(pts),
      fill: "none",
      stroke: ring.color,
      "stroke-width": 2,
    });
    svg.appendChild(path);

    // Tile markers
    for (let i = 0; i < SEGMENTS; i++) {
      const idx = Math.floor((pts.length / SEGMENTS) * i);
      const [x, y] = pts[idx];
      const tile = createSVGElement("circle", {
        cx: x,
        cy: y,
        r: 4,
        fill: ring.color,
      });
      svg.appendChild(tile);
    }
  });
}

// --- 3D HYPOCYCLOID RENDERING (Three.js) ---------------------
let current3DParams = {
  R: 120,
  r: 40,
  d: 60,
  steps: 800,
  color: 0x48dbfb
};
let currentRenderer = null;

function hexToThreeColor(hex) {
  return parseInt(hex.replace('#', '0x'), 16);
}

function render3DHypocycloid({R = 100, r = 30, d = 40, steps = 500, color = 0xff6b6b} = {}) {
  const container = document.getElementById('three-container');
  if (!container) return;
  // Remove previous renderer if any
  container.innerHTML = '';

  const width = container.clientWidth;
  const height = container.clientHeight;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
  camera.position.z = 250;

  const renderer = new THREE.WebGLRenderer({antialias: true});
  renderer.setSize(width, height);
  container.appendChild(renderer.domElement);
  currentRenderer = renderer;

  // Generate hypocycloid points in 3D
  const points = [];
  for (let i = 0; i <= steps; i++) {
    const t = (Math.PI * 2 * i) / steps;
    const x = (R - r) * Math.cos(t) + d * Math.cos(((R - r) / r) * t);
    const y = (R - r) * Math.sin(t) - d * Math.sin(((R - r) / r) * t);
    const z = 40 * Math.sin(2 * t); // Add some 3D variation
    points.push(new THREE.Vector3(x, y, z));
  }

  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({ color });
  const curveObject = new THREE.Line(geometry, material);
  scene.add(curveObject);

  // Add some light
  const light = new THREE.PointLight(0xffffff, 1, 1000);
  light.position.set(0, 0, 250);
  scene.add(light);

  // Animation loop
  function animate() {
    requestAnimationFrame(animate);
    curveObject.rotation.x += 0.01;
    curveObject.rotation.y += 0.01;
    renderer.render(scene, camera);
  }
  animate();
}

function setupHypocycloidControls() {
  const controls = [
    {id: 'R', min: 20, max: 200},
    {id: 'r', min: 5, max: 100},
    {id: 'd', min: 1, max: 120},
    {id: 'steps', min: 100, max: 2000},
  ];
  controls.forEach(ctrl => {
    const slider = document.getElementById('param-' + ctrl.id);
    const valSpan = document.getElementById('val-' + ctrl.id);
    if (slider && valSpan) {
      slider.addEventListener('input', e => {
        valSpan.textContent = slider.value;
        current3DParams[ctrl.id] = parseInt(slider.value);
        render3DHypocycloid({
          ...current3DParams,
          color: current3DParams.color
        });
      });
    }
  });
  // Color picker
  const colorInput = document.getElementById('param-color');
  if (colorInput) {
    colorInput.addEventListener('input', e => {
      current3DParams.color = hexToThreeColor(colorInput.value);
      render3DHypocycloid({
        ...current3DParams,
        color: current3DParams.color
      });
    });
  }
}

// --- INIT ----------------------------------------------------
window.addEventListener('DOMContentLoaded', () => {
  drawBoard(); // 2D SVG
  render3DHypocycloid(current3DParams); // 3D
  setupHypocycloidControls();
});
