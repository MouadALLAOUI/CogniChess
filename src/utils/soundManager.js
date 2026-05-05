/**
 * Sound manager for chess game audio effects.
 */

class SoundManager {
  constructor() {
    this.sounds = {};
    this.volume = 0.5;
    this.enabled = true;
    this.audioContext = null;
    this.initSounds();
  }

  initSounds() {
    // Create synthesized sounds using Web Audio API for richer effects
    this.sounds = {
      move: this.createMoveSound(),
      capture: this.createCaptureSound(),
      check: this.createCheckSound(),
      gameStart: this.createGameStartSound(),
      gameEnd: this.createGameEndSound(),
      castling: this.createCastlingSound(),
      promotion: this.createPromotionSound()
    };
  }

  createMoveSound() {
    return () => {
      if (!this.enabled || !this.audioContext) return;
      const ctx = this.audioContext;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.frequency.setValueAtTime(200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.1);
      
      gain.gain.setValueAtTime(this.volume * 0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.1);
    };
  }

  createCaptureSound() {
    return () => {
      if (!this.enabled || !this.audioContext) return;
      const ctx = this.audioContext;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.15);
      
      gain.gain.setValueAtTime(this.volume * 0.5, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.15);
    };
  }

  createCheckSound() {
    return () => {
      if (!this.enabled || !this.audioContext) return;
      const ctx = this.audioContext;
      
      // Two oscillators for a more urgent sound
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);
      
      osc1.frequency.setValueAtTime(400, ctx.currentTime);
      osc1.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.1);
      
      osc2.frequency.setValueAtTime(300, ctx.currentTime);
      osc2.frequency.exponentialRampToValueAtTime(450, ctx.currentTime + 0.1);
      
      gain.gain.setValueAtTime(this.volume * 0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      
      osc1.start(ctx.currentTime);
      osc2.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.2);
      osc2.stop(ctx.currentTime + 0.2);
    };
  }

  createGameStartSound() {
    return () => {
      if (!this.enabled || !this.audioContext) return;
      const ctx = this.audioContext;
      
      const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.frequency.value = freq;
        
        const startTime = ctx.currentTime + i * 0.1;
        gain.gain.setValueAtTime(this.volume * 0.3, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);
        
        osc.start(startTime);
        osc.stop(startTime + 0.3);
      });
    };
  }

  createGameEndSound() {
    return () => {
      if (!this.enabled || !this.audioContext) return;
      const ctx = this.audioContext;
      
      const notes = [783.99, 659.25, 523.25]; // G5, E5, C5
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.frequency.value = freq;
        
        const startTime = ctx.currentTime + i * 0.15;
        gain.gain.setValueAtTime(this.volume * 0.4, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.4);
        
        osc.start(startTime);
        osc.stop(startTime + 0.4);
      });
    };
  }

  createCastlingSound() {
    return () => {
      if (!this.enabled || !this.audioContext) return;
      const ctx = this.audioContext;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.frequency.setValueAtTime(180, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(220, ctx.currentTime + 0.08);
      
      gain.gain.setValueAtTime(this.volume * 0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
      
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.12);
    };
  }

  createPromotionSound() {
    return () => {
      if (!this.enabled || !this.audioContext) return;
      const ctx = this.audioContext;
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(880, ctx.currentTime + 0.2);
      
      gain.gain.setValueAtTime(this.volume * 0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    };
  }

  init() {
    if (typeof window !== 'undefined' && window.AudioContext) {
      this.audioContext = new window.AudioContext();
    }
  }

  play(soundName) {
    if (this.sounds[soundName]) {
      if (!this.audioContext) this.init();
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }
      this.sounds[soundName]();
    }
  }

  setVolume(level) {
    this.volume = Math.max(0, Math.min(1, level));
  }

  setEnabled(enabled) {
    this.enabled = enabled;
  }
}

export default new SoundManager();
