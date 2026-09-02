import { synth } from '../engine/SoundSynth.js';

export class SaveLoadSystem {
  constructor(gameEngine) {
    this.gameEngine = gameEngine;
    this.storageKeyPrefix = 'qftr_save_slot_';
  }

  saveSlot(slotNum) {
    synth.playClick();
    const saveData = {
      timestamp: new Date().toLocaleString(),
      heroName: this.gameEngine.statSystem.heroName,
      heroClass: this.gameEngine.statSystem.heroClass,
      currentRoom: this.gameEngine.explorationScene.currentRoom,
      stats: this.gameEngine.statSystem.stats,
      gold: this.gameEngine.inventorySystem.gold,
      items: this.gameEngine.inventorySystem.items,
      equipment: this.gameEngine.inventorySystem.equipment,
      score: this.gameEngine.sierraScoreSystem.score,
      completedAchvs: Array.from(this.gameEngine.sierraScoreSystem.completedAchvs),
      playerState: {
        x: this.gameEngine.playerState.x,
        y: this.gameEngine.playerState.y,
        cloakColor: this.gameEngine.playerState.cloakColor
      }
    };

    localStorage.setItem(this.storageKeyPrefix + slotNum, JSON.stringify(saveData));
    synth.playStatUp();
    this.gameEngine.showNotification(`💾 Game saved successfully to Slot ${slotNum}!`);
    this.showSaveLoadModal('save');
  }

  loadSlot(slotNum) {
    synth.playClick();
    const raw = localStorage.getItem(this.storageKeyPrefix + slotNum);
    if (!raw) {
      this.gameEngine.showNotification(`⚠️ Slot ${slotNum} is empty!`);
      return;
    }

    try {
      const data = JSON.parse(raw);
      this.gameEngine.statSystem.heroName = data.heroName;
      this.gameEngine.statSystem.heroClass = data.heroClass;
      Object.assign(this.gameEngine.statSystem.stats, data.stats);
      this.gameEngine.statSystem.recalculatePools();
      this.gameEngine.statSystem.fullRestore();

      this.gameEngine.inventorySystem.gold = data.gold;
      this.gameEngine.inventorySystem.items = data.items || [];
      this.gameEngine.inventorySystem.equipment = data.equipment || { weapon: null, armor: null, shield: null };

      this.gameEngine.sierraScoreSystem.score = data.score || 0;
      this.gameEngine.sierraScoreSystem.completedAchvs = new Set(data.completedAchvs || []);
      this.gameEngine.sierraScoreSystem.updateScoreBadge();

      this.gameEngine.playerState.x = data.playerState.x || 350;
      this.gameEngine.playerState.y = data.playerState.y || 450;
      this.gameEngine.playerState.cloakColor = data.playerState.cloakColor || null;

      this.gameEngine.explorationScene.changeRoom(data.currentRoom, data.playerState.x, data.playerState.y);
      this.gameEngine.updateHUD();

      synth.playStatUp();
      document.getElementById('dialogue-layer').style.display = 'none';
      this.gameEngine.showNotification(`📂 Loaded Game Slot ${slotNum} (${data.heroName} the ${data.heroClass})!`);
    } catch (e) {
      this.gameEngine.showNotification(`⚠️ Failed to load Slot ${slotNum}.`);
    }
  }

  showSaveLoadModal(mode = 'save') {
    synth.playClick();
    const dialogueLayer = document.getElementById('dialogue-layer');
    dialogueLayer.style.display = 'flex';

    const getSlotLabel = (num) => {
      const raw = localStorage.getItem(this.storageKeyPrefix + num);
      if (!raw) return '<span style="color: #888;">[ Empty Save Slot ]</span>';
      try {
        const d = JSON.parse(raw);
        return `<strong>${d.heroName} (${d.heroClass})</strong> - ${d.currentRoom} <br><span style="font-size: 0.78rem; color: #524030;">Saved: ${d.timestamp} | Score: ${d.score}/300</span>`;
      } catch (e) {
        return 'Corrupted Slot';
      }
    };

    dialogueLayer.innerHTML = `
      <div class="dialogue-modal parchment-card" style="width: 620px;">
        <div style="font-family: var(--font-heading); font-size: 1.4rem; color: var(--text-dark); margin-bottom: 14px; font-weight: 700; border-bottom: 2px solid var(--parchment-border); padding-bottom: 8px;">
          ${mode === 'save' ? '💾 Sierra Save Game' : '📂 Sierra Load Game'}
        </div>

        <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 18px;">
          ${[1, 2, 3].map(num => `
            <div style="background: rgba(255,255,255,0.55); border: 1px solid var(--parchment-border); padding: 12px 16px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
              <div>
                <div style="font-size: 0.9rem; color: var(--text-dark); font-weight: 700;">Slot ${num}</div>
                <div style="margin-top: 2px;">${getSlotLabel(num)}</div>
              </div>
              <button class="btn-ghibli ${mode === 'save' ? 'btn-emerald' : ''} btn-slot-action" data-slot="${num}" style="padding: 8px 18px;">${mode === 'save' ? 'Save' : 'Load'}</button>
            </div>
          `).join('')}
        </div>

        <button id="btn-close-saveload" class="btn-ghibli" style="width: 100%; height: 42px; font-size: 1rem; justify-content: center;">Close</button>
      </div>
    `;

    dialogueLayer.querySelectorAll('.btn-slot-action').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const slot = parseInt(e.target.getAttribute('data-slot'));
        if (mode === 'save') {
          this.saveSlot(slot);
        } else {
          this.loadSlot(slot);
        }
      });
    });

    dialogueLayer.querySelector('#btn-close-saveload').addEventListener('click', () => {
      dialogueLayer.style.display = 'none';
    });
  }
}
