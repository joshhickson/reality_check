

// Advanced LPC Sprite Builder adapted from the LPC Character Generator
class LPCSpriteBuilder {
    constructor() {
        this.canvas = document.getElementById('spriteCanvas');
        this.fullCanvas = document.getElementById('fullSpriteSheet');
        this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
        this.fullCtx = this.fullCanvas ? this.fullCanvas.getContext('2d') : null;
        
        // Character configuration
        this.currentConfig = {
            sex: 'male',
            bodyColor: 'light',
            hairStyle: 'page',
            hairColor: 'brunette',
            clothingTop: 'shirt_white',
            clothingBottom: 'pants'
        };
        
        // Animation settings
        this.currentAnimation = 'walk';
        this.animationFrame = 0;
        this.animationSpeed = 200;
        this.isAnimating = false;
        this.animationInterval = null;
        
        // Image cache
        this.imageCache = {};
        this.loadedImages = 0;
        this.totalImages = 0;
        
        // Layer system
        this.layers = [];
        this.visibleLayers = {};
        
        // Animation definitions (from LPC generator)
        this.animations = {
            spellcast: { row: 0, frames: 7, frameWidth: 64, frameHeight: 64 },
            thrust: { row: 4, frames: 8, frameWidth: 64, frameHeight: 64 },
            walk: { row: 8, frames: 9, frameWidth: 64, frameHeight: 64 },
            slash: { row: 12, frames: 6, frameWidth: 64, frameHeight: 64 },
            shoot: { row: 16, frames: 13, frameWidth: 64, frameHeight: 64 },
            hurt: { row: 20, frames: 6, frameWidth: 64, frameHeight: 64 }
        };
        
        this.init();
    }
    
    init() {
        if (!this.ctx) return;
        
        // Set up canvas properties
        this.ctx.imageSmoothingEnabled = false;
        this.ctx.webkitImageSmoothingEnabled = false;
        this.ctx.mozImageSmoothingEnabled = false;
        
        if (this.fullCtx) {
            this.fullCtx.imageSmoothingEnabled = false;
            this.fullCtx.webkitImageSmoothingEnabled = false;
            this.fullCtx.mozImageSmoothingEnabled = false;
        }
        
        // Bind event listeners
        this.bindEventListeners();
        
        // Load initial character
        this.loadCharacter();
    }
    
