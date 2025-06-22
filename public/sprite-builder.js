
class LPCSpriteBuilder {
    constructor() {
        this.canvas = document.getElementById('spriteCanvas');
        this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
        
        if (!this.ctx) {
            console.error('❌ Sprite canvas not found');
            return;
        }

        // LPC Generator constants (extracted from chargen.js)
        this.universalFrameSize = 64;
        this.universalSheetWidth = 832;
        this.universalSheetHeight = 3456;
        
        // Animation definitions (from LPC generator)
        this.base_animations = {
            spellcast: 0,
            thrust: 4 * this.universalFrameSize,
            walk: 8 * this.universalFrameSize,
            slash: 12 * this.universalFrameSize,
            shoot: 16 * this.universalFrameSize,
            hurt: 20 * this.universalFrameSize,
            climb: 21 * this.universalFrameSize,
            idle: 22 * this.universalFrameSize,
            jump: 26 * this.universalFrameSize,
            sit: 30 * this.universalFrameSize,
            emote: 34 * this.universalFrameSize,
            run: 38 * this.universalFrameSize,
            combat_idle: 42 * this.universalFrameSize,
            backslash: 46 * this.universalFrameSize,
            halfslash: 50 * this.universalFrameSize
        };

        this.animationFrameCounts = {
            spellcast: 7,
            thrust: 8,
            walk: 9,
            slash: 6,
            shoot: 13,
            hurt: 6,
            climb: 6,
            idle: 2,
            jump: 5,
            sit: 3,
            emote: 3,
            run: 8,
            combat_idle: 2,
            backslash: 13,
            halfslash: 7
        };

        // Layer management
        this.layers = [];
        this.spriteData = null;
        this.currentAnimation = 'walk';
        this.currentFrame = 0;
        this.animationInterval = null;
        this.isAnimating = false;

        console.log('🎨 LPC Sprite Builder initialized');
        this.init();
    }

    async init() {
        console.log('📋 Extracting LPC sprite data...');
        
        // First, extract sprite data from the LPC generator
        await this.extractLPCSpriteData();
        
        // Load a basic character
        await this.loadBasicCharacter();
        
        // Start animation
        this.startAnimation();
    }

    async extractLPCSpriteData() {
        try {
            console.log('🔍 Fetching LPC generator HTML...');
            const response = await fetch('/lpc-generator/index.html');
            const html = await response.text();
            
            // Parse the HTML to extract data attributes
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            // Extract all input elements with data attributes
            const inputs = doc.querySelectorAll('input[data-layer_1_male], input[data-layer_1_female]');
            
            this.spriteData = {
                male: {},
                female: {},
                categories: new Set()
            };
            
            console.log(`📊 Found ${inputs.length} sprite definitions`);
            
            inputs.forEach(input => {
                const id = input.id;
                const parentName = input.getAttribute('parentname');
                const variant = input.getAttribute('variant');
                
                if (parentName && variant) {
                    const category = parentName.toLowerCase();
                    const variantName = variant.toLowerCase();
                    
                    this.spriteData.categories.add(category);
                    
                    // Extract paths for both sexes
                    const malePath = input.getAttribute('data-layer_1_male');
                    const femalePath = input.getAttribute('data-layer_1_female');
                    
                    if (malePath) {
                        if (!this.spriteData.male[category]) {
                            this.spriteData.male[category] = {};
                        }
                        this.spriteData.male[category][variantName] = malePath;
                    }
                    
                    if (femalePath) {
                        if (!this.spriteData.female[category]) {
                            this.spriteData.female[category] = {};
                        }
                        this.spriteData.female[category][variantName] = femalePath;
                    }
                }
            });
            
            console.log('✅ LPC sprite data extracted:', {
                categories: Array.from(this.spriteData.categories),
                maleAssets: Object.keys(this.spriteData.male).length,
                femaleAssets: Object.keys(this.spriteData.female).length
            });
            
        } catch (error) {
            console.error('❌ Failed to extract LPC sprite data:', error);
            
            // Fallback to basic known paths
            this.spriteData = {
                male: {
                    body: { 
                        default: '/lpc-generator/spritesheets/body/bodies/male/walk.png' 
                    },
                    hair: { 
                        page: '/lpc-generator/spritesheets/hair/page/adult/walk.png' 
                    }
                },
                female: {
                    body: { 
                        default: '/lpc-generator/spritesheets/body/bodies/female/walk.png' 
                    },
                    hair: { 
                        page: '/lpc-generator/spritesheets/hair/page/adult/walk.png' 
                    }
                },
                categories: new Set(['body', 'hair'])
            };
            
            console.log('🔄 Using fallback sprite data');
        }
    }

