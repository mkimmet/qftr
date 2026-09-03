class SoundSynth {
  constructor() {
    this.ctx = null;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
  }

  playClick() {
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, this.ctx.currentTime + 0.04);
    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.04);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.04);
  }

  playFootstep() {
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(120, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.05);
    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.05);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.05);
  }

  playSpell() {
    this.playZap();
  }

  playVerbClick() {
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1200, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, this.ctx.currentTime + 0.06);
    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.06);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.06);
  }

  playZap() {
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1800, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(200, this.ctx.currentTime + 0.25);
    gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.25);
  }

  playFlame() {
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(300, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.35);
    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.35);
  }

  playHeal() {
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(880, this.ctx.currentTime + 0.4);
    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.4);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.4);
  }

  playGoldJingle() {
    this.init();
    if (!this.ctx) return;
    const notes = [987.77, 1318.51, 1567.98]; // B5, E6, G6
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.08);
      gain.gain.setValueAtTime(0.18, this.ctx.currentTime + idx * 0.08);
      gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + idx * 0.08 + 0.15);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(this.ctx.currentTime + idx * 0.08);
      osc.stop(this.ctx.currentTime + idx * 0.08 + 0.15);
    });
  }

  playStatUp() {
    this.init();
    if (!this.ctx) return;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.07);
      gain.gain.setValueAtTime(0.2, this.ctx.currentTime + idx * 0.07);
      gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + idx * 0.07 + 0.14);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(this.ctx.currentTime + idx * 0.07);
      osc.stop(this.ctx.currentTime + idx * 0.07 + 0.14);
    });
  }

  playHit() {
    this.playThudHit();
  }

  playThudHit() {
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.16);
    gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.16);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.16);
  }

  playSwooshMiss() {
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(700, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(120, this.ctx.currentTime + 0.14);
    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.14);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.14);
  }

  // 🎵 Procedural 16-Bit Sierra/Ghibli Retro Combat Music Engine!
  startCombatMusic() {
    this.init();
    if (!this.ctx || this.isMusicPlaying || this.isMuted) return;

    this.isMusicPlaying = true;
    this.musicStep = 0;
    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    this.musicGain.connect(this.ctx.destination);

    const stepDuration = 0.1136; // 132 BPM 16th note steps

    // A Minor / D Minor Fantasy Battle Scale Bassline
    const bassline = [
      110.00, 110.00, 130.81, 146.83, 164.81, 174.61, 164.81, 98.00,
      110.00, 110.00, 130.81, 146.83, 164.81, 196.00, 174.61, 164.81
    ];

    // Chiptune Arpeggio Lead Motif
    const arpeggio = [
      440.00, 523.25, 659.25, 880.00, 783.99, 659.25, 523.25, 493.88,
      523.25, 659.25, 783.99, 1046.50, 880.00, 783.99, 659.25, 523.25
    ];

    this.musicIntervalId = setInterval(() => {
      if (!this.isMusicPlaying || !this.ctx) return;

      const now = this.ctx.currentTime;
      const step = this.musicStep % 16;

      // 1. Driving Bassline Pulse
      if (step % 2 === 0) {
        const bassOsc = this.ctx.createOscillator();
        const bassGain = this.ctx.createGain();
        bassOsc.type = 'sawtooth';
        bassOsc.frequency.setValueAtTime(bassline[step], now);
        bassGain.gain.setValueAtTime(0.06, now);
        bassGain.gain.exponentialRampToValueAtTime(0.001, now + stepDuration * 1.8);
        bassOsc.connect(bassGain);
        bassOsc.connect(this.musicGain);
        bassOsc.start(now);
        bassOsc.stop(now + stepDuration * 1.8);
      }

      // 2. Chiptune Arpeggio Lead
      const arpOsc = this.ctx.createOscillator();
      const arpGain = this.ctx.createGain();
      arpOsc.type = 'square';
      arpOsc.frequency.setValueAtTime(arpeggio[step], now);
      arpGain.gain.setValueAtTime(0.035, now);
      arpGain.gain.exponentialRampToValueAtTime(0.001, now + stepDuration * 0.9);
      arpOsc.connect(arpGain);
      arpGain.connect(this.musicGain);
      arpOsc.start(now);
      arpOsc.stop(now + stepDuration * 0.9);

      // 3. Tactical Drum Thump
      if (step % 4 === 0) {
        const drumOsc = this.ctx.createOscillator();
        const drumGain = this.ctx.createGain();
        drumOsc.type = 'triangle';
        drumOsc.frequency.setValueAtTime(140, now);
        drumOsc.frequency.exponentialRampToValueAtTime(35, now + 0.08);
        drumGain.gain.setValueAtTime(0.12, now);
        drumGain.gain.linearRampToValueAtTime(0.001, now + 0.08);
        drumOsc.connect(drumGain);
        drumGain.connect(this.musicGain);
        drumOsc.start(now);
        drumOsc.stop(now + 0.08);
      }

      this.musicStep++;
    }, 113.6);
  }

  stopCombatMusic() {
    if (!this.isMusicPlaying) return;
    this.isMusicPlaying = false;
    if (this.musicIntervalId) {
      clearInterval(this.musicIntervalId);
      this.musicIntervalId = null;
    }
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setValueAtTime(this.musicGain.gain.value, this.ctx.currentTime);
      this.musicGain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);
      setTimeout(() => {
        if (this.musicGain) {
          this.musicGain.disconnect();
          this.musicGain = null;
        }
      }, 500);
    }
  }

  toggleMusicMute() {
    this.isMuted = !this.isMuted;
    if (this.isMuted && this.isMusicPlaying) {
      this.stopCombatMusic();
    }
    return this.isMuted;
  }

  // 🎺 Triumphant 16-Bit Sierra/Ghibli Victory Trumpet Fanfare Stinger!
  playVictoryFanfare() {
    this.init();
    if (!this.ctx || this.isMuted) return;

    const now = this.ctx.currentTime;
    
    // Royal Victory Notes (Arpeggio leading to Triumphant Chord)
    const sequence = [
      { freq: 523.25, time: 0.00, duration: 0.12 }, // C5
      { freq: 659.25, time: 0.12, duration: 0.12 }, // E5
      { freq: 783.99, time: 0.24, duration: 0.12 }, // G5
      { freq: 1046.50, time: 0.36, duration: 0.18 }, // C6
      { freq: 1318.51, time: 0.54, duration: 0.55 }, // E6 (Sustained High Victory Note)
      { freq: 1567.98, time: 0.54, duration: 0.55 }, // G6 (Harmonic Harmony)
      { freq: 1046.50, time: 0.54, duration: 0.55 }  // C6 (Root Harmony)
    ];

    sequence.forEach(note => {
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'sawtooth';
      osc2.type = 'square';
      osc1.frequency.setValueAtTime(note.freq, now + note.time);
      osc2.frequency.setValueAtTime(note.freq * 1.002, now + note.time);

      const noteGain = 0.14;
      gain.gain.setValueAtTime(0.01, now + note.time);
      gain.gain.linearRampToValueAtTime(noteGain, now + note.time + 0.02);
      gain.gain.setValueAtTime(noteGain * 0.8, now + note.time + note.duration * 0.7);
      gain.gain.linearRampToValueAtTime(0.001, now + note.time + note.duration);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start(now + note.time);
      osc2.start(now + note.time);
      osc1.stop(now + note.time + note.duration);
      osc2.stop(now + note.time + note.duration);
    });
  }
}

export const synth = new SoundSynth();
