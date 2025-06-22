
// Sprite Database Manager - Client-side interface for sprite path caching
class SpriteDBManager {
    constructor() {
        this.baseUrl = window.location.origin;
    }

    // Cache a single sprite path
    async cacheSpritePath(category, bodyType, animation, style, filePath, isValid = true) {
        try {
            const response = await fetch(`${this.baseUrl}/api/sprites/paths/cache`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    category,
                    bodyType,
                    animation,
                    style,
                    filePath,
                    isValid
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error caching sprite path:', error);
            throw error;
        }
    }

    // Cache multiple sprite paths at once
    async bulkCacheSpritePaths(paths) {
        try {
            const response = await fetch(`${this.baseUrl}/api/sprites/paths/bulk-cache`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ paths })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error bulk caching sprite paths:', error);
            throw error;
        }
    }

    // Get cached sprite paths for specific criteria
    async getSpritePaths(category, bodyType, animation) {
        try {
            const response = await fetch(`${this.baseUrl}/api/sprites/paths/${category}/${bodyType}/${animation}`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error getting sprite paths:', error);
            throw error;
        }
    }

    // Get all cached sprite paths
    async getAllSpritePaths() {
        try {
            const response = await fetch(`${this.baseUrl}/api/sprites/paths/all`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error getting all sprite paths:', error);
            throw error;
        }
    }

    // Mark a sprite path as invalid
    async markPathInvalid(filePath) {
        try {
            const encodedPath = encodeURIComponent(filePath);
            const response = await fetch(`${this.baseUrl}/api/sprites/paths/invalid/${encodedPath}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error marking sprite path invalid:', error);
            throw error;
        }
    }

    // Populate database from LPC complete scanner results
    async populateFromScanResults(scanResults) {
        console.log('🗃️ Populating database from scan results...');
        
        if (!scanResults || !scanResults.allValidPaths) {
            throw new Error('Invalid scan results provided');
        }

        const pathsToCache = [];
        
        for (const filePath of scanResults.allValidPaths) {
            const pathInfo = this.parseSpritePath(filePath);
            if (pathInfo) {
                pathsToCache.push({
                    ...pathInfo,
                    filePath,
                    isValid: true
                });
            }
        }

        console.log(`📝 Prepared ${pathsToCache.length} paths for caching`);
        
        // Cache in batches to avoid overwhelming the server
        const batchSize = 50;
        let cached = 0;
        
        for (let i = 0; i < pathsToCache.length; i += batchSize) {
            const batch = pathsToCache.slice(i, i + batchSize);
            await this.bulkCacheSpritePaths(batch);
            cached += batch.length;
            console.log(`✅ Cached ${cached}/${pathsToCache.length} sprite paths`);
        }

        console.log('🎉 Database population complete!');
        return { totalCached: cached };
    }

    // Parse a sprite file path to extract metadata
    parseSpritePath(filePath) {
        // Example: /lpc-generator/spritesheets/body/bodies/male/walk.png
        const pathParts = filePath.split('/');
        
        if (pathParts.length < 6 || !filePath.includes('/spritesheets/')) {
            return null;
        }

        const spritesheetsIndex = pathParts.indexOf('spritesheets');
        if (spritesheetsIndex === -1 || pathParts.length <= spritesheetsIndex + 3) {
            return null;
        }

        const category = pathParts[spritesheetsIndex + 1];
        const filename = pathParts[pathParts.length - 1];
        const animation = filename.replace('.png', '');
        
        // Try to extract body type and style
        let bodyType = 'unknown';
        let style = null;

        // Look for common body types in the path
        const bodyTypes = ['male', 'female', 'child', 'teen', 'adult', 'muscular', 'pregnant'];
        for (const bt of bodyTypes) {
            if (pathParts.includes(bt)) {
                bodyType = bt;
                break;
            }
        }

        // Try to extract style (usually the directory before body type)
        const bodyTypeIndex = pathParts.indexOf(bodyType);
        if (bodyTypeIndex > spritesheetsIndex + 2) {
            style = pathParts[bodyTypeIndex - 1];
        }

        return {
            category,
            bodyType,
            animation,
            style
        };
    }

    // Validate cached paths against actual files
    async validateCachedPaths() {
        console.log('🔍 Validating cached sprite paths...');
        
        const allPaths = await this.getAllSpritePaths();
        const pathsToCheck = allPaths.pathsByCategory;
        
        let validated = 0;
        let invalid = 0;

        for (const [category, bodyTypes] of Object.entries(pathsToCheck)) {
            for (const [bodyType, animations] of Object.entries(bodyTypes)) {
                for (const [animation, styleData] of Object.entries(animations)) {
                    for (const pathData of styleData) {
                        try {
                            const response = await fetch(pathData.path, { method: 'HEAD' });
                            if (!response.ok) {
                                await this.markPathInvalid(pathData.path);
                                invalid++;
                                console.log(`❌ Invalid: ${pathData.path}`);
                            } else {
                                validated++;
                            }
                        } catch (error) {
                            await this.markPathInvalid(pathData.path);
                            invalid++;
                            console.log(`❌ Error checking: ${pathData.path}`);
                        }
                    }
                }
            }
        }

        console.log(`✅ Validation complete: ${validated} valid, ${invalid} invalid`);
        return { validated, invalid };
    }
}

// Global functions for easy access
async function populateSpriteDatabase() {
    try {
        const dbManager = new SpriteDBManager();
        
        // First run a complete scan to get the data
        console.log('🔍 Running complete LPC scan...');
        const scanner = new LPCCompleteScanner();
        const scanResults = await scanner.scanCompleteFileTree();
        
        // Then populate the database
        const result = await dbManager.populateFromScanResults(scanResults);
        console.log('🎉 Database populated successfully!', result);
        
        return result;
    } catch (error) {
        console.error('❌ Failed to populate sprite database:', error);
        throw error;
    }
}

async function validateSpriteDatabase() {
    try {
        const dbManager = new SpriteDBManager();
        const result = await dbManager.validateCachedPaths();
        console.log('🎉 Database validation complete!', result);
        return result;
    } catch (error) {
        console.error('❌ Failed to validate sprite database:', error);
        throw error;
    }
}

// Make available globally
if (typeof window !== 'undefined') {
    window.SpriteDBManager = SpriteDBManager;
    window.populateSpriteDatabase = populateSpriteDatabase;
    window.validateSpriteDatabase = validateSpriteDatabase;
}
