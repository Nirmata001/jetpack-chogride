/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BoundingBox, CharacterDef, Coin, MissileObstacle, ZapperObstacle } from '../types/game';
import { CANVAS_VIRTUAL_HEIGHT, CANVAS_VIRTUAL_WIDTH, CEILING_HEIGHT, FLOOR_HEIGHT, PLAYABLE_BOTTOM, PLAYABLE_TOP } from './constants';

export class GameRenderer {
  private cachedBgGrad: CanvasGradient | null = null;
  private cachedDepthHaze: CanvasGradient | null = null;
  private cachedVignetteGrad: CanvasGradient | null = null;
  private cachedCeilGrad: CanvasGradient | null = null;
  private cachedFloorGrad: CanvasGradient | null = null;
  private cachedFloorGlow: CanvasGradient | null = null;
  private cachedBeamGrad: CanvasGradient | null = null;
  private cachedChogTorsoGrad: CanvasGradient | null = null;
  private cachedChogQuillGrad: CanvasGradient | null = null;
  private cachedChogFaceGrad: CanvasGradient | null = null;
  private cachedCanGrad: CanvasGradient | null = null;
  private cachedZapperBeamGrad: CanvasGradient | null = null;

  constructor() {}

  public renderBackground(
    ctx: CanvasRenderingContext2D,
    distanceTraveled: number,
    animTime: number,
    playerX: number = 140,
    playerY: number = PLAYABLE_BOTTOM - 52,
    isFiring: boolean = false
  ) {
    // 1. Structural Back-Wall & Continuous Floor-to-Ceiling Load-Bearing Pillars (Speed 0.1)
    this.render3DLabWallAndPillars(ctx, distanceTraveled, animTime);

    // 2. Far Industrial Catwalks with Cantilever Trusses & Overhead Monorail (Speed 0.22)
    this.renderFarLabLayer(ctx, distanceTraveled, animTime);

    // 3. Volumetric Light Beams (Atmospheric depth separation)
    this.renderVolumetricLightBeams(ctx, distanceTraveled, animTime);

    // 4. Midground: Fully-Interconnected Continuous Piping Network, Grounded Mutagen Pods & Workstations (Speed 0.5)
    this.renderMidground3DLab(ctx, distanceTraveled, animTime, playerX, playerY, isFiring);

    // 5. Ground-Level Cartoon Scientists Running & Panicking on Catwalk Floor (Speed 0.85)
    this.renderLabFloorScientists(ctx, distanceTraveled, animTime, playerX, playerY, isFiring);

    // 6. Foreground: 3D High-Gloss Perspective Floor with Reflections & Ceiling Girders (Speed 1.0)
    this.render3DCeilingAndFloor(ctx, distanceTraveled, animTime);

    // 8. Cinematic Lab Vignette & Ambient Occlusion
    this.renderCinematicVignette(ctx);
  }

  /**
   * Layer 1: Futuristic 3D Lab Wall & Continuous Floor-to-Ceiling Structural Columns
   * Fully anchored from ceiling girder (y=44) to floor bedrock (y=476). No floating elements!
   */
  private render3DLabWallAndPillars(
    ctx: CanvasRenderingContext2D,
    distanceTraveled: number,
    animTime: number
  ) {
    // Base Laboratory Wall gradient with atmospheric distance haze
    if (!this.cachedBgGrad) {
      this.cachedBgGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_VIRTUAL_HEIGHT);
      this.cachedBgGrad.addColorStop(0, '#060e1a');
      this.cachedBgGrad.addColorStop(0.35, '#0b1626');
      this.cachedBgGrad.addColorStop(0.7, '#0d1b30');
      this.cachedBgGrad.addColorStop(1, '#040914');
    }
    ctx.fillStyle = this.cachedBgGrad;
    ctx.fillRect(0, 0, CANVAS_VIRTUAL_WIDTH, CANVAS_VIRTUAL_HEIGHT);

    // Atmospheric Depth Haze (pushes columns further back into distant perspective)
    if (!this.cachedDepthHaze) {
      this.cachedDepthHaze = ctx.createLinearGradient(0, CEILING_HEIGHT, 0, PLAYABLE_BOTTOM);
      this.cachedDepthHaze.addColorStop(0, 'rgba(3, 7, 18, 0.45)');
      this.cachedDepthHaze.addColorStop(0.5, 'rgba(3, 7, 18, 0.15)');
      this.cachedDepthHaze.addColorStop(1, 'rgba(3, 7, 18, 0.55)');
    }
    ctx.fillStyle = this.cachedDepthHaze;
    ctx.fillRect(0, CEILING_HEIGHT, CANVAS_VIRTUAL_WIDTH, PLAYABLE_BOTTOM - CEILING_HEIGHT);

    // Seamless back wall plating spanning cleanly between ceiling and floor
    const wallHeight = PLAYABLE_BOTTOM - CEILING_HEIGHT;
    const panelInterval = 280;
    const panelOffset = (distanceTraveled * 0.1) % panelInterval;

    ctx.save();
    for (let x = -panelOffset; x < CANVAS_VIRTUAL_WIDTH + panelInterval; x += panelInterval) {
      const panelIndex = Math.floor((x + distanceTraveled * 0.1) / panelInterval);

      // 1. Recessed Wall Bay Panel (fills completely between ceiling and floor)
      ctx.fillStyle = '#13243d';
      ctx.fillRect(x, CEILING_HEIGHT, panelInterval, wallHeight);

      // Horizontal reinforcement seams across wall bay
      ctx.strokeStyle = '#0b1626';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, CEILING_HEIGHT + 130);
      ctx.lineTo(x + panelInterval, CEILING_HEIGHT + 130);
      ctx.moveTo(x, CEILING_HEIGHT + 270);
      ctx.lineTo(x + panelInterval, CEILING_HEIGHT + 270);
      ctx.stroke();

