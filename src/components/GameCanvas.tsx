/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  CharacterDef,
  GameState,
  PhysicsConfig,
  PlayerMovementState,
} from '../types/game';
import {
  CANVAS_VIRTUAL_HEIGHT,
  CANVAS_VIRTUAL_WIDTH,
  PLAYABLE_BOTTOM,
  PLAYABLE_TOP,
  CHARACTERS,
} from '../game/constants';
import { updatePlayerPhysics } from '../game/physics';
import { checkAABB, checkCircleAABB, createFairHitbox } from '../game/collision';
import { ObstacleManager } from '../game/obstacles';
import { ParticleSystem } from '../game/particles';
import { GameRenderer } from '../game/renderer';
import { sound } from '../game/sound';
import {
  Volume2,
  VolumeX,
  RotateCcw,
  Eye,
  Zap,
  Play,
  Pause,
  Maximize,
  Minimize,
  Settings,
  Sliders,
  Users,
} from 'lucide-react';

interface GameCanvasProps {
  physicsConfig: PhysicsConfig;
  onUpdatePhysics: (config: PhysicsConfig) => void;
  selectedCharacter: CharacterDef;
  onSelectCharacter: (char: CharacterDef) => void;
  showHitboxes: boolean;
  onToggleHitboxes: () => void;
  slowMotion: boolean;
  onToggleSlowMotion: () => void;
  onNavigateToTuningPage: () => void;
  onNavigateToCharacterPage: () => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  physicsConfig,
  onUpdatePhysics,
  selectedCharacter,
  onSelectCharacter,
  showHitboxes,
  onToggleHitboxes,
  slowMotion,
  onToggleSlowMotion,
  onNavigateToTuningPage,
  onNavigateToCharacterPage,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Game state
  const [gameState, setGameState] = useState<GameState>('READY');
  const [distance, setDistance] = useState<number>(0);
  const [coins, setCoins] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [causeOfDeath, setCauseOfDeath] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState<boolean>(false);

  // High-performance HUD direct DOM refs (prevents 60 FPS React re-render thrashing)
  const hudDistanceRef = useRef<HTMLSpanElement | null>(null);
  const hudCoinsRef = useRef<HTMLSpanElement | null>(null);
  const lastDistRef = useRef<number>(-1);
  const lastCoinsRef = useRef<number>(-1);
  const flightDotRef = useRef<HTMLSpanElement | null>(null);
  const flightTextRef = useRef<HTMLSpanElement | null>(null);

  // Engine references
  const isFiringRef = useRef<boolean>(false);
  const slowMotionRef = useRef<boolean>(slowMotion);
  const characterRef = useRef<CharacterDef>(selectedCharacter);
  const configRef = useRef<PhysicsConfig>(physicsConfig);

  useEffect(() => {
    slowMotionRef.current = slowMotion;
  }, [slowMotion]);

  useEffect(() => {
    characterRef.current = selectedCharacter;
  }, [selectedCharacter]);

  useEffect(() => {
    configRef.current = physicsConfig;
  }, [physicsConfig]);

  useEffect(() => {
    sound.startBackgroundMusic();
  }, []);

  // Game internal state ref (CANVAS GAMEPLAY ENGINE - UNTOUCHED)
  const engineRef = useRef({
    playerY: PLAYABLE_BOTTOM - 52,
    playerX: 140,
    playerVy: 0,
    distanceMeters: 0,
    scrollSpeed: physicsConfig.baseScrollSpeed,
    coinsCollected: 0,
    movementState: 'RUNNING' as PlayerMovementState,
    isGrounded: true,
    netAcceleration: 0,
    deathTimer: 0,
    obstacleManager: new ObstacleManager(),
    particleSystem: new ParticleSystem(),
    renderer: new GameRenderer(),
    animTime: 0,
    lastFrameTime: performance.now(),
    animationFrameId: 0,
    jetpackSoundPlaying: false,
  });

