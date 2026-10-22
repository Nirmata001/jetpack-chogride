/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BoundingBox, ZapperObstacle } from '../types/game';

/**
 * Checks precise collision between player fair hitbox and a zapper obstacle.
 * A zapper consists of two end nodes (circles) and an electric beam (line segment)
 * between them. This prevents false positive hits in the empty corners of
 * diagonal or rotating zappers.
 */
export function checkZapperCollision(
  zapper: ZapperObstacle,
  playerBox: BoundingBox
): boolean {
  // 1. Broadphase fast rejection via outer bounding box
  if (!checkAABB(playerBox, zapper.hitbox)) {
    return false;
  }

  // 2. Compute exact end nodes
  const halfLen = zapper.length / 2;
  const cos = Math.cos(zapper.angle);
  const sin = Math.sin(zapper.angle);

  const x1 = zapper.x - halfLen * cos;
  const y1 = zapper.y - halfLen * sin;
  const x2 = zapper.x + halfLen * cos;
  const y2 = zapper.y + halfLen * sin;

  // Node radius is ~9.5px (fair-play margin vs the visual 14px node)
  const nodeRadius = 9.5;
  if (checkCircleAABB(x1, y1, nodeRadius, playerBox)) return true;
  if (checkCircleAABB(x2, y2, nodeRadius, playerBox)) return true;

  // 3. Test beam segment between nodes
  // Beam has a tight radius of 5.5px (visual beam core is ~10-12px wide)
  const beamRadius = 5.5;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  if (len < 1) return false;

  // Sample points along the beam segment at 6px increments
  const steps = Math.max(5, Math.ceil(len / 6));
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const px = x1 + dx * t;
    const py = y1 + dy * t;
    if (checkCircleAABB(px, py, beamRadius, playerBox)) {
      return true;
    }
  }

  return false;
}

/**
 * Standard Axis-Aligned Bounding Box (AABB) intersection formula.
 * Returns true if box A and box B overlap in 2D space.
 */
export function checkAABB(a: BoundingBox, b: BoundingBox): boolean {
  return (
    a.left < b.right &&
    a.right > b.left &&
    a.top < b.bottom &&
    a.bottom > b.top
  );
}

/**
 * Creates an inset bounding box to provide "fair-play" forgiveness.
 * Prevents frustration when obstacle touches outer transparent sprite pixels.
 */
export function createFairHitbox(
  x: number,
  y: number,
  width: number,
  height: number,
  marginPercent: number = 0.16
): BoundingBox {
  const padX = width * marginPercent;
  const padY = height * marginPercent;
  return {
    left: x + padX,
    top: y + padY,
    right: x + width - padX,
    bottom: y + height - padY,
    width: width - padX * 2,
    height: height - padY * 2,
  };
}

/**
 * Checks overlap between player hitbox and a circular coin.
 */
export function checkCircleAABB(
  cx: number,
  cy: number,
  radius: number,
  box: BoundingBox
): boolean {
  // Find the closest point on the bounding box to the circle center
  const closestX = Math.max(box.left, Math.min(cx, box.right));
  const closestY = Math.max(box.top, Math.min(cy, box.bottom));

  const distanceX = cx - closestX;
  const distanceY = cy - closestY;

  return distanceX * distanceX + distanceY * distanceY < radius * radius;
}


