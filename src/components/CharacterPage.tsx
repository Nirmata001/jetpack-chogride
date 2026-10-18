/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CharacterDef } from '../types/game';
import { CHARACTERS } from '../game/constants';
import { CharacterAvatar } from './CharacterAvatar';
import { Character3DViewer } from './Character3DViewer';
import { Users, Check, Flame, Star, Sparkles, Shield, Zap } from 'lucide-react';

interface CharacterPageProps {
  selectedCharacter: CharacterDef;
  onSelectCharacter: (char: CharacterDef) => void;
  onLaunchGame: () => void;
}

export const CharacterPage: React.FC<CharacterPageProps> = ({
  selectedCharacter,
  onSelectCharacter,
  onLaunchGame,
}) => {
  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Playful Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border-2 border-amber-500/30 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-xs font-bouncy font-bold uppercase tracking-wider mb-2.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>OPERATIVE SELECTION</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-arcade text-white tracking-wide mb-1.5">
            PILOT HANGAR &amp; SUIT ARMORY
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 font-bouncy leading-relaxed max-w-xl">
            Pick your favorite hero! Each operative comes equipped with custom jetpack propulsion, custom particles, and unique agility handling.
          </p>
        </div>

      </div>

      {/* Interactive 3D Holographic Character Stage */}
      <Character3DViewer character={selectedCharacter} />

      {/* Collectible Hero Trading Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {CHARACTERS.map((char) => {
          const isSelected = char.id === selectedCharacter.id;

          const getStarRating = (id: string) => {
            switch (id) {
              case 'chog':
                return { speed: 5, handling: 5, style: 5, tag: '⭐ MONAD MASCOT' };
              case 'barry':
                return { speed: 4, handling: 4, style: 5, tag: 'THE LEGEND' };
              case 'cyber_ninja':
                return { speed: 5, handling: 5, style: 5, tag: 'NEON ASSASSIN' };
              case 'astrobot':
                return { speed: 3, handling: 4, style: 4, tag: 'AI EXPERIMENT' };
              case 'valkyrie':
                return { speed: 4, handling: 3, style: 5, tag: 'STEAM POWER' };
              default:
                return { speed: 4, handling: 4, style: 4, tag: 'HERO' };
            }
          };

          const stats = getStarRating(char.id);

          return (
            <div
              key={char.id}
              className={`p-6 rounded-3xl border-2 transition-all relative flex flex-col justify-between overflow-hidden ${
                isSelected
                  ? 'bg-gradient-to-b from-slate-900 to-slate-950 border-amber-400 shadow-2xl ring-2 ring-amber-400/40'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/90'
              }`}
            >
              {/* Card Badge */}
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-[11px] font-arcade text-amber-300">
                  {stats.tag}
                </span>

                {isSelected ? (
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400 text-slate-950 text-xs font-bouncy font-extrabold uppercase shadow-sm">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>EQUIPPED</span>
                  </div>
                ) : (
                  <span className="text-[11px] text-slate-500 font-bouncy">READY TO FLY</span>
                )}
              </div>

              <div>
                {/* Character Avatar Icon & Header */}
                <div className="flex items-center gap-4 mb-4">
                  <CharacterAvatar character={char} size="lg" />
                  <div>
                    <h3 className="text-xl font-bold text-white font-arcade tracking-wide">
                      {char.name}
                    </h3>
                    <span className="text-xs text-amber-400 font-bouncy font-semibold block">
                      {char.title}
                    </span>
                  </div>
                </div>

                {/* Lore / Description */}
                <p className="text-xs text-slate-300 font-bouncy leading-relaxed mb-5">
                  {char.description}
                </p>

                {/* Star Ratings & Specs */}
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 mb-5 space-y-2 text-xs font-bouncy">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Jetpack Propulsion:</span>
                    <span className="text-white font-bold capitalize flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 text-amber-400" />
                      <span>{char.jetpackType} Thruster</span>
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Suit Agility Rating:</span>
                    <div className="flex items-center gap-0.5 text-amber-400">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${
                            i < stats.handling ? 'fill-amber-400 text-amber-400' : 'text-slate-700'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Chassis Mass:</span>
                    <span className="text-slate-200 font-bold font-mono">
                      {char.massMultiplier}x (Handling Scale)
                    </span>
                  </div>
                </div>
              </div>

              {/* Equip Action Button */}
              <button
                onClick={() => onSelectCharacter(char)}
                disabled={isSelected}
                className={`arcade-btn w-full py-3 rounded-2xl font-arcade font-bold text-xs tracking-wider transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-slate-800 text-slate-500 cursor-default border border-slate-700/60 shadow-none'
                    : 'bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 shadow-md active:scale-95'
                }`}
              >
                {isSelected ? 'CURRENTLY EQUIPPED' : `SELECT ${char.name.toUpperCase()}`}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
