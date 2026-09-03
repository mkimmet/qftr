import { synth } from './SoundSynth.js';
import { SpriteAnimation } from './SpriteAnimation.js';
import { SkeletalPaperdoll } from './SkeletalPaperdoll.js';
import { SkeletalGoblin } from './SkeletalGoblin.js';
import { NPCRenderer } from './NPCRenderer.js';

export class Renderer2D {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = canvas.width;
    this.height = canvas.height;
    this.gameEngine = null;

    // 8-Directional 3-State Hero Sprite Sheet Animation Engine
    this.heroSpriteSheet = new SpriteAnimation({
      src: '/hero_spritesheet.png',
      fps: 10
    });

    // Native 2D Canvas Modular Skeletal Animators
    this.skeletalPaperdoll = new SkeletalPaperdoll(this);
    this.skeletalGoblin = new SkeletalGoblin();
    this.npcRenderer = new NPCRenderer();

    this.particles = [];
    this.floaters = [];

    this.targetMarker = null;
    this.mouseX = 0;
    this.mouseY = 0;

    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      this.mouseX = (e.clientX - rect.left) * scaleX;
      this.mouseY = (e.clientY - rect.top) * scaleY;
    });
  }

  setTargetMarker(x, y) {
    this.targetMarker = { x, y, radius: 4, alpha: 1.0 };
  }

  addFloater(text, x, y, color = '#f4be42') {
    this.floaters.push({
      text,
      x,
      y,
      color,
      alpha: 1.0,
      offsetY: 0
    });
  }

  spawnSpellParticleEffect(type, targetX, targetY) {
    const count = 30;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 4 + 2;
      let color = '#58a6ff';
      if (type === 'Flame Dart') color = '#ff7b72';
      else if (type === 'Heal') color = '#7ee787';
      else if (type === 'Open') color = '#d2a8ff';

      this.particles.push({
        x: targetX,
        y: targetY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.0,
        color,
        size: Math.random() * 5 + 3
      });
    }
  }

  getPolygonBaseYAtX(points, targetX) {
    if (!points || points.length < 2) return 400;
    const px = (targetX !== undefined && targetX !== null && !isNaN(targetX)) ? targetX : 600;
    let maxY = -Infinity;
    let foundSegment = false;

    for (let i = 0; i < points.length; i++) {
      const p1 = points[i];
      const p2 = points[(i + 1) % points.length];
      if (!p1 || !p2 || isNaN(p1.x) || isNaN(p1.y) || isNaN(p2.x) || isNaN(p2.y)) continue;

      const minX = Math.min(p1.x, p2.x);
      const maxX = Math.max(p1.x, p2.x);

      if (px >= minX && px <= maxX && minX !== maxX) {
        const t = (px - p1.x) / (p2.x - p1.x);
        const yAtX = p1.y + t * (p2.y - p1.y);
        if (!isNaN(yAtX) && isFinite(yAtX) && yAtX > maxY) {
          maxY = yAtX;
          foundSegment = true;
        }
      }
    }

    return foundSegment ? maxY : (points[0].y || 400);
  }

  renderExplorationScene(sceneData, playerState, timeSystem, hotspots = []) {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (sceneData.bgImage && sceneData.bgImage.complete && sceneData.bgImage.naturalWidth !== 0) {
      this.ctx.drawImage(sceneData.bgImage, 0, 0, this.canvas.width, this.canvas.height);
    } else {
      this.ctx.fillStyle = '#223322';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    if (playerState.isWalking) {
      this.heroSpriteSheet.update();
    }

    const heroDepthY = playerState.y;

    const depthEntities = [];

    depthEntities.push({
      type: 'hero',
      depthY: heroDepthY,
      render: () => {
        const depthConfig = sceneData.depthScale || {
          yMin: sceneData.bounds ? sceneData.bounds.yMin : 320,
          yMax: sceneData.bounds ? sceneData.bounds.yMax : 650,
          minScale: 3.2,
          maxScale: 5.6
        };

        const range = Math.max(1, depthConfig.yMax - depthConfig.yMin);
        const t = Math.max(0, Math.min(1, (playerState.y - depthConfig.yMin) / range));
        const heroDrawScale = depthConfig.minScale + t * (depthConfig.maxScale - depthConfig.minScale);

        this.renderHeroPaperdoll(
          playerState.x,
          playerState.y,
          playerState.isWalking,
          playerState.walkStep || 0,
          playerState.heroClass || 'Fighter',
          playerState.isStealth || false,
          playerState.cloakColor || null,
          playerState.facingDir || 'down',
          heroDrawScale
        );
      }
    });

    if (sceneData.obstacles && sceneData.obstacles.length > 0) {
      sceneData.obstacles.forEach(obs => {
        if (obs.isCutout) {
          const obsDepthY = obs.depthY !== undefined ? obs.depthY : (obs.y || 400);
          depthEntities.push({
            type: 'cutout_obstacle',
            depthY: obsDepthY,
            render: () => {
              this.ctx.save();
              this.ctx.beginPath();
              if (obs.type === 'circle') {
                this.ctx.arc(obs.x, obs.y, obs.radius, 0, Math.PI * 2);
              } else if (obs.type === 'rect') {
                this.ctx.rect(obs.x, obs.y, obs.w, obs.h);
              } else if (obs.type === 'polygon' && obs.points && obs.points.length > 0) {
                this.ctx.moveTo(obs.points[0].x, obs.points[0].y);
                for (let i = 1; i < obs.points.length; i++) {
                  this.ctx.lineTo(obs.points[i].x, obs.points[i].y);
                }
                this.ctx.closePath();
              }
              this.ctx.clip();

              if (sceneData.bgImage && sceneData.bgImage.complete) {
                this.ctx.drawImage(sceneData.bgImage, 0, 0, this.canvas.width, this.canvas.height);
              }

              this.ctx.lineWidth = 3;
              this.ctx.strokeStyle = 'rgba(244, 190, 66, 0.4)';
              this.ctx.stroke();
              this.ctx.restore();
            }
          });
        }
      });
    }

    if (sceneData.props && sceneData.props.length > 0) {
      sceneData.props.forEach(prop => {
        const propDepthY = prop.depthY || prop.y;
        depthEntities.push({
          type: 'prop',
          depthY: propDepthY,
          render: () => {
            this.ctx.save();
            this.ctx.font = '32px sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(prop.icon, prop.x, prop.y);
            this.ctx.restore();
          }
        });
      });
    }

    if (sceneData.hotspots && sceneData.hotspots.length > 0) {
      sceneData.hotspots.forEach(hs => {
        if (hs.type === 'npc' || hs.type === 'combat') {
          depthEntities.push({
            type: hs.type,
            depthY: hs.y + hs.h,
            render: () => {
              if (hs.type === 'combat' && (hs.enemyType && hs.enemyType.includes('Goblin') || hs.id.includes('goblin'))) {
                this.skeletalGoblin.draw(this.ctx, hs.x + hs.w / 2, hs.y + hs.h - 10, false, 3.6);
                this.ctx.font = '700 13px "Cinzel", serif';
                this.ctx.fillStyle = '#f4be42';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(hs.label, hs.x + hs.w / 2, hs.y - 10);
              } else {
                this.npcRenderer.drawNPC(this.ctx, {
                  ...hs,
                  x: hs.x + hs.w / 2,
                  y: hs.y + hs.h - 10,
                  scale: 3.4
                });
              }
            }
          });
        }
      });
    }

    depthEntities.sort((a, b) => a.depthY - b.depthY);

    depthEntities.forEach(ent => {
      try {
        if (ent && typeof ent.render === 'function') ent.render();
      } catch (e) {
        console.error('Error rendering depth entity:', e);
      }
    });

    this.renderAmbientParticles(sceneData);
    this.renderDayNightLighting(timeSystem);
    this.renderSierraExitIndicators(sceneData);
    this.renderHotspotHighlights(hotspots);

    if (this.gameEngine && this.gameEngine.levelEditor) {
      this.gameEngine.levelEditor.renderEditorOverlay(this.ctx, sceneData);
    }

    this.updateAndRenderParticles(timeSystem);
    this.renderFloaters();
  }

  getPerspectiveTileQuad(col, row) {
    const horizonY = 330; // Natural Horizon Line of Room Art
    const totalRows = 8;
    const totalCols = 10;
    
    // Depth Y curve: steps start at 345px and expand toward 680px
    const getRowY = (r) => {
      const t = r / totalRows;
      return horizonY + 15 + t * 280 + (t * t) * 55;
    };

    // Perspective Scale factor: 0.70 at horizon, 1.28 at front camera
    const getRowScale = (r) => {
      return 0.70 + (r / totalRows) * 0.58;
    };

    const yTop = getRowY(row);
    const yBot = getRowY(row + 1);

    const scaleTop = getRowScale(row);
    const scaleBot = getRowScale(row + 1);

    const baseColWidth = 86;
    const wTop = baseColWidth * scaleTop;
    const wBot = baseColWidth * scaleBot;

    // Center grid at X = 640
    const startXTop = 640 - (totalCols * wTop) / 2;
    const startXBot = 640 - (totalCols * wBot) / 2;

    const xTopL = startXTop + col * wTop;
    const xTopR = xTopL + wTop;

    const xBotL = startXBot + col * wBot;
    const xBotR = xBotL + wBot;

    const centerX = (xTopL + xTopR + xBotL + xBotR) / 4;
    const centerY = (yTop + yBot) / 2;

    return {
      topL: { x: xTopL, y: yTop },
      topR: { x: xTopR, y: yTop },
      botR: { x: xBotR, y: yBot },
      botL: { x: xBotL, y: yBot },
      centerX,
      centerY,
      scale: (scaleTop + scaleBot) / 2
    };
  }

  renderCombatScene(combatEngine, timeSystem) {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.save();

    // 1. Draw Full Canvas Background Image (1280x720)
    const currentRoom = (this.gameEngine && this.gameEngine.explorationScene) 
      ? this.gameEngine.explorationScene.getCurrentRoomData() 
      : null;
    
    if (currentRoom && currentRoom.bgImage && currentRoom.bgImage.complete && currentRoom.bgImage.naturalWidth !== 0) {
      this.ctx.drawImage(currentRoom.bgImage, 0, 0, this.canvas.width, this.canvas.height);
    } else {
      this.ctx.fillStyle = '#223322';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    // 2. Render 2.5D Perspective Checkerboard Grid aligned with Horizon Line (330px)
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 10; c++) {
        const quad = this.getPerspectiveTileQuad(c, r);

        const isHovered = (
          this.mouseY >= quad.topL.y &&
          this.mouseY <= quad.botL.y &&
          this.mouseX >= Math.min(quad.topL.x, quad.botL.x) &&
          this.mouseX <= Math.max(quad.topR.x, quad.botR.x)
        );

        this.ctx.beginPath();
        this.ctx.moveTo(quad.topL.x, quad.topL.y);
        this.ctx.lineTo(quad.topR.x, quad.topR.y);
        this.ctx.lineTo(quad.botR.x, quad.botR.y);
        this.ctx.lineTo(quad.botL.x, quad.botL.y);
        this.ctx.closePath();

        // Parchment Checkerboard Texture Fill
        this.ctx.fillStyle = (c + r) % 2 === 0 ? 'rgba(244, 220, 170, 0.20)' : 'rgba(210, 180, 130, 0.12)';
        if (isHovered) {
          this.ctx.fillStyle = 'rgba(244, 190, 66, 0.48)';
        }
        this.ctx.fill();

        this.ctx.strokeStyle = isHovered ? '#f4be42' : 'rgba(244, 200, 110, 0.45)';
        this.ctx.lineWidth = isHovered ? 2.5 : 1.2;
        this.ctx.stroke();

        // Render Tactical Ground Loot Drop Pouch if present on tile!
        const tile = combatEngine ? combatEngine.gridMap.getTile(c, r) : null;
        if (tile && tile.loot) {
          const loot = tile.loot;
          const floatY = Math.sin(Date.now() * 0.006 + c + r) * 4;

          // Glowing Ground Aura
          this.ctx.save();
          this.ctx.fillStyle = 'rgba(244, 190, 66, 0.45)';
          this.ctx.shadowColor = '#f4be42';
          this.ctx.shadowBlur = 12;
          this.ctx.beginPath();
          this.ctx.ellipse(quad.centerX, quad.centerY, 16 * quad.scale, 7 * quad.scale, 0, 0, Math.PI * 2);
          this.ctx.fill();

          // Floating Loot Icon & Text Label
          this.ctx.font = `${Math.round(24 * quad.scale)}px sans-serif`;
          this.ctx.textAlign = 'center';
          this.ctx.fillText(loot.icon || '💰', quad.centerX, quad.centerY - 8 + floatY);

          this.ctx.font = '700 10px "Cinzel", serif';
          this.ctx.fillStyle = '#f4be42';
          this.ctx.fillText(loot.name, quad.centerX, quad.centerY + 14);
          this.ctx.restore();
        }
      }
    }

    // 3. Render Entities in Side Profile (sorted by row depth)
    if (combatEngine && combatEngine.entities) {
      const sortedEntities = [...combatEngine.entities].sort((a, b) => a.row - b.row);

      sortedEntities.forEach(ent => {
        const quad = this.getPerspectiveTileQuad(ent.col, ent.row);
        let basePxX = quad.centerX;
        let basePxY = quad.centerY;

        // Rapid recoil shake on hit (350ms duration)
        let shakeX = 0;
        if (ent.hitShakeTime && Date.now() - ent.hitShakeTime < 350) {
          const elapsed = Date.now() - ent.hitShakeTime;
          shakeX = Math.sin(elapsed * 0.08) * Math.max(0, (350 - elapsed) * 0.05);
        }

        const targetPxX = basePxX + shakeX;
        const targetPxY = basePxY;

        // Smooth 60 FPS pixel movement interpolation for both player and enemy entities!
        if (!ent.renderX) ent.renderX = targetPxX;
        if (!ent.renderY) ent.renderY = targetPxY;

        const dx = targetPxX - ent.renderX;
        const dy = targetPxY - ent.renderY;
        const dist = Math.hypot(dx, dy);

        let isWalking = false;
        let facingDir = ent.facingDir || (ent.isPlayer ? 'right' : 'left');

        const stepSpeed = 4.5;
        if (dist > stepSpeed) {
          isWalking = true;
          ent.renderX += (dx / dist) * stepSpeed;
          ent.renderY += (dy / dist) * stepSpeed;

          const angle = Math.atan2(dy, dx);
          if (angle > -Math.PI / 8 && angle <= Math.PI / 8) facingDir = 'right';
          else if (angle > Math.PI / 8 && angle <= (3 * Math.PI) / 8) facingDir = 'down_right';
          else if (angle > (3 * Math.PI) / 8 && angle <= (5 * Math.PI) / 8) facingDir = 'down';
          else if (angle > (5 * Math.PI) / 8 && angle <= (7 * Math.PI) / 8) facingDir = 'down_left';
          else if (angle > (-3 * Math.PI) / 8 && angle <= -Math.PI / 8) facingDir = 'up_right';
          else if (angle > (-5 * Math.PI) / 8 && angle <= (-3 * Math.PI) / 8) facingDir = 'up';
          else if (angle > (-7 * Math.PI) / 8 && angle <= (-5 * Math.PI) / 8) facingDir = 'up_left';
          else facingDir = 'left';
          ent.facingDir = facingDir;
        } else {
          isWalking = false;
          ent.renderX = targetPxX;
          ent.renderY = targetPxY;
        }

        const gridYMin = 330;
        const gridYMax = 660;
        const normY = Math.max(0, Math.min(1, (ent.renderY - gridYMin) / (gridYMax - gridYMin)));
        const drawScale = 2.4 + normY * 2.6;

        if (ent.isPlayer) {
          if (isWalking) {
            this.heroSpriteSheet.update();
          }

          const heroClass = (this.gameEngine && this.gameEngine.statSystem) ? this.gameEngine.statSystem.heroClass : 'Fighter';
          
          this.renderHeroPaperdoll(
            Math.round(ent.renderX),
            Math.round(ent.renderY + 12),
            isWalking,
            0,
            heroClass,
            false,
            null,
            facingDir,
            drawScale,
            true
          );

          // Hero Health Bar
          const hpPct = Math.max(0, ent.hp / ent.maxHp);
          const barW = Math.round(40 * (drawScale / 3.0));
          this.ctx.fillStyle = 'rgba(0,0,0,0.6)';
          this.ctx.fillRect(ent.renderX - barW / 2, ent.renderY - Math.round(24 * drawScale), barW, 6);
          this.ctx.fillStyle = '#4ea373';
          this.ctx.fillRect(ent.renderX - barW / 2, ent.renderY - Math.round(24 * drawScale), barW * hpPct, 6);

        } else {
          // Render Enemies
          const renderX = Math.round(ent.renderX);
          const renderY = Math.round(ent.renderY);

          if (ent.name && ent.name.includes('Goblin')) {
            this.skeletalGoblin.draw(this.ctx, renderX, renderY + 12, isWalking, drawScale);

            this.ctx.font = '700 12px "Cinzel", serif';
            this.ctx.fillStyle = '#f4be42';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(ent.name, renderX, renderY - Math.round(18 * drawScale));

            const hpPct = Math.max(0, ent.hp / ent.maxHp);
            const barW = Math.round(40 * (drawScale / 3.0));
            this.ctx.fillStyle = 'rgba(0,0,0,0.6)';
            this.ctx.fillRect(renderX - barW / 2, renderY - Math.round(14 * drawScale), barW, 6);
            this.ctx.fillStyle = '#d64545';
            this.ctx.fillRect(renderX - barW / 2, renderY - Math.round(14 * drawScale), barW * hpPct, 6);
          } else if (ent.name && ent.name.includes('Chieftain')) {
            this.renderMonsterChieftain(renderX, renderY + 20, drawScale);
          } else if (ent.name && ent.name.includes('Arch-Lich')) {
            this.renderMonsterArchLich(renderX, renderY + 20, drawScale);
          } else {
            this.ctx.save();
            this.ctx.fillStyle = 'rgba(0,0,0,0.4)';
            this.ctx.beginPath();
            this.ctx.ellipse(renderX, renderY + 20, 20 * (drawScale / 3.0), 8 * (drawScale / 3.0), 0, 0, Math.PI * 2);
            this.ctx.fill();

            const monsterFontSize = Math.round(28 + normY * 32);
            this.ctx.font = `${monsterFontSize}px sans-serif`;
            this.ctx.textAlign = 'center';
            this.ctx.fillText(ent.portrait || '👺', renderX, renderY + 14);

            this.ctx.font = '700 12px "Cinzel", serif';
            this.ctx.fillStyle = '#f4be42';
            this.ctx.fillText(ent.name, renderX, renderY - Math.round(18 * drawScale));

            const hpPct = Math.max(0, ent.hp / ent.maxHp);
            const barW = Math.round(40 * (drawScale / 3.0));
            this.ctx.fillStyle = 'rgba(0,0,0,0.6)';
            this.ctx.fillRect(renderX - barW / 2, renderY - Math.round(14 * drawScale), barW, 6);
            this.ctx.fillStyle = '#d64545';
            this.ctx.fillRect(renderX - barW / 2, renderY - Math.round(14 * drawScale), barW * hpPct, 6);
            this.ctx.restore();
          }
        }
      });
    }

    this.updateAndRenderParticles();
    this.renderFloaters();
    this.ctx.restore();
  }

  renderDayNightLighting(timeSystem) {
    if (!timeSystem) return;
    const hour = timeSystem.hour;
    this.ctx.save();

    if (hour >= 18 && hour < 20) {
      this.ctx.fillStyle = 'rgba(255, 120, 0, 0.18)';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    } else if (hour >= 20 || hour < 5) {
      this.ctx.fillStyle = 'rgba(10, 18, 42, 0.58)';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      this.ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 30; i++) {
        const starX = (i * 47) % 1280;
        const starY = (i * 23) % 220;
        const starAlpha = Math.sin(Date.now() * 0.003 + i) * 0.4 + 0.6;
        this.ctx.globalAlpha = starAlpha;
        this.ctx.fillRect(starX, starY, 2, 2);
      }
    }

    this.ctx.restore();
  }

  renderSierraExitIndicators(sceneData) {
    if (!sceneData || !sceneData.exits) return;
    this.ctx.save();
    this.ctx.fillStyle = 'rgba(244, 190, 66, 0.85)';
    this.ctx.font = '700 14px "Cinzel", serif';

    if (sceneData.exits.east) {
      this.ctx.textAlign = 'right';
      this.ctx.fillText('EAST ➔', 1260, 480);
    }
    if (sceneData.exits.west) {
      this.ctx.textAlign = 'left';
      this.ctx.fillText('⬅ WEST', 20, 480);
    }
    this.ctx.restore();
  }

  renderHotspotHighlights(hotspots) {
    if (!hotspots || hotspots.length === 0) return;
    this.ctx.save();

    hotspots.forEach(hs => {
      const isHovered = this.mouseX >= hs.x && this.mouseX <= hs.x + hs.w && this.mouseY >= hs.y && this.mouseY <= hs.y + hs.h;
      if (isHovered) {
        this.ctx.fillStyle = 'rgba(244, 190, 66, 0.22)';
        this.ctx.strokeStyle = '#f4be42';
        this.ctx.lineWidth = 2;
        this.ctx.fillRect(hs.x, hs.y, hs.w, hs.h);
        this.ctx.strokeRect(hs.x, hs.y, hs.w, hs.h);

        this.ctx.fillStyle = '#f4be42';
        this.ctx.font = '700 12px "Cinzel", serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(hs.label, hs.x + hs.w / 2, hs.y - 8);
      }
    });

    this.ctx.restore();
  }

  renderHeroPaperdoll(x, y, isWalking = false, walkStep = 0, heroClass = 'Fighter', isStealth = false, cloakColor = null, facingDir = 'down', drawScale = 3.6, isCombat = false) {
    const equipment = (this.gameEngine && this.gameEngine.inventorySystem) ? this.gameEngine.inventorySystem.equipment : {};
    
    if (isWalking && this.skeletalPaperdoll.animState === 'idle') {
      this.skeletalPaperdoll.setAnimation('walk');
    } else if (!isWalking && this.skeletalPaperdoll.animState === 'walk') {
      this.skeletalPaperdoll.setAnimation('idle');
    }

    this.skeletalPaperdoll.draw(this.ctx, x, y, facingDir, drawScale, equipment, cloakColor, isCombat);
  }

  renderNPCSorceress(x, y) {
    this.ctx.save();
    this.ctx.fillStyle = 'rgba(0,0,0,0.4)';
    this.ctx.beginPath();
    this.ctx.ellipse(x, y, 22, 9, 0, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.font = '40px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('🔮', x, y - 10);
    this.ctx.restore();
  }

  renderMonsterChieftain(x, y, drawScale = 3.0) {
    this.ctx.save();
    this.ctx.fillStyle = 'rgba(0,0,0,0.4)';
    this.ctx.beginPath();
    this.ctx.ellipse(x, y, 22 * (drawScale / 3.0), 9 * (drawScale / 3.0), 0, 0, Math.PI * 2);
    this.ctx.fill();

    const fontSize = Math.round(38 * (drawScale / 3.0));
    this.ctx.font = `${fontSize}px sans-serif`;
    this.ctx.textAlign = 'center';
    this.ctx.fillText('👑', x, y - 10);

    this.ctx.fillStyle = 'rgba(247, 242, 231, 0.95)';
    this.ctx.font = '700 13px "Cinzel", serif';
    this.ctx.fillText('👑 Goblin Chieftain', x, y - Math.round(18 * drawScale));
    this.ctx.restore();
  }

  renderMonsterArchLich(x, y, drawScale = 3.0) {
    this.ctx.save();
    this.ctx.fillStyle = 'rgba(0,0,0,0.5)';
    this.ctx.beginPath();
    this.ctx.ellipse(x, y, 24 * (drawScale / 3.0), 10 * (drawScale / 3.0), 0, 0, Math.PI * 2);
    this.ctx.fill();

    const fontSize = Math.round(42 * (drawScale / 3.0));
    this.ctx.font = `${fontSize}px sans-serif`;
    this.ctx.textAlign = 'center';
    this.ctx.fillText('💀', x, y - 10);

    this.ctx.fillStyle = 'rgba(247, 242, 231, 0.95)';
    this.ctx.font = '700 13px "Cinzel", serif';
    this.ctx.fillText('🔮 Arch-Lich Malakor', x, y - Math.round(18 * drawScale));
    this.ctx.restore();
  }

  renderAmbientParticles(sceneData) {
    if (sceneData.id === 'deep_forest' || sceneData.id === 'thief_hideout') {
      this.ctx.save();
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      for (let i = 0; i < 20; i++) {
        const px = (i * 73 + Date.now() * 0.02) % 1280;
        const py = (i * 37 + Math.sin(Date.now() * 0.001 + i) * 20) % 720;
        this.ctx.fillRect(px, py, 3, 3);
      }
      this.ctx.restore();
    }
  }

  updateAndRenderParticles() {
    this.particles = this.particles.filter(p => p.life > 0);
    this.particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.04;

      this.ctx.save();
      this.ctx.globalAlpha = Math.max(0, p.life);
      this.ctx.fillStyle = p.color;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    });
  }

  renderFloaters() {
    this.floaters = this.floaters.filter(f => f.alpha > 0);
    this.floaters.forEach(f => {
      f.offsetY -= 1.2;
      f.alpha -= 0.02;

      this.ctx.save();
      this.ctx.globalAlpha = Math.max(0, f.alpha);
      this.ctx.fillStyle = f.color;
      this.ctx.font = '800 18px "Cinzel", serif';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(f.text, f.x, f.y + f.offsetY);
      this.ctx.restore();
    });
  }
}
