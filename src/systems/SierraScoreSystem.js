import { synth } from '../engine/SoundSynth.js';

export class SierraScoreSystem {
  constructor(gameEngine) {
    this.gameEngine = gameEngine;
    this.score = 0;
    this.maxScore = 300;
    this.completedAchvs = new Set();
  }

  addPoints(id, points, reason) {
    if (this.completedAchvs.has(id)) return;
    this.completedAchvs.add(id);

    this.score += points;
    synth.playStatUp();
    this.updateScoreBadge();
    this.gameEngine.showNotification(`🏆 You earned ${points} points for ${reason}! [Score: ${this.score} / ${this.maxScore}]`);
  }

  updateScoreBadge() {
    const scoreBadge = document.getElementById('sierra-score-display');
    if (scoreBadge) {
      scoreBadge.innerText = `Score: ${this.score} / ${this.maxScore}`;
    }
  }
}
