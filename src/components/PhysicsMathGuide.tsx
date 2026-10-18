/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BookOpen, MoveRight, Shield, Zap, Sparkles, Terminal } from 'lucide-react';

export const PhysicsMathGuide: React.FC = () => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-6">
      {/* Section Header */}
      <div className="border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2 mb-1">
          <BookOpen className="w-4 h-4 text-amber-400" />
          <h3 className="text-base font-bold text-slate-100 font-display tracking-wide">
            CORE MECHANICS & ANDROID STUDIO MATHEMATICAL SPECIFICATION
          </h3>
        </div>
        <p className="text-xs text-slate-400">
          First-iteration mathematical model for Jetpack Joyride mechanics implemented in Kotlin for Android Studio.
        </p>
      </div>

      {/* Grid of 4 Core Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
        {/* Pillar 1: Endless Side-Scrolling */}
        <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-amber-400 font-semibold font-display text-sm">
            <MoveRight className="w-4 h-4" />
            <span>1. Endless Side-Scrolling Movement</span>
          </div>
          <p className="text-slate-300 leading-relaxed">
            The player does not travel horizontally in screen space. Instead, the player’s X coordinate is fixed at an anchor (X = 140px), and the entire game universe shifts leftward:
          </p>
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 font-mono text-[11px] text-amber-300">
            x_obstacle(t + dt) = x_obstacle(t) - v_world * dt
          </div>
          <p className="text-slate-400 leading-relaxed">
            <strong>Parallax Depth:</strong> To create cinematic lab depth, background layers scroll with fractional multipliers:
          </p>
          <ul className="list-disc list-inside text-slate-400 space-y-1 pl-1">
            <li>Far terminal & conduits: <code className="text-slate-200">0.15 × v_world</code></li>
            <li>Laboratory chemical vats: <code className="text-slate-200">0.45 × v_world</code></li>
            <li>Conveyor floor & ceiling rails: <code className="text-slate-200">1.00 × v_world</code></li>
          </ul>
        </div>

        {/* Pillar 2: Jetpack Gravity & Vertical Velocity */}
        <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-cyan-400 font-semibold font-display text-sm">
            <Zap className="w-4 h-4" />
            <span>2. Jetpack Gravity & Vertical Velocity ($v_y$)</span>
          </div>
          <p className="text-slate-300 leading-relaxed">
            Android canvas uses top-left origin ($(0,0)$ top-left, downward is $+Y$). The net vertical acceleration $a_y$ is determined by touch state:
          </p>
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 font-mono text-[11px] text-cyan-300">
            a_y = if (touchActive) (g - a_thrust) else g
          </div>
          <p className="text-slate-400 leading-relaxed">
            <strong>Semi-Implicit Euler Integration:</strong>
          </p>
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 font-mono text-[11px] text-slate-300">
            v_y += a_y * dt<br />
            v_y = clamp(v_y, -v_climb_max, v_fall_max)<br />
            y += v_y * dt
          </div>
          <p className="text-slate-400 leading-relaxed">
            When player reaches ground level (y &gt;= y_floor), vertical velocity is zeroed (v_y = 0) and state switches to <span className="text-emerald-400 font-semibold">RUNNING</span> with feet animation.
          </p>
        </div>

        {/* Pillar 3: Collision Detection (AABB) */}
        <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-rose-400 font-semibold font-display text-sm">
            <Shield className="w-4 h-4" />
            <span>3. Bounding Box (AABB) Collision Logic</span>
          </div>
          <p className="text-slate-300 leading-relaxed">
            Collision between Axis-Aligned Bounding Boxes utilizes 1D projections on the X and Y axes (Separating Axis Theorem):
          </p>
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 font-mono text-[11px] text-rose-300">
            intersects = (A.left &lt; B.right &amp;&amp; A.right &gt; B.left &amp;&amp;<br />
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;A.top &lt; B.bottom &amp;&amp; A.bottom &gt; B.top)
          </div>
          <p className="text-slate-400 leading-relaxed">
            <strong>Fair-Play Margin:</strong> Standard arcade sprites include empty border pixels. To prevent player frustration, the Kotlin engine insets the player hitbox by <span className="text-emerald-400 font-semibold">16%</span>:
          </p>
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 font-mono text-[11px] text-slate-300">
            padX = width * 0.16f; padY = height * 0.16f<br />
            hitbox = RectF(x + padX, y + padY, x + w - padX, y + h - padY)
          </div>
        </div>

        {/* Pillar 4: Game Loop Integration */}
        <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold font-display text-sm">
            <Terminal className="w-4 h-4" />
            <span>4. Android Studio Game Loop Architecture</span>
          </div>
          <p className="text-slate-300 leading-relaxed">
            In Android Studio, running a physics engine on the Main UI Thread causes dropped frames and stutter. We implement a dedicated <code className="text-amber-300">GameLoopThread</code> paired with <code className="text-amber-300">SurfaceView</code>:
          </p>
          <ul className="list-disc list-inside text-slate-400 space-y-1 pl-1">
            <li><strong>Decoupled Worker Thread:</strong> SurfaceHolder.lockCanvas() off the UI thread.</li>
            <li><strong>Fixed Delta-Time (1/60s):</strong> Prevents tunneling where fast missiles pass through player hitboxes between ticks.</li>
            <li><strong>Touch Handling:</strong> <code className="text-slate-200">MotionEvent.ACTION_DOWN</code> activates jetpack; <code className="text-slate-200">ACTION_UP</code> cuts thrust.</li>
            <li><strong>Zero Allocation in Loop:</strong> Reuses BoundingBox instances to stop Android GC pauses.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
