// Enhanced test to verify path extraction and export results
async function testPathExtraction() {
    console.log('🧪 Starting comprehensive path extraction test...');

    const results = {
        timestamp: new Date().toISOString(),
        totalPaths: 0,
        validPaths: [],
        invalidPaths: [],
        pathsByCategory: {},
        workingSprites: {},
        failedTests: [],
        summary: {}
    };

    try {
        // Extract paths using the existing LPC data extractor
        const { validPaths, pathsByCategory } = extractValidSpritePaths();
        results.totalPaths = validPaths.size;

        console.log(`📊 Found ${validPaths.size} total paths across ${pathsByCategory.size} categories`);

        // Convert Maps to Objects for JSON export
        results.pathsByCategory = {};
        pathsByCategory.forEach((paths, category) => {
            results.pathsByCategory[category] = Array.from(paths);
        });

        // Test each category for working sprites
        const testCategories = ['hair', 'body', 'torso', 'legs', 'feet', 'head', 'arms'];
        const bodyTypes = ['male', 'female', 'child', 'teen'];
        const animations = ['walk', 'hurt', 'idle', 'shoot', 'slash'];

        for (const category of testCategories) {
            console.log(`\n🔍 Testing category: ${category}`);
            results.workingSprites[category] = {};

            for (const bodyType of bodyTypes) {
                results.workingSprites[category][bodyType] = {};

                for (const animation of animations) {
                    const testResult = await testSpriteLoad(category, bodyType, animation);
                    results.workingSprites[category][bodyType][animation] = testResult;

                    if (testResult.success) {
                        results.validPaths.push(testResult.path);
                        console.log(`  ✅ ${category}/${bodyType}/${animation}: ${testResult.path}`);
                    } else {
                        results.invalidPaths.push({
                            category,
                            bodyType,
                            animation,
                            attemptedPath: testResult.attemptedPath,
                            error: testResult.error
                        });
                        console.log(`  ❌ ${category}/${bodyType}/${animation}: ${testResult.error}`);
                    }
                }
            }
        }

        // Generate summary
        results.summary = {
            totalValidPaths: results.validPaths.length,
            totalInvalidPaths: results.invalidPaths.length,
            categoryCounts: {},
            successRate: (results.validPaths.length / (results.validPaths.length + results.invalidPaths.length) * 100).toFixed(2) + '%'
        };

        // Count paths by category
        Object.keys(results.pathsByCategory).forEach(category => {
            results.summary.categoryCounts[category] = results.pathsByCategory[category].length;
        });

        // Export results to downloadable files
        await exportResults(results);

        console.log('\n📋 Test Summary:');
        console.log(`✅ Valid paths: ${results.summary.totalValidPaths}`);
        console.log(`❌ Invalid paths: ${results.summary.totalInvalidPaths}`);
        console.log(`📊 Success rate: ${results.summary.successRate}`);
        console.log('📁 Results exported to downloadable files');

        return results;

    } catch (error) {
        console.error('❌ Test failed:', error);
        results.failedTests.push({
            error: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });
        await exportResults(results);
        throw error;
    }
}

// Test individual sprite loading
async function testSpriteLoad(category, bodyType, animation) {
    try {
        // Try to find a working sprite path using LPC data
        const sprite = window.lpcExtractor?.getSprite(category, 'default', bodyType);
        if (!sprite || !sprite.activePath) {
            return {
                success: false,
                attemptedPath: `No LPC data found for ${category}/${bodyType}`,
                error: 'No sprite data available'
            };
        }

        // Construct the expected path with animation
        const basePath = sprite.activePath.replace(/\/[^/]+\.png$/, '');
        const testPath = `${basePath}/${animation}.png`;

        // Test if the path loads
        const response = await fetch(testPath, { method: 'HEAD' });

        if (response.ok) {
            return {
                success: true,
                path: testPath,
                status: response.status
            };
        } else {
            return {
                success: false,
                attemptedPath: testPath,
                error: `HTTP ${response.status}: ${response.statusText}`
            };
        }

    } catch (error) {
        return {
            success: false,
            attemptedPath: `${category}/${bodyType}/${animation}`,
            error: error.message
        };
    }
}

