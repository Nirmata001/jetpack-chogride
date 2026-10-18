/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { CharacterDef } from '../../types/game';

export interface CharacterAnimState {
  mode: 'RUN' | 'FLY' | 'IDLE' | 'DEAD';
  animTime: number;
  vy: number;
  isFiring: boolean;
  isGrounded: boolean;
  isDead: boolean;
  speed: number;
}

/**
 * Procedural 3D Hierarchical Mesh & Animation System
 * Builds a true 3D cartoon character matching the reference photos:
 * - Iconic multi-pointed 3D purple star hood with faceted geometry
 * - Chibi cream face, expressive glossy anime eyes with double sparkle highlights
 * - Rosy blush cheeks & cute button nose
 * - Streetwear hoodie with zipper & white collar
 * - Chunky cartoon sneakers with rubber treads
 * - Dual cosmic rocket thrusters with dynamic emissive flame
 */
export class Character3DModel {
  public root: THREE.Group;
  public characterId: string;

  // Hierarchical Body Nodes
  public hips: THREE.Group;
  public torso: THREE.Group;
  public head: THREE.Group;
  public starHood: THREE.Group;
  public jetpack: THREE.Group;
  public flameCore: THREE.Mesh;
  public flameCorona: THREE.Mesh;
  public jetpackLight: THREE.PointLight;

  // Limbs
  public leftThigh: THREE.Group;
  public leftShin: THREE.Group;
  public leftFoot: THREE.Group;
  public rightThigh: THREE.Group;
  public rightShin: THREE.Group;
  public rightFoot: THREE.Group;

  public leftArm: THREE.Group;
  public rightArm: THREE.Group;

  // Face elements
  public leftEye: THREE.Group;
  public rightEye: THREE.Group;
  public deadEyes: THREE.Group;

  // Materials for disposal
  private materials: THREE.Material[] = [];
  private geometries: THREE.BufferGeometry[] = [];

  constructor(character: CharacterDef) {
    this.characterId = character.id;
    this.root = new THREE.Group();

    // Create Hierarchical Skeleton Groups
    this.hips = new THREE.Group();
    this.torso = new THREE.Group();
    this.head = new THREE.Group();
    this.starHood = new THREE.Group();
    this.jetpack = new THREE.Group();

    this.leftThigh = new THREE.Group();
    this.leftShin = new THREE.Group();
    this.leftFoot = new THREE.Group();
    this.rightThigh = new THREE.Group();
    this.rightShin = new THREE.Group();
    this.rightFoot = new THREE.Group();

    this.leftArm = new THREE.Group();
    this.rightArm = new THREE.Group();

    this.leftEye = new THREE.Group();
    this.rightEye = new THREE.Group();
    this.deadEyes = new THREE.Group();

    // Jetpack lighting & flames
    this.jetpackLight = new THREE.PointLight(0xc084fc, 0, 50);
    this.flameCore = new THREE.Mesh();
    this.flameCorona = new THREE.Mesh();

    // Build Character Hierarchy
    this.buildHierarchy();
    if (character.id === 'chog') {
      this.buildChogMeshes();
    } else {
      this.buildDefaultHeroMeshes(character);
    }
  }

  private trackMaterial<T extends THREE.Material>(mat: T): T {
    this.materials.push(mat);
    return mat;
  }

  private trackGeometry<T extends THREE.BufferGeometry>(geo: T): T {
    this.geometries.push(geo);
    return geo;
  }

  private buildHierarchy() {
    this.root.add(this.hips);

    // Hips -> Torso -> Head
    this.hips.add(this.torso);
    this.torso.position.y = 10;

    this.torso.add(this.head);
    this.head.position.y = 16;

    // Torso -> Jetpack
    this.torso.add(this.jetpack);
    this.jetpack.position.set(-8, 2, 0);

    // Torso -> Arms
    this.torso.add(this.leftArm);
    this.torso.add(this.rightArm);
    this.leftArm.position.set(2, 8, -7);
    this.rightArm.position.set(2, 8, 7);

    // Hips -> Legs
    this.hips.add(this.leftThigh);
    this.hips.add(this.rightThigh);
    this.leftThigh.position.set(0, 0, -5);
    this.rightThigh.position.set(0, 0, 5);

    this.leftThigh.add(this.leftShin);
    this.leftShin.position.y = -8;
    this.leftShin.add(this.leftFoot);
    this.leftFoot.position.y = -8;

    this.rightThigh.add(this.rightShin);
    this.rightShin.position.y = -8;
    this.rightShin.add(this.rightFoot);
    this.rightFoot.position.y = -8;
  }

