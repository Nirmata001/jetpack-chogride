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
  ZapperObstacle,
} from '../types/game';
import {
  CANVAS_VIRTUAL_HEIGHT,
  CANVAS_VIRTUAL_WIDTH,
  PLAYABLE_BOTTOM,
  PLAYABLE_TOP,
} from '../game/constants';
import { updatePlayerPhysics } from '../game/physics';
import {
  checkAABB,
  checkCircleAABB,
  checkZapperCollision,
  createFairHitbox,
} from '../game/collision';
import { ObstacleManager } from '../game/obstacles';
import { ParticleSystem } from '../game/particles';
import { GameRenderer } from '../game/renderer';
import { sound } from '../game/sound';
import {
  loadGameStats,
  recordRunStats,
  GameStats,
} from '../game/storage';
import {
  Volume2,
  VolumeX,
  RotateCcw,
  Eye,
  Play,
  Pause,
  Maximize,
  Minimize,
  Sliders,
  Trophy,
  Zap,
  Flame,
  Shield,
  Sparkles,
  AlertTriangle,
  ArrowRight,
  User,
  Wallet,
} from 'lucide-react';
import { PlayerProfileModal } from './PlayerProfileModal';
import { getLocalPlayer, syncCoins } from '../lib/supabase';

interface GameCanvasProps {
  physicsConfig: PhysicsConfig;
  onUpdatePhysics: (config: PhysicsConfig) => void;
  selectedCharacter: CharacterDef;
  showHitboxes: boolean;
  onToggleHitboxes: () => void;
  slowMotion: boolean;
  onToggleSlowMotion: () => void;
  onNavigateToTuningPage: () => void;
}

