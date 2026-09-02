import { synth } from '../engine/SoundSynth.js';

export class CharacterCreationScene {
  constructor(containerEl, onComplete) {
    this.containerEl = containerEl;
    this.onComplete = onComplete;
    this.selectedClass = 'Fighter';
    this.bonusPoints = 15;

    this.stats = {
      strength: 15,
      agility: 15,
      intelligence: 10,
      stealth: 5,
      magic: 0,
      weaponry: 15,
      parry: 10
    };
  }

  render() {
    this.containerEl.style.display = 'flex';
    this.containerEl.innerHTML = `
      <div class="char-title">QUEST FOR THE REALM</div>
      <div class="char-subtitle">Choose your Hero Class & Allocate Starting Stats</div>

      <div class="class-grid">
        <div class="class-card active" data-class="Fighter">
          <div class="class-icon" style="background:#4ea373; display:flex; align-items:center; justify-content:center; font-size:2.2rem;">⚔️</div>
          <div class="class-name">Fighter</div>
          <div class="class-desc">Master of melee combat, shields, and high strength. High HP and heavy armor proficiency.</div>
        </div>

        <div class="class-card" data-class="Magic User">
          <div class="class-icon" style="background:#3a86ff; display:flex; align-items:center; justify-content:center; font-size:2.2rem;">🔮</div>
          <div class="class-name">Magic User</div>
          <div class="class-desc">Wielder of elemental arcana. Starts with Flame Dart & Zap spells and high Mana pool.</div>
        </div>

        <div class="class-card" data-class="Thief">
          <div class="class-icon" style="background:#f4a261; display:flex; align-items:center; justify-content:center; font-size:2.2rem;">🗡️</div>
          <div class="class-name">Thief</div>
          <div class="class-desc">Shadow dancer with lockpicking, stealth, high agility, and rapid turn AP in grid combat.</div>
        </div>
      </div>

      <div class="stats-allocator">
        <div style="grid-column: span 2; display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <span style="font-family: var(--font-heading); color: var(--text-gold); font-size: 1.1rem;">Stat Allocation Pool</span>
          <span style="font-weight: 700; color: var(--ghibli-sun-gold); font-size: 1.2rem;">Available Points: <span id="bonus-pts-val">${this.bonusPoints}</span></span>
        </div>
        ${Object.keys(this.stats).map(statKey => `
          <div class="stat-row">
            <span class="stat-name">${statKey.toUpperCase()}</span>
            <div class="stat-controls">
              <button class="btn-stat btn-minus" data-stat="${statKey}">-</button>
              <span class="stat-val" id="val-${statKey}">${this.stats[statKey]}</span>
              <button class="btn-stat btn-plus" data-stat="${statKey}">+</button>
            </div>
          </div>
        `).join('')}
      </div>

      <div style="display: flex; gap: 16px;">
        <button id="btn-start-adventure" class="btn-ghibli btn-emerald" style="font-size: 1.2rem; padding: 12px 36px;">
          Begin Adventure 🌟
        </button>
      </div>
    `;

    this.attachEvents();
  }

  attachEvents() {
    // Class selection cards
    const classCards = this.containerEl.querySelectorAll('.class-card');
    classCards.forEach(card => {
      card.addEventListener('click', () => {
        synth.playClick();
        classCards.forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        this.selectedClass = card.getAttribute('data-class');
        this.resetStatsForClass(this.selectedClass);
      });
    });

    // Stat allocation buttons
    this.containerEl.querySelectorAll('.btn-plus').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const statKey = e.target.getAttribute('data-stat');
        if (this.bonusPoints > 0) {
          synth.playClick();
          this.stats[statKey] += 1;
          this.bonusPoints -= 1;
          this.updateDOM();
        }
      });
    });

    this.containerEl.querySelectorAll('.btn-minus').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const statKey = e.target.getAttribute('data-stat');
        if (this.stats[statKey] > 5) {
          synth.playClick();
          this.stats[statKey] -= 1;
          this.bonusPoints += 1;
          this.updateDOM();
        }
      });
    });

    // Start adventure button
    this.containerEl.querySelector('#btn-start-adventure').addEventListener('click', () => {
      synth.playStatUp();
      this.containerEl.style.display = 'none';
      if (this.onComplete) {
        this.onComplete(this.selectedClass, this.stats);
      }
    });
  }

  resetStatsForClass(className) {
    this.bonusPoints = 15;
    if (className === 'Fighter') {
      this.stats = { strength: 20, agility: 15, intelligence: 10, stealth: 5, magic: 0, weaponry: 20, parry: 15 };
    } else if (className === 'Magic User') {
      this.stats = { strength: 10, agility: 12, intelligence: 20, stealth: 10, magic: 20, weaponry: 10, parry: 5 };
    } else if (className === 'Thief') {
      this.stats = { strength: 12, agility: 20, intelligence: 15, stealth: 20, magic: 5, weaponry: 15, parry: 10 };
    }
    this.updateDOM();
  }

  updateDOM() {
    this.containerEl.querySelector('#bonus-pts-val').innerText = this.bonusPoints;
    Object.keys(this.stats).forEach(k => {
      const el = this.containerEl.querySelector(`#val-${k}`);
      if (el) el.innerText = this.stats[k];
    });
  }
}
