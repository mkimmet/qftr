import { synth } from '../engine/SoundSynth.js';

export class HintSystem {
  constructor(gameEngine) {
    this.gameEngine = gameEngine;
    this.hints = [
      { title: '🗝️ Shadow Alley Chest', hint: 'To unlock the chest in Shadow Alley, train your STEALTH stat to 15+ by walking in Sneak Mode, or purchase/cast the OPEN spell!' },
      { title: '🌸 Moonflower Herb', hint: 'The glowing blue Moonflower grows near the mossy standing stones in Mistvale Forest Path. Pick it for Sorceress Zara!' },
      { title: '🛡️ Legendary Paladin Shield', hint: 'The Paladin Shield is locked inside the Goblin Stronghold Vault (East of Goblin Camp). Pick it up to unlock the Paladin Class Path!' },
      { title: '⚔️ Sword & Agility Practice', hint: 'Practice on the training dummy in the Adventurer Guild Hall (+Weaponry XP) or throw daggers at the target board at Town Gate (+Agility XP)!' },
      { title: '💀 Defeating the Arch-Lich', hint: 'Rest up at the Guild Hall to restore full HP/MP, buy Healing Elixirs from Sorceress Zara, and equip the Arcane Staff before entering the Void Throne Room!' }
    ];
  }

  showHintModal() {
    synth.playClick();
    const dialogueLayer = document.getElementById('dialogue-layer');
    dialogueLayer.style.display = 'flex';
    dialogueLayer.innerHTML = `
      <div class="dialogue-modal parchment-card" style="width: 680px;">
        <div style="font-family: var(--font-heading); font-size: 1.4rem; color: var(--text-dark); margin-bottom: 12px; font-weight: 700; border-bottom: 2px solid var(--parchment-border); padding-bottom: 8px;">
          📖 Sierra Adventurer Hint Journal
        </div>
        <div style="display: flex; flex-direction: column; gap: 12px; max-height: 320px; overflow-y: auto; margin-bottom: 16px;">
          ${this.hints.map(h => `
            <div style="background: rgba(255,255,255,0.55); border: 1px solid var(--parchment-border); padding: 12px 16px; border-radius: 8px;">
              <div style="font-weight: 700; font-size: 1rem; color: #291e14; font-family: var(--font-heading); margin-bottom: 4px;">${h.title}</div>
              <div style="font-size: 0.88rem; color: #423223; line-height: 1.4;">${h.hint}</div>
            </div>
          `).join('')}
        </div>
        <button id="btn-close-hints" class="btn-ghibli" style="width: 100%; height: 42px; font-size: 1rem; justify-content: center;">Close Hint Journal</button>
      </div>
    `;
    dialogueLayer.querySelector('#btn-close-hints').addEventListener('click', () => {
      dialogueLayer.style.display = 'none';
    });
  }
}
