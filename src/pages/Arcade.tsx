import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import * as LucideIcons from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Trophy, User, LogOut, Compass, Flame, Star, ArrowRight, Volume2, VolumeX } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useAudio } from '../contexts/AudioContext';
import { useGuide } from '../context/GuideContext';
import type { Career, Profile, Database, ColorScheme } from '../lib/database.types';
import { CHAPTERS, ENDING, currentChapter, loadSeen, saveSeen, type DialogueLine, type StoryProgress } from './city/story';
import { QUIZ_DOMAINS, loadQuiz, saveQuiz, type QuizResult } from './city/quiz';
import { DialogueBox } from '../components/DialogueBox';
import { IntroScreen } from '../components/IntroScreen';
import { CareerQuiz } from '../components/CareerQuiz';
import { Outro } from '../components/Outro';
import { PLAYER_PALETTE } from './city/art';

type Status = 'mastered' | 'in_progress' | 'not_started';

// a small, clean shopfront motif for each career card (keeps the "city" feel)
function CardBuilding({ color, accent }: { color: string; accent: string }) {
  return (
    <svg viewBox="0 0 120 80" className="w-full h-full" preserveAspectRatio="xMidYMax meet">
      <rect x="14" y="26" width="92" height="54" rx="6" fill={color} />
      <path d="M6 28 L24 8 L96 8 L114 28 Z" fill={accent} stroke="rgba(0,0,0,0.18)" strokeWidth="2" strokeLinejoin="round" />
      <rect x="26" y="36" width="20" height="18" rx="3" fill="#fff" opacity="0.9" />
      <rect x="74" y="36" width="20" height="18" rx="3" fill="#fff" opacity="0.9" />
      <rect x="50" y="50" width="20" height="30" rx="3" fill="rgba(0,0,0,0.28)" />
      <rect x="30" y="22" width="60" height="9" rx="4" fill="rgba(0,0,0,0.32)" />
    </svg>
  );
}