      // Recessed Wall Rivets
      ctx.fillStyle = '#3a5882';
      for (let rx = x + 30; rx < x + panelInterval - 20; rx += 45) {
        ctx.beginPath();
        ctx.arc(rx, CEILING_HEIGHT + 130, 2, 0, Math.PI * 2);
        ctx.arc(rx, CEILING_HEIGHT + 270, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      // 2. Alternating Wall Architectural Features
      if (Math.abs(panelIndex) % 2 === 0) {
        // Feature A: Subterranean Particle Accelerator Observation Chamber
        this.renderReactorObservationWindow(ctx, x + 30, CEILING_HEIGHT + 45, 195, 140, animTime);
      } else {
        // Feature B: Server Mainframe with Round Ventilation Cavity & Status LEDs
        this.renderMainframeServerRack(ctx, x + 30, CEILING_HEIGHT + 45, 195, 140, animTime);
      }

      // 3. MASSIVE 3D LOAD-BEARING STRUCTURAL COLUMN (Runs Ceiling-to-Floor!)
      const colX = x + panelInterval - 28;
      const colW = 56;

      // Heavy Flared Ceiling Column Capital (Anchors into overhead I-beam)
      const capGrad = ctx.createLinearGradient(colX - 8, CEILING_HEIGHT, colX + colW + 8, CEILING_HEIGHT);
      capGrad.addColorStop(0, '#2b4468');
      capGrad.addColorStop(0.5, '#476994');
      capGrad.addColorStop(1, '#15243b');
      ctx.fillStyle = capGrad;
      ctx.beginPath();
      ctx.moveTo(colX - 8, CEILING_HEIGHT);
      ctx.lineTo(colX + colW + 8, CEILING_HEIGHT);
      ctx.lineTo(colX + colW, CEILING_HEIGHT + 16);
      ctx.lineTo(colX, CEILING_HEIGHT + 16);
      ctx.closePath();
      ctx.fill();

      // Gusset Bolts on Ceiling Capital
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.arc(colX - 3, CEILING_HEIGHT + 6, 2.5, 0, Math.PI * 2);
      ctx.arc(colX + colW + 3, CEILING_HEIGHT + 6, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Main Vertical Column Shaft (From ceiling capital to floor base)
      const shaftY = CEILING_HEIGHT + 16;
      const shaftH = PLAYABLE_BOTTOM - 20 - shaftY;
      const shaftGrad = ctx.createLinearGradient(colX, shaftY, colX + colW, shaftY);
      shaftGrad.addColorStop(0, '#36537c'); // Bright left bevel highlight
      shaftGrad.addColorStop(0.18, '#243b5c');
      shaftGrad.addColorStop(0.7, '#1b2d47');
      shaftGrad.addColorStop(1, '#091322'); // Deep right shadow
      ctx.fillStyle = shaftGrad;
      ctx.fillRect(colX, shaftY, colW, shaftH);

      // Recessed Central Groove down the column
      ctx.fillStyle = '#0f1c2e';
      ctx.fillRect(colX + 22, shaftY, 12, shaftH);

      // Structural Rivet Columns
      ctx.fillStyle = '#64748b';
      for (let ry = shaftY + 16; ry < shaftY + shaftH - 10; ry += 36) {
        ctx.beginPath();
        ctx.arc(colX + 11, ry, 2, 0, Math.PI * 2);
        ctx.arc(colX + colW - 11, ry, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Yellow/Black Hazard Chevrons on Column Waist
      const hazardY = shaftY + shaftH / 2 - 14;
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(colX, hazardY, colW, 28);
      ctx.fillStyle = '#000000';
      for (let s = colX - 10; s < colX + colW + 10; s += 14) {
        ctx.beginPath();
        ctx.moveTo(s, hazardY);
        ctx.lineTo(s + 8, hazardY);
        ctx.lineTo(s - 4, hazardY + 28);
        ctx.lineTo(s - 12, hazardY + 28);
        ctx.closePath();
        ctx.fill();
      }

      // Heavy Flared Floor Base Plinth (Bolts solidly into the floor foundation!)
      const baseGrad = ctx.createLinearGradient(colX - 8, PLAYABLE_BOTTOM - 20, colX + colW + 8, PLAYABLE_BOTTOM);
      baseGrad.addColorStop(0, '#3a5982');
      baseGrad.addColorStop(0.5, '#4f74a3');
      baseGrad.addColorStop(1, '#111d2e');
      ctx.fillStyle = baseGrad;
      ctx.beginPath();
      ctx.moveTo(colX, PLAYABLE_BOTTOM - 20);
      ctx.lineTo(colX + colW, PLAYABLE_BOTTOM - 20);
      ctx.lineTo(colX + colW + 8, PLAYABLE_BOTTOM);
      ctx.lineTo(colX - 8, PLAYABLE_BOTTOM);
      ctx.closePath();
      ctx.fill();

      // Heavy Floor Anchor Bolts
      ctx.fillStyle = '#cbd5e1';
      ctx.beginPath();
      ctx.arc(colX - 3, PLAYABLE_BOTTOM - 8, 3, 0, Math.PI * 2);
      ctx.arc(colX + colW + 3, PLAYABLE_BOTTOM - 8, 3, 0, Math.PI * 2);
      ctx.arc(colX + colW / 2, PLAYABLE_BOTTOM - 8, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#091322';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    ctx.restore();
  }

  /**
   * Reinforced Window looking out into Subterranean Particle Accelerator
   */
  private renderReactorObservationWindow(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    animTime: number
  ) {
    ctx.save();
    // Heavy Steel Window Frame
    ctx.fillStyle = '#0a1424';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#2d4d7a';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(x, y, w, h);

    // Deep Reactor Pit Glass
    const pitGrad = ctx.createLinearGradient(x, y, x, y + h);
    pitGrad.addColorStop(0, '#040d1a');
    pitGrad.addColorStop(0.5, '#07203b');
    pitGrad.addColorStop(1, '#020914');
    ctx.fillStyle = pitGrad;
    ctx.fillRect(x + 4, y + 4, w - 8, h - 8);

    // Rotating 3D Particle Accelerator Rings
    const cx = x + w / 2;
    const cy = y + h / 2;
    for (let r = 0; r < 3; r++) {
      const radiusX = 35 + r * 22;
      const radiusY = 12 + r * 8;
      ctx.strokeStyle = r === 1 ? 'rgba(56, 189, 248, 0.7)' : 'rgba(14, 165, 233, 0.35)';
      ctx.lineWidth = r === 1 ? 2 : 1;
      ctx.beginPath();
      ctx.ellipse(cx, cy, radiusX, radiusY, Math.PI / 12, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Glass Reflection Sheen Arc
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x + 10, y + h - 10);
    ctx.lineTo(x + w - 10, y + 10);
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 8px monospace';
    ctx.fillText('CHOG BIO-SYNTHESIS // CHAMBER 09', x + 10, y + 16);

    ctx.restore();
  }

  /**
   * Mainframe Server Bay Cabinet with Ventilation Fan & Status LEDs
   */
  private renderMainframeServerRack(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    animTime: number
  ) {
    ctx.save();
    ctx.fillStyle = '#0d182b';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#223854';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);

    const fanX = x + w / 2;
    const fanY = y + 42;
    const fanR = 28;

    ctx.fillStyle = '#060d17';
    ctx.beginPath();
    ctx.arc(fanX, fanY, fanR, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#3a5882';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    const fanGlow = ctx.createRadialGradient(fanX, fanY, 4, fanX, fanY, fanR);
    fanGlow.addColorStop(0, 'rgba(56, 189, 248, 0.4)');
    fanGlow.addColorStop(1, 'rgba(56, 189, 248, 0)');
    ctx.fillStyle = fanGlow;
    ctx.beginPath();
    ctx.arc(fanX, fanY, fanR - 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.translate(fanX, fanY);
    ctx.rotate(animTime * 6);
    for (let b = 0; b < 4; b++) {
      ctx.rotate(Math.PI / 2);
      ctx.fillStyle = '#476994';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(8, -20);
      ctx.lineTo(-4, -22);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.arc(0, 0, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.strokeStyle = '#1e3352';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(fanX - fanR + 3, fanY);
    ctx.lineTo(fanX + fanR - 3, fanY);
    ctx.moveTo(fanX, fanY - fanR + 3);
    ctx.lineTo(fanX, fanY + fanR - 3);
    ctx.stroke();

    const slotY = y + 80;
    for (let row = 0; row < 3; row++) {
      const sy = slotY + row * 16;
      ctx.fillStyle = '#162844';
      ctx.fillRect(x + 12, sy, w - 24, 11);

      for (let col = 0; col < 8; col++) {
        const lx = x + 20 + col * 18;
        const isActive = (col + row) % 3 === 0;
        ctx.fillStyle = isActive ? '#38bdf8' : '#1e3352';
        ctx.beginPath();
        ctx.arc(lx, sy + 5.5, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  /**
   * Layer 2: Distant Catwalks with Cantilever Structural Trusses & Overhead Monorail
   * Fully supported with triangular steel brackets and ceiling drop-hangers.
   */
  private renderFarLabLayer(
    ctx: CanvasRenderingContext2D,
    distanceTraveled: number,
    animTime: number
  ) {
    const farOffset = (distanceTraveled * 0.22) % 520;
    ctx.save();

    for (let x = -farOffset; x < CANVAS_VIRTUAL_WIDTH + 520; x += 520) {
      const catwalkY = PLAYABLE_TOP + 175;

      // 1. Triangular Cantilever Support Brackets (Bolts catwalk to the wall columns!)
      ctx.fillStyle = '#1e324f';
      ctx.strokeStyle = '#3d618f';
      ctx.lineWidth = 2;
      for (let bx = x + 40; bx < x + 520; bx += 130) {
        ctx.beginPath();
        ctx.moveTo(bx, catwalkY);
        ctx.lineTo(bx + 26, catwalkY);
        ctx.lineTo(bx, catwalkY + 36);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        // Bolt circle
        ctx.fillStyle = '#cbd5e1';
        ctx.beginPath();
        ctx.arc(bx + 6, catwalkY + 28, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      // 2. Ceiling Drop-Tension Rods (Supports catwalk from the ceiling girder)
      ctx.strokeStyle = '#2d4d7a';
      ctx.lineWidth = 2;
      for (let rx = x + 105; rx < x + 520; rx += 260) {
        ctx.beginPath();
        ctx.moveTo(rx, CEILING_HEIGHT);
        ctx.lineTo(rx, catwalkY - 26);
        ctx.stroke();
      }

      // 3. Catwalk Railings
      ctx.strokeStyle = '#2d4d7a';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(x, catwalkY - 26);
      ctx.lineTo(x + 520, catwalkY - 26);
      ctx.moveTo(x, catwalkY - 14);
      ctx.lineTo(x + 520, catwalkY - 14);
      ctx.stroke();

      // Railing Stanchions
      for (let sx = x; sx < x + 520; sx += 44) {
        ctx.beginPath();
        ctx.moveTo(sx, catwalkY - 26);
        ctx.lineTo(sx, catwalkY);
        ctx.stroke();
      }

      // Catwalk Platform Slab
      ctx.fillStyle = '#1b2d49';
      ctx.fillRect(x, catwalkY, 520, 8);
      ctx.fillStyle = '#0f192b';
      ctx.fillRect(x, catwalkY + 8, 520, 4);

      // Catwalk Supercomputer Workstations & Actively Working Scientists
      this.renderCatwalkSupercomputerStation(ctx, x + 160, catwalkY - 2, animTime, false);
      this.renderCatwalkSupercomputerStation(ctx, x + 380, catwalkY - 2, animTime, true);

      // 4. Overhead Monorail Track suspended with heavy drop brackets
      const railY = PLAYABLE_TOP + 18;
      ctx.strokeStyle = '#334e75';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x, railY);
      ctx.lineTo(x + 520, railY);
      ctx.stroke();

      // Ceiling drop brackets for monorail
      ctx.fillStyle = '#1e324f';
      for (let mx = x + 20; mx < x + 520; mx += 100) {
        ctx.fillRect(mx - 3, CEILING_HEIGHT, 6, railY - CEILING_HEIGHT);
      }

      // Suspended Robotic Claw moving along monorail
      const clawX = x + 240 + Math.sin(animTime * 1.5) * 70;
      ctx.fillStyle = '#476994';
      ctx.fillRect(clawX - 8, railY, 16, 12);
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(clawX, railY + 12);
      ctx.lineTo(clawX, railY + 28);
      ctx.stroke();

      // Glowing Radioactive Isotope Container held by claw
      ctx.fillStyle = '#064e3b';
      ctx.fillRect(clawX - 10, railY + 28, 20, 16);
      ctx.fillStyle = '#10b981';
      ctx.fillRect(clawX - 7, railY + 31, 14, 10);
      ctx.fillStyle = '#34d399';
      ctx.beginPath();
      ctx.arc(clawX, railY + 36, 3, 0, Math.PI * 2);
      ctx.fill();

      // 5. 3D Cartoon Hazard Warning Plate
      const signX = x + 50;
      const signY = PLAYABLE_TOP + 40;
      ctx.fillStyle = '#0c1626';
      ctx.fillRect(signX, signY, 140, 44);
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(signX, signY, 140, 44);

      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(signX + 2, signY + 2, 136, 8);
      ctx.fillStyle = '#000000';
      for (let h = 0; h < 130; h += 16) {
        ctx.beginPath();
        ctx.moveTo(signX + 6 + h, signY + 2);
        ctx.lineTo(signX + 14 + h, signY + 2);
        ctx.lineTo(signX + 6 + h, signY + 10);
        ctx.closePath();
        ctx.fill();
      }

      ctx.fillStyle = '#fde047';
      ctx.font = 'bold 8px "Chakra Petch", sans-serif';
      ctx.fillText('CHOG RESEARCH BIO-FACILITY', signX + 8, signY + 24);
      ctx.fillStyle = '#f87171';
      ctx.font = 'bold 7.5px monospace';
      ctx.fillText('⚠️ ALERT: SUBJECT 01 ESCAPED', signX + 8, signY + 38);
    }
    ctx.restore();
  }

  /**
   * Catwalk Supercomputer Station with Actively Working Scientist
   */
  private renderCatwalkSupercomputerStation(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    animTime: number,
    flipped: boolean = false
  ) {
    ctx.save();
    ctx.translate(x, y);
    if (flipped) ctx.scale(-1, 1);

    // 1. Catwalk Terminal Console Chassis
    ctx.fillStyle = '#162844';
    ctx.fillRect(4, -34, 24, 34);
    ctx.strokeStyle = '#2d4d7a';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(4, -34, 24, 34);

    // Glowing Supercomputer Screen (Phosphor Cyan)
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(6, -32, 20, 16);
    ctx.fillStyle = '#38bdf8';
    const scanline = (animTime * 14) % 13;
    ctx.fillRect(7, -31 + scanline, 18, 2);

    // Blinking Server Status LEDs
    for (let l = 0; l < 3; l++) {
      ctx.fillStyle = (Math.floor(animTime * 4) + l) % 2 === 0 ? '#34d399' : '#0f172a';
      ctx.fillRect(7 + l * 6, -13, 3.5, 3.5);
    }

    // Console Keyboard Shelf
    ctx.fillStyle = '#223854';
    ctx.fillRect(0, -9, 14, 3);

    // 2. Actively Working Scientist
    ctx.fillStyle = 'rgba(84, 130, 188, 0.88)';

    // Head with wild scientist hair
    ctx.beginPath();
    ctx.arc(-8, -22, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(-11, -24, 3.5, 0, Math.PI * 2);
    ctx.arc(-6, -25, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Lab coat body leaning eagerly toward supercomputer terminal
    ctx.beginPath();
    ctx.moveTo(-11, -17);
    ctx.lineTo(-4, -17);
    ctx.lineTo(-2, -4);
    ctx.lineTo(-13, -4);
    ctx.closePath();
    ctx.fill();

    // Legs
    ctx.fillRect(-11, -4, 3.5, 5);
    ctx.fillRect(-5, -4, 3.5, 5);

    // Actively Typing Arms & Hands on Keyboard Shelf!
    const typingOffset = Math.sin(animTime * 18) * 1.5;
    ctx.fillRect(-6, -14, 9, 3);
    ctx.fillRect(0, -12 + typingOffset, 6, 2.5);
    // Green illuminated keycap / stylus flash
    ctx.fillStyle = '#34d399';
    ctx.fillRect(5, -11 + typingOffset, 2.5, 2);

    ctx.restore();
  }

  /**
   * Layer 3: Midground 3D Laboratory Installations (Speed 0.5)
   * FULLY INTERCONNECTED & PHYSICALLY ANCHORED:
   * - Continuous overhead chemical pipe manifold running seamlessly across the ceiling with drop hangers.
   * - Branching elbow feed pipes connecting the overhead manifold into the cryogenic vats.
   * - Vats have heavy ceiling suspension mounts AND heavy steel pedestal foundations bolting flush into the floor!
   * - Drainage pipes exiting the vats into heavy floor drain grates.
   * - Supercomputer terminals sit solidly bolted onto the catwalk floor with cable bundles entering floor troughs.
   */
  private renderMidground3DLab(
    ctx: CanvasRenderingContext2D,
    distanceTraveled: number,
    animTime: number,
    playerX: number = 0,
    playerY: number = 0,
    isFiring: boolean = false
  ) {
    const midInterval = 720;
    const midOffset = (distanceTraveled * 0.5) % midInterval;
    ctx.save();

    // 1. CONTINUOUS OVERHEAD CHEMICAL CONDUIT MANIFOLD (Runs seamlessly across entire screen!)
    this.renderContinuousOverheadPipeManifold(ctx, distanceTraveled, animTime);

    // 2. Midground Installation Nodes (Vats, Drainage, Terminals)
    for (let x = -midOffset; x < CANVAS_VIRTUAL_WIDTH + midInterval; x += midInterval) {
      const worldIndex = Math.floor((x + distanceTraveled * 0.5) / midInterval);

      // --- INSTALLATION A: GIANT 3D CRYO MUTAGEN VAT (Green Liquid: Alternates Sleeping Chog vs Giant Eyeball) ---
      // Firmly anchored from ceiling girder down to floor catwalk foundation!
      const isChogA = Math.abs(worldIndex) % 2 === 0;
      const subjectA = 2 + (Math.abs(worldIndex) % 5);
      this.renderAnchoredMutagenVat(ctx, x + 80, animTime, 'green', isChogA ? 'chog' : 'eyeball', subjectA, playerX, playerY);

      // --- INSTALLATION B: HIGH-PRESSURE INTER-PIPE VALVE JUNCTION & STEAM VENT STACK ---
      this.renderPipeJunctionAndSteamStack(ctx, x + 230, animTime);

      // --- INSTALLATION C: FLOOR-MOUNTED 3D RETRO SUPERCOMPUTER WORKSTATION WITH ACTIVE WORKING SCIENTIST ---
      // Bolted directly onto the catwalk floor with active scientist typing furiously on console!
      this.renderFloorMountedSupercomputer(ctx, x + 400, animTime, playerX, playerY, isFiring);

      // --- INSTALLATION D: SECOND 3D CRYO MUTAGEN VAT (Cyan Liquid: Alternates Giant Eyeball vs Sleeping Chog) ---
      const isChogD = Math.abs(worldIndex) % 3 === 1;
      const subjectD = 3 + (Math.abs(worldIndex) % 4);
      this.renderAnchoredMutagenVat(ctx, x + 580, animTime, 'cyan', isChogD ? 'chog' : 'eyeball', subjectD, playerX, playerY);
    }

    // 3. Atmospheric Perspective Depth Separation between Midground Columns and Foreground Gameplay Plane
    const depthSeparation = ctx.createLinearGradient(0, CEILING_HEIGHT, 0, PLAYABLE_BOTTOM);
    depthSeparation.addColorStop(0, 'rgba(8, 16, 32, 0.28)');
    depthSeparation.addColorStop(0.5, 'rgba(6, 14, 28, 0.14)');
    depthSeparation.addColorStop(1, 'rgba(8, 16, 32, 0.32)');
    ctx.fillStyle = depthSeparation;
    ctx.fillRect(0, CEILING_HEIGHT, CANVAS_VIRTUAL_WIDTH, PLAYABLE_BOTTOM - CEILING_HEIGHT);

    ctx.restore();
  }

  /**
   * Continuous Overhead Chemical Conduit Manifold
   * Runs horizontally across the entire ceiling with heavy vertical steel hanger brackets every 120px.
   */
  private renderContinuousOverheadPipeManifold(
    ctx: CanvasRenderingContext2D,
    distanceTraveled: number,
    animTime: number
  ) {
    ctx.save();
    const pipeY = CEILING_HEIGHT + 22; // y = 66
    const pipeH = 18;

    // 1. Continuous Heavy Yellow Hazard Pipe spanning full virtual width
    const pipeGrad = ctx.createLinearGradient(0, pipeY, 0, pipeY + pipeH);
    pipeGrad.addColorStop(0, '#fef08a');
    pipeGrad.addColorStop(0.3, '#f59e0b');
    pipeGrad.addColorStop(0.75, '#b45309');
    pipeGrad.addColorStop(1, '#78350f');
    ctx.fillStyle = pipeGrad;
    ctx.fillRect(0, pipeY, CANVAS_VIRTUAL_WIDTH, pipeH);

    // 2. Heavy Ceiling Pipe Hanger Clamps (Anchors pipe securely up into ceiling girder at y=44)
    const hangerSpacing = 120;
    const hangerOffset = (distanceTraveled * 0.5) % hangerSpacing;

    for (let hx = -hangerOffset; hx < CANVAS_VIRTUAL_WIDTH + hangerSpacing; hx += hangerSpacing) {
      // Dual Vertical Threaded Steel Rods bolting into ceiling girder
      ctx.fillStyle = '#475569';
      ctx.fillRect(hx - 6, CEILING_HEIGHT, 3, pipeY - CEILING_HEIGHT + 2);
      ctx.fillRect(hx + 3, CEILING_HEIGHT, 3, pipeY - CEILING_HEIGHT + 2);

      // Ceiling Mounting Flange at y=44
      ctx.fillStyle = '#334155';
      ctx.fillRect(hx - 10, CEILING_HEIGHT, 20, 5);

      // Pipe Wrap-Around Heavy Clamp Collar
      ctx.fillStyle = '#334155';
      ctx.fillRect(hx - 8, pipeY - 3, 16, pipeH + 6);
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(hx - 8, pipeY - 3, 16, pipeH + 6);

      // Chrome Clamp Bolts
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.arc(hx, pipeY + 2, 2, 0, Math.PI * 2);
      ctx.arc(hx, pipeY + pipeH - 2, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  /**
   * Giant 3D Cryogenic Mutagen Containment Pod
   * FULLY ANCHORED & CONNECTED:
   * - Top: Connected via vertical steel suspension brackets to ceiling girder AND 90° elbow chemical feed pipe!
   * - Middle: Cylindrical glass chamber with bubbling mutagen and specimen.
   * - Bottom: Supported by a massive heavy steel pedestal foundation with anchor legs bolted into the floor at y=476!
   * - Base: Chemical drainage pipe exiting into a floor drain grate!
   */
  private renderAnchoredMutagenVat(
    ctx: CanvasRenderingContext2D,
    x: number,
    animTime: number,
    liquidTheme: 'green' | 'cyan' = 'green',
    specimen: 'chog' | 'eyeball' = 'chog',
    subjectId: number = 2,
    playerX: number = 0,
    playerY: number = 0
  ) {
    ctx.save();
    const w = 92;
    const topCapY = CEILING_HEIGHT + 44; // y = 88
    const topCapH = 26;
    const glassY = topCapY + topCapH;    // y = 114
    const glassH = 240;
    const bottomCapY = glassY + glassH;  // y = 354
    const bottomCapH = 26;               // ends at y = 380
    const pedestalBottom = PLAYABLE_BOTTOM; // y = 476 (FLUSH ON FLOOR!)
    const centerX = x + w / 2;
    const centerY = glassY + glassH / 2;

    // ================= 1. CEILING SUSPENSION & CHEMICAL FEED CONNECTION =================
    // A. Vertical Chemical Feed Pipe branching from overhead conduit (y=84) into Vat Top Cap (y=88)
    const feedPipeX = x + w / 2;
    const pipeGrad = ctx.createLinearGradient(feedPipeX - 8, 0, feedPipeX + 8, 0);
    pipeGrad.addColorStop(0, '#fef08a');
    pipeGrad.addColorStop(0.4, '#f59e0b');
    pipeGrad.addColorStop(1, '#b45309');
    ctx.fillStyle = pipeGrad;
    ctx.fillRect(feedPipeX - 8, CEILING_HEIGHT + 36, 16, topCapY - (CEILING_HEIGHT + 36));

    // Bolted Feed Flange on top cap
    ctx.fillStyle = '#475569';
    ctx.fillRect(feedPipeX - 14, topCapY - 6, 28, 6);
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(feedPipeX - 12, topCapY - 5, 4, 3);
    ctx.fillRect(feedPipeX + 8, topCapY - 5, 4, 3);

    // B. Heavy Structural Ceiling Suspension Girders (Left and Right)
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.5;
    // Left suspension bar
    ctx.fillRect(x + 8, CEILING_HEIGHT, 10, topCapY - CEILING_HEIGHT);
    ctx.strokeRect(x + 8, CEILING_HEIGHT, 10, topCapY - CEILING_HEIGHT);
    // Right suspension bar
    ctx.fillRect(x + w - 18, CEILING_HEIGHT, 10, topCapY - CEILING_HEIGHT);
    ctx.strokeRect(x + w - 18, CEILING_HEIGHT, 10, topCapY - CEILING_HEIGHT);

    // Ceiling Mount Plates at y=44
    ctx.fillStyle = '#334155';
    ctx.fillRect(x + 4, CEILING_HEIGHT, 18, 5);
    ctx.fillRect(x + w - 22, CEILING_HEIGHT, 18, 5);

    // ================= 2. VOLUMETRIC AURA & LIQUID CHAMBER =================
    // Volumetric Glow behind chamber
    const glowGrad = ctx.createRadialGradient(centerX, centerY, 20, centerX, centerY, w * 1.5);
    const auraColor = liquidTheme === 'green' ? 'rgba(34, 197, 94, 0.28)' : 'rgba(6, 182, 212, 0.28)';
    glowGrad.addColorStop(0, auraColor);
    glowGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glowGrad;
    ctx.fillRect(x - w / 2, glassY - 10, w * 2, glassH + 20);

    // Chamber Liquid
    const liqGrad = ctx.createLinearGradient(x, glassY, x + w, glassY);
    if (liquidTheme === 'green') {
      liqGrad.addColorStop(0, '#064e3b');
      liqGrad.addColorStop(0.3, '#10b981');
      liqGrad.addColorStop(0.7, '#34d399');
      liqGrad.addColorStop(1, '#047857');
    } else {
      liqGrad.addColorStop(0, '#083344');
      liqGrad.addColorStop(0.3, '#06b6d4');
      liqGrad.addColorStop(0.7, '#38bdf8');
      liqGrad.addColorStop(1, '#0e7490');
    }
    ctx.fillStyle = liqGrad;
    ctx.fillRect(x, glassY, w, glassH);

    // Rising Cartoon Bubbles
    for (let b = 0; b < 10; b++) {
      const bubbleSeed = (b * 47) % w;
      const bubbleSpeed = 45 + (b % 4) * 20;
      const bubbleY = glassY + glassH - ((animTime * bubbleSpeed + b * 38) % glassH);
      const bubbleX = x + 12 + (bubbleSeed * 0.75);
      const bubbleR = 2.5 + (b % 3) * 2;

      ctx.fillStyle = liquidTheme === 'green' ? 'rgba(167, 243, 208, 0.85)' : 'rgba(186, 230, 253, 0.85)';
      ctx.beginPath();
      ctx.arc(bubbleX, bubbleY, bubbleR, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(bubbleX - bubbleR * 0.35, bubbleY - bubbleR * 0.35, bubbleR * 0.35, 0, Math.PI * 2);
      ctx.fill();
    }

    // Specimen Floating Inside the Glass Column!
    if (specimen === 'chog') {
      this.renderSleepingChogSpecimen(ctx, centerX, centerY - 6, animTime, subjectId);
    } else {
      this.renderMutagenEyeballSpecimen(ctx, centerX, centerY, animTime, subjectId, playerX, playerY);
    }

    // 3D Curved Glass Shading
    const glassGrad = ctx.createLinearGradient(x, glassY, x + w, glassY);
    glassGrad.addColorStop(0, 'rgba(255, 255, 255, 0.35)');
    glassGrad.addColorStop(0.18, 'rgba(255, 255, 255, 0.05)');
    glassGrad.addColorStop(0.65, 'rgba(0, 0, 0, 0.15)');
    glassGrad.addColorStop(0.85, 'rgba(255, 255, 255, 0.45)');
    glassGrad.addColorStop(1, 'rgba(0, 0, 0, 0.3)');
    ctx.fillStyle = glassGrad;
    ctx.fillRect(x, glassY, w, glassH);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, glassY, w, glassH);

    // ================= 3. HEAVY 3D METALLIC CAPS (TOP & BOTTOM) =================
    this.render3DVatCap(ctx, x - 8, topCapY, w + 16, topCapH, true);
    this.render3DVatCap(ctx, x - 8, bottomCapY, w + 16, bottomCapH, false);

    // ================= 4. HEAVY STEEL FOUNDATION PEDESTAL (ANCHORED TO FLOOR) =================
    // Runs from bottom cap (y=380) straight down flush into floor at y=476!
    const pedTopY = bottomCapY + bottomCapH; // y = 380
    const pedH = pedestalBottom - pedTopY;   // 96px height down to floor

    // Massive A-Frame Support Legs
    const legW = 14;
    // Left Leg
    const legGradL = ctx.createLinearGradient(x - 8, pedTopY, x + 6, pedTopY);
    legGradL.addColorStop(0, '#475569');
    legGradL.addColorStop(0.5, '#64748b');
    legGradL.addColorStop(1, '#1e293b');
    ctx.fillStyle = legGradL;
    ctx.beginPath();
    ctx.moveTo(x + 2, pedTopY);
    ctx.lineTo(x + 16, pedTopY);
    ctx.lineTo(x - 4, pedestalBottom);
    ctx.lineTo(x - 18, pedestalBottom);
    ctx.closePath();
    ctx.fill();

    // Right Leg
    const legGradR = ctx.createLinearGradient(x + w - 6, pedTopY, x + w + 8, pedTopY);
    legGradR.addColorStop(0, '#334155');
    legGradR.addColorStop(0.5, '#475569');
    legGradR.addColorStop(1, '#0f172a');
    ctx.fillStyle = legGradR;
    ctx.beginPath();
    ctx.moveTo(x + w - 16, pedTopY);
    ctx.lineTo(x + w - 2, pedTopY);
    ctx.lineTo(x + w + 18, pedestalBottom);
    ctx.lineTo(x + w + 4, pedestalBottom);
    ctx.closePath();
    ctx.fill();

    // Heavy Horizontal Cross-Brace between legs
    ctx.fillStyle = '#334155';
    ctx.fillRect(x - 6, pedTopY + pedH * 0.45, w + 12, 10);
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1;
    ctx.strokeRect(x - 6, pedTopY + pedH * 0.45, w + 12, 10);

    // Steel Footplates Bolted into the Floor at y=476
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(x - 22, pedestalBottom - 8, 24, 8);
    ctx.fillRect(x + w - 2, pedestalBottom - 8, 24, 8);
    // Heavy Anchor Bolts
    ctx.fillStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.arc(x - 16, pedestalBottom - 4, 2.5, 0, Math.PI * 2);
    ctx.arc(x - 6, pedestalBottom - 4, 2.5, 0, Math.PI * 2);
    ctx.arc(x + w + 4, pedestalBottom - 4, 2.5, 0, Math.PI * 2);
    ctx.arc(x + w + 14, pedestalBottom - 4, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // ================= 5. CHEMICAL DRAINAGE CONDUIT TO FLOOR DRAIN =================
    // Thick pipe running from bottom cap straight down into floor drainage grate
    const drainX = x + w / 2;
    const drainGrad = ctx.createLinearGradient(drainX - 7, 0, drainX + 7, 0);
    drainGrad.addColorStop(0, '#475569');
    drainGrad.addColorStop(0.4, '#94a3b8');
    drainGrad.addColorStop(1, '#1e293b');
    ctx.fillStyle = drainGrad;
    ctx.fillRect(drainX - 7, pedTopY, 14, pedH);

    // Manual Drain Valve Wheel on pipe
    const valveY = pedTopY + 34;
    ctx.fillStyle = '#ef4444'; // Red industrial valve wheel
    ctx.beginPath();
    ctx.arc(drainX, valveY, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#991b1b';
    ctx.beginPath();
    ctx.arc(drainX, valveY, 4, 0, Math.PI * 2);
    ctx.fill();

    // Cast-Iron Floor Drain Grate at y=476
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(drainX - 16, pedestalBottom - 6, 32, 6);
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(drainX - 16, pedestalBottom - 6, 32, 6);
    // Grate drainage slots
    ctx.strokeStyle = '#020617';
    ctx.lineWidth = 2;
    for (let gx = drainX - 12; gx <= drainX + 12; gx += 6) {
      ctx.beginPath();
      ctx.moveTo(gx, pedestalBottom - 6);
      ctx.lineTo(gx, pedestalBottom);
      ctx.stroke();
    }

    ctx.restore();
  }

  /**
   * Chog Clone Floating in Cryogenic Mutagen Stasis
   * Suspended in zero-g amniotic mutagen with breathing bubbles,
   * purple quills, peach face, closed peaceful eyelashes, pink mittens & telemetry tag!
   */
  private renderSleepingChogSpecimen(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    animTime: number,
    subjectId: number
  ) {
    ctx.save();

    // Gentle buoyancy bob and rotational sway inside the liquid
    const bobY = Math.sin(animTime * 1.5 + subjectId * 1.7) * 7;
    const bobAngle = Math.sin(animTime * 1.1 + subjectId) * 0.08;
    ctx.translate(cx, cy + bobY);
    ctx.rotate(bobAngle);

    // 1. Soft Bioluminescent Specimen Halo
    const halo = ctx.createRadialGradient(0, 0, 4, 0, 0, 38);
    halo.addColorStop(0, 'rgba(168, 85, 247, 0.35)');
    halo.addColorStop(0.6, 'rgba(192, 132, 252, 0.15)');
    halo.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(0, 0, 38, 0, Math.PI * 2);
    ctx.fill();

    // 2. Translucent Stasis Neural Telemetry Headset / Crown
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(2, -15, 14, 5, -0.1, 0, Math.PI * 2);
    ctx.stroke();
    // Glowing sensor nodes
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(-8, -14, 2, 0, Math.PI * 2);
    ctx.arc(10, -16, 2, 0, Math.PI * 2);
    ctx.fill();

    // 3. Layered Purple Quills floating with fluid drag
    const quillSway = Math.sin(animTime * 2.2 + subjectId) * 1.5;
    const quillGrad = ctx.createLinearGradient(-26, -18, 12, 12);
    quillGrad.addColorStop(0, '#3b0764');
    quillGrad.addColorStop(0.3, '#581c87');
    quillGrad.addColorStop(0.7, '#7e22ce');
    quillGrad.addColorStop(1, '#a855f7');
    ctx.fillStyle = quillGrad;

    // Floating Quill Cluster
    ctx.beginPath();
    ctx.moveTo(8, -12);
    ctx.quadraticCurveTo(2, -22 + quillSway, -8, -20);
    ctx.lineTo(-20 + quillSway * 0.8, -15);
    ctx.lineTo(-12, -8);
    ctx.lineTo(-22 + quillSway * 0.6, -3);
    ctx.lineTo(-14, 2);
    ctx.lineTo(-24 + quillSway * 0.5, 7);
    ctx.lineTo(-12, 11);
    ctx.quadraticCurveTo(-2, 14, 6, 9);
    ctx.closePath();
    ctx.fill();

    // Vibrant Purple Quill Highlight Lines
    ctx.strokeStyle = '#c084fc';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(4, -14);
    ctx.quadraticCurveTo(-6, -18, -16, -14);
    ctx.moveTo(0, -6);
    ctx.quadraticCurveTo(-8, -7, -18, -2);
    ctx.moveTo(2, 2);
    ctx.quadraticCurveTo(-6, 3, -18, 6);
    ctx.stroke();

    // 4. Soft Purple Hedgehog Ear floating relaxed
    ctx.fillStyle = '#6d28d9';
    ctx.strokeStyle = '#3b0764';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-1, -15);
    ctx.quadraticCurveTo(-4, -22, 1, -20);
    ctx.quadraticCurveTo(5, -16, 3, -12);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Inner Pink Ear
    ctx.fillStyle = '#f472b6';
    ctx.beginPath();
    ctx.moveTo(0, -15);
    ctx.quadraticCurveTo(-2, -19, 1, -18);
    ctx.quadraticCurveTo(3, -15, 2, -13);
    ctx.closePath();
    ctx.fill();

    // 5. Cute Chibi Peach Face
    const faceGrad = ctx.createLinearGradient(0, -16, 12, 6);
    faceGrad.addColorStop(0, '#fff1e6');
    faceGrad.addColorStop(0.6, '#fed7aa');
    faceGrad.addColorStop(1, '#fde0c0');
    ctx.fillStyle = faceGrad;

    ctx.beginPath();
    ctx.moveTo(3, -16);
    ctx.quadraticCurveTo(8, -14, 11, -12);   // Forehead
    ctx.quadraticCurveTo(13, -10, 13.5, -9); // Tiny nose bump
    ctx.quadraticCurveTo(14, -5, 12, -2);    // Chubby cheek
    ctx.quadraticCurveTo(9, 2, 5, 2);        // Cute chin
    ctx.quadraticCurveTo(0, 1, -2, -3);      // Jawline
    ctx.quadraticCurveTo(-3, -10, 3, -16);
    ctx.closePath();
    ctx.fill();

    // Rosy Pink Cheek Blush
    ctx.fillStyle = 'rgba(244, 114, 182, 0.7)';
    ctx.beginPath();
    ctx.ellipse(10.5, -5, 3.2, 2.1, 0.05, 0, Math.PI * 2);
    ctx.fill();

    // Peaceful Sleeping Closed Eye & Curved Eyelashes (- U -)
    ctx.strokeStyle = '#312e81';
    ctx.lineWidth = 1.4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(8.5, -9, 3, 0.2, Math.PI * 0.85);
    ctx.stroke();
    // Tiny delicate lash tick
    ctx.beginPath();
    ctx.moveTo(11, -8);
    ctx.lineTo(12.5, -9.5);
    ctx.stroke();

    // Tiny sleeping mouth smile
    ctx.strokeStyle = '#4c1d95';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(7.5, -4, 1.8, 0.1, Math.PI * 0.7);
    ctx.stroke();

    // 6. Translucent Stasis Respirator Bubble / Oxygen Mask
    ctx.fillStyle = 'rgba(186, 230, 253, 0.35)';
    ctx.strokeStyle = 'rgba(125, 211, 252, 0.75)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(10.5, -5.5, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Tiny Oxygen Bubble floating up from respirator
    const respBubbleOffset = (animTime * 25 + subjectId * 15) % 45;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.beginPath();
    ctx.arc(12, -10 - respBubbleOffset, 1.8, 0, Math.PI * 2);
    ctx.fill();

    // 7. Curled Body, Little Purple Suit & Pink Mittens
    ctx.fillStyle = '#581c87';
    ctx.beginPath();
    ctx.ellipse(3, 4, 7, 6, 0.2, 0, Math.PI * 2);
    ctx.fill();

    // Pink Mittens curled together near chest
    ctx.fillStyle = '#ec4899';
    ctx.beginPath();
    ctx.arc(7, 2, 3.5, 0, Math.PI * 2);
    ctx.arc(3, 5, 3.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#be185d';
    ctx.beginPath();
    ctx.arc(8.5, 0.8, 1.4, 0, Math.PI * 2);
    ctx.fill();

    // Curled Little Legs & Boots
    ctx.fillStyle = '#4c1d95';
    ctx.fillRect(-2, 7, 5, 6);
    ctx.fillStyle = '#db2777'; // Pink boot
    ctx.beginPath();
    ctx.ellipse(1, 14, 4.5, 3, -0.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore(); // Exit rotation/translation for clean, horizontal readable tag

    // 8. Glowing Holographic Clone Specimen ID Badge
    ctx.save();
    const tagY = cy + 48;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.8)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(cx - 32, tagY, 64, 18, 4);
    ctx.fill();
    ctx.stroke();

    // Specimen Label Text
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 7px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`CHOG // SPEC-0${subjectId}`, cx, tagY + 8);

    // Heartbeat / Vital Pulse Graph
    ctx.strokeStyle = '#34d399';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - 24, tagY + 13);
    ctx.lineTo(cx - 8, tagY + 13);
    const pulseActive = Math.sin(animTime * 6 + subjectId) > 0.3;
    if (pulseActive) {
      ctx.lineTo(cx - 4, tagY + 9);
      ctx.lineTo(cx, tagY + 16);
      ctx.lineTo(cx + 4, tagY + 11);
    }
    ctx.lineTo(cx + 8, tagY + 13);
    ctx.lineTo(cx + 24, tagY + 13);
    ctx.stroke();

    // Blinking green vital LED
    ctx.fillStyle = Math.sin(animTime * 4 + subjectId) > 0 ? '#34d399' : '#065f46';
    ctx.beginPath();
    ctx.arc(cx + 26, tagY + 5, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  /**
   * Giant Mutagen Eyeball Specimen
   * A huge bio-engineered alien eyeball floating suspended in cryogenic mutagen,
   * with 3D spherical shading, red capillaries, glowing iris, player-tracking pupil,
   * trailing optic nerve tendrils, and live ocular telemetry!
   */
  private renderMutagenEyeballSpecimen(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    animTime: number,
    subjectId: number,
    playerX: number = 0,
    playerY: number = 0
  ) {
    ctx.save();

    // Gentle buoyancy floating bob & micro-sway
    const bobY = Math.sin(animTime * 1.5 + subjectId * 1.9) * 6;
    const bobAngle = Math.sin(animTime * 1.1 + subjectId) * 0.05;
    const eyeY = cy - 4 + bobY;

    // 1. Trailing Optic Nerve Bio-Tendrils / Tentacles below the eyeball
    ctx.save();
    const tendrilCount = 4;
    for (let t = 0; t < tendrilCount; t++) {
      const tOffsetX = (t - 1.5) * 6;
      const sway = Math.sin(animTime * 2.2 + t * 1.4 + subjectId) * 5;
      const tendrilGrad = ctx.createLinearGradient(cx, eyeY, cx + tOffsetX + sway, eyeY + 48);
      tendrilGrad.addColorStop(0, '#64748b');
      tendrilGrad.addColorStop(0.5, '#475569');
      tendrilGrad.addColorStop(1, 'rgba(30, 41, 59, 0)');

      ctx.strokeStyle = tendrilGrad;
      ctx.lineWidth = 2.4 - t * 0.3;
      ctx.beginPath();
      ctx.moveTo(cx + tOffsetX * 0.7, eyeY + 16);
      ctx.bezierCurveTo(
        cx + tOffsetX + sway * 0.6,
        eyeY + 28,
        cx + tOffsetX - sway * 0.8,
        eyeY + 38,
        cx + tOffsetX + sway,
        eyeY + 48 + t * 4
      );
      ctx.stroke();
    }
    ctx.restore();

    ctx.translate(cx, eyeY);
    ctx.rotate(bobAngle);

    // 2. Soft Bioluminescent Specimen Halo
    const halo = ctx.createRadialGradient(0, 0, 4, 0, 0, 36);
    halo.addColorStop(0, 'rgba(245, 158, 11, 0.25)');
    halo.addColorStop(0.6, 'rgba(234, 88, 12, 0.12)');
    halo.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(0, 0, 36, 0, Math.PI * 2);
    ctx.fill();

    // 3. Spherical 3D Eyeball Sclera (Radius 22)
    const eyeRadius = 22;
    const scleraGrad = ctx.createRadialGradient(-6, -6, 2, 0, 0, eyeRadius);
    scleraGrad.addColorStop(0, '#ffffff');
    scleraGrad.addColorStop(0.55, '#f1f5f9');
    scleraGrad.addColorStop(0.85, '#cbd5e1');
    scleraGrad.addColorStop(1, '#64748b');
    ctx.fillStyle = scleraGrad;
    ctx.beginPath();
    ctx.arc(0, 0, eyeRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Red Capillaries / Blood Vessels
    ctx.strokeStyle = 'rgba(220, 38, 38, 0.45)';
    ctx.lineWidth = 1;
    // Left blood vessel tree
    ctx.beginPath();
    ctx.moveTo(-eyeRadius + 2, -2);
    ctx.lineTo(-eyeRadius + 7, -4);
    ctx.lineTo(-eyeRadius + 12, -2);
    ctx.moveTo(-eyeRadius + 7, -4);
    ctx.lineTo(-eyeRadius + 10, -7);
    ctx.stroke();
    // Right blood vessel tree
    ctx.beginPath();
    ctx.moveTo(eyeRadius - 2, 1);
    ctx.lineTo(eyeRadius - 7, 3);
    ctx.lineTo(eyeRadius - 12, 1);
    ctx.moveTo(eyeRadius - 7, 3);
    ctx.lineTo(eyeRadius - 11, 6);
    ctx.stroke();

    // 4. Player Tracking Iris / Pupil
    // Calculate direction toward player
    const worldEyeX = cx;
    const worldEyeY = eyeY;
    const dx = playerX - worldEyeX;
    const dy = playerY - worldEyeY;
    const distToPlayer = Math.hypot(dx, dy);
    const maxLook = 6.5;
    const lookFactor = Math.min(maxLook, distToPlayer * 0.02);
    const angleToPlayer = Math.atan2(dy, dx);
    const pupilX = Math.cos(angleToPlayer) * lookFactor;
    const pupilY = Math.sin(angleToPlayer) * lookFactor;

    // Glowing Iris (Theme alternates: Golden Amber or Toxic Electric Cyan)
    const irisThemeAmber = subjectId % 2 === 0;
    const irisRadius = 11.5;

    ctx.save();
    ctx.translate(pupilX, pupilY);

    // Dark Limbal Ring
    ctx.strokeStyle = irisThemeAmber ? '#78350f' : '#0c4a6e';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, irisRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Iris Gradient Body
    const irisGrad = ctx.createRadialGradient(0, 0, 1, 0, 0, irisRadius);
    if (irisThemeAmber) {
      irisGrad.addColorStop(0, '#fef08a');
      irisGrad.addColorStop(0.35, '#f59e0b');
      irisGrad.addColorStop(0.8, '#d97706');
      irisGrad.addColorStop(1, '#78350f');
    } else {
      irisGrad.addColorStop(0, '#e0f2fe');
      irisGrad.addColorStop(0.35, '#38bdf8');
      irisGrad.addColorStop(0.8, '#0284c7');
      irisGrad.addColorStop(1, '#075985');
    }
    ctx.fillStyle = irisGrad;
    ctx.beginPath();
    ctx.arc(0, 0, irisRadius - 0.5, 0, Math.PI * 2);
    ctx.fill();

    // Radiating Striated Iris Muscle Strands
    ctx.strokeStyle = irisThemeAmber ? 'rgba(254, 240, 138, 0.45)' : 'rgba(224, 242, 254, 0.5)';
    ctx.lineWidth = 0.8;
    for (let s = 0; s < 10; s++) {
      const sa = (s / 10) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(sa) * 4, Math.sin(sa) * 4);
      ctx.lineTo(Math.cos(sa) * (irisRadius - 1), Math.sin(sa) * (irisRadius - 1));
      ctx.stroke();
    }

    // Dilating Pupil
    const pulsePupil = 4.8 + Math.sin(animTime * 3 + subjectId) * 0.6;
    ctx.fillStyle = '#09090b';
    ctx.beginPath();
    ctx.arc(0, 0, pulsePupil, 0, Math.PI * 2);
    ctx.fill();

    // Cornea Sparkle Glint / Reflection Highlights
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-2.5, -2.5, 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(2, 2, 1.1, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Occasional Realistic Alien Blink / Twitch
    const blinkCycle = (animTime * 0.45 + subjectId * 1.7) % 5.0;
    if (blinkCycle < 0.22) {
      const blinkProgress = Math.sin((blinkCycle / 0.22) * Math.PI);
      const lidH = eyeRadius * 2 * blinkProgress;

      ctx.fillStyle = '#475569';
      // Upper lid sweeping down
      ctx.beginPath();
      ctx.arc(0, 0, eyeRadius + 0.5, Math.PI, 0);
      ctx.lineTo(eyeRadius, -eyeRadius + lidH);
      ctx.lineTo(-eyeRadius, -eyeRadius + lidH);
      ctx.closePath();
      ctx.fill();

      // Lower lid sweeping up
      ctx.beginPath();
      ctx.arc(0, 0, eyeRadius + 0.5, 0, Math.PI);
      ctx.lineTo(-eyeRadius, eyeRadius - lidH * 0.5);
      ctx.lineTo(eyeRadius, eyeRadius - lidH * 0.5);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore(); // Exit rotation & translation for clean horizontal tag

    // 5. Ocular Telemetry Status Plaque
    ctx.save();
    const tagY = cy + 48;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.strokeStyle = irisThemeAmber ? 'rgba(245, 158, 11, 0.75)' : 'rgba(56, 189, 248, 0.75)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(cx - 32, tagY, 64, 18, 4);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = irisThemeAmber ? '#fbbf24' : '#38bdf8';
    ctx.font = 'bold 7px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`OCULUS // SPEC-0${subjectId}`, cx, tagY + 8);

    // Neural tracking pupil focus status line
    ctx.strokeStyle = '#34d399';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - 24, tagY + 13);
    ctx.lineTo(cx - 8, tagY + 13);
    const trackingActive = distToPlayer < 240;
    if (trackingActive) {
      ctx.lineTo(cx - 4, tagY + 9);
      ctx.lineTo(cx, tagY + 16);
      ctx.lineTo(cx + 4, tagY + 11);
    }
    ctx.lineTo(cx + 8, tagY + 13);
    ctx.lineTo(cx + 24, tagY + 13);
    ctx.stroke();

    // Blinking eye tracking status LED
    ctx.fillStyle = trackingActive ? '#ef4444' : '#34d399';
    ctx.beginPath();
    ctx.arc(cx + 26, tagY + 5, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private render3DVatCap(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    isTop: boolean
  ) {
    const capGrad = ctx.createLinearGradient(x, y, x + w, y);
    capGrad.addColorStop(0, '#334155');
    capGrad.addColorStop(0.4, '#64748b');
    capGrad.addColorStop(0.7, '#94a3b8');
    capGrad.addColorStop(1, '#1e293b');
    ctx.fillStyle = capGrad;
    ctx.fillRect(x, y, w, h);

    ctx.fillStyle = isTop ? '#cbd5e1' : '#0f172a';
    ctx.fillRect(x, isTop ? y : y + h - 3, w, 3);

    ctx.fillStyle = '#e2e8f0';
    for (let bx = x + 10; bx < x + w - 6; bx += 18) {
      ctx.beginPath();
      ctx.arc(bx, y + h / 2, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  /**
   * High-Pressure Pipe Valve Junction & Steam Relief Chimney
   * Branching off the overhead conduit with pressure gauge and flanged steam blow-off stack.
   */
  private renderPipeJunctionAndSteamStack(
    ctx: CanvasRenderingContext2D,
    x: number,
    animTime: number
  ) {
    ctx.save();
    const pipeY = CEILING_HEIGHT + 22;

    // 1. Vertical Branch Riser Pipe connecting from overhead manifold down
    const riserH = 46;
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(x - 8, pipeY + 18, 16, riserH);

    // Bolted Joint Ring
    ctx.fillStyle = '#475569';
    ctx.fillRect(x - 12, pipeY + 18, 24, 6);

    // 2. Brass Pressure Dial Gauge
    const gaugeX = x + 24;
    const gaugeY = pipeY + 32;
    const gaugeR = 15;

    // Brass gauge body
    ctx.fillStyle = '#d97706';
    ctx.beginPath();
    ctx.arc(gaugeX, gaugeY, gaugeR, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fef3c7';
    ctx.beginPath();
    ctx.arc(gaugeX, gaugeY, gaugeR - 3, 0, Math.PI * 2);
    ctx.fill();

    // Connecting brass pipe nipple
    ctx.fillStyle = '#b45309';
    ctx.fillRect(x + 8, gaugeY - 3, 6, 6);

    // Needle
    const needleAngle = Math.sin(animTime * 12) * 0.4 + 0.3;
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(gaugeX, gaugeY);
    ctx.lineTo(gaugeX + Math.sin(needleAngle) * 10, gaugeY - Math.cos(needleAngle) * 10);
    ctx.stroke();

    // 3. Steam Blow-Off Relief Chimney (Venting pressurized cartoon steam clouds!)
    const chimneyY = pipeY + 18 + riserH;
    ctx.fillStyle = '#334155';
    ctx.fillRect(x - 12, chimneyY, 24, 14);
    // Flanged exhaust lip
    ctx.fillStyle = '#64748b';
    ctx.fillRect(x - 15, chimneyY + 14, 30, 4);

    const steamCycle = (animTime * 1.8) % 2.0;
    if (steamCycle < 0.8) {
      const steamAlpha = (1.0 - steamCycle / 0.8) * 0.7;
      ctx.fillStyle = `rgba(241, 245, 249, ${steamAlpha})`;
      for (let p = 0; p < 4; p++) {
        const puffX = x + p * 5 + steamCycle * 22;
        const puffY = chimneyY + 18 + p * 6 + steamCycle * 18;
        const puffR = 6 + p * 4 + steamCycle * 12;
        ctx.beginPath();
        ctx.arc(puffX, puffY, puffR, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  /**
   * Floor-Mounted 3D Retro Supercomputer Workstation with Actively Working Scientist
   * Sits flush on the catwalk floor at y=476 with heavy mounting feet & floor cable troughs!
   */
  private renderFloorMountedSupercomputer(
    ctx: CanvasRenderingContext2D,
    x: number,
    animTime: number,
    playerX: number = 0,
    playerY: number = 0,
    isFiring: boolean = false
  ) {
    ctx.save();
    const deskW = 140;
    const deskH = 110;
    const deskY = PLAYABLE_BOTTOM - deskH; // Flush with floor at y=476!

    // 1. Desk Base Body with 3D Bevels
    const deskGrad = ctx.createLinearGradient(x, deskY, x + deskW, deskY);
    deskGrad.addColorStop(0, '#1e293b');
    deskGrad.addColorStop(0.5, '#334155');
    deskGrad.addColorStop(1, '#0f172a');
    ctx.fillStyle = deskGrad;
    ctx.fillRect(x, deskY, deskW, deskH);

    // Beveled Worksurface Lip
    ctx.fillStyle = '#64748b';
    ctx.fillRect(x, deskY, deskW, 4);

    // 2. Heavy Floor Mounting Base Feet (Bolted firmly into floor catwalk at y=476!)
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(x - 4, PLAYABLE_BOTTOM - 8, 20, 8);
    ctx.fillRect(x + deskW - 16, PLAYABLE_BOTTOM - 8, 20, 8);
    // Anchor bolts
    ctx.fillStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.arc(x + 6, PLAYABLE_BOTTOM - 4, 2.5, 0, Math.PI * 2);
    ctx.arc(x + deskW - 6, PLAYABLE_BOTTOM - 4, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // 3. Flexible Corrugated Conduit Cable Bundle (Snaking down into floor cable trough)
    ctx.strokeStyle = '#020617';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(x + deskW - 12, deskY + 60);
    ctx.bezierCurveTo(x + deskW + 18, deskY + 75, x + deskW + 8, PLAYABLE_BOTTOM - 12, x + deskW + 14, PLAYABLE_BOTTOM);
    ctx.stroke();
    // Cable ring ridges
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.arc(x + deskW + 10, deskY + 70 + i * 7, 4, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Floor Cable Trough Opening at y=476
    ctx.fillStyle = '#020617';
    ctx.fillRect(x + deskW + 4, PLAYABLE_BOTTOM - 6, 20, 6);

    // 4. Dual CRT Monitor Displays (Mainframe Supercomputer!)
    // Main Display (Green Phosphor Oscilloscope & Matrix Code)
    const monX = x + 12;
    const monY = deskY + 12;
    const monW = 54;
    const monH = 42;

    ctx.fillStyle = '#020617';
    ctx.fillRect(monX - 3, monY - 3, monW + 6, monH + 6);
    ctx.fillStyle = '#064e3b';
    ctx.fillRect(monX, monY, monW, monH);

    // Oscilloscope Animated Waveform
    ctx.strokeStyle = '#34d399';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let px = 0; px < monW; px += 2) {
      const py = monY + monH / 2 + Math.sin(animTime * 12 + px * 0.28) * 11;
      if (px === 0) ctx.moveTo(monX + px, py);
      else ctx.lineTo(monX + px, py);
    }
    ctx.stroke();

    // Green Telemetry Code on Screen tracking Chog
    ctx.fillStyle = 'rgba(167, 243, 208, 0.75)';
    ctx.font = 'bold 6.5px monospace';
    ctx.fillText('TRACK: CHOG-01', monX + 3, monY + 9);
    ctx.fillText('SIGNAL: LOST', monX + 3, monY + 16);
    ctx.fillStyle = 'rgba(167, 243, 208, 0.35)';
    for (let line = 0; line < 2; line++) {
      const lw = 16 + ((line * 11 + Math.floor(animTime * 4)) % 22);
      ctx.fillRect(monX + 3, monY + 22 + line * 6, lw, 2);
    }

    // Secondary Telemetry Screen
    const mon2X = x + 70;
    const mon2Y = deskY + 16;
    const mon2W = 32;
    const mon2H = 36;
    ctx.fillStyle = '#020617';
    ctx.fillRect(mon2X - 2, mon2Y - 2, mon2W + 4, mon2H + 4);
    ctx.fillStyle = '#0c4a6e';
    ctx.fillRect(mon2X, mon2Y, mon2W, mon2H);
    // Cyan Radar / Diagnostic Sweep
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(mon2X + mon2W / 2, mon2Y + mon2H / 2, 10, 0, Math.PI * 2);
    ctx.stroke();
    const sweepA = animTime * 4;
    ctx.beginPath();
    ctx.moveTo(mon2X + mon2W / 2, mon2Y + mon2H / 2);
    ctx.lineTo(mon2X + mon2W / 2 + Math.cos(sweepA) * 10, mon2Y + mon2H / 2 + Math.sin(sweepA) * 10);
    ctx.stroke();
    // Blinking red target tracking blip for Chog-01!
    const blipX = mon2X + mon2W / 2 + Math.cos(sweepA * 0.7) * 6;
    const blipY = mon2Y + mon2H / 2 + Math.sin(sweepA * 0.7) * 6;
    ctx.fillStyle = Math.sin(animTime * 8) > 0 ? '#ef4444' : '#f87171';
    ctx.beginPath();
    ctx.arc(blipX, blipY, 2, 0, Math.PI * 2);
    ctx.fill();

    // 5. Mechanical Keyboard & Control Board
    const keybX = x + 16;
    const keybY = deskY + 60;
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(keybX, keybY, 44, 10);
    // Illuminated Keycaps with typing flicker
    for (let k = 0; k < 6; k++) {
      const isLit = (Math.floor(animTime * 14) + k) % 3 === 0;
      ctx.fillStyle = isLit ? '#34d399' : '#1e293b';
      ctx.fillRect(keybX + 2 + k * 7, keybY + 2, 5, 6);
    }

    // Console Button Bank
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 3; c++) {
        const btnX = x + 66 + c * 10;
        const btnY = deskY + 60 + r * 8;
        const isPress = (r + c + Math.floor(animTime * 2)) % 4 === 0;
        ctx.fillStyle = isPress ? '#38bdf8' : ((r === 0) ? '#f59e0b' : '#1e293b');
        ctx.beginPath();
        ctx.arc(btnX, btnY, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 6. Steaming Ceramic Coffee Mug
    const mugX = x + 102;
    const mugY = deskY + 58;
    ctx.fillStyle = '#ef4444'; // Red mug
    ctx.fillRect(mugX, mugY, 8, 10);
    ctx.strokeStyle = '#991b1b';
    ctx.lineWidth = 1;
    ctx.strokeRect(mugX, mugY, 8, 10);
    // Mug handle
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(mugX + 9, mugY + 5, 2.5, -Math.PI / 2, Math.PI / 2);
    ctx.stroke();
    // Steaming Vapor Curl
    const steamH = (animTime * 2) % 1;
    ctx.strokeStyle = `rgba(241, 245, 249, ${1 - steamH})`;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(mugX + 4, mugY - 1);
    ctx.quadraticCurveTo(mugX + 2 + Math.sin(animTime * 5) * 3, mugY - 6 - steamH * 8, mugX + 5, mugY - 12 - steamH * 10);
    ctx.stroke();

    // 7. 3D Holographic Atom Core Projector (Right corner)
    const holoX = x + 120;
    const holoY = deskY + 24;
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.arc(holoX, deskY + 44, 6, 0, Math.PI * 2);
    ctx.fill();
    const projGrad = ctx.createLinearGradient(holoX, deskY + 44, holoX, holoY);
    projGrad.addColorStop(0, 'rgba(56, 189, 248, 0.45)');
    projGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
    ctx.fillStyle = projGrad;
    ctx.beginPath();
    ctx.moveTo(holoX - 6, deskY + 44);
    ctx.lineTo(holoX + 6, deskY + 44);
    ctx.lineTo(holoX + 16, holoY - 8);
    ctx.lineTo(holoX - 16, holoY - 8);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(holoX, holoY, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.translate(holoX, holoY);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.85)';
    ctx.lineWidth = 1.2;
    ctx.rotate(animTime * 3);
    ctx.beginPath();
    ctx.ellipse(0, 0, 12, 4.5, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.rotate(Math.PI / 3);
    ctx.beginPath();
    ctx.ellipse(0, 0, 12, 4.5, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // ==============================================================
    // 8. THE HARDWORKING LAB SCIENTIST (Working Continuously On The Supercomputer)
    // ==============================================================
    this.renderScientistWorkingAtSupercomputer(
      ctx,
      x + 36,
      deskY + 54,
      animTime
    );

    ctx.restore();
  }

  /**
   * Dedicated Animated Lab Scientist Working Continuously At Supercomputer Workstation
   */
  private renderScientistWorkingAtSupercomputer(
    ctx: CanvasRenderingContext2D,
    seatX: number,
    seatY: number,
    animTime: number
  ) {
    ctx.save();

    // ================= 1. ROLLING ERGONOMIC LAB STOOL =================
    // Swivel gas cylinder post down to catwalk floor at PLAYABLE_BOTTOM (y=476)
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(seatX - 14, PLAYABLE_BOTTOM - 6, 28, 6); // 5-star roller base
    ctx.fillStyle = '#334155';
    ctx.fillRect(seatX - 3, seatY + 12, 6, PLAYABLE_BOTTOM - (seatY + 12)); // Chrome cylinder stem

    // Footrest ring
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(seatX, PLAYABLE_BOTTOM - 20, 14, 4, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Stool Cushion Seat
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.ellipse(seatX - 2, seatY + 14, 13, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Ergonomic Seat Backrest behind scientist
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(seatX - 16, seatY - 14, 4, 22);
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.roundRect(seatX - 20, seatY - 18, 6, 18, 3);
    ctx.fill();

    // ================= 2. SCIENTIST LEGS & SHOES =================
    ctx.fillStyle = '#0f172a'; // Navy trousers
    ctx.fillRect(seatX - 8, seatY + 14, 6, 16);
    ctx.fillRect(seatX - 1, seatY + 14, 6, 16);
    // Lab Shoes resting on foot-ring
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.ellipse(seatX - 6, seatY + 31, 5, 3, 0, 0, Math.PI * 2);
    ctx.ellipse(seatX + 2, seatY + 31, 5, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // ================= 3. SCIENTIST TORSO & WHITE LAB COAT =================
    // Gentle focused breathing/typing bob
    const bodyY = seatY + Math.sin(animTime * 4) * 1.2;

    // White Lab Coat Body leaning toward supercomputer
    const coatGrad = ctx.createLinearGradient(seatX - 14, bodyY - 18, seatX + 8, bodyY + 12);
    coatGrad.addColorStop(0, '#f8fafc');
    coatGrad.addColorStop(0.7, '#f1f5f9');
    coatGrad.addColorStop(1, '#e2e8f0');
    ctx.fillStyle = coatGrad;

    ctx.beginPath();
    ctx.moveTo(seatX - 11, bodyY - 14);
    ctx.lineTo(seatX + 7, bodyY - 12);
    ctx.lineTo(seatX + 9, bodyY + 14);
    ctx.lineTo(seatX - 11, bodyY + 14);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Blue Lab Lanyard ID Card Badge
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(seatX - 2, bodyY - 10);
    ctx.lineTo(seatX + 1, bodyY + 2);
    ctx.stroke();
    // Plastic ID badge card
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(seatX, bodyY + 2, 5, 6);
    ctx.fillStyle = '#2563eb';
    ctx.fillRect(seatX + 1, bodyY + 3, 3, 2);

    // ================= 4. SCIENTIST HEAD, HAIR & GLASSES =================
    const headX = seatX;
    const headY = bodyY - 21;

    // Peach Face Skin
    ctx.fillStyle = '#fed7aa';
    ctx.beginPath();
    ctx.arc(headX, headY, 7, 0, Math.PI * 2);
    ctx.fill();

    // Wild Scientist Einstein / Doc Brown Hair Tufts
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.arc(headX - 5, headY - 5, 4.5, 0, Math.PI * 2);
    ctx.arc(headX + 2, headY - 7, 4.5, 0, Math.PI * 2);
    ctx.arc(headX - 2, headY - 8, 4.5, 0, Math.PI * 2);
    ctx.arc(headX - 6, headY - 1, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 0.8;
    ctx.stroke();

    // Wireframe Glasses with green CRT screen reflection
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.2;
    ctx.fillStyle = 'rgba(167, 243, 208, 0.45)'; // Green CRT reflection!
    ctx.beginPath();
    ctx.arc(headX + 2, headY - 1, 3.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Focused eye looking at supercomputer CRT monitor
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(headX + 3.2, headY - 1, 1.2, 0, Math.PI * 2);
    ctx.fill();

    // Focused smile / determination line
    ctx.strokeStyle = '#7c2d12';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(headX + 2, headY + 3, 2, 0.2, Math.PI * 0.8);
    ctx.stroke();

    // ================= 5. CONTINUOUS ANIMATED TYPING ON SUPERCOMPUTER =================
    const typeSpeed = 22;
    const typePhase = animTime * typeSpeed;
    const leftHandY = Math.sin(typePhase) * 2.5;
    const rightHandY = -Math.sin(typePhase) * 2.5;

    // Left Arm & Forearm reaching to keyboard
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(seatX - 4, bodyY - 4, 11, 4.5); // Upper arm
    ctx.fillRect(seatX + 5, bodyY - 2, 9, 4);   // Forearm extending forward
    // Left Hand actively clicking keys!
    ctx.fillStyle = '#fed7aa';
    ctx.beginPath();
    ctx.arc(seatX + 14, bodyY + 1 + leftHandY, 2.8, 0, Math.PI * 2);
    ctx.fill();

    // Right Arm & Hand actively typing
    ctx.fillStyle = '#e2e8f0'; // Slightly shadowed right sleeve
    ctx.fillRect(seatX - 2, bodyY - 1, 12, 4);
    ctx.fillRect(seatX + 7, bodyY + 1, 10, 4);
    // Right Hand clicking keys!
    ctx.fillStyle = '#fed7aa';
    ctx.beginPath();
    ctx.arc(seatX + 17, bodyY + 3 + rightHandY, 2.8, 0, Math.PI * 2);
    ctx.fill();

    // Little clicking key spark / LED flash under fingers
    if (Math.sin(typePhase * 2) > 0.4) {
      ctx.fillStyle = '#34d399';
      ctx.fillRect(seatX + 13, bodyY + 4, 3, 1.5);
    }

    ctx.restore();
  }

  /**
   * Ground-Level Cartoon Lab Scientists (Iconic Jetpack Chogride Feature!)
   * Frantic white-coat scientists running along the catwalk floor, panicking and ducking!
   */
  private renderLabFloorScientists(
    ctx: CanvasRenderingContext2D,
    distanceTraveled: number,
    animTime: number,
    playerX: number,
    playerY: number,
    isFiring: boolean
  ) {
    const floorY = CANVAS_VIRTUAL_HEIGHT - FLOOR_HEIGHT;
    const scientistSpacing = 360;
    const offset = (distanceTraveled * 0.9) % (scientistSpacing * 4);

    ctx.save();
    for (let i = 0; i < 4; i++) {
      const baseX = i * scientistSpacing - offset;
      const wrappedX = ((baseX % (CANVAS_VIRTUAL_WIDTH + 200)) + (CANVAS_VIRTUAL_WIDTH + 200)) % (CANVAS_VIRTUAL_WIDTH + 200) - 100;

      const distToPlayer = wrappedX - playerX;
      const isPlayerNearby = Math.abs(distToPlayer) < 160 && playerY > PLAYABLE_BOTTOM - 130;
      const isPanic = isPlayerNearby || isFiring;

      this.renderGroundScientist(
        ctx,
        wrappedX,
        floorY,
        animTime,
        i,
        isPanic,
        distToPlayer > 0
      );
    }
    ctx.restore();
  }

  private renderGroundScientist(
    ctx: CanvasRenderingContext2D,
    x: number,
    floorY: number,
    animTime: number,
    seed: number,
    isPanic: boolean,
    runRight: boolean
  ) {
    ctx.save();
    ctx.translate(x, floorY);
    if (!runRight) ctx.scale(-1, 1);

    const runSpeedMultiplier = isPanic ? 16 : 8;
    const stepCycle = Math.sin(animTime * runSpeedMultiplier + seed * 2);
    const isDucking = isPanic && Math.sin(animTime * 3 + seed) > 0.1;

    const bodyY = isDucking ? -18 : -28;

    // Running Legs
    ctx.fillStyle = '#0f172a';
    if (isDucking) {
      ctx.fillRect(-8, -6, 16, 6);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-10, -2, 7, 3);
      ctx.fillRect(3, -2, 7, 3);
    } else {
      const leg1Angle = stepCycle * 0.6;
      const leg2Angle = -stepCycle * 0.6;

      ctx.save();
      ctx.translate(-3, -12);
      ctx.rotate(leg1Angle);
      ctx.fillRect(-2, 0, 4, 12);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-2, 10, 6, 3);
      ctx.restore();

      ctx.save();
      ctx.translate(3, -12);
      ctx.rotate(leg2Angle);
      ctx.fillRect(-2, 0, 4, 12);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-2, 10, 6, 3);
      ctx.restore();
    }

    // White Lab Coat
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.moveTo(-7, bodyY);
    ctx.lineTo(7, bodyY);
    ctx.lineTo(9, -8);
    ctx.lineTo(-9, -8);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, bodyY + 4);
    ctx.lineTo(0, -8);
    ctx.stroke();

    // Blue Necktie
    ctx.fillStyle = '#2563eb';
    ctx.beginPath();
    ctx.moveTo(-1.5, bodyY + 4);
    ctx.lineTo(1.5, bodyY + 4);
    ctx.lineTo(2, bodyY + 12);
    ctx.lineTo(0, bodyY + 14);
    ctx.lineTo(-2, bodyY + 12);
    ctx.closePath();
    ctx.fill();

    // Head & Scientist Hair
    const headY = bodyY - 9;
    ctx.fillStyle = '#fed7aa';
    ctx.beginPath();
    ctx.arc(0, headY, 6.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.arc(-4, headY - 4, 4.5, 0, Math.PI * 2);
    ctx.arc(3, headY - 4, 4.5, 0, Math.PI * 2);
    ctx.arc(0, headY - 6, 4, 0, Math.PI * 2);
    ctx.fill();

    // Glasses
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.5;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(2, headY, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = isPanic ? '#ef4444' : '#0f172a';
    ctx.beginPath();
    ctx.arc(2.5, headY, isPanic ? 1.5 : 1, 0, Math.PI * 2);
    ctx.fill();

    // Arms
    if (isPanic) {
      ctx.fillStyle = '#f8fafc';
      const armWave = Math.sin(animTime * 18 + seed) * 4;
      ctx.fillRect(-10, bodyY - 8 + armWave, 4, 10);
      ctx.fillRect(6, bodyY - 8 - armWave, 4, 10);
      ctx.fillStyle = '#fed7aa';
      ctx.beginPath();
      ctx.arc(-8, bodyY - 8 + armWave, 2.5, 0, Math.PI * 2);
      ctx.arc(8, bodyY - 8 - armWave, 2.5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(4, bodyY + 2, 7, 4);
      ctx.fillStyle = '#b45309';
      ctx.fillRect(8, bodyY - 2, 6, 9);
      ctx.fillStyle = '#fef3c7';
      ctx.fillRect(9, bodyY - 1, 4, 7);
    }

    ctx.restore();
  }

  /**
   * Layer 4: Foreground 3D Perspective Checkerboard Catwalk Floor & Industrial Ceiling
   */
  private render3DCeilingAndFloor(
    ctx: CanvasRenderingContext2D,
    distanceTraveled: number,
    animTime: number
  ) {
    const nearOffset = distanceTraveled % 48;

    // ================= CEILING (3D Steel Girders & Cage Lamps) =================
    ctx.save();
    if (!this.cachedCeilGrad) {
      this.cachedCeilGrad = ctx.createLinearGradient(0, 0, 0, CEILING_HEIGHT);
      this.cachedCeilGrad.addColorStop(0, '#0f172a');
      this.cachedCeilGrad.addColorStop(0.7, '#1e293b');
      this.cachedCeilGrad.addColorStop(1, '#334155');
    }
    ctx.fillStyle = this.cachedCeilGrad;
    ctx.fillRect(0, 0, CANVAS_VIRTUAL_WIDTH, CEILING_HEIGHT);

    ctx.fillStyle = '#475569';
    ctx.fillRect(0, CEILING_HEIGHT - 4, CANVAS_VIRTUAL_WIDTH, 4);

    // Yellow Hazard Chevrons on Ceiling Lip
    ctx.fillStyle = '#eab308';
    for (let x = -nearOffset; x < CANVAS_VIRTUAL_WIDTH + 48; x += 32) {
      ctx.beginPath();
      ctx.moveTo(x, CEILING_HEIGHT - 10);
      ctx.lineTo(x + 16, CEILING_HEIGHT - 10);
      ctx.lineTo(x + 24, CEILING_HEIGHT);
      ctx.lineTo(x + 8, CEILING_HEIGHT);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // ================= FLOOR (Real 3D Perspective Checkerboard Catwalk) =================
    ctx.save();
    const floorY = CANVAS_VIRTUAL_HEIGHT - FLOOR_HEIGHT;

    // Floor Deck Gradient
    if (!this.cachedFloorGrad) {
      this.cachedFloorGrad = ctx.createLinearGradient(0, floorY, 0, CANVAS_VIRTUAL_HEIGHT);
      this.cachedFloorGrad.addColorStop(0, '#0c1b30');
      this.cachedFloorGrad.addColorStop(0.3, '#132845');
      this.cachedFloorGrad.addColorStop(0.7, '#0a1424');
      this.cachedFloorGrad.addColorStop(1, '#020617');
    }
    ctx.fillStyle = this.cachedFloorGrad;
    ctx.fillRect(0, floorY, CANVAS_VIRTUAL_WIDTH, FLOOR_HEIGHT);

    // Receding Vertical Perspective Grid Lines
    const tileSpacing = 42;
    const scrollStep = (distanceTraveled * 1.0) % tileSpacing;

    ctx.strokeStyle = 'rgba(56, 189, 248, 0.24)';
    ctx.lineWidth = 1.5;
    for (let x = -scrollStep; x < CANVAS_VIRTUAL_WIDTH + tileSpacing; x += tileSpacing) {
      ctx.beginPath();
      ctx.moveTo(x, floorY);
      ctx.lineTo(x - 24, CANVAS_VIRTUAL_HEIGHT);
      ctx.stroke();
    }

    // Depth Lines
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.16)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, floorY + 14);
    ctx.lineTo(CANVAS_VIRTUAL_WIDTH, floorY + 14);
    ctx.moveTo(0, floorY + 34);
    ctx.lineTo(CANVAS_VIRTUAL_WIDTH, floorY + 34);
    ctx.stroke();

    // Specular Reflection Streak across Floor
    if (!this.cachedFloorGlow) {
      this.cachedFloorGlow = ctx.createLinearGradient(0, floorY, 0, floorY + 18);
      this.cachedFloorGlow.addColorStop(0, 'rgba(52, 211, 153, 0.28)');
      this.cachedFloorGlow.addColorStop(1, 'rgba(52, 211, 153, 0)');
    }
    ctx.fillStyle = this.cachedFloorGlow;
    ctx.fillRect(0, floorY, CANVAS_VIRTUAL_WIDTH, 18);

    // Heavy 3D Hazard Curb on Floor Edge
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, floorY, CANVAS_VIRTUAL_WIDTH, 8);

    ctx.fillStyle = '#f59e0b';
    for (let x = -nearOffset; x < CANVAS_VIRTUAL_WIDTH + 48; x += 28) {
      ctx.beginPath();
      ctx.moveTo(x, floorY);
      ctx.lineTo(x + 12, floorY);
      ctx.lineTo(x + 20, floorY + 8);
      ctx.lineTo(x + 8, floorY + 8);
      ctx.closePath();
      ctx.fill();
    }

    ctx.fillStyle = '#fef08a';
    ctx.fillRect(0, floorY, CANVAS_VIRTUAL_WIDTH, 1.5);

    ctx.restore();
  }

  private renderCinematicVignette(ctx: CanvasRenderingContext2D) {
    if (!this.cachedVignetteGrad) {
      const cx = CANVAS_VIRTUAL_WIDTH / 2;
      const cy = CANVAS_VIRTUAL_HEIGHT / 2;
      this.cachedVignetteGrad = ctx.createRadialGradient(cx, cy, 280, cx, cy, 540);
      this.cachedVignetteGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
      this.cachedVignetteGrad.addColorStop(1, 'rgba(0, 0, 0, 0.42)');
    }
    ctx.fillStyle = this.cachedVignetteGrad;
    ctx.fillRect(0, 0, CANVAS_VIRTUAL_WIDTH, CANVAS_VIRTUAL_HEIGHT);
  }

  private renderVolumetricLightBeams(
    ctx: CanvasRenderingContext2D,
    distanceTraveled: number,
    animTime: number
  ) {
    ctx.save();
    const beamInterval = 400;
    const offset = (distanceTraveled * 0.35) % beamInterval;

    if (!this.cachedBeamGrad) {
      this.cachedBeamGrad = ctx.createLinearGradient(0, CEILING_HEIGHT, 0, PLAYABLE_BOTTOM);
      this.cachedBeamGrad.addColorStop(0, 'rgba(56, 189, 248, 0.22)');
      this.cachedBeamGrad.addColorStop(0.5, 'rgba(56, 189, 248, 0.09)');
      this.cachedBeamGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
    }
    ctx.fillStyle = this.cachedBeamGrad;

    for (let x = -offset; x < CANVAS_VIRTUAL_WIDTH + beamInterval; x += beamInterval) {
      ctx.beginPath();
      ctx.moveTo(x, CEILING_HEIGHT);
      ctx.lineTo(x + 50, CEILING_HEIGHT);
      ctx.lineTo(x - 90, PLAYABLE_BOTTOM);
      ctx.lineTo(x - 140, PLAYABLE_BOTTOM);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  /**
   * Dynamic 3D floor shadow cast beneath the player onto the catwalk
   */
  private renderPlayerFloorShadow(ctx: CanvasRenderingContext2D, x: number, y: number) {
    const floorY = CANVAS_VIRTUAL_HEIGHT - FLOOR_HEIGHT;
    const playerBottom = y + 52;
    const heightAboveFloor = Math.max(0, floorY - playerBottom);

    const proximity = Math.max(0, 1 - heightAboveFloor / 380);
    const shadowW = 16 + proximity * 28;
    const shadowH = 4 + proximity * 6;
    const shadowAlpha = 0.12 + proximity * 0.48;

    ctx.save();
    ctx.fillStyle = `rgba(0, 0, 0, ${shadowAlpha})`;
    ctx.beginPath();
    ctx.ellipse(x + 22, floorY + 3, shadowW, shadowH, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  /**
   * High-Fidelity Cartoon 3D Player Character Rendering
   */
  public renderPlayer(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    vy: number,
    isJetpackFiring: boolean,
    isGrounded: boolean,
    character: CharacterDef,
    distanceTraveled: number,
    isDead: boolean,
    deathTimer: number = 0
  ) {
    this.renderPlayerFloorShadow(ctx, x, y);

    this.renderChibiJetpackHero(
      ctx,
      x,
      y,
      vy,
      isJetpackFiring,
      isGrounded,
      distanceTraveled,
      isDead,
      deathTimer
    );
  }

  /**
   * Chibi Jetpack Hero Sprite Rendering (Faithful to User Sprite Sheet)
   * Animations:
   * - IDLE / RUN: 6-frame run cycle with swinging pink boots, bobbing purple quills, waving pink mittens
   * - FLY: 8-frame forward-gliding posture with silver dual-canister jetpack & aerodynamic quills
   * - BOOST: 8-frame rocket thruster boost with layered golden/orange/crimson jetpack flame exhaust
   * - HIT: 8-frame damage recoil with cute >< squint eyes and open shouting mouth
   * - DEAD: 6-frame floor collapse with cute X X eyes, flattened quills & resting boots
   */
  private renderChibiJetpackHero(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    vy: number,
    isJetpackFiring: boolean,
    isGrounded: boolean,
    distanceTraveled: number,
    isDead: boolean,
    deathTimer: number = 0
  ) {
    const cx = x + 22;
    const cy = y + 26;

    // ==========================================
    // 1. DEAD / WIPEOUT STATE (Sprite Sheet Rows 5 & 6)
    // ==========================================
    if (isDead) {
      if (deathTimer > 0.35 || isGrounded) {
        // Lying flat on the floor (Row 6 "DEAD (6 FRAMES)")
        ctx.save();
        const floorY = y + 46;

        // Flattened purple suit body
        const suitGrad = ctx.createLinearGradient(cx - 16, floorY - 6, cx + 16, floorY + 4);
        suitGrad.addColorStop(0, '#581c87');
        suitGrad.addColorStop(0.5, '#7c3aed');
        suitGrad.addColorStop(1, '#4c1d95');
        ctx.fillStyle = suitGrad;
        ctx.beginPath();
        ctx.ellipse(cx - 2, floorY + 1, 16, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Pink boots sticking out behind (left)
        ctx.fillStyle = '#ec4899';
        ctx.beginPath();
        ctx.ellipse(cx - 20, floorY + 2, 7, 4, -0.2, 0, Math.PI * 2);
        ctx.ellipse(cx - 13, floorY + 3, 7, 4, 0.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#be185d';
        ctx.fillRect(cx - 25, floorY + 3, 7, 2);
        ctx.fillRect(cx - 18, floorY + 4, 7, 2);

        // Silver jetpack resting on back
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(cx - 14, floorY - 6, 12, 6);
        ctx.fillStyle = '#ec4899';
        ctx.fillRect(cx - 16, floorY - 5, 3, 4);

        // Flattened sweeping purple quills draped over head & back
        const quillGrad = ctx.createLinearGradient(cx - 26, floorY - 14, cx + 12, floorY);
        quillGrad.addColorStop(0, '#4c1d95');
        quillGrad.addColorStop(0.3, '#6d28d9');
        quillGrad.addColorStop(0.7, '#7c3aed');
        quillGrad.addColorStop(1, '#a855f7');
        ctx.fillStyle = quillGrad;

        ctx.beginPath();
        ctx.moveTo(cx + 8, floorY - 3);
        ctx.quadraticCurveTo(cx + 14, floorY - 10, cx + 4, floorY - 12);
        ctx.quadraticCurveTo(cx - 6, floorY - 14, cx - 18, floorY - 12);
        ctx.lineTo(cx - 26, floorY - 6);
        ctx.lineTo(cx - 16, floorY - 4);
        ctx.lineTo(cx - 24, floorY - 1);
        ctx.lineTo(cx - 12, floorY + 1);
        ctx.closePath();
        ctx.fill();

        // Quill highlights
        ctx.strokeStyle = '#c084fc';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(cx + 4, floorY - 11);
        ctx.quadraticCurveTo(cx - 8, floorY - 13, cx - 22, floorY - 9);
        ctx.stroke();

        // Cute peach face resting on ground
        ctx.fillStyle = '#fed7aa';
        ctx.beginPath();
        ctx.ellipse(cx + 10, floorY + 1, 9, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Hedgehog ear on floor
        ctx.fillStyle = '#6d28d9';
        ctx.beginPath();
        ctx.moveTo(cx + 4, floorY - 2);
        ctx.lineTo(cx + 7, floorY - 7);
        ctx.lineTo(cx + 10, floorY - 4);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#f472b6';
        ctx.beginPath();
        ctx.moveTo(cx + 5, floorY - 2);
        ctx.lineTo(cx + 7, floorY - 5.5);
        ctx.lineTo(cx + 9, floorY - 3.5);
        ctx.closePath();
        ctx.fill();

        // Pink cheek blush
        ctx.fillStyle = '#f472b6';
        ctx.beginPath();
        ctx.ellipse(cx + 14, floorY + 3, 3, 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Famous X X eyes
        ctx.strokeStyle = '#18181b';
        ctx.lineWidth = 1.6;
        // Left eye X
        ctx.beginPath();
        ctx.moveTo(cx + 6, floorY - 1);
        ctx.lineTo(cx + 10, floorY + 3);
        ctx.moveTo(cx + 10, floorY - 1);
        ctx.lineTo(cx + 6, floorY + 3);
        // Right eye X
        ctx.moveTo(cx + 13, floorY - 1);
        ctx.lineTo(cx + 17, floorY + 3);
        ctx.moveTo(cx + 17, floorY - 1);
        ctx.lineTo(cx + 13, floorY + 3);
        ctx.stroke();

        // Pink mittens resting on ground
        ctx.fillStyle = '#ec4899';
        ctx.beginPath();
        ctx.arc(cx + 18, floorY + 3, 3.5, 0, Math.PI * 2);
        ctx.arc(cx + 2, floorY + 4, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
        return;
      } else {
        // Tumble in air (Row 5 "HIT (8 FRAMES)")
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(-0.35 + Math.sin(deathTimer * 8) * 0.2);
        this.renderChibiBodyMesh(ctx, 0, false, false, 'hit');
        ctx.restore();
        return;
      }
    }

    // ==========================================
    // 2. AIRBORNE FLIGHT STATE (Rows 3 & 4: FLY / BOOST)
    // ==========================================
    if (!isGrounded) {
      ctx.save();
      ctx.translate(cx, cy);

      // Aerodynamic forward tilt (stronger when firing thrusters!)
      const flightTilt = isJetpackFiring
        ? -0.26 + Math.sin(distanceTraveled * 0.12) * 0.03
        : Math.min(0.24, Math.max(-0.16, vy * 0.0005));

      ctx.rotate(flightTilt);
      this.renderChibiBodyMesh(ctx, distanceTraveled, isJetpackFiring, true, isJetpackFiring ? 'boost' : 'fly');
      ctx.restore();
      return;
    }

    // ==========================================
    // 3. GROUNDED RUN STATE (Row 2: RUN)
    // ==========================================
    ctx.save();
    const runPhase = (distanceTraveled / 12) % (Math.PI * 2);
    const bob = Math.abs(Math.sin(runPhase)) * 3;
    ctx.translate(cx, cy - bob);
    ctx.rotate(0.08); // Slight eager forward run tilt
    this.renderChibiBodyMesh(ctx, distanceTraveled, false, false, 'run', runPhase);
    ctx.restore();
  }

  private renderChibiBodyMesh(
    ctx: CanvasRenderingContext2D,
    distanceTraveled: number,
    isJetpackFiring: boolean,
    isFlying: boolean,
    mode: 'run' | 'fly' | 'boost' | 'hit',
    runPhase: number = 0
  ) {
    // ------------------------------------
    // LAYER 1: BACK ARM & MITTEN (When running)
    // ------------------------------------
    if (!isFlying && mode === 'run') {
      const backArmAngle = Math.sin(runPhase) * 0.58;
      ctx.save();
      ctx.translate(-3, 0);
      ctx.rotate(backArmAngle);
      // Shaded sleeve
      ctx.fillStyle = '#4c1d95';
      ctx.fillRect(-2, 0, 5, 8);
      // Pink mitten
      ctx.fillStyle = '#db2777';
      ctx.beginPath();
      ctx.arc(0, 9, 3.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#9d174d';
      ctx.beginPath();
      ctx.arc(-1.5, 7.5, 1.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // ------------------------------------
    // LAYER 2: JETPACK & FLAME EXHAUST (Mounted High on Upper Back)
    // ------------------------------------
    ctx.save();
    const jetpackX = isFlying ? -14 : -12;
    const jetpackY = isFlying ? -15 : -13;
    const jetpackW = 10;
    const jetpackH = 15;

    // Dual canister offset for 3D depth (Canister 1 behind)
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.roundRect(jetpackX - 2, jetpackY + 1, jetpackW - 2, jetpackH - 2, 3);
    ctx.fill();

    // Canister 2 Body (Main front canister with chrome metallic shine)
    if (!this.cachedCanGrad) {
      this.cachedCanGrad = ctx.createLinearGradient(jetpackX, jetpackY, jetpackX + jetpackW, jetpackY);
      this.cachedCanGrad.addColorStop(0, '#64748b');
      this.cachedCanGrad.addColorStop(0.25, '#f8fafc'); // Specular chrome glint
      this.cachedCanGrad.addColorStop(0.65, '#cbd5e1');
      this.cachedCanGrad.addColorStop(1, '#475569');
    }
    ctx.fillStyle = this.cachedCanGrad;
    ctx.beginPath();
    ctx.roundRect(jetpackX, jetpackY, jetpackW, jetpackH, 3.5);
    ctx.fill();
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Magenta harness strap band around middle
    ctx.fillStyle = '#ec4899';
    ctx.fillRect(jetpackX - 1, jetpackY + 5.5, jetpackW + 2, 3);

    // Canister top dome cap
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.arc(jetpackX + jetpackW / 2, jetpackY + 1.5, jetpackW / 2 - 1, Math.PI, 0);
    ctx.fill();

    // Thruster exhaust nozzle (Sits high on upper back, well above legs!)
    const nozzleX = jetpackX + 2;
    const nozzleY = jetpackY + jetpackH; // = 0 in flight!
    ctx.fillStyle = '#ec4899'; // Pink nozzle collar ring
    ctx.fillRect(jetpackX, nozzleY - 2, jetpackW, 3.5);

    ctx.fillStyle = '#334155'; // Dark metallic nozzle bell
    ctx.beginPath();
    ctx.moveTo(jetpackX + 1, nozzleY + 1.5);
    ctx.lineTo(jetpackX + jetpackW - 1, nozzleY + 1.5);
    ctx.lineTo(jetpackX + jetpackW + 1, nozzleY + 5);
    ctx.lineTo(jetpackX - 1, nozzleY + 5);
    ctx.closePath();
    ctx.fill();

    // ROCKET THRUSTER FLAME (Sprite Sheet Rows 4 & 7)
    if (isJetpackFiring) {
      const flicker = Math.sin(distanceTraveled * 0.85) * 4;
      const flameLen = 34 + (Math.floor(distanceTraveled * 0.3) % 4) * 3 + flicker;

      // Flame shoots backwards at ~35° directly out of the jetpack on the upper back
      const tipX = nozzleX - 28 - flicker * 0.5;
      const tipY = nozzleY + 16 + flicker * 0.4;

      // 1. Outer Fiery Orange Flame Blast with Jagged Anime Teeth
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.moveTo(jetpackX, nozzleY + 5);
      ctx.lineTo(jetpackX + jetpackW, nozzleY + 5);
      ctx.lineTo(jetpackX + jetpackW - 2, nozzleY + 11);
      ctx.lineTo(nozzleX + 3, nozzleY + 10);
      ctx.lineTo(tipX + 8, tipY - 4);
      ctx.lineTo(tipX, tipY);                 // Center flame tip
      ctx.lineTo(tipX + 7, tipY + 4);
      ctx.lineTo(nozzleX - 13, nozzleY + 17); // Lower serrated tooth
      ctx.lineTo(jetpackX - 4, nozzleY + 10);
      ctx.closePath();
      ctx.fill();

      // Outer Crimson Outline/Glow on Flame Rim
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1.3;
      ctx.stroke();

      // 2. Inner Brilliant Golden Yellow Flame
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.moveTo(jetpackX + 2, nozzleY + 5);
      ctx.lineTo(jetpackX + jetpackW - 2, nozzleY + 5);
      ctx.lineTo(nozzleX + 1, nozzleY + 9);
      ctx.lineTo(tipX + 12, tipY - 3);
      ctx.lineTo(nozzleX - 8, nozzleY + 11);
      ctx.closePath();
      ctx.fill();

      // 3. Bright White-Hot Ignition Core
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(jetpackX + 3, nozzleY + 5);
      ctx.lineTo(jetpackX + jetpackW - 3, nozzleY + 5);
      ctx.lineTo(nozzleX - 3, nozzleY + 9);
      ctx.closePath();
      ctx.fill();

      // 4. Trailing Flame Shards / Embers (Matching Row 7)
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.moveTo(tipX - 6, tipY - 2);
      ctx.lineTo(tipX - 3, tipY + 2);
      ctx.lineTo(tipX - 8, tipY + 1);
      ctx.closePath();
      ctx.moveTo(tipX + 2, tipY + 8);
      ctx.lineTo(tipX + 5, tipY + 11);
      ctx.lineTo(tipX, tipY + 10);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // ------------------------------------
    // LAYER 3: LEGS & CHUNKY PINK SNEAKERS
    // ------------------------------------
    if (isFlying) {
      // Aerodynamic Flight Legs (Trailing behind, clearly below the jetpack and flame!)
      ctx.save();
      // Back leg
      ctx.fillStyle = '#4c1d95'; // Shaded purple suit leg
      ctx.fillRect(-10, 5, 6, 8);
      // Back boot
      ctx.fillStyle = '#db2777';
      ctx.beginPath();
      ctx.ellipse(-14, 14, 6, 4.2, -0.22, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#9d174d';
      ctx.fillRect(-18, 15, 6, 2); // Rubber sole

      // Front leg
      ctx.fillStyle = '#581c87'; // Purple suit leg
      ctx.fillRect(-4, 6, 6, 8);
      // Front boot
      ctx.fillStyle = '#ec4899';
      ctx.beginPath();
      ctx.ellipse(-7, 16, 6.2, 4.2, -0.16, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#be185d';
      ctx.fillRect(-11, 17, 6, 2); // Rubber sole
      ctx.restore();
    } else if (mode === 'hit') {
      // Damage Recoil Legs (Kicked forward/out)
      ctx.save();
      ctx.fillStyle = '#581c87';
      ctx.fillRect(-10, 6, 7, 8);
      ctx.fillRect(-2, 7, 7, 8);
      ctx.fillStyle = '#ec4899';
      ctx.beginPath();
      ctx.ellipse(-12, 14, 6.5, 4.5, -0.5, 0, Math.PI * 2);
      ctx.ellipse(-2, 15, 6.5, 4.5, -0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else {
      // 6-Frame Running Cycle Legs (Matching Row 2)
      ctx.save();
      const leg1Angle = Math.sin(runPhase) * 0.65;
      const leg2Angle = -Math.sin(runPhase) * 0.65;

      // Back leg
      ctx.save();
      ctx.translate(-6, 8);
      ctx.rotate(leg2Angle);
      ctx.fillStyle = '#4c1d95'; // Darker shaded leg behind
      ctx.fillRect(-3, 0, 6, 9);
      // Back Pink Sneaker
      ctx.fillStyle = '#db2777';
      ctx.beginPath();
      ctx.ellipse(-1, 10, 6.5, 4.5, 0.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#9d174d'; // Sole
      ctx.fillRect(-5, 12, 7, 2);
      ctx.restore();

      // Front leg
      ctx.save();
      ctx.translate(0, 8);
      ctx.rotate(leg1Angle);
      ctx.fillStyle = '#581c87'; // Main purple leg
      ctx.fillRect(-3, 0, 6, 9);
      // Front Pink Sneaker
      ctx.fillStyle = '#ec4899'; // Vibrant pink boot
      ctx.beginPath();
      ctx.ellipse(-1, 10, 6.5, 4.5, 0.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#be185d'; // Darker pink sole
      ctx.fillRect(-5, 12, 7, 2);
      ctx.restore();

      ctx.restore();
    }

    // ------------------------------------
    // LAYER 4: PURPLE ONESIE TORSO & MAGENTA COLLAR
    // ------------------------------------
    ctx.save();
    if (!this.cachedChogTorsoGrad) {
      this.cachedChogTorsoGrad = ctx.createLinearGradient(-8, -4, 8, 12);
      this.cachedChogTorsoGrad.addColorStop(0, '#7c3aed');
      this.cachedChogTorsoGrad.addColorStop(0.5, '#6d28d9');
      this.cachedChogTorsoGrad.addColorStop(1, '#4c1d95');
    }
    ctx.fillStyle = this.cachedChogTorsoGrad;
    ctx.beginPath();
    ctx.ellipse(0, 3, 9, 10, 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#3b0764';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Magenta neckline collar accent & zipper detail
    ctx.fillStyle = '#ec4899';
    ctx.beginPath();
    ctx.arc(3, -5, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fde047'; // Tiny gold zipper slider
    ctx.fillRect(2.5, -3.5, 1.8, 2.5);
    ctx.restore();

    // ------------------------------------
    // LAYER 5: 3D VOLUMETRIC HEDGEHOG QUILLS (Mane & Spikes)
    // ------------------------------------
    ctx.save();

    // 5A. Back Under-Quill Layer (Deep shadow depth for that authentic anime volume)
    ctx.fillStyle = '#3b0764';
    ctx.beginPath();
    ctx.moveTo(0, -22);
    ctx.quadraticCurveTo(-14, -28, -25, -23); // Spike 1 shadow tip
    ctx.quadraticCurveTo(-18, -19, -15, -16);
    ctx.quadraticCurveTo(-24, -18, -30, -14); // Spike 2 shadow tip
    ctx.quadraticCurveTo(-22, -9, -18, -6);
    ctx.quadraticCurveTo(-24, -6, -28, -2);   // Spike 3 shadow tip
    ctx.quadraticCurveTo(-18, 2, -14, 5);
    ctx.lineTo(-6, 6);
    ctx.closePath();
    ctx.fill();

    // 5B. Main 5-Tier Sweeping Quills with Radial/Linear Gradient
    if (!this.cachedChogQuillGrad) {
      this.cachedChogQuillGrad = ctx.createLinearGradient(-26, -26, 8, 4);
      this.cachedChogQuillGrad.addColorStop(0, '#581c87'); // Deep back shadow
      this.cachedChogQuillGrad.addColorStop(0.35, '#6d28d9');
      this.cachedChogQuillGrad.addColorStop(0.7, '#7c3aed'); // Rich vibrant purple
      this.cachedChogQuillGrad.addColorStop(1, '#a855f7');  // Front crest highlight
    }
    ctx.fillStyle = this.cachedChogQuillGrad;

    ctx.beginPath();
    ctx.moveTo(8, -19); // Forehead hairline

    // High Crest Spike 1 (Top Crown)
    ctx.quadraticCurveTo(4, -28, -6, -30);
    ctx.quadraticCurveTo(-14, -30, -22, -26); // Spike 1 tip

    // Inset to Spike 2
    ctx.quadraticCurveTo(-15, -23, -13, -20);
    // Spike 2 (Upper Back)
    ctx.quadraticCurveTo(-20, -21, -28, -17); // Spike 2 tip

    // Inset to Spike 3
    ctx.quadraticCurveTo(-19, -14, -16, -11);
    // Spike 3 (Mid Back)
    ctx.quadraticCurveTo(-22, -10, -27, -5);  // Spike 3 tip

    // Inset to Spike 4
    ctx.quadraticCurveTo(-18, -2, -15, 1);
    // Spike 4 (Lower Back)
    ctx.quadraticCurveTo(-20, 3, -22, 6);     // Spike 4 tip

    // Inset to Spike 5 (Nape)
    ctx.quadraticCurveTo(-16, 7, -13, 8);
    ctx.lineTo(-15, 11);                      // Spike 5 small nape tip

    // Curve back under jawline into face
    ctx.quadraticCurveTo(-8, 9, -2, 2);
    ctx.lineTo(3, -7);
    ctx.closePath();
    ctx.fill();

    // Quill Outline
    ctx.strokeStyle = '#2e1065';
    ctx.lineWidth = 1.3;
    ctx.stroke();

    // 5C. 3D Glossy Crest Highlights
    ctx.strokeStyle = '#c084fc';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(4, -26);
    ctx.quadraticCurveTo(-8, -27, -18, -24); // Top spine highlight ridge
    ctx.moveTo(-6, -18);
    ctx.quadraticCurveTo(-14, -18, -24, -15); // Mid spine highlight ridge
    ctx.stroke();

    // 5D. Cute Chibi Hedgehog Ear (Crucial character feature!)
    // Outer Ear
    ctx.fillStyle = '#6d28d9';
    ctx.strokeStyle = '#2e1065';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-1, -16);
    ctx.quadraticCurveTo(-5, -23, 1, -21);
    ctx.quadraticCurveTo(5, -17, 3, -13);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Inner Peach/Pink Ear
    ctx.fillStyle = '#f472b6';
    ctx.beginPath();
    ctx.moveTo(0, -16);
    ctx.quadraticCurveTo(-2, -20, 1, -19);
    ctx.quadraticCurveTo(3, -16, 2, -14);
    ctx.closePath();
    ctx.fill();

    ctx.restore();

    // ------------------------------------
    // LAYER 6: CUTE PEACH CHIBI PROFILE FACE
    // ------------------------------------
    ctx.save();
    // Beautiful Cartoon Profile Face Path (Forehead, tiny nose bump, chubby cheek & chin)
    if (!this.cachedChogFaceGrad) {
      this.cachedChogFaceGrad = ctx.createLinearGradient(0, -20, 12, -4);
      this.cachedChogFaceGrad.addColorStop(0, '#fff1e6');
      this.cachedChogFaceGrad.addColorStop(0.6, '#fed7aa');
      this.cachedChogFaceGrad.addColorStop(1, '#fde0c0');
    }
    ctx.fillStyle = this.cachedChogFaceGrad;

    ctx.beginPath();
    ctx.moveTo(4, -19);                      // Top forehead
    ctx.quadraticCurveTo(8, -17, 10, -15);   // Forehead slope
    ctx.quadraticCurveTo(12.5, -13, 13, -12); // Cute tiny upturned nose!
    ctx.quadraticCurveTo(13.5, -8, 12, -5);   // Chubby round cheek
    ctx.quadraticCurveTo(9, -2, 5, -2);      // Soft chin
    ctx.quadraticCurveTo(1, -2, -1, -5);     // Jawline
    ctx.quadraticCurveTo(-2, -13, 4, -19);   // Connect to forehead
    ctx.closePath();
    ctx.fill();

    // Soft Rosy Pink Cheek Blush
    ctx.fillStyle = 'rgba(244, 114, 182, 0.75)';
    ctx.beginPath();
    ctx.ellipse(10.5, -7.5, 3.2, 2.1, 0.05, 0, Math.PI * 2);
    ctx.fill();

    // EXPRESSIVE ANIME EYES & MOUTH
    if (mode === 'hit') {
      // Hit damage wincing eyes > <
      ctx.strokeStyle = '#18181b';
      ctx.lineWidth = 1.8;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(6, -15);
      ctx.lineTo(10, -12);
      ctx.lineTo(6, -9);
      ctx.stroke();

      // Open screaming mouth
      ctx.fillStyle = '#831843';
      ctx.beginPath();
      ctx.ellipse(9, -6, 3, 2.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      ctx.arc(9, -5, 1.8, 0, Math.PI);
      ctx.fill();
    } else {
      // Delicate Eyebrow Arch
      ctx.strokeStyle = '#581c87';
      ctx.lineWidth = 1.2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(8.5, -17, 3.5, -0.6, 0.6);
      ctx.stroke();

      // Big Adorable Anime Eye
      const eyeX = 8.5;
      const eyeY = -12.5;

      // Dark Iris with Purple Gradient
      const eyeGrad = ctx.createLinearGradient(eyeX, eyeY - 6, eyeX, eyeY + 6);
      eyeGrad.addColorStop(0, '#09090b');
      eyeGrad.addColorStop(0.7, '#18181b');
      eyeGrad.addColorStop(1, '#4c1d95');
      ctx.fillStyle = eyeGrad;
      ctx.beginPath();
      ctx.ellipse(eyeX, eyeY, 4.2, 5.8, 0.05, 0, Math.PI * 2);
      ctx.fill();

      // Curved Upper Eyelash Arc (Anime definition!)
      ctx.strokeStyle = '#09090b';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(eyeX, eyeY - 1, 4.6, -Math.PI * 0.85, -Math.PI * 0.15);
      ctx.stroke();

      // Glistening White Sparkle Highlights (Double sparkle from sprite sheet!)
      ctx.fillStyle = '#ffffff';
      // Big top-right sparkle highlight
      ctx.beginPath();
      ctx.arc(eyeX + 1.6, eyeY - 2.2, 2.3, 0, Math.PI * 2);
      ctx.fill();
      // Small bottom-left sparkle reflection
      ctx.beginPath();
      ctx.arc(eyeX - 1.2, eyeY + 2.0, 1.1, 0, Math.PI * 2);
      ctx.fill();

      // Mouth Expression
      if (mode === 'boost') {
        // Wide joyful open smile with tongue
        ctx.fillStyle = '#831843';
        ctx.beginPath();
        ctx.arc(8.5, -6.5, 3.2, 0.1, Math.PI * 0.9);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#fb7185';
        ctx.beginPath();
        ctx.arc(8.5, -5.5, 2, 0, Math.PI);
        ctx.fill();
      } else {
        // Sweet cheerful smile curve
        ctx.strokeStyle = '#312e81';
        ctx.lineWidth = 1.4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(8, -6.8, 2.5, 0.1, Math.PI * 0.75);
        ctx.stroke();
      }
    }
    ctx.restore();

    // ------------------------------------
    // LAYER 7: FRONT ARM & PINK MITTEN
    // ------------------------------------
    ctx.save();
    if (isFlying) {
      // Superman forward flying arm
      ctx.fillStyle = '#581c87';
      ctx.fillRect(2, -1, 8, 5);
      ctx.fillStyle = '#ec4899'; // Pink mitten
      ctx.beginPath();
      ctx.arc(10, 1.5, 4.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#be185d'; // Thumb bump
      ctx.beginPath();
      ctx.arc(8.5, -0.6, 1.8, 0, Math.PI * 2);
      ctx.fill();
    } else if (mode === 'hit') {
      // Recoil defensive arm
      ctx.fillStyle = '#581c87';
      ctx.fillRect(2, -6, 7, 5);
      ctx.fillStyle = '#ec4899';
      ctx.beginPath();
      ctx.arc(9, -7, 4.2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Running arm swing
      const frontArmAngle = -Math.sin(runPhase) * 0.65;
      ctx.translate(2, -1);
      ctx.rotate(frontArmAngle);
      ctx.fillStyle = '#581c87';
      ctx.fillRect(-2, 0, 5.5, 8.5);
      ctx.fillStyle = '#ec4899'; // Pink mitten
      ctx.beginPath();
      ctx.arc(0, 9, 4.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#be185d'; // Thumb
      ctx.beginPath();
      ctx.arc(2, 7.5, 1.9, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  public renderObstacles(
    ctx: CanvasRenderingContext2D,
    obstacles: (ZapperObstacle | MissileObstacle)[],
    animTime: number
  ) {
    for (const obs of obstacles) {
      if (obs.type === 'missile') {
        this.renderMissile(ctx, obs as MissileObstacle, animTime);
      } else {
        this.renderZapper(ctx, obs as ZapperObstacle, animTime);
      }
    }
  }

  private renderZapper(
    ctx: CanvasRenderingContext2D,
    obs: ZapperObstacle,
    animTime: number
  ) {
    ctx.save();
    ctx.translate(obs.x, obs.y);
    ctx.rotate(obs.angle);

    const halfLen = obs.length / 2;

    const flicker = Math.sin(animTime * 40 + obs.id) * 3;
    if (!this.cachedZapperBeamGrad) {
      this.cachedZapperBeamGrad = ctx.createLinearGradient(0, -9, 0, 9);
      this.cachedZapperBeamGrad.addColorStop(0, 'rgba(245, 158, 11, 0.25)');
      this.cachedZapperBeamGrad.addColorStop(0.5, 'rgba(251, 191, 36, 0.95)');
      this.cachedZapperBeamGrad.addColorStop(1, 'rgba(239, 68, 68, 0.35)');
    }
    ctx.fillStyle = this.cachedZapperBeamGrad;
    ctx.fillRect(-halfLen + 10, -6 - flicker * 0.4, obs.length - 20, 12 + flicker * 0.8);

    // Outer electric amber aura
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.7)';
    ctx.lineWidth = 5.5;
    ctx.beginPath();
    ctx.moveTo(-halfLen + 12, 0);

    const segments = 6;
    const segW = (obs.length - 24) / segments;
    for (let s = 1; s < segments; s++) {
      const jx = -halfLen + 12 + s * segW;
      const jy = (Math.sin(animTime * 30 + s * 3 + obs.id) * 7);
      ctx.lineTo(jx, jy);
    }
    ctx.lineTo(halfLen - 12, 0);
    ctx.stroke();

    // Inner hot electric filament
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    this.renderZapperNode(ctx, -halfLen, 0, animTime);
    this.renderZapperNode(ctx, halfLen, 0, animTime);

    ctx.restore();
  }

  private renderZapperNode(ctx: CanvasRenderingContext2D, x: number, y: number, animTime: number) {
    ctx.save();
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.arc(x, y, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#eab308';
    ctx.fillRect(x - 6, y - 14, 4, 4);
    ctx.fillRect(x + 2, y + 10, 4, 4);

    const corePulse = Math.sin(animTime * 8) * 2;
    // Radiant outer red aura
    ctx.fillStyle = 'rgba(248, 113, 113, 0.45)';
    ctx.beginPath();
    ctx.arc(x, y, 9 + corePulse, 0, Math.PI * 2);
    ctx.fill();

    // Solid inner core
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(x, y, 6 + corePulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private renderMissile(
    ctx: CanvasRenderingContext2D,
    missile: MissileObstacle,
    animTime: number
  ) {
    if (missile.state === 'WARNING') {
      const blink = Math.sin(animTime * 14) > 0;
      ctx.save();
      if (blink) {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.35)';
        ctx.beginPath();
        ctx.arc(CANVAS_VIRTUAL_WIDTH - 36, missile.y, 23, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = blink ? '#ef4444' : '#7f1d1d';
      ctx.beginPath();
      ctx.arc(CANVAS_VIRTUAL_WIDTH - 36, missile.y, 18, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px "Chakra Petch", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('!', CANVAS_VIRTUAL_WIDTH - 36, missile.y - 1);

      ctx.strokeStyle = blink ? 'rgba(239, 68, 68, 0.85)' : 'rgba(239, 68, 68, 0.2)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(CANVAS_VIRTUAL_WIDTH - 60, missile.y);
      ctx.lineTo(CANVAS_VIRTUAL_WIDTH - 200, missile.y);
      ctx.stroke();

      ctx.restore();
    } else if (missile.state === 'LAUNCHED') {
      ctx.save();
      ctx.translate(missile.x + 24, missile.y);

      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.moveTo(-18, -10);
      ctx.lineTo(-30, 0);
      ctx.lineTo(-18, 10);
      ctx.lineTo(16, 9);
      ctx.lineTo(16, -9);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(-6, -9, 8, 18);

      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.moveTo(8, -9);
      ctx.lineTo(20, -15);
      ctx.lineTo(16, -9);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(8, 9);
      ctx.lineTo(20, 15);
      ctx.lineTo(16, 9);
      ctx.closePath();
      ctx.fill();

      const fireW = 20 + Math.random() * 12;
      // Outer plume aura
      ctx.fillStyle = 'rgba(234, 88, 12, 0.45)';
      ctx.beginPath();
      ctx.moveTo(16, -8);
      ctx.lineTo(16 + fireW + 4, 0);
      ctx.lineTo(16, 8);
      ctx.closePath();
      ctx.fill();

      // Solid inner flame
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.moveTo(16, -6);
      ctx.lineTo(16 + fireW, 0);
      ctx.lineTo(16, 6);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.moveTo(16, -3);
      ctx.lineTo(16 + fireW * 0.5, 0);
      ctx.lineTo(16, 3);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }
  }

  public renderCoins(
    ctx: CanvasRenderingContext2D,
    coins: Coin[],
    animTime: number
  ) {
    ctx.save();
    for (const coin of coins) {
      if (coin.collected) continue;

      ctx.save();
      ctx.translate(coin.x, coin.y);

      const spinScale = Math.cos(animTime * 6 + coin.id * 0.4);
      ctx.scale(Math.abs(spinScale), 1);

      ctx.fillStyle = '#eab308';
      ctx.beginPath();
      ctx.arc(0, 0, coin.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(0, 0, coin.radius - 2.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ca8a04';
      ctx.fillRect(-2, -5, 4, 10);
      ctx.fillRect(-5, -2, 10, 4);

      ctx.restore();
    }
    ctx.restore();
  }

  public renderDebugHitboxes(
    ctx: CanvasRenderingContext2D,
    playerBox: BoundingBox,
    fairHitbox: BoundingBox,
    obstacles: (ZapperObstacle | MissileObstacle)[],
    vy: number,
    netAcceleration: number
  ) {
    ctx.save();

    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(playerBox.left, playerBox.top, playerBox.width, playerBox.height);

    ctx.fillStyle = 'rgba(34, 197, 94, 0.25)';
    ctx.fillRect(fairHitbox.left, fairHitbox.top, fairHitbox.width, fairHitbox.height);
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 2;
    ctx.setLineDash([]);
    ctx.strokeRect(fairHitbox.left, fairHitbox.top, fairHitbox.width, fairHitbox.height);

    const centerX = fairHitbox.left + fairHitbox.width / 2;
    const centerY = fairHitbox.top + fairHitbox.height / 2;
    const arrowLength = vy * 0.08;
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(centerX, centerY + arrowLength);
    ctx.stroke();

    for (const obs of obstacles) {
      if (obs.type === 'missile') {
        const m = obs as MissileObstacle;
        if (m.state === 'LAUNCHED') {
          ctx.fillStyle = 'rgba(239, 68, 68, 0.3)';
          ctx.fillRect(m.hitbox.left, m.hitbox.top, m.hitbox.width, m.hitbox.height);
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(m.hitbox.left, m.hitbox.top, m.hitbox.width, m.hitbox.height);
        }
      } else {
        const z = obs as ZapperObstacle;
        ctx.fillStyle = 'rgba(239, 68, 68, 0.28)';
        ctx.fillRect(z.hitbox.left, z.hitbox.top, z.hitbox.width, z.hitbox.height);
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(z.hitbox.left, z.hitbox.top, z.hitbox.width, z.hitbox.height);
      }
    }

    ctx.restore();
  }
}
