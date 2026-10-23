/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CharacterDef, PhysicsConfig } from '../types/game';

export const CANVAS_VIRTUAL_WIDTH = 960;
export const CANVAS_VIRTUAL_HEIGHT = 540;

export const FLOOR_HEIGHT = 64;
export const CEILING_HEIGHT = 44;
export const PLAYABLE_TOP = CEILING_HEIGHT;
export const PLAYABLE_BOTTOM = CANVAS_VIRTUAL_HEIGHT - FLOOR_HEIGHT;

export const DEFAULT_PHYSICS: PhysicsConfig = {
  gravity: 1450,             // Pixels per second squared
  jetpackThrust: 2600,       // Upward thrust acceleration
  terminalVelocityFall: 650, // Max descent speed
  terminalVelocityClimb: 580,// Max ascent speed
  baseScrollSpeed: 290,      // Comfortable, responsive starting horizontal scroll speed
  scrollAcceleration: 0.15,  // Very gentle speed scaling factor over long distance
  hitboxMarginPercent: 0.16, // Inset bounding box margin for fair play
};

export const CHOG_CHARACTER: CharacterDef = {
  id: 'chog',
  name: 'Chog',
  title: 'Chibi Jetpack Hero',
  description: 'The iconic chibi purple hedgehog! Armed with dual rocket thrusters, sweeping quills, and lightning-fast agility.',
  jetpackType: 'cosmic_spark',
  accentColor: '#ec4899',
  secondaryColor: '#581c87',
  thrustColor: '#facc15',
  massMultiplier: 0.95,
  thrustMultiplier: 1.08,
};

export const CHARACTERS: CharacterDef[] = [CHOG_CHARACTER];

export interface PhysicsPreset {
  id: string;
  name: string;
  description: string;
  tag: string;
  accentColor: string;
  config: PhysicsConfig;
}

export const PHYSICS_PRESETS: PhysicsPreset[] = [
  {
    id: 'classic',
    name: 'Classic Joyride',
    description: 'Golden-calibrated arcade flight physics. Snappy vertical thrust and responsive descent.',
    tag: 'STANDARD',
    accentColor: 'amber',
    config: { ...DEFAULT_PHYSICS },
  },
  {
    id: 'moon',
    name: 'Moon Gravity',
    description: 'Drastic low-G laboratory simulation with soaring lofty air-time and gentle floating.',
    tag: 'LOW-G',
    accentColor: 'cyan',
    config: {
      ...DEFAULT_PHYSICS,
      gravity: 780,
      jetpackThrust: 1850,
      terminalVelocityFall: 430,
      terminalVelocityClimb: 480,
    },
  },
  {
    id: 'turbo',
    name: 'Supersonic Turbo',
    description: 'Accelerated 370px/s laboratory conveyor with high-powered military thruster kick.',
    tag: 'HIGH SPEED',
    accentColor: 'rose',
    config: {
      ...DEFAULT_PHYSICS,
      baseScrollSpeed: 370,
      jetpackThrust: 3200,
      gravity: 1750,
      terminalVelocityFall: 750,
      terminalVelocityClimb: 680,
    },
  },
  {
    id: 'chill',
    name: 'Floaty Feather',
    description: 'Relaxed arcade flight with 22% forgiveness shield buffer for effortless coin collecting.',
    tag: 'CASUAL',
    accentColor: 'emerald',
    config: {
      ...DEFAULT_PHYSICS,
      gravity: 1100,
      jetpackThrust: 2200,
      terminalVelocityFall: 490,
      hitboxMarginPercent: 0.22,
    },
  },
];

