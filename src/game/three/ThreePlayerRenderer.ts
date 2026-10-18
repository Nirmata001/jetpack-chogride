/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { CharacterDef } from '../../types/game';
import { Character3DModel } from './Character3DModel';

/**
 * ThreePlayerRenderer
 * Bridges Three.js hardware-accelerated 3D character rendering directly into the 2D game canvas.
 * Sets up professional 3D studio lighting, anti-aliased alpha buffer, and multi-track animation.
 */
export class ThreePlayerRenderer {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private characterModel: Character3DModel | null = null;
  private currentCharacterId: string = '';

  private keyLight: THREE.DirectionalLight;
  private fillLight: THREE.DirectionalLight;
  private rimLight: THREE.DirectionalLight;
  private ambientLight: THREE.AmbientLight;

  // Offscreen rendering dimensions (high pixel density for crisp cartoon outlines)
  public readonly renderWidth = 160;
  public readonly renderHeight = 160;

  constructor() {
    // 1. Offscreen WebGL Canvas with Alpha transparency and Anti-Aliasing
    const canvas = document.createElement('canvas');
    canvas.width = this.renderWidth;
    canvas.height = this.renderHeight;

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(this.renderWidth, this.renderHeight, false);
    this.renderer.setPixelRatio(1);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;

    // 2. Scene
    this.scene = new THREE.Scene();

    // 3. Camera (Perspective angled slightly to show 3D depth and profile)
    this.camera = new THREE.PerspectiveCamera(38, this.renderWidth / this.renderHeight, 1, 1000);
    // Positioned to view character from 3/4 side profile (facing right with 3D depth)
    this.camera.position.set(38, 6, 78);
    this.camera.lookAt(2, 4, 0);

    // 4. Professional 3D Studio Lighting
    // Warm Key Light (Top-Right)
    this.keyLight = new THREE.DirectionalLight(0xfff7ed, 3.2);
    this.keyLight.position.set(45, 60, 50);
    this.scene.add(this.keyLight);

    // Cyan Fill Light (Soft cool ambient bounce from lab)
    this.fillLight = new THREE.DirectionalLight(0x38bdf8, 1.4);
    this.fillLight.position.set(-40, 20, 30);
    this.scene.add(this.fillLight);

    // Magenta / Gold Rim Light (Creates beautiful crisp silhouette rim on hood & jetpack)
    this.rimLight = new THREE.DirectionalLight(0xc084fc, 2.8);
    this.rimLight.position.set(-30, 40, -50);
    this.scene.add(this.rimLight);

    // Ambient Light
    this.ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    this.scene.add(this.ambientLight);
  }

  public setCharacter(character: CharacterDef) {
    if (this.characterModel && this.currentCharacterId === character.id) {
      return;
    }

    if (this.characterModel) {
      this.scene.remove(this.characterModel.root);
      this.characterModel.dispose();
      this.characterModel = null;
    }

    this.currentCharacterId = character.id;
    this.characterModel = new Character3DModel(character);
    // Face right (travel direction in game) with attractive 3D angle
    this.characterModel.root.rotation.y = Math.PI / 2.3;
    this.scene.add(this.characterModel.root);
  }

  /**
   * Render the 3D character onto the 2D Game Canvas at player position
   */
  public renderTo2DCanvas(
    ctx: CanvasRenderingContext2D,
    playerX: number,
    playerY: number,
    character: CharacterDef,
    animTime: number,
    vy: number,
    isFiring: boolean,
    isGrounded: boolean,
    isDead: boolean,
    deathTimer: number = 0
  ) {
    // Ensure character model is ready
    if (!this.characterModel || this.currentCharacterId !== character.id) {
      this.setCharacter(character);
    }

    if (!this.characterModel) return;

    // Update procedural biomechanical animation
    const mode = isDead ? 'DEAD' : (isGrounded ? 'RUN' : 'FLY');
    this.characterModel.update({
      mode,
      animTime,
      vy,
      isFiring,
      isGrounded,
      isDead,
      speed: 1,
    });

    // Render WebGL frame
    this.renderer.render(this.scene, this.camera);

    // Draw the rendered 3D frame directly onto the game canvas centered over the player
    // Player bounding box is roughly 44x52.
    // The render target is 160x160 with character centered at origin.
    // Drawing at width 82, height 82 centered at (playerX + 22, playerY + 26).
    const drawW = 86;
    const drawH = 86;
    const drawX = playerX + 22 - drawW / 2 + 3; // slight optical centering
    const drawY = playerY + 26 - drawH / 2 - 4;

    ctx.save();
    if (isDead) {
      ctx.translate(playerX + 22, playerY + 26);
      ctx.rotate(deathTimer * 8);
      ctx.drawImage(this.renderer.domElement, -drawW / 2, -drawH / 2, drawW, drawH);
    } else {
      ctx.drawImage(this.renderer.domElement, drawX, drawY, drawW, drawH);
    }
    ctx.restore();
  }

  public dispose() {
    if (this.characterModel) {
      this.characterModel.dispose();
    }
    this.renderer.dispose();
  }
}
