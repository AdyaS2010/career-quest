import { useEffect, useRef, useState, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, User, LogOut, Volume2, VolumeX, Moon, Sun, Flame, Coins, Map as MapIcon, Zap, Navigation, MessageCircle, Compass } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useAudio } from '../contexts/AudioContext';
import { useTheme } from '../contexts/ThemeContext';
import { useGuide } from '../context/GuideContext';
import type { Career, Profile, Database } from '../lib/database.types';
import {
  WORLD_W, WORLD_H, BUILDINGS, FOUNTAIN, SPAWN, TREES, LIGHTS,
  BUSHES, FLOWERBEDS, BENCHES, STALLS, SIGNPOST, FILLERS, CAR_LANES, NPC_PATHS,
  AVENUES, VPATHS, VPATH_W, ROAD_W, PARK, PARK_BANDS, AMENITIES, AMENITY_ICON,
  doorPoint, type BuildingDef,
} from './city/cityLayout';
import { loadWallet, paletteFromWallet } from '../lib/wallet';
import {
  CHAPTERS, ENDING, currentChapter, loadSeen, saveSeen,
  type DialogueLine, type StoryProgress,
} from './city/story';
import { DialogueBox } from '../components/DialogueBox';
import { IntroScreen } from '../components/IntroScreen';
import { CareerQuiz } from '../components/CareerQuiz';
import { Outro } from '../components/Outro';
import { loadQuiz, saveQuiz, QUIZ_DOMAINS, type QuizResult } from './city/quiz';
import {
  BuildingSprite, TreeSprite, BushSprite, LampSprite, BenchSprite, StallSprite,
  FountainSprite, PinSprite, CharacterSprite, CarSprite, type Palette,
} from './city/art';

type CareerStatus = 'mastered' | 'in_progress' | 'not_started';

interface NPC { x: number; y: number; pathIdx: number; dist: number; speed: number; palette: Palette; phase: number; dir: 'left' | 'right' | 'up' | 'down'; }
interface Car { axis: 'h'; fixed: number; dir: 1 | -1; color: string; pos: number; speed: number; }
interface Dust { x: number; y: number; life: number; max: number; size: number; }

const MAX_SPEED = 300;       // px / s
const SPRINT_MULT = 1.7;
const ACCEL_K = 14;          // velocity smoothing toward target
const COLLIDE_HALF = 16;
const DOOR_RADIUS = 80;
const TALK_RADIUS = 96;
const START_HOUR = 9;           // fallback until the real clock ticks
const MAYOR = { x: 1200, y: 660, emoji: '🧔‍♂️' };
const VALE_PALETTE: Palette = { skin: '#e7b48a', hair: '#9ca3af', top: '#4338ca', pants: '#1e293b', pack: '#312e81' };

function rectsOverlap(ax: number, ay: number, aw: number, ah: number, bx: number, by: number, bw: number, bh: number) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

// Solid footprints for the decorative props (centered on each prop's visible base).
interface Rect { x: number; y: number; w: number; h: number; }
const centered = (cx: number, cy: number, w: number, h: number): Rect => ({ x: cx - w / 2, y: cy - h / 2, w, h });
const PROP_COLLIDERS: Rect[] = [
  ...TREES.map(t => centered(t.x + 32, t.y + 46, 26 * t.s, 16)),
  ...BUSHES.map(b => centered(b.x + 23, b.y + 24, 34 * b.s, 14)),
  ...BENCHES.map(b => centered(b.x, b.y + 4, 50, 14)),
  ...STALLS.map(s => centered(s.x, s.y + 8, 60, 20)),
  ...LIGHTS.map(l => centered(l.x + 9, l.y + 30, 12, 16)),
  centered(SIGNPOST.x, SIGNPOST.y + 2, 14, 16),
];

const ENTERABLE = [...BUILDINGS, ...AMENITIES];   // career sims + amenity shops
function hitsSolid(x: number, y: number): boolean {
  const px = x - COLLIDE_HALF, py = y - COLLIDE_HALF, pw = COLLIDE_HALF * 2, ph = COLLIDE_HALF * 2;
  for (const b of ENTERABLE) {
    if (rectsOverlap(px, py, pw, ph, b.x, b.y, b.w, b.h)) return true;
  }
  for (const b of FILLERS) {
    if (rectsOverlap(px, py, pw, ph, b.x, b.y, b.w, b.h)) return true;
  }
  if (rectsOverlap(px, py, pw, ph, FOUNTAIN.x - FOUNTAIN.r, FOUNTAIN.y - FOUNTAIN.r, FOUNTAIN.r * 2, FOUNTAIN.r * 2)) return true;
  for (const r of PROP_COLLIDERS) {
    if (rectsOverlap(px, py, pw, ph, r.x, r.y, r.w, r.h)) return true;
  }
  return false;
}

// Precompute closed-loop metrics for each NPC path so we can sample a position
// at any distance along it (smooth, purposeful pedestrian routes).
const PATH_META = NPC_PATHS.map(pts => {
  const segs = pts.map((p, i) => {
    const q = pts[(i + 1) % pts.length];
    return { x: p.x, y: p.y, dx: q.x - p.x, dy: q.y - p.y, len: Math.hypot(q.x - p.x, q.y - p.y) };
  });
  const total = segs.reduce((s, sg) => s + sg.len, 0);
  return { pts, segs, total };
});
function samplePath(pathIdx: number, dist: number): { x: number; y: number; dir: 'left' | 'right' | 'up' | 'down' } {
  const m = PATH_META[pathIdx];
  let d = ((dist % m.total) + m.total) % m.total;
  for (const sg of m.segs) {
    if (d <= sg.len) {
      const f = sg.len ? d / sg.len : 0;
      const dir = Math.abs(sg.dx) > Math.abs(sg.dy) ? (sg.dx > 0 ? 'right' : 'left') : (sg.dy > 0 ? 'down' : 'up');
      return { x: sg.x + sg.dx * f, y: sg.y + sg.dy * f, dir };
    }
    d -= sg.len;
  }
  return { x: m.pts[0].x, y: m.pts[0].y, dir: 'down' };
}
function smoothstep(a: number, b: number, x: number) {
  const u = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return u * u * (3 - 2 * u);
}
function mixHex(a: string, b: string, t: number): string {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const r = Math.round(((pa >> 16) & 255) + (((pb >> 16) & 255) - ((pa >> 16) & 255)) * t);
  const g = Math.round(((pa >> 8) & 255) + (((pb >> 8) & 255) - ((pa >> 8) & 255)) * t);
  const bl = Math.round((pa & 255) + ((pb & 255) - (pa & 255)) * t);
  return `rgb(${r},${g},${bl})`;
}
// Continuous daylight 0..1 (0 = deep night, 1 = full midday) for a given hour.
function daylight(t: number): number {
  if (t < 5 || t >= 20.5) return 0;
  if (t < 7) return smoothstep(5, 7, t);        // dawn
  if (t < 18) return 1;                          // day
  return 1 - smoothstep(18, 20.5, t);            // dusk
}
// Golden-hour warmth 0..1 around sunrise/sunset.
function goldenHour(t: number): number {
  return Math.max(0, 1 - Math.abs(t - 6.3) / 1.6) + Math.max(0, 1 - Math.abs(t - 19) / 1.8);
}

