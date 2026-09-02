import { synth } from '../engine/SoundSynth.js';

export class EventEngine {
  constructor(gameEngine) {
    this.gameEngine = gameEngine;
    
    // Preset Action Templates for Admin Studio
    this.actionTypes = [
      { id: 'give_item', label: '🎒 Give Item to Hero', params: ['itemId', 'quantity'] },
      { id: 'add_gold', label: '💰 Gain Gold Coins', params: ['amount'] },
      { id: 'award_xp', label: '🎉 Practice Stat XP', params: ['statName', 'xpAmount'] },
      { id: 'award_sierra_score', label: '🏆 Award Sierra Score Points', params: ['points', 'reason'] },
      { id: 'play_sfx', label: '🎵 Play Web Audio SFX', params: ['sfxType'] },
      { id: 'teleport_room', label: '🚪 Teleport Hero to Room', params: ['targetRoomId', 'spawnX', 'spawnY'] },
      { id: 'start_battle', label: '⚔️ Launch Tactical Grid Battle', params: ['enemyId'] }
    ];
  }

  executeAction(actionType, params = {}) {
    synth.playClick();

    if (actionType === 'give_item') {
      const item = this.gameEngine.gameRegistry.items.find(i => i.id === params.itemId) || {
        id: params.itemId || 'custom_item',
        name: 'Custom Realm Item',
        count: params.quantity || 1,
        icon: '🎁',
        type: 'consumable',
        desc: 'Granted by visual event script.'
      };
      this.gameEngine.inventorySystem.addItem({ ...item, count: params.quantity || 1 });
      synth.playStatUp();
      this.gameEngine.showNotification(`🎁 EVENT SCRIPT: Received ${item.name} (x${params.quantity || 1})!`);

    } else if (actionType === 'add_gold') {
      const gold = parseInt(params.amount) || 10;
      this.gameEngine.inventorySystem.gold += gold;
      synth.playGoldJingle();
      this.gameEngine.showNotification(`💰 EVENT SCRIPT: Gained +${gold} Gold Coins! (Total: ${this.gameEngine.inventorySystem.gold})`);

    } else if (actionType === 'award_xp') {
      const stat = params.statName || 'strength';
      const xp = parseInt(params.xpAmount) || 20;
      this.gameEngine.statSystem.practiceStat(stat, xp, (s, val) => {
        this.gameEngine.showNotification(`🎉 EVENT SCRIPT: ${stat.toUpperCase()} increased to ${val}!`);
      });
      synth.playStatUp();

    } else if (actionType === 'award_sierra_score') {
      const pts = parseInt(params.points) || 10;
      const reason = params.reason || 'executing custom event script';
      this.gameEngine.sierraScoreSystem.addPoints(`evt_${Date.now()}`, pts, reason);

    } else if (actionType === 'play_sfx') {
      const sfx = params.sfxType || 'gold';
      if (sfx === 'gold') synth.playGoldJingle();
      else if (sfx === 'spell') synth.playSpell();
      else if (sfx === 'swing') synth.playSwing();
      else if (sfx === 'hit') synth.playHit();
      else if (sfx === 'parry') synth.playParry();
      else synth.playStatUp();

    } else if (actionType === 'teleport_room') {
      const roomId = params.targetRoomId || 'town_square';
      const spawnX = parseInt(params.spawnX) || 650;
      const spawnY = parseInt(params.spawnY) || 450;
      this.gameEngine.explorationScene.changeRoom(roomId, spawnX, spawnY);

    } else if (actionType === 'start_battle') {
      const enemy = params.enemyId || 'Goblin Spearman';
      this.gameEngine.startCombatMode(enemy);
    }
  }
}
