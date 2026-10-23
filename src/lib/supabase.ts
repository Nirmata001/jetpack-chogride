/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const STORAGE_KEYS = {
  CUSTOM_URL: 'jetpack_chogride_supabase_url',
  CUSTOM_KEY: 'jetpack_chogride_supabase_anon_key',
};

let cachedClient: SupabaseClient | null = null;
let lastUrl: string = '';
let lastKey: string = '';

export function getSupabaseCredentials(): { url: string; key: string; isConfigured: boolean } {
  const envUrl = (import.meta.env.VITE_SUPABASE_URL as string) || '';
  const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '';

  let customUrl = '';
  let customKey = '';

  if (typeof window !== 'undefined') {
    try {
      customUrl = localStorage.getItem(STORAGE_KEYS.CUSTOM_URL) || '';
      customKey = localStorage.getItem(STORAGE_KEYS.CUSTOM_KEY) || '';
    } catch {}
  }

  const url = (customUrl || envUrl).trim();
  const key = (customKey || envKey).trim();
  const isConfigured = Boolean(url && key && url.startsWith('http') && !url.includes('your-project'));

  return { url, key, isConfigured };
}

export function setCustomSupabaseCredentials(url: string, key: string) {
  if (typeof window !== 'undefined') {
    try {
      if (url.trim()) {
        localStorage.setItem(STORAGE_KEYS.CUSTOM_URL, url.trim());
      } else {
        localStorage.removeItem(STORAGE_KEYS.CUSTOM_URL);
      }
      if (key.trim()) {
        localStorage.setItem(STORAGE_KEYS.CUSTOM_KEY, key.trim());
      } else {
        localStorage.removeItem(STORAGE_KEYS.CUSTOM_KEY);
      }
    } catch {}
  }
  cachedClient = null;
  lastUrl = '';
  lastKey = '';
}

export function getSupabase(): SupabaseClient | null {
  const { url, key, isConfigured } = getSupabaseCredentials();

  if (!isConfigured) {
    return null;
  }

  if (cachedClient && url === lastUrl && key === lastKey) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(url, key, {
      auth: {
        persistSession: false,
      },
    });
    lastUrl = url;
    lastKey = key;
    return cachedClient;
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    return null;
  }
}

export const isSupabaseConfigured = (): boolean => {
  return getSupabaseCredentials().isConfigured;
};

export const supabase: SupabaseClient | null = getSupabase();

const LOCAL_STORAGE_PLAYER_KEY = 'jetpack_chogride_saved_player';

export interface PlayerRecord {
  id?: string;
  username: string;
  discord_id: string;
  wallet_address: string;
  coins_accumulated: number;
  created_at?: string;
  updated_at?: string;
}

/**
 * Load locally cached registered player profile
 */
export function getLocalPlayer(): PlayerRecord | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_PLAYER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Cache registered player profile locally
 */
export function setLocalPlayer(player: PlayerRecord) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_PLAYER_KEY, JSON.stringify(player));
  } catch {}
}

/**
 * Register a new player or retrieve an existing one
 */
export async function registerPlayer(
  username: string,
  discordId: string,
  walletAddress: string,
  initialCoins: number
): Promise<{ success: boolean; player?: PlayerRecord; error?: string }> {
  const cleanUsername = username.trim();
  const cleanDiscord = discordId.trim();
  const cleanWallet = walletAddress.trim();

  if (!cleanUsername) return { success: false, error: 'Username is required' };
  if (!cleanDiscord) return { success: false, error: 'Discord ID is required' };
  if (!cleanWallet) return { success: false, error: 'Wallet address is required' };

  const client = getSupabase();

  if (!client) {
    const fallbackPlayer: PlayerRecord = {
      username: cleanUsername,
      discord_id: cleanDiscord,
      wallet_address: cleanWallet,
      coins_accumulated: initialCoins,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setLocalPlayer(fallbackPlayer);
    return {
      success: true,
      player: fallbackPlayer,
      error: 'Supabase credentials not configured. Saved to local storage.',
    };
  }

  try {
    const { data: existing, error: fetchErr } = await client
      .from('players')
      .select('*')
      .ilike('username', cleanUsername)
      .maybeSingle();

    if (fetchErr && fetchErr.code !== 'PGRST116') {
      console.error('Error fetching player:', fetchErr);
    }

    if (existing) {
      setLocalPlayer(existing);
      return {
        success: true,
        player: existing,
      };
    }

    const { data, error } = await client
      .from('players')
      .insert([
        {
          username: cleanUsername,
          discord_id: cleanDiscord,
          wallet_address: cleanWallet,
          coins_accumulated: initialCoins,
        },
      ])
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    setLocalPlayer(data);
    return { success: true, player: data };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to connect to Supabase' };
  }
}

/**
 * Update ONLY the wallet address for an existing player.
 */
export async function updateWalletAddress(
  username: string,
  newWallet: string
): Promise<{ success: boolean; player?: PlayerRecord; error?: string }> {
  const cleanWallet = newWallet.trim();
  if (!cleanWallet) return { success: false, error: 'Wallet address cannot be empty' };

  const currentLocal = getLocalPlayer();
  const client = getSupabase();

  if (!client) {
    if (currentLocal) {
      const updated = {
        ...currentLocal,
        wallet_address: cleanWallet,
        updated_at: new Date().toISOString(),
      };
      setLocalPlayer(updated);
      return { success: true, player: updated };
    }
    return { success: false, error: 'Player not found locally' };
  }

  try {
    const { data, error } = await client
      .from('players')
      .update({
        wallet_address: cleanWallet,
      })
      .ilike('username', username)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    setLocalPlayer(data);
    return { success: true, player: data };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to update wallet in Supabase' };
  }
}

/**
 * Synchronize accumulated coins when a player earns coins in a run
 */
export async function syncCoins(
  username: string,
  coinsCollectedInRun: number
): Promise<{ success: boolean; newTotal?: number }> {
  if (coinsCollectedInRun <= 0) return { success: true };

  const local = getLocalPlayer();
  if (local) {
    local.coins_accumulated += coinsCollectedInRun;
    setLocalPlayer(local);
  }

  const client = getSupabase();
  if (!client) {
    return { success: true, newTotal: local?.coins_accumulated };
  }

  try {
    const { data: current } = await client
      .from('players')
      .select('coins_accumulated')
      .ilike('username', username)
      .maybeSingle();

    const currentCoins = current ? Number(current.coins_accumulated) : 0;
    const newTotal = currentCoins + coinsCollectedInRun;

    const { error } = await client
      .from('players')
      .update({ coins_accumulated: newTotal })
      .ilike('username', username);

    if (error) {
      console.warn('Failed to sync coins to Supabase:', error.message);
      return { success: false };
    }

    return { success: true, newTotal };
  } catch {
    return { success: false };
  }
}
