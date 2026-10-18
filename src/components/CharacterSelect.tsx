/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CharacterDef } from '../types/game';
import { CHARACTERS } from '../game/constants';
import { CharacterAvatar } from './CharacterAvatar';
import { Users, Check, Flame, Zap, Shield, Sparkles } from 'lucide-react';

interface CharacterSelectProps {
  selectedCharacter: CharacterDef;
  onSelect: (char: CharacterDef) => void;
}

export const CharacterSelect: React.FC<CharacterSelectProps> = ({
  selectedCharacter,
  onSelect,
}) => {
  return (
    <div className="bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-slate-800/80 rounded-2xl p-6 shadow-xl relative overflow-hidden">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white font-arcade tracking-wide">
              PILOT ROSTER & JETPACK ARMORY
            </h3>
            <span className="text-xs text-slate-400 font-bouncy">
              Choose your flight hero before or during your run!
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bouncy font-bold">
          <span>Active:</span>
          <span className="text-white">{selectedCharacter.name}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {CHARACTERS.map((char) => {
          const isSelected = char.id === selectedCharacter.id;

          return (
            <button
              key={char.id}
              onClick={() => onSelect(char)}
              className={`arcade-btn p-4 rounded-2xl text-left transition-all relative border-2 cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-gradient-to-b from-slate-800 to-slate-900 border-amber-400 shadow-lg shadow-amber-500/10'
                  : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
              }`}
            >
              {isSelected && (
                <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-bold font-bouncy uppercase tracking-wider shadow-sm">
                  <Check className="w-3 h-3 stroke-[3]" />
                  <span>EQUIPPED</span>
                </div>
              )}

              <div>
                {/* Character Avatar Icon */}
                <div className="flex items-center gap-3 mb-3">
                  <CharacterAvatar character={char} size="md" />
                  <div>
                    <h4 className="text-sm font-bold text-white font-arcade leading-tight">
                      {char.name}
                    </h4>
                    <span className="text-[11px] text-amber-400 font-bouncy font-semibold">
                      {char.title}
                    </span>
                  </div>
                </div>

                {/* Lore / Description */}
                <p className="text-[11px] text-slate-300 font-bouncy line-clamp-2 mb-3 leading-relaxed">
                  {char.description}
                </p>
              </div>

              {/* Stats & Class Pill */}
              <div className="pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-bouncy">
                <span className="text-slate-400 capitalize font-medium flex items-center gap-1">
                  <Flame className="w-3 h-3 text-amber-400" />
                  <span>{char.jetpackType}</span>
                </span>
                <span className="font-bold text-slate-200">
                  Mass {char.massMultiplier}x
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
