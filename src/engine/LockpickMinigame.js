// LockpickMinigame.js - Interactive 2D Lock Tumbler Minigame for Thief Path
import { synth } from './SoundSynth.js';

export class LockpickMinigame {
  constructor(gameEngine) {
    this.gameEngine = gameEngine;
    this.container = null;
    this.canvas = null;
    this.ctx = null;
    this.isOpen = false;
    this.targetAngle = 45; // Sweet spot angle (degrees)
    this.pickAngle = 0; // Current pick angle
    this.tension = 0; // Tension wrench value
    this.sweetSpotTolerance = 15; // Degrees of tolerance based on Agility/Stealth
    this.isUnlocked = false;
    this.onSuccessCallback = null;
  }

  startMinigame(targetName = 'Chest Lock', onSuccess = null) {
    this.onSuccessCallback = onSuccess;
    this.targetAngle = Math.floor(Math.random() * 140) - 70; // -70 to +70 deg
    this.pickAngle = 0;
    this.tension = 0;
    this.isUnlocked = false;

    // Calculate tolerance from Thief Agility & Stealth stats
    const agility = this.gameEngine.statSystem?.stats?.agility || 15;
    const stealth = this.gameEngine.statSystem?.stats?.stealth || 15;
    this.sweetSpotTolerance = Math.min(35, 12 + Math.floor((agility + stealth) / 4));

    this.showUI(targetName);
  }

  showUI(targetName) {
    let dialogueLayer = document.getElementById('dialogue-layer');
    if (!dialogueLayer) return;

    dialogueLayer.style.display = 'flex';
    dialogueLayer.innerHTML = `
      <div class="dialogue-modal parchment-card" style="width: 580px; text-align: center; border: 3px solid var(--parchment-border); box-shadow: 0 20px 50px rgba(0,0,0,0.9); pointer-events: auto;">
        
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid var(--parchment-border); padding-bottom: 8px; margin-bottom: 14px;">
          <div style="font-family: var(--font-heading); font-size: 1.4rem; font-weight: 800; color: #543714;">
            🗝️ Thief Lockpicking: ${targetName}
          </div>
          <div style="font-size: 0.8rem; color: #8c5a14; font-weight: 700; background: rgba(212,175,55,0.2); padding: 2px 10px; border-radius: 12px; border: 1px solid var(--parchment-border);">
            Tolerance: ±${this.sweetSpotTolerance}°
          </div>
        </div>

        <!-- Lock Tumbler Canvas Container -->
        <div style="position: relative; width: 320px; height: 240px; margin: 0 auto 14px; background: #0c1610; border: 3px solid #d4af37; border-radius: 12px; box-shadow: inset 0 0 20px rgba(0,0,0,0.95); overflow: hidden;">
          <canvas id="lockpick-canvas" width="320" height="240" style="display: block; width: 100%; height: 100%;"></canvas>
        </div>

        <!-- Controls Bar -->
        <div style="display: flex; flex-direction: column; gap: 10px; max-width: 440px; margin: 0 auto 16px;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <span style="font-weight: 800; font-size: 0.9rem; color: #543714; width: 90px; text-align: right;">Pick Angle:</span>
            <input type="range" id="slider-pick-angle" min="-80" max="80" value="0" style="flex: 1; cursor: pointer;">
          </div>

          <div style="display: flex; align-items: center; gap: 12px;">
            <span style="font-weight: 800; font-size: 0.9rem; color: #543714; width: 90px; text-align: right;">Tension:</span>
            <button id="btn-apply-tension" class="btn-ghibli btn-emerald" style="flex: 1; height: 38px; font-size: 0.95rem; font-weight: 800; justify-content: center;">🔧 Turn Tension Wrench</button>
          </div>
        </div>

        <div style="display: flex; gap: 8px;">
          <button id="btn-close-lockpick" class="btn-ghibli" style="flex: 1; height: 38px; justify-content: center;">Step Away</button>
        </div>

      </div>
    `;

    this.canvas = document.getElementById('lockpick-canvas');
    this.ctx = this.canvas.getContext('2d');

    const angleSlider = document.getElementById('slider-pick-angle');
    angleSlider.addEventListener('input', (e) => {
      this.pickAngle = parseFloat(e.target.value);
      synth.playClick();
      this.drawLock();
    });

    const tensionBtn = document.getElementById('btn-apply-tension');
    tensionBtn.addEventListener('mousedown', () => this.tryTurnLock());
    tensionBtn.addEventListener('mouseup', () => this.releaseTension());

    document.getElementById('btn-close-lockpick').addEventListener('click', () => {
      dialogueLayer.style.display = 'none';
      synth.playClick();
    });

    this.drawLock();
  }

