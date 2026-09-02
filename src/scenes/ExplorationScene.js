import { synth } from '../engine/SoundSynth.js';
import { Pathfinder2D } from '../engine/Pathfinder2D.js';

export class ExplorationScene {
  constructor(gameEngine) {
    this.gameEngine = gameEngine;
    this.currentRoom = 'town_square';
    this.activeVerb = 'walk'; // 'walk' | 'look' | 'talk' | 'do' | 'cast'
    this.isSunGateUnlocked = false;

    // Background Images for Rooms
    this.bgImages = {
      town_square: new Image(),
      magic_shop: new Image(),
      guild_hall: new Image(),
      forest_path: new Image(),
      deep_forest: new Image(),
      goblin_camp: new Image(),
      goblin_vault: new Image(),
      citadel_gate: new Image(),
      throne_room: new Image(),
      thief_hideout: new Image()
    };

    this.bgImages.town_square.src = '/town_square.jpg';
    this.bgImages.magic_shop.src = '/magic_shop.jpg';
    this.bgImages.guild_hall.src = '/guild_hall.jpg';
    this.bgImages.forest_path.src = '/forest.jpg';
    this.bgImages.deep_forest.src = '/forest.jpg';
    this.bgImages.goblin_camp.src = '/forest.jpg';
    this.bgImages.goblin_vault.src = '/guild_hall.jpg';
    this.bgImages.citadel_gate.src = '/forest.jpg';
    this.bgImages.throne_room.src = '/guild_hall.jpg';
    this.bgImages.thief_hideout.src = '/guild_hall.jpg';

    // Room Definitions
    this.rooms = {
      town_square: {
        id: 'town_square',
        title: 'Spielburg Town Square & Market',
        bgImage: this.bgImages.town_square,
        desc: 'A bustling medieval cobble square with a marble fountain, tavern notices, and merchant stalls.',
        bounds: { xMin: 50, xMax: 1230, yMin: 320, yMax: 650 },
        exits: {
          east: { room: 'forest_path', spawnX: 80, spawnY: 450, msg: 'Traveled east to Mistvale Forest.' },
          north: { room: 'guild_hall', spawnX: 640, spawnY: 600, msg: 'Entered Adventurers Guild Hall.' },
          west: { room: 'magic_shop', spawnX: 1100, spawnY: 450, msg: 'Entered Zara\'s Arcane Shop.' }
        },
        obstacles: [
          { id: 'obs_fountain', type: 'circle', x: 650, y: 390, radius: 45 },
          { id: 'obs_house_left', type: 'rect', x: 0, y: 0, w: 260, h: 330 },
          { id: 'obs_house_right', type: 'rect', x: 960, y: 0, w: 320, h: 330 }
        ],
        props: [
          { id: 'prop_fountain', label: '⛲ Spielburg Fountain', icon: '⛲', x: 650, y: 440, depthY: 440, isInteractable: false }
        ],
        hotspots: [
          { id: 'fountain', label: '⛲ Marble Fountain', x: 600, y: 400, w: 100, h: 80, type: 'action', action: 'drink_fountain', desc: 'Cool mountain spring water. Restores 10 HP.' },
          { id: 'notice_board', label: '📌 Notice Board', x: 780, y: 360, w: 80, h: 90, type: 'action', action: 'open_notice_board', desc: 'Bounty notices posted by the Town Sheriff & Guildmaster Bruno.' },
          { id: 'guild_door', label: '⚔️ Adventurers Guild Entrance', x: 600, y: 260, w: 120, h: 100, type: 'door', targetRoom: 'guild_hall', spawnX: 640, spawnY: 600, desc: 'Door leading into the Adventurers Guild Hall.' },
          { id: 'magic_door', label: '🔮 Zara\'s Arcane Shop', x: 280, y: 320, w: 100, h: 100, type: 'door', targetRoom: 'magic_shop', spawnX: 1100, spawnY: 450, desc: 'Shop of Zara the Sorceress.' },
          { id: 'forest_exit', label: '🌲 Road to Mistvale Forest', x: 1160, y: 360, w: 120, h: 220, type: 'door', targetRoom: 'forest_path', spawnX: 80, spawnY: 450, desc: 'Dirt road heading east into Mistvale Forest.' },
          { id: 'dagger_target', label: '🎯 Dagger Target Board', x: 180, y: 420, w: 80, h: 80, type: 'action', action: 'throw_dagger', desc: 'Wooden target board for dagger throwing drills.' }
        ]
      },
      magic_shop: {
        id: 'magic_shop',
        title: 'Zara\'s Arcane Sanctum & Shop',
        bgImage: this.bgImages.magic_shop,
        desc: 'A mystical chamber filled with glowing potions, ancient scrolls, and floating crystals.',
        bounds: { xMin: 100, xMax: 1180, yMin: 340, yMax: 640 },
        exits: {
          east: { room: 'town_square', spawnX: 300, spawnY: 450, msg: 'Returned to Town Square.' }
        },
        obstacles: [],
        props: [],
        hotspots: [
          { id: 'zara_npc', label: '🔮 Zara the Sorceress', x: 500, y: 360, w: 100, h: 120, type: 'npc', npcId: 'zara', desc: 'Zara the Sorceress brewing arcane elixirs.' },
          { id: 'magic_runes', label: '✨ Arcane Runes', x: 750, y: 380, w: 120, h: 100, type: 'action', action: 'practice_magic', desc: 'Glowing magical runes inscribed on a stone tablet.' },
          { id: 'exit_shop', label: '🚪 Exit to Town Square', x: 1080, y: 380, w: 100, h: 200, type: 'door', targetRoom: 'town_square', spawnX: 300, spawnY: 450, desc: 'Door exiting back to Town Square.' }
        ]
      },
      guild_hall: {
        id: 'guild_hall',
        title: 'Spielburg Adventurers Guild Hall',
        bgImage: this.bgImages.guild_hall,
        desc: 'A sturdy timber hall hung with beast trophies, guild banners, and training dummies.',
        bounds: { xMin: 120, xMax: 1140, yMin: 360, yMax: 640 },
        exits: {
          south: { room: 'town_square', spawnX: 640, spawnY: 340, msg: 'Returned to Town Square.' }
        },
        obstacles: [],
        props: [],
        hotspots: [
          { id: 'bruno_npc', label: '⚔️ Guildmaster Bruno', x: 480, y: 340, w: 100, h: 120, type: 'npc', npcId: 'guildmaster', desc: 'Guildmaster Bruno, veteran warrior of Spielburg.' },
          { id: 'dummy', label: '🎯 Training Dummy', x: 750, y: 380, w: 90, h: 100, type: 'action', action: 'practice_sword', desc: 'Straw training dummy for practicing sword drills.' },
          { id: 'exit_guild', label: '🚪 Exit to Town Square', x: 580, y: 580, w: 140, h: 80, type: 'door', targetRoom: 'town_square', spawnX: 640, spawnY: 340, desc: 'Main entrance back out to Town Square.' }
        ]
      },
      forest_path: {
        id: 'forest_path',
        title: 'Mistvale Forest Path & Sun Gate',
        bgImage: this.bgImages.forest_path,
        desc: 'A dense sun-dappled forest path. An ancient Rune Sun Gate blocks entry to Whispering Cavern.',
        bounds: { xMin: 50, xMax: 1230, yMin: 320, yMax: 650 },
        exits: {
          west: { room: 'town_square', spawnX: 1140, spawnY: 450, msg: 'Returned to Town Square.' }
        },
        obstacles: [
          { id: 'obs_rock_1', type: 'polygon', label: '🪨 Mossy Scenery Boulder', isCutout: true, isSolid: false, depthY: 480, points: [{ x: 480, y: 380 }, { x: 620, y: 350 }, { x: 580, y: 480 }, { x: 400, y: 450 }] },
          { id: 'obs_rock_base', type: 'rect', label: '🪨 Physical Rock Base', isCutout: false, isSolid: true, x: 420, y: 440, w: 160, h: 40 }
        ],
        props: [
          { id: 'prop_pine', label: '🌲 Ancient Pine Tree', icon: '🌲', x: 240, y: 450, depthY: 450, isInteractable: false },
          { id: 'prop_moonflower', label: '🌸 Moonflower Herb', icon: '🌸', x: 735, y: 430, depthY: 430, isInteractable: true, action: 'pick_moonflower' }
        ],
        hotspots: [
          { id: 'hs_sun_gate', label: '☀️ Rune Sun Gate (Whispering Cavern)', x: 920, y: 300, w: 180, h: 200, type: 'action', action: 'interact_sun_gate', desc: 'An ancient stone gate bearing glowing sun runes. Blocks entry to Whispering Cavern.' },
          { id: 'deep_woods', label: '🌲 Deep Forest Grove (North Path)', x: 550, y: 260, w: 180, h: 140, type: 'door', targetRoom: 'deep_forest', spawnX: 640, spawnY: 620, desc: 'Path winding north into Deep Mistvale Wilderness.' },
          { id: 'moonflower', label: '🌸 Moonflower Herb', x: 690, y: 400, w: 90, h: 80, type: 'action', action: 'pick_moonflower', desc: 'A rare glowing blue Moonflower growing near the mossy stones.' },
          { id: 'battle_goblin', label: '👺 Goblin Spearman (Grid Combat)', x: 380, y: 340, w: 140, h: 160, type: 'combat', enemyType: 'Goblin Spearman', desc: 'A patrol of armed goblin spearmen marching in the clearing.' },
          { id: 'exit_square', label: '🌉 Stone Bridge (Return to Town)', x: 60, y: 380, w: 160, h: 220, type: 'door', targetRoom: 'town_square', spawnX: 1180, spawnY: 450, desc: 'Stone bridge leading back to Spielburg Village.' }
        ]
      },
      deep_forest: {
        id: 'deep_forest',
        title: 'Deep Mistvale Wilderness & Sacred Grove',
        bgImage: this.bgImages.deep_forest,
        desc: 'An ancient, mist-shrouded grove with luminescent flora and sacred elven ruins.',
        bounds: { xMin: 40, xMax: 1240, yMin: 300, yMax: 660 },
        exits: {
          south: { room: 'forest_path', spawnX: 640, spawnY: 420, msg: 'Walked south back to Forest Path.' }
        },
        obstacles: [],
        props: [],
        hotspots: [
          { id: 'scroll_fetch', label: '📜 Arcana Scroll of Fetch', x: 620, y: 420, w: 100, h: 80, type: 'action', action: 'learn_fetch', desc: 'An ancient parchment scroll granting the telekinetic Fetch spell.' },
          { id: 'exit_forest', label: '🚪 Return to Forest Path', x: 100, y: 400, w: 160, h: 220, type: 'door', targetRoom: 'forest_path', spawnX: 640, spawnY: 420, desc: 'Path leading south back to Mistvale Forest clearing.' }
        ]
      },
      goblin_camp: {
        id: 'goblin_camp',
        title: 'Whispering Cavern & Goblin Camp',
        bgImage: this.bgImages.goblin_camp,
        desc: 'A smoky cavern war camp filled with bonfires and stolen guild treasures. The Goblin Chieftain commands the camp!',
        bounds: { xMin: 40, xMax: 1240, yMin: 300, yMax: 660 },
        exits: {
          west: { room: 'forest_path', spawnX: 920, spawnY: 450, msg: 'Walked west back to Forest Path.' }
        },
        obstacles: [
          { id: 'obs_bonfire', type: 'circle', x: 640, y: 450, radius: 80 }
        ],
        props: [
          { id: 'prop_bonfire', label: '🔥 Goblin Bonfire', icon: '🔥', x: 640, y: 450, depthY: 450, isInteractable: false }
        ],
        hotspots: [
          { id: 'battle_chieftain', label: '👑 Fight Goblin Chieftain (BOSS)', x: 550, y: 320, w: 180, h: 200, type: 'combat', enemyType: 'Goblin Chieftain', desc: 'The massive Goblin Chieftain holding the stolen Sun Amulet of Spielburg!' },
          { id: 'goblin_vault_door', label: '🗝️ Stronghold Vault Entrance', x: 880, y: 340, w: 160, h: 180, type: 'door', targetRoom: 'goblin_vault', spawnX: 200, spawnY: 480, desc: 'Heavy wooden doors leading into the Goblin Vault.' }
        ]
      },
      goblin_vault: {
        id: 'goblin_vault',
        title: 'Goblin Stronghold Vault & Treasure Pile',
        bgImage: this.bgImages.goblin_vault,
        desc: 'A stone vault filled with piles of stolen gold coins and the legendary Paladin Shield.',
        bounds: { xMin: 120, xMax: 1140, yMin: 360, yMax: 640 },
        exits: {
          east: { room: 'citadel_gate', spawnX: 80, spawnY: 450, msg: 'Walked east toward the Shadow Citadel!' }
        },
        obstacles: [],
        props: [],
        hotspots: [
          { id: 'paladin_shield', label: '🛡️ Legendary Paladin Shield', x: 620, y: 400, w: 120, h: 100, type: 'action', action: 'claim_paladin_shield', desc: 'A gleaming holy shield granting +15 Parry and unlocking the Paladin Class Path!' },
          { id: 'exit_camp', label: '🚪 Return to Goblin Camp', x: 100, y: 380, w: 140, h: 240, type: 'door', targetRoom: 'goblin_camp', spawnX: 880, spawnY: 480, desc: 'Door exiting back out to the Goblin Encampment.' }
        ]
      },
      citadel_gate: {
        id: 'citadel_gate',
        title: 'The Shadow Citadel Entrance',
        bgImage: this.bgImages.citadel_gate,
        desc: 'Dark obsidian walls topped with stone gargoyles. Dark void rifts crackle in the air.',
        bounds: { xMin: 40, xMax: 1240, yMin: 300, yMax: 660 },
        exits: {
          west: { room: 'goblin_vault', spawnX: 1180, spawnY: 450, msg: 'Walked west back to Goblin Vault.' }
        },
        obstacles: [],
        props: [],
        hotspots: [
          { id: 'throne_door', label: '💀 Enter Void Throne Room', x: 560, y: 280, w: 180, h: 180, type: 'door', targetRoom: 'throne_room', spawnX: 200, spawnY: 480, desc: 'Heavy dark iron doors leading into the Void Throne Room!' }
        ]
      },
      throne_room: {
        id: 'throne_room',
        title: 'The Void Throne Room (FINAL BOSS)',
        bgImage: this.bgImages.throne_room,
        desc: 'An obsidian hall hovering above a purple void rift. The Shadow Arch-Lich awaits!',
        bounds: { xMin: 120, xMax: 1140, yMin: 360, yMax: 640 },
        exits: {},
        obstacles: [],
        props: [],
        hotspots: [
          { id: 'battle_archlich', label: '💀 FIGHT THE SHADOW ARCH-LICH (FINAL BOSS)', x: 550, y: 300, w: 180, h: 200, type: 'combat', enemyType: 'Shadow Arch-Lich', desc: 'The supreme dark sorcerer of the realm wielding void magic!' },
          { id: 'exit_citadel', label: '🚪 Exit Citadel', x: 100, y: 380, w: 140, h: 240, type: 'door', targetRoom: 'citadel_gate', spawnX: 560, spawnY: 480, desc: 'Exit back to Citadel Gate.' }
        ]
      },
      thief_hideout: {
        id: 'thief_hideout',
        title: 'Secret Thieves Guild Hideout',
        bgImage: this.bgImages.thief_hideout,
        desc: 'An underground den filled with contraband, rogue training lockboxes, and dark alcoves.',
        bounds: { xMin: 120, xMax: 1140, yMin: 360, yMax: 640 },
        exits: {},
        obstacles: [],
        props: [],
        hotspots: [
          { id: 'exit_square', label: '🚪 Exit to Shadow Alley', x: 100, y: 380, w: 140, h: 240, type: 'door', targetRoom: 'town_square', spawnX: 420, spawnY: 450, desc: 'Ladder leading back up to Shadow Alley.' }
        ]
      }
    };
  }

