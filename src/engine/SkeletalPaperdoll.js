import { synth } from './SoundSynth.js';

export class SkeletalPaperdoll {
  constructor(gameEngine) {
    this.gameEngine = gameEngine;
    this.animState = 'idle'; // 'idle' | 'walk' | 'attack_melee' | 'cast_spell' | 'hit_recoil'
    this.animTime = 0;
    this.attackStartTime = 0;
    this.attackDuration = 380; // ms for full slash arc
    this.onAttackHitCallback = null;

    // Joint Angles & Offsets
    this.joints = {
      hipY: 0,
      torsoTilt: 0,
      headTilt: 0,
      leftArmAngle: 0,
      rightArmAngle: -1.1, // High Guard in Combat
      leftLegAngle: 0,
      rightLegAngle: 0,
      cloakSway: 0,
      lungeX: 0
    };
  }

  setAnimation(state, onComplete = null) {
    this.animState = state;
    this.animTime = Date.now();
    if (state === 'attack_melee') {
      this.attackStartTime = Date.now();
      this.onAttackHitCallback = onComplete;
    }
  }

  update(isCombat = false) {
    const now = Date.now();
    const elapsed = now - this.animTime;
    const t = elapsed * 0.005; // Time multiplier

    if (this.animState === 'idle') {
      this.joints.lungeX = 0;
      this.joints.torsoTilt = 0;
      this.joints.hipY = Math.sin(t * 1.5) * 2;
      this.joints.headTilt = Math.sin(t * 1.2) * 0.05;
      this.joints.leftLegAngle = 0;
      this.joints.rightLegAngle = 0;
      this.joints.cloakSway = Math.sin(t * 2) * 0.1;

      if (isCombat) {
        // Combat Ready Stance: Sword held HIGH above head!
        this.joints.rightArmAngle = -1.2 + Math.sin(t * 2) * 0.06;
        this.joints.leftArmAngle = -0.4 + Math.cos(t * 2) * 0.06;
      } else {
        // Exploration Stance: Sheathed weapon, natural relaxed arms
        this.joints.rightArmAngle = Math.cos(t * 1.5) * 0.08;
        this.joints.leftArmAngle = Math.sin(t * 1.5) * 0.08;
      }
    } else if (this.animState === 'walk') {
      this.joints.lungeX = 0;
      this.joints.torsoTilt = 0;
      this.joints.hipY = Math.abs(Math.sin(t * 6)) * -3;
      this.joints.headTilt = Math.sin(t * 6) * 0.04;
      this.joints.leftLegAngle = Math.sin(t * 6) * 0.45;
      this.joints.rightLegAngle = -Math.sin(t * 6) * 0.45;
      this.joints.cloakSway = Math.sin(t * 6) * 0.25;

      if (isCombat) {
        this.joints.rightArmAngle = -1.1 + Math.sin(t * 6) * 0.15;
        this.joints.leftArmAngle = -0.4 - Math.sin(t * 6) * 0.15;
      } else {
        this.joints.leftArmAngle = -Math.sin(t * 6) * 0.35;
        this.joints.rightArmAngle = Math.sin(t * 6) * 0.35;
      }
    } else if (this.animState === 'attack_melee') {
      const attackProgress = Math.min(1, (now - this.attackStartTime) / this.attackDuration);
      
      // Wind-up -> Powerful Downward Slash -> Recovery
      if (attackProgress < 0.20) {
        // High Wind-up over shoulder
        const p = attackProgress / 0.20;
        this.joints.rightArmAngle = -1.1 - 0.7 * p; // Raise high to -1.8 rad
        this.joints.torsoTilt = -0.2 * p; // Lean back
        this.joints.lungeX = -4 * p;
        this.joints.hipY = 2 * p;
      } else if (attackProgress < 0.60) {
        // EXPLOSIVE FORWARD SLASH ARC!
        const p = (attackProgress - 0.20) / 0.40;
        this.joints.rightArmAngle = -1.8 + 3.4 * p; // Swing down across 200 degrees (+1.6 rad)!
        this.joints.torsoTilt = -0.2 + 0.5 * p; // Forward body weight lunge!
        this.joints.lungeX = -4 + 18 * Math.sin(p * Math.PI); // Forward lunge!
        this.joints.hipY = -4 * Math.sin(p * Math.PI);

        if (p >= 0.5 && this.onAttackHitCallback) {
          const cb = this.onAttackHitCallback;
          this.onAttackHitCallback = null;
          cb();
        }
      } else {
        // Recovery back to High Guard
        const p = (attackProgress - 0.60) / 0.40;
        this.joints.rightArmAngle = 1.6 - 2.7 * p; // Return to -1.1 rad
        this.joints.torsoTilt = 0.3 * (1 - p);
        this.joints.lungeX = 14 * (1 - p);
        this.joints.hipY = 0;
      }

      if (attackProgress >= 1) {
        this.animState = 'idle';
      }
    } else if (this.animState === 'cast_spell') {
      // Raise staff high into air
      this.joints.lungeX = 0;
      this.joints.rightArmAngle = -1.5;
      this.joints.leftArmAngle = -1.0;
      this.joints.hipY = -3;
      this.joints.headTilt = -0.15;
      if (elapsed > 500) {
        this.animState = 'idle';
      }
    } else if (this.animState === 'hit_recoil') {
      // Flinch backward on hit
      const p = Math.min(1, elapsed / 300);
      this.joints.lungeX = -8 * Math.sin(p * Math.PI);
      this.joints.hipY = Math.sin(p * Math.PI) * 6;
      this.joints.headTilt = Math.sin(p * Math.PI) * 0.25;
      this.joints.rightArmAngle = -1.1 + Math.sin(p * Math.PI) * 0.6;
      if (p >= 1) {
        this.animState = 'idle';
      }
    }
  }

