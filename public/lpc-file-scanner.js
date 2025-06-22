// LPC File Scanner - Discovers actual file paths in the LPC generator
class LPCFileScanner {
    constructor() {
        this.discoveredPaths = new Map();
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
        console.log('🔍 Starting LPC directory scan for actual files...');

        try {
            // Use a different approach - check for known working files
            await this.discoverActualFiles();

            const report = this.generateScanReport();
            console.log('📊 Scan complete:', report);

            return report;

        } catch (error) {
            console.error('❌ LPC directory scan failed:', error);
            throw error;
        }
    }

    async discoverActualFiles() {
        console.log('🔍 Discovering actual sprite files...');

        // Test known working paths based on your directory structure
        const knownPaths = [
            // Body sprites
            '/lpc-generator/spritesheets/body/bodies/male/walk.png',
            '/lpc-generator/spritesheets/body/bodies/male/hurt.png',
            '/lpc-generator/spritesheets/body/bodies/male/idle.png',
            '/lpc-generator/spritesheets/body/bodies/male/shoot.png',
            '/lpc-generator/spritesheets/body/bodies/male/slash.png',
            '/lpc-generator/spritesheets/body/bodies/male/spellcast.png',
            '/lpc-generator/spritesheets/body/bodies/male/thrust.png',

            '/lpc-generator/spritesheets/body/bodies/female/walk.png',
            '/lpc-generator/spritesheets/body/bodies/female/hurt.png',
            '/lpc-generator/spritesheets/body/bodies/female/idle.png',
            '/lpc-generator/spritesheets/body/bodies/female/shoot.png',
            '/lpc-generator/spritesheets/body/bodies/female/slash.png',
            '/lpc-generator/spritesheets/body/bodies/female/spellcast.png',
            '/lpc-generator/spritesheets/body/bodies/female/thrust.png',

            // Hair sprites (single files)
            '/lpc-generator/spritesheets/hair/page/adult/walk.png',
            '/lpc-generator/spritesheets/hair/page/adult/hurt.png',
            '/lpc-generator/spritesheets/hair/page/adult/idle.png',
            '/lpc-generator/spritesheets/hair/page/adult/shoot.png',
            '/lpc-generator/spritesheets/hair/page/adult/slash.png',
            '/lpc-generator/spritesheets/hair/page/adult/spellcast.png',

            '/lpc-generator/spritesheets/hair/plain/adult/walk.png',
            '/lpc-generator/spritesheets/hair/plain/adult/hurt.png',
            '/lpc-generator/spritesheets/hair/plain/adult/idle.png',

            // Torso clothing
            '/lpc-generator/spritesheets/torso/clothes/longsleeve/formal/male/walk.png',
            '/lpc-generator/spritesheets/torso/clothes/longsleeve/formal/male/hurt.png',
            '/lpc-generator/spritesheets/torso/clothes/longsleeve/formal/female/walk.png',
            '/lpc-generator/spritesheets/torso/clothes/longsleeve/formal/female/hurt.png',

            '/lpc-generator/spritesheets/torso/clothes/shirt/child/walk.png',
            '/lpc-generator/spritesheets/torso/clothes/shirt/child/hurt.png',

            // Legs
            '/lpc-generator/spritesheets/legs/pants/male/walk.png',
            '/lpc-generator/spritesheets/legs/pants/male/hurt.png',
            '/lpc-generator/spritesheets/legs/pants/female/walk.png',
            '/lpc-generator/spritesheets/legs/pants/female/hurt.png',

            // Arms
            '/lpc-generator/spritesheets/arms/gloves/male/walk.png',
            '/lpc-generator/spritesheets/arms/gloves/male/hurt.png',
            '/lpc-generator/spritesheets/arms/gloves/female/walk.png',
            '/lpc-generator/spritesheets/arms/gloves/female/hurt.png',

            // Feet
            '/lpc-generator/spritesheets/feet/sandals/male/walk.png',
            '/lpc-generator/spritesheets/feet/sandals/male/hurt.png',
            '/lpc-generator/spritesheets/feet/shoes/basic/male/walk.png',
            '/lpc-generator/spritesheets/feet/shoes/basic/female/walk.png'
        ];

        for (const path of knownPaths) {
            await this.testAndRecordPath(path);
        }

        // Also try to discover more files systematically
        await this.systematicDiscovery();
    }