  getCurrentRoomData() {
    return this.rooms[this.currentRoom];
  }

  setVerb(verb) {
    this.activeVerb = verb;
    synth.playClick();
  }

  handleCanvasClick(x, y, heroPos) {
    const room = this.getCurrentRoomData();
    const hit = room.hotspots.find(hs => x >= hs.x && x <= hs.x + hs.w && y >= hs.y && y <= hs.y + hs.h);

    if (this.activeVerb === 'look') {
      if (hit) {
        this.gameEngine.showNotification(`👁️ LOOK: ${hit.desc}`);
      } else {
        this.gameEngine.showNotification(`👁️ LOOK: ${room.desc}`);
      }
      return;
    }

    if (this.activeVerb === 'walk' || !hit) {
      const path = Pathfinder2D.findPath(heroPos.x, heroPos.y, x, y, room.obstacles, room.bounds);
      this.gameEngine.startWalkingPath(path);
      return;
    }

    const targetCenterX = hit.x + hit.w / 2;
    const targetCenterY = hit.y + hit.h / 2;
    const dist = Math.hypot(heroPos.x - targetCenterX, heroPos.y - targetCenterY);

    if (dist > 180) {
      this.gameEngine.showNotification('🚶 Walking over to target...');
      const path = Pathfinder2D.findPath(heroPos.x, heroPos.y, targetCenterX, targetCenterY + 40, room.obstacles, room.bounds);
      this.gameEngine.startWalkingPath(path, () => {
        this.executeInteraction(hit);
      });
    } else {
      this.executeInteraction(hit);
    }
  }

