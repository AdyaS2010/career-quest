import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import * as LucideIcons from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Compass, Star } from 'lucide-react';
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
import { AppNavbar } from '../components/AppNavbar';

type Status = 'mastered' | 'in_progress' | 'not_started';
const VB_W = 1200, VB_H = 780;
// ===== isometric tile city (Kenney-style modular blocks; buildings sit on the lots) =====
const TW = 132, TH = 66, OX = 560, OY = 306, SLAB = 24;
const iso = (c: number, r: number) => ({ x: OX + (c - r) * (TW / 2), y: OY + (c + r) * (TH / 2) });
// 8 building lots on the tile grid  -  two per quadrant, off the extreme corners so nothing overhangs
const LOTS: { c: number; r: number }[] = [
  { c: 2, r: 0 }, { c: 1, r: 1 }, { c: 4, r: 0 }, { c: 4, r: 1 },
  { c: 0, r: 3 }, { c: 1, r: 3 }, { c: 4, r: 3 }, { c: 4, r: 4 },
];
function shade(hex: string, p: number) {
  const n = parseInt((hex || '#888888').replace('#', ''), 16);
  const r = Math.max(0, Math.min(255, (n >> 16) + p)), g = Math.max(0, Math.min(255, ((n >> 8) & 0xff) + p)), b = Math.max(0, Math.min(255, (n & 0xff) + p));
  return `rgb(${r},${g},${b})`;
}

