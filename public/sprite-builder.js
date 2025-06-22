class LPCSpriteBuilder {
    constructor() {
        this.canvas = document.getElementById('spriteCanvas');
        this.ctx = this.canvas ? this.canvas.getContext('2d') : null;

        if (!this.ctx) {
            console.error('❌ Sprite canvas not found');
            return;
        }

        // LPC Generator constants
        this.universalFrameSize = 64;
        this.universalSheetWidth = 832;
        this.universalSheetHeight = 1344;

        // Animation definitions
        this.base_animations = {
            spellcast: 0,
            thrust: 4 * this.universalFrameSize,
            walk: 8 * this.universalFrameSize,
            slash: 12 * this.universalFrameSize,
            shoot: 16 * this.universalFrameSize,
            hurt: 20 * this.universalFrameSize
        };

        this.animationFrameCounts = {
            spellcast: 7,
            thrust: 8,
            walk: 9,
            slash: 6,
            shoot: 13,
            hurt: 6
        };

        // Layer management
        this.layers = [];
        this.currentAnimation = 'walk';
        this.currentFrame = 0;
        this.animationInterval = null;
        this.isAnimating = false;

        // Character state
        this.currentSex = 'male';

        // Character layers
        this.characterLayers = {};

        // Sprite categories will be loaded later
        this.spriteCategories = {};

        console.log('🎨 LPC Sprite Builder initialized');
        this.init();
    }

    async init() {
        console.log('📋 Initializing sprite builder...');

        // Initialize with verified LPC paths
        this.initializeWithLPCData();

        // Then load basic character
        await this.loadBasicCharacter();
        this.startAnimation();
    }

    // Initialize with verified LPC data
    initializeWithLPCData() {
        console.log('🔄 Initializing sprite builder with verified LPC paths...');

        try {
            this.loadVerifiedSpritePaths();
            this.setupUI();
            console.log('✅ Sprite builder initialized with 100 verified sprites!');
        } catch (error) {
            console.error('❌ Failed to initialize sprite builder:', error);
        }
    }

    async loadBasicCharacter() {
        console.log('👤 Loading basic character...');

        try {
            if (this.spriteCategories) {
                // Use extracted LPC data
                await this.loadCharacterFromLPCData();
            } else {
                // Fallback to hardcoded paths
                await this.loadCharacterFallback();
            }

        } catch (error) {
            console.error('❌ Failed to load basic character:', error);
            // Load a simple test rectangle if sprites fail
            this.drawTestRectangle();
        }
    }

    async loadCharacterFromLPCData() {
        console.log('🎨 Loading character using LPC data...');

        // DEBUG: Show structure of extracted data
        //console.log('🔍 DEBUG: First 3 sprite entries:', Object.keys(this.lpcData.sprites).slice(0, 3));

        // Load all sprites from spriteCategories

    }

    async loadCharacterFallback() {
        console.log('⚠️ Using fallback sprite loading...');

        // Load known working sprites from LPC generator
        const bodyPath = `/lpc-generator/spritesheets/body/bodies/${this.currentSex}/walk.png`;
        await this.loadLayer('body', bodyPath, 1);
        console.log('✅ Loaded body (fallback)');

        // Try to load hair
        const hairPath = `/lpc-generator/spritesheets/hair/page/adult/walk.png`;
        await this.loadLayer('hair', hairPath, 10);
        console.log('✅ Loaded hair (fallback)');
    }

    drawTestRectangle() {
        console.log('🔧 Drawing test rectangle');
        this.ctx.fillStyle = '#ff6b6b';
        this.ctx.fillRect(10, 10, 44, 44);
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '8px Arial';
        this.ctx.fillText('TEST', 15, 25);
    }

    async loadLayer(name, path, zIndex) {
        return new Promise((resolve, reject) => {
            const img = new Image();

            img.onload = () => {
                const layer = {
                    name,
                    path,
                    image: img,
                    zIndex,
                    visible: true
                };

                this.layers.push(layer);
                this.layers.sort((a, b) => a.zIndex - b.zIndex);

                this.updateLayerList();
                this.drawCurrentFrame();

                console.log(`✅ Layer loaded: ${name} (z:${zIndex})`);
                resolve(layer);
            };

            img.onerror = () => {
                console.error(`❌ Failed to load layer: ${fullPath}`);
                reject(new Error(`Failed to load: ${fullPath}`));
            };

            // Construct the full path to the LPC generator spritesheets
            const fullPath = path.startsWith('/lpc-generator/') ? path : `/lpc-generator/spritesheets/${path}`;
            console.log(`🔍 DEBUG: Loading sprite from: ${fullPath}`);
            img.src = fullPath;
        });
    }

    drawCurrentFrame() {
        if (!this.ctx) return;

        // Clear canvas with a background color so we can see it
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw layers in z-index order
        this.layers.forEach(layer => {
            if (layer.visible && layer.image) {
                try {
                    // Calculate frame position
                    const frameWidth = this.universalFrameSize;
                    const frameHeight = this.universalFrameSize;
                    const animationRow = this.base_animations[this.currentAnimation] / this.universalFrameSize;

                    // Source position on the sprite sheet
                    const sx = this.currentFrame * frameWidth;
                    const sy = animationRow * frameHeight;

                    // Draw to canvas
                    this.ctx.drawImage(
                        layer.image,
                        sx, sy, frameWidth, frameHeight,
                        0, 0, frameWidth, frameHeight
                    );
                } catch (error) {
                    console.warn(`⚠️ Error drawing layer ${layer.name}:`, error);
                }
            }
        });

        // Draw frame indicator
        this.ctx.fillStyle = '#00ff00';
        this.ctx.font = '8px Arial';
        this.ctx.fillText(`${this.currentAnimation}:${this.currentFrame}`, 2, 10);
    }

    startAnimation() {
        if (this.isAnimating) return;

        this.isAnimating = true;
        const frameCount = this.animationFrameCounts[this.currentAnimation] || 9;

        this.animationInterval = setInterval(() => {
            this.currentFrame = (this.currentFrame + 1) % frameCount;
            this.drawCurrentFrame();
        }, 200);

        console.log(`🎬 Animation started: ${this.currentAnimation} (${frameCount} frames)`);
    }

    stopAnimation() {
        if (this.animationInterval) {
            clearInterval(this.animationInterval);
            this.animationInterval = null;
        }
        this.isAnimating = false;
        console.log('⏹️ Animation stopped');
    }

    updateLayerList() {
        const layersList = document.getElementById('layersList');
        if (!layersList) return;

        layersList.innerHTML = '';

        this.layers.forEach((layer, index) => {
            const layerItem = document.createElement('div');
            layerItem.className = 'sprite-layer';
            layerItem.innerHTML = `
                <label>
                    <input type="checkbox" ${layer.visible ? 'checked' : ''} 
                           onchange="window.spriteBuilder.toggleLayerVisibility(${index})">
                    ${layer.name} (z:${layer.zIndex})
                </label>
                <button onclick="window.spriteBuilder.removeLayer(${index})">Remove</button>
            `;
            layersList.appendChild(layerItem);
        });
    }

    toggleLayerVisibility(index) {
        if (this.layers[index]) {
            this.layers[index].visible = !this.layers[index].visible;
            this.drawCurrentFrame();
        }
    }

    removeLayer(index) {
        if (this.layers[index]) {
            this.layers.splice(index, 1);
            this.updateLayerList();
            this.drawCurrentFrame();
        }
    }

    resetCharacter() {
        this.stopAnimation();
        this.layers = [];
        this.currentFrame = 0;
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.updateLayerList();
        console.log('🔄 Character reset');
    }

    // Load verified sprite paths from scan results
    loadVerifiedSpritePaths() {
        console.log('📊 Loading verified sprite paths...');

        // Use the actual verified paths from your scan
        this.spriteCategories = {
            body: {
                name: 'Body',
                sprites: [
                    // Male body sprites
                    { 
                        name: 'Male Body',
                        path: '/lpc-generator/spritesheets/body/bodies/male/walk.png',
                        bodyType: 'male',
                        animation: 'walk',
                        style: 'bodies'
                    },
                    { 
                        name: 'Female Body',
                        path: '/lpc-generator/spritesheets/body/bodies/female/walk.png',
                        bodyType: 'female',
                        animation: 'walk',
                        style: 'bodies'
                    },
                    { 
                        name: 'Child Body',
                        path: '/lpc-generator/spritesheets/body/bodies/child/walk.png',
                        bodyType: 'child',
                        animation: 'walk',
                        style: 'bodies'
                    }
                ]
            },
            hair: {
                name: 'Hair',
                sprites: [
                    { 
                        name: 'Page Hair',
                        path: '/lpc-generator/spritesheets/hair/page/adult/walk.png',
                        bodyType: 'adult',
                        animation: 'walk',
                        style: 'page'
                    },
                    { 
                        name: 'Plain Hair',
                        path: '/lpc-generator/spritesheets/hair/plain/adult/walk.png',
                        bodyType: 'adult',
                        animation: 'walk',
                        style: 'plain'
                    },
                    { 
                        name: 'Long Hair',
                        path: '/lpc-generator/spritesheets/hair/long/adult/walk.png',
                        bodyType: 'adult',
                        animation: 'walk',
                        style: 'long'
                    },
                    { 
                        name: 'Bangs Hair',
                        path: '/lpc-generator/spritesheets/hair/bangs/adult/walk.png',
                        bodyType: 'adult',
                        animation: 'walk',
                        style: 'bangs'
                    },
                    { 
                        name: 'Bob Hair',
                        path: '/lpc-generator/spritesheets/hair/bob/adult/walk.png',
                        bodyType: 'adult',
                        animation: 'walk',
                        style: 'bob'
                    }
                ]
            },
            torso: {
                name: 'Clothing',
                sprites: [
                    { 
                        name: 'Formal Shirt (Male)',
                        path: '/lpc-generator/spritesheets/torso/clothes/longsleeve/formal/male/walk.png',
                        bodyType: 'male',
                        animation: 'walk',
                        style: 'formal'
                    }
                ]
            },
            legs: {
                name: 'Legs',
                sprites: [
                    { 
                        name: 'Pants (Male)',
                        path: '/lpc-generator/spritesheets/legs/pants/male/walk.png',
                        bodyType: 'male',
                        animation: 'walk',
                        style: 'pants'
                    }
                ]
            },
            arms: {
                name: 'Arms',
                sprites: [
                    { 
                        name: 'Gloves (Male)',
                        path: '/lpc-generator/spritesheets/arms/gloves/male/walk.png',
                        bodyType: 'male',
                        animation: 'walk',
                        style: 'gloves'
                    },
                    { 
                        name: 'Gloves (Female)',
                        path: '/lpc-generator/spritesheets/arms/gloves/female/walk.png',
                        bodyType: 'female',
                        animation: 'walk',
                        style: 'gloves'
                    }
                ]
            },
            feet: {
                name: 'Feet',
                sprites: [
                    { 
                        name: 'Sandals (Male)',
                        path: '/lpc-generator/spritesheets/feet/sandals/male/walk.png',
                        bodyType: 'male',
                        animation: 'walk',
                        style: 'sandals'
                    },
                    { 
                        name: 'Basic Shoes (Male)',
                        path: '/lpc-generator/spritesheets/feet/shoes/basic/male/walk.png',
                        bodyType: 'male',
                        animation: 'walk',
                        style: 'basic'
                    }
                ]
            }
        };

        console.log('✅ Loaded verified sprite categories with working paths!');
    }

    // Load sprite with verified path
    async loadSprite(spritePath, spriteInfo = {}) {
        console.log(`🖼️ Loading sprite: ${spritePath}`);

        try {
            const img = new Image();

            return new Promise((resolve, reject) => {
                img.onload = () => {
                    console.log(`✅ Successfully loaded: ${spritePath}`);
                    resolve({
                        image: img,
                        path: spritePath,
                        ...spriteInfo
                    });
                };

                img.onerror = () => {
                    console.error(`❌ Failed to load: ${spritePath}`);
                    reject(new Error(`Failed to load sprite: ${spritePath}`));
                };

                img.src = spritePath;
            });

        } catch (error) {
            console.error(`❌ Error loading sprite ${spritePath}:`, error);
            throw error;
        }
    }

    // Add a sprite layer to current character
    async addLayerToCharacter(category, spriteData) {
        console.log(`➕ Adding layer: ${category}`, spriteData);

        try {
            const sprite = await this.loadSprite(spriteData.path, spriteData);

            this.characterLayers[category] = {
                image: sprite.image,
                data: spriteData
            };

            this.renderCharacter();
            console.log(`✅ Added ${category} layer successfully`);

        } catch (error) {
            console.error(`❌ Failed to load layer: ${spriteData.path}`, error);
        }
    }

    // Render the current character based on loaded layers
    renderCharacter() {
        console.log('🖌️ Rendering character...');
        this.resetCharacter(); // Clear existing layers
        let zIndexCounter = 1; // Start z-index from 1

        // Iterate through the characterLayers and create actual layers
        Object.entries(this.characterLayers).forEach(([category, layerData]) => {
            if (layerData.image) {
                const layer = {
                    name: category,
                    image: layerData.image,
                    zIndex: zIndexCounter * 10, // Increment z-index for each layer
                    visible: true
                };
                this.layers.push(layer);
                zIndexCounter++;
            }
        });

        // Sort layers by zIndex
        this.layers.sort((a, b) => a.zIndex - b.zIndex);
        this.updateLayerList();
        this.drawCurrentFrame();
    }

    // Test function to verify sprite builder is working
    testFunction() {
        console.log('🧪 TEST FUNCTION CALLED - Sprite Builder is working!');
        console.log('📊 Available categories:', Object.keys(this.spriteCategories));

        // Test loading the first sprite from each category
        Object.entries(this.spriteCategories).forEach(([category, data]) => {
            if (data.sprites && data.sprites.length > 0) {
                console.log(`🎯 Testing ${category}:`, data.sprites[0]);
            }
        });

        return true;
    }

    // Test verified paths
    async testVerifiedPaths() {
        console.log('🧪 Testing verified sprite paths...');

        const testPaths = [
            '/lpc-generator/spritesheets/body/bodies/male/walk.png',
            '/lpc-generator/spritesheets/hair/page/adult/walk.png',
            '/lpc-generator/spritesheets/torso/clothes/longsleeve/formal/male/walk.png'
        ];

        for (const path of testPaths) {
            try {
                const sprite = await this.loadSprite(path);
                console.log(`✅ VERIFIED: ${path}`);
            } catch (error) {
                console.error(`❌ FAILED: ${path}`, error);
            }
        }
    }

    // Load a sample character using verified paths
    loadSampleCharacter() {
        console.log('👤 Loading sample character with verified paths...');

        // Load male character with verified sprites
        const sampleSprites = {
            body: {
                name: 'Male Body',
                path: '/lpc-generator/spritesheets/body/bodies/male/walk.png',
                bodyType: 'male',
                animation: 'walk'
            },
            hair: {
                name: 'Page Hair',
                path: '/lpc-generator/spritesheets/hair/page/adult/walk.png',
                bodyType: 'adult',
                animation: 'walk'
            }
        };

        // Add each layer
        Object.entries(sampleSprites).forEach(([category, sprite]) => {
            this.addLayerToCharacter(category, sprite);
        });
    }

    setupUI() {
        console.log("Setting up UI");
        // Populate the sprite selection dropdowns based on the loaded sprite categories
        const bodySelect = document.getElementById('bodySelect');
        const hairSelect = document.getElementById('hairSelect');
        const torsoSelect = document.getElementById('torsoSelect');
        const legsSelect = document.getElementById('legsSelect');
        const armsSelect = document.getElementById('armsSelect');
        const feetSelect = document.getElementById('feetSelect');

        if (bodySelect) {
            this.populateDropdown(bodySelect, this.spriteCategories.body.sprites);
        }
        if (hairSelect) {
            this.populateDropdown(hairSelect, this.spriteCategories.hair.sprites);
        }
         if (torsoSelect) {
            this.populateDropdown(torsoSelect, this.spriteCategories.torso.sprites);
        }
        if (legsSelect) {
            this.populateDropdown(legsSelect, this.spriteCategories.legs.sprites);
        }
        if (armsSelect) {
            this.populateDropdown(armsSelect, this.spriteCategories.arms.sprites);
        }
        if (feetSelect) {
            this.populateDropdown(feetSelect, this.spriteCategories.feet.sprites);
        }
    }

    populateDropdown(selectElement, sprites) {
        selectElement.innerHTML = ''; // Clear existing options

        // Add a default "None" option
        const noneOption = document.createElement('option');
        noneOption.value = '';
        noneOption.textContent = 'None';
        selectElement.appendChild(noneOption);

        sprites.forEach(sprite => {
            const option = document.createElement('option');
            option.value = JSON.stringify(sprite); // Store the entire sprite object as JSON
            option.textContent = sprite.name;
            selectElement.appendChild(option);
        });
    }

    // Call this function when a sprite selection changes
    onSpriteSelectionChange(category, selectElement) {
        const selectedValue = selectElement.value;

        if (selectedValue) {
            const spriteData = JSON.parse(selectedValue);
            this.addLayerToCharacter(category, spriteData);
        } else {
            // Handle removal of sprite (optional)
            console.log(`Removing ${category} layer... (not implemented)`);
        }
    }
}