// Export results to downloadable files
async function exportResults(results) {
    try {
        // Create comprehensive JSON report
        const jsonReport = JSON.stringify(results, null, 2);
        downloadFile('sprite-path-test-results.json', jsonReport, 'application/json');

        // Create CSV report of valid paths
        const validPathsCsv = createValidPathsCsv(results.validPaths);
        downloadFile('valid-sprite-paths.csv', validPathsCsv, 'text/csv');

        // Create CSV report of invalid paths
        const invalidPathsCsv = createInvalidPathsCsv(results.invalidPaths);
        downloadFile('invalid-sprite-paths.csv', invalidPathsCsv, 'text/csv');

        // Create summary report
        const summaryReport = createSummaryReport(results);
        downloadFile('sprite-test-summary.txt', summaryReport, 'text/plain');

        console.log('📁 Exported files:');
        console.log('  • sprite-path-test-results.json - Complete test results');
        console.log('  • valid-sprite-paths.csv - All working sprite paths');
        console.log('  • invalid-sprite-paths.csv - All failed sprite paths');
        console.log('  • sprite-test-summary.txt - Human-readable summary');

    } catch (error) {
        console.error('❌ Failed to export results:', error);
    }
}

// Create CSV of valid paths
function createValidPathsCsv(validPaths) {
    const headers = 'Path,Category,BodyType,Animation,Status\n';
    const rows = validPaths.map(path => {
        const pathParts = path.split('/');
        const filename = pathParts[pathParts.length - 1];
        const animation = filename.replace('.png', '');
        const category = pathParts.includes('spritesheets') ? pathParts[pathParts.indexOf('spritesheets') + 1] : 'unknown';

        return `"${path}","${category}","","${animation}","working"`;
    });

    return headers + rows.join('\n');
}

// Create CSV of invalid paths
function createInvalidPathsCsv(invalidPaths) {
    const headers = 'Category,BodyType,Animation,AttemptedPath,Error\n';
    const rows = invalidPaths.map(item => {
        return `"${item.category}","${item.bodyType}","${item.animation}","${item.attemptedPath}","${item.error}"`;
    });

    return headers + rows.join('\n');
}

// Create human-readable summary
function createSummaryReport(results) {
    let report = `SPRITE PATH TEST SUMMARY\n`;
    report += `Generated: ${results.timestamp}\n`;
    report += `${'='.repeat(50)}\n\n`;

    report += `OVERALL RESULTS:\n`;
    report += `Total paths found: ${results.totalPaths}\n`;
    report += `Valid paths tested: ${results.summary.totalValidPaths}\n`;
    report += `Invalid paths: ${results.summary.totalInvalidPaths}\n`;
    report += `Success rate: ${results.summary.successRate}\n\n`;

    report += `PATHS BY CATEGORY:\n`;
    Object.entries(results.summary.categoryCounts).forEach(([category, count]) => {
        report += `${category}: ${count} paths\n`;
    });

    report += `\nCOMMON ERRORS:\n`;
    const errorCounts = {};
    results.invalidPaths.forEach(item => {
        const error = item.error.split(':')[0]; // Get error type
        errorCounts[error] = (errorCounts[error] || 0) + 1;
    });

    Object.entries(errorCounts)
        .sort(([,a], [,b]) => b - a)
        .forEach(([error, count]) => {
            report += `${error}: ${count} occurrences\n`;
        });

    return report;
}

