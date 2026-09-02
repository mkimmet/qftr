export class SpriteAnimation {
  constructor(options = {}) {
    this.image = new Image();
    if (options.src) this.image.src = options.src;

    this.frameWidth = options.frameWidth || 64;
    this.frameHeight = options.frameHeight || 64;
    this.totalFrames = options.totalFrames || 4;
    this.fps = options.fps || 8;

    this.currentFrame = 0;
    this.lastFrameTime = Date.now();
    this.isLoaded = false;

    this.image.onload = () => {
      this.isLoaded = true;
    };
  }

  update() {
    const now = Date.now();
    const interval = 1000 / this.fps;

    if (now - this.lastFrameTime >= interval) {
      this.currentFrame = (this.currentFrame + 1) % this.totalFrames;
      this.lastFrameTime = now;
    }
  }

  drawFrame(ctx, x, y, drawWidth = 64, drawHeight = 64, isFlipped = false) {
    if (!this.isLoaded || !this.image.complete) {
      // Fallback placeholder circle if sprite sheet is loading
      ctx.save();
      ctx.fillStyle = '#f4be42';
      ctx.beginPath();
      ctx.arc(x, y - drawHeight / 2, drawWidth / 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return;
    }

    const srcX = this.currentFrame * this.frameWidth;
    const srcY = 0;

    ctx.save();
    ctx.translate(x, y - drawHeight);

    if (isFlipped) {
      ctx.scale(-1, 1);
      ctx.drawImage(
        this.image,
        srcX, srcY, this.frameWidth, this.frameHeight,
        -drawWidth / 2, 0, drawWidth, drawHeight
      );
    } else {
      ctx.drawImage(
        this.image,
        srcX, srcY, this.frameWidth, this.frameHeight,
        -drawWidth / 2, 0, drawWidth, drawHeight
      );
    }

    ctx.restore();
  }
}
