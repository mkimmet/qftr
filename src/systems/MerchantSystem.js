import { synth } from '../engine/SoundSynth.js';

export class MerchantSystem {
  constructor(gameEngine) {
    this.gameEngine = gameEngine;
    this.shopInventory = [
      { id: 'healing_elixir', name: 'Healing Elixir', gold: 15, icon: '🧪', type: 'consumable', healHp: 35, desc: 'Restores +35 HP instantly.' },
      { id: 'mana_essence', name: 'Mana Essence', gold: 20, icon: '🔮', type: 'consumable', restoreMp: 25, desc: 'Restores +25 MP instantly.' },
      { id: 'arcane_staff', name: 'Arcane Wizard Staff', gold: 60, icon: '🪄', type: 'equip', slot: 'weapon', statBonus: { magic: 10 }, desc: 'Grants +10 Magic Power & spell damage.' },
      { id: 'moonflower_herb', name: 'Moonflower Herb', gold: 10, icon: '🌸', type: 'consumable', desc: 'Rare glowing alchemy herb.' }
    ];
  }

  showShopModal() {
    synth.playClick();
    const dialogueLayer = document.getElementById('dialogue-layer');
    dialogueLayer.style.display = 'flex';
    this.renderShopUI(dialogueLayer);
  }

  renderShopUI(container) {
    container.innerHTML = `
      <div class="dialogue-modal parchment-card" style="width: 720px;">
        <!-- Shop Header -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid var(--parchment-border); padding-bottom: 8px; margin-bottom: 12px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 2rem;">🔮</span>
            <div>
              <div style="font-family: var(--font-heading); font-size: 1.4rem; font-weight: 800; color: var(--text-dark);">Sorceress Zara's Arcana Shop</div>
              <div style="font-size: 0.8rem; color: #8c5a14;">"Welcome traveller! Brewed with authentic Spielburg ingredients."</div>
            </div>
          </div>
          <span style="font-weight: 800; font-size: 1.1rem; color: #8c5a14; background: rgba(244, 190, 66, 0.25); padding: 4px 14px; border-radius: 20px; border: 1px solid var(--parchment-border);">
            💰 Gold: ${this.gameEngine.inventorySystem.gold}
          </span>
        </div>

        <!-- Items Stock List -->
        <div style="display: flex; flex-direction: column; gap: 10px; max-height: 280px; overflow-y: auto; margin-bottom: 16px;">
          ${this.shopInventory.map(item => `
            <div style="background: rgba(255, 255, 255, 0.6); border: 1px solid var(--parchment-border); padding: 10px 14px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; gap: 12px;">
              <div style="display: flex; align-items: center; gap: 12px; flex: 1;">
                <span style="font-size: 1.8rem;">${item.icon}</span>
                <div>
                  <div style="font-weight: 700; font-size: 1rem; color: #291e14;">${item.name}</div>
                  <div style="font-size: 0.82rem; color: #524030;">${item.desc}</div>
                </div>
              </div>

              <div style="display: flex; gap: 8px; align-items: center;">
                <span style="font-weight: 800; color: #8c5a14; font-size: 0.95rem;">${item.gold} Gold</span>
                <button class="btn-ghibli btn-emerald btn-buy-shop" data-id="${item.id}" style="padding: 6px 12px;">Buy</button>
                <button class="btn-ghibli btn-haggle-shop" data-id="${item.id}" style="padding: 6px 12px; background: #d97724; border-color: #733908; color: #fff;">💰 Haggle</button>
              </div>
            </div>
          `).join('')}
        </div>

        <!-- Close Shop Button -->
        <button id="btn-close-shop" class="btn-ghibli" style="width: 100%; height: 42px; font-size: 1rem; justify-content: center;">Leave Shop</button>
      </div>
    `;

    container.querySelectorAll('.btn-buy-shop').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.getAttribute('data-id');
        const item = this.shopInventory.find(i => i.id === id);
        if (item) {
          if (this.gameEngine.inventorySystem.gold >= item.gold) {
            this.gameEngine.inventorySystem.gold -= item.gold;
            this.gameEngine.inventorySystem.addItem({ ...item, count: 1 });
            synth.playGoldJingle();
            this.gameEngine.updateHUD();
            this.renderShopUI(container);
            this.gameEngine.showNotification(`🛍️ Purchased ${item.name} for ${item.gold} Gold!`);
          } else {
            synth.playHit();
            this.gameEngine.showNotification('⚠️ Not enough Gold coins to buy item!');
          }
        }
      });
    });

    container.querySelectorAll('.btn-haggle-shop').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.getAttribute('data-id');
        const item = this.shopInventory.find(i => i.id === id);
        if (item) {
          this.showHaggleModal(container, item);
        }
      });
    });

    container.querySelector('#btn-close-shop').addEventListener('click', () => {
      container.style.display = 'none';
      synth.playClick();
    });
  }

  showHaggleModal(container, item) {
    const hagglePrice = Math.max(1, Math.floor(item.gold * 0.75));
    const charisma = this.gameEngine.statSystem.stats.agility || 15;

    container.innerHTML = `
      <div class="dialogue-modal parchment-card" style="width: 580px; text-align: center;">
        <div style="font-family: var(--font-heading); font-size: 1.5rem; font-weight: 800; color: #543714; margin-bottom: 8px;">
          💰 Sierra Merchant Bargaining
        </div>
        <div style="font-size: 0.95rem; color: var(--text-dark); margin-bottom: 16px;">
          Zara asks <strong>${item.gold} Gold</strong> for <strong>${item.name}</strong>.<br>
          You offer <strong>${hagglePrice} Gold</strong> (-25% discount offer).
        </div>

        <div style="display: flex; gap: 10px; justify-content: center; margin-bottom: 14px;">
          <button id="btn-submit-haggle" class="btn-ghibli btn-emerald" style="padding: 10px 24px; font-weight: 800;">Make Bargain Offer (${hagglePrice} Gold)</button>
          <button id="btn-cancel-haggle" class="btn-ghibli" style="padding: 10px 18px;">Cancel</button>
        </div>
      </div>
    `;

    container.querySelector('#btn-cancel-haggle').addEventListener('click', () => {
      this.renderShopUI(container);
    });

    container.querySelector('#btn-submit-haggle').addEventListener('click', () => {
      if (this.gameEngine.inventorySystem.gold < hagglePrice) {
        synth.playHit();
        this.gameEngine.showNotification('⚠️ Not enough gold coins even for the haggled price!');
        this.renderShopUI(container);
        return;
      }

      if (Math.random() * 30 < charisma + 10) {
        this.gameEngine.inventorySystem.gold -= hagglePrice;
        this.gameEngine.inventorySystem.addItem({ ...item, count: 1 });
        synth.playGoldJingle();
        this.gameEngine.sierraScoreSystem.addPoints('haggle_success', 10, `successfully haggling price on ${item.name}`);
        this.gameEngine.showNotification(`🎉 HAGGLE SUCCESS! Sorceress Zara accepted your offer of ${hagglePrice} Gold!`);
      } else {
        synth.playHit();
        this.gameEngine.showNotification(`"Hmph! ${item.gold} Gold is my final price!" — Zara refused your offer.`);
      }
      this.renderShopUI(container);
    });
  }
}
