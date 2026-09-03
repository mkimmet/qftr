import { synth } from './SoundSynth.js';

export class SkeletalPaperdoll {
  constructor(gameEngine) {
    this.gameEngine = gameEngine;
    this.animState = 'idle'; // 'idle' | 'walk' | 'attack_melee' | 'cast_spell' | 'hit_recoil'
    this.animTime = 0;
    this.attackStartTime = 0;
    this.attackDuration = 380; // ms for full slash arc
    this.onAttackHitCallback = null;

    // Joint Angles & Offsets for 2-Segment Limb & Spine Kinematics!
    this.joints = {
      hipY: 0,
      spineAngle: 0,
      torsoTilt: 0,
      headTilt: 0,
      leftArmAngle: 0,
      leftElbowAngle: 0.35,
      rightArmAngle: -1.1,
      rightElbowAngle: 0.55,
      leftLegAngle: 0,
      leftKneeAngle: 0.25,
      rightLegAngle: 0,
      rightKneeAngle: 0.25,
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

  update(isCombat = false, isManualPose = false) {
    if (isManualPose) return;

    const now = Date.now();
    const elapsed = now - this.animTime;
    const t = elapsed * 0.005;

    if (this.animState === 'idle') {
      this.joints.lungeX = 0;
      this.joints.torsoTilt = 0;
      this.joints.hipY = 0; // Feet stay firmly anchored to the floor shadow (No Floating!)
      this.joints.spineAngle = Math.sin(t * 1.5) * 0.02; // Subtle chest breathing
      this.joints.headTilt = Math.sin(t * 1.2) * 0.03;
      this.joints.leftLegAngle = 0;
      this.joints.rightLegAngle = 0;
      this.joints.leftKneeAngle = 0.05;
      this.joints.rightKneeAngle = 0.05;
      this.joints.cloakSway = Math.sin(t * 1.8) * 0.06;

      if (isCombat) {
        this.joints.rightArmAngle = -1.2 + Math.sin(t * 2) * 0.04;
        this.joints.rightElbowAngle = 0.65 + Math.sin(t * 2) * 0.05;
        this.joints.leftArmAngle = -0.4 + Math.cos(t * 2) * 0.04;
        this.joints.leftElbowAngle = 0.45 + Math.cos(t * 2) * 0.05;
      } else {
        this.joints.rightArmAngle = Math.cos(t * 1.5) * 0.04;
        this.joints.rightElbowAngle = 0.25 + Math.cos(t * 1.5) * 0.03;
        this.joints.leftArmAngle = Math.sin(t * 1.5) * 0.04;
        this.joints.leftElbowAngle = 0.25 + Math.sin(t * 1.5) * 0.03;
      }
    } else if (this.animState === 'walk') {
      this.joints.lungeX = 0;
      this.joints.torsoTilt = 0;
      this.joints.spineAngle = Math.sin(t * 6) * 0.06;
      this.joints.hipY = Math.abs(Math.sin(t * 6)) * -3;
      this.joints.headTilt = Math.sin(t * 6) * 0.04;

      this.joints.leftLegAngle = Math.sin(t * 6) * 0.45;
      this.joints.leftKneeAngle = Math.max(0.05, Math.sin(t * 6 + 0.4) * 0.55);
      this.joints.rightLegAngle = -Math.sin(t * 6) * 0.45;
      this.joints.rightKneeAngle = Math.max(0.05, -Math.sin(t * 6 + 0.4) * 0.55);
      this.joints.cloakSway = Math.sin(t * 6) * 0.25;

      if (isCombat) {
        this.joints.rightArmAngle = -1.1 + Math.sin(t * 6) * 0.15;
        this.joints.rightElbowAngle = 0.55 + Math.sin(t * 6) * 0.2;
        this.joints.leftArmAngle = -0.4 - Math.sin(t * 6) * 0.15;
        this.joints.leftElbowAngle = 0.45 - Math.sin(t * 6) * 0.2;
      } else {
        this.joints.leftArmAngle = -Math.sin(t * 6) * 0.35;
        this.joints.leftElbowAngle = 0.35 + Math.abs(Math.sin(t * 6)) * 0.35;
        this.joints.rightArmAngle = Math.sin(t * 6) * 0.35;
        this.joints.rightElbowAngle = 0.35 + Math.abs(Math.cos(t * 6)) * 0.35;
      }
    } else if (this.animState === 'attack_melee') {
      const attackProgress = Math.min(1, (now - this.attackStartTime) / this.attackDuration);
      
      if (attackProgress < 0.20) {
        const p = attackProgress / 0.20;
        this.joints.spineAngle = -0.18 * p;
        this.joints.rightArmAngle = -1.1 - 0.7 * p;
        this.joints.rightElbowAngle = 0.55 + 0.7 * p;
        this.joints.torsoTilt = -0.2 * p;
        this.joints.lungeX = -4 * p;
        this.joints.hipY = 2 * p;
      } else if (attackProgress < 0.60) {
        const p = (attackProgress - 0.20) / 0.40;
        this.joints.spineAngle = -0.18 + 0.5 * p;
        this.joints.rightArmAngle = -1.8 + 3.4 * p;
        this.joints.rightElbowAngle = 1.25 - 1.1 * p;
        this.joints.torsoTilt = -0.2 + 0.5 * p;
        this.joints.lungeX = -4 + 18 * Math.sin(p * Math.PI);
        this.joints.hipY = -4 * Math.sin(p * Math.PI);

        if (p >= 0.5 && this.onAttackHitCallback) {
          const cb = this.onAttackHitCallback;
          this.onAttackHitCallback = null;
          cb();
        }
      } else {
        const p = (attackProgress - 0.60) / 0.40;
        this.joints.spineAngle = 0.32 * (1 - p);
        this.joints.rightArmAngle = 1.6 - 2.7 * p;
        this.joints.rightElbowAngle = 0.15 + 0.4 * p;
        this.joints.torsoTilt = 0.3 * (1 - p);
        this.joints.lungeX = 14 * (1 - p);
        this.joints.hipY = 0;
      }

      if (attackProgress >= 1) {
        this.animState = 'idle';
      }
    } else if (this.animState === 'cast_spell') {
      this.joints.lungeX = 0;
      this.joints.spineAngle = -0.1;
      this.joints.rightArmAngle = -1.5;
      this.joints.rightElbowAngle = 0.3;
      this.joints.leftArmAngle = -1.0;
      this.joints.leftElbowAngle = 0.5;
      this.joints.hipY = -3;
      this.joints.headTilt = -0.15;
      if (elapsed > 500) {
        this.animState = 'idle';
      }
    } else if (this.animState === 'hit_recoil') {
      const p = Math.min(1, elapsed / 300);
      this.joints.lungeX = -8 * Math.sin(p * Math.PI);
      this.joints.spineAngle = -0.25 * Math.sin(p * Math.PI);
      this.joints.hipY = Math.sin(p * Math.PI) * 6;
      this.joints.headTilt = Math.sin(p * Math.PI) * 0.25;
      this.joints.rightArmAngle = -1.1 + Math.sin(p * Math.PI) * 0.6;
      this.joints.rightElbowAngle = 0.5 + Math.sin(p * Math.PI) * 0.4;
      if (p >= 1) {
        this.animState = 'idle';
      }
    }
  }

  draw(ctx, x, y, facingDir = 'down', scale = 3.6, equipment = {}, cloakColor = '#8b2626', isCombat = false, isManualPose = false) {
    this.update(isCombat, isManualPose);

    this.joints.lungeX = Number(this.joints.lungeX) || 0;
    this.joints.hipY = Number(this.joints.hipY) || 0;
    this.joints.spineAngle = Number(this.joints.spineAngle) || 0;
    this.joints.cloakSway = Number(this.joints.cloakSway) || 0;
    this.joints.torsoTilt = Number(this.joints.torsoTilt) || 0;
    this.joints.headTilt = Number(this.joints.headTilt) || 0;
    this.joints.leftArmAngle = Number(this.joints.leftArmAngle) || 0;
    this.joints.leftElbowAngle = Number(this.joints.leftElbowAngle) || 0;
    this.joints.rightArmAngle = Number(this.joints.rightArmAngle) || 0;
    this.joints.rightElbowAngle = Number(this.joints.rightElbowAngle) || 0;
    this.joints.leftLegAngle = Number(this.joints.leftLegAngle) || 0;
    this.joints.leftKneeAngle = Number(this.joints.leftKneeAngle) || 0;
    this.joints.rightLegAngle = Number(this.joints.rightLegAngle) || 0;
    this.joints.rightKneeAngle = Number(this.joints.rightKneeAngle) || 0;

    ctx.save();
    ctx.translate(x + this.joints.lungeX, y + this.joints.hipY);

    const s = scale / 3.6;

    const getEqId = (item) => {
      if (!item) return '';
      if (typeof item === 'string') return item;
      return item.id || '';
    };

    // 0. Ambient Heroic Class Aura (Behind Hero)
    const auraPulse = Math.sin(Date.now() * 0.003) * 3 * s;
    const auraGrad = ctx.createRadialGradient(0, -18 * s, 4 * s, 0, -18 * s, (24 + auraPulse) * s);
    const armorIdForAura = getEqId(equipment.armor);

    if (armorIdForAura.includes('mage') || armorIdForAura.includes('robe')) {
      auraGrad.addColorStop(0, 'rgba(0, 229, 255, 0.45)');
      auraGrad.addColorStop(1, 'rgba(0, 229, 255, 0.0)');
    } else if (armorIdForAura.includes('thief') || armorIdForAura.includes('shadow')) {
      auraGrad.addColorStop(0, 'rgba(168, 50, 220, 0.45)');
      auraGrad.addColorStop(1, 'rgba(168, 50, 220, 0.0)');
    } else {
      auraGrad.addColorStop(0, 'rgba(255, 215, 0, 0.40)');
      auraGrad.addColorStop(1, 'rgba(255, 215, 0, 0.0)');
    }

    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.arc(0, -18 * s, (24 + auraPulse) * s, 0, Math.PI * 2);
    ctx.fill();

    // 1. Ground Shadow (Layered Radial Blur)
    const shadowGrad = ctx.createRadialGradient(0, 4 * s, 2 * s, 0, 4 * s, 18 * s);
    shadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0.55)');
    shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0.0)');
    ctx.fillStyle = shadowGrad;
    ctx.beginPath();
    ctx.ellipse(0, 4 * s, 18 * s, 7 * s, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. High-Poly Layered Flowing Cloak (Only drawn if Cape is equipped!)
    const capeItem = equipment.cape;
    if (capeItem) {
      ctx.save();
      ctx.rotate(this.joints.cloakSway);
      const cloakBaseColor = capeItem.color || cloakColor || '#8b2626';
      const cloakGrad = ctx.createLinearGradient(-15 * s, -24 * s, 15 * s, -4 * s);
      cloakGrad.addColorStop(0, cloakBaseColor);
      cloakGrad.addColorStop(0.5, '#4a1212');
      cloakGrad.addColorStop(1, '#1e0707');

      ctx.fillStyle = cloakGrad;
      ctx.beginPath();
      ctx.moveTo(-11 * s, -24 * s);
      ctx.lineTo(11 * s, -24 * s);
      ctx.bezierCurveTo(18 * s + Math.sin(this.joints.cloakSway) * 4, -15 * s, 19 * s + Math.sin(this.joints.cloakSway) * 5, -8 * s, 13 * s + Math.sin(this.joints.cloakSway) * 4, -4 * s);
      ctx.lineTo(-13 * s + Math.sin(this.joints.cloakSway) * 4, -4 * s);
      ctx.bezierCurveTo(-19 * s + Math.sin(this.joints.cloakSway) * 5, -8 * s, -18 * s + Math.sin(this.joints.cloakSway) * 4, -15 * s, -11 * s, -24 * s);
      ctx.closePath();
      ctx.fill();

      // Cloak Gold Embroidery Hem & Fold Folds
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 1.2 * s;
      ctx.stroke();

      ctx.strokeStyle = 'rgba(0,0,0,0.35)';
      ctx.lineWidth = 1.5 * s;
      ctx.beginPath();
      ctx.moveTo(0, -22 * s);
      ctx.lineTo(Math.sin(this.joints.cloakSway) * 3, -4 * s);
      ctx.stroke();
      ctx.restore();
    }

    // 3. High-Poly 2-Segment Articulated Legs (Pants Slot vs Bare Skin)
    const pantsItem = equipment.pants;
    const shoesItem = equipment.shoes;

    // Left Leg
    ctx.save();
    ctx.translate(-5 * s, -10 * s);
    ctx.rotate(this.joints.leftLegAngle);

    const legGrad1 = ctx.createLinearGradient(-3 * s, 0, 3 * s, 7 * s);
    if (pantsItem) {
      const pantsColor = equipment.pantsColor || (pantsItem.id && pantsItem.id.includes('robe') ? '#1d5ec9' : '#3a2e2b');
      legGrad1.addColorStop(0, pantsColor);
      legGrad1.addColorStop(1, '#1c1513');
    } else {
      // 👙 BARE SKIN LEGS (NO PANTS)
      legGrad1.addColorStop(0, '#ffdfb8');
      legGrad1.addColorStop(0.6, '#f5c999');
      legGrad1.addColorStop(1, '#d89b65');
    }

    ctx.fillStyle = legGrad1;
    ctx.beginPath();
    ctx.moveTo(-3 * s, 0);
    ctx.lineTo(2.5 * s, 0);
    ctx.lineTo(2 * s, 7 * s);
    ctx.lineTo(-3 * s, 7 * s);
    ctx.closePath();
    ctx.fill();

    // Knee Hinge & Poleyn Cap
    ctx.translate(0, 7 * s);
    ctx.rotate(this.joints.leftKneeAngle || 0);
    if (pantsItem || shoesItem) {
      ctx.fillStyle = '#6e7b85';
      ctx.beginPath();
      ctx.arc(-0.5 * s, 0, 3.2 * s, 0, Math.PI * 2);
      ctx.fill();
    }

    // Lower Shin & Shoes Slot (Riding Boots vs Bare Feet)
    if (shoesItem) {
      const shoeColor = (shoesItem.id && shoesItem.id.includes('steel')) ? '#8a9aa8' : '#2c221e';
      ctx.fillStyle = shoeColor;
      ctx.fillRect(-3 * s, 0, 5.5 * s, 7 * s);
      ctx.fillStyle = '#6e7b85';
      ctx.fillRect(-3.5 * s, 3.5 * s, 6.5 * s, 3.5 * s);
      ctx.fillStyle = '#d4af37';
      ctx.fillRect(-3.5 * s, 6 * s, 6.5 * s, 1.2 * s);
    } else {
      // 🦶 BARE FEET
      ctx.fillStyle = legGrad1;
      ctx.fillRect(-3 * s, 0, 5.5 * s, 7 * s);
      ctx.fillStyle = '#ebba85'; // Toes
      ctx.fillRect(-3.5 * s, 5 * s, 6.5 * s, 2.5 * s);
    }
    ctx.restore();

    // Right Leg
    ctx.save();
    ctx.translate(5 * s, -10 * s);
    ctx.rotate(this.joints.rightLegAngle);
    ctx.fillStyle = legGrad1;
    ctx.beginPath();
    ctx.moveTo(-2.5 * s, 0);
    ctx.lineTo(3 * s, 0);
    ctx.lineTo(3 * s, 7 * s);
    ctx.lineTo(-2 * s, 7 * s);
    ctx.closePath();
    ctx.fill();

    // Knee Hinge
    ctx.translate(0, 7 * s);
    ctx.rotate(this.joints.rightKneeAngle || 0);
    if (pantsItem || shoesItem) {
      ctx.fillStyle = '#6e7b85';
      ctx.beginPath();
      ctx.arc(0.5 * s, 0, 3.2 * s, 0, Math.PI * 2);
      ctx.fill();
    }

    // Lower Shin & Shoes Slot
    if (shoesItem) {
      const shoeColor = (shoesItem.id && shoesItem.id.includes('steel')) ? '#8a9aa8' : '#2c221e';
      ctx.fillStyle = shoeColor;
      ctx.fillRect(-2.5 * s, 0, 5.5 * s, 7 * s);
      ctx.fillStyle = '#6e7b85';
      ctx.fillRect(-3 * s, 3.5 * s, 6.5 * s, 3.5 * s);
      ctx.fillStyle = '#d4af37';
      ctx.fillRect(-3 * s, 6 * s, 6.5 * s, 1.2 * s);
    } else {
      // 🦶 BARE FEET
      ctx.fillStyle = legGrad1;
      ctx.fillRect(-2.5 * s, 0, 5.5 * s, 7 * s);
      ctx.fillStyle = '#ebba85'; // Toes
      ctx.fillRect(-3 * s, 5 * s, 6.5 * s, 2.5 * s);
    }
    ctx.restore();

    // 4. Articulated Spinal Column & Torso (Shirt, Cowl, Belt, Amulet)
    ctx.save();
    ctx.rotate((this.joints.spineAngle || 0) + this.joints.torsoTilt);

    // Cowl Slot (Renders under shoulders)
    const cowlItem = equipment.cowl;
    if (cowlItem) {
      ctx.fillStyle = '#1c1524';
      ctx.beginPath();
      ctx.arc(0, -28 * s, 13 * s, 0, Math.PI);
      ctx.fill();
    }

    const shirtItem = equipment.shirt || equipment.armor;
    const shirtId = getEqId(shirtItem);

    if (!shirtId || shirtId === 'none' || shirtId === 'naked' || shirtId === 'underwear') {
      // 👙 BASE UNDERWEAR & SKIN CHEST LAYER
      const skinTorsoGrad = ctx.createLinearGradient(-10 * s, -28 * s, 10 * s, -10 * s);
      skinTorsoGrad.addColorStop(0, '#ffdfb8');
      skinTorsoGrad.addColorStop(0.6, '#f5c999');
      skinTorsoGrad.addColorStop(1, '#d89b65');

      ctx.fillStyle = skinTorsoGrad;
      ctx.beginPath();
      ctx.moveTo(-10 * s, -28 * s);
      ctx.lineTo(10 * s, -28 * s);
      ctx.lineTo(8 * s, -10 * s);
      ctx.lineTo(-8 * s, -10 * s);
      ctx.closePath();
      ctx.fill();

      // Pectoral Contour Shading
      ctx.strokeStyle = 'rgba(180, 110, 60, 0.35)';
      ctx.lineWidth = 1.2 * s;
      ctx.beginPath();
      ctx.moveTo(-7 * s, -22 * s);
      ctx.quadraticCurveTo(0, -19 * s, 7 * s, -22 * s);
      ctx.moveTo(0, -28 * s);
      ctx.lineTo(0, -13 * s);
      ctx.stroke();

      // Medieval Underwear / Shorts
      const underColor = equipment.underColor || '#2b221a';
      ctx.fillStyle = underColor;
      ctx.fillRect(-9 * s, -14 * s, 18 * s, 8 * s);
      ctx.fillStyle = '#ffd700';
      ctx.fillRect(-9 * s, -14 * s, 18 * s, 1.8 * s);
      ctx.fillRect(-1 * s, -13 * s, 2 * s, 3 * s);
    } else if (shirtId.includes('plate') || shirtId.includes('breastplate')) {
      // Knight Steel Breastplate
      const plateGrad = ctx.createLinearGradient(-11 * s, -28 * s, 11 * s, -10 * s);
      plateGrad.addColorStop(0, '#e6f2ff');
      plateGrad.addColorStop(0.4, '#b0c4de');
      plateGrad.addColorStop(0.8, '#5b6b7a');
      plateGrad.addColorStop(1, '#2c353f');

      ctx.fillStyle = plateGrad;
      ctx.beginPath();
      ctx.moveTo(-11 * s, -28 * s);
      ctx.lineTo(11 * s, -28 * s);
      ctx.lineTo(9 * s, -10 * s);
      ctx.lineTo(-9 * s, -10 * s);
      ctx.closePath();
      ctx.fill();

      // Beveled Chest Armor Ridge
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5 * s;
      ctx.beginPath();
      ctx.moveTo(0, -27 * s);
      ctx.lineTo(0, -11 * s);
      ctx.stroke();

      ctx.fillStyle = '#d4af37';
      ctx.fillRect(-11 * s, -28 * s, 22 * s, 3 * s);
    } else {
      // Linen Undershirt / Tunic
      const tunicColor = equipment.tunicColor || '#8c5a14';
      const shirtGrad = ctx.createLinearGradient(-11 * s, -28 * s, 11 * s, -10 * s);
      shirtGrad.addColorStop(0, tunicColor);
      shirtGrad.addColorStop(1, '#291b07');

      ctx.fillStyle = shirtGrad;
      ctx.beginPath();
      ctx.moveTo(-11 * s, -28 * s);
      ctx.lineTo(11 * s, -28 * s);
      ctx.lineTo(9 * s, -10 * s);
      ctx.lineTo(-9 * s, -10 * s);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#ffd700';
      ctx.beginPath();
      ctx.arc(-7 * s, -22 * s, 1.8 * s, 0, Math.PI * 2);
      ctx.arc(7 * s, -22 * s, 1.8 * s, 0, Math.PI * 2);
      ctx.fill();
    }

    // Amulet Slot (Necklace & Pendant)
    const amuletItem = equipment.amulet;
    if (amuletItem) {
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 1.2 * s;
      ctx.beginPath();
      ctx.arc(0, -26 * s, 6 * s, 0.2, Math.PI - 0.2);
      ctx.stroke();

      const gemColor = (amuletItem.id && amuletItem.id.includes('sapphire')) ? '#00e5ff' : '#ff2244';
      ctx.fillStyle = gemColor;
      ctx.shadowColor = gemColor;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(0, -20 * s, 2.5 * s, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // Belt Slot (Leather Belt & Beveled Buckle - Only if equipped!)
    const beltItem = equipment.belt;
    if (beltItem) {
      ctx.fillStyle = '#291e14';
      ctx.fillRect(-10 * s, -13 * s, 20 * s, 4.5 * s);

      ctx.fillStyle = '#ffd700';
      ctx.fillRect(-3.5 * s, -14.5 * s, 7 * s, 7 * s);
      ctx.fillStyle = '#291e14';
      ctx.fillRect(-2 * s, -13 * s, 4 * s, 4 * s);
    }

    // Baldric Slot (Over-the-Shoulder Sash - Only if equipped!)
    if (equipment.baldric) {
      ctx.save();
      const baldricColor = equipment.baldric.color || '#b82531';
      ctx.strokeStyle = baldricColor;
      ctx.lineWidth = 4 * s;
      ctx.beginPath();
      ctx.moveTo(8 * s, -27 * s);
      ctx.lineTo(-9 * s, -11 * s);
      ctx.stroke();
      ctx.restore();
    }

    // Sheathed Scabbard on Hip during Exploration Mode (Only if Weapon is equipped!)
    if (!isCombat && equipment.weapon) {
      ctx.fillStyle = '#3a271a';
      ctx.fillRect(-13.5 * s, -16 * s, 4.5 * s, 20 * s);
      ctx.fillStyle = '#ffd700';
      ctx.fillRect(-14.5 * s, -18 * s, 6.5 * s, 3.5 * s);
    }

    // 5. High-Poly 2-Segment Left Arm & Shield (Shirt Sleeve vs Bare Arm)
    ctx.save();
    ctx.translate(-10 * s, -26 * s); // Left Shoulder Pivot
    ctx.rotate(this.joints.leftArmAngle);
    
    const armSkinColor = '#f5c999';
    const armSleeveColor = shirtItem ? (equipment.tunicColor || '#6b4f38') : armSkinColor;
    
    ctx.fillStyle = armSleeveColor;
    ctx.fillRect(-3 * s, 0, 5.5 * s, 7 * s);

    // Elbow Pivot & Steel Elbow Cap
    ctx.translate(0, 7 * s); // Left Elbow Pivot!
    ctx.rotate(this.joints.leftElbowAngle || 0);
    if (shirtItem) {
      ctx.fillStyle = '#5b6b7a';
      ctx.beginPath();
      ctx.arc(0, 0, 2.8 * s, 0, Math.PI * 2);
      ctx.fill();
    }

    // Forearm (Sleeve/Vambrace vs Bare Forearm)
    ctx.fillStyle = shirtItem ? '#4a3525' : armSkinColor;
    ctx.fillRect(-2.5 * s, 0, 5 * s, 7 * s);

    if (equipment.shield && isCombat) {
      const shieldId = getEqId(equipment.shield);
      if (shieldId && shieldId.includes('paladin')) {
        // High-Poly Paladin Gold Kite Shield
        const shieldGrad = ctx.createLinearGradient(-11 * s, 0, 3 * s, 20 * s);
        shieldGrad.addColorStop(0, '#ffe57f');
        shieldGrad.addColorStop(0.5, '#d4af37');
        shieldGrad.addColorStop(1, '#8c6d17');

        ctx.fillStyle = shieldGrad;
        ctx.beginPath();
        ctx.moveTo(-11 * s, 0);
        ctx.lineTo(3 * s, 0);
        ctx.lineTo(1 * s, 10 * s);
        ctx.lineTo(-4 * s, 20 * s);
        ctx.lineTo(-9 * s, 10 * s);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#a83232'; // Red Cross Emblem
        ctx.lineWidth = 2.5 * s;
        ctx.stroke();
      } else {
        // Timber Round Shield
        ctx.fillStyle = '#6b4f38';
        ctx.beginPath();
        ctx.arc(-4 * s, 10 * s, 11 * s, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#8a9aa8';
        ctx.lineWidth = 2.2 * s;
        ctx.stroke();
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(-4 * s, 10 * s, 3.5 * s, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();

    // 6. High-Poly 2-Segment Right Arm & Weapon (Shirt Sleeve vs Bare Arm)
    ctx.save();
    ctx.translate(10 * s, -26 * s); // Right Shoulder Pivot
    ctx.rotate(this.joints.rightArmAngle);
    
    ctx.fillStyle = armSleeveColor;
    ctx.fillRect(-2.5 * s, 0, 5.5 * s, 7 * s);

    // Elbow Pivot & Steel Elbow Cap
    ctx.translate(0, 7 * s); // Right Elbow Pivot!
    ctx.rotate(this.joints.rightElbowAngle || 0);
    if (shirtItem) {
      ctx.fillStyle = '#5b6b7a';
      ctx.beginPath();
      ctx.arc(0, 0, 2.8 * s, 0, Math.PI * 2);
      ctx.fill();
    }

    // Forearm Vambrace Gauntlet vs Bare Forearm
    ctx.fillStyle = shirtItem ? '#5b6b7a' : armSkinColor;
    ctx.fillRect(-2.5 * s, 0, 5.5 * s, 7 * s);

    // Hand Gauntlet
    ctx.fillStyle = '#f5c999';
    ctx.beginPath();
    ctx.arc(0.2 * s, 8 * s, 3.2 * s, 0, Math.PI * 2);
    ctx.fill();

    // Weapon in hand during Combat Mode
    if (isCombat || this.animState === 'attack_melee') {
      const weaponId = getEqId(equipment.weapon) || 'iron_sword';
      
      if (weaponId.includes('wand') || weaponId.includes('staff')) {
        // Arcane Staff with Swirling Glowing Mana Crystal
        ctx.fillStyle = '#4a321d';
        ctx.fillRect(-1.5 * s, 5 * s, 3.5 * s, 38 * s);
        
        ctx.fillStyle = '#00e5ff';
        ctx.shadowColor = '#00e5ff';
        ctx.shadowBlur = 16;
        ctx.beginPath();
        ctx.arc(0.2 * s, 2 * s, 6 * s, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      } else {
        // Legendary Double-Edged Beveled Steel Broadsword
        // Golden Crossguard with Gem Core
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(-7 * s, 13.5 * s, 15 * s, 3.5 * s);

        ctx.fillStyle = '#ff2244'; // Glowing Ruby Gem
        ctx.beginPath();
        ctx.arc(0.5 * s, 15.2 * s, 2 * s, 0, Math.PI * 2);
        ctx.fill();

        // Shaded Double-Edged Blade
        ctx.fillStyle = '#ffffff'; // Light Blade Side
        ctx.beginPath();
        ctx.moveTo(0.5 * s, 17 * s);
        ctx.lineTo(3.5 * s, 17 * s);
        ctx.lineTo(0.5 * s, 50 * s);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#b0c4de'; // Shaded Blade Side
        ctx.beginPath();
        ctx.moveTo(-2.5 * s, 17 * s);
        ctx.lineTo(0.5 * s, 17 * s);
        ctx.lineTo(0.5 * s, 50 * s);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#ffffff'; // Blade Specular Edge Highlight
        ctx.lineWidth = 1.2 * s;
        ctx.stroke();

        ctx.strokeStyle = '#4b5b6b'; // Center Fuller Groove
        ctx.lineWidth = 1 * s;
        ctx.beginPath();
        ctx.moveTo(0.5 * s, 17 * s);
        ctx.lineTo(0.5 * s, 44 * s);
        ctx.stroke();

        // Floating Weapon Mana Sparkles (60 FPS)
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#ffe57f';
        ctx.shadowBlur = 8;
        for (let i = 0; i < 3; i++) {
          const spX = Math.sin(Date.now() * 0.008 + i * 2) * 6 * s;
          const spY = 30 * s - ((Date.now() * 0.02 + i * 15) % (25 * s));
          ctx.beginPath();
          ctx.arc(spX, spY, (1.2 + Math.sin(Date.now() * 0.01 + i) * 0.5) * s, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.shadowBlur = 0;
      }

      // Render Glowing Slash Arc Trail during Melee Attack Arc
      if (this.animState === 'attack_melee') {
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 235, 120, 0.95)';
        ctx.lineWidth = 7 * s;
        ctx.shadowColor = '#f4be42';
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(0, 24 * s, 34 * s, -Math.PI * 0.6, Math.PI * 0.5);
        ctx.stroke();
        ctx.restore();
      }
    }

    ctx.restore(); // End Right Arm

    // 7. High-Poly 3/4 Hero Face & Sculpted Headgear Engine
    ctx.save();
    ctx.rotate(this.joints.headTilt);

    // Sculpted Head Contour & Skin Gradient (Jawline, Ears & Neck)
    const headSkinGrad = ctx.createLinearGradient(-9 * s, -44 * s, 9 * s, -25 * s);
    headSkinGrad.addColorStop(0, '#ffdfb8');
    headSkinGrad.addColorStop(0.6, '#f5c999');
    headSkinGrad.addColorStop(1, '#d89b65');

    ctx.fillStyle = headSkinGrad;
    ctx.beginPath();
    ctx.moveTo(-7 * s, -43 * s);
    ctx.bezierCurveTo(-10 * s, -40 * s, -10 * s, -32 * s, -8 * s, -27 * s); // Left Jaw
    ctx.lineTo(-4 * s, -23 * s); // Chin
    ctx.lineTo(4 * s, -23 * s);
    ctx.bezierCurveTo(10 * s, -32 * s, 10 * s, -40 * s, 7 * s, -43 * s); // Right Jaw
    ctx.closePath();
    ctx.fill();

    // Sculpted Ears
    ctx.fillStyle = '#ebba85';
    ctx.beginPath();
    ctx.ellipse(-9 * s, -33 * s, 2 * s, 3.5 * s, -0.2, 0, Math.PI * 2);
    ctx.ellipse(9 * s, -33 * s, 2 * s, 3.5 * s, 0.2, 0, Math.PI * 2);
    ctx.fill();

    // Expressive Heroic Face Details (Dual Eyes, Eyebrows, Nose & Mouth)
    const headId = getEqId(equipment.head || equipment.helmet);

    // Only render open face features if not wearing a closed helmet
    if (!headId.includes('helm') && !headId.includes('iron')) {
      const isBlinking = (Date.now() % 3800 < 140);

      // Heroic Eyebrows
      ctx.strokeStyle = '#4a2505';
      ctx.lineWidth = 1.6 * s;
      ctx.beginPath();
      ctx.moveTo(-6 * s, -38 * s);
      ctx.lineTo(-1.5 * s, -36.8 * s);
      ctx.moveTo(1.5 * s, -36.8 * s);
      ctx.lineTo(6 * s, -38 * s);
      ctx.stroke();

      // Dual Eyes in 3/4 View (White Sclera, Emerald Iris, Glint)
      if (isBlinking) {
        ctx.strokeStyle = '#1a1008';
        ctx.lineWidth = 1.5 * s;
        ctx.beginPath();
        ctx.moveTo(-5.5 * s, -34.5 * s);
        ctx.lineTo(-1.5 * s, -34.5 * s);
        ctx.moveTo(1.5 * s, -34.5 * s);
        ctx.lineTo(5.5 * s, -34.5 * s);
        ctx.stroke();
      } else {
        // Left Eye
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(-3.5 * s, -34.5 * s, 2.2 * s, 2.8 * s, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#2db872'; // Vibrant Emerald Iris
        ctx.beginPath();
        ctx.arc(-3.3 * s, -34.5 * s, 1.4 * s, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#0a0d12'; // Pupil
        ctx.beginPath();
        ctx.arc(-3.3 * s, -34.5 * s, 0.7 * s, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff'; // Glint
        ctx.fillRect(-4.2 * s, -35.6 * s, 0.9 * s, 0.9 * s);

        // Right Eye
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(3.5 * s, -34.5 * s, 2.2 * s, 2.8 * s, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#2db872';
        ctx.beginPath();
        ctx.arc(3.7 * s, -34.5 * s, 1.4 * s, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#0a0d12';
        ctx.beginPath();
        ctx.arc(3.7 * s, -34.5 * s, 0.7 * s, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(2.8 * s, -35.6 * s, 0.9 * s, 0.9 * s);
      }

      // Nose Bridge & Highlight
      ctx.fillStyle = 'rgba(180, 110, 60, 0.4)';
      ctx.beginPath();
      ctx.moveTo(0, -35 * s);
      ctx.lineTo(-0.8 * s, -29 * s);
      ctx.lineTo(0.8 * s, -29 * s);
      ctx.closePath();
      ctx.fill();

      // Confident Heroic Mouth Line
      ctx.strokeStyle = '#8a4b27';
      ctx.lineWidth = 1.4 * s;
      ctx.beginPath();
      ctx.moveTo(-2.5 * s, -26 * s);
      ctx.quadraticCurveTo(0, -25 * s, 2.5 * s, -26 * s);
      ctx.stroke();
    }

    // High-Poly Sculpted Hairstyles & Metallic Helmets
    if (headId.includes('helm') || headId.includes('iron')) {
      // Metallic Knight Helmet Visor with Beveled Brow & Gold Crest Emblem
      const helmGrad = ctx.createLinearGradient(-11 * s, -48 * s, 11 * s, -26 * s);
      helmGrad.addColorStop(0, '#ffffff');
      helmGrad.addColorStop(0.3, '#b0c4de');
      helmGrad.addColorStop(0.7, '#5b6b7a');
      helmGrad.addColorStop(1, '#1e2630');

      ctx.fillStyle = helmGrad;
      ctx.beginPath();
      ctx.moveTo(-10.5 * s, -34 * s);
      ctx.bezierCurveTo(-11 * s, -46 * s, 11 * s, -46 * s, 10.5 * s, -34 * s);
      ctx.lineTo(9 * s, -25 * s);
      ctx.lineTo(-9 * s, -25 * s);
      ctx.closePath();
      ctx.fill();

      // Beveled Gold Crest & Visor Grill
      ctx.fillStyle = '#ffd700';
      ctx.fillRect(-11 * s, -37 * s, 22 * s, 4 * s);

      // Dark Interior Eye Slits & Brow Rivets
      ctx.fillStyle = '#0a0d12';
      ctx.fillRect(-7 * s, -35 * s, 5 * s, 1.8 * s);
      ctx.fillRect(2 * s, -35 * s, 5 * s, 1.8 * s);

      ctx.fillStyle = '#ffe57f';
      ctx.beginPath();
      ctx.arc(-8 * s, -35 * s, 1 * s, 0, Math.PI * 2);
      ctx.arc(8 * s, -35 * s, 1 * s, 0, Math.PI * 2);
      ctx.fill();
    } else if (headId.includes('wizard') || headId.includes('hood')) {
      // High-Poly Conical Wizard Hat with Gold Star Brooch
      const hatGrad = ctx.createLinearGradient(-14 * s, -34 * s, 14 * s, -58 * s);
      hatGrad.addColorStop(0, '#2d72e6');
      hatGrad.addColorStop(0.5, '#1d5ec9');
      hatGrad.addColorStop(1, '#0e3477');

      ctx.fillStyle = hatGrad;
      ctx.beginPath();
      ctx.moveTo(-14 * s, -34 * s);
      ctx.lineTo(14 * s, -34 * s);
      ctx.bezierCurveTo(8 * s, -42 * s, 4 * s, -52 * s, 0, -58 * s);
      ctx.bezierCurveTo(-4 * s, -52 * s, -8 * s, -42 * s, -14 * s, -34 * s);
      ctx.closePath();
      ctx.fill();

      // Gold Star Brooch & Band
      ctx.fillStyle = '#f4be42';
      ctx.fillRect(-11 * s, -36 * s, 22 * s, 3.5 * s);
      ctx.beginPath();
      ctx.arc(0, -44 * s, 4 * s, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Natural Sculpted Heroic Hair (Auburn Hair Gradient)
      const hairGrad = ctx.createLinearGradient(-10 * s, -50 * s, 10 * s, -30 * s);
      hairGrad.addColorStop(0, '#a24f18');
      hairGrad.addColorStop(0.5, '#7a3e12');
      hairGrad.addColorStop(1, '#421f06');

      ctx.fillStyle = hairGrad;
      
      // Top Crown Volume Dome
      ctx.beginPath();
      ctx.moveTo(-10 * s, -35 * s);
      ctx.bezierCurveTo(-11 * s, -49 * s, 11 * s, -49 * s, 10 * s, -35 * s);
      ctx.bezierCurveTo(7 * s, -39 * s, -7 * s, -39 * s, -10 * s, -35 * s);
      ctx.closePath();
      ctx.fill();

      // Left & Right Sideburn Hair Locks
      ctx.beginPath();
      ctx.ellipse(-9 * s, -34 * s, 2.2 * s, 5 * s, -0.2, 0, Math.PI * 2);
      ctx.ellipse(9 * s, -34 * s, 2.2 * s, 5 * s, 0.2, 0, Math.PI * 2);
      ctx.fill();

      // Organic Swept Bangs (Tapered Hair Locks on Forehead, No Horizontal Rectangular Strip!)
      ctx.beginPath();
      ctx.moveTo(-8 * s, -37 * s);
      ctx.quadraticCurveTo(-3 * s, -35 * s, -1 * s, -38 * s);
      ctx.quadraticCurveTo(3 * s, -34 * s, 8 * s, -37 * s);
      ctx.quadraticCurveTo(4 * s, -41 * s, 0, -42 * s);
      ctx.quadraticCurveTo(-4 * s, -41 * s, -8 * s, -37 * s);
      ctx.closePath();
      ctx.fill();

      // Gold Headband / Circlet Slot (ONLY if equipment.headband item is explicitly equipped!)
      const headbandItem = equipment.headband;
      if (headbandItem) {
        const headbandId = getEqId(headbandItem);
        if (headbandId && headbandId !== 'none') {
          ctx.fillStyle = '#ffd700';
          ctx.fillRect(-10 * s, -38.5 * s, 20 * s, 2.8 * s);
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(0, -37 * s, 1.8 * s, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    ctx.restore(); // End Head

    ctx.restore(); // End Torso Tilt
    ctx.restore(); // End Root
  }
}
