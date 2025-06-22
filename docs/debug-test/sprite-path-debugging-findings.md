
# Sprite Path Debugging Findings - December 21, 2024

## Issue Summary

The sprite builder is successfully initializing and extracting LPC data, but failing to load actual sprite images due to incorrect path construction. The system is attempting to load non-existent sprite files.

## Console Log Analysis

### Successful Operations
- ✅ Sprite Builder initialization: "✅ Sprite Builder initialized successfully!"
- ✅ LPC data extraction: "Found 12575 sprite inputs" and "✅ Extraction complete"
- ✅ Data structure creation: 8 categories, 611 available sprites

### Failed Operations
- ❌ Sprite loading: Multiple "Failed to load layer" errors for paths like:
  - `/lpc-generator/spritesheets/torso/clothes/longsleeve/longsleeve/walk.png`
  - `/lpc-generator/spritesheets/legs/pants/child/walk.png`
  - `/lpc-generator/spritesheets/hair/ponytail/adult/walk.png`

## Root Cause Analysis

### Path Construction Issues

1. **Double Directory Names**: Some paths contain duplicate directory names:
   - Generated: `/lpc-generator/spritesheets/torso/clothes/longsleeve/longsleeve/walk.png`
   - Should be: `/lpc-generator/spritesheets/torso/clothes/longsleeve/walk.png`

2. **Incorrect Body Type Mapping**: The system is looking for color variants as separate files:
   - Generated: `body/bodies/male/light.png`
   - Reality: Color variants are applied to base files like `body/bodies/male/walk.png`

3. **Missing Animation Context**: The system constructs paths without proper animation context:
   - Current approach: Treats "light" as a filename
   - Correct approach: "light" is a color variant to apply to animation files

## Directory Structure Analysis

Based on the actual LPC generator structure at `/lpc-generator/spritesheets/`:

### Correct Path Patterns
- Body sprites: `body/bodies/{bodyType}/{animation}.png`
- Hair sprites: `hair/{style}/adult/{animation}.png`
- Clothing: `torso/clothes/{type}/{bodyType}/{animation}.png`
- Legs: `legs/{type}/{bodyType}/{animation}.png`

### Animation Files Available
Standard animations include: `walk.png`, `hurt.png`, `idle.png`, `run.png`, `shoot.png`, `slash.png`, `spellcast.png`, `thrust.png`

## LPC Data Extraction Success

The sprite builder successfully extracts comprehensive data:
- **Total sprites**: 611 available sprites across 8 categories
- **Input elements**: 12,575 sprite inputs processed
- **Categories**: Body, hair, clothing, accessories, etc.

## Current Path Resolution Logic

The system uses:
```javascript
const fullPath = path.startsWith('/lpc-generator/') ? path : `/lpc-generator/spritesheets/${path}`;
```

This logic is correct but the input paths themselves are malformed.

## Required Fixes

### 1. Path Construction Algorithm
- Separate base sprite paths from color variants
- Use animation context (default to 'walk.png')
- Handle duplicate directory names in path construction

### 2. Color Variant Handling
- Treat color information as rendering modifiers, not path components
- Load base sprite files first, then apply color variants via canvas manipulation

### 3. Animation System
- Default to 'walk' animation for initial loading
- Implement animation switching once base loading works

## Working Reference

The `/lpc-generator/index.html` serves as the gold standard - it successfully loads and displays all sprites with proper path resolution and color variant handling.

## Next Steps

1. **Fix Path Construction**: Implement proper path building that matches actual file structure
2. **Implement Color System**: Separate color variants from file paths
3. **Add Fallback Logic**: Handle missing files gracefully
4. **Test with Known Good Paths**: Start with confirmed working sprite files

## Test Cases for Validation

### Known Working Paths (to verify fix)
- `/lpc-generator/spritesheets/body/bodies/male/walk.png`
- `/lpc-generator/spritesheets/hair/page/adult/walk.png`
- `/lpc-generator/spritesheets/torso/clothes/longsleeve/male/walk.png`

### Expected Failures (to handle gracefully)
- Any path with duplicate directory names
- Any path using color names as filenames
- Any path missing animation specification

---

*This document should be updated as fixes are implemented and tested.*
