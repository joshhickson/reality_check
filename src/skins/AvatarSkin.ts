
export interface PlayerData {
  id: string;
  name: string;
  traits?: string[];
  money: number;
  mental: number;
  sin: number;
  virtue: number;
}

export class AvatarSkin {
  private skinCache: Map<string, string> = new Map();
  
  constructor(private skinPath: string = '/assets/avatars/') {}

  async loadSkin(skinId: string): Promise<string> {
    if (this.skinCache.has(skinId)) {
      return this.skinCache.get(skinId)!;
    }

    try {
      const response = await fetch(`${this.skinPath}${skinId}.svg`);
      if (!response.ok) {
        throw new Error(`Failed to load avatar skin: ${skinId}`);
      }
      
      const svgContent = await response.text();
      this.skinCache.set(skinId, svgContent);
      return svgContent;
    } catch (error) {
      console.error('Error loading avatar skin:', error);
      return this.getDefaultSkin();
    }
  }

  private getDefaultSkin(): string {
    return `
      <svg width="120" height="120" xmlns="http://www.w3.org/2000/svg">
        <circle cx="60" cy="60" r="55" fill="#e9ecef" stroke="#dee2e6" stroke-width="3"/>
        <circle cx="60" cy="45" r="18" fill="#6c757d"/>
        <path d="M 30 95 Q 60 75 90 95 L 90 110 L 30 110 Z" fill="#6c757d"/>
        <rect x="5" y="100" width="110" height="15" rx="7" fill="rgba(0,0,0,0.7)"/>
        <text x="60" y="110" font-family="Arial, sans-serif" font-size="10" font-weight="bold" fill="white" text-anchor="middle" id="player-name">Player</text>
        <circle cx="95" cy="25" r="12" fill="#ffc107" id="trait-1" opacity="0"/>
        <text x="95" y="29" font-family="Arial, sans-serif" font-size="8" text-anchor="middle" fill="black" id="trait-1-text">💰</text>
        <circle cx="95" cy="45" r="12" fill="#007bff" id="trait-2" opacity="0"/>
        <text x="95" y="49" font-family="Arial, sans-serif" font-size="8" text-anchor="middle" fill="white" id="trait-2-text">🧠</text>
      </svg>
    `;
  }

  private getTraitIcon(trait: string): string {
    const traitIcons: { [key: string]: string } = {
      'wealthy': '💰',
      'smart': '🧠',
      'social': '🗣️',
      'creative': '🎨',
      'athletic': '💪',
      'lucky': '🍀',
      'charming': '😊',
      'tech': '💻'
    };
    
    return traitIcons[trait.toLowerCase()] || '⭐';
  }

  async renderAvatar(player: PlayerData, skinId: string = 'default'): Promise<string> {
    let svgTemplate = await this.loadSkin(skinId);
    
    // Replace player name
    svgTemplate = svgTemplate.replace(
      /id="player-name"[^>]*>Player/,
      `id="player-name" font-size="10" font-weight="bold" fill="white" text-anchor="middle">${player.name.slice(0, 12)}`
    );

    // Show trait indicators if traits exist
    if (player.traits && player.traits.length > 0) {
      if (player.traits[0]) {
        svgTemplate = svgTemplate
          .replace(/id="trait-1"[^>]*opacity="0"/, `id="trait-1" opacity="1"`)
          .replace(/id="trait-1-text"[^>]*>💰/, `id="trait-1-text">${this.getTraitIcon(player.traits[0])}`);
      }
      
      if (player.traits[1]) {
        svgTemplate = svgTemplate
          .replace(/id="trait-2"[^>]*opacity="0"/, `id="trait-2" opacity="1"`)
          .replace(/id="trait-2-text"[^>]*>🧠/, `id="trait-2-text">${this.getTraitIcon(player.traits[1])}`);
      }
    }

    return `data:image/svg+xml;base64,${btoa(svgTemplate)}`;
  }

  createAvatarElement(player: PlayerData, skinId: string = 'default'): Promise<HTMLImageElement> {
    return new Promise(async (resolve, reject) => {
      try {
        const dataUri = await this.renderAvatar(player, skinId);
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = dataUri;
      } catch (error) {
        reject(error);
      }
    });
  }
}