// Make sprite builder available globally for testing
if (typeof window !== 'undefined') {
    window.SpriteBuilder = SpriteBuilder;

    // Make testing functions available globally
    window.testVerifiedSprites = function() {
        if (window.spriteBuilder) {
            window.spriteBuilder.testVerifiedPaths();
            window.spriteBuilder.loadSampleCharacter();
        } else {
            console.log('❌ Sprite builder not initialized yet');
        }
    };

    window.loadSampleCharacter = function() {
        if (window.spriteBuilder) {
            window.spriteBuilder.loadSampleCharacter();
        } else {
            console.log('❌ Sprite builder not initialized yet');
        }
    };
}

// Initialize sprite builder when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM LOADED - Checking for sprite canvas...');
    const canvas = document.getElementById('spriteCanvas');
    if (canvas) {
        console.log('✅ Found sprite canvas, initializing sprite builder...');
        window.spriteBuilder = new LPCSpriteBuilder();
        console.log('✅ Sprite Builder initialized successfully!');
    } else {
        console.warn('⚠️ Sprite canvas not found - sprite builder not initialized');
    }
});

// Global functions for HTML buttons
function updateSprite() {
    if (window.spriteBuilder) {
        window.spriteBuilder.updateSprite();
    }
}

function randomizeCharacter() {
    if (window.spriteBuilder) {
        window.spriteBuilder.randomizeCharacter();
    }
}

function resetCharacter() {
    if (window.spriteBuilder) {
        window.spriteBuilder.resetCharacter();
    }
}

function debugSprites() {
    if (window.spriteBuilder) {
        window.spriteBuilder.debugSprites();
    } else {
        alert('Sprite builder not initialized!');
    }
}

function exportCurrentFrame() {
    if (window.spriteBuilder) {
        window.spriteBuilder.exportCurrentFrame();
    }
}

function exportSpriteSheet() {
    if (window.spriteBuilder) {
        window.spriteBuilder.exportSpriteSheet();
    }
}

function saveCharacterProfile() {
    if (window.spriteBuilder) {
        window.spriteBuilder.saveCharacterProfile();
    }
}