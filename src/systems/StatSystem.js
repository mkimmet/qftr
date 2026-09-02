import { synth } from '../engine/SoundSynth.js';

export class StatSystem {
  constructor() {
    this.heroName = 'Valen';
    this.heroClass = 'Fighter'; // Fighter, Magic User, Thief
    
    // Core Stats (QfG Style)
    this.stats = {
      strength: 15,
      agility: 15,
      intelligence: 10,
      stealth: 5,
      magic: 0,
      weaponry: 15,
      parry: 10
    };

    // Hidden practice counters toward stat gains
    this.statXP = {
      strength: 0,
      agility: 0,
      intelligence: 0,
      stealth: 0,
      magic: 0,
      weaponry: 0,
      parry: 0
    };

    // Dynamic Pools
    this.hp = { current: 50, max: 50 };
    this.mp = { current: 20, max: 20 };
    this.stamina = { current: 40, max: 40 };

    this.recalculatePools();
  }

  initClass(className) {
    this.heroClass = className;
    if (className === 'Fighter') {
      this.stats = { strength: 25, agility: 15, intelligence: 10, stealth: 5, magic: 0, weaponry: 25, parry: 20 };
    } else if (className === 'Magic User') {
      this.stats = { strength: 10, agility: 12, intelligence: 25, stealth: 10, magic: 25, weaponry: 10, parry: 5 };
    } else if (className === 'Thief') {
      this.stats = { strength: 12, agility: 25, intelligence: 15, stealth: 25, magic: 5, weaponry: 20, parry: 10 };
    }
    this.recalculatePools();
    this.fullRestore();
  }

  recalculatePools() {
    // QfG HP formula: (Strength + Agility) * 1.5
    this.hp.max = Math.floor((this.stats.strength + this.stats.agility) * 1.5);
    
    // MP formula: Intelligence * 2 + Magic * 1.5
    this.mp.max = Math.floor(this.stats.intelligence * 2 + this.stats.magic * 1.5);

    // Stamina formula: (Agility + Strength) * 1.2
    this.stamina.max = Math.floor((this.stats.agility + this.stats.strength) * 1.2);

    this.hp.current = Math.min(this.hp.current, this.hp.max);
    this.mp.current = Math.min(this.mp.current, this.mp.max);
    this.stamina.current = Math.min(this.stamina.current, this.stamina.max);
  }

  fullRestore() {
    this.hp.current = this.hp.max;
    this.mp.current = this.mp.max;
    this.stamina.current = this.stamina.max;
  }

  practiceStat(statName, amount = 10, onGain = null) {
    if (!(statName in this.stats)) return;

    this.statXP[statName] += amount;
    const threshold = this.stats[statName] * 12;

    if (this.statXP[statName] >= threshold) {
      this.statXP[statName] -= threshold;
      this.stats[statName] += 1;
      this.recalculatePools();
      synth.playStatUp();

      if (onGain) {
        onGain(statName, this.stats[statName]);
      }
    }
  }

  takeDamage(amount) {
    this.hp.current = Math.max(0, this.hp.current - amount);
    return this.hp.current <= 0;
  }

  heal(amount) {
    this.hp.current = Math.min(this.hp.max, this.hp.current + amount);
  }

  useMana(amount) {
    if (this.mp.current >= amount) {
      this.mp.current -= amount;
      return true;
    }
    return false;
  }

  useStamina(amount) {
    if (this.stamina.current >= amount) {
      this.stamina.current -= amount;
      return true;
    }
    return false;
  }
}
