import { SkeletalPaperdoll } from './SkeletalPaperdoll.js';
import { SkeletalGoblin } from './SkeletalGoblin.js';

export class SkeletalStudio {
  constructor(gameEngine) {
    this.gameEngine = gameEngine;
    this.containerEl = null;
    this.isOpen = false;
    this.activeModel = 'hero'; // 'hero' | 'goblin'

    this.previewPaperdoll = new SkeletalPaperdoll(gameEngine);
    this.previewGoblin = new SkeletalGoblin();

    // Preset Library
    this.presets = {
      hero_traveler: {
        id: 'hero_traveler',
        name: 'Novice Hero Traveler',
        type: 'hero',
        rig: 'humanoid',
        stats: { hp: 50, maxHp: 50, ap: 6, strength: 10, weaponry: 10, parry: 10, magic: 10 },
        outfit: {
          head: { id: 'iron_helm', name: 'Iron Coif Helm', icon: '🪖' },
          armor: { id: 'leather_armor', name: 'Boiled Leather Cuirass', icon: '🛡️' },
          weapon: { id: 'iron_sword', name: 'Iron Broadsword', icon: '🗡️', slot: 'weapon' },
          shield: { id: 'paladin_shield', name: 'Paladin Shield', icon: '🛡️' },
          baldric: { id: 'scarlet_baldric', name: 'Scarlet Guard Baldric', color: '#b82531' }
        },
        cloakColor: '#8b2626'
      },
      death_knight: {
        id: 'death_knight',
        name: 'Death Knight Malakor',
        type: 'boss',
        rig: 'humanoid',
        stats: { hp: 150, maxHp: 150, ap: 7, strength: 18, weaponry: 16, parry: 14, magic: 8 },
        outfit: {
          head: { id: 'iron_helm', name: 'Iron Helmet Visor', icon: '🪖' },
          armor: { id: 'plate_armor', name: 'Knight Steel Plate Mail', icon: '🛡️' },
          weapon: { id: 'iron_sword', name: 'Great Broadsword', icon: '🗡️', slot: 'weapon' },
          shield: { id: 'paladin_shield', name: 'Kite Shield', icon: '🛡️' },
          baldric: { id: 'scarlet_baldric', name: 'Blood Guard Baldric', color: '#a83232' }
        },
        cloakColor: '#1c1524'
      },
      arch_mage: {
        id: 'arch_mage',
        name: 'Arch-Mage Sorceress Zara',
        type: 'npc',
        rig: 'humanoid',
        stats: { hp: 75, maxHp: 75, ap: 6, strength: 6, weaponry: 5, parry: 8, magic: 20 },
        outfit: {
          head: { id: 'wizard_hat', name: 'Sorcerer Conical Hat', icon: '🧙' },
          armor: { id: 'mage_robe', name: 'Arch-Mage Arcane Robe', icon: '✨' },
          weapon: { id: 'arcane_wand', name: 'Arcane Staff', icon: '🪄', slot: 'weapon' },
          shield: null,
          baldric: { id: 'sapphire_baldric', name: 'Sapphire Baldric', color: '#1d5ec9' }
        },
        cloakColor: '#103b82'
      },
      shadow_thief: {
        id: 'shadow_thief',
        name: 'Shadow Thief Rogue',
        type: 'hero',
        rig: 'humanoid',
        stats: { hp: 60, maxHp: 60, ap: 7, strength: 8, weaponry: 12, parry: 12, magic: 4 },
        outfit: {
          head: null,
          armor: { id: 'thief_vest', name: 'Shadow Thief Vest', icon: '🥷' },
          weapon: { id: 'iron_sword', name: 'Shadow Dagger', icon: '🗡️', slot: 'weapon' },
          shield: null,
          baldric: { id: 'emerald_baldric', name: 'Emerald Baldric', color: '#387654' }
        },
        cloakColor: '#1c1524'
      },
      goblin_spearman: {
        id: 'goblin_spearman',
        name: 'Goblin Spearman',
        type: 'monster',
        rig: 'goblin',
        stats: { hp: 40, maxHp: 40, ap: 5, strength: 8, weaponry: 8, parry: 6, magic: 0 },
        outfit: {},
        cloakColor: '#2d4a22'
      }
    };

    this.activePresetKey = 'hero_traveler';
    this.currentPreset = JSON.parse(JSON.stringify(this.presets.hero_traveler));

    this.studioEquipment = this.currentPreset.outfit;
    this.cloakColor = this.currentPreset.cloakColor;
    this.animState = 'idle';
    this.animationLoopId = null;

    // Timeline Keyframe Animation Engine State
    this.timelineState = {
      currentTime: 0,
      duration: 600,
      isPlaying: false,
      playbackStartTime: 0,
      keyframes: [
        { time: 0, joints: { rightArmAngle: -1.1, leftArmAngle: -0.4, headTilt: 0, torsoTilt: 0, cloakSway: 0, hipY: 0 } },
        { time: 300, joints: { rightArmAngle: -2.0, leftArmAngle: -1.0, headTilt: 0.2, torsoTilt: -0.2, cloakSway: 0.3, hipY: 4 } },
        { time: 600, joints: { rightArmAngle: -1.1, leftArmAngle: -0.4, headTilt: 0, torsoTilt: 0, cloakSway: 0, hipY: 0 } }
      ]
    };
  }

  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  open() {
    this.isOpen = true;
    if (!this.containerEl) {
      this.createStudioUI();
    }
    this.containerEl.style.display = 'flex';

    if (this.animationLoopId) {
      cancelAnimationFrame(this.animationLoopId);
      this.animationLoopId = null;
    }

    // Force animation timeline preset load & DOM reflow frame
    this.loadPresetAnimationTimeline(this.activePresetKey || 'hero_traveler');
    
    requestAnimationFrame(() => {
      this.renderKeyframeChips();
      this.startPreviewLoop();
    });
  }

  close() {
    this.isOpen = false;
    if (this.containerEl) {
      this.containerEl.style.display = 'none';
    }
    if (this.animationLoopId) {
      cancelAnimationFrame(this.animationLoopId);
      this.animationLoopId = null;
    }
  }