// Download file utility
function downloadFile(filename, content, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// Enhanced path discovery function
function discoverAllSpritePaths() {
    console.log('🔍 Discovering all available sprite paths...');

    // Use the LPC data extractor to get comprehensive path information
    if (!window.lpcExtractor) {
        console.error('❌ LPC Extractor not available. Please load lpc-data-extractor.js first.');
        return null;
    }

    const extractedData = window.lpcExtractor.extractedData;
    const allPaths = new Set();

    // Extract all paths from the LPC data
    Object.values(extractedData.sprites).forEach(spriteGroup => {
        Object.values(spriteGroup).forEach(sprite => {
            Object.values(sprite.paths).forEach(path => {
                if (path && path.includes('.png')) {
                    allPaths.add(path);
                }
            });
        });
    });

    console.log(`📊 Discovered ${allPaths.size} unique sprite paths from LPC data`);
    return Array.from(allPaths);
}

// Helper function to test if a path exists
async function testPathExists(path) {
    try {
        const response = await fetch(path, { method: 'HEAD' });
        return response.ok;
    } catch (error) {
        return false;
    }
}

// Helper function to categorize paths
function getPathCategory(path) {
    if (path.includes('/body/')) return 'body';
    if (path.includes('/hair/')) return 'hair';
    if (path.includes('/torso/')) return 'torso';
    if (path.includes('/legs/')) return 'legs';
    if (path.includes('/feet/')) return 'feet';
    if (path.includes('/head/')) return 'head';
    if (path.includes('/arms/')) return 'arms';
    return 'misc';
}

// Helper function to extract animation from path
function getPathAnimation(path) {
    const match = path.match(/\/([^\/]+)\.png$/);
    return match ? match[1] : 'unknown';
}

// Test path discovery using actual LPC data
    console.log('🔍 Testing sprite path discovery...');

    if (!window.lpcExtractor || !window.lpcExtractor.spriteData) {
        throw new Error('LPC data not loaded. Please run loadLPCData() first.');
    }

    const spriteData = window.lpcExtractor.spriteData;
    const categorizedData = window.lpcExtractor.categorizedData;

    console.log('📊 Available sprite data:', Object.keys(spriteData).length, 'sprites');
    console.log('📊 Categorized data:', categorizedData);

    let totalTested = 0;
    const validPaths = [];
    const invalidPaths = [];

    // Test actual LPC sprite paths
    for (const [spriteName, sprite] of Object.entries(spriteData)) {
        if (sprite.male) {
            try {
                const exists = await testPathExists(sprite.male);
                totalTested++;

                if (exists) {
                    validPaths.push({
                        path: sprite.male,
                        category: getPathCategory(sprite.male),
                        bodyType: 'male',
                        animation: getPathAnimation(sprite.male),
                        status: 'valid',
                        spriteName
                    });
                } else {
                    invalidPaths.push({
                        category: getPathCategory(sprite.male),
                        bodyType: 'male',
                        animation: getPathAnimation(sprite.male),
                        attemptedPath: sprite.male,
                        error: 'File not found',
                        spriteName
                    });
                }
            } catch (error) {
                invalidPaths.push({
                    category: getPathCategory(sprite.male),
                    bodyType: 'male',
                    animation: 'unknown',
                    attemptedPath: sprite.male,
                    error: error.message,
                    spriteName
                });
            }
        }

        if (sprite.female) {
            try {
                const exists = await testPathExists(sprite.female);
                totalTested++;

                if (exists) {
                    validPaths.push({
                        path: sprite.female,
                        category: getPathCategory(sprite.female),
                        bodyType: 'female',
                        animation: getPathAnimation(sprite.female),
                        status: 'valid',
                        spriteName
                    });
                } else {
                    invalidPaths.push({
                        category: getPathCategory(sprite.female),
                        bodyType: 'female',
                        animation: getPathAnimation(sprite.female),
                        attemptedPath: sprite.female,
                        error: 'File not found',
                        spriteName
                    });
                }
            } catch (error) {
                invalidPaths.push({
                    category: getPathCategory(sprite.female),
                    bodyType: 'female',
                    animation: 'unknown',
                    attemptedPath: sprite.female,
                    error: error.message,
                    spriteName
                });
            }
        }
    }

// Call this in console to test: testPathExtraction()
// Or use: discoverAllSpritePaths() to just get path discoveryPathExtraction()