/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CharacterDef, Particle, ParticleType } from '../types/game';

export class ParticleSystem {
  public particles: Particle[] = [];
  private pool: Particle[] = [];
  private shockRingTimer: number = 0;
  private contrailTimer: number = 0;
  private lastNozzleX: number = 0;
  private lastNozzleY: number = 0;
  private hasLastNozzle: boolean = false;

  private spawn(p: Particle) {
    if (this.particles.length >= 65) return;
    const recycled = this.pool.pop();
    if (recycled) {
      recycled.x = p.x;
      recycled.y = p.y;
      recycled.vx = p.vx;
      recycled.vy = p.vy;
      recycled.life = p.life;
      recycled.maxLife = p.maxLife;
      recycled.size = p.size;
      recycled.color = p.color;
      recycled.secondaryColor = p.secondaryColor;
      recycled.type = p.type;
      recycled.drag = p.drag;
      recycled.growthRate = p.growthRate;
      recycled.buoyancy = p.buoyancy;
      this.particles.push(recycled);
    } else {
      this.particles.push(p);
    }
  }

  /**
   * Main Exhaust Trail Engine for Flying Characters
   * Generates multi-layered aerodynamic exhaust plumes behind the jetpack:
   * - Luminous Flame/Plasma Cores
   * - Volumetric Billowing Smoke Puffs
   * - Sparkling Embers & Star Flares
   * - Aerodynamic Vapor Contrails
   * - Expanding Shockwave Vapor Halos
   */
  public emitFlyingExhaustTrail(
    nozzleX: number,
    nozzleY: number,
    playerVy: number,
    isThrusting: boolean,
    character: CharacterDef,
    scrollSpeed: number,
    dt: number
  ) {
    if (!this.hasLastNozzle) {
      this.lastNozzleX = nozzleX;
      this.lastNozzleY = nozzleY;
      this.hasLastNozzle = true;
    }

    this.shockRingTimer += dt;
    this.contrailTimer += dt;

    const isChog = character.id === 'chog';
    const jetpackType = character.jetpackType;

    // Theme color palettes based on character & jetpack design
    let primaryColor = character.thrustColor;
    let secondaryColor = character.accentColor;
    let smokeBaseColor = 'rgba(100, 116, 139, 0.35)';

    if (isChog || jetpackType === 'cosmic_spark') {
      primaryColor = '#facc15';    // Star Gold
      secondaryColor = '#ec4899';  // Cosmic Magenta
      smokeBaseColor = 'rgba(168, 85, 247, 0.32)'; // Cosmic Violet/Pink vapor
    } else if (jetpackType === 'bullet') {
      primaryColor = '#fbbf24';    // Gunpowder Amber
      secondaryColor = '#ef4444';  // Muzzle Flame
      smokeBaseColor = 'rgba(148, 163, 184, 0.45)'; // Heavy combustion gray smoke
    } else if (jetpackType === 'plasma') {
      primaryColor = '#22d3ee';    // Electric Cyan
      secondaryColor = '#ec4899';  // Plasma Pink
      smokeBaseColor = 'rgba(6, 182, 212, 0.3)';   // Neon ionization mist
    } else if (jetpackType === 'ion') {
      primaryColor = '#34d399';    // Emerald Ion
      secondaryColor = '#38bdf8';  // Sky Blue
      smokeBaseColor = 'rgba(52, 211, 153, 0.28)';  // Anti-gravity ion glow
    } else if (jetpackType === 'steam') {
      primaryColor = '#fed7aa';    // Hot Steam Glow
      secondaryColor = '#f97316';  // Boiler Ember
      smokeBaseColor = 'rgba(248, 250, 252, 0.65)'; // Dense white steam
    }

    if (isThrusting) {
      // 1. ACTIVE THRUST EXHAUST PLUME
      if (this.particles.length < 55) {
        const originX = (this.lastNozzleX + nozzleX) * 0.5;
        const originY = (this.lastNozzleY + nozzleY) * 0.5;

        // A. HOT FLAME / PLASMA CORE
        const flameSpreadX = (Math.random() - 0.5) * 6;
        const flameSpreadY = (Math.random() - 0.5) * 4;
        const flameVx = -scrollSpeed * 0.35 - 120 + flameSpreadX;
        const flameVy = 110 + Math.random() * 100 + flameSpreadY;

        this.spawn({
          x: originX,
          y: originY,
          vx: flameVx,
          vy: flameVy,
          life: 0.16 + Math.random() * 0.12,
          maxLife: 0.28,
          size: 4 + Math.random() * 3,
          color: Math.random() > 0.35 ? primaryColor : secondaryColor,
          secondaryColor: '#ffffff',
          type: 'exhaust_flame',
          drag: 0.95,
          growthRate: 3,
        });

        // B. EXPANDING VOLUMETRIC SMOKE PUFF
        const smokeSpread = (Math.random() - 0.5) * 8;
        const smokeVx = -scrollSpeed * 0.45 - 90 + smokeSpread;
        const smokeVy = 60 + Math.random() * 60;

        this.spawn({
          x: originX - 3,
          y: originY + 2,
          vx: smokeVx,
          vy: smokeVy,
          life: 0.32 + Math.random() * 0.18,
          maxLife: 0.5,
          size: 4 + Math.random() * 3,
          color: smokeBaseColor,
          type: 'exhaust_smoke',
          drag: 0.94,
          growthRate: 14,
          buoyancy: 22,
        });

        // C. SPARKLE EMBERS (intermittent)
        if (Math.random() < 0.55) {
          const sparkAngle = Math.PI * 0.65 + (Math.random() - 0.5) * 0.6;
          const sparkSpeed = 140 + Math.random() * 120;
          this.spawn({
            x: nozzleX - 2,
            y: nozzleY,
            vx: -Math.cos(sparkAngle) * sparkSpeed - scrollSpeed * 0.3,
            vy: Math.sin(sparkAngle) * sparkSpeed,
            life: 0.16 + Math.random() * 0.12,
            maxLife: 0.28,
            size: 1.6 + Math.random() * 1.2,
            color: isChog ? (Math.random() > 0.5 ? '#fde047' : '#f43f5e') : primaryColor,
            type: 'exhaust_spark',
            drag: 0.95,
          });
        }

        // D. PERIODIC SHOCK EXPANSION RINGS
        if (this.shockRingTimer >= 0.16) {
          this.shockRingTimer = 0;
          this.spawn({
            x: nozzleX - 4,
            y: nozzleY + 4,
            vx: -scrollSpeed * 0.6 - 60,
            vy: 20,
            life: 0.16,
            maxLife: 0.16,
            size: 5,
            color: secondaryColor,
            type: 'shock_ring',
            growthRate: 50,
            drag: 0.94,
          });
        }
      }
    } else {
      // 2. AIRBORNE GLIDING / SLIPSTREAM CONTRAILS
      if (this.contrailTimer >= 0.06 && this.particles.length < 40) {
        this.contrailTimer = 0;
        this.spawn({
          x: nozzleX - 2,
          y: nozzleY + 2,
          vx: -scrollSpeed * 0.6 - 40,
          vy: -playerVy * 0.06,
          life: 0.22,
          maxLife: 0.22,
          size: 3 + Math.random() * 1.5,
          color: isChog ? 'rgba(236, 72, 153, 0.2)' : 'rgba(226, 232, 240, 0.22)',
          type: 'contrail',
          drag: 0.95,
          growthRate: 8,
        });
      }
    }

    this.lastNozzleX = nozzleX;
    this.lastNozzleY = nozzleY;
  }

