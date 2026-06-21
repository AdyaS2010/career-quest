import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import * as LucideIcons from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Trophy, User, LogOut, Compass, Flame, Star, Volume2, VolumeX } from 'lucide-react';
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
import { PLAYER_PALETTE, CharacterSprite } from './city/art';

type Status = 'mastered' | 'in_progress' | 'not_started';
const VB_W = 1200, VB_H = 780;
// 8 location stops scattered aesthetically across the island (percent of map)
const NODES = [
  { x: 17, y: 66 }, { x: 35, y: 78 }, { x: 25, y: 44 }, { x: 47, y: 33 },
  { x: 67, y: 40 }, { x: 55, y: 67 }, { x: 78, y: 73 }, { x: 86, y: 48 },
];
function shade(hex: string, p: number) {
  const n = parseInt((hex || '#888888').replace('#', ''), 16);
  const r = Math.max(0, Math.min(255, (n >> 16) + p)), g = Math.max(0, Math.min(255, ((n >> 8) & 0xff) + p)), b = Math.max(0, Math.min(255, (n & 0xff) + p));
  return `rgb(${r},${g},${b})`;
}

// a charming little themed location (building on a mound) — not just a circle
function MapLandmark({ color, mastered, near }: { color: string; mastered: boolean; near: boolean }) {
  const roof = shade(color, -46), wall1 = shade(color, 18), wall2 = shade(color, -14);
  const ring = mastered ? '#fbbf24' : near ? '#ffffff' : shade(color, -60);
  return (
    <svg width="94" height="100" viewBox="0 0 94 100" style={{ overflow: 'visible' }}>
      <ellipse cx="47" cy="92" rx="34" ry="9" fill="rgba(0,0,0,0.28)" />
      {/* grassy mound */}
      <ellipse cx="47" cy="86" rx="40" ry="14" fill="#6bbf6e" stroke="#3f8a4c" strokeWidth="2.5" />
      {/* building */}
      <rect x="20" y="40" width="54" height="46" rx="7" fill={`url(#lm)`} stroke={ring} strokeWidth="3.5" />
      <defs><linearGradient id="lm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={wall1} /><stop offset="1" stopColor={wall2} /></linearGradient></defs>
      {/* roof */}
      <path d="M12 42 L47 12 L82 42 Z" fill={roof} stroke={ring} strokeWidth="3.5" strokeLinejoin="round" />
      <path d="M47 12 L47 0" stroke="#6b7280" strokeWidth="2.5" />
      <path d="M47 1 l16 5 l-16 5 z" fill={mastered ? '#fde047' : color} stroke={roof} strokeWidth="1.5" />
      {/* door + windows */}
      <rect x="40" y="64" width="14" height="22" rx="2" fill={shade(color, -40)} stroke={roof} strokeWidth="1.5" />
      <rect x="25" y="50" width="12" height="11" rx="2" fill={mastered ? '#fff7cc' : '#dbeafe'} stroke={roof} strokeWidth="1.5" />
      <rect x="57" y="50" width="12" height="11" rx="2" fill={mastered ? '#fff7cc' : '#dbeafe'} stroke={roof} strokeWidth="1.5" />
    </svg>
  );
}

// Drop-in sprite support: if an artist drops `public/assets/landmarks/<slug>.png`
// it's used automatically; otherwise we fall back to the drawn SVG landmark.
// Misses are remembered for the session so there's no repeated 404 / flicker.
const ART_MISSING = new Set<string>();
function LandmarkArt({ slug, color, accent, mastered, near, Icon }: { slug: string; color: string; accent: string; mastered: boolean; near: boolean; Icon: LucideIcon }) {
  const [missing, setMissing] = useState(ART_MISSING.has(slug));
  if (!missing) {
    return (
      <img src={`/assets/landmarks/${slug}.png`} alt="" draggable={false}
        onError={() => { ART_MISSING.add(slug); setMissing(true); }}
        style={{ width: 124, height: 124, objectFit: 'contain', objectPosition: 'center bottom', filter: `drop-shadow(0 10px 12px rgba(0,0,0,0.45))${mastered ? ' drop-shadow(0 0 12px #fbbf24)' : ''}` }} />
    );
  }
  // drawn fallback (with the domain icon on the building face)
  return (
    <div className="relative">
      <MapLandmark color={color} mastered={mastered} near={near} />
      <div className="absolute left-1/2 -translate-x-1/2 rounded-xl flex items-center justify-center shadow-md" style={{ top: 38, width: 30, height: 30, background: `linear-gradient(145deg, ${accent}, ${color})`, border: '2px solid rgba(255,255,255,0.9)' }}>
        <Icon className="w-4 h-4 text-white drop-shadow" />
      </div>
    </div>
  );
}

