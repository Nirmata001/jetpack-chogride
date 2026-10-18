/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PhysicsConfig } from '../types/game';
import { DEFAULT_PHYSICS } from '../game/constants';
import { Sparkles, RotateCcw, Zap, Flame, Shield, Gauge, Compass } from 'lucide-react';

interface PhysicsControlsProps {
  config: PhysicsConfig;
  onChange: (newConfig: PhysicsConfig) => void;
}

export const PhysicsControls: React.FC<PhysicsControlsProps> = ({ config, onChange }) => {
  const handleUpdate = (field: keyof PhysicsConfig, value: number) => {
    onChange({
      ...config,
      [field]: value,
    });
  };

  const handleReset = () => {
    onChange({ ...DEFAULT_PHYSICS });
  };

  const applyPreset = (preset: 'default' | 'heavy' | 'moon' | 'turbo') => {
    switch (preset) {
      case 'default':
        onChange({ ...DEFAULT_PHYSICS });
        break;
      case 'heavy':
        onChange({
          ...config,
          gravity: 2100,
          jetpackThrust: 3500,
          terminalVelocityFall: 850,
          terminalVelocityClimb: 650,
          baseScrollSpeed: 420,
        });
        break;
      case 'moon':
        onChange({
          ...config,
          gravity: 800,
          jetpackThrust: 1600,
          terminalVelocityFall: 400,
          terminalVelocityClimb: 420,
          baseScrollSpeed: 320,
        });
        break;
      case 'turbo':
        onChange({
          ...config,
          gravity: 1700,
          jetpackThrust: 3100,
          terminalVelocityFall: 800,
          terminalVelocityClimb: 750,
          baseScrollSpeed: 520,
        });
        break;
    }
  };

  const netAscentAcceleration = config.jetpackThrust - config.gravity;

  return (
    <div className="bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-slate-800/80 rounded-2xl p-6 shadow-xl relative overflow-hidden">
      {/* Background glow flair */}
      <div className="absolute -top-12 -right-12 w-40 h-40 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800/80 mb-5 gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white font-arcade tracking-wide flex items-center gap-2">
              <span>JETPACK GADGET TWEAKS</span>
              <span className="text-[10px] font-bouncy uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                LIVE
              </span>
            </h3>
            <span className="text-xs text-slate-400 font-bouncy">
              Tune thrust, gravity and speed on the fly!
            </span>
          </div>
        </div>

        <button
          onClick={handleReset}
          className="arcade-btn flex items-center gap-1.5 px-3 py-1.5 text-xs font-bouncy font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-all self-start sm:self-auto cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
          <span>Reset Defaults</span>
        </button>
      </div>

      {/* Fun Presets Badges */}
      <div className="mb-6">
        <div className="text-xs font-bouncy font-bold text-slate-300 mb-2.5 flex items-center gap-1.5">
          <span>⚡ QUICK LOADOUT PRESETS:</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <button
            onClick={() => applyPreset('default')}
            className="arcade-btn p-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-800 border-2 border-slate-700 hover:border-amber-400 text-left transition-all cursor-pointer group"
          >
            <span className="block text-xs font-arcade text-white group-hover:text-amber-400">
              ⭐ CLASSIC
            </span>
            <span className="text-[10px] text-slate-400 font-bouncy">Standard Joyride feel</span>
          </button>


          <button
            onClick={() => applyPreset('moon')}
            className="arcade-btn p-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-800 border-2 border-slate-700 hover:border-cyan-400 text-left transition-all cursor-pointer group"
          >
            <span className="block text-xs font-arcade text-white group-hover:text-cyan-400">
              🌙 MOON LOW-G
            </span>
            <span className="text-[10px] text-slate-400 font-bouncy">Floaty lunar bounce</span>
          </button>

          <button
            onClick={() => applyPreset('turbo')}
            className="arcade-btn p-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-800 border-2 border-slate-700 hover:border-emerald-400 text-left transition-all cursor-pointer group"
          >
            <span className="block text-xs font-arcade text-white group-hover:text-emerald-400">
              ⚡ HYPER TURBO
            </span>
            <span className="text-[10px] text-slate-400 font-bouncy">Nitro scroll speed</span>
          </button>
        </div>
      </div>

      {/* Live Net Climb Power Card */}
      <div className="mb-6 p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs shadow-inner">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
            <Zap className="w-4 h-4 fill-current" />
          </div>
          <div>
            <span className="text-white font-bouncy font-bold block">Net Upward Boost</span>
            <span className="text-[11px] text-slate-400">
              Thrust power overcoming earth gravity
            </span>
          </div>
        </div>
        <div className="text-right">
          <span className="font-arcade text-base text-emerald-400">
            +{netAscentAcceleration.toFixed(0)} px/s²
          </span>
          <span className="block text-[10px] font-bouncy text-emerald-500 font-bold">
            READY TO CLIMB
          </span>
        </div>
      </div>

      {/* Sliders Grid with Fun Arcade Styling */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5 text-xs">
        {/* Jetpack Thrust */}
        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/70">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white font-bouncy font-bold flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-cyan-400" />
              <span>Jetpack Boost Power</span>
            </span>
            <span className="font-arcade text-cyan-400 text-sm">
              {config.jetpackThrust} <span className="text-[10px] font-sans">px/s²</span>
            </span>
          </div>
          <input
            type="range"
            min={1200}
            max={4200}
            step={50}
            value={config.jetpackThrust}
            onChange={(e) => handleUpdate('jetpackThrust', parseFloat(e.target.value))}
            className="w-full accent-cyan-400 bg-slate-800 h-2 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-bouncy mt-1">
            <span>Gentle lift</span>
            <span>Rocket blast</span>
          </div>
        </div>

        {/* Gravity Constant */}
        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/70">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white font-bouncy font-bold flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-amber-400" />
              <span>Planetary Gravity</span>
            </span>
            <span className="font-arcade text-amber-400 text-sm">
              {config.gravity} <span className="text-[10px] font-sans">px/s²</span>
            </span>
          </div>
          <input
            type="range"
            min={600}
            max={2600}
            step={50}
            value={config.gravity}
            onChange={(e) => handleUpdate('gravity', parseFloat(e.target.value))}
            className="w-full accent-amber-400 bg-slate-800 h-2 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-bouncy mt-1">
            <span>Moon gravity</span>
            <span>Heavy iron boots</span>
          </div>
        </div>

        {/* Terminal Climb Speed */}
        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/70">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white font-bouncy font-bold flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-emerald-400" />
              <span>Max Ceiling Ascent</span>
            </span>
            <span className="font-arcade text-emerald-400 text-sm">
              {config.terminalVelocityClimb} <span className="text-[10px] font-sans">px/s</span>
            </span>
          </div>
          <input
            type="range"
            min={300}
            max={1000}
            step={25}
            value={config.terminalVelocityClimb}
            onChange={(e) => handleUpdate('terminalVelocityClimb', parseFloat(e.target.value))}
            className="w-full accent-emerald-400 bg-slate-800 h-2 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-bouncy mt-1">
            <span>Smooth ascent</span>
            <span>Lightning climb</span>
          </div>
        </div>

        {/* Terminal Fall Speed */}
        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/70">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white font-bouncy font-bold flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-rose-400" />
              <span>Max Dive Velocity</span>
            </span>
            <span className="font-arcade text-rose-400 text-sm">
              {config.terminalVelocityFall} <span className="text-[10px] font-sans">px/s</span>
            </span>
          </div>
          <input
            type="range"
            min={300}
            max={1200}
            step={25}
            value={config.terminalVelocityFall}
            onChange={(e) => handleUpdate('terminalVelocityFall', parseFloat(e.target.value))}
            className="w-full accent-rose-400 bg-slate-800 h-2 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-bouncy mt-1">
            <span>Parachute drift</span>
            <span>Meteor dive</span>
          </div>
        </div>

        {/* Base Scroll Speed */}
        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/70">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white font-bouncy font-bold flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Lab Runway Speed</span>
            </span>
            <span className="font-arcade text-amber-400 text-sm">
              {config.baseScrollSpeed} <span className="text-[10px] font-sans">px/s</span>
            </span>
          </div>
          <input
            type="range"
            min={200}
            max={650}
            step={20}
            value={config.baseScrollSpeed}
            onChange={(e) => handleUpdate('baseScrollSpeed', parseFloat(e.target.value))}
            className="w-full accent-amber-400 bg-slate-800 h-2 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-bouncy mt-1">
            <span>Casual jog</span>
            <span>Supersonic sprint</span>
          </div>
        </div>

        {/* Hitbox Forgiveness Margin */}
        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/70">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white font-bouncy font-bold flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-teal-400" />
              <span>Forgiveness Shield Margin</span>
            </span>
            <span className="font-arcade text-teal-400 text-sm">
              {(config.hitboxMarginPercent * 100).toFixed(0)}%
            </span>
          </div>
          <input
            type="range"
            min={0.05}
            max={0.30}
            step={0.01}
            value={config.hitboxMarginPercent}
            onChange={(e) => handleUpdate('hitboxMarginPercent', parseFloat(e.target.value))}
            className="w-full accent-teal-400 bg-slate-800 h-2 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-bouncy mt-1">
            <span>Pixel-perfect (Hard)</span>
            <span>Arcade Mercy (Chill)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
