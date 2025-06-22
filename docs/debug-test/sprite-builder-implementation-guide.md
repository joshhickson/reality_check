
# LPC Sprite Builder Implementation Guide
*Created: June 21, 2025*

## Overview

This document provides step-by-step instructions for implementing a fully functional LPC (Liberated Pixel Cup) sprite builder in the Reality Check development environment. The sprite builder should replicate the core functionality of the existing LPC generator while integrating seamlessly with the development page.

## Current State Analysis

### What Works
- ✅ LPC generator (`/lpc-generator/index.html`) is fully functional
- ✅ Canvas elements are properly sized and positioned
- ✅ Basic sprite builder class structure exists
- ✅ Animation system framework is in place

### What's Broken
- ❌ Debug panel is not visible when "Debug Sprites" is clicked
- ❌ Sprite paths are incorrectly constructed, causing load failures
- ❌ No actual sprite rendering or animation display
- ❌ Character customization controls not connected to sprite generation

## Implementation Instructions

### Phase 0: LPC System Integration (NEW PRIORITY)

**Objective**: Leverage the working LPC generator mechanisms directly.

**Implementation Steps**:
1. **Extract LPC Data Catalog**:
   ```javascript
   // Parse LPC generator HTML for all data attributes
   const lpcElements = lpcDoc.querySelectorAll('[data-layer_1_male], [data-layer_1_female]');
   const spriteCatalog = extractLPCSpriteCatalog(lpcElements);
   ```

2. **Import LPC Animation System**:
   ```javascript
   // Use LPC's animation definitions from chargen.js
   const base_animations = {
     spellcast: 0, thrust: 4 * 64, walk: 8 * 64, slash: 12 * 64,
     shoot: 16 * 64, hurt: 20 * 64
   };
   ```

3. **Implement LPC Layer System**:
   ```javascript
   // Support bg/fg layer separation like LPC
   const layers = [
     { name: 'body_bg', zIndex: 0 },
     { name: 'body', zIndex: 1 },
     { name: 'hair_bg', zIndex: 2 },
     { name: 'hair', zIndex: 3 }
   ];
   ```

### Phase 1: Fix Debug Panel Visibility

**Problem**: Debug panel exists but is not visible to users.

**Solution Steps**:
1. Check if debug panel is being created off-screen
2. Verify z-index conflicts with existing page elements
3. Ensure panel is appended to correct DOM parent
4. Add visible styling and positioning

**Code Changes Needed**:
- Update `debugSprites()` method in `sprite-builder.js`
- Ensure panel has proper CSS positioning (fixed, with high z-index)
- Add visible background color and border for debugging
- Test panel visibility in browser developer tools

### Phase 2: Fix LPC Asset Path Resolution

**Problem**: Sprite paths like `/lpc-generator/spritesheets/torso/clothes/longsleeve/longsleeve/walk.png` are failing to load.

**Investigation Required**:
1. Verify actual directory structure in `/lpc-generator/spritesheets/`
2. Compare working paths from LPC generator with failing paths
3. Identify correct path construction pattern

**Solution Steps**:
1. Audit existing spritesheet directory structure
2. Create path validation utility function
3. Update `extractImagePath()` method to use correct path patterns
4. Add fallback path resolution for missing assets
5. Implement proper error handling for failed image loads

### Phase 3: Implement Character Rendering

**Objective**: Display animated character sprites on canvas.

**Requirements**:
1. Load and composite multiple sprite layers (body, hair, clothing)
2. Display walking animation by default
3. Support animation frame cycling
4. Handle different body types (male, female, child, etc.)

**Implementation Steps**:
1. Fix image loading in `loadLayer()` method
2. Implement proper layer compositing in `drawCurrentFrame()`
3. Ensure animation timing works correctly
4. Add error handling for missing sprites

### Phase 4: Connect UI Controls to Sprite Generation

**Objective**: Make character customization controls functional.

**Controls to Implement**:
- Body type selection (male/female/child/teen)
- Hair style selection
- Clothing options
- Skin tone selection
- Animation type selection

**Implementation Steps**:
1. Bind event listeners to all form controls
2. Update character configuration when controls change
3. Reload character sprites when configuration changes
4. Provide visual feedback during loading

### Phase 5: Layer Management System

**Objective**: Allow users to manage sprite layers.

**Features to Implement**:
1. Layer visibility toggles
2. Layer reordering (up/down)
3. Layer list display
4. Add/remove layers

**Implementation Steps**:
1. Fix `updateLayerList()` to display loaded layers
2. Implement `toggleLayerVisibility()` functionality
3. Add layer reordering with `moveLayer()`
4. Update canvas rendering when layers change

## Critical Path: LPC Data Integration

### Understanding the LPC Generator Architecture

**BREAKTHROUGH**: After accessing the working LPC generator, the architecture is now clear:

1. **Build Process**: `generate_sources.js` processes `sheet_definitions/` JSON files
2. **HTML Generation**: Creates form elements with `data-*` attributes containing COMPLETE sprite paths
3. **Runtime Processing**: JavaScript reads data attributes DIRECTLY - no path construction needed
4. **Layer System**: Uses `bg`/`fg` folder structure for background/foreground sprites
5. **Animation Engine**: Complete animation framework with defined frame counts and timing

