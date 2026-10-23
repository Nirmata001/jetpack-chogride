/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getSupabase } from '../lib/supabase';

const ACTIVE_PLAYER_KEY = 'jetpack_chogride_active_player';

export interface PlayerRecord {
  id?: string;
  username: string;
  discord_id: string;
  wallet_address: string;
  coins_accumulated: number;
  created_at?: string;
  updated_at?: string;
}

export function getActivePlayer(): PlayerRecord | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(ACTIVE_PLAYER_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveActivePlayerLocally(player: PlayerRecord) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ACTIVE_PLAYER_KEY, JSON.stringify(player));
  } catch {}
}

export function clearActivePlayer() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(ACTIVE_PLAYER_KEY);
  } catch {}
}

/**
 * Register a new player profile
 * Note: username and discord_id are permanent and cannot be changed once saved.
 */
export async function registerPlayer(
  username: string,
  discordId: string,
  walletAddress: string,
  initialCoins: number = 0
): Promise<{ success: boolean; player?: PlayerRecord; error?: string }> {
  const cleanUsername = username.trim().toLowerCase();
  const cleanDiscord = discordId.trim();
  const cleanWallet = walletAddress.trim();

  if (!cleanUsername) return { success: false, error: 'Username is required.' };
  if (!cleanDiscord) return { success: false, error: 'Discord ID is required.' };
  if (!cleanWallet) return { success: false, error: 'Wallet address is required.' };

  const newPlayer: PlayerRecord = {
    username: cleanUsername,
    discord_id: cleanDiscord,
    wallet_address: cleanWallet,
    coins_accumulated: Math.max(0, initialCoins),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const supabase = getSupabase();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('players')
        .insert({
          username: cleanUsername,
          discord_id: cleanDiscord,
          wallet_address: cleanWallet,
          coins_accumulated: Math.max(0, initialCoins),
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505' || error.message?.includes('duplicate key') || error.message?.includes('unique constraint')) {
          return { success: false, error: `The username "${cleanUsername}" is already taken. Please choose another.` };
        }
        return { success: false, error: error.message || 'Failed to save player to Supabase.' };
      }

      if (data) {
        saveActivePlayerLocally(data);
        return { success: true, player: data };
      }
    } catch (err: any) {
      return { success: false, error: err.message || 'Database connection error.' };
    }
  }

  // Fallback to local storage persistence
  saveActivePlayerLocally(newPlayer);
  return { success: true, player: newPlayer };
}

/**
 * Update ONLY the wallet address for an existing player.
 * Per requirements: Only wallet address can be edited by users at any time.
 */
export async function updatePlayerWalletAddress(
  username: string,
  newWalletAddress: string
): Promise<{ success: boolean; player?: PlayerRecord; error?: string }> {
  const cleanWallet = newWalletAddress.trim();
  const cleanUsername = username.trim().toLowerCase();

  if (!cleanWallet) return { success: false, error: 'Wallet address cannot be empty.' };

  const currentLocal = getActivePlayer();
  const supabase = getSupabase();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('players')
        .update({
          wallet_address: cleanWallet,
        })
        .eq('username', cleanUsername)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message || 'Failed to update wallet address.' };
      }

      if (data) {
        saveActivePlayerLocally(data);
        return { success: true, player: data };
      }
    } catch (err: any) {
      return { success: false, error: err.message || 'Database update error.' };
    }
  }

  // Local storage fallback
  if (currentLocal && currentLocal.username === cleanUsername) {
    const updated = {
      ...currentLocal,
      wallet_address: cleanWallet,
      updated_at: new Date().toISOString(),
    };
    saveActivePlayerLocally(updated);
    return { success: true, player: updated };
  }

  return { success: false, error: 'Player record not found.' };
}

/**
 * Add newly collected run coins to the player's total in the database
 */
export async function addCoinsToPlayer(
  username: string,
  newCoinsEarned: number
): Promise<{ success: boolean; updatedTotal?: number; error?: string }> {
  if (newCoinsEarned <= 0) return { success: true };
  const cleanUsername = username.trim().toLowerCase();
  const currentLocal = getActivePlayer();
  const supabase = getSupabase();

  if (supabase) {
    try {
      // 1. Fetch current stored coins
      const { data: existing, error: fetchErr } = await supabase
        .from('players')
        .select('coins_accumulated')
        .eq('username', cleanUsername)
        .single();

      if (!fetchErr && existing) {
        const nextTotal = Number(existing.coins_accumulated || 0) + newCoinsEarned;
        const { error: updateErr } = await supabase
          .from('players')
          .update({ coins_accumulated: nextTotal })
          .eq('username', cleanUsername);

        if (!updateErr) {
          if (currentLocal && currentLocal.username === cleanUsername) {
            saveActivePlayerLocally({ ...currentLocal, coins_accumulated: nextTotal });
          }
          return { success: true, updatedTotal: nextTotal };
        }
      }
    } catch {}
  }

  // Local fallback
  if (currentLocal && currentLocal.username === cleanUsername) {
    const nextTotal = (currentLocal.coins_accumulated || 0) + newCoinsEarned;
    saveActivePlayerLocally({ ...currentLocal, coins_accumulated: nextTotal });
    return { success: true, updatedTotal: nextTotal };
  }

  return { success: true };
}

/**
 * Fetch leaderboard of registered players
 */
export async function fetchLeaderboard(limit = 10): Promise<PlayerRecord[]> {
  const supabase = getSupabase();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('players')
        .select('username, discord_id, wallet_address, coins_accumulated, created_at')
        .order('coins_accumulated', { ascending: false })
        .limit(limit);

      if (!error && data) {
        return data as PlayerRecord[];
      }
    } catch {}
  }

  const active = getActivePlayer();
  return active ? [active] : [];
}
