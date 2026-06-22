import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, User, LogOut, Compass, Coins, Volume2, VolumeX } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useAudio } from '../contexts/AudioContext';
import { useGuide } from '../context/GuideContext';
import type { Career, Profile, Database, ColorScheme } from '../lib/database.types';
import { CHAPTERS, currentChapter, loadSeen, saveSeen, type DialogueLine, type StoryProgress } from './city/story';
import { QUIZ_DOMAINS, loadQuiz, saveQuiz, type QuizResult } from './city/quiz';
import { loadWallet, awardCoins, paletteFromWallet, type Wallet } from '../lib/wallet';
import { CharacterSprite } from './city/art';
import { ArcadeCabinet } from './city/interiorArt';
import { DialogueBox } from '../components/DialogueBox';
import { IntroScreen } from '../components/IntroScreen';
import { CareerQuiz } from '../components/CareerQuiz';
import { Outro } from '../components/Outro';
import { BrainTeaser } from '../games/BrainTeasers';

type Status = 'mastered' | 'in_progress' | 'not_started';
const W = 1120, H = 660;
const SPEED = 250, ACCEL_K = 16, HALF = 14, NEAR = 92;
const GUIDE = { name: 'Pixel', face: '🧚' };
const CAREER_EMOJI: Record<string, string> = {
  'culinary-arts': '🍳', 'information-technology': '💻', 'health-sciences': '🏥', 'law-government': '⚖️',
  'media-communication': '📰', 'financial-services': '🏦', 'education': '🎓', 'arts-entertainment': '🎭',
};

const SLOT_X = [80, 300, 520, 740, 960];
const ROW_Y = [130, 350];
// 10 cabinet slots: row A (0-4), row B (5-9)
function slotPos(i: number) { return { x: SLOT_X[i % 5], y: ROW_Y[Math.floor(i / 5)] }; }

const WELCOME: DialogueLine[] = [
  { speaker: GUIDE.name, portrait: GUIDE.face, text: "Hi there — welcome to the Questford Arcade! ✨ I'm Pixel, and I'll be right here with you." },
  { speaker: GUIDE.name, portrait: GUIDE.face, text: "Every machine inside lets you LIVE a real career for a few minutes. No pressure — just play, explore, and find what lights you up!" },
  { speaker: GUIDE.name, portrait: GUIDE.face, text: "Step up to the doors and press E (or tap Enter) to head inside. Let's go!" },
];
const ENTERED: DialogueLine[] = [
  { speaker: GUIDE.name, portrait: GUIDE.face, text: "Whoa… feel that? ✨ The cabinets just hummed to life — like they were waiting for you." },
  { speaker: GUIDE.name, portrait: GUIDE.face, text: "Each one is a different career, with three quick simulations to try. Walk up to any machine and press E to play. The glowing ones are extra brain-teasers — fun for coins!" },
];

