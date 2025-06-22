
async function validateActualPaths() {
    const { validPaths } = extractValidSpritePaths();
    const results = {
        existing: [],
        missing: [],
        total: validPaths.size
    };
    
    console.log(`🔍 Validating ${validPaths.size} paths...`);
    
    for (const [path, info] of validPaths) {
        try {
            const response = await fetch(path, { method: 'HEAD' });
            if (response.ok) {
                results.existing.push({ path, info });
            } else {
                results.missing.push({ path, info, status: response.status });
            }
        } catch (error) {
            results.missing.push({ path, info, error: error.message });
        }
    }
    
    console.log(`✅ Found ${results.existing.length} existing files`);
    console.log(`❌ Missing ${results.missing.length} files`);
    
    return results;
}

// Debug function to show working paths by category
function debugWorkingPaths() {
    const mappings = generateWorkingPathMappings();
    
    mappings.forEach((paths, category) => {
        console.log(`\n📁 ${category.toUpperCase()}:`);
        paths.slice(0, 3).forEach(pathInfo => {
            console.log(`  ${pathInfo.bodyType}/${pathInfo.animation}: ${pathInfo.path}`);
        });
        if (paths.length > 3) {
            console.log(`  ... and ${paths.length - 3} more`);
        }
    });
}

// Get working sprite for a specific category and body type
function getWorkingSprite(category, bodyType = 'male', animation = 'walk') {
    const mappings = generateWorkingPathMappings();
    const categoryPaths = mappings.get(category);
    
    if (!categoryPaths) {
        console.warn(`❌ No paths found for category: ${category}`);
        return null;
    }
    
    // Find exact match
    let match = categoryPaths.find(p => 
        p.bodyType === bodyType && p.animation === animation
    );
    
    // Fallback to any path in the category
    if (!match) {
        match = categoryPaths.find(p => p.bodyType === bodyType);
    }
    
    if (!match) {
        match = categoryPaths[0]; // Last resort
    }
    
    return match?.path || null;
}
