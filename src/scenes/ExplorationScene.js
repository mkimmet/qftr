import { synth } from '../engine/SoundSynth.js';
import { Pathfinder2D } from '../engine/Pathfinder2D.js';

export class ExplorationScene {
  constructor(gameEngine) {
    this.gameEngine = gameEngine;
    this.currentRoom = 'town_square';
    this.activeVerb = 'walk';

    this.bgImages = {
      town_square: new Image(),
      forest_path: new Image(),
      magic_shop: new Image(),
      guild_hall: new Image(),
      town_gate: new Image(),
      goblin_camp: new Image(),
      thief_hideout: new Image(),
      castle_courtyard: new Image(),
      goblin_vault: new Image(),
      deep_forest: new Image(),
      citadel_gate: new Image(),
      throne_room: new Image()
    };
    this.bgImages.town_square.src = '/town_square.jpg';
    this.bgImages.forest_path.src = '/forest.jpg';
    this.bgImages.magic_shop.src = '/magic_shop.jpg';
    this.bgImages.guild_hall.src = '/guild_hall.jpg';
    this.bgImages.town_gate.src = '/town_square.jpg';
    this.bgImages.goblin_camp.src = '/forest.jpg';
    this.bgImages.thief_hideout.src = '/magic_shop.jpg';
    this.bgImages.castle_courtyard.src = '/town_square.jpg';
    this.bgImages.goblin_vault.src = '/magic_shop.jpg';
    this.bgImages.deep_forest.src = '/forest.jpg';
    this.bgImages.citadel_gate.src = '/forest.jpg';
    this.bgImages.throne_room.src = '/magic_shop.jpg';

    this.rooms = {
      town_square: {
        id: 'town_square',
        title: 'Spielburg Town Square',
        bgImage: this.bgImages.town_square,
        desc: 'A serene, sunlit cobblestone square surrounded by lush emerald pines and half-timbered Ghibli-style cottages.',
        bounds: { xMin: 40, xMax: 1240, yMin: 280, yMax: 660 },
        exits: {
          east: { room: 'forest_path', spawnX: 80, spawnY: 450, msg: 'Walked east to Mistvale Forest Path.' },
          west: { room: 'town_gate', spawnX: 1180, spawnY: 450, msg: 'Walked west to Spielburg Town Gate.' }
        },
        obstacles: [
          { id: 'obs_fountain', type: 'circle', x: 650, y: 390, radius: 45 },
          { id: 'obs_left_house', type: 'rect', x: 0, y: 0, w: 220, h: 320 },
          { id: 'obs_right_house', type: 'rect', x: 950, y: 0, w: 330, h: 320 }
        ],
        props: [
          { id: 'prop_fountain', label: '⛲ Town Square Fountain', icon: '⛲', x: 650, y: 430, depthY: 430, isInteractable: false },
          { id: 'prop_notice', label: '📌 Guild Notice Board', icon: '📌', x: 280, y: 390, depthY: 390, isInteractable: true, action: 'open_notice_board' },
          { id: 'prop_chest', label: '🧰 Shadow Alley Chest', icon: '🧰', x: 405, y: 360, depthY: 360, isInteractable: true, action: 'unlock_chest' }
        ],
        hotspots: [
          { id: 'notice_board', label: '📌 Guild Bounty Board', x: 250, y: 340, w: 100, h: 120, type: 'action', action: 'open_notice_board', desc: 'A wooden notice board posted with official Spielburg quest bounties!' },
          { id: 'guild_hall', label: '⚔️ Adventurer Guild Door', x: 70, y: 380, w: 140, h: 220, type: 'door', targetRoom: 'guild_hall', spawnX: 180, spawnY: 480, desc: 'The heavy timbered entrance door to the Adventurer Guildhall.' },
          { id: 'magic_shop', label: '🔮 Zara\'s Arcana Shop Door', x: 580, y: 380, w: 150, h: 220, type: 'door', targetRoom: 'magic_shop', spawnX: 980, spawnY: 480, desc: 'Arcana shop doorway under the colorful market awning.' },
          { id: 'thief_alley', label: '🗝️ Shadow Alley Entrance', x: 360, y: 220, w: 120, h: 160, type: 'door', targetRoom: 'thief_hideout', spawnX: 200, spawnY: 480, desc: 'A mysterious cobblestone alleyway winding up toward the thief hideout.' },
          { id: 'shadow_chest', label: '🧰 Shadow Alley Chest', x: 380, y: 330, w: 90, h: 80, type: 'action', action: 'unlock_chest', desc: 'An ancient iron-bound treasure chest resting in the shadows.' },
          { id: 'forest_gate', label: '🌲 Forest Archway (Combat Zone)', x: 1040, y: 400, w: 180, h: 240, type: 'door', targetRoom: 'forest_path', spawnX: 80, spawnY: 450, desc: 'Cobblestone archway leading out into Mistvale Forest.' }
        ]
      },
      town_gate: {
        id: 'town_gate',
        title: 'Spielburg Town Gate & Guard Post',
        bgImage: this.bgImages.town_gate,
        desc: 'The reinforced stone gates of Spielburg Village, guarded by the Sheriff and village militia.',
        bounds: { xMin: 40, xMax: 1240, yMin: 280, yMax: 660 },
        exits: {
          east: { room: 'town_square', spawnX: 80, spawnY: 450, msg: 'Walked east back to Town Square.' }
        },
        obstacles: [
          { id: 'obs_gate_wall', type: 'rect', x: 0, y: 0, w: 300, h: 360 }
        ],
        props: [
          { id: 'prop_target', label: '🎯 Target Board', icon: '🎯', x: 910, y: 410, depthY: 410, isInteractable: true, action: 'throw_dagger' }
        ],
        hotspots: [
          { id: 'castle_gate', label: '🏰 Castle Courtyard Gate', x: 550, y: 260, w: 180, h: 160, type: 'door', targetRoom: 'castle_courtyard', spawnX: 640, spawnY: 480, desc: 'High stone archway leading north into Spielburg Castle Courtyard.' },
          { id: 'target_board', label: '🎯 Dagger Throwing Target', x: 850, y: 350, w: 120, h: 160, type: 'action', action: 'throw_dagger', desc: 'A wooden target board for practicing dagger throwing.' }
        ]
      },
      castle_courtyard: {
        id: 'castle_courtyard',
        title: 'Spielburg Castle Courtyard',
        bgImage: this.bgImages.castle_courtyard,
        desc: 'High stone ramparts adorned with heraldic banners. Knights duel in the cobblestone arena.',
        bounds: { xMin: 120, xMax: 1140, yMin: 340, yMax: 640 },
        exits: {},
        obstacles: [],
        props: [],
        hotspots: [
          { id: 'duel_knight', label: '⚔️ Challenge Knight Captain', x: 580, y: 340, w: 160, h: 180, type: 'combat', enemyType: 'Knight Captain', desc: 'The veteran Knight Captain offering sword duels to worthy heroes.' },
          { id: 'exit_gate', label: '🚪 Return to Town Gate', x: 100, y: 380, w: 140, h: 240, type: 'door', targetRoom: 'town_gate', spawnX: 640, spawnY: 480, desc: 'Courtyard exit returning south to Town Gate.' }
        ]
      },
      guild_hall: {
        id: 'guild_hall',
        title: 'Adventurers Guild Hall',
        bgImage: this.bgImages.guild_hall,
        desc: 'Warm wooden hearth, trophy shields on walls, and a training dummy for sword practice.',
        bounds: { xMin: 120, xMax: 1140, yMin: 360, yMax: 640 },
        exits: {},
        obstacles: [
          { id: 'obs_hearth', type: 'rect', x: 440, y: 280, w: 180, h: 120 }
        ],
        props: [
          { id: 'prop_dummy', label: '⚔️ Practice Dummy', icon: '⚔️', x: 880, y: 420, depthY: 420, isInteractable: true, action: 'practice_sword' }
        ],
        hotspots: [
          { id: 'npc_guildmaster', label: '⚔️ Guildmaster Bruno', x: 460, y: 340, w: 140, h: 180, type: 'npc', npcId: 'guildmaster', desc: 'Guildmaster Bruno standing near the hearth in knightly armor.' },
          { id: 'dummy', label: '⚔️ Practice Sword Dummy', x: 820, y: 360, w: 120, h: 180, type: 'action', action: 'practice_sword', desc: 'A heavy straw training dummy for sword drills.' },
          { id: 'exit_square', label: '🚪 Exit to Town Square', x: 70, y: 340, w: 140, h: 280, type: 'door', targetRoom: 'town_square', spawnX: 140, spawnY: 480, desc: 'Door exiting back out to Spielburg Square.' }
        ]
      },
      magic_shop: {
        id: 'magic_shop',
        title: 'Zara\'s Arcana Shop',
        bgImage: this.bgImages.magic_shop,
        desc: 'A magical sanctum filled with glowing potion vials, ancient scrolls, and floating spell books.',
        bounds: { xMin: 120, xMax: 1140, yMin: 360, yMax: 640 },
        exits: {},
        obstacles: [
          { id: 'obs_cauldron', type: 'rect', x: 440, y: 300, w: 220, h: 140 }
        ],
        props: [],
        hotspots: [
          { id: 'npc_zara', label: '🔮 Sorceress Zara (Shop)', x: 480, y: 360, w: 140, h: 180, type: 'npc', npcId: 'zara', desc: 'Sorceress Zara brewing glowing magical potions. Talk to browse her shop!' },
          { id: 'practice_magic', label: '✨ Arcana Circle (Spell Practice)', x: 750, y: 440, w: 160, h: 140, type: 'action', action: 'practice_magic', desc: 'An arcana rug drawn with glowing runes for spell practice.' },
          { id: 'exit_square', label: '🚪 Exit to Town Square', x: 1060, y: 280, w: 180, h: 360, type: 'door', targetRoom: 'town_square', spawnX: 650, spawnY: 480, desc: 'Open wooden doorway leading back out to town.' }
        ]
      },
      forest_path: {
        id: 'forest_path',
        title: 'Mistvale Forest Path',
        bgImage: this.bgImages.forest_path,
        desc: 'Dark pine woods filled with rustling leaves. Goblin tracks lead deeper into the wilderness.',
        bounds: { xMin: 40, xMax: 1240, yMin: 300, yMax: 660 },
        exits: {
          west: { room: 'town_square', spawnX: 1180, spawnY: 450, msg: 'Walked west back to Spielburg Town Square.' },
          east: { room: 'goblin_camp', spawnX: 80, spawnY: 450, msg: 'Walked east into the Goblin Encampment.' }
        },
        obstacles: [
          { id: 'obs_pine_tree', type: 'circle', x: 240, y: 450, radius: 60 }
        ],
        props: [
          { id: 'prop_pine', label: '🌲 Ancient Pine Tree', icon: '🌲', x: 240, y: 450, depthY: 450, isInteractable: false },
          { id: 'prop_moonflower', label: '🌸 Moonflower Herb', icon: '🌸', x: 735, y: 430, depthY: 430, isInteractable: true, action: 'pick_moonflower' }
        ],
        hotspots: [
          { id: 'deep_woods', label: '🌲 Deep Forest Grove (North Path)', x: 550, y: 260, w: 180, h: 140, type: 'door', targetRoom: 'deep_forest', spawnX: 640, spawnY: 620, desc: 'Path winding north into Deep Mistvale Wilderness.' },
          { id: 'moonflower', label: '🌸 Moonflower Herb', x: 690, y: 400, w: 90, h: 80, type: 'action', action: 'pick_moonflower', desc: 'A rare glowing blue Moonflower growing near the mossy stones.' },
          { id: 'battle_goblin', label: '👺 Goblin Spearman (Grid Combat)', x: 420, y: 340, w: 160, h: 180, type: 'combat', enemyType: 'Goblin Spearman', desc: 'A patrol of armed goblin spearmen marching in the clearing.' },
          { id: 'battle_warlock', label: '🧙 Shadow Warlock (Boss Grid Combat)', x: 780, y: 300, w: 160, h: 180, type: 'combat', enemyType: 'Shadow Warlock', desc: 'A sinister shadow warlock gathering dark magical energy.' },
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
        title: 'Goblin Encampment & Stronghold',
        bgImage: this.bgImages.goblin_camp,
        desc: 'A smoky goblin war camp filled with bonfires, crude bone totems, and stolen guild loot chests.',
        bounds: { xMin: 40, xMax: 1240, yMin: 300, yMax: 660 },
        exits: {
          west: { room: 'forest_path', spawnX: 1180, spawnY: 450, msg: 'Walked west back to Forest Path.' }
        },
        obstacles: [
          { id: 'obs_bonfire', type: 'circle', x: 640, y: 450, radius: 80 }
        ],
        props: [
          { id: 'prop_bonfire', label: '🔥 Goblin Bonfire', icon: '🔥', x: 640, y: 450, depthY: 450, isInteractable: false }
        ],
        hotspots: [
          { id: 'goblin_vault_door', label: '🗝️ Stronghold Vault Entrance', x: 880, y: 340, w: 160, h: 180, type: 'door', targetRoom: 'goblin_vault', spawnX: 200, spawnY: 480, desc: 'Heavy wooden doors leading into the Goblin Chieftain Vault.' },
          { id: 'battle_chieftain', label: '👑 Fight Goblin Chieftain (BOSS)', x: 550, y: 320, w: 180, h: 200, type: 'combat', enemyType: 'Goblin Chieftain', desc: 'The massive armor-clad Goblin Chieftain wielding a heavy battleaxe!' }
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

    if (this.activeVerb === 'talk') {
      if (hit.type === 'npc') {
        if (hit.npcId === 'zara') {
          this.gameEngine.merchantSystem.showShopModal();
        } else {
          this.triggerNPCDialogue(hit.npcId);
        }
      } else {
        this.gameEngine.showNotification('Talking to yourself won\'t help much!');
      }
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
        if (hit.action === 'unlock_chest' || hit.action === 'thief_door') {
          this.gameEngine.questSystem.completeQuest('quest_chest');
          this.gameEngine.sierraScoreSystem.addPoints('unlock_chest', 20, 'opening the locked Shadow Alley Chest');
          this.gameEngine.showNotification('✨ Open spell popped open the locked Shadow Alley Chest!');
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
    if (action === 'open_notice_board') {
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
              <span style="font-size: 2rem;">👺</span>
              <div style="font-weight: 800; color: #5e410c;">Goblin Bounty</div>
              <div style="font-size: 0.78rem; color: #524030;">Vanquish Goblin Spearmen in Mistvale Forest Path.</div>
              <button class="btn-ghibli btn-emerald btn-claim-bounty" data-quest="quest_goblin" style="padding: 4px; font-size: 0.8rem; margin-top: 4px;">Claim Bounty</button>
            </div>

            <div style="background: rgba(255,255,255,0.7); border: 2px solid #8c5a14; padding: 12px; border-radius: 8px; display: flex; flex-direction: column; gap: 6px;">
              <span style="font-size: 2rem;">🛡️</span>
              <div style="font-weight: 800; color: #5e410c;">Paladin Shield</div>
              <div style="font-size: 0.78rem; color: #524030;">Retrieve the Holy Paladin Shield from Goblin Vault.</div>
              <button class="btn-ghibli btn-emerald btn-claim-bounty" data-quest="quest_chest" style="padding: 4px; font-size: 0.8rem; margin-top: 4px;">Claim Bounty</button>
            </div>

            <div style="background: rgba(255,255,255,0.7); border: 2px solid #8c5a14; padding: 12px; border-radius: 8px; display: flex; flex-direction: column; gap: 6px;">
              <span style="font-size: 2rem;">💀</span>
              <div style="font-weight: 800; color: #5e410c;">Shadow Arch-Lich</div>
              <div style="font-size: 0.78rem; color: #524030;">Defeat the Arch-Lich inside the Void Citadel.</div>
              <button class="btn-ghibli btn-emerald btn-claim-bounty" data-quest="quest_archlich" style="padding: 4px; font-size: 0.8rem; margin-top: 4px;">Claim Bounty</button>
            </div>
          </div>

          <button id="btn-close-notice-board" class="btn-ghibli" style="width: 100%; height: 40px; font-size: 1rem; justify-content: center;">Step Away from Board</button>
        </div>
      `;

      dialogueLayer.querySelectorAll('.btn-claim-bounty').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const qId = e.target.getAttribute('data-quest');
          synth.playStatUp();
          this.gameEngine.sierraScoreSystem.addPoints('claim_bounty', 10, 'claiming a Notice Board bounty poster');
          this.gameEngine.showNotification(`📌 Claimed bounty! Check your Quest Log for objectives.`);
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
      this.gameEngine.sierraScoreSystem.addPoints('learn_fetch', 25, 'discovering the Scroll of Fetch in Deep Forest');
      this.gameEngine.showNotification('📜 Learned the Fetch spell! Telekinetically pull distant objects & enemies.');
    } else if (action === 'unlock_chest' || action === 'thief_door') {
      const stealthVal = this.gameEngine.statSystem.stats.stealth;
      if (stealthVal >= 15) {
        this.gameEngine.statSystem.practiceStat('stealth', 30);
        synth.playStatUp();
        this.gameEngine.questSystem.completeQuest('quest_chest');
        this.gameEngine.sierraScoreSystem.addPoints('unlock_chest', 20, 'picking the locked Shadow Alley Chest');
      } else {
        this.gameEngine.statSystem.practiceStat('stealth', 10);
        this.gameEngine.showNotification('🔒 Chest is locked tight! Need STEALTH 15+ or an OPEN spell.');
      }
    } else if (action === 'pick_moonflower') {
      synth.playStatUp();
      this.gameEngine.questSystem.completeQuest('quest_zara');
      this.gameEngine.sierraScoreSystem.addPoints('pick_moonflower', 15, 'picking the rare Moonflower Herb');
    }
  }

  triggerNPCDialogue(npcId) {
    if (npcId === 'guildmaster') {
      const npcData = {
        name: 'Guildmaster Bruno',
        portraitEmoji: '⚔️'
      };

      const guildmasterTree = [
        {
          id: 'root',
          npcName: 'Guildmaster Bruno',
          text: 'Welcome to the Adventurers Guild, Hero! What knowledge or bounties do you seek today?',
          options: [
            { text: 'Ask about the Goblin Bounty in Mistvale Forest', targetNode: 'ans_goblins' },
            { text: 'Ask about the Shadow Arch-Lich threat', targetNode: 'ans_archlich' },
            { text: '[FIGHTER] Ask how to improve sword technique', targetNode: 'ans_sword', reqClass: 'Fighter' },
            { text: 'Ask how to rest and recover health', targetNode: 'ans_rest' },
            { text: 'Farewell Guildmaster.', targetNode: 'end_dialogue' }
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
        },
        {
          id: 'ans_rest',
          npcName: 'Guildmaster Bruno',
          text: 'Click the "🌙 Rest" button in the top icon bar anytime to sleep for 8 hours and fully restore your HP, MP, and Stamina!',
          options: [
            { text: 'Ask about another topic...', targetNode: 'root' },
            { text: 'Understood!', targetNode: 'end_dialogue' }
          ]
        }
      ];

      this.gameEngine.dialogueSystem.showSierraQA(npcData, guildmasterTree, 'root', this.gameEngine.statSystem, (text, target) => {
        if (text.includes('Goblin Bounty')) {
          this.gameEngine.showNotification('📜 Quest Log Updated: Goblin Bounty in Mistvale Forest.');
        }
      });
    } else if (npcId === 'zara') {
      this.gameEngine.merchantSystem.showShopModal();
    }
  }
}
