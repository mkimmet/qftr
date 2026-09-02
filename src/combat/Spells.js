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
  }
};
