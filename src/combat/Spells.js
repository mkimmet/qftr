export const SPELL_CATALOG = {
  flame_dart: {
    id: 'flame_dart',
    name: 'Flame Dart',
    mpCost: 4,
    apCost: 3,
    range: 5,
    aoe: 'single',
    damage: [14, 24],
    icon: '🔥',
    vfx: 'fireball',
    desc: 'Hurls a searing fiery projectile across the battle grid.'
  },
  zap: {
    id: 'zap',
    name: 'Zap',
    mpCost: 6,
    apCost: 4,
    range: 4,
    aoe: 'cross',
    damage: [18, 30],
    icon: '⚡',
    vfx: 'lightning',
    desc: 'Strikes target and adjacent grid tiles with crackling lightning.'
  },
  dazzle: {
    id: 'dazzle',
    name: 'Dazzle Light',
    mpCost: 5,
    apCost: 3,
    range: 4,
    aoe: 'single',
    stun: true,
    icon: '✨',
    vfx: 'dazzle',
    desc: 'Flashes blinding magical light, stunning target and removing 3 AP from their next turn.'
  },
  calm: {
    id: 'calm',
    name: 'Calm Monster',
    mpCost: 5,
    apCost: 3,
    range: 4,
    aoe: 'single',
    debuff: { apReduce: 2, duration: 2 },
    icon: '🌀',
    vfx: 'calm',
    desc: 'Pacifies an enemy, reducing their Action Points for 2 turns.'
  },
  heal: {
    id: 'heal',
    name: 'Heal Spell',
    mpCost: 5,
    apCost: 3,
    range: 0,
    aoe: 'single',
    healAmount: [25, 40],
    icon: '💚',
    vfx: 'heal',
    desc: 'Restores Health Points using magical essence.'
  },
  open: {
    id: 'open',
    name: 'Open Spell',
    mpCost: 4,
    apCost: 3,
    range: 4,
    aoe: 'single',
    utility: 'open',
    icon: '🔓',
    vfx: 'open',
    desc: 'Magically unlocks locked doors, chests, or barriers.'
  },

  // ⚔️ Fighter Abilities
  power_slash: {
    id: 'power_slash',
    name: 'Power Cleave Slash',
    mpCost: 0,
    apCost: 3,
    range: 1,
    aoe: 'single',
    damage: [22, 35],
    icon: '🗡️',
    vfx: 'cleave',
    reqClass: 'Fighter',
    desc: 'Heavy two-handed strike dealing +40% bonus damage and screen shake!'
  },
  shield_bash: {
    id: 'shield_bash',
    name: 'Shield Bash',
    mpCost: 0,
    apCost: 3,
    range: 1,
    aoe: 'single',
    damage: [10, 16],
    stun: true,
    knockback: 1,
    icon: '🛡️',
    vfx: 'bash',
    reqClass: 'Fighter',
    desc: 'Stuns enemy and knocks them back 1 grid tile.'
  },
  parry_stance: {
    id: 'parry_stance',
    name: 'Parry Riposte Stance',
    mpCost: 0,
    apCost: 2,
    range: 0,
    aoe: 'single',
    statBuff: { parry: 40 },
    icon: '🤺',
    vfx: 'parry',
    reqClass: 'Fighter',
    desc: 'Defensive stance granting +40 Parry to counter enemy strikes.'
  },

  // 🗝️ Thief Abilities
  dagger_throw: {
    id: 'dagger_throw',
    name: 'Precision Dagger Throw',
    mpCost: 0,
    apCost: 2,
    range: 4,
    aoe: 'single',
    damage: [12, 18],
    icon: '🎯',
    vfx: 'dagger',
    reqClass: 'Thief',
    desc: 'Hurls a throwing dagger at an enemy up to 4 tiles away.'
  },
  stealth_backstab: {
    id: 'stealth_backstab',
    name: 'Shadow Backstab Strike',
    mpCost: 0,
    apCost: 3,
    range: 1,
    aoe: 'single',
    damage: [24, 38],
    icon: '🗡️',
    vfx: 'backstab',
    reqClass: 'Thief',
    desc: 'Devastating critical strike dealing massive backstab damage.'
  }
};