export function CityWorld() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { muted, toggleMute, startBgm, bgmPlaying } = useAudio();
  const { theme, toggleTheme, reducedMotion } = useTheme();
  const { showGuide } = useGuide();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [careerXP, setCareerXP] = useState<Record<string, number>>({});
  const [careerStatus, setCareerStatus] = useState<Record<string, CareerStatus>>({});
  const [loading, setLoading] = useState(true);
  const [, setFrame] = useState(0);
  const [timeOfDay, setTimeOfDay] = useState(START_HOUR);
  const [nearbySlug, setNearbySlug] = useState<string | null>(null);
  const [nearMayor, setNearMayor] = useState(false);
  const [viewport, setViewport] = useState({ w: window.innerWidth, h: window.innerHeight });
  const [isMobile, setIsMobile] = useState(false);
  const [questSlug, setQuestSlug] = useState<string | null>(null);
  const [storyProgress, setStoryProgress] = useState<StoryProgress>({ started: 0, mastered: 0 });
  const [ready, setReady] = useState(false);
  const [dialogue, setDialogue] = useState<DialogueLine[] | null>(null);
  const [showIntro, setShowIntro] = useState(false);
  const [wallet, setWallet] = useState(() => loadWallet(user?.id || 'anon'));
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [quizOpen, setQuizOpen] = useState(false);
  const [quizFirst, setQuizFirst] = useState(false);
  const [showOutro, setShowOutro] = useState(false);

  const player = useRef({ x: SPAWN.x, y: SPAWN.y, vx: 0, vy: 0, dir: 'down' as 'up' | 'down' | 'left' | 'right', moving: false, energy: 100, phase: 0, z: 0, vz: 0 });
  const cam = useRef({ x: SPAWN.x - window.innerWidth / 2, y: SPAWN.y - window.innerHeight / 2 });
  const keys = useRef<Set<string>>(new Set());
  const npcs = useRef<NPC[]>([]);
  const cars = useRef<Car[]>([]);
  const dust = useRef<Dust[]>([]);
  const dustTimer = useRef(0);
  const touchVec = useRef({ x: 0, y: 0 });
  const raf = useRef<number>(0);
  const lastTs = useRef<number>(0);
  const nearbyRef = useRef<string | null>(null);
  const nearMayorRef = useRef(false);
  const dialogueOpenRef = useRef(false);
  const introOpenRef = useRef(false);
  const quizOpenRef = useRef(false);
  const outroOpenRef = useRef(false);
  const careerBySlug = useRef<Record<string, Career>>({});
  const seenRef = useRef(loadSeen('anon'));
  const walletRef = useRef(wallet);

  dialogueOpenRef.current = !!dialogue;
  introOpenRef.current = showIntro;
  quizOpenRef.current = quizOpen;
  outroOpenRef.current = showOutro;
  walletRef.current = wallet;

  // ---------------------------------------------------------------- data load
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    seenRef.current = loadSeen(user.id);

    (async () => {
      try {
        const [careersRes, profileRes, challengesRes, challengeProgressRes] = await Promise.all([
          supabase.from('careers').select('*').eq('is_active', true).order('order_index'),
          supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
          (supabase.from('challenges') as any).select('id, career_id, max_score'),
          (supabase.from('user_challenge_progress') as any).select('challenge_id, best_score').eq('user_id', user.id),
        ]);
        if (cancelled) return;

        const careerRows = (careersRes.data || []) as Career[];
        const bySlug: Record<string, Career> = {};
        careerRows.forEach(c => { bySlug[c.slug] = c; });
        careerBySlug.current = bySlug;

        if (profileRes.data) {
          const pData = profileRes.data as unknown as Profile;
          const now = new Date();
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          let diffDays = -1;
          if (pData.last_login_date) {
            const last = new Date(pData.last_login_date);
            const lastDay = new Date(last.getFullYear(), last.getMonth(), last.getDate());
            diffDays = Math.floor((today.getTime() - lastDay.getTime()) / 86400000);
          }
          if (diffDays !== 0) {
            const isNextDay = diffDays === 1;
            const newStreak = isNextDay ? (pData.current_streak || 0) + 1 : 1;
            const longest = Math.max(newStreak, pData.longest_streak || 0);
            const updates = {
              current_streak: newStreak, longest_streak: longest,
              last_login_date: new Date().toISOString(), total_score: (pData.total_score || 0) + 50,
            };
            // @ts-ignore
            await supabase.from('profiles').update(updates as Database['public']['Tables']['profiles']['Update']).eq('id', user.id);
            setProfile({ ...pData, ...updates } as Profile);
            showGuide(
              diffDays === -1
                ? "Welcome to Questford! Daily streak started  -  +50 coins! 🔥"
                : isNextDay ? `Day ${newStreak} streak! 🔥 +50 coins!` : `New streak started  -  +50 coins! 🔥`,
              'happy'
            );
          } else setProfile(pData);
        }

        const challenges = (challengesRes.data || []) as { id: string; career_id: string; max_score?: number }[];
        const cp = (challengeProgressRes.data || []) as { challenge_id: string; best_score: number }[];
        const chalToCareer: Record<string, string> = {};
        const maxPerCareer: Record<string, number> = {};
        challenges.forEach(c => {
          chalToCareer[c.id] = c.career_id;
          maxPerCareer[c.career_id] = (maxPerCareer[c.career_id] || 0) + (c.max_score || 100);
        });
        const xpMap: Record<string, number> = {};
        const startedPerCareer: Record<string, number> = {};
        cp.forEach(p => {
          const cid = chalToCareer[p.challenge_id];
          if (cid) { xpMap[cid] = (xpMap[cid] || 0) + p.best_score; startedPerCareer[cid] = (startedPerCareer[cid] || 0) + 1; }
        });
        setCareerXP(xpMap);

        const statusMap: Record<string, CareerStatus> = {};
        let started = 0, mastered = 0;
        careerRows.forEach(c => {
          const earned = xpMap[c.id] || 0;
          const maxPossible = maxPerCareer[c.id] || 1;
          const st = startedPerCareer[c.id] || 0;
          let status: CareerStatus;
          if ((c.slug === 'financial-services' && earned >= 270) || earned >= 0.8 * maxPossible) status = 'mastered';
          else if (st > 0) status = 'in_progress';
          else status = 'not_started';
          statusMap[c.id] = status;
          if (status !== 'not_started') started++;
          if (status === 'mastered') mastered++;
        });
        setCareerStatus(statusMap);
        setStoryProgress({ started, mastered });
        const nextCareer = careerRows.find(c => statusMap[c.id] !== 'mastered');
        setQuestSlug(nextCareer?.slug ?? null);
        setReady(true);
      } catch (e) {
        console.error('CityWorld load error', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user, showGuide]);

  // ----------------------------------------------------------- story triggers
  useEffect(() => {
    if (!ready || !user) return;
    const seen = seenRef.current;
    const p = storyProgress;
    if (p.mastered >= 8 && !seen.endingSeen) {
      setShowOutro(true); seen.endingSeen = true; saveSeen(user.id, seen); return;
    }
    if (!seen.introSeen) {
      setDialogue(CHAPTERS[0].intro); seen.introSeen = true;
      if (!seen.chaptersSeen.includes('arrival')) seen.chaptersSeen.push('arrival');
      saveSeen(user.id, seen); return;
    }
    const ch = currentChapter(p);
    if (!seen.chaptersSeen.includes(ch.id)) {
      setDialogue(ch.intro); seen.chaptersSeen.push(ch.id); saveSeen(user.id, seen);
    }
  }, [ready, storyProgress, user]);

  // seed path-following NPCs + traffic
  useEffect(() => {
    const tops = ['#f59e0b', '#3b82f6', '#ec4899', '#10b981', '#8b5cf6', '#ef4444', '#14b8a6', '#6366f1', '#e11d48'];
    const hairs = ['#3b2a1a', '#1f2937', '#92400e', '#0f172a', '#7c2d12', '#4b5563'];
    const skins = ['#f5c69b', '#e0a87e', '#c68642', '#8d5524', '#ffdbac'];
    const pants = ['#1f2937', '#334155', '#7c2d12', '#1e3a8a', '#3f3f46'];
    npcs.current = Array.from({ length: 10 }, (_, i) => {
      const pathIdx = i % NPC_PATHS.length;
      const dist = Math.random() * 1200;
      const s0 = samplePath(pathIdx, dist);
      return {
        pathIdx, dist, speed: 36 + Math.random() * 26,
        x: s0.x, y: s0.y, phase: Math.random() * 6, dir: s0.dir,
        palette: { top: tops[i % tops.length], hair: hairs[i % hairs.length], skin: skins[i % skins.length], pants: pants[i % pants.length], pack: '#64748b' },
      };
    });
    // a few cars per lane, staggered along the avenue
    cars.current = CAR_LANES.flatMap((l, i) => [0, 1].map(k => ({
      axis: l.axis, fixed: l.fixed, dir: l.dir, color: l.color, speed: l.speed,
      pos: (i * 220 + k * 1300 + Math.random() * 200) % (WORLD_W + 320) - 160,
    })));
  }, []);

  useEffect(() => {
    if (!bgmPlaying && !muted) {
      const handler = () => { startBgm(); document.removeEventListener('click', handler); };
      document.addEventListener('click', handler, { once: true });
      return () => document.removeEventListener('click', handler);
    }
  }, [bgmPlaying, muted, startBgm]);

  useEffect(() => {
    const onResize = () => {
      setViewport({ w: window.innerWidth, h: window.innerHeight });
      setIsMobile(window.innerWidth < 820 || 'ontouchstart' in window);
    };
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const enterNearby = useCallback(() => {
    if (nearbyRef.current) navigate(`/building/${nearbyRef.current}`);
  }, [navigate]);

  const talkToMayor = useCallback(() => {
    const ch = currentChapter(storyProgress);
    setDialogue(storyProgress.mastered >= 8 ? ENDING : ch.intro);
  }, [storyProgress]);

  // show the cinematic intro on a player's first ever visit; refresh wallet + quiz
  useEffect(() => {
    if (user) {
      setWallet(loadWallet(user.id));
      setQuizResult(loadQuiz(user.id));
      try { if (!localStorage.getItem(`questford_intro_${user.id}`)) setShowIntro(true); } catch { /* ignore */ }
    }
  }, [user]);

  const beginGame = useCallback(async (name: string) => {
    setShowIntro(false);
    if (!user) return;
    try { localStorage.setItem(`questford_intro_${user.id}`, '1'); } catch { /* ignore */ }
    if (!loadQuiz(user.id)) { setQuizFirst(true); setQuizOpen(true); }   // take the career quiz right after the intro
    const current = profile?.character_name || profile?.username || '';
    if (name && name !== current) {
      setProfile(pr => pr ? ({ ...pr, character_name: name }) : pr);
      try { await (supabase.from('profiles') as any).update({ character_name: name, updated_at: new Date().toISOString() }).eq('id', user.id); } catch { /* ignore */ }
    }
  }, [user, profile]);

  const onQuizResult = useCallback((r: QuizResult) => {
    setQuizResult(r);
    if (user) saveQuiz(user.id, r);
  }, [user]);

  // keyboard
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (dialogueOpenRef.current || introOpenRef.current || quizOpenRef.current || outroOpenRef.current) return; // modal owns the keyboard
      const k = e.key.toLowerCase();
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
      if (k === ' ') { const pl = player.current; if (pl.z <= 0.5) pl.vz = 360; return; } // jump
      if (k === 'e' || k === 'enter') { enterNearby(); return; }
      if (k === 't' && nearMayorRef.current) { talkToMayor(); return; }
      keys.current.add(k);
    };
    const up = (e: KeyboardEvent) => keys.current.delete(e.key.toLowerCase());
    const clearKeys = () => { keys.current.clear(); };
    const onVis = () => { if (document.visibilityState === 'hidden') keys.current.clear(); };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', clearKeys);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', clearKeys);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [enterNearby, talkToMayor]);

  // ---------------------------------------------------------------- game loop
  useEffect(() => {
    if (loading) return;
    const step = (ts: number) => {
      const dt = lastTs.current ? Math.min((ts - lastTs.current) / 1000, 0.05) : 0;
      lastTs.current = ts;
      const p = player.current;

      // input → target velocity
      let ix = 0, iy = 0;
      if (!dialogueOpenRef.current && !introOpenRef.current && !quizOpenRef.current && !outroOpenRef.current) {
        const k = keys.current;
        ix = (k.has('d') || k.has('arrowright') ? 1 : 0) - (k.has('a') || k.has('arrowleft') ? 1 : 0) + touchVec.current.x;
        iy = (k.has('s') || k.has('arrowdown') ? 1 : 0) - (k.has('w') || k.has('arrowup') ? 1 : 0) + touchVec.current.y;
      }
      const il = Math.hypot(ix, iy);
      const sprint = keys.current.has('shift') ? SPRINT_MULT : 1;
      const gymBoost = 1 + walletRef.current.speedLvl * 0.16;   // gym sprint upgrades
      const baseMaxSpeed = reducedMotion ? MAX_SPEED : 400;
      const maxSpd = baseMaxSpeed * gymBoost;
      let tx = 0, ty = 0;
      if (il > 0.01) { tx = (ix / il) * maxSpd * sprint; ty = (iy / il) * maxSpd * sprint; }
      const smooth = 1 - Math.exp(-ACCEL_K * dt);
      p.vx += (tx - p.vx) * smooth;
      p.vy += (ty - p.vy) * smooth;

      // integrate with axis-separated collision
      const nx = p.x + p.vx * dt;
      const ny = p.y + p.vy * dt;
      if (!hitsSolid(nx, p.y)) p.x = Math.max(76, Math.min(WORLD_W - 76, nx)); else p.vx = 0;
      if (!hitsSolid(p.x, ny)) p.y = Math.max(86, Math.min(WORLD_H - 76, ny)); else p.vy = 0;

      const speed = Math.hypot(p.vx, p.vy);
      p.moving = speed > 12;
      if (p.moving) {
        p.dir = Math.abs(p.vx) > Math.abs(p.vy) ? (p.vx > 0 ? 'right' : 'left') : (p.vy > 0 ? 'down' : 'up');
        p.phase += (speed / MAX_SPEED) * dt * 12;
        p.energy = Math.max(0, p.energy - dt * 2);
        // footstep dust
        dustTimer.current -= dt;
        if (dustTimer.current <= 0 && speed > 60) {
          dustTimer.current = 0.12;
          dust.current.push({ x: p.x + (Math.random() - 0.5) * 8, y: p.y + 16, life: 0, max: 0.5, size: 4 + Math.random() * 4 });
          if (dust.current.length > 30) dust.current.shift();
        }
      } else {
        const nearFountain = Math.hypot(p.x - FOUNTAIN.x, p.y - FOUNTAIN.y) < 240;
        p.energy = Math.min(walletRef.current.energyMax, p.energy + dt * (nearFountain ? 9 : 3.5));
      }

      // jump physics (gravity)
      p.vz -= 1500 * dt;
      p.z += p.vz * dt;
      if (p.z < 0) { p.z = 0; p.vz = 0; }

      // dust update
      for (let i = dust.current.length - 1; i >= 0; i--) {
        const d = dust.current[i];
        d.life += dt; d.y -= dt * 10;
        if (d.life >= d.max) dust.current.splice(i, 1);
      }

      // camera easing
      const camSmooth = 1 - Math.exp(-8 * dt);
      const targetCamX = Math.max(0, Math.min(WORLD_W - viewport.w, p.x - viewport.w / 2));
      const targetCamY = Math.max(0, Math.min(WORLD_H - viewport.h, p.y - viewport.h / 2));
      cam.current.x += (targetCamX - cam.current.x) * camSmooth;
      cam.current.y += (targetCamY - cam.current.y) * camSmooth;

      // nearest door (career sims + amenity shops)
      let near: string | null = null, bestD = DOOR_RADIUS;
      for (const b of ENTERABLE) {
        const d = doorPoint(b);
        const dd = Math.hypot(p.x - d.x, p.y - d.y);
        if (dd < bestD) { bestD = dd; near = b.slug; }
      }
      if (near !== nearbyRef.current) { nearbyRef.current = near; setNearbySlug(near); }
      const nm = Math.hypot(p.x - MAYOR.x, p.y - MAYOR.y) < TALK_RADIUS;
      if (nm !== nearMayorRef.current) { nearMayorRef.current = nm; setNearMayor(nm); }

      // npcs follow their sidewalk loops
      for (const n of npcs.current) {
        n.dist += n.speed * dt;
        const s = samplePath(n.pathIdx, n.dist);
        n.x = s.x; n.y = s.y; n.dir = s.dir;
        n.phase += dt * 9;
      }

      // cars drive the avenues and wrap around
      for (const c of cars.current) {
        c.pos += c.dir * c.speed * dt;
        if (c.dir > 0 && c.pos > WORLD_W + 180) c.pos = -180;
        else if (c.dir < 0 && c.pos < -180) c.pos = WORLD_W + 180;
      }

      setFrame(f => (f + 1) % 1000000);
      raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [loading, viewport.w, viewport.h, reducedMotion]);

  // clock  -  uses the player's REAL local time (so Questford's day matches your
  // day). The displayed minute only changes once per real minute.
  useEffect(() => {
    const tick = () => { const n = new Date(); setTimeOfDay(n.getHours() + n.getMinutes() / 60); };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#0b1220' }} />
    );
  }

  const day = daylight(timeOfDay);       // 0..1 continuous
  const gold = Math.min(1, goldenHour(timeOfDay));
  const isNight = day < 0.35;
  const lightsOn = day < 0.55;            // windows + streetlights warm up at dusk
  const glow = 1 - day;                   // how strongly lamps/windows pool light
  const nightAlpha = (1 - day) * 0.6;     // deep-blue darkness
  const goldAlpha = gold * 0.32;          // warm sunrise/sunset wash
  const skyTop = mixHex('#0b1024', '#cdeefd', day);
  const skyBottom = mixHex('#070b1a', '#bfe3c9', day);

  const p = player.current;
  const fmtClock = () => {
    const h = Math.floor(timeOfDay); const m = Math.floor((timeOfDay - h) * 60);
    const ampm = h < 12 ? 'AM' : 'PM'; const hh = h % 12 === 0 ? 12 : h % 12;
    return `${hh}:${m.toString().padStart(2, '0')} ${ampm}`;
  };
  const nearbyBuilding = nearbySlug ? ENTERABLE.find(b => b.slug === nearbySlug) : null;
  const nearbyCareer = nearbySlug ? careerBySlug.current[nearbySlug] : null;
  const level = Math.floor((profile?.total_score || 0) / 100) + 1;
  const chapter = currentChapter(storyProgress);
  const chapterPct = Math.round(chapter.progress(storyProgress) * 100);

  // per-domain skill levels (real progress) for the Career Compass results
  const skills: Record<string, { xp: number; status: CareerStatus }> = {};
  for (const b of BUILDINGS) {
    const c = careerBySlug.current[b.slug];
    skills[b.slug] = { xp: c ? (careerXP[c.id] || 0) : 0, status: c ? (careerStatus[c.id] || 'not_started') : 'not_started' };
  }
  // the player's "standout path" for the finale  -  their quiz top pick, else a mastered field
  const topName = (quizResult && QUIZ_DOMAINS[quizResult.top]?.name)
    || (BUILDINGS.map(b => careerBySlug.current[b.slug]).find(c => c && careerStatus[c.id] === 'mastered')?.name)
    || 'your calling';

  // off-screen direction arrow to the current quest building
  let questArrow: { ax: number; ay: number; ang: number; name: string } | null = null;
  if (questSlug) {
    const qb = BUILDINGS.find(b => b.slug === questSlug);
    if (qb) {
      const d = doorPoint(qb);
      const sx = d.x - cam.current.x, sy = d.y - cam.current.y;
      const onScreen = sx > 60 && sx < viewport.w - 60 && sy > 110 && sy < viewport.h - 60;
      if (!onScreen) {
        const cx = viewport.w / 2, cy = viewport.h / 2;
        const ang = Math.atan2(sy - cy, sx - cx);
        const rad = Math.min(viewport.w, viewport.h) / 2 - 84;
        questArrow = { ax: cx + Math.cos(ang) * rad, ay: cy + Math.sin(ang) * rad, ang, name: careerBySlug.current[questSlug]?.name || qb.label };
      }
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="fixed inset-0 overflow-hidden select-none"
      style={{ background: skyBottom }}
    >
      {/* sky tint that shifts smoothly with the in-game clock */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse at 50% -10%, ${skyTop}, ${skyBottom} 70%)` }} />

      {/* WORLD */}
      <div className="absolute will-change-transform" style={{ width: WORLD_W, height: WORLD_H, transform: `translate3d(${-cam.current.x}px, ${-cam.current.y}px, 0)` }}>
        <StaticCity lightsOn={lightsOn} careerStatus={careerStatus} careerXP={careerXP} careerBySlug={careerBySlug.current} questSlug={questSlug} nearbySlug={nearbySlug} />

        {/* fountain spray (CSS-animated droplets)  -  sits at fountain depth */}
        <div className="absolute pointer-events-none" style={{ left: FOUNTAIN.x, top: FOUNTAIN.y - 10, zIndex: Math.round(FOUNTAIN.y) }}>
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="absolute rounded-full" style={{
              width: 6, height: 6, background: 'rgba(219,234,254,0.95)',
              left: (i - 4) * 6, animation: `qf-water 1.1s ease-out ${i * 0.11}s infinite`,
            }} />
          ))}
        </div>

        {/* Coordinator Vale (Y-sorted, drawn) */}
        <div className="absolute" style={{ left: MAYOR.x, top: MAYOR.y, width: 0, height: 0, zIndex: Math.round(MAYOR.y) }}>
          <div className="absolute left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-md bg-amber-500 text-slate-900 text-[10px] font-black whitespace-nowrap shadow" style={{ top: -62 }}>Coordinator Vale</div>
          <div className="absolute left-1/2 -translate-x-1/2 rounded-full bg-black/30 blur-sm" style={{ width: 26, height: 8, top: 12 }} />
          <div className="absolute qf-bob" style={{ left: -23, top: -48 }}>
            <CharacterSprite w={46} dir="down" phase={0} moving={false} palette={VALE_PALETTE} />
          </div>
          {nearMayor && <div className="absolute left-1/2 -translate-x-1/2 text-2xl animate-bounce" style={{ top: -78 }}>💬</div>}
        </div>

        {/* footstep dust */}
        {dust.current.map((d, i) => (
          <div key={i} className="absolute rounded-full bg-white" style={{ left: d.x, top: d.y, width: d.size, height: d.size, opacity: (1 - d.life / d.max) * 0.45, zIndex: Math.round(d.y) }} />
        ))}

        {/* traffic (Y-sorted with the world) */}
        {cars.current.map((c, i) => (
          <div key={`car${i}`} className="absolute" style={{ left: c.pos - 48, top: c.fixed - 23, zIndex: Math.round(c.fixed), transform: c.dir < 0 ? 'scaleX(-1)' : undefined }}>
            <CarSprite color={c.color} w={96} />
          </div>
        ))}

        {/* NPCs (Y-sorted little townsfolk) */}
        {npcs.current.map((n, i) => (
          <Townsperson key={i} x={n.x} y={n.y} palette={n.palette} phase={n.phase} dir={n.dir} z={Math.round(n.y)} />
        ))}

        {/* PLAYER (Y-sorted: walks behind/in front of trees & buildings) */}
        <Player x={p.x} y={p.y} dir={p.dir} moving={p.moving} phase={p.phase} jump={p.z} z={Math.round(p.y)} palette={paletteFromWallet(wallet)} name={profile?.character_name || profile?.username || 'You'} />

        {/* ===== sky-high lighting layers (above all actors) ===== */}
        {/* deep-blue night darkness */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: `rgba(10,14,46,${nightAlpha})`, zIndex: 100000 }} />
        {/* warm golden-hour wash */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: `rgba(255,150,60,${goldAlpha})`, mixBlendMode: 'soft-light', zIndex: 100000 }} />

        {/* pools of warm light from lamps + doorways (additive) */}
        {glow > 0.04 && (
          <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 100001, mixBlendMode: 'screen' }}>
            {LIGHTS.map((l, i) => (
              <div key={`L${i}`} className="absolute rounded-full" style={{
                left: l.x - 120, top: l.y - 110, width: 240, height: 240,
                background: 'radial-gradient(circle, rgba(255,224,138,0.9), rgba(255,224,138,0) 65%)', opacity: glow,
              }} />
            ))}
            {BUILDINGS.map(b => {
              const d = doorPoint(b);
              return <div key={`D${b.slug}`} className="absolute rounded-full" style={{
                left: d.x - 80, top: d.y - 70, width: 160, height: 150,
                background: 'radial-gradient(circle, rgba(255,213,128,0.85), rgba(255,213,128,0) 68%)', opacity: glow * 0.9,
              }} />;
            })}
          </div>
        )}

        {/* fireflies at night */}
        {isNight && (
          <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 100002 }}>
            {FIREFLIES.map((f, i) => (
              <div key={i} className="absolute rounded-full qf-firefly" style={{ left: f.x, top: f.y, width: 5, height: 5, background: '#fde68a', boxShadow: '0 0 8px 3px rgba(253,224,71,0.7)', animationDelay: `${f.d}s` }} />
            ))}
          </div>
        )}

        {/* daytime drifting petals/leaves */}
        {day > 0.45 && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 100002 }}>
            {PETALS.map((pt, i) => (
              <div key={i} className="absolute rounded-full qf-bob" style={{
                top: pt.y, left: -40, width: pt.s, height: pt.s, background: pt.c, opacity: 0.7,
                animation: `qf-drift ${pt.dur}s linear ${pt.delay}s infinite`,
              }} />
            ))}
          </div>
        )}
      </div>

      {/* edge vignette */}
      <div className="absolute inset-0 pointer-events-none" style={{ boxShadow: 'inset 0 0 220px rgba(0,0,0,0.45)' }} />

      {/* ===== HUD ===== */}
      <TopBar profile={profile} level={level} clock={fmtClock()} isNight={isNight} energy={Math.round(p.energy / wallet.energyMax * 100)} coins={wallet.coins}
        muted={muted} theme={theme}
        onLeaderboard={() => navigate('/leaderboard')} onProfile={() => navigate('/profile')}
        onMute={toggleMute} onTheme={toggleTheme} onClassicMap={() => navigate('/map')} onSignOut={signOut}
        onCompass={() => { setQuizFirst(false); setQuizOpen(true); }} />

      {/* Chapter / objective tracker */}
      <div className="absolute left-4 top-[4.5rem] z-40 w-72 max-w-[80vw] rounded-2xl border shadow-xl backdrop-blur-md p-4"
        style={{ background: 'rgba(15,23,42,0.84)', borderColor: 'rgba(250,204,21,0.45)' }}>
        <div className="flex items-center gap-2 mb-1">
          <Navigation className="w-4 h-4 text-amber-400" />
          <span className="text-amber-300 text-[11px] font-black uppercase tracking-widest">{chapter.title}</span>
        </div>
        <p className="text-white font-bold text-sm leading-snug">{chapter.objective}</p>
        <div className="mt-2 h-2 rounded-full bg-white/15 overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${chapterPct}%`, background: 'linear-gradient(90deg,#f59e0b,#fde68a)' }} />
        </div>
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-slate-400 text-[11px]">🏆 {storyProgress.mastered}/8 trades mastered</span>
          <button onClick={talkToMayor} className="text-amber-300 text-[11px] font-bold hover:text-amber-100 flex items-center gap-1">
            <MessageCircle className="w-3 h-3" /> Story
          </button>
        </div>
      </div>

      {/* Minimap */}
      <Minimap playerX={p.x} playerY={p.y} questSlug={questSlug} careerStatus={careerStatus} careerBySlug={careerBySlug.current} />

      {/* quest direction arrow (points to the next internship when off-screen) */}
      {questArrow && (
        <div className="absolute z-30 pointer-events-none flex flex-col items-center" style={{ left: questArrow.ax, top: questArrow.ay, transform: 'translate(-50%,-50%)' }}>
          <div style={{ transform: `rotate(${questArrow.ang}rad)` }}>
            <div className="text-3xl" style={{ filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.5))' }}>➤</div>
          </div>
          <div className="mt-1 px-2 py-0.5 rounded-full text-[10px] font-black text-slate-900 whitespace-nowrap shadow" style={{ background: '#fbbf24' }}>{questArrow.name}</div>
        </div>
      )}

      {/* Interaction prompt: door */}
      {nearbyBuilding && !nearMayor && (
        <div className="absolute left-1/2 -translate-x-1/2 bottom-28 sm:bottom-24 z-40 animate-fade-in">
          <button onClick={enterNearby}
            className="flex items-center gap-3 px-6 py-4 rounded-2xl border-2 shadow-2xl hover:scale-105 active:scale-95 transition-transform"
            style={{ background: 'rgba(15,23,42,0.92)', borderColor: nearbyBuilding.color }}>
            <span className="text-3xl">{nearbyBuilding.emoji}</span>
            <div className="text-left">
              <div className="text-white font-black text-lg leading-tight">{nearbyCareer?.name || nearbyBuilding.label}</div>
              <div className="text-slate-300 text-xs">{nearbyBuilding.blurb}</div>
            </div>
            <span className="ml-2 px-3 py-2 rounded-xl bg-white text-slate-900 font-black text-sm">Press E</span>
          </button>
        </div>
      )}
      {/* Interaction prompt: mayor */}
      {nearMayor && (
        <div className="absolute left-1/2 -translate-x-1/2 bottom-28 sm:bottom-24 z-40 animate-fade-in">
          <button onClick={talkToMayor}
            className="flex items-center gap-3 px-6 py-4 rounded-2xl border-2 border-amber-400 shadow-2xl hover:scale-105 active:scale-95 transition-transform"
            style={{ background: 'rgba(15,23,42,0.92)' }}>
            <span className="text-3xl">{MAYOR.emoji}</span>
            <div className="text-left">
              <div className="text-white font-black text-lg leading-tight">Coordinator Vale</div>
              <div className="text-slate-300 text-xs">Ask about your internships</div>
            </div>
            <span className="ml-2 px-3 py-2 rounded-xl bg-amber-400 text-slate-900 font-black text-sm">Press T</span>
          </button>
        </div>
      )}

      {isMobile && <MobileControls onVec={(x, y) => { touchVec.current = { x, y }; }} onInteract={nearMayor ? talkToMayor : enterNearby} canInteract={!!nearbyBuilding || nearMayor} label={nearMayor ? 'T' : 'E'} />}
      {!isMobile && (
        <div className="absolute right-4 bottom-4 z-30 text-[11px] text-white/70 bg-black/40 rounded-lg px-3 py-2 backdrop-blur">
          <span className="font-bold">WASD</span> move · <span className="font-bold">Shift</span> sprint · <span className="font-bold">Space</span> jump · <span className="font-bold">E</span> enter · <span className="font-bold">T</span> talk
        </div>
      )}

      {dialogue && <DialogueBox lines={dialogue} onClose={() => setDialogue(null)} />}
      {showIntro && <IntroScreen defaultName={profile?.character_name || profile?.username || 'Intern'} onBegin={beginGame} />}
      {quizOpen && (
        <CareerQuiz
          existing={quizFirst ? null : quizResult}
          skills={skills}
          firstTime={quizFirst}
          onResult={onQuizResult}
          onClose={() => { setQuizOpen(false); setQuizFirst(false); }}
          onStartHere={() => { setQuizOpen(false); setQuizFirst(false); }}
        />
      )}
      {showOutro && (
        <Outro
          name={profile?.character_name || profile?.username || 'Champion'}
          topName={topName}
          palette={paletteFromWallet(wallet)}
          onClose={() => setShowOutro(false)}
        />
      )}
    </motion.div>
  );
}

/* ======================= static city (memoized) ======================= */
const FIREFLIES = Array.from({ length: 22 }, () => ({ x: 200 + Math.random() * 2400, y: 600 + Math.random() * 1040, d: Math.random() * 3 }));
const CLOUDS = [{ y: 300, s: 1, dur: 70, o: 0.5 }, { y: 1300, s: 1.4, dur: 95, o: 0.4 }, { y: 820, s: 0.8, dur: 60, o: 0.35 }];
const PETALS = Array.from({ length: 14 }, () => ({
  y: 80 + Math.random() * (WORLD_H - 200), s: 6 + Math.random() * 5,
  c: ['#fbcfe8', '#fde68a', '#bbf7d0', '#fecaca'][Math.floor(Math.random() * 4)],
  dur: 36 + Math.random() * 28, delay: Math.random() * 20,
}));
// organic grass patches for a non-flat ground
const GRASS_PATCHES = Array.from({ length: 26 }, () => ({
  x: Math.random() * WORLD_W, y: Math.random() * WORLD_H,
  r: 90 + Math.random() * 160, light: Math.random() > 0.5,
}));

interface StaticProps {
  lightsOn: boolean;
  careerStatus: Record<string, CareerStatus>; careerXP: Record<string, number>;
  careerBySlug: Record<string, Career>; questSlug: string | null; nearbySlug: string | null;
}
const StaticCity = memo(function StaticCity({ lightsOn, careerStatus, careerXP, careerBySlug, questSlug, nearbySlug }: StaticProps) {
  return (
    <>
      {/* grass base */}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(160deg,#5bb36a 0%,#54ad64 45%,#46a056 100%)' }} />
      {/* organic light/dark grass patches */}
      {GRASS_PATCHES.map((g, i) => (
        <div key={i} className="absolute rounded-full" style={{
          left: g.x - g.r / 2, top: g.y - g.r / 2, width: g.r, height: g.r * 0.7,
          background: g.light ? 'radial-gradient(circle, rgba(150,220,140,0.5), transparent 70%)' : 'radial-gradient(circle, rgba(40,110,60,0.4), transparent 70%)',
        }} />
      ))}
      {/* blade speckle + subtle tile seams */}
      <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.06) 1px, transparent 0)', backgroundSize: '22px 22px' }} />
      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(rgba(0,0,0,0.05) 1px,transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px)', backgroundSize: '64px 64px' }} />

      {/* lusher green park bands between the avenues */}
      {PARK_BANDS.map((p, i) => (
        <div key={`pb${i}`} className="absolute" style={{ left: p.x, top: p.y, width: p.w, height: p.h, background: 'radial-gradient(ellipse at 50% 50%, rgba(120,205,128,0.4), rgba(90,180,104,0.15) 70%, transparent)' }} />
      ))}

      {/* drifting cloud shadows */}
      {CLOUDS.map((c, i) => (
        <div key={i} className="absolute rounded-full" style={{ top: c.y, left: 0, width: 220 * c.s, height: 120 * c.s, background: `rgba(0,0,0,${c.o * 0.12})`, filter: 'blur(24px)', animation: `qf-drift ${c.dur}s linear infinite` }} />
      ))}

      {/* pedestrian cross-lanes (paved strips running north–south) */}
      {VPATHS.map((vx, i) => (
        <div key={`vp${i}`} className="absolute" style={{ left: vx - VPATH_W / 2, top: 120, width: VPATH_W, height: WORLD_H - 240, background: 'linear-gradient(90deg,#cfc9b8,#dcd6c4,#cfc9b8)' }}>
          <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(0,0,0,0.06) 2px, transparent 2px)', backgroundSize: '100% 30px' }} />
        </div>
      ))}

      {/* central fountain plaza */}
      <div className="absolute rounded-3xl overflow-hidden" style={{ left: PARK.x, top: PARK.y, width: PARK.w, height: PARK.h, background: 'linear-gradient(180deg,#dcd6c4,#cdc6b0)', boxShadow: 'inset 0 0 70px rgba(0,0,0,0.16)' }}>
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 14px 14px, rgba(0,0,0,0.07) 2px, transparent 3px)', backgroundSize: '34px 34px' }} />
        <div className="absolute inset-2 rounded-2xl" style={{ border: '3px solid rgba(255,255,255,0.25)' }} />
      </div>

      {/* avenues (full-width streets with sidewalks + lane markings) */}
      {AVENUES.map((y, i) => (
        <div key={`av${i}`} className="absolute" style={{ left: 0, top: y - ROAD_W / 2, width: WORLD_W, height: ROAD_W }}>
          <div className="absolute inset-x-0 top-0" style={{ height: 14, background: '#c3ccd6' }} />
          <div className="absolute inset-x-0 bottom-0" style={{ height: 14, background: '#c3ccd6' }} />
          <div className="absolute inset-x-0" style={{ top: 14, bottom: 14, background: 'linear-gradient(180deg,#646d7c,#5b6472)' }}>
            <div className="absolute top-1/2 -translate-y-1/2 inset-x-0 h-1.5" style={{ background: 'repeating-linear-gradient(90deg,#fbbf24 0 30px,transparent 30px 60px)' }} />
          </div>
        </div>
      ))}

      {/* zebra crosswalks where the cross-lanes meet the avenues */}
      {AVENUES.flatMap(ay => VPATHS.map(vx => (
        <div key={`cw${vx}-${ay}`} className="absolute" style={{ left: vx - VPATH_W / 2, top: ay - ROAD_W / 2 + 14, width: VPATH_W, height: ROAD_W - 28 }}>
          {[0, 1, 2, 3].map(s => <div key={s} className="absolute rounded-sm" style={{ left: s * 22 + 4, top: 0, width: 12, height: '100%', background: 'rgba(255,255,255,0.75)' }} />)}
        </div>
      )))}

      {/* fountain (Y-sorted) */}
      <div className="absolute" style={{ left: FOUNTAIN.x - 90, top: FOUNTAIN.y - 96, zIndex: Math.round(FOUNTAIN.y) }}>
        <FountainSprite />
      </div>

      {/* flowerbeds (flat) */}
      {FLOWERBEDS.map((f, i) => <Flowerbed key={`f${i}`} x={f.x} y={f.y} c={f.c} />)}

      {/* benches */}
      {BENCHES.map((b, i) => (
        <div key={`be${i}`} className="absolute" style={{ left: b.x - 37, top: b.y - 22, transform: `scaleX(${b.flip ? -1 : 1})`, zIndex: Math.round(b.y + 22) }}><BenchSprite /></div>
      ))}

      {/* market stalls */}
      {STALLS.map((s, i) => (
        <div key={`s${i}`} className="absolute" style={{ left: s.x - 43, top: s.y - 50, zIndex: Math.round(s.y + 30) }}><StallSprite c={s.c} /></div>
      ))}

      {/* signpost */}
      <Signpost x={SIGNPOST.x} y={SIGNPOST.y} />

      {/* bushes */}
      {BUSHES.map((b, i) => (
        <div key={`b${i}`} className="absolute" style={{ left: b.x - 35 * b.s, top: b.y - 30 * b.s, zIndex: Math.round(b.y + 16) }}><BushSprite s={b.s} /></div>
      ))}

      {/* trees (Y-sorted) */}
      {TREES.map((t, i) => (
        <div key={`t${i}`} className="absolute" style={{ left: t.x - 46 * t.s, top: t.y - 60 * t.s, zIndex: Math.round(t.y + 40) }}><TreeSprite s={t.s} /></div>
      ))}

      {/* streetlights (Y-sorted) */}
      {LIGHTS.map((l, i) => (
        <div key={i} className="absolute" style={{ left: l.x - 20, top: l.y - 70, zIndex: Math.round(l.y + 14) }}><LampSprite on={lightsOn} /></div>
      ))}

      {/* filler buildings (non-interactive streetscape, Y-sorted) */}
      {FILLERS.map((b, i) => (
        <div key={`fill${i}`} style={{ position: 'absolute', zIndex: Math.round(b.y + b.h) }}>
          <BuildingSprite def={b} lightsOn={lightsOn} isNear={false} mastered={false} />
        </div>
      ))}

      {/* career buildings (Y-sorted) */}
      {BUILDINGS.map(b => {
        const career = careerBySlug[b.slug];
        const status: CareerStatus = career ? (careerStatus[career.id] || 'not_started') : 'not_started';
        const xp = career ? (careerXP[career.id] || 0) : 0;
        return <Building key={b.slug} def={b} name={career?.name || b.label} status={status} xp={xp}
          lightsOn={lightsOn} isQuest={questSlug === b.slug} isNear={nearbySlug === b.slug} icon={career?.icon} />;
      })}

      {/* amenity buildings (market / shop / gym) */}
      {AMENITIES.map(b => {
        const foot = Math.round(b.y + b.h);
        const Icon = (LucideIcons[AMENITY_ICON[b.slug] as keyof typeof LucideIcons] as LucideIcon) || null;
        return (
          <div key={b.slug}>
            <div style={{ position: 'absolute', zIndex: foot }}>
              <BuildingSprite def={b} lightsOn={lightsOn} isNear={nearbySlug === b.slug} mastered={false} />
            </div>
            <div className="absolute -translate-x-1/2 flex items-center gap-1.5 px-2.5 py-1 rounded-xl shadow-lg"
              style={{ left: b.x + b.w / 2, top: b.y + b.h + 8, zIndex: foot + 3, background: 'linear-gradient(180deg,#3b3450,#272234)', border: '2px solid rgba(255,255,255,0.2)' }}>
              {Icon && <Icon className="w-4 h-4" style={{ color: b.awning }} />}
              <span className="text-white font-black text-[11px] tracking-wide whitespace-nowrap" style={{ fontFamily: "'Righteous', cursive" }}>{b.label}</span>
            </div>
          </div>
        );
      })}
    </>
  );
});