export function Arcade() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { muted, toggleMute, startBgm, bgmPlaying } = useAudio();
  const { showGuide } = useGuide();

  const [careers, setCareers] = useState<Career[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [careerXP, setCareerXP] = useState<Record<string, number>>({});
  const [careerMax, setCareerMax] = useState<Record<string, number>>({});
  const [careerStatus, setCareerStatus] = useState<Record<string, Status>>({});
  const [loading, setLoading] = useState(true);
  const [story, setStory] = useState<StoryProgress>({ started: 0, mastered: 0 });
  const [ready, setReady] = useState(false);

  const [dialogue, setDialogue] = useState<DialogueLine[] | null>(null);
  const [showIntro, setShowIntro] = useState(false);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [quizOpen, setQuizOpen] = useState(false);
  const [quizFirst, setQuizFirst] = useState(false);
  const [showOutro, setShowOutro] = useState(false);

  useEffect(() => {
    if (!bgmPlaying && !muted) {
      const h = () => { startBgm(); document.removeEventListener('click', h); };
      document.addEventListener('click', h, { once: true });
      return () => document.removeEventListener('click', h);
    }
  }, [bgmPlaying, muted, startBgm]);

  useEffect(() => {
    if (user) {
      setQuizResult(loadQuiz(user.id));
      try { if (!localStorage.getItem(`questford_intro_${user.id}`)) setShowIntro(true); } catch { /* ignore */ }
    }
  }, [user]);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const [careersRes, profileRes, challengesRes, progressRes] = await Promise.all([
        supabase.from('careers').select('*').eq('is_active', true).order('order_index'),
        supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
        (supabase.from('challenges') as any).select('id, career_id, max_score'),
        (supabase.from('user_challenge_progress') as any).select('challenge_id, best_score').eq('user_id', user.id),
      ]);
      const careerRows = (careersRes.data || []) as Career[];
      setCareers(careerRows);

      // daily streak bonus (kept from the original)
      if (profileRes.data) {
        const pData = profileRes.data as unknown as Profile;
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        let diff = -1;
        if (pData.last_login_date) {
          const last = new Date(pData.last_login_date);
          diff = Math.floor((today.getTime() - new Date(last.getFullYear(), last.getMonth(), last.getDate()).getTime()) / 86400000);
        }
        if (diff !== 0) {
          const isNext = diff === 1;
          const newStreak = isNext ? (pData.current_streak || 0) + 1 : 1;
          const updates = { current_streak: newStreak, longest_streak: Math.max(newStreak, pData.longest_streak || 0), last_login_date: new Date().toISOString(), total_score: (pData.total_score || 0) + 50 };
          // @ts-ignore
          await supabase.from('profiles').update(updates as Database['public']['Tables']['profiles']['Update']).eq('id', user.id);
          setProfile({ ...pData, ...updates } as Profile);
          showGuide(diff === -1 ? "Welcome to Questford! +50 day-one bonus 🔥" : isNext ? `Day ${newStreak} streak! +50 🔥` : `New streak  -  +50 🔥`, 'happy');
        } else setProfile(pData);
      }

      const challenges = (challengesRes.data || []) as { id: string; career_id: string; max_score?: number }[];
      const cp = (progressRes.data || []) as { challenge_id: string; best_score: number }[];
      const toCareer: Record<string, string> = {};
      const maxPer: Record<string, number> = {};
      challenges.forEach(c => { toCareer[c.id] = c.career_id; maxPer[c.career_id] = (maxPer[c.career_id] || 0) + (c.max_score || 100); });
      const xp: Record<string, number> = {}; const started: Record<string, number> = {};
      cp.forEach(p => { const cid = toCareer[p.challenge_id]; if (cid) { xp[cid] = (xp[cid] || 0) + p.best_score; started[cid] = (started[cid] || 0) + 1; } });
      setCareerXP(xp); setCareerMax(maxPer);

      const status: Record<string, Status> = {}; let st = 0, mas = 0;
      careerRows.forEach(c => {
        const earned = xp[c.id] || 0, max = maxPer[c.id] || 1, s = started[c.id] || 0;
        let v: Status;
        if ((c.slug === 'financial-services' && earned >= 270) || earned >= 0.8 * max) v = 'mastered';
        else if (s > 0) v = 'in_progress'; else v = 'not_started';
        status[c.id] = v; if (v !== 'not_started') st++; if (v === 'mastered') mas++;
      });
      setCareerStatus(status); setStory({ started: st, mastered: mas }); setReady(true);
    } catch (e) { console.error('Arcade load', e); }
    finally { setLoading(false); }
  }, [user, showGuide]);

  useEffect(() => { load(); }, [load]);

  // story beats + finale
  useEffect(() => {
    if (!ready || !user || showIntro) return;
    const seen = loadSeen(user.id);
    if (story.mastered >= 8 && !seen.endingSeen) { setShowOutro(true); seen.endingSeen = true; saveSeen(user.id, seen); return; }
    if (!seen.introSeen) { setDialogue(CHAPTERS[0].intro); seen.introSeen = true; if (!seen.chaptersSeen.includes('arrival')) seen.chaptersSeen.push('arrival'); saveSeen(user.id, seen); return; }
    const ch = currentChapter(story);
    if (!seen.chaptersSeen.includes(ch.id)) { setDialogue(ch.intro); seen.chaptersSeen.push(ch.id); saveSeen(user.id, seen); }
  }, [ready, story, user, showIntro]);

  const beginGame = useCallback(async (name: string) => {
    setShowIntro(false);
    if (!user) return;
    try { localStorage.setItem(`questford_intro_${user.id}`, '1'); } catch { /* ignore */ }
    if (!loadQuiz(user.id)) { setQuizFirst(true); setQuizOpen(true); }
    const current = profile?.character_name || profile?.username || '';
    if (name && name !== current) {
      setProfile(pr => pr ? ({ ...pr, character_name: name }) : pr);
      try { await (supabase.from('profiles') as any).update({ character_name: name, updated_at: new Date().toISOString() }).eq('id', user.id); } catch { /* ignore */ }
    }
  }, [user, profile]);

  const onQuizResult = useCallback((r: QuizResult) => { setQuizResult(r); if (user) saveQuiz(user.id, r); }, [user]);

  const level = Math.floor((profile?.total_score || 0) / 100) + 1;
  const chapter = currentChapter(story);
  const chapterPct = Math.round(chapter.progress(story) * 100);
  const recommended = quizResult?.top;
  const skills: Record<string, { xp: number; status: Status }> = {};
  careers.forEach(c => { skills[c.slug] = { xp: careerXP[c.id] || 0, status: careerStatus[c.id] || 'not_started' }; });
  const topName = (quizResult && QUIZ_DOMAINS[quizResult.top]?.name)
    || careers.find(c => careerStatus[c.id] === 'mastered')?.name || 'your calling';

  if (loading) {
    return (
      <div className="min-h-screen" style={{ background: '#0b1024' }} />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen relative overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #0b1024 0%, #141e3c 45%, #1b2b52 100%)' }}
    >
      {/* ambient glow + stars */}
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 20% 12%, rgba(96,165,250,0.18), transparent 40%), radial-gradient(circle at 82% 8%, rgba(167,139,250,0.16), transparent 38%)' }} />
      <div className="absolute inset-0 pointer-events-none opacity-[0.5]" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      {/* city skyline silhouette across the bottom  -  keeps the Questford feel */}
      <svg className="absolute bottom-0 inset-x-0 w-full pointer-events-none" viewBox="0 0 1440 240" preserveAspectRatio="none" style={{ height: '30vh' }}>
        <defs><linearGradient id="sk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1c2c54" /><stop offset="1" stopColor="#0b1024" /></linearGradient></defs>
        {Array.from({ length: 22 }).map((_, i) => { const x = i * 68, w = 50 + (i % 4) * 14, h = 90 + ((i * 53) % 130); return (
          <g key={i}><rect x={x} y={240 - h} width={w} height={h} fill="url(#sk)" stroke="#2a3a68" strokeWidth="1.5" />
            {Array.from({ length: Math.floor(h / 30) }).map((_, r) => <rect key={r} x={x + 8} y={240 - h + 12 + r * 30} width="8" height="12" fill={(r + i) % 3 === 0 ? '#fde68a' : '#34508c'} opacity={(r + i) % 3 === 0 ? 0.9 : 0.45} />)}
          </g>); })}
      </svg>

      {/* top bar */}
      <header className="relative z-20 flex items-center justify-between gap-3 px-4 sm:px-7 py-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-3xl drop-shadow">🏙️</span>
          <div className="min-w-0">
            <h1 className="font-fantasy text-white text-xl sm:text-2xl leading-none truncate" style={{ letterSpacing: '0.04em' }}>Questford</h1>
            <p className="text-[10px] sm:text-xs tracking-[0.25em] text-blue-200/70 font-bold uppercase">Internship Rotation</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="hidden sm:flex items-center gap-2 mr-1">
            <Chip icon={<Flame className="w-4 h-4 text-orange-400" />} label={`${profile?.current_streak ?? 0}`} />
            <Chip icon={<Star className="w-4 h-4 text-amber-300" />} label={`${profile?.total_score ?? 0} XP`} />
            <Chip icon={<Trophy className="w-4 h-4 text-yellow-300" />} label={`Lv ${level}`} />
          </div>
          <IconBtn onClick={() => { setQuizFirst(false); setQuizOpen(true); }} title="Career Compass" accent="#34d399"><Compass className="w-5 h-5" /></IconBtn>
          <IconBtn onClick={() => navigate('/leaderboard')} title="Leaderboard" accent="#fbbf24"><Trophy className="w-5 h-5" /></IconBtn>
          <IconBtn onClick={() => navigate('/profile')} title="Profile" accent="#60a5fa"><User className="w-5 h-5" /></IconBtn>
          <IconBtn onClick={toggleMute} title={muted ? 'Unmute' : 'Mute'}>{muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}</IconBtn>
          <IconBtn onClick={signOut} title="Sign out" accent="#f87171"><LogOut className="w-5 h-5" /></IconBtn>
        </div>
      </header>

      {/* narrative ribbon */}
      <div className="relative z-20 mx-4 sm:mx-7 mb-5 rounded-2xl border px-4 py-3 flex items-center gap-3 backdrop-blur-md" style={{ background: 'rgba(15,23,42,0.6)', borderColor: 'rgba(250,204,21,0.35)' }}>
        <div className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-lg" style={{ background: 'rgba(250,204,21,0.16)' }}>🧭</div>
        <div className="flex-1 min-w-0">
          <div className="text-amber-300 text-[10px] font-black uppercase tracking-widest">{chapter.title}</div>
          <div className="text-white text-sm font-bold truncate">{chapter.objective}</div>
        </div>
        <div className="hidden sm:flex flex-col items-end shrink-0">
          <div className="text-slate-300 text-xs font-bold">🏆 {story.mastered}/8</div>
          <div className="w-24 h-1.5 rounded-full bg-white/15 overflow-hidden mt-1"><div className="h-full rounded-full" style={{ width: `${chapterPct}%`, background: 'linear-gradient(90deg,#f59e0b,#fde68a)' }} /></div>
        </div>
        <button onClick={() => setDialogue(story.mastered >= 8 ? ENDING : chapter.intro)} className="shrink-0 text-amber-300 hover:text-amber-100 text-xs font-bold">Story</button>
      </div>

      {/* career grid */}
      <main className="relative z-20 px-4 sm:px-7 pb-[26vh]">
        <h2 className="text-white/90 font-fantasy text-lg sm:text-xl mb-3">Choose an internship</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {careers.map(c => {
            const cs = c.color_scheme as unknown as ColorScheme;
            const status = careerStatus[c.id] || 'not_started';
            const xp = careerXP[c.id] || 0; const max = careerMax[c.id] || 100;
            const pct = Math.min(100, Math.round((xp / max) * 100));
            const Icon = (LucideIcons[c.icon as keyof typeof LucideIcons] as LucideIcon) || Star;
            const isRec = recommended === c.slug;
            return (
              <button key={c.id} onClick={() => navigate(`/career/${c.slug}`)}
                className="group relative text-left rounded-3xl overflow-hidden border-2 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl focus:outline-none focus:ring-2 focus:ring-white/40"
                style={{ borderColor: status === 'mastered' ? '#facc15' : 'rgba(255,255,255,0.12)', background: 'rgba(15,23,42,0.7)', boxShadow: '0 12px 30px rgba(0,0,0,0.35)' }}>
                {isRec && <div className="absolute top-2 right-2 z-10 px-2 py-0.5 rounded-full text-[10px] font-black text-slate-900 shadow" style={{ background: '#34d399' }}>★ Best fit</div>}
                {/* themed header w/ building motif */}
                <div className="relative h-28 overflow-hidden" style={{ background: `linear-gradient(180deg, ${cs.primary}, ${cs.secondary})` }}>
                  <div className="absolute inset-0 opacity-80"><CardBuilding color={cs.secondary} accent={cs.accent} /></div>
                  <div className="absolute top-3 left-3 w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: 'rgba(255,255,255,0.92)' }}>
                    <Icon className="w-6 h-6" style={{ color: cs.primary }} />
                  </div>
                  {status === 'mastered' && <div className="absolute top-3 right-3 text-2xl drop-shadow">🏆</div>}
                </div>
                {/* body */}
                <div className="p-4">
                  <h3 className="text-white font-black text-base leading-tight">{c.name}</h3>
                  <p className="text-slate-400 text-xs mt-0.5 line-clamp-2">{c.title}</p>
                  <div className="mt-3 flex items-center justify-between text-[11px] font-bold">
                    <span style={{ color: status === 'mastered' ? '#fcd34d' : status === 'in_progress' ? '#86efac' : '#94a3b8' }}>
                      {status === 'mastered' ? 'Mastered' : status === 'in_progress' ? 'In progress' : 'Not started'}
                    </span>
                    <span className="text-slate-400">{xp} XP</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/10 overflow-hidden mt-1.5">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: status === 'mastered' ? 'linear-gradient(90deg,#fbbf24,#fde68a)' : `linear-gradient(90deg, ${cs.primary}, ${cs.accent})` }} />
                  </div>
                  <div className="mt-3 flex items-center justify-end gap-1 text-sm font-black transition-colors" style={{ color: cs.accent }}>
                    {status === 'not_started' ? 'Start' : 'Continue'} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </main>

      {dialogue && <DialogueBox lines={dialogue} onClose={() => setDialogue(null)} />}
      {showIntro && <IntroScreen defaultName={profile?.character_name || profile?.username || 'Intern'} onBegin={beginGame} />}
      {quizOpen && <CareerQuiz existing={quizFirst ? null : quizResult} skills={skills} firstTime={quizFirst} onResult={onQuizResult} onClose={() => { setQuizOpen(false); setQuizFirst(false); }} onStartHere={(slug) => { setQuizOpen(false); setQuizFirst(false); navigate(`/career/${slug}`); }} />}
      {showOutro && <Outro name={profile?.character_name || profile?.username || 'Champion'} topName={topName} palette={PLAYER_PALETTE} onClose={() => setShowOutro(false)} />}
    </motion.div>
  );
}

function Chip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/8 border border-white/10 text-white text-sm font-bold">{icon}<span className="tabular-nums">{label}</span></div>;
}
function IconBtn({ onClick, title, accent, children }: { onClick: () => void; title: string; accent?: string; children: React.ReactNode }) {
  return (
    <button onClick={onClick} title={title} aria-label={title}
      className="p-2.5 rounded-xl text-slate-200 hover:text-white border border-white/10 transition-all hover:-translate-y-0.5"
      style={{ background: 'rgba(255,255,255,0.06)' }}
      onMouseEnter={e => { if (accent) e.currentTarget.style.background = `${accent}33`; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}>{children}</button>
  );
}
