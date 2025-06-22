
// LPC Data Extractor - Extracts sprite data from LPC Generator
class LPCDataExtractor {
    constructor() {
        this.spriteData = new Map();
        this.extractedData = {
            sprites: {},
            categories: {},
            bodyTypes: ['male', 'female', 'teen', 'child', 'muscular', 'pregnant']
        };
    }

    async extractFromLPCGenerator() {
        try {
            console.log('🔄 Loading LPC generator HTML...');
            const response = await fetch('/lpc-generator/index.html');
            if (!response.ok) {
                throw new Error(`Failed to load LPC generator: ${response.status}`);
            }

            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');

            console.log('📊 Parsing LPC sprite data...');

            // Find ALL input elements first
            const allInputs = doc.querySelectorAll('input');
            console.log(`📝 Found ${allInputs.length} total input elements`);

            // Then filter for ones with sprite data attributes
            const spriteInputs = [];
            allInputs.forEach(input => {
                const attributes = Array.from(input.attributes);
                const hasLPCData = attributes.some(attr => 
                    attr.name.startsWith('data-layer_') && 
                    attr.value && 
                    attr.value.includes('.png')
                );
                if (hasLPCData) {
                    spriteInputs.push(input);
                }
            });

            console.log(`🎯 Found ${spriteInputs.length} inputs with sprite data`);

            const spriteData = {};
            const categorizedData = {
                body: { male: {}, female: {}, child: {}, teen: {} },
                hair: { male: {}, female: {}, child: {}, teen: {} },
                torso: { male: {}, female: {}, child: {}, teen: {} },
                legs: { male: {}, female: {}, child: {}, teen: {} },
                feet: { male: {}, female: {}, child: {}, teen: {} },
                head: { male: {}, female: {}, child: {}, teen: {} },
                arms: { male: {}, female: {}, child: {}, teen: {} }
            };

            let extractedCount = 0;

            spriteInputs.forEach((input, index) => {
                const attributes = Array.from(input.attributes);
                const inputName = input.getAttribute('name') || input.getAttribute('id') || `sprite_${index}`;
                const zpos = input.getAttribute('data-zpos') || input.getAttribute('zpos') || '0';

                let spriteEntry = {
                    name: inputName,
                    zpos: parseInt(zpos),
                    paths: {}
                };

                // Extract all sprite paths from data attributes
                attributes.forEach(attr => {
                    if (attr.name.startsWith('data-layer_') && attr.value && attr.value.includes('.png')) {
                        // More flexible parsing: data-layer_1_male, data-layer_1_female, etc.
                        const match = attr.name.match(/data-layer_(\d+)_(male|female|child|teen|muscular|pregnant)/);
                        if (match) {
                            const [, layer, bodyType] = match;
                            // Clean up the path value
                            let cleanPath = attr.value.replace(/^["']|["']$/g, ''); // Remove quotes
                            spriteEntry.paths[bodyType] = cleanPath;
                        }
                    }
                });

                // Only process if we found at least one valid path
                if (Object.keys(spriteEntry.paths).length > 0) {
                    spriteData[inputName] = spriteEntry;
                    extractedCount++;

                    // Categorize sprites based on path patterns
                    const samplePath = spriteEntry.paths.male || spriteEntry.paths.female || Object.values(spriteEntry.paths)[0];
                    if (samplePath) {
                        let category = 'misc';
                        
                        // More comprehensive categorization
                        if (samplePath.includes('/body/bodies/')) category = 'body';
                        else if (samplePath.includes('/hair/')) category = 'hair';
                        else if (samplePath.includes('/torso/') || samplePath.includes('/clothes/')) category = 'torso';
                        else if (samplePath.includes('/legs/') || samplePath.includes('/pants/') || samplePath.includes('/skirt/')) category = 'legs';
                        else if (samplePath.includes('/feet/') || samplePath.includes('/shoes/') || samplePath.includes('/boots/')) category = 'feet';
                        else if (samplePath.includes('/head/') || samplePath.includes('/eyes/') || samplePath.includes('/facial/')) category = 'head';
                        else if (samplePath.includes('/arms/') || samplePath.includes('/hands/')) category = 'arms';

                        // Store in categorized data for all available body types
                        if (categorizedData[category]) {
                            Object.keys(spriteEntry.paths).forEach(bodyType => {
                                // Map body types to standard categories
                                let standardBodyType = bodyType;
                                if (bodyType === 'muscular' || bodyType === 'pregnant') {
                                    standardBodyType = 'male'; // Default mapping
                                }
                                
                                if (categorizedData[category][standardBodyType]) {
                                    categorizedData[category][standardBodyType][inputName] = spriteEntry.paths[bodyType];
                                } else if (categorizedData[category][bodyType]) {
                                    // Direct mapping if the body type exists
                                    categorizedData[category][bodyType][inputName] = spriteEntry.paths[bodyType];
                                }
                            });
                        }
                    }
                }
            });

            this.spriteData = spriteData;
            this.categorizedData = categorizedData;

            console.log(`✅ Extracted ${extractedCount} sprite definitions`);
            
            // Log detailed category summary
            Object.keys(categorizedData).forEach(cat => {
                const bodyTypeCounts = {};
                Object.keys(categorizedData[cat]).forEach(bodyType => {
                    const count = Object.keys(categorizedData[cat][bodyType] || {}).length;
                    if (count > 0) {
                        bodyTypeCounts[bodyType] = count;
                    }
                });
                
                if (Object.keys(bodyTypeCounts).length > 0) {
                    const countStr = Object.entries(bodyTypeCounts)
                        .map(([bt, count]) => `${bt}:${count}`)
                        .join(', ');
                    console.log(`📊 ${cat}: ${countStr}`);
                }
            });

            return spriteData;

        } catch (error) {
            console.error('❌ Failed to extract LPC data:', error);
            throw error;
        }
    }

    processSpriteInput(input) {
        const id = input.id;
        const parentName = input.getAttribute('parentName') || 'unknown';
        const variant = input.getAttribute('variant') || 'default';
        const zpos = input.getAttribute('data-layer_1_zpos') || '0';

        // Extract sprite paths for each body type
        const spritePaths = {};
        this.extractedData.bodyTypes.forEach(bodyType => {
            const path = input.getAttribute(`data-layer_1_${bodyType}`);
            if (path) {
                spritePaths[bodyType] = path;
            }
        });

        // Only process if we have at least one valid path
        if (Object.keys(spritePaths).length > 0) {
            const spriteInfo = {
                id,
                parentName,
                variant,
                zIndex: parseInt(zpos),
                paths: spritePaths,
                category: this.categorizeSprite(parentName),
                matchBodyColor: input.getAttribute('matchBodyColor') !== 'false'
            };

            // Store by category and parent name
            if (!this.extractedData.sprites[parentName]) {
                this.extractedData.sprites[parentName] = {};
            }

            this.extractedData.sprites[parentName][variant] = spriteInfo;

            // Track categories
            const category = spriteInfo.category;
            if (!this.extractedData.categories[category]) {
                this.extractedData.categories[category] = [];
            }

            if (!this.extractedData.categories[category].includes(parentName)) {
                this.extractedData.categories[category].push(parentName);
            }
        }
    }

    categorizeSprite(parentName) {
        // Categorize based on parent name patterns from LPC generator
        const lowerName = parentName.toLowerCase();

        if (lowerName.includes('body') || lowerName.includes('shadow')) return 'body';
        if (lowerName.includes('hair')) return 'hair';
        if (lowerName.includes('eyes') || lowerName.includes('face')) return 'face';
        if (lowerName.includes('torso') || lowerName.includes('clothes')) return 'torso';
        if (lowerName.includes('legs') || lowerName.includes('pants') || lowerName.includes('skirt')) return 'legs';
        if (lowerName.includes('feet') || lowerName.includes('shoes') || lowerName.includes('boots')) return 'feet';
        if (lowerName.includes('hat') || lowerName.includes('helmet')) return 'head';
        if (lowerName.includes('weapon') || lowerName.includes('shield')) return 'equipment';

        return 'accessories';
    }

    // Get sprites by category
    getSpritesByCategory(category) {
        const categorySprites = {};

        if (this.extractedData.categories[category]) {
            this.extractedData.categories[category].forEach(parentName => {
                if (this.extractedData.sprites[parentName]) {
                    categorySprites[parentName] = this.extractedData.sprites[parentName];
                }
            });
        }

        return categorySprites;
    }

    // Get a specific sprite variant
    getSprite(category, spriteName = null, bodyType = 'male') {
        console.log(`🔍 getSprite called: category=${category}, spriteName=${spriteName}, bodyType=${bodyType}`);
        
        // Check if we have data for this category
        if (!this.categorizedData || !this.categorizedData[category]) {
            console.log(`❌ No data for category: ${category}`);
            console.log(`Available categories:`, Object.keys(this.categorizedData || {}));
            return null;
        }

        const categoryData = this.categorizedData[category];
        console.log(`📁 Category data for ${category}:`, Object.keys(categoryData));

        // Check if we have data for this body type
        if (!categoryData[bodyType]) {
            console.log(`❌ No data for bodyType: ${bodyType} in category: ${category}`);
            console.log(`Available body types:`, Object.keys(categoryData));
            return null;
        }

        const bodyTypeData = categoryData[bodyType];
        console.log(`👤 Body type data for ${bodyType}:`, Object.keys(bodyTypeData));

        // If no specific sprite name, get the first available sprite in the category
        let targetSpriteName = spriteName;
        if (!targetSpriteName || targetSpriteName === 'default') {
            const availableSprites = Object.keys(bodyTypeData);
            if (availableSprites.length === 0) {
                console.log(`❌ No sprites available for ${category}/${bodyType}`);
                return null;
            }
            targetSpriteName = availableSprites[0];
            console.log(`🎯 Using first available sprite: ${targetSpriteName}`);
        }

        // Get the sprite path
        const spritePath = bodyTypeData[targetSpriteName];
        if (!spritePath) {
            console.log(`❌ No path found for sprite: ${targetSpriteName}`);
            return null;
        }

        // Get additional data from the main sprite data if available
        const spriteMetadata = this.spriteData[targetSpriteName] || {};

        console.log(`✅ Found sprite: ${targetSpriteName} -> ${spritePath}`);

        return {
            name: targetSpriteName,
            category: category,
            activePath: spritePath,
            activeBodyType: bodyType,
            zpos: spriteMetadata.zpos || 0,
            paths: spriteMetadata.paths || { [bodyType]: spritePath }
        };
    }

    // Export data for use in sprite builder
    exportForSpriteBuilder() {
        return {
            extractedData: this.extractedData,
            timestamp: new Date().toISOString(),
            source: 'LPC Generator HTML Parser'
        };
    }

    // Debug function to show available sprites
    debugShowAvailableSprites() {
        console.log('🎨 Available Sprite Categories:');
        Object.keys(this.extractedData.categories).forEach(category => {
            console.log(`\n📁 ${category.toUpperCase()}:`);
            this.extractedData.categories[category].forEach(parentName => {
                const variants = Object.keys(this.extractedData.sprites[parentName]);
                console.log(`  • ${parentName} (${variants.length} variants: ${variants.join(', ')})`);
            });
        });
    }
}

// Extract ALL valid sprite paths from LPC generator data attributes
function extractValidSpritePaths() {
    const validPaths = new Map();
    const pathsByCategory = new Map();

    // Get all input elements with data attributes from LPC generator
    const inputs = document.querySelectorAll('[data-layer_1_male], [data-layer_1_female], [data-layer_2_male], [data-layer_2_female], [data-layer_3_male], [data-layer_3_female]');

    console.log(`🔍 Found ${inputs.length} LPC input elements`);

    inputs.forEach(input => {
        const category = input.closest('li[id]')?.id || input.name || 'unknown';

        if (!pathsByCategory.has(category)) {
            pathsByCategory.set(category, new Set());
        }

        // Extract all data attributes that contain sprite paths
        for (let attr of input.attributes) {
            if (attr.name.startsWith('data-layer_') && attr.value.includes('.png')) {
                const path = attr.value.replace(/^"/, '').replace(/"$/, ''); // Remove quotes

                if (path && path.includes('/spritesheets/')) {
                    validPaths.set(path, {
                        element: input.id,
                        attribute: attr.name,
                        category: category,
                        bodyType: attr.name.includes('_male') ? 'male' : 'female',
                        layer: attr.name.match(/layer_(\d+)/)?.[1] || '1'
                    });

                    pathsByCategory.get(category).add(path);
                }
            }
        }
    });

    console.log(`✅ Extracted ${validPaths.size} valid sprite paths across ${pathsByCategory.size} categories`);

    // Log path samples by category
    pathsByCategory.forEach((paths, category) => {
        console.log(`📁 ${category}: ${paths.size} paths`);
    });

    return { validPaths, pathsByCategory };
}

// Get all available animations from actual file structure
function getAvailableAnimations() {
    return [
        'walk', 'hurt', 'idle', 'run', 'shoot', 'slash', 'spellcast', 'thrust',
        'backslash', 'climb', 'combat_idle', 'emote', 'halfslash', 'jump', 'sit'
    ];
}

// Validate if a constructed path likely exists based on known patterns
function validateSpritePath(basePath, bodyType, animation) {
    const { validPaths } = extractValidSpritePaths();

    // Try exact match first
    const exactPath = `${basePath}/${bodyType}/${animation}.png`;
    if (validPaths.has(exactPath)) {
        return exactPath;
    }

    // Try variations
    const variations = [
        `${basePath}/${animation}.png`,
        `${basePath}/${bodyType}/${animation}/${animation}.png`,
        basePath.replace(bodyType, animation) + '.png'
    ];

    for (const variant of variations) {
        if (validPaths.has(variant)) {
            return variant;
        }
    }

    return null;
}

// Generate working path mappings for sprite builder
function generateWorkingPathMappings() {
    const { validPaths, pathsByCategory } = extractValidSpritePaths();
    const mappings = new Map();

    // Create category-based mappings
    pathsByCategory.forEach((paths, category) => {
        const categoryMappings = [];
        paths.forEach(path => {
            const pathInfo = validPaths.get(path);
            categoryMappings.push({
                path: path,
                bodyType: pathInfo.bodyType,
                layer: pathInfo.layer,
                animation: path.match(/\/(\w+)\.png$/)?.[1] || 'walk'
            });
        });
        mappings.set(category, categoryMappings);
    });

    return mappings;
}

// Utility function to extract and cache data
async function extractLPCData() {
    try {
        console.log('🚀 Starting LPC data extraction...');
        
        if (!window.lpcExtractor) {
            console.log('🔧 Creating new LPCDataExtractor instance...');
            window.lpcExtractor = new LPCDataExtractor();
        }
        
        console.log('📥 Extracting data from LPC generator...');
        const data = await window.lpcExtractor.extractFromLPCGenerator();

        if (!data || Object.keys(data).length === 0) {
            throw new Error('No sprite data was extracted from LPC generator');
        }

        console.log('✅ LPC data extraction successful!');
        console.log(`📊 Extracted ${Object.keys(data).length} sprite definitions`);

        // Cache the data in localStorage for faster subsequent loads
        localStorage.setItem('lpcSpriteData', JSON.stringify(data));
        localStorage.setItem('lpcSpriteDataTimestamp', Date.now().toString());

        console.log('✅ LPC data extracted and cached');
        return data;

    } catch (error) {
        console.error('❌ LPC data extraction failed:', error);

        // Try to load from cache as fallback
        const cachedData = localStorage.getItem('lpcSpriteData');
        if (cachedData) {
            console.log('📦 Using cached LPC data as fallback');
            return JSON.parse(cachedData);
        }

        throw error;
    }
}

// Load cached data if available and recent (less than 24 hours old)
function loadCachedLPCData() {
    const cachedData = localStorage.getItem('lpcSpriteData');
    const cacheTimestamp = localStorage.getItem('lpcSpriteDataTimestamp');

    if (cachedData && cacheTimestamp) {
        const age = Date.now() - parseInt(cacheTimestamp);
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours

        if (age < maxAge) {
            console.log('📦 Loading LPC data from cache');
            const data = JSON.parse(cachedData);
            if (!window.lpcExtractor) {
                window.lpcExtractor = new LPCDataExtractor();
            }
            window.lpcExtractor.extractedData = data;
            return data;
        }
    }

    return null;
}

// Make sure the class is globally available
if (typeof window !== 'undefined') {
    window.LPCDataExtractor = LPCDataExtractor;
    window.extractLPCData = extractLPCData;
    window.loadCachedLPCData = loadCachedLPCData;
    window.extractValidSpritePaths = extractValidSpritePaths;
    window.getAvailableAnimations = getAvailableAnimations;
    window.validateSpritePath = validateSpritePath;
    window.generateWorkingPathMappings = generateWorkingPathMappings;
}

// Initialize global extractor instance on load
document.addEventListener('DOMContentLoaded', function() {
    if (!window.lpcExtractor) {
        console.log('🔧 Initializing global LPC extractor instance...');
        window.lpcExtractor = new LPCDataExtractor();
    }
});