  const handleStartGame = useCallback(() => {
    const e = engineRef.current;
    e.playerY = PLAYABLE_BOTTOM - 52;
    e.playerVy = 0;
    e.distanceMeters = 0;
    e.coinsCollected = 0;
    e.scrollSpeed = configRef.current.baseScrollSpeed;
    e.movementState = 'RUNNING';
    e.isGrounded = true;
    e.netAcceleration = 0;
    e.deathTimer = 0;
    e.obstacleManager.reset();
    e.particleSystem.clear();
    setDistance(0);
    setCoins(0);
    sound.startBackgroundMusic();
    e.lastFrameTime = performance.now();
    setGameState('PLAYING');
  }, []);

  const handleRestart = useCallback(() => {
    handleStartGame();
  }, [handleStartGame]);

  const handlePause = useCallback(() => {
    if (gameState === 'PLAYING') {
      sound.stopJetpack();
      isFiringRef.current = false;
      const e = engineRef.current;
      setDistance(Math.floor(e.distanceMeters));
      setCoins(e.coinsCollected);
      setGameState('PAUSED');
    }
  }, [gameState]);

  const handleResume = useCallback(() => {
    if (gameState === 'PAUSED') {
      engineRef.current.lastFrameTime = performance.now();
      setGameState('PLAYING');
    }
  }, [gameState]);

  const handleTogglePause = useCallback(() => {
    if (gameState === 'PLAYING') {
      handlePause();
    } else if (gameState === 'PAUSED') {
      handleResume();
    }
  }, [gameState, handlePause, handleResume]);

  // Touch and Mouse handlers
  const handleInputStart = useCallback(() => {
    if (gameState === 'READY') {
      handleStartGame();
      return;
    }
    if (gameState === 'PLAYING') {
      isFiringRef.current = true;
      if (flightDotRef.current) {
        flightDotRef.current.className = 'w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping';
      }
      if (flightTextRef.current) {
        flightTextRef.current.textContent = '🔥 THRUSTERS FIRING!';
      }
      sound.startBackgroundMusic();
      sound.startJetpack(characterRef.current.jetpackType);
    }
  }, [gameState, handleStartGame]);

  const handleInputEnd = useCallback(() => {
    if (gameState === 'PLAYING') {
      isFiringRef.current = false;
      if (flightDotRef.current) {
        flightDotRef.current.className = 'w-2.5 h-2.5 rounded-full bg-slate-500';
      }
      if (flightTextRef.current) {
        flightTextRef.current.textContent = 'TAP / HOLD SPACE TO FLY · [P] PAUSE';
      }
      sound.stopJetpack();
    }
  }, [gameState]);