    async loadBasicCharacter() {
        console.log('👤 Loading basic character...');
        
        const sex = 'male'; // Start with male
        
        try {
            // Load body (highest priority)
            if (this.spriteData[sex].body) {
                const bodyVariants = Object.keys(this.spriteData[sex].body);
                if (bodyVariants.length > 0) {
                    const bodyPath = this.spriteData[sex].body[bodyVariants[0]];
                    await this.loadLayer('body', bodyPath, 1);
                    console.log('✅ Loaded body:', bodyPath);
                }
            }
            
            // Load hair
            if (this.spriteData[sex].hair) {
                const hairVariants = Object.keys(this.spriteData[sex].hair);
                if (hairVariants.length > 0) {
                    const hairPath = this.spriteData[sex].hair[hairVariants[0]];
                    await this.loadLayer('hair', hairPath, 10);
                    console.log('✅ Loaded hair:', hairPath);
                }
            }
            
            // Try to load clothing if available
            await this.loadBasicClothing(sex);
            
            console.log('🎉 Basic character loaded successfully!');
            
        } catch (error) {
            console.error('❌ Failed to load basic character:', error);
        }
    }

    async loadBasicClothing(sex) {
        // Try to load basic clothing from extracted data
        const clothingCategories = ['torso', 'legs', 'feet'];
        
        for (const category of clothingCategories) {
            if (this.spriteData[sex][category]) {
                const variants = Object.keys(this.spriteData[sex][category]);
                if (variants.length > 0) {
                    const clothingPath = this.spriteData[sex][category][variants[0]];
                    const zIndex = category === 'torso' ? 5 : (category === 'legs' ? 3 : 2);
                    
                    try {
                        await this.loadLayer(category, clothingPath, zIndex);
                        console.log(`✅ Loaded ${category}:`, clothingPath);
                    } catch (error) {
                        console.warn(`⚠️ Failed to load ${category}:`, clothingPath);
                    }
                }
            }
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
        
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw layers in z-index order
        this.layers.forEach(layer => {
            if (layer.visible && layer.image) {
                try {
                    // Calculate frame position (simplified for now)
                    const frameWidth = this.universalFrameSize;
                    const frameHeight = this.universalFrameSize;
                    const animRow = this.base_animations[this.currentAnimation] / this.universalFrameSize;
                    
                    // Source position on the sprite sheet
                    const sx = this.currentFrame * frameWidth;
                    const sy = animRow * frameHeight;
                    
                    // Destination position on canvas
                    const dx = 0;
                    const dy = 0;
                    
                    this.ctx.drawImage(
                        layer.image,
                        sx, sy, frameWidth, frameHeight,
                        dx, dy, frameWidth, frameHeight
                    );
                } catch (error) {
                    console.warn(`⚠️ Error drawing layer ${layer.name}:`, error);
                }
            }
        });
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
            layerItem.className = 'layer-item';
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
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.updateLayerList();
        console.log('🔄 Character reset');
    }

    // Debug method to inspect sprite data
    debugSprites() {
        console.log('🔍 Sprite Data Debug:');
        console.log('Categories:', Array.from(this.spriteData.categories));
        console.log('Male assets:', this.spriteData.male);
        console.log('Female assets:', this.spriteData.female);
        console.log('Current layers:', this.layers);
        
        return {
            spriteData: this.spriteData,
            layers: this.layers,
            currentAnimation: this.currentAnimation,
            isAnimating: this.isAnimating
        };
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM LOADED - Initializing LPC Sprite Builder...');
    
    window.spriteBuilder = new LPCSpriteBuilder();
    
    // Global debug functions
    window.debugSprites = function() {
        if (window.spriteBuilder) {
            return window.spriteBuilder.debugSprites();
        } else {
            console.error('❌ spriteBuilder not initialized');
        }
    };
    
    window.testFunction = function() {
        console.log('🧪 TEST FUNCTION CALLED - Sprite Builder is working!');
        return true;
    };
    
    console.log('✅ Global functions registered');
});
