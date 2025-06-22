
// LPC File Scanner - Discovers actual file paths in the LPC generator
class LPCFileScanner {
    constructor() {
        this.discoveredPaths = new Map();
        this.categories = new Map();
        this.validPaths = [];
        this.scanResults = {
            totalFiles: 0,
            validSprites: 0,
            categories: {},
            pathPatterns: [],
            errors: []
        };
    }

    async scanLPCDirectory() {
        console.log('🔍 Starting comprehensive LPC directory scan...');
        
        try {
            // First, get the main category directories
            const mainCategories = await this.discoverCategories();
            console.log(`📁 Found ${mainCategories.length} main categories:`, mainCategories);

            // Scan each category systematically
            for (const category of mainCategories) {
                await this.scanCategory(category);
            }

            // Generate comprehensive report
            const report = this.generateScanReport();
            console.log('📊 Scan complete:', report);
            
            return report;

        } catch (error) {
            console.error('❌ LPC directory scan failed:', error);
            throw error;
        }
    }

    async discoverCategories() {
        const knownCategories = [
            'arms', 'backpack', 'bauldron', 'beards', 'body', 'cape', 
            'dress', 'eyes', 'facial', 'feet', 'hair', 'hat', 'head', 
            'legs', 'neck', 'quiver', 'shadow', 'shield', 'shoulders', 
            'tools', 'torso', 'weapon', 'wrists'
        ];

        const validCategories = [];
        
        for (const category of knownCategories) {
            try {
                const testPath = `/lpc-generator/spritesheets/${category}/`;
                const response = await fetch(testPath, { method: 'HEAD' });
                if (response.ok) {
                    validCategories.push(category);
                }
            } catch (error) {
                // Category doesn't exist, skip it
            }
        }

        return validCategories;
    }

    async scanCategory(category) {
        console.log(`🔍 Scanning category: ${category}`);
        
        try {
            // Use different scanning strategies based on category
            if (category === 'body') {
                await this.scanBodyCategory();
            } else if (category === 'hair') {
                await this.scanHairCategory();
            } else if (category === 'torso') {
                await this.scanTorsoCategory();
            } else if (category === 'legs') {
                await this.scanLegsCategory();
            } else {
                await this.scanGenericCategory(category);
            }
        } catch (error) {
            console.error(`❌ Failed to scan category ${category}:`, error);
            this.scanResults.errors.push({
                category,
                error: error.message
            });
        }
    }

    async scanBodyCategory() {
        const bodyTypes = ['male', 'female', 'child', 'teen', 'muscular', 'pregnant'];
        const animations = ['walk', 'hurt', 'idle', 'run', 'shoot', 'slash', 'spellcast', 'thrust'];
        
        for (const bodyType of bodyTypes) {
            for (const animation of animations) {
                const path = `/lpc-generator/spritesheets/body/bodies/${bodyType}/${animation}.png`;
                await this.testAndRecordPath('body', path, { bodyType, animation });
            }
        }
    }

    async scanHairCategory() {
        const hairStyles = [
            'page', 'ponytail', 'long', 'bangs', 'curly_short', 'plain', 
            'parted', 'messy1', 'bob', 'princess', 'sara'
        ];
        const animations = ['walk', 'hurt', 'idle', 'run', 'shoot', 'slash', 'spellcast', 'thrust'];
        
        for (const style of hairStyles) {
            for (const animation of animations) {
                const path = `/lpc-generator/spritesheets/hair/${style}/adult/${animation}.png`;
                await this.testAndRecordPath('hair', path, { style, animation });
            }
        }
    }

    async scanTorsoCategory() {
        // Based on your screenshot, scan the clothes subdirectories
        const clothingTypes = ['longsleeve', 'shortsleeve', 'tunic', 'vest', 'blouse'];
        const bodyTypes = ['male', 'female'];
        const animations = ['walk', 'hurt', 'shoot', 'slash', 'spellcast', 'thrust'];
        
        for (const clothingType of clothingTypes) {
            for (const bodyType of bodyTypes) {
                for (const animation of animations) {
                    // Try different path patterns
                    const patterns = [
                        `/lpc-generator/spritesheets/torso/clothes/${clothingType}/${bodyType}/${animation}.png`,
                        `/lpc-generator/spritesheets/torso/${clothingType}/${bodyType}/${animation}.png`
                    ];
                    
                    for (const path of patterns) {
                        await this.testAndRecordPath('torso', path, { clothingType, bodyType, animation });
                    }
                }
            }
        }
    }

    async scanLegsCategory() {
        const legTypes = ['pants', 'leggings', 'shorts', 'skirts'];
        const bodyTypes = ['male', 'female', 'child', 'teen'];
        const animations = ['walk', 'hurt', 'shoot', 'slash', 'spellcast', 'thrust'];
        
        for (const legType of legTypes) {
            for (const bodyType of bodyTypes) {
                for (const animation of animations) {
                    const path = `/lpc-generator/spritesheets/legs/${legType}/${bodyType}/${animation}.png`;
                    await this.testAndRecordPath('legs', path, { legType, bodyType, animation });
                }
            }
        }
    }

    async scanGenericCategory(category) {
        // Generic scanning for other categories
        const bodyTypes = ['male', 'female'];
        const animations = ['walk', 'hurt', 'shoot', 'slash', 'spellcast', 'thrust'];
        
        for (const bodyType of bodyTypes) {
            for (const animation of animations) {
                const patterns = [
                    `/lpc-generator/spritesheets/${category}/${bodyType}/${animation}.png`,
                    `/lpc-generator/spritesheets/${category}/basic/${bodyType}/${animation}.png`,
                    `/lpc-generator/spritesheets/${category}/default/${bodyType}/${animation}.png`
                ];
                
                for (const path of patterns) {
                    await this.testAndRecordPath(category, path, { bodyType, animation });
                }
            }
        }
    }

