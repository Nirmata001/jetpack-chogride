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
  baseScrollSpeed: 380,      // Starting horizontal scroll speed
  scrollAcceleration: 2.2,   // Speed scaling factor as distance climbs
  hitboxMarginPercent: 0.16, // Inset bounding box margin for fair play
};

export const CHARACTERS: CharacterDef[] = [
  {
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
  },
  {
    id: 'barry',
    name: 'Barry Strike',
    title: 'Commando Pilot',
    description: 'Classic machine-gun jetpack spitting heavy bullet casings and recoil sparks.',
    jetpackType: 'bullet',
    accentColor: '#f59e0b',
    secondaryColor: '#3b82f6',
    thrustColor: '#fbbf24',
    massMultiplier: 1.0,
    thrustMultiplier: 1.0,
  },
  {
    id: 'cyber_ninja',
    name: 'Rei Shadow',
    title: 'Cyber Ninja',
    description: 'Neon plasma thrusters with hyper-responsive acceleration and sharp particle trail.',
    jetpackType: 'plasma',
    accentColor: '#06b6d4',
    secondaryColor: '#ec4899',
    thrustColor: '#22d3ee',
    massMultiplier: 0.92,
    thrustMultiplier: 1.05,
  },
  {
    id: 'astrobot',
    name: 'Astrobot X-1',
    title: 'Prototype Drone',
    description: 'Ion flare propulsion with smooth anti-gravity lift and thermal stability.',
    jetpackType: 'ion',
    accentColor: '#10b981',
    secondaryColor: '#8b5cf6',
    thrustColor: '#34d399',
    massMultiplier: 1.08,
    thrustMultiplier: 0.98,
  },
  {
    id: 'valkyrie',
    name: 'Valkyrie Steampunk',
    title: 'Aero Specialist',
    description: 'High-pressure brass steam engines producing dense plumes and heavy sustained lift.',
    jetpackType: 'steam',
    accentColor: '#f97316',
    secondaryColor: '#eab308',
    thrustColor: '#fdba74',
    massMultiplier: 1.15,
    thrustMultiplier: 1.12,
  },
];
