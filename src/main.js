import { StatSystem } from './systems/StatSystem.js';
import { InventorySystem } from './systems/InventorySystem.js';
import { TimeSystem } from './systems/TimeSystem.js';
import { DialogueSystem } from './systems/DialogueSystem.js';
import { QuestSystem } from './systems/QuestSystem.js';
import { MerchantSystem } from './systems/MerchantSystem.js';
import { HintSystem } from './systems/HintSystem.js';
import { SierraScoreSystem } from './systems/SierraScoreSystem.js';
import { SaveLoadSystem } from './systems/SaveLoadSystem.js';
import { StudioPersistence } from './systems/StudioPersistence.js';
import { ArtUploadManager } from './engine/ArtUploadManager.js';
import { GameRegistry } from './systems/GameRegistry.js';
import { EventEngine } from './systems/EventEngine.js';
import { LevelEditor } from './engine/LevelEditor.js';
import { AdminStudio } from './engine/AdminStudio.js';
import { SkeletalStudio } from './engine/SkeletalStudio.js';
import { Renderer2D } from './engine/Renderer2D.js';
import { Pathfinder2D } from './engine/Pathfinder2D.js';
import { CombatEngine } from './combat/CombatEngine.js';
import { CharacterCreationScene } from './scenes/CharacterCreationScene.js';
import { ExplorationScene } from './scenes/ExplorationScene.js';
import { CombatScene } from './scenes/CombatScene.js';
import { SPELL_CATALOG } from './combat/Spells.js';
import { synth } from './engine/SoundSynth.js';

class GameEngine {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.container = document.getElementById('game-container');
    this.renderer = new Renderer2D(this.canvas);
    this.renderer.gameEngine = this;
    
    // Core Systems
    this.statSystem = new StatSystem();
    this.inventorySystem = new InventorySystem();
    this.timeSystem = new TimeSystem();
    this.gameRegistry = new GameRegistry(this);
    this.eventEngine = new EventEngine(this);
    this.sierraScoreSystem = new SierraScoreSystem(this);
    this.saveLoadSystem = new SaveLoadSystem(this);
    this.studioPersistence = new StudioPersistence(this);
    this.artUploadManager = new ArtUploadManager(this);
    this.levelEditor = new LevelEditor(this);
    this.adminStudio = new AdminStudio(this);
    this.skeletalStudio = new SkeletalStudio(this);
    this.merchantSystem = new MerchantSystem(this);
    this.hintSystem = new HintSystem(this);
    this.questSystem = new QuestSystem(this);
    this.dialogueSystem = new DialogueSystem(document.getElementById('dialogue-layer'));
    this.combatEngine = new CombatEngine(this.statSystem, this.inventorySystem, this);

    // Scenes
    this.explorationScene = new ExplorationScene(this);
    this.combatScene = new CombatScene(document.getElementById('combat-hud-layer'), this.combatEngine, this);
    
    // Restore Saved Level Editor Room Overrides & Custom Artwork from LocalStorage
    this.studioPersistence.loadRoomData();
    this.artUploadManager.loadCustomArt();

    this.mode = 'char_create';

    // Sierra Verbs Sequence for Right-Click Cycling
    this.verbs = ['walk', 'look', 'talk', 'do', 'cast'];
    this.currentVerbIdx = 0;
    this.activeInvTab = 'all';

    // Player Movement & Styling State
    this.playerState = {
      x: 350,
      y: 450,
      targetX: 350,
      targetY: 450,
      isWalking: false,
      isStealth: false,
      cloakColor: null,
      walkPath: [],
      walkStep: 0,
      walkSpeed: 3.5,
      facingDir: 'down',
      heroClass: 'Fighter',
      onArrivalCallback: null
    };

