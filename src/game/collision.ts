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

/**
 * Checks line segment intersection with player AABB box.
 * Ideal for laser beams or angled zapper plasma streams.
 */
export function checkLineAABB(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  box: BoundingBox,
  beamRadius: number = 6
): boolean {
  // Quick reject if entire segment is on one side of expanded box
  const minX = Math.min(x1, x2) - beamRadius;
  const maxX = Math.max(x1, x2) + beamRadius;
  const minY = Math.min(y1, y2) - beamRadius;
  const maxY = Math.max(y1, y2) + beamRadius;

  if (maxX < box.left || minX > box.right || maxY < box.top || minY > box.bottom) {
    return false;
  }

  // Sample points along the segment (at intervals of beamRadius)
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  const steps = Math.max(4, Math.ceil(len / (beamRadius * 2)));

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const px = x1 + dx * t;
    const py = y1 + dy * t;
    if (checkCircleAABB(px, py, beamRadius, box)) {
      return true;
    }
  }

  return false;
}