  // Fullscreen toggle
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyM') {
        e.preventDefault();
        handleToggleMute();
        return;
      }

      if (gameState === 'READY') {
        if (e.code === 'KeyF') {
          handleToggleFullscreen();
          return;
        }
        e.preventDefault();
        handleStartGame();
        return;
      }

      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        if (gameState === 'PLAYING' && !isFiringRef.current) {
          handleInputStart();
        }
      } else if (e.code === 'Escape' || e.code === 'KeyP') {
        e.preventDefault();
        handleTogglePause();
      } else if (e.code === 'KeyR') {
        if (gameState === 'GAME_OVER' || gameState === 'PAUSED') {
          handleRestart();
        }
      } else if (e.code === 'KeyF') {
        handleToggleFullscreen();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        handleInputEnd();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState, handleStartGame, handleInputStart, handleInputEnd, handleRestart, handleTogglePause]);

  // Toggle Mute
  const handleToggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    sound.setMuted(nextMute);
  };

  // Main 60 FPS Game Loop (UNTOUCHED)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const engine = engineRef.current;
    let isRunning = true;

    const gameLoop = (timestamp: number) => {
      if (!isRunning) return;

      const e = engine;
      const rawDt = (timestamp - e.lastFrameTime) / 1000;
      e.lastFrameTime = timestamp;

      const clampedDt = Math.min(rawDt, 0.08);
      const dt = slowMotionRef.current ? clampedDt * 0.28 : clampedDt;

      const char = characterRef.current;
      const config = configRef.current;

      // 1. UPDATE PHYSICS
      if (gameState === 'PLAYING') {
        e.animTime += dt;
        const isPressing = isFiringRef.current;

        const result = updatePlayerPhysics(
          e.playerY,
          e.playerVy,
          isPressing,
          dt,
          config,
          char,
          52
        );

        e.playerY = result.y;
        e.playerVy = result.vy;
        e.movementState = result.movementState;
        e.isGrounded = result.grounded;
        e.netAcceleration = result.netAcceleration;

        // Sound pitch modulation
        if (isPressing) {
          sound.updateJetpackPitch(e.playerVy / config.terminalVelocityClimb);
        }

        // Particle Engine: Exhaust trails behind character during flight & ground dust
        const isFlying = !e.isGrounded || isPressing;
        const nozzleX = char.id === 'chog' ? e.playerX + 8 : e.playerX + 6;
        const nozzleY = char.id === 'chog' ? (isPressing ? e.playerY + 30 : e.playerY + 26) : e.playerY + 38;

        if (isFlying) {
          e.particleSystem.emitFlyingExhaustTrail(
            nozzleX,
            nozzleY,
            e.playerVy,
            isPressing,
            char,
            e.scrollSpeed,
            dt
          );
          if (e.isGrounded) {
            e.particleSystem.emitDust(e.playerX + 16, e.playerY + 50);
          }
        } else {
          e.particleSystem.resetEmitterHistory();
          e.particleSystem.emitDust(e.playerX + 16, e.playerY + 50);
        }

        // Advance endless scroll distance gradually and safely capped (max 1.35x base speed)
        e.scrollSpeed = Math.min(config.baseScrollSpeed * 1.35, e.scrollSpeed + config.scrollAcceleration * dt);
        e.distanceMeters += (e.scrollSpeed * dt) / 50;

        // Update obstacles & missiles with synchronized world scrollSpeed
        e.obstacleManager.update(
          dt,
          e.distanceMeters,
          e.scrollSpeed,
          e.playerY,
          () => sound.playWarningAlert(),
          () => sound.playMissileWhoosh()
        );

        // Player Fair Hitbox calculation
        const playerFairHitbox = createFairHitbox(
          e.playerX,
          e.playerY,
          44,
          52,
          config.hitboxMarginPercent
        );

        // Collision detection against obstacles
        for (const obs of e.obstacleManager.obstacles) {
          if (checkAABB(playerFairHitbox, obs.hitbox)) {
            if (obs.type === 'missile') {
              sound.playExplosion();
            } else {
              sound.playElectricZap();
            }
            sound.stopJetpack();
            e.movementState = 'DYING';
            e.particleSystem.emitExplosion(e.playerX + 22, e.playerY + 26);
            setCauseOfDeath(
              obs.type === 'missile'
                ? 'Blasted by Homing Missile Rocket!'
                : 'Zapped by High-Voltage Electric Field!'
            );
            setDistance(Math.floor(e.distanceMeters));
            setCoins(e.coinsCollected);
            setGameState('GAME_OVER');
            break;
          }
        }

        // Coin pickups
        for (const coin of e.obstacleManager.coins) {
          if (!coin.collected && checkCircleAABB(coin.x, coin.y, coin.radius, playerFairHitbox)) {
            coin.collected = true;
            e.coinsCollected += coin.value;
            e.particleSystem.emitCoinSparkles(coin.x, coin.y);
            sound.playCoin();
          }
        }

        // High-Performance Dirty-Checked Direct DOM HUD Update (Zero React re-render stalls, no layout thrashing)
        const distInt = Math.floor(e.distanceMeters);
        if (distInt !== lastDistRef.current) {
          lastDistRef.current = distInt;
          if (hudDistanceRef.current) {
            hudDistanceRef.current.textContent = `${distInt}m`;
          }
        }
        if (e.coinsCollected !== lastCoinsRef.current) {
          lastCoinsRef.current = e.coinsCollected;
          if (hudCoinsRef.current) {
            hudCoinsRef.current.textContent = `${e.coinsCollected}`;
          }
        }

        // Update particles
        e.particleSystem.update(dt);
      } else if (gameState === 'GAME_OVER') {
        e.animTime += dt;
        e.deathTimer += dt;
        if (e.playerY < PLAYABLE_BOTTOM - 52) {
          e.playerVy += config.gravity * dt;
          e.playerY = Math.min(PLAYABLE_BOTTOM - 52, e.playerY + e.playerVy * dt);
        }
        e.particleSystem.update(dt);
      }

      // 2. RENDER PIPELINE
      ctx.clearRect(0, 0, CANVAS_VIRTUAL_WIDTH, CANVAS_VIRTUAL_HEIGHT);

      // Parallax backgrounds with reactive cartoon scientists
      e.renderer.renderBackground(
        ctx,
        e.distanceMeters * 50,
        e.animTime,
        e.playerX,
        e.playerY,
        isFiringRef.current
      );

      // Coins
      e.renderer.renderCoins(ctx, e.obstacleManager.coins, e.animTime);

      // Obstacles & Missiles
      e.renderer.renderObstacles(ctx, e.obstacleManager.obstacles, e.animTime);

      // Particles
      e.particleSystem.draw(ctx);

      // Player Sprite
      e.renderer.renderPlayer(
        ctx,
        e.playerX,
        e.playerY,
        e.playerVy,
        isFiringRef.current,
        e.isGrounded,
        char,
        e.distanceMeters * 50,
        gameState === 'GAME_OVER',
        e.deathTimer
      );

      // Debug Hitbox Overlay
      if (showHitboxes) {
        const fullSpriteBox = {
          left: e.playerX,
          top: e.playerY,
          right: e.playerX + 44,
          bottom: e.playerY + 52,
          width: 44,
          height: 52,
        };
        const fairHitbox = createFairHitbox(
          e.playerX,
          e.playerY,
          44,
          52,
          config.hitboxMarginPercent
        );
        e.renderer.renderDebugHitboxes(
          ctx,
          fullSpriteBox,
          fairHitbox,
          e.obstacleManager.obstacles,
          e.playerVy,
          e.netAcceleration
        );
      }

      e.animationFrameId = requestAnimationFrame(gameLoop);
    };

    engine.lastFrameTime = performance.now();
    engine.animationFrameId = requestAnimationFrame(gameLoop);

    return () => {
      isRunning = false;
      cancelAnimationFrame(engine.animationFrameId);
      sound.stopJetpack();
    };
  }, [gameState, showHitboxes]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-screen flex flex-col bg-slate-950 overflow-hidden select-none"
    >
      {/* VIBRANT ARCADE FLOATING HUD (During Gameplay / Paused / Game Over) */}
      {gameState !== 'READY' && (
        <div className="absolute top-0 inset-x-0 z-20 flex items-center justify-between p-3 sm:px-6 bg-gradient-to-b from-slate-950/95 via-slate-950/60 to-transparent backdrop-blur-xs">
          {/* Left Arcade Badges: Distance & Coins */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Distance Meter Badge */}
            <div className="flex items-center gap-2 bg-gradient-to-r from-slate-900 to-slate-800 px-3.5 py-1.5 rounded-2xl border-2 border-slate-700/80 shadow-lg">
              <span className="text-sm">🚩</span>
              <div className="flex flex-col">
                <span className="text-[9px] uppercase tracking-wider font-bouncy font-extrabold text-slate-400">
                  DISTANCE
                </span>
                <span
                  ref={hudDistanceRef}
                  className="font-arcade text-base font-extrabold text-white tracking-wide leading-none"
                >
                  {Math.floor(distance)}m
                </span>
              </div>
            </div>

            {/* Shiny Coin Stash Badge */}
            <div className="flex items-center gap-2 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 px-3.5 py-1.5 rounded-2xl border-2 border-amber-400/50 shadow-lg shadow-amber-500/10">
              <span className="text-base animate-bounce">🪙</span>
              <div className="flex flex-col">
                <span className="text-[9px] uppercase tracking-wider font-bouncy font-extrabold text-amber-300">
                  COINS
                </span>
                <span
                  ref={hudCoinsRef}
                  className="font-arcade text-base font-extrabold text-amber-400 tracking-wide leading-none"
                >
                  {coins}
                </span>
              </div>
            </div>
          </div>

          {/* Right Arcade Action Controls */}
          <div className="flex items-center gap-2">
            {/* Chunky Arcade Pause / Resume Button */}
            {gameState === 'PLAYING' && (
              <button
                onClick={handlePause}
                className="arcade-btn flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-b from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-arcade font-bold text-xs tracking-wider border-2 border-amber-300 shadow-lg shadow-amber-500/20 cursor-pointer"
                title="Pause Flight (ESC / P)"
              >
                <Pause className="w-4 h-4 fill-current" />
                <span>PAUSE</span>
              </button>
            )}

            {gameState === 'PAUSED' && (
              <button
                onClick={handleResume}
                className="arcade-btn flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-b from-emerald-400 to-emerald-500 hover:from-emerald-300 hover:to-emerald-400 text-slate-950 font-arcade font-bold text-xs tracking-wider border-2 border-emerald-300 shadow-lg shadow-emerald-500/20 cursor-pointer"
                title="Resume Flight (ESC / P)"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>RESUME</span>
              </button>
            )}

            {/* Gadget Toggles: Hitboxes */}
            <button
              onClick={onToggleHitboxes}
              className={`arcade-btn flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bouncy font-bold border-2 transition-all cursor-pointer ${
                showHitboxes
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/60 shadow-sm'
                  : 'bg-slate-900/90 text-slate-400 hover:text-white border-slate-700/80'
              }`}
              title="Toggle Hitbox Wireframes"
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">HITBOXES</span>
            </button>

            {/* Audio Sound Mute */}
            <button
              onClick={handleToggleMute}
              className="arcade-btn p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border-2 border-slate-700/80 cursor-pointer"
              title={isMuted ? 'Turn Sound ON' : 'Turn Sound OFF'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
            </button>

            {/* Fullscreen Button */}
            <button
              onClick={handleToggleFullscreen}
              className="arcade-btn p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border-2 border-slate-700/80 cursor-pointer"
              title={isFullscreen ? 'Exit Fullscreen (F)' : 'Arcade Fullscreen (F)'}
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4 text-cyan-400" />}
            </button>

            {/* Settings / Lab / Hangar Menu Button */}
            <div className="relative">
              <button
                onClick={() => {
                  if (gameState === 'PLAYING') handlePause();
                  setShowSettingsMenu(!showSettingsMenu);
                }}
                className="arcade-btn p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border-2 border-slate-700/80 cursor-pointer"
                title="Arcade Settings, Lab & Hangar"
              >
                <Settings className="w-4 h-4 text-amber-400" />
              </button>

              {showSettingsMenu && (
                <div className="absolute right-0 top-12 w-52 bg-slate-900 border-2 border-slate-700 rounded-2xl shadow-2xl p-2 z-50 flex flex-col gap-1.5 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-1.5 border-b border-slate-800 text-[10px] font-bouncy font-extrabold text-amber-400 uppercase tracking-wider">
                    Arcade Settings
                  </div>
                  <button
                    onClick={() => {
                      setShowSettingsMenu(false);
                      onNavigateToTuningPage();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-800 text-xs font-bouncy font-bold text-slate-200 hover:text-white cursor-pointer transition-colors"
                  >
                    <Sliders className="w-4 h-4 text-cyan-400" />
                    <span>GADGET LAB</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowSettingsMenu(false);
                      onNavigateToCharacterPage();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-800 text-xs font-bouncy font-bold text-slate-200 hover:text-white cursor-pointer transition-colors"
                  >
                    <Users className="w-4 h-4 text-pink-400" />
                    <span>HERO HANGAR</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Screen-Filling Canvas Container (GAME ENGINE UNTOUCHED) */}
      <div
        className="w-full h-full flex items-center justify-center relative cursor-pointer overflow-hidden"
        onMouseDown={gameState === 'READY' ? handleStartGame : handleInputStart}
        onMouseUp={gameState === 'READY' ? undefined : handleInputEnd}
        onMouseLeave={gameState === 'READY' ? undefined : handleInputEnd}
        onTouchStart={(e) => {
          e.preventDefault();
          if (gameState === 'READY') {
            handleStartGame();
          } else {
            handleInputStart();
          }
        }}
        onTouchEnd={(e) => {
          e.preventDefault();
          if (gameState !== 'READY') {
            handleInputEnd();
          }
        }}
      >
        <canvas
          ref={canvasRef}
          width={CANVAS_VIRTUAL_WIDTH}
          height={CANVAS_VIRTUAL_HEIGHT}
          className="w-full h-full object-contain block max-w-full max-h-full"
        />

        {/* VERY FIRST PAGE: HIGH-RES POSTER BACKGROUND & "PRESS ANY BUTTON TO START" */}
        {gameState === 'READY' && (
          <div
            className="absolute inset-0 z-30 flex flex-col justify-end items-center cursor-pointer select-none overflow-hidden animate-in fade-in duration-300"
            onClick={handleStartGame}
          >
            {/* Poster Image Background */}
            <img
              src="/Jetpack_Chogride_game_poster_2K_20261018130503.jpg"
              alt="Jetpack Chogride Poster"
              className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none"
            />

            {/* Title Screen Top Bar: Quick Sound & Fullscreen Controls */}
            <div className="absolute top-4 right-4 z-40 flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleMute();
                }}
                className="arcade-btn flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border-2 border-slate-700/80 shadow-lg cursor-pointer backdrop-blur-xs font-arcade text-xs tracking-wider"
                title={isMuted ? 'Turn Sound ON (M)' : 'Turn Sound OFF (M)'}
              >
                {isMuted ? (
                  <>
                    <VolumeX className="w-4 h-4 text-rose-400" />
                    <span className="font-bold text-rose-400">SOUND: MUTED</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-4 h-4 text-amber-400 animate-pulse" />
                    <span className="font-bold text-amber-300">SOUND: ON</span>
                  </>
                )}
              </button>
            </div>

            {/* Subtle atmospheric vignette gradient at bottom for maximum legibility */}
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/85 via-black/30 to-transparent pointer-events-none" />

            {/* Bottom Call-To-Action: "PRESS ANY BUTTON TO START" */}
            <div className="relative z-40 mb-12 sm:mb-16 flex flex-col items-center text-center px-4">
              <button
                onClick={handleStartGame}
                className="arcade-btn group px-8 py-4 sm:px-14 sm:py-5 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-arcade font-black text-lg sm:text-2xl md:text-3xl tracking-widest border-3 border-amber-200 shadow-[0_0_40px_rgba(245,158,11,0.7)] cursor-pointer transform hover:scale-105 active:scale-95 transition-all duration-150 animate-pulse flex items-center gap-3.5"
              >
                <Play className="w-6 h-6 sm:w-8 sm:h-8 fill-current" />
                <span>PRESS ANY BUTTON TO START</span>
              </button>
            </div>
          </div>
        )}

        {/* MINIMAL ARCADE PAUSE OVERLAY */}
        {gameState === 'PAUSED' && (
          <div
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 z-30 animate-in fade-in duration-150 select-none"
            onClick={(e) => {
              e.stopPropagation();
              handleResume();
            }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div
              className="flex flex-col items-center gap-4 text-center"
              onClick={(e) => e.stopPropagation()}
            >

              <button
                onClick={handleResume}
                className="arcade-btn flex items-center justify-center gap-3 px-10 py-4 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-arcade font-extrabold text-xl tracking-wider border-2 border-amber-200 shadow-2xl shadow-amber-500/30 hover:scale-105 active:scale-95 transition-transform cursor-pointer"
                title="Resume Flight"
                autoFocus
              >
                <Play className="w-6 h-6 fill-current" />
                <span>RESUME</span>
              </button>

              <div className="flex items-center gap-3 text-xs font-bouncy text-slate-400 pt-1">
                <button
                  onClick={handleRestart}
                  className="hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer py-1 px-2.5 rounded-lg hover:bg-slate-900 border border-transparent hover:border-slate-800"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                  <span>Restart Run [R]</span>
                </button>
                <span className="text-slate-600">·</span>
                <span className="text-slate-500">Press ESC to resume</span>
              </div>
            </div>
          </div>
        )}

        {/* FUN ARCADE GAME OVER / WIPEOUT OVERLAY */}
        {gameState === 'GAME_OVER' && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 animate-in fade-in duration-200 z-30">
            <h2 className="text-4xl font-extrabold font-arcade text-white tracking-wide mb-6 drop-shadow-md">
              WIPEOUT!
            </h2>

            {/* Flight Report Badges */}
            <div className="flex items-center gap-6 mb-8 p-4 px-8 rounded-3xl bg-slate-900 border-2 border-slate-800 shadow-2xl">
              <div className="text-center">
                <span className="text-slate-400 block text-xs uppercase tracking-wider font-bouncy font-bold">
                  DISTANCE FLOWN
                </span>
                <span className="text-3xl font-extrabold font-arcade text-white tracking-wide">
                  {Math.floor(distance)}m
                </span>
              </div>
              <div className="h-10 w-0.5 bg-slate-800" />
              <div className="text-center">
                <span className="text-slate-400 block text-xs uppercase tracking-wider font-bouncy font-bold">
                  COINS STASHED
                </span>
                <span className="text-3xl font-extrabold font-arcade text-amber-400 tracking-wide">
                  {coins}
                </span>
              </div>
            </div>

            {/* Try Again & Title Screen Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleRestart}
                className="arcade-btn flex items-center gap-2.5 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-arcade font-extrabold text-sm tracking-wider border-2 border-amber-200 shadow-xl shadow-amber-500/30 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 stroke-[3]" />
                <span>FLY AGAIN! [R]</span>
              </button>
              <button
                onClick={() => setGameState('READY')}
                className="arcade-btn px-6 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white font-arcade font-bold text-xs tracking-wider border-2 border-slate-700/80 cursor-pointer transition-colors"
              >
                TITLE SCREEN
              </button>
            </div>
          </div>
        )}

        {/* Bottom Playful Flight Reminder */}
        {gameState === 'PLAYING' && (
          <div className="absolute bottom-4 right-6 pointer-events-none flex items-center gap-2.5 text-xs font-bouncy font-bold text-white bg-slate-900/90 px-4 py-2 rounded-2xl border-2 border-slate-700/80 shadow-lg backdrop-blur-xs">
            <span
              ref={flightDotRef}
              className="w-2.5 h-2.5 rounded-full bg-slate-500"
            />
            <span ref={flightTextRef}>TAP / HOLD SPACE TO FLY · [P] PAUSE</span>
          </div>
        )}
      </div>
    </div>
  );
};
