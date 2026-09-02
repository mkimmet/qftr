import { synth } from '../engine/SoundSynth.js';

export class QuestSystem {
  constructor(gameEngine) {
    this.gameEngine = gameEngine;
    this.quests = [
      {
        id: 'trial_of_spielburg',
        title: '☀️ The Trial of Spielburg (Sun Amulet)',
        status: 'active', // 'active' | 'completed'
        desc: 'Unseal the Rune Sun Gate in Mistvale Forest, defeat the Goblin Chieftain in Whispering Cavern, and return the stolen Sun Amulet to Guildmaster Bruno.',
        rewardGold: 100,
        rewardPoints: 50
      },
      {
        id: 'quest_goblin',
        title: '👺 Goblin Bounty in Mistvale Forest',
        status: 'active',
        desc: 'Vanquish the Goblin Spearmen and Chieftain guarding the forest path.',
        rewardGold: 50,
        rewardPoints: 25
      },
      {
        id: 'quest_chest',
        title: '🛡️ Retrieve the Holy Paladin Shield',
        status: 'active',
        desc: 'Pry open the iron chest in Shadow Alley to recover the stolen Paladin Shield.',
        rewardGold: 100,
        rewardPoints: 30
      },
      {
        id: 'quest_archlich',
        title: '💀 Defeat the Shadow Arch-Lich',
        status: 'active',
        desc: 'Infiltrate the Void Citadel and defeat the Arch-Lich to save Spielburg Valley.',
        rewardGold: 500,
        rewardPoints: 100
      }
    ];
  }

  showQuestLogModal() {
    this.showQuestJournalModal();
  }

  showQuestJournalModal() {
    synth.playClick();
    const dialogueLayer = document.getElementById('dialogue-layer');
    dialogueLayer.style.display = 'flex';
    dialogueLayer.innerHTML = `
      <div class="dialogue-modal parchment-card" style="width: 720px;">
        <!-- Journal Header -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid var(--parchment-border); padding-bottom: 8px; margin-bottom: 14px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 2rem;">📜</span>
            <div>
              <div style="font-family: var(--font-heading); font-size: 1.5rem; font-weight: 800; color: var(--text-dark);">Sierra Adventurer Quest Journal</div>
              <div style="font-size: 0.82rem; color: #8c5a14;">Active quest bounties & storyline goals for Spielburg Valley</div>
            </div>
          </div>
          <span style="font-weight: 800; font-size: 1.1rem; color: #8c5a14; background: rgba(244, 190, 66, 0.25); padding: 4px 14px; border-radius: 20px; border: 1px solid var(--parchment-border);">
            🏆 ${this.gameEngine.sierraScoreSystem.score} / 300 Points
          </span>
        </div>

        <!-- Quest Cards List -->
        <div style="display: flex; flex-direction: column; gap: 10px; max-height: 320px; overflow-y: auto; margin-bottom: 16px;">
          ${this.quests.map(q => `
            <div style="background: rgba(255, 255, 255, 0.65); border: 1px solid var(--parchment-border); padding: 12px 16px; border-radius: 8px; display: flex; flex-direction: column; gap: 4px;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-family: var(--font-heading); font-weight: 800; font-size: 1.05rem; color: #291e14;">${q.title}</span>
                <span style="font-weight: 700; font-size: 0.8rem; background: ${q.status === 'completed' ? 'rgba(56, 118, 84, 0.25)' : 'rgba(217, 119, 36, 0.25)'}; color: ${q.status === 'completed' ? '#1e5e3a' : '#8c5a14'}; padding: 2px 10px; border-radius: 12px; border: 1px solid var(--parchment-border);">
                  ${q.status === 'completed' ? '✅ COMPLETED' : '📜 IN PROGRESS'}
                </span>
              </div>
              <div style="font-size: 0.88rem; color: #524030; line-height: 1.4;">${q.desc}</div>
              <div style="font-size: 0.8rem; color: #8c5a14; font-weight: 700; margin-top: 2px;">
                Reward: 💰 ${q.rewardGold} Gold | 🏆 +${q.rewardPoints} Sierra Points
              </div>
            </div>
          `).join('')}
        </div>

        <button id="btn-close-quest-journal" class="btn-ghibli" style="width: 100%; height: 42px; font-size: 1rem; justify-content: center;">Close Quest Journal</button>
      </div>
    `;

    dialogueLayer.querySelector('#btn-close-quest-journal').addEventListener('click', () => {
      dialogueLayer.style.display = 'none';
      synth.playClick();
    });
  }

  completeQuest(questId) {
    const quest = this.quests.find(q => q.id === questId);
    if (quest && quest.status !== 'completed') {
      quest.status = 'completed';
      this.gameEngine.inventorySystem.gold += quest.rewardGold;
      this.gameEngine.sierraScoreSystem.addPoints(quest.id, quest.rewardPoints, `completing ${quest.title}`);
      synth.playStatUp();
      this.gameEngine.showNotification(`🏆 QUEST COMPLETED! ${quest.title} (+${quest.rewardGold} Gold, +${quest.rewardPoints} Score Points)`);
    }
  }
}
