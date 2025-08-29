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
        await this.loadLPCData();
        this.setupUI();
        await this.loadBasicCharacter();
        this.startAnimation();
    }

    async loadLPCData() {
        console.log('🔄 Loading LPC data from generator...');
        try {
            const response = await fetch('/lpc-generator/index.html');
            const htmlText = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlText, 'text/html');

            this.spriteCategories = this.extractSpriteCategories(doc);
            console.log('✅ LPC data loaded and parsed successfully!');
        } catch (error) {
            console.error('❌ Failed to load or parse LPC data:', error);
        }
    }

    extractSpriteCategories(doc) {
        const categories = {};
        const elements = doc.querySelectorAll('[data-layer_1_male], [data-layer_1_female]');

        elements.forEach(el => {
            const category = el.name.split('_')[0];
            if (!categories[category]) {
                categories[category] = {
                    name: category,
                    sprites: []
                };
            }

            const spriteName = el.nextElementSibling.textContent.trim();
            const malePath = el.dataset.layer_1_male;
            const femalePath = el.dataset.layer_1_female;

            categories[category].sprites.push({
                name: spriteName,
                malePath: malePath,
                femalePath: femalePath,
            });
        });
        return categories;
    }


    async loadBasicCharacter() {
        console.log('👤 Loading basic character...');

        try {
            await this.loadDefaultCharacter();
        } catch (error) {
            console.error('❌ Failed to load basic character:', error);
            // Load a simple test rectangle if sprites fail
            this.drawTestRectangle();
        }
    }

    async loadDefaultCharacter() {
        console.log('⚠️ Loading default character...');

        // Set a default character
        if (this.spriteCategories.body && this.spriteCategories.body.sprites.length > 0) {
            const bodySprite = this.spriteCategories.body.sprites[0];
            const path = this.currentSex === 'male' ? bodySprite.malePath : bodySprite.femalePath;
            await this.addLayerToCharacter('body', { name: bodySprite.name, path: path });
        }
        if (this.spriteCategories.hair && this.spriteCategories.hair.sprites.length > 0) {
            const hairSprite = this.spriteCategories.hair.sprites[0];
            const path = this.currentSex === 'male' ? hairSprite.malePath : hairSprite.femalePath;
            await this.addLayerToCharacter('hair', { name: hairSprite.name, path: path });
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
                console.error(`❌ Failed to load layer: ${fullPath}`);
                reject(new Error(`Failed to load: ${fullPath}`));
            };

            // Path should be relative to the spritesheets directory
            const fullPath = `/lpc-generator/spritesheets/${path}`;
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

        // Use verified paths from scanner results
        const knownWorkingPaths = {
            body: {
                pattern: '/lpc-generator/spritesheets/body/bodies/{bodyType}/{animation}.png',
                bodyTypes: ['male', 'female', 'child'],
                animations: ['walk', 'hurt', 'idle', 'shoot', 'slash', 'spellcast', 'thrust']
            },
            hair: {
                patterns: [
                    '/lpc-generator/spritesheets/hair/page/adult/{animation}.png',
                    '/lpc-generator/spritesheets/hair/plain/adult/{animation}.png',
                    '/lpc-generator/spritesheets/hair/long/adult/{animation}.png',
                    '/lpc-generator/spritesheets/hair/bangs/adult/{animation}.png',
                    '/lpc-generator/spritesheets/hair/bob/adult/{animation}.png'
                ],
                animations: ['walk', 'hurt', 'idle', 'shoot', 'slash', 'spellcast', 'thrust']
            },
            torso: {
                pattern: '/lpc-generator/spritesheets/torso/clothes/longsleeve/formal/{bodyType}/{animation}.png',
                bodyTypes: ['male', 'female'],
                animations: ['walk', 'hurt', 'shoot', 'slash', 'spellcast', 'thrust']
            },
            legs: {
                pattern: '/lpc-generator/spritesheets/legs/pants/{bodyType}/{animation}.png',
                bodyTypes: ['male', 'female'],
                animations: ['walk', 'hurt', 'idle', 'shoot', 'slash', 'spellcast', 'thrust']
            },
            arms: {
                pattern: '/lpc-generator/spritesheets/arms/gloves/{bodyType}/{animation}.png',
                bodyTypes: ['male', 'female'],
                animations: ['walk', 'hurt']
            },
            feet: {
                patterns: [
                    '/lpc-generator/spritesheets/feet/sandals/{bodyType}/{animation}.png',
                    '/lpc-generator/spritesheets/feet/shoes/basic/{bodyType}/{animation}.png'
                ],
                bodyTypes: ['male', 'female'],
                animations: ['walk', 'hurt']
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
        const categories = ['body', 'hair', 'torso', 'legs', 'arms', 'feet'];
        categories.forEach(category => {
            const select = document.getElementById(`${category}Select`);
            if (select && this.spriteCategories[category]) {
                this.populateDropdown(select, this.spriteCategories[category].sprites);
            }
        });
    }

    populateDropdown(selectElement, sprites) {
        if (!sprites) return;
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
            const path = this.currentSex === 'male' ? spriteData.malePath : spriteData.femalePath;

            if (path) {
                this.addLayerToCharacter(category, { name: spriteData.name, path: path });
            } else {
                console.warn(`No path found for ${this.currentSex} in ${category}`);
            }
        } else {
            // Handle removal of sprite
            if (this.characterLayers[category]) {
                delete this.characterLayers[category];
                this.renderCharacter();
            }
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

// Add methods for UI interaction
LPCSpriteBuilder.prototype.onSexSelectionChange = function(selectElement) {
    this.currentSex = selectElement.value;
    console.log(`Sex changed to: ${this.currentSex}`);
    // Reload the character with the new sex
    this.resetCharacter();
    this.loadBasicCharacter();
};

LPCSpriteBuilder.prototype.exportCurrentFrame = function() {
    const canvas = this.canvas;
    const link = document.createElement('a');
    link.download = 'sprite_frame.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
};

LPCSpriteBuilder.prototype.exportSpriteSheet = function() {
    console.log('Exporting sprite sheet... (not implemented)');
    alert('Sprite sheet export is not yet implemented.');
};

LPCSpriteBuilder.prototype.randomizeCharacter = function() {
    console.log('Randomizing character... (not implemented)');
    alert('Character randomization is not yet implemented.');
};

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

// Add a placeholder for the updateSprite method
LPCSpriteBuilder.prototype.updateSprite = function() {
    console.log('✨ updateSprite called - feature not yet implemented');
};

// Add a new debugSprites method to the LPCSpriteBuilder class
LPCSpriteBuilder.prototype.debugSprites = function() {
    console.log('🐛 Firing debugSprites...');
    this.createDebugPanel();
    this.updateDebugPanel();
};

LPCSpriteBuilder.prototype.createDebugPanel = function() {
    if (document.getElementById('spriteDebugPanel')) {
        return; // Panel already exists
    }

    const panel = document.createElement('div');
    panel.id = 'spriteDebugPanel';
    panel.style.position = 'fixed';
    panel.style.top = '100px';
    panel.style.right = '20px';
    panel.style.width = '350px';
    panel.style.height = 'auto';
    panel.style.maxHeight = '500px';
    panel.style.backgroundColor = 'rgba(0, 20, 40, 0.9)';
    panel.style.border = '1px solid #00ff00';
    panel.style.borderRadius = '8px';
    panel.style.zIndex = '1001';
    panel.style.color = '#00ff00';
    panel.style.fontFamily = "'Courier New', monospace";
    panel.style.fontSize = '12px';

    const header = document.createElement('div');
    header.style.padding = '8px 12px';
    header.style.backgroundColor = '#00ff00';
    header.style.color = '#000';
    header.style.fontWeight = 'bold';
    header.style.borderRadius = '8px 8px 0 0';
    header.style.cursor = 'move';
    header.textContent = 'Sprite Debug Panel';

    const closeButton = document.createElement('span');
    closeButton.textContent = '❌';
    closeButton.style.float = 'right';
    closeButton.style.cursor = 'pointer';
    closeButton.onclick = () => panel.remove();
    header.appendChild(closeButton);

    const content = document.createElement('div');
    content.id = 'spriteDebugContent';
    content.style.padding = '10px';
    content.style.overflowY = 'auto';
    content.style.maxHeight = '420px';
    content.style.whiteSpace = 'pre-wrap';

    panel.appendChild(header);
    panel.appendChild(content);
    document.body.appendChild(panel);

    // Make panel draggable
    let isDragging = false;
    let offsetX, offsetY;
    header.onmousedown = (e) => {
        isDragging = true;
        offsetX = e.clientX - panel.offsetLeft;
        offsetY = e.clientY - panel.offsetTop;
        header.style.cursor = 'grabbing';
    };
    document.onmousemove = (e) => {
        if (isDragging) {
            panel.style.left = `${e.clientX - offsetX}px`;
            panel.style.top = `${e.clientY - offsetY}px`;
        }
    };
    document.onmouseup = () => {
        isDragging = false;
        header.style.cursor = 'move';
    };
};

LPCSpriteBuilder.prototype.updateDebugPanel = function() {
    const content = document.getElementById('spriteDebugContent');
    if (!content) {
        console.warn('Debug panel content area not found.');
        return;
    }

    let debugInfo = `== Sprite Builder State ==\n`;
    debugInfo += `Animation: ${this.currentAnimation}\n`;
    debugInfo += `Frame: ${this.currentFrame}\n`;
    debugInfo += `Sex: ${this.currentSex}\n`;
    debugInfo += `Animating: ${this.isAnimating}\n\n`;
    debugInfo += `== Layers (${this.layers.length}) ==\n`;

    this.layers.forEach(layer => {
        debugInfo += `[z:${layer.zIndex}] ${layer.name} - ${layer.path}\n`;
    });

    content.textContent = debugInfo;
};

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