  draw(ctx, x, y, facingDir = 'down', scale = 3.6, equipment = {}, cloakColor = '#8b2626', isCombat = false) {
    this.update(isCombat);

    ctx.save();
    ctx.translate(x + this.joints.lungeX, y + this.joints.hipY);

    const s = scale / 3.6;

    // 1. Ground Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(0, 4 * s, 18 * s, 7 * s, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Flowing Cloak (Behind Hero)
    ctx.save();
    ctx.rotate(this.joints.cloakSway);
    ctx.fillStyle = cloakColor || '#8b2626';
    ctx.beginPath();
    ctx.moveTo(-10 * s, -24 * s);
    ctx.lineTo(10 * s, -24 * s);
    ctx.lineTo(16 * s + Math.sin(this.joints.cloakSway) * 6, 2 * s);
    ctx.lineTo(-16 * s + Math.sin(this.joints.cloakSway) * 6, 2 * s);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();

    // 3. Left Leg & Right Leg
    ctx.save();
    ctx.rotate(this.joints.leftLegAngle);
    ctx.fillStyle = '#3a2e2b';
    ctx.fillRect(-7 * s, -10 * s, 5 * s, 12 * s);
    ctx.fillStyle = '#1e1614';
    ctx.fillRect(-8 * s, 0, 7 * s, 4 * s);
    ctx.restore();

    ctx.save();
    ctx.rotate(this.joints.rightLegAngle);
    ctx.fillStyle = '#3a2e2b';
    ctx.fillRect(2 * s, -10 * s, 5 * s, 12 * s);
    ctx.fillStyle = '#1e1614';
    ctx.fillRect(1 * s, 0, 7 * s, 4 * s);
    ctx.restore();

    // 4. Torso & Armor Cuirass (with Torso Tilt during attack lunge)
    ctx.save();
    ctx.rotate(this.joints.torsoTilt);

    const armorId = equipment.armor ? equipment.armor.id : '';

    if (armorId.includes('plate')) {
      // Knight's Steel Plate Mail
      ctx.fillStyle = '#b0c4de';
      ctx.fillRect(-10 * s, -28 * s, 20 * s, 18 * s);
      ctx.fillStyle = '#d4af37'; // Gold Trim
      ctx.fillRect(-10 * s, -28 * s, 20 * s, 3 * s);
      ctx.fillStyle = '#708090'; // Steel Plate Lines
      ctx.fillRect(-6 * s, -22 * s, 12 * s, 10 * s);
    } else if (armorId.includes('mage') || armorId.includes('robe')) {
      // Arch-Mage Arcane Robes
      ctx.fillStyle = '#1d5ec9';
      ctx.fillRect(-11 * s, -28 * s, 22 * s, 22 * s);
      ctx.fillStyle = '#f4be42'; // Gold Rune Sash
      ctx.fillRect(-2 * s, -28 * s, 4 * s, 22 * s);
    } else if (armorId.includes('thief') || armorId.includes('shadow')) {
      // Shadow Thief Tunic
      ctx.fillStyle = '#1c1524';
      ctx.fillRect(-10 * s, -28 * s, 20 * s, 18 * s);
      ctx.fillStyle = '#a83232'; // Red Leather Straps
      ctx.fillRect(-8 * s, -24 * s, 16 * s, 2 * s);
    } else if (equipment.armor) {
      // Sturdy Boiled Leather Cuirass
      ctx.fillStyle = '#8c5a14';
      ctx.fillRect(-10 * s, -28 * s, 20 * s, 18 * s);
      ctx.fillStyle = '#d4af37'; // Brass Studs
      ctx.fillRect(-7 * s, -24 * s, 3 * s, 3 * s);
      ctx.fillRect(4 * s, -24 * s, 3 * s, 3 * s);
    } else {
      // Default Traveler Linen Tunic
      ctx.fillStyle = '#523b2b';
      ctx.fillRect(-10 * s, -28 * s, 20 * s, 18 * s);
    }

    // Leather Belt & Buckle
    ctx.fillStyle = '#291e14';
    ctx.fillRect(-10 * s, -13 * s, 20 * s, 4 * s);
    ctx.fillStyle = '#d4af37';
    ctx.fillRect(-3 * s, -14 * s, 6 * s, 6 * s);

    // Sheathed Scabbard on Hip during Exploration Mode
    if (!isCombat) {
      ctx.fillStyle = '#4a3525';
      ctx.fillRect(-13 * s, -16 * s, 4 * s, 18 * s); // Scabbard
      ctx.fillStyle = '#d4af37';
      ctx.fillRect(-14 * s, -18 * s, 6 * s, 3 * s); // Gold Guard
    }

    // 5. Left Arm & Shield
    ctx.save();
    ctx.translate(-10 * s, -26 * s);
    ctx.rotate(this.joints.leftArmAngle);
    ctx.fillStyle = '#6b4f38';
    ctx.fillRect(-3 * s, 0, 5 * s, 14 * s);

    if (equipment.shield && isCombat) {
      const shieldId = equipment.shield.id;
      if (shieldId && shieldId.includes('paladin')) {
        // Gold Kite Shield
        ctx.fillStyle = '#d4af37';
        ctx.beginPath();
        ctx.moveTo(-10 * s, 0);
        ctx.lineTo(2 * s, 0);
        ctx.lineTo(0, 18 * s);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#a83232'; // Red Cross
        ctx.lineWidth = 2 * s;
        ctx.stroke();
      } else {
        // Timber Round Shield
        ctx.fillStyle = '#6b4f38';
        ctx.beginPath();
        ctx.arc(-4 * s, 10 * s, 10 * s, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#708090'; // Steel Rim
        ctx.lineWidth = 2 * s;
        ctx.stroke();
        ctx.fillStyle = '#d4af37'; // Boss
        ctx.beginPath();
        ctx.arc(-4 * s, 10 * s, 3 * s, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();

    // 6. Right Arm & Equipped Weapon (Drawn in Combat, Sheathed in Exploration)
    ctx.save();
    ctx.translate(10 * s, -26 * s);
    ctx.rotate(this.joints.rightArmAngle);
    
    // Arm Sleeve
    ctx.fillStyle = '#6b4f38';
    ctx.fillRect(-2 * s, 0, 5 * s, 14 * s);

    // Hand
    ctx.fillStyle = '#f5c999';
    ctx.beginPath();
    ctx.arc(0.5 * s, 15 * s, 3 * s, 0, Math.PI * 2);
    ctx.fill();

    // Only draw weapon in hand during Combat Mode or Attack
    if (isCombat || this.animState === 'attack_melee') {
      const weaponId = equipment.weapon ? equipment.weapon.id : 'iron_sword';
      
      if (weaponId.includes('wand') || weaponId.includes('staff')) {
        // Arcane Staff with Glowing Crystal Tip
        ctx.fillStyle = '#5c4028';
        ctx.fillRect(-1 * s, 5 * s, 3 * s, 36 * s);
        ctx.fillStyle = '#00e5ff'; // Glowing Mana Gem
        ctx.shadowColor = '#00e5ff';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(0.5 * s, 2 * s, 5 * s, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      } else {
        // Steel Metallic Broadsword
        ctx.fillStyle = '#d4af37'; // Crossguard
        ctx.fillRect(-6 * s, 14 * s, 13 * s, 3 * s);

        ctx.fillStyle = '#e6f2ff'; // Steel Blade
        ctx.beginPath();
        ctx.moveTo(-2.5 * s, 17 * s);
        ctx.lineTo(3.5 * s, 17 * s);
        ctx.lineTo(1 * s, 48 * s);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#ffffff'; // Edge Highlight
        ctx.lineWidth = 1.2 * s;
        ctx.stroke();

        ctx.strokeStyle = '#a6b8c7'; // Fuller Line
        ctx.lineWidth = 1 * s;
        ctx.beginPath();
        ctx.moveTo(0.5 * s, 17 * s);
        ctx.lineTo(0.5 * s, 44 * s);
        ctx.stroke();
      }

      // Render Glowing Slash Arc Trail during Melee Attack Arc
      if (this.animState === 'attack_melee') {
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 235, 120, 0.95)';
        ctx.lineWidth = 6 * s;
        ctx.shadowColor = '#f4be42';
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.arc(0, 24 * s, 32 * s, -Math.PI * 0.6, Math.PI * 0.5);
        ctx.stroke();
        ctx.restore();
      }
    }

    ctx.restore(); // End Right Arm

    // 7. Head & Helmet/Headgear
    ctx.save();
    ctx.rotate(this.joints.headTilt);
    ctx.fillStyle = '#f5c999'; // Skin
    ctx.beginPath();
    ctx.arc(0, -34 * s, 9 * s, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#222';
    ctx.fillRect(2 * s, -35 * s, 2 * s, 2 * s);

    const headId = equipment.head ? equipment.head.id : '';

    if (headId.includes('helm') || headId.includes('iron')) {
      // Metallic Iron Helmet Visor
      ctx.fillStyle = '#708090';
      ctx.beginPath();
      ctx.arc(0, -35 * s, 10 * s, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = '#d4af37'; // Crest Band
      ctx.fillRect(-10 * s, -35 * s, 20 * s, 3 * s);
    } else if (headId.includes('wizard') || headId.includes('hood')) {
      // Conical Wizard Hat
      ctx.fillStyle = '#1d5ec9';
      ctx.beginPath();
      ctx.moveTo(-12 * s, -34 * s);
      ctx.lineTo(12 * s, -34 * s);
      ctx.lineTo(0, -52 * s);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#f4be42';
      ctx.beginPath();
      ctx.arc(0, -42 * s, 3 * s, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Hero Hair & Leather Headband
      ctx.fillStyle = '#8b4513';
      ctx.beginPath();
      ctx.arc(0, -37 * s, 9 * s, Math.PI, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#d4af37'; // Headband
      ctx.fillRect(-9 * s, -37 * s, 18 * s, 2 * s);
    }
    ctx.restore(); // End Head

    ctx.restore(); // End Torso Tilt
    ctx.restore(); // End Root
  }
}
