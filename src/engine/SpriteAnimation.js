export class SpriteAnimation {
  constructor(options = {}) {
    // Original 32x32 Grid Hero Sprite Sheet (/hero_spritesheet.png)
    this.image = new Image();
    this.image.src = options.src || '/hero_spritesheet.png';

    // 1024x256 sprite sheet: 24 columns, 8 rows
    // Every frame is an exact 32x32 pixel cell!
    this.frameWidth = 32;
    this.frameHeight = 32;
    this.cols = 24;
    this.rows = 8;

    this.currentFrameIndex = 0; // 0..7
    this.fps = options.fps || 10;
    this.lastFrameTime = Date.now();
    this.isLoaded = false;

    this.image.onload = () => {
      this.isLoaded = true;
    };

    // Row Direction Mapping (8 Directions)
    this.rowMap = {
      'down': 0,
      'left': 1,
      'right': 2,
      'up': 3,
      'down_right': 4,
      'down_left': 5,
      'up_right': 6,
      'up_left': 7
    };
  }

  update() {
    const now = Date.now();
    const interval = 1000 / this.fps;

    if (now - this.lastFrameTime >= interval) {
      this.currentFrameIndex = (this.currentFrameIndex + 1) % 8;
      this.lastFrameTime = now;
    }
  }

  drawHeroSprite(ctx, x, y, direction = 'down', isWalking = false, isStealth = false, drawScale = 3.6, heroClass = 'Fighter', cloakColor = null) {
    if (!this.isLoaded || !this.image.complete || this.image.naturalWidth === 0) {
      // Fallback silhouette while sprite loads
      ctx.save();
      ctx.fillStyle = 'rgba(10, 20, 15, 0.45)';
      ctx.beginPath();
      ctx.ellipse(x, y + 2, 22, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f4be42';
      ctx.beginPath();
      ctx.arc(x, y - 30, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return;
    }

    // Determine Animation State Offset (0 for Idle, 8 for Walking, 16 for Sneaking)
    let colOffset = 0;
    if (isWalking) {
      colOffset = isStealth ? 16 : 8; // Cols 16..23 for Sneaking, 8..15 for Walking
    } else {
      colOffset = isStealth ? 16 : 0; // Cols 16..23 for Sneaking, 0..7 for Idle
    }

    const col = colOffset + (this.currentFrameIndex % 8);
    const row = this.rowMap[direction] !== undefined ? this.rowMap[direction] : 0;

    // Exact 32x32 Cell Slicing!
    const srcX = col * 32;
    const srcY = row * 32;

    // Draw at 2.4x Scale (76.8px height - 200% size of original 32px cell)
    const drawW = Math.round(32 * drawScale);
    const drawH = Math.round(32 * drawScale);

    ctx.save();

    if (isStealth) {
      ctx.globalAlpha = 0.8;
    }

    // Drop Shadow
    ctx.fillStyle = 'rgba(10, 20, 15, 0.45)';
    ctx.beginPath();
    ctx.ellipse(x, y + 2, drawW * 0.28, drawH * 0.1, 0, 0, Math.PI * 2);
    ctx.fill();

    // Disable image smoothing for crisp pixel art!
    ctx.imageSmoothingEnabled = false;

    // Draw Full 32x32 Hero Sprite Frame (Anchored at Feet)
    ctx.drawImage(
      this.image,
      srcX, srcY, 32, 32,
      Math.round(x - drawW / 2), Math.round(y - drawH + 2), drawW, drawH
    );

    // Class Badge Overlay
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';

    if (isStealth) ctx.fillText('🥷', x + drawW * 0.35, y - drawH * 0.5);
    else if (heroClass.includes('Paladin')) ctx.fillText('🛡️', x + drawW * 0.35, y - drawH * 0.5);
    else if (heroClass === 'Fighter') ctx.fillText('⚔️', x + drawW * 0.35, y - drawH * 0.5);
    else if (heroClass === 'Magic User') ctx.fillText('🔮', x + drawW * 0.35, y - drawH * 0.5);
    else if (heroClass === 'Thief') ctx.fillText('🗡️', x + drawW * 0.35, y - drawH * 0.5);

    ctx.restore();
  }
}