  /**
   * Reset nozzle interpolation reference when landing or changing states
   */
  public resetEmitterHistory() {
    this.hasLastNozzle = false;
  }

  /**
   * Classic Jetpack Emission (for legacy callers)
   */
  public emitJetpack(
    x: number,
    y: number,
    type: 'bullet' | 'plasma' | 'ion' | 'steam' | 'cosmic_spark',
    thrustColor: string
  ) {
    const dummyChar: CharacterDef = {
      id: type === 'cosmic_spark' ? 'chog' : 'classic',
      name: 'Pilot',
      title: 'Pilot',
      description: '',
      jetpackType: type,
      accentColor: thrustColor,
      secondaryColor: '#f43f5e',
      thrustColor: thrustColor,
      massMultiplier: 1,
      thrustMultiplier: 1,
    };
    this.emitFlyingExhaustTrail(x, y, 0, true, dummyChar, 380, 0.016);
  }

  /**
   * Running dust kicking up when player boots touch the catwalk floor
   */
  public emitDust(x: number, y: number) {
    for (let i = 0; i < 2; i++) {
      this.spawn({
        x: x - 8 + Math.random() * 6,
        y: y - 2 + Math.random() * 4,
        vx: -110 - Math.random() * 70,
        vy: -20 - Math.random() * 35,
        life: 0.32,
        maxLife: 0.32,
        size: 3 + Math.random() * 3,
        color: 'rgba(148, 163, 184, 0.4)',
        type: 'smoke',
        drag: 0.92,
        growthRate: 12,
      });
    }
  }

