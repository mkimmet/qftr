import { synth } from '../engine/SoundSynth.js';

export class GameRegistry {
  constructor(gameEngine) {
    this.gameEngine = gameEngine;

    // Master Items Catalog
    this.items = [
      { id: 'healing_elixir', name: 'Healing Elixir', category: 'potions', icon: '🧪', type: 'consumable', gold: 20, statBonus: { hpRestore: 40 }, desc: 'Restores +40 HP when consumed in battle or exploration.' },
      { id: 'mana_essence', name: 'Mana Essence', category: 'potions', icon: '💧', type: 'consumable', gold: 25, statBonus: { mpRestore: 30 }, desc: 'Restores +30 MP for spellcasting.' },
      { id: 'sunsteel_sword', name: 'Sunsteel Sword', category: 'weapons', icon: '🗡️', type: 'equip', slot: 'weapon', gold: 50, statBonus: { strength: 8, weaponry: 5 }, desc: 'A sharp sun-forged steel longsword.' },
      { id: 'paladin_shield', name: 'Paladin Shield', category: 'armor', icon: '🛡️', type: 'equip', slot: 'shield', gold: 120, statBonus: { parry: 15, strength: 5 }, desc: 'A sacred holy shield granting +15 Parry & +5 Strength.' },
      { id: 'arcane_staff', name: 'Arcane Staff', category: 'weapons', icon: '🪄', type: 'equip', slot: 'weapon', gold: 90, statBonus: { magic: 12, mpRestore: 10 }, desc: 'An oak staff tipped with a glowing mana crystal.' },
      { id: 'thief_dagger', name: 'Thief Shadow Dagger', category: 'weapons', icon: '🗡️', type: 'equip', slot: 'weapon', gold: 40, statBonus: { agility: 8, stealth: 6 }, desc: 'A lightweight stiletto for swift stealth attacks.' },
      { id: 'moonflower_herb', name: 'Moonflower Herb', category: 'scrolls', icon: '🌸', type: 'consumable', gold: 15, statBonus: {}, desc: 'Rare glowing blue herb picked in Mistvale Forest.' }
    ];

    // Master Enemies Catalog
    this.enemies = [
      { id: 'goblin_spearman', name: 'Goblin Spearman', type: 'goblins', portrait: '👺', hp: 45, ap: 5, color: '#387654', attackPower: 8, desc: 'A nimble forest goblin armed with a crude wooden spear.' },
      { id: 'goblin_chieftain', name: 'Goblin Chieftain', type: 'bosses', portrait: '👑', hp: 90, ap: 7, color: '#2d5a3f', attackPower: 16, desc: 'The massive battleaxe-wielding chieftain of the goblin camp.' },
      { id: 'shadow_warlock', name: 'Shadow Warlock', type: 'undead', portrait: '🧙', hp: 65, ap: 6, color: '#802bb0', attackPower: 14, desc: 'A dark sorcerer channeling void energy.' },
      { id: 'knight_captain', name: 'Knight Captain', type: 'bosses', portrait: '⚔️', hp: 80, ap: 6, color: '#a83232', attackPower: 15, desc: 'Veteran Knight Captain testing young heroes in arena duels.' },
      { id: 'arch_lich', name: 'The Shadow Arch-Lich', type: 'bosses', portrait: '💀', hp: 120, ap: 8, color: '#ff2b56', attackPower: 22, desc: 'The supreme dark lord of the void rift!' }
    ];
  }

  // --- ITEM METHODS ---

  searchItems(query = '', category = 'all') {
    return this.items.filter(item => {
      const matchesCategory = category === 'all' || item.category === category;
      const matchesQuery = !query || item.name.toLowerCase().includes(query.toLowerCase()) || item.desc.toLowerCase().includes(query.toLowerCase());
      return matchesCategory && matchesQuery;
    });
  }

  addItem(newItem) {
    this.items.push(newItem);
    synth.playStatUp();
    this.gameEngine.showNotification(`🎒 Added item "${newItem.name}" to Master Registry!`);
  }

  updateItem(id, updatedFields) {
    const item = this.items.find(i => i.id === id);
    if (item) {
      Object.assign(item, updatedFields);
      synth.playClick();
      this.gameEngine.showNotification(`🎒 Updated "${item.name}"!`);
    }
  }

  duplicateItem(id) {
    const item = this.items.find(i => i.id === id);
    if (item) {
      const clone = JSON.parse(JSON.stringify(item));
      clone.id = `item_${Date.now()}`;
      clone.name = `${item.name} (Copy)`;
      this.items.push(clone);
      synth.playStatUp();
      this.gameEngine.showNotification(`👯 Duplicated "${item.name}"!`);
    }
  }

  deleteItem(id) {
    const idx = this.items.findIndex(i => i.id === id);
    if (idx !== -1) {
      const removed = this.items.splice(idx, 1)[0];
      synth.playHit();
      this.gameEngine.showNotification(`🗑️ Deleted item "${removed.name}".`);
    }
  }

  // --- ENEMY METHODS ---

  searchEnemies(query = '', type = 'all') {
    return this.enemies.filter(enemy => {
      const matchesType = type === 'all' || enemy.type === type;
      const matchesQuery = !query || enemy.name.toLowerCase().includes(query.toLowerCase()) || enemy.desc.toLowerCase().includes(query.toLowerCase());
      return matchesType && matchesQuery;
    });
  }

  addEnemy(newEnemy) {
    this.enemies.push(newEnemy);
    synth.playStatUp();
    this.gameEngine.showNotification(`👺 Added enemy "${newEnemy.name}" to Master Registry!`);
  }

  updateEnemy(id, updatedFields) {
    const enemy = this.enemies.find(e => e.id === id);
    if (enemy) {
      Object.assign(enemy, updatedFields);
      synth.playClick();
      this.gameEngine.showNotification(`👺 Updated monster "${enemy.name}"!`);
    }
  }

  duplicateEnemy(id) {
    const enemy = this.enemies.find(e => e.id === id);
    if (enemy) {
      const clone = JSON.parse(JSON.stringify(enemy));
      clone.id = `enemy_${Date.now()}`;
      clone.name = `${enemy.name} (Copy)`;
      this.enemies.push(clone);
      synth.playStatUp();
      this.gameEngine.showNotification(`👯 Duplicated "${enemy.name}"!`);
    }
  }

  deleteEnemy(id) {
    const idx = this.enemies.findIndex(e => e.id === id);
    if (idx !== -1) {
      const removed = this.enemies.splice(idx, 1)[0];
      synth.playHit();
      this.gameEngine.showNotification(`🗑️ Deleted monster "${removed.name}".`);
    }
  }
}
