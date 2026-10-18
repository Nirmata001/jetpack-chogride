/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { PhysicsConfig } from '../types/game';
import { getKotlinFiles, KotlinFile } from '../data/kotlinCodeData';
import {
  Code2,
  Copy,
  Check,
  FileCode,
  FolderTree,
  ExternalLink,
  Cpu,
  Layers,
  Sparkles,
} from 'lucide-react';

interface KotlinCodeHubProps {
  physicsConfig: PhysicsConfig;
}

export const KotlinCodeHub: React.FC<KotlinCodeHubProps> = ({ physicsConfig }) => {
  const files = getKotlinFiles(physicsConfig);
  const [selectedFileIndex, setSelectedFileIndex] = useState<number>(0);
  const [copiedFile, setCopiedFile] = useState<string | null>(null);

  const activeFile = files[selectedFileIndex] || files[0];

  const handleCopy = (file: KotlinFile) => {
    navigator.clipboard.writeText(file.code);
    setCopiedFile(file.name);
    setTimeout(() => {
      setCopiedFile(null);
    }, 2000);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="p-5 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Code2 className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-slate-100 font-display tracking-wide">
              KOTLIN ANDROID STUDIO ARCHITECTURE
            </h3>
            <span className="text-[11px] text-amber-400 font-mono bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
              Live Tuned
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Production-grade Kotlin classes for Android Studio. Constants are automatically synced with your active physics controls above.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleCopy(activeFile)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs tracking-wide shadow-sm transition-all cursor-pointer"
          >
            {copiedFile === activeFile.name ? (
              <>
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>COPIED {activeFile.name.toUpperCase()}</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>COPY ACTIVE FILE</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Code Studio Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[500px]">
        {/* Left Sidebar: File Tree */}
        <div className="lg:col-span-4 border-r border-slate-800 bg-slate-950/70 p-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-3 px-2">
            <FolderTree className="w-3.5 h-3.5" />
            <span>PROJECT FILES ({files.length})</span>
          </div>

          <div className="space-y-1">
            {files.map((file, idx) => {
              const isSelected = idx === selectedFileIndex;
              return (
                <button
                  key={file.name}
                  onClick={() => setSelectedFileIndex(idx)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-lg text-left text-xs transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-800 text-amber-400 font-semibold border border-slate-700/80 shadow-xs'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FileCode
                      className={`w-4 h-4 shrink-0 ${
                        isSelected ? 'text-amber-400' : 'text-slate-500'
                      }`}
                    />
                    <div className="truncate">
                      <span className="block truncate">{file.name}</span>
                      <span className="block text-[10px] text-slate-500 truncate">
                        {file.category}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Quick Architecture Summary Card */}
          <div className="mt-6 p-3 rounded-lg bg-slate-900 border border-slate-800/80 text-[11px] space-y-2">
            <div className="flex items-center gap-1.5 text-slate-200 font-semibold">
              <Cpu className="w-3.5 h-3.5 text-amber-400" />
              <span>Android Engine Pipeline</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              1. <strong>SurfaceView</strong> runs on a secondary thread (GameLoopThread) at fixed 60Hz.
            </p>
            <p className="text-slate-400 leading-relaxed">
              2. <strong>Euler Integration</strong> ensures deterministic vertical velocity ($v_y$).
            </p>
            <p className="text-slate-400 leading-relaxed">
              3. <strong>Zero-allocation AABB</strong> avoids garbage collection pauses during gameplay.
            </p>
          </div>
        </div>

        {/* Right Code Display */}
        <div className="lg:col-span-8 flex flex-col bg-slate-950">
          {/* File Tab Header */}
          <div className="px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 font-mono text-slate-300">
              <span className="text-amber-400 font-bold">{activeFile.name}</span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-500 text-[11px] truncate max-w-xs">{activeFile.path}</span>
            </div>
            <span className="text-[11px] text-slate-400 hidden sm:inline">
              {activeFile.description}
            </span>
          </div>

          {/* Code Body */}
          <div className="p-4 overflow-x-auto font-mono text-xs text-slate-300 leading-relaxed max-h-[560px]">
            <pre className="selection:bg-amber-500 selection:text-black">
              <code>{activeFile.code}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
