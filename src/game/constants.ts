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
