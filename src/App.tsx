/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { TuningPage } from './components/TuningPage';
import { CharacterPage } from './components/CharacterPage';
import { CHARACTERS, DEFAULT_PHYSICS } from './game/constants';
import { CharacterDef, PhysicsConfig } from './types/game';
import { X } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'play' | 'tuning' | 'characters'>('play');
  const [physicsConfig, setPhysicsConfig] = useState<PhysicsConfig>(DEFAULT_PHYSICS);
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterDef>(CHARACTERS[0]);
  const [showHitboxes, setShowHitboxes] = useState<boolean>(false);
  const [slowMotion, setSlowMotion] = useState<boolean>(false);

  return (
    <div className="h-screen w-screen bg-slate-950 text-slate-100 flex flex-col font-sans overflow-hidden selection:bg-amber-400 selection:text-black relative">
      {/* Full-Screen Arcade Game View */}
      <div className="absolute inset-0 flex flex-col">
        <GameCanvas
          physicsConfig={physicsConfig}
          onUpdatePhysics={setPhysicsConfig}
          selectedCharacter={selectedCharacter}
          onSelectCharacter={setSelectedCharacter}
          showHitboxes={showHitboxes}
          onToggleHitboxes={() => setShowHitboxes(!showHitboxes)}
          slowMotion={slowMotion}
          onToggleSlowMotion={() => setSlowMotion(!slowMotion)}
          onNavigateToTuningPage={() => setActiveTab('tuning')}
          onNavigateToCharacterPage={() => setActiveTab('characters')}
        />
      </div>

      {/* Gadget Lab (Tuning) Modal Overlay */}
      {activeTab === 'tuning' && (
        <div className="absolute inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col overflow-y-auto p-4 sm:p-8 animate-in fade-in duration-200">
          <div className="max-w-6xl w-full mx-auto flex-1 flex flex-col relative pt-12 pb-8">
            <button
              onClick={() => setActiveTab('play')}
              className="absolute top-2 right-2 p-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border-2 border-slate-700/80 cursor-pointer flex items-center gap-2 font-arcade font-bold text-xs"
            >
              <X className="w-5 h-5" />
              <span>RETURN TO GAME</span>
            </button>
            <TuningPage
              physicsConfig={physicsConfig}
              onUpdatePhysics={setPhysicsConfig}
              onLaunchGame={() => setActiveTab('play')}
            />
          </div>
        </div>
      )}

      {/* Hero Hangar (Characters) Modal Overlay */}
      {activeTab === 'characters' && (
        <div className="absolute inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col overflow-y-auto p-4 sm:p-8 animate-in fade-in duration-200">
          <div className="max-w-6xl w-full mx-auto flex-1 flex flex-col relative pt-12 pb-8">
            <button
              onClick={() => setActiveTab('play')}
              className="absolute top-2 right-2 p-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border-2 border-slate-700/80 cursor-pointer flex items-center gap-2 font-arcade font-bold text-xs"
            >
              <X className="w-5 h-5" />
              <span>RETURN TO GAME</span>
            </button>
            <CharacterPage
              selectedCharacter={selectedCharacter}
              onSelectCharacter={setSelectedCharacter}
              onLaunchGame={() => setActiveTab('play')}
            />
          </div>
        </div>
      )}
    </div>
  );
}