    async testAndRecordPath(category, path, metadata) {
        try {
            const response = await fetch(path, { method: 'HEAD' });
            
            if (response.ok) {
                this.validPaths.push({
                    category,
                    path,
                    metadata,
                    verified: true,
                    timestamp: new Date().toISOString()
                });
                
                // Track category stats
                if (!this.scanResults.categories[category]) {
                    this.scanResults.categories[category] = {
                        validPaths: 0,
                        patterns: new Set()
                    };
                }
                
                this.scanResults.categories[category].validPaths++;
                
                // Extract pattern
                const pattern = this.extractPattern(path);
                this.scanResults.categories[category].patterns.add(pattern);
                
                console.log(`✅ Found: ${path}`);
                return true;
            }
        } catch (error) {
            // Path doesn't exist, which is normal during discovery
        }
        
        return false;
    }

    extractPattern(path) {
        // Extract reusable pattern from path
        return path
            .replace(/\/lpc-generator\/spritesheets\//, '{base}/')
            .replace(/(male|female|child|teen|muscular|pregnant)/, '{bodyType}')
            .replace(/(walk|hurt|idle|run|shoot|slash|spellcast|thrust)\.png$/, '{animation}.png');
    }

    generateScanReport() {
        this.scanResults.totalFiles = this.validPaths.length;
        this.scanResults.validSprites = this.validPaths.length;
        
        // Convert pattern sets to arrays
        Object.keys(this.scanResults.categories).forEach(category => {
            this.scanResults.categories[category].patterns = 
                Array.from(this.scanResults.categories[category].patterns);
        });
        
        return {
            ...this.scanResults,
            validPaths: this.validPaths,
            summary: {
                totalValidPaths: this.validPaths.length,
                categoriesScanned: Object.keys(this.scanResults.categories).length,
                mostSuccessfulCategory: this.getMostSuccessfulCategory(),
                commonPatterns: this.getCommonPatterns()
            }
        };
    }

    getMostSuccessfulCategory() {
        let maxPaths = 0;
        let topCategory = null;
        
        Object.entries(this.scanResults.categories).forEach(([category, data]) => {
            if (data.validPaths > maxPaths) {
                maxPaths = data.validPaths;
                topCategory = category;
            }
        });
        
        return { category: topCategory, pathCount: maxPaths };
    }

    getCommonPatterns() {
        const patternCounts = new Map();
        
        Object.values(this.scanResults.categories).forEach(categoryData => {
            categoryData.patterns.forEach(pattern => {
                patternCounts.set(pattern, (patternCounts.get(pattern) || 0) + 1);
            });
        });
        
        return Array.from(patternCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([pattern, count]) => ({ pattern, count }));
    }

    // Export results for use by sprite builder
    exportValidPaths() {
        return {
            validPaths: this.validPaths,
            categories: this.scanResults.categories,
            pathLookup: this.createPathLookup(),
            timestamp: new Date().toISOString()
        };
    }

    createPathLookup() {
        const lookup = {};
        
        this.validPaths.forEach(({ category, path, metadata }) => {
            if (!lookup[category]) {
                lookup[category] = {};
            }
            
            const key = this.createLookupKey(metadata);
            lookup[category][key] = path;
        });
        
        return lookup;
    }

    createLookupKey(metadata) {
        // Create a standardized key for looking up paths
        const parts = [];
        if (metadata.bodyType) parts.push(metadata.bodyType);
        if (metadata.animation) parts.push(metadata.animation);
        if (metadata.style) parts.push(metadata.style);
        if (metadata.clothingType) parts.push(metadata.clothingType);
        if (metadata.legType) parts.push(metadata.legType);
        
        return parts.join('_');
    }

    // Download scan results
    downloadResults() {
        const results = this.generateScanReport();
        
        // JSON report
        const jsonData = JSON.stringify(results, null, 2);
        this.downloadFile('lpc-scan-results.json', jsonData, 'application/json');
        
        // CSV of valid paths
        const csvData = this.createCSVReport();
        this.downloadFile('lpc-valid-paths.csv', csvData, 'text/csv');
        
        console.log('📁 Scan results downloaded');
    }

    createCSVReport() {
        const headers = 'Category,Path,BodyType,Animation,Style,ClothingType,LegType,Verified\n';
        const rows = this.validPaths.map(({ category, path, metadata, verified }) => {
            return `"${category}","${path}","${metadata.bodyType || ''}","${metadata.animation || ''}","${metadata.style || ''}","${metadata.clothingType || ''}","${metadata.legType || ''}","${verified}"`;
        });
        
        return headers + rows.join('\n');
    }

    downloadFile(filename, content, mimeType) {
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
}

// Initialize scanner
window.lpcScanner = new LPCFileScanner();

// Helper function to run a comprehensive scan
async function runLPCScan() {
    console.log('🚀 Starting comprehensive LPC file scan...');
    
    try {
        const results = await window.lpcScanner.scanLPCDirectory();
        window.lpcScanner.downloadResults();
        
        console.log('✅ LPC scan complete!');
        console.log(`Found ${results.summary.totalValidPaths} valid sprite paths`);
        console.log(`Scanned ${results.summary.categoriesScanned} categories`);
        
        return results;
        
    } catch (error) {
        console.error('❌ LPC scan failed:', error);
        throw error;
    }
}
