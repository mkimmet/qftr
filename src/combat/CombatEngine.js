import { GridMap } from './GridMap.js';
import { CombatAI } from './CombatAI.js';
import { SPELL_CATALOG } from './Spells.js';
import { synth } from '../engine/SoundSynth.js';

export class CombatEngine {
  constructor(statSystem, inventorySystem, gameEngine = null) {
    this.statSystem = statSystem;
    this.inventorySystem = inventorySystem;
    this.gameEngine = gameEngine;
    this.gridMap = new GridMap(10, 8);
    
    this.entities = [];
    this.playerEntity = null;
    this.currentTurnIdx = 0;
    this.turnQueue = [];
    this.isCombatActive = false;
    this.selectedAction = null;
    this.selectedSpell = null;

    this.logs = [];
    this.onLogCallback = null;
    this.onTurnChangeCallback = null;
    this.onBattleEndCallback = null;
  }

  startBattle(enemyType = 'Goblin Spearman') {
    this.gridMap.resetGrid();
    this.logs = [];
    this.isCombatActive = true;

    const heroMaxAP = Math.min(10, Math.max(4, Math.floor(this.statSystem.stats.agility / 4)));

    this.playerEntity = {
      id: 'player',
      name: this.statSystem.heroName,
      isPlayer: true,
      col: 1,
      row: 4,
      maxAp: heroMaxAP,
      ap: heroMaxAP,
      hp: this.statSystem.hp.current,
      maxHp: this.statSystem.hp.max,
      portrait: '🧝',
      color: '#4ea373'
    };

    let enemyHp = 40;
    let enemyAp = 5;
    let enemyPortrait = '👺';
    if (enemyType === 'Forest Brigand') { enemyHp = 60; enemyAp = 6; enemyPortrait = '🥷'; }
    if (enemyType === 'Shadow Warlock') { enemyHp = 50; enemyAp = 6; enemyPortrait = '🧙'; }
    if (enemyType === 'Goblin Chieftain') { enemyHp = 90; enemyAp = 7; enemyPortrait = '👑'; }
    if (enemyType === 'Knight Captain') { enemyHp = 80; enemyAp = 7; enemyPortrait = '⚔️'; }
    if (enemyType === 'Shadow Arch-Lich') { enemyHp = 120; enemyAp = 8; enemyPortrait = '💀'; }

    const enemyEntity = {
      id: 'enemy_1',
      name: enemyType,
      isPlayer: false,
      col: 8,
      row: 3,
      maxAp: enemyAp,
      ap: enemyAp,
      hp: enemyHp,
      maxHp: enemyHp,
      portrait: enemyPortrait,
      color: '#d64545',
      spells: (enemyType === 'Shadow Warlock' || enemyType === 'Shadow Arch-Lich') ? [SPELL_CATALOG.flame_dart, SPELL_CATALOG.zap] : []
    };

    this.entities = [this.playerEntity, enemyEntity];

    this.gridMap.getTile(1, 4).occupiedBy = this.playerEntity;
    this.gridMap.getTile(8, 3).occupiedBy = enemyEntity;

    this.turnQueue = [...this.entities];
    this.currentTurnIdx = 0;

    this.addLog(`⚔️ Tactical Grid Combat initiated against ${enemyType}!`, 'system');
    this.startTurn();
  }

  getCurrentEntity() {
    return this.turnQueue[this.currentTurnIdx];
  }

  startTurn() {
    const current = this.getCurrentEntity();
    current.ap = current.maxAp;

    this.addLog(`Round Turn: ${current.name} (${current.ap} Action Points)`, current.isPlayer ? 'player' : 'enemy');

    if (this.onTurnChangeCallback) {
      this.onTurnChangeCallback(current);
    }

    if (!current.isPlayer) {
      setTimeout(() => this.processEnemyTurn(), 800);
    }
  }

  endTurn() {
    if (!this.isCombatActive) return;

    this.selectedAction = null;
    this.selectedSpell = null;

    this.currentTurnIdx = (this.currentTurnIdx + 1) % this.turnQueue.length;
    this.startTurn();
  }

  handleTileClick(col, row) {
    if (!this.isCombatActive || !this.getCurrentEntity().isPlayer) return;

    const player = this.playerEntity;
    const targetTile = this.gridMap.getTile(col, row);
    if (!targetTile) return;

    const occupant = targetTile.occupiedBy;

    if (!occupant) {
      const path = this.gridMap.findPath(player.col, player.row, col, row, player.ap);
      if (path.length > 0 && path.length <= player.ap) {
        this.gridMap.getTile(player.col, player.row).occupiedBy = null;
        player.col = col;
        player.row = row;
        targetTile.occupiedBy = player;

        player.ap -= path.length;
        synth.playFootstep();
        this.addLog(`${player.name} moved to tile (${col}, ${row}) [-${path.length} AP].`, 'player');
        this.statSystem.practiceStat('agility', 5);
      }
    } else if (occupant && !occupant.isPlayer) {
      const dist = this.gridMap.getDistance(player.col, player.row, col, row);

      if (this.selectedSpell) {
        this.executeSpellCast(player, occupant, this.selectedSpell);
      } else if (dist === 1) {
        this.executeMeleeAttack(player, occupant);
      } else {
        this.addLog(`Target is out of melee range! Move closer first.`, 'system');
      }
    }
  }

