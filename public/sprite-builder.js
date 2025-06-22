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

        // Initialize debug panel
        this.updateDebugPanel();

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
                this.updateDebugPanel();
                resolve(img);
            };

            img.onerror = () => {
                console.warn(`Failed to load layer: ${path}`);
                this.updateDebugPanel();
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

        this.updateDebugPanel();
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
        // Debug panel is now default, update debug info instead
        this.updateDebugPanel();
    }

    updateDebugPanel() {
        const debugOutput = document.getElementById('debugOutput');
        if (!debugOutput) return;

        const debugInfo = {
            timestamp: new Date().toLocaleTimeString(),
            canvasFound: !!this.canvas,
            contextFound: !!this.ctx,
            currentConfig: this.currentConfig,
            layersLoaded: this.layers.length,
            layers: this.layers.map(layer => ({
                name: layer.name,
                visible: layer.visible,
                zIndex: layer.zIndex,
                path: layer.path
            })),
            animationState: {
                isAnimating: this.isAnimating,
                currentAnimation: this.currentAnimation,
                animationFrame: this.animationFrame,
                animationSpeed: this.animationSpeed
            },
            lpcDataLoaded: !!this.lpcData,
            imageCache: Object.keys(this.imageCache).length,
            visibleLayers: this.visibleLayers
        };

        debugOutput.value = JSON.stringify(debugInfo, null, 2);
        debugOutput.scrollTop = debugOutput.scrollHeight;
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

    testFunction() {
        // Force multiple logging methods
        const message = '🧪 TEST FUNCTION CALLED - Sprite Builder is working!';
        console.log(message);
        console.warn(message);
        console.error(message);
        alert('TEST FUNCTION CALLED! Sprite Builder object is accessible.');

        // Log object details
        console.log('Current spriteBuilder config:', this.currentConfig);
        console.log('Canvas element:', this.canvas);
        console.log('Context:', this.ctx);

        // Also try to log to page console if it exists
        if (typeof addToConsole === 'function') {
            addToConsole('TEST FUNCTION CALLED - spriteBuilder working', 'success');
        }

        return 'Test function executed successfully!';
    }

    showError(message) {
        const previewDiv = document.querySelector('.preview-container');
        if (previewDiv) {
            previewDiv.innerHTML = `<div style="color: red; padding: 20px;">${message}</div>`;
        }
        console.error('Sprite Builder Error:', message);
        alert('ERROR: ' + message); // Force visibility

        // Also show in debug panel if open
        const debugPanel = document.getElementById('spriteDebugPanel');
        if (debugPanel && debugPanel.style.display !== 'none') {
            const failedPaths = document.getElementById('debugFailedPaths');
            if (failedPaths) {
                failedPaths.innerHTML += `<div style="color: red;">${message}</div>`;
            }
        }
    }

    updateDebugInfo() {
        const lpcDataStatus = document.getElementById('lpcDataStatus');
        const debugLayerList = document.getElementById('debugLayerList');

        if (lpcDataStatus) {
            if (this.lpcData) {
                lpcDataStatus.innerHTML = `✅ LPC data loaded with ${Object.keys(this.lpcData).length} categories`;
            } else {
                lpcDataStatus.innerHTML = '❌ LPC data not loaded';
            }
        }

        if (debugLayerList) {
            if (this.layers && this.layers.length > 0) {
                debugLayerList.innerHTML = this.layers.map(layer => 
                    `<div>• ${layer.name} (z:${layer.zIndex}) - ${layer.visible ? '👁️' : '🚫'}</div>`
                ).join('');
            } else {
                debugLayerList.innerHTML = 'No layers currently loaded';
            }
        }
    }

    testImagePaths() {
        console.log('🧪 Testing sprite paths...');
        const testPaths = [
            '/lpc-generator/spritesheets/body/bodies/male/walk.png',
            '/lpc-generator/spritesheets/body/bodies/female/walk.png',
            '/lpc-generator/spritesheets/hair/page/adult/walk.png',
            '/lpc-generator/spritesheets/hair/ponytail/adult/walk.png'
        ];

        testPaths.forEach(async path => {
            const exists = await this.testImageExists(path);
            console.log(`${exists ? '✅' : '❌'} ${path}`);
        });
    }

    parseLPCDataDirect() {
        console.log('📋 Attempting to parse LPC data directly...');
        this.loadLPCData().then(() => {
            console.log('✅ LPC data parsing completed');
            this.updateDebugInfo();
        }).catch(error => {
            console.error('❌ LPC data parsing failed:', error);
            this.updateDebugInfo();
        });
    }

    logCurrentState() {
        console.log('📊 Current Sprite Builder State:');
        console.log('- LPC Data:', this.lpcData);
        console.log('- Layers:', this.layers);
        console.log('- Current Config:', this.currentConfig);
        console.log('- Animation:', this.currentAnimation);
        console.log('- Canvas Context:', this.ctx);
        console.log('- Is Animating:', this.isAnimating);
    }

    debugSprites() {
        // Force multiple logging methods
        const message = '🐛 DEBUG SPRITES CALLED - Starting sprite debug session';
        console.log(message);
        console.warn(message);
        console.error(message);
        alert('DEBUG SPRITES FUNCTION CALLED!');

        // Also try to log to page console if it exists
        if (typeof addToConsole === 'function') {
            addToConsole('DEBUG SPRITES CALLED', 'warning');
        }

        // Create debug panel if it doesn't exist
        if (!document.getElementById('spriteDebugPanel')) {
            console.log('Creating debug panel...');
            this.createDebugPanel();
        }

        // Show debug panel
        const debugPanel = document.getElementById('spriteDebugPanel');
        if (debugPanel) {
            debugPanel.style.display = 'block';
            console.log('✅ Debug panel displayed');
            alert('Debug panel should now be visible!');
        } else {
            console.error('❌ Failed to create or find debug panel');
            alert('ERROR: Failed to create debug panel!');
        }

        this.runDiagnostics();
    }

    closeDebugPanel() {
        const debugPanel = document.getElementById('spriteDebugPanel');
        if (debugPanel) {
            debugPanel.remove();
        }
        console.log('🔧 Debug panel closed');
    }

    restoreLayerManagement() {
        // Find the sprite controls section
        const spriteControlsSection = document.querySelector('.sprite-controls h3');
        if (!spriteControlsSection) {
            console.error('Could not find sprite controls section');
            return;
        }

        const layerManagementContainer = spriteControlsSection.parentElement;

        // Restore original layer management content
        layerManagementContainer.innerHTML = `
            <h3>Layer Management</h3>
            <div id="layerList" class="layer-list">
                <div style="color: #666; padding: 10px;">No layers loaded</div>
            </div>
            <div class="layer-controls">
                <button onclick="spriteBuilder.generateFullSpriteSheet()">Generate Full Sheet</button>
                <button onclick="spriteBuilder.debugSprites()">Debug Sprites</button>
            </div>
        `;

        // Update the layer list with current layers
        this.updateLayerList();

        console.log('🔧 Restored layer management');
    }
}

// Global instance for easy access from HTML buttons
let spriteBuilder = null;

// Force logging everywhere
function forceLog(message) {
    console.log(message);
    console.warn(message);
    console.error(message);
    if (typeof addToConsole === 'function') {
        addToConsole(message, 'warning');
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    forceLog('🚀 DOM LOADED - Checking for sprite canvas...');

    // Only initialize if we're on the development page
    const canvas = document.getElementById('spriteCanvas');
    if (canvas) {
        forceLog('✅ Found sprite canvas, initializing sprite builder...');
        try {
            spriteBuilder = new LPCSpriteBuilder();
            forceLog('✅ Sprite Builder initialized successfully!');
            forceLog('spriteBuilder object: ' + typeof spriteBuilder);

            // Test that functions exist
            forceLog('debugSprites function exists: ' + (typeof spriteBuilder.debugSprites === 'function'));
            forceLog('testFunction exists: ' + (typeof spriteBuilder.testFunction === 'function'));

        } catch (error) {
            forceLog('❌ ERROR initializing sprite builder: ' + error.message);
            console.error('Full error:', error);
        }
    } else {
        forceLog('❌ No sprite canvas found - not on development page?');
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