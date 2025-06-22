
# LPC Generator Analysis
*Created: December 21, 2024*

## Overview
This document provides a detailed analysis of the working LPC character generator to understand its architecture and implementation patterns for replicating in the development page sprite builder.

## File Structure Analysis

### Core Files
- `lpc-generator/index.html` - Main interface with embedded sprite data
- `lpc-generator/sources/chargen.js` - Core sprite loading and rendering engine (~2000+ lines)
- `lpc-generator/sources/chargen.css` - Styling for the interface
- `lpc-generator/sheet_definitions/` - JSON files defining sprite metadata
- `lpc-generator/spritesheets/` - Organized sprite assets

### Key Discovery: Data Attribute System
The LPC generator uses a sophisticated data attribute system embedded directly in the HTML:

```html
<input type="radio" id="hair_page_adult_male" 
       data-layer_1_male="/lpc-generator/spritesheets/hair/page/adult/walk.png"
       data-layer_1_female="/lpc-generator/spritesheets/hair/page/adult/walk.png"
       data-zpos="10"
       matchBodyColor="false">
```

**Critical Insight**: Paths are pre-validated and complete - no path construction needed!

## Core Architecture

### 1. Sprite Loading System (chargen.js)
```javascript
// Key constants from chargen.js
const universalFrameSize = 64;
const universalSheetWidth = 832;
const universalSheetHeight = 3456;

const base_animations = {
    spellcast: 0,
    thrust: 4 * universalFrameSize,
    walk: 8 * universalFrameSize,
    slash: 12 * universalFrameSize,
    shoot: 16 * universalFrameSize,
    hurt: 20 * universalFrameSize
};

const animationFrameCounts = {
    spellcast: 7,
    thrust: 8,
    walk: 9,
    slash: 6,
    shoot: 13,
    hurt: 6
};
```

### 2. Layer Management System
- Uses `itemsToDraw` array to track active layers
- Each layer has: `name`, `path`, `zIndex`, `visible` properties
- Layers are sorted by z-index for proper rendering order
- Background/foreground separation using `bg`/`fg` folders

### 3. Animation Engine
- Frame-based animation system with precise timing
- Uses `setInterval` for animation loops
- Supports multiple animation types with different frame counts
- Current frame tracking with automatic cycling

### 4. Canvas Rendering
```javascript
// Simplified rendering logic from chargen.js
function redraw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    itemsToDraw.forEach(item => {
        if (item.visible) {
            const img = images[item.path];
            if (img) {
                // Calculate frame position based on animation
                const sx = currentFrame * universalFrameSize;
                const sy = animationRow * universalFrameSize;
                
                ctx.drawImage(img, sx, sy, 
                    universalFrameSize, universalFrameSize,
                    0, 0, 
                    universalFrameSize, universalFrameSize);
            }
        }
    });
}
```

## Sprite Organization Patterns

### Directory Structure
```
spritesheets/
├── body/bodies/male/walk.png
├── hair/page/adult/walk.png
├── torso/clothes/longsleeve/male/walk.png
└── legs/pants/male/walk.png
```

### Animation Structure
Each sprite follows this pattern:
- `walk.png` - Main animation file
- Contains multiple rows (4 directions) and columns (9 frames for walk)
- Standard 64x64 frame size
- Universal sheet dimensions: 832x1344

## Form Control System

### Radio Button Groups
- Organized by body part categories
- Uses `name` attribute for grouping
- `data-*` attributes contain all sprite metadata
- `matchBodyColor` attribute for automatic color coordination

### Event Handling
```javascript
$("#chooser input[type=radio]").click(function() {
    if (matchBodyColor) {
        selectColorsToMatch($(this).attr("variant"));
    }
    setParams();
    redraw();
    showOrHideElements();
});
```

## Critical Success Patterns

### 1. Direct Data Extraction
- **Don't construct paths** - extract complete paths from data attributes
- Paths are already validated during the build process
- No need for complex path resolution logic

### 2. Layer Compositing
- Use z-index based rendering order
- Support for background/foreground layer separation
- Proper transparency handling

### 3. Animation Timing
- Frame-based system with consistent timing (200ms intervals)
- Support for different frame counts per animation
- Smooth cycling through animation frames

### 4. Error Handling
- Graceful fallbacks for missing images
- User feedback for loading states
- Console logging for debugging

## Implementation Strategy for Sprite Builder

### Phase 1: Data Extraction
1. Parse LPC generator HTML for all `data-layer_*` attributes
2. Build complete sprite catalog with exact paths
3. No path construction - use data as-is

### Phase 2: Core Rendering
1. Implement exact animation constants from chargen.js
2. Use proven layer management system
3. Copy canvas rendering logic directly

### Phase 3: UI Integration
1. Adapt LPC form controls to development page styling
2. Implement same event handling patterns
3. Maintain all functionality while updating appearance

## Next Steps
1. Extract complete sprite data from LPC generator HTML
2. Implement proven animation and rendering systems
3. Create development page UI that uses this foundation
4. Test with known working sprite paths

---
*This analysis provides the foundation for implementing a fully functional sprite builder based on proven, working code.*
