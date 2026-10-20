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
  private musicVolume: number = 0.34;
  private hasUnlockedAudio: boolean = false;
  private isPlayPending: boolean = false;
  private playPendingTimeout: number | null = null;
  private watchdogTimer: number | null = null;

  constructor() {
    this.initBackgroundMusic();
    this.registerUserInteractionUnlock();
    this.setupVisibilityWatchdog();
  }

  private initBackgroundMusic() {
    if (typeof window === 'undefined') return;
    try {
      let audio = document.getElementById('game-bgm') as HTMLAudioElement | null;
      if (!audio) {
        audio = new Audio('/theme.mp3');
        audio.id = 'game-bgm';
        audio.loop = true;
        audio.preload = 'auto';
        audio.setAttribute('playsinline', 'true');
        audio.setAttribute('webkit-playsinline', 'true');
        try {
          document.body.appendChild(audio);
        } catch {}
      }
      this.bgAudio = audio;
      this.bgAudio.volume = this.musicVolume;
      this.bgAudio.loop = true;
      this.bgAudio.muted = this.isMuted;

      // Bulletproof loop listener: when track finishes, rewind and play seamlessly
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

      // Auto-resume if browser paused audio unexpectedly (e.g. system buffer underrun or tab sleep)
      this.bgAudio.addEventListener('pause', () => {
        if (!this.isMuted && this.hasUnlockedAudio) {
          setTimeout(() => {
            if (!this.isMuted && this.bgAudio && this.bgAudio.paused) {
              this.playBackgroundMusicSafe();
            }
          }, 150);
        }
      });

      // Attempt immediate play (works if user has visited or browser allows autoplay)
      this.playBackgroundMusicSafe();
    } catch {
      // Audio autoplay policy fallback
    }
  }

  private setupVisibilityWatchdog() {
    if (typeof window === 'undefined') return;

    const resumeOnFocus = () => {
      if (!this.isMuted) {
        this.hasUnlockedAudio = true;
        this.initContext();
        this.startBackgroundMusic();
      }
    };

    // Resume when returning to the tab or iframe
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        resumeOnFocus();
      }
    });

    window.addEventListener('focus', resumeOnFocus);

    // Periodic watchdog check: ensures theme music is playing whenever unmuted
    this.watchdogTimer = window.setInterval(() => {
      if (!this.isMuted && this.hasUnlockedAudio && this.bgAudio && this.bgAudio.paused) {
        this.playBackgroundMusicSafe();
      }
    }, 1500);
  }

  private registerUserInteractionUnlock() {
    if (typeof window === 'undefined') return;

    const unlock = () => {
      this.hasUnlockedAudio = true;
      this.initContext();
      this.startBackgroundMusic();
    };

    // Use capture: true on both window and document so no button e.stopPropagation() can block audio unlock
    const opts: AddEventListenerOptions = { capture: true, passive: true };
    window.addEventListener('pointerdown', unlock, opts);
    window.addEventListener('keydown', unlock, opts);
    window.addEventListener('touchstart', unlock, opts);
    window.addEventListener('click', unlock, opts);
    window.addEventListener('mousedown', unlock, opts);
    document.addEventListener('pointerdown', unlock, opts);
    document.addEventListener('click', unlock, opts);
  }

  private playBackgroundMusicSafe() {
    if (!this.bgAudio || this.isMuted) return;

    // If already playing smoothly, do not interrupt
    if (!this.bgAudio.paused && !this.bgAudio.ended && this.bgAudio.currentTime > 0) {
      this.hasUnlockedAudio = true;
      return;
    }

    // Reset currentTime if at or near the end of the song
    if (this.bgAudio.duration && this.bgAudio.currentTime >= this.bgAudio.duration - 0.5) {
      this.bgAudio.currentTime = 0;
    }

    if (this.isPlayPending) {
      return;
    }

    this.isPlayPending = true;
    if (this.playPendingTimeout) {
      clearTimeout(this.playPendingTimeout);
    }
    // Safety watchdog: never let isPlayPending lock up permanently
    this.playPendingTimeout = window.setTimeout(() => {
      this.isPlayPending = false;
    }, 800);

    this.bgAudio.volume = this.musicVolume;
    this.bgAudio.muted = false;

    const playPromise = this.bgAudio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          this.isPlayPending = false;
          this.hasUnlockedAudio = true;
        })
        .catch(() => {
          this.isPlayPending = false;
          // Blocked by browser autoplay policy; will unlock on the first user interaction
        });
    } else {
      this.isPlayPending = false;
      this.hasUnlockedAudio = true;
    }
  }

  public startBackgroundMusic() {
    if (!this.bgAudio || this.isMuted) return;
    this.hasUnlockedAudio = true;
    this.initContext();
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
        try {
          this.getNoiseBuffer();
        } catch {}
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

  private noiseBuffer: AudioBuffer | null = null;
  private noiseSource: AudioBufferSourceNode | null = null;
  private noiseGain: GainNode | null = null;
  private noiseFilter: BiquadFilterNode | null = null;
  private lastPitchFreq: number = 0;

  private getNoiseBuffer(): AudioBuffer | null {
    if (this.noiseBuffer && this.ctx) return this.noiseBuffer;
    if (!this.ctx) return null;
    try {
      // Compact seamless 0.25s noise loop (~11,000 samples) creates in <0.3ms
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.25);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        // Breezy flame and rushing airflow mix
        data[i] = (Math.random() * 2 - 1) * 0.75;
      }
      this.noiseBuffer = buffer;
      return buffer;
    } catch {
      return null;
    }
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

      // Warm flame core rumble
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(85, now);

      gain.gain.setValueAtTime(0.02, now);
      gain.gain.linearRampToValueAtTime(0.18, now + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();

      this.jetpackOsc = osc;
      this.jetpackGain = gain;

      // Breezy Flame Airflow Noise Generator
      const buffer = this.getNoiseBuffer();
      if (buffer) {
        const noiseSrc = this.ctx.createBufferSource();
        noiseSrc.buffer = buffer;
        noiseSrc.loop = true;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(440, now);
        filter.Q.setValueAtTime(1.5, now);

        const noiseG = this.ctx.createGain();
        noiseG.gain.setValueAtTime(0.02, now);
        noiseG.gain.linearRampToValueAtTime(0.26, now + 0.08);

        noiseSrc.connect(filter);
        filter.connect(noiseG);
        noiseG.connect(this.ctx.destination);

        noiseSrc.start();
        this.noiseSource = noiseSrc;
        this.noiseGain = noiseG;
        this.noiseFilter = filter;
      }
    } catch {
      // AudioContext policy catch
    }
  }

  public updateJetpackPitch(verticalVelocityNormalized: number) {
    if (!this.ctx || this.isMuted) return;
    try {
      const baseFreq = 85 + Math.abs(verticalVelocityNormalized) * 55;
      if (Math.abs(baseFreq - this.lastPitchFreq) < 2) return;
      this.lastPitchFreq = baseFreq;

      const now = this.ctx.currentTime;
      if (this.jetpackOsc) {
        this.jetpackOsc.frequency.setTargetAtTime(baseFreq, now, 0.05);
      }
      if (this.noiseFilter) {
        const filterFreq = 380 + Math.abs(verticalVelocityNormalized) * 240;
        this.noiseFilter.frequency.setTargetAtTime(filterFreq, now, 0.05);
      }
    } catch {
      // ignore
    }
  }

  public stopJetpack() {
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      if (this.jetpackGain) {
        this.jetpackGain.gain.setValueAtTime(this.jetpackGain.gain.value, now);
        this.jetpackGain.gain.linearRampToValueAtTime(0.001, now + 0.08);
      }
      if (this.noiseGain) {
        this.noiseGain.gain.setValueAtTime(this.noiseGain.gain.value, now);
        this.noiseGain.gain.linearRampToValueAtTime(0.001, now + 0.08);
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
        if (this.noiseSource) {
          try {
            this.noiseSource.stop();
            this.noiseSource.disconnect();
          } catch {}
          this.noiseSource = null;
          this.noiseGain = null;
          this.noiseFilter = null;
        }
      }, 90);
    } catch {
      this.jetpackOsc = null;
      this.jetpackGain = null;
      this.noiseSource = null;
      this.noiseGain = null;
      this.noiseFilter = null;
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
      osc.frequency.setValueAtTime(1046.5, now); // C6
      osc.frequency.setValueAtTime(1567.98, now + 0.05); // G6 - bright, energetic coin bell

      gain.gain.setValueAtTime(0.24, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.3);
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

  public playElectricZap() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;

      // 1. High-Voltage Ionization Breakdown & Rapid Frequency Stutter
      const zapOsc = this.ctx.createOscillator();
      const zapGain = this.ctx.createGain();

      zapOsc.type = 'sawtooth';
      // Electrical arc pitch cascade: 1600Hz -> 380Hz -> 920Hz -> 180Hz -> 75Hz
      zapOsc.frequency.setValueAtTime(1600, now);
      zapOsc.frequency.exponentialRampToValueAtTime(380, now + 0.035);
      zapOsc.frequency.setValueAtTime(920, now + 0.04);
      zapOsc.frequency.exponentialRampToValueAtTime(220, now + 0.1);
      zapOsc.frequency.setValueAtTime(450, now + 0.11);
      zapOsc.frequency.exponentialRampToValueAtTime(70, now + 0.38);

      zapGain.gain.setValueAtTime(0.38, now);
      zapGain.gain.setValueAtTime(0.24, now + 0.035);
      zapGain.gain.setValueAtTime(0.32, now + 0.07);
      zapGain.gain.setValueAtTime(0.18, now + 0.14);
      zapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);

      zapOsc.connect(zapGain);
      zapGain.connect(this.ctx.destination);
      zapOsc.start(now);
      zapOsc.stop(now + 0.44);

      // 2. Gritty 120Hz Electrical Arc Mains Hum
      const buzzOsc = this.ctx.createOscillator();
      const buzzGain = this.ctx.createGain();

      buzzOsc.type = 'square';
      buzzOsc.frequency.setValueAtTime(120, now);
      buzzOsc.frequency.setValueAtTime(240, now + 0.05);
      buzzOsc.frequency.setValueAtTime(90, now + 0.12);
      buzzOsc.frequency.setValueAtTime(60, now + 0.22);

      buzzGain.gain.setValueAtTime(0.25, now);
      buzzGain.gain.exponentialRampToValueAtTime(0.001, now + 0.36);

      buzzOsc.connect(buzzGain);
      buzzGain.connect(this.ctx.destination);
      buzzOsc.start(now);
      buzzOsc.stop(now + 0.38);

      // 3. High-Frequency Spark Crackle & Sizzle (Filtered Noise Burst)
      const buffer = this.getNoiseBuffer();
      if (buffer) {
        const noiseSrc = this.ctx.createBufferSource();
        noiseSrc.buffer = buffer;
        noiseSrc.loop = true;

        const noiseFilter = this.ctx.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.setValueAtTime(3400, now);
        noiseFilter.Q.setValueAtTime(3.2, now);

        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.28, now);
        // Random sputtering spark pulses
        noiseGain.gain.setValueAtTime(0.06, now + 0.025);
        noiseGain.gain.setValueAtTime(0.3, now + 0.05);
        noiseGain.gain.setValueAtTime(0.08, now + 0.1);
        noiseGain.gain.setValueAtTime(0.24, now + 0.14);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

        noiseSrc.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.ctx.destination);

        noiseSrc.start(now);
        noiseSrc.stop(now + 0.42);
      }
    } catch {}
  }

  public playExplosion() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(170, now);
      osc.frequency.exponentialRampToValueAtTime(32, now + 0.48);

      gain.gain.setValueAtTime(0.36, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.52);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.55);

      const buffer = this.getNoiseBuffer();
      if (buffer) {
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(260, now);

        const nGain = this.ctx.createGain();
        nGain.gain.setValueAtTime(0.32, now);
        nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.52);

        noise.connect(filter);
        filter.connect(nGain);
        nGain.connect(this.ctx.destination);
        noise.start(now);
        noise.stop(now + 0.55);
      }
    } catch {}
  }

  public playHitZap() {
    this.playElectricZap();
  }
}

export const sound = new SoundEngine();
