
// Advanced LPC Sprite Builder that integrates with the LPC Character Generator
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
        
        // LPC data cache
        this.lpcData = null;
        
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
        
        // Try to load LPC data
        this.loadLPCData().then(() => {
            this.bindEventListeners();
            this.loadCharacter();
        }).catch(() => {
            // Fallback to simple hardcoded sprite loading
            this.bindEventListeners();
            this.loadCharacterFallback();
        });
    }
    
    async loadLPCData() {
        try {
            // Try to fetch the LPC generator index.html to parse available options
            const response = await fetch('/lpc-generator/index.html');
            if (response.ok) {
                const html = await response.text();
                this.parseLPCData(html);
            } else {
                throw new Error('Could not load LPC data');
            }
        } catch (error) {
            console.warn('Failed to load LPC data, using fallback');
            throw error;
        }
    }
    
    parseLPCData(html) {
        // Parse the LPC generator HTML to extract available sprite options
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        this.lpcData = {
            sex: {},
            hair: {},
            torso: {},
            legs: {}
        };
        
        // Extract available options from radio buttons and their data attributes
        const radioButtons = doc.querySelectorAll('input[type="radio"]');
        radioButtons.forEach(radio => {
            const name = radio.name;
            const value = radio.value || radio.id;
            
            if (!name) return;
            
            const dataAttrs = {};
            
            // Extract all data attributes
            for (let attr of radio.attributes) {
                if (attr.name.startsWith('data-')) {
                    dataAttrs[attr.name] = attr.value;
                }
            }
            
            // Store the data
            if (!this.lpcData[name]) {
                this.lpcData[name] = {};
            }
            this.lpcData[name][value] = dataAttrs;
        });
        
        console.log('Parsed LPC data:', this.lpcData);
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
    }
    
    async loadCharacter() {
        if (this.lpcData) {
            await this.loadCharacterFromLPCData();
        } else {
            await this.loadCharacterFallback();
        }
    }
    
    async loadCharacterFromLPCData() {
        this.layers = [];
        
        try {
            const sex = this.currentConfig.sex;
            console.log('Loading character for sex:', sex);
            console.log('Available LPC data keys:', Object.keys(this.lpcData));
            
            // Try to find body data using the sex selection
            let bodyPath = null;
            if (this.lpcData.sex && this.lpcData.sex[sex]) {
                bodyPath = this.extractImagePath(this.lpcData.sex[sex], sex, 'walk');
            }
            
            // If no body path found, try some hardcoded paths
            if (!bodyPath) {
                const bodyPaths = [
                    `/lpc-generator/spritesheets/body/bodies/${sex}/walk.png`,
                    `/lpc-generator/spritesheets/body/bodies/male/walk.png`
                ];
                
                for (const path of bodyPaths) {
                    if (await this.testImageExists(path)) {
                        bodyPath = path;
                        break;
                    }
                }
            }
            
            if (bodyPath) {
                await this.loadLayer('body', bodyPath, 0);
            }
            
            // Try to load hair
            if (this.currentConfig.hairStyle !== 'none') {
                let hairPath = null;
                
                // Look for hair data in LPC data
                if (this.lpcData.hair && this.lpcData.hair[this.currentConfig.hairStyle]) {
                    hairPath = this.extractImagePath(this.lpcData.hair[this.currentConfig.hairStyle], sex, 'walk');
                }
                
                // Fallback hair paths
                if (!hairPath) {
                    const hairPaths = [
                        `/lpc-generator/spritesheets/hair/${this.currentConfig.hairStyle}/adult/walk.png`,
                        `/lpc-generator/spritesheets/hair/page/adult/walk.png`
                    ];
                    
                    for (const path of hairPaths) {
                        if (await this.testImageExists(path)) {
                            hairPath = path;
                            break;
                        }
                    }
                }
                
                if (hairPath) {
                    await this.loadLayer('hair', hairPath, 10);
                }
            }
            
            this.updateLayerList();
            this.startAnimation();
            
        } catch (error) {
            console.error('Error loading character from LPC data:', error);
            await this.loadCharacterFallback();
        }
    }
    
    extractImagePath(dataAttrs, sex, animation) {
        // Try different possible data attribute keys
        const possibleKeys = [
            `data-layer_1_${sex}`,
            `data-${sex}`,
            'data-layer_1',
            'data-src'
        ];
        
        for (const key of possibleKeys) {
            if (dataAttrs[key]) {
                let path = dataAttrs[key];
                // Clean up the path
                path = path.replace(/['"]/g, '').trim();
                
                if (path) {
                    // Ensure path starts with LPC generator prefix
                    if (!path.startsWith('/lpc-generator/')) {
                        if (path.startsWith('/')) {
                            path = '/lpc-generator' + path;
                        } else {
                            path = '/lpc-generator/spritesheets/' + path;
                        }
                    }
                    
                    // If path doesn't end with .png, append animation and .png
                    if (!path.endsWith('.png')) {
                        path = path + '/' + animation + '.png';
                    }
                    
                    console.log(`Extracted path for ${sex} ${animation}:`, path);
                    return path;
                }
            }
        }
        
        console.warn('No valid path found in data attributes:', dataAttrs);
        return null;
    }
    
    async loadCharacterFallback() {
        // Fallback to known good paths in the LPC generator
        this.layers = [];
        
        try {
            const sex = this.currentConfig.sex;
            
            // Try known body paths
            const bodyPaths = [
                `/lpc-generator/spritesheets/body/bodies/${sex}/walk.png`,
                `/lpc-generator/spritesheets/body/bodies/male/walk.png`  // fallback
            ];
            
            for (const path of bodyPaths) {
                if (await this.testImageExists(path)) {
                    await this.loadLayer('body', path, 0);
                    break;
                }
            }
            
            // Try known hair paths
            if (this.currentConfig.hairStyle !== 'none') {
                const hairPaths = [
                    `/lpc-generator/spritesheets/hair/${this.currentConfig.hairStyle}/adult/walk.png`,
                    `/lpc-generator/spritesheets/hair/page/adult/walk.png`  // fallback
                ];
                
                for (const path of hairPaths) {
                    if (await this.testImageExists(path)) {
                        await this.loadLayer('hair', path, 10);
                        break;
                    }
                }
            }
            
            this.updateLayerList();
            this.startAnimation();
            
        } catch (error) {
            console.error('Error loading character fallback:', error);
            this.showError('Failed to load character sprites. Check that LPC generator files are available.');
        }
    }
    
    async testImageExists(url) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
            img.src = url;
        });
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
                
                console.log(`Successfully loaded layer: ${name} from ${path}`);
                resolve(img);
            };
            
            img.onerror = () => {
                console.warn(`Failed to load layer: ${path}`);
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
                // Draw south-facing direction (front view)
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
        
        if (this.layers.length === 0) {
            layerList.innerHTML = '<div style="color: #666; padding: 10px;">No layers loaded</div>';
            return;
        }
        
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
        console.error(message);
    }
    
    // Debug method to list available sprites
    async debugListAvailableSprites() {
        const testPaths = [
            '/lpc-generator/spritesheets/body/bodies/male/walk.png',
            '/lpc-generator/spritesheets/body/bodies/female/walk.png',
            '/lpc-generator/spritesheets/hair/page/adult/walk.png',
            '/lpc-generator/spritesheets/hair/parted/adult/walk.png',
            '/lpc-generator/spritesheets/torso/clothes/longsleeve/formal/walk.png',
            '/lpc-generator/spritesheets/legs/pants/male/walk.png',
            '/lpc-generator/index.html'
        ];
        
        console.log('Testing sprite paths...');
        for (const path of testPaths) {
            const exists = await this.testImageExists(path);
            console.log(`${path}: ${exists ? 'EXISTS' : 'NOT FOUND'}`);
        }
        
        // Also test if we can load the LPC generator page
        try {
            const response = await fetch('/lpc-generator/');
            console.log('LPC generator directory response:', response.status);
        } catch (error) {
            console.error('Failed to access LPC generator directory:', error);
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
    const sexOptions = ['male', 'female'];
    const hairStyles = ['page', 'parted', 'bangs', 'long', 'pixie', 'messy1'];
    
    // Update form controls
    const randomSex = sexOptions[Math.floor(Math.random() * sexOptions.length)];
    const randomHair = hairStyles[Math.floor(Math.random() * hairStyles.length)];
    
    const sexRadio = document.querySelector(`input[name="sex"][value="${randomSex}"]`);
    if (sexRadio) sexRadio.checked = true;
    
    const hairSelect = document.getElementById('hairStyle');
    if (hairSelect) hairSelect.value = randomHair;
    
    spriteBuilder.currentConfig.sex = randomSex;
    spriteBuilder.currentConfig.hairStyle = randomHair;
    
    updateSprite();
}

function resetCharacter() {
    if (!spriteBuilder) return;
    
    // Reset to defaults
    const maleRadio = document.querySelector('input[name="sex"][value="male"]');
    if (maleRadio) maleRadio.checked = true;
    
    const hairSelect = document.getElementById('hairStyle');
    if (hairSelect) hairSelect.value = 'page';
    
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

function debugSprites() {
    if (spriteBuilder) {
        spriteBuilder.debugListAvailableSprites();
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Wait a bit for the DOM to be fully ready
    setTimeout(() => {
        spriteBuilder = new LPCSpriteBuilder();
        
        // Add debug button
        console.log('Sprite builder initialized. Call debugSprites() to test available sprite paths.');
    }, 100);
});
