/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const STORAGE_KEYS = {
  HIGH_SCORE: 'jetpack_chogride_best_distance',
  TOTAL_COINS: 'jetpack_chogride_total_coins',
  TOTAL_RUNS: 'jetpack_chogride_total_runs',
};

export interface GameStats {
  bestDistance: number;
  totalCoins: number;
  totalRuns: number;
}

export function loadGameStats(): GameStats {
  if (typeof window === 'undefined') {
    return { bestDistance: 0, totalCoins: 0, totalRuns: 0 };
  }
  try {
    const bestDistance = parseInt(localStorage.getItem(STORAGE_KEYS.HIGH_SCORE) || '0', 10);
    const totalCoins = parseInt(localStorage.getItem(STORAGE_KEYS.TOTAL_COINS) || '0', 10);
    const totalRuns = parseInt(localStorage.getItem(STORAGE_KEYS.TOTAL_RUNS) || '0', 10);
    return {
      bestDistance: Number.isFinite(bestDistance) ? bestDistance : 0,
      totalCoins: Number.isFinite(totalCoins) ? totalCoins : 0,
      totalRuns: Number.isFinite(totalRuns) ? totalRuns : 0,
    };
  } catch {
    return { bestDistance: 0, totalCoins: 0, totalRuns: 0 };
  }
}

export function recordRunStats(
  distance: number,
  coins: number
): { isNewRecord: boolean; stats: GameStats } {
  if (typeof window === 'undefined') {
    return {
      isNewRecord: false,
      stats: { bestDistance: distance, totalCoins: coins, totalRuns: 1 },
    };
  }

  try {
    const current = loadGameStats();
    const isNewRecord = distance > current.bestDistance;
    const newBest = Math.max(current.bestDistance, distance);
    const newTotalCoins = current.totalCoins + coins;
    const newTotalRuns = current.totalRuns + 1;

    localStorage.setItem(STORAGE_KEYS.HIGH_SCORE, newBest.toString());
    localStorage.setItem(STORAGE_KEYS.TOTAL_COINS, newTotalCoins.toString());
    localStorage.setItem(STORAGE_KEYS.TOTAL_RUNS, newTotalRuns.toString());

    return {
      isNewRecord,
      stats: {
        bestDistance: newBest,
        totalCoins: newTotalCoins,
        totalRuns: newTotalRuns,
      },
    };
  } catch {
    return {
      isNewRecord: false,
      stats: { bestDistance: distance, totalCoins: coins, totalRuns: 1 },
    };
  }
}
