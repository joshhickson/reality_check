
// Sprite Builder functionality for LPC Character Generator
class SpriteBuilder {
    constructor() {
        this.canvas = document.getElementById('spriteCanvas');
        this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
        this.layers = {
            body: null,
            hair: null,
            clothing: null
        };
        this.currentConfig = {
            bodyType: 'female',
            hairStyle: 'short',
            clothing: 'casual',
            skinTone: 'fair'
        };
        
        if (this.canvas) {
            this.canvas.width = 200;
            this.canvas.height = 200;
        }
    }

    async loadSprite(category, type, animation = 'idle') {
        const basePath = '/lpc-generator/spritesheets';
        
        // Map our UI options to actual LPC paths
        const pathMappings = {
            body: {
                female: `${basePath}/body/bodies/female/${animation}.png`,
                male: `${basePath}/body/bodies/male/${animation}.png`,
                child: `${basePath}/body/bodies/child/${animation}.png`,
                teen: `${basePath}/body/bodies/teen/${animation}.png`
            },
            hair: {
                short: `${basePath}/hair/page2/adult/${animation}.png`,
                long: `${basePath}/hair/long/adult/${animation}.png`,
                parted: `${basePath}/hair/parted/adult/${animation}.png`,
                ponytail: `${basePath}/hair/ponytail/adult/fg/${animation}.png`,
                messy: `${basePath}/hair/messy1/adult/${animation}.png`
            },
            clothing: {
                longsleeve: `${basePath}/torso/clothes/longsleeve/longsleeve/${animation}.png`,
                shortsleeve: `${basePath}/torso/clothes/shortsleeve/shortsleeve/${animation}.png`,
                formal: `${basePath}/torso/clothes/longsleeve/formal/${animation}.png`,
                casual: `${basePath}/torso/clothes/shortsleeve/shortsleeve/${animation}.png`
            }
        };

        const imagePath = pathMappings[category]?.[type];
        if (!imagePath) {
            console.warn(`No sprite path found for ${category}:${type}`);
            return null;
        }

        try {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            return new Promise((resolve, reject) => {
                img.onload = () => resolve(img);
                img.onerror = () => {
                    console.warn(`Failed to load sprite: ${imagePath}`);
                    resolve(null);
                };
                img.src = imagePath;
            });
        } catch (error) {
            console.error(`Error loading sprite ${imagePath}:`, error);
            return null;
        }
    }

    async generateSprite() {
        if (!this.ctx) return;

        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Update preview text
        const previewDiv = document.querySelector('.sprite-canvas');
        if (previewDiv && previewDiv !== this.canvas) {
            previewDiv.innerHTML = `
                <div style="color: #ccc; padding: 20px; text-align: center;">
                    Generating ${this.currentConfig.bodyType} with ${this.currentConfig.hairStyle} hair<br>
                    wearing ${this.currentConfig.clothing} clothing...
                </div>
            `;
        }

        try {
            // Load sprite layers
            const bodyImg = await this.loadSprite('body', this.currentConfig.bodyType);
            const hairImg = await this.loadSprite('hair', this.currentConfig.hairStyle);
            const clothingImg = await this.loadSprite('clothing', this.currentConfig.clothing);

            // Draw layers in order (body, clothing, hair)
            if (bodyImg) {
                // Extract first frame (64x64) from spritesheet
                this.ctx.drawImage(bodyImg, 0, 0, 64, 64, 50, 50, 100, 100);
            }
            
            if (clothingImg) {
                this.ctx.drawImage(clothingImg, 0, 0, 64, 64, 50, 50, 100, 100);
            }
            
            if (hairImg) {
                this.ctx.drawImage(hairImg, 0, 0, 64, 64, 50, 50, 100, 100);
            }

            // Update text to show success
            if (previewDiv && previewDiv !== this.canvas) {
                previewDiv.innerHTML = `
                    <div style="color: #1dd1a1; padding: 20px; text-align: center;">
                        Generated: ${this.currentConfig.bodyType} with ${this.currentConfig.hairStyle} hair<br>
                        <small>Check browser console for any loading issues</small>
                    </div>
                `;
            }

        } catch (error) {
            console.error('Error generating sprite:', error);
            if (previewDiv && previewDiv !== this.canvas) {
                previewDiv.innerHTML = `
                    <div style="color: #ff6b6b; padding: 20px; text-align: center;">
                        Error generating sprite<br>
                        <small>Check browser console for details</small>
                    </div>
                `;
            }
        }
    }

    randomizeSprite() {
        const options = {
            bodyType: ['male', 'female', 'child', 'teen'],
            hairStyle: ['short', 'long', 'parted', 'ponytail', 'messy'],
            clothing: ['longsleeve', 'shortsleeve', 'formal', 'casual'],
            skinTone: ['fair', 'medium', 'dark']
        };

        // Randomly select options
        this.currentConfig.bodyType = options.bodyType[Math.floor(Math.random() * options.bodyType.length)];
        this.currentConfig.hairStyle = options.hairStyle[Math.floor(Math.random() * options.hairStyle.length)];
        this.currentConfig.clothing = options.clothing[Math.floor(Math.random() * options.clothing.length)];
        this.currentConfig.skinTone = options.skinTone[Math.floor(Math.random() * options.skinTone.length)];

        // Update UI
        const bodySelect = document.getElementById('bodyType');
        const hairSelect = document.getElementById('hairStyle');
        const clothingSelect = document.getElementById('clothing');
        const skinSelect = document.getElementById('skinTone');

        if (bodySelect) bodySelect.value = this.currentConfig.bodyType;
        if (hairSelect) hairSelect.value = this.currentConfig.hairStyle;
        if (clothingSelect) clothingSelect.value = this.currentConfig.clothing;
        if (skinSelect) skinSelect.value = this.currentConfig.skinTone;

        // Generate the randomized sprite
        this.generateSprite();
    }

    updateConfig() {
        const bodySelect = document.getElementById('bodyType');
        const hairSelect = document.getElementById('hairStyle');
        const clothingSelect = document.getElementById('clothing');
        const skinSelect = document.getElementById('skinTone');

        if (bodySelect) this.currentConfig.bodyType = bodySelect.value;
        if (hairSelect) this.currentConfig.hairStyle = hairSelect.value;
        if (clothingSelect) this.currentConfig.clothing = clothingSelect.value;
        if (skinSelect) this.currentConfig.skinTone = skinSelect.value;
    }

    exportSprite() {
        if (!this.canvas) return;
        
        const link = document.createElement('a');
        link.download = `sprite_${Date.now()}.png`;
        link.href = this.canvas.toDataURL();
        link.click();
    }
}

// Global sprite builder instance
let spriteBuilder;

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    spriteBuilder = new SpriteBuilder();
});

// Global functions for the UI
function randomizeSprite() {
    if (spriteBuilder) {
        spriteBuilder.randomizeSprite();
    }
}

function generateSprite() {
    if (spriteBuilder) {
        spriteBuilder.updateConfig();
        spriteBuilder.generateSprite();
    }
}

function exportSprite() {
    if (spriteBuilder) {
        spriteBuilder.exportSprite();
    }
}

function saveProfile() {
    if (spriteBuilder) {
        const profile = spriteBuilder.currentConfig;
        console.log('Saving profile:', profile);
        // Could integrate with Replit DB here
        alert('Profile saved to console (check browser dev tools)');
    }
}

// Layer management functions
function toggleLayer(layer) {
    console.log(`Toggling layer: ${layer}`);
}

function editLayer(layer) {
    console.log(`Editing layer: ${layer}`);
}

function addLayer() {
    console.log('Adding new layer');
}