  executeInteraction(hit) {
    synth.playClick();

    if (hit.type === 'npc') {
      if (hit.npcId === 'zara') {
        this.gameEngine.merchantSystem.showShopModal();
      } else {
        this.triggerNPCDialogue(hit.npcId);
      }
      return;
    }

    if (this.activeVerb === 'talk') {
      this.gameEngine.showNotification('Talking to yourself won\'t help much!');
    } else if (this.activeVerb === 'do' || hit.type === 'door' || hit.type === 'combat') {
      if (hit.type === 'door') {
        this.changeRoom(hit.targetRoom, hit.spawnX, hit.spawnY);
      } else if (hit.type === 'action') {
        this.handleSpecialAction(hit.action);
      } else if (hit.type === 'combat') {
        this.gameEngine.startCombatMode(hit.enemyType);
      }
    } else if (this.activeVerb === 'cast') {
      if (this.gameEngine.statSystem.stats.magic > 0) {
        synth.playSpell();
        this.gameEngine.statSystem.practiceStat('magic', 20);
        this.gameEngine.showNotification(`🪄 Cast Open / Fetch spell on ${hit.label}! (+Magic XP)`);
        if (hit.action === 'interact_sun_gate') {
          this.isSunGateUnlocked = true;
          this.gameEngine.sierraScoreSystem.addPoints('sun_gate_spell', 25, 'unsealing the Rune Sun Gate with Open spell');
          this.gameEngine.showNotification('✨ OPEN SPELL UNSEALED THE RUNE SUN GATE! Access to Whispering Cavern unlocked!');
          this.changeRoom('goblin_camp', 200, 480);
        }
      } else {
        this.gameEngine.showNotification('You don\'t know any magic spells yet! (Magic stat is 0)');
      }
    }
  }

