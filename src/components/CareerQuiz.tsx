import { useState } from 'react';
import { Compass, RotateCcw, X, Trophy } from 'lucide-react';
import { QUIZ, QUIZ_DOMAINS, scoreQuiz, type QuizResult } from '../pages/city/quiz';

interface SkillInfo { xp: number; status: 'mastered' | 'in_progress' | 'not_started'; }

export function CareerQuiz({ existing, skills, firstTime, onResult, onClose, onStartHere }: {
  existing: QuizResult | null;
  skills: Record<string, SkillInfo>;
  firstTime: boolean;
  onResult: (r: QuizResult) => void;
  onClose: () => void;
  onStartHere?: (slug: string) => void;
}) {
  const [step, setStep] = useState(existing ? -1 : 0); // -1 = results view
  const [answers, setAnswers] = useState<number[]>([]);
  const [result, setResult] = useState<QuizResult | null>(existing);

  const pick = (optIdx: number) => {
    const next = [...answers, optIdx];
    if (step + 1 >= QUIZ.length) {
      const r = scoreQuiz(next);
      setResult(r); onResult(r); setStep(-1);
    } else { setAnswers(next); setStep(step + 1); }
  };

  const retake = () => { setAnswers([]); setResult(null); setStep(0); };

  return (
    <div className="fixed inset-0 z-[320] flex items-center justify-center p-4" style={{ background: 'radial-gradient(ellipse at 50% -10%, #20305f, #0a0f24 75%)' }}>
      <div className="w-full max-w-lg">
        {step >= 0 ? (
          /* ---------- quiz ---------- */
          <div className="animate-fade-in">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Compass className="w-5 h-5 text-amber-400" />
              <span className="text-amber-300 text-xs font-black tracking-[0.25em] uppercase">Career Compass</span>
            </div>
            <div className="text-center text-slate-400 text-xs mb-5">Question {step + 1} of {QUIZ.length}</div>
            {/* progress */}
            <div className="h-2 rounded-full bg-white/10 overflow-hidden mb-6">
              <div className="h-full rounded-full transition-all duration-300" style={{ width: `${(step / QUIZ.length) * 100}%`, background: 'linear-gradient(90deg,#f59e0b,#fde68a)' }} />
            </div>
            <h2 className="text-white font-black text-2xl text-center mb-6 leading-snug px-2">{QUIZ[step].q}</h2>
            <div className="grid gap-3">
              {QUIZ[step].options.map((o, i) => (
                <button key={i} onClick={() => pick(i)}
                  className="flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-all hover:scale-[1.02] active:scale-95"
                  style={{ background: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.12)' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = '#fbbf24')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)')}>
                  <span className="text-3xl">{o.emoji}</span>
                  <span className="text-white font-bold">{o.label}</span>
                </button>
              ))}
            </div>
          </div>
        ) : result && (
          /* ---------- results ---------- */
          <div className="animate-fade-in rounded-3xl border-4 shadow-2xl overflow-hidden" style={{ background: 'linear-gradient(160deg,#1e293b,#0f172a)', borderColor: '#fbbf24' }}>
            <div className="relative px-6 pt-6 pb-4 text-center" style={{ background: 'linear-gradient(180deg, rgba(250,204,21,0.14), transparent)' }}>
              <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
              <Compass className="w-7 h-7 text-amber-400 mx-auto mb-1" />
              <h2 className="font-fantasy text-white text-2xl">Your Career Compass</h2>
              {(() => { const d = QUIZ_DOMAINS[result.top]; return (
                <p className="text-slate-300 text-sm mt-1">Top match: <span className="text-amber-300 font-bold">{d.emoji} {d.name}</span> — {d.tagline}</p>
              ); })()}
            </div>

            <div className="p-5 space-y-2 max-h-[52vh] overflow-y-auto">
              {result.ranking.map((r, i) => {
                const d = QUIZ_DOMAINS[r.slug];
                const sk = skills[r.slug];
                const skillLabel = !sk || sk.status === 'not_started' ? 'Not tried yet' : sk.status === 'mastered' ? 'Mastered 🏆' : `${sk.xp} XP`;
                return (
                  <div key={r.slug} className="flex items-center gap-3 p-2.5 rounded-2xl" style={{ background: i === 0 ? 'rgba(250,204,21,0.12)' : 'rgba(255,255,255,0.05)', border: i === 0 ? '1px solid rgba(250,204,21,0.4)' : '1px solid transparent' }}>
                    <span className="text-2xl w-7 text-center">{d.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-white font-bold text-sm truncate">{d.name}</span>
                        <span className="text-amber-300 font-black text-xs ml-2">{r.pct}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden mt-1">
                        <div className="h-full rounded-full" style={{ width: `${r.pct}%`, background: i === 0 ? 'linear-gradient(90deg,#f59e0b,#fde68a)' : 'rgba(148,163,184,0.7)' }} />
                      </div>
                      <div className="text-[11px] mt-0.5" style={{ color: sk?.status === 'mastered' ? '#fcd34d' : '#94a3b8' }}>{skillLabel}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-4 pt-0 flex gap-2">
              <button onClick={retake} className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm transition-colors">
                <RotateCcw className="w-4 h-4" /> Retake
              </button>
              <button
                onClick={() => { if (onStartHere) onStartHere(result.top); onClose(); }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl font-black text-slate-900 shadow-xl hover:scale-[1.02] active:scale-95 transition-transform"
                style={{ background: 'linear-gradient(90deg,#fbbf24,#f59e0b)' }}>
                <Trophy className="w-4 h-4" /> {firstTime ? `Start at ${QUIZ_DOMAINS[result.top].name}` : 'Done'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
