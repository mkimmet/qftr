export class SkeletalGoblin {
  constructor() {
    this.animState = 'idle'; // 'idle' | 'walk' | 'attack_thrust' | 'hit_recoil'
    this.animTime = 0;
    this.attackStartTime = 0;
    this.attackDuration = 360; // ms for full spear thrust
    this.onAttackHitCallback = null;

    // Joint Angles & Offsets
    this.joints = {
      hipY: 0,
      headTilt: 0,
      earTwitch: 0,
      leftArmAngle: 0,
      rightArmAngle: 0.4, // Spear Thrust Angle
      leftLegAngle: 0,
      rightLegAngle: 0,
      thrustX: 0
    };
  }

  setAnimation(state, onComplete = null) {
    this.animState = state;
    this.animTime = Date.now();
    if (state === 'attack_thrust') {
      this.attackStartTime = Date.now();
      this.onAttackHitCallback = onComplete;
    }
  }

  update() {
    const now = Date.now();
    const elapsed = now - this.animTime;
    const t = elapsed * 0.006;

    if (this.animState === 'idle') {
      this.joints.thrustX = 0;
      this.joints.hipY = Math.sin(t * 2) * 2;
      this.joints.headTilt = Math.sin(t * 1.5) * 0.08;
      this.joints.earTwitch = Math.sin(t * 4) * 0.12;
      this.joints.leftArmAngle = Math.sin(t * 2) * 0.1;
      this.joints.rightArmAngle = 0.3 + Math.cos(t * 2) * 0.1;
      this.joints.leftLegAngle = 0;
      this.joints.rightLegAngle = 0;
    } else if (this.animState === 'walk') {
      this.joints.thrustX = 0;
      this.joints.hipY = Math.abs(Math.sin(t * 7)) * -4;
      this.joints.headTilt = Math.sin(t * 7) * 0.06;
      this.joints.earTwitch = Math.sin(t * 7) * 0.15;
      this.joints.leftLegAngle = Math.sin(t * 7) * 0.5;
      this.joints.rightLegAngle = -Math.sin(t * 7) * 0.5;
      this.joints.leftArmAngle = -Math.sin(t * 7) * 0.3;
      this.joints.rightArmAngle = 0.3 + Math.sin(t * 7) * 0.2;
    } else if (this.animState === 'attack_thrust') {
      const attackProgress = Math.min(1, (now - this.attackStartTime) / this.attackDuration);

      if (attackProgress < 0.25) {
        // Wind-up pull back spear
        const p = attackProgress / 0.25;
        this.joints.thrustX = 6 * p;
        this.joints.rightArmAngle = 0.8 * p;
      } else if (attackProgress < 0.65) {
        // EXPLOSIVE SPEAR THRUST STRIKE!
        const p = (attackProgress - 0.25) / 0.40;
        this.joints.thrustX = 6 - 22 * Math.sin(p * Math.PI); // Forward thrust toward hero!
        this.joints.rightArmAngle = 0.8 - 1.6 * Math.sin(p * Math.PI);

        if (p >= 0.5 && this.onAttackHitCallback) {
          const cb = this.onAttackHitCallback;
          this.onAttackHitCallback = null;
          cb();
        }
      } else {
        // Recovery back to idle
        const p = (attackProgress - 0.65) / 0.35;
        this.joints.thrustX = -16 * (1 - p);
        this.joints.rightArmAngle = 0.4;
      }

      if (attackProgress >= 1) {
        this.animState = 'idle';
      }
    } else if (this.animState === 'hit_recoil') {
      // Flinch backward on taking damage
      const p = Math.min(1, elapsed / 300);
      this.joints.thrustX = 10 * Math.sin(p * Math.PI);
      this.joints.hipY = Math.sin(p * Math.PI) * 5;
      this.joints.headTilt = -Math.sin(p * Math.PI) * 0.3;
      if (p >= 1) {
        this.animState = 'idle';
      }
    }
  }

  draw(ctx, x, y, isWalking = false, scale = 3.6) {
    this.update();

    ctx.save();
    ctx.translate(x + this.joints.thrustX, y + this.joints.hipY);

    const s = scale / 3.6;

    // 1. Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(0, 4 * s, 16 * s, 6 * s, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Hunched Goblin Legs
    ctx.save();
    ctx.rotate(this.joints.leftLegAngle);
    ctx.fillStyle = '#2d4a22'; // Dark Goblin Green
    ctx.fillRect(-6 * s, -8 * s, 4 * s, 10 * s);
    ctx.fillStyle = '#1e3316';
    ctx.fillRect(-7 * s, 2 * s, 5 * s, 3 * s); // Clawed foot
    ctx.restore();

    ctx.save();
    ctx.rotate(this.joints.rightLegAngle);
    ctx.fillStyle = '#2d4a22';
    ctx.fillRect(2 * s, -8 * s, 4 * s, 10 * s);
    ctx.fillStyle = '#1e3316';
    ctx.fillRect(1 * s, 2 * s, 5 * s, 3 * s);
    ctx.restore();

    // 3. Torso with Ragged Tunic
    ctx.fillStyle = '#5c452b'; // Ragged Brown Tunic
    ctx.fillRect(-8 * s, -24 * s, 16 * s, 16 * s);
    ctx.fillStyle = '#3a2b1b';
    ctx.fillRect(-8 * s, -12 * s, 16 * s, 4 * s); // Rope belt

    // 4. Left Arm & Buckler Shield
    ctx.save();
    ctx.translate(-8 * s, -22 * s);
    ctx.rotate(this.joints.leftArmAngle);
    ctx.fillStyle = '#3f6630';
    ctx.fillRect(-3 * s, 0, 4 * s, 10 * s);
    
    // Timber Buckler Shield
    ctx.fillStyle = '#4a3525';
    ctx.beginPath();
    ctx.arc(-4 * s, 8 * s, 7 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 1 * s;
    ctx.stroke();
    ctx.restore();

    // 5. Right Arm & Goblin Iron Spear / Pike
    ctx.save();
    ctx.translate(8 * s, -22 * s);
    ctx.rotate(this.joints.rightArmAngle);

    ctx.fillStyle = '#3f6630';
    ctx.fillRect(-1 * s, 0, 4 * s, 10 * s);

    // Spear Shaft
    ctx.fillStyle = '#5c4028';
    ctx.fillRect(-15 * s, 8 * s, 36 * s, 3 * s);

    // Iron Spearhead Blade
    ctx.fillStyle = '#a6b8c7';
    ctx.beginPath();
    ctx.moveTo(-15 * s, 5 * s);
    ctx.lineTo(-24 * s, 9.5 * s);
    ctx.lineTo(-15 * s, 14 * s);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 0.8 * s;
    ctx.stroke();

    // Spear Thrust Arc VFX during attack
    if (this.animState === 'attack_thrust') {
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 100, 80, 0.85)';
      ctx.lineWidth = 4 * s;
      ctx.shadowColor = '#ff4444';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(-15 * s, 9.5 * s);
      ctx.lineTo(-40 * s, 9.5 * s);
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();

    // 6. Goblin Head, Pointy Ears & Glowing Yellow Eyes
    ctx.save();
    ctx.rotate(this.joints.headTilt);
    ctx.fillStyle = '#4a7c38'; // Goblin Green
    ctx.beginPath();
    ctx.arc(0, -30 * s, 8 * s, 0, Math.PI * 2);
    ctx.fill();

    // Pointy Goblin Ears
    ctx.save();
    ctx.rotate(this.joints.earTwitch);
    ctx.fillStyle = '#3f6630';
    ctx.beginPath();
    ctx.moveTo(-6 * s, -30 * s);
    ctx.lineTo(-15 * s, -35 * s);
    ctx.lineTo(-7 * s, -26 * s);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(6 * s, -30 * s);
    ctx.lineTo(15 * s, -35 * s);
    ctx.lineTo(7 * s, -26 * s);
    ctx.fill();
    ctx.restore();

    // Glowing Yellow Eyes
    ctx.fillStyle = '#ffee44';
    ctx.beginPath();
    ctx.arc(-3 * s, -31 * s, 2 * s, 0, Math.PI * 2);
    ctx.arc(3 * s, -31 * s, 2 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.fillRect(-3.5 * s, -31.5 * s, 1 * s, 1 * s);
    ctx.fillRect(2.5 * s, -31.5 * s, 1 * s, 1 * s);

    // Goblin Fangs
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(-2 * s, -24 * s);
    ctx.lineTo(-1 * s, -21 * s);
    ctx.lineTo(0, -24 * s);
    ctx.fill();

    ctx.restore();
    ctx.restore();
  }
}
