/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CharacterDef } from '../types/game';
import { Character3DModel } from '../game/three/Character3DModel';
import { RotateCw, Flame, Play, Eye, Sparkles } from 'lucide-react';

interface Character3DViewerProps {
  character: CharacterDef;
  className?: string;
}

export const Character3DViewer: React.FC<Character3DViewerProps> = ({
  character,
  className = '',
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [animState, setAnimState] = useState<'RUN' | 'FLY' | 'IDLE' | 'DEAD'>('RUN');
  const [isFiring, setIsFiring] = useState<boolean>(true);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);

  const sceneRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    model: Character3DModel | null;
    charId: string;
    targetRotationY: number;
    isDragging: boolean;
    prevMouseX: number;
  } | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth || 380;
    const height = container.clientHeight || 340;

    // 1. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // 2. Scene
    const scene = new THREE.Scene();

    // 3. Camera
    const camera = new THREE.PerspectiveCamera(40, width / height, 1, 1000);
    camera.position.set(0, 10, 85);
    camera.lookAt(0, 8, 0);

    // 4. Studio Lighting
    const keyLight = new THREE.DirectionalLight(0xfff7ed, 3.5);
    keyLight.position.set(40, 50, 40);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x38bdf8, 1.5);
    fillLight.position.set(-40, 20, 30);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xc084fc, 3.2);
    rimLight.position.set(-30, 40, -50);
    scene.add(rimLight);

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    // Circular Stage Platform Pod
    const stageGeo = new THREE.CylinderGeometry(24, 26, 4, 32);
    const stageMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.3,
      metalness: 0.8,
    });
    const stage = new THREE.Mesh(stageGeo, stageMat);
    stage.position.y = -10;
    stage.receiveShadow = true;
    scene.add(stage);

    // Stage Neon Ring
    const ringGeo = new THREE.TorusGeometry(24.2, 0.6, 16, 48);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xa855f7 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = -8;
    scene.add(ring);

    // 5. Initial Character Model
    const model = new Character3DModel(character);
    scene.add(model.root);

    sceneRef.current = {
      renderer,
      scene,
      camera,
      model,
      charId: character.id,
      targetRotationY: 0.4,
      isDragging: false,
      prevMouseX: 0,
    };

    // 6. Animation Loop
    let reqId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      reqId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsedTime = clock.getElapsedTime();

      if (sceneRef.current) {
        const { model: m } = sceneRef.current;
        if (m) {
          m.update({
            mode: animState,
            animTime: elapsedTime,
            vy: animState === 'FLY' ? (isFiring ? -300 : 100) : 0,
            isFiring: isFiring,
            isGrounded: animState === 'RUN' || animState === 'IDLE',
            isDead: animState === 'DEAD',
            speed: 1,
          });

          // Turntable Auto-rotation
          if (autoRotate && !sceneRef.current.isDragging) {
            sceneRef.current.targetRotationY += delta * 0.75;
          }

          // Smooth rotation damping
          m.root.rotation.y += (sceneRef.current.targetRotationY - m.root.rotation.y) * 0.1;
        }

        renderer.render(scene, camera);
      }
    };
    animate();

    // 7. Mouse Orbit Drag Handlers
    const onMouseDown = (e: MouseEvent) => {
      if (!sceneRef.current) return;
      sceneRef.current.isDragging = true;
      sceneRef.current.prevMouseX = e.clientX;
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!sceneRef.current || !sceneRef.current.isDragging) return;
      const deltaX = e.clientX - sceneRef.current.prevMouseX;
      sceneRef.current.prevMouseX = e.clientX;
      sceneRef.current.targetRotationY += deltaX * 0.012;
    };
    const onMouseUp = () => {
      if (sceneRef.current) sceneRef.current.isDragging = false;
    };

    const onTouchStart = (e: TouchEvent) => {
      if (!sceneRef.current || e.touches.length === 0) return;
      sceneRef.current.isDragging = true;
      sceneRef.current.prevMouseX = e.touches[0].clientX;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!sceneRef.current || !sceneRef.current.isDragging || e.touches.length === 0) return;
      const deltaX = e.touches[0].clientX - sceneRef.current.prevMouseX;
      sceneRef.current.prevMouseX = e.touches[0].clientX;
      sceneRef.current.targetRotationY += deltaX * 0.015;
    };
    const onTouchEnd = () => {
      if (sceneRef.current) sceneRef.current.isDragging = false;
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', onMouseDown);
    dom.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchend', onTouchEnd);

    // Resize handler
    const handleResize = () => {
      if (!container || !sceneRef.current) return;
      const newW = container.clientWidth || 380;
      const newH = container.clientHeight || 340;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(reqId);
      dom.removeEventListener('mousedown', onMouseDown);
      dom.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('resize', handleResize);
      if (model) model.dispose();
      renderer.dispose();
      if (container.contains(dom)) container.removeChild(dom);
    };
  }, [character.id, animState, isFiring, autoRotate]);

  return (
    <div className={`relative rounded-3xl bg-slate-950/90 border-2 border-purple-500/30 overflow-hidden shadow-2xl flex flex-col ${className}`}>
      {/* 3D Stage Header Badge */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-950/80 border border-purple-500/40 text-purple-300 text-xs font-arcade font-bold tracking-wider backdrop-blur-md">
        <Sparkles className="w-3.5 h-3.5" />
        <span>3D HOLOGRAPHIC STAGE</span>
      </div>

      <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5">
        <button
          onClick={() => setAutoRotate(!autoRotate)}
          className={`arcade-btn px-2.5 py-1.5 rounded-xl border text-xs font-bouncy flex items-center gap-1.5 cursor-pointer backdrop-blur-md transition-all ${
            autoRotate
              ? 'bg-purple-600/30 border-purple-400 text-purple-200'
              : 'bg-slate-900/80 border-slate-700 text-slate-400'
          }`}
          title="Toggle Turntable Spin"
        >
          <RotateCw className={`w-3.5 h-3.5 ${autoRotate ? 'animate-spin' : ''}`} />
          <span className="text-[11px] font-bold">Turntable</span>
        </button>
      </div>

      {/* 3D WebGL Canvas Mount */}
      <div
        ref={mountRef}
        className="w-full h-72 sm:h-84 cursor-grab active:cursor-grabbing relative flex items-center justify-center"
      >
        <div className="absolute bottom-2 text-[10px] text-slate-400 font-bouncy pointer-events-none select-none">
          Click &amp; drag to rotate 360°
        </div>
      </div>

      {/* Interactive Animation Selector Controls */}
      <div className="p-4 bg-slate-900/90 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setAnimState('RUN')}
            className={`arcade-btn px-3 py-1.5 rounded-xl text-xs font-bouncy font-bold transition-all cursor-pointer ${
              animState === 'RUN'
                ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            🏃 Run Sprint
          </button>
          <button
            onClick={() => setAnimState('FLY')}
            className={`arcade-btn px-3 py-1.5 rounded-xl text-xs font-bouncy font-bold transition-all cursor-pointer ${
              animState === 'FLY'
                ? 'bg-purple-500 text-white shadow-md shadow-purple-500/20'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            🚀 Jetpack Flight
          </button>
          <button
            onClick={() => setAnimState('IDLE')}
            className={`arcade-btn px-3 py-1.5 rounded-xl text-xs font-bouncy font-bold transition-all cursor-pointer ${
              animState === 'IDLE'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            🧍 Idle
          </button>
          <button
            onClick={() => setAnimState('DEAD')}
            className={`arcade-btn px-3 py-1.5 rounded-xl text-xs font-bouncy font-bold transition-all cursor-pointer ${
              animState === 'DEAD'
                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            💥 Tumble
          </button>
        </div>

        {animState === 'FLY' && (
          <button
            onClick={() => setIsFiring(!isFiring)}
            className={`arcade-btn px-3 py-1.5 rounded-xl border text-xs font-bouncy font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
              isFiring
                ? 'bg-pink-600/30 border-pink-400 text-pink-200'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-pink-400" />
            <span>{isFiring ? 'Thrusters ON' : 'Gliding'}</span>
          </button>
        )}
      </div>
    </div>
  );
};
