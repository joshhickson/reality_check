// Final, corrected public/sprite-builder.js
class LPCSpriteBuilder {
    constructor() {
        this.canvas = document.getElementById('spriteCanvas');
        if (!this.canvas) {
            console.error('❌ Sprite canvas not found');
            return;
        }
        this.ctx = this.canvas.getContext('2d');

        this.universalFrameSize = 64;
        this.base_animations = {
            spellcast: 0, thrust: 256, walk: 512, slash: 768, shoot: 1024, hurt: 1280
        };
        this.animationFrameCounts = {
            spellcast: 7, thrust: 8, walk: 9, slash: 6, shoot: 13, hurt: 6
        };

        this.layers = [];
        this.currentAnimation = 'walk';
        this.currentFrame = 0;
        this.animationInterval = null;
        this.isAnimating = false;
        this.currentSex = 'male';
        this.characterLayers = {};
        this.spriteDatabase = {};

        console.log('🎨 LPC Sprite Builder initialized');
        this.init();
    }

    async init() {
        console.log('📋 Initializing sprite builder...');
        await this.loadLPCData();
        this.setupUI();
        await this.loadDefaultCharacter();
        this.startAnimation();
    }

    async loadLPCData() {
        // This function fetches the pre-generated sprite database.
        // This approach was chosen over on-demand scanning to avoid
        // overwhelming the server environment with file I/O.
        console.log('🔄 Loading LPC sprite database...');
        try {
            const response = await fetch('/lpc-all-sprites.json');
            if (!response.ok) {
                throw new Error(`Sprite database not found at /lpc-all-sprites.json. Status: ${response.status}`);
            }
            this.spriteDatabase = await response.json();
            console.log('✅ LPC sprite database loaded successfully!');
        } catch (error) {
            console.error('❌ Failed to load sprite database:', error);
            // If the database fails to load, the UI will be unusable, so we log the error.
        }
    }

    async loadDefaultCharacter() {
        console.log('👤 Loading default character...');
        const bodySprite = this.spriteDatabase.body?.find(s => s.style === 'bodies');
        if (bodySprite) await this.addLayerToCharacter('body', bodySprite);

        const hairSprite = this.spriteDatabase.hair?.find(s => s.style === 'plain/adult');
        if (hairSprite) await this.addLayerToCharacter('hair', hairSprite);
    }

    async loadSprite(spritePath) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error(`Failed to load image: ${spritePath}`));
            img.src = spritePath;
        });
    }

    async addLayerToCharacter(category, spriteData) {
        const paths = spriteData.paths[this.currentSex];
        const path = paths?.[this.currentAnimation] || paths?.[Object.keys(paths)[0]];

        if (!path) {
            console.warn(`⚠️ No path for ${category} -> ${spriteData.name} -> ${this.currentSex}`);
            delete this.characterLayers[category];
            this.renderCharacter();
            return;
        }

        try {
            const image = await this.loadSprite(path);
            this.characterLayers[category] = { image, data: spriteData };
            this.renderCharacter();
        } catch (error) {
            console.error(`❌ Failed to load layer: ${path}`, error);
        }
    }

    renderCharacter() {
        const layerOrder = ['body', 'legs', 'torso', 'arms', 'head', 'hair', 'feet'];
        this.layers = layerOrder
            .map(category => this.characterLayers[category])
            .filter(Boolean)
            .map((layerData, i) => ({
                name: layerOrder[i],
                image: layerData.image,
                zIndex: (i + 1) * 10,
                visible: true,
                path: layerData.data.paths[this.currentSex]?.[this.currentAnimation]
            }));

        this.updateLayerList();
        this.drawCurrentFrame();
    }

    drawCurrentFrame() {
        if (!this.ctx) return;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.layers.forEach(layer => {
            if (layer.visible && layer.image) {
                const sx = this.currentFrame * this.universalFrameSize;
                const sy = this.base_animations[this.currentAnimation] || 0;
                this.ctx.drawImage(layer.image, sx, sy, this.universalFrameSize, this.universalFrameSize, 0, 0, this.universalFrameSize, this.universalFrameSize);
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
    }

    stopAnimation() {
        clearInterval(this.animationInterval);
        this.isAnimating = false;
    }

    updateLayerList() {
        const layersList = document.getElementById('layersList');
        if (!layersList) return;
        layersList.innerHTML = this.layers.map((layer, index) => `
            <div class="layer-item">
                <label>
                    <input type="checkbox" ${layer.visible ? 'checked' : ''} onchange="window.spriteBuilder.toggleLayerVisibility(${index})">
                    ${layer.name}
                </label>
                <button onclick="window.spriteBuilder.removeLayer('${layer.name}')">X</button>
            </div>
        `).join('');
    }

    toggleLayerVisibility(index) {
        if (this.layers[index]) {
            this.layers[index].visible = !this.layers[index].visible;
            this.drawCurrentFrame();
        }
    }

    removeLayer(category) {
        delete this.characterLayers[category];
        this.renderCharacter();
    }

    resetCharacter() {
        this.characterLayers = {};
        this.renderCharacter();
    }

    setupUI() {
        Object.keys(this.spriteDatabase).forEach(category => {
            const select = document.getElementById(`${category}Select`);
            if (select) this.populateDropdown(select, this.spriteDatabase[category]);
        });
    }

    populateDropdown(selectElement, items) {
        selectElement.innerHTML = '<option value="">None</option>';
        items.forEach(item => {
            selectElement.innerHTML += `<option value="${item.style}">${item.name}</option>`;
        });
    }

    onSpriteSelectionChange(category, selectElement) {
        const selectedStyle = selectElement.value;
        if (selectedStyle) {
            const spriteData = this.spriteDatabase[category].find(s => s.style === selectedStyle);
            if (spriteData) this.addLayerToCharacter(category, spriteData);
        } else {
            this.removeLayer(category);
        }
    }

    onSexSelectionChange(selectElement) {
        this.currentSex = selectElement.value;
        Object.entries(this.characterLayers).forEach(([category, layerData]) => {
            this.addLayerToCharacter(category, layerData.data);
        });
    }

    randomizeCharacter() {
        this.resetCharacter();
        Object.keys(this.spriteDatabase).forEach(category => {
            const select = document.getElementById(`${category}Select`);
            const items = this.spriteDatabase[category];
            if (select && items.length > 0) {
                const randomSprite = items[Math.floor(Math.random() * items.length)];
                select.value = randomSprite.style;
                this.addLayerToCharacter(category, randomSprite);
            }
        });
    }

    exportCurrentFrame() {
        const link = document.createElement('a');
        link.download = 'sprite_frame.png';
        link.href = this.canvas.toDataURL('image/png');
        link.click();
    }

    exportSpriteSheet() {
        // Implementation for sprite sheet export can be added here
        alert("Sprite sheet export is not yet implemented.");
    }

    debugSprites() {
        // Implementation for debugging can be added here
        alert("Debug functionality is not yet implemented.");
    }
}

// Initialize the sprite builder once the DOM is fully loaded.
document.addEventListener('DOMContentLoaded', () => {
    window.spriteBuilder = new LPCSpriteBuilder();
});