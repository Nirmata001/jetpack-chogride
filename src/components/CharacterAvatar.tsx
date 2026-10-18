/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CharacterDef } from '../types/game';

interface CharacterAvatarProps {
  character: CharacterDef;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const CharacterAvatar: React.FC<CharacterAvatarProps> = ({
  character,
  size = 'md',
  className = '',
}) => {
  const sizeMap = {
    sm: 'w-8 h-8',
    md: 'w-11 h-11',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  };

  const dim = sizeMap[size];

  // Specific high-fidelity illustrated vector avatar portraits
  if (character.id === 'chog') {
    return (
      <div
        className={`${dim} rounded-2xl relative flex items-center justify-center overflow-hidden border-2 shadow-lg transition-transform ${className}`}
        style={{
          borderColor: '#c084fc',
          background: 'radial-gradient(circle at 50% 30%, #581c87 0%, #1e1b4b 100%)',
        }}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
          <defs>
            {/* Purple Fur & Quill Gradients */}
            <linearGradient id="chogQuillTop" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#c084fc" />
              <stop offset="50%" stopColor="#9333ea" />
              <stop offset="100%" stopColor="#6b21a8" />
            </linearGradient>
            <linearGradient id="chogQuillUnder" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#6b21a8" />
              <stop offset="100%" stopColor="#3b0764" />
            </linearGradient>
            <linearGradient id="chogMuzzleGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffedd5" />
              <stop offset="100%" stopColor="#fed7aa" />
            </linearGradient>
            <radialGradient id="chogEyeGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#a855f7" />
              <stop offset="100%" stopColor="#4c1d95" />
            </radialGradient>
          </defs>

          {/* Background Ambient Glow */}
          <circle cx="50" cy="50" r="46" fill="#9333ea" opacity="0.18" />

          {/* Layer 1: Backward Sweeping Hedgehog Quills / Spines (Left / Back side) */}
          {/* Top-back major quill */}
          <path
            d="M 38 32 C 22 24 10 12 6 4 C 18 14 30 20 44 26 Z"
            fill="url(#chogQuillTop)"
            stroke="#1e1b4b"
            strokeWidth="1.2"
          />
          {/* Mid-back major spine */}
          <path
            d="M 32 46 C 16 42 6 30 2 20 C 12 32 24 38 36 42 Z"
            fill="url(#chogQuillUnder)"
            stroke="#1e1b4b"
            strokeWidth="1.2"
          />
          {/* Lower nape spine */}
          <path
            d="M 30 62 C 14 62 6 52 4 44 C 14 54 24 58 34 60 Z"
            fill="url(#chogQuillUnder)"
            stroke="#1e1b4b"
            strokeWidth="1.2"
          />

          {/* Layer 2: Right / Front Crest Quills */}
          {/* High Top Crest Quill (Sweeping up and back) */}
          <path
            d="M 52 26 C 46 12 38 2 28 0 C 40 8 50 16 58 24 Z"
            fill="url(#chogQuillTop)"
            stroke="#1e1b4b"
            strokeWidth="1.4"
          />
          {/* Right crown side quill */}
          <path
            d="M 66 32 C 78 20 86 12 92 6 C 84 18 76 26 68 30 Z"
            fill="url(#chogQuillTop)"
            stroke="#1e1b4b"
            strokeWidth="1.2"
          />

          {/* Hedgehog Head Cranium Sphere */}
          <circle cx="52" cy="46" r="28" fill="#7e22ce" stroke="#1e1b4b" strokeWidth="2" />

          {/* Pointed Hedgehog Ears */}
          {/* Left Ear */}
          <path
            d="M 34 26 Q 30 10 24 8 Q 28 18 36 24 Z"
            fill="#6b21a8"
            stroke="#1e1b4b"
            strokeWidth="1.5"
          />
          <path d="M 32 23 Q 29 13 26 11 Q 29 17 34 22 Z" fill="#f472b6" />

          {/* Right Ear */}
          <path
            d="M 68 28 Q 78 14 84 10 Q 78 20 70 26 Z"
            fill="#7e22ce"
            stroke="#1e1b4b"
            strokeWidth="1.5"
          />
          <path d="M 70 25 Q 77 15 81 12 Q 76 20 71 24 Z" fill="#f472b6" />

          {/* Prominent Cartoon Brow Ridge (Sonic-style arch) */}
          <path
            d="M 36 40 Q 52 32 68 38 Q 66 43 52 38 Q 38 43 36 40 Z"
            fill="#a855f7"
            stroke="#1e1b4b"
            strokeWidth="1.2"
          />

          {/* Big Expressive Cartoon Eyes */}
          {/* Left Eye Sclera */}
          <ellipse cx="44" cy="45" rx="7.5" ry="10" fill="#ffffff" stroke="#1e1b4b" strokeWidth="1.4" />
          {/* Left Iris & Pupil */}
          <ellipse cx="46" cy="46" rx="4.5" ry="6.5" fill="url(#chogEyeGlow)" />
          <ellipse cx="46" cy="46" rx="2.5" ry="4" fill="#020617" />
          <circle cx="44" cy="42" r="2.2" fill="#ffffff" />
          <circle cx="48" cy="49" r="1.0" fill="#ffffff" />

          {/* Right Eye Sclera */}
          <ellipse cx="60" cy="45" rx="7.5" ry="10" fill="#ffffff" stroke="#1e1b4b" strokeWidth="1.4" />
          {/* Right Iris & Pupil */}
          <ellipse cx="58" cy="46" rx="4.5" ry="6.5" fill="url(#chogEyeGlow)" />
          <ellipse cx="58" cy="46" rx="2.5" ry="4" fill="#020617" />
          <circle cx="56" cy="42" r="2.2" fill="#ffffff" />
          <circle cx="60" cy="49" r="1.0" fill="#ffffff" />

          {/* Protruding Peach Snout / Muzzle */}
          <ellipse
            cx="52"
            cy="60"
            rx="18"
            ry="13"
            fill="url(#chogMuzzleGrad)"
            stroke="#1e1b4b"
            strokeWidth="1.8"
          />

          {/* Glossy Black Button Nose at top of muzzle */}
          <ellipse cx="52" cy="53" rx="4.2" ry="3.2" fill="#09090b" stroke="#1e1b4b" strokeWidth="1" />
          <ellipse cx="50.8" cy="52" rx="1.6" ry="1.0" fill="#ffffff" />

          {/* Cheeky Smirk / Smile */}
          <path
            d="M 44 65 Q 52 71 61 64"
            fill="none"
            stroke="#1e1b4b"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          {/* White tooth glint */}
          <polygon points="50,65.5 53,65.5 51.5,67.5" fill="#ffffff" />

          {/* Pink Cartoon Glove Thumbs-Up (Lower Right) */}
          <g transform="translate(68, 62) scale(0.38)">
            {/* Pink Puffy Glove */}
            <circle cx="20" cy="24" r="16" fill="#ec4899" stroke="#1e1b4b" strokeWidth="3" />
            {/* Thumb Up */}
            <path
              d="M 12 18 C 10 6 22 4 24 16 Z"
              fill="#ec4899"
              stroke="#1e1b4b"
              strokeWidth="3"
            />
            {/* Rolled Cuff Ring */}
            <ellipse cx="20" cy="36" rx="14" ry="5" fill="#db2777" stroke="#1e1b4b" strokeWidth="3" />
          </g>
        </svg>
      </div>
    );
  }

  if (character.id === 'barry') {
    return (
      <div
        className={`${dim} rounded-2xl relative flex items-center justify-center overflow-hidden border-2 shadow-lg ${className}`}
        style={{
          borderColor: '#f59e0b',
          background: 'radial-gradient(circle at 50% 30%, #78350f 0%, #1c1917 100%)',
        }}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
          {/* Spiky Chestnut Hair */}
          <path
            d="M 22 46 L 20 28 L 32 34 L 40 18 L 52 28 L 62 14 L 70 30 L 80 26 L 76 50 Z"
            fill="#78350f"
            stroke="#451a03"
            strokeWidth="2"
          />
          <path d="M 38 20 L 46 32 L 58 18 L 62 30" fill="#92400e" />
          {/* Face */}
          <rect x="28" y="38" width="44" height="42" rx="14" fill="#fed7aa" stroke="#1e293b" strokeWidth="1.5" />
          {/* Eyebrows */}
          <path d="M 34 46 L 46 49" stroke="#451a03" strokeWidth="3" strokeLinecap="round" />
          <path d="M 54 49 L 66 46" stroke="#451a03" strokeWidth="3" strokeLinecap="round" />
          {/* Eyes */}
          <ellipse cx="40" cy="54" rx="4.5" ry="5.5" fill="#0f172a" />
          <circle cx="39" cy="52" r="1.8" fill="#ffffff" />
          <ellipse cx="60" cy="54" rx="4.5" ry="5.5" fill="#0f172a" />
          <circle cx="59" cy="52" r="1.8" fill="#ffffff" />
          {/* Smirk */}
          <path d="M 44 68 Q 50 72 58 67" stroke="#451a03" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          {/* Commando Collar */}
          <path d="M 24 82 L 50 74 L 76 82 L 76 100 L 24 100 Z" fill="#15803d" stroke="#14532d" strokeWidth="2" />
        </svg>
      </div>
    );
  }

  if (character.id === 'cyber_ninja') {
    return (
      <div
        className={`${dim} rounded-2xl relative flex items-center justify-center overflow-hidden border-2 shadow-lg ${className}`}
        style={{
          borderColor: '#06b6d4',
          background: 'radial-gradient(circle at 50% 30%, #083344 0%, #020617 100%)',
        }}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
          {/* Cyber Mask & Cat/Fox Fins */}
          <polygon points="20,18 34,40 18,36" fill="#06b6d4" stroke="#0891b2" strokeWidth="1.5" />
          <polygon points="80,18 66,40 82,36" fill="#06b6d4" stroke="#0891b2" strokeWidth="1.5" />
          <ellipse cx="50" cy="52" rx="30" ry="28" fill="#0f172a" stroke="#06b6d4" strokeWidth="2" />
          {/* Cyber Visor */}
          <path
            d="M 26 44 Q 50 38 74 44 L 70 58 Q 50 64 30 58 Z"
            fill="#ec4899"
            stroke="#f43f5e"
            strokeWidth="1.5"
          />
          {/* Visor Glint */}
          <line x1="34" y1="48" x2="66" y2="48" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
          {/* Scarf knot */}
          <path d="M 40 76 L 50 84 L 60 76 L 70 96 L 30 96 Z" fill="#06b6d4" />
        </svg>
      </div>
    );
  }

  if (character.id === 'astrobot') {
    return (
      <div
        className={`${dim} rounded-2xl relative flex items-center justify-center overflow-hidden border-2 shadow-lg ${className}`}
        style={{
          borderColor: '#10b981',
          background: 'radial-gradient(circle at 50% 30%, #064e3b 0%, #022c22 100%)',
        }}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
          {/* Antenna */}
          <line x1="50" y1="8" x2="50" y2="24" stroke="#94a3b8" strokeWidth="4" />
          <circle cx="50" cy="8" r="6" fill="#34d399" />
          {/* Head Capsule */}
          <rect x="22" y="24" width="56" height="52" rx="26" fill="#f8fafc" stroke="#64748b" strokeWidth="2" />
          {/* Glass Visor */}
          <rect x="28" y="36" width="44" height="28" rx="14" fill="#0f172a" stroke="#10b981" strokeWidth="1.5" />
          {/* Digital LED Eyes */}
          <circle cx="42" cy="50" r="5" fill="#34d399" />
          <circle cx="43" cy="49" r="2" fill="#ffffff" />
          <circle cx="58" cy="50" r="5" fill="#34d399" />
          <circle cx="59" cy="49" r="2" fill="#ffffff" />
          {/* Cute Smile LED */}
          <path d="M 46 58 Q 50 61 54 58" stroke="#34d399" strokeWidth="2" strokeLinecap="round" fill="none" />
        </svg>
      </div>
    );
  }

  // Valkyrie
  return (
    <div
      className={`${dim} rounded-2xl relative flex items-center justify-center overflow-hidden border-2 shadow-lg ${className}`}
      style={{
        borderColor: '#f97316',
        background: 'radial-gradient(circle at 50% 30%, #7c2d12 0%, #431407 100%)',
      }}
    >
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
        {/* Copper Curls */}
        <circle cx="30" cy="42" r="12" fill="#b45309" />
        <circle cx="70" cy="42" r="12" fill="#b45309" />
        <circle cx="50" cy="30" r="16" fill="#d97706" />
        {/* Face */}
        <ellipse cx="50" cy="54" rx="22" ry="20" fill="#fed7aa" />
        {/* Aviator Brass Goggles */}
        <rect x="28" y="34" width="18" height="14" rx="4" fill="#d97706" stroke="#78350f" strokeWidth="2" />
        <rect x="54" y="34" width="18" height="14" rx="4" fill="#d97706" stroke="#78350f" strokeWidth="2" />
        <rect x="31" y="37" width="12" height="8" rx="2" fill="#38bdf8" />
        <rect x="57" y="37" width="12" height="8" rx="2" fill="#38bdf8" />
        {/* Eyes */}
        <circle cx="42" cy="56" r="3.5" fill="#0f172a" />
        <circle cx="58" cy="56" r="3.5" fill="#0f172a" />
        <circle cx="41" cy="55" r="1.2" fill="#ffffff" />
        <circle cx="57" cy="55" r="1.2" fill="#ffffff" />
        {/* Smile */}
        <path d="M 46 64 Q 50 67 54 64" stroke="#78350f" strokeWidth="2" strokeLinecap="round" fill="none" />
      </svg>
    </div>
  );
};
