// Simple LPC Sprite Builder that works like the original LPC generator
class LPCSpriteBuilder {
    constructor() {
        this.canvas = document.getElementById('spriteCanvas');
        this.ctx = this.canvas ? this.canvas.getContext('2d') : null;

        if (!this.ctx) {
            console.error('Sprite canvas not found');
            return;
        }

        // Set up canvas properties like LPC generator
        this.ctx.imageSmoothingEnabled = false;
        this.ctx.webkitImageSmoothingEnabled = false;
        this.ctx.mozImageSmoothingEnabled = false;

        // Animation settings from LPC generator
        this.universalFrameSize = 64;
        this.currentFrame = 0;
        this.currentAnimation = 'walk';
        this.animationSpeed = 200;
        this.isAnimating = false;
        this.animationInterval = null;

        // Animation definitions from LPC generator
        this.animations = {
            spellcast: { row: 0, frames: 7 },
            thrust: { row: 4, frames: 8 },
            walk: { row: 8, frames: 9 },
            slash: { row: 12, frames: 6 },
            shoot: { row: 16, frames: 13 },
            hurt: { row: 20, frames: 6 }
        };

        // Sprite layers (in drawing order)
        this.layers = [];
        this.imageCache = {};

        this.init();
    }

    init() {
        console.log('🎨 Initializing LPC Sprite Builder...');

        // Load a basic character
        this.loadBasicCharacter();

        // Start animation
        this.startAnimation();

        // Bind controls
        this.bindControls();
    }

    async loadBasicCharacter() {
        // Clear existing layers
        this.layers = [];

        // Load basic character layers in correct order
        const layerConfig = [
            { name: 'body', path: '/lpc-generator/spritesheets/body/bodies/male/walk.png', zIndex: 0 },
            { name: 'hair', path: '/lpc-generator/spritesheets/hair/page/adult/walk.png', zIndex: 10 },
            { name: 'shirt', path: '/lpc-generator/spritesheets/torso/clothes/longsleeve/male/walk.png', zIndex: 5 },
            { name: 'pants', path: '/lpc-generator/spritesheets/legs/pants/male/walk.png', zIndex: 3 },
            { name: 'shoes', path: '/lpc-generator/spritesheets/feet/shoes/basic/male/walk.png', zIndex: 2 }
        ];

        for (const config of layerConfig) {
            await this.loadLayer(config.name, config.path, config.zIndex);
        }

        console.log(`✅ Loaded ${this.layers.length} sprite layers`);
    }