export function ArcadeWorld() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { muted, toggleMute, startBgm, bgmPlaying } = useAudio();
  const { showGuide } = useGuide();

  const enteredKey = `questford_entered_${user?.id || 'anon'}`;
  const hasEntered = useCallback(() => { try { return !!localStorage.getItem(enteredKey); } catch { return false; } }, [enteredKey]);
  const [scene, setScene] = useState<'exterior' | 'interior'>('exterior');
  const [careers, setCareers] = useState<Career[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [careerXP, setCareerXP] = useState<Record<string, number>>({});
  const [careerStatus, setCareerStatus] = useState<Record<string, Status>>({});
  const [wallet, setWallet] = useState<Wallet>(() => loadWallet(user?.id || 'anon'));
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const [story, setStory] = useState<StoryProgress>({ started: 0, mastered: 0 });
  const [, setFrame] = useState(0);
  const [viewport, setViewport] = useState({ w: window.innerWidth, h: window.innerHeight });

  const [dialogue, setDialogue] = useState<DialogueLine[] | null>(null);
  const [showIntro, setShowIntro] = useState(false);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [quizOpen, setQuizOpen] = useState(false);
  const [quizFirst, setQuizFirst] = useState(false);
  const [showOutro, setShowOutro] = useState(false);
  const [teaser, setTeaser] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [near, setNear] = useState<{ kind: 'door' | 'career' | 'teaser'; idx: number } | null>(null);
  const toastTimer = useRef(0);

  const player = useRef({ x: 560, y: 560, vx: 0, vy: 0, dir: 'up' as string, moving: false, phase: 0 });
  const keys = useRef<Set<string>>(new Set());
  const touch = useRef({ x: 0, y: 0 });
  const raf = useRef(0); const last = useRef(0);
  const nearRef = useRef<typeof near>(null);
  const blockedRef = useRef(false);
  blockedRef.current = !!dialogue || showIntro || quizOpen || showOutro || !!teaser;
  const sceneRef = useRef(scene); sceneRef.current = scene;

  // ---- data ----
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
        if (diff !== 0) {
          const isNext = diff === 1; const ns = isNext ? (pd.current_streak || 0) + 1 : 1;
          const up = { current_streak: ns, longest_streak: Math.max(ns, pd.longest_streak || 0), last_login_date: new Date().toISOString(), total_score: (pd.total_score || 0) + 50 };
          // @ts-ignore
          await supabase.from('profiles').update(up as Database['public']['Tables']['profiles']['Update']).eq('id', user.id);
          setProfile({ ...pd, ...up } as Profile); showGuide(diff === -1 ? 'Welcome to Questford! +50 🔥' : `Day ${ns} streak! +50 🔥`, 'happy');
        } else setProfile(pd);
      }
      const ch = (chRes.data || []) as { id: string; career_id: string; max_score?: number }[];
      const cp = (prRes.data || []) as { challenge_id: string; best_score: number }[];
      const toCareer: Record<string, string> = {}; const maxP: Record<string, number> = {};
      ch.forEach(c => { toCareer[c.id] = c.career_id; maxP[c.career_id] = (maxP[c.career_id] || 0) + (c.max_score || 100); });
      const xp: Record<string, number> = {}; const started: Record<string, number> = {};
      cp.forEach(p => { const cid = toCareer[p.challenge_id]; if (cid) { xp[cid] = (xp[cid] || 0) + p.best_score; started[cid] = (started[cid] || 0) + 1; } });
      setCareerXP(xp);
      const status: Record<string, Status> = {}; let s = 0, m = 0;
      rows.forEach(c => { const e = xp[c.id] || 0, mx = maxP[c.id] || 1, st = started[c.id] || 0; let v: Status; if ((c.slug === 'financial-services' && e >= 270) || e >= 0.8 * mx) v = 'mastered'; else if (st > 0) v = 'in_progress'; else v = 'not_started'; status[c.id] = v; if (v !== 'not_started') s++; if (v === 'mastered') m++; });
      setCareerStatus(status); setStory({ started: s, mastered: m }); setReady(true);
    } catch (e) { console.error('arcade load', e); } finally { setLoading(false); }
  }, [user, showGuide]);
  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (user) {
      setWallet(loadWallet(user.id)); setQuizResult(loadQuiz(user.id));
      try {
        if (localStorage.getItem(`questford_entered_${user.id}`)) setScene('interior');
        if (!localStorage.getItem(`questford_intro_${user.id}`)) setShowIntro(true);
      } catch { /* ignore */ }
    }
  }, [user]);

  useEffect(() => {
    const r = () => setViewport({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', r); return () => window.removeEventListener('resize', r);
  }, []);
  useEffect(() => {
    if (!bgmPlaying && !muted) { const h = () => { startBgm(); document.removeEventListener('click', h); }; document.addEventListener('click', h, { once: true }); return () => document.removeEventListener('click', h); }
  }, [bgmPlaying, muted, startBgm]);

  // welcome dialogue (exterior, first time) + story/outro (after entering)
  useEffect(() => {
    if (!ready || !user || showIntro) return;
    if (scene === 'exterior') { if (!hasEntered()) setDialogue(WELCOME); return; }
    const seen = loadSeen(user.id);
    if (story.mastered >= 8 && !seen.endingSeen) { setShowOutro(true); seen.endingSeen = true; saveSeen(user.id, seen); return; }
    if (!seen.introSeen) { setDialogue(CHAPTERS[0].intro); seen.introSeen = true; if (!seen.chaptersSeen.includes('arrival')) seen.chaptersSeen.push('arrival'); saveSeen(user.id, seen); return; }
    const cur = currentChapter(story);
    if (!seen.chaptersSeen.includes(cur.id)) { setDialogue(cur.intro); seen.chaptersSeen.push(cur.id); saveSeen(user.id, seen); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, story, user, showIntro, scene]);

  // cabinets (interior): careers fill first slots, teasers next
  const cabinets = (() => {
    const list: { slot: number; kind: 'career' | 'teaser'; slug?: string; teaser?: string; name: string; color: string; accent: string; icon: string; status?: Status; xp?: number }[] = [];
    careers.slice(0, 8).forEach((c, i) => {
      const cs = c.color_scheme as unknown as ColorScheme;
      list.push({ slot: i, kind: 'career', slug: c.slug, name: c.name, color: cs.primary, accent: cs.accent, icon: CAREER_EMOJI[c.slug] || '🎮', status: careerStatus[c.id] || 'not_started', xp: careerXP[c.id] || 0 });
    });
    list.push({ slot: 8, kind: 'teaser', teaser: 'memory', name: 'Memory Match', color: '#6d28d9', accent: '#a78bfa', icon: '🧠' });
    list.push({ slot: 9, kind: 'teaser', teaser: 'math', name: 'Quick Math', color: '#0369a1', accent: '#38bdf8', icon: '➗' });
    return list;
  })();

  // ---- enter / interact ----
  const enterArcade = useCallback(() => {
    const first = !hasEntered();
    setScene('interior'); player.current.x = 560; player.current.y = 580; player.current.dir = 'up';
    try { localStorage.setItem(enteredKey, '1'); } catch { /* ignore */ }
    if (first) setTimeout(() => setDialogue(ENTERED), 350);
  }, [hasEntered, enteredKey]);

  const act = useCallback(() => {
    const n = nearRef.current; if (!n) return;
    if (n.kind === 'door') { enterArcade(); return; }
    const cab = cabinets[n.idx];
    if (cab.kind === 'career' && cab.slug) navigate(`/career/${cab.slug}`);
    else if (cab.kind === 'teaser' && cab.teaser) setTeaser(cab.teaser);
  }, [cabinets, navigate, enterArcade]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (blockedRef.current) return;
      const k = e.key.toLowerCase();
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
      if (k === 'e' || k === 'enter' || k === ' ') { act(); return; }
      keys.current.add(k);
    };
    const up = (e: KeyboardEvent) => keys.current.delete(e.key.toLowerCase());
    const clearKeys = () => { keys.current.clear(); };
    const onVis = () => { if (document.visibilityState === 'hidden') keys.current.clear(); };
    window.addEventListener('keydown', down); window.addEventListener('keyup', up);
    window.addEventListener('blur', clearKeys);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      window.removeEventListener('keydown', down); window.removeEventListener('keyup', up);
      window.removeEventListener('blur', clearKeys);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [act]);

  // ---- movement loop ----
  useEffect(() => {
    const step = (ts: number) => {
      const dt = last.current ? Math.min((ts - last.current) / 1000, 0.05) : 0; last.current = ts;
      const p = player.current;
      let ix = 0, iy = 0;
      if (!blockedRef.current) { const k = keys.current; ix = (k.has('d') || k.has('arrowright') ? 1 : 0) - (k.has('a') || k.has('arrowleft') ? 1 : 0) + touch.current.x; iy = (k.has('s') || k.has('arrowdown') ? 1 : 0) - (k.has('w') || k.has('arrowup') ? 1 : 0) + touch.current.y; }
      const l = Math.hypot(ix, iy); let tx = 0, ty = 0; if (l > 0.01) { tx = ix / l * SPEED; ty = iy / l * SPEED; }
      const sm = 1 - Math.exp(-ACCEL_K * dt); p.vx += (tx - p.vx) * sm; p.vy += (ty - p.vy) * sm;

      const blockedAt = (x: number, y: number) => {
        if (sceneRef.current === 'exterior') return y < 250 && (x < 360 || x > 760); // building walls flank the door
        // interior: cabinet footprints
        for (const cab of cabinets) { const s = slotPos(cab.slot); if (x - HALF < s.x + 90 && x + HALF > s.x + 14 && y - HALF < s.y + 144 && y + HALF > s.y + 34) return true; }
        return false;
      };
      const nx = p.x + p.vx * dt, ny = p.y + p.vy * dt;
      if (!blockedAt(nx, p.y)) p.x = Math.max(40, Math.min(W - 40, nx)); else p.vx = 0;
      if (!blockedAt(p.x, ny)) p.y = Math.max(sceneRef.current === 'exterior' ? 250 : 96, Math.min(H - 36, ny)); else p.vy = 0;
      const sp = Math.hypot(p.vx, p.vy); p.moving = sp > 10;
      if (p.moving) { p.dir = Math.abs(p.vx) > Math.abs(p.vy) ? (p.vx > 0 ? 'right' : 'left') : (p.vy > 0 ? 'down' : 'up'); p.phase += sp / SPEED * dt * 12; }

      // nearest interactable
      let best: typeof near = null, bd = NEAR;
      if (sceneRef.current === 'exterior') { const d = Math.hypot(p.x - 560, p.y - 300); if (d < bd) best = { kind: 'door', idx: 0 }; }
      else { cabinets.forEach((cab, i) => { const s = slotPos(cab.slot); const d = Math.hypot(p.x - (s.x + 52), p.y - (s.y + 150)); if (d < bd) { bd = d; best = { kind: cab.kind, idx: i }; } }); }
      if (JSON.stringify(best) !== JSON.stringify(nearRef.current)) { nearRef.current = best; setNear(best); }

      setFrame(f => (f + 1) % 1e6);
      raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cabinets.length]);

  const beginGame = useCallback(async (name: string) => {
    setShowIntro(false);
    if (!user) return;
    try { localStorage.setItem(`questford_intro_${user.id}`, '1'); } catch { /* ignore */ }
    if (!loadQuiz(user.id)) { setQuizFirst(true); setQuizOpen(true); }
    else if (!hasEntered()) setDialogue(WELCOME);
    const cur = profile?.character_name || profile?.username || '';
    if (name && name !== cur) { setProfile(pr => pr ? ({ ...pr, character_name: name }) : pr); try { await (supabase.from('profiles') as any).update({ character_name: name, updated_at: new Date().toISOString() }).eq('id', user.id); } catch { /* ignore */ } }
  }, [user, profile, hasEntered]);

  const onTeaserDone = (coins: number) => { if (user) setWallet(awardCoins(user.id, coins)); setTeaser(null); setToast(`+${coins} coins! 🪙`); window.clearTimeout(toastTimer.current); toastTimer.current = window.setTimeout(() => setToast(null), 2200); };

  const level = Math.floor((profile?.total_score || 0) / 100) + 1;
  const skills: Record<string, { xp: number; status: Status }> = {};
  careers.forEach(c => { skills[c.slug] = { xp: careerXP[c.id] || 0, status: careerStatus[c.id] || 'not_started' }; });
  const topName = (quizResult && QUIZ_DOMAINS[quizResult.top]?.name) || careers.find(c => careerStatus[c.id] === 'mastered')?.name || 'your calling';
  const onQuizResult = (r: QuizResult) => { setQuizResult(r); if (user) saveQuiz(user.id, r); };

  if (loading) return <div className="min-h-screen" style={{ background: '#0b1024' }} />;

  const p = player.current;
  const scale = Math.min(viewport.w / W, (viewport.h - 56) / H) * 0.98;
  const flip = p.dir === 'left' ? -1 : 1;
  const recSlug = quizResult?.top;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 overflow-hidden select-none"
      style={{ background: scene === 'exterior' ? 'radial-gradient(ellipse at 50% -10%, #20305f, #0a0f24 75%)' : 'radial-gradient(ellipse at 50% 0%, #2a1846, #120b24 75%)' }}
    >
      {/* top bar */}
      <div className="absolute top-0 inset-x-0 z-40 flex items-center justify-between gap-2 px-3 sm:px-5 py-2.5" style={{ background: 'linear-gradient(180deg, rgba(11,16,36,0.92), transparent)' }}>
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-2xl">🕹️</span>
          <span className="font-fantasy text-white text-lg sm:text-xl tracking-wide hidden sm:block">Questford Arcade</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/8 border border-white/10 text-white text-sm font-bold"><Coins className="w-4 h-4 text-amber-400" />{wallet.coins}</div>
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/8 border border-white/10 text-white text-sm font-bold"><Trophy className="w-4 h-4 text-yellow-300" />Lv {level}</div>
          <Btn onClick={() => { setQuizFirst(false); setQuizOpen(true); }} title="Career Compass" a="#34d399"><Compass className="w-5 h-5" /></Btn>
          <Btn onClick={() => navigate('/leaderboard')} title="Leaderboard" a="#fbbf24"><Trophy className="w-5 h-5" /></Btn>
          <Btn onClick={() => navigate('/profile')} title="Profile" a="#60a5fa"><User className="w-5 h-5" /></Btn>
          <Btn onClick={toggleMute} title="Mute">{muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}</Btn>
          <Btn onClick={signOut} title="Sign out" a="#f87171"><LogOut className="w-5 h-5" /></Btn>
        </div>
      </div>

      {/* scaled scene */}
      <div className="absolute left-1/2 top-1/2" style={{ transform: `translate(-50%,-50%) scale(${scale})`, width: W, height: H, marginTop: 20 }}>
        <div className="absolute overflow-hidden rounded-2xl" style={{ width: W, height: H, boxShadow: '0 30px 90px rgba(0,0,0,0.6)' }}>
          {scene === 'exterior' ? <Exterior near={near?.kind === 'door'} /> : <Interior cabinets={cabinets} near={near} recSlug={recSlug} />}

          {/* player */}
          <div className="absolute" style={{ left: p.x, top: p.y, width: 0, height: 0, zIndex: Math.round(p.y) + 50 }}>
            <div className="absolute left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-md bg-black/60 text-white text-[10px] font-bold whitespace-nowrap" style={{ top: -58 }}>{profile?.character_name || profile?.username || 'You'}</div>
            <div className="absolute left-1/2 -translate-x-1/2 rounded-full bg-black/40 blur-[2px]" style={{ width: 28, height: 8, top: 12 }} />
            <div className="absolute" style={{ left: -23, top: -50, transform: `scaleX(${flip})` }}><CharacterSprite w={46} dir={p.dir} phase={p.phase} moving={p.moving} palette={paletteFromWallet(wallet)} hat /></div>
          </div>

          {/* Pixel the guide mascot */}
          <div className="absolute" style={{ left: scene === 'exterior' ? 360 : 120, top: scene === 'exterior' ? 470 : 470, width: 0, height: 0, zIndex: 80 }}>
            <div className="absolute left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-md bg-fuchsia-500 text-white text-[10px] font-black whitespace-nowrap" style={{ top: -42 }}>{GUIDE.name}</div>
            <div className="absolute left-1/2 -translate-x-1/2 text-4xl qf-bob" style={{ top: -36, filter: 'drop-shadow(0 0 10px rgba(232,121,249,0.7))' }}>{GUIDE.face}</div>
          </div>
        </div>
      </div>

      {/* interaction prompt */}
      {near && !blockedRef.current && (
        <div className="absolute left-1/2 -translate-x-1/2 bottom-7 z-40 animate-fade-in">
          <button onClick={act} className="flex items-center gap-3 px-6 py-3.5 rounded-2xl border-2 shadow-2xl hover:scale-105 active:scale-95 transition-transform" style={{ background: 'rgba(15,23,42,0.94)', borderColor: '#a78bfa' }}>
            <span className="text-2xl">{near.kind === 'door' ? '🚪' : cabinets[near.idx]?.icon}</span>
            <span className="text-white font-black">{near.kind === 'door' ? 'Enter the Arcade' : cabinets[near.idx]?.name}</span>
            <span className="px-3 py-1.5 rounded-lg bg-white text-slate-900 font-black text-sm">E</span>
          </button>
        </div>
      )}

      {/* desktop hint */}
      <div className="absolute right-4 bottom-4 z-30 text-[11px] text-white/70 bg-black/40 rounded-lg px-3 py-2 backdrop-blur hidden sm:block">
        <span className="font-bold">WASD / Arrows</span> move · <span className="font-bold">E</span> {scene === 'exterior' ? 'enter' : 'play'}
      </div>

      {toast && <div className="absolute left-1/2 -translate-x-1/2 top-16 z-50 animate-fade-in px-5 py-2.5 rounded-2xl border-2 font-black text-slate-900" style={{ background: 'linear-gradient(90deg,#fde68a,#fbbf24)', borderColor: '#f59e0b' }}>{toast}</div>}

      {/* mobile dpad */}
      <Dpad onVec={(x, y) => { touch.current = { x, y }; }} onAct={act} label="E" can={!!near} />

      {dialogue && <DialogueBox lines={dialogue} onClose={() => setDialogue(null)} />}
      {teaser && <BrainTeaser id={teaser} onComplete={onTeaserDone} onExit={() => setTeaser(null)} />}
      {showIntro && <IntroScreen defaultName={profile?.character_name || profile?.username || 'Intern'} onBegin={beginGame} />}
      {quizOpen && <CareerQuiz existing={quizFirst ? null : quizResult} skills={skills} firstTime={quizFirst} onResult={onQuizResult} onClose={() => { setQuizOpen(false); setQuizFirst(false); }} onStartHere={() => { setQuizOpen(false); setQuizFirst(false); }} />}
      {showOutro && <Outro name={profile?.character_name || profile?.username || 'Champion'} topName={topName} palette={paletteFromWallet(wallet)} onClose={() => setShowOutro(false)} />}
    </motion.div>
  );
}

/* ============== exterior: the arcade building ============== */
function Exterior({ near }: { near: boolean }) {
  return (
    <>
      {/* ground + sky */}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, #1a2550 0%, #20305f 45%, #3a3550 70%, #4a4458 100%)' }} />
      <div className="absolute inset-x-0 bottom-0" style={{ height: 150, background: 'linear-gradient(180deg,#3b3a52,#2a2940)' }}>
        <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(90deg, rgba(0,0,0,0.12) 2px, transparent 2px)', backgroundSize: '60px 100%' }} />
      </div>
      {/* moon + stars */}
      <div className="absolute rounded-full" style={{ width: 70, height: 70, top: 40, right: 90, background: 'radial-gradient(circle at 40% 35%,#fff7d6,#fcd34d)', boxShadow: '0 0 50px 14px rgba(252,211,77,0.4)' }} />
      <div className="absolute inset-0 opacity-50" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.6) 1px, transparent 1px)', backgroundSize: '70px 70px' }} />

      {/* the arcade building */}
      <div className="absolute" style={{ left: 300, top: 70, width: 520, height: 360 }}>
        {/* facade */}
        <div className="absolute inset-0 rounded-t-2xl" style={{ background: 'linear-gradient(180deg,#3b2a5e,#2a1f45)', border: '4px solid #1b1430', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }} />
        {/* neon marquee */}
        <div className="absolute left-1/2 -translate-x-1/2 rounded-xl flex items-center justify-center" style={{ top: 18, width: 420, height: 64, background: 'linear-gradient(180deg,#db2777,#831843)', border: '4px solid #fbcfe8', boxShadow: '0 0 36px rgba(236,72,153,0.7)' }}>
          <span className="font-fantasy text-white text-2xl sm:text-3xl tracking-widest" style={{ textShadow: '0 0 12px rgba(255,255,255,0.8)' }}>QUESTFORD</span>
        </div>
        <div className="absolute left-1/2 -translate-x-1/2 text-amber-300 font-black tracking-[0.5em] text-sm" style={{ top: 86 }}>★ ARCADE ★</div>
        {/* window showing cabinets inside */}
        <div className="absolute rounded-lg overflow-hidden" style={{ left: 40, top: 130, width: 180, height: 120, background: '#0b1220', border: '4px solid #4c3a72' }}>
          {[0, 1, 2].map(i => <div key={i} className="absolute rounded" style={{ left: 18 + i * 56, top: 40, width: 40, height: 70, background: ['#2563eb', '#dc2626', '#16a34a'][i], boxShadow: `0 0 14px ${['#2563eb', '#dc2626', '#16a34a'][i]}` }} />)}
        </div>
        <div className="absolute rounded-lg overflow-hidden" style={{ right: 40, top: 130, width: 180, height: 120, background: '#0b1220', border: '4px solid #4c3a72' }}>
          {[0, 1, 2].map(i => <div key={i} className="absolute rounded" style={{ left: 18 + i * 56, top: 40, width: 40, height: 70, background: ['#d97706', '#7c3aed', '#0891b2'][i], boxShadow: `0 0 14px ${['#d97706', '#7c3aed', '#0891b2'][i]}` }} />)}
        </div>
        {/* doors */}
        <div className="absolute left-1/2 -translate-x-1/2 rounded-t-xl overflow-hidden" style={{ bottom: 0, width: 150, height: 150, background: near ? 'linear-gradient(180deg,#fff7d6,#fde68a)' : 'linear-gradient(180deg,#7dd3fc,#38bdf8)', border: '5px solid #1b1430', boxShadow: near ? '0 0 40px 10px rgba(253,224,71,0.8)' : '0 0 24px rgba(56,189,248,0.5)', transition: 'all .25s' }}>
          <div className="absolute left-1/2 top-0 bottom-0 w-1 -translate-x-1/2 bg-black/40" />
          <div className="absolute inset-3 rounded-t-lg" style={{ border: '2px solid rgba(255,255,255,0.4)' }} />
          <div className="absolute left-1/2 -translate-x-1/2 bottom-10 text-3xl">{near ? '➡️' : '🎮'}</div>
        </div>
      </div>
      {/* welcome mat */}
      <div className="absolute left-1/2 -translate-x-1/2 rounded-xl" style={{ top: 432, width: 170, height: 34, background: '#7c3aed', opacity: 0.6, border: '2px dashed rgba(255,255,255,0.4)' }} />
    </>
  );
}