/* ============================= props ============================= */
function Flowerbed({ x, y, c }: { x: number; y: number; c: string }) {
  return (
    <div className="absolute" style={{ left: x - 34, top: y - 14, width: 68, height: 28, zIndex: 2 }}>
      <div className="absolute inset-0 rounded-full" style={{ background: 'linear-gradient(180deg,#6b4423,#4b3115)', boxShadow: 'inset 0 0 8px rgba(0,0,0,0.45)', border: '2px solid #3a2510' }} />
      {[8, 24, 40, 54].map((dx, i) => (
        <div key={i} className="absolute rounded-full" style={{ left: dx, top: 5 + (i % 2) * 7, width: 10, height: 10, background: c, boxShadow: `0 0 0 2px rgba(0,0,0,0.25)` }}>
          <div className="absolute rounded-full bg-yellow-200" style={{ inset: '35%' }} />
        </div>
      ))}
    </div>
  );
}
function Signpost({ x, y }: { x: number; y: number }) {
  return (
    <div className="absolute" style={{ left: x - 4, top: y - 50, zIndex: Math.round(y + 28) }}>
      <div className="absolute left-1/2 -translate-x-1/2 rounded-full bg-black/25 blur-sm" style={{ width: 18, height: 6, top: 52 }} />
      <div style={{ width: 8, height: 56, background: 'linear-gradient(90deg,#6b4423,#8a5a2b,#6b4423)', borderRadius: 3, border: '1px solid #4b3115' }} />
      <div className="absolute rounded-sm px-1 text-[8px] font-black text-white flex items-center justify-center shadow" style={{ top: 6, left: -22, width: 44, height: 13, background: '#0891b2', border: '1px solid #06506b', clipPath: 'polygon(0 0, 88% 0, 100% 50%, 88% 100%, 0 100%)' }}>PLAZA</div>
      <div className="absolute rounded-sm px-1 text-[8px] font-black text-white flex items-center justify-center shadow" style={{ top: 22, left: 6, width: 44, height: 13, background: '#16a34a', border: '1px solid #0c6e34', clipPath: 'polygon(12% 0, 100% 0, 100% 100%, 12% 100%, 0 50%)' }}>SHOPS</div>
    </div>
  );
}

