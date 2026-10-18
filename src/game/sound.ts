/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private jetpackOsc: OscillatorNode | null = null;
  private jetpackGain: GainNode | null = null;
  private jetpackNoiseGain: GainNode | null = null;
  private isMuted: boolean = false;
  private bgAudio: HTMLAudioElement | null = null;
  private musicVolume: number = 0.55;
  private hasUnlockedAudio: boolean = false;
  private isPlayPending: boolean = false;
  private watchdogTimer: number | null = null;

  constructor() {
    this.initBackgroundMusic();
    this.registerUserInteractionUnlock();
    this.setupVisibilityWatchdog();
  }

  private initBackgroundMusic() {
    if (typeof window === 'undefined') return;
    try {
      this.bgAudio = new Audio('/theme.mp3');
      this.bgAudio.loop = true;
      this.bgAudio.volume = this.musicVolume;
      this.bgAudio.preload = 'auto';

      // Bulletproof loop listener: in case native loop fails on EOF or stalls
      this.bgAudio.addEventListener('ended', () => {
        if (!this.isMuted && this.bgAudio) {
          this.bgAudio.currentTime = 0;
          this.playBackgroundMusicSafe();
        }
      });

      // Error recovery: reload and resume if network/decode error occurs
      this.bgAudio.addEventListener('error', () => {
        if (!this.isMuted && this.bgAudio) {
          this.bgAudio.load();
          this.playBackgroundMusicSafe();
        }
      });

      // Auto-resume if browser paused audio unexpectedly (e.g. system buffer underrun)
      this.bgAudio.addEventListener('pause', () => {
        if (!this.isMuted && this.hasUnlockedAudio) {
          setTimeout(() => {
            if (!this.isMuted && this.bgAudio && this.bgAudio.paused) {
              this.playBackgroundMusicSafe();
            }
          }, 150);
        }
      });

      // Immediate play attempt
      this.playBackgroundMusicSafe();
    } catch {
      // Audio autoplay policy fallback
    }
  }

  private setupVisibilityWatchdog() {
    if (typeof window === 'undefined') return;

    // Resume when returning to the tab
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && !this.isMuted) {
        this.initContext();
        this.startBackgroundMusic();
      }
    });

    // Periodic watchdog check: ensures theme music is always playing if not muted
    this.watchdogTimer = window.setInterval(() => {
      if (!this.isMuted && this.hasUnlockedAudio && this.bgAudio && this.bgAudio.paused) {
        this.playBackgroundMusicSafe();
      }
    }, 2000);
  }

  private registerUserInteractionUnlock() {
    if (typeof window === 'undefined') return;

    const handleInteraction = () => {
      this.hasUnlockedAudio = true;
      this.initContext();
      this.startBackgroundMusic();
    };

    // Keep active listeners on all key input events so music unlocks and never gets stuck
    window.addEventListener('pointerdown', handleInteraction, { passive: true });
    window.addEventListener('keydown', handleInteraction, { passive: true });
    window.addEventListener('touchstart', handleInteraction, { passive: true });
    window.addEventListener('click', handleInteraction, { passive: true });
  }

  private playBackgroundMusicSafe() {
    if (!this.bgAudio || this.isMuted || this.isPlayPending) return;
    if (!this.bgAudio.paused && !this.bgAudio.ended) return;

    this.isPlayPending = true;
    this.bgAudio.volume = this.musicVolume;

    const playPromise = this.bgAudio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          this.isPlayPending = false;
        })
        .catch(() => {
          this.isPlayPending = false;
        });
    } else {
      this.isPlayPending = false;
    }
  }

  public startBackgroundMusic() {
    if (!this.bgAudio || this.isMuted) return;
    this.playBackgroundMusicSafe();
  }

  public pauseBackgroundMusic() {
    if (!this.bgAudio) return;
    this.bgAudio.pause();
  }

  public resumeBackgroundMusic() {
    if (!this.bgAudio || this.isMuted) return;
    this.startBackgroundMusic();
  }

  public setMusicVolume(volume: number) {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    if (this.bgAudio && !this.isMuted) {
      this.bgAudio.volume = this.musicVolume;
    }
  }

  public getMusicVolume(): number {
    return this.musicVolume;
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.bgAudio) {
      this.bgAudio.muted = muted;
      if (muted) {
        this.bgAudio.pause();
      } else {
        this.hasUnlockedAudio = true;
        this.startBackgroundMusic();
      }
    }
    if (muted) {
      this.stopJetpack();
    }
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public startJetpack(type: 'bullet' | 'plasma' | 'ion' | 'steam' | 'cosmic_spark' = 'bullet') {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;
    if (this.jetpackOsc) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      if (type === 'cosmic_spark') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(260, now);
        osc.frequency.exponentialRampToValueAtTime(320, now + 0.1);
      } else if (type === 'plasma') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(160, now);
      } else if (type === 'ion') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(220, now);
      } else if (type === 'steam') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(90, now);
      } else {
        // Bullet / machine gun pulse
        osc.type = 'square';
        osc.frequency.setValueAtTime(110, now);
      }

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.08, now + 0.05);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();

      this.jetpackOsc = osc;
      this.jetpackGain = gain;
    } catch {
      // AudioContext policy catch
    }
  }

  public updateJetpackPitch(verticalVelocityNormalized: number) {
    if (!this.jetpackOsc || !this.ctx) return;
    try {
      const baseFreq = 120 + Math.abs(verticalVelocityNormalized) * 60;
      this.jetpackOsc.frequency.setTargetAtTime(baseFreq, this.ctx.currentTime, 0.05);
    } catch {
      // ignore
    }
  }

  public stopJetpack() {
    if (!this.jetpackOsc || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      if (this.jetpackGain) {
        this.jetpackGain.gain.setValueAtTime(this.jetpackGain.gain.value, now);
        this.jetpackGain.gain.linearRampToValueAtTime(0.001, now + 0.05);
      }
      setTimeout(() => {
        if (this.jetpackOsc) {
          try {
            this.jetpackOsc.stop();
            this.jetpackOsc.disconnect();
          } catch {}
          this.jetpackOsc = null;
          this.jetpackGain = null;
        }
      }, 60);
    } catch {
      this.jetpackOsc = null;
      this.jetpackGain = null;
    }
  }

  public playCoin() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(987.77, now); // B5
      osc.frequency.setValueAtTime(1318.51, now + 0.06); // E6

      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.25);
    } catch {}
  }

  public playWarningAlert() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.setValueAtTime(600, now + 0.06);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.14);
    } catch {}
  }

  public playMissileWhoosh() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.35);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.36);
    } catch {}
  }

  public playHitZap() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(450, now);
      osc.frequency.linearRampToValueAtTime(70, now + 0.4);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.46);
    } catch {}
  }
}

export const sound = new SoundEngine();
