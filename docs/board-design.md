
# Reality Check - Board Design & Rendering

## The Chaos Circle

The Reality Check board uses a unique mathematical approach: **nested hypocycloid curves** that create visually distinct rings representing different life domains.

## Mathematical Foundation

### Hypocycloid Geometry
A hypocycloid is the curve traced by a point on a small circle rolling inside a larger circle. The formula generates organic, flowing paths that feel both chaotic and purposeful.

**Parametric Equations:**
```
x = (R - r) * cos(t) + r * cos((R - r)/r * t)
y = (R - r) * sin(t) - r * sin((R - r)/r * t)
```

Where:
- `R` = radius of the fixed outer circle
- `r` = radius of the rolling inner circle
- `t` = parameter (0 to 2π)

### Ring Configuration

| Ring | Cusps | R (Radius) | r (Ratio) | Color | Life Domain |
|------|-------|------------|-----------|-------|-------------|
| **Career** | 3 | 120 | 40 (3:1) | #ff6b6b (Red) | Jobs, promotions, corporate life |
| **Health** | 4 | 100 | 25 (4:1) | #feca57 (Gold) | Physical & mental wellbeing |
| **Social** | 5 | 80 | 16 (5:1) | #48dbfb (Cyan) | Relationships, family, community |
| **Personal** | 6 | 60 | 10 (6:1) | #1dd1a1 (Green) | Growth, hobbies, spirituality |
| **Babel Events** | 2 | 40 | 20 (2:1) | #5f27cd (Purple) | Town-wide global events |

### Visual Characteristics

**3-Cusp Deltoid (Career):** Sharp, aggressive curves representing the harsh realities of professional life.

**4-Cusp Astroid (Health):** Balanced four-fold symmetry reflecting the holistic nature of wellbeing.

**5-Cusp Path (Social):** Complex interactions representing the intricate web of human relationships.

**6-Cusp Path (Personal):** Gentle, flowing curves symbolizing personal growth and self-discovery.

**2-Cusp Path (Babel Events):** Simple figure-eight representing the binary nature of global events (boom/bust, peace/war).

## Tile Placement System

### Segment Distribution
Each ring is divided into **10 equal arc-length segments**, creating 50 total tiles on the board.

### Tile Generation Algorithm
1. Calculate the total arc length of each hypocycloid curve
2. Divide by 10 to get equal-length segments
3. Place tile markers at segment midpoints
4. Color-code tiles to match their ring's domain

### Player Movement
Players move clockwise around the rings, with the ability to:
- **Standard Movement:** Follow the curve of your current ring
- **Ring Transitions:** Special events can move players between rings
- **Express Routes:** Some cards allow shortcuts or ring-jumping

## Personal Modifier System

### Character Overlay Rendering
Each player's character modifiers create a personalized overlay on the shared board:

```javascript
const personalModifiers = {
  Career: 1.15,    // +15% radius - more career volatility
  Health: 0.90,    // -10% radius - tighter health loop
  Social: 1.20,    // +20% radius - increased social drama
  Personal: 1.00,  // Standard radius
  BabelEvents: 1.30 // +30% radius - crisis magnet
};
```

### Visual Implementation
- **Dashed overlays** show each player's modified probability zones
- **Color transparency** prevents visual clutter while maintaining clarity
- **Dynamic updates** reflect character development during gameplay

## Technical Implementation

### SVG Rendering Pipeline
1. **Generate Coordinates:** Calculate hypocycloid points for each ring
2. **Create Paths:** Convert coordinate arrays to SVG path strings
3. **Apply Styling:** Add colors, strokes, and visual effects
4. **Place Tiles:** Position interactive tile markers
5. **Render Overlays:** Add personal modifier visualizations

### Responsive Design
- **Viewport scaling:** Board adapts to different screen sizes
- **Touch optimization:** Tile interactions work on mobile devices
- **Performance optimization:** Efficient rendering for real-time updates

### Animation System
- **Smooth transitions:** Player movement follows curve geometry
- **Visual feedback:** Tile highlighting and selection states
- **Dynamic effects:** Ring pulsing during global events

## Design Philosophy

### Aesthetic Principles
- **Mathematical Beauty:** Curves are inherently pleasing and organic
- **Color Psychology:** Ring colors reflect emotional associations with life domains
- **Symbolic Representation:** Cusp count correlates with domain complexity

### Gameplay Integration
- **Visual Clarity:** Players instantly recognize their location and domain
- **Strategic Depth:** Ring-specific probabilities create meaningful choices
- **Narrative Coherence:** Board appearance reinforces thematic elements

### Accessibility Features
- **High Contrast:** Colors chosen for visibility and distinction
- **Clear Labeling:** Icons and text support color-coding
- **Scalable Design:** Works across devices and screen sizes

## Future Enhancements

### Advanced Rendering
- **3D Visualization:** Potential WebGL implementation for depth
- **Particle Effects:** Visual enhancement for dramatic events
- **Custom Animations:** Ring-specific movement patterns

### Interactive Elements
- **Tile Previews:** Hover effects showing potential events
- **Path Prediction:** Show probable movement paths
- **Historical Tracking:** Visual trail of player movement history

---

*The Chaos Circle serves as both game board and philosophical metaphor: life's path may seem chaotic, but underlying mathematical beauty emerges from the seeming randomness.*