/* ============================= building ============================= */
function Building({ def, name, status, xp, lightsOn, isQuest, isNear, icon }: {
  def: BuildingDef; name: string; status: CareerStatus; xp: number; lightsOn: boolean; isQuest: boolean; isNear: boolean; icon?: string;
}) {
  const door = doorPoint(def);
  const mastered = status === 'mastered';
  const inProgress = status === 'in_progress';
  const foot = Math.round(def.y + def.h);
  const Icon = (icon && (LucideIcons[icon as keyof typeof LucideIcons] as LucideIcon)) || null;
  const signTop = def.doorSide === 'bottom' ? def.y + def.h + 8 : def.y - 60;
  return (
    <>
      {/* quest beacon */}
      {isQuest && !mastered && (
        <div className="absolute pointer-events-none qf-bob" style={{ left: def.x + def.w / 2 - 17, top: def.y - 84, zIndex: foot + 4 }}>
          <PinSprite />
        </div>
      )}

      {/* drawn building */}
      <div style={{ position: 'absolute', zIndex: foot }}>
        <BuildingSprite def={def} lightsOn={lightsOn} isNear={isNear} mastered={mastered} />
      </div>

      {/* hanging signboard with the career icon + name */}
      <div className="absolute -translate-x-1/2 flex items-center gap-1.5 px-2.5 py-1 rounded-xl shadow-lg"
        style={{ left: door.x, top: signTop, zIndex: foot + 3, background: 'linear-gradient(180deg,#3b3450,#272234)', border: '2px solid rgba(255,255,255,0.2)' }}>
        {Icon && <Icon className="w-4 h-4" style={{ color: def.awning }} />}
        <span className="text-white font-black text-[11px] tracking-wide whitespace-nowrap" style={{ fontFamily: "'Righteous', cursive" }}>{name}</span>
      </div>

      {/* status pill */}
      <div className="absolute -translate-x-1/2 text-[9px] font-black px-2 py-0.5 rounded-full text-white whitespace-nowrap shadow"
        style={{ left: door.x, top: signTop + 26, zIndex: foot + 3, background: mastered ? '#ca8a04' : inProgress ? '#059669' : 'rgba(30,41,59,0.85)' }}>
        {mastered ? '★ MASTERED' : `${xp} XP`}
      </div>
    </>
  );
}

