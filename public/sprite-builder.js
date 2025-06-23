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
        this.currentBodyColor = 'light';
        this.currentHairStyle = 'page';
        this.currentHairColor = 'brunette';

        // LPC Asset data
        this.lpcAssetData = null;
        this.availablePaths = new Set();

        console.log('🎨 LPC Sprite Builder initialized');
        this.init();
    }

    async init() {
        console.log('📋 Initializing sprite builder...');

        // First load LPC asset data
        await this.loadLPCAssetData();

        // Then load basic character
        await this.loadBasicCharacter();
        this.startAnimation();
    }

    async loadLPCAssetData() {
        console.log('🗺️ Loading LPC Asset Data...');

        try {
            // Initialize the LPC Asset Mapper
            const mapper = new LPCAssetMapper();
            await mapper.ready;

            // Get all available paths
            const allPaths = mapper.getAllPaths();
            allPaths.forEach(path => this.availablePaths.add(path));

            console.log(`✅ Loaded ${allPaths.length} sprite paths from LPC generator`);

        } catch (error) {
            console.error('❌ Failed to load LPC asset data:', error);
        }
    }

    async loadBasicCharacter() {
        console.log('👤 Loading basic character...');

        try {
            // Clear existing layers
            this.layers = [];

            // Load body first
            await this.loadBodySprite();

            // Load hair
            await this.loadHairSprite();

            // Load basic clothing if available
            await this.loadClothingSprite();

            this.updateLayerList();
            this.drawCurrentFrame();

        } catch (error) {
            console.error('❌ Failed to load basic character:', error);
            this.drawTestRectangle();
        }
    }

    async loadBodySprite() {
        const bodyPath = `/lpc-generator/spritesheets/body/bodies/${this.currentSex}/${this.currentAnimation}.png`;

        if (this.availablePaths.has(bodyPath)) {
            await this.loadLayer('body', bodyPath, 1);
            console.log('✅ Loaded body sprite');
        } else {
            console.warn('❌ Body sprite not found:', bodyPath);
        }
    }

    async loadHairSprite() {
        const hairPath = `/lpc-generator/spritesheets/hair/${this.currentHairStyle}/adult/${this.currentAnimation}.png`;

        if (this.availablePaths.has(hairPath)) {
            await this.loadLayer('hair', hairPath, 10);
            console.log('✅ Loaded hair sprite');
        } else {
            console.warn('❌ Hair sprite not found:', hairPath);
        }
    }

    async loadClothingSprite() {
        // Try to load a basic torso
        const torsoPath = `/lpc-generator/spritesheets/torso/clothes/longsleeve/formal/${this.currentSex}/${this.currentAnimation}.png`;

        if (this.availablePaths.has(torsoPath)) {
            await this.loadLayer('torso', torsoPath, 5);
            console.log('✅ Loaded torso sprite');
        }

        // Try to load pants
        const pantsPath = `/lpc-generator/spritesheets/legs/pants/${this.currentSex}/${this.currentAnimation}.png`;

        if (this.availablePaths.has(pantsPath)) {
            await this.loadLayer('legs', pantsPath, 3);
            console.log('✅ Loaded legs sprite');
        }
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
                console.error(`❌ Failed to load layer: ${path}`);
                reject(new Error(`Failed to load: ${path}`));
            };

            img.src = path;
        });
    }

    drawCurrentFrame() {
        if (!this.ctx) return;

        // Clear canvas with a background color
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

    drawTestRectangle() {
        console.log('🔧 Drawing test rectangle');
        this.ctx.fillStyle = '#ff6b6b';
        this.ctx.fillRect(10, 10, 44, 44);
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '8px Arial';
        this.ctx.fillText('TEST', 15, 25);
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

    // Change body type and reload character
    async changeBodyType(bodyType) {
        this.currentSex = bodyType;
        console.log(`👤 Changing body type to: ${bodyType}`);
        await this.loadBasicCharacter();
    }

    // Change animation
    changeAnimation(animation) {
        this.stopAnimation();
        this.currentAnimation = animation;
        this.currentFrame = 0;
        console.log(`🎬 Changing animation to: ${animation}`);
        this.loadBasicCharacter();
    }

    // Change hair style
    async changeHairStyle(hairStyle) {
        this.currentHairStyle = hairStyle;
        console.log(`💇 Changing hair style to: ${hairStyle}`);

        // Remove existing hair layer
        this.layers = this.layers.filter(layer => layer.name !== 'hair');

        // Load new hair
        await this.loadHairSprite();
    }

    // Debug function
    debugSprites() {
        console.log('🧪 DEBUG: Sprite Builder State');
        console.log('Available paths:', this.availablePaths.size);
        console.log('Current layers:', this.layers.length);
        console.log('Current animation:', this.currentAnimation);
        console.log('Current body type:', this.currentSex);

        // Show some available paths
        const pathArray = Array.from(this.availablePaths);
        console.log('Sample paths:', pathArray.slice(0, 10));

        return {
            availablePaths: this.availablePaths.size,
            layers: this.layers.length,
            animation: this.currentAnimation,
            bodyType: this.currentSex
        };
    }

    // Randomize character
    async randomizeCharacter() {
        const bodyTypes = ['male', 'female', 'teen', 'child'];
        const hairStyles = ['page', 'plain', 'bangs', 'long', 'ponytail'];
        const animations = ['walk', 'hurt', 'shoot', 'slash', 'spellcast'];

        this.currentSex = bodyTypes[Math.floor(Math.random() * bodyTypes.length)];
        this.currentHairStyle = hairStyles[Math.floor(Math.random() * hairStyles.length)];
        this.currentAnimation = animations[Math.floor(Math.random() * animations.length)];

        console.log('🎲 Randomizing character...');
        await this.loadBasicCharacter();
    }

    // Test function
    testFunction() {
        console.log('🧪 TEST FUNCTION CALLED - Sprite Builder is working!');
        console.log('📊 Sprite Builder Status:');
        console.log('  Canvas:', !!this.canvas);
        console.log('  Context:', !!this.ctx);
        console.log('  Available paths:', this.availablePaths.size);
        console.log('  Loaded layers:', this.layers.length);

        return this.debugSprites();
    }
}

// Initialize sprite builder when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM LOADED - Checking for sprite canvas...');

    const canvas = document.getElementById('spriteCanvas');
    if (canvas) {
        console.log('✅ Found sprite canvas, initializing sprite builder...');
        window.spriteBuilder = new LPCSpriteBuilder();
        console.log('✅ Sprite Builder initialized successfully!');
    } else {
        console.log('❌ No sprite canvas found on this page');
    }
});

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