  /**
   * Build 3D Chog Model: The Iconic Purple Hedgehog Mascot
   */
  private buildChogMeshes() {
    // ----------------- MATERIAL PALETTE -----------------
    const furMat = this.trackMaterial(
      new THREE.MeshStandardMaterial({
        color: 0x7e22ce, // Monad royal purple
        roughness: 0.5,
        metalness: 0.08,
      })
    );
    const darkFurMat = this.trackMaterial(
      new THREE.MeshStandardMaterial({
        color: 0x581c87, // Deep shadow purple
        roughness: 0.6,
        metalness: 0.05,
      })
    );
    const quillHighlightMat = this.trackMaterial(
      new THREE.MeshStandardMaterial({
        color: 0xa855f7, // Amethyst quill dorsal highlight
        roughness: 0.35,
        metalness: 0.15,
      })
    );
    const peachMuzzleMat = this.trackMaterial(
      new THREE.MeshStandardMaterial({
        color: 0xffedd5, // Peach / warm cream snout & belly
        roughness: 0.55,
      })
    );
    const pinkEarMat = this.trackMaterial(
      new THREE.MeshStandardMaterial({
        color: 0xf472b6, // Tender pink inner ear
        roughness: 0.5,
      })
    );
    const blackNoseMat = this.trackMaterial(
      new THREE.MeshStandardMaterial({
        color: 0x09090b, // Glossy black nose button
        roughness: 0.15,
        metalness: 0.3,
      })
    );
    const whiteMat = this.trackMaterial(
      new THREE.MeshStandardMaterial({
        color: 0xf8fafc,
        roughness: 0.35,
      })
    );
    const chromeMat = this.trackMaterial(
      new THREE.MeshStandardMaterial({
        color: 0x94a3b8,
        metalness: 0.85,
        roughness: 0.2,
      })
    );
    const goldMat = this.trackMaterial(
      new THREE.MeshStandardMaterial({
        color: 0xfacc15,
        metalness: 0.85,
        roughness: 0.25,
      })
    );
    const strapMat = this.trackMaterial(
      new THREE.MeshStandardMaterial({
        color: 0x1e1b4b,
        roughness: 0.65,
      })
    );

    // ----------------- 1. TORSO: CHUBBY HEDGEHOG BODY & PEACH BELLY -----------------
    const bodyGeo = this.trackGeometry(new THREE.SphereGeometry(8, 20, 20));
    const bodyMesh = new THREE.Mesh(bodyGeo, furMat);
    bodyMesh.scale.set(1.0, 1.15, 0.95);
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    this.torso.add(bodyMesh);

    // Iconic Peach / Cream Tummy Patch (Front Belly)
    const bellyGeo = this.trackGeometry(new THREE.SphereGeometry(6.6, 18, 18));
    const bellyMesh = new THREE.Mesh(bellyGeo, peachMuzzleMat);
    bellyMesh.scale.set(0.42, 1.05, 0.88);
    bellyMesh.position.set(5.2, -0.6, 0);
    this.torso.add(bellyMesh);

    // Tactical Chest Harness Straps
    const harnessHGeo = this.trackGeometry(new THREE.CylinderGeometry(8.1, 8.1, 1.6, 20, 1, true));
    const harnessHMesh = new THREE.Mesh(harnessHGeo, strapMat);
    harnessHMesh.position.set(0, 1.5, 0);
    this.torso.add(harnessHMesh);

    // Golden Central Medallion Buckle
    const buckleGeo = this.trackGeometry(new THREE.CylinderGeometry(1.8, 1.8, 0.8, 16));
    const buckleMesh = new THREE.Mesh(buckleGeo, goldMat);
    buckleMesh.rotation.z = Math.PI / 2;
    buckleMesh.position.set(7.6, 1.5, 0);
    this.torso.add(buckleMesh);

    // Cute Little Hedgehog Tail at Back
    const tailGeo = this.trackGeometry(new THREE.ConeGeometry(2, 4.5, 10));
    const tailMesh = new THREE.Mesh(tailGeo, darkFurMat);
    tailMesh.rotation.z = (Math.PI * 3) / 4;
    tailMesh.position.set(-7.5, -4, 0);
    this.torso.add(tailMesh);

    // ----------------- 2. HEAD: PURPLE CRANIUM, EARS, BROW & SNOUT -----------------
    const headGeo = this.trackGeometry(new THREE.SphereGeometry(9.6, 24, 24));
    const headMesh = new THREE.Mesh(headGeo, furMat);
    headMesh.castShadow = true;
    this.head.add(headMesh);

    // Protruding Peach Snout / Muzzle
    const snoutGeo = this.trackGeometry(new THREE.SphereGeometry(5.4, 20, 20));
    const snoutMesh = new THREE.Mesh(snoutGeo, peachMuzzleMat);
    snoutMesh.scale.set(1.22, 0.82, 1.05);
    snoutMesh.position.set(7.2, -2.4, 0);
    snoutMesh.castShadow = true;
    this.head.add(snoutMesh);

    // Glossy Black Button Nose at tip of snout
    const noseGeo = this.trackGeometry(new THREE.SphereGeometry(1.35, 14, 14));
    const noseMesh = new THREE.Mesh(noseGeo, blackNoseMat);
    noseMesh.position.set(13.4, -1.3, 0);
    this.head.add(noseMesh);

    // White Specular Nose Glint Dot
    const noseGlint = new THREE.Mesh(this.trackGeometry(new THREE.SphereGeometry(0.35, 8, 8)), whiteMat);
    noseGlint.position.set(14.0, -0.9, 0.4);
    this.head.add(noseGlint);

    // Cheeky Mouth Smirk on Muzzle
    const mouthMat = this.trackMaterial(new THREE.MeshBasicMaterial({ color: 0x1e1b4b }));
    const mouthGeo = this.trackGeometry(new THREE.TorusGeometry(1.8, 0.35, 8, 14, Math.PI * 0.85));
    const mouthMesh = new THREE.Mesh(mouthGeo, mouthMat);
    mouthMesh.rotation.y = Math.PI / 2;
    mouthMesh.rotation.x = Math.PI * 0.95;
    mouthMesh.position.set(11.2, -4.0, 0.8);
    this.head.add(mouthMesh);

    // Cute White Tooth Glint
    const toothGeo = this.trackGeometry(new THREE.ConeGeometry(0.6, 1.0, 3));
    const toothMesh = new THREE.Mesh(toothGeo, whiteMat);
    toothMesh.rotation.x = Math.PI;
    toothMesh.position.set(11.4, -3.4, 0.6);
    this.head.add(toothMesh);

    // Prominent Sculpted Brow Ridge
    const browGeo = this.trackGeometry(new THREE.TorusGeometry(7.2, 1.3, 8, 20, Math.PI * 0.65));
    const browMesh = new THREE.Mesh(browGeo, quillHighlightMat);
    browMesh.rotation.y = Math.PI / 2;
    browMesh.rotation.z = -Math.PI / 3.4;
    browMesh.position.set(5.5, 3.8, 0);
    this.head.add(browMesh);

    // Pointed Hedgehog Ears With Pink Inner Cavity
    const buildEar = (isRight: boolean) => {
      const earGroup = new THREE.Group();
      const zOffset = isRight ? 6.2 : -6.2;
      earGroup.position.set(-1.2, 8.8, zOffset);
      earGroup.rotation.x = isRight ? 0.35 : -0.35;
      earGroup.rotation.y = isRight ? -0.2 : 0.2;
      earGroup.rotation.z = -0.3;

      const outerEarGeo = this.trackGeometry(new THREE.ConeGeometry(3.0, 6.5, 12));
      const outerEarMesh = new THREE.Mesh(outerEarGeo, furMat);
      outerEarMesh.scale.set(0.65, 1, 1);
      earGroup.add(outerEarMesh);

      const innerEarGeo = this.trackGeometry(new THREE.ConeGeometry(2.1, 5.0, 10));
      const innerEarMesh = new THREE.Mesh(innerEarGeo, pinkEarMat);
      innerEarMesh.scale.set(0.55, 0.9, 0.85);
      innerEarMesh.position.set(0.5, 0, 0);
      earGroup.add(innerEarMesh);

      this.head.add(earGroup);
    };
    buildEar(false);
    buildEar(true);

    // ----------------- 3. ICONIC SWEEPING HEDGEHOG QUILLS / SPINES -----------------
    this.head.add(this.starHood);

    const spines = [
      { x: -3, y: 7.5, z: 0, rotX: 0, rotY: 0, rotZ: Math.PI / 2.7, length: 18, baseRadius: 4.2 },
      { x: -4, y: 6.5, z: -4.5, rotX: -0.25, rotY: -0.2, rotZ: Math.PI / 2.6, length: 16, baseRadius: 3.8 },
      { x: -4, y: 6.5, z: 4.5, rotX: 0.25, rotY: 0.2, rotZ: Math.PI / 2.6, length: 16, baseRadius: 3.8 },
      { x: -6.5, y: 2.5, z: 0, rotX: 0, rotY: 0, rotZ: Math.PI / 2.3, length: 17, baseRadius: 4.0 },
      { x: -6.0, y: 1.5, z: -5.0, rotX: -0.3, rotY: -0.25, rotZ: Math.PI / 2.2, length: 14.5, baseRadius: 3.5 },
      { x: -6.0, y: 1.5, z: 5.0, rotX: 0.3, rotY: 0.25, rotZ: Math.PI / 2.2, length: 14.5, baseRadius: 3.5 },
      { x: -6.8, y: -2.5, z: 0, rotX: 0, rotY: 0, rotZ: Math.PI / 2.1, length: 13, baseRadius: 3.2 },
    ];

    for (const s of spines) {
      const quillGroup = new THREE.Group();
      quillGroup.position.set(s.x, s.y, s.z);
      quillGroup.rotation.set(s.rotX, s.rotY, s.rotZ);

      const quillGeo = this.trackGeometry(new THREE.ConeGeometry(s.baseRadius, s.length, 12));
      const quillMesh = new THREE.Mesh(quillGeo, quillHighlightMat);
      quillMesh.position.y = s.length / 2;
      quillMesh.castShadow = true;
      quillGroup.add(quillMesh);

      const underGeo = this.trackGeometry(new THREE.ConeGeometry(s.baseRadius * 0.95, s.length * 0.9, 8));
      const underMesh = new THREE.Mesh(underGeo, darkFurMat);
      underMesh.position.set(-0.4, (s.length * 0.9) / 2, 0);
      quillGroup.add(underMesh);

      this.starHood.add(quillGroup);
    }

    // ----------------- 4. EXPRESSIVE CARTOON EYES -----------------
    const eyePupilMat = this.trackMaterial(new THREE.MeshBasicMaterial({ color: 0x020617 }));
    const irisMat = this.trackMaterial(new THREE.MeshBasicMaterial({ color: 0x4c1d95 }));
    const scleraMat = this.trackMaterial(new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 }));
    const glintMat = this.trackMaterial(new THREE.MeshBasicMaterial({ color: 0xffffff }));

    const buildEyeMesh = (isRight: boolean) => {
      const group = isRight ? this.rightEye : this.leftEye;
      const zOffset = isRight ? 3.4 : -3.4;
      const yRot = isRight ? -0.32 : 0.32;

      // White Sclera Egg
      const scleraGeo = this.trackGeometry(new THREE.SphereGeometry(3.0, 16, 16));
      const scleraMesh = new THREE.Mesh(scleraGeo, scleraMat);
      scleraMesh.scale.set(0.65, 1.15, 0.85);
      group.add(scleraMesh);

      // Dark Pupil / Iris Disc
      const pupilGeo = this.trackGeometry(new THREE.CylinderGeometry(1.6, 1.6, 0.4, 16));
      const pupilMesh = new THREE.Mesh(pupilGeo, irisMat);
      pupilMesh.rotation.z = Math.PI / 2;
      pupilMesh.position.set(1.6, 0.2, 0.2);
      group.add(pupilMesh);

      const pupilCoreMesh = new THREE.Mesh(this.trackGeometry(new THREE.CylinderGeometry(1.1, 1.1, 0.45, 16)), eyePupilMat);
      pupilCoreMesh.rotation.z = Math.PI / 2;
      pupilCoreMesh.position.set(1.7, 0.2, 0.2);
      group.add(pupilCoreMesh);

      // Large Specular Glint Dot
      const glint1 = new THREE.Mesh(this.trackGeometry(new THREE.SphereGeometry(0.75, 8, 8)), glintMat);
      glint1.position.set(1.9, 1.1, 0.6);
      group.add(glint1);

      // Secondary Small Specular Glint
      const glint2 = new THREE.Mesh(this.trackGeometry(new THREE.SphereGeometry(0.38, 8, 8)), glintMat);
      glint2.position.set(1.9, -0.6, -0.4);
      group.add(glint2);

      group.position.set(8.8, 1.8, zOffset);
      group.rotation.y = yRot;
      group.rotation.x = isRight ? 0.08 : -0.08;
      this.head.add(group);
    };

    buildEyeMesh(false);
    buildEyeMesh(true);

    // Knockout 'X X' Eyes (For Death Animation)
    this.deadEyes.visible = false;
    const xMat = this.trackMaterial(new THREE.MeshBasicMaterial({ color: 0x0f172a }));
    const xGeo = this.trackGeometry(new THREE.BoxGeometry(0.4, 3, 0.5));
    const x1 = new THREE.Mesh(xGeo, xMat);
    x1.rotation.z = Math.PI / 4;
    const x2 = new THREE.Mesh(xGeo, xMat);
    x2.rotation.z = -Math.PI / 4;
    const xLeft = new THREE.Group();
    xLeft.add(x1, x2);
    xLeft.position.set(9.0, 1.8, -3.4);
    xLeft.rotation.y = 0.32;
    this.deadEyes.add(xLeft);

    const xRight = xLeft.clone();
    xRight.position.set(9.0, 1.8, 3.4);
    xRight.rotation.y = -0.32;
    this.deadEyes.add(xRight);
    this.head.add(this.deadEyes);

    // ----------------- 5. LEGS & CHUNKY CARTOON RUNNING SNEAKERS -----------------
    const legFurMat = furMat;
    const soleMat = whiteMat;
    const sneakerUpperMat = this.trackMaterial(new THREE.MeshStandardMaterial({ color: 0x9333ea, roughness: 0.35 }));
    const sneakerRedMat = this.trackMaterial(new THREE.MeshStandardMaterial({ color: 0xe11d48, roughness: 0.35 }));

    const buildLeg = (thighGroup: THREE.Group, shinGroup: THREE.Group, footGroup: THREE.Group) => {
      // Purple Furry Thigh
      const thighGeo = this.trackGeometry(new THREE.CylinderGeometry(2.6, 2.3, 8, 14));
      const thighMesh = new THREE.Mesh(thighGeo, legFurMat);
      thighMesh.position.y = -4;
      thighGroup.add(thighMesh);

      // Purple Shin
      const shinGeo = this.trackGeometry(new THREE.CylinderGeometry(2.3, 2.0, 8, 14));
      const shinMesh = new THREE.Mesh(shinGeo, legFurMat);
      shinMesh.position.y = -4;
      shinGroup.add(shinMesh);

      // Chunky Cartoon Sneaker
      const upperGeo = this.trackGeometry(new THREE.BoxGeometry(9.5, 5.0, 5.2));
      const upperMesh = new THREE.Mesh(upperGeo, sneakerUpperMat);
      upperMesh.position.set(2, -2, 0);
      footGroup.add(upperMesh);

      // Crimson Accent Stripe
      const stripeGeo = this.trackGeometry(new THREE.BoxGeometry(10, 1.4, 5.4));
      const stripeMesh = new THREE.Mesh(stripeGeo, sneakerRedMat);
      stripeMesh.position.set(2, -1.8, 0);
      footGroup.add(stripeMesh);

      // Rounded White Rubber Toe Cap
      const toeGeo = this.trackGeometry(new THREE.SphereGeometry(2.8, 14, 14));
      const toeMesh = new THREE.Mesh(toeGeo, whiteMat);
      toeMesh.scale.set(1.1, 0.9, 0.95);
      toeMesh.position.set(5.8, -2.6, 0);
      footGroup.add(toeMesh);

      // Thick White Rubber Sole with Tread Grooves
      const soleGeo = this.trackGeometry(new THREE.BoxGeometry(11.8, 2.8, 6.2));
      const soleMesh = new THREE.Mesh(soleGeo, soleMat);
      soleMesh.position.set(2, -4.6, 0);
      soleMesh.castShadow = true;
      footGroup.add(soleMesh);

      // Golden Ankle Buckle / Ring
      const ringGeo = this.trackGeometry(new THREE.TorusGeometry(2.6, 0.5, 8, 16));
      const ringMesh = new THREE.Mesh(ringGeo, goldMat);
      ringMesh.rotation.x = Math.PI / 2;
      ringMesh.position.set(0, 0, 0);
      footGroup.add(ringMesh);
    };

    buildLeg(this.leftThigh, this.leftShin, this.leftFoot);
    buildLeg(this.rightThigh, this.rightShin, this.rightFoot);

    // ----------------- 6. ARMS & WHITE CARTOON PUFFY GLOVES -----------------
    const buildArm = (armGroup: THREE.Group, isRight: boolean) => {
      // Purple Arm
      const armGeo = this.trackGeometry(new THREE.CylinderGeometry(2.4, 2.1, 9, 14));
      const armMesh = new THREE.Mesh(armGeo, furMat);
      armMesh.position.y = -4.5;
      armGroup.add(armMesh);

      // Rolled White Glove Cuff Ring
      const cuffGeo = this.trackGeometry(new THREE.TorusGeometry(2.6, 0.8, 8, 16));
      const cuffMesh = new THREE.Mesh(cuffGeo, whiteMat);
      cuffMesh.rotation.x = Math.PI / 2;
      cuffMesh.position.y = -8.5;
      armGroup.add(cuffMesh);

      // White Puffy Cartoon Glove Hand
      const handGeo = this.trackGeometry(new THREE.SphereGeometry(3.0, 14, 14));
      const handMesh = new THREE.Mesh(handGeo, whiteMat);
      handMesh.position.y = -10.5;
      armGroup.add(handMesh);

      // Chrome Flight Control Grips
      const gripGeo = this.trackGeometry(new THREE.CylinderGeometry(0.8, 0.8, 6.5, 10));
      const gripMesh = new THREE.Mesh(gripGeo, chromeMat);
      gripMesh.position.set(0, -10.5, 0);
      armGroup.add(gripMesh);

      // Red Throttle Trigger Button
      const redBtnGeo = this.trackGeometry(new THREE.SphereGeometry(0.8, 8, 8));
      const redBtnMesh = new THREE.Mesh(redBtnGeo, sneakerRedMat);
      redBtnMesh.position.set(0, -7.2, 0);
      armGroup.add(redBtnMesh);
    };

    buildArm(this.leftArm, false);
    buildArm(this.rightArm, true);

    // ----------------- 7. SCI-FI COSMIC JETPACK (TITANIUM & PURPLE) -----------------
    const packChromeMat = this.trackMaterial(
      new THREE.MeshStandardMaterial({
        color: 0x94a3b8,
        metalness: 0.85,
        roughness: 0.2,
      })
    );
    const packPurpleMat = this.trackMaterial(
      new THREE.MeshStandardMaterial({
        color: 0x6b21a8,
        metalness: 0.5,
        roughness: 0.25,
      })
    );
    const nozzleMat = this.trackMaterial(
      new THREE.MeshStandardMaterial({
        color: 0x334155,
        metalness: 0.85,
        roughness: 0.25,
      })
    );

    // Dual Rocket Thruster Cylinders
    const cylinderGeo = this.trackGeometry(new THREE.CylinderGeometry(3.8, 4.0, 18, 18));
    const cylL = new THREE.Mesh(cylinderGeo, packChromeMat);
    cylL.position.set(0, 0, -4.2);
    this.jetpack.add(cylL);

    const cylR = new THREE.Mesh(cylinderGeo, packChromeMat);
    cylR.position.set(0, 0, 4.2);
    this.jetpack.add(cylR);

    // Purple Accent Rings on Thrusters
    const bandGeo = this.trackGeometry(new THREE.CylinderGeometry(4.1, 4.1, 4.5, 18));
    const bandL = new THREE.Mesh(bandGeo, packPurpleMat);
    bandL.position.set(0, 2, -4.2);
    this.jetpack.add(bandL);

    const bandR = new THREE.Mesh(bandGeo, packPurpleMat);
    bandR.position.set(0, 2, 4.2);
    this.jetpack.add(bandR);

    // Central Cosmic Power Core
    const coreCasingGeo = this.trackGeometry(new THREE.BoxGeometry(6, 12, 7.5));
    const coreCasing = new THREE.Mesh(coreCasingGeo, packPurpleMat);
    coreCasing.position.set(-1.5, 0, 0);
    this.jetpack.add(coreCasing);

    // Glowing Star Medallion on Jetpack
    const starMedallionGeo = this.trackGeometry(new THREE.CylinderGeometry(2.4, 2.4, 1.2, 16));
    const starMedallion = new THREE.Mesh(starMedallionGeo, goldMat);
    starMedallion.rotation.z = Math.PI / 2;
    starMedallion.position.set(-4.6, 0, 0);
    this.jetpack.add(starMedallion);

    // Exhaust Nozzles
    const nozzleGeo = this.trackGeometry(new THREE.CylinderGeometry(2.8, 4.0, 6.5, 16));
    const nozzleL = new THREE.Mesh(nozzleGeo, nozzleMat);
    nozzleL.position.set(0, -11, -4.2);
    this.jetpack.add(nozzleL);

    const nozzleR = new THREE.Mesh(nozzleGeo, nozzleMat);
    nozzleR.position.set(0, -11, 4.2);
    this.jetpack.add(nozzleR);

    // Dynamic 3D Thrust Flame Cones
    const flameCoreMat = this.trackMaterial(
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.95,
      })
    );
    const flameCoronaMat = this.trackMaterial(
      new THREE.MeshBasicMaterial({
        color: 0xc084fc,
        transparent: true,
        opacity: 0.75,
      })
    );

    const flameGeo = this.trackGeometry(new THREE.ConeGeometry(3.5, 20, 16));
    flameGeo.rotateX(Math.PI);
    this.flameCorona = new THREE.Mesh(flameGeo, flameCoronaMat);
    this.flameCorona.position.set(0, -23, 0);
    this.jetpack.add(this.flameCorona);

    const flameCoreGeo = this.trackGeometry(new THREE.ConeGeometry(1.8, 14, 16));
    flameCoreGeo.rotateX(Math.PI);
    this.flameCore = new THREE.Mesh(flameCoreGeo, flameCoreMat);
    this.flameCore.position.set(0, -19, 0);
    this.jetpack.add(this.flameCore);

    this.jetpack.add(this.jetpackLight);
    this.jetpackLight.position.set(0, -16, 0);
  }

  /**
   * Fallback for other characters (styled cleanly with their accent colors)
   */
  private buildDefaultHeroMeshes(char: CharacterDef) {
    const mainMat = this.trackMaterial(
      new THREE.MeshStandardMaterial({
        color: char.accentColor,
        roughness: 0.4,
      })
    );
    const secMat = this.trackMaterial(
      new THREE.MeshStandardMaterial({
        color: char.secondaryColor,
        roughness: 0.5,
      })
    );
    const skinMat = this.trackMaterial(
      new THREE.MeshStandardMaterial({
        color: 0xfed7aa,
        roughness: 0.6,
      })
    );

    const torsoGeo = this.trackGeometry(new THREE.CylinderGeometry(7, 8, 16, 16));
    this.torso.add(new THREE.Mesh(torsoGeo, secMat));

    const headGeo = this.trackGeometry(new THREE.SphereGeometry(9, 20, 20));
    this.head.add(new THREE.Mesh(headGeo, skinMat));

    const packGeo = this.trackGeometry(new THREE.BoxGeometry(8, 16, 12));
    this.jetpack.add(new THREE.Mesh(packGeo, mainMat));
  }

  /**
   * Biomechanical Multi-Track Procedural Animation Engine
   * Smoothly animates hips, knees, feet, arms, spine, and head
   */
  public update(anim: CharacterAnimState) {
    const { mode, animTime, vy, isFiring, isGrounded, isDead } = anim;

    // Handle Eye Expression
    if (this.deadEyes) {
      this.deadEyes.visible = isDead;
    }
    if (this.leftEye && this.rightEye) {
      this.leftEye.visible = !isDead;
      this.rightEye.visible = !isDead;
    }

    // Jetpack Flame Illumination
    if (isFiring && !isDead) {
      const flicker = 0.85 + Math.sin(animTime * 45) * 0.15;
      this.flameCorona.visible = true;
      this.flameCore.visible = true;
      this.flameCorona.scale.set(flicker, flicker * 1.2, flicker);
      this.flameCore.scale.set(flicker * 0.9, flicker * 1.1, flicker * 0.9);
      this.jetpackLight.intensity = 4.5 * flicker;
    } else {
      this.flameCorona.visible = false;
      this.flameCore.visible = false;
      this.jetpackLight.intensity = 0;
    }

    // ----------------- ANIMATION MODES -----------------
    if (isDead) {
      // Tumble / Ragdoll Spin
      this.root.rotation.z += 0.15;
      this.root.rotation.x = Math.sin(animTime * 8) * 0.5;
      this.torso.rotation.x = 0.3;
      this.leftThigh.rotation.z = -0.6;
      this.rightThigh.rotation.z = 0.6;
      this.leftArm.rotation.z = 1.2;
      this.rightArm.rotation.z = -1.2;
      return;
    }

    if (mode === 'RUN' && isGrounded) {
      // ================= 1. TRUE RUNNING BIOMECHANICS =================
      const runSpeed = 14;
      const t = animTime * runSpeed;

      // Hips: Vertical double-bounce & slight lateral hip sway
      const hipBounce = Math.abs(Math.sin(t)) * 2.2;
      const hipSway = Math.sin(t * 0.5) * 0.08;
      this.hips.position.y = hipBounce;
      this.hips.rotation.y = hipSway;

      // Torso: Athletic forward lean
      this.torso.rotation.z = -0.18;
      this.torso.rotation.y = -hipSway * 0.5;

      // Head: Counter-balance look-ahead with gentle nod
      this.head.rotation.z = 0.14 + Math.sin(t * 2) * 0.04;

      // Legs: Kinematic stride cycle
      const legStride = Math.sin(t) * 0.75;
      // Left Leg
      this.leftThigh.rotation.z = legStride;
      this.leftShin.rotation.z = legStride > 0 ? 0.2 : -Math.sin(t) * 0.9;
      this.leftFoot.rotation.z = -this.leftThigh.rotation.z - this.leftShin.rotation.z;

      // Right Leg (Anti-phase)
      this.rightThigh.rotation.z = -legStride;
      this.rightShin.rotation.z = -legStride > 0 ? 0.2 : Math.sin(t) * 0.9;
      this.rightFoot.rotation.z = -this.rightThigh.rotation.z - this.rightShin.rotation.z;

      // Arms: Dynamic running pump holding jetpack grips
      this.leftArm.rotation.z = -legStride * 0.6 + 0.3;
      this.rightArm.rotation.z = legStride * 0.6 + 0.3;
      this.leftArm.rotation.x = 0.2;
      this.rightArm.rotation.x = -0.2;

      // Star hood subtle inertia jiggle
      this.starHood.rotation.z = Math.sin(t * 2) * 0.05;

    } else if (mode === 'FLY' || !isGrounded) {
      // ================= 2. AERODYNAMIC IN-FLIGHT JETPACK POSE =================
      const pitch = isFiring ? -0.32 : Math.max(-0.25, Math.min(0.35, vy * 0.0006));
      this.root.rotation.z = pitch;

      // Smooth Spine Curve
      this.torso.rotation.z = -0.15;
      this.head.rotation.z = 0.22 - pitch * 0.5; // Keeps head looking forward along trajectory

      // Legs swept back aerodynamically
      this.leftThigh.rotation.z = -0.55 + Math.sin(animTime * 4) * 0.05;
      this.leftShin.rotation.z = 0.35;
      this.leftFoot.rotation.z = 0.2;

      this.rightThigh.rotation.z = -0.42 - Math.sin(animTime * 4) * 0.05;
      this.rightShin.rotation.z = 0.45;
      this.rightFoot.rotation.z = 0.15;

      // Arms reaching forward grasping control sticks tightly
      const recoil = isFiring ? Math.sin(animTime * 35) * 0.04 : 0;
      this.leftArm.rotation.z = 0.75 + recoil;
      this.rightArm.rotation.z = 0.75 + recoil;
      this.leftArm.rotation.x = 0.15;
      this.rightArm.rotation.x = -0.15;

      // Hedgehog quills aerodynamic wind drag & dynamic flutter
      this.starHood.rotation.z = -0.12 + Math.sin(animTime * 14) * 0.04;
      this.starHood.rotation.y = Math.cos(animTime * 10) * 0.03;

    } else {
      // ================= 3. IDLE BREATHE POSE =================
      const breathe = Math.sin(animTime * 2.5);
      this.torso.position.y = 10 + breathe * 0.4;
      this.torso.rotation.z = 0;
      this.head.rotation.z = -breathe * 0.03;

      this.leftThigh.rotation.z = -0.05;
      this.leftShin.rotation.z = 0.05;
      this.rightThigh.rotation.z = 0.05;
      this.rightShin.rotation.z = -0.05;

      this.leftArm.rotation.z = 0.1 + breathe * 0.05;
      this.rightArm.rotation.z = 0.1 + breathe * 0.05;
      this.leftArm.rotation.x = 0;
      this.rightArm.rotation.x = 0;
      this.root.rotation.z = 0;
    }
  }

  public dispose() {
    for (const geo of this.geometries) {
      geo.dispose();
    }
    for (const mat of this.materials) {
      mat.dispose();
    }
  }
}