// a distinctive rooftop landmark per career district (sits on the iso roof)
function RoofTopper({ slug, accent, mastered }: { slug: string; accent: string; mastered: boolean }) {
  const flag = mastered ? '#fde047' : accent;
  switch (slug) {
    case 'culinary-arts': // chef's toque
      return (<g><rect x="37" y="21" width="20" height="6" rx="2.5" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.2" /><circle cx="40" cy="17" r="6" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.2" /><circle cx="47" cy="13" r="7.5" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.2" /><circle cx="54" cy="17" r="6" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.2" /></g>);
    case 'information-technology': // server monitor + signal
      return (<g><line x1="47" y1="18" x2="47" y2="5" stroke="#94a3b8" strokeWidth="1.6" /><circle cx="47" cy="4" r="2.4" fill={flag} /><rect x="38" y="14" width="18" height="13" rx="2" fill="#0b3b5a" stroke="#7dd3fc" strokeWidth="1.4" /><path d="M41 23 h12 M41 20 h8 M41 17 h10" stroke="#7dd3fc" strokeWidth="1.1" /></g>);
    case 'health-sciences': // medical cross sign
      return (<g><line x1="47" y1="26" x2="47" y2="9" stroke="#cbd5e1" strokeWidth="2" /><rect x="38" y="7" width="18" height="14" rx="2.5" fill="#ffffff" stroke="#ef4444" strokeWidth="1.6" /><path d="M45 10 h4 v3 h3 v4 h-3 v3 h-4 v-3 h-3 v-4 h3 z" fill="#ef4444" /></g>);
    case 'law-government': // courthouse pediment + flag
      return (<g><path d="M31 26 L47 11 L63 26 Z" fill="#eef2f7" stroke="#94a3b8" strokeWidth="1.6" strokeLinejoin="round" /><line x1="47" y1="11" x2="47" y2="3" stroke="#94a3b8" strokeWidth="1.4" /><path d="M47 3 l11 3 l-11 3 z" fill={flag} /></g>);
    case 'financial-services': // bank pediment + gold coin
      return (<g><path d="M33 26 L47 12 L61 26 Z" fill="#f6e7b4" stroke="#caa53e" strokeWidth="1.6" strokeLinejoin="round" /><circle cx="47" cy="21" r="5.2" fill="#fcd34d" stroke="#b8860b" strokeWidth="1.2" /><text x="47" y="24" textAnchor="middle" fontSize="8" fontWeight="700" fill="#7a5c10">$</text></g>);
    case 'media-communication': // satellite dish + mast
      return (<g><line x1="46" y1="26" x2="46" y2="8" stroke="#94a3b8" strokeWidth="1.8" /><ellipse cx="53" cy="12" rx="9" ry="5" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.4" transform="rotate(-32 53 12)" /><circle cx="53" cy="12" r="1.8" fill="#64748b" /></g>);
    case 'education': // schoolhouse pennant
      return (<g><line x1="47" y1="26" x2="47" y2="5" stroke="#94a3b8" strokeWidth="1.6" /><path d="M47 6 q14 3 0 8 z" fill={flag} stroke="#caa53e" strokeWidth="0.8" /></g>);
    case 'arts-entertainment': // marquee + star
      return (<g><rect x="36" y="19" width="22" height="8" rx="2.5" fill={accent} stroke="#ffffff" strokeWidth="1.2" /><path d="M47 5 l2.6 5.4 l5.9 .7 l-4.4 4 l1.2 5.8 l-5.3 -2.9 l-5.3 2.9 l1.2 -5.8 l-4.4 -4 l5.9 -.7 z" fill={flag} stroke="#caa53e" strokeWidth="0.6" /></g>);
    default:
      return (<g><line x1="47" y1="24" x2="47" y2="6" stroke="#94a3b8" strokeWidth="1.4" /><path d="M47 6 l12 4 l-12 4 z" fill={flag} /></g>);
  }
}

// a themed isometric district building (3 shaded faces on a grassy iso mound)
function MapLandmark({ slug, color, accent, mastered, near }: { slug: string; color: string; accent: string; mastered: boolean; near: boolean }) {
  const ring = mastered ? '#fbbf24' : near ? '#ffffff' : shade(color, -64);
  const topF = shade(color, 34), leftF = shade(color, -2), rightF = shade(color, -30);
  const win = mastered ? '#fff7cc' : '#bfe0ff', winEdge = shade(color, -40);
  const leftWins = [[26, 42.5], [36, 47.5], [26, 58.5], [36, 63.5]];
  const rightWins = [[50, 51.5], [60, 46.5], [50, 67.5], [60, 62.5]];
  return (
    <svg width="94" height="104" viewBox="0 0 94 104" style={{ overflow: 'visible' }}>
      <ellipse cx="47" cy="95" rx="33" ry="9" fill="rgba(0,0,0,0.3)" />
      {/* grassy iso mound */}
      <path d="M47 74 L80 88 L47 102 L14 88 Z" fill="#6bbf6e" stroke="#3f8a4c" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M47 80 L72 90 L47 100 L22 90 Z" fill="#7cd07f" opacity="0.55" />
      {/* iso building: left + right + top faces */}
      <polygon points="21,40 47,53 47,87 21,74" fill={leftF} stroke={ring} strokeWidth="2.5" strokeLinejoin="round" />
      <polygon points="73,40 47,53 47,87 73,74" fill={rightF} stroke={ring} strokeWidth="2.5" strokeLinejoin="round" />
      <polygon points="21,40 47,27 73,40 47,53" fill={topF} stroke={ring} strokeWidth="2.5" strokeLinejoin="round" />
      {/* windows projected onto each face */}
      {leftWins.map(([a, y], i) => <polygon key={`L${i}`} points={`${a},${y} ${a + 8},${y + 4} ${a + 8},${y + 15} ${a},${y + 11}`} fill={win} stroke={winEdge} strokeWidth="1" opacity="0.92" />)}
      {rightWins.map(([b, y], i) => <polygon key={`R${i}`} points={`${b},${y} ${b + 8},${y - 4} ${b + 8},${y + 7} ${b},${y + 11}`} fill={win} stroke={winEdge} strokeWidth="1" opacity="0.92" />)}
      {/* door on the front corner */}
      <polygon points="42,72 47,74.5 47,88 42,85.5" fill={shade(color, -46)} stroke={shade(color, -62)} strokeWidth="1" />
      <polygon points="52,72 47,74.5 47,88 52,85.5" fill={shade(color, -38)} stroke={shade(color, -62)} strokeWidth="1" />
      {/* distinctive rooftop landmark */}
      <RoofTopper slug={slug} accent={accent} mastered={mastered} />
    </svg>
  );
}

// Drop-in sprite support: if an artist drops `public/assets/landmarks/<slug>.png`
// it's used automatically; otherwise we fall back to the drawn SVG landmark.
// Misses are remembered for the session so there's no repeated 404 / flicker.
const ART_MISSING = new Set<string>();
function LandmarkArt({ slug, color, accent, mastered, near, Icon, size = 124 }: { slug: string; color: string; accent: string; mastered: boolean; near: boolean; Icon: LucideIcon; size?: number }) {
  const [missing, setMissing] = useState(ART_MISSING.has(slug));
  if (!missing) {
    return (
      <img src={`/assets/landmarks/${slug}.png`} alt="" draggable={false}
        onError={() => { ART_MISSING.add(slug); setMissing(true); }}
        style={{ width: size, height: size, objectFit: 'contain', objectPosition: 'center bottom', filter: `drop-shadow(0 8px 10px rgba(0,0,0,0.4))${mastered ? ' drop-shadow(0 0 12px #fbbf24)' : ''}` }} />
    );
  }
  // drawn fallback (themed iso building with the domain icon badge on the front face)
  return (
    <div className="relative">
      <MapLandmark slug={slug} color={color} accent={accent} mastered={mastered} near={near} />
      <div className="absolute left-1/2 -translate-x-1/2 rounded-xl flex items-center justify-center shadow-md" style={{ top: 56, width: 26, height: 26, background: `linear-gradient(145deg, ${accent}, ${color})`, border: '2px solid rgba(255,255,255,0.9)' }}>
        <Icon className="w-3.5 h-3.5 text-white drop-shadow" />
      </div>
    </div>
  );
}

export function WorldMap() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { muted, startBgm, bgmPlaying } = useAudio();
  const { showGuide } = useGuide();

  const [careers, setCareers] = useState<Career[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [careerXP, setCareerXP] = useState<Record<string, number>>({});
  const [, setCareerMax] = useState<Record<string, number>>({});
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

  const chapter = currentChapter(story);
  const recommended = quizResult?.top;
  const skills: Record<string, { xp: number; status: Status }> = {};
  careers.forEach(c => { skills[c.slug] = { xp: careerXP[c.id] || 0, status: careerStatus[c.id] || 'not_started' }; });
  const topName = (quizResult && QUIZ_DOMAINS[quizResult.top]?.name) || careers.find(c => careerStatus[c.id] === 'mastered')?.name || 'your calling';

  if (loading) return <div className="min-h-screen" style={{ background: '#0a1228' }} />;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 overflow-hidden"
      style={{ background: '#4a93c6' }}
    >
      {/* ===== the map ===== */}
      <div className="absolute inset-0">
        <svg viewBox={`0 0 ${VB_W} ${VB_H}`} preserveAspectRatio="xMidYMid slice" className="w-full h-full">
          <defs>
            <radialGradient id="contact" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stopColor="#0a1c30" stopOpacity="0.42" /><stop offset="0.65" stopColor="#0a1c30" stopOpacity="0.2" /><stop offset="1" stopColor="#0a1c30" stopOpacity="0" /></radialGradient>
            <filter id="blur40" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="40" /></filter>
          </defs>
          {/* flat sky */}
          <rect x="0" y="0" width={VB_W} height={VB_H} fill="#4a93c6" />
          {/* ===== modular isometric tile city (Kenney-style) ===== */}
          {(() => {
            const hw = TW / 2, hh = TH / 2;
            const ROAD = new Set(['0,2', '1,2', '2,2', '3,2', '4,2', '5,2', '3,0', '3,1', '3,3', '3,4']);
            const cells: { c: number; r: number; road: boolean }[] = [];
            for (let r = 0; r <= 4; r++) for (let c = 0; c <= 5; c++) cells.push({ c, r, road: ROAD.has(`${c},${r}`) });
            const sorted = cells.sort((a, b) => (a.c + a.r) - (b.c + b.r));
            const trees: [number, number][] = [[1, 0], [0, 1], [2, 4], [5, 3]];
            const lamps: [number, number][] = [[2, 1], [5, 1], [2, 3]];
            const cross: [number, number][] = [[2, 2], [4, 2], [3, 1], [3, 3]];
            const ac = iso(1, 4);
            const ctr = iso(2.5, 2);
            return (
              <g>
                {/* soft shadow of the whole landmass on the water */}
                <ellipse cx={ctr.x} cy={ctr.y + 60} rx={400} ry={140} fill="#1d4e74" opacity="0.45" filter="url(#blur40)" />
                {/* the tiles */}
                {sorted.map(({ c, r, road }, i) => {
                  const o = iso(c, r);
                  return (
                    <g key={`tile${i}`}>
                      {/* soil side faces */}
                      <polygon points={`${o.x - hw},${o.y} ${o.x},${o.y + hh} ${o.x},${o.y + hh + SLAB} ${o.x - hw},${o.y + SLAB}`} fill="#bd8c57" />
                      <polygon points={`${o.x},${o.y + hh} ${o.x + hw},${o.y} ${o.x + hw},${o.y + SLAB} ${o.x},${o.y + hh + SLAB}`} fill="#9a6e3c" />
                      {/* darker base lip */}
                      <polygon points={`${o.x - hw},${o.y + SLAB - 6} ${o.x},${o.y + hh + SLAB - 6} ${o.x},${o.y + hh + SLAB} ${o.x - hw},${o.y + SLAB}`} fill="#7d572e" />
                      <polygon points={`${o.x},${o.y + hh + SLAB - 6} ${o.x + hw},${o.y + SLAB - 6} ${o.x + hw},${o.y + SLAB} ${o.x},${o.y + hh + SLAB}`} fill="#5f3f1f" />
                      {/* top face */}
                      <polygon points={`${o.x},${o.y - hh} ${o.x + hw},${o.y} ${o.x},${o.y + hh} ${o.x - hw},${o.y}`} fill={road ? '#8d9299' : '#d8cdab'} />
                      <polyline points={`${o.x - hw},${o.y} ${o.x},${o.y - hh} ${o.x + hw},${o.y}`} fill="none" stroke="#ffffff" strokeWidth="1.1" opacity={road ? 0.07 : 0.16} />
                    </g>
                  );
                })}
                {/* crosswalk stripes */}
                {cross.map(([c, r], i) => { const o = iso(c, r); const a = c === 3 ? -26.57 : 26.57; return <g key={`cw${i}`}>{[-13, 0, 13].map(d => <rect key={d} x={o.x - 3} y={o.y - 13} width="6" height="26" rx="1" fill="#eef0ec" opacity="0.8" transform={`rotate(${a} ${o.x} ${o.y}) translate(${d} 0)`} />)}</g>; })}
                {/* trees */}
                {trees.map(([c, r], i) => { const o = iso(c, r); return <g key={`tr${i}`}><ellipse cx={o.x} cy={o.y + 6} rx="13" ry="6" fill="#1b2f1e" opacity="0.24" /><rect x={o.x - 2.5} y={o.y - 8} width="5" height="14" rx="2.5" fill="#6f4f2e" /><circle cx={o.x} cy={o.y - 18} r="13" fill="#4f9a45" /><circle cx={o.x - 6} cy={o.y - 14} r="9" fill="#3f8438" /><circle cx={o.x + 6} cy={o.y - 15} r="8" fill="#62b257" /></g>; })}
                {/* light-blue rooftop unit block (matches the sample) */}
                <g>
                  <polygon points={`${ac.x},${ac.y - 16} ${ac.x + 20},${ac.y - 6} ${ac.x},${ac.y + 4} ${ac.x - 20},${ac.y - 6}`} fill="#bfe6f5" />
                  <polygon points={`${ac.x - 20},${ac.y - 6} ${ac.x},${ac.y + 4} ${ac.x},${ac.y + 16} ${ac.x - 20},${ac.y + 6}`} fill="#7fbfdc" />
                  <polygon points={`${ac.x},${ac.y + 4} ${ac.x + 20},${ac.y - 6} ${ac.x + 20},${ac.y + 6} ${ac.x},${ac.y + 16}`} fill="#5aa6c9" />
                </g>
                {/* street lamps */}
                {lamps.map(([c, r], i) => { const o = iso(c, r); return <g key={`lp${i}`}><line x1={o.x} y1={o.y} x2={o.x} y2={o.y - 30} stroke="#6b7178" strokeWidth="2.4" /><path d={`M${o.x} ${o.y - 30} q9 0 9 7`} fill="none" stroke="#6b7178" strokeWidth="2.4" /><circle cx={o.x + 9} cy={o.y - 21} r="3" fill="#ffe89a" /></g>; })}
              </g>
            );
          })()}
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

        {/* ===== district buildings (depth-sorted) ===== */}
        <svg viewBox={`0 0 ${VB_W} ${VB_H}`} preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full" style={{ zIndex: 20, pointerEvents: 'none' }}>
          {/* soft contact shadows ground each building to the plaza */}
          {LOTS.map((lot, i) => { const o = iso(lot.c, lot.r); return <ellipse key={`csh${i}`} cx={o.x} cy={o.y + 18} rx={42} ry={17} fill="url(#contact)" />; })}
          {careers
            .map((c, i) => ({ c, i, lot: LOTS[i] || LOTS[LOTS.length - 1] }))
            .sort((a, b) => (a.lot.c + a.lot.r) - (b.lot.c + b.lot.r))
            .map(({ c, lot }) => {
              const o = iso(lot.c, lot.r);
              const cs = c.color_scheme as unknown as ColorScheme;
              const status = careerStatus[c.id] || 'not_started';
              const Icon = (LucideIcons[c.icon as keyof typeof LucideIcons] as LucideIcon) || Star;
              const isRec = recommended === c.slug;
              return (
                <foreignObject key={c.id} x={o.x - 58} y={o.y - 80} width={116} height={108} style={{ overflow: 'visible' }}>
                  <button onClick={() => navigate(`/career/${c.slug}`)}
                    className="relative w-full h-full flex items-end justify-center group focus:outline-none cursor-pointer" style={{ pointerEvents: 'auto' }}>
                    <div className="relative transition-transform duration-200 ease-out group-hover:-translate-y-2">
                      <LandmarkArt slug={c.slug} color={cs.primary} accent={cs.accent} mastered={status === 'mastered'} near={isRec} Icon={Icon} size={96} />
                    </div>
                  </button>
                </foreignObject>
              );
            })}
        </svg>

        {/* ===== floating wayfinding signs above each building ===== */}
        <svg viewBox={`0 0 ${VB_W} ${VB_H}`} preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full" style={{ zIndex: 22, pointerEvents: 'none' }}>
          {careers
            .map((c, i) => ({ c, i, lot: LOTS[i] || LOTS[LOTS.length - 1] }))
            .sort((a, b) => (a.lot.c + a.lot.r) - (b.lot.c + b.lot.r))
            .map(({ c, lot }) => {
              const o = iso(lot.c, lot.r);
              const cs = c.color_scheme as unknown as ColorScheme;
              const status = careerStatus[c.id] || 'not_started';
              const Icon = (LucideIcons[c.icon as keyof typeof LucideIcons] as LucideIcon) || Star;
              const isRec = recommended === c.slug;
              return (
                <foreignObject key={`sg${c.id}`} x={o.x - 110} y={o.y - 172} width={220} height={94} style={{ overflow: 'visible' }}>
                  <div className="w-full h-full flex flex-col items-center justify-end" style={{ pointerEvents: 'none' }}>
                    <button onClick={() => navigate(`/career/${c.slug}`)} className="group flex flex-col items-center focus:outline-none" style={{ pointerEvents: 'auto', cursor: 'pointer' }}>
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-transform duration-200 group-hover:-translate-y-0.5" style={{ background: `linear-gradient(135deg, ${cs.primary}, ${cs.accent})`, border: '2px solid rgba(255,255,255,0.92)', boxShadow: isRec ? '0 6px 18px rgba(0,0,0,0.45), 0 0 18px rgba(52,211,153,0.85)' : '0 6px 16px rgba(0,0,0,0.45)' }}>
                        <Icon className="w-4 h-4 text-white shrink-0" strokeWidth={2.5} />
                        <span className="text-white text-[11px] font-black whitespace-nowrap tracking-tight drop-shadow">{c.name}</span>
                        {status === 'mastered' && <span className="grid place-items-center w-4 h-4 rounded-full text-[9px] font-black text-amber-900 shrink-0" style={{ background: 'linear-gradient(145deg,#fde68a,#f59e0b)' }}>✓</span>}
                      </div>
                      <div style={{ width: 0, height: 0, borderLeft: '7px solid transparent', borderRight: '7px solid transparent', borderTop: `9px solid ${cs.accent}` }} />
                      <div className="w-[3px] h-3 rounded-b-full" style={{ background: 'rgba(255,255,255,0.6)' }} />
                    </button>
                  </div>
                </foreignObject>
              );
            })}
        </svg>

      </div>

      {/* ===== top HUD (shared, identical on every page) ===== */}
      <AppNavbar />

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
    </motion.div>
  );
}