  changeRoom(targetRoom, spawnX = 300, spawnY = 450) {
    this.currentRoom = targetRoom;
    this.gameEngine.timeSystem.advanceTime(15);
    this.gameEngine.playerState.x = spawnX;
    this.gameEngine.playerState.y = spawnY;
    this.gameEngine.playerState.isWalking = false;
    this.gameEngine.playerState.walkPath = [];
    this.gameEngine.showNotification(`Entered ${this.rooms[this.currentRoom].title}`);

    // Award discovery points for new rooms!
    this.gameEngine.sierraScoreSystem.addPoints(`explore_${targetRoom}`, 10, `discovering ${this.rooms[targetRoom].title}`);
  }

  handleSpecialAction(action) {
    if (action === 'interact_sun_gate') {
      if (this.isSunGateUnlocked || this.gameEngine.inventorySystem.hasItem('sun_amulet')) {
        this.changeRoom('goblin_camp', 200, 480);
        return;
      }

      const hClass = this.gameEngine.statSystem.heroClass || 'Fighter';
      if (hClass === 'Magic User') {
        synth.playSpell();
        this.isSunGateUnlocked = true;
        this.gameEngine.sierraScoreSystem.addPoints('sun_gate_magic', 25, 'unsealing the Rune Sun Gate with magic runes');
        this.gameEngine.showNotification('🔮 MAGE SOLVED SUN GATE: Chanted arcane runes to unseal the gate!');
        this.changeRoom('goblin_camp', 200, 480);
      } else if (hClass === 'Thief') {
        synth.playStatUp();
        this.isSunGateUnlocked = true;
        this.gameEngine.statSystem.practiceStat('agility', 20);
        this.gameEngine.sierraScoreSystem.addPoints('sun_gate_thief', 25, 'picking the ancient Rune Sun Gate lock');
        this.gameEngine.showNotification('🗝️ THIEF SOLVED SUN GATE: Picked the ancient lock mechanism!');
        this.changeRoom('goblin_camp', 200, 480);
      } else {
        // Fighter / Paladin
        synth.playStatUp();
        this.isSunGateUnlocked = true;
        this.gameEngine.statSystem.practiceStat('strength', 20);
        this.gameEngine.sierraScoreSystem.addPoints('sun_gate_fighter', 25, 'forcing open the heavy stone Sun Gate');
        this.gameEngine.showNotification('⚔️ FIGHTER SOLVED SUN GATE: Forced open the heavy stone gate with brute strength!');
        this.changeRoom('goblin_camp', 200, 480);
      }
    } else if (action === 'drink_fountain') {
      synth.playStatUp();
      this.gameEngine.statSystem.currentHp = Math.min(this.gameEngine.statSystem.maxHp, this.gameEngine.statSystem.currentHp + 10);
      this.gameEngine.updateHUD();
      this.gameEngine.showNotification('⛲ Drank refreshing mountain spring water (+10 HP).');
    } else if (action === 'open_notice_board') {
      synth.playClick();
      const dialogueLayer = document.getElementById('dialogue-layer');
      dialogueLayer.style.display = 'flex';
      dialogueLayer.innerHTML = `
        <div class="dialogue-modal parchment-card" style="width: 720px; text-align: center;">
          <div style="font-family: var(--font-heading); font-size: 1.8rem; font-weight: 800; color: #543714; margin-bottom: 8px;">
            📌 Spielburg Adventurers Guild Notice Board
          </div>
          <div style="font-size: 0.92rem; color: var(--text-dark); margin-bottom: 16px;">
            Official quest bounties posted by Guildmaster Bruno and the Sheriff of Spielburg:
          </div>

          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 18px;">
            <div style="background: rgba(255,255,255,0.7); border: 2px solid #8c5a14; padding: 12px; border-radius: 8px; display: flex; flex-direction: column; gap: 6px;">
              <span style="font-size: 2rem;">☀️</span>
              <div style="font-weight: 800; color: #5e410c;">Sun Amulet Quest</div>
              <div style="font-size: 0.78rem; color: #524030;">Unseal Sun Gate & retrieve Sun Amulet for Bruno.</div>
              <button class="btn-ghibli btn-emerald btn-claim-bounty" data-quest="trial_of_spielburg" style="padding: 4px; font-size: 0.8rem; margin-top: 4px;">Claim Quest</button>
            </div>

            <div style="background: rgba(255,255,255,0.7); border: 2px solid #8c5a14; padding: 12px; border-radius: 8px; display: flex; flex-direction: column; gap: 6px;">
              <span style="font-size: 2rem;">🛡️</span>
              <div style="font-weight: 800; color: #5e410c;">Paladin Shield</div>
              <div style="font-size: 0.78rem; color: #524030;">Retrieve Holy Paladin Shield from Goblin Vault.</div>
              <button class="btn-ghibli btn-emerald btn-claim-bounty" data-quest="quest_chest" style="padding: 4px; font-size: 0.8rem; margin-top: 4px;">Claim Bounty</button>
            </div>

            <div style="background: rgba(255,255,255,0.7); border: 2px solid #8c5a14; padding: 12px; border-radius: 8px; display: flex; flex-direction: column; gap: 6px;">
              <span style="font-size: 2rem;">💀</span>
              <div style="font-weight: 800; color: #5e410c;">Shadow Arch-Lich</div>
              <div style="font-size: 0.78rem; color: #524030;">Defeat Arch-Lich inside the Void Citadel.</div>
              <button class="btn-ghibli btn-emerald btn-claim-bounty" data-quest="quest_archlich" style="padding: 4px; font-size: 0.8rem; margin-top: 4px;">Claim Bounty</button>
            </div>
          </div>

          <button id="btn-close-notice-board" class="btn-ghibli" style="width: 100%; height: 40px; font-size: 1rem; justify-content: center;">Step Away from Board</button>
        </div>
      `;

      dialogueLayer.querySelectorAll('.btn-claim-bounty').forEach(btn => {
        btn.addEventListener('click', (e) => {
          synth.playStatUp();
          this.gameEngine.sierraScoreSystem.addPoints('claim_bounty', 10, 'claiming a Notice Board bounty poster');
          this.gameEngine.showNotification(`📌 Claimed bounty! Check your Quest Journal for objectives.`);
        });
      });

      dialogueLayer.querySelector('#btn-close-notice-board').addEventListener('click', () => {
        dialogueLayer.style.display = 'none';
        synth.playClick();
      });

    } else if (action === 'practice_sword') {
      this.gameEngine.statSystem.practiceStat('weaponry', 25, (stat, val) => {
        this.gameEngine.showNotification(`🎉 WEAPONRY skill increased to ${val}!`);
      });
      this.gameEngine.statSystem.practiceStat('strength', 15);
      this.gameEngine.timeSystem.advanceTime(30);
      synth.playSwing();
      this.gameEngine.sierraScoreSystem.addPoints('practice_sword', 15, 'practicing sword drills at the Guild Hall');
      this.gameEngine.showNotification('Practiced sword drills on training dummy (+Weaponry XP).');
    } else if (action === 'throw_dagger') {
      this.gameEngine.statSystem.practiceStat('weaponry', 20);
      this.gameEngine.statSystem.practiceStat('agility', 15, (stat, val) => {
        this.gameEngine.showNotification(`🎉 AGILITY skill increased to ${val}!`);
      });
      this.gameEngine.timeSystem.advanceTime(20);
      synth.playSwing();
      this.gameEngine.sierraScoreSystem.addPoints('throw_dagger', 15, 'practicing dagger throwing at Town Gate');
      this.gameEngine.showNotification('🎯 Threw daggers accurately at the target board (+Agility & Weaponry XP).');
    } else if (action === 'practice_magic') {
      this.gameEngine.statSystem.practiceStat('magic', 25, (stat, val) => {
        this.gameEngine.showNotification(`🎉 MAGIC skill increased to ${val}!`);
      });
      this.gameEngine.timeSystem.advanceTime(30);
      synth.playSpell();
      this.gameEngine.sierraScoreSystem.addPoints('practice_magic', 15, 'practicing spell casting in Zara\'s sanctum');
      this.gameEngine.showNotification('Chanted arcane runes in Zara\'s sanctum (+Magic XP).');
    } else if (action === 'claim_paladin_shield') {
      synth.playStatUp();
      this.gameEngine.inventorySystem.addItem({
        id: 'paladin_shield',
        name: 'Paladin Shield',
        count: 1,
        icon: '🛡️',
        type: 'equip',
        slot: 'shield',
        statBonus: { parry: 15, strength: 5 },
        desc: 'A sacred holy shield granting +15 Parry & +5 Strength!'
      });
      this.gameEngine.statSystem.heroClass = 'Paladin Path';
      this.gameEngine.updateHUD();
      this.gameEngine.sierraScoreSystem.addPoints('paladin_shield', 40, 'claiming the Holy Paladin Shield');
      this.gameEngine.showNotification('🌟 CLAIMED PALADIN SHIELD! Unlocked Paladin Class Path (+15 Parry)!');
    } else if (action === 'learn_fetch') {
      synth.playSpell();
      this.gameEngine.statSystem.practiceStat('magic', 30);
      this.gameEngine.sierraScoreSystem.addPoints('learn_fetch', 20, 'reading the Scroll of Fetch');
      this.gameEngine.showNotification('📜 Learned the Arcane Fetch Spell!');
    }
  }