/* ============== interior: the arcade floor ============== */
function Interior({ cabinets, near, recSlug }: { cabinets: any[]; near: { kind: string; idx: number } | null; recSlug?: string }) {
  return (
    <>
      {/* carpet */}
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 40%, #3a2a64, #1d1336 80%)' }} />
      <div className="absolute inset-0 opacity-60" style={{ backgroundImage: 'repeating-linear-gradient(45deg, rgba(124,58,237,0.18) 0 14px, transparent 14px 28px), repeating-linear-gradient(-45deg, rgba(236,72,153,0.12) 0 14px, transparent 14px 28px)' }} />
      <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.35) 1.5px, transparent 1.5px)', backgroundSize: '46px 46px', opacity: 0.25 }} />
      {/* back wall + neon ceiling */}
      <div className="absolute inset-x-0 top-0" style={{ height: 92, background: 'linear-gradient(180deg,#160e2e,#241640)', boxShadow: 'inset 0 -10px 20px rgba(0,0,0,0.5)' }}>
        <div className="absolute inset-x-6 top-4 h-2 rounded-full" style={{ background: 'linear-gradient(90deg,#f0abfc,#a78bfa,#38bdf8,#f0abfc)', boxShadow: '0 0 18px rgba(167,139,250,0.8)' }} />
        <div className="absolute left-1/2 -translate-x-1/2 top-9 font-fantasy text-white/90 text-lg tracking-widest">★ PLAY ANY CAREER ★</div>
      </div>
      {/* edge vignette */}
      <div className="absolute inset-0 pointer-events-none" style={{ boxShadow: 'inset 0 0 120px rgba(0,0,0,0.5)' }} />

      {/* cabinets */}
      {cabinets.map((cab, i) => {
        const s = slotPos(cab.slot);
        const isNear = near?.idx === i && (near?.kind === cab.kind);
        const isRec = cab.kind === 'career' && recSlug === cab.slug;
        return (
          <div key={i} className="absolute" style={{ left: s.x, top: s.y, zIndex: Math.round(s.y + 150) }}>
            {isRec && <div className="absolute left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[10px] font-black text-slate-900 shadow z-10" style={{ top: -14, background: '#34d399' }}>★ Best fit</div>}
            <ArcadeCabinet color={cab.color} accent={cab.accent} icon={cab.icon} near={isNear} done={cab.status === 'mastered'} label={cab.kind === 'teaser' ? 'BONUS' : undefined} />
            {/* name plate */}
            <div className="absolute left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-md text-[10px] font-bold text-white whitespace-nowrap" style={{ top: 152, background: 'rgba(0,0,0,0.6)' }}>{cab.name}</div>
            {cab.kind === 'career' && <div className="absolute left-1/2 -translate-x-1/2 text-[9px] font-black" style={{ top: 168, color: cab.status === 'mastered' ? '#fcd34d' : '#a5b4fc' }}>{cab.status === 'mastered' ? '★ Mastered' : `${cab.xp} XP`}</div>}
          </div>
        );
      })}
    </>
  );
}

