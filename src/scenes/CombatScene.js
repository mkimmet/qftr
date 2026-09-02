import { SPELL_CATALOG } from '../combat/Spells.js';
import { synth } from '../engine/SoundSynth.js';

export class CombatScene {
  constructor(containerEl, combatEngine, gameEngine) {
    this.containerEl = containerEl;
    this.combatEngine = combatEngine;
    this.gameEngine = gameEngine;
  }

  render() {
    this.containerEl.style.display = 'block';
    this.containerEl.innerHTML = `
      <div class="combat-hud" style="position: absolute; top: 60px; left: 20px; right: 20px; bottom: 20px; pointer-events: none; display: flex; justify-content: space-between; align-items: flex-end;">
        
        <!-- Left Side: Action Buttons & Log -->
        <div style="display: flex; flex-direction: column; gap: 10px; pointer-events: auto; max-width: 480px;">
          <!-- Action Buttons -->
          <div class="action-bar" style="display: flex; gap: 8px; flex-wrap: wrap;">
            <button id="btn-combat-attack" class="btn-ghibli">⚔️ Melee Attack (2 AP)</button>
            <button id="btn-combat-spell" class="btn-ghibli btn-emerald">🔮 Cast Spell</button>
            <button id="btn-combat-item" class="btn-ghibli">🧪 Use Item</button>
            <button id="btn-combat-end" class="btn-ghibli btn-crimson">⌛ End Turn</button>
          </div>

          <!-- Combat Log (The Realm Style) -->
          <div class="combat-log" id="combat-log-scroll" style="background: rgba(12, 22, 16, 0.88); border: 2px solid var(--parchment-border); padding: 10px; border-radius: 8px; max-height: 140px; overflow-y: auto; color: #f7f2e7; font-size: 0.82rem;">
            <div style="font-weight: 700; color: var(--ghibli-sun-gold); margin-bottom: 6px; border-bottom: 1px solid var(--parchment-border);">Battle Log</div>
            <div id="log-entries"></div>
          </div>
        </div>

        <!-- Right Side: Turn Action Points (AP) Indicator (Uncovered Top-Right position!) -->
        <div class="parchment-card" style="position: absolute; top: 0px; right: 0px; padding: 10px 18px; pointer-events: auto; display: flex; align-items: center; gap: 12px; border: 2px solid var(--ghibli-sun-gold); box-shadow: 0 8px 20px rgba(0,0,0,0.6);">
          <span style="font-family: var(--font-heading); font-weight: 800; color: var(--text-dark); font-size: 0.95rem;">⚡ Turn AP:</span>
          <div style="display: flex; gap: 6px;" id="ap-dots-container"></div>
        </div>
      </div>

      <!-- Spellbook Modal Popup -->
      <div id="spell-modal" class="parchment-card" style="display: none; position: absolute; bottom: 90px; left: 160px; width: 340px; z-index: 50;">
        <div style="font-family: var(--font-heading); font-size: 1.1rem; color: var(--text-dark); margin-bottom: 10px; font-weight: 700;">Select Spell</div>
        <div id="spell-list-container" style="display: flex; flex-direction: column; gap: 8px;"></div>
        <button id="btn-close-spell" class="btn-ghibli" style="margin-top: 12px; padding: 4px 12px; font-size: 0.85rem; width: 100%;">Cancel</button>
      </div>
    `;

    this.attachEvents();
    this.updateAPUI();
  }

