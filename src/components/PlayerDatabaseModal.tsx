/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Wallet,
  Shield,
  Lock,
  Check,
  Copy,
  Database,
  Trophy,
  Edit2,
  Save,
  AlertCircle,
  RefreshCw,
  LogOut,
} from 'lucide-react';
import {
  PlayerRecord,
  getActivePlayer,
  registerPlayer,
  updatePlayerWalletAddress,
  fetchLeaderboard,
  clearActivePlayer,
} from '../services/playerService';
import {
  getSupabaseCredentials,
  setCustomSupabaseCredentials,
  getSupabase,
} from '../lib/supabase';
import { sound } from '../game/sound';

interface PlayerDatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCoins: number;
  onPlayerRegistered?: (player: PlayerRecord) => void;
}

const SUPABASE_SQL_SCRIPT = `-- ========================================================
-- JETPACK CHOGRIDE - PLAYER DATABASE SCHEMA FOR SUPABASE
-- Run this in the Supabase Dashboard -> SQL Editor -> New Query
-- ========================================================

-- 1. Create the players table
CREATE TABLE IF NOT EXISTS public.players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT UNIQUE NOT NULL,
    discord_id TEXT NOT NULL,
    wallet_address TEXT NOT NULL,
    coins_accumulated BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Index for fast queries and leaderboard
CREATE INDEX IF NOT EXISTS idx_players_username ON public.players(username);
CREATE INDEX IF NOT EXISTS idx_players_coins ON public.players(coins_accumulated DESC);

-- 3. Trigger function to enforce immutability of username and discord_id
-- (Only wallet_address, coins_accumulated, and updated_at can be updated by users)
CREATE OR REPLACE FUNCTION public.enforce_player_immutable_fields()
RETURNS TRIGGER AS $$
BEGIN
    -- Prevent altering username
    IF NEW.username <> OLD.username THEN
        RAISE EXCEPTION 'Username is permanent and cannot be modified once set.';
    END IF;

    -- Prevent altering discord_id
    IF NEW.discord_id <> OLD.discord_id THEN
        RAISE EXCEPTION 'Discord ID is permanent and cannot be modified once set.';
    END IF;

    -- Automatically bump updated_at
    NEW.updated_at = now();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Attach trigger to players table
DROP TRIGGER IF EXISTS trg_enforce_player_immutable_fields ON public.players;
CREATE TRIGGER trg_enforce_player_immutable_fields
BEFORE UPDATE ON public.players
FOR EACH ROW
EXECUTE FUNCTION public.enforce_player_immutable_fields();

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies: Allow public read, registration, and wallet updates
-- Allow anyone to read players (e.g. for leaderboard and profile lookup)
DROP POLICY IF EXISTS "Public can view players" ON public.players;
CREATE POLICY "Public can view players"
ON public.players
FOR SELECT
TO public
USING (true);

-- Allow anyone to register a new player profile
DROP POLICY IF EXISTS "Public can register player" ON public.players;
CREATE POLICY "Public can register player"
ON public.players
FOR INSERT
TO public
WITH CHECK (true);

-- Allow updating player records (trigger strictly prevents changing username or discord_id)
DROP POLICY IF EXISTS "Players can update wallet and coins" ON public.players;
CREATE POLICY "Players can update wallet and coins"
ON public.players
FOR UPDATE
TO public
USING (true)
WITH CHECK (true);`;

