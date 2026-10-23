/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  MessageSquare,
  Wallet,
  Coins,
  Lock,
  CheckCircle,
  AlertCircle,
  Database,
} from 'lucide-react';
import {
  getLocalPlayer,
  registerPlayer,
  updateWalletAddress,
  isSupabaseConfigured,
  PlayerRecord,
} from '../lib/supabase';
import { sound } from '../game/sound';

interface PlayerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLifetimeCoins: number;
}

export const PlayerProfileModal: React.FC<PlayerProfileModalProps> = ({
  isOpen,
  onClose,
  currentLifetimeCoins,
}) => {
  const [player, setPlayer] = useState<PlayerRecord | null>(null);
  const [username, setUsername] = useState('');
  const [discordId, setDiscordId] = useState('');
  const [walletAddress, setWalletAddress] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  const supabaseActive = isSupabaseConfigured();

  // Load registered player profile on open
  useEffect(() => {
    if (isOpen) {
      const existing = getLocalPlayer();
      if (existing) {
        setPlayer(existing);
        setUsername(existing.username);
        setDiscordId(existing.discord_id);
        setWalletAddress(existing.wallet_address);
      } else {
        setPlayer(null);
        setUsername('');
        setDiscordId('');
        setWalletAddress('');
      }
      setStatusMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isRegistered = Boolean(player && player.username);

  // Initial Registration Handler
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setStatusMessage({ type: 'error', text: 'Please enter a valid username.' });
      return;
    }
    if (!discordId.trim()) {
      setStatusMessage({ type: 'error', text: 'Please enter your Discord ID.' });
      return;
    }
    if (!walletAddress.trim()) {
      setStatusMessage({ type: 'error', text: 'Please enter a wallet address.' });
      return;
    }

    setIsLoading(true);
    setStatusMessage(null);
    sound.playUiClick();

    const result = await registerPlayer(
      username,
      discordId,
      walletAddress,
      currentLifetimeCoins
    );

    setIsLoading(false);
    if (result.success && result.player) {
      setPlayer(result.player);
      setStatusMessage({
        type: 'success',
        text: supabaseActive
          ? 'Pilot profile successfully registered in Supabase!'
          : 'Profile saved locally! (Add Supabase credentials to .env to sync with cloud)',
      });
      sound.playRecordFanfare();
    } else {
      setStatusMessage({
        type: 'error',
        text: result.error || 'Failed to register player profile.',
      });
    }
  };

  // Wallet-Only Update Handler
  const handleUpdateWalletOnly = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletAddress.trim()) {
      setStatusMessage({ type: 'error', text: 'Wallet address cannot be empty.' });
      return;
    }
    if (walletAddress.trim() === player?.wallet_address) {
      setStatusMessage({ type: 'info', text: 'Wallet address is already up to date.' });
      return;
    }

    setIsLoading(true);
    setStatusMessage(null);
    sound.playUiClick();

    const result = await updateWalletAddress(player!.username, walletAddress);

    setIsLoading(false);
    if (result.success && result.player) {
      setPlayer(result.player);
      setStatusMessage({
        type: 'success',
        text: 'Wallet address updated successfully!',
      });
    } else {
      setStatusMessage({
        type: 'error',
        text: result.error || 'Failed to update wallet address.',
      });
    }
  };

  const totalCoins = Math.max(currentLifetimeCoins, player?.coins_accumulated || 0);

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          sound.playUiClick();
          onClose();
        }
      }}
    >
      <div className="max-w-xl w-full rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 sm:p-8 space-y-6 relative overflow-hidden my-auto">
        {/* Subtle decorative glow */}
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold font-arcade text-white tracking-wide leading-none">
                PLAYER DATABASE
              </h2>
              <span className="text-xs text-slate-400 font-mono">
                {isRegistered ? 'REGISTERED PILOT PROFILE' : 'NEW PILOT REGISTRATION'}
              </span>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playUiClick();
              onClose();
            }}
            className="arcade-btn p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Accumulated Coins Stash */}
        <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block">
              COINS ACCUMULATED
            </span>
            <span className="text-xl font-bold font-arcade text-amber-400 tabular-nums">
              {totalCoins}
            </span>
          </div>
        </div>

        {/* Status Alert Banner */}
        {statusMessage && (
          <div
            className={`p-3 rounded-xl border flex items-center gap-2.5 text-xs ${
              statusMessage.type === 'success'
                ? 'bg-emerald-950/50 border-emerald-500/50 text-emerald-300'
                : statusMessage.type === 'error'
                ? 'bg-rose-950/50 border-rose-500/50 text-rose-300'
                : 'bg-cyan-950/50 border-cyan-500/50 text-cyan-300'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Form: Initial Registration OR Wallet Update */}
        <form
          onSubmit={isRegistered ? handleUpdateWalletOnly : handleRegister}
          className="space-y-4"
        >
          {/* Username */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label className="font-semibold text-slate-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-amber-400" />
                <span>Player Username</span>
              </label>
              {isRegistered && (
                <span className="text-[10px] text-amber-400 font-mono flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  <span>Permanent Call-sign</span>
                </span>
              )}
            </div>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isRegistered || isLoading}
                placeholder="e.g. SpeedChog99"
                className={`w-full px-3.5 py-2.5 rounded-xl text-sm font-mono transition-all ${
                  isRegistered
                    ? 'bg-slate-950/60 border border-slate-800 text-slate-400 cursor-not-allowed'
                    : 'bg-slate-950 border border-slate-700 text-white focus:border-amber-400 focus:outline-hidden'
                }`}
                required
              />
              {isRegistered && (
                <Lock className="w-4 h-4 text-slate-500 absolute right-3.5 top-3" />
              )}
            </div>
          </div>

          {/* Discord ID */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label className="font-semibold text-slate-300 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                <span>Discord ID / Tag</span>
              </label>
              {isRegistered && (
                <span className="text-[10px] text-amber-400 font-mono flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  <span>Permanent Discord ID</span>
                </span>
              )}
            </div>
            <div className="relative">
              <input
                type="text"
                value={discordId}
                onChange={(e) => setDiscordId(e.target.value)}
                disabled={isRegistered || isLoading}
                placeholder="e.g. chogpilot#1337 or 892348239482"
                className={`w-full px-3.5 py-2.5 rounded-xl text-sm font-mono transition-all ${
                  isRegistered
                    ? 'bg-slate-950/60 border border-slate-800 text-slate-400 cursor-not-allowed'
                    : 'bg-slate-950 border border-slate-700 text-white focus:border-indigo-400 focus:outline-hidden'
                }`}
                required
              />
              {isRegistered && (
                <Lock className="w-4 h-4 text-slate-500 absolute right-3.5 top-3" />
              )}
            </div>
          </div>

          {/* Wallet Address (Always Editable) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                <span>Wallet Address</span>
              </label>
              {isRegistered && (
                <span className="text-[10px] text-emerald-400 font-mono font-semibold">
                  ✓ Editable Anytime
                </span>
              )}
            </div>
            <input
              type="text"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              disabled={isLoading}
              placeholder="e.g. 0x71C... or Solana / EVM Address"
              className="w-full px-3.5 py-2.5 rounded-xl text-sm font-mono bg-slate-950 border border-slate-700 text-white focus:border-emerald-400 focus:outline-hidden"
              required
            />
          </div>

          {/* Info notice about permanence */}
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-400 leading-relaxed">
            {isRegistered ? (
              <span className="text-amber-300">
                🔒 Security Protocol: Your Username and Discord ID are permanently locked in the database. Only your Wallet Address can be updated and saved.
              </span>
            ) : (
              <span>
                💡 Notice: Once registered, your Username and Discord ID will be permanently locked in the database. Only your Wallet Address can be edited afterwards.
              </span>
            )}
          </div>

          {/* Submit Action Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="arcade-btn w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-arcade font-black text-sm tracking-wider shadow-lg shadow-amber-500/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <span>SAVING...</span>
            ) : (
              <span>SAVE</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