  executeMeleeAttack(attacker, defender) {
    const apCost = 3;
    if (attacker.ap < apCost) {
      this.addLog(`Not enough AP to attack! (Requires ${apCost} AP)`, 'system');
      return;
    }

    attacker.ap -= apCost;
    synth.playSwing();

    const hitChance = Math.min(95, Math.max(30, 70 + (this.statSystem.stats.weaponry - 10)));
    const roll = Math.random() * 100;

    if (roll <= hitChance) {
      const baseDmg = Math.floor(8 + (this.statSystem.stats.strength * 0.5) + (Math.random() * 6));
      defender.hp -= baseDmg;
      synth.playHit();
      this.addLog(`⚔️ ${attacker.name} strikes ${defender.name} for ${baseDmg} damage!`, 'damage');

      this.statSystem.practiceStat('weaponry', 12);
      this.statSystem.practiceStat('strength', 8);

      if (defender.hp <= 0) {
        this.handleEnemyDefeat(defender);
      }
    } else {
      this.addLog(`🛡️ ${defender.name} parried the attack!`, 'system');
      this.statSystem.practiceStat('weaponry', 4);
    }
  }

  executeSpellCast(caster, target, spell) {
    if (caster.ap < spell.apCost) {
      this.addLog(`Not enough AP to cast ${spell.name}!`, 'system');
      return;
    }
    if (!this.statSystem.useMana(spell.mpCost)) {
      this.addLog(`Not enough Mana Points to cast ${spell.name}!`, 'system');
      return;
    }

    caster.ap -= spell.apCost;
    synth.playSpell();

    if (this.gameEngine && this.gameEngine.renderer) {
      const originX = 140 + caster.col * 100 + 50;
      const originY = 90 + caster.row * 65 + 30;
      const targetX = 140 + target.col * 100 + 50;
      const targetY = 90 + target.row * 65 + 30;
      this.gameEngine.renderer.addSpellVFX(spell.vfx || 'fireball', originX, originY, targetX, targetY);
    }

    if (spell.healAmount) {
      const healVal = Math.floor(spell.healAmount[0] + Math.random() * (spell.healAmount[1] - spell.healAmount[0]));
      this.statSystem.heal(healVal);
      caster.hp = this.statSystem.hp.current;
      this.addLog(`✨ ${caster.name} cast ${spell.name} restoring ${healVal} HP!`, 'heal');
    } else if (spell.stun) {
      target.ap = Math.max(0, target.ap - 3);
      this.addLog(`✨ ${caster.name} cast ${spell.name} stunning ${target.name} (-3 AP)!`, 'spell');
    } else {
      const dmgVal = Math.floor(spell.damage[0] + Math.random() * (spell.damage[1] - spell.damage[0]) + (this.statSystem.stats.magic * 0.4));
      target.hp -= dmgVal;
      this.addLog(`🔥 ${caster.name} cast ${spell.name} hitting ${target.name} for ${dmgVal} magic damage!`, 'spell');

      if (target.hp <= 0) {
        this.handleEnemyDefeat(target);
      }
    }

    this.statSystem.practiceStat('magic', 15);
    this.selectedSpell = null;
  }

  processEnemyTurn() {
    if (!this.isCombatActive) return;

    const enemy = this.getCurrentEntity();
    const actions = CombatAI.evaluateTurn(enemy, this.playerEntity, this.gridMap);

    let actionDelay = 0;

    actions.forEach(action => {
      setTimeout(() => {
        if (!this.isCombatActive) return;

        if (action.type === 'move') {
          this.gridMap.getTile(enemy.col, enemy.row).occupiedBy = null;
          enemy.col = action.targetTile.col;
          enemy.row = action.targetTile.row;
          this.gridMap.getTile(enemy.col, enemy.row).occupiedBy = enemy;
          synth.playFootstep();
          this.addLog(`${enemy.name} moves closer to you.`, 'enemy');
        } else if (action.type === 'attack') {
          synth.playSwing();
          const baseDmg = Math.floor(6 + Math.random() * 8);
          const isPlayerDead = this.statSystem.takeDamage(baseDmg);
          this.playerEntity.hp = this.statSystem.hp.current;
          synth.playHit();
          this.addLog(`💥 ${enemy.name} attacks you for ${baseDmg} damage!`, 'damage');

          this.statSystem.practiceStat('parry', 8);
          this.statSystem.practiceStat('agility', 6);

          if (isPlayerDead) {
            this.handlePlayerDefeat();
          }
        }
      }, actionDelay);
      actionDelay += 600;
    });

    setTimeout(() => {
      if (this.isCombatActive) {
        this.endTurn();
      }
    }, actionDelay + 400);
  }

  handleEnemyDefeat(enemy) {
    this.addLog(`🎉 ${enemy.name} has been vanquished! Victory!`, 'heal');
    this.gridMap.getTile(enemy.col, enemy.row).occupiedBy = null;
    this.entities = this.entities.filter(e => e.id !== enemy.id);
    this.isCombatActive = false;

    const rewardGold = Math.floor(50 + Math.random() * 60);
    this.inventorySystem.gold += rewardGold;
    this.addLog(`💰 Found ${rewardGold} Gold Coins on the defeated enemy.`, 'heal');

    if (enemy.name === 'Shadow Arch-Lich') {
      if (this.gameEngine) {
        this.gameEngine.showVictoryEpilogue();
      }
    }

    if (this.onBattleEndCallback) {
      this.onBattleEndCallback(true);
    }
  }

  handlePlayerDefeat() {
    this.addLog(`☠️ You have been defeated in battle...`, 'damage');
    this.isCombatActive = false;
    if (this.onBattleEndCallback) {
      this.onBattleEndCallback(false);
    }
  }

  addLog(msg, type = 'system') {
    this.logs.push({ text: msg, type });
    if (this.onLogCallback) {
      this.onLogCallback(msg, type);
    }
  }
}