    bindEventListeners() {
        // Body type radio buttons
        const sexRadios = document.querySelectorAll('input[name="sex"]');
        sexRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.currentConfig.sex = e.target.value;
                this.loadCharacter();
            });
        });
        
        // Other controls are handled by onchange attributes in HTML
    }
    
    async loadCharacter() {
        const basePath = '/lpc-generator/spritesheets';
        this.layers = [];
        
        try {
            // Load body
            await this.loadLayer('body', `${basePath}/body/bodies/${this.currentConfig.sex}/walk.png`, 0);
            
            // Load hair if not "none"
            if (this.currentConfig.hairStyle !== 'none') {
                await this.loadLayer('hair', `${basePath}/hair/${this.currentConfig.hairStyle}/adult/walk.png`, 10);
            }
            
            // Load clothing
            if (this.currentConfig.clothingTop !== 'none') {
                await this.loadLayer('clothing_top', `${basePath}/torso/clothes/longsleeve/longsleeve/walk.png`, 5);
            }
            
            if (this.currentConfig.clothingBottom !== 'none') {
                await this.loadLayer('clothing_bottom', `${basePath}/legs/pants/${this.currentConfig.sex}/walk.png`, 3);
            }
            
            // Update layer list display
            this.updateLayerList();
            
            // Start animation
            this.startAnimation();
            
        } catch (error) {
            console.error('Error loading character:', error);
            this.showError('Failed to load character sprites');
        }
    }
    
    async loadLayer(name, path, zIndex) {
        return new Promise((resolve, reject) => {
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
                this.visibleLayers[name] = true;
                
                resolve(img);
            };
            
            img.onerror = () => {
                console.warn(`Failed to load layer: ${path}`);
                // Don't reject, just continue without this layer
                resolve(null);
            };
            
            img.src = path;
        });
    }
    
    startAnimation() {
        if (this.animationInterval) {
            clearInterval(this.animationInterval);
        }
        
        this.isAnimating = true;
        this.animationFrame = 0;
        
        this.animationInterval = setInterval(() => {
            this.drawCurrentFrame();
            this.animationFrame = (this.animationFrame + 1) % this.animations[this.currentAnimation].frames;
        }, this.animationSpeed);
    }
    
    stopAnimation() {
        if (this.animationInterval) {
            clearInterval(this.animationInterval);
            this.animationInterval = null;
        }
        this.isAnimating = false;
    }
    
    drawCurrentFrame() {
        if (!this.ctx) return;
        
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        const anim = this.animations[this.currentAnimation];
        const sourceX = this.animationFrame * anim.frameWidth;
        const sourceY = anim.row * anim.frameHeight;
        
        // Draw each visible layer
        this.layers.forEach(layer => {
            if (layer.visible && layer.image && this.visibleLayers[layer.name]) {
                // Draw all 4 directions, but focus on south (front-facing)
                this.ctx.drawImage(
                    layer.image,
                    sourceX, sourceY + (2 * anim.frameHeight), // South direction
                    anim.frameWidth, anim.frameHeight,
                    0, 0,
                    anim.frameWidth, anim.frameHeight
                );
            }
        });
    }
    
    generateFullSpriteSheet() {
        if (!this.fullCtx) return;
        
        // Clear full canvas
        this.fullCtx.clearRect(0, 0, this.fullCanvas.width, this.fullCanvas.height);
        
        // Composite all visible layers onto the full spritesheet
        this.layers.forEach(layer => {
            if (layer.visible && layer.image && this.visibleLayers[layer.name]) {
                this.fullCtx.drawImage(layer.image, 0, 0);
            }
        });
    }
    
    updateLayerList() {
        const layerList = document.getElementById('layerList');
        if (!layerList) return;
        
        layerList.innerHTML = '';
        
        this.layers.forEach((layer, index) => {
            const layerDiv = document.createElement('div');
            layerDiv.className = 'sprite-layer';
            layerDiv.innerHTML = `
                <span>${layer.name}</span>
                <div>
                    <input type="checkbox" ${layer.visible ? 'checked' : ''} 
                           onchange="spriteBuilder.toggleLayerVisibility('${layer.name}', this.checked)">
                    <button onclick="spriteBuilder.moveLayer(${index}, 'up')">↑</button>
                    <button onclick="spriteBuilder.moveLayer(${index}, 'down')">↓</button>
                </div>
            `;
            layerList.appendChild(layerDiv);
        });
    }
    
    toggleLayerVisibility(layerName, visible) {
        this.visibleLayers[layerName] = visible;
        const layer = this.layers.find(l => l.name === layerName);
        if (layer) {
            layer.visible = visible;
        }
        this.drawCurrentFrame();
    }
    
    moveLayer(index, direction) {
        if (direction === 'up' && index > 0) {
            [this.layers[index], this.layers[index - 1]] = [this.layers[index - 1], this.layers[index]];
        } else if (direction === 'down' && index < this.layers.length - 1) {
            [this.layers[index], this.layers[index + 1]] = [this.layers[index + 1], this.layers[index]];
        }
        this.updateLayerList();
        this.drawCurrentFrame();
    }
    
    showError(message) {
        const previewDiv = document.querySelector('.preview-container');
        if (previewDiv) {
            const errorDiv = document.createElement('div');
            errorDiv.style.color = '#ff6b6b';
            errorDiv.style.padding = '20px';
            errorDiv.style.textAlign = 'center';
            errorDiv.textContent = message;
            previewDiv.appendChild(errorDiv);
        }
    }
}

// Global sprite builder instance
let spriteBuilder;

// Global functions for UI interaction
function updateSprite() {
    if (!spriteBuilder) return;
    
    // Update config from form controls
    spriteBuilder.currentConfig.bodyColor = document.getElementById('bodyColor')?.value || 'light';
    spriteBuilder.currentConfig.hairStyle = document.getElementById('hairStyle')?.value || 'page';
    spriteBuilder.currentConfig.hairColor = document.getElementById('hairColor')?.value || 'brunette';
    spriteBuilder.currentConfig.clothingTop = document.getElementById('clothingTop')?.value || 'shirt_white';
    spriteBuilder.currentConfig.clothingBottom = document.getElementById('clothingBottom')?.value || 'pants';
    
    spriteBuilder.loadCharacter();
}

