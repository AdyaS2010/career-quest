// CottageGames.tsx — Three cozy mini-games for the Questford cottage interior.
// Pure React + CSS, no external game libraries.
import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
  type CSSProperties,
} from 'react';
import { X, Trophy, Clock, Star, Coins, RotateCcw, Sparkles } from 'lucide-react';

/* ─────────────────────────────────────────────
   Shared types, constants, colours
   ───────────────────────────────────────────── */

interface GameProps {
  onComplete: (coins: number) => void;
  onClose: () => void;
}

const C = {
  bg: '#0f172a',
  bgCard: '#1e293b',
  bgLight: '#334155',
  amber: '#fbbf24',
  amberDark: '#f59e0b',
  gold: '#d97706',
  green: '#22c55e',
  red: '#ef4444',
  white: '#f8fafc',
  muted: '#94a3b8',
  border: '#475569',
} as const;

/* ─────────────────────────────────────────────
   CSS keyframes (injected once)
   ───────────────────────────────────────────── */

const STYLE_ID = 'cottage-games-keyframes';

function ensureKeyframes() {
  if (typeof document === 'undefined') return;
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    @keyframes cg-fadeIn {
      from { opacity: 0; transform: scale(0.92); }
      to   { opacity: 1; transform: scale(1); }
    }
    @keyframes cg-popIn {
      0%   { transform: scale(0); opacity: 0; }
      60%  { transform: scale(1.15); }
      100% { transform: scale(1); opacity: 1; }
    }
    @keyframes cg-shake {
      0%, 100% { transform: translateX(0); }
      20%      { transform: translateX(-6px); }
      40%      { transform: translateX(6px); }
      60%      { transform: translateX(-4px); }
      80%      { transform: translateX(4px); }
    }
    @keyframes cg-glow {
      0%, 100% { box-shadow: 0 0 8px rgba(251,191,36,0.4); }
      50%      { box-shadow: 0 0 20px rgba(251,191,36,0.8); }
    }
    @keyframes cg-celebrate {
      0%   { transform: scale(1) rotate(0deg); }
      25%  { transform: scale(1.2) rotate(-5deg); }
      50%  { transform: scale(1.15) rotate(5deg); }
      75%  { transform: scale(1.1) rotate(-3deg); }
      100% { transform: scale(1) rotate(0deg); }
    }
    @keyframes cg-slideDown {
      from { opacity: 0; transform: translateY(-24px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes cg-progressPulse {
      0%, 100% { opacity: 1; }
      50%      { opacity: 0.7; }
    }
    @keyframes cg-flip {
      0%   { transform: rotateY(0deg); }
      50%  { transform: rotateY(90deg); }
      100% { transform: rotateY(180deg); }
    }
    @keyframes cg-correctFlash {
      0%   { background-color: rgba(34,197,94,0.3); }
      100% { background-color: transparent; }
    }
    @keyframes cg-wrongFlash {
      0%   { background-color: rgba(239,68,68,0.3); }
      100% { background-color: transparent; }
    }
    @keyframes cg-float {
      0%, 100% { transform: translateY(0); }
      50%      { transform: translateY(-8px); }
    }
    @keyframes cg-tileAppear {
      from { opacity: 0; transform: translateY(12px) scale(0.8); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }
  `;
  document.head.appendChild(style);
}

/* ─────────────────────────────────────────────
   Shared helper components & styles
   ───────────────────────────────────────────── */

const overlayStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 9999,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(15,23,42,0.85)',
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
  animation: 'cg-fadeIn 0.3s ease-out',
};

const modalStyle: CSSProperties = {
  background: C.bg,
  border: `2px solid ${C.border}`,
  borderRadius: 20,
  width: '100%',
  maxWidth: 520,
  maxHeight: '94vh',
  overflow: 'auto',
  boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
  animation: 'cg-fadeIn 0.35s ease-out',
  position: 'relative',
};

const headerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '16px 20px',
  borderBottom: `1px solid ${C.border}`,
  background: C.bgCard,
  borderRadius: '18px 18px 0 0',
};

const closeBtnStyle: CSSProperties = {
  background: 'none',
  border: 'none',
  color: C.muted,
  cursor: 'pointer',
  padding: 4,
  borderRadius: 8,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'color 0.2s',
};

const btnPrimary: CSSProperties = {
  background: `linear-gradient(135deg, ${C.amber}, ${C.amberDark})`,
  color: C.bg,
  fontWeight: 700,
  fontSize: 15,
  border: 'none',
  borderRadius: 12,
  padding: '12px 28px',
  cursor: 'pointer',
  transition: 'transform 0.15s, box-shadow 0.15s',
  boxShadow: '0 4px 14px rgba(251,191,36,0.3)',
};

const btnSecondary: CSSProperties = {
  background: C.bgLight,
  color: C.white,
  fontWeight: 600,
  fontSize: 14,
  border: `1px solid ${C.border}`,
  borderRadius: 12,
  padding: '10px 24px',
  cursor: 'pointer',
  transition: 'background 0.15s',
};

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

/** Fisher-Yates shuffle (returns new array). */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ─────────────────────────────────────────────
   GameCooldown — daily play limits via localStorage
   ───────────────────────────────────────────── */

function todayKey(uid: string, game: string): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `questford_game_${uid}_${game}_${yyyy}-${mm}-${dd}`;
}

export function getPlaysToday(uid: string, game: string): number {
  try {
    const v = localStorage.getItem(todayKey(uid, game));
    return v ? parseInt(v, 10) || 0 : 0;
  } catch {
    return 0;
  }
}

export function recordPlay(uid: string, game: string): void {
  try {
    const key = todayKey(uid, game);
    const cur = getPlaysToday(uid, game);
    localStorage.setItem(key, String(cur + 1));
  } catch {
    /* localStorage unavailable — graceful no-op */
  }
}

export function canPlay(uid: string, game: string): boolean {
  return getPlaysToday(uid, game) < 3;
}

/* ═════════════════════════════════════════════
   GAME 1 — MemoryMatchGame  🃏
   ═════════════════════════════════════════════ */

interface MemoryCard {
  id: number;
  emoji: string;
  pairId: number;
  flipped: boolean;
  matched: boolean;
}

const CARD_EMOJIS = ['🩺', '⚖️', '🎨', '💻', '🍳', '📰'];

function buildDeck(): MemoryCard[] {
  const cards: MemoryCard[] = [];
  CARD_EMOJIS.forEach((emoji, pairId) => {
    cards.push({ id: pairId * 2, emoji, pairId, flipped: false, matched: false });
    cards.push({ id: pairId * 2 + 1, emoji, pairId, flipped: false, matched: false });
  });
  return shuffle(cards);
}

export const MemoryMatchGame: React.FC<GameProps> = ({ onComplete, onClose }) => {
  ensureKeyframes();

  const [cards, setCards] = useState<MemoryCard[]>(() => buildDeck());
  const [selected, setSelected] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [mismatches, setMismatches] = useState(0);
  const [pairsFound, setPairsFound] = useState(0);
  const [won, setWon] = useState(false);
  const [lockBoard, setLockBoard] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleCardClick = useCallback(
    (idx: number) => {
      if (lockBoard) return;
      const card = cards[idx];
      if (card.flipped || card.matched) return;
      if (selected.includes(idx)) return;

      const next = cards.map((c, i) =>
        i === idx ? { ...c, flipped: true } : c
      );
      setCards(next);

      const newSel = [...selected, idx];
      setSelected(newSel);

      if (newSel.length === 2) {
        setMoves((m) => m + 1);
        setLockBoard(true);
        const [a, b] = newSel;
        const cardA = next[a];
        const cardB = next[b];

        if (cardA.pairId === cardB.pairId) {
          // Match!
          const matched = next.map((c, i) =>
            i === a || i === b ? { ...c, matched: true } : c
          );
          setCards(matched);
          setSelected([]);
          setLockBoard(false);
          const newPairs = pairsFound + 1;
          setPairsFound(newPairs);
          if (newPairs === CARD_EMOJIS.length) {
            setWon(true);
          }
        } else {
          // No match
          setMismatches((m) => m + 1);
          timerRef.current = setTimeout(() => {
            setCards((prev) =>
              prev.map((c, i) =>
                i === a || i === b ? { ...c, flipped: false } : c
              )
            );
            setSelected([]);
            setLockBoard(false);
          }, 800);
        }
      }
    },
    [cards, selected, lockBoard, pairsFound]
  );

  const coins = useMemo(() => {
    if (!won) return 0;
    return clamp(pairsFound * 5 - mismatches, 5, 25);
  }, [won, pairsFound, mismatches]);

  const handlePlayAgain = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setCards(buildDeck());
    setSelected([]);
    setMoves(0);
    setMismatches(0);
    setPairsFound(0);
    setWon(false);
    setLockBoard(false);
  }, []);

  const handleCollect = useCallback(() => {
    onComplete(coins);
  }, [coins, onComplete]);

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={headerStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 22 }}>🃏</span>
            <span style={{ color: C.white, fontWeight: 700, fontSize: 17 }}>
              Memory Match
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ color: C.muted, fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Star size={14} color={C.amber} /> {pairsFound}/{CARD_EMOJIS.length}
            </span>
            <span style={{ color: C.muted, fontSize: 13 }}>
              Moves: {moves}
            </span>
            <button style={closeBtnStyle} onClick={onClose} aria-label="Close">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Board */}
        <div style={{ padding: 20 }}>
          {!won ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 10,
                maxWidth: 380,
                margin: '0 auto',
              }}
            >
              {cards.map((card, idx) => {
                const isUp = card.flipped || card.matched;
                return (
                  <div
                    key={card.id}
                    onClick={() => handleCardClick(idx)}
                    style={{
                      perspective: 600,
                      cursor: isUp ? 'default' : 'pointer',
                    }}
                  >
                    <div
                      style={{
                        width: '100%',
                        aspectRatio: '1',
                        position: 'relative',
                        transformStyle: 'preserve-3d',
                        transition: 'transform 0.4s ease',
                        transform: isUp ? 'rotateY(180deg)' : 'rotateY(0)',
                      }}
                    >
                      {/* Card Back */}
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          backfaceVisibility: 'hidden',
                          background: `linear-gradient(135deg, ${C.amberDark}, ${C.gold})`,
                          borderRadius: 12,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 28,
                          fontWeight: 800,
                          color: C.bg,
                          border: `2px solid ${C.amber}`,
                          boxShadow: '0 3px 10px rgba(0,0,0,0.3)',
                          userSelect: 'none',
                        }}
                      >
                        ?
                      </div>

                      {/* Card Front */}
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          backfaceVisibility: 'hidden',
                          transform: 'rotateY(180deg)',
                          background: card.matched
                            ? 'linear-gradient(135deg, #064e3b, #065f46)'
                            : C.bgCard,
                          borderRadius: 12,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 32,
                          border: card.matched
                            ? `2px solid ${C.green}`
                            : `2px solid ${C.border}`,
                          boxShadow: card.matched
                            ? `0 0 16px rgba(34,197,94,0.4)`
                            : '0 3px 10px rgba(0,0,0,0.3)',
                          userSelect: 'none',
                        }}
                      >
                        {card.emoji}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Win Screen */
            <div
              style={{
                textAlign: 'center',
                padding: '20px 0',
                animation: 'cg-popIn 0.5s ease-out',
              }}
            >
              <div style={{ animation: 'cg-celebrate 0.8s ease-out', display: 'inline-block' }}>
                <Trophy size={56} color={C.amber} />
              </div>
              <h3
                style={{
                  color: C.amber,
                  fontSize: 22,
                  margin: '14px 0 6px',
                  fontWeight: 700,
                }}
              >
                All Pairs Found!
              </h3>
              <p style={{ color: C.muted, fontSize: 14, margin: '0 0 6px' }}>
                Completed in {moves} moves
              </p>
              <p style={{ color: C.muted, fontSize: 14, margin: '0 0 20px' }}>
                Mismatches: {mismatches}
              </p>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  background: C.bgCard,
                  padding: '12px 24px',
                  borderRadius: 14,
                  border: `1px solid ${C.amber}`,
                  marginBottom: 24,
                  animation: 'cg-glow 2s ease-in-out infinite',
                }}
              >
                <Coins size={22} color={C.amber} />
                <span style={{ color: C.amber, fontSize: 24, fontWeight: 800 }}>
                  +{coins}
                </span>
                <span style={{ color: C.muted, fontSize: 13 }}>coins</span>
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <button
                  style={btnSecondary}
                  onClick={handlePlayAgain}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = C.bgCard;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = C.bgLight;
                  }}
                >
                  <RotateCcw size={14} style={{ marginRight: 6, verticalAlign: -2 }} />
                  Play Again
                </button>
                <button
                  style={btnPrimary}
                  onClick={handleCollect}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.04)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
                  }}
                >
                  <Sparkles size={14} style={{ marginRight: 6, verticalAlign: -2 }} />
                  Collect Coins
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ═════════════════════════════════════════════
   GAME 2 — SpeedSortGame  📺
   ═════════════════════════════════════════════ */

interface SortItem {
  label: string;
  emoji: string;
  category: string;
}

const SORT_ITEMS: SortItem[] = [
  // Health
  { label: 'Stethoscope', emoji: '🩺', category: 'Health' },
  { label: 'Bandage', emoji: '🩹', category: 'Health' },
  { label: 'Syringe', emoji: '💉', category: 'Health' },
  { label: 'Microscope', emoji: '🔬', category: 'Health' },
  { label: 'Pill', emoji: '💊', category: 'Health' },
  // Tech
  { label: 'Keyboard', emoji: '⌨️', category: 'Tech' },
  { label: 'Code', emoji: '👨‍💻', category: 'Tech' },
  { label: 'Database', emoji: '🗄️', category: 'Tech' },
  { label: 'Robot', emoji: '🤖', category: 'Tech' },
  { label: 'Chip', emoji: '🔧', category: 'Tech' },
  // Law
  { label: 'Gavel', emoji: '🔨', category: 'Law' },
  { label: 'Scale', emoji: '⚖️', category: 'Law' },
  { label: 'Badge', emoji: '🏛️', category: 'Law' },
  { label: 'Scroll', emoji: '📜', category: 'Law' },
  { label: 'Briefcase', emoji: '💼', category: 'Law' },
  // Creative
  { label: 'Palette', emoji: '🎨', category: 'Creative' },
  { label: 'Camera', emoji: '📷', category: 'Creative' },
  { label: 'Microphone', emoji: '🎤', category: 'Creative' },
  { label: 'Paintbrush', emoji: '🖌️', category: 'Creative' },
  { label: 'Guitar', emoji: '🎸', category: 'Creative' },
];

const CATEGORIES = [
  { name: 'Health', emoji: '🩺', color: '#dc2626' },
  { name: 'Tech', emoji: '💻', color: '#2563eb' },
  { name: 'Law', emoji: '⚖️', color: '#7c3aed' },
  { name: 'Creative', emoji: '🎨', color: '#ea580c' },
];

const SORT_DURATION = 30;

export const SpeedSortGame: React.FC<GameProps> = ({ onComplete, onClose }) => {
  ensureKeyframes();

  const [items] = useState<SortItem[]>(() => shuffle(SORT_ITEMS));
  const [currentIdx, setCurrentIdx] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [timeLeft, setTimeLeft] = useState(SORT_DURATION);
  const [finished, setFinished] = useState(false);
  const [flash, setFlash] = useState<'correct' | 'wrong' | null>(null);
  const [shakeBin, setShakeBin] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lockRef = useRef(false);

  // Timer
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(intervalRef.current!);
          setFinished(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    };
  }, []);

  // Also finish when all items are done
  useEffect(() => {
    if (currentIdx >= items.length && !finished) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setFinished(true);
    }
  }, [currentIdx, items.length, finished]);

  const handleSort = useCallback(
    (category: string) => {
      if (finished || currentIdx >= items.length || lockRef.current) return;
      lockRef.current = true;
      const item = items[currentIdx];
      const isCorrect = item.category === category;

      if (isCorrect) {
        setCorrect((c) => c + 1);
        setFlash('correct');
      } else {
        setWrong((w) => w + 1);
        setFlash('wrong');
        setShakeBin(category);
      }

      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
      flashTimerRef.current = setTimeout(() => {
        setFlash(null);
        setShakeBin(null);
        setCurrentIdx((i) => i + 1);
        lockRef.current = false;
      }, 350);
    },
    [finished, currentIdx, items]
  );

  const total = correct + wrong;
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
  const coins = useMemo(() => {
    if (!finished) return 0;
    return clamp(correct * 3, 5, 25);
  }, [finished, correct]);

  const currentItem = currentIdx < items.length ? items[currentIdx] : null;
  const progress = ((SORT_DURATION - timeLeft) / SORT_DURATION) * 100;

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={headerStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 22 }}>📺</span>
            <span style={{ color: C.white, fontWeight: 700, fontSize: 17 }}>
              Speed Sort
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span
              style={{
                color: timeLeft <= 5 ? C.red : C.amber,
                fontSize: 14,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                animation: timeLeft <= 5 ? 'cg-progressPulse 0.5s ease-in-out infinite' : 'none',
              }}
            >
              <Clock size={14} /> {timeLeft}s
            </span>
            <span style={{ color: C.green, fontSize: 13, fontWeight: 600 }}>
              ✓ {correct}
            </span>
            <button style={closeBtnStyle} onClick={onClose} aria-label="Close">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Timer bar */}
        <div
          style={{
            height: 4,
            background: C.bgLight,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${100 - progress}%`,
              background: `linear-gradient(90deg, ${C.amber}, ${C.amberDark})`,
              transition: 'width 1s linear',
              borderRadius: '0 4px 4px 0',
            }}
          />
        </div>

        <div style={{ padding: 20 }}>
          {!finished ? (
            <>
              {/* Current item card */}
              <div
                key={currentIdx}
                style={{
                  textAlign: 'center',
                  padding: '24px 16px',
                  margin: '0 auto 24px',
                  maxWidth: 280,
                  background: flash === 'correct'
                    ? 'rgba(34,197,94,0.15)'
                    : flash === 'wrong'
                    ? 'rgba(239,68,68,0.15)'
                    : C.bgCard,
                  border: `2px solid ${
                    flash === 'correct'
                      ? C.green
                      : flash === 'wrong'
                      ? C.red
                      : C.border
                  }`,
                  borderRadius: 16,
                  animation: 'cg-slideDown 0.3s ease-out',
                  transition: 'background 0.2s, border-color 0.2s',
                }}
              >
                {currentItem && (
                  <>
                    <div style={{ fontSize: 48, marginBottom: 8 }}>
                      {currentItem.emoji}
                    </div>
                    <div
                      style={{
                        color: C.white,
                        fontSize: 18,
                        fontWeight: 700,
                      }}
                    >
                      {currentItem.label}
                    </div>
                    <div style={{ color: C.muted, fontSize: 12, marginTop: 4 }}>
                      Sort into the correct category
                    </div>
                  </>
                )}
              </div>

              {/* Category bins */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: 10,
                }}
              >
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.name}
                    onClick={() => handleSort(cat.name)}
                    style={{
                      background: C.bgCard,
                      border: `2px solid ${cat.color}44`,
                      borderRadius: 14,
                      padding: '16px 8px',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'transform 0.15s, border-color 0.15s, box-shadow 0.15s',
                      animation:
                        shakeBin === cat.name
                          ? 'cg-shake 0.4s ease-out'
                          : 'none',
                    }}
                    onMouseEnter={(e) => {
                      const el = e.currentTarget;
                      el.style.borderColor = cat.color;
                      el.style.boxShadow = `0 0 12px ${cat.color}33`;
                      el.style.transform = 'scale(1.03)';
                    }}
                    onMouseLeave={(e) => {
                      const el = e.currentTarget;
                      el.style.borderColor = `${cat.color}44`;
                      el.style.boxShadow = 'none';
                      el.style.transform = 'scale(1)';
                    }}
                  >
                    <div style={{ fontSize: 28, marginBottom: 4 }}>
                      {cat.emoji}
                    </div>
                    <div
                      style={{
                        color: C.white,
                        fontSize: 13,
                        fontWeight: 600,
                      }}
                    >
                      {cat.name}
                    </div>
                  </button>
                ))}
              </div>

              {/* Progress indicator */}
              <div
                style={{
                  textAlign: 'center',
                  marginTop: 16,
                  color: C.muted,
                  fontSize: 12,
                }}
              >
                {currentIdx + 1} / {items.length}
              </div>
            </>
          ) : (
            /* Results Screen */
            <div
              style={{
                textAlign: 'center',
                padding: '20px 0',
                animation: 'cg-popIn 0.5s ease-out',
              }}
            >
              <div style={{ animation: 'cg-celebrate 0.8s ease-out', display: 'inline-block' }}>
                <Trophy size={56} color={C.amber} />
              </div>
              <h3
                style={{
                  color: C.amber,
                  fontSize: 22,
                  margin: '14px 0 6px',
                  fontWeight: 700,
                }}
              >
                Time's Up!
              </h3>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: 20,
                  margin: '16px 0',
                }}
              >
                <div
                  style={{
                    background: C.bgCard,
                    borderRadius: 12,
                    padding: '12px 18px',
                    border: `1px solid ${C.border}`,
                  }}
                >
                  <div style={{ color: C.green, fontSize: 24, fontWeight: 800 }}>
                    {correct}
                  </div>
                  <div style={{ color: C.muted, fontSize: 11 }}>Correct</div>
                </div>
                <div
                  style={{
                    background: C.bgCard,
                    borderRadius: 12,
                    padding: '12px 18px',
                    border: `1px solid ${C.border}`,
                  }}
                >
                  <div style={{ color: C.red, fontSize: 24, fontWeight: 800 }}>
                    {wrong}
                  </div>
                  <div style={{ color: C.muted, fontSize: 11 }}>Wrong</div>
                </div>
                <div
                  style={{
                    background: C.bgCard,
                    borderRadius: 12,
                    padding: '12px 18px',
                    border: `1px solid ${C.border}`,
                  }}
                >
                  <div style={{ color: C.amber, fontSize: 24, fontWeight: 800 }}>
                    {accuracy}%
                  </div>
                  <div style={{ color: C.muted, fontSize: 11 }}>Accuracy</div>
                </div>
              </div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  background: C.bgCard,
                  padding: '12px 24px',
                  borderRadius: 14,
                  border: `1px solid ${C.amber}`,
                  marginBottom: 24,
                  animation: 'cg-glow 2s ease-in-out infinite',
                }}
              >
                <Coins size={22} color={C.amber} />
                <span style={{ color: C.amber, fontSize: 24, fontWeight: 800 }}>
                  +{coins}
                </span>
                <span style={{ color: C.muted, fontSize: 13 }}>coins</span>
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <button style={btnSecondary} onClick={onClose}>
                  Close
                </button>
                <button
                  style={btnPrimary}
                  onClick={() => onComplete(coins)}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.04)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
                  }}
                >
                  <Sparkles size={14} style={{ marginRight: 6, verticalAlign: -2 }} />
                  Collect Coins
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ═════════════════════════════════════════════
   GAME 3 — WordScrambleGame  📝
   ═════════════════════════════════════════════ */

