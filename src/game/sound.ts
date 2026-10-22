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

  private distortionCurve: Float32Array | null = null;
  private getDistortionCurve(): Float32Array {
    if (!this.distortionCurve) {
      const n_samples = 256;
      const curve = new Float32Array(n_samples);
      const deg = Math.PI / 180;
      const k = 45; // Aggressive electrical arc saturation
      for (let i = 0; i < n_samples; ++i) {
        const x = (i * 2) / n_samples - 1;
        curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
      }
      this.distortionCurve = curve;
    }
    return this.distortionCurve;
  }

  public playElectricZap() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;

      // 1. HIGH-VOLTAGE FM ARC CARRIER & 120Hz MODULATOR (The snarling "KZRRRR-ZZZT" growl)
      const carrierOsc = this.ctx.createOscillator();
      const carrierGain = this.ctx.createGain();
      const modOsc = this.ctx.createOscillator();
      const modGain = this.ctx.createGain();

      carrierOsc.type = 'sawtooth';
      // Voltage breakdown pitch descent
      carrierOsc.frequency.setValueAtTime(420, now);
      carrierOsc.frequency.exponentialRampToValueAtTime(140, now + 0.12);
      carrierOsc.frequency.setValueAtTime(260, now + 0.13);
      carrierOsc.frequency.exponentialRampToValueAtTime(75, now + 0.42);

      // 120Hz arc pulse modulator driving carrier frequency
      modOsc.type = 'square';
      modOsc.frequency.setValueAtTime(120, now);
      modOsc.frequency.setValueAtTime(180, now + 0.08);
      modOsc.frequency.setValueAtTime(90, now + 0.2);

      // Deep FM modulation index creating rich electric sidebands
      modGain.gain.setValueAtTime(480, now);
      modGain.gain.exponentialRampToValueAtTime(80, now + 0.4);

      modOsc.connect(modGain);
      modGain.connect(carrierOsc.frequency);

      // Waveshaper for overdriven arc distortion
      const shaper = this.ctx.createWaveShaper();
      shaper.curve = this.getDistortionCurve() as Float32Array<ArrayBuffer>;
      shaper.oversample = '2x';

      // Arc bandpass filter to shape cutting electric presence
      const arcFilter = this.ctx.createBiquadFilter();
      arcFilter.type = 'bandpass';
      arcFilter.frequency.setValueAtTime(1200, now);
      arcFilter.frequency.exponentialRampToValueAtTime(450, now + 0.42);
      arcFilter.Q.setValueAtTime(2.2, now);

      carrierGain.gain.setValueAtTime(0.42, now);
      carrierGain.gain.setValueAtTime(0.35, now + 0.04);
      carrierGain.gain.setValueAtTime(0.38, now + 0.09);
      carrierGain.gain.setValueAtTime(0.24, now + 0.18);
      carrierGain.gain.exponentialRampToValueAtTime(0.001, now + 0.44);

      carrierOsc.connect(shaper);
      shaper.connect(arcFilter);
      arcFilter.connect(carrierGain);
      carrierGain.connect(this.ctx.destination);

      carrierOsc.start(now);
      modOsc.start(now);
      carrierOsc.stop(now + 0.46);
      modOsc.stop(now + 0.46);

      // 2. INSTANTANEOUS 10kV CAPACITIVE DISCHARGE SNAPS ("CRACK!")
      const snapOsc = this.ctx.createOscillator();
      const snapGain = this.ctx.createGain();

      snapOsc.type = 'sawtooth';
      // Primary snap: 2600Hz -> 180Hz in 25ms
      snapOsc.frequency.setValueAtTime(2600, now);
      snapOsc.frequency.exponentialRampToValueAtTime(180, now + 0.025);
      // Secondary rebound snap at 45ms: 1800Hz -> 140Hz
      snapOsc.frequency.setValueAtTime(1800, now + 0.045);
      snapOsc.frequency.exponentialRampToValueAtTime(140, now + 0.08);

      snapGain.gain.setValueAtTime(0.48, now);
      snapGain.gain.exponentialRampToValueAtTime(0.01, now + 0.035);
      snapGain.gain.setValueAtTime(0.38, now + 0.045);
      snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);

      snapOsc.connect(snapGain);
      snapGain.connect(this.ctx.destination);
      snapOsc.start(now);
      snapOsc.stop(now + 0.12);

      // 3. HIGH-FREQUENCY MULTI-SPARK SPUTTER / TASER CRACKLE (4.2kHz Bandpass Noise)
      const buffer = this.getNoiseBuffer();
      if (buffer) {
        const noiseSrc = this.ctx.createBufferSource();
        noiseSrc.buffer = buffer;
        noiseSrc.loop = true;

        const noiseFilter = this.ctx.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.setValueAtTime(4200, now);
        noiseFilter.Q.setValueAtTime(4.0, now);

        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.38, now);
        // Stuttering micro-sparks leaping across the gap
        noiseGain.gain.setValueAtTime(0.06, now + 0.02);
        noiseGain.gain.setValueAtTime(0.42, now + 0.045);
        noiseGain.gain.setValueAtTime(0.08, now + 0.08);
        noiseGain.gain.setValueAtTime(0.36, now + 0.11);
        noiseGain.gain.setValueAtTime(0.1, now + 0.16);
        noiseGain.gain.setValueAtTime(0.28, now + 0.2);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.44);

        noiseSrc.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.ctx.destination);

        noiseSrc.start(now);
        noiseSrc.stop(now + 0.46);
      }

      // 4. METALLIC IONIZATION RING / PLASMA OVERTONE
      const ringOsc = this.ctx.createOscillator();
      const ringGain = this.ctx.createGain();

      ringOsc.type = 'sine';
      ringOsc.frequency.setValueAtTime(1760, now);
      ringOsc.frequency.exponentialRampToValueAtTime(580, now + 0.25);

      ringGain.gain.setValueAtTime(0.24, now);
      ringGain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);

      ringOsc.connect(ringGain);
      ringGain.connect(this.ctx.destination);
      ringOsc.start(now);
      ringOsc.stop(now + 0.28);
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