  createStudioUI() {
    this.containerEl = document.createElement('div');
    this.containerEl.id = 'skeletal-studio-modal';
    this.containerEl.style.cssText = `
      position: fixed;
      inset: 0;
      background: rgba(10, 18, 14, 0.88);
      backdrop-filter: blur(6px);
      z-index: 250;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    `;

    this.containerEl.innerHTML = `
      <div class="parchment-card" style="width: 980px; max-width: 96vw; height: 660px; display: grid; grid-template-columns: 320px 1fr; gap: 20px; padding: 20px;">
        
        <!-- Column 1: Live 60 FPS Canvas Preview & Character Manager -->
        <div style="background: rgba(15, 26, 20, 0.9); border: 2px solid var(--parchment-border); border-radius: 10px; padding: 14px; display: flex; flex-direction: column; align-items: center; justify-content: space-between;">
          <div style="width: 100%; text-align: center; font-family: var(--font-heading); font-size: 1.1rem; font-weight: 800; color: var(--ghibli-sun-gold); border-bottom: 1px solid var(--parchment-border); padding-bottom: 6px;">
            🎨 Live Character Preview
          </div>

          <canvas id="studio-preview-canvas" width="280" height="300" style="background: radial-gradient(circle at center, rgba(35, 60, 45, 0.8), rgba(15, 25, 18, 0.95)); border-radius: 8px; border: 1px solid var(--parchment-border);"></canvas>

          <!-- Character Presets Selection -->
          <div style="width: 100%; display: flex; flex-direction: column; gap: 6px;">
            <label style="font-weight: 700; font-size: 0.8rem; color: #a6c4b2;">Select Preset Template:</label>
            <select id="select-preset-template" style="width: 100%; padding: 6px; border-radius: 6px; font-weight: 700;">
              <option value="hero_traveler">🧝 Novice Hero Traveler</option>
              <option value="death_knight">💀 Death Knight Malakor</option>
              <option value="arch_mage">🔮 Arch-Mage Sorceress</option>
              <option value="shadow_thief">🥷 Shadow Thief Rogue</option>
              <option value="goblin_spearman">👺 Goblin Spearman</option>
            </select>
          </div>
        </div>

        <!-- Column 2: Editor Tabs & Keyframe Timeline -->
        <div style="display: flex; flex-direction: column; height: 100%; overflow: hidden;">
          <!-- Top Header & Close -->
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid var(--parchment-border); padding-bottom: 10px; margin-bottom: 12px;">
            <div>
              <span style="font-family: var(--font-heading); font-size: 1.3rem; font-weight: 800; color: var(--text-dark);">🎨 Universal Character & Keyframe Studio</span>
              <div style="font-size: 0.8rem; color: #8c5a14; font-weight: 700;">Create characters, record keyframe animation timelines & customize gear</div>
            </div>
            <button id="btn-close-studio" class="btn-ghibli btn-crimson" style="padding: 4px 12px; font-size: 0.85rem;">✖ Close</button>
          </div>

          <!-- Studio Tabs -->
          <div style="display: flex; gap: 6px; margin-bottom: 12px; flex-wrap: wrap;">
            <button class="btn-ghibli studio-tab-btn active" data-tab="tab-outfit" style="font-size: 0.8rem; padding: 5px 10px;">🛡️ Outfits</button>
            <button class="btn-ghibli studio-tab-btn" data-tab="tab-timeline" style="font-size: 0.8rem; padding: 5px 10px; background: linear-gradient(180deg, #d97724 0%, #a85208 100%); color: #fff;">🎬 Keyframe Timeline</button>
            <button class="btn-ghibli studio-tab-btn" data-tab="tab-items" style="font-size: 0.8rem; padding: 5px 10px;">🛠️ Item Creator</button>
            <button class="btn-ghibli studio-tab-btn" data-tab="tab-stats" style="font-size: 0.8rem; padding: 5px 10px;">📊 Stats & Role</button>
            <button class="btn-ghibli studio-tab-btn" data-tab="tab-spawner" style="font-size: 0.8rem; padding: 5px 10px;">🌍 World Spawner</button>
            <button class="btn-ghibli studio-tab-btn" data-tab="tab-ai" style="font-size: 0.8rem; padding: 5px 10px; background: linear-gradient(180deg, #802bb0 0%, #4c1170 100%); color: #fff; border-color: #27063b;">🤖 AI Hook</button>
          </div>

          <!-- Tab Content Area -->
          <div id="studio-tab-content" style="flex: 1; overflow-y: auto; background: rgba(255,255,255,0.4); border: 1px solid var(--parchment-border); padding: 14px; border-radius: 8px;">
            
            <!-- Tab 1: Outfit & Gear Customizer -->
            <div id="tab-outfit" class="studio-tab-pane" style="display: flex; flex-direction: column; gap: 12px;">
              <div>
                <label style="font-weight: 700; font-size: 0.85rem; color: var(--text-dark);">Character Name:</label>
                <input type="text" id="input-char-name" value="${this.currentPreset.name}" style="width: 100%; padding: 6px; border-radius: 6px; font-weight: 700; margin-top: 4px;">
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                <div>
                  <label style="font-weight: 700; font-size: 0.85rem; color: var(--text-dark);">Armor / Clothing Style:</label>
                  <select id="select-studio-armor" style="width: 100%; padding: 6px; border-radius: 6px; font-weight: 700; margin-top: 4px;">
                    <option value="plate_armor">Knight Steel Plate Mail</option>
                    <option value="leather_armor">Boiled Leather Cuirass</option>
                    <option value="mage_robe">Arch-Mage Arcane Robe</option>
                    <option value="thief_vest">Shadow Thief Vest</option>
                    <option value="tunic">👕 Dyed Linen Tunic</option>
                    <option value="underwear">👙 Strip to Underwear (Take Off Clothes)</option>
                  </select>
                </div>

                <div>
                  <label style="font-weight: 700; font-size: 0.85rem; color: var(--text-dark);">Headgear:</label>
                  <select id="select-studio-head" style="width: 100%; padding: 6px; border-radius: 6px; font-weight: 700; margin-top: 4px;">
                    <option value="iron_helm">Iron Coif Helmet 🪖</option>
                    <option value="wizard_hat">Wizard Conical Hat 🧙</option>
                    <option value="none">Hair + Headband</option>
                  </select>
                </div>

                <div>
                  <label style="font-weight: 700; font-size: 0.85rem; color: var(--text-dark);">Equipped Weapon:</label>
                  <select id="select-studio-weapon" style="width: 100%; padding: 6px; border-radius: 6px; font-weight: 700; margin-top: 4px;">
                    <option value="iron_sword">Steel Broadsword 🗡️</option>
                    <option value="arcane_wand">Arcane Crystal Staff 🪄</option>
                  </select>
                </div>

                <div>
                  <label style="font-weight: 700; font-size: 0.85rem; color: var(--text-dark);">Flowing Cape Slot:</label>
                  <select id="select-studio-cape" style="width: 100%; padding: 6px; border-radius: 6px; font-weight: 700; margin-top: 4px;">
                    <option value="none">🚫 No Cape (Uncovered Back)</option>
                    <option value="scarlet_cape">🦹 Scarlet Flowing Cape</option>
                    <option value="shadow_cape">🦹 Shadow Violet Cape</option>
                    <option value="gold_cape">🦹 Sun Gold Champion Cape</option>
                  </select>
                </div>

                <div>
                  <label style="font-weight: 700; font-size: 0.85rem; color: var(--text-dark);">Heroic Baldric Color:</label>
                  <select id="select-studio-baldric" style="width: 100%; padding: 6px; border-radius: 6px; font-weight: 700; margin-top: 4px;">
                    <option value="#b82531">Scarlet Blood Guard (#b82531)</option>
                    <option value="#1d5ec9">Sapphire Arch-Mage (#1d5ec9)</option>
                    <option value="#387654">Emerald Ranger (#387654)</option>
                    <option value="#f4be42">Sun Gold Champion (#f4be42)</option>
                  </select>
                </div>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 8px; margin-top: 4px;">
                <div>
                  <label style="font-weight: 700; font-size: 0.78rem; color: var(--text-dark);">Tunic Dye:</label>
                  <input type="color" id="input-tunic-color" value="#8c5a14" style="width: 100%; height: 32px; border: none; cursor: pointer; margin-top: 2px;">
                </div>
                <div>
                  <label style="font-weight: 700; font-size: 0.78rem; color: var(--text-dark);">Pants Dye:</label>
                  <input type="color" id="input-pants-color" value="#3a2e2b" style="width: 100%; height: 32px; border: none; cursor: pointer; margin-top: 2px;">
                </div>
                <div>
                  <label style="font-weight: 700; font-size: 0.78rem; color: var(--text-dark);">Underwear Color:</label>
                  <input type="color" id="input-under-color" value="#2b221a" style="width: 100%; height: 32px; border: none; cursor: pointer; margin-top: 2px;">
                </div>
                <div>
                  <label style="font-weight: 700; font-size: 0.78rem; color: var(--text-dark);">Cloak Color:</label>
                  <input type="color" id="input-cloak-color" value="${this.cloakColor}" style="width: 100%; height: 32px; border: none; cursor: pointer; margin-top: 2px;">
                </div>
              </div>
            </div>

            <!-- Tab 2: Keyframe Timeline & Pose Editor -->
            <div id="tab-timeline" class="studio-tab-pane" style="display: none; flex-direction: column; gap: 12px;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <div style="font-weight: 700; font-size: 0.9rem; color: var(--text-dark);">🎬 Interactive Keyframe Timeline Track:</div>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <label style="font-size: 0.8rem; font-weight: 700; color: #5e410c;">Animation Sequence:</label>
                  <select id="select-timeline-animation" style="padding: 4px 10px; border-radius: 6px; font-weight: 700; font-size: 0.82rem;">
                    <option value="attack_melee">⚔️ Sword Slash Arc (380ms)</option>
                    <option value="attack_thrust">🗡️ Spear Thrust (360ms)</option>
                    <option value="cast_spell">🪄 Cast Spell (500ms)</option>
                    <option value="hit_recoil">💥 Flinch Recoil (300ms)</option>
                    <option value="walk">🏃 Walk Stride (600ms)</option>
                    <option value="idle">🧘 Idle Breathing (600ms)</option>
                  </select>
                </div>
              </div>

              <!-- Timeline Track Slider & Controls -->
              <div style="background: rgba(20,30,24,0.6); padding: 10px; border-radius: 8px; border: 1px solid var(--parchment-border); display: flex; flex-direction: column; gap: 8px;">
                <div style="display: flex; justify-content: space-between; font-size: 0.8rem; font-weight: 700; color: #f4be42;">
                  <span>Timeline Position: <span id="label-timeline-time">0</span> ms / <span id="label-timeline-duration">380</span> ms</span>
                  <span id="label-keyframe-count">Keyframes: 4</span>
                </div>
                <!-- Interactive Clickable Keyframe Chips Bar -->
                <div style="display: flex; gap: 6px; align-items: center; overflow-x: auto; padding: 4px 0;" id="keyframe-chips-bar"></div>

                <div style="display: flex; gap: 6px; margin-top: 4px; flex-wrap: wrap;">
                  <button id="btn-timeline-play" class="btn-ghibli btn-emerald" style="flex: 1; font-size: 0.8rem;">▶ Play</button>
                  <button id="btn-timeline-pause" class="btn-ghibli" style="flex: 1; font-size: 0.8rem;">⏸ Pause</button>
                  <button id="btn-timeline-save-keyframe" class="btn-ghibli" style="flex: 1.2; font-size: 0.8rem; background: linear-gradient(180deg, #d97724 0%, #a85208 100%); color: #fff;" title="Save current pose to selected timestamp">💾 Save Keyframe</button>
                  <button id="btn-timeline-delete-keyframe" class="btn-ghibli btn-crimson" style="flex: 1; font-size: 0.8rem;" title="Delete keyframe at current timestamp">❌ Delete Keyframe</button>
                  <button id="btn-timeline-clear" class="btn-ghibli" style="font-size: 0.8rem; padding: 4px 10px; background: #555; color: #fff;">🗑️ Reset All</button>
                </div>
              </div>

              <!-- Pose Joint Sliders -->
              <div style="font-weight: 700; font-size: 0.85rem; color: var(--text-dark); margin-top: 4px;">🦴 Pose Joint Sliders:</div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px 16px;">
                <div>
                  <label style="font-size: 0.78rem; font-weight: 700;">Right Arm Angle: <span id="val-arm-right">-1.1</span></label>
                  <input type="range" id="slider-arm-right" min="-3.14" max="3.14" step="0.05" value="-1.1" style="width: 100%;">
                </div>
                <div>
                  <label style="font-size: 0.78rem; font-weight: 700;">Left Arm Angle: <span id="val-arm-left">-0.4</span></label>
                  <input type="range" id="slider-arm-left" min="-3.14" max="3.14" step="0.05" value="-0.4" style="width: 100%;">
                </div>
                <div>
                  <label style="font-size: 0.78rem; font-weight: 700;">Head Tilt Angle: <span id="val-head-tilt">0</span></label>
                  <input type="range" id="slider-head-tilt" min="-1" max="1" step="0.05" value="0" style="width: 100%;">
                </div>
                <div>
                  <label style="font-size: 0.78rem; font-weight: 700;">Torso Lunge Tilt: <span id="val-torso-tilt">0</span></label>
                  <input type="range" id="slider-torso-tilt" min="-0.8" max="0.8" step="0.05" value="0" style="width: 100%;">
                </div>
                <div>
                  <label style="font-size: 0.78rem; font-weight: 700;">Cloak Sway: <span id="val-cloak-sway">0</span></label>
                  <input type="range" id="slider-cloak-sway" min="-1" max="1" step="0.05" value="0" style="width: 100%;">
                </div>
                <div>
                  <label style="font-size: 0.78rem; font-weight: 700;">Body Hip Bob Y: <span id="val-hip-y">0</span></label>
                  <input type="range" id="slider-hip-y" min="-10" max="10" step="1" value="0" style="width: 100%;">
                </div>
              </div>
            </div>

            <!-- Tab 3: Visual Item Creator -->
            <div id="tab-items" class="studio-tab-pane" style="display: none; flex-direction: column; gap: 10px;">
              <div style="font-weight: 700; font-size: 0.9rem; color: var(--text-dark);">🛠️ Create Custom Wearable Item / Artifact:</div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                <div>
                  <label style="font-size: 0.8rem; font-weight: 700;">Item Name:</label>
                  <input type="text" id="input-item-name" value="Excalibur Sun Blade" style="width: 100%; padding: 5px; border-radius: 5px;">
                </div>
                <div>
                  <label style="font-size: 0.8rem; font-weight: 700;">Item Slot / Type:</label>
                  <select id="select-item-slot" style="width: 100%; padding: 5px; border-radius: 5px;">
                    <option value="weapon">Weapon (Right Hand)</option>
                    <option value="armor">Armor (Torso Cuirass)</option>
                    <option value="head">Headgear (Helmet / Hat)</option>
                    <option value="shield">Shield (Left Hand)</option>
                    <option value="baldric">Heroic Baldric (Sash)</option>
                    <option value="ring">Ring Accessory</option>
                  </select>
                </div>

                <div>
                  <label style="font-size: 0.8rem; font-weight: 700;">Icon Emoji:</label>
                  <input type="text" id="input-item-icon" value="⚔️" style="width: 100%; padding: 5px; border-radius: 5px;">
                </div>
                <div>
                  <label style="font-size: 0.8rem; font-weight: 700;">Weapon Damage Bonus:</label>
                  <input type="number" id="input-item-dmg" value="15" style="width: 100%; padding: 5px; border-radius: 5px;">
                </div>
                <div>
                  <label style="font-size: 0.8rem; font-weight: 700;">Armor Defense Bonus:</label>
                  <input type="number" id="input-item-def" value="5" style="width: 100%; padding: 5px; border-radius: 5px;">
                </div>
                <div>
                  <label style="font-size: 0.8rem; font-weight: 700;">Stat Bonus (+Strength/+Magic):</label>
                  <input type="number" id="input-item-stat-bonus" value="8" style="width: 100%; padding: 5px; border-radius: 5px;">
                </div>
              </div>

              <div style="display: flex; gap: 10px; margin-top: 10px;">
                <button id="btn-create-item-satchel" class="btn-ghibli btn-emerald" style="flex: 1; font-size: 0.82rem;">🎒 Add to Player Satchel</button>
                <button id="btn-create-item-merchant" class="btn-ghibli" style="flex: 1; font-size: 0.82rem; background: linear-gradient(180deg, #d97724 0%, #a85208 100%); color: #fff;">🛒 Stock in Merchant Shop</button>
              </div>
            </div>

            <!-- Tab 4: Stats & Role -->
            <div id="tab-stats" class="studio-tab-pane" style="display: none; flex-direction: column; gap: 12px;">
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                <div>
                  <label style="font-size: 0.82rem; font-weight: 700;">Max Health (HP):</label>
                  <input type="number" id="input-stat-hp" value="${this.currentPreset.stats.maxHp}" style="width: 100%; padding: 6px; border-radius: 6px;">
                </div>
                <div>
                  <label style="font-size: 0.82rem; font-weight: 700;">Turn Action Points (AP):</label>
                  <input type="number" id="input-stat-ap" value="${this.currentPreset.stats.ap}" style="width: 100%; padding: 6px; border-radius: 6px;">
                </div>
                <div>
                  <label style="font-size: 0.82rem; font-weight: 700;">Strength Stat:</label>
                  <input type="number" id="input-stat-str" value="${this.currentPreset.stats.strength}" style="width: 100%; padding: 6px; border-radius: 6px;">
                </div>
                <div>
                  <label style="font-size: 0.82rem; font-weight: 700;">Magic Stat:</label>
                  <input type="number" id="input-stat-mag" value="${this.currentPreset.stats.magic}" style="width: 100%; padding: 6px; border-radius: 6px;">
                </div>
              </div>
            </div>

            <!-- Tab 5: World Character Spawner -->
            <div id="tab-spawner" class="studio-tab-pane" style="display: none; flex-direction: column; gap: 12px;">
              <div style="font-weight: 700; font-size: 0.9rem; color: var(--text-dark);">🌍 Spawn Designed Character into Game Room:</div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                <div>
                  <label style="font-size: 0.82rem; font-weight: 700;">Target Room:</label>
                  <select id="select-spawn-room" style="width: 100%; padding: 6px; border-radius: 6px;">
                    <option value="town_square">Town Square & Market</option>
                    <option value="forest_path">Mistvale Forest Path</option>
                    <option value="magic_shop">Zara's Arcane Shop</option>
                    <option value="guild_hall">Adventurers Guild Hall</option>
                  </select>
                </div>

                <div>
                  <label style="font-size: 0.82rem; font-weight: 700;">Encounter Type:</label>
                  <select id="select-spawn-type" style="width: 100%; padding: 6px; border-radius: 6px;">
                    <option value="combat">⚔️ Grid Combat Boss / Enemy</option>
                    <option value="npc">💬 Interactive Quest NPC</option>
                  </select>
                </div>
              </div>

              <button id="btn-spawn-character-world" class="btn-ghibli btn-emerald" style="margin-top: 10px; width: 100%; padding: 8px;">🌍 Spawn Character into Room Now!</button>
            </div>

            <!-- Tab 6: AI Prompt Generator Hook -->
            <div id="tab-ai" class="studio-tab-pane" style="display: none; flex-direction: column; gap: 12px;">
              <div style="font-weight: 700; font-size: 0.9rem; color: #4c1170;">🤖 AI Character Generator Hook:</div>
              <p style="font-size: 0.82rem; color: #555;">Type a natural text description to auto-generate structured character JSON schema, outfits, colors, and combat stats!</p>

              <textarea id="input-ai-prompt" rows="3" placeholder="e.g. A spectral death knight with glowing blue plate armor, a scarlet baldric, high strength and sword slash attack..." style="width: 100%; padding: 8px; border-radius: 6px; font-weight: 600;"></textarea>

              <button id="btn-generate-ai-character" class="btn-ghibli" style="background: linear-gradient(180deg, #802bb0 0%, #4c1170 100%); color: #fff; border-color: #27063b; width: 100%;">⚡ Generate Character via AI Hook</button>
            </div>

          </div>

          <!-- Footer Actions & JSON Export/Import -->
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 12px; border-top: 1px solid var(--parchment-border); padding-top: 10px;">
            <div style="display: flex; gap: 8px;">
              <button id="btn-export-json" class="btn-ghibli" style="font-size: 0.8rem; padding: 4px 10px;">💾 Export JSON</button>
              <button id="btn-import-json" class="btn-ghibli" style="font-size: 0.8rem; padding: 4px 10px;">📂 Import JSON</button>
            </div>
            <button id="btn-studio-apply" class="btn-ghibli btn-emerald" style="padding: 6px 18px;">✅ Apply Character to Game</button>
          </div>

        </div>

      </div>
    `;

    document.body.appendChild(this.containerEl);
    this.attachEvents();
  }