const WORD_POOL = [
  'SURGEON',
  'BUDGET',
  'VERDICT',
  'DESIGN',
  'CODING',
  'RECIPE',
  'EDITOR',
  'LAWYER',
  'ARTIST',
  'TEACHER',
  'NURSE',
  'BANKER',
  'JUDGE',
  'CHEF',
  'PILOT',
  'AUTHOR',
  'DENTIST',
  'BROKER',
  'CURATOR',
  'MENTOR',
];

const WORD_DURATION = 45;

function scrambleWord(word: string): string {
  const letters = word.split('');
  let scrambled = shuffle(letters).join('');
  // Make sure it's actually different from the original
  let attempts = 0;
  while (scrambled === word && attempts < 20) {
    scrambled = shuffle(letters).join('');
    attempts++;
  }
  return scrambled;
}

export const WordScrambleGame: React.FC<GameProps> = ({ onComplete, onClose }) => {
  ensureKeyframes();

  const [words] = useState<string[]>(() => shuffle(WORD_POOL).slice(0, 5));
  const [currentWordIdx, setCurrentWordIdx] = useState(0);
  const [scrambled, setScrambled] = useState('');
  const [input, setInput] = useState('');
  const [solved, setSolved] = useState(0);
  const [timeLeft, setTimeLeft] = useState(WORD_DURATION);
  const [finished, setFinished] = useState(false);
  const [showCorrect, setShowCorrect] = useState(false);
  const [wrongFlash, setWrongFlash] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Set scrambled word whenever currentWordIdx changes
  useEffect(() => {
    if (currentWordIdx < words.length) {
      setScrambled(scrambleWord(words[currentWordIdx]));
      setInput('');
    }
  }, [currentWordIdx, words]);

  // Timer
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(intervalRef.current!);
          setFinished(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    };
  }, []);

  // Focus input on mount and word change
  useEffect(() => {
    if (!finished && inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentWordIdx, finished]);

  // End when all words solved
  useEffect(() => {
    if (currentWordIdx >= words.length && !finished) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setFinished(true);
    }
  }, [currentWordIdx, words.length, finished]);

  const advanceWord = useCallback(() => {
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    setShowCorrect(false);
    setWrongFlash(false);
    setCurrentWordIdx((i) => i + 1);
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (finished || currentWordIdx >= words.length) return;
      const answer = input.trim().toUpperCase();
      const correct = words[currentWordIdx];
      if (answer === correct) {
        setSolved((s) => s + 1);
        setShowCorrect(true);
        flashTimerRef.current = setTimeout(advanceWord, 600);
      } else if (answer.length > 0) {
        setWrongFlash(true);
        flashTimerRef.current = setTimeout(() => setWrongFlash(false), 500);
      }
    },
    [finished, currentWordIdx, words, input, advanceWord]
  );

  const handleSkip = useCallback(() => {
    if (finished || currentWordIdx >= words.length) return;
    advanceWord();
  }, [finished, currentWordIdx, words.length, advanceWord]);

  const timeBonus = Math.floor(timeLeft / 5);
  const coins = useMemo(() => {
    if (!finished) return 0;
    return clamp(solved * 5 + timeBonus, 5, 25);
  }, [finished, solved, timeBonus]);

  const currentWord = currentWordIdx < words.length ? words[currentWordIdx] : null;
  const progress = ((WORD_DURATION - timeLeft) / WORD_DURATION) * 100;

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={headerStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 22 }}>📝</span>
            <span style={{ color: C.white, fontWeight: 700, fontSize: 17 }}>
              Word Scramble
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span
              style={{
                color: timeLeft <= 10 ? C.red : C.amber,
                fontSize: 14,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                animation: timeLeft <= 10 ? 'cg-progressPulse 0.5s ease-in-out infinite' : 'none',
              }}
            >
              <Clock size={14} /> {timeLeft}s
            </span>
            <span style={{ color: C.green, fontSize: 13, fontWeight: 600 }}>
              ✓ {solved}/{words.length}
            </span>
            <button style={closeBtnStyle} onClick={onClose} aria-label="Close">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Timer bar */}
        <div
          style={{
            height: 4,
            background: C.bgLight,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${100 - progress}%`,
              background: `linear-gradient(90deg, ${C.amber}, ${C.amberDark})`,
              transition: 'width 1s linear',
              borderRadius: '0 4px 4px 0',
            }}
          />
        </div>

        <div style={{ padding: 24 }}>
          {!finished ? (
            currentWord !== null && (
              <>
                {/* Word progress */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: 6,
                    marginBottom: 20,
                  }}
                >
                  {words.map((_, i) => (
                    <div
                      key={i}
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        background:
                          i < currentWordIdx
                            ? C.green
                            : i === currentWordIdx
                            ? C.amber
                            : C.bgLight,
                        border: `1.5px solid ${
                          i < currentWordIdx
                            ? C.green
                            : i === currentWordIdx
                            ? C.amber
                            : C.border
                        }`,
                        transition: 'background 0.3s, border-color 0.3s',
                      }}
                    />
                  ))}
                </div>

                {/* Scrambled letters */}
                <div
                  key={currentWordIdx}
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: 8,
                    marginBottom: 24,
                    flexWrap: 'wrap',
                    animation: showCorrect ? 'cg-celebrate 0.6s ease-out' : 'cg-tileAppear 0.35s ease-out',
                  }}
                >
                  {(showCorrect ? currentWord.split('') : scrambled.split('')).map(
                    (letter, i) => (
                      <div
                        key={`${currentWordIdx}-${i}`}
                        style={{
                          width: 44,
                          height: 52,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: showCorrect
                            ? 'linear-gradient(135deg, #065f46, #064e3b)'
                            : `linear-gradient(135deg, ${C.bgCard}, ${C.bgLight})`,
                          border: `2px solid ${showCorrect ? C.green : C.border}`,
                          borderRadius: 10,
                          fontSize: 22,
                          fontWeight: 800,
                          color: showCorrect ? C.green : C.amber,
                          boxShadow: showCorrect
                            ? `0 0 12px rgba(34,197,94,0.3)`
                            : '0 3px 8px rgba(0,0,0,0.3)',
                          fontFamily: 'monospace',
                          userSelect: 'none',
                          animation: `cg-tileAppear 0.3s ease-out ${i * 0.05}s both`,
                        }}
                      >
                        {letter}
                      </div>
                    )
                  )}
                </div>

                {/* Input */}
                <form
                  onSubmit={handleSubmit}
                  style={{
                    display: 'flex',
                    gap: 8,
                    maxWidth: 360,
                    margin: '0 auto 16px',
                  }}
                >
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value.toUpperCase())}
                    placeholder="Type your answer…"
                    maxLength={currentWord.length + 2}
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                    style={{
                      flex: 1,
                      padding: '12px 16px',
                      fontSize: 16,
                      fontWeight: 700,
                      fontFamily: 'monospace',
                      letterSpacing: 2,
                      background: C.bgCard,
                      color: C.white,
                      border: `2px solid ${
                        wrongFlash ? C.red : showCorrect ? C.green : C.border
                      }`,
                      borderRadius: 12,
                      outline: 'none',
                      transition: 'border-color 0.2s',
                      animation: wrongFlash ? 'cg-shake 0.4s ease-out' : 'none',
                      textAlign: 'center',
                    }}
                    onFocus={(e) => {
                      if (!wrongFlash && !showCorrect)
                        e.currentTarget.style.borderColor = C.amber;
                    }}
                    onBlur={(e) => {
                      if (!wrongFlash && !showCorrect)
                        e.currentTarget.style.borderColor = C.border;
                    }}
                  />
                  <button
                    type="submit"
                    style={{
                      ...btnPrimary,
                      padding: '12px 20px',
                      fontSize: 14,
                    }}
                  >
                    ✓
                  </button>
                </form>

                {/* Skip button */}
                <div style={{ textAlign: 'center' }}>
                  <button
                    onClick={handleSkip}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: C.muted,
                      fontSize: 13,
                      cursor: 'pointer',
                      padding: '6px 12px',
                      borderRadius: 8,
                      transition: 'color 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.color = C.white;
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.color = C.muted;
                    }}
                  >
                    Skip →
                  </button>
                </div>
              </>
            )
          ) : (
            /* Results Screen */
            <div
              style={{
                textAlign: 'center',
                padding: '20px 0',
                animation: 'cg-popIn 0.5s ease-out',
              }}
            >
              <div style={{ animation: 'cg-celebrate 0.8s ease-out', display: 'inline-block' }}>
                <Trophy size={56} color={C.amber} />
              </div>
              <h3
                style={{
                  color: C.amber,
                  fontSize: 22,
                  margin: '14px 0 6px',
                  fontWeight: 700,
                }}
              >
                {solved === words.length ? 'Perfect Round!' : 'Nice Try!'}
              </h3>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: 20,
                  margin: '16px 0',
                }}
              >
                <div
                  style={{
                    background: C.bgCard,
                    borderRadius: 12,
                    padding: '12px 18px',
                    border: `1px solid ${C.border}`,
                  }}
                >
                  <div style={{ color: C.green, fontSize: 24, fontWeight: 800 }}>
                    {solved}
                  </div>
                  <div style={{ color: C.muted, fontSize: 11 }}>Solved</div>
                </div>
                <div
                  style={{
                    background: C.bgCard,
                    borderRadius: 12,
                    padding: '12px 18px',
                    border: `1px solid ${C.border}`,
                  }}
                >
                  <div style={{ color: C.muted, fontSize: 24, fontWeight: 800 }}>
                    {words.length - solved}
                  </div>
                  <div style={{ color: C.muted, fontSize: 11 }}>Skipped</div>
                </div>
                <div
                  style={{
                    background: C.bgCard,
                    borderRadius: 12,
                    padding: '12px 18px',
                    border: `1px solid ${C.border}`,
                  }}
                >
                  <div style={{ color: C.amber, fontSize: 24, fontWeight: 800 }}>
                    +{timeBonus}
                  </div>
                  <div style={{ color: C.muted, fontSize: 11 }}>Time Bonus</div>
                </div>
              </div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  background: C.bgCard,
                  padding: '12px 24px',
                  borderRadius: 14,
                  border: `1px solid ${C.amber}`,
                  marginBottom: 24,
                  animation: 'cg-glow 2s ease-in-out infinite',
                }}
              >
                <Coins size={22} color={C.amber} />
                <span style={{ color: C.amber, fontSize: 24, fontWeight: 800 }}>
                  +{coins}
                </span>
                <span style={{ color: C.muted, fontSize: 13 }}>coins</span>
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <button style={btnSecondary} onClick={onClose}>
                  Close
                </button>
                <button
                  style={btnPrimary}
                  onClick={() => onComplete(coins)}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.04)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
                  }}
                >
                  <Sparkles size={14} style={{ marginRight: 6, verticalAlign: -2 }} />
                  Collect Coins
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
