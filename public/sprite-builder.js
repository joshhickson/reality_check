
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
        this.universalSheetHeight = 1344;
        
        // Animation definitions (from LPC generator)
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
        this.spriteData = null;
        this.currentAnimation = 'walk';
        this.currentFrame = 0;
        this.animationInterval = null;
        this.isAnimating = false;

        // Character state
        this.currentSex = 'male';
        this.characterProfile = {
            sex: 'male',
            bodyColor: 'light',
            hairStyle: 'page',
            hairColor: 'brown',
            layers: []
        };

        console.log('🎨 LPC Sprite Builder initialized');
        this.init();
    }

    async init() {
        console.log('📋 Extracting LPC sprite data...');
        
        // Extract sprite data from the LPC generator
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
                        light: '/lpc-generator/spritesheets/body/bodies/male/walk.png' 
                    },
                    hair: { 
                        page: '/lpc-generator/spritesheets/hair/page/adult/walk.png' 
                    }
                },
                female: {
                    body: { 
                        light: '/lpc-generator/spritesheets/body/bodies/female/walk.png' 
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
        
        try {
            // Load body (highest priority)
            if (this.spriteData[this.currentSex].body) {
                const bodyVariants = Object.keys(this.spriteData[this.currentSex].body);
                if (bodyVariants.length > 0) {
                    const bodyPath = this.spriteData[this.currentSex].body[bodyVariants[0]];
                    await this.loadLayer('body', bodyPath, 1);
                    console.log('✅ Loaded body:', bodyPath);
                }
            }
            
            // Load hair
            if (this.spriteData[this.currentSex].hair) {
                const hairVariants = Object.keys(this.spriteData[this.currentSex].hair);
                if (hairVariants.length > 0) {
                    const hairPath = this.spriteData[this.currentSex].hair[hairVariants[0]];
                    await this.loadLayer('hair', hairPath, 10);
                    console.log('✅ Loaded hair:', hairPath);
                }
            }
            
            console.log('🎉 Basic character loaded successfully!');
            
        } catch (error) {
            console.error('❌ Failed to load basic character:', error);
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
                    // Calculate frame position
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
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.updateLayerList();
        console.log('🔄 Character reset');
    }

    // Missing functions that the HTML buttons are calling
    testFunction() {
        console.log('🧪 Test function called - Sprite Builder is working!');
        console.log('Current state:', {
            layers: this.layers.length,
            isAnimating: this.isAnimating,
            currentAnimation: this.currentAnimation,
            spriteDataCategories: this.spriteData ? Array.from(this.spriteData.categories).length : 0
        });
        alert('Test function working! Check console for details.');
        return true;
    }

    loadCharacter(sex = 'male') {
        console.log(`👤 Loading ${sex} character...`);
        this.currentSex = sex;
        this.resetCharacter();
        this.loadBasicCharacter();
    }

    updateSprite() {
        console.log('🔄 Updating sprite based on form selections...');
        const sex = document.querySelector('input[name="sex"]:checked')?.value || 'male';
        const bodyColor = document.getElementById('bodyColor')?.value || 'light';
        const hairStyle = document.getElementById('hairStyle')?.value || 'page';
        const hairColor = document.getElementById('hairColor')?.value || 'brown';
        
        this.currentSex = sex;
        this.characterProfile = { sex, bodyColor, hairStyle, hairColor, layers: [] };
        
        this.loadCharacter(sex);
    }

    changeAnimation() {
        const animationSelect = document.getElementById('animationSelect');
        if (animationSelect) {
            this.currentAnimation = animationSelect.value;
            this.currentFrame = 0;
            console.log(`🎬 Changed to ${this.currentAnimation} animation`);
        }
    }

    randomizeCharacter() {
        console.log('🎲 Randomizing character...');
        const sexes = ['male', 'female'];
        const randomSex = sexes[Math.floor(Math.random() * sexes.length)];
        
        // Update form controls
        const sexRadio = document.querySelector(`input[name="sex"][value="${randomSex}"]`);
        if (sexRadio) sexRadio.checked = true;
        
        this.loadCharacter(randomSex);
    }

    exportCurrentFrame() {
        console.log('📁 Exporting current frame...');
        const link = document.createElement('a');
        link.download = `character-frame-${this.currentAnimation}-${this.currentFrame}.png`;
        link.href = this.canvas.toDataURL();
        link.click();
        console.log('✅ Frame exported');
    }

    exportSpriteSheet() {
        console.log('📄 Exporting full sprite sheet...');
        // Create a larger canvas for the full sprite sheet
        const fullCanvas = document.getElementById('fullSpriteSheet') || document.createElement('canvas');
        fullCanvas.width = this.universalSheetWidth;
        fullCanvas.height = this.universalSheetHeight;
        const fullCtx = fullCanvas.getContext('2d');
        
        // Draw all animation frames
        Object.keys(this.base_animations).forEach(animation => {
            const animRow = this.base_animations[animation] / this.universalFrameSize;
            const frameCount = this.animationFrameCounts[animation] || 9;
            
            for (let frame = 0; frame < frameCount; frame++) {
                this.layers.forEach(layer => {
                    if (layer.visible && layer.image) {
                        const sx = frame * this.universalFrameSize;
                        const sy = animRow * this.universalFrameSize;
                        const dx = frame * this.universalFrameSize;
                        const dy = animRow * this.universalFrameSize;
                        
                        fullCtx.drawImage(
                            layer.image,
                            sx, sy, this.universalFrameSize, this.universalFrameSize,
                            dx, dy, this.universalFrameSize, this.universalFrameSize
                        );
                    }
                });
            }
        });
        
        const link = document.createElement('a');
        link.download = 'character-spritesheet.png';
        link.href = fullCanvas.toDataURL();
        link.click();
        console.log('✅ Sprite sheet exported');
    }

    saveCharacterProfile() {
        console.log('💾 Saving character profile...');
        const profile = {
            ...this.characterProfile,
            layers: this.layers.map(layer => ({
                name: layer.name,
                path: layer.path,
                zIndex: layer.zIndex,
                visible: layer.visible
            }))
        };
        
        const blob = new Blob([JSON.stringify(profile, null, 2)], { type: 'application/json' });
        const link = document.createElement('a');
        link.download = 'character-profile.json';
        link.href = URL.createObjectURL(blob);
        link.click();
        console.log('✅ Character profile saved');
    }

    updateDebugPanel() {
        console.log('🔧 Debug panel update called');
        this.debugSprites();
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
    console.log('🚀 DOM LOADED - Checking for sprite canvas...');
    
    if (document.getElementById('spriteCanvas')) {
        console.log('✅ Found sprite canvas, initializing sprite builder...');
        window.spriteBuilder = new LPCSpriteBuilder();
        console.log('✅ Sprite Builder initialized successfully!');
    } else {
        console.log('⚠️ Sprite canvas not found on this page');
    }
    
    // Global functions for HTML buttons
    window.updateSprite = function() {
        if (window.spriteBuilder) {
            window.spriteBuilder.updateSprite();
        }
    };
    
    window.changeAnimation = function() {
        if (window.spriteBuilder) {
            window.spriteBuilder.changeAnimation();
        }
    };
    
    window.randomizeCharacter = function() {
        if (window.spriteBuilder) {
            window.spriteBuilder.randomizeCharacter();
        }
    };
    
    window.resetCharacter = function() {
        if (window.spriteBuilder) {
            window.spriteBuilder.resetCharacter();
        }
    };
    
    window.debugSprites = function() {
        if (window.spriteBuilder) {
            return window.spriteBuilder.debugSprites();
        }
    };
    
    window.exportCurrentFrame = function() {
        if (window.spriteBuilder) {
            window.spriteBuilder.exportCurrentFrame();
        }
    };
    
    window.exportSpriteSheet = function() {
        if (window.spriteBuilder) {
            window.spriteBuilder.exportSpriteSheet();
        }
    };
    
    window.saveCharacterProfile = function() {
        if (window.spriteBuilder) {
            window.spriteBuilder.saveCharacterProfile();
        }
    };
    
    console.log('✅ Global functions registered');
});