  tryTurnLock() {
    const diff = Math.abs(this.pickAngle - this.targetAngle);
    if (diff <= this.sweetSpotTolerance) {
      // Success! Lock opens!
      this.isUnlocked = true;
      synth.playStatUp();
      this.drawLock(1.0);
      this.gameEngine.showNotification('🔓 CLICK! Lock tumbler clicked open!');
      
      setTimeout(() => {
        const dialogueLayer = document.getElementById('dialogue-layer');
        if (dialogueLayer) dialogueLayer.style.display = 'none';
        if (this.onSuccessCallback) this.onSuccessCallback();
      }, 600);

    } else {
      // Lock jams / Pick vibrates
      synth.playHit();
      const openRatio = Math.max(0, 1 - diff / 90);
      this.drawLock(openRatio * 0.4);
      this.gameEngine.showNotification('⚠️ Lock jammed! Adjust your lockpick angle.');
    }
  }

  releaseTension() {
    if (!this.isUnlocked) {
      this.drawLock(0);
    }
  }

  drawLock(turnRatio = 0) {
    if (!this.ctx) return;

    const w = this.canvas.width;
    const h = this.canvas.height;
    const cx = w / 2;
    const cy = h / 2;

    this.ctx.clearRect(0, 0, w, h);

    // Dark Background & Metallic Plate
    this.ctx.fillStyle = '#141d17';
    this.ctx.fillRect(0, 0, w, h);

    // Brass Lock Bezel
    const ringGrad = this.ctx.createRadialGradient(cx, cy, 50, cx, cy, 90);
    ringGrad.addColorStop(0, '#b8860b');
    ringGrad.addColorStop(0.7, '#ffd700');
    ringGrad.addColorStop(1, '#574108');

    this.ctx.fillStyle = ringGrad;
    this.ctx.beginPath();
    this.ctx.arc(cx, cy, 85, 0, Math.PI * 2);
    this.ctx.fill();

    // Rotating Inner Cylinder
    this.ctx.save();
    this.ctx.translate(cx, cy);
    this.ctx.rotate(turnRatio * (Math.PI / 2));

    this.ctx.fillStyle = '#292929';
    this.ctx.beginPath();
    this.ctx.arc(0, 0, 52, 0, Math.PI * 2);
    this.ctx.fill();

    // Keyhole Slot
    this.ctx.fillStyle = '#0a0a0a';
    this.ctx.beginPath();
    this.ctx.arc(0, -10, 8, 0, Math.PI * 2);
    this.ctx.rect(-5, -10, 10, 30);
    this.ctx.fill();

    this.ctx.restore();

    // Lockpick Hairpin Vector
    this.ctx.save();
    this.ctx.translate(cx, cy);
    const pickRad = (this.pickAngle * Math.PI) / 180;
    this.ctx.rotate(pickRad);

    this.ctx.strokeStyle = '#e6e6e6';
    this.ctx.lineWidth = 3.5;
    this.ctx.beginPath();
    this.ctx.moveTo(0, 0);
    this.ctx.lineTo(0, -95);
    this.ctx.lineTo(8, -105); // Hook tip
    this.ctx.stroke();

    this.ctx.restore();
  }
}
