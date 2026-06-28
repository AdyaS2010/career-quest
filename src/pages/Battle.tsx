import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Heart, Coins, Zap, ArrowLeft, Sparkles, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Career, ColorScheme } from '../lib/database.types';
import { BATTLES } from '../game/questions';
import { CharacterSprite } from './city/art';
import { loadWallet, awardCoins, paletteFromWallet } from '../lib/wallet';
import { recordWin } from '../lib/battles';

type Phase = 'loading' | 'fight' | 'resolving' | 'win' | 'lose';

function shuffle<T>(a: T[]): T[] { const r = [...a]; for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[r[i], r[j]] = [r[j], r[i]]; } return r; }

export function Battle() {
  const { careerSlug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const def = BATTLES[careerSlug || ''];

  const [career, setCareer] = useState<Career | null>(null);
  const [profileScore, setProfileScore] = useState(0);
  const [phase, setPhase] = useState<Phase>('loading');
  const [qOrder] = useState(() => def ? shuffle(def.questions.map((_, i) => i)) : []);
  const [step, setStep] = useState(0);
  const [enemyHP, setEnemyHP] = useState(100);
  const [playerHP, setPlayerHP] = useState(100);
  const [maxHP, setMaxHP] = useState(100);
  const [streak, setStreak] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [castKey, setCastKey] = useState(0);
  const [enemyFx, setEnemyFx] = useState('');
  const [arenaFx, setArenaFx] = useState('');
  const [floatTxt, setFloatTxt] = useState<{ k: number; t: string; side: 'enemy' | 'player'; color: string } | null>(null);
  const wallet = loadWallet(user?.id || 'anon');
  const rewardRef = useRef<{ coins: number; xp: number; pct: number } | null>(null);

  useEffect(() => {
    if (!careerSlug || !def) { navigate('/'); return; }
    (async () => {
      const { data: c } = await supabase.from('careers').select('*').eq('slug', careerSlug).maybeSingle();
      if (c) setCareer(c as Career);
      let score = 0;
      if (user) { const { data: p } = await supabase.from('profiles').select('total_score').eq('id', user.id).maybeSingle(); score = (p as any)?.total_score || 0; }
      setProfileScore(score);
      const lvl = Math.floor(score / 100) + 1;
      const mhp = 100 + (lvl - 1) * 10; setMaxHP(mhp); setPlayerHP(mhp);
      setPhase('fight');
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [careerSlug]);

  const qIndex = qOrder.length ? qOrder[step % qOrder.length] : 0;
  const question = def?.questions[qIndex];
  // shuffle the 4 options so the answer isn't always first
  const shuffled = useMemo(() => {
    if (!question) return { opts: [] as string[], correct: 0 };
    const idx = shuffle(question.options.map((_, i) => i));
    return { opts: idx.map(i => question.options[i]), correct: idx.indexOf(question.answer) };
  }, [question, step]);

  const cs = (career?.color_scheme as unknown as ColorScheme) || { primary: '#7c3aed', secondary: '#4c1d95', accent: '#a78bfa', background: '#1e1b4b' };

  const finishWin = useCallback(async () => {
    const pct = Math.round((correct / Math.max(1, correct + wrong)) * 100);
    const xp = correct * 15 + 40;
    const coins = 50 + correct * 8 + (streak >= 3 ? 20 : 0);
    rewardRef.current = { coins, xp, pct };
    if (user) {
      awardCoins(user.id, coins);
      recordWin(user.id, careerSlug!, pct);
      const newScore = profileScore + xp;
      try { await (supabase.from('profiles') as any).update({ total_score: newScore, experience: newScore, level: Math.floor(newScore / 100) + 1, updated_at: new Date().toISOString() }).eq('id', user.id); } catch { /* ignore */ }
    }
    setPhase('win');
  }, [correct, wrong, streak, user, careerSlug, profileScore]);

  const answer = (i: number) => {
    if (phase !== 'fight' || picked !== null) return;
    setPicked(i);
    const right = i === shuffled.correct;
    setPhase('resolving');
    if (right) {
      const dmg = 18 + streak * 4;
      const ns = streak + 1; setStreak(ns); setCorrect(c => c + 1);
      setCastKey(k => k + 1);
      setTimeout(() => {
        setEnemyFx('qf-shake qf-hit');
        setFloatTxt({ k: Date.now(), t: `-${dmg}`, side: 'enemy', color: '#fde047' });
        const eh = Math.max(0, enemyHP - dmg); setEnemyHP(eh);
        setTimeout(() => {
          setEnemyFx('');
          if (eh <= 0) finishWin();
          else { setStep(s => s + 1); setPicked(null); setPhase('fight'); }
        }, 520);
      }, 420);
    } else {
      setStreak(0); setWrong(w => w + 1);
      setTimeout(() => {
        const dmg = 16;
        setArenaFx('qf-shake');
        setFloatTxt({ k: Date.now(), t: `-${dmg}`, side: 'player', color: '#f87171' });
        const ph = Math.max(0, playerHP - dmg); setPlayerHP(ph);
        setTimeout(() => {
          setArenaFx('');
          if (ph <= 0) setPhase('lose');
          else { setStep(s => s + 1); setPicked(null); setPhase('fight'); }
        }, 520);
      }, 300);
    }
  };

  const retry = () => { setEnemyHP(100); setPlayerHP(maxHP); setStreak(0); setCorrect(0); setWrong(0); setStep(0); setPicked(null); setPhase('fight'); };

  if (phase === 'loading' || !def) {
    return <div className="fixed inset-0" style={{ background: '#0a0613' }} />;
  }

  const enemyPct = enemyHP, playerPct = Math.round((playerHP / maxHP) * 100);
  const palette = paletteFromWallet(wallet);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={`fixed inset-0 overflow-hidden select-none ${arenaFx}`}
      style={{ background: `radial-gradient(ellipse at 50% 0%, ${cs.secondary}, #0a0613 75%)` }}
    >
      {/* arena grid */}
      <div className="absolute inset-x-0 bottom-0" style={{ height: '46%', background: `linear-gradient(180deg, transparent, ${cs.primary}22)`, backgroundImage: 'linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)', backgroundSize: '50px 50px' }} />

      {/* top bar */}
      <div className="absolute top-0 inset-x-0 z-20 flex items-center justify-between px-4 py-3">
        <button onClick={() => navigate('/')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/40 border border-white/15 text-white text-sm font-bold backdrop-blur"><ArrowLeft className="w-4 h-4" /> Retreat</button>
        <div className="font-fantasy text-white text-lg sm:text-2xl" style={{ textShadow: `0 0 14px ${cs.accent}` }}>{career?.name || 'Battle'}</div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/40 border border-white/15 text-white text-sm font-bold backdrop-blur"><Coins className="w-4 h-4 text-amber-400" />{wallet.coins}</div>
      </div>

      {/* enemy */}
      <div className="absolute left-1/2 -translate-x-1/2" style={{ top: '13%', width: 360, maxWidth: '92vw' }}>
        <div className="flex items-center justify-between mb-1 px-1">
          <span className="text-white font-black text-sm drop-shadow">{def.boss}</span>
          <span className="text-white/70 text-xs font-bold">{enemyHP}/100</span>
        </div>
        <Bar pct={enemyPct} from="#ef4444" to="#f97316" />
        <div className={`text-center mt-4 ${enemyFx}`}>
          <div className="inline-flex items-center justify-center rounded-full" style={{ width: 130, height: 130, background: `radial-gradient(circle at 40% 35%, ${cs.accent}66, ${cs.primary}33)`, boxShadow: `0 0 50px ${cs.primary}` }}>
            <span style={{ fontSize: 74, filter: 'drop-shadow(0 6px 10px rgba(0,0,0,0.5))' }}>{def.bossEmoji}</span>
          </div>
          {floatTxt?.side === 'enemy' && <div key={floatTxt.k} className="absolute left-1/2 -translate-x-1/2 font-black text-3xl" style={{ top: 40, color: floatTxt.color, animation: 'qf-pop 0.9s ease-out forwards', textShadow: '0 2px 4px rgba(0,0,0,0.6)' }}>{floatTxt.t}</div>}
        </div>
      </div>

      {/* cast projectile */}
      {castKey > 0 && <div key={castKey} className="absolute z-10 rounded-full" style={{ left: '28%', bottom: '34%', width: 28, height: 28, background: `radial-gradient(circle, #fff, ${cs.accent})`, boxShadow: `0 0 24px ${cs.accent}`, ['--qf-cast-to' as any]: 'translate(46vw,-12vh)', animation: 'qf-cast 0.55s ease-in forwards' }} />}

      {/* player + companion */}
      <div className="absolute" style={{ left: '8%', bottom: '30%', zIndex: 8 }}>
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-40">
          <div className="flex items-center justify-between mb-1 px-1"><span className="text-white font-black text-xs flex items-center gap-1"><Heart className="w-3.5 h-3.5 text-rose-400" />You</span><span className="text-white/70 text-[11px] font-bold">{playerHP}/{maxHP}</span></div>
          <Bar pct={playerPct} from="#22c55e" to="#4ade80" />
        </div>
        <div style={{ transform: 'scale(1.4)' }}><CharacterSprite w={46} dir="right" phase={0} moving={false} palette={palette} hat /></div>
        {floatTxt?.side === 'player' && <div key={floatTxt.k} className="absolute left-1/2 font-black text-2xl" style={{ top: -10, color: floatTxt.color, animation: 'qf-pop 0.9s ease-out forwards' }}>{floatTxt.t}</div>}
        <div className="absolute -right-10 top-2 text-3xl qf-bob" style={{ filter: 'drop-shadow(0 0 8px rgba(232,121,249,0.7))' }}>🧚</div>
      </div>

      {/* combo */}
      {streak >= 2 && phase === 'fight' && <div className="absolute left-1/2 -translate-x-1/2 top-[44%] z-20 px-3 py-1 rounded-full text-sm font-black text-slate-900 animate-fade-in" style={{ background: 'linear-gradient(90deg,#fbbf24,#fde047)' }}>🔥 {streak}x combo!</div>}

      {/* question panel */}
      {(phase === 'fight' || phase === 'resolving') && question && (
        <div className="absolute bottom-0 inset-x-0 z-20 p-3 sm:p-5">
          <div className="max-w-2xl mx-auto rounded-3xl border-2 shadow-2xl p-4 sm:p-5" style={{ background: 'rgba(10,8,22,0.92)', borderColor: cs.accent, backdropFilter: 'blur(6px)' }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${cs.primary}33` }}><Sparkles className="w-4 h-4" style={{ color: cs.accent }} /></div>
              <span className="text-xs font-black uppercase tracking-widest" style={{ color: cs.accent }}>Cast {def.spell}  -  answer correctly!</span>
            </div>
            <h3 className="text-white font-bold text-lg sm:text-xl mb-4 leading-snug">{question.q}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {shuffled.opts.map((o, i) => {
                const isPick = picked === i;
                const reveal = picked !== null;
                const isAns = i === shuffled.correct;
                const bg = reveal ? (isAns ? 'rgba(34,197,94,0.25)' : isPick ? 'rgba(239,68,68,0.25)' : 'rgba(255,255,255,0.05)') : 'rgba(255,255,255,0.06)';
                const bc = reveal ? (isAns ? '#22c55e' : isPick ? '#ef4444' : 'rgba(255,255,255,0.12)') : 'rgba(255,255,255,0.15)';
                return (
                  <button key={i} onClick={() => answer(i)} disabled={picked !== null}
                    className="text-left px-4 py-3 rounded-2xl border-2 text-white font-bold transition-all hover:scale-[1.02] active:scale-95 disabled:cursor-default"
                    style={{ background: bg, borderColor: bc }}>
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg mr-2 text-xs font-black" style={{ background: cs.primary }}>{String.fromCharCode(65 + i)}</span>
                    {o}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* win / lose overlays */}
      {phase === 'win' && (
        <Overlay color={cs.accent}>
          <div className="text-6xl mb-2">🏆</div>
          <h2 className="font-fantasy text-white text-3xl mb-1">Victory!</h2>
          <p className="text-slate-300 mb-1">You defeated {def.boss} with {rewardRef.current?.pct}% accuracy.</p>
          <div className="flex items-center justify-center gap-3 my-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-amber-400 text-slate-900 font-black"><Coins className="w-4 h-4" />+{rewardRef.current?.coins}</span>
            <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-violet-500 text-white font-black"><Zap className="w-4 h-4" />+{rewardRef.current?.xp} XP</span>
          </div>
          <div className="inline-flex items-center gap-1.5 text-emerald-300 font-bold text-sm mb-5"><Trophy className="w-4 h-4" /> {career?.name} cleared!</div>
          <div className="flex gap-2">
            <button onClick={retry} className="flex-1 py-3 rounded-xl bg-white/10 text-white font-bold">Rematch</button>
            <button onClick={() => navigate('/')} className="flex-1 py-3 rounded-xl font-black text-slate-900" style={{ background: 'linear-gradient(90deg,#fbbf24,#f59e0b)' }}>Back to Arcade</button>
          </div>
        </Overlay>
      )}
      {phase === 'lose' && (
        <Overlay color="#ef4444">
          <div className="text-6xl mb-2">💫</div>
          <h2 className="font-fantasy text-white text-3xl mb-1">Knocked out!</h2>
          <p className="text-slate-300 mb-5">{def.boss} got the better of you this time. Study up and try again!</p>
          <div className="flex gap-2">
            <button onClick={() => navigate('/')} className="flex-1 py-3 rounded-xl bg-white/10 text-white font-bold">Retreat</button>
            <button onClick={retry} className="flex-1 py-3 rounded-xl font-black text-slate-900" style={{ background: 'linear-gradient(90deg,#fbbf24,#f59e0b)' }}>Try Again</button>
          </div>
        </Overlay>
      )}
    </motion.div>
  );
}

function Bar({ pct, from, to }: { pct: number; from: string; to: string }) {
  return (
    <div className="h-3.5 rounded-full overflow-hidden border border-black/40" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${from}, ${to})`, boxShadow: `0 0 12px ${to}` }} />
    </div>
  );
}
function Overlay({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center p-4" style={{ background: 'rgba(2,6,23,0.7)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-sm text-center rounded-3xl border-4 shadow-2xl p-7 animate-fade-in" style={{ background: 'linear-gradient(160deg,#1e1b3a,#0b0818)', borderColor: color }}>{children}</div>
    </div>
  );
}