/* ============================== player ============================== */
function Player({ x, y, dir, moving, phase, z, jump, palette, name }: { x: number; y: number; dir: string; moving: boolean; phase: number; z: number; jump: number; palette: Palette; name: string }) {
  const bob = moving ? Math.abs(Math.sin(phase)) * 3 : 0;
  const flip = dir === 'left' ? -1 : 1;
  const lift = jump + bob;                 // total vertical offset
  const shadow = Math.max(12, 40 - jump * 0.45);
  return (
    <div className="absolute" style={{ left: x, top: y, width: 0, height: 0, zIndex: z }}>
      {/* Golden pulsing beacon under player's feet */}
      <div className="absolute left-1/2 -translate-x-1/2 rounded-full border-2 border-amber-400/80 bg-amber-400/10 shadow-[0_0_8px_#f59e0b]" style={{ width: 42, height: 12, top: 13 }} />
      <div className="absolute left-1/2 -translate-x-1/2 rounded-full border-2 border-amber-400/60 animate-ping pointer-events-none" style={{ width: 42, height: 12, top: 13, animationDuration: '2.5s' }} />

      {/* Classic shadow */}
      <div className="absolute left-1/2 -translate-x-1/2 rounded-full bg-black/35 blur-[2px]" style={{ width: shadow, height: 9, top: 14 }} />

      {/* Glowing pointer arrow above player name */}
      <div className="absolute left-1/2 -translate-x-1/2 pointer-events-none" style={{ top: -109 - jump }}>
        <svg className="w-4 h-4 text-amber-400 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] animate-bounce" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 16l-6-6h12z" />
        </svg>
      </div>

      {/* High-visibility name tag */}
      <div className="absolute left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-md bg-gradient-to-r from-amber-500 to-yellow-500 border border-amber-300 text-slate-900 text-[10px] font-extrabold whitespace-nowrap shadow-[0_2px_6px_rgba(0,0,0,0.4)]" style={{ top: -93 - jump }}>
        {name}
      </div>

      <div className="absolute" style={{ left: -32, top: -75, transform: `scaleX(${flip}) translateY(${-lift}px)` }}>
        <CharacterSprite w={64} dir={dir} phase={phase} moving={moving} palette={palette} hat />
      </div>
    </div>
  );
}