export const PlayerDatabaseModal: React.FC<PlayerDatabaseModalProps> = ({
  isOpen,
  onClose,
  currentCoins,
  onPlayerRegistered,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'leaderboard' | 'setup'>('profile');
  const [player, setPlayer] = useState<PlayerRecord | null>(null);

  // Registration Form State
  const [regUsername, setRegUsername] = useState('');
  const [regDiscordId, setRegDiscordId] = useState('');
  const [regWallet, setRegWallet] = useState('');
  const [regError, setRegError] = useState('');
  const [regLoading, setRegLoading] = useState(false);

  // Edit Wallet State
  const [isEditingWallet, setIsEditingWallet] = useState(false);
  const [editWalletValue, setEditWalletValue] = useState('');
  const [walletError, setWalletError] = useState('');
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletSuccess, setWalletSuccess] = useState(false);

  // Leaderboard State
  const [leaderboard, setLeaderboard] = useState<PlayerRecord[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);

  // Supabase Credentials State
  const creds = getSupabaseCredentials();
  const [supabaseUrl, setSupabaseUrl] = useState(creds.url);
  const [supabaseKey, setSupabaseKey] = useState(creds.key);
  const [isConfigured, setIsConfigured] = useState(creds.isConfigured);
  const [testStatus, setTestStatus] = useState<string | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const active = getActivePlayer();
      setPlayer(active);
      if (active) {
        setEditWalletValue(active.wallet_address);
      }
      const c = getSupabaseCredentials();
      setIsConfigured(c.isConfigured);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && activeTab === 'leaderboard') {
      loadLeaderboard();
    }
  }, [isOpen, activeTab]);

  const loadLeaderboard = async () => {
    setLeaderboardLoading(true);
    const data = await fetchLeaderboard(15);
    setLeaderboard(data);
    setLeaderboardLoading(false);
  };

  if (!isOpen) return null;

  // Handle Registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    setRegLoading(true);
    sound.playUiClick();

    const res = await registerPlayer(regUsername, regDiscordId, regWallet, currentCoins);
    setRegLoading(false);

    if (res.success && res.player) {
      setPlayer(res.player);
      setEditWalletValue(res.player.wallet_address);
      setRegUsername('');
      setRegDiscordId('');
      setRegWallet('');
      if (onPlayerRegistered) onPlayerRegistered(res.player);
    } else {
      setRegError(res.error || 'Failed to register.');
    }
  };

  // Handle Wallet Update (Only wallet address can be edited)
  const handleUpdateWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!player) return;
    setWalletError('');
    setWalletSuccess(false);
    setWalletLoading(true);
    sound.playUiClick();

    const res = await updatePlayerWalletAddress(player.username, editWalletValue);
    setWalletLoading(false);

    if (res.success && res.player) {
      setPlayer(res.player);
      setIsEditingWallet(false);
      setWalletSuccess(true);
      setTimeout(() => setWalletSuccess(false), 3000);
      if (onPlayerRegistered) onPlayerRegistered(res.player);
    } else {
      setWalletError(res.error || 'Failed to update wallet address.');
    }
  };

  // Handle Save Supabase Keys
  const handleSaveCredentials = async () => {
    sound.playUiClick();
    setCustomSupabaseCredentials(supabaseUrl, supabaseKey);
    const updated = getSupabaseCredentials();
    setIsConfigured(updated.isConfigured);
    setTestStatus('Checking connection...');

    const client = getSupabase();
    if (!client) {
      setTestStatus('❌ Invalid URL or key format.');
      return;
    }

    try {
      const { error } = await client.from('players').select('count', { count: 'exact', head: true });
      if (error) {
        if (error.code === '42P01') {
          setTestStatus('⚠️ Connected, but table "players" not found. Please run the SQL script below!');
        } else {
          setTestStatus(`⚠️ Supabase response: ${error.message}`);
        }
      } else {
        setTestStatus('✅ Successfully connected to Supabase "players" table!');
      }
    } catch (err: any) {
      setTestStatus(`❌ Connection error: ${err.message}`);
    }
  };

  const handleCopySql = () => {
    sound.playUiClick();
    navigator.clipboard.writeText(SUPABASE_SQL_SCRIPT);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const handleLogout = () => {
    sound.playUiClick();
    clearActivePlayer();
    setPlayer(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200 select-none overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto relative max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center font-bold">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold font-arcade text-white tracking-wide">
                PLAYER DATABASE
              </h2>
              <span className="text-[10px] text-amber-400 font-mono uppercase tracking-wider block">
                SUPABASE CLOUD REGISTRY
              </span>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playUiClick();
              onClose();
            }}
            className="arcade-btn p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-6 pt-3 border-b border-slate-800/80 bg-slate-950/20">
          <button
            onClick={() => {
              sound.playUiClick();
              setActiveTab('profile');
            }}
            className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'profile'
                ? 'text-amber-400 border-b-2 border-amber-400 bg-slate-900'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Pilot Profile</span>
          </button>

          <button
            onClick={() => {
              sound.playUiClick();
              setActiveTab('leaderboard');
            }}
            className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'leaderboard'
                ? 'text-amber-400 border-b-2 border-amber-400 bg-slate-900'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Player Registry</span>
          </button>

          <button
            onClick={() => {
              sound.playUiClick();
              setActiveTab('setup');
            }}
            className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'setup'
                ? 'text-amber-400 border-b-2 border-amber-400 bg-slate-900'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Supabase SQL &amp; Setup</span>
            {isConfigured && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="Connected" />
            )}
          </button>
        </div>

        {/* Tab 1: Pilot Profile */}
        {activeTab === 'profile' && (
          <div className="p-6 overflow-y-auto space-y-6">
            {player ? (
              /* Already Registered View */
              <div className="space-y-5">
                {/* Profile Badge Card */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center text-white text-xl font-arcade font-extrabold shadow-md">
                      {player.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold font-arcade text-white">
                          @{player.username}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono font-semibold">
                          VERIFIED PILOT
                        </span>
                      </div>
                      <span className="text-xs text-slate-400 font-mono">
                        Discord: {player.discord_id}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="arcade-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-rose-400 text-xs font-semibold transition-colors cursor-pointer"
                    title="Switch or Register another Pilot"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Switch</span>
                  </button>
                </div>

                {/* Accumulated Coins Stash */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-amber-950/20 to-slate-950 border border-amber-500/30 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-mono tracking-wider text-amber-400 font-semibold block">
                      TOTAL COINS ACCUMULATED
                    </span>
                    <span className="text-2xl font-black font-arcade text-amber-300 tabular-nums">
                      🪙 {player.coins_accumulated}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 max-w-[200px] text-right font-sans">
                    Automatically syncs with every completed flight run.
                  </span>
                </div>

                {/* Immutability Notice & Field Rules */}
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs text-slate-300 flex items-start gap-2.5">
                  <Shield className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    <strong className="text-white">Security Rule:</strong> Your <span className="text-amber-300">Username</span> and <span className="text-amber-300">Discord ID</span> are permanent credentials locked in the database. Only your <strong className="text-emerald-400">Wallet Address</strong> can be edited at any time.
                  </p>
                </div>

                {/* Fields Display & Wallet Editor */}
                <div className="space-y-4">
                  {/* Username (Locked) */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                      <Lock className="w-3 h-3 text-slate-500" />
                      <span>Username (Permanent)</span>
                    </label>
                    <input
                      type="text"
                      disabled
                      value={player.username}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 text-sm font-mono cursor-not-allowed opacity-80"
                    />
                  </div>

                  {/* Discord ID (Locked) */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                      <Lock className="w-3 h-3 text-slate-500" />
                      <span>Discord ID (Permanent)</span>
                    </label>
                    <input
                      type="text"
                      disabled
                      value={player.discord_id}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 text-sm font-mono cursor-not-allowed opacity-80"
                    />
                  </div>

                  {/* Wallet Address (Editable) */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-white flex items-center gap-1.5">
                        <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Wallet Address (Editable at any time)</span>
                      </label>
                      {!isEditingWallet && (
                        <button
                          onClick={() => {
                            sound.playUiClick();
                            setIsEditingWallet(true);
                          }}
                          className="arcade-btn text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Change Wallet</span>
                        </button>
                      )}
                    </div>

                    {isEditingWallet ? (
                      <form onSubmit={handleUpdateWallet} className="space-y-2">
                        <input
                          type="text"
                          required
                          value={editWalletValue}
                          onChange={(e) => setEditWalletValue(e.target.value)}
                          placeholder="e.g. 0x71C... or Solana address"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-amber-400/80 text-white text-sm font-mono focus:outline-none focus:ring-1 focus:ring-amber-400"
                          autoFocus
                        />
                        {walletError && (
                          <p className="text-xs text-rose-400 flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>{walletError}</span>
                          </p>
                        )}
                        <div className="flex items-center gap-2 justify-end pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              setIsEditingWallet(false);
                              setEditWalletValue(player.wallet_address);
                              setWalletError('');
                            }}
                            className="arcade-btn px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={walletLoading}
                            className="arcade-btn px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold flex items-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50"
                          >
                            <Save className="w-3.5 h-3.5" />
                            <span>{walletLoading ? 'Saving...' : 'Save Wallet'}</span>
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                        <span className="font-mono text-emerald-400 text-xs sm:text-sm truncate select-all">
                          {player.wallet_address}
                        </span>
                        {walletSuccess && (
                          <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1 shrink-0 ml-2 animate-in fade-in">
                            <Check className="w-3.5 h-3.5" />
                            <span>Saved!</span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* New Registration Form */
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold font-arcade text-white">
                    REGISTER PILOT PROFILE
                  </h3>
                  <p className="text-xs text-slate-400">
                    Join the player database. Username and Discord ID are locked permanently once saved, and only your wallet address can be edited at any time.
                  </p>
                </div>

                {regError && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{regError}</span>
                  </div>
                )}

                {/* Username */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                    <span>Pilot Username</span>
                    <span className="text-[10px] text-amber-400 font-mono">Permanent (Cannot be changed)</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={32}
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    placeholder="e.g. ChogAce"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-amber-400"
                  />
                </div>

                {/* Discord ID */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                    <span>Discord ID / Tag</span>
                    <span className="text-[10px] text-amber-400 font-mono">Permanent (Cannot be changed)</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={64}
                    value={regDiscordId}
                    onChange={(e) => setRegDiscordId(e.target.value)}
                    placeholder="e.g. chog_warrior#1234 or user ID"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-amber-400"
                  />
                </div>

                {/* Wallet Address */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                    <span>Wallet Address</span>
                    <span className="text-[10px] text-emerald-400 font-mono">Can be edited at any time</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={regWallet}
                    onChange={(e) => setRegWallet(e.target.value)}
                    placeholder="e.g. 0x71C... or Solana wallet address"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={regLoading}
                  className="arcade-btn w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-arcade font-extrabold text-sm tracking-wider shadow-lg shadow-amber-500/20 cursor-pointer disabled:opacity-50 mt-2"
                >
                  {regLoading ? 'REGISTERING IN DATABASE...' : 'SAVE & REGISTER PILOT'}
                </button>
              </form>
            )}
          </div>
        )}

        {/* Tab 2: Leaderboard & Player Registry */}
        {activeTab === 'leaderboard' && (
          <div className="p-6 overflow-y-auto space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold font-arcade text-white">
                  PLAYER REGISTRY LEADERBOARD
                </h3>
                <span className="text-xs text-slate-400">
                  Ranked by total accumulated coins stashed
                </span>
              </div>
              <button
                onClick={loadLeaderboard}
                disabled={leaderboardLoading}
                className="arcade-btn p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer"
                title="Refresh Leaderboard"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${leaderboardLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {leaderboard.length === 0 ? (
              <div className="p-8 text-center rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <User className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-sm text-slate-400 font-semibold">No players registered yet.</p>
                <p className="text-xs text-slate-500">
                  Register in the Pilot Profile tab to appear on this board!
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {leaderboard.map((item, idx) => (
                  <div
                    key={item.username}
                    className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-6 text-center font-arcade font-bold text-sm text-amber-400">
                        #{idx + 1}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm truncate font-arcade">
                            @{item.username}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            Discord: {item.discord_id}
                          </span>
                        </div>
                        <span className="text-[11px] text-emerald-400/80 font-mono block truncate">
                          Wallet: {item.wallet_address.slice(0, 10)}...{item.wallet_address.slice(-6)}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-base font-black font-arcade text-amber-400 tabular-nums block">
                        🪙 {item.coins_accumulated}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Supabase SQL & Project Credentials */}
        {activeTab === 'setup' && (
          <div className="p-6 overflow-y-auto space-y-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold font-arcade text-white">
                  SUPABASE DATABASE INTEGRATION
                </h3>
                {isConfigured ? (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    READY
                  </span>
                ) : (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    KEYS NEEDED
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Here is the exact SQL code to paste into your Supabase project. It automatically sets up the table, the immutable fields trigger, and the RLS security policies.
              </p>
            </div>

            {/* Step-by-Step Instructions */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-amber-400 font-bold block font-mono">STEP 1</span>
                <span className="text-white font-semibold block">Open Supabase</span>
                <p className="text-slate-400 text-[11px]">Go to your project dashboard and click <strong>SQL Editor</strong> in the left bar.</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-cyan-400 font-bold block font-mono">STEP 2</span>
                <span className="text-white font-semibold block">Paste &amp; Run SQL</span>
                <p className="text-slate-400 text-[11px]">Click <strong>New Query</strong>, paste the script below, and click <strong>Run</strong>.</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-emerald-400 font-bold block font-mono">STEP 3</span>
                <span className="text-white font-semibold block">Add API Keys</span>
                <p className="text-slate-400 text-[11px]">Copy your <strong>Project URL</strong> and <strong>anon key</strong> from Settings &rarr; API.</p>
              </div>
            </div>

            {/* SQL Script Box with Copy Button */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">
                  SQL Schema &amp; Trigger Script (Paste this in Supabase)
                </span>
                <button
                  onClick={handleCopySql}
                  className="arcade-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold shadow-md cursor-pointer"
                >
                  {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSql ? 'COPIED TO CLIPBOARD!' : 'COPY SQL'}</span>
                </button>
              </div>

              <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-56 leading-relaxed select-all">
                {SUPABASE_SQL_SCRIPT}
              </pre>
            </div>

            {/* Supabase URL & Anon Key Input Form */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <span className="text-xs font-semibold text-white block">
                Connect Supabase Project
              </span>

              <div className="space-y-2">
                <div>
                  <label className="text-[11px] text-slate-400 font-mono block mb-1">
                    SUPABASE PROJECT URL (VITE_SUPABASE_URL)
                  </label>
                  <input
                    type="url"
                    value={supabaseUrl}
                    onChange={(e) => setSupabaseUrl(e.target.value)}
                    placeholder="https://your-project.supabase.co"
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 font-mono block mb-1">
                    SUPABASE ANON PUBLIC KEY (VITE_SUPABASE_ANON_KEY)
                  </label>
                  <input
                    type="password"
                    value={supabaseKey}
                    onChange={(e) => setSupabaseKey(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>

                {testStatus && (
                  <p className="text-xs font-mono py-1 text-slate-300">
                    {testStatus}
                  </p>
                )}

                <button
                  type="button"
                  onClick={handleSaveCredentials}
                  className="arcade-btn px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
                >
                  Save &amp; Test Connection
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