    async loadLayer(name, path, zIndex) {
        return new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';

            img.onload = () => {
                this.layers.push({
                    name: name,
                    image: img,
                    zIndex: zIndex,
                    visible: true,
                    path: path
                });

                // Sort layers by zIndex
                this.layers.sort((a, b) => a.zIndex - b.zIndex);

                console.log(`✅ Loaded layer: ${name}`);
                this.updateDebugInfo();
                resolve(true);
            };

            img.onerror = () => {
                console.warn(`❌ Failed to load: ${path}`);
                resolve(false);
            };

            img.src = path;
        });
    }

    startAnimation() {
        if (this.animationInterval) {
            clearInterval(this.animationInterval);
        }

        this.isAnimating = true;
        this.currentFrame = 0;

        this.animationInterval = setInterval(() => {
            this.drawCurrentFrame();
            this.currentFrame = (this.currentFrame + 1) % this.animations[this.currentAnimation].frames;
        }, this.animationSpeed);

        console.log(`🎬 Started ${this.currentAnimation} animation`);
    }

    stopAnimation() {
        if (this.animationInterval) {
            clearInterval(this.animationInterval);
            this.animationInterval = null;
        }
        this.isAnimating = false;
    }

    drawCurrentFrame() {
        if (!this.ctx || this.layers.length === 0) return;

        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const anim = this.animations[this.currentAnimation];
        const sourceX = this.currentFrame * this.universalFrameSize;
        const sourceY = (anim.row + 2) * this.universalFrameSize; // +2 for south direction (front view)

        // Draw each layer in zIndex order
        this.layers.forEach(layer => {
            if (layer.visible && layer.image) {
                // Scale up for better visibility (like LPC generator preview)
                const scale = 4;
                const destX = (this.canvas.width - this.universalFrameSize * scale) / 2;
                const destY = (this.canvas.height - this.universalFrameSize * scale) / 2;

                this.ctx.drawImage(
                    layer.image,
                    sourceX, sourceY,
                    this.universalFrameSize, this.universalFrameSize,
                    destX, destY,
                    this.universalFrameSize * scale, this.universalFrameSize * scale
                );
            }
        });
    }

    bindControls() {
        // Animation controls
        const animSelect = document.getElementById('animationSelect');
        if (animSelect) {
            animSelect.addEventListener('change', (e) => {
                this.currentAnimation = e.target.value;
                this.currentFrame = 0;
                console.log(`🎭 Changed animation to: ${this.currentAnimation}`);
            });
        }

        // Body type controls
        const bodyTypeSelect = document.getElementById('bodyType');
        if (bodyTypeSelect) {
            bodyTypeSelect.addEventListener('change', (e) => {
                this.changeBodyType(e.target.value);
            });
        }

        // Hair style controls
        const hairSelect = document.getElementById('hairStyle');
        if (hairSelect) {
            hairSelect.addEventListener('change', (e) => {
                this.changeHairStyle(e.target.value);
            });
        }
    }

    async changeBodyType(bodyType) {
        // Update body layer
        const bodyPath = `/lpc-generator/spritesheets/body/bodies/${bodyType}/walk.png`;
        await this.replaceLayer('body', bodyPath);
        console.log(`🚹 Changed body type to: ${bodyType}`);
    }

    async changeHairStyle(hairStyle) {
        // Update hair layer
        const hairPath = `/lpc-generator/spritesheets/hair/${hairStyle}/adult/walk.png`;
        await this.replaceLayer('hair', hairPath);
        console.log(`💇 Changed hair style to: ${hairStyle}`);
    }

    async replaceLayer(layerName, newPath) {
        // Remove existing layer
        this.layers = this.layers.filter(layer => layer.name !== layerName);

        // Load new layer with same zIndex
        const zIndexMap = { body: 0, hair: 10, shirt: 5, pants: 3, shoes: 2 };
        await this.loadLayer(layerName, newPath, zIndexMap[layerName] || 5);
    }

    updateDebugInfo() {
        // Update debug panel if it exists
        const debugPanel = document.getElementById('spriteDebugPanel');
        if (debugPanel) {
            const info = this.layers.map(layer => 
                `${layer.name}: ${layer.visible ? '✅' : '❌'} (z:${layer.zIndex})`
            ).join('<br>');

            debugPanel.innerHTML = `
                <h4>Sprite Layers (${this.layers.length})</h4>
                <div style="font-family: monospace; font-size: 12px;">
                    ${info}
                </div>
                <div style="margin-top: 10px;">
                    Animation: ${this.currentAnimation} (frame ${this.currentFrame})
                </div>
            `;
        }
    }

    // Test function for debugging
    test() {
        console.log('🧪 Sprite Builder Test:');
        console.log(`- Canvas: ${this.canvas ? '✅' : '❌'}`);
        console.log(`- Context: ${this.ctx ? '✅' : '❌'}`);
        console.log(`- Layers: ${this.layers.length}`);
        console.log(`- Animation: ${this.isAnimating ? 'Running' : 'Stopped'}`);
        return 'Sprite Builder is working!';
    }
}

// Initialize sprite builder when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM LOADED - Initializing sprite builder...');

    const spriteCanvas = document.getElementById('spriteCanvas');
    if (spriteCanvas) {
        console.log('✅ Found sprite canvas, initializing sprite builder...');
        window.spriteBuilder = new LPCSpriteBuilder();
        console.log('✅ Sprite Builder initialized successfully!');

        // Add test function to global scope
        window.testSprites = () => window.spriteBuilder.test();
        console.log('🧪 Test function available: testSprites()');
    } else {
        console.warn('❌ Sprite canvas not found');
    }
});

// Global functions for HTML buttons to call
function debugSprites() {
    forceLog('🔧 Global debugSprites() called');
    if (spriteBuilder && typeof spriteBuilder.debugSprites === 'function') {
        spriteBuilder.debugSprites();
    } else {
        const error = 'ERROR: spriteBuilder not initialized or debugSprites not found';
        forceLog(error);
        alert(error);
    }
}

function randomizeCharacter() {
    forceLog('🎲 Global randomizeCharacter() called');
    if (spriteBuilder && typeof spriteBuilder.randomizeCharacter === 'function') {
        spriteBuilder.randomizeCharacter();
    } else {
        const error = 'ERROR: spriteBuilder not initialized or randomizeCharacter not found';
        forceLog(error);
        alert(error);
    }
}

function resetCharacter() {
    forceLog('🔄 Global resetCharacter() called');
    if (spriteBuilder && typeof spriteBuilder.resetCharacter === 'function') {
        spriteBuilder.resetCharacter();
    } else {
        const error = 'ERROR: spriteBuilder not initialized or resetCharacter not found';
        forceLog(error);
        alert(error);
    }
}

function updateSprite() {
    forceLog('🔄 Global updateSprite() called');
    if (spriteBuilder && typeof spriteBuilder.loadCharacter === 'function') {
        spriteBuilder.loadCharacter();
    } else {
        const error = 'ERROR: spriteBuilder not initialized or loadCharacter not found';
        forceLog(error);
        alert(error);
    }
}

// Force logging everywhere
function forceLog(message) {
    console.log(message);
    console.warn(message);
    console.error(message);
    if (typeof addToConsole === 'function') {
        addToConsole(message, 'warning');
    }
}