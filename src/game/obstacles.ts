/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BaseObstacle, Coin, MissileObstacle, ZapperObstacle } from '../types/game';
import { CANVAS_VIRTUAL_HEIGHT, CANVAS_VIRTUAL_WIDTH, PLAYABLE_BOTTOM, PLAYABLE_TOP } from './constants';

export class ObstacleManager {
  public obstacles: (ZapperObstacle | MissileObstacle)[] = [];
  public coins: Coin[] = [];
  private nextObstacleId = 1;
  private nextCoinId = 1;
  private spawnCooldown = 1.6;
  private missileCooldown = 7.0;

  public reset() {
    this.obstacles = [];
    this.coins = [];
    this.nextObstacleId = 1;
    this.nextCoinId = 1;
    this.spawnCooldown = 1.5;
    this.missileCooldown = 6.0;
  }

  /**
   * Dynamically calculates obstacle/missile spawn rates and difficulty scaling based on distance traveled.
   * Progresses smoothly over 1,800 meters so game speed and obstacle density stay balanced and fun.
   */
  public getDynamicDifficulty(distanceMeters: number, currentScrollSpeed: number) {
    const progress = Math.min(1.0, distanceMeters / 1800);
    const scrollSpeed = currentScrollSpeed;
    const spawnCooldown = Math.max(1.3, 2.4 - progress * 1.1);
    const missileCooldown = Math.max(4.5, 9.5 - progress * 4.5);
    return { scrollSpeed, spawnCooldown, missileCooldown, speedMultiplier: 1.0 + progress * 0.35 };
  }

  public update(
    dt: number,
    distanceMeters: number,
    currentScrollSpeed: number,
    playerY: number,
    onMissileWarning: () => void,
    onMissileLaunch: () => void
  ) {
    const difficulty = this.getDynamicDifficulty(distanceMeters, currentScrollSpeed);
    const scrollSpeed = difficulty.scrollSpeed;

    // 1. Move obstacles left
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];

      if (obs.type === 'missile') {
        const missile = obs as MissileObstacle;
        if (missile.state === 'WARNING') {
          missile.warningTimer -= dt;
          // Softly track player Y during warning
          missile.targetY += (playerY - missile.targetY) * Math.min(1, dt * 2.5);
          missile.y = missile.targetY;
          missile.x = CANVAS_VIRTUAL_WIDTH - 50;

          if (missile.warningTimer <= 0) {
            missile.state = 'LAUNCHED';
            onMissileLaunch();
          }
        } else if (missile.state === 'LAUNCHED') {
          // Rockets travel faster than world scroll
          missile.x -= (scrollSpeed + missile.speed) * dt;
          missile.hitbox = {
            left: missile.x + 8,
            top: missile.y - 12,
            right: missile.x + 50,
            bottom: missile.y + 12,
            width: 42,
            height: 24,
          };
        }
      } else {
        // Zappers scroll with world
        obs.x -= scrollSpeed * dt;

        if (obs.type === 'zapper_rotating' && obs.rotationSpeed) {
          obs.angle += obs.rotationSpeed * dt;
        }

        // Update bounding box
        this.updateZapperHitbox(obs);
      }