export function WorldMap() {
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
  const [ready, setReady] = useState(false);
  const [story, setStory] = useState<StoryProgress>({ started: 0, mastered: 0 });

  const [dialogue, setDialogue] = useState<DialogueLine[] | null>(null);
  const [showIntro, setShowIntro] = useState(false);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [quizOpen, setQuizOpen] = useState(false);
  const [quizFirst, setQuizFirst] = useState(false);
  const [showOutro, setShowOutro] = useState(false);
  const [hover, setHover] = useState<string | null>(null);

  useEffect(() => {
    if (!bgmPlaying && !muted) { const h = () => { startBgm(); document.removeEventListener('click', h); }; document.addEventListener('click', h, { once: true }); return () => document.removeEventListener('click', h); }
  }, [bgmPlaying, muted, startBgm]);
  useEffect(() => { if (user) { setQuizResult(loadQuiz(user.id)); try { if (!localStorage.getItem(`questford_intro_${user.id}`)) setShowIntro(true); } catch { /* ignore */ } } }, [user]);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const [cRes, pRes, chRes, prRes] = await Promise.all([
        supabase.from('careers').select('*').eq('is_active', true).order('order_index'),
        supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
        (supabase.from('challenges') as any).select('id, career_id, max_score'),
        (supabase.from('user_challenge_progress') as any).select('challenge_id, best_score').eq('user_id', user.id),
      ]);
      const rows = (cRes.data || []) as Career[]; setCareers(rows);
      if (pRes.data) {
        const pd = pRes.data as unknown as Profile;
        const now = new Date(); const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        let diff = -1; if (pd.last_login_date) { const l = new Date(pd.last_login_date); diff = Math.floor((today.getTime() - new Date(l.getFullYear(), l.getMonth(), l.getDate()).getTime()) / 86400000); }
        if (diff !== 0) { const isNext = diff === 1; const ns = isNext ? (pd.current_streak || 0) + 1 : 1; const up = { current_streak: ns, longest_streak: Math.max(ns, pd.longest_streak || 0), last_login_date: new Date().toISOString(), total_score: (pd.total_score || 0) + 50 };
          // @ts-ignore
          await supabase.from('profiles').update(up as Database['public']['Tables']['profiles']['Update']).eq('id', user.id); setProfile({ ...pd, ...up } as Profile); showGuide(diff === -1 ? 'Welcome to Questford! +50 🔥' : `Day ${ns} streak! +50 🔥`, 'happy'); }
        else setProfile(pd);
      }
      const ch = (chRes.data || []) as { id: string; career_id: string; max_score?: number }[];
      const cp = (prRes.data || []) as { challenge_id: string; best_score: number }[];
      const toCareer: Record<string, string> = {}; const maxP: Record<string, number> = {};
      ch.forEach(c => { toCareer[c.id] = c.career_id; maxP[c.career_id] = (maxP[c.career_id] || 0) + (c.max_score || 100); });
      const xp: Record<string, number> = {}; const started: Record<string, number> = {};
      cp.forEach(pp => { const cid = toCareer[pp.challenge_id]; if (cid) { xp[cid] = (xp[cid] || 0) + pp.best_score; started[cid] = (started[cid] || 0) + 1; } });
      setCareerXP(xp); setCareerMax(maxP);
      const status: Record<string, Status> = {}; let s = 0, m = 0;
      rows.forEach(c => { const e = xp[c.id] || 0, mx = maxP[c.id] || 1, st = started[c.id] || 0; let v: Status; if ((c.slug === 'financial-services' && e >= 270) || e >= 0.8 * mx) v = 'mastered'; else if (st > 0) v = 'in_progress'; else v = 'not_started'; status[c.id] = v; if (v !== 'not_started') s++; if (v === 'mastered') m++; });
      setCareerStatus(status); setStory({ started: s, mastered: m }); setReady(true);
    } catch (e) { console.error('worldmap load', e); } finally { setLoading(false); }
  }, [user, showGuide]);
  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!ready || !user || showIntro) return;
    const seen = loadSeen(user.id);
    if (story.mastered >= 8 && !seen.endingSeen) { setShowOutro(true); seen.endingSeen = true; saveSeen(user.id, seen); return; }
    if (!seen.introSeen) { setDialogue(CHAPTERS[0].intro); seen.introSeen = true; if (!seen.chaptersSeen.includes('arrival')) seen.chaptersSeen.push('arrival'); saveSeen(user.id, seen); return; }
    const cur = currentChapter(story);
    if (!seen.chaptersSeen.includes(cur.id)) { setDialogue(cur.intro); seen.chaptersSeen.push(cur.id); saveSeen(user.id, seen); }
  }, [ready, story, user, showIntro]);

  const beginGame = useCallback(async (name: string) => {
    setShowIntro(false); if (!user) return;
    try { localStorage.setItem(`questford_intro_${user.id}`, '1'); } catch { /* ignore */ }
    if (!loadQuiz(user.id)) { setQuizFirst(true); setQuizOpen(true); }
    const cur = profile?.character_name || profile?.username || '';
    if (name && name !== cur) { setProfile(pr => pr ? ({ ...pr, character_name: name }) : pr); try { await (supabase.from('profiles') as any).update({ character_name: name, updated_at: new Date().toISOString() }).eq('id', user.id); } catch { /* ignore */ } }
  }, [user, profile]);
  const onQuizResult = (r: QuizResult) => { setQuizResult(r); if (user) saveQuiz(user.id, r); };

  const level = Math.floor((profile?.total_score || 0) / 100) + 1;
  const chapter = currentChapter(story);
  const recommended = quizResult?.top;
  const skills: Record<string, { xp: number; status: Status }> = {};
  careers.forEach(c => { skills[c.slug] = { xp: careerXP[c.id] || 0, status: careerStatus[c.id] || 'not_started' }; });
  const topName = (quizResult && QUIZ_DOMAINS[quizResult.top]?.name) || careers.find(c => careerStatus[c.id] === 'mastered')?.name || 'your calling';
  // avatar stands at the first not-yet-mastered stop
  const avatarIdx = Math.min(careers.length - 1, Math.max(0, careers.findIndex(c => careerStatus[c.id] !== 'mastered')));

  if (loading) return <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a1228' }}><div className="text-center"><div className="text-5xl mb-3 animate-bounce">🗺️</div><p className="font-fantasy text-slate-200 text-xl">Unrolling the map…</p></div></div>;

  return (
    <div className="fixed inset-0 overflow-hidden" style={{ background: 'linear-gradient(180deg,#0a1228,#0f1b3d)' }}>
      {/* ===== the map ===== */}
      <div className="absolute inset-0">
        <svg viewBox={`0 0 ${VB_W} ${VB_H}`} preserveAspectRatio="xMidYMid slice" className="w-full h-full">
          <defs>
            <radialGradient id="sea" cx="0.5" cy="0.4" r="0.8"><stop offset="0" stopColor="#2a6fb0" /><stop offset="0.6" stopColor="#1c4f86" /><stop offset="1" stopColor="#143b66" /></radialGradient>
            <radialGradient id="land" cx="0.45" cy="0.4" r="0.75"><stop offset="0" stopColor="#7ec27a" /><stop offset="0.7" stopColor="#5aa861" /><stop offset="1" stopColor="#3f8a4c" /></radialGradient>
            <filter id="soft"><feGaussianBlur stdDeviation="6" /></filter>
          </defs>
          {/* sea */}
          <rect x="0" y="0" width={VB_W} height={VB_H} fill="url(#sea)" />
          {/* shimmer */}
          {Array.from({ length: 26 }).map((_, i) => <line key={i} x1={(i * 53) % VB_W} y1={40 + (i * 71) % VB_H} x2={(i * 53) % VB_W + 26} y2={40 + (i * 71) % VB_H} stroke="#ffffff" strokeWidth="2" opacity="0.08" strokeLinecap="round" />)}
          {/* island shadow + body */}
          <path d="M120 250 Q90 120 320 90 Q620 50 760 110 Q1010 70 1080 250 Q1170 430 1010 600 Q900 740 600 720 Q300 760 170 600 Q40 430 120 250 Z" fill="#0c2f4a" opacity="0.5" transform="translate(8,16)" filter="url(#soft)" />
          <path d="M120 250 Q90 120 320 90 Q620 50 760 110 Q1010 70 1080 250 Q1170 430 1010 600 Q900 740 600 720 Q300 760 170 600 Q40 430 120 250 Z" fill="url(#land)" stroke="#e7d6a8" strokeWidth="8" />
          {/* beaches */}
          <path d="M120 250 Q90 120 320 90 Q620 50 760 110 Q1010 70 1080 250 Q1170 430 1010 600 Q900 740 600 720 Q300 760 170 600 Q40 430 120 250 Z" fill="none" stroke="#f0e4bf" strokeWidth="3" opacity="0.6" transform="scale(0.97)" transform-origin="center" />
          {/* region tints */}
          <ellipse cx="330" cy="300" rx="150" ry="120" fill="#6fb86e" opacity="0.5" />
          <ellipse cx="800" cy="260" rx="170" ry="120" fill="#cdbf86" opacity="0.45" />
          <ellipse cx="760" cy="560" rx="160" ry="120" fill="#4f9a5a" opacity="0.5" />
          {/* mountains (top-right) */}
          {[[860, 220], [930, 250], [800, 250]].map(([mx, my], i) => <g key={i}><path d={`M${mx} ${my} l46 -78 l46 78 Z`} fill="#7c8a93" stroke="#4a565e" strokeWidth="3" strokeLinejoin="round" /><path d={`M${mx + 30} ${my - 50} l16 -28 l16 28 Z`} fill="#eef3f6" /></g>)}
          {/* forest dots */}
          {[[250, 360], [300, 330], [350, 380], [220, 410], [700, 600], [760, 630], [820, 590]].map(([fx, fy], i) => <g key={i}><circle cx={fx} cy={fy} r="20" fill="#3f9d52" stroke="#256b35" strokeWidth="3" /><circle cx={fx - 6} cy={fy - 6} r="6" fill="#7fe0a0" opacity="0.5" /></g>)}
          {/* lake */}
          <ellipse cx="540" cy="470" rx="70" ry="46" fill="#3a86c8" stroke="#e7d6a8" strokeWidth="5" /><ellipse cx="520" cy="458" rx="22" ry="12" fill="#bfe3ff" opacity="0.6" />

          {/* a few deliberately-placed clouds drifting gently in the sea margins */}
          {[{ x: 240, y: 110, s: 1 }, { x: 980, y: 150, s: 1.25 }, { x: 1050, y: 470, s: 0.85 }].map((c, i) => (
            <g key={i} opacity="0.9" style={{ transformBox: 'fill-box', transformOrigin: 'center', animation: `qf-bob ${5 + i}s ease-in-out infinite` }}>
              <ellipse cx={c.x} cy={c.y} rx={50 * c.s} ry={20 * c.s} fill="#ffffff" />
              <ellipse cx={c.x + 36 * c.s} cy={c.y + 6} rx={34 * c.s} ry={16 * c.s} fill="#ffffff" />
              <ellipse cx={c.x - 32 * c.s} cy={c.y + 8} rx={28 * c.s} ry={14 * c.s} fill="#f3f7ff" />
            </g>
          ))}
        </svg>

        {/* ===== ornate compass rose (HTML overlay so slice-cropping never hides it) ===== */}
        <div className="absolute pointer-events-none select-none" style={{ left: 22, bottom: 22, zIndex: 15, filter: 'drop-shadow(0 6px 14px rgba(0,0,0,0.5))' }}>
          <svg width="120" height="120" viewBox="-60 -60 120 120">
            <circle r="58" fill="#0c2746" stroke="#e7d6a8" strokeWidth="4" opacity="0.95" />
            <circle r="48" fill="none" stroke="#e7d6a8" strokeWidth="1.5" opacity="0.5" />
            {[45, 135, 225, 315].map(a => <path key={a} d="M0 0 L10 -10 L0 -40 L-10 -10 Z" fill="#caa66a" transform={`rotate(${a})`} />)}
            <path d="M0 0 L11 -11 L0 -52 L-11 -11 Z" fill="#eef3f6" />
            <path d="M0 0 L11 11 L0 52 L-11 11 Z" fill="#c0563a" />
            <path d="M0 0 L-11 11 L-52 0 L-11 -11 Z" fill="#d8c79e" /><path d="M0 0 L11 11 L52 0 L11 -11 Z" fill="#d8c79e" />
            <circle r="6" fill="#0c2746" stroke="#e7d6a8" strokeWidth="2" />
            <text x="0" y="-43" textAnchor="middle" fill="#fff7e0" fontSize="14" fontWeight="bold">N</text>
            <text x="0" y="55" textAnchor="middle" fill="#e7d6a8" fontSize="11" fontWeight="bold">S</text>
            <text x="47" y="5" textAnchor="middle" fill="#e7d6a8" fontSize="11" fontWeight="bold">E</text>
            <text x="-47" y="5" textAnchor="middle" fill="#e7d6a8" fontSize="11" fontWeight="bold">W</text>
          </svg>
        </div>

        {/* ===== location nodes (HTML overlay for crisp icons) ===== */}
        {careers.map((c, i) => {
          const pos = NODES[i] || NODES[NODES.length - 1];
          const cs = c.color_scheme as unknown as ColorScheme;
          const status = careerStatus[c.id] || 'not_started';
          const xp = careerXP[c.id] || 0; const max = careerMax[c.id] || 100;
          const pct = Math.min(100, Math.round((xp / max) * 100));
          const Icon = (LucideIcons[c.icon as keyof typeof LucideIcons] as LucideIcon) || Star;
          const isRec = recommended === c.slug;
          return (
            <button key={c.id} onClick={() => navigate(`/career/${c.slug}`)} onMouseEnter={() => setHover(c.slug)} onMouseLeave={() => setHover(null)}
              className="absolute -translate-x-1/2 -translate-y-1/2 group focus:outline-none" style={{ left: `${pos.x}%`, top: `${pos.y}%`, zIndex: hover === c.slug ? 30 : 20 }}>
              <div className="relative flex flex-col items-center transition-transform duration-200 group-hover:scale-[1.07]">
                {isRec && <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[9px] font-black text-slate-900 whitespace-nowrap shadow-lg z-10" style={{ background: '#34d399' }}>★ BEST FIT</div>}
                {/* landmark — real sprite if dropped in, else the drawn fallback */}
                <div className="relative">
                  <LandmarkArt slug={c.slug} color={cs.primary} accent={cs.accent} mastered={status === 'mastered'} near={isRec} Icon={Icon} />
                  {status === 'mastered' && <div className="absolute -top-1 -right-0 text-lg drop-shadow">🏆</div>}
                  <div className="absolute bottom-0 left-0 w-5 h-5 rounded-full bg-slate-900 border-2 border-white text-white text-[10px] font-black flex items-center justify-center shadow">{i + 1}</div>
                </div>
                {/* label */}
                <div className="-mt-1 flex items-center gap-1 whitespace-nowrap px-2 py-0.5 rounded-md text-[11px] font-black text-white shadow" style={{ background: 'rgba(10,18,40,0.85)' }}><Icon className="w-3 h-3" />{c.name}</div>
                <div className="mt-1 w-16 h-1.5 rounded-full bg-black/40 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: status === 'mastered' ? '#fbbf24' : cs.accent }} />
                </div>
              </div>
            </button>
          );
        })}

        {/* ===== avatar standing at current stop ===== */}
        {careers[avatarIdx] && (() => { const pos = NODES[avatarIdx] || NODES[0]; return (
          <div className="absolute -translate-x-1/2 pointer-events-none" style={{ left: `${pos.x}%`, top: `calc(${pos.y}% - 46px)`, zIndex: 25 }}>
            <div className="absolute left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-md bg-black/60 text-white text-[10px] font-bold whitespace-nowrap" style={{ top: -16 }}>{profile?.character_name || profile?.username || 'You'}</div>
            <div className="qf-bob"><CharacterSprite w={42} dir="down" phase={0} moving={false} palette={PLAYER_PALETTE} hat /></div>
          </div>
        ); })()}
      </div>

      {/* ===== top HUD ===== */}
      <header className="absolute top-0 inset-x-0 z-40 flex items-center justify-between gap-2 px-3 sm:px-6 py-3">
        <div className="flex items-center gap-2 sm:gap-2.5 rounded-2xl px-2.5 sm:px-3 py-2" style={{ background: 'rgba(10,18,40,0.7)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)' }}>
          <span className="text-xl sm:text-2xl">🗺️</span>
          <div className="hidden sm:block"><h1 className="font-fantasy text-white text-lg leading-none">Questford</h1><p className="text-[10px] tracking-[0.2em] text-blue-200/70 font-bold uppercase">World Map</p></div>
          <div className="flex items-center gap-1.5 ml-0.5 sm:ml-1">
            <span className="hidden sm:flex"><Chip icon={<Flame className="w-4 h-4 text-orange-400" />} label={`${profile?.current_streak ?? 0}`} /></span>
            <span className="hidden sm:flex"><Chip icon={<Star className="w-4 h-4 text-amber-300" />} label={`${profile?.total_score ?? 0}`} /></span>
            <span className="hidden min-[360px]:flex"><Chip icon={<Trophy className="w-4 h-4 text-yellow-300" />} label={`Lv${level}`} /></span>
          </div>
        </div>
        <div className="flex items-center gap-1 sm:gap-1.5">
          <Btn onClick={() => { setQuizFirst(false); setQuizOpen(true); }} title="Career Compass" a="#34d399"><Compass className="w-5 h-5" /></Btn>
          <Btn onClick={() => navigate('/leaderboard')} title="Leaderboard" a="#fbbf24"><Trophy className="w-5 h-5" /></Btn>
          <Btn onClick={() => navigate('/profile')} title="Profile" a="#60a5fa"><User className="w-5 h-5" /></Btn>
          <Btn onClick={toggleMute} title="Mute">{muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}</Btn>
          <Btn onClick={signOut} title="Sign out" a="#f87171"><LogOut className="w-5 h-5" /></Btn>
        </div>
      </header>

      {/* quest banner */}
      <div className="absolute left-1/2 -translate-x-1/2 z-30 top-[4.6rem] sm:top-[4.8rem] max-w-[92vw]">
        <div className="flex items-center gap-3 rounded-2xl px-4 py-2.5 shadow-xl" style={{ background: 'rgba(10,18,40,0.82)', border: '1px solid rgba(250,204,21,0.4)', backdropFilter: 'blur(8px)' }}>
          <Compass className="w-5 h-5 text-amber-400 shrink-0" />
          <div className="min-w-0"><div className="text-amber-300 text-[10px] font-black uppercase tracking-widest">{chapter.title}</div><div className="text-white text-sm font-bold truncate">{chapter.objective}</div></div>
          <button onClick={() => setDialogue(story.mastered >= 8 ? ENDING : chapter.intro)} className="ml-1 text-amber-300 hover:text-amber-100 text-xs font-bold shrink-0">Story</button>
        </div>
      </div>

      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 text-[11px] text-white/80 bg-black/45 rounded-lg px-3 py-1.5 backdrop-blur">Tap a location to begin its simulations</div>

      {dialogue && <DialogueBox lines={dialogue} onClose={() => setDialogue(null)} />}
      {showIntro && <IntroScreen defaultName={profile?.character_name || profile?.username || 'Intern'} onBegin={beginGame} />}
      {quizOpen && <CareerQuiz existing={quizFirst ? null : quizResult} skills={skills} firstTime={quizFirst} onResult={onQuizResult} onClose={() => { setQuizOpen(false); setQuizFirst(false); }} onStartHere={(slug) => { setQuizOpen(false); setQuizFirst(false); navigate(`/career/${slug}`); }} />}
      {showOutro && <Outro name={profile?.character_name || profile?.username || 'Champion'} topName={topName} palette={PLAYER_PALETTE} onClose={() => setShowOutro(false)} />}
    </div>
  );
}

function Chip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/8 text-white text-xs font-bold">{icon}<span className="tabular-nums">{label}</span></div>;
}
function Btn({ onClick, title, a, children }: { onClick: () => void; title: string; a?: string; children: React.ReactNode }) {
  return <button onClick={onClick} title={title} aria-label={title} className="p-2 sm:p-2.5 rounded-xl text-slate-200 hover:text-white border border-white/12 transition-all" style={{ background: 'rgba(10,18,40,0.7)', backdropFilter: 'blur(8px)' }} onMouseEnter={e => { if (a) e.currentTarget.style.background = `${a}44`; }} onMouseLeave={e => { e.currentTarget.style.background = 'rgba(10,18,40,0.7)'; }}>{children}</button>;
}
