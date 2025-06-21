
export interface CardSkinConfig {
  backgroundColor: string;
  headerColor: string;
  textColor: string;
  fontSize: number;
}

export class CardSkin {
  private skinCache: Map<string, string> = new Map();
  
  constructor(private skinPath: string = '/assets/card_skins/') {}

  async loadSkin(skinId: string): Promise<string> {
    if (this.skinCache.has(skinId)) {
      return this.skinCache.get(skinId)!;
    }

    try {
      const response = await fetch(`${this.skinPath}${skinId}.svg`);
      if (!response.ok) {
        throw new Error(`Failed to load skin: ${skinId}`);
      }
      
      const svgContent = await response.text();
      this.skinCache.set(skinId, svgContent);
      return svgContent;
    } catch (error) {
      console.error('Error loading skin:', error);
      // Return default skin
      return this.getDefaultSkin();
    }
  }

  private getDefaultSkin(): string {
    return `
      <svg width="300" height="420" xmlns="http://www.w3.org/2000/svg">
        <rect width="300" height="420" rx="15" ry="15" fill="#f8f9fa" stroke="#dee2e6" stroke-width="2"/>
        <rect width="300" height="60" rx="15" ry="15" fill="#6c757d" id="header-bg"/>
        <rect width="300" height="45" y="15" fill="#6c757d" id="header-fill"/>
        <text x="20" y="40" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="white" id="card-type">CARD</text>
        <foreignObject x="20" y="80" width="260" height="280">
          <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: Arial, sans-serif; font-size: 16px; line-height: 1.4; color: #212529; height: 100%; display: flex; align-items: center; text-align: center;">
            <p id="card-text" style="margin: 0;">Default card text</p>
          </div>
        </foreignObject>
        <rect x="20" y="370" width="260" height="30" rx="5" fill="#e9ecef"/>
        <text x="30" y="388" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#28a745" id="money-stat">$0</text>
        <text x="100" y="388" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#007bff" id="mental-stat">🧠 0</text>
        <text x="170" y="388" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#dc3545" id="sin-stat">😈 0</text>
        <text x="220" y="388" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#ffc107" id="virtue-stat">😇 0</text>
      </svg>
    `;
  }

  async renderCard(card: any, skinId: string = 'default'): Promise<string> {
    let svgTemplate = await this.loadSkin(skinId);
    
    // Determine colors based on card type
    const colors = {
      sin: '#dc3545',
      virtue: '#28a745',
      neutral: '#6c757d'
    };
    
    const cardColor = colors[card.deck as keyof typeof colors] || colors.neutral;
    
    // Replace placeholders
    svgTemplate = svgTemplate
      .replace(/id="card-type"[^>]*>TYPE/, `id="card-type" font-size="14" font-weight="bold" fill="white">${card.deck.toUpperCase()}`)
      .replace(/id="card-text"[^>]*>Card text goes here/, `id="card-text" style="margin: 0;">${card.text}`)
      .replace(/id="money-stat"[^>]*>\$0/, `id="money-stat" fill="${card.money >= 0 ? '#28a745' : '#dc3545'}">$${card.money}`)
      .replace(/id="mental-stat"[^>]*>🧠 0/, `id="mental-stat" fill="#007bff">🧠 ${card.mental > 0 ? '+' : ''}${card.mental}`)
      .replace(/id="sin-stat"[^>]*>😈 0/, `id="sin-stat" fill="#dc3545">😈 ${card.sin > 0 ? '+' : ''}${card.sin}`)
      .replace(/id="virtue-stat"[^>]*>😇 0/, `id="virtue-stat" fill="#ffc107">😇 ${card.virtue > 0 ? '+' : ''}${card.virtue}`)
      .replace(/#card-color/g, cardColor);

    return `data:image/svg+xml;base64,${btoa(svgTemplate)}`;
  }

  // For canvas/DOM rendering
  createCardElement(card: any, skinId: string = 'default'): Promise<HTMLImageElement> {
    return new Promise(async (resolve, reject) => {
      try {
        const dataUri = await this.renderCard(card, skinId);
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
