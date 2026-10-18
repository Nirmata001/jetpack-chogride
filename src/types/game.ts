/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type GameState = 'READY' | 'PLAYING' | 'PAUSED' | 'GAME_OVER';

export type PlayerMovementState = 'RUNNING' | 'FLYING' | 'DYING' | 'DEAD';

export interface BoundingBox {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

export interface PhysicsConfig {
  gravity: number;             // px/s^2 (e.g. 1400)
  jetpackThrust: number;       // px/s^2 (e.g. 2400)
  terminalVelocityFall: number;// px/s (e.g. 700)
  terminalVelocityClimb: number;// px/s (e.g. 600)
  baseScrollSpeed: number;     // px/s (e.g. 360)
  scrollAcceleration: number;  // px/s^2 over distance (e.g. 1.5)
  hitboxMarginPercent: number; // 0.15 = 15% inner padding for fair play
}

export interface CharacterDef {
  id: string;
  name: string;
  title: string;
  description: string;
  jetpackType: 'bullet' | 'plasma' | 'ion' | 'steam' | 'cosmic_spark';
  accentColor: string;
  secondaryColor: string;
  thrustColor: string;
  massMultiplier: number;
  thrustMultiplier: number;
}

export type ObstacleType = 'zapper_horizontal' | 'zapper_vertical' | 'zapper_diagonal' | 'zapper_rotating' | 'missile' | 'laser_beam';

export interface BaseObstacle {
  id: number;
  type: ObstacleType;
  x: number;
  y: number;
  width: number;
  height: number;
  hitbox: BoundingBox;
}

export interface ZapperObstacle extends BaseObstacle {
  type: 'zapper_horizontal' | 'zapper_vertical' | 'zapper_diagonal' | 'zapper_rotating';
  angle: number;
  rotationSpeed?: number;
  length: number;
}

export interface MissileObstacle extends BaseObstacle {
  type: 'missile';
  state: 'WARNING' | 'LAUNCHED' | 'PASSED';
  targetY: number;
  warningTimer: number; // seconds
  speed: number;
  trailTimer: number;
}

export interface Coin {
  id: number;
  x: number;
  y: number;
  radius: number;
  collected: boolean;
  value: number;
}

export type ParticleType =
  | 'thrust'
  | 'spark'
  | 'smoke'
  | 'bullet_casing'
  | 'coin_sparkle'
  | 'explosion'
  | 'exhaust_flame'
  | 'exhaust_smoke'
  | 'exhaust_spark'
  | 'contrail'
  | 'shock_ring';

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  type: ParticleType;
  secondaryColor?: string;
  growthRate?: number;
  rotation?: number;
  rotationSpeed?: number;
  drag?: number;
  buoyancy?: number;
}
