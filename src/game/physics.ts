/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CharacterDef, PhysicsConfig, PlayerMovementState } from '../types/game';
import { PLAYABLE_BOTTOM, PLAYABLE_TOP } from './constants';

export interface PhysicsStepResult {
  y: number;
  vy: number;
  netAcceleration: number;
  movementState: PlayerMovementState;
  grounded: boolean;
  hitCeiling: boolean;
}

/**
 * Computes single-frame vertical velocity and position integration.
 * This mirrors the exact Kotlin PhysicsEngine implementation.
 */
export function updatePlayerPhysics(
  currentY: number,
  currentVy: number,
  isJetpackFiring: boolean,
  dt: number,
  config: PhysicsConfig,
  character: CharacterDef,
  playerHeight: number = 52
): PhysicsStepResult {
  const mass = character.massMultiplier;
  const thrustMult = character.thrustMultiplier;

  // Effective acceleration calculation:
  // Downwards is positive Y, Upwards is negative Y in screen space.
  const gravityAccel = config.gravity * mass;
  const upwardThrust = isJetpackFiring ? config.jetpackThrust * thrustMult : 0;

  // Net acceleration in px/s^2 (downward positive)
  const netAcceleration = gravityAccel - upwardThrust;

  // Semi-implicit Euler integration for velocity
  let newVy = currentVy + netAcceleration * dt;

  // Terminal velocity limits (clamping)
  const maxFallSpeed = config.terminalVelocityFall;
  const maxClimbSpeed = -config.terminalVelocityClimb; // negative Y is upward
  newVy = Math.max(maxClimbSpeed, Math.min(newVy, maxFallSpeed));

  // Position integration
  let newY = currentY + newVy * dt;

  // Ceiling constraint
  let hitCeiling = false;
  if (newY <= PLAYABLE_TOP) {
    newY = PLAYABLE_TOP;
    if (newVy < 0) {
      newVy = 0; // stop upward momentum at ceiling
    }
    hitCeiling = true;
  }

  // Floor constraint
  const groundLimitY = PLAYABLE_BOTTOM - playerHeight;
  let grounded = false;
  let movementState: PlayerMovementState = 'FLYING';

  if (newY >= groundLimitY) {
    newY = groundLimitY;
    newVy = 0;
    grounded = true;
    movementState = 'RUNNING';
  } else {
    movementState = 'FLYING';
  }

  return {
    y: newY,
    vy: newVy,
    netAcceleration,
    movementState,
    grounded,
    hitCeiling,
  };
}
