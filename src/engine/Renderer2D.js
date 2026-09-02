import { synth } from './SoundSynth.js';
import { SpriteAnimation } from './SpriteAnimation.js';

export class Renderer2D {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = canvas.width;
    this.height = canvas.height;

    // Sprite Animation Engine
    this.heroWalkAnim = new SpriteAnimation('/media_1788281528065.jpg', {
      frameWidth: 200,
      frameHeight: 300,
      totalFrames: 4,
      fps: 8
    });

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

    if (foundSegment && isFinite(maxY)) return maxY;

    const validYPts = points.map(p => p ? p.y : 0).filter(y => !isNaN(y) && isFinite(y));
    if (validYPts.length > 0) return Math.max(...validYPts);
    return 400;
  }

  renderExplorationScene(sceneData, playerState, timeSystem = null, hotspots = []) {
    if (!sceneData) return;
    this.ctx.clearRect(0, 0, this.width, this.height);

    if (sceneData.bgImage && sceneData.bgImage.complete && sceneData.bgImage.naturalWidth > 0) {
      this.ctx.drawImage(sceneData.bgImage, 0, 0, this.width, this.height);
    } else {
      this.ctx.fillStyle = '#0f1712';
      this.ctx.fillRect(0, 0, this.width, this.height);
      this.ctx.fillStyle = 'rgba(247, 242, 231, 0.4)';
      this.ctx.font = '700 24px "Cinzel", serif';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(`🏰 ${sceneData.title || 'Realm Exploration'}`, this.width / 2, this.height / 2);
    }

    if (this.targetMarker) {
      this.ctx.save();
      this.targetMarker.radius += 0.5;
      this.targetMarker.alpha -= 0.03;

      this.ctx.strokeStyle = 'rgba(244, 190, 66, ' + Math.max(0, this.targetMarker.alpha) + ')';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.arc(this.targetMarker.x, this.targetMarker.y, this.targetMarker.radius, 0, Math.PI * 2);
      this.ctx.stroke();

      if (this.targetMarker.alpha <= 0) {
        this.targetMarker = null;
      }
      this.ctx.restore();
    }

    // Collect Y-Sorted Depth Entities (Hero, NPCs, Monsters, Room Scenery Props & Polygon 2.5D Cutouts)
    const depthEntities = [];

    // Add Polygon Scenery Cutouts with Safe Per-X Curved Bottom Evaluation
    if (sceneData.obstacles && sceneData.obstacles.length > 0) {
      sceneData.obstacles.forEach(obs => {
        if (obs.type === 'polygon' && obs.isCutout && obs.points && obs.points.length > 2) {
          const heroX = playerState ? playerState.x : 600;
          const depthY = this.getPolygonBaseYAtX(obs.points, heroX);

          depthEntities.push({
            y: depthY,
            render: () => {
              if (sceneData.bgImage && sceneData.bgImage.complete && sceneData.bgImage.naturalWidth > 0) {
                this.ctx.save();
                this.ctx.beginPath();
                this.ctx.moveTo(obs.points[0].x, obs.points[0].y);
                for (let i = 1; i < obs.points.length; i++) {
                  this.ctx.lineTo(obs.points[i].x, obs.points[i].y);
                }
                this.ctx.closePath();
                this.ctx.clip();
                this.ctx.drawImage(sceneData.bgImage, 0, 0, this.width, this.height);
                this.ctx.restore();
              }
            }
          });
        }
      });
    }

    // Add Room Scenery Props (Trees, Fountains, Statues, Chests)
    if (sceneData.props && sceneData.props.length > 0) {
      sceneData.props.forEach(prop => {
        depthEntities.push({
          y: prop.depthY || prop.y || 400,
          render: () => {
            this.ctx.save();
            this.ctx.font = '36px sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(prop.icon || '🪵', prop.x, prop.y);
            this.ctx.fillStyle = 'rgba(247, 242, 231, 0.95)';
            this.ctx.font = '700 12px "Cinzel", serif';
            this.ctx.fillText(prop.label, prop.x, prop.y - 42);
            this.ctx.restore();
          }
        });
      });
    }

    if (sceneData.id === 'magic_shop') {
      depthEntities.push({
        y: 420,
        render: () => this.renderNPCSorceress(550, 420)
      });
    } else if (sceneData.id === 'guild_hall') {
      depthEntities.push({
        y: 400,
        render: () => this.renderNPCGuildmaster(530, 400)
      });
    } else if (sceneData.id === 'forest_path') {
      depthEntities.push({
        y: 420,
        render: () => this.renderMonsterGoblin(500, 420)
      });
      depthEntities.push({
        y: 380,
        render: () => this.renderMonsterWarlock(850, 380)
      });
    } else if (sceneData.id === 'goblin_camp') {
      depthEntities.push({
        y: 420,
        render: () => this.renderMonsterChieftain(640, 420)
      });
    } else if (sceneData.id === 'throne_room') {
      depthEntities.push({
        y: 400,
        render: () => this.renderMonsterArchLich(640, 400)
      });
    }

    if (playerState) {
      depthEntities.push({
        y: playerState.y || 450,
        render: () => {
          if (playerState.isWalking) {
            this.heroWalkAnim.update();
          }
          this.renderHeroPaperdoll(
            playerState.x,
            playerState.y,
            playerState.isWalking,
            playerState.walkStep,
            playerState.heroClass,
            playerState.isStealth,
            playerState.cloakColor
          );
        }
      });
    }

    // Safe Sort (handles NaN gracefully without throwing error)
    depthEntities.sort((a, b) => {
      const ay = (a && !isNaN(a.y) && isFinite(a.y)) ? a.y : 0;
      const by = (b && !isNaN(b.y) && isFinite(b.y)) ? b.y : 0;
      return ay - by;
    });

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

  renderHeroPaperdoll(x, y, isWalking = false, walkStep = 0, heroClass = 'Fighter', isStealth = false, cloakColor = null) {
    this.ctx.save();

    if (isStealth) {
      this.ctx.globalAlpha = 0.5;
    }

    this.ctx.fillStyle = 'rgba(10, 20, 15, 0.45)';
    this.ctx.beginPath();
    this.ctx.ellipse(x, y + 2, 22, 10, 0, 0, Math.PI * 2);
    this.ctx.fill();

    const bounceY = isWalking ? Math.abs(Math.sin(walkStep * 0.2)) * -6 : 0;
    const posY = y + bounceY;

    let defaultCloak = heroClass === 'Magic User' ? '#2b4c7e' : (heroClass === 'Thief' ? '#3d342b' : (heroClass.includes('Paladin') ? '#f4be42' : '#8b2626'));
    if (cloakColor) defaultCloak = cloakColor;

    this.ctx.fillStyle = isStealth ? '#1a2421' : defaultCloak;
    this.ctx.beginPath();
    this.ctx.moveTo(x - 16, posY - 35);
    this.ctx.lineTo(x + 16, posY - 35);
    this.ctx.lineTo(x + 22, posY - 4);
    this.ctx.lineTo(x - 22, posY - 4);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.strokeStyle = '#1a1008';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();

    this.ctx.fillStyle = isStealth ? '#2d3b36' : (heroClass === 'Fighter' ? '#4ea373' : (heroClass === 'Thief' ? '#d97724' : '#6b4ba3'));
    this.ctx.fillRect(x - 12, posY - 45, 24, 30);
    this.ctx.strokeRect(x - 12, posY - 45, 24, 30);

    this.ctx.fillStyle = '#f4be42';
    this.ctx.fillRect(x - 12, posY - 25, 24, 5);
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(x - 4, posY - 26, 8, 7);

    this.ctx.fillStyle = '#ffdbac';
    this.ctx.beginPath();
    this.ctx.arc(x, posY - 58, 14, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.stroke();

    this.ctx.fillStyle = '#222';
    this.ctx.fillRect(x - 5, posY - 60, 3, 4);
    this.ctx.fillRect(x + 2, posY - 60, 3, 4);

    this.ctx.fillStyle = '#e8a838';
    this.ctx.beginPath();
    this.ctx.arc(x, posY - 64, 15, Math.PI, Math.PI * 2);
    this.ctx.fill();

    this.ctx.font = '16px sans-serif';
    if (isStealth) this.ctx.fillText('🥷', x + 12, posY - 35);
    else if (heroClass.includes('Paladin')) this.ctx.fillText('🛡️', x + 12, posY - 35);
    else if (heroClass === 'Fighter') this.ctx.fillText('⚔️', x + 12, posY - 35);
    else if (heroClass === 'Magic User') this.ctx.fillText('🔮', x + 12, posY - 35);
    else if (heroClass === 'Thief') this.ctx.fillText('🗡️', x + 12, posY - 35);

    this.ctx.restore();
  }

  renderNPCSorceress(x, y) {
    this.ctx.save();
    this.ctx.fillStyle = 'rgba(0,0,0,0.3)';
    this.ctx.beginPath();
    this.ctx.ellipse(x, y, 20, 8, 0, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = '#5c3d75';
    this.ctx.fillRect(x - 14, y - 45, 28, 38);
    this.ctx.strokeStyle = '#2d1840';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(x - 14, y - 45, 28, 38);

    this.ctx.fillStyle = '#fce4ec';
    this.ctx.beginPath();
    this.ctx.arc(x, y - 56, 12, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = '#3a2054';
    this.ctx.beginPath();
    this.ctx.moveTo(x - 18, y - 62);
    this.ctx.lineTo(x + 18, y - 62);
    this.ctx.lineTo(x, y - 90);
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.fillStyle = 'rgba(247, 242, 231, 0.95)';
    this.ctx.font = '700 13px "Cinzel", serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('🔮 Sorceress Zara', x, y - 98);

    this.ctx.restore();
  }

  renderNPCGuildmaster(x, y) {
    this.ctx.save();
    this.ctx.fillStyle = 'rgba(0,0,0,0.3)';
    this.ctx.beginPath();
    this.ctx.ellipse(x, y, 22, 9, 0, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = '#a83232';
    this.ctx.fillRect(x - 18, y - 48, 36, 40);

    this.ctx.fillStyle = '#7a8b99';
    this.ctx.fillRect(x - 14, y - 45, 28, 32);
    this.ctx.strokeStyle = '#293540';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(x - 14, y - 45, 28, 32);

    this.ctx.fillStyle = '#d9d9d9';
    this.ctx.fillRect(x - 10, y - 66, 20, 20);
    this.ctx.fillStyle = '#a83232';
    this.ctx.fillRect(x - 3, y - 76, 6, 10);

    this.ctx.fillStyle = 'rgba(247, 242, 231, 0.95)';
    this.ctx.font = '700 13px "Cinzel", serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('⚔️ Guildmaster Bruno', x, y - 82);

    this.ctx.restore();
  }

  renderMonsterGoblin(x, y) {
    this.ctx.save();
    this.ctx.fillStyle = 'rgba(0,0,0,0.3)';
    this.ctx.beginPath();
    this.ctx.ellipse(x, y, 18, 8, 0, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = '#387654';
    this.ctx.fillRect(x - 12, y - 35, 24, 26);

    this.ctx.fillStyle = '#4ea373';
    this.ctx.beginPath();
    this.ctx.arc(x, y - 44, 12, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = 'rgba(247, 242, 231, 0.95)';
    this.ctx.font = '700 13px "Cinzel", serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('👺 Goblin Spearman', x, y - 78);

    this.ctx.restore();
  }

  renderMonsterWarlock(x, y) {
    this.ctx.save();
    this.ctx.fillStyle = 'rgba(0,0,0,0.35)';
    this.ctx.beginPath();
    this.ctx.ellipse(x, y, 20, 8, 0, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = '#2b1b3d';
    this.ctx.fillRect(x - 14, y - 46, 28, 38);

    this.ctx.fillStyle = 'rgba(247, 242, 231, 0.95)';
    this.ctx.font = '700 13px "Cinzel", serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('🧙 Shadow Warlock', x, y - 84);

    this.ctx.restore();
  }

  renderMonsterChieftain(x, y) {
    this.ctx.save();
    this.ctx.fillStyle = 'rgba(0,0,0,0.4)';
    this.ctx.beginPath();
    this.ctx.ellipse(x, y, 24, 10, 0, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = 'rgba(247, 242, 231, 0.95)';
    this.ctx.font = '700 13px "Cinzel", serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('👑 Goblin Chieftain', x, y - 88);

    this.ctx.restore();
  }

  renderMonsterArchLich(x, y) {
    this.ctx.save();
    this.ctx.fillStyle = 'rgba(0,0,0,0.5)';
    this.ctx.beginPath();
    this.ctx.ellipse(x, y, 26, 11, 0, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = 'rgba(247, 242, 231, 0.95)';
    this.ctx.font = '700 13px "Cinzel", serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('💀 Arch-Lich Malakor', x, y - 96);

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
