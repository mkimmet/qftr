import { synth } from '../engine/SoundSynth.js';

export class SierraScoreSystem {
  constructor(gameEngine) {
    this.gameEngine = gameEngine;
    this.score = 0;
    this.maxScore = 500;
    this.completedAchvs = new Set();
    this.scoreLog = [];
  }

  addPoints(id, points, reason, category = 'quest') {
    if (this.completedAchvs.has(id)) return;
    this.completedAchvs.add(id);

    this.score += points;
    const timeStr = this.gameEngine && this.gameEngine.timeSystem ? this.gameEngine.timeSystem.getTimeString() : 'Day 1';

    this.scoreLog.unshift({
      id,
      points,
      category,
      reason,
      timestamp: timeStr
    });

    synth.playStatUp();
    this.updateScoreBadge();
    this.gameEngine.showNotification(`🏆 You earned ${points} Sierra points for ${reason}! [Score: ${this.score} / ${this.maxScore}]`);
  }

  getRankTitle() {
    if (this.score >= 300) return 'Grand Master Hero of the Realm';
    if (this.score >= 200) return 'Champion of Spielburg';
    if (this.score >= 100) return 'Valiant Hero';
    if (this.score >= 50) return 'Promising Adventurer';
    return 'Novice Wanderer';
  }

  updateScoreBadge() {
    const scoreBadge = document.getElementById('sierra-score-display');
    if (scoreBadge) {
      scoreBadge.innerText = `Score: ${this.score} / ${this.maxScore}`;
    }
  }
}
