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
        console.log('🔍 Extracting sprite data from LPC generator...');

        try {
            // Fetch the LPC generator HTML
            const response = await fetch('/lpc-generator/index.html');
            const htmlText = await response.text();

            // Parse the HTML
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlText, 'text/html');

            // Extract all radio inputs with data attributes
            const radioInputs = doc.querySelectorAll('input[type="radio"][data-layer_1_male], input[type="radio"][data-layer_1_female]');

            console.log(`Found ${radioInputs.length} sprite inputs`);

            radioInputs.forEach(input => {
                this.processSpriteInput(input);
            });

            console.log('✅ Extraction complete');
            console.log('📊 Extracted data:', this.extractedData);

            return this.extractedData;

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
    getSprite(parentName, variant = 'default', bodyType = 'male') {
        const parent = this.extractedData.sprites[parentName];
        if (!parent) return null;

        const sprite = parent[variant];
        if (!sprite) return null;

        const path = sprite.paths[bodyType];
        if (!path) return null;

        return {
            ...sprite,
            activePath: path,
            activeBodyType: bodyType
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

// Global extractor instance
window.lpcExtractor = new LPCDataExtractor();

// Utility function to extract and cache data
async function extractLPCData() {
    try {
        const data = await window.lpcExtractor.extractFromLPCGenerator();

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
            window.lpcExtractor.extractedData = data;
            return data;
        }
    }

    return null;
}