  attachEvents() {
    this.containerEl.querySelector('#btn-combat-attack').addEventListener('click', () => {
      synth.playClick();
      this.combatEngine.selectedSpell = null;
      this.combatEngine.addLog('Select an adjacent enemy tile to strike with melee attack.', 'player');
    });

    this.containerEl.querySelector('#btn-combat-spell').addEventListener('click', () => {
      synth.playClick();
      this.openSpellbook();
    });

    this.containerEl.querySelector('#btn-combat-end').addEventListener('click', () => {
      synth.playClick();
      this.combatEngine.endTurn();
    });

    this.containerEl.querySelector('#btn-close-spell').addEventListener('click', () => {
      this.containerEl.querySelector('#spell-modal').style.display = 'none';
    });

    // Connect Combat Log callback
    this.combatEngine.onLogCallback = (msg, type) => {
      const entries = this.containerEl.querySelector('#log-entries');
      if (entries) {
        const div = document.createElement('div');
        div.className = `combat-log-entry ${type}`;
        div.innerText = msg;
        entries.appendChild(div);
        const scroll = this.containerEl.querySelector('#combat-log-scroll');
        scroll.scrollTop = scroll.scrollHeight;
      }
    };

    // Connect Turn change callback
    this.combatEngine.onTurnChangeCallback = (entity) => {
      this.updateAPUI();
    };
  }

  openSpellbook() {
    const spellModal = this.containerEl.querySelector('#spell-modal');
    const spellList = this.containerEl.querySelector('#spell-list-container');
    spellList.innerHTML = '';

    Object.values(SPELL_CATALOG).forEach(spell => {
      const btn = document.createElement('button');
      btn.className = 'btn-ghibli';
      btn.style.justifyContent = 'space-between';
      btn.style.fontSize = '0.9rem';
      btn.innerHTML = `<span>${spell.icon} ${spell.name} (${spell.apCost} AP)</span><span style="color:#1d5ec9;">${spell.mpCost} MP</span>`;

      if (this.combatEngine.player.hp <= 0) {
        synth.playHit();
        const dialogueLayer = document.getElementById('dialogue-layer');
        dialogueLayer.style.display = 'flex';
        dialogueLayer.innerHTML = `
          <div class="dialogue-modal parchment-card" style="width: 620px; text-align: center;">
            <div style="font-family: var(--font-heading); font-size: 2.2rem; font-weight: 800; color: #a83232; margin-bottom: 8px;">
              💀 YOU HAVE DIED!
            </div>
            <div style="font-size: 1.05rem; color: var(--text-dark); line-height: 1.6; margin-bottom: 20px;">
              "You should have spent more time practicing your Parry and Dodge skills at the Guildhall straw dummy! Spielburg Valley falls to darkness..."
            </div>

            <div style="display: flex; gap: 12px; justify-content: center;">
              <button id="btn-respawn-town" class="btn-ghibli btn-emerald" style="padding: 12px 24px; font-weight: 800; font-size: 1rem;">🔄 Respawn at Town Square (Full HP)</button>
            </div>
          </div>
        `;

        dialogueLayer.querySelector('#btn-respawn-town').addEventListener('click', () => {
          dialogueLayer.style.display = 'none';
          this.combatEngine.player.hp = this.combatEngine.player.maxHp;
          this.combatEngine.player.mp = this.combatEngine.player.maxMp;
          this.gameEngine.explorationScene.changeRoom('town_square', 650, 450);
          this.gameEngine.switchMode('exploration');
          synth.playStatUp();
          this.gameEngine.showNotification('✨ Respawned at Spielburg Town Square with Full HP & MP!');
        });
        return;
      }

      btn.addEventListener('click', () => {
        synth.playClick();
        this.combatEngine.selectedSpell = spell;
        this.combatEngine.addLog(`Selected ${spell.name}. Click target enemy on tactical grid to cast!`, 'spell');
        spellModal.style.display = 'none';
      });

      spellList.appendChild(btn);
    });

    spellModal.style.display = 'block';
  }

  updateAPUI() {
    const player = this.combatEngine.playerEntity;
    if (!player) return;

    const apContainer = this.containerEl.querySelector('#ap-dots-container');
    if (apContainer) {
      apContainer.innerHTML = '';
      for (let i = 0; i < player.maxAp; i++) {
        const dot = document.createElement('div');
        dot.style.width = '16px';
        dot.style.height = '16px';
        dot.style.borderRadius = '50%';
        dot.style.border = '1px solid #1a7065';
        dot.style.backgroundColor = i < player.ap ? 'var(--stat-ap)' : 'rgba(0,0,0,0.2)';
        apContainer.appendChild(dot);
      }
    }
  }

  hide() {
    this.containerEl.style.display = 'none';
  }
}
