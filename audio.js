// Procedural Retro-RPG Web Audio Engine (Geffen Chimes & Spell SFX)

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggle() {
    this.enabled = !this.enabled;
    if (this.enabled) {
      this.init();
      this.playClick();
    }
    return this.enabled;
  }

  playTone(freq, type = 'sine', duration = 0.12, gainVal = 0.08, slideTo = null, delay = 0) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (slideTo) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), now + duration);
    }

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(gainVal, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  playClick() {
    this.playTone(680, 'triangle', 0.06, 0.06, 880);
  }

  playMoveClick() {
    this.playTone(520, 'sine', 0.07, 0.045, 760);
  }

  playCastStart() {
    // Classic RO magic chime arpeggio
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((f, idx) => {
      this.playTone(f, 'sine', 0.14, 0.045, f * 1.02, idx * 0.04);
    });
  }

  playSpellHit(spellType) {
    if (spellType === 'fire') {
      this.playTone(220, 'sawtooth', 0.16, 0.07, 75);
      this.playTone(440, 'triangle', 0.11, 0.05, 130, 0.03);
    } else if (spellType === 'ice') {
      this.playTone(1100, 'sine', 0.14, 0.06, 620);
      this.playTone(1480, 'triangle', 0.12, 0.05, 880, 0.03);
    } else if (spellType === 'lightning') {
      this.playTone(860, 'sawtooth', 0.1, 0.06, 180);
      this.playTone(1320, 'square', 0.08, 0.04, 300, 0.02);
    } else if (spellType === 'meteor') {
      this.playTone(150, 'sawtooth', 0.32, 0.1, 42);
      this.playTone(310, 'triangle', 0.25, 0.07, 80, 0.05);
    } else if (spellType === 'heal') {
      [587.33, 739.99, 880, 1174.66].forEach((f, i) => {
        this.playTone(f, 'sine', 0.22, 0.06, null, i * 0.055);
      });
    }
  }

  playLevelUp() {
    // Iconic triumphant RPG fanfare
    const chord = [523.25, 659.25, 783.99, 1046.5, 1318.5, 1567.98];
    chord.forEach((f, i) => {
      this.playTone(f, 'triangle', 0.42, 0.07, f * 1.01, i * 0.065);
    });
  }

  playRefineSuccess() {
    [440, 554.37, 659.25, 880].forEach((f, i) => {
      this.playTone(f, 'triangle', 0.25, 0.07, null, i * 0.06);
    });
  }

  playWarp() {
    [330, 440, 660, 880, 1320].forEach((f, i) => {
      this.playTone(f, 'sine', 0.18, 0.05, f * 1.15, i * 0.045);
    });
  }
}

export const sfx = new SoundEngine();