function Btn({ onClick, title, a, children }: { onClick: () => void; title: string; a?: string; children: React.ReactNode }) {
  return <button onClick={onClick} title={title} aria-label={title} className="p-2.5 rounded-xl text-slate-200 hover:text-white border border-white/10 transition-all" style={{ background: 'rgba(255,255,255,0.06)' }} onMouseEnter={e => { if (a) e.currentTarget.style.background = `${a}33`; }} onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}>{children}</button>;
}

function Dpad({ onVec, onAct, label, can }: { onVec: (x: number, y: number) => void; onAct: () => void; label: string; can: boolean }) {
  const press = (x: number, y: number) => (e: React.TouchEvent | React.MouseEvent) => { e.preventDefault(); onVec(x, y); };
  const rel = (e: React.TouchEvent | React.MouseEvent) => { e.preventDefault(); onVec(0, 0); };
  const P = ({ x, y, l, c }: { x: number; y: number; l: string; c: string }) => <button className={`absolute w-12 h-12 rounded-full bg-white/20 border border-white/30 text-white text-lg font-black flex items-center justify-center active:bg-white/40 ${c}`} onTouchStart={press(x, y)} onTouchEnd={rel} onMouseDown={press(x, y)} onMouseUp={rel} onMouseLeave={rel}>{l}</button>;
  return (
    <div className="sm:hidden">
      <div className="absolute left-4 bottom-5 z-40 w-40 h-40">
        <P x={0} y={-1} l="▲" c="left-1/2 -translate-x-1/2 top-0" /><P x={0} y={1} l="▼" c="left-1/2 -translate-x-1/2 bottom-0" /><P x={-1} y={0} l="◀" c="left-0 top-1/2 -translate-y-1/2" /><P x={1} y={0} l="▶" c="right-0 top-1/2 -translate-y-1/2" />
      </div>
      <button onClick={onAct} disabled={!can} className="absolute right-6 bottom-10 z-40 w-16 h-16 rounded-full font-black shadow-xl disabled:opacity-40" style={{ background: can ? '#fde68a' : 'rgba(255,255,255,0.2)', color: '#0f172a' }}>{label}</button>
    </div>
  );
}