    this.initUI();
    this.updateCanvasCursor('walk');
    this.initCharacterCreation();
    this.startLoop();
  }

  initUI() {
    // Sierra Auto-Hiding Top Icon Bar Hover Listener
    const topBar = document.getElementById('top-hud-layer');
    this.container.addEventListener('mousemove', (e) => {
      const rect = this.container.getBoundingClientRect();
      const relativeY = e.clientY - rect.top;
      if (relativeY <= 50) {
        topBar.classList.add('active');
      } else if (relativeY > 120 && !topBar.matches(':hover')) {
        topBar.classList.remove('active');
      }

      // Track Canvas Mouse Position for Hotspot Glows & Level Editor
      const canvasRect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / canvasRect.width;
      const scaleY = this.canvas.height / canvasRect.height;
      const x = (e.clientX - canvasRect.left) * scaleX;
      const y = (e.clientY - canvasRect.top) * scaleY;
      this.renderer.setMousePosition(x, y);

      // Pass MouseMove to Level Editor if Active
      if (this.levelEditor && this.levelEditor.isActive) {
        const room = this.explorationScene.getCurrentRoomData();
        this.levelEditor.handleMouseMove(x, y, room);
      }
    });

    // Level Editor Mouse Up Listener
    window.addEventListener('mouseup', () => {
      if (this.levelEditor) this.levelEditor.handleMouseUp();
    });

    // Sierra Right-Click Cursor Cycling Listener!
    this.canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      if (this.mode !== 'exploration') return;

      this.currentVerbIdx = (this.currentVerbIdx + 1) % this.verbs.length;
      const nextVerb = this.verbs[this.currentVerbIdx];
      this.setVerb(nextVerb);
    });

    // Stealth Toggle Button
    const sneakBtn = document.getElementById('btn-toggle-sneak');
    if (sneakBtn) {
      sneakBtn.addEventListener('click', () => {
        synth.playClick();
        this.playerState.isStealth = !this.playerState.isStealth;
        if (this.playerState.isStealth) {
          sneakBtn.innerText = '🥷 Sneak [ON]';
          sneakBtn.classList.add('active');
          this.playerState.walkSpeed = 2.2;
          this.showNotification('🥷 Stealth Mode ON (Sneaking silently & gaining Stealth XP)');
        } else {
          sneakBtn.innerText = '🥷 Sneak';
          sneakBtn.classList.remove('active');
          this.playerState.walkSpeed = 3.5;
          this.showNotification('🚶 Normal Walking Speed');
        }
      });
    }

    // Top HUD Buttons
    const scoreDisplay = document.getElementById('sierra-score-display');
    if (scoreDisplay) {
      scoreDisplay.style.cursor = 'pointer';
      scoreDisplay.title = 'Click to view Sierra Quest Points Breakdown';
      scoreDisplay.addEventListener('click', () => {
        synth.playClick();
        this.showScoreBreakdownModal();
      });
    }

    document.getElementById('btn-open-quests').addEventListener('click', () => {
      synth.playClick();
      this.questSystem.showQuestLogModal();
    });

    document.getElementById('btn-open-spells').addEventListener('click', () => {
      synth.playClick();
      this.showSpellbookModal();
    });

    const handleBtn = document.getElementById('btn-toggle-icon-bar');
    if (handleBtn) {
      handleBtn.addEventListener('click', () => {
        synth.playClick();
        const drawer = document.getElementById('pulldown-icon-drawer');
        if (drawer) {
          drawer.classList.toggle('open');
        }
      });
    }

    document.getElementById('btn-open-stats').addEventListener('click', () => {
      synth.playClick();
      this.showStatsModal();
    });

    document.getElementById('btn-open-inventory').addEventListener('click', () => {
      synth.playClick();
      this.showInventoryModal();
    });

    document.getElementById('btn-open-hints').addEventListener('click', () => {
      this.hintSystem.showHintModal();
    });

    document.getElementById('btn-save-game').addEventListener('click', () => {
      this.saveLoadSystem.showSaveLoadModal('save');
    });

    document.getElementById('btn-load-game').addEventListener('click', () => {
      this.saveLoadSystem.showSaveLoadModal('load');
    });

    document.getElementById('btn-dev-editor').addEventListener('click', () => {
      this.levelEditor.toggleEditor();
    });

    document.getElementById('btn-admin-studio').addEventListener('click', () => {
      this.adminStudio.toggleStudio();
    });

    document.getElementById('btn-skeletal-studio').addEventListener('click', () => {
      this.skeletalStudio.toggle();
    });

    const purgeBtn = document.getElementById('btn-purge-rooms');
    if (purgeBtn) {
      purgeBtn.addEventListener('click', () => {
        this.studioPersistence.clearSavedRooms();
        location.reload();
      });
    }

    document.getElementById('btn-rest').addEventListener('click', () => {
      synth.playClick();
      this.executeRest();
    });

    // Sierra Keyboard Hotkeys 1-6 for Quick Verb Switching & Spell Casting!
    window.addEventListener('keydown', (e) => {
      if (this.mode !== 'exploration') return;
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.key === '1') this.setVerb('walk');
      else if (e.key === '2') this.setVerb('look');
      else if (e.key === '3') this.setVerb('do');
      else if (e.key === '4') this.setVerb('talk');
      else if (e.key === '5') this.setVerb('cast');
      else if (e.key === '6') this.executeRest();
    });

    // Canvas Mouse Down / Click
    this.canvas.addEventListener('mousedown', (e) => {
      // Ignore Right-Click / Secondary buttons so Right-Click ONLY cycles verb cursors!
      if (e.button !== 0) return;

      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;

      // Check if Level Editor intercepted the mouse down for drag/resize
      if (this.levelEditor && this.levelEditor.isActive) {
        const room = this.explorationScene.getCurrentRoomData();
        if (this.levelEditor.handleMouseDown(x, y, room)) {
          return;
        }
      }

      if (this.mode === 'exploration') {
        this.renderer.setTargetMarker(x, y);
        this.explorationScene.handleCanvasClick(x, y, this.playerState);
      } else if (this.mode === 'combat') {
        let clickedCol = -1;
        let clickedRow = -1;

        // 1. Check ground tile perspective quads first for accurate floor tile clicks
        for (let r = 0; r < 8; r++) {
          for (let c = 0; c < 10; c++) {
            const quad = this.renderer.getPerspectiveTileQuad(c, r);
            if (
              y >= quad.topL.y &&
              y <= quad.botL.y &&
              x >= Math.min(quad.topL.x, quad.botL.x) &&
              x <= Math.max(quad.topR.x, quad.botR.x)
            ) {
              clickedCol = c;
              clickedRow = r;
              break;
            }
          }
          if (clickedCol !== -1) break;
        }

        // 2. If click landed outside ground grid, check tight monster sprite body bounds
        if (clickedCol === -1 && this.combatEngine && this.combatEngine.entities) {
          for (const ent of this.combatEngine.entities) {
            if (ent.isPlayer) continue;
            const quad = this.renderer.getPerspectiveTileQuad(ent.col, ent.row);
            const bodyMinX = quad.centerX - 25 * quad.scale;
            const bodyMaxX = quad.centerX + 25 * quad.scale;
            const bodyMinY = quad.centerY - 55 * quad.scale;
            const bodyMaxY = quad.centerY + 10 * quad.scale;

            if (x >= bodyMinX && x <= bodyMaxX && y >= bodyMinY && y <= bodyMaxY) {
              clickedCol = ent.col;
              clickedRow = ent.row;
              break;
            }
          }
        }

        if (clickedCol >= 0 && clickedCol < 10 && clickedRow >= 0 && clickedRow < 8) {
          this.combatEngine.handleTileClick(clickedCol, clickedRow);
          this.combatScene.updateAPUI();
        }
      }
    });
  }

  updateCanvasCursor(verb) {
    const cursorMap = {
      walk: { emoji: '🏃', color: '#6ee3a0', name: 'WALK' },
      look: { emoji: '👁️', color: '#f4be42', name: 'LOOK' },
      talk: { emoji: '💬', color: '#3a86ff', name: 'TALK' },
      do:   { emoji: '✋', color: '#ff7777', name: 'DO / INTERACT' },
      cast: { emoji: '⚔️', color: '#b56eff', name: 'FIGHT / CAST' }
    };

    const c = cursorMap[verb] || cursorMap.walk;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="2" dy="2" stdDeviation="2" flood-color="#000" flood-opacity="0.9"/>
      </filter>
      <circle cx="20" cy="20" r="17" fill="rgba(12, 22, 16, 0.88)" stroke="${c.color}" stroke-width="2.5" filter="url(#shadow)"/>
      <text x="20" y="27" font-size="22" text-anchor="middle">${c.emoji}</text>
    </svg>`;
    
    this.canvas.style.cursor = `url('data:image/svg+xml;utf8,${encodeURIComponent(svg)}') 20 20, auto`;
  }

  setVerb(verb) {
    this.explorationScene.setVerb(verb);
    synth.playClick();

    const verbBtns = document.querySelectorAll('.verb-btn');
    verbBtns.forEach(b => {
      if (b.getAttribute('data-verb') === verb) {
        b.classList.add('active');
      } else {
        b.classList.remove('active');
      }
    });

    this.updateCanvasCursor(verb);
    this.showNotification(`Active Cursor: [${verb.toUpperCase()}]`);
  }

  initCharacterCreation() {
    const charLayer = document.getElementById('char-create-layer');
    const creationScene = new CharacterCreationScene(charLayer, (heroClass, customStats) => {
      this.statSystem.initClass(heroClass);
      Object.assign(this.statSystem.stats, customStats);
      this.statSystem.recalculatePools();
      this.statSystem.fullRestore();
      this.playerState.heroClass = heroClass;

      this.mode = 'exploration';
      document.getElementById('top-hud-layer').style.display = 'flex';
      this.updateHUD();
      this.sierraScoreSystem.updateScoreBadge();
      this.showNotification(`Welcome to Spielburg, ${this.statSystem.heroName} the ${heroClass}! Right-Click to cycle cursors.`);
    });
    creationScene.render();
  }

  startWalkingPath(path, onArrival = null) {
    if (!path || path.length === 0) return;
    this.playerState.walkPath = [...path];
    this.playerState.isWalking = true;
    this.playerState.onArrivalCallback = onArrival;
  }

  updateMovement() {
    if (!this.playerState.isWalking || !this.playerState.walkPath || this.playerState.walkPath.length === 0) {
      this.playerState.isWalking = false;

      const room = this.explorationScene.getCurrentRoomData();
      if (room && room.exits) {
        if (this.playerState.x >= 1230 && room.exits.east && room.exits.east.room && this.explorationScene.rooms[room.exits.east.room]) {
          const ex = room.exits.east;
          this.explorationScene.changeRoom(ex.room, ex.spawnX, ex.spawnY);
        } else if (this.playerState.x <= 50 && room.exits.west && room.exits.west.room && this.explorationScene.rooms[room.exits.west.room]) {
          const ex = room.exits.west;
          this.explorationScene.changeRoom(ex.room, ex.spawnX, ex.spawnY);
        }
      }

      if (this.playerState.onArrivalCallback) {
        const cb = this.playerState.onArrivalCallback;
        this.playerState.onArrivalCallback = null;
        cb();
      }
      return;
    }

    const nextWp = this.playerState.walkPath[0];
    const dx = nextWp.x - this.playerState.x;
    const dy = nextWp.y - this.playerState.y;
    const dist = Math.hypot(dx, dy);

    // Calculate 8-Directional Facing Angle
    const angleRad = Math.atan2(dy, dx);
    const angleDeg = angleRad * (180 / Math.PI); // -180..180

    if (angleDeg >= -22.5 && angleDeg < 22.5) {
      this.playerState.facingDir = 'right';
    } else if (angleDeg >= 22.5 && angleDeg < 67.5) {
      this.playerState.facingDir = 'down_right';
    } else if (angleDeg >= 67.5 && angleDeg < 112.5) {
      this.playerState.facingDir = 'down';
    } else if (angleDeg >= 112.5 && angleDeg < 157.5) {
      this.playerState.facingDir = 'down_left';
    } else if (angleDeg >= 157.5 || angleDeg < -157.5) {
      this.playerState.facingDir = 'left';
    } else if (angleDeg >= -157.5 && angleDeg < -112.5) {
      this.playerState.facingDir = 'up_left';
    } else if (angleDeg >= -112.5 && angleDeg < -67.5) {
      this.playerState.facingDir = 'up';
    } else if (angleDeg >= -67.5 && angleDeg < -22.5) {
      this.playerState.facingDir = 'up_right';
    }

    if (dist <= this.playerState.walkSpeed) {
      this.playerState.x = nextWp.x;
      this.playerState.y = nextWp.y;
      this.playerState.walkPath.shift();
    } else {
      const nextX = this.playerState.x + (dx / dist) * this.playerState.walkSpeed;
      const nextY = this.playerState.y + (dy / dist) * this.playerState.walkSpeed;

      // Active Physical Collision Enforcement for obstacles marked isSolid !== false
      const room = this.explorationScene.getCurrentRoomData();
      let isBlocked = false;
      if (room && room.obstacles && room.obstacles.length > 0) {
        for (const obs of room.obstacles) {
          if (obs && obs.isSolid !== false && Pathfinder2D.isPointInObstacle(nextX, nextY, obs)) {
            // Check if hero was already inside (if so, allow escaping)
            const wasInside = Pathfinder2D.isPointInObstacle(this.playerState.x, this.playerState.y, obs);
            if (!wasInside) {
              isBlocked = true;
              break;
            }
          }
        }
      }

      if (isBlocked) {
        this.playerState.isWalking = false;
        this.playerState.walkPath = [];
        return;
      }

      this.playerState.x = nextX;
      this.playerState.y = nextY;
      this.playerState.walkStep += 1;

      if (this.playerState.isStealth) {
        this.statSystem.practiceStat('stealth', 1, (stat, val) => {
          this.showNotification(`🥷 STEALTH skill increased to ${val}!`);
        });
      }

      if (this.playerState.walkStep % 14 === 0) {
        synth.playFootstep();
      }
    }
  }

  startCombatMode(enemyType) {
    if (this.playerState.isStealth && Math.random() > 0.5) {
      this.showNotification('🥷 Sneaked silently past the monster without initiating combat!');
      this.statSystem.practiceStat('stealth', 15);
      return;
    }

    this.mode = 'combat';
    this.combatEngine.startBattle(enemyType);
    this.combatScene.render();
    this.updateCanvasCursor('cast');

    this.combatEngine.onBattleEndCallback = (isVictory) => {
      this.combatScene.hide();
      this.mode = 'exploration';
      this.updateHUD();
      this.updateCanvasCursor(this.explorationScene.currentVerb || 'walk');
      if (isVictory) {
        this.sierraScoreSystem.addPoints(`defeat_${enemyType}`, 25, `defeating ${enemyType} in combat`);
        this.showNotification('🎉 Returned to Spielburg Valley!');
      } else {
        this.showSierraDeathScreen(enemyType);
      }
    };
  }

  showSierraDeathScreen(enemyType) {
    synth.playHit();
    const dialogueLayer = document.getElementById('dialogue-layer');
    dialogueLayer.style.display = 'flex';
    dialogueLayer.innerHTML = `
      <div class="dialogue-modal parchment-card" style="width: 650px; border-color: #a83232; text-align: center;">
        <div style="font-family: var(--font-heading); font-size: 2rem; color: #a83232; font-weight: 800; margin-bottom: 10px;">
          ☠️ YOU HAVE MET A GRUESOME END!
        </div>
        <div style="font-size: 1.05rem; line-height: 1.6; color: var(--text-dark); margin-bottom: 22px;">
          You were defeated in battle by <strong>${enemyType}</strong>.<br><br>
          <em>"Perhaps you should practice your sword drills at the Guild Hall, brew healing elixirs with Sorceress Zara, or try sneaking in Stealth mode next time!"</em>
        </div>

        <div style="display: flex; gap: 12px; justify-content: center;">
          <button id="btn-death-load" class="btn-ghibli btn-emerald" style="padding: 10px 24px; font-size: 0.95rem;">📂 Restore Saved Game</button>
          <button id="btn-death-restart" class="btn-ghibli" style="padding: 10px 24px; font-size: 0.95rem;">🔄 Wake Up at Guildmaster's</button>
        </div>
      </div>
    `;

    dialogueLayer.querySelector('#btn-death-load').addEventListener('click', () => {
      this.saveLoadSystem.showSaveLoadModal('load');
    });

    dialogueLayer.querySelector('#btn-death-restart').addEventListener('click', () => {
      dialogueLayer.style.display = 'none';
      this.statSystem.fullRestore();
      this.explorationScene.changeRoom('guild_hall', 300, 480);
      this.updateHUD();
      this.showNotification('💫 Restored health and woke up inside Guildmaster Bruno\'s hall.');
    });
  }

  executeRest() {
    this.timeSystem.advanceTime(480);
    this.statSystem.fullRestore();
    synth.playStatUp();
    this.updateHUD();
    this.showNotification('🌙 Rested for 8 hours. HP, MP, and Stamina fully restored!');
  }

  updateHUD() {
    document.getElementById('player-hero-name').innerText = this.statSystem.heroName;
    document.getElementById('player-hero-class').innerText = `[${this.statSystem.heroClass}]`;

    const hpPct = (this.statSystem.hp.current / this.statSystem.hp.max) * 100;
    const mpPct = (this.statSystem.mp.current / this.statSystem.mp.max) * 100;
    const stPct = (this.statSystem.stamina.current / this.statSystem.stamina.max) * 100;

    document.getElementById('hp-bar-fill').style.width = `${hpPct}%`;
    document.getElementById('mp-bar-fill').style.width = `${mpPct}%`;
    document.getElementById('stamina-bar-fill').style.width = `${stPct}%`;

    document.getElementById('hp-text').innerText = `${this.statSystem.hp.current}/${this.statSystem.hp.max}`;
    document.getElementById('mp-text').innerText = `${this.statSystem.mp.current}/${this.statSystem.mp.max}`;
    document.getElementById('stamina-text').innerText = `${this.statSystem.stamina.current}/${this.statSystem.stamina.max}`;

    document.getElementById('time-display').innerText = this.timeSystem.getTimeString();
    this.sierraScoreSystem.updateScoreBadge();
  }

  showNotification(msg) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'notification-toast';
    toast.innerText = msg;
    container.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 3200);
  }

  showSpellbookModal() {
    const dialogueLayer = document.getElementById('dialogue-layer');
    dialogueLayer.style.display = 'flex';
    dialogueLayer.innerHTML = `
      <div class="dialogue-modal parchment-card" style="width: 680px;">
        <div style="font-family: var(--font-heading); font-size: 1.4rem; color: var(--text-dark); margin-bottom: 12px; font-weight: 700; border-bottom: 2px solid var(--parchment-border); padding-bottom: 8px;">
          🪄 Hero Spellbook & Grimoire
        </div>
        <div style="display: flex; flex-direction: column; gap: 10px; max-height: 300px; overflow-y: auto; margin-bottom: 16px;">
          ${Object.values(SPELL_CATALOG).map(spell => `
            <div style="background: rgba(255,255,255,0.55); border: 1px solid var(--parchment-border); padding: 10px 14px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
              <div>
                <span style="font-weight: 700; font-size: 1rem; color: #291e14;">${spell.name}</span>
                <span style="font-size: 0.8rem; color: var(--stat-mana); font-weight: 700; margin-left: 8px;">(${spell.mpCost} MP | ${spell.apCost} AP)</span>
                <div style="font-size: 0.82rem; color: #524030; margin-top: 2px;">${spell.desc}</div>
              </div>
              <button class="btn-ghibli btn-emerald" style="padding: 6px 14px;" onclick="window.gameEngineInstance?.showNotification('🪄 Selected ${spell.name} spell!')">Ready Spell</button>
            </div>
          `).join('')}
        </div>
        <button id="btn-close-spells" class="btn-ghibli" style="width: 100%; height: 42px; font-size: 1rem; justify-content: center;">Close Grimoire</button>
      </div>
    `;
    window.gameEngineInstance = this;
    dialogueLayer.querySelector('#btn-close-spells').addEventListener('click', () => {
      dialogueLayer.style.display = 'none';
    });
  }

  showStatsModal() {
    const dialogueLayer = document.getElementById('dialogue-layer');
    dialogueLayer.style.display = 'flex';
    dialogueLayer.innerHTML = `
      <div class="dialogue-modal parchment-card">
        <div style="font-family: var(--font-heading); font-size: 1.4rem; color: var(--text-dark); margin-bottom: 12px; font-weight: 700;">
          📜 ${this.statSystem.heroName} - ${this.statSystem.heroClass} Sheet
        </div>

        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 14px;">
          ${Object.entries(this.statSystem.stats).map(([k, v]) => `
            <div style="background: rgba(140, 109, 70, 0.18); border: 1px solid var(--parchment-border); padding: 10px 14px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
              <span style="font-weight: 700; text-transform: uppercase; font-size: 0.9rem; color: var(--text-dark);">${k}</span>
              <span style="font-weight: 800; color: #5e410c; font-size: 1.1rem; font-family: var(--font-heading);">${v}</span>
            </div>
          `).join('')}
        </div>

        <!-- Hero Cloak Customizer -->
        <div style="background: rgba(0,0,0,0.1); padding: 10px; border-radius: 8px; margin-bottom: 14px; display: flex; align-items: center; justify-content: space-between;">
          <span style="font-weight: 700; font-size: 0.9rem; color: var(--text-dark);">🎨 Hero Cloak Color:</span>
          <div style="display: flex; gap: 8px;">
            <button class="btn-cloak" data-color="#8b2626" style="width: 24px; height: 24px; border-radius: 50%; background: #8b2626; border: 2px solid #fff; cursor: pointer;"></button>
            <button class="btn-cloak" data-color="#387654" style="width: 24px; height: 24px; border-radius: 50%; background: #387654; border: 2px solid #fff; cursor: pointer;"></button>
            <button class="btn-cloak" data-color="#2b4c7e" style="width: 24px; height: 24px; border-radius: 50%; background: #2b4c7e; border: 2px solid #fff; cursor: pointer;"></button>
            <button class="btn-cloak" data-color="#1c1524" style="width: 24px; height: 24px; border-radius: 50%; background: #1c1524; border: 2px solid #fff; cursor: pointer;"></button>
            <button class="btn-cloak" data-color="#f4be42" style="width: 24px; height: 24px; border-radius: 50%; background: #f4be42; border: 2px solid #fff; cursor: pointer;"></button>
          </div>
        </div>

        <button id="btn-close-stats" class="btn-ghibli" style="width: 100%; height: 40px; font-size: 1rem; justify-content: center;">Close Sheet</button>
      </div>
    `;

    dialogueLayer.querySelectorAll('.btn-cloak').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const color = e.target.getAttribute('data-color');
        this.playerState.cloakColor = color;
        synth.playClick();
        this.showNotification('🎨 Updated Hero Cloak Color!');
      });
    });

    dialogueLayer.querySelector('#btn-close-stats').addEventListener('click', () => {
      dialogueLayer.style.display = 'none';
    });
  }

  showInventoryModal(targetScrollTop = 0) {
    const dialogueLayer = document.getElementById('dialogue-layer');
    dialogueLayer.style.display = 'flex';

    const eq = this.inventorySystem.equipment;
    const activeTab = this.activeInvTab || 'all';

    // Filter items based on active tab
    const filteredItems = this.inventorySystem.items.filter(item => {
      if (activeTab === 'all') return true;
      if (activeTab === 'gear') return item.type === 'equip';
      if (activeTab === 'consumable') return item.type === 'consumable';
      if (activeTab === 'tool') return item.type === 'tool' || item.type === 'quest';
      return true;
    });

    dialogueLayer.innerHTML = `
      <div class="dialogue-modal parchment-card" style="width: 820px; max-width: 95vw;">
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid var(--parchment-border); padding-bottom: 10px; margin-bottom: 14px;">
          <div>
            <span style="font-family: var(--font-heading); font-size: 1.4rem; font-weight: 800; color: var(--text-dark);">🛡️ Hero Paperdoll & Inventory</span>
            <div style="font-size: 0.8rem; color: #8c5a14; font-weight: 700;">Equip Weapons, Armor, Shields & Accessories to boost Combat Stats</div>
          </div>
          <span style="font-weight: 800; font-size: 1.1rem; color: #8c5a14; background: rgba(244, 190, 66, 0.25); padding: 4px 14px; border-radius: 20px; border: 1px solid var(--parchment-border);">💰 Gold: ${this.inventorySystem.gold}</span>
        </div>

        <!-- Paperdoll & Inventory 2-Column Grid -->
        <div style="display: grid; grid-template-columns: 1fr 1.2fr; gap: 16px; margin-bottom: 16px;">
          
          <!-- Column 1: Visual Equipment Paperdoll & Slots -->
          <div style="background: rgba(140, 109, 70, 0.15); border: 2px solid var(--parchment-border); padding: 14px; border-radius: 10px; display: flex; flex-direction: column; gap: 8px;">
            <div style="font-family: var(--font-heading); font-size: 0.95rem; font-weight: 800; color: #5e410c; text-align: center; border-bottom: 1px solid rgba(140,109,70,0.3); padding-bottom: 6px;">
              👤 Equipped Gear Slots
            </div>

            <!-- Shirt Slot -->
            <div class="paperdoll-slot" data-slot="shirt" style="background: rgba(255,255,255,0.6); border: 1px solid var(--parchment-border); padding: 6px 10px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 0.82rem; font-weight: 700; color: var(--text-dark);">👕 Shirt:</span>
              <span style="font-size: 0.82rem; font-weight: 800; color: ${eq.shirt ? '#387654' : '#888'};">${eq.shirt ? eq.shirt.icon + ' ' + eq.shirt.name : '[Empty]'}</span>
              ${eq.shirt ? `<button class="btn-unequip-slot" data-slot="shirt" style="padding: 2px 6px; font-size: 0.7rem; background: #a83232; color: #fff; border: none; border-radius: 4px; cursor: pointer;">Unequip</button>` : ''}
            </div>

            <!-- Pants Slot -->
            <div class="paperdoll-slot" data-slot="pants" style="background: rgba(255,255,255,0.6); border: 1px solid var(--parchment-border); padding: 6px 10px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 0.82rem; font-weight: 700; color: var(--text-dark);">👖 Pants/Robe:</span>
              <span style="font-size: 0.82rem; font-weight: 800; color: ${eq.pants ? '#2b4c7e' : '#888'};">${eq.pants ? eq.pants.icon + ' ' + eq.pants.name : '[Empty]'}</span>
              ${eq.pants ? `<button class="btn-unequip-slot" data-slot="pants" style="padding: 2px 6px; font-size: 0.7rem; background: #a83232; color: #fff; border: none; border-radius: 4px; cursor: pointer;">Unequip</button>` : ''}
            </div>

            <!-- Shoes Slot -->
            <div class="paperdoll-slot" data-slot="shoes" style="background: rgba(255,255,255,0.6); border: 1px solid var(--parchment-border); padding: 6px 10px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 0.82rem; font-weight: 700; color: var(--text-dark);">🥾 Shoes/Boots:</span>
              <span style="font-size: 0.82rem; font-weight: 800; color: ${eq.shoes ? '#5e410c' : '#888'};">${eq.shoes ? eq.shoes.icon + ' ' + eq.shoes.name : '[Empty]'}</span>
              ${eq.shoes ? `<button class="btn-unequip-slot" data-slot="shoes" style="padding: 2px 6px; font-size: 0.7rem; background: #a83232; color: #fff; border: none; border-radius: 4px; cursor: pointer;">Unequip</button>` : ''}
            </div>

            <!-- Helmet Slot -->
            <div class="paperdoll-slot" data-slot="helmet" style="background: rgba(255,255,255,0.6); border: 1px solid var(--parchment-border); padding: 6px 10px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 0.82rem; font-weight: 700; color: var(--text-dark);">🪖 Helmet/Hat:</span>
              <span style="font-size: 0.82rem; font-weight: 800; color: ${eq.helmet ? '#2b4c7e' : '#888'};">${eq.helmet ? eq.helmet.icon + ' ' + eq.helmet.name : '[Empty]'}</span>
              ${eq.helmet ? `<button class="btn-unequip-slot" data-slot="helmet" style="padding: 2px 6px; font-size: 0.7rem; background: #a83232; color: #fff; border: none; border-radius: 4px; cursor: pointer;">Unequip</button>` : ''}
            </div>

            <!-- Cowl Slot -->
            <div class="paperdoll-slot" data-slot="cowl" style="background: rgba(255,255,255,0.6); border: 1px solid var(--parchment-border); padding: 6px 10px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 0.82rem; font-weight: 700; color: var(--text-dark);">🥷 Cowl Hood:</span>
              <span style="font-size: 0.82rem; font-weight: 800; color: ${eq.cowl ? '#802bb0' : '#888'};">${eq.cowl ? eq.cowl.icon + ' ' + eq.cowl.name : '[Empty]'}</span>
              ${eq.cowl ? `<button class="btn-unequip-slot" data-slot="cowl" style="padding: 2px 6px; font-size: 0.7rem; background: #a83232; color: #fff; border: none; border-radius: 4px; cursor: pointer;">Unequip</button>` : ''}
            </div>

            <!-- Belt Slot -->
            <div class="paperdoll-slot" data-slot="belt" style="background: rgba(255,255,255,0.6); border: 1px solid var(--parchment-border); padding: 6px 10px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 0.82rem; font-weight: 700; color: var(--text-dark);">🥋 Belt:</span>
              <span style="font-size: 0.82rem; font-weight: 800; color: ${eq.belt ? '#8c5a14' : '#888'};">${eq.belt ? eq.belt.icon + ' ' + eq.belt.name : '[Empty]'}</span>
              ${eq.belt ? `<button class="btn-unequip-slot" data-slot="belt" style="padding: 2px 6px; font-size: 0.7rem; background: #a83232; color: #fff; border: none; border-radius: 4px; cursor: pointer;">Unequip</button>` : ''}
            </div>

            <!-- Amulet Slot -->
            <div class="paperdoll-slot" data-slot="amulet" style="background: rgba(255,255,255,0.6); border: 1px solid var(--parchment-border); padding: 6px 10px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 0.82rem; font-weight: 700; color: var(--text-dark);">📿 Amulet:</span>
              <span style="font-size: 0.82rem; font-weight: 800; color: ${eq.amulet ? '#ff2244' : '#888'};">${eq.amulet ? eq.amulet.icon + ' ' + eq.amulet.name : '[Empty]'}</span>
              ${eq.amulet ? `<button class="btn-unequip-slot" data-slot="amulet" style="padding: 2px 6px; font-size: 0.7rem; background: #a83232; color: #fff; border: none; border-radius: 4px; cursor: pointer;">Unequip</button>` : ''}
            </div>

            <!-- Headband Slot -->
            <div class="paperdoll-slot" data-slot="headband" style="background: rgba(255,255,255,0.6); border: 1px solid var(--parchment-border); padding: 6px 10px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 0.82rem; font-weight: 700; color: var(--text-dark);">👑 Headband/Circlet:</span>
              <span style="font-size: 0.82rem; font-weight: 800; color: ${eq.headband ? '#d4af37' : '#888'};">${eq.headband ? eq.headband.icon + ' ' + eq.headband.name : '[Empty]'}</span>
              ${eq.headband ? `<button class="btn-unequip-slot" data-slot="headband" style="padding: 2px 6px; font-size: 0.7rem; background: #a83232; color: #fff; border: none; border-radius: 4px; cursor: pointer;">Unequip</button>` : ''}
            </div>

            <!-- Cape Slot -->
            <div class="paperdoll-slot" data-slot="cape" style="background: rgba(255,255,255,0.6); border: 1px solid var(--parchment-border); padding: 6px 10px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 0.82rem; font-weight: 700; color: var(--text-dark);">🦹 Cape/Cloak:</span>
              <span style="font-size: 0.82rem; font-weight: 800; color: ${eq.cape ? (eq.cape.color || '#8b2626') : '#888'};">${eq.cape ? eq.cape.icon + ' ' + eq.cape.name : '[Empty]'}</span>
              ${eq.cape ? `<button class="btn-unequip-slot" data-slot="cape" style="padding: 2px 6px; font-size: 0.7rem; background: #a83232; color: #fff; border: none; border-radius: 4px; cursor: pointer;">Unequip</button>` : ''}
            </div>

            <!-- Strip Clothes / Underwear Action -->
            <button id="btn-strip-all-gear" class="btn-ghibli btn-crimson" style="width: 100%; padding: 6px; font-size: 0.8rem; margin-top: 4px;">👙 Take Off Clothes & Strip to Underwear</button>
          </div>

          <!-- Column 2: Satchel Items & Category Tabs -->
          <div style="display: flex; flex-direction: column; gap: 8px;">
            
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(140,109,70,0.3); padding-bottom: 6px;">
              <span style="font-family: var(--font-heading); font-size: 0.95rem; font-weight: 800; color: #5e410c;">🎒 Satchel Inventory Items</span>
              <span style="font-size: 0.78rem; color: #8c5a14; font-weight: 700;">Count: ${filteredItems.length} items</span>
            </div>

            <!-- Category Tabs Header -->
            <div style="display: flex; gap: 6px; background: rgba(140,109,70,0.15); padding: 4px; border-radius: 8px; border: 1px solid var(--parchment-border);">
              <button class="btn-inv-tab ${activeTab === 'all' ? 'active-tab' : ''}" data-tab="all" style="flex: 1; padding: 4px 6px; font-size: 0.78rem; font-weight: 800; border-radius: 6px; border: 1px solid ${activeTab === 'all' ? '#8c5a14' : 'transparent'}; background: ${activeTab === 'all' ? '#ffffff' : 'transparent'}; color: ${activeTab === 'all' ? '#291e14' : '#6b4f38'}; cursor: pointer;">✨ All</button>
              <button class="btn-inv-tab ${activeTab === 'gear' ? 'active-tab' : ''}" data-tab="gear" style="flex: 1; padding: 4px 6px; font-size: 0.78rem; font-weight: 800; border-radius: 6px; border: 1px solid ${activeTab === 'gear' ? '#8c5a14' : 'transparent'}; background: ${activeTab === 'gear' ? '#ffffff' : 'transparent'}; color: ${activeTab === 'gear' ? '#291e14' : '#6b4f38'}; cursor: pointer;">⚔️ Gear</button>
              <button class="btn-inv-tab ${activeTab === 'consumable' ? 'active-tab' : ''}" data-tab="consumable" style="flex: 1; padding: 4px 6px; font-size: 0.78rem; font-weight: 800; border-radius: 6px; border: 1px solid ${activeTab === 'consumable' ? '#8c5a14' : 'transparent'}; background: ${activeTab === 'consumable' ? '#ffffff' : 'transparent'}; color: ${activeTab === 'consumable' ? '#291e14' : '#6b4f38'}; cursor: pointer;">🧪 Potions</button>
              <button class="btn-inv-tab ${activeTab === 'tool' ? 'active-tab' : ''}" data-tab="tool" style="flex: 1; padding: 4px 6px; font-size: 0.78rem; font-weight: 800; border-radius: 6px; border: 1px solid ${activeTab === 'tool' ? '#8c5a14' : 'transparent'}; background: ${activeTab === 'tool' ? '#ffffff' : 'transparent'}; color: ${activeTab === 'tool' ? '#291e14' : '#6b4f38'}; cursor: pointer;">🗝️ Tools</button>
            </div>

            <!-- Scrollable Items Container (Preserves Scroll Position!) -->
            <div id="satchel-items-container" style="display: flex; flex-direction: column; gap: 8px; max-height: 320px; overflow-y: auto; padding-right: 4px;">
              ${filteredItems.length === 0 ? `<div style="text-align: center; padding: 20px; color: #888; font-style: italic;">No items in this category.</div>` : ''}

              ${filteredItems.map(item => `
                <div style="background: rgba(255, 255, 255, 0.55); border: 1px solid var(--parchment-border); padding: 8px 12px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; gap: 10px;">
                  <div style="display: flex; align-items: center; gap: 10px; flex: 1;">
                    <span style="font-size: 1.5rem; flex-shrink: 0;">${item.icon}</span>
                    <div>
                      <div style="font-weight: 700; font-size: 0.9rem; color: #291e14;">${item.name} ${item.count > 1 ? `<span style="color: #8c5a14;">(x${item.count})</span>` : ''}</div>
                      <div style="font-size: 0.78rem; color: #524030; margin-top: 2px;">${item.desc}</div>
                    </div>
                  </div>
                  <div style="flex-shrink: 0;">
                    ${item.type === 'consumable' ? `<button class="btn-ghibli btn-use-item" data-id="${item.id}" style="padding: 4px 10px; font-size: 0.8rem;">Use</button>` : ''}
                    ${item.type === 'equip' ? `<button class="btn-ghibli btn-emerald btn-equip-item" data-id="${item.id}" style="padding: 4px 10px; font-size: 0.8rem;">${this.inventorySystem.equipment[item.slot]?.id === item.id ? 'Equipped' : 'Equip'}</button>` : ''}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- Full Width Close Button -->
        <button id="btn-close-inv" class="btn-ghibli" style="width: 100%; height: 42px; font-size: 1rem; justify-content: center;">Close Paperdoll</button>
      </div>
    `;

    // Restore Satchel Scroll Position!
    const satchelContainer = dialogueLayer.querySelector('#satchel-items-container');
    if (satchelContainer && targetScrollTop > 0) {
      satchelContainer.scrollTop = targetScrollTop;
    }

    const getScrollTop = () => satchelContainer ? satchelContainer.scrollTop : 0;

    // Tab Filter Buttons Listener
    dialogueLayer.querySelectorAll('.btn-inv-tab').forEach(btn => {
      btn.addEventListener('click', (e) => {
        synth.playClick();
        this.activeInvTab = e.currentTarget.getAttribute('data-tab');
        this.showInventoryModal(0);
      });
    });

    const stripBtn = dialogueLayer.querySelector('#btn-strip-all-gear');
    if (stripBtn) {
      stripBtn.addEventListener('click', () => {
        synth.playClick();
        Object.keys(this.inventorySystem.equipment).forEach(slot => {
          this.inventorySystem.unequipItem(slot, this.statSystem);
        });
        this.showNotification('👙 Took off all clothes & armor! Hero is in underwear.');
        this.updateHUD();
        this.showInventoryModal(getScrollTop());
      });
    }

    dialogueLayer.querySelectorAll('.btn-use-item').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        const currScroll = getScrollTop();
        if (this.inventorySystem.useItem(id, this.statSystem)) {
          synth.playStatUp();
          this.updateHUD();
          this.showInventoryModal(currScroll);
        }
      });
    });

    dialogueLayer.querySelectorAll('.btn-equip-item').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        const currScroll = getScrollTop();
        if (this.inventorySystem.equipItem(id, this.statSystem)) {
          synth.playStatUp();
          this.updateHUD();
          this.showInventoryModal(currScroll);
          this.showNotification('🛡️ Equipped item & updated Hero stats!');
        }
      });
    });

    dialogueLayer.querySelectorAll('.btn-unequip-slot').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const slot = e.currentTarget.getAttribute('data-slot');
        const currScroll = getScrollTop();
        if (this.inventorySystem.unequipItem(slot, this.statSystem)) {
          synth.playClick();
          this.updateHUD();
          this.showInventoryModal(currScroll);
          this.showNotification(`🛡️ Unequipped ${slot}!`);
        }
      });
    });

    dialogueLayer.querySelector('#btn-close-inv').addEventListener('click', () => {
      dialogueLayer.style.display = 'none';
    });
  }

  showScoreBreakdownModal() {
    const dialogueLayer = document.getElementById('dialogue-layer');
    dialogueLayer.style.display = 'flex';

    const rankTitle = this.sierraScoreSystem.getRankTitle();
    const logs = this.sierraScoreSystem.scoreLog;

    dialogueLayer.innerHTML = `
      <div class="dialogue-modal parchment-card" style="width: 740px; max-width: 95vw;">
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid var(--parchment-border); padding-bottom: 10px; margin-bottom: 14px;">
          <div>
            <span style="font-family: var(--font-heading); font-size: 1.4rem; font-weight: 800; color: var(--text-dark);">📜 Sierra Score & Quest Points Breakdown</span>
            <div style="font-size: 0.85rem; color: #8c5a14; font-weight: 700;">Hero Rank: <span style="color: #2b4c7e;">${rankTitle}</span></div>
          </div>
          <span style="font-weight: 800; font-size: 1.2rem; color: var(--ghibli-sun-gold); background: rgba(0, 0, 0, 0.7); padding: 6px 16px; border-radius: 20px; border: 1px solid var(--parchment-border);">
            Score: ${this.sierraScoreSystem.score} / ${this.sierraScoreSystem.maxScore}
          </span>
        </div>

        <!-- Point History Log List -->
        <div style="display: flex; flex-direction: column; gap: 8px; max-height: 320px; overflow-y: auto; padding-right: 4px; margin-bottom: 16px;">
          ${logs.length > 0 ? logs.map(item => `
            <div style="background: rgba(255, 255, 255, 0.6); border: 1px solid var(--parchment-border); padding: 10px 14px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
              <div>
                <span style="font-weight: 800; font-size: 0.95rem; color: #291e14;">${item.reason}</span>
                <div style="font-size: 0.78rem; color: #7a5a3a; margin-top: 2px;">Recorded at ${item.timestamp}</div>
              </div>
              <span style="font-family: var(--font-heading); font-weight: 800; font-size: 1.05rem; color: #387654; background: rgba(78, 163, 115, 0.2); padding: 3px 10px; border-radius: 12px; border: 1px solid #4ea373;">
                +${item.points} pts
              </span>
            </div>
          `).join('') : `
            <div style="text-align: center; padding: 30px; font-size: 1rem; color: #666; font-style: italic;">
              No Sierra points recorded yet. Explore Spielburg Valley and complete quest bounties to earn points!
            </div>
          `}
        </div>

        <!-- Close Button -->
        <button id="btn-close-score-modal" class="btn-ghibli" style="width: 100%; height: 42px; font-size: 1rem; justify-content: center;">Close Score Breakdown</button>
      </div>
    `;

    dialogueLayer.querySelector('#btn-close-score-modal').addEventListener('click', () => {
      dialogueLayer.style.display = 'none';
      synth.playClick();
    });
  }

  showVictoryEpilogue() {
    synth.playStatUp();
    this.sierraScoreSystem.addPoints('archlich_victory', 50, 'defeating the Shadow Arch-Lich and saving Spielburg');
    const dialogueLayer = document.getElementById('dialogue-layer');
    dialogueLayer.style.display = 'flex';
    dialogueLayer.innerHTML = `
      <div class="dialogue-modal parchment-card" style="width: 720px; text-align: center;">
        <div style="font-family: var(--font-heading); font-size: 2.2rem; color: #543714; font-weight: 800; margin-bottom: 10px;">
          🌟 HERO OF THE REALM! 🌟
        </div>
        <div style="font-size: 1.1rem; line-height: 1.6; color: var(--text-dark); margin-bottom: 20px;">
          With a final stroke of courage, ${this.statSystem.heroName} the ${this.statSystem.heroClass} shattered the Void Rift and vanquished the Shadow Arch-Lich!<br><br>
          Sunlight returns to Spielburg Valley! Guildmaster Bruno, Sorceress Zara, and the villagers celebrate your heroic deeds in song and legend.
        </div>
        <button id="btn-victory-continue" class="btn-ghibli btn-emerald" style="width: 100%; height: 48px; font-size: 1.1rem; justify-content: center;">Continue Free Exploration</button>
      </div>
    `;
    dialogueLayer.querySelector('#btn-victory-continue').addEventListener('click', () => {
      dialogueLayer.style.display = 'none';
      this.explorationScene.changeRoom('town_square', 650, 450);
    });
  }

  startLoop() {
    const loop = () => {
      this.updateMovement();
      this.updateHUD();

      if (this.mode === 'exploration') {
        const roomData = this.explorationScene.getCurrentRoomData();
        this.renderer.renderExplorationScene(roomData, this.playerState, this.timeSystem, roomData.hotspots);
      } else if (this.mode === 'combat') {
        this.renderer.renderCombatScene(this.combatEngine, this.timeSystem);
      }

      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new GameEngine();
});
