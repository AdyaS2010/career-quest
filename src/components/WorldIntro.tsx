// The "cold open" for each career world: a polished, character-driven decision
// scenario (NGPF Arcade style) that plays the moment you arrive, before the
// simulations. Strong persona, real on-the-job dilemmas, consequential choices
// with instant feedback, a live meter, and a graded payoff + coin reward.
import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, SkipForward, Coins, Sparkles, Trophy } from 'lucide-react';
import { scenarioFor, scenarioMax, type ScenarioChoice } from '../pages/city/scenarios';
import { awardCoins } from '../lib/wallet';

interface IntroColor { primary: string; accent: string; secondary: string }
interface Props {
  slug: string;
  careerName: string;
  roomName: string;
  mentorName: string;
  mentorFace: string;
  color: IntroColor;
  userId: string | null;
  onDone: () => void;
}

type Phase = 'hook' | 'beat' | 'result';

export function WorldIntro({ slug, careerName, roomName, mentorName, mentorFace, color, userId, onDone }: Props) {
  const scenario = useMemo(() => scenarioFor(slug), [slug]);
  const maxScore = useMemo(() => (scenario ? scenarioMax(scenario) : 1), [scenario]);

  const [phase, setPhase] = useState<Phase>('hook');
  const [beatIdx, setBeatIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<ScenarioChoice | null>(null);
  const [awarded, setAwarded] = useState(0);

  // Nothing authored for this slug — don't block entry (run after mount, not in render).
  useEffect(() => { if (!scenario) onDone(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  if (!scenario) return null;

  const beat = scenario.beats[beatIdx];
  const pct = Math.round((score / maxScore) * 100);
  const tier: 'ace' | 'ok' | 'low' = pct >= 88 ? 'ace' : pct >= 55 ? 'ok' : 'low';

  const choose = (c: ScenarioChoice) => { if (picked) return; setPicked(c); setScore(s => s + c.delta); };

  const advance = () => {
    setPicked(null);
    if (beatIdx + 1 < scenario.beats.length) {
      setBeatIdx(i => i + 1);
    } else {
      const finalScore = score; // score already includes the last pick
      const coins = 15 + finalScore * 5;
      if (userId) awardCoins(userId, coins);
      setAwarded(coins);
      setPhase('result');
    }
  };

  const tagColor = (t: ScenarioChoice['tag']) => t === 'best' ? '#22c55e' : t === 'ok' ? '#f59e0b' : '#ef4444';
  const stars = tier === 'ace' ? 3 : tier === 'ok' ? 2 : 1;

  return (
    <div className="fixed inset-0 z-[300] overflow-y-auto" style={{ background: `radial-gradient(120% 90% at 50% 0%, ${color.primary} 0%, #0b1020 62%, #070b16 100%)` }}>
      {/* soft decorative bokeh */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {[[12, 18, 120], [82, 12, 90], [70, 70, 150], [20, 75, 110], [50, 40, 80]].map(([x, y, s], i) => (
          <div key={i} className="absolute rounded-full" style={{ left: `${x}%`, top: `${y}%`, width: s, height: s, background: i % 2 ? color.accent : color.secondary, opacity: 0.12, filter: 'blur(18px)' }} />
        ))}
      </div>

      <div className="relative min-h-full flex flex-col items-center justify-center px-4 py-10">
        {/* ===== meter / progress rail (hidden on hook) ===== */}
        {phase !== 'hook' && (
          <div className="w-full max-w-xl mb-5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="flex items-center gap-1.5 text-sm font-black tracking-wide" style={{ color: '#fff' }}>
                <span className="text-base">{scenario.meterIcon}</span>{scenario.meterLabel}
              </span>
              <button onClick={onDone} className="flex items-center gap-1 text-xs font-bold text-white/55 hover:text-white/90 transition-colors">
                Skip <SkipForward className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="h-2.5 rounded-full bg-white/12 overflow-hidden">
              <motion.div className="h-full rounded-full" style={{ background: `linear-gradient(90deg, ${color.accent}, ${color.secondary})` }}
                animate={{ width: `${pct}%` }} transition={{ type: 'spring', stiffness: 120, damping: 18 }} />
            </div>
            {phase === 'beat' && (
              <div className="mt-2 flex gap-1.5">
                {scenario.beats.map((_, i) => (
                  <div key={i} className="h-1 flex-1 rounded-full" style={{ background: i < beatIdx ? color.accent : i === beatIdx ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.15)' }} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Single keyed wrapper remounts on each phase/beat change — animates the
            new screen in cleanly without relying on AnimatePresence exit timing. */}
        <motion.div key={phase === 'beat' ? `beat-${beatIdx}` : phase}
          initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.34 }}
          className="w-full flex flex-col items-center">
          {/* ============ HOOK / title card ============ */}
          {phase === 'hook' && (
            <div className="w-full max-w-xl text-center">
              <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1, type: 'spring', stiffness: 160, damping: 14 }}
                className="mx-auto mb-5 w-24 h-24 rounded-3xl flex items-center justify-center text-6xl shadow-2xl"
                style={{ background: `linear-gradient(160deg, ${color.accent}, ${color.primary})`, border: '3px solid rgba(255,255,255,0.85)' }}>
                <span className="qf-bob">{mentorFace}</span>
              </motion.div>
              <div className="text-[11px] font-black uppercase tracking-[0.3em] mb-2" style={{ color: color.accent }}>{careerName} · Episode</div>
              <h1 className="text-4xl sm:text-5xl font-black text-white mb-4 leading-tight">{scenario.title}</h1>
              <p className="text-base sm:text-lg text-white/80 leading-relaxed max-w-lg mx-auto mb-8">{scenario.hook}</p>
              <button onClick={() => setPhase('beat')}
                className="group inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl font-black text-lg text-slate-900 shadow-xl transition-transform hover:scale-105 active:scale-95"
                style={{ background: `linear-gradient(90deg, ${color.accent}, ${color.secondary})` }}>
                Step in <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
              </button>
              <div className="mt-4">
                <button onClick={onDone} className="text-xs font-bold text-white/45 hover:text-white/80 transition-colors">skip to simulations</button>
              </div>
            </div>
          )}

          {/* ============ BEAT / decision ============ */}
          {phase === 'beat' && (
            <div className="w-full max-w-xl">
              {/* mentor + prompt */}
              <div className="flex items-start gap-3 mb-5">
                <div className="shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-lg" style={{ background: `linear-gradient(160deg, ${color.accent}, ${color.primary})`, border: '2px solid rgba(255,255,255,0.8)' }}>{mentorFace}</div>
                <div className="flex-1 rounded-2xl p-4 bg-white/95 shadow-xl relative">
                  <div className="absolute -left-1.5 top-5 w-3 h-3 rotate-45 bg-white/95" />
                  <div className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: color.primary }}>{mentorName}</div>
                  <p className="text-slate-800 font-semibold leading-snug">{beat.prompt}</p>
                  {beat.detail && <p className="text-slate-500 text-sm mt-1.5">{beat.detail}</p>}
                </div>
              </div>

              {/* choices */}
              <div className="space-y-2.5">
                {beat.choices.map((c, i) => {
                  const isPicked = picked === c;
                  const dim = picked && !isPicked;
                  return (
                    <motion.button key={i} onClick={() => choose(c)} disabled={!!picked}
                      initial={{ opacity: 0, y: 12 }} animate={{ opacity: dim ? 0.4 : 1, y: 0 }} transition={{ delay: picked ? 0 : 0.06 * i }}
                      whileHover={picked ? {} : { scale: 1.015 }} whileTap={picked ? {} : { scale: 0.985 }}
                      className="w-full text-left rounded-2xl px-4 py-3.5 font-bold transition-colors disabled:cursor-default"
                      style={{
                        background: isPicked ? `${tagColor(c.tag)}1f` : 'rgba(255,255,255,0.95)',
                        border: `2px solid ${isPicked ? tagColor(c.tag) : 'transparent'}`,
                        color: '#0f172a',
                      }}>
                      <span className="flex items-center gap-3">
                        <span className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-sm font-black text-white" style={{ background: isPicked ? tagColor(c.tag) : color.primary }}>{String.fromCharCode(65 + i)}</span>
                        <span className="flex-1">{c.label}</span>
                      </span>
                    </motion.button>
                  );
                })}
              </div>

              {/* outcome */}
              <AnimatePresence>
                {picked && (
                  <motion.div initial={{ opacity: 0, y: 16, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} transition={{ duration: 0.3 }}
                    className="mt-4 overflow-hidden">
                    <div className="rounded-2xl p-4 border-2" style={{ background: `${tagColor(picked.tag)}14`, borderColor: `${tagColor(picked.tag)}66` }}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-black uppercase tracking-widest" style={{ color: tagColor(picked.tag) }}>
                          {picked.tag === 'best' ? 'Great call' : picked.tag === 'ok' ? 'Not bad' : 'Careful…'}
                        </span>
                        <span className="text-sm font-black" style={{ color: tagColor(picked.tag) }}>+{picked.delta} {scenario.meterIcon}</span>
                      </div>
                      <p className="text-white/90 text-sm leading-relaxed">{picked.outcome}</p>
                    </div>
                    <button onClick={advance}
                      className="mt-3 w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-black text-slate-900 shadow-lg transition-transform hover:scale-[1.02] active:scale-95"
                      style={{ background: `linear-gradient(90deg, ${color.accent}, ${color.secondary})` }}>
                      {beatIdx + 1 < scenario.beats.length ? 'Next' : 'See how you did'} <ChevronRight className="w-5 h-5" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* ============ RESULT ============ */}
          {phase === 'result' && (
            <div className="w-full max-w-md text-center">
              <motion.div initial={{ rotate: -12, scale: 0.5 }} animate={{ rotate: 0, scale: 1 }} transition={{ type: 'spring', stiffness: 160, damping: 12 }}
                className="mx-auto mb-4 w-20 h-20 rounded-full flex items-center justify-center shadow-2xl" style={{ background: `linear-gradient(160deg, ${color.accent}, ${color.primary})`, border: '3px solid rgba(255,255,255,0.85)' }}>
                {tier === 'ace' ? <Trophy className="w-10 h-10 text-white" /> : <Sparkles className="w-10 h-10 text-white" />}
              </motion.div>

              <div className="flex justify-center gap-1.5 mb-3">
                {[0, 1, 2].map(i => (
                  <motion.span key={i} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2 + i * 0.12, type: 'spring', stiffness: 220, damping: 10 }}
                    className="text-3xl" style={{ filter: i < stars ? 'none' : 'grayscale(1) opacity(0.3)' }}>⭐</motion.span>
                ))}
              </div>

              <h2 className="text-3xl font-black text-white mb-1">{tier === 'ace' ? 'Outstanding!' : tier === 'ok' ? 'Well handled' : 'Nice try'}</h2>
              <div className="text-sm font-bold mb-4" style={{ color: color.accent }}>{scenario.meterLabel}: {score}/{maxScore} · {pct}%</div>

              <div className="flex items-start gap-3 text-left rounded-2xl p-4 bg-white/95 shadow-xl mb-4">
                <div className="shrink-0 w-11 h-11 rounded-xl flex items-center justify-center text-2xl" style={{ background: `${color.primary}22` }}>{mentorFace}</div>
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest mb-0.5" style={{ color: color.primary }}>{mentorName}</div>
                  <p className="text-slate-700 text-sm leading-relaxed">{scenario[tier]}</p>
                </div>
              </div>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 font-black" style={{ background: 'rgba(250,204,21,0.16)', color: '#facc15', border: '1px solid rgba(250,204,21,0.4)' }}>
                <Coins className="w-5 h-5" /> +{awarded} coins earned
              </motion.div>

              <button onClick={onDone}
                className="w-full inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-black text-lg text-slate-900 shadow-xl transition-transform hover:scale-[1.02] active:scale-95"
                style={{ background: `linear-gradient(90deg, ${color.accent}, ${color.secondary})` }}>
                Enter {roomName} <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
