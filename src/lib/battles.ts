// Per-domain battle progress (which bosses you've beaten + best accuracy).
// Stored in localStorage so it drives mastery/story without DB changes.
export interface BattleRecord { cleared: boolean; best: number }
export type BattleState = Record<string, BattleRecord>;

const key = (uid: string) => `questford_battle_${uid}`;

export function loadBattles(uid: string): BattleState {
  try { const raw = localStorage.getItem(key(uid)); return raw ? JSON.parse(raw) : {}; } catch { return {}; }
}
export function saveBattles(uid: string, s: BattleState) {
  try { localStorage.setItem(key(uid), JSON.stringify(s)); } catch { /* ignore */ }
}
export function recordWin(uid: string, slug: string, scorePct: number): BattleState {
  const s = loadBattles(uid);
  s[slug] = { cleared: true, best: Math.max(scorePct, s[slug]?.best || 0) };
  saveBattles(uid, s);
  return s;
}