  triggerNPCDialogue(npcId) {
    if (npcId === 'guildmaster') {
      const hasSunAmulet = this.gameEngine.inventorySystem.hasItem('sun_amulet');

      const guildmasterTree = [
        {
          id: 'root',
          npcName: 'Guildmaster Bruno',
          text: hasSunAmulet ? 'By Bruno\'s beard! You carry the stolen Sun Amulet of Spielburg!' : 'Welcome to the Adventurers Guild, Hero! What knowledge or bounties do you seek today?',
          options: [
            ...(hasSunAmulet ? [{ text: '☀️ [TURN IN QUEST] Deliver the Sun Amulet of Spielburg!', targetNode: 'turn_in_sun_amulet' }] : []),
            { text: '☀️ Ask about "The Trial of Spielburg" Quest', targetNode: 'ans_sun_amulet' },
            { text: 'Ask about the Goblin Bounty in Mistvale Forest', targetNode: 'ans_goblins' },
            { text: 'Ask about the Shadow Arch-Lich threat', targetNode: 'ans_archlich' },
            { text: '[FIGHTER] Ask how to improve sword technique', targetNode: 'ans_sword', reqClass: 'Fighter' },
            { text: 'Farewell Guildmaster.', targetNode: 'end_dialogue' }
          ]
        },
        {
          id: 'turn_in_sun_amulet',
          npcName: 'Guildmaster Bruno',
          text: 'HAIL THE HERO OF SPIELBURG! You unsealed the Rune Sun Gate and vanquished the Goblin Chieftain! Here is your reward of 100 Gold and 50 Sierra Score Points!',
          options: [
            { text: 'Thank you Guildmaster! Long live Spielburg!', targetNode: 'execute_turn_in' }
          ]
        },
        {
          id: 'ans_sun_amulet',
          npcName: 'Guildmaster Bruno',
          text: 'The Shadow Goblins stole our royal Sun Amulet and fled into Whispering Cavern! Unseal the Rune Sun Gate in Mistvale Forest, defeat the Goblin Chieftain, and return the Sun Amulet to me for a royal reward of 100 Gold and 50 Sierra Score Points!',
          options: [
            { text: 'Ask about another topic...', targetNode: 'root' },
            { text: 'I will retrieve the Sun Amulet at once!', targetNode: 'end_dialogue' }
          ]
        },
        {
          id: 'ans_goblins',
          npcName: 'Guildmaster Bruno',
          text: 'The Goblins have established a war camp in eastern Mistvale Forest! Defeat their spearmen and Chieftain for a reward of 25 Sierra Score Points & Gold.',
          options: [
            { text: 'Ask about another topic...', targetNode: 'root' },
            { text: 'I will head into the forest now!', targetNode: 'end_dialogue' }
          ]
        },
        {
          id: 'ans_archlich',
          npcName: 'Guildmaster Bruno',
          text: 'The Shadow Arch-Lich looms inside the Void Citadel! Only a hero armed with high stats and powerful equipment can vanquish him.',
          options: [
            { text: 'Ask about another topic...', targetNode: 'root' },
            { text: 'I shall prepare for battle!', targetNode: 'end_dialogue' }
          ]
        },
        {
          id: 'ans_sword',
          npcName: 'Guildmaster Bruno',
          text: 'Practice on the straw dummy in this room! Every drill increases your Weaponry stat and Strength.',
          options: [
            { text: 'Ask about another topic...', targetNode: 'root' },
            { text: 'Thank you Guildmaster!', targetNode: 'end_dialogue' }
          ]
        }
      ];

      this.gameEngine.dialogueSystem.startDialogue(guildmasterTree, (selectedOption) => {
        if (selectedOption.targetNode === 'execute_turn_in') {
          this.gameEngine.inventorySystem.removeItem('sun_amulet', 1);
          this.gameEngine.questSystem.completeQuest('trial_of_spielburg');
          synth.playStatUp();
          this.gameEngine.showNotification('🎉 QUEST COMPLETE: "The Trial of Spielburg"! (+100 Gold, +50 Sierra Score Points)');
        }
      });
    }
  }
}
