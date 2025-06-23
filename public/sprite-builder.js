
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

        // Asset mapper data
        this.assetMap = null;
        this.pathsByCategory = {};
        this.pathsByBodyType = {};

        console.log('🎨 LPC Sprite Builder initialized');
        this.init();
    }

    async init() {
        console.log('📋 Initializing sprite builder...');

        // Initialize LPC Asset Mapper first
        await this.initializeAssetMapper();

        // Then load basic character
        await this.loadBasicCharacter();
        this.setupUI();
        this.startAnimation();
    }

    async initializeAssetMapper() {
        console.log('🗺️ Initializing LPC Asset Mapper...');
        
        try {
            // Create and initialize asset mapper
            this.assetMapper = new LPCAssetMapper();
            await this.assetMapper.ready;

            // Get all paths and organize them
            const allPaths = this.assetMapper.getAllPaths();
            console.log(`✅ Loaded ${allPaths.length} sprite paths from LPC Asset Mapper`);

            // Organize paths by category and body type
            this.organizePaths(allPaths);
            
            console.log('✅ Asset mapper initialization complete');
            
        } catch (error) {
            console.error('❌ Failed to initialize asset mapper:', error);
            // Fall back to basic paths
            this.initializeFallbackPaths();
        }
    }

    organizePaths(allPaths) {
        console.log('📊 Organizing sprite paths...');

        this.pathsByCategory = {};
        this.pathsByBodyType = {
            male: {},
            female: {},
            child: {},
            teen: {},
            adult: {}
        };

        allPaths.forEach(path => {
            // Extract category (first directory after spritesheets)
            const categoryMatch = path.match(/\/spritesheets\/([^\/]+)\//);
            if (categoryMatch) {
                const category = categoryMatch[1];
                
                if (!this.pathsByCategory[category]) {
                    this.pathsByCategory[category] = [];
                }
                this.pathsByCategory[category].push(path);

                // Extract body type
                let bodyType = 'unknown';
                if (path.includes('/male/')) bodyType = 'male';
                else if (path.includes('/female/')) bodyType = 'female';
                else if (path.includes('/child/')) bodyType = 'child';
                else if (path.includes('/teen/')) bodyType = 'teen';
                else if (path.includes('/adult/')) bodyType = 'adult';

                if (bodyType !== 'unknown' && this.pathsByBodyType[bodyType]) {
                    if (!this.pathsByBodyType[bodyType][category]) {
                        this.pathsByBodyType[bodyType][category] = [];
                    }
                    this.pathsByBodyType[bodyType][category].push(path);
                }
            }
        });

        console.log(`📋 Organized paths into ${Object.keys(this.pathsByCategory).length} categories`);
        console.log('Categories:', Object.keys(this.pathsByCategory).sort());
    }

    initializeFallbackPaths() {
        console.log('⚠️ Using fallback sprite paths');
        
        this.pathsByCategory = {
            body: ['/lpc-generator/spritesheets/body/bodies/male/walk.png'],
            hair: ['/lpc-generator/spritesheets/hair/page/adult/walk.png']
        };

        this.pathsByBodyType = {
            male: {
                body: ['/lpc-generator/spritesheets/body/bodies/male/walk.png'],
                hair: ['/lpc-generator/spritesheets/hair/page/adult/walk.png']
            }
        };
    }

    async loadBasicCharacter() {
        console.log('👤 Loading basic character...');

        try {
            // Load body sprite (highest priority)
            await this.loadCategorySprite('body', 1);
            
            // Load hair sprite
            await this.loadCategorySprite('hair', 10);

            // Load additional layers if available
            const additionalCategories = ['torso', 'legs', 'feet'];
            let zIndex = 20;
            
            for (const category of additionalCategories) {
                if (this.pathsByBodyType[this.currentSex] && 
                    this.pathsByBodyType[this.currentSex][category]) {
                    await this.loadCategorySprite(category, zIndex);
                    zIndex += 10;
                }
            }

        } catch (error) {
            console.error('❌ Failed to load basic character:', error);
            this.drawTestRectangle();
        }
    }

    async loadCategorySprite(category, zIndex) {
        console.log(`🎯 Loading ${category} sprite for ${this.currentSex}...`);

        try {
            // Get paths for this category and body type
            const categoryPaths = this.pathsByBodyType[this.currentSex]?.[category] || 
                                 this.pathsByCategory[category] || [];

            if (categoryPaths.length === 0) {
                console.warn(`⚠️ No ${category} sprites found for ${this.currentSex}`);
                return;
            }

            // Find a walk animation sprite or use the first available
            let spritePath = categoryPaths.find(path => path.includes('/walk.png')) || 
                           categoryPaths[0];

            console.log(`🔍 Loading sprite: ${spritePath}`);
            
            await this.loadLayer(category, spritePath, zIndex);
            
        } catch (error) {
            console.error(`❌ Failed to load ${category} sprite:`, error);
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

    changeAnimation(newAnimation) {
        if (this.base_animations[newAnimation]) {
            this.currentAnimation = newAnimation;
            this.currentFrame = 0;
            
            if (this.isAnimating) {
                this.stopAnimation();
                this.startAnimation();
            }
            
            this.drawCurrentFrame();
            console.log(`🎬 Animation changed to: ${newAnimation}`);
        }
    }

    changeSex(newSex) {
        if (newSex !== this.currentSex) {
            this.currentSex = newSex;
            console.log(`👤 Changed to ${newSex} character`);
            
            // Reload character with new sex
            this.resetCharacter();
            this.loadBasicCharacter();
        }
    }

    async addCategory(category) {
        console.log(`➕ Adding ${category} layer...`);
        
        const availableCategories = Object.keys(this.pathsByBodyType[this.currentSex] || {});
        
        if (!availableCategories.includes(category)) {
            console.warn(`⚠️ Category ${category} not available for ${this.currentSex}`);
            return;
        }

        // Find the highest z-index and add 10
        const maxZIndex = Math.max(...this.layers.map(l => l.zIndex), 0);
        await this.loadCategorySprite(category, maxZIndex + 10);
    }

    removeCategory(category) {
        const layerIndex = this.layers.findIndex(layer => layer.name === category);
        if (layerIndex !== -1) {
            this.layers.splice(layerIndex, 1);
            this.updateLayerList();
            this.drawCurrentFrame();
            console.log(`➖ Removed ${category} layer`);
        }
    }

    setupUI() {
        console.log('🖼️ Setting up sprite builder UI...');

        // Create controls container if it doesn't exist
        let controlsContainer = document.getElementById('spriteControls');
        if (!controlsContainer) {
            controlsContainer = document.createElement('div');
            controlsContainer.id = 'spriteControls';
            controlsContainer.style.cssText = `
                margin: 20px 0;
                padding: 15px;
                background: #2a2a3e;
                border-radius: 8px;
                color: #ffffff;
            `;
            
            // Insert after canvas
            const canvas = document.getElementById('spriteCanvas');
            if (canvas && canvas.parentNode) {
                canvas.parentNode.insertBefore(controlsContainer, canvas.nextSibling);
            }
        }

        // Animation controls
        const animationControls = document.createElement('div');
        animationControls.style.cssText = 'margin-bottom: 15px;';
        animationControls.innerHTML = `
            <h4 style="margin: 0 0 10px 0;">Animations</h4>
            <div>
                ${Object.keys(this.base_animations).map(anim => 
                    `<button onclick="window.spriteBuilder.changeAnimation('${anim}')" 
                            style="margin: 2px; padding: 5px 10px; background: #4a4a6e; color: white; border: 1px solid #6a6a8e; border-radius: 4px; cursor: pointer;">
                        ${anim}
                    </button>`
                ).join('')}
            </div>
        `;

        // Body type controls
        const bodyTypeControls = document.createElement('div');
        bodyTypeControls.style.cssText = 'margin-bottom: 15px;';
        bodyTypeControls.innerHTML = `
            <h4 style="margin: 0 0 10px 0;">Body Type</h4>
            <div>
                ${Object.keys(this.pathsByBodyType).map(bodyType => 
                    `<button onclick="window.spriteBuilder.changeSex('${bodyType}')" 
                            style="margin: 2px; padding: 5px 10px; background: #4a4a6e; color: white; border: 1px solid #6a6a8e; border-radius: 4px; cursor: pointer;">
                        ${bodyType}
                    </button>`
                ).join('')}
            </div>
        `;

        // Category controls
        const categoryControls = document.createElement('div');
        categoryControls.style.cssText = 'margin-bottom: 15px;';
        const availableCategories = Object.keys(this.pathsByCategory).sort();
        categoryControls.innerHTML = `
            <h4 style="margin: 0 0 10px 0;">Add Layers</h4>
            <div>
                ${availableCategories.slice(0, 10).map(category => 
                    `<button onclick="window.spriteBuilder.addCategory('${category}')" 
                            style="margin: 2px; padding: 5px 10px; background: #4a4a6e; color: white; border: 1px solid #6a6a8e; border-radius: 4px; cursor: pointer;">
                        ${category}
                    </button>`
                ).join('')}
            </div>
        `;

        // General controls
        const generalControls = document.createElement('div');
        generalControls.innerHTML = `
            <h4 style="margin: 0 0 10px 0;">Controls</h4>
            <button onclick="window.spriteBuilder.resetCharacter()" 
                    style="margin: 2px; padding: 5px 10px; background: #aa4a4a; color: white; border: 1px solid #ca6a6a; border-radius: 4px; cursor: pointer;">
                Reset Character
            </button>
            <button onclick="window.spriteBuilder.testFunction()" 
                    style="margin: 2px; padding: 5px 10px; background: #4a6a4a; color: white; border: 1px solid #6a8a6a; border-radius: 4px; cursor: pointer;">
                Test Function
            </button>
        `;

        // Layers list
        const layersContainer = document.createElement('div');
        layersContainer.innerHTML = '<h4 style="margin: 0 0 10px 0;">Current Layers</h4><div id="layersList"></div>';

        // Add all controls
        controlsContainer.innerHTML = '';
        controlsContainer.appendChild(animationControls);
        controlsContainer.appendChild(bodyTypeControls);
        controlsContainer.appendChild(categoryControls);
        controlsContainer.appendChild(generalControls);
        controlsContainer.appendChild(layersContainer);

        this.updateLayerList();
    }

    updateLayerList() {
        const layersList = document.getElementById('layersList');
        if (!layersList) return;

        layersList.innerHTML = '';

        this.layers.forEach((layer, index) => {
            const layerItem = document.createElement('div');
            layerItem.style.cssText = 'margin: 5px 0; padding: 5px; background: #3a3a4e; border-radius: 4px;';
            layerItem.innerHTML = `
                <label style="display: flex; align-items: center; gap: 10px;">
                    <input type="checkbox" ${layer.visible ? 'checked' : ''} 
                           onchange="window.spriteBuilder.toggleLayerVisibility(${index})">
                    <span style="flex: 1;">${layer.name} (z:${layer.zIndex})</span>
                    <button onclick="window.spriteBuilder.removeLayer(${index})"
                            style="padding: 2px 8px; background: #aa4a4a; color: white; border: 1px solid #ca6a6a; border-radius: 3px; cursor: pointer;">
                        Remove
                    </button>
                </label>
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

    drawTestRectangle() {
        console.log('🔧 Drawing test rectangle');
        this.ctx.fillStyle = '#ff6b6b';
        this.ctx.fillRect(10, 10, 44, 44);
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '8px Arial';
        this.ctx.fillText('TEST', 15, 25);
    }

    testFunction() {
        console.log('🧪 TEST FUNCTION CALLED - Sprite Builder is working!');
        console.log('📊 Available categories:', Object.keys(this.pathsByCategory).sort());
        console.log('👥 Available body types:', Object.keys(this.pathsByBodyType));
        console.log('📋 Current layers:', this.layers.map(l => l.name));
        console.log('🎬 Current animation:', this.currentAnimation);
        console.log('👤 Current body type:', this.currentSex);
        
        // Show statistics
        const totalPaths = Object.values(this.pathsByCategory).reduce((sum, arr) => sum + arr.length, 0);
        console.log(`📈 Total sprite paths loaded: ${totalPaths}`);
        
        return true;
    }

    // Export current character configuration
    exportCharacter() {
        const characterData = {
            bodyType: this.currentSex,
            animation: this.currentAnimation,
            layers: this.layers.map(layer => ({
                name: layer.name,
                path: layer.path,
                zIndex: layer.zIndex,
                visible: layer.visible
            }))
        };
        
        console.log('📤 Character export:', characterData);
        return characterData;
    }

    // Import character configuration
    async importCharacter(characterData) {
        console.log('📥 Importing character:', characterData);
        
        this.resetCharacter();
        this.currentSex = characterData.bodyType || 'male';
        this.currentAnimation = characterData.animation || 'walk';
        
        // Load each layer
        for (const layerData of characterData.layers || []) {
            try {
                await this.loadLayer(layerData.name, layerData.path, layerData.zIndex);
                
                // Set visibility
                const layer = this.layers.find(l => l.name === layerData.name);
                if (layer) {
                    layer.visible = layerData.visible;
                }
            } catch (error) {
                console.warn(`⚠️ Failed to load layer ${layerData.name}:`, error);
            }
        }
        
        this.updateLayerList();
        this.drawCurrentFrame();
    }
}

// Initialize sprite builder when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOM LOADED - Checking for sprite canvas...');
    
    const spriteCanvas = document.getElementById('spriteCanvas');
    if (spriteCanvas) {
        console.log('✅ Found sprite canvas, initializing sprite builder...');
        window.spriteBuilder = new LPCSpriteBuilder();
        console.log('✅ Sprite Builder initialized successfully!');
        console.log('spriteBuilder object:', typeof window.spriteBuilder);
        console.log('testFunction exists:', typeof window.spriteBuilder.testFunction);
        
        // Call test function to verify it's working
        console.log('FORCE LOG TEST');
        window.spriteBuilder.testFunction();
    } else {
        console.warn('⚠️ Sprite canvas not found, sprite builder not initialized');
    }
});
