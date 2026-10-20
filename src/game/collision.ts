/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BoundingBox } from '../types/game';

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


