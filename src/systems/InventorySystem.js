export class InventorySystem {
  constructor() {
    this.gold = 50;
    this.equipment = {
      shirt: { id: 'linen_shirt', name: 'Linen Undershirt', icon: '👕', type: 'equip', slot: 'shirt' },
      pants: { id: 'leather_pants', name: 'Leather Trousers', icon: '👖', type: 'equip', slot: 'pants' },
      shoes: { id: 'riding_boots', name: 'Leather Boots', icon: '🥾', type: 'equip', slot: 'shoes' },
      helmet: null,
      headband: null,
      cowl: null,
      cape: null,
      baldric: null,
      belt: { id: 'lion_belt', name: 'Gilded Lion Belt', icon: '🥋', type: 'equip', slot: 'belt' },
      amulet: null,
      weapon: { id: 'iron_sword', name: 'Iron Broadsword', icon: '🗡️', type: 'equip', slot: 'weapon' },
      shield: null
    };

    this.items = [
      { id: 'ration', name: 'Travel Rations', count: 5, icon: '🍞', type: 'consumable', desc: 'Restores 15 Stamina when hungry.' },
      { id: 'hp_potion', name: 'Healing Elixir', count: 3, icon: '🧪', type: 'consumable', desc: 'Restores 30 Health Points.' },
      { id: 'mp_potion', name: 'Mana Essence', count: 2, icon: '💧', type: 'consumable', desc: 'Restores 25 Mana Points.' },
      { id: 'lockpick', name: 'Thief Lockpicks', count: 1, icon: '🗝️', type: 'tool', desc: 'Essential tool for picking locks.' },
      
      // Headband / Circlet Slot
      { id: 'gold_headband', name: 'Gold Champion Circlet', count: 1, icon: '👑', type: 'equip', slot: 'headband', statBonus: { magic: 5, parry: 3 }, desc: 'Gold filigree champion circlet (+5 Magic, +3 Parry).' },
      
      // Cape Slot
      { id: 'scarlet_cape', name: 'Scarlet Flowing Cape', count: 1, icon: '🦹', type: 'equip', slot: 'cape', color: '#8b2626', statBonus: { parry: 4 }, desc: 'Crimson silk flowing cape (+4 Parry).' },
      { id: 'shadow_cape', name: 'Shadow Violet Cape', count: 1, icon: '🦹', type: 'equip', slot: 'cape', color: '#1c1524', statBonus: { stealth: 6 }, desc: 'Dark velvet shadow cape (+6 Stealth).' },
      { id: 'gold_cape', name: 'Champion Sun Cape', count: 1, icon: '🦹', type: 'equip', slot: 'cape', color: '#f4be42', statBonus: { strength: 4, magic: 4 }, desc: 'Radiant golden champion cape (+4 Str, +4 Mag).' },
      
      // Shirt Slot
      { id: 'linen_shirt', name: 'Linen Undershirt', count: 1, icon: '👕', type: 'equip', slot: 'shirt', desc: 'Comfortable woven linen shirt.' },
      { id: 'iron_breastplate', name: 'Steel Breastplate', count: 1, icon: '🛡️', type: 'equip', slot: 'shirt', armorDef: 8, statBonus: { strength: 4 }, desc: 'Forged steel chestplate armor (+8 Defense, +4 Strength).' },

      // Pants Slot
      { id: 'leather_pants', name: 'Leather Trousers', count: 1, icon: '👖', type: 'equip', slot: 'pants', armorDef: 2, desc: 'Flexible leather riding trousers (+2 Defense).' },
      { id: 'silk_robe_skirt', name: 'Arcane Robe Skirt', count: 1, icon: '👘', type: 'equip', slot: 'pants', statBonus: { magic: 6 }, desc: 'Woven sapphire silk robe skirt (+6 Magic).' },

      // Shoes Slot
      { id: 'riding_boots', name: 'Leather Boots', count: 1, icon: '🥾', type: 'equip', slot: 'shoes', armorDef: 1, desc: 'Durable leather traveling boots (+1 Defense).' },
      { id: 'steel_sabatons', name: 'Armored Sabatons', count: 1, icon: '🥾', type: 'equip', slot: 'shoes', armorDef: 4, desc: 'Heavy steel armored sabatons (+4 Defense).' },

      // Helmet Slot
      { id: 'iron_helm', name: 'Iron Coif Helm', count: 1, icon: '🪖', type: 'equip', slot: 'helmet', armorDef: 3, statBonus: { parry: 4 }, desc: 'Forged iron coif helmet (+3 Armor Def, +4 Parry).' },
      { id: 'wizard_hat', name: 'Wizard Conical Hat', count: 1, icon: '🧙', type: 'equip', slot: 'helmet', statBonus: { magic: 8 }, desc: 'High wizard conical hat (+8 Magic).' },

      // Cowl Slot
      { id: 'thief_cowl', name: 'Shadow Thief Cowl', count: 1, icon: '🥷', type: 'equip', slot: 'cowl', statBonus: { stealth: 8 }, desc: 'Dark hood cowl for silent sneaking (+8 Stealth).' },
      
      // Belt Slot
      { id: 'lion_belt', name: 'Gilded Lion Belt', count: 1, icon: '🥋', type: 'equip', slot: 'belt', armorDef: 1, statBonus: { strength: 3 }, desc: 'Leather belt with a carved lion buckle (+3 Strength).' },

      // Amulet Slot
      { id: 'ruby_amulet', name: 'Ruby Heart Pendant', count: 1, icon: '📿', type: 'equip', slot: 'amulet', statBonus: { maxHp: 20 }, desc: 'Enchanted ruby necklace (+20 Max HP).' },
      { id: 'sapphire_pendant', name: 'Sapphire Mana Pendant', count: 1, icon: '📿', type: 'equip', slot: 'amulet', statBonus: { maxMp: 25 }, desc: 'Glowing blue crystal pendant (+25 Max MP).' },

      // Weapons, Shields & Baldrics
      { id: 'iron_sword', name: 'Iron Broadsword', count: 1, icon: '🗡️', type: 'equip', slot: 'weapon', weaponDamage: 12, statBonus: { strength: 5, weaponry: 5 }, desc: 'A sharp broadsword (+12 Damage, +5 Strength).' },
      { id: 'paladin_shield', name: 'Paladin Gold Shield', count: 1, icon: '🛡️', type: 'equip', slot: 'shield', armorDef: 6, statBonus: { parry: 8 }, desc: 'Gold kite shield (+6 Defense, +8 Parry).' },
      { id: 'scarlet_baldric', name: 'Scarlet Guard Baldric', count: 1, icon: '🎽', type: 'equip', slot: 'baldric', color: '#b82531', statBonus: { strength: 6 }, desc: 'Crimson over-the-shoulder baldric (+6 Strength).' }
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
