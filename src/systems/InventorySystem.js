export class InventorySystem {
  constructor() {
    this.gold = 50;
    this.equipment = {
      weapon: null,
      armor: null,
      shield: null
    };

    this.items = [
      { id: 'ration', name: 'Travel Rations', count: 5, icon: '🍞', type: 'consumable', desc: 'Restores 15 Stamina when hungry.' },
      { id: 'hp_potion', name: 'Healing Elixir', count: 3, icon: '🧪', type: 'consumable', desc: 'Restores 30 Health Points.' },
      { id: 'mp_potion', name: 'Mana Essence', count: 2, icon: '💧', type: 'consumable', desc: 'Restores 25 Mana Points.' },
      { id: 'lockpick', name: 'Thief Lockpicks', count: 1, icon: '🗝️', type: 'tool', desc: 'Essential tool for picking locks.' },
      { id: 'iron_sword', name: 'Iron Broadsword', count: 1, icon: '🗡️', type: 'equip', slot: 'weapon', statBonus: { strength: 5, weaponry: 5 }, desc: 'A sharp broadsword (+5 Strength, +5 Weaponry).' },
      { id: 'arcane_wand', name: 'Arcane Staff', count: 1, icon: '🪄', type: 'equip', slot: 'weapon', statBonus: { magic: 8, intelligence: 5 }, desc: 'Woven with blue runes (+8 Magic, +5 Intelligence).' },
      { id: 'leather_armor', name: 'Leather Cuirass', count: 1, icon: '🛡️', type: 'equip', slot: 'armor', statBonus: { parry: 5 }, desc: 'Sturdy boiled leather armor (+5 Parry).' }
    ];
  }

  hasItem(itemId) {
    const item = this.items.find(i => i.id === itemId);
    return item && item.count > 0;
  }

  removeItem(itemId, quantity = 1) {
    const item = this.items.find(i => i.id === itemId);
    if (!item) return false;
    item.count -= quantity;
    if (item.count <= 0) {
      this.items = this.items.filter(i => i.id !== itemId);
    }
    return true;
  }

  addItem(itemData, quantity = 1) {
    const existing = this.items.find(i => i.id === itemData.id);
    if (existing) {
      existing.count += quantity;
    } else {
      this.items.push({ ...itemData, count: quantity });
    }
  }

  equipItem(itemId, targetStatSystem) {
    const item = this.items.find(i => i.id === itemId);
    if (!item || item.type !== 'equip') return false;

    const slot = item.slot;
    // Unequip existing item in slot if present
    if (this.equipment[slot]) {
      this.unequipItem(slot, targetStatSystem);
    }

    this.equipment[slot] = item;

    // Apply stat bonuses
    if (item.statBonus) {
      Object.entries(item.statBonus).forEach(([stat, val]) => {
        if (stat in targetStatSystem.stats) {
          targetStatSystem.stats[stat] += val;
        }
      });
      targetStatSystem.recalculatePools();
    }
    return true;
  }

  unequipItem(slot, targetStatSystem) {
    const item = this.equipment[slot];
    if (!item) return false;

    if (item.statBonus) {
      Object.entries(item.statBonus).forEach(([stat, val]) => {
        if (stat in targetStatSystem.stats) {
          targetStatSystem.stats[stat] = Math.max(0, targetStatSystem.stats[stat] - val);
        }
      });
      targetStatSystem.recalculatePools();
    }

    this.equipment[slot] = null;
    return true;
  }

  useItem(itemId, targetStatSystem) {
    const itemIndex = this.items.findIndex(i => i.id === itemId);
    if (itemIndex === -1) return false;

    const item = this.items[itemIndex];
    let used = false;

    if (item.id === 'hp_potion') {
      targetStatSystem.heal(30);
      used = true;
    } else if (item.id === 'mp_potion') {
      targetStatSystem.mp.current = Math.min(targetStatSystem.mp.max, targetStatSystem.mp.current + 25);
      used = true;
    } else if (item.id === 'ration') {
      targetStatSystem.stamina.current = Math.min(targetStatSystem.stamina.max, targetStatSystem.stamina.current + 15);
      used = true;
    } else if (item.type === 'equip') {
      this.equipItem(item.id, targetStatSystem);
      return true;
    }

    if (used) {
      item.count -= 1;
      if (item.count <= 0) {
        this.items.splice(itemIndex, 1);
      }
    }
    return used;
  }
}
