/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PhysicsConfig } from '../types/game';
import { PhysicsControls } from './PhysicsControls';
import { Sparkles, Flame, Gauge, Shield, Zap } from 'lucide-react';

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
  const netUpwardLift = physicsConfig.jetpackThrust - physicsConfig.gravity;

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Playful Hero Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border-2 border-amber-500/30 shadow-2xl relative overflow-hidden">
        {/* Glow effects */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bouncy font-bold uppercase tracking-wider mb-2.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>PROFESSOR'S WORKSHOP</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-arcade text-white tracking-wide mb-1.5">
            THE GADGET &amp; PHYSICS LAB
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 font-bouncy leading-relaxed max-w-xl">
            Tinker with secret formulas! Crank up jetpack propulsion, dial down gravity for mega moon jumps, or speed up the laboratory runway.
          </p>
        </div>

      </div>

      {/* Vibrant Game Stat Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/90 border-2 border-slate-800 flex items-center gap-3.5 shadow-md">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border-2 border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-bouncy block font-bold uppercase">
              Net Vertical Lift
            </span>
            <span className="text-xl font-arcade text-emerald-400">
              +{netUpwardLift.toFixed(0)} px/s²
            </span>
            <span className="text-[10px] text-slate-400 font-bouncy block">
              Supercharged climb power
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border-2 border-slate-800 flex items-center gap-3.5 shadow-md">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/20 border-2 border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0">
            <Gauge className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-bouncy block font-bold uppercase">
              Runway Speed
            </span>
            <span className="text-xl font-arcade text-cyan-400">
              {physicsConfig.baseScrollSpeed} px/s
            </span>
            <span className="text-[10px] text-slate-400 font-bouncy block">
              Horizontal conveyor pace
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border-2 border-slate-800 flex items-center gap-3.5 shadow-md">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 border-2 border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-bouncy block font-bold uppercase">
              Forgiveness Shield
            </span>
            <span className="text-xl font-arcade text-amber-400">
              {(physicsConfig.hitboxMarginPercent * 100).toFixed(0)}% Margin
            </span>
            <span className="text-[10px] text-slate-400 font-bouncy block">
              Fair-play obstacle buffer
            </span>
          </div>
        </div>
      </div>

      {/* Main Physics Tuning Controls */}
      <PhysicsControls config={physicsConfig} onChange={onUpdatePhysics} />
    </div>
  );
};
