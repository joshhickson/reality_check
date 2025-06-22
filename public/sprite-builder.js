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

        console.log('🎨 LPC Sprite Builder initialized');
        this.init();
    }

    async init() {
        console.log('📋 Loading basic character...');
        await this.loadBasicCharacter();
        this.startAnimation();
    }

    async loadBasicCharacter() {
        console.log('👤 Loading basic character...');

        try {
            // Load known working sprites from LPC generator
            const bodyPath = `/lpc-generator/spritesheets/body/bodies/${this.currentSex}/walk.png`;
            await this.loadLayer('body', bodyPath, 1);
            console.log('✅ Loaded body');

            // Try to load hair
            const hairPath = `/lpc-generator/spritesheets/hair/page/adult/walk.png`;
            await this.loadLayer('hair', hairPath, 10);
            console.log('✅ Loaded hair');

        } catch (error) {
            console.error('❌ Failed to load basic character:', error);
            // Load a simple test rectangle if sprites fail
            this.drawTestRectangle();
        }
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
                console.error(`❌ Failed to load layer: ${path}`);
                reject(new Error(`Failed to load: ${path}`));
            };

            img.src = path;
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

    testFunction() {
        console.log('🧪 TEST FUNCTION CALLED - Sprite Builder is working!');
        console.log('Current state:', {
            layers: this.layers.length,
            isAnimating: this.isAnimating,
            currentAnimation: this.currentAnimation,
            canvasSize: `${this.canvas.width}x${this.canvas.height}`
        });

        // Force a redraw
        this.drawCurrentFrame();

        alert('Test function working! Check console and canvas.');
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
        try {
            const link = document.createElement('a');
            link.download = `character-frame-${this.currentAnimation}-${this.currentFrame}.png`;
            link.href = this.canvas.toDataURL();
            link.click();
            console.log('✅ Frame exported');
        } catch (error) {
            console.error('❌ Export failed:', error);
            alert('Export failed - check console for details');
        }
    }

    exportSpriteSheet() {
        console.log('📄 Exporting full sprite sheet...');
        alert('Full sprite sheet export not implemented yet');
    }

    saveCharacterProfile() {
        console.log('💾 Saving character profile...');
        alert('Character profile save not implemented yet');
    }

    debugSprites() {
        console.log('🔍 Debug function called');

        // Create debug panel
        const existingPanel = document.getElementById('spriteDebugPanel');
        if (existingPanel) {
            existingPanel.remove();
        }

        const debugPanel = document.createElement('div');
        debugPanel.id = 'spriteDebugPanel';
        debugPanel.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            width: 400px;
            max-height: 500px;
            background: rgba(0, 0, 0, 0.9);
            border: 2px solid #00ff00;
            border-radius: 10px;
            padding: 15px;
            color: #00ff00;
            font-family: 'Courier New', monospace;
            font-size: 11px;
            z-index: 10000;
            overflow-y: auto;
        `;

        debugPanel.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <h3 style="margin: 0; color: #00ff00;">🔍 Sprite Debug Panel</h3>
                <button onclick="document.getElementById('spriteDebugPanel').remove()" 
                        style="background: #ff0000; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;">×</button>
            </div>
            <div style="line-height: 1.4;">
                <strong>Canvas Status:</strong><br>
                • Canvas found: ${this.canvas ? '✅ Yes' : '❌ No'}<br>
                • Canvas size: ${this.canvas ? `${this.canvas.width}x${this.canvas.height}` : 'N/A'}<br>
                • Context: ${this.ctx ? '✅ Available' : '❌ Missing'}<br><br>

                <strong>Sprite Builder:</strong><br>
                • Layers loaded: ${this.layers.length}<br>
                • Current animation: ${this.currentAnimation}<br>
                • Current frame: ${this.currentFrame}<br>
                • Is animating: ${this.isAnimating ? '✅' : '❌'}<br><br>

                <strong>Layers:</strong><br>
                ${this.layers.length === 0 ? '• No layers loaded' : this.layers.map(layer => `• ${layer.name} (${layer.visible ? 'visible' : 'hidden'})`).join('<br>')}
                <br><br>

                <strong>Test Actions:</strong><br>
                <button onclick="window.spriteBuilder.drawTestRectangle()" 
                        style="background: #007700; color: white; border: none; padding: 5px 10px; margin: 2px; border-radius: 3px; cursor: pointer;">Draw Test Rectangle</button><br>
                <button onclick="window.spriteBuilder.loadBasicCharacter()" 
                        style="background: #0077ff; color: white; border: none; padding: 5px 10px; margin: 2px; border-radius: 3px; cursor: pointer;">Reload Character</button><br>
            </div>
        `;

        document.body.appendChild(debugPanel);
        console.log('🔍 Debug panel created');
    }
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