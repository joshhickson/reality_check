
# LPC Sprite Builder Action Plan
*Priority-ordered tasks for immediate implementation*

## Key Insights from Working LPC Generator

### Why the LPC Generator Works
1. **Pre-built Asset Paths**: Uses `generate_sources.js` to create validated sprite paths during build time
2. **Data Attributes System**: Each form element has `data-layer_1_male`, `data-layer_1_female` etc. with correct paths
3. **Proper Layer Management**: Uses background/foreground separation (`bg`/`fg` folders)
4. **Canvas Compositing**: Implements proper z-index based layer stacking
5. **Animation Framework**: Has complete animation definitions with frame counts and timing

### Critical Learning: Path Construction Strategy
- **Current Problem**: We're trying to construct paths at runtime from parsed HTML
- **LPC Solution**: Paths are pre-validated and embedded in data attributes during build
- **Our Fix**: Extract paths directly from data attributes, don't reconstruct them

## Phase 1: Critical Fixes (High Priority)

### Task 1.1: Fix Debug Panel Visibility
**Status**: 🔴 Broken  
**Estimated Time**: 30 minutes  
**Dependencies**: None

**Steps**:
1. Open browser developer tools when clicking "Debug Sprites"
2. Check if debug panel element exists in DOM
3. Inspect panel's CSS properties (display, position, z-index)
4. Add visible styling: `background: rgba(0,0,0,0.9); color: white; border: 2px solid green;`
5. Ensure panel is positioned: `position: fixed; top: 50px; left: 50px; z-index: 9999;`

**Success Criteria**: Debug panel becomes visible when button is clicked

### Task 1.2: Audit LPC Spritesheet Directory Structure
**Status**: 🔴 Investigation needed  
**Estimated Time**: 45 minutes  
**Dependencies**: None

**Steps**:
1. Navigate to `/lpc-generator/spritesheets/` in file browser
2. Document actual directory structure for common paths:
   - `/lpc-generator/spritesheets/body/bodies/male/walk.png`
   - `/lpc-generator/spritesheets/hair/page/adult/walk.png` 
   - `/lpc-generator/spritesheets/torso/clothes/longsleeve/`
3. Compare with failing paths in console logs
4. Create path mapping reference document

**Success Criteria**: Clear understanding of correct sprite paths

### Task 1.3: Fix Path Construction Logic
**Status**: 🔴 Broken  
**Estimated Time**: 1 hour  
**Dependencies**: Task 1.2

**NEW STRATEGY** (Based on LPC Generator Analysis):
1. **Direct Data Attribute Extraction**: Parse LPC HTML for exact data attribute values
2. **No Path Reconstruction**: Use paths exactly as embedded in LPC generator
3. **Layer Background/Foreground Support**: Handle `bg`/`fg` sprite separation
4. **Z-Index Implementation**: Use proper layer stacking from LPC system

**Steps**:
1. Create function to extract all `data-layer_*` attributes from LPC generator HTML
2. Build sprite catalog from extracted data (no path construction)
3. Implement LPC-style layer management with bg/fg separation
4. Add z-index based rendering system

**Success Criteria**: Sprite paths match exactly what works in LPC generator

## Phase 2: Core Functionality (Medium Priority)

### Task 2.1: Implement Basic Character Rendering
**Status**: 🟡 Partially implemented  
**Estimated Time**: 2 hours  
**Dependencies**: Task 1.3

**Steps**:
1. Fix `loadLayer()` method to properly load sprite images
2. Update `drawCurrentFrame()` to composite layers correctly
3. Ensure body sprite loads and displays on canvas
4. Add basic error handling for failed image loads

**Success Criteria**: Static character sprite appears on canvas

### Task 2.2: Enable Animation System
**Status**: 🟡 Framework exists  
**Estimated Time**: 1 hour  
**Dependencies**: Task 2.1

**Steps**:
1. Fix animation frame cycling in `startAnimation()`
2. Ensure proper timing with `animationSpeed` setting
3. Test walking animation displays correctly
4. Add animation start/stop controls

**Success Criteria**: Character walking animation plays smoothly

### Task 2.3: Connect UI Controls
**Status**: 🔴 Not functional  
**Estimated Time**: 1.5 hours  
**Dependencies**: Task 2.1

**Steps**:
1. Bind event listeners to body type radio buttons
2. Connect hair style dropdown to sprite loading
3. Link clothing options to character generation
4. Test all controls trigger sprite updates

**Success Criteria**: All UI controls modify displayed character

## Phase 3: Layer Management (Low Priority)

### Task 3.1: Fix Layer List Display
**Status**: 🔴 Not showing  
**Estimated Time**: 45 minutes  
**Dependencies**: Task 2.1

**Steps**:
1. Update `updateLayerList()` to show loaded layers
2. Add layer visibility checkboxes
3. Implement layer up/down buttons
4. Style layer list for better visibility

**Success Criteria**: Layer list shows all loaded sprite layers

### Task 3.2: Implement Layer Controls
**Status**: 🔴 Not functional  
**Estimated Time**: 1 hour  
**Dependencies**: Task 3.1

**Steps**:
1. Fix `toggleLayerVisibility()` function
2. Implement `moveLayer()` for reordering
3. Update canvas rendering when layers change
4. Add visual feedback for layer operations

**Success Criteria**: Users can control individual sprite layers

## Phase 4: Polish & Testing (Ongoing)

### Task 4.1: Error Handling & Feedback
**Estimated Time**: 1 hour  
**Dependencies**: Previous phases

**Steps**:
1. Add loading indicators during sprite generation
2. Display user-friendly error messages
3. Implement graceful fallbacks for missing assets
4. Add console logging for debugging

### Task 4.2: Performance Optimization
**Estimated Time**: 1 hour  
**Dependencies**: Previous phases

**Steps**:
1. Implement sprite caching to prevent re-loading
2. Optimize animation loop performance
3. Add memory cleanup for unused sprites
4. Test performance with multiple characters

## Testing Protocol

### After Each Task
1. Test in browser with developer tools open
2. Check console for errors or warnings
3. Verify functionality matches success criteria
4. Document any new issues discovered

### Complete Phase Testing
1. Run through full user workflow
2. Test edge cases and error conditions
3. Verify integration with development page
4. Check mobile/responsive behavior

## Risk Mitigation

### High-Risk Areas
1. **LPC Asset Integration**: Complex file structure may have unexpected patterns
2. **Canvas Rendering**: Browser compatibility issues with animation
3. **Memory Leaks**: Large sprites may cause performance problems

### Mitigation Strategies
1. Create comprehensive path testing before implementation
2. Test across multiple browsers during development
3. Implement resource cleanup and monitoring

## Success Metrics

### Technical Metrics
- [ ] Zero console errors during normal operation
- [ ] All sprite paths resolve successfully  
- [ ] Animation runs at consistent 60fps
- [ ] Memory usage remains stable over time

### User Experience Metrics
- [ ] Debug panel appears within 1 second of clicking
- [ ] Character updates appear within 2 seconds of control changes
- [ ] All UI controls provide immediate visual feedback
- [ ] Error messages are clear and actionable

---

**Next Action**: Start with Task 1.1 (Fix Debug Panel Visibility)
