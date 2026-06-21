import { useEffect, useRef, useState } from 'react';
import { X, RotateCcw, Brain, Timer, Coins } from 'lucide-react';

// Quick, fun brain-teaser minigames played at the arcade's bonus cabinets.
// Each calls onComplete(coins) when finished; onExit closes.

export interface TeaserDef { id: string; title: string; emoji: string; blurb: string; }
export const TEASERS: Record<string, TeaserDef> = {
  memory: { id: 'memory', title: 'Memory Match', emoji: '🧠', blurb: 'Flip cards and match every pair in as few moves as you can.' },
  math: { id: 'math', title: 'Quick Math', emoji: '➗', blurb: 'Solve as many problems as possible before the timer runs out.' },
};

const shell = 'fixed inset-0 z-[260] flex items-center justify-center p-4';
const panel = 'w-full max-w-md rounded-3xl border-4 shadow-2xl overflow-hidden';

export function BrainTeaser({ id, onComplete, onExit }: { id: string; onComplete: (coins: number) => void; onExit: () => void }) {
  if (id === 'math') return <QuickMath onComplete={onComplete} onExit={onExit} />;
  return <MemoryMatch onComplete={onComplete} onExit={onExit} />;
}

/* ---------------- Memory Match ---------------- */
const EMOJIS = ['🍳', '💻', '🩺', '⚖️', '📰', '🏦', '🎓', '🎭'];
function MemoryMatch({ onComplete, onExit }: { onComplete: (c: number) => void; onExit: () => void }) {
  const build = () => {
    const picks = EMOJIS.slice(0, 6);
    const deck = [...picks, ...picks].map((e, i) => ({ key: i, e, flipped: false, matched: false }));
    for (let i = deck.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[deck[i], deck[j]] = [deck[j], deck[i]]; }
    return deck;
  };
  const [cards, setCards] = useState(build);
  const [sel, setSel] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [won, setWon] = useState(false);
  const lock = useRef(false);
  const reward = Math.max(25, 90 - moves * 4);

  const flip = (i: number) => {
    if (lock.current || cards[i].flipped || cards[i].matched) return;
    const next = cards.map((c, idx) => idx === i ? { ...c, flipped: true } : c);
    const nsel = [...sel, i];
    setCards(next); setSel(nsel);
    if (nsel.length === 2) {
      setMoves(m => m + 1);
      lock.current = true;
      const [a, b] = nsel;
      if (next[a].e === next[b].e) {
        setTimeout(() => {
          setCards(cs => { const r = cs.map((c, idx) => idx === a || idx === b ? { ...c, matched: true } : c); if (r.every(c => c.matched)) setWon(true); return r; });
          setSel([]); lock.current = false;
        }, 360);
      } else {
        setTimeout(() => { setCards(cs => cs.map((c, idx) => idx === a || idx === b ? { ...c, flipped: false } : c)); setSel([]); lock.current = false; }, 760);
      }
    }
  };

  return (
    <div className={shell} style={{ background: 'rgba(2,6,23,0.65)', backdropFilter: 'blur(3px)' }} onClick={onExit}>
      <div className={panel} style={{ background: 'linear-gradient(160deg,#1e293b,#0f172a)', borderColor: '#a78bfa' }} onClick={e => e.stopPropagation()}>
        <div className="relative px-5 py-3.5 border-b border-white/10 flex items-center gap-2">
          <Brain className="w-5 h-5 text-violet-300" /><span className="font-fantasy text-white text-xl">Memory Match</span>
          <span className="ml-auto text-slate-300 text-sm font-bold">Moves: {moves}</span>
          <button onClick={onExit} className="ml-2 text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        {won ? (
          <div className="p-8 text-center">
            <div className="text-5xl mb-2">🎉</div>
            <h3 className="text-white font-black text-2xl mb-1">Matched them all!</h3>
            <p className="text-slate-300 mb-1">in {moves} moves</p>
            <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-amber-400 text-slate-900 font-black my-3"><Coins className="w-4 h-4" /> +{reward} coins</div>
            <div className="flex gap-2 mt-2">
              <button onClick={() => { setCards(build()); setSel([]); setMoves(0); setWon(false); lock.current = false; }} className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl bg-white/10 text-white font-bold"><RotateCcw className="w-4 h-4" /> Again</button>
              <button onClick={() => onComplete(reward)} className="flex-1 py-3 rounded-xl font-black text-slate-900" style={{ background: 'linear-gradient(90deg,#fbbf24,#f59e0b)' }}>Collect</button>
            </div>
          </div>
        ) : (
          <div className="p-5">
            <div className="grid grid-cols-4 gap-2.5">
              {cards.map((c, i) => (
                <button key={c.key} onClick={() => flip(i)}
                  className="aspect-square rounded-xl flex items-center justify-center text-2xl font-black transition-all duration-200"
                  style={{ background: c.flipped || c.matched ? '#fff' : 'linear-gradient(160deg,#6d28d9,#4c1d95)', border: '2px solid', borderColor: c.matched ? '#4ade80' : 'rgba(255,255,255,0.2)', transform: c.matched ? 'scale(0.96)' : 'scale(1)', opacity: c.matched ? 0.85 : 1 }}>
                  {(c.flipped || c.matched) ? c.e : '❓'}
                </button>
              ))}
            </div>
            <p className="text-center text-slate-400 text-xs mt-4">Fewer moves = more coins!</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------- Quick Math ---------------- */
function QuickMath({ onComplete, onExit }: { onComplete: (c: number) => void; onExit: () => void }) {
  const gen = () => { const a = 2 + Math.floor(Math.random() * 12), b = 2 + Math.floor(Math.random() * 12); const op = ['+', '−', '×'][Math.floor(Math.random() * 3)]; const ans = op === '+' ? a + b : op === '−' ? a - b : a * b; return { a, b, op, ans }; };
  const [started, setStarted] = useState(false);
  const [q, setQ] = useState(gen);
  const [input, setInput] = useState('');
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(30);
  const [done, setDone] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!started || done) return;
    if (time <= 0) { setDone(true); return; }
    const id = setTimeout(() => setTime(t => t - 1), 1000);
    return () => clearTimeout(id);
  }, [started, time, done]);

  useEffect(() => { if (started && !done) inputRef.current?.focus(); }, [started, q, done]);

  const submit = () => {
    if (parseInt(input, 10) === q.ans) setScore(s => s + 1);
    setInput(''); setQ(gen());
  };
  const reward = score * 8;

  return (
    <div className={shell} style={{ background: 'rgba(2,6,23,0.65)', backdropFilter: 'blur(3px)' }} onClick={onExit}>
      <div className={panel} style={{ background: 'linear-gradient(160deg,#1e293b,#0f172a)', borderColor: '#38bdf8' }} onClick={e => e.stopPropagation()}>
        <div className="relative px-5 py-3.5 border-b border-white/10 flex items-center gap-2">
          <Timer className="w-5 h-5 text-sky-300" /><span className="font-fantasy text-white text-xl">Quick Math</span>
          {started && !done && <span className="ml-auto text-sky-300 font-black tabular-nums">{time}s</span>}
          <button onClick={onExit} className="ml-2 text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        {!started ? (
          <div className="p-8 text-center">
            <div className="text-5xl mb-3">➗</div>
            <p className="text-slate-300 mb-5">Solve as many as you can in 30 seconds. Each correct answer = 8 coins!</p>
            <button onClick={() => setStarted(true)} className="px-8 py-3 rounded-xl font-black text-slate-900" style={{ background: 'linear-gradient(90deg,#38bdf8,#0ea5e9)' }}>Start</button>
          </div>
        ) : done ? (
          <div className="p-8 text-center">
            <div className="text-5xl mb-2">🎯</div>
            <h3 className="text-white font-black text-2xl mb-1">{score} solved!</h3>
            <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-amber-400 text-slate-900 font-black my-3"><Coins className="w-4 h-4" /> +{reward} coins</div>
            <div className="flex gap-2 mt-2">
              <button onClick={() => { setScore(0); setTime(30); setDone(false); setQ(gen()); }} className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl bg-white/10 text-white font-bold"><RotateCcw className="w-4 h-4" /> Again</button>
              <button onClick={() => onComplete(reward)} className="flex-1 py-3 rounded-xl font-black text-slate-900" style={{ background: 'linear-gradient(90deg,#fbbf24,#f59e0b)' }}>Collect</button>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center">
            <div className="text-slate-400 text-sm font-bold mb-2">Score: {score}</div>
            <div className="text-white font-black text-5xl mb-5 tabular-nums">{q.a} {q.op} {q.b}</div>
            <input ref={inputRef} value={input} onChange={e => setInput(e.target.value.replace(/[^-\d]/g, ''))}
              onKeyDown={e => { if (e.key === 'Enter') submit(); }} inputMode="numeric"
              className="w-40 text-center text-2xl font-black px-4 py-2.5 rounded-xl bg-white/10 border-2 border-white/20 text-white focus:outline-none focus:border-sky-400" placeholder="?" />
            <button onClick={submit} className="block mx-auto mt-4 px-8 py-2.5 rounded-xl font-black text-slate-900" style={{ background: 'linear-gradient(90deg,#38bdf8,#0ea5e9)' }}>Submit</button>
          </div>
        )}
      </div>
    </div>
  );
}
