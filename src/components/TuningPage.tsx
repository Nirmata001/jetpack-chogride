/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { PhysicsConfig } from '../types/game';
import { DEFAULT_PHYSICS, PHYSICS_PRESETS, PhysicsPreset } from '../game/constants';
import {
  Flame,
  Gauge,
  Shield,
  RotateCcw,
  Compass,
  Zap,
  Play,
  Sliders,
  Check,
} from 'lucide-react';
import { sound } from '../game/sound';

interface TuningPageProps {
  physicsConfig: PhysicsConfig;
  onUpdatePhysics: (config: PhysicsConfig) => void;
  onLaunchGame: () => void;
}

export const TuningPage: React.FC<TuningPageProps> = ({
  physicsConfig,
  onUpdatePhysics,
  onLaunchGame,
}) => {
  const [activePresetId, setActivePresetId] = useState<string>('classic');

  const netUpwardLift = physicsConfig.jetpackThrust - physicsConfig.gravity;

  const handleUpdate = (field: keyof PhysicsConfig, value: number) => {
    setActivePresetId('custom');
    onUpdatePhysics({
      ...physicsConfig,
      [field]: value,
    });
  };

  const handleApplyPreset = (preset: PhysicsPreset) => {
    sound.playUiClick();
    setActivePresetId(preset.id);
    onUpdatePhysics({ ...preset.config });
  };

  const handleReset = () => {
    sound.playUiClick();
    setActivePresetId('classic');
    onUpdatePhysics({ ...DEFAULT_PHYSICS });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Workshop Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-950 border border-slate-800 p-6 sm:p-8 shadow-2xl">
        {/* Subtle decorative glow */}
        <div className="absolute -top-12 -right-12 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400">
              <Sliders className="w-4 h-4" />
              <span>SKUNKWORKS PROVING GROUND</span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-400 font-mono">LABORATORY SPEC v2.4</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-arcade text-white tracking-wide">
              JETPACK GADGET &amp; FLIGHT LAB
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
              Tinker with propulsion formulas in real time. Dial in low-G moon hang-time, accelerate the conveyor runway, or expand the fair-play forgiveness shield.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleReset}
              className="arcade-btn flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold tracking-wide transition-colors cursor-pointer"
              title="Reset all settings to balanced standard defaults"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span>Reset Defaults</span>
            </button>
            <button
              onClick={() => {
                sound.playUiClick();
                onLaunchGame();
              }}
              className="arcade-btn flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 text-xs font-extrabold font-arcade tracking-wider shadow-lg shadow-amber-500/20 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>TEST FLIGHT</span>
            </button>
          </div>
        </div>
      </div>

      {/* Preset Loadout Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-semibold uppercase tracking-wider text-slate-300">
            QUICK LOADOUT PRESETS
          </span>
          <span>Click to instantly configure flight dynamics</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {PHYSICS_PRESETS.map((preset) => {
            const isSelected = activePresetId === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => handleApplyPreset(preset)}
                className={`arcade-btn text-left p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden group ${
                  isSelected
                    ? 'bg-slate-900 border-amber-400/80 shadow-lg shadow-amber-500/10'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/90'
                }`}
              >
                {/* Active Indicator Bar */}
                {isSelected && (
                  <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-400 to-yellow-400" />
                )}

                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-amber-400">
                    {preset.tag}
                  </span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                </div>

                <div className="text-sm font-bold font-arcade text-white mb-1 group-hover:text-amber-300 transition-colors">
                  {preset.name}
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  {preset.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Real-Time Telemetry Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block font-medium uppercase tracking-wider">
              Net Vertical Lift
            </span>
            <span className="text-lg font-bold font-arcade text-emerald-400 tabular-nums">
              +{netUpwardLift.toFixed(0)} px/s²
            </span>
            <span className="text-[10px] text-slate-500 block">
              Thrust minus gravity balance
            </span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
            <Gauge className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block font-medium uppercase tracking-wider">
              Runway Velocity
            </span>
            <span className="text-lg font-bold font-arcade text-cyan-400 tabular-nums">
              {physicsConfig.baseScrollSpeed} px/s
            </span>
            <span className="text-[10px] text-slate-500 block">
              Horizontal lab scroll speed
            </span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block font-medium uppercase tracking-wider">
              Fair-Play Shield
            </span>
            <span className="text-lg font-bold font-arcade text-amber-400 tabular-nums">
              {(physicsConfig.hitboxMarginPercent * 100).toFixed(0)}% Margin
            </span>
            <span className="text-[10px] text-slate-500 block">
              Collision buffer allowance
            </span>
          </div>
        </div>
      </div>

      {/* Physics Sliders Bank */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 space-y-6 shadow-xl">
        {/* Section 1: Propulsion & Gravity */}
        <div>
          <div className="flex items-center gap-2 mb-4 text-xs font-semibold uppercase tracking-wider text-slate-300">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>PROPULSION &amp; GRAVITY</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Jetpack Thrust */}
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-white flex items-center gap-2">
                  <Flame className="w-4 h-4 text-cyan-400" />
                  <span>Jetpack Thrust Acceleration</span>
                </span>
                <span className="font-mono text-cyan-400 text-sm font-bold tabular-nums">
                  {physicsConfig.jetpackThrust} <span className="text-xs text-slate-500">px/s²</span>
                </span>
              </div>
              <input
                type="range"
                min={1200}
                max={4200}
                step={50}
                value={physicsConfig.jetpackThrust}
                onChange={(e) => handleUpdate('jetpackThrust', parseFloat(e.target.value))}
                className="w-full accent-cyan-400 bg-slate-800 h-2 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>1200 (Gentle ascent)</span>
                <span>4200 (Afterburner rocket)</span>
              </div>
            </div>

            {/* Planetary Gravity */}
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-white flex items-center gap-2">
                  <Compass className="w-4 h-4 text-amber-400" />
                  <span>Planetary Downward Gravity</span>
                </span>
                <span className="font-mono text-amber-400 text-sm font-bold tabular-nums">
                  {physicsConfig.gravity} <span className="text-xs text-slate-500">px/s²</span>
                </span>
              </div>
              <input
                type="range"
                min={600}
                max={2600}
                step={50}
                value={physicsConfig.gravity}
                onChange={(e) => handleUpdate('gravity', parseFloat(e.target.value))}
                className="w-full accent-amber-400 bg-slate-800 h-2 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>600 (Moon low-G)</span>
                <span>2600 (Heavy planetary G)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Terminal Velocities & World Speed */}
        <div>
          <div className="flex items-center gap-2 mb-4 text-xs font-semibold uppercase tracking-wider text-slate-300">
            <Gauge className="w-3.5 h-3.5 text-cyan-400" />
            <span>VELOCITY CEILINGS &amp; FAIR PLAY</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Terminal Climb */}
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white">Max Ascent Velocity</span>
                <span className="font-mono text-emerald-400 text-xs font-bold tabular-nums">
                  {physicsConfig.terminalVelocityClimb} px/s
                </span>
              </div>
              <input
                type="range"
                min={300}
                max={1000}
                step={25}
                value={physicsConfig.terminalVelocityClimb}
                onChange={(e) => handleUpdate('terminalVelocityClimb', parseFloat(e.target.value))}
                className="w-full accent-emerald-400 bg-slate-800 h-2 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-slate-500">
                <span>300 cap</span>
                <span>1000 rocket</span>
              </div>
            </div>

            {/* Terminal Fall */}
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white">Max Dive Velocity</span>
                <span className="font-mono text-rose-400 text-xs font-bold tabular-nums">
                  {physicsConfig.terminalVelocityFall} px/s
                </span>
              </div>
              <input
                type="range"
                min={300}
                max={1200}
                step={25}
                value={physicsConfig.terminalVelocityFall}
                onChange={(e) => handleUpdate('terminalVelocityFall', parseFloat(e.target.value))}
                className="w-full accent-rose-400 bg-slate-800 h-2 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-slate-500">
                <span>300 float</span>
                <span>1200 dive</span>
              </div>
            </div>

            {/* Base Scroll Speed */}
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white">Conveyor Speed</span>
                <span className="font-mono text-amber-400 text-xs font-bold tabular-nums">
                  {physicsConfig.baseScrollSpeed} px/s
                </span>
              </div>
              <input
                type="range"
                min={200}
                max={600}
                step={20}
                value={physicsConfig.baseScrollSpeed}
                onChange={(e) => handleUpdate('baseScrollSpeed', parseFloat(e.target.value))}
                className="w-full accent-amber-400 bg-slate-800 h-2 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-slate-500">
                <span>200 casual</span>
                <span>600 nitro</span>
              </div>
            </div>

            {/* Hitbox Margin */}
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white">Hitbox Forgiveness</span>
                <span className="font-mono text-teal-400 text-xs font-bold tabular-nums">
                  {(physicsConfig.hitboxMarginPercent * 100).toFixed(0)}%
                </span>
              </div>
              <input
                type="range"
                min={0.06}
                max={0.28}
                step={0.01}
                value={physicsConfig.hitboxMarginPercent}
                onChange={(e) => handleUpdate('hitboxMarginPercent', parseFloat(e.target.value))}
                className="w-full accent-teal-400 bg-slate-800 h-2 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-slate-500">
                <span>6% strict</span>
                <span>28% forgiving</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