      // Despawn if off-screen to the left
      if (obs.x < -140) {
        this.obstacles.splice(i, 1);
      }
    }

    // 2. Move coins
    for (let i = this.coins.length - 1; i >= 0; i--) {
      const coin = this.coins[i];
      coin.x -= scrollSpeed * dt;
      if (coin.x < -40) {
        this.coins.splice(i, 1);
      }
    }

    // 3. Spawning timers scaled dynamically by distance traveled
    this.spawnCooldown -= dt;
    if (this.spawnCooldown <= 0) {
      this.spawnPattern();
      this.spawnCooldown = difficulty.spawnCooldown;
    }

    // Missile spawn timer scaled dynamically by distance traveled
    this.missileCooldown -= dt;
    if (this.missileCooldown <= 0) {
      this.spawnMissile(playerY);
      onMissileWarning();
      this.missileCooldown = difficulty.missileCooldown + Math.random() * 1.5;
    }
  }

  private updateZapperHitbox(obs: ZapperObstacle) {
    const halfLen = obs.length / 2;
    if (obs.type === 'zapper_horizontal') {
      obs.hitbox = {
        left: obs.x - halfLen,
        top: obs.y - 14,
        right: obs.x + halfLen,
        bottom: obs.y + 14,
        width: obs.length,
        height: 28,
      };
    } else if (obs.type === 'zapper_vertical') {
      obs.hitbox = {
        left: obs.x - 14,
        top: obs.y - halfLen,
        right: obs.x + 14,
        bottom: obs.y + halfLen,
        width: 28,
        height: obs.length,
      };
    } else {
      // Diagonal or Rotating
      const rad = obs.angle;
      const cos = Math.abs(Math.cos(rad));
      const sin = Math.abs(Math.sin(rad));
      const w = obs.length * cos + 24 * sin;
      const h = obs.length * sin + 24 * cos;
      obs.hitbox = {
        left: obs.x - w / 2,
        top: obs.y - h / 2,
        right: obs.x + w / 2,
        bottom: obs.y + h / 2,
        width: w,
        height: h,
      };
    }
  }

  private spawnPattern() {
    const patternType = Math.floor(Math.random() * 6);
    const startX = CANVAS_VIRTUAL_WIDTH + 80;

    switch (patternType) {
      case 0: {
        // High or low horizontal zapper
        const y = Math.random() > 0.5 ? PLAYABLE_TOP + 65 : PLAYABLE_BOTTOM - 85;
        this.addZapper('zapper_horizontal', startX, y, 0, 110);
        this.spawnCoinArc(startX, y === PLAYABLE_TOP + 65 ? PLAYABLE_BOTTOM - 90 : PLAYABLE_TOP + 80, 5);
        break;
      }
      case 1: {
        // Mid vertical zapper
        const y = (PLAYABLE_TOP + PLAYABLE_BOTTOM) / 2;
        this.addZapper('zapper_vertical', startX, y, 0, 130);
        // Coins either top or bottom
        this.spawnCoinArc(startX + 140, PLAYABLE_TOP + 70, 4);
        break;
      }
      case 2: {
        // Diagonal zapper (45 deg)
        const y = (PLAYABLE_TOP + PLAYABLE_BOTTOM) / 2 + (Math.random() - 0.5) * 60;
        this.addZapper('zapper_diagonal', startX, y, Math.PI / 4, 130);
        this.spawnCoinArc(startX + 120, (PLAYABLE_TOP + PLAYABLE_BOTTOM) / 2, 6);
        break;
      }
      case 3: {
        // Rotating spinner zapper
        const y = (PLAYABLE_TOP + PLAYABLE_BOTTOM) / 2 + (Math.random() - 0.5) * 80;
        const obs: ZapperObstacle = {
          id: this.nextObstacleId++,
          type: 'zapper_rotating',
          x: startX,
          y,
          width: 120,
          height: 120,
          length: 120,
          angle: 0,
          rotationSpeed: 1.4, // rad/sec
          hitbox: { left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0 },
        };
        this.updateZapperHitbox(obs);
        this.obstacles.push(obs);
        break;
      }
      case 4: {
        // Double hurdle (one top, one bottom, offset)
        this.addZapper('zapper_horizontal', startX, PLAYABLE_TOP + 55, 0, 100);
        this.addZapper('zapper_horizontal', startX + 160, PLAYABLE_BOTTOM - 60, 0, 100);
        this.spawnCoinArc(startX + 80, (PLAYABLE_TOP + PLAYABLE_BOTTOM) / 2, 5);
        break;
      }
      case 5: {
        // Coin cluster paradise
        this.spawnCoinGrid(startX, (PLAYABLE_TOP + PLAYABLE_BOTTOM) / 2 - 40, 4, 3);
        break;
      }
    }
  }

  private addZapper(
    type: 'zapper_horizontal' | 'zapper_vertical' | 'zapper_diagonal',
    x: number,
    y: number,
    angle: number,
    length: number
  ) {
    const obs: ZapperObstacle = {
      id: this.nextObstacleId++,
      type,
      x,
      y,
      width: length,
      height: 30,
      length,
      angle,
      hitbox: { left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0 },
    };
    this.updateZapperHitbox(obs);
    this.obstacles.push(obs);
  }

  private spawnMissile(playerY: number) {
    const obs: MissileObstacle = {
      id: this.nextObstacleId++,
      type: 'missile',
      x: CANVAS_VIRTUAL_WIDTH - 50,
      y: playerY,
      targetY: playerY,
      width: 44,
      height: 22,
      warningTimer: 1.8,
      speed: 220, // extra speed over scroll - fair and reactable
      trailTimer: 0,
      state: 'WARNING',
      hitbox: {
        left: CANVAS_VIRTUAL_WIDTH - 50,
        top: playerY - 11,
        right: CANVAS_VIRTUAL_WIDTH - 6,
        bottom: playerY + 11,
        width: 44,
        height: 22,
      },
    };
    this.obstacles.push(obs);
  }

  private spawnCoinArc(startX: number, centerY: number, count: number) {
    const spacing = 36;
    for (let i = 0; i < count; i++) {
      const offsetX = i * spacing;
      const offsetY = Math.sin((i / (count - 1)) * Math.PI) * -35;
      this.coins.push({
        id: this.nextCoinId++,
        x: startX + offsetX,
        y: centerY + offsetY,
        radius: 10,
        collected: false,
        value: 1,
      });
    }
  }

  private spawnCoinGrid(startX: number, startY: number, cols: number, rows: number) {
    const spacing = 28;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        this.coins.push({
          id: this.nextCoinId++,
          x: startX + c * spacing,
          y: startY + r * spacing,
          radius: 9,
          collected: false,
          value: 1,
        });
      }
    }
  }
}
