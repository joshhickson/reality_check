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

        // This will hold the structured data from lpc-all-sprites.json
        this.spriteDatabase = {};

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
        console.log('🔄 Loading LPC sprite database...');
        try {
            const response = await fetch('/lpc-all-sprites.json');
            if (!response.ok) {
                // If the file doesn't exist, prompt the user to generate it.
                if (response.status === 404) {
                    alert('Sprite database not found! Please click "Generate Sprite Database" to create it.');
                    throw new Error('Sprite database not found. Please generate it.');
                }
                throw new Error(`Failed to load sprite database: ${response.statusText}`);
            }
            this.spriteDatabase = await response.json();
            console.log('✅ LPC sprite database loaded successfully!');
        } catch (error) {
            console.error('❌ Failed to load or parse LPC sprite database:', error);
            // Disable UI if data loading fails
            this.disableUI();
        }
    }

    disableUI() {
        document.querySelectorAll('.sidebar select, .sidebar button').forEach(el => {
            if (el.id !== 'generate-db-button') {
                el.disabled = true;
            }
        });
        const status = document.getElementById('db-status');
        if(status) status.textContent = 'Sprite database is missing. Please generate it to enable controls.';
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
        console.log('👤 Loading default character...');
        try {
            // Load a default body and hair
            if (this.spriteDatabase.body && this.spriteDatabase.body.length > 0) {
                const bodySprite = this.spriteDatabase.body.find(s => s.style === 'bodies');
                if (bodySprite) {
                    await this.addLayerToCharacter('body', bodySprite);
                }
            }
            if (this.spriteDatabase.hair && this.spriteDatabase.hair.length > 0) {
                const hairSprite = this.spriteDatabase.hair.find(s => s.style === 'plain/adult');
                 if (hairSprite) {
                    await this.addLayerToCharacter('hair', hairSprite);
                }
            }
        } catch (error) {
            console.error('❌ Failed to load default character:', error);
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

    async loadSprite(spritePath, spriteInfo = {}) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                resolve({ image: img, path: spritePath, ...spriteInfo });
            };
            img.onerror = () => {
                console.error(`❌ Failed to load image: ${spritePath}`);
                reject(new Error(`Failed to load image: ${spritePath}`));
            };
            img.src = spritePath;
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
            layerItem.className = 'layer-item';
            layerItem.innerHTML = `
                <label>
                    <input type="checkbox" ${layer.visible ? 'checked' : ''} 
                           onchange="window.spriteBuilder.toggleLayerVisibility(${index})">
                    ${layer.name}
                </label>
                <button onclick="window.spriteBuilder.removeLayer('${layer.name}')">X</button>
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

    removeLayer(category) {
        if (this.characterLayers[category]) {
            delete this.characterLayers[category];
            this.renderCharacter();
        }
    }

    resetCharacter() {
        this.stopAnimation();
        this.characterLayers = {};
        this.renderCharacter();
        console.log('🔄 Character reset');
        this.startAnimation();
    }

    async addLayerToCharacter(category, spriteData) {
        // spriteData is now an entry from our JSON database, e.g., { name: "...", style: "...", paths: {...} }
        const path = spriteData.paths[this.currentSex]?.[this.currentAnimation] || (spriteData.paths[this.currentSex] ? spriteData.paths[this.currentSex][Object.keys(spriteData.paths[this.currentSex])[0]] : undefined);


        if (!path) {
            console.warn(`⚠️ No path found for ${category} -> ${spriteData.name} with sex ${this.currentSex} and animation ${this.currentAnimation}`);
            // Remove the layer if a valid path isn't found
            if (this.characterLayers[category]) {
                delete this.characterLayers[category];
                this.renderCharacter();
            }
            return;
        }

        console.log(`➕ Adding layer: ${category} -> ${spriteData.name}`);

        try {
            const sprite = await this.loadSprite(path, spriteData);
            this.characterLayers[category] = {
                image: sprite.image,
                data: spriteData // Store the full sprite data object
            };
            this.renderCharacter();
            console.log(`✅ Added ${category} layer successfully`);
        } catch (error) {
            console.error(`❌ Failed to load layer: ${path}`, error);
        }
    }

    renderCharacter() {
        console.log('🖌️ Rendering character...');
        this.layers = []; // Clear existing layers
        let zIndexCounter = 1;

        const layerOrder = ['body', 'legs', 'torso', 'arms', 'head', 'hair', 'feet'];

        for (const category of layerOrder) {
            const layerData = this.characterLayers[category];
            if (layerData && layerData.image) {
                const layer = {
                    name: category,
                    image: layerData.image,
                    zIndex: zIndexCounter * 10,
                    visible: true,
                    path: layerData.data.paths[this.currentSex]?.[this.currentAnimation]
                };
                this.layers.push(layer);
                zIndexCounter++;
            }
        }

        this.updateLayerList();
        this.drawCurrentFrame();
    }


    setupUI() {
        console.log("Setting up UI with new database structure");
        Object.keys(this.spriteDatabase).forEach(category => {
            const select = document.getElementById(`${category}Select`);
            if (select) {
                this.populateDropdown(select, this.spriteDatabase[category]);
            }
        });
    }

    populateDropdown(selectElement, items) {
        if (!items) return;
        selectElement.innerHTML = ''; // Clear
        const noneOption = document.createElement('option');
        noneOption.value = '';
        noneOption.textContent = 'None';
        selectElement.appendChild(noneOption);

        items.forEach(item => {
            const option = document.createElement('option');
            // Store the style identifier in the value
            option.value = item.style;
            option.textContent = item.name;
            selectElement.appendChild(option);
        });
    }

    onSpriteSelectionChange(category, selectElement) {
        const selectedStyle = selectElement.value;
        if (selectedStyle) {
            const spriteData = this.spriteDatabase[category].find(s => s.style === selectedStyle);
            if (spriteData) {
                this.addLayerToCharacter(category, spriteData);
            }
        } else {
            this.removeLayer(category);
        }
    }
}

// Make sprite builder available globally for testing
if (typeof window !== 'undefined') {
    window.SpriteBuilder = SpriteBuilder;

}

// Add methods for UI interaction
LPCSpriteBuilder.prototype.onSexSelectionChange = function(selectElement) {
    this.currentSex = selectElement.value;
    console.log(`Sex changed to: ${this.currentSex}`);
    // Re-render the character with the new sex
    const currentLayers = { ...this.characterLayers };
    this.characterLayers = {};
    const promises = Object.entries(currentLayers).map(([category, layerData]) => {
        return this.addLayerToCharacter(category, layerData.data);
    });
    Promise.all(promises).then(() => {
        console.log("Character re-rendered with new sex.");
    });
};

LPCSpriteBuilder.prototype.exportCurrentFrame = function() {
    const canvas = this.canvas;
    const link = document.createElement('a');
    link.download = 'sprite_frame.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
};

LPCSpriteBuilder.prototype.exportSpriteSheet = function() {
    console.log('🖼️ Exporting sprite sheet...');
    this.stopAnimation(); // Stop animation to prevent conflicts

    const originalAnimation = this.currentAnimation;
    const originalFrame = this.currentFrame;

    const animations = Object.keys(this.base_animations);
    const frameWidth = this.universalFrameSize;
    const frameHeight = this.universalFrameSize;

    // Find the max number of frames in any animation to determine canvas width
    const maxFrames = Math.max(...Object.values(this.animationFrameCounts));
    const sheetWidth = maxFrames * frameWidth;
    const sheetHeight = animations.length * frameHeight;

    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = sheetWidth;
    exportCanvas.height = sheetHeight;
    const exportCtx = exportCanvas.getContext('2d');

    // It's important to draw the layers in the correct z-index order
    const sortedLayers = [...this.layers].sort((a, b) => a.zIndex - b.zIndex);

    for (let i = 0; i < animations.length; i++) {
        const animation = animations[i];
        const frameCount = this.animationFrameCounts[animation];
        const animationRowY = this.base_animations[animation];

        for (let j = 0; j < frameCount; j++) {
            // Destination position on the export canvas
            const dx = j * frameWidth;
            const dy = i * frameHeight;

            // Draw each layer for the current frame
            sortedLayers.forEach(layer => {
                if (layer.visible && layer.image) {
                    // Source position on the individual sprite sheets
                    const sx = j * frameWidth;
                    const sy = animationRowY;

                    exportCtx.drawImage(
                        layer.image,
                        sx, sy, frameWidth, frameHeight,
                        dx, dy, frameWidth, frameHeight
                    );
                }
            });
        }
    }

    // Trigger download
    const link = document.createElement('a');
    link.download = 'spritesheet.png';
    link.href = exportCanvas.toDataURL('image/png');
    link.click();

    // Restore original state and restart animation
    this.currentAnimation = originalAnimation;
    this.currentFrame = originalFrame;
    this.startAnimation();
    console.log('✅ Sprite sheet export complete.');
};

LPCSpriteBuilder.prototype.randomizeCharacter = function() {
    console.log('🎲 Randomizing character...');
    this.resetCharacter();
    const promises = Object.keys(this.spriteDatabase).map(category => {
        const select = document.getElementById(`${category}Select`);
        if (select) {
            const items = this.spriteDatabase[category];
            if (items.length > 0) {
                const randomIndex = Math.floor(Math.random() * items.length);
                const randomSprite = items[randomIndex];
                select.value = randomSprite.style;
                return this.addLayerToCharacter(category, randomSprite);
            }
        }
        return Promise.resolve();
    });

    Promise.all(promises).then(() => {
        console.log('✅ Character randomization complete.');
    });
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