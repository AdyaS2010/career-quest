// Client-side "life sim" wallet — spendable coins, character upgrades and
// cosmetics, kept in localStorage so it never touches the leaderboard XP
// (profile.total_score) or the database.
import type { Palette } from '../pages/city/art';

export interface Cosmetic { top: string; hair: string; pants: string; skin: string; }
export interface Wallet {
  coins: number;
  energyMax: number;   // gym upgrades raise this
  speedLvl: number;    // 0..3, small movement boost
  cosmetic: Cosmetic;
  owned: string[];     // purchased cosmetic item ids (re-apply for free)
}

export const DEFAULT_COSMETIC: Cosmetic = { top: '#22c55e', hair: '#3b2a1a', pants: '#1d4ed8', skin: '#f3c79b' };

const DEFAULT_WALLET: Wallet = { coins: 250, energyMax: 100, speedLvl: 0, cosmetic: { ...DEFAULT_COSMETIC }, owned: [] };

function key(uid: string) { return `questford_wallet_${uid}`; }

export function loadWallet(uid: string): Wallet {
  try {
    const raw = localStorage.getItem(key(uid));
    if (raw) return { ...DEFAULT_WALLET, ...JSON.parse(raw), cosmetic: { ...DEFAULT_COSMETIC, ...(JSON.parse(raw).cosmetic || {}) } };
  } catch { /* ignore */ }
  return { ...DEFAULT_WALLET, cosmetic: { ...DEFAULT_COSMETIC } };
}

export function saveWallet(uid: string, w: Wallet) {
  try { localStorage.setItem(key(uid), JSON.stringify(w)); } catch { /* ignore */ }
}

// reward coins (e.g. after a shift) — returns the new wallet
export function awardCoins(uid: string, amount: number): Wallet {
  const w = loadWallet(uid);
  w.coins += amount;
  saveWallet(uid, w);
  return w;
}

export function paletteFromWallet(w: Wallet): Palette {
  return { skin: w.cosmetic.skin, hair: w.cosmetic.hair, top: w.cosmetic.top, pants: w.cosmetic.pants, pack: '#0e7490' };
}