    async systematicDiscovery() {
        console.log('🔍 Running systematic discovery...');

        const categories = ['body', 'hair', 'torso', 'legs', 'arms', 'feet'];
        const bodyTypes = ['male', 'female', 'child'];
        const animations = ['walk', 'hurt', 'idle', 'shoot', 'slash', 'spellcast', 'thrust'];

        // Test body category
        for (const bodyType of bodyTypes) {
            for (const animation of animations) {
                const path = `/lpc-generator/spritesheets/body/bodies/${bodyType}/${animation}.png`;
                await this.testAndRecordPath(path);
            }
        }

        // Test hair with common styles
        const hairStyles = ['page', 'plain', 'ponytail', 'long', 'bangs', 'bob'];
        for (const style of hairStyles) {
            for (const animation of animations) {
                const path = `/lpc-generator/spritesheets/hair/${style}/adult/${animation}.png`;
                await this.testAndRecordPath(path);
            }
        }

        // Test clothes
        const clothingTypes = ['longsleeve', 'shirt', 'vest'];
        const clothingStyles = ['formal', 'basic', 'plain'];

        for (const clothingType of clothingTypes) {
            for (const style of clothingStyles) {
                for (const bodyType of ['male', 'female']) {
                    for (const animation of animations) {
                        const path = `/lpc-generator/spritesheets/torso/clothes/${clothingType}/${style}/${bodyType}/${animation}.png`;
                        await this.testAndRecordPath(path);
                    }
                }
            }
        }

        // Test legs
        for (const bodyType of bodyTypes) {
            for (const animation of animations) {
                const path = `/lpc-generator/spritesheets/legs/pants/${bodyType}/${animation}.png`;
                await this.testAndRecordPath(path);
            }
        }
    }

    async testAndRecordPath(path) {
        try {
            const response = await fetch(path, { method: 'HEAD' });

            if (response.ok) {
                const category = this.extractCategory(path);
                const metadata = this.extractMetadata(path);

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
            } else {
                console.log(`❌ Not found: ${path} (${response.status})`);
            }
        } catch (error) {
            console.log(`❌ Error testing ${path}:`, error.message);
        }

        return false;
    }

    extractCategory(path) {
        const match = path.match(/\/spritesheets\/([^\/]+)\//);
        return match ? match[1] : 'unknown';
    }

    extractMetadata(path) {
        const parts = path.split('/');
        const filename = parts[parts.length - 1];
        const animation = filename.replace('.png', '');

        let bodyType = 'unknown';
        let style = 'unknown';

        // Extract body type
        if (path.includes('/male/')) bodyType = 'male';
        else if (path.includes('/female/')) bodyType = 'female';
        else if (path.includes('/child/')) bodyType = 'child';
        else if (path.includes('/adult/')) bodyType = 'adult';

        // Extract style/type
        const pathParts = path.split('/');
        if (pathParts.length > 5) {
            style = pathParts[pathParts.length - 3];
        }

        return {
            bodyType,
            animation,
            style,
            filename
        };
    }

    extractPattern(path) {
        return path
            .replace(/\/lpc-generator\/spritesheets\//, '{base}/')
            .replace(/(male|female|child|teen|adult)/, '{bodyType}')
            .replace(/(walk|hurt|idle|run|shoot|slash|spellcast|thrust)\.png$/, '{animation}.png');
    }

    generateScanReport() {
        this.scanResults.totalFiles = this.validPaths.length;
        this.scanResults.validSprites = this.validPaths.length;
        this.scanResults.validPaths = this.validPaths;

        // Convert pattern sets to arrays
        Object.keys(this.scanResults.categories).forEach(category => {
            this.scanResults.categories[category].patterns = 
                Array.from(this.scanResults.categories[category].patterns);
        });

        // Generate summary
        const summary = {
            totalValidPaths: this.validPaths.length,
            categoriesScanned: Object.keys(this.scanResults.categories).length,
            mostSuccessfulCategory: {
                category: null,
                pathCount: 0
            },
            commonPatterns: []
        };

        // Find most successful category
        Object.entries(this.scanResults.categories).forEach(([category, data]) => {
            if (data.validPaths > summary.mostSuccessfulCategory.pathCount) {
                summary.mostSuccessfulCategory = {
                    category,
                    pathCount: data.validPaths
                };
            }
        });

        this.scanResults.summary = summary;

        return this.scanResults;
    }

    exportResults() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

        // Export CSV
        const csvContent = this.generateCSV();
        this.downloadFile(`lpc-valid-paths_${timestamp}.csv`, csvContent, 'text/csv');

        // Export JSON
        const jsonContent = JSON.stringify(this.scanResults, null, 2);
        this.downloadFile(`lpc-scan-results_${timestamp}.json`, jsonContent, 'application/json');

        console.log('📁 Results exported successfully');
    }

    generateCSV() {
        const headers = ['Category', 'Path', 'BodyType', 'Animation', 'Style', 'Verified'];
        const rows = [headers.join(',')];

        this.validPaths.forEach(item => {
            const row = [
                item.category,
                `"${item.path}"`,
                item.metadata.bodyType,
                item.metadata.animation,
                item.metadata.style,
                item.verified
            ];
            rows.push(row.join(','));
        });

        return rows.join('\n');
    }

    downloadFile(filename, content, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }
}

// Global function to run the scan
async function runLPCScan() {
    try {
        const scanner = new LPCFileScanner();
        const results = await scanner.scanLPCDirectory();

        console.log('🎉 Scan completed successfully!');
        console.log(`📊 Found ${results.totalFiles} valid sprite files`);
        console.log(`📂 Scanned ${results.summary.categoriesScanned} categories`);

        // Export results
        scanner.exportResults();

        return results;

    } catch (error) {
        console.error('❌ Scan failed:', error);
        throw error;
    }
}

// Make available globally
if (typeof window !== 'undefined') {
    window.LPCFileScanner = LPCFileScanner;
    window.runLPCScan = runLPCScan;
}