function changeAnimation() {
    if (!spriteBuilder) return;
    
    const animSelect = document.getElementById('animationSelect');
    if (animSelect) {
        spriteBuilder.currentAnimation = animSelect.value;
        spriteBuilder.startAnimation();
    }
}

function randomizeCharacter() {
    if (!spriteBuilder) return;
    
    // Random selections
    const sexOptions = ['male', 'female', 'teen', 'child'];
    const bodyColors = ['light', 'tanned', 'tanned2', 'dark', 'dark2', 'darkelf', 'darkelf2'];
    const hairStyles = ['page', 'page2', 'parted', 'bangs', 'long', 'ponytail', 'pixie', 'messy1'];
    const hairColors = ['brunette', 'blonde', 'redhead', 'black', 'gray', 'white'];
    const topClothing = ['shirt_white', 'longsleeve', 'shortsleeve', 'sleeveless', 'robe'];
    const bottomClothing = ['pants', 'shorts', 'skirt'];
    
    // Update form controls
    const randomSex = sexOptions[Math.floor(Math.random() * sexOptions.length)];
    document.querySelector(`input[name="sex"][value="${randomSex}"]`).checked = true;
    
    document.getElementById('bodyColor').value = bodyColors[Math.floor(Math.random() * bodyColors.length)];
    document.getElementById('hairStyle').value = hairStyles[Math.floor(Math.random() * hairStyles.length)];
    document.getElementById('hairColor').value = hairColors[Math.floor(Math.random() * hairColors.length)];
    document.getElementById('clothingTop').value = topClothing[Math.floor(Math.random() * topClothing.length)];
    document.getElementById('clothingBottom').value = bottomClothing[Math.floor(Math.random() * bottomClothing.length)];
    
    spriteBuilder.currentConfig.sex = randomSex;
    updateSprite();
}

function resetCharacter() {
    if (!spriteBuilder) return;
    
    // Reset to defaults
    document.querySelector('input[name="sex"][value="male"]').checked = true;
    document.getElementById('bodyColor').value = 'light';
    document.getElementById('hairStyle').value = 'page';
    document.getElementById('hairColor').value = 'brunette';
    document.getElementById('clothingTop').value = 'shirt_white';
    document.getElementById('clothingBottom').value = 'pants';
    
    spriteBuilder.currentConfig = {
        sex: 'male',
        bodyColor: 'light',
        hairStyle: 'page',
        hairColor: 'brunette',
        clothingTop: 'shirt_white',
        clothingBottom: 'pants'
    };
    
    updateSprite();
}

function exportCurrentFrame() {
    if (!spriteBuilder || !spriteBuilder.canvas) return;
    
    const link = document.createElement('a');
    link.download = `character_frame_${Date.now()}.png`;
    link.href = spriteBuilder.canvas.toDataURL();
    link.click();
}

function exportSpriteSheet() {
    if (!spriteBuilder) return;
    
    spriteBuilder.generateFullSpriteSheet();
    const link = document.createElement('a');
    link.download = `character_spritesheet_${Date.now()}.png`;
    link.href = spriteBuilder.fullCanvas.toDataURL();
    link.click();
}

function saveCharacterProfile() {
    if (!spriteBuilder) return;
    
    const profile = {
        config: spriteBuilder.currentConfig,
        layers: spriteBuilder.layers.map(layer => ({
            name: layer.name,
            zIndex: layer.zIndex,
            visible: layer.visible,
            path: layer.path
        })),
        timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(profile, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.download = `character_profile_${Date.now()}.json`;
    link.href = URL.createObjectURL(blob);
    link.click();
}

function toggleAllLayers() {
    if (!spriteBuilder) return;
    
    const allVisible = spriteBuilder.layers.every(layer => layer.visible);
    spriteBuilder.layers.forEach(layer => {
        layer.visible = !allVisible;
        spriteBuilder.visibleLayers[layer.name] = !allVisible;
    });
    
    spriteBuilder.updateLayerList();
    spriteBuilder.drawCurrentFrame();
}

function reorderLayers() {
    if (!spriteBuilder) return;
    
    // Simple random reorder for demo
    spriteBuilder.layers.sort(() => Math.random() - 0.5);
    spriteBuilder.updateLayerList();
    spriteBuilder.drawCurrentFrame();
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Wait a bit for the DOM to be fully ready
    setTimeout(() => {
        spriteBuilder = new LPCSpriteBuilder();
    }, 100);
});