export function getPilotRank(distance: number): { title: string; color: string } {
  if (distance >= 1200) return { title: 'Legendary Chog', color: 'text-amber-400' };
  if (distance >= 750) return { title: 'Cosmic Ace', color: 'text-purple-400' };
  if (distance >= 400) return { title: 'Sonic Glider', color: 'text-cyan-400' };
  if (distance >= 150) return { title: 'Corridor Runner', color: 'text-emerald-400' };
  return { title: 'Hangar Cadet', color: 'text-slate-400' };
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  physicsConfig,
  onUpdatePhysics,
  selectedCharacter,
  showHitboxes,
  onToggleHitboxes,
  slowMotion,
  onToggleSlowMotion,
  onNavigateToTuningPage,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Game state
  const [gameState, setGameState] = useState<GameState>('READY');
  const [distance, setDistance] = useState<number>(0);
  const [coins, setCoins] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [causeOfDeath, setCauseOfDeath] = useState<string>('');
  const [deathType, setDeathType] = useState<'laser' | 'missile'>('laser');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [gameStats, setGameStats] = useState<GameStats>(() => loadGameStats());
  const [isNewRecord, setIsNewRecord] = useState<boolean>(false);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);

  // High-performance HUD direct DOM refs (prevents 60 FPS React re-render thrashing)
  const hudDistanceRef = useRef<HTMLSpanElement | null>(null);
  const hudCoinsRef = useRef<HTMLSpanElement | null>(null);
  const hudSpeedRef = useRef<HTMLSpanElement | null>(null);
  const flightDotRef = useRef<HTMLSpanElement | null>(null);
  const flightTextRef = useRef<HTMLSpanElement | null>(null);

  // Engine references
  const isFiringRef = useRef<boolean>(false);
  const keyLockedUntilUpRef = useRef<boolean>(false);
  const pointerLockedUntilUpRef = useRef<boolean>(false);
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

  // Game internal state ref (CANVAS GAMEPLAY ENGINE)
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
    justStarted: false,
    obstacleManager: new ObstacleManager(),
    particleSystem: new ParticleSystem(),
    renderer: new GameRenderer(),
    animTime: 0,
    lastFrameTime: performance.now(),
    animationFrameId: 0,
    jetpackSoundPlaying: false,
  });

  const handleStartGame = useCallback(() => {
    sound.playUiClick();

    // 1. Force cut all thruster inputs, sound, and HUD alerts immediately
    isFiringRef.current = false;
    sound.stopJetpack();
    if (flightDotRef.current) {
      flightDotRef.current.className = 'w-2 h-2 rounded-full bg-slate-500';
    }
    if (flightTextRef.current) {
      flightTextRef.current.textContent = 'HOLD SPACE OR CLICK TO FLY';
    }

    // 2. Lock player solidly to the floor catwalk with zero velocity
    const e = engineRef.current;
    const groundY = PLAYABLE_BOTTOM - 52;
    e.playerY = groundY;
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
    e.justStarted = true;
    e.lastFrameTime = performance.now();

    // 3. Lock pointer until the user lifts their finger/mouse
    pointerLockedUntilUpRef.current = true;

    setDistance(0);
    setCoins(0);
    setIsNewRecord(false);
    sound.startBackgroundMusic();
    setGameState('PLAYING');
  }, []);

  const handleRestart = useCallback(() => {
    handleStartGame();
  }, [handleStartGame]);

  const handlePause = useCallback(() => {
    if (gameState === 'PLAYING') {
      sound.playUiClick();
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
      sound.playUiClick();
      engineRef.current.justStarted = true;
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
      // Disallow firing if the same press started the game until released
      if (pointerLockedUntilUpRef.current) return;

      isFiringRef.current = true;
      if (flightDotRef.current) {
        flightDotRef.current.className = 'w-2 h-2 rounded-full bg-amber-400 animate-ping';
      }
      if (flightTextRef.current) {
        flightTextRef.current.textContent = 'THRUSTERS FIRING';
      }
      sound.startBackgroundMusic();
      sound.startJetpack(characterRef.current.jetpackType);
    }
  }, [gameState, handleStartGame]);

  const handleInputEnd = useCallback(() => {
    pointerLockedUntilUpRef.current = false;
    isFiringRef.current = false;
    if (flightDotRef.current) {
      flightDotRef.current.className = 'w-2 h-2 rounded-full bg-slate-500';
    }
    if (flightTextRef.current) {
      flightTextRef.current.textContent = 'HOLD SPACE OR CLICK TO FLY';
    }
    sound.stopJetpack();
  }, []);

  // Fullscreen toggle
  const handleToggleFullscreen = () => {
    sound.playUiClick();
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

  // Keyboard & Window controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName;
      if (
        activeTag === 'INPUT' ||
        activeTag === 'TEXTAREA' ||
        (document.activeElement as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      if (e.code === 'KeyM') {
        e.preventDefault();
        handleToggleMute();
        return;
      }

      if (e.code === 'KeyF') {
        e.preventDefault();
        handleToggleFullscreen();
        return;
      }

      if (e.code === 'KeyL') {
        e.preventDefault();
        if (gameState === 'PLAYING') handlePause();
        onNavigateToTuningPage();
        return;
      }

      if (e.code === 'KeyH') {
        e.preventDefault();
        sound.playUiClick();
        onToggleHitboxes();
        return;
      }

      if (gameState === 'READY') {
        e.preventDefault();
        keyLockedUntilUpRef.current = true;
        handleStartGame();
        return;
      }

      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        if (gameState === 'GAME_OVER') {
          handleRestart();
          return;
        }
        if (keyLockedUntilUpRef.current) return;
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
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName;
      if (
        activeTag === 'INPUT' ||
        activeTag === 'TEXTAREA' ||
        (document.activeElement as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      if (e.code === 'Space' || e.code === 'ArrowUp') {
        keyLockedUntilUpRef.current = false;
        e.preventDefault();
        handleInputEnd();
      }
    };

    const handleWindowBlur = () => {
      keyLockedUntilUpRef.current = false;
      pointerLockedUntilUpRef.current = false;
      handleInputEnd();
    };

    const handleWindowMouseUp = () => {
      pointerLockedUntilUpRef.current = false;
      handleInputEnd();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('mouseup', handleWindowMouseUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  }, [gameState, handleStartGame, handleInputStart, handleInputEnd, handleRestart, handleTogglePause, onNavigateToTuningPage, onToggleHitboxes]);

  // Toggle Mute
  const handleToggleMute = () => {
    sound.playUiClick();
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    sound.setMuted(nextMute);
  };

  // Main 60 FPS Game Loop
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

      // Safe Frame 0 synchronization after start or unpause
      if (e.justStarted) {
        e.justStarted = false;
        e.lastFrameTime = timestamp;
        e.playerY = PLAYABLE_BOTTOM - 52;
        e.playerVy = 0;
        e.isGrounded = true;
        e.movementState = 'RUNNING';
        isFiringRef.current = false;
      }

      const rawDt = Math.max(0, (timestamp - e.lastFrameTime) / 1000);
      e.lastFrameTime = timestamp;

      const clampedDt = Math.min(rawDt, 0.05);
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

        // Collision detection against obstacles with exact, fair geometry
        for (const obs of e.obstacleManager.obstacles) {
          const isHit =
            obs.type === 'missile'
              ? checkAABB(playerFairHitbox, obs.hitbox)
              : checkZapperCollision(obs as ZapperObstacle, playerFairHitbox);

          if (isHit) {
            if (obs.type === 'missile') {
              sound.playExplosion();
              setDeathType('missile');
              setCauseOfDeath('Blasted by Homing Missile Rocket');
            } else {
              sound.playElectricZap();
              setDeathType('laser');
              setCauseOfDeath('Zapped by High-Voltage Plasma Field');
            }
            sound.stopJetpack();
            isFiringRef.current = false;
            pointerLockedUntilUpRef.current = false;
            keyLockedUntilUpRef.current = false;
            e.movementState = 'DYING';
            e.particleSystem.emitExplosion(e.playerX + 22, e.playerY + 26);

            const finalDistance = Math.floor(e.distanceMeters);
            const finalCoins = e.coinsCollected;
            setDistance(finalDistance);
            setCoins(finalCoins);

            const recordResult = recordRunStats(finalDistance, finalCoins);
            setIsNewRecord(recordResult.isNewRecord);
            setGameStats(recordResult.stats);

            // Synchronize earned coins with Supabase player profile if registered
            const savedPlayer = getLocalPlayer();
            if (savedPlayer && finalCoins > 0) {
              syncCoins(savedPlayer.username, finalCoins).catch(() => {});
            }

            if (recordResult.isNewRecord && finalDistance > 10) {
              sound.playRecordFanfare();
            }

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

        // Direct DOM update for zero React render lag at 60 FPS
        if (hudDistanceRef.current) {
          hudDistanceRef.current.textContent = `${Math.floor(e.distanceMeters)}m`;
        }
        if (hudCoinsRef.current) {
          hudCoinsRef.current.textContent = e.coinsCollected.toString();
        }
        if (hudSpeedRef.current) {
          hudSpeedRef.current.textContent = `${Math.round(e.scrollSpeed)} px/s`;
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

      // Background Environment
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

      // Obstacles
      e.renderer.renderObstacles(ctx, e.obstacleManager.obstacles, e.animTime);

      // Exhaust & Spark Particles
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

  const pilotRank = getPilotRank(distance);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-screen flex flex-col bg-slate-950 overflow-hidden select-none"
    >
      {/* Sci-Fi Laboratory Ambient Lighting & Background Grid */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Dual corner ambient glows (Cosmic Magenta & Star Gold) */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl" />
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 left-1/2 -translate-x-1/2 w-[700px] h-64 bg-cyan-500/8 rounded-full blur-3xl" />

        {/* Subtle high-tech dot matrix pattern on outer desktop borders */}
        <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:32px_32px] opacity-25" />
      </div>

      {/* TOP ARCADE TELEMETRY HUD (Visible during PLAYING, PAUSED, GAME_OVER) */}
      {gameState !== 'READY' && (
        <header className="absolute top-0 inset-x-0 z-20 flex items-center justify-between p-3 sm:px-6 bg-gradient-to-b from-slate-950/95 via-slate-950/70 to-transparent backdrop-blur-xs">
          {/* Left Telemetry Wing: Distance, Record & Coin Stash */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Distance Telemetry */}
            <div className="flex items-center gap-2.5 bg-slate-900/90 border border-slate-700/80 px-3.5 py-1.5 rounded-xl shadow-lg">
              <span className="text-amber-400 font-bold text-xs tracking-wider font-mono">DIST</span>
              <div className="flex items-baseline gap-1.5">
                <span
                  ref={hudDistanceRef}
                  className="font-arcade text-lg sm:text-xl font-extrabold text-white tracking-wide tabular-nums leading-none"
                >
                  {Math.floor(distance)}m
                </span>
                {gameStats.bestDistance > 0 && (
                  <span className="text-[10px] text-slate-400 font-mono hidden sm:inline tabular-nums">
                    / {gameStats.bestDistance}m BEST
                  </span>
                )}
              </div>
            </div>

            {/* Coin Stash Telemetry */}
            <div className="flex items-center gap-2 bg-slate-900/90 border border-amber-400/40 px-3.5 py-1.5 rounded-xl shadow-lg shadow-amber-500/5">
              <span className="text-sm">🪙</span>
              <span
                ref={hudCoinsRef}
                className="font-arcade text-lg sm:text-xl font-extrabold text-amber-400 tracking-wide tabular-nums leading-none"
              >
                {coins}
              </span>
            </div>
          </div>

          {/* Right Action Island: Tactile Arcade Controls */}
          <div className="flex items-center gap-2">
            {/* Pause / Resume Button */}
            {gameState === 'PLAYING' && (
              <button
                onClick={handlePause}
                className="arcade-btn flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-arcade font-bold text-xs tracking-wider shadow-md shadow-amber-500/20 cursor-pointer"
                title="Pause Flight (P / Esc)"
              >
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span className="hidden sm:inline">PAUSE</span>
                <span className="text-[10px] font-mono opacity-75 sm:hidden">[P]</span>
              </button>
            )}

            {gameState === 'PAUSED' && (
              <button
                onClick={handleResume}
                className="arcade-btn flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-400 to-emerald-500 hover:from-emerald-300 hover:to-emerald-400 text-slate-950 font-arcade font-bold text-xs tracking-wider shadow-md shadow-emerald-500/20 cursor-pointer"
                title="Resume Flight (P / Esc)"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>RESUME</span>
              </button>
            )}

            {/* Gadget Lab (Settings) Button */}
            <button
              onClick={() => {
                if (gameState === 'PLAYING') handlePause();
                onNavigateToTuningPage();
              }}
              className="arcade-btn flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 cursor-pointer transition-colors text-xs font-semibold"
              title="Open Gadget Lab (L)"
            >
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline font-arcade font-bold">LAB</span>
              <span className="text-[10px] font-mono text-slate-500 hidden lg:inline">[L]</span>
            </button>

            {/* Player Database & Wallet Profile Button */}
            <button
              onClick={() => {
                sound.playUiClick();
                if (gameState === 'PLAYING') handlePause();
                setIsProfileOpen(true);
              }}
              className="arcade-btn flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 cursor-pointer transition-colors text-xs font-semibold"
              title="Player Database & Wallet Profile"
            >
              <User className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline font-arcade font-bold">PILOT</span>
            </button>

            {/* Hitbox Wireframe Toggle */}
            <button
              onClick={() => {
                sound.playUiClick();
                onToggleHitboxes();
              }}
              className={`arcade-btn flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                showHitboxes
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/60 shadow-sm'
                  : 'bg-slate-900/90 text-slate-400 hover:text-white border-slate-700/80'
              }`}
              title="Toggle Laser & Player Hitbox Wireframes (H)"
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">HITBOXES</span>
            </button>

            {/* Audio Mute Toggle */}
            <button
              onClick={handleToggleMute}
              className="arcade-btn p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 cursor-pointer transition-colors"
              title={isMuted ? 'Turn Sound ON (M)' : 'Turn Sound OFF (M)'}
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4 text-rose-400" />
              ) : (
                <Volume2 className="w-4 h-4 text-amber-400" />
              )}
            </button>

            {/* Fullscreen Toggle */}
            <button
              onClick={handleToggleFullscreen}
              className="arcade-btn p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 cursor-pointer transition-colors"
              title={isFullscreen ? 'Exit Fullscreen (F)' : 'Arcade Fullscreen (F)'}
            >
              {isFullscreen ? (
                <Minimize className="w-4 h-4" />
              ) : (
                <Maximize className="w-4 h-4 text-cyan-400" />
              )}
            </button>
          </div>
        </header>
      )}

      {/* Screen-Filling Canvas Container with Chassis Border */}
      <div
        className="w-full h-full flex items-center justify-center relative cursor-pointer overflow-hidden"
        onMouseDown={gameState === 'READY' ? handleStartGame : handleInputStart}
        onMouseUp={handleInputEnd}
        onMouseLeave={handleInputEnd}
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
          handleInputEnd();
        }}
      >
        {/* Main 2D Canvas */}
        <canvas
          ref={canvasRef}
          width={CANVAS_VIRTUAL_WIDTH}
          height={CANVAS_VIRTUAL_HEIGHT}
          className="w-full h-full object-contain block max-w-full max-h-full drop-shadow-[0_0_50px_rgba(0,0,0,0.8)]"
        />

        {/* 1. SPECTACULAR TITLE / READY SCREEN */}
        {gameState === 'READY' && (
          <div
            className="absolute inset-0 z-30 flex flex-col justify-between cursor-pointer select-none overflow-hidden animate-in fade-in duration-300 p-4 sm:p-8"
            onClick={handleStartGame}
          >
            {/* High-Resolution Poster Background */}
            <img
              src="/Jetpack_Chogride_game_poster_2K_20261018130503.jpg"
              alt="Jetpack Chogride Poster"
              className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none"
            />

            {/* Subtle gentle dim veil (15%) for balanced contrast */}
            <div className="absolute inset-0 bg-slate-950/15 pointer-events-none" />

            {/* Subtle soft bottom gradient strictly behind the button for clean button legibility */}
            <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-black/60 via-black/20 to-transparent pointer-events-none" />

            {/* Title Screen Top Bar: Quick Audio, Record & Fullscreen controls */}
            <div className="relative z-40 flex items-center justify-end gap-2 sm:gap-3">
              {gameStats.bestDistance > 0 && (
                <div className="hidden sm:flex items-center gap-2 bg-slate-900/90 border border-amber-400/40 px-3.5 py-1.5 rounded-xl shadow-lg">
                  <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-xs font-semibold text-slate-300 font-mono">
                    RECORD: <span className="text-amber-400 font-arcade text-sm font-bold">{gameStats.bestDistance}m</span>
                  </span>
                </div>
              )}

              {/* Pilot / Wallet Profile */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  sound.playUiClick();
                  setIsProfileOpen(true);
                }}
                className="arcade-btn flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 shadow-lg text-xs font-semibold cursor-pointer"
                title="Player Database & Wallet Profile"
              >
                <User className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">PILOT PROFILE</span>
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleMute();
                }}
                className="arcade-btn flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 shadow-lg text-xs font-semibold cursor-pointer"
                title={isMuted ? 'Turn Sound ON' : 'Turn Sound OFF'}
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
                <span className="hidden sm:inline">{isMuted ? 'MUTED' : 'AUDIO ON'}</span>
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleFullscreen();
                }}
                className="arcade-btn p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 shadow-lg cursor-pointer"
                title="Toggle Fullscreen"
              >
                {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4 text-cyan-400" />}
              </button>
            </div>

            {/* Title Screen Bottom Stage: Launch CTA */}
            <div className="relative z-40 max-w-4xl mx-auto w-full flex flex-col items-center text-center mb-8 sm:mb-12">
              {/* Massive High-Impact Launch Button */}
              <div className="flex flex-col items-center gap-3">
                <button
                  onClick={handleStartGame}
                  className="arcade-btn group px-10 py-4 sm:px-16 sm:py-5 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-arcade font-black text-xl sm:text-2xl md:text-3xl tracking-wider shadow-[0_0_50px_rgba(245,158,11,0.6)] cursor-pointer transform hover:scale-105 active:scale-95 transition-all flex items-center gap-4"
                >
                  <Play className="w-7 h-7 sm:w-9 sm:h-9 fill-current" />
                  <span>LAUNCH CHOG!</span>
                  <ArrowRight className="w-6 h-6 sm:w-8 sm:h-8 group-hover:translate-x-1 transition-transform" />
                </button>

                {/* Keyboard Quick Guide */}
                <div className="flex items-center gap-3 text-xs text-slate-400 font-mono pt-1">
                  <span>PRESS <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700">SPACE</kbd> OR CLICK TO BEGIN</span>
                  <span>·</span>
                  <span><kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">P</kbd> PAUSE</span>
                  <span>·</span>
                  <span><kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">L</kbd> LAB</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. IN-FLIGHT MISSION PAUSE TERMINAL */}
        {gameState === 'PAUSED' && (
          <div
            className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 z-30 animate-in fade-in duration-150 select-none"
            onClick={(e) => {
              e.stopPropagation();
              handleResume();
            }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div
              className="max-w-md w-full rounded-2xl bg-slate-900 border border-slate-800 p-6 sm:p-8 shadow-2xl space-y-6 text-center"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="space-y-1">
                <span className="text-xs font-mono uppercase tracking-widest text-amber-400 font-semibold">
                  STATUS REPORT
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold font-arcade text-white tracking-wide">
                  FLIGHT PAUSED
                </h2>
              </div>

              {/* In-Flight Run Debrief Stats */}
              <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-left">
                <div>
                  <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block">
                    CURRENT DISTANCE
                  </span>
                  <span className="text-2xl font-bold font-arcade text-white tabular-nums">
                    {Math.floor(distance)}m
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block">
                    COINS COLLECTED
                  </span>
                  <span className="text-2xl font-bold font-arcade text-amber-400 tabular-nums">
                    {coins}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5">
                <button
                  onClick={handleResume}
                  className="arcade-btn w-full flex items-center justify-center gap-3 py-3.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-arcade font-extrabold text-base tracking-wider shadow-lg shadow-amber-500/20 cursor-pointer"
                  autoFocus
                >
                  <Play className="w-5 h-5 fill-current" />
                  <span>RESUME FLIGHT [P / ESC]</span>
                </button>

                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    onClick={handleRestart}
                    className="arcade-btn flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4 text-amber-400" />
                    <span>Restart Run [R]</span>
                  </button>

                  <button
                    onClick={() => {
                      sound.playUiClick();
                      onNavigateToTuningPage();
                    }}
                    className="arcade-btn flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <Sliders className="w-4 h-4 text-cyan-400" />
                    <span>Gadget Lab [L]</span>
                  </button>
                </div>
              </div>

              {/* Keyboard Shortcut Summary */}
              <div className="text-[11px] text-slate-500 font-mono pt-1">
                Press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">ESC</kbd> or <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">P</kbd> to return instantly
              </div>
            </div>
          </div>
        )}

        {/* 3. EXHILARATING FLIGHT DEBRIEF & RECORD SCREEN (Game Over) */}
        {gameState === 'GAME_OVER' && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-4 sm:p-6 z-30 animate-in fade-in duration-200">
            <div className="max-w-lg w-full rounded-2xl bg-slate-900 border border-slate-800 p-6 sm:p-8 shadow-2xl space-y-6 text-center">
              {/* Record Banner / Header */}
              {isNewRecord ? (
                <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/20 via-yellow-500/30 to-amber-500/20 border border-amber-400/60 space-y-1">
                  <div className="flex items-center justify-center gap-2 text-amber-400 font-arcade text-sm font-bold tracking-wider">
                    <Sparkles className="w-4 h-4" />
                    <span>NEW ALL-TIME RECORD!</span>
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="text-3xl font-arcade font-black text-white">
                    {Math.floor(distance)} METERS
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <span className="text-xs font-mono uppercase tracking-widest text-rose-400 font-semibold">
                    FLIGHT TERMINATED
                  </span>
                  <h2 className="text-3xl sm:text-4xl font-extrabold font-arcade text-white tracking-wide">
                    WIPEOUT!
                  </h2>
                </div>
              )}

              {/* Cause of Death Tactical Callout */}
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-center gap-2.5 text-xs text-slate-300">
                {deathType === 'laser' ? (
                  <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                <span>{causeOfDeath}</span>
              </div>

              {/* Sortie Performance Grid */}
              <div className="grid grid-cols-3 gap-2.5 p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-left">
                <div>
                  <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block">
                    DISTANCE
                  </span>
                  <span className="text-xl sm:text-2xl font-bold font-arcade text-white tabular-nums">
                    {Math.floor(distance)}m
                  </span>
                  <span className="text-[10px] text-slate-500 block truncate font-mono">
                    Best: {gameStats.bestDistance}m
                  </span>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block">
                    COINS
                  </span>
                  <span className="text-xl sm:text-2xl font-bold font-arcade text-amber-400 tabular-nums">
                    +{coins}
                  </span>
                  <span className="text-[10px] text-slate-500 block truncate font-mono">
                    Vault: {gameStats.totalCoins}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block">
                    RANK
                  </span>
                  <span className={`text-sm sm:text-base font-bold font-arcade ${pilotRank.color} block truncate leading-tight mt-1`}>
                    {pilotRank.title}
                  </span>
                  <span className="text-[10px] text-slate-500 block font-mono">
                    Sortie #{gameStats.totalRuns}
                  </span>
                </div>
              </div>

              {/* Tactile Action Buttons */}
              <div className="space-y-2.5">
                <button
                  onClick={handleRestart}
                  className="arcade-btn w-full flex items-center justify-center gap-3 py-4 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-arcade font-black text-lg tracking-wider shadow-lg shadow-amber-500/30 cursor-pointer"
                  autoFocus
                >
                  <RotateCcw className="w-5 h-5 stroke-[2.5]" />
                  <span>FLY AGAIN! [SPACE / R]</span>
                </button>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => {
                      sound.playUiClick();
                      onNavigateToTuningPage();
                    }}
                    className="arcade-btn flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Lab [L]</span>
                  </button>

                  <button
                    onClick={() => {
                      sound.playUiClick();
                      setIsProfileOpen(true);
                    }}
                    className="arcade-btn flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Wallet</span>
                  </button>

                  <button
                    onClick={() => {
                      sound.playUiClick();
                      isFiringRef.current = false;
                      sound.stopJetpack();
                      const e = engineRef.current;
                      e.playerY = PLAYABLE_BOTTOM - 52;
                      e.playerVy = 0;
                      e.isGrounded = true;
                      e.movementState = 'RUNNING';
                      e.justStarted = true;
                      setGameState('READY');
                    }}
                    className="arcade-btn py-2.5 rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Title
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Player Database & Wallet Profile Modal */}
      <PlayerProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        currentLifetimeCoins={gameStats.totalCoins}
      />
    </div>
  );
};