  attachEvents() {
    this.containerEl.querySelector('#btn-close-studio').addEventListener('click', () => this.close());

    // Tab Switching
    this.containerEl.querySelectorAll('.studio-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.containerEl.querySelectorAll('.studio-tab-btn').forEach(b => b.classList.remove('active'));
        this.containerEl.querySelectorAll('.studio-tab-pane').forEach(p => p.style.display = 'none');
        btn.classList.add('active');
        const target = btn.dataset.tab;
        this.containerEl.querySelector(`#${target}`).style.display = 'flex';
      });
    });

    // Preset Template Switcher
    this.containerEl.querySelector('#select-preset-template').addEventListener('change', (e) => {
      const key = e.target.value;
      if (this.presets[key]) {
        this.activePresetKey = key;
        this.currentPreset = JSON.parse(JSON.stringify(this.presets[key]));
        this.studioEquipment = this.currentPreset.outfit;
        this.cloakColor = this.currentPreset.cloakColor;
        this.activeModel = this.currentPreset.rig === 'goblin' ? 'goblin' : 'hero';
        this.containerEl.querySelector('#input-char-name').value = this.currentPreset.name;
      }
    });

    // Character Name Change
    this.containerEl.querySelector('#input-char-name').addEventListener('input', (e) => {
      this.currentPreset.name = e.target.value;
    });

    // Outfit Selection Event Listeners
    this.containerEl.querySelector('#select-studio-armor').addEventListener('change', (e) => {
      const val = e.target.value;
      this.studioEquipment.armor = (val === 'none' || val === 'underwear') ? null : { id: val, name: val };
    });

    this.containerEl.querySelector('#input-tunic-color').addEventListener('input', (e) => {
      this.studioEquipment.tunicColor = e.target.value;
    });

    this.containerEl.querySelector('#input-pants-color').addEventListener('input', (e) => {
      this.studioEquipment.pantsColor = e.target.value;
    });

    this.containerEl.querySelector('#input-under-color').addEventListener('input', (e) => {
      this.studioEquipment.underColor = e.target.value;
    });

    this.containerEl.querySelector('#select-studio-head').addEventListener('change', (e) => {
      const val = e.target.value;
      this.studioEquipment.head = val === 'none' ? null : { id: val, name: val, icon: '🪖' };
    });

    this.containerEl.querySelector('#select-studio-weapon').addEventListener('change', (e) => {
      const val = e.target.value;
      this.studioEquipment.weapon = { id: val, name: val, slot: 'weapon' };
    });

    this.containerEl.querySelector('#select-studio-cape').addEventListener('change', (e) => {
      const val = e.target.value;
      if (val === 'none') {
        this.studioEquipment.cape = null;
      } else {
        const capeColors = { scarlet_cape: '#8b2626', shadow_cape: '#1c1524', gold_cape: '#f4be42' };
        this.studioEquipment.cape = { id: val, name: val, color: capeColors[val] || '#8b2626' };
      }
    });

    this.containerEl.querySelector('#select-studio-baldric').addEventListener('change', (e) => {
      this.studioEquipment.baldric = { id: 'baldric', color: e.target.value };
    });

    this.containerEl.querySelector('#input-cloak-color').addEventListener('input', (e) => {
      this.cloakColor = e.target.value;
      if (this.studioEquipment.cape) {
        this.studioEquipment.cape.color = e.target.value;
      }
    });

    // Animation Sequence Selection Dropdown
    const animSelect = this.containerEl.querySelector('#select-timeline-animation');
    if (animSelect) {
      animSelect.addEventListener('change', (e) => {
        this.loadPresetAnimationTimeline(e.target.value);
      });
    }

    // Timeline Scrubbing Slider
    const scrubSlider = this.containerEl.querySelector('#slider-timeline-scrub');
    scrubSlider.addEventListener('input', (e) => {
      this.timelineState.currentTime = parseInt(e.target.value);
      this.containerEl.querySelector('#label-timeline-time').innerText = this.timelineState.currentTime;
      this.applyInterpolatedKeyframePose(this.timelineState.currentTime);
      this.syncSlidersFromJoints(this.previewPaperdoll.joints);
      this.renderKeyframeChips();
    });

    // Pose Sliders Input Event Handlers
    const bindJointSlider = (id, jointName, labelId) => {
      const slider = this.containerEl.querySelector(`#${id}`);
      slider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        this.containerEl.querySelector(`#${labelId}`).innerText = val;
        this.previewPaperdoll.joints[jointName] = val;

        // Auto-update pose if stopped at an existing keyframe timestamp!
        const existingKf = this.timelineState.keyframes.find(kf => Math.abs(kf.time - this.timelineState.currentTime) < 5);
        if (existingKf) {
          existingKf.joints[jointName] = val;
        }
      });
    };

    bindJointSlider('slider-arm-right', 'rightArmAngle', 'val-arm-right');
    bindJointSlider('slider-arm-left', 'leftArmAngle', 'val-arm-left');
    bindJointSlider('slider-head-tilt', 'headTilt', 'val-head-tilt');
    bindJointSlider('slider-torso-tilt', 'torsoTilt', 'val-torso-tilt');
    bindJointSlider('slider-cloak-sway', 'cloakSway', 'val-cloak-sway');
    bindJointSlider('slider-hip-y', 'hipY', 'val-hip-y');

    // Save / Update Keyframe Button
    this.containerEl.querySelector('#btn-timeline-save-keyframe').addEventListener('click', () => {
      const curTime = this.timelineState.currentTime;
      const currentJoints = {
        rightArmAngle: parseFloat(this.containerEl.querySelector('#slider-arm-right').value),
        leftArmAngle: parseFloat(this.containerEl.querySelector('#slider-arm-left').value),
        headTilt: parseFloat(this.containerEl.querySelector('#slider-head-tilt').value),
        torsoTilt: parseFloat(this.containerEl.querySelector('#slider-torso-tilt').value),
        cloakSway: parseFloat(this.containerEl.querySelector('#slider-cloak-sway').value),
        hipY: parseFloat(this.containerEl.querySelector('#slider-hip-y').value)
      };

      // Remove existing keyframe at exact time if present
      this.timelineState.keyframes = this.timelineState.keyframes.filter(kf => kf.time !== curTime);
      this.timelineState.keyframes.push({ time: curTime, joints: currentJoints });
      this.timelineState.keyframes.sort((a, b) => a.time - b.time);

      this.renderKeyframeChips();
      alert(`💾 Saved Keyframe Pose at t=${curTime}ms!`);
    });

    // Delete Keyframe Button
    this.containerEl.querySelector('#btn-timeline-delete-keyframe').addEventListener('click', () => {
      const curTime = this.timelineState.currentTime;
      if (this.timelineState.keyframes.length <= 2) {
        alert('An animation sequence requires at least 2 keyframes!');
        return;
      }

      this.timelineState.keyframes = this.timelineState.keyframes.filter(kf => kf.time !== curTime);
      this.timelineState.keyframes.sort((a, b) => a.time - b.time);
      
      // Jump to nearest keyframe
      if (this.timelineState.keyframes.length > 0) {
        this.timelineState.currentTime = this.timelineState.keyframes[0].time;
        this.applyInterpolatedKeyframePose(this.timelineState.currentTime);
        this.syncSlidersFromJoints(this.previewPaperdoll.joints);
      }

      this.renderKeyframeChips();
      alert(`❌ Deleted Keyframe at t=${curTime}ms!`);
    });

    // Timeline Play / Pause
    this.containerEl.querySelector('#btn-timeline-play').addEventListener('click', () => {
      this.timelineState.isPlaying = true;
      if (this.timelineState.currentTime >= this.timelineState.duration - 10) {
        this.timelineState.currentTime = 0;
      }
      this.timelineState.playbackStartTime = Date.now() - this.timelineState.currentTime;
    });

    this.containerEl.querySelector('#btn-timeline-pause').addEventListener('click', () => {
      this.timelineState.isPlaying = false;
    });

    this.containerEl.querySelector('#btn-timeline-clear').addEventListener('click', () => {
      this.timelineState.keyframes = [
        { time: 0, joints: { rightArmAngle: -1.1, leftArmAngle: -0.4, headTilt: 0, torsoTilt: 0, cloakSway: 0, hipY: 0 } },
        { time: 600, joints: { rightArmAngle: -1.1, leftArmAngle: -0.4, headTilt: 0, torsoTilt: 0, cloakSway: 0, hipY: 0 } }
      ];
      this.timelineState.currentTime = 0;
      this.timelineState.isPlaying = false;
      this.containerEl.querySelector('#slider-timeline-scrub').value = 0;
      this.containerEl.querySelector('#label-timeline-time').innerText = 0;
      this.renderKeyframeChips();
    });

    // Create Item to Player Satchel
    this.containerEl.querySelector('#btn-create-item-satchel').addEventListener('click', () => {
      const name = this.containerEl.querySelector('#input-item-name').value || 'Custom Artifact';
      const slot = this.containerEl.querySelector('#select-item-slot').value;
      const icon = this.containerEl.querySelector('#input-item-icon').value || '⚔️';
      const weaponDmg = parseInt(this.containerEl.querySelector('#input-item-dmg').value) || 10;
      const armorDef = parseInt(this.containerEl.querySelector('#input-item-def').value) || 4;
      const bonus = parseInt(this.containerEl.querySelector('#input-item-stat-bonus').value) || 5;

      const newItem = {
        id: `custom_${Date.now()}`,
        name: name,
        count: 1,
        icon: icon,
        type: 'equip',
        slot: slot,
        weaponDamage: weaponDmg,
        armorDef: armorDef,
        statBonus: { strength: bonus, magic: bonus },
        desc: `Custom artifact created in QFTR Studio (+${weaponDmg} Damage, +${armorDef} Armor Def).`
      };

      if (this.gameEngine && this.gameEngine.inventorySystem) {
        this.gameEngine.inventorySystem.items.push(newItem);
        alert(`🎒 Created Item "${name}" and added to player satchel!`);
      }
    });

    // World Spawner Event Handler
    this.containerEl.querySelector('#btn-spawn-character-world').addEventListener('click', () => {
      const roomKey = this.containerEl.querySelector('#select-spawn-room').value;
      const spawnType = this.containerEl.querySelector('#select-spawn-type').value;

      if (this.gameEngine && this.gameEngine.explorationScene) {
        const room = this.gameEngine.explorationScene.rooms[roomKey];
        if (room) {
          const spawnX = room.bounds ? (room.bounds.xMin + room.bounds.xMax) / 2 : 640;
          const spawnY = room.bounds ? (room.bounds.yMin + room.bounds.yMax) / 2 : 450;

          const newHotspot = {
            id: `spawn_${Date.now()}`,
            label: `${this.currentPreset.name}`,
            x: spawnX - 50,
            y: spawnY - 50,
            w: 100,
            h: 100,
            type: spawnType,
            enemyType: this.currentPreset.name,
            desc: `Custom character spawned from QFTR Studio.`
          };

          room.hotspots.push(newHotspot);
          alert(`🌍 Character "${this.currentPreset.name}" spawned into room [${room.title}]!`);
        }
      }
    });

    // AI Character Generator Hook
    this.containerEl.querySelector('#btn-generate-ai-character').addEventListener('click', () => {
      const prompt = this.containerEl.querySelector('#input-ai-prompt').value.toLowerCase();
      if (!prompt) return;

      if (prompt.includes('knight') || prompt.includes('paladin')) {
        this.studioEquipment.armor = { id: 'plate_armor', name: 'Plate Mail' };
        this.studioEquipment.head = { id: 'iron_helm', name: 'Iron Helm', icon: '🪖' };
        this.studioEquipment.baldric = { id: 'baldric', color: '#b82531' };
        this.cloakColor = '#1c1524';
      } else if (prompt.includes('mage') || prompt.includes('wizard') || prompt.includes('sorceress')) {
        this.studioEquipment.armor = { id: 'mage_robe', name: 'Arcane Robes' };
        this.studioEquipment.head = { id: 'wizard_hat', name: 'Wizard Hat', icon: '🧙' };
        this.studioEquipment.weapon = { id: 'arcane_wand', name: 'Arcane Staff', slot: 'weapon' };
        this.studioEquipment.baldric = { id: 'baldric', color: '#1d5ec9' };
        this.cloakColor = '#103b82';
      } else if (prompt.includes('rogue') || prompt.includes('thief') || prompt.includes('shadow')) {
        this.studioEquipment.armor = { id: 'thief_vest', name: 'Shadow Vest' };
        this.studioEquipment.head = null;
        this.studioEquipment.baldric = { id: 'baldric', color: '#387654' };
        this.cloakColor = '#1c1524';
      }

      alert(`🤖 AI Generated Character Schema applied for prompt: "${prompt}"!`);
    });

    // Export JSON
    this.containerEl.querySelector('#btn-export-json').addEventListener('click', () => {
      const exportData = {
        ...this.currentPreset,
        outfit: this.studioEquipment,
        cloakColor: this.cloakColor,
        customAnimationTimeline: this.timelineState.keyframes
      };
      const jsonStr = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${this.currentPreset.id || 'character'}.json`;
      a.click();
    });

    // Import JSON
    this.containerEl.querySelector('#btn-import-json').addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'application/json';
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (evt) => {
            try {
              const data = JSON.parse(evt.target.result);
              if (data.outfit) this.studioEquipment = data.outfit;
              if (data.cloakColor) this.cloakColor = data.cloakColor;
              if (data.customAnimationTimeline) this.timelineState.keyframes = data.customAnimationTimeline;
              if (data.name) this.containerEl.querySelector('#input-char-name').value = data.name;
              alert(`📂 Imported Character JSON: ${data.name || 'Custom Character'}`);
            } catch (err) {
              alert('Error parsing character JSON file.');
            }
          };
          reader.readAsText(file);
        }
      };
      input.click();
    });

    // Apply to Game
    this.containerEl.querySelector('#btn-studio-apply').addEventListener('click', () => {
      if (this.gameEngine && this.gameEngine.inventorySystem) {
        this.gameEngine.inventorySystem.equipment = { ...this.studioEquipment };
      }
      this.close();
    });
  }

  loadPresetAnimationTimeline(animName) {
    let duration = 600;
    let keyframes = [];

    if (animName === 'attack_melee') {
      duration = 380;
      keyframes = [
        { time: 0, joints: { rightArmAngle: -1.1, leftArmAngle: -0.4, headTilt: 0, torsoTilt: 0, cloakSway: 0, hipY: 0 } },
        { time: 80, joints: { rightArmAngle: -1.8, leftArmAngle: -0.4, headTilt: 0.1, torsoTilt: -0.2, cloakSway: -0.1, hipY: 2 } },
        { time: 240, joints: { rightArmAngle: 1.6, leftArmAngle: -0.4, headTilt: -0.1, torsoTilt: 0.3, cloakSway: 0.3, hipY: -4 } },
        { time: 380, joints: { rightArmAngle: -1.1, leftArmAngle: -0.4, headTilt: 0, torsoTilt: 0, cloakSway: 0, hipY: 0 } }
      ];
    } else if (animName === 'attack_thrust') {
      duration = 360;
      keyframes = [
        { time: 0, joints: { rightArmAngle: 0.4, leftArmAngle: 0, headTilt: 0, torsoTilt: 0, cloakSway: 0, hipY: 0 } },
        { time: 90, joints: { rightArmAngle: 0.8, leftArmAngle: 0, headTilt: 0.1, torsoTilt: -0.15, cloakSway: -0.1, hipY: 2 } },
        { time: 230, joints: { rightArmAngle: -0.8, leftArmAngle: 0, headTilt: -0.1, torsoTilt: 0.35, cloakSway: 0.3, hipY: -4 } },
        { time: 360, joints: { rightArmAngle: 0.4, leftArmAngle: 0, headTilt: 0, torsoTilt: 0, cloakSway: 0, hipY: 0 } }
      ];
    } else if (animName === 'cast_spell') {
      duration = 500;
      keyframes = [
        { time: 0, joints: { rightArmAngle: -1.1, leftArmAngle: -0.4, headTilt: 0, torsoTilt: 0, cloakSway: 0, hipY: 0 } },
        { time: 250, joints: { rightArmAngle: -1.5, leftArmAngle: -1.0, headTilt: -0.15, torsoTilt: 0, cloakSway: 0.2, hipY: -3 } },
        { time: 500, joints: { rightArmAngle: -1.1, leftArmAngle: -0.4, headTilt: 0, torsoTilt: 0, cloakSway: 0, hipY: 0 } }
      ];
    } else if (animName === 'hit_recoil') {
      duration = 300;
      keyframes = [
        { time: 0, joints: { rightArmAngle: -1.1, leftArmAngle: -0.4, headTilt: 0, torsoTilt: 0, cloakSway: 0, hipY: 0 } },
        { time: 150, joints: { rightArmAngle: -0.5, leftArmAngle: -0.2, headTilt: 0.25, torsoTilt: -0.4, cloakSway: -0.2, hipY: 6 } },
        { time: 300, joints: { rightArmAngle: -1.1, leftArmAngle: -0.4, headTilt: 0, torsoTilt: 0, cloakSway: 0, hipY: 0 } }
      ];
    } else if (animName === 'walk') {
      duration = 600;
      keyframes = [
        { time: 0, joints: { rightArmAngle: 0.35, leftArmAngle: -0.35, headTilt: 0, torsoTilt: 0, cloakSway: 0.25, hipY: 0 } },
        { time: 300, joints: { rightArmAngle: -0.35, leftArmAngle: 0.35, headTilt: 0.04, torsoTilt: 0, cloakSway: -0.25, hipY: -3 } },
        { time: 600, joints: { rightArmAngle: 0.35, leftArmAngle: -0.35, headTilt: 0, torsoTilt: 0, cloakSway: 0.25, hipY: 0 } }
      ];
    } else {
      duration = 600;
      keyframes = [
        { time: 0, joints: { rightArmAngle: -1.2, leftArmAngle: -0.4, headTilt: 0, torsoTilt: 0, cloakSway: 0.1, hipY: 0 } },
        { time: 300, joints: { rightArmAngle: -1.14, leftArmAngle: -0.34, headTilt: 0.05, torsoTilt: 0, cloakSway: -0.1, hipY: 2 } },
        { time: 600, joints: { rightArmAngle: -1.2, leftArmAngle: -0.4, headTilt: 0, torsoTilt: 0, cloakSway: 0.1, hipY: 0 } }
      ];
    }

    this.timelineState.duration = duration;
    this.timelineState.keyframes = keyframes;
    this.timelineState.currentTime = 0;
    this.timelineState.isPlaying = false;

    const scrub = this.containerEl.querySelector('#slider-timeline-scrub');
    if (scrub) {
      scrub.max = duration;
      scrub.value = 0;
    }
    const durLabel = this.containerEl.querySelector('#label-timeline-duration');
    if (durLabel) durLabel.innerText = duration;
    const countLabel = this.containerEl.querySelector('#label-keyframe-count');
    if (countLabel) countLabel.innerText = `Keyframes: ${keyframes.length}`;

    this.applyInterpolatedKeyframePose(0);
    this.syncSlidersFromJoints(this.previewPaperdoll.joints);
  }

  syncSlidersFromJoints(joints) {
    const setVal = (id, labelId, val) => {
      const el = this.containerEl.querySelector(`#${id}`);
      const lbl = this.containerEl.querySelector(`#${labelId}`);
      if (el && val !== undefined) el.value = val;
      if (lbl && val !== undefined) lbl.innerText = Math.round(val * 100) / 100;
    };

    setVal('slider-arm-right', 'val-arm-right', joints.rightArmAngle);
    setVal('slider-arm-left', 'val-arm-left', joints.leftArmAngle);
    setVal('slider-head-tilt', 'val-head-tilt', joints.headTilt);
    setVal('slider-torso-tilt', 'val-torso-tilt', joints.torsoTilt);
    setVal('slider-cloak-sway', 'val-cloak-sway', joints.cloakSway);
    setVal('slider-hip-y', 'val-hip-y', joints.hipY);
  }

  renderKeyframeChips() {
    if (!this.containerEl) return;
    const chipsBar = this.containerEl.querySelector('#keyframe-chips-bar');
    if (!chipsBar) return;
    chipsBar.innerHTML = '';

    const curTime = this.timelineState ? this.timelineState.currentTime : 0;
    const kfs = (this.timelineState && this.timelineState.keyframes) ? this.timelineState.keyframes : [];

    kfs.forEach(kf => {
      const btn = document.createElement('button');
      const isSelected = Math.abs(kf.time - curTime) < 5;
      btn.className = 'btn-ghibli';
      btn.style.cssText = `
        padding: 3px 10px;
        font-size: 0.75rem;
        font-weight: 700;
        border-radius: 12px;
        cursor: pointer;
        white-space: nowrap;
        background: ${isSelected ? 'linear-gradient(180deg, #387654 0%, #1e452e 100%)' : 'rgba(255,255,255,0.15)'};
        color: ${isSelected ? '#f4be42' : '#fff'};
        border: ${isSelected ? '2px solid #f4be42' : '1px solid rgba(255,255,255,0.3)'};
      `;
      btn.innerHTML = `📍 ${kf.time}ms`;

      btn.addEventListener('click', () => {
        this.timelineState.currentTime = kf.time;
        this.timelineState.isPlaying = false;
        const scrub = this.containerEl.querySelector('#slider-timeline-scrub');
        if (scrub) scrub.value = kf.time;
        const timeLabel = this.containerEl.querySelector('#label-timeline-time');
        if (timeLabel) timeLabel.innerText = kf.time;

        Object.assign(this.previewPaperdoll.joints, kf.joints);
        this.syncSlidersFromJoints(kf.joints);
        this.renderKeyframeChips();
      });

      chipsBar.appendChild(btn);
    });

    const countLabel = this.containerEl.querySelector('#label-keyframe-count');
    if (countLabel) countLabel.innerText = `Keyframes: ${kfs.length}`;
  }

  applyInterpolatedKeyframePose(targetTime) {
    const kfs = this.timelineState.keyframes;
    if (!kfs || kfs.length === 0) return;

    if (kfs.length === 1) {
      Object.assign(this.previewPaperdoll.joints, kfs[0].joints);
      return;
    }

    // Find bounding keyframes A and B
    let kfA = kfs[0];
    let kfB = kfs[kfs.length - 1];

    for (let i = 0; i < kfs.length - 1; i++) {
      if (targetTime >= kfs[i].time && targetTime <= kfs[i + 1].time) {
        kfA = kfs[i];
        kfB = kfs[i + 1];
        break;
      }
    }

    const range = kfB.time - kfA.time;
    const t = range > 0 ? (targetTime - kfA.time) / range : 0;

    // Linear Slerp Joint Interpolation for 2-Segment Limbs & Spine
    const allJointKeys = [
      'rightArmAngle', 'rightElbowAngle',
      'leftArmAngle', 'leftElbowAngle',
      'headTilt', 'spineAngle', 'torsoTilt', 'cloakSway', 'hipY',
      'leftLegAngle', 'leftKneeAngle',
      'rightLegAngle', 'rightKneeAngle',
      'lungeX'
    ];

    allJointKeys.forEach(joint => {
      const valA = (kfA.joints && kfA.joints[joint] !== undefined) ? kfA.joints[joint] : 0;
      const valB = (kfB.joints && kfB.joints[joint] !== undefined) ? kfB.joints[joint] : valA;
      const interpolated = valA + (valB - valA) * t;
      this.previewPaperdoll.joints[joint] = isNaN(interpolated) ? 0 : interpolated;
    });
  }

  startPreviewLoop() {
    const canvas = this.containerEl.querySelector('#studio-preview-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const render = () => {
      if (!this.isOpen) return;

      try {
        if (this.timelineState.isPlaying) {
          const elapsed = (Date.now() - this.timelineState.playbackStartTime) % this.timelineState.duration;
          this.timelineState.currentTime = elapsed;
          
          const scrubSlider = this.containerEl.querySelector('#slider-timeline-scrub');
          if (scrubSlider) scrubSlider.value = elapsed;
          const timeLabel = this.containerEl.querySelector('#label-timeline-time');
          if (timeLabel) timeLabel.innerText = Math.round(elapsed);

          this.applyInterpolatedKeyframePose(elapsed);
          this.syncSlidersFromJoints(this.previewPaperdoll.joints);
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2 + 50;

        if (this.activeModel === 'hero') {
          this.previewPaperdoll.draw(
            ctx,
            centerX,
            centerY,
            'down',
            4.4,
            this.studioEquipment || {},
            this.cloakColor || '#8b2626',
            true,
            true
          );
        } else {
          this.previewGoblin.draw(
            ctx,
            centerX,
            centerY,
            false,
            4.4
          );
        }
      } catch (err) {
        console.error('Studio Preview Error:', err);
      }

      this.animationLoopId = requestAnimationFrame(render);
    };

    render();
  }
}