/* ===================== townsperson (drawn NPC) ===================== */
function Townsperson({ x, y, palette, phase, dir, z }: {
  x: number; y: number; palette: Palette; phase: number; dir: string; z: number;
}) {
  const bob = Math.abs(Math.sin(phase)) * 2.5;
  const flip = dir === 'left' ? -1 : 1;
  return (
    <div className="absolute" style={{ left: x, top: y, width: 0, height: 0, zIndex: z }}>
      <div className="absolute left-1/2 -translate-x-1/2 rounded-full bg-black/30 blur-[2px]" style={{ width: 24, height: 7, top: 11 }} />
      <div className="absolute" style={{ left: -19, top: -42, transform: `scaleX(${flip}) translateY(${-bob}px)` }}>
        <CharacterSprite w={38} dir={dir} phase={phase} moving palette={palette} />
      </div>
    </div>
  );
}

/* ============================== minimap ============================== */
function Minimap({ playerX, playerY, questSlug, careerStatus, careerBySlug }: {
  playerX: number; playerY: number; questSlug: string | null;
  careerStatus: Record<string, CareerStatus>; careerBySlug: Record<string, Career>;
}) {
  const MW = 168, MH = 112;
  const sx = MW / WORLD_W, sy = MH / WORLD_H;
  return (
    <div className="absolute right-4 top-[4.5rem] z-40 rounded-xl border-2 shadow-xl overflow-hidden"
      style={{ width: MW, height: MH, background: 'rgba(11,18,32,0.85)', borderColor: 'rgba(255,255,255,0.25)' }}>
      <div className="absolute inset-0" style={{ background: '#274d33' }} />
      {BUILDINGS.map(b => {
        const c = careerBySlug[b.slug];
        const st = c ? careerStatus[c.id] : 'not_started';
        return <div key={b.slug} className="absolute rounded-sm" style={{
          left: b.x * sx, top: b.y * sy, width: Math.max(5, b.w * sx), height: Math.max(5, b.h * sy),
          background: st === 'mastered' ? '#facc15' : b.color, outline: questSlug === b.slug ? '1.5px solid #fde68a' : 'none',
        }} />;
      })}
      <div className="absolute rounded-full bg-blue-300" style={{ width: 5, height: 5, left: FOUNTAIN.x * sx - 2, top: FOUNTAIN.y * sy - 2 }} />
      <div className="absolute rounded-full bg-white border border-black animate-pulse" style={{ width: 7, height: 7, left: playerX * sx - 3, top: playerY * sy - 3 }} />
    </div>
  );
}