### Key Files Analysis
- `sources/chargen.js`: Complete sprite loading and animation system (2000+ lines)
- `index.html`: Contains all sprite metadata in data attributes
- `spritesheets/`: Organized by asset type with standardized animation folders

### Critical Discovery: Data Attribute Format
```html
<input data-layer_1_male="/lpc-generator/spritesheets/hair/page/adult/walk.png" 
       data-layer_1_female="/lpc-generator/spritesheets/hair/page/adult/walk.png">
```
**This means paths are PRE-VALIDATED and complete - we don't need to construct them!**

### Integration Strategy

**NEW RECOMMENDED APPROACH** (Based on Analysis):
**Option A: Direct Data Attribute Extraction** (Now Proven Strategy)
- Parse LPC generator's `index.html` for complete data attributes
- Extract EXACT sprite paths (no reconstruction needed)
- Import LPC animation system directly
- Pros: Uses validated paths, proven system, simpler than expected
- Cons: None - this is how LPC actually works

**Option B: LPC System Replication** (Advanced)
- Replicate LPC's `chargen.js` rendering system
- Implement LPC's layer management and animation framework
- Use LPC's sprite organization patterns
- Pros: Full feature parity, robust system
- Cons: Complex implementation

**Recommended Path**: Start with Option A (extract exact paths), then gradually integrate LPC rendering system components.

## Testing Strategy

### Manual Testing Checklist

1. **Debug Panel**:
   - [ ] Click "Debug Sprites" button
   - [ ] Verify panel appears and is visible
   - [ ] Check panel positioning and styling
   - [ ] Test close functionality

2. **Sprite Loading**:
   - [ ] Verify sprite paths are correctly constructed
   - [ ] Check that images load successfully
   - [ ] Test fallback behavior for missing images
   - [ ] Validate error messages in console

3. **Character Rendering**:
   - [ ] Confirm character appears on canvas
   - [ ] Test walking animation plays correctly
   - [ ] Verify layer compositing works
   - [ ] Check animation frame timing

4. **UI Controls**:
   - [ ] Test body type selection
   - [ ] Verify hair style changes
   - [ ] Test clothing options
   - [ ] Check animation type switching

5. **Layer Management**:
   - [ ] Verify layer list displays correctly
   - [ ] Test layer visibility toggles
   - [ ] Check layer reordering functionality
   - [ ] Test add/remove layers

### Automated Testing

Consider adding:
- Unit tests for path construction logic
- Integration tests for sprite loading
- Visual regression tests for character rendering

## Error Handling Requirements

### User-Facing Errors
- Display helpful messages for missing sprites
- Show loading indicators during sprite generation
- Provide fallback options when assets fail to load

### Developer Debugging
- Comprehensive console logging for sprite loading
- Path validation with detailed error messages
- Performance metrics for sprite generation

## Performance Considerations

### Optimization Strategies
1. **Image Caching**: Implement robust sprite caching to avoid re-loading
2. **Lazy Loading**: Load sprites only when needed
3. **Sprite Atlasing**: Consider combining small sprites into atlases
4. **Animation Optimization**: Use requestAnimationFrame for smooth animation

### Memory Management
- Dispose of unused canvas contexts
- Implement sprite garbage collection
- Monitor memory usage during long sessions

## Future Enhancements

### Advanced Features (Post-MVP)
1. **Custom Animations**: Support for user-defined animation sequences
2. **Sprite Export**: Export generated sprites as PNG files
3. **Multiple Characters**: Support multiple character previews
4. **Animation Editor**: In-browser animation timeline editing

### Integration Features
1. **Game Integration**: Direct integration with Reality Check game assets
2. **Asset Pipeline**: Automated sprite generation for game characters
3. **Multiplayer Avatars**: Generate avatars for multiplayer sessions

## Success Criteria

The sprite builder implementation is considered successful when:

1. **Core Functionality**: All basic features work without errors
2. **User Experience**: Intuitive interface with clear feedback
3. **Performance**: Smooth animation and responsive controls
4. **Reliability**: Handles edge cases and errors gracefully
5. **Maintainability**: Clean, documented code that can be extended

## Next Steps

### Immediate Actions (Based on LPC Analysis)
1. **Extract LPC Sprite Catalog**: Parse working LPC generator for complete sprite data
2. **Fix Debug Panel**: Make debug panel visible to access LPC data
3. **Implement Direct Path Usage**: Stop constructing paths, use LPC data directly
4. **Import LPC Animation System**: Use proven animation framework from chargen.js

### Short-term Goals
1. **Character Rendering**: Use LPC compositing system for proper sprite layering
2. **Animation Support**: Implement LPC's animation timing and frame management
3. **UI Controls**: Connect controls to LPC's sprite selection system

### Medium-term Integration
1. **Full LPC Feature Parity**: Replicate all LPC generator functionality
2. **Custom Development UI**: Adapt LPC system to development page styling
3. **Performance Optimization**: Optimize for development workflow

### Long-term Enhancements
1. **Extended Asset Support**: Add custom sprites beyond LPC collection
2. **Real-time Editing**: Live sprite editing and preview
3. **Game Integration**: Direct integration with Reality Check character system

## Critical Success Metric
**The sprite builder should work exactly like the LPC generator with development page styling.**

---

*This guide should be updated as implementation progresses and new issues are discovered.*
