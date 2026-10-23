/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { TuningPage } from './components/TuningPage';
import { CHARACTERS, DEFAULT_PHYSICS } from './game/constants';
import { CharacterDef, PhysicsConfig } from './types/game';
import { X, ArrowLeft } from 'lucide-react';
import { sound } from './game/sound';

export default function App() {
  const [activeTab, setActiveTab] = useState<'play' | 'tuning'>('play');
  const [physicsConfig, setPhysicsConfig] = useState<PhysicsConfig>(DEFAULT_PHYSICS);
  const selectedCharacter: CharacterDef = CHARACTERS[0];
  const [showHitboxes, setShowHitboxes] = useState<boolean>(false);
  const [slowMotion, setSlowMotion] = useState<boolean>(false);

  // Global key listener for closing modal via Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape' && activeTab === 'tuning') {
        e.preventDefault();
        sound.playUiClick();
        setActiveTab('play');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab]);

  return (
    <div className="h-screen w-screen bg-slate-950 text-slate-100 flex flex-col font-sans overflow-hidden selection:bg-amber-400 selection:text-black relative">
      {/* Full-Screen Arcade Game View */}
      <div className="absolute inset-0 flex flex-col">
        <GameCanvas
          physicsConfig={physicsConfig}
          onUpdatePhysics={setPhysicsConfig}
          selectedCharacter={selectedCharacter}
          showHitboxes={showHitboxes}
          onToggleHitboxes={() => setShowHitboxes(!showHitboxes)}
          slowMotion={slowMotion}
          onToggleSlowMotion={() => setSlowMotion(!slowMotion)}
          onNavigateToTuningPage={() => {
            sound.playUiClick();
            setActiveTab('tuning');
          }}
        />
      </div>

      {/* Gadget Lab (Tuning) Modal Overlay */}
      {activeTab === 'tuning' && (
        <div className="absolute inset-0 z-50 bg-slate-950/90 backdrop-blur-xl flex flex-col overflow-y-auto p-4 sm:p-8 animate-in fade-in duration-200">
          <div className="max-w-5xl w-full mx-auto flex-1 flex flex-col relative pt-4 pb-12">
            {/* Top Close / Return Bar */}
            <div className="flex items-center justify-between pb-6 mb-2 border-b border-slate-800">
              <button
                onClick={() => {
                  sound.playUiClick();
                  setActiveTab('play');
                }}
                className="arcade-btn flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 cursor-pointer text-xs font-semibold tracking-wide transition-colors"
              >
                <ArrowLeft className="w-4 h-4 text-amber-400" />
                <span>Return to Flight [ESC]</span>
              </button>

              <button
                onClick={() => {
                  sound.playUiClick();
                  setActiveTab('play');
                }}
                className="arcade-btn p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700/80 cursor-pointer transition-colors"
                title="Close Lab (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <TuningPage
              physicsConfig={physicsConfig}
              onUpdatePhysics={setPhysicsConfig}
              onLaunchGame={() => {
                sound.playUiClick();
                setActiveTab('play');
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