/* =============================== HUD bar =============================== */
function TopBar(props: {
  profile: Profile | null; level: number; clock: string; isNight: boolean; energy: number; coins: number;
  muted: boolean; theme: string;
  onLeaderboard: () => void; onProfile: () => void; onMute: () => void; onTheme: () => void; onClassicMap: () => void; onSignOut: () => void; onCompass: () => void;
}) {
  const { profile, level, clock, energy, coins, isNight } = props;
  return (
    <div className="absolute top-0 inset-x-0 z-40 px-2 sm:px-4 pt-2.5 flex items-start justify-between gap-2 pointer-events-none">
      {/* left cluster: brand + live stats */}
      <div className="flex items-center gap-2 min-w-0 pointer-events-auto rounded-2xl border border-white/15 shadow-xl px-2.5 sm:px-3 py-1.5"
        style={{ background: 'linear-gradient(180deg, rgba(17,24,39,0.92), rgba(17,24,39,0.78))', backdropFilter: 'blur(10px)' }}>
        <div className="flex items-center gap-1.5 pr-1.5 sm:pr-2.5 border-r border-white/10">
          <span className="text-xl sm:text-2xl drop-shadow">🏙️</span>
          <span className="font-fantasy text-white text-base sm:text-xl tracking-wide hidden md:block">Questford</span>
        </div>
        <div className="flex items-center gap-1 sm:gap-1.5 text-white">
          <Stat icon={<span className="text-sm leading-none">{isNight ? '🌙' : '☀️'}</span>} label={clock} hideOnXs />
          <Stat icon={<Coins className="w-4 h-4 text-amber-400" />} label={`${coins}`} />
          <Stat icon={<Flame className="w-4 h-4 text-orange-400" />} label={`${profile?.current_streak ?? 0}`} />
          <Stat icon={<Trophy className="w-4 h-4 text-yellow-300" />} label={`Lv${level}`} />
          <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/5">
            <Zap className="w-4 h-4 text-cyan-300" />
            <div className="w-14 h-2 rounded-full bg-white/15 overflow-hidden">
              <div className="h-full rounded-full transition-[width] duration-300" style={{ width: `${energy}%`, background: 'linear-gradient(90deg,#22d3ee,#06b6d4)' }} />
            </div>
          </div>
        </div>
      </div>

      {/* right cluster: actions, grouped */}
      <div className="flex items-center gap-1 pointer-events-auto rounded-2xl border border-white/15 shadow-xl px-1.5 py-1.5"
        style={{ background: 'linear-gradient(180deg, rgba(17,24,39,0.92), rgba(17,24,39,0.78))', backdropFilter: 'blur(10px)' }}>
        <HudBtn onClick={props.onClassicMap} title="Districts Map" accent="#a78bfa"><MapIcon className="w-5 h-5" /></HudBtn>
        <HudBtn onClick={props.onLeaderboard} title="Leaderboard" accent="#fbbf24"><Trophy className="w-5 h-5" /></HudBtn>
        <HudBtn onClick={props.onCompass} title="Career Compass" accent="#34d399"><Compass className="w-5 h-5" /></HudBtn>
        <HudBtn onClick={props.onProfile} title="Profile" accent="#60a5fa"><User className="w-5 h-5" /></HudBtn>
        <span className="w-px h-6 bg-white/15 mx-0.5" />
        <HudBtn onClick={props.onMute} title={props.muted ? 'Unmute' : 'Mute'}>{props.muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}</HudBtn>
        <HudBtn onClick={props.onTheme} title="Toggle theme">{props.theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}</HudBtn>
        <HudBtn onClick={props.onSignOut} title="Sign out" accent="#f87171"><LogOut className="w-5 h-5" /></HudBtn>
      </div>
    </div>
  );
}
function HudBtn({ onClick, title, accent, children }: { onClick: () => void; title: string; accent?: string; children: React.ReactNode }) {
  return (
    <button onClick={onClick} title={title} aria-label={title}
      className="group relative p-2 rounded-xl text-slate-200 hover:text-white transition-all hover:-translate-y-0.5 active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-white/40"
      style={{ background: 'rgba(255,255,255,0.06)' }}
      onMouseEnter={(e) => { if (accent) e.currentTarget.style.background = `${accent}33`; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}>
      {children}
    </button>
  );
}
function Stat({ icon, label, hideOnXs }: { icon: React.ReactNode; label: string; hideOnXs?: boolean }) {
  return (
    <div className={`${hideOnXs ? 'hidden sm:flex' : 'flex'} items-center gap-1 px-1.5 sm:px-2 py-1 rounded-lg bg-white/5 text-xs sm:text-sm font-bold`}>
      {icon}<span className="tabular-nums">{label}</span>
    </div>
  );
}

/* =========================== mobile controls =========================== */
function MobileControls({ onVec, onInteract, canInteract, label }: { onVec: (x: number, y: number) => void; onInteract: () => void; canInteract: boolean; label: string }) {
  const press = (x: number, y: number) => (e: React.TouchEvent | React.MouseEvent) => { e.preventDefault(); onVec(x, y); };
  const release = (e: React.TouchEvent | React.MouseEvent) => { e.preventDefault(); onVec(0, 0); };
  const Pad = ({ x, y, lbl, cls }: { x: number; y: number; lbl: string; cls: string }) => (
    <button className={`absolute w-14 h-14 rounded-full bg-white/20 border border-white/30 text-white text-xl font-black flex items-center justify-center active:bg-white/40 ${cls}`}
      onTouchStart={press(x, y)} onTouchEnd={release} onMouseDown={press(x, y)} onMouseUp={release} onMouseLeave={release}>{lbl}</button>
  );
  return (
    <>
      <div className="absolute left-5 bottom-6 z-40 w-44 h-44">
        <Pad x={0} y={-1} lbl="▲" cls="left-1/2 -translate-x-1/2 top-0" />
        <Pad x={0} y={1} lbl="▼" cls="left-1/2 -translate-x-1/2 bottom-0" />
        <Pad x={-1} y={0} lbl="◀" cls="left-0 top-1/2 -translate-y-1/2" />
        <Pad x={1} y={0} lbl="▶" cls="right-0 top-1/2 -translate-y-1/2" />
      </div>
      <button onClick={onInteract} disabled={!canInteract}
        className="absolute right-6 bottom-12 z-40 w-20 h-20 rounded-full font-black text-lg shadow-xl transition-all disabled:opacity-40"
        style={{ background: canInteract ? '#fde68a' : 'rgba(255,255,255,0.2)', color: '#0f172a' }}>{label}</button>
    </>
  );
}