  /**
   * Sparkle bursting out when coins are collected
   */
  public emitCoinSparkles(x: number, y: number) {
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8 + Math.random() * 0.3;
      const speed = 70 + Math.random() * 90;
      this.spawn({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.35,
        maxLife: 0.35,
        size: 3,
        color: '#fde047',
        type: 'coin_sparkle',
        drag: 0.95,
      });
    }
  }

  /**
   * Explosive burst upon obstacle collision or missile detonation
   */
  public emitExplosion(x: number, y: number) {
    for (let i = 0; i < 28; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 90 + Math.random() * 280;
      const isSpark = Math.random() > 0.45;
      this.spawn({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.45 + Math.random() * 0.35,
        maxLife: 0.8,
        size: isSpark ? 2.5 : 7 + Math.random() * 6,
        color: isSpark ? '#fef08a' : (Math.random() > 0.5 ? '#f97316' : '#ef4444'),
        type: isSpark ? 'spark' : 'explosion',
        drag: 0.94,
        growthRate: isSpark ? 0 : 16,
      });
    }
  }

  /**
   * High-Performance in-place particle array update (Zero splice GC pressure, auto-pooling)
   */
  public update(dt: number) {
    const clampedDt = Math.min(0.05, dt);
    let writeIdx = 0;

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      p.life -= clampedDt;
      if (p.life > 0) {
        // Physics update
        p.x += p.vx * clampedDt;
        p.y += p.vy * clampedDt;

        // Air resistance
        const dragFactor = p.drag ?? 0.96;
        p.vx *= Math.pow(dragFactor, clampedDt * 60);
        p.vy *= Math.pow(dragFactor, clampedDt * 60);

        if (p.buoyancy) {
          p.vy -= p.buoyancy * clampedDt;
        }

        if (p.growthRate) {
          p.size += p.growthRate * clampedDt;
        }

        this.particles[writeIdx++] = p;
      } else {
        // Recycle dead particle back into pool to prevent GC pauses
        if (this.pool.length < 90) {
          this.pool.push(p);
        }
      }
    }
    this.particles.length = writeIdx;
  }

  /**
   * High-Performance Canvas 2D particle drawing (Zero radial gradient allocations, single save/restore)
   */
  public draw(ctx: CanvasRenderingContext2D) {
    if (this.particles.length === 0) return;

    ctx.save();

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      const lifeRatio = Math.max(0, Math.min(1, p.life / p.maxLife));
      const alpha = Math.pow(lifeRatio, 1.2);

      if (p.type === 'exhaust_flame') {
        // High-energy radiant core (Outer halo + intense inner core)
        ctx.globalAlpha = alpha * 0.45;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(1, p.size * 1.3), 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = Math.min(1, alpha * 1.2);
        ctx.fillStyle = p.secondaryColor || '#ffffff';
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.6, p.size * 0.65), 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'exhaust_smoke') {
        // Soft volumetric smoke puff
        ctx.globalAlpha = alpha * 0.4;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(1, p.size), 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'contrail') {
        ctx.globalAlpha = alpha * 0.35;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.8, p.size), 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'shock_ring') {
        ctx.globalAlpha = alpha * 0.8;
        ctx.strokeStyle = p.color;
        ctx.lineWidth = Math.max(1, 2 * alpha);
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(1, p.size), 0, Math.PI * 2);
        ctx.stroke();
      } else if (p.type === 'exhaust_spark' || p.type === 'spark' || p.type === 'coin_sparkle') {
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.6, p.size), 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.5, p.size), 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  /**
   * Reset all particles and recycle them
   */
  public clear() {
    for (let i = 0; i < this.particles.length; i++) {
      if (this.pool.length < 90) {
        this.pool.push(this.particles[i]);
      }
    }
    this.particles.length = 0;
    this.hasLastNozzle = false;
  }
}
