// NPCRenderer.js - 2D Vector Animated NPC Paperdoll & Sprite Renderer Engine
import { SkeletalPaperdoll } from './SkeletalPaperdoll.js';

export class NPCRenderer {
  constructor() {
    this.paperdoll = new SkeletalPaperdoll();
  }

  drawNPC(ctx, npc, time = Date.now()) {
    if (!npc || !npc.x || !npc.y) return;

    const x = npc.x;
    const y = npc.y;
    const scale = npc.scale || 3.4;
    const s = scale / 3.6;
    const npcId = npc.npcId || npc.id || 'bruno';

    ctx.save();
    
    // 1. Ground Shadow for NPC
    const shadowGrad = ctx.createRadialGradient(x, y + 4 * s, 2 * s, x, y + 4 * s, 16 * s);
    shadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0.5)');
    shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0.0)');
    ctx.fillStyle = shadowGrad;
    ctx.beginPath();
    ctx.ellipse(x, y + 4 * s, 16 * s, 6 * s, 0, 0, Math.PI * 2);
    ctx.fill();

    // Subtle Breathing Bob
    const breathY = Math.sin(time * 0.002 + (npc.seed || 0)) * 1.5 * s;
    const renderY = y + breathY;

    if (npcId === 'guildmaster' || npcId === 'bruno') {
      // ⚔️ Guildmaster Bruno - Veteran Knight in Steel Armor & Red Cape
      const brunoEq = {
        shirt: { id: 'iron_breastplate' },
        pants: { id: 'leather_pants' },
        shoes: { id: 'riding_boots' },
        helmet: null,
        cape: { id: 'scarlet_cape', color: '#a82424' },
        baldric: { id: 'baldric', color: '#b82531' },
        belt: { id: 'lion_belt' },
        weapon: { id: 'iron_sword' }
      };
      this.paperdoll.draw(ctx, x, renderY, 'down', scale, brunoEq, '#a82424', false, false);
      this.drawNameplate(ctx, x, renderY - 60 * s, '⚔️ Guildmaster Bruno', '#d4af37');

    } else if (npcId === 'zara') {
      // 🔮 Sorceress Zara - Arcane Mage in Violet Silk Robe & Conical Wizard Hat
      const zaraEq = {
        shirt: { id: 'mage_robe' },
        pants: { id: 'mage_robe' },
        shoes: { id: 'riding_boots' },
        helmet: { id: 'wizard_hat' },
        cape: { id: 'shadow_cape', color: '#4a1c6d' },
        amulet: { id: 'ruby_amulet' },
        weapon: { id: 'arcane_wand' }
      };
      this.paperdoll.draw(ctx, x, renderY, 'down', scale, zaraEq, '#4a1c6d', false, false);
      this.drawNameplate(ctx, x, renderY - 64 * s, '🔮 Sorceress Zara', '#a850dc');

    } else if (npcId === 'sheriff' || npcId === 'otto') {
      // 🛡️ Sheriff Otto - Town Lawkeeper in Leather Armor & Gold Badge
      const sheriffEq = {
        shirt: { id: 'leather_armor' },
        pants: { id: 'leather_pants' },
        shoes: { id: 'riding_boots' },
        helmet: null,
        headband: null,
        belt: { id: 'lion_belt' },
        baldric: { id: 'baldric', color: '#1d5ec9' },
        weapon: { id: 'iron_sword' }
      };
      this.paperdoll.draw(ctx, x, renderY, 'down', scale, sheriffEq, null, false, false);
      this.drawNameplate(ctx, x, renderY - 60 * s, '🛡️ Sheriff Otto', '#3a7cd8');

    } else if (npcId === 'barnaby' || npcId === 'merchant') {
      // 🍎 Merchant Barnaby - Town Trader with Apron & Produce Crate
      const barnabyEq = {
        shirt: { id: 'linen_shirt' },
        pants: { id: 'leather_pants' },
        shoes: { id: 'riding_boots' },
        helmet: null,
        belt: { id: 'lion_belt' }
      };
      this.paperdoll.draw(ctx, x, renderY, 'down', scale, barnabyEq, null, false, false);
      
      // Draw Merchant Fruit Crate
      ctx.fillStyle = '#6b4f38';
      ctx.fillRect(x + 10 * s, renderY - 10 * s, 14 * s, 10 * s);
      ctx.fillStyle = '#ff3333'; // Apples
      ctx.beginPath();
      ctx.arc(x + 14 * s, renderY - 12 * s, 3 * s, 0, Math.PI * 2);
      ctx.arc(x + 20 * s, renderY - 12 * s, 3 * s, 0, Math.PI * 2);
      ctx.fill();

      this.drawNameplate(ctx, x, renderY - 60 * s, '🍎 Merchant Barnaby', '#2db872');
    } else {
      // Generic Villager NPC
      this.paperdoll.draw(ctx, x, renderY, 'down', scale, {}, null, false, false);
      this.drawNameplate(ctx, x, renderY - 60 * s, npc.label || 'Villager', '#ffffff');
    }

    ctx.restore();
  }

  drawNameplate(ctx, x, y, name, accentColor) {
    ctx.save();
    ctx.font = 'bold 11px system-ui, sans-serif';
    const textWidth = ctx.measureText(name).width;
    const paddingX = 8;
    const paddingY = 4;
    const boxW = textWidth + paddingX * 2;
    const boxH = 18;

    // Background Parchment Badge
    ctx.fillStyle = 'rgba(15, 26, 20, 0.88)';
    ctx.strokeStyle = accentColor || '#ffd700';
    ctx.lineWidth = 1.2;

    ctx.beginPath();
    ctx.roundRect(x - boxW / 2, y - boxH / 2, boxW, boxH, 4);
    ctx.fill();
    ctx.stroke();

    // Text Label
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(name, x, y);

    ctx.restore();
  }

  drawPortraitHeadshot(ctx, w = 120, h = 140, npcKey = 'bruno', time = Date.now()) {
    ctx.clearRect(0, 0, w, h);

    // 1. Background Vignette
    const bgGrad = ctx.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, w * 0.75);
    bgGrad.addColorStop(0, '#22382c');
    bgGrad.addColorStop(1, '#09120c');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    const key = (npcKey || '').toLowerCase();
    const cx = w / 2;
    const cy = h / 2 + 10;
    const breath = Math.sin(time * 0.003) * 1.5;

    ctx.save();
    ctx.translate(cx, cy + breath);

    const isBlinking = (Math.floor(time / 3000) % 5 === 0) && (time % 3000 < 150);

    if (key.includes('zara')) {
      // 🔮 Sorceress Zara Close-Up Portrait
      // Robe & Collar
      ctx.fillStyle = '#3a1352';
      ctx.beginPath();
      ctx.moveTo(-45, 55);
      ctx.lineTo(45, 55);
      ctx.lineTo(35, 20);
      ctx.lineTo(-35, 20);
      ctx.closePath();
      ctx.fill();

      // Gold Amulet
      ctx.fillStyle = '#ffd700';
      ctx.beginPath();
      ctx.arc(0, 26, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ff2255';
      ctx.beginPath();
      ctx.arc(0, 26, 3, 0, Math.PI * 2);
      ctx.fill();

      // Face
      ctx.fillStyle = '#f5c999';
      ctx.beginPath();
      ctx.ellipse(0, -5, 22, 28, 0, 0, Math.PI * 2);
      ctx.fill();

      // Raven Hair (Back & Sides)
      ctx.fillStyle = '#1c1329';
      ctx.beginPath();
      ctx.arc(0, -12, 26, Math.PI, Math.PI * 2);
      ctx.lineTo(26, 25);
      ctx.lineTo(18, 30);
      ctx.lineTo(16, -5);
      ctx.lineTo(-16, -5);
      ctx.lineTo(-18, 30);
      ctx.lineTo(-26, 25);
      ctx.closePath();
      ctx.fill();

      // Wizard Hat
      ctx.fillStyle = '#4a1c6d';
      ctx.beginPath();
      ctx.moveTo(-32, -22);
      ctx.lineTo(32, -22);
      ctx.lineTo(0, -65);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#d4af37';
      ctx.fillRect(-32, -24, 64, 4);

      // Eyes
      if (!isBlinking) {
        ctx.fillStyle = '#a850dc';
        ctx.beginPath();
        ctx.arc(-8, -8, 4, 0, Math.PI * 2);
        ctx.arc(8, -8, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-7, -9, 1.5, 0, Math.PI * 2);
        ctx.arc(9, -9, 1.5, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.strokeStyle = '#331144';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-12, -8); ctx.lineTo(-4, -8);
        ctx.moveTo(4, -8); ctx.lineTo(12, -8);
        ctx.stroke();
      }

      // Lips
      ctx.fillStyle = '#c9456b';
      ctx.beginPath();
      ctx.ellipse(0, 8, 5, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();

    } else if (key.includes('sheriff') || key.includes('otto')) {
      // 🛡️ Sheriff Otto Close-Up Portrait
      // Armor Collar & Star Badge
      ctx.fillStyle = '#4a321a';
      ctx.fillRect(-40, 20, 80, 35);
      ctx.fillStyle = '#ffd700'; // Gold Badge
      ctx.beginPath();
      ctx.arc(-16, 32, 7, 0, Math.PI * 2);
      ctx.fill();

      // Face
      ctx.fillStyle = '#e8b584';
      ctx.beginPath();
      ctx.ellipse(0, -6, 23, 27, 0, 0, Math.PI * 2);
      ctx.fill();

      // Leather Helm / Cap
      ctx.fillStyle = '#2b1b10';
      ctx.beginPath();
      ctx.arc(0, -12, 25, Math.PI, Math.PI * 2);
      ctx.fill();

      // Mustache & Eyebrows
      ctx.fillStyle = '#5c3a21';
      ctx.beginPath();
      ctx.ellipse(0, 5, 14, 6, 0, 0, Math.PI);
      ctx.fill();

      // Eyes
      if (!isBlinking) {
        ctx.fillStyle = '#221100';
        ctx.beginPath();
        ctx.arc(-9, -10, 3, 0, Math.PI * 2);
        ctx.arc(9, -10, 3, 0, Math.PI * 2);
        ctx.fill();
      }

    } else if (key.includes('barnaby') || key.includes('merchant')) {
      // 🍎 Merchant Barnaby Close-Up Portrait
      // Green Vest & Shirt
      ctx.fillStyle = '#2d5e3b';
      ctx.fillRect(-40, 20, 80, 35);
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(-10, 20); ctx.lineTo(0, 35); ctx.lineTo(10, 20);
      ctx.fill();

      // Face & Rosy Cheeks
      ctx.fillStyle = '#f7d3a8';
      ctx.beginPath();
      ctx.ellipse(0, -5, 25, 28, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(235, 90, 90, 0.35)';
      ctx.beginPath();
      ctx.arc(-14, 2, 7, 0, Math.PI * 2);
      ctx.arc(14, 2, 7, 0, Math.PI * 2);
      ctx.fill();

      // Merchant Cap
      ctx.fillStyle = '#8c4e20';
      ctx.beginPath();
      ctx.ellipse(0, -22, 28, 10, 0, 0, Math.PI * 2);
      ctx.fill();

      // Smile & Eyes
      ctx.strokeStyle = '#6e350c';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 4, 8, 0.1, Math.PI - 0.1);
      ctx.stroke();

      if (!isBlinking) {
        ctx.fillStyle = '#331a00';
        ctx.beginPath();
        ctx.arc(-9, -8, 3, 0, Math.PI * 2);
        ctx.arc(9, -8, 3, 0, Math.PI * 2);
        ctx.fill();
      }

    } else {
      // ⚔️ Guildmaster Bruno Close-Up Portrait (Default)
      // Steel Armor Shoulders & Red Cape Collar
      ctx.fillStyle = '#7a2222';
      ctx.beginPath();
      ctx.moveTo(-45, 55); ctx.lineTo(45, 55); ctx.lineTo(35, 15); ctx.lineTo(-35, 15);
      ctx.fill();

      ctx.fillStyle = '#8a9ba8'; // Steel Cuirass
      ctx.fillRect(-28, 22, 56, 33);
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 2;
      ctx.strokeRect(-28, 22, 56, 33);

      // Head & Jaw
      ctx.fillStyle = '#f5c999';
      ctx.beginPath();
      ctx.ellipse(0, -6, 24, 28, 0, 0, Math.PI * 2);
      ctx.fill();

      // Veteran Beard & Hair
      ctx.fillStyle = '#594943'; // Brown with silver hair
      ctx.beginPath();
      ctx.arc(0, -10, 26, Math.PI, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#453530'; // Full beard
      ctx.beginPath();
      ctx.moveTo(-22, -2);
      ctx.quadraticCurveTo(0, 32, 22, -2);
      ctx.quadraticCurveTo(0, 18, -22, -2);
      ctx.fill();

      // Eyes & Strong Eyebrows
      ctx.strokeStyle = '#221510';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-15, -14); ctx.lineTo(-4, -12);
      ctx.moveTo(4, -12); ctx.lineTo(15, -14);
      ctx.stroke();

      if (!isBlinking) {
        ctx.fillStyle = '#291810';
        ctx.beginPath();
        ctx.arc(-9, -8, 3.5, 0, Math.PI * 2);
        ctx.arc(9, -8, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }
}
