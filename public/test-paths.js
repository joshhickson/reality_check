
// Quick test to verify path extraction is working
async function testPathExtraction() {
    console.log('🧪 Testing path extraction...');
    
    // Extract paths
    const { validPaths, pathsByCategory } = extractValidSpritePaths();
    console.log(`📊 Total paths: ${validPaths.size}`);
    
    // Test a few known categories
    const testCategories = ['hair', 'body', 'torso', 'legs'];
    
    for (const category of testCategories) {
        const workingPath = getWorkingSprite(category, 'male', 'walk');
        if (workingPath) {
            console.log(`✅ ${category}: ${workingPath}`);
            
            // Test if the path actually loads
            try {
                const response = await fetch(workingPath, { method: 'HEAD' });
                console.log(`  Status: ${response.status} ${response.ok ? '✅' : '❌'}`);
            } catch (error) {
                console.log(`  Error: ${error.message} ❌`);
            }
        } else {
            console.log(`❌ ${category}: No working path found`);
        }
    }
}

// Call this in console to test: testPathExtraction()
