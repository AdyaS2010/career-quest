import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Coins, Volume2, VolumeX, User, Trophy, Map as MapIcon, LogOut, Compass, Settings, Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useAudio } from '../contexts/AudioContext';
import { useTheme } from '../contexts/ThemeContext';
import type { Career, Profile, ColorScheme } from '../lib/database.types';
import { loadSeen, saveSeen, currentChapter, CHAPTERS, ENDING, type DialogueLine } from './city/story';
import { DialogueBox } from '../components/DialogueBox';
import { IntroScreen } from '../components/IntroScreen';
import { SettingsModal } from '../components/SettingsModal';
import { CareerQuiz } from '../components/CareerQuiz';
import { MapPreview } from '../components/MapPreview';
import { useTutorial } from '../contexts/TutorialContext';
import { loadQuiz, saveQuiz, type QuizResult } from './city/quiz';
import { loadWallet } from '../lib/wallet';
import { loadPrefs, nowInTz } from '../lib/prefs';
import { TILE, SHEET_COLS, loadBaseMap, loadSheet, classifyTerrain, buildWalkable, reachable, spreadCells, doorstepCells, doorFrontCells, isRoad, type BaseMap } from './city/pico8';

const SCALE = 6, TS = TILE * SCALE, SPEED = 2.7, REACH = TS * 1.3;
let savedPos: { x: number; y: number } | null = null; // remembers where the player left off across navigations

type Rect = { x: number; y: number; w: number; h: number };
// Force WALKABLE (overrides everything, incl. buildings). Read off the 📍 readout.
const WALKABLE_OVERRIDES: Rect[] = [
  { x: 22, y: 13, w: 7, h: 3 }, // open courtyard / sidewalk (22,13)–(28,15)
  { x: 28, y: 11, w: 7, h: 5 }, // rooftop (28,11)–(34,15)
  { x: 27, y: 19, w: 3, h: 3 }, // Mayor's Plaza / Center Court walkable path around 28, 20
];
// Walkable EXCEPT solid buildings (e.g. an open sand area dotted with houses).
const SOFT_WALKABLE: Rect[] = [
  { x: 22, y: 0, w: 7, h: 12 }, // orange/sand area (22,11) and upward, houses stay solid
];
// Force SOLID (e.g. rooftops that read as walkable). Read off the 📍 readout.
const SOLID_OVERRIDES: Rect[] = [];

// Designer-placed door fronts — the walkable cell directly in front of each
// building's door, keyed by career slug. Standing here and pressing E enters
// that domain. Coordinates read off the live 📍 readout.
const DOOR_COORDS: Record<string, { x: number; y: number }> = {
  'health-sciences': { x: 8, y: 13 },          // medical
  'culinary-arts': { x: 13, y: 13 },           // culinary
  'education': { x: 48, y: 11 },               // education
  'information-technology': { x: 32, y: 11 },  // IT
  'arts-entertainment': { x: 25, y: 8 },       // arts & entertainment
  'media-communication': { x: 24, y: 19 },     // media + communication
  'law-government': { x: 14, y: 0.5 },           // law
  'financial-services': { x: 14, y: 29 },      // financial services
};

// Sign placement is INDEPENDENT of the doormats — each board sits wherever it
// reads best on its own building (tile centre, fractional ok). Tune freely; a
// sign never has to keep the same distance from its mat as any other.
const SIGN_COORDS: Record<string, { x: number; y: number }> = {
  'health-sciences': { x: 8.5, y: 9.7 },
  'culinary-arts': { x: 13.55, y: 10.8 },
  'education': { x: 49, y: 7.4 },
  'information-technology': { x: 32.5, y: 7.8 },
  'arts-entertainment': { x: 25, y: 6.4 },
  'media-communication': { x: 25, y: 16.9 },
  'law-government': { x: 14.5, y: 0.1 },         // top-edge building — keep the board low so it stays on screen
  'financial-services': { x: 13, y: 26.8 },
};

// Each domain is a little establishment on Questford's high street. Every name is
// plain enough to guess the trade at a glance, with just a wink of wit.
// The signage fonts are adjusted thematically to look playful and on-point for
// each domain (e.g. Orbitron for IT, Kalam for Cooking, Righteous for Arts).
const DOMAIN_SIGN: Record<string, { name: string; textStyle: React.CSSProperties }> = {
  'health-sciences':        { name: 'St. Vitals Hospital', textStyle: { fontFamily: "'Fredoka', sans-serif", fontWeight: 600, fontSize: 12.5, letterSpacing: '0.02em', color: '#2ea47d' } }, // clinical forest green
  'culinary-arts':          { name: 'Delish Bistro',       textStyle: { fontFamily: "'Kalam', cursive", fontWeight: 700, fontSize: 14.5, lineHeight: 1, color: '#c2410c' } }, // rich warm terracotta rust
  'education':              { name: 'Wise Owl Academy',   textStyle: { fontFamily: "'Comfortaa', cursive", fontWeight: 700, fontSize: 11.5, color: '#1e3a8a' } },
  'information-technology': { name: 'Pixel Tech',         textStyle: { fontFamily: "'Orbitron', sans-serif", fontWeight: 800, fontSize: 11, letterSpacing: '0.05em', color: '#0f766e' } },
  'arts-entertainment':     { name: 'Spotlight Studios',  textStyle: { fontFamily: "'Righteous', cursive", fontWeight: 400, fontSize: 12, letterSpacing: '0.02em', color: '#7e22ce' } }, // vibrant purple
  'media-communication':    { name: 'The Gazette',        textStyle: { fontFamily: "'Playfair Display', serif", fontStyle: 'italic', fontWeight: 800, fontSize: 13.5, color: '#1c1917' } },
  'law-government':         { name: 'Citizen Court',      textStyle: { fontFamily: "'Cinzel Decorative', serif", fontWeight: 700, fontSize: 12.5, color: '#091e3a' } }, // deep blue-black
  'financial-services':     { name: 'Sterling Bank',      textStyle: { fontFamily: "'Cinzel', serif", fontWeight: 800, fontSize: 12, letterSpacing: '0.08em', color: '#5a6b7c' } }, // sleek metallic silver
};

interface Door { slug: string; name: string; color: ColorScheme; icon: string; cx: number; cy: number; mastered: boolean }
type Status = 'mastered' | 'in_progress' | 'not_started';

export function CityHub() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { muted, toggleMute, playSfx, setAmbience, startBgm } = useAudio();
  const { dyslexicFriendly } = useTheme();

  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const [doors, setDoors] = useState<Door[]>([]);
  const [dialogue, setDialogue] = useState<DialogueLine[] | null>(null);
  const [nearLabel, setNearLabel] = useState<string | null>(null);
  const [coins, setCoins] = useState(0);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [skills, setSkills] = useState<Record<string, { xp: number; status: Status }>>({});
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [quizOpen, setQuizOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [showOnboardingChoice, setShowOnboardingChoice] = useState(false);
  const { tutStep, setTutStep } = useTutorial();

  const [seenState, setSeenState] = useState<{ introSeen: boolean; chaptersSeen: string[]; endingSeen: boolean }>({
    introSeen: false,
    chaptersSeen: [],
    endingSeen: false,
  });

  const showQuestPromptRef = useRef(false);

  // Load Mayoral dialogue seen states from localStorage on user change
  useEffect(() => {
    if (user) {
      setSeenState(loadSeen(user.id));
      savedPos = null; // Reset spawn memory on login/re-login/user change
    }
  }, [user]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<BaseMap | null>(null);
  const walkRef = useRef<boolean[]>([]);
  const sheetRef = useRef<HTMLImageElement | null>(null);
  const posRef = useRef({ x: 0, y: 0 });
  const camRef = useRef({ x: 0, y: 0 });
  const tzRef = useRef<string>('auto'); // chosen timezone drives the day/night clock
  const keysRef = useRef<Set<string>>(new Set());
  const faceRef = useRef(1);
  const movingRef = useRef(false);
  const doorsRef = useRef<Door[]>([]);
  const npcRef = useRef<{ cx: number; cy: number; lines: DialogueLine[] } | null>(null);
  const coordElRef = useRef<HTMLSpanElement | null>(null);
  const nearRef = useRef<Door | 'npc' | null>(null);
  const nearKeyRef = useRef<string | null>(null);
  const signEls = useRef<Map<string, HTMLDivElement | null>>(new Map());
  const busyRef = useRef(false);
  const rafRef = useRef(0);
  const tutStepRef = useRef<number | null>(null);
  useEffect(() => { tutStepRef.current = tutStep; }, [tutStep]);

  const showIntro = ready && !seenState.introSeen;
  busyRef.current = showIntro || showOnboardingChoice || !!dialogue || quizOpen || showSettings || showMap;

  // HUD data (streak / level / xp / skills) — loaded separately from the map so
  // the canvas render loop is never disturbed.
  useEffect(() => {
    if (!user) return;
    let alive = true;
    setQuizResult(loadQuiz(user.id));
    tzRef.current = loadPrefs(user.id).tz;
    (async () => {
      try {
        const [pRes, cRes, chRes, prRes] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
          supabase.from('careers').select('id, slug').eq('is_active', true),
          (supabase.from('challenges') as any).select('id, career_id, max_score'),
          (supabase.from('user_challenge_progress') as any).select('challenge_id, best_score').eq('user_id', user.id),
        ]);
        if (!alive) return;
        if (pRes.data) setProfile(pRes.data as unknown as Profile);
        const rows = (cRes.data || []) as { id: string; slug: string }[];
        const ch = (chRes.data || []) as { id: string; career_id: string; max_score?: number }[];
        const cp = (prRes.data || []) as { challenge_id: string; best_score: number }[];
        const toCareer: Record<string, string> = {}; const maxP: Record<string, number> = {};
        ch.forEach(c => { toCareer[c.id] = c.career_id; maxP[c.career_id] = (maxP[c.career_id] || 0) + (c.max_score || 100); });
        const xp: Record<string, number> = {}; const started: Record<string, number> = {};
        cp.forEach(p => { const cid = toCareer[p.challenge_id]; if (cid) { xp[cid] = (xp[cid] || 0) + p.best_score; started[cid] = (started[cid] || 0) + 1; } });
        const sk: Record<string, { xp: number; status: Status }> = {};
        rows.forEach(c => { const e = xp[c.id] || 0, mx = maxP[c.id] || 1, st = started[c.id] || 0; let status: Status; if ((c.slug === 'financial-services' && e >= 270) || e >= 0.8 * mx) status = 'mastered'; else if (st > 0) status = 'in_progress'; else status = 'not_started'; sk[c.slug] = { xp: e, status }; });
        setSkills(sk);
      } catch (e) { console.error('CityHub HUD load', e); }
    })();
    return () => { alive = false; };
  }, [user]);

  useEffect(() => {
    let alive = true;
    (async () => {
      // NOTE: don't reset loading/ready here — Supabase fires an auth refresh
      // shortly after load that re-runs this effect; resetting would flicker the
      // loading overlay back over the live city.
      try {
        const { data: cs } = await supabase.from('careers').select('*').order('order_index');
        const careers = (cs || []) as Career[];
        let mastered = new Set<string>();
        if (user) {
          setCoins(loadWallet(user.id).coins);
          const { data: cp } = await supabase.from('user_career_progress').select('career_id, status').eq('user_id', user.id).eq('status', 'completed');
          const ids = new Set(((cp || []) as { career_id: string }[]).map(r => r.career_id));
          careers.forEach(c => { if (ids.has((c as any).id)) mastered.add(c.slug); });
        }
        const map = await loadBaseMap();
        const sheet = await loadSheet();
        const { solid } = classifyTerrain(sheet);
        const walk = buildWalkable(map, solid);

        // Auto-solidify enclosed ROOFTOPS: small isolated components of road-coloured
        // tiles that aren't part of the connected street network are building tops.
        const comp = new Int32Array(map.w * map.h).fill(-1); let cid = 0; const sizes: number[] = [];
        for (let i = 0; i < walk.length; i++) {
          if (comp[i] >= 0 || !walk[i] || !isRoad(map.terrain[i])) continue;
          const q = [i]; comp[i] = cid; let sz = 0;
          while (q.length) { const cur = q.pop()!; sz++; const cx = cur % map.w, cy = Math.floor(cur / map.w); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = cx + dx, ny = cy + dy; if (nx < 0 || ny < 0 || nx >= map.w || ny >= map.h) continue; const ni = ny * map.w + nx; if (comp[ni] < 0 && walk[ni] && isRoad(map.terrain[ni])) { comp[ni] = cid; q.push(ni); } } }
          sizes[cid] = sz; cid++;
        }
        const big = sizes.length ? sizes.indexOf(Math.max(...sizes)) : -1;
        for (let i = 0; i < walk.length; i++) if (comp[i] >= 0 && comp[i] !== big && sizes[comp[i]] < 40) walk[i] = false;

        // Designer overrides (applied in order). inRect helper:
        const eachRect = (rects: Rect[], fn: (i: number) => void) => { for (const o of rects) for (let y = o.y; y < o.y + o.h; y++) for (let x = o.x; x < o.x + o.w; x++) if (x >= 0 && y >= 0 && x < map.w && y < map.h) fn(y * map.w + x); };
        eachRect(SOLID_OVERRIDES, i => { walk[i] = false; });                              // force solid
        eachRect(SOFT_WALKABLE, i => { if (!solid.has(map.terrain[i])) walk[i] = true; });  // walkable except houses
        eachRect(WALKABLE_OVERRIDES, i => { walk[i] = true; });                             // force walkable

        mapRef.current = map; walkRef.current = walk; sheetRef.current = sheet;
        const spawn = findSpawn(map, walk);
        // Default spawning place at coordinate (28, 14)
        posRef.current = { x: (28 + 0.5) * TS, y: (14 + 0.5) * TS };
        // resume where the player left off (if that spot is still walkable on this map)
        if (savedPos && walkableAt(map, walk, savedPos.x, savedPos.y)) posRef.current = { x: savedPos.x, y: savedPos.y };
        const reachSet = reachable(map, walk, spawn);
        const need = careers.length + 1;
        const central = (i: number) => { const x = i % map.w, y = Math.floor(i / map.w); return x > 3 && y > 3 && x < map.w - 4 && y < map.h - 4; };
        const doorFronts = doorFrontCells(map, walk).filter(i => reachSet.has(i) && central(i));   // in front of real doors, off the map edge
        const stepCells = doorstepCells(map).filter(i => walk[i] && reachSet.has(i) && central(i)); // any building doorstep
        const openReach = [...reachSet].filter(central);
        const pool = doorFronts.length >= need ? doorFronts : (stepCells.length >= need ? stepCells : (openReach.length ? openReach : [...reachSet]));
        const cells = spreadCells(map, pool, careers.length + 1);
        const npc = cells.shift()!;
        const built: Door[] = careers.map((c, i) => { const fixed = DOOR_COORDS[c.slug]; return { slug: c.slug, name: c.name, color: c.color_scheme as unknown as ColorScheme, icon: c.icon as string, cx: fixed?.x ?? (cells[i]?.x ?? npc.x), cy: fixed?.y ?? (cells[i]?.y ?? npc.y), mastered: mastered.has(c.slug) }; });
        if (!alive) return;
        doorsRef.current = built; setDoors(built);
        
        // Force the Mayor's tile (28, 20) to be solid so players collide with him
        walk[20 * map.w + 28] = false;

        // Place Mayor Questopher statically in the center plaza (28, 20)
        npcRef.current = { cx: 28, cy: 20, lines: [] };

        setReady(true); setLoading(false);
      } catch (e) { console.error('CityHub load', e); setLoading(false); }
    })();
    // NOTE: the animation-frame loop is owned by the [ready] effect below; don't
    // cancel it here. A Supabase auth refresh changes `user` and re-runs this
    // effect — cancelling the RAF here (without restarting it) froze the player
    // after navigating away and back.
    return () => { alive = false; };
  }, [user]);

  // Dynamically update the Mayor's quest prompt visibility
  useEffect(() => {
    if (!ready || !npcRef.current) return;
    const started = Object.values(skills).filter(s => s.status !== 'not_started').length;
    const mastered = Object.values(skills).filter(s => s.status === 'mastered').length;
    const storyProgress = { started, mastered };
    const chapter = currentChapter(storyProgress);
    
    const hasNewStoryBeat = (mastered >= 8)
      ? !seenState.endingSeen
      : !seenState.chaptersSeen.includes(chapter.id);
      
    showQuestPromptRef.current = hasNewStoryBeat;
  }, [skills, ready, seenState]);

  // Helper to dynamically build the Mayor's dialogue
  const getMayorDialogue = (): DialogueLine[] => {
    const started = Object.values(skills).filter(s => s.status !== 'not_started').length;
    const mastered = Object.values(skills).filter(s => s.status === 'mastered').length;
    const storyProgress = { started, mastered };
    const chapter = currentChapter(storyProgress);

    if (mastered >= 8) {
      return ENDING;
    }
    
    // If they haven't seen this chapter's intro, give them the intro
    if (!seenState.chaptersSeen.includes(chapter.id)) {
      return chapter.intro;
    }

    // Otherwise, give them a supportive, engaging counseling tip periodically
    const tips = [
      "Keep exploring, intern! Every workstation you try builds your unique skills.",
      "Need a hint? Check out the Career Compass in your HUD to see what match is right for you.",
      "Questford is all about trial and discovery. Try a few shifts in Culinary or IT to find your footing!",
      "A great career is about matching your strengths. Pay attention to what feels most rewarding!",
      "Every mistake is just a bug to debug or a dish to plate better next time. Keep learning!",
      "Learning by doing is the secret to Questford. Dive into those simulations!",
      "You are making great progress! Take your time to walk around and take it all in.",
      "Every mastered internship earns a reference letter for your file. Let's build that résumé!",
      "Have you checked the Leaderboard? Friendly competition keeps the mind sharp!",
      "Cozy city, ambitious goals. You have what it takes to succeed here!"
    ];

    const xp = profile?.total_score ?? 0;
    const index = Math.floor(xp / 100) % tips.length;
    const tip = tips[index];

    return [
      {
        speaker: 'Mayor Questopher',
        portrait: '🧑‍💼',
        text: tip
      }
    ];
  };

  // The city + menus drift along to the serene "Questford Stroll"; a soft
  // day/night ambient bed sits gently underneath it. We leave the music playing
  // on the way out so the next screen can pick its own theme without a gap.
  useEffect(() => {
    startBgm('serene');
    const hour = new Date().getHours();
    setAmbience(hour >= 19 || hour < 6 ? 'city-night' : 'city');
    return () => setAmbience(null);
  }, [setAmbience, startBgm]);

  // Global tutorial events are handled by TutorialContext

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
      if (busyRef.current) return;
      if (k === 'e' || k === 'enter') {
        const n = nearRef.current;
        if (n === 'npc') {
          playSfx('greet');
          setDialogue(getMayorDialogue());
        } else if (n) {
          playSfx('enter');
          navigate(`/career/${n.slug}`);
        }
        return;
      }
      keysRef.current.add(k);
    };
    const up = (e: KeyboardEvent) => keysRef.current.delete(e.key.toLowerCase());
    const clearKeys = () => { keysRef.current.clear(); };
    const onVis = () => { if (document.visibilityState === 'hidden') keysRef.current.clear(); };
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
  }, [navigate]);

  useEffect(() => {
    if (!ready) return;
    let prevT = performance.now();
    let firstFrame = true;
    let lastStep = 0;
    const loop = (t: number) => {
      rafRef.current = requestAnimationFrame(loop);
      const cv = canvasRef.current, wrap = wrapRef.current, map = mapRef.current, sheet = sheetRef.current, walk = walkRef.current;
      if (!cv || !wrap || !map || !sheet) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const vw = wrap.clientWidth, vh = wrap.clientHeight;
      if (cv.width !== Math.round(vw * dpr) || cv.height !== Math.round(vh * dpr)) { cv.width = Math.round(vw * dpr); cv.height = Math.round(vh * dpr); }
      const ctx = cv.getContext('2d')!; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.imageSmoothingEnabled = false;
      const worldW = map.w * TS, worldH = map.h * TS, pos = posRef.current;

      movingRef.current = false;
      if (!busyRef.current) {
        const K = keysRef.current; let dx = 0, dy = 0;
        if (K.has('a') || K.has('arrowleft')) dx -= 1; if (K.has('d') || K.has('arrowright')) dx += 1;
        if (K.has('w') || K.has('arrowup')) dy -= 1; if (K.has('s') || K.has('arrowdown')) dy += 1;
        if (dx || dy) { movingRef.current = true; const len = Math.hypot(dx, dy) || 1; dx = dx / len * SPEED; dy = dy / len * SPEED; if (dx) faceRef.current = dx < 0 ? -1 : 1;
          if (walkableAt(map, walk, pos.x + dx, pos.y)) pos.x = Math.max(2, Math.min(worldW - 2, pos.x + dx));
          if (walkableAt(map, walk, pos.x, pos.y + dy)) pos.y = Math.max(2, Math.min(worldH - 2, pos.y + dy)); }
      }

      // tutorial: the "take a stroll" beat advances the moment the player moves
      if (tutStepRef.current === 1 && movingRef.current) { tutStepRef.current = -1; setTutStep(2); }

      // soft, rhythmic footstep tick while strolling (subtle; respects mute)
      if (movingRef.current) { if (t - lastStep > 300) { playSfx('footstep'); lastStep = t; } }
      else { lastStep = 0; }

      // ===== camera: gentle centered follow (lowkey, lightly smoothed) =====
      const dt = Math.min(0.05, Math.max(0.001, (t - prevT) / 1000)); prevT = t;
      const cam = camRef.current;
      const tx = clamp(pos.x - vw / 2, 0, Math.max(0, worldW - vw));
      const ty = clamp(pos.y - vh / 2, 0, Math.max(0, worldH - vh));
      if (firstFrame) { cam.x = tx; cam.y = ty; firstFrame = false; }
      else { const follow = 1 - Math.pow(0.0006, dt); cam.x += (tx - cam.x) * follow; cam.y += (ty - cam.y) * follow; }

      ctx.clearRect(0, 0, vw, vh);
      const c0 = Math.max(0, Math.floor(cam.x / TS)), c1 = Math.min(map.w - 1, Math.ceil((cam.x + vw) / TS));
      const r0 = Math.max(0, Math.floor(cam.y / TS)), r1 = Math.min(map.h - 1, Math.ceil((cam.y + vh) / TS));
      for (let ry = r0; ry <= r1; ry++) for (let cx2 = c0; cx2 <= c1; cx2++) {
        const dxp = Math.round(cx2 * TS - cam.x), dyp = Math.round(ry * TS - cam.y), idx = ry * map.w + cx2;
        blit(ctx, sheet, map.terrain[idx], dxp, dyp); blit(ctx, sheet, map.objects[idx], dxp, dyp);
      }

      // district tints — a soft wash of each career's colour around its building
      for (const d of doorsRef.current) {
        const wx = (d.cx + 0.5) * TS - cam.x, wy = (d.cy + 0.5) * TS - cam.y;
        if (wx < -260 || wx > vw + 260 || wy < -260 || wy > vh + 260) continue;
        const R = TS * 3.6, g = ctx.createRadialGradient(wx, wy - TS, 0, wx, wy - TS, R);
        g.addColorStop(0, hexA(d.color.primary, 0.24)); g.addColorStop(0.6, hexA(d.color.primary, 0.1)); g.addColorStop(1, hexA(d.color.primary, 0));
        ctx.fillStyle = g; ctx.fillRect(wx - R, wy - TS - R, R * 2, R * 2);
      }

      // entrances: beacon + position the HTML sign; track nearest
      let near: Door | 'npc' | null = null, nd = REACH;
      for (const d of doorsRef.current) {
        const wx = (d.cx + 0.5) * TS, wy = (d.cy + 0.5) * TS, sx = wx - cam.x, sy = wy - cam.y;
        const dist = Math.hypot(wx - pos.x, wy - pos.y); if (dist < nd) { nd = dist; near = d; }
        drawBanner(ctx, sx - TS * 0.8, sy + 3, d.color.primary, t);            // district banners flank the entrance
        drawBanner(ctx, sx + TS * 0.8, sy + 3, d.color.secondary || d.color.primary, t + 240);
        drawDoormat(ctx, sx, sy, d.color.primary, d.mastered);
        const el = signEls.current.get(d.slug);
        if (el) {
          // signs live on their own coordinates — never tied to the mat's spot
          const sc = SIGN_COORDS[d.slug];
          let ssx = sc ? (sc.x + 0.5) * TS - cam.x : sx;
          let ssy = sc ? (sc.y + 0.5) * TS - cam.y : sy - TS * 1.42;
          // Edge buildings (law-government hugs the top row, financial-services the
          // bottom) can't host a plate "off the map", and the camera clamps there —
          // so once the building is on screen we gently keep its nameplate inside the
          // viewport. SIGN_COORDS still nudges it freely; it just never gets shoved
          // off-screen or down onto the doormat. Interior buildings never trip this.
          const doorOn = sx > -TS && sx < vw + TS && sy > -TS && sy < vh + TS;
          if (doorOn) { const mx = 74, my = 58; ssx = Math.max(mx, Math.min(vw - mx, ssx)); ssy = Math.max(my, Math.min(vh - my, ssy)); }
          const on = ssx > -180 && ssx < vw + 180 && ssy > -120 && ssy < vh + 120;
          el.style.opacity = on ? '1' : '0';
          el.style.transform = `translate(-50%,-50%) translate(${Math.round(ssx)}px, ${Math.round(ssy)}px)`;
        }
      }
      if (npcRef.current) { const wx = (npcRef.current.cx + 0.5) * TS, wy = (npcRef.current.cy + 0.5) * TS; const dist = Math.hypot(wx - pos.x, wy - pos.y); if (dist < nd) { nd = dist; near = 'npc'; } drawNpc(ctx, wx - cam.x, wy - cam.y, t, showQuestPromptRef.current); }
      nearRef.current = near;
      const key = near === 'npc' ? 'npc' : near ? `d:${near.slug}` : null;
      if (key !== nearKeyRef.current) {
        // a gentle chime the moment you step onto a new doormat
        if (key && key.startsWith('d:')) playSfx('chime');
        nearKeyRef.current = key;
        setNearLabel(near === 'npc' ? 'Talk to Mayor Questopher' : near ? `Enter ${near.name}` : null);
      }

      drawChar(ctx, pos.x - cam.x, pos.y - cam.y, '#22c55e', t, faceRef.current, movingRef.current);

      // ===== day/night cycle — ambient wash driven by the player's chosen clock =====
      const sky = daylight(nowInTz(tzRef.current));
      ctx.fillStyle = `rgba(${sky.r | 0},${sky.g | 0},${sky.b | 0},${sky.a})`;
      ctx.fillRect(0, 0, vw, vh);

      // live tile-coordinate readout (so the player can point me to spots)
      if (coordElRef.current) coordElRef.current.textContent = `${Math.floor(pos.x / TS)}, ${Math.floor(pos.y / TS)}`;
      savedPos = { x: pos.x, y: pos.y }; // remember position so we resume here after leaving the tab/page
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(rafRef.current); };
  }, [ready]);

  return (
    <div ref={wrapRef} className="fixed inset-0 overflow-hidden select-none" style={{ background: '#0a1228', touchAction: 'none' }}>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ imageRendering: 'pixelated' }} />
      {/* soft vignette for depth */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(120% 100% at 50% 45%, transparent 55%, rgba(6,10,24,0.42) 100%)' }} />

      {/* building signs — bespoke storefront nameplates, one typeface per trade */}
      {doors.map((d) => {
        const sign = DOMAIN_SIGN[d.slug] ?? { 
          name: d.name, 
          textStyle: { fontFamily: "'Cinzel', serif", fontWeight: 700, fontSize: 12.5 }
        };
        const textStyle = dyslexicFriendly
          ? { fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: 13, letterSpacing: 'normal', fontStyle: 'normal', color: '#2a2014', textShadow: '0 1px 0 rgba(255,255,255,0.55)' }
          : sign.textStyle;
        const boardStyle = { 
          background: 'linear-gradient(180deg,#fffaf0 0%,#f4ecd9 100%)', 
          borderColor: d.slug === 'health-sciences' ? '#f87171' : d.color.primary 
        };

        return (
          <div key={d.slug} ref={el => { signEls.current.set(d.slug, el); }} className="absolute left-0 top-0 z-20 pointer-events-none flex flex-col items-center" style={{ opacity: 0, transition: 'opacity .12s' }}>
            {/* slim hanger — a single ring + stem, as if the plate hangs from a bracket */}
            <span style={{ width: 6, height: 6, borderRadius: '50%', border: '1.5px solid rgba(38,28,18,0.6)', background: 'rgba(255,250,240,0.55)' }} />
            <span style={{ width: 2, height: 5, background: 'rgba(38,28,18,0.6)' }} />
            {/* painted nameplate — neutral board, domain colour only in the frame + accent rule */}
            <div style={{ 
              position: 'relative', 
              padding: '5px 16px 6px', 
              borderRadius: 7, 
              boxShadow: `0 5px 13px rgba(0,0,0,0.42), inset 0 1px 0 rgba(255,255,255,0.95), inset 0 0 0 2.5px rgba(255,255,255,0.6)`,
              borderWidth: '1.5px',
              borderStyle: 'solid',
              ...boardStyle 
            }}>
              <span style={{ 
                display: 'block', 
                whiteSpace: 'nowrap', 
                lineHeight: 1.08, 
                color: '#2a2014', 
                textShadow: '0 1px 0 rgba(255,255,255,0.55)', 
                ...textStyle 
              }}>{sign.name}</span>
              <div style={{ height: 2, marginTop: 3, borderRadius: 2, background: `linear-gradient(90deg, transparent, ${d.slug === 'health-sciences' ? '#f87171' : d.color.primary}, transparent)` }} />
            </div>
          </div>
        );
      })}

      {/* Cinematic dark transition overlay */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
            className="absolute inset-0 z-50 bg-[#0a1228]"
          />
        )}
      </AnimatePresence>

      {/* HUD */}
      <header className="absolute top-0 inset-x-0 z-40 flex items-center justify-between gap-2 px-3 sm:px-5 py-3">
        <div id="tutorial-hud-progress" className="flex items-center gap-2 px-2.5 sm:px-3 py-2 rounded-2xl" style={{ background: 'rgba(10,18,40,0.7)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)' }}>
          <span className="text-xl">🏙️</span>
          <div className="hidden md:block"><h1 className="font-fantasy text-white text-lg leading-none">Questford</h1><p className="text-[10px] tracking-[0.2em] text-blue-200/70 font-bold uppercase">Where Futures Begin</p></div>
          <div className="flex items-center gap-1 ml-0.5 sm:ml-1">
            <Chip icon={<Flame className="w-4 h-4 text-orange-400" />} label={`${profile?.current_streak ?? 0}`} title="Daily streak" />
            <Chip icon={<Trophy className="w-4 h-4 text-yellow-300" />} label={`Lv${Math.floor((profile?.total_score ?? 0) / 100) + 1}`} title="Level" />
            <span className="hidden min-[420px]:flex"><Chip icon={<Star className="w-4 h-4 text-amber-300" />} label={`${profile?.total_score ?? 0}`} title="Total XP" /></span>
            <Chip icon={<Coins className="w-4 h-4 text-amber-300" />} label={`${coins}`} title="Coins" />
          </div>
        </div>
        <div className="flex items-center gap-1 sm:gap-1.5">
          <Btn onClick={() => setShowMap(true)} title="Quest map" a="#34d399"><MapIcon className="w-5 h-5" /></Btn>
          <Btn onClick={() => setQuizOpen(true)} title="Career Compass" a="#34d399"><Compass className="w-5 h-5" /></Btn>
          <Btn onClick={() => navigate('/leaderboard')} title="Leaderboard" a="#fbbf24"><Trophy className="w-5 h-5" /></Btn>
          <Btn onClick={() => navigate('/profile')} title="Profile" a="#60a5fa"><User className="w-5 h-5" /></Btn>
          <Btn onClick={toggleMute} title={muted ? 'Unmute' : 'Mute'} a="#a78bfa">{muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}</Btn>
          <Btn onClick={() => setShowSettings(true)} title="Settings" a="#fbbf24"><Settings className="w-5 h-5" /></Btn>
          <Btn onClick={signOut} title="Sign out" a="#f87171"><LogOut className="w-5 h-5" /></Btn>
        </div>
      </header>

      {nearLabel && !dialogue && (
        <div className="absolute left-1/2 -translate-x-1/2 bottom-24 z-30 px-4 py-2 rounded-2xl text-white font-bold shadow-xl flex items-center gap-2 animate-bounce-in" style={{ background: 'rgba(10,18,40,0.9)', border: '2px solid #34d399' }}>
          <span className="px-2 py-0.5 rounded-md text-slate-900 text-xs font-black bg-emerald-400">E</span>{nearLabel}
        </div>
      )}
      {ready && !dialogue && <div className="absolute left-1/2 -translate-x-1/2 bottom-6 z-20 px-3 py-1.5 rounded-full text-white/80 text-xs font-bold" style={{ background: 'rgba(10,18,40,0.6)' }}>WASD / arrows to move · E to enter</div>}
      {/* live tile coordinate — tell me these numbers to mark a spot */}
      {ready && <div className="absolute bottom-6 right-4 z-20 px-2.5 py-1 rounded-lg text-emerald-200 text-xs font-mono font-bold" style={{ background: 'rgba(10,18,40,0.6)' }}>📍 <span ref={coordElRef}>0, 0</span></div>}

      {ready && !dialogue && <DPad onPress={(k, on) => { if (on) keysRef.current.add(k); else keysRef.current.delete(k); }} onAction={() => { const n = nearRef.current; if (n === 'npc') { playSfx('greet'); setDialogue(getMayorDialogue()); } else if (n) { playSfx('enter'); navigate(`/career/${n.slug}`); } }} />}

      {dialogue && (
        <DialogueBox
          lines={dialogue}
          onClose={() => {
            setDialogue(null);
            if (user) {
              const started = Object.values(skills).filter(s => s.status !== 'not_started').length;
              const mastered = Object.values(skills).filter(s => s.status === 'mastered').length;
              const storyProgress = { started, mastered };
              const chapter = currentChapter(storyProgress);
              
              setSeenState(prev => {
                const next = { ...prev };
                if (mastered >= 8) {
                  next.endingSeen = true;
                } else if (!prev.chaptersSeen.includes(chapter.id)) {
                  next.chaptersSeen = [...prev.chaptersSeen, chapter.id];
                  if (chapter.id === 'orientation') {
                    setTimeout(() => {
                      setShowOnboardingChoice(true);
                    }, 0);
                  }
                }
                saveSeen(user.id, next);
                return next;
              });
            }
          }}
        />
      )}
      {showIntro && (
        <IntroScreen
          defaultName={profile?.character_name || profile?.username || 'Intern'}
          onBegin={async (name) => {
            if (!user) return;
            try {
              const { error } = await supabase
                .from('profiles')
                .update({ character_name: name } as never)
                .eq('id', user.id);
              if (error) throw error;
              setProfile(prev => prev ? { ...prev, character_name: name } : null);
              
              setSeenState(prev => {
                const next = { ...prev, introSeen: true };
                saveSeen(user.id, next);
                return next;
              });
              
              setDialogue(CHAPTERS[0].intro);
            } catch (e) {
              console.error('Error saving character name:', e);
              setSeenState(prev => {
                const next = { ...prev, introSeen: true };
                saveSeen(user.id, next);
                return next;
              });
              setDialogue(CHAPTERS[0].intro);
            }
          }}
        />
      )}
      {quizOpen && (
        <CareerQuiz
          existing={quizResult}
          skills={skills}
          firstTime={!quizResult}
          onResult={r => { setQuizResult(r); if (user) saveQuiz(user.id, r); }}
          onClose={() => {
            setQuizOpen(false);
            const onboarded = localStorage.getItem('questford_onboarded_' + user?.id) === '1';
            if (!onboarded && tutStep === null) {
              setTutStep(0);
            }
          }}
          onStartHere={(slug) => { setQuizOpen(false); navigate(`/career/${slug}`); }}
        />
      )}
      {showMap && <MapPreview doors={doors} skills={skills} recommended={quizResult?.top} onPick={(slug) => { setShowMap(false); navigate(`/career/${slug}`); }} onFullMap={() => { setShowMap(false); navigate('/map'); }} onCity={() => setShowMap(false)} onClose={() => setShowMap(false)} />}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      {showOnboardingChoice && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border-2 border-emerald-500/30 p-6 text-center text-white shadow-2xl relative animate-bounce-in" style={{ background: 'linear-gradient(160deg, #101b33 0%, #0c1224 100%)' }}>
            <div className="text-5xl mb-3">🧭</div>
            <h3 className="text-2xl font-black mb-2 text-emerald-400">Discover Your Path</h3>
            <p className="text-sm text-slate-300 mb-6 leading-relaxed">
              Welcome to Questford! Would you like to align your Career Compass to find your top recommended fields, or would you prefer a quick tour of the city streets?
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  setShowOnboardingChoice(false);
                  setQuizOpen(true);
                }}
                className="w-full py-3.5 rounded-2xl font-black text-slate-900 shadow-xl transition-all hover:scale-[1.02] active:scale-95"
                style={{ background: 'linear-gradient(90deg, #34d399, #10b981)' }}
              >
                Find My Match (Career Compass)
              </button>
              <button
                onClick={() => {
                  setShowOnboardingChoice(false);
                  setTutStep(0);
                }}
                className="w-full py-3.5 rounded-2xl font-bold bg-white/10 hover:bg-white/15 border border-white/20 transition-all hover:scale-[1.02] active:scale-95 text-white"
              >
                Stroll and Tour Town
              </button>
            </div>
          </div>
        </div>
      )}
      {showMap && <MapPreview doors={doors} skills={skills} recommended={quizResult?.top} onPick={(slug) => { setShowMap(false); navigate(`/career/${slug}`); }} onFullMap={() => { setShowMap(false); navigate('/map'); }} onCity={() => setShowMap(false)} onClose={() => setShowMap(false)} />}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  );
}

// ===== helpers =====
function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }
// ===== day/night cycle: tint + window-glow strength keyframed across a real 24h clock =====
type Sky = { r: number; g: number; b: number; a: number; glow: number };
const SKY_KEYS: { h: number; s: Sky }[] = [
  { h: 0,    s: { r: 18,  g: 26,  b: 70,  a: 0.50, glow: 1.00 } }, // deep night — blue with warm windows
  { h: 5,    s: { r: 26,  g: 34,  b: 82,  a: 0.44, glow: 0.95 } }, // last of the night
  { h: 6.5,  s: { r: 255, g: 168, b: 86,  a: 0.26, glow: 0.42 } }, // sunrise — warm gold
  { h: 8,    s: { r: 255, g: 206, b: 130, a: 0.13, glow: 0.10 } }, // soft golden morning
  { h: 12,   s: { r: 255, g: 250, b: 235, a: 0.03, glow: 0.00 } }, // bright neutral noon
  { h: 15.5, s: { r: 255, g: 244, b: 214, a: 0.05, glow: 0.00 } }, // clear afternoon
  { h: 17.5, s: { r: 255, g: 138, b: 58,  a: 0.22, glow: 0.30 } }, // amber evening
  { h: 19,   s: { r: 226, g: 96,  b: 62,  a: 0.30, glow: 0.62 } }, // orange dusk
  { h: 20.5, s: { r: 40,  g: 50,  b: 102, a: 0.42, glow: 0.92 } }, // nightfall
  { h: 24,   s: { r: 18,  g: 26,  b: 70,  a: 0.50, glow: 1.00 } }, // wrap back to deep night
];
function daylight(now: Date): Sky {
  const h = now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600;
  let a = SKY_KEYS[0], b = SKY_KEYS[SKY_KEYS.length - 1];
  for (let i = 0; i < SKY_KEYS.length - 1; i++) { if (h >= SKY_KEYS[i].h && h <= SKY_KEYS[i + 1].h) { a = SKY_KEYS[i]; b = SKY_KEYS[i + 1]; break; } }
  const span = b.h - a.h || 1, f = (h - a.h) / span, e = f * f * (3 - 2 * f); // smoothstep for gentle transitions
  const mix = (x: number, y: number) => x + (y - x) * e;
  return { r: mix(a.s.r, b.s.r), g: mix(a.s.g, b.s.g), b: mix(a.s.b, b.s.b), a: mix(a.s.a, b.s.a), glow: mix(a.s.glow, b.s.glow) };
}
function shadeHex(hex: string, p: number) { const n = parseInt((hex || '#888').replace('#', ''), 16); const r = Math.max(0, Math.min(255, (n >> 16) + p)), g = Math.max(0, Math.min(255, ((n >> 8) & 0xff) + p)), b = Math.max(0, Math.min(255, (n & 0xff) + p)); return `rgb(${r},${g},${b})`; }
function walkableAt(map: BaseMap, walk: boolean[], wx: number, wy: number) { const cx = Math.floor(wx / TS), cy = Math.floor(wy / TS); if (cx < 0 || cy < 0 || cx >= map.w || cy >= map.h) return false; return walk[cy * map.w + cx]; }
function hexA(hex: string, a: number) { const n = parseInt((hex || '#888').replace('#', ''), 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`; }
function findSpawn(map: BaseMap, walk: boolean[]) { const cx = Math.floor(map.w / 2), cy = Math.floor(map.h / 2); for (let rad = 0; rad < Math.max(map.w, map.h); rad++) for (let dy = -rad; dy <= rad; dy++) for (let dx = -rad; dx <= rad; dx++) { const x = cx + dx, y = cy + dy; if (x < 0 || y < 0 || x >= map.w || y >= map.h) continue; if (walk[y * map.w + x]) return y * map.w + x; } return walk.findIndex(Boolean); }
function blit(ctx: CanvasRenderingContext2D, sheet: HTMLImageElement, idx: number, dx: number, dy: number) { if (idx < 0) return; const sx = (idx % SHEET_COLS) * TILE, sy = Math.floor(idx / SHEET_COLS) * TILE; ctx.drawImage(sheet, sx, sy, TILE, TILE, dx, dy, TS, TS); }
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
function drawChar(ctx: CanvasRenderingContext2D, x: number, y: number, _body: string, t: number, face: number, moving = false) {
  // A cute, studious intern: navy sweater-vest over a white collar, satchel,
  // round glasses, tidy hair, holding a book. Reads "eager student".
  const sweater = '#3b5b8c', sweaterDk = shadeHex(sweater, -34), skin = '#f6cfa3';
  const swing = moving ? Math.sin(t / 70) : 0, bob = moving ? Math.abs(Math.sin(t / 70)) * 2 : Math.sin(t / 430) * 1.1;
  ctx.fillStyle = 'rgba(0,0,0,0.26)'; ctx.beginPath(); ctx.ellipse(x, y + 2, 12, 4, 0, 0, 7); ctx.fill();
  ctx.save(); ctx.translate(Math.round(x), Math.round(y - bob)); ctx.scale(face, 1);
  // legs + shoes
  ctx.fillStyle = '#4a5168'; ctx.fillRect(-6, -11 + Math.max(0, swing * 2), 5, 11); ctx.fillRect(1, -11 + Math.max(0, -swing * 2), 5, 11);
  ctx.fillStyle = '#2a2030'; ctx.fillRect(-7, -2 + Math.max(0, swing * 2), 6, 3); ctx.fillRect(1, -2 + Math.max(0, -swing * 2), 6, 3);
  // white collar peeking out
  ctx.fillStyle = '#eef2f7'; roundRect(ctx, -9, -26, 18, 6, 3); ctx.fill();
  // sweater body + shaded side + V-neck
  ctx.fillStyle = sweater; roundRect(ctx, -9, -24, 18, 15, 5); ctx.fill();
  ctx.fillStyle = sweaterDk; roundRect(ctx, 3, -24, 6, 15, 5); ctx.fill();
  ctx.fillStyle = '#eef2f7'; ctx.beginPath(); ctx.moveTo(-3, -24); ctx.lineTo(0, -19); ctx.lineTo(3, -24); ctx.closePath(); ctx.fill();
  // satchel strap
  ctx.fillStyle = '#7a4a28'; ctx.fillRect(-9, -23, 3, 14);
  // arms (sweater) + a held book
  ctx.fillStyle = sweater; ctx.fillRect(-11, -23 + swing * 2, 4, 10); ctx.fillRect(7, -23 - swing * 2, 4, 10);
  ctx.fillStyle = '#d1495b'; roundRect(ctx, 6, -18 - swing * 2, 7, 9, 1); ctx.fill(); ctx.fillStyle = '#f2e9d8'; ctx.fillRect(12, -18 - swing * 2, 1.5, 9);
  // head
  ctx.fillStyle = skin; roundRect(ctx, -8, -42, 16, 15, 6); ctx.fill();
  ctx.fillStyle = '#ecbe96'; roundRect(ctx, 2, -42, 6, 15, 6); ctx.fill();
  // hair (tidy side part)
  ctx.fillStyle = '#5a3a22'; roundRect(ctx, -9, -44, 18, 8, 5); ctx.fill(); ctx.fillStyle = '#5a3a22'; ctx.fillRect(-9, -40, 4, 5);
  // rosy cheeks
  ctx.fillStyle = 'rgba(240,140,140,0.55)'; ctx.beginPath(); ctx.arc(-4, -31, 1.6, 0, 7); ctx.arc(4, -31, 1.6, 0, 7); ctx.fill();
  // round glasses + eyes
  ctx.fillStyle = '#15171f'; ctx.fillRect(-3.2, -35, 2, 2.4); ctx.fillRect(2, -35, 2, 2.4);
  ctx.strokeStyle = '#23252e'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(-2.2, -34, 2.6, 0, 7); ctx.arc(3, -34, 2.6, 0, 7); ctx.moveTo(0.4, -34); ctx.lineTo(0.4, -34); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-0.2, -34); ctx.lineTo(0.8, -34); ctx.stroke();
  // smile
  ctx.strokeStyle = 'rgba(80,45,30,0.6)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(0, -30.5, 2.3, 0.18 * Math.PI, 0.82 * Math.PI); ctx.stroke();
  ctx.restore();
}
function drawNpc(ctx: CanvasRenderingContext2D, x: number, y: number, t: number, showQuestPrompt: boolean) {
  // A dignified, friendly cozy-city Mayor Questopher:
  // Classy purple counselor coat, gold chain of office with medallion, counselor cap, tidy silver beard.
  const coatColor = '#5b21b6'; // rich violet/purple
  const goldColor = '#fbbf24'; // warm gold
  const skin = '#f6cfa3';
  const beardColor = '#cbd5e1'; // soft grey/silver beard
  const capColor = '#4c1d95'; // dark purple cap
  
  const bob = Math.sin(t / 430) * 1.1; // gentle breathing bob
  
  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.beginPath(); ctx.ellipse(x, y + 2, 12, 4, 0, 0, 7); ctx.fill();
  
  ctx.save(); ctx.translate(Math.round(x), Math.round(y - bob));
  
  // legs + shoes
  ctx.fillStyle = '#1e293b'; ctx.fillRect(-5, -11, 4, 11); ctx.fillRect(1, -11, 4, 11); // dark slate trousers
  ctx.fillStyle = '#0f172a'; ctx.fillRect(-6, -2, 5, 3); ctx.fillRect(1, -2, 5, 3); // dark leather boots
  
  // Coat (purple counselor body)
  ctx.fillStyle = coatColor; roundRect(ctx, -9, -26, 18, 16, 5); ctx.fill();
  
  // Gold Mayoral Chain of Office (golden chain draped around shoulders)
  ctx.strokeStyle = goldColor; ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(-6, -25);
  ctx.lineTo(0, -18);
  ctx.lineTo(6, -25);
  ctx.stroke();
  
  // Center medallion
  ctx.fillStyle = goldColor;
  ctx.beginPath();
  ctx.arc(0, -17, 2, 0, 7);
  ctx.fill();
  
  // Arms
  ctx.fillStyle = coatColor;
  ctx.fillRect(-11, -25, 3, 11); // left sleeve
  ctx.fillRect(8, -25, 3, 11);  // right sleeve
  
  // Holding a Guidance Scroll in right hand
  ctx.fillStyle = '#fffbeb'; // parchment color
  roundRect(ctx, 8, -17, 5, 8, 1); ctx.fill();
  ctx.fillStyle = '#b45309'; // amber ribbon
  ctx.fillRect(8, -13, 5, 2);
  
  // Head
  ctx.fillStyle = skin; roundRect(ctx, -8, -42, 16, 15, 6); ctx.fill();
  
  // Silver beard + mustache (tidy, cozy counseling elder)
  ctx.fillStyle = beardColor;
  ctx.beginPath();
  ctx.moveTo(-6, -32);
  ctx.bezierCurveTo(-7, -26, -3, -21, 0, -21);
  ctx.bezierCurveTo(3, -21, 7, -26, 6, -32);
  ctx.closePath();
  ctx.fill();
  
  // mustache
  ctx.fillStyle = '#94a3b8';
  roundRect(ctx, -4, -32, 8, 2, 1); ctx.fill();
  
  // Counselor Cap (a cozy flat cap with a gold leaf/emblem)
  ctx.fillStyle = capColor;
  roundRect(ctx, -8.5, -45, 17, 5, 2); ctx.fill(); // cap brim
  ctx.fillStyle = capColor;
  roundRect(ctx, -7, -48, 14, 4, 3); ctx.fill(); // cap top dome
  
  // Gold badge on cap
  ctx.fillStyle = goldColor;
  ctx.beginPath(); ctx.arc(0, -44.5, 1.5, 0, 7); ctx.fill();
  
  // Eyes
  ctx.fillStyle = '#0f172a'; ctx.fillRect(-3, -35, 1.8, 2); ctx.fillRect(2, -35, 1.8, 2);
  
  // Warm smile
  ctx.strokeStyle = 'rgba(80,45,30,0.6)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(0, -31.5, 1.8, 0.1 * Math.PI, 0.9 * Math.PI); ctx.stroke();
  
  ctx.restore();
  
  // Floating quest prompt above the Mayor's head
  if (showQuestPrompt) {
    const b = Math.sin(t / 200) * 2;
    ctx.fillStyle = '#fbbf24'; roundRect(ctx, x - 5, y - 60 + b, 10, 13, 3); ctx.fill();
    ctx.fillStyle = '#1f2937'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('!', x, y - 53 + b);
  }
}

// A small district banner on a pole — flanks each building entrance in its colour.
function drawBanner(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, t: number) {
  const wave = Math.sin(t / 260) * 1.6;
  ctx.save(); ctx.translate(Math.round(x), Math.round(y));
  ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.ellipse(0, 1, 4, 2, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#6b5535'; ctx.fillRect(-1, -36, 2, 37);                 // pole
  ctx.fillStyle = '#e7d6a8'; ctx.beginPath(); ctx.arc(0, -36, 2, 0, 7); ctx.fill(); // finial
  ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(1, -35); ctx.lineTo(14 + wave, -30); ctx.lineTo(1, -25); ctx.closePath(); ctx.fill(); // pennant
  ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.beginPath(); ctx.moveTo(1, -35); ctx.lineTo(14 + wave, -30); ctx.lineTo(1, -30); ctx.closePath(); ctx.fill();
  ctx.restore();
}
// A simple rectangular welcome mat on the doorstep. Mastered domains get a
// golden border; the rest wear their own domain colour. A gentle "E"/"✓" prompt
// floats above so it always reads as "enter here".
function drawDoormat(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, done: boolean) {
  const col = done ? '#fbbf24' : color;
  y = y - TS * 0.26; // sit at the threshold, lowered toward the approach cell
  const w = TS * 0.78, h = TS * 0.42, rx = x - w / 2, ry = y - h / 2;
  ctx.save();
  // contact shadow under the mat
  ctx.fillStyle = 'rgba(0,0,0,0.22)'; roundRect(ctx, rx + 1.5, ry + 2.5, w, h, 5); ctx.fill();
  // woven mat body
  ctx.fillStyle = hexA(col, 0.22); roundRect(ctx, rx, ry, w, h, 5); ctx.fill();
  // faint weave lines
  ctx.save(); roundRect(ctx, rx, ry, w, h, 5); ctx.clip();
  ctx.strokeStyle = hexA(col, 0.18); ctx.lineWidth = 1;
  for (let lx = rx + 3; lx < rx + w; lx += 4) { ctx.beginPath(); ctx.moveTo(lx, ry); ctx.lineTo(lx, ry + h); ctx.stroke(); }
  ctx.restore();
  // outer border — gold if mastered, domain colour otherwise
  ctx.lineWidth = 2.4; ctx.strokeStyle = col; roundRect(ctx, rx, ry, w, h, 5); ctx.stroke();
  // inner border line
  ctx.lineWidth = 1; ctx.strokeStyle = hexA(col, 0.7); roundRect(ctx, rx + 3.5, ry + 3.5, w - 7, h - 7, 3); ctx.stroke();
  ctx.restore();
}
function Btn({ onClick, title, a, children }: { onClick: () => void; title: string; a?: string; children: React.ReactNode }) {
  return <button onClick={onClick} title={title} aria-label={title} className="p-2 sm:p-2.5 rounded-xl text-slate-200 hover:text-white border border-white/12 transition-all" style={{ background: 'rgba(10,18,40,0.7)', backdropFilter: 'blur(8px)' }} onMouseEnter={e => { if (a) e.currentTarget.style.background = `${a}44`; }} onMouseLeave={e => { e.currentTarget.style.background = 'rgba(10,18,40,0.7)'; }}>{children}</button>;
}
function Chip({ icon, label, title }: { icon: React.ReactNode; label: string; title?: string }) {
  return <div title={title} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/10 text-white text-xs font-black"><span aria-hidden>{icon}</span><span className="tabular-nums">{label}</span></div>;
}
function DPad({ onPress, onAction }: { onPress: (k: string, on: boolean) => void; onAction: () => void }) {
  const btn = (k: string, label: string, cls: string) => (<button className={`absolute w-12 h-12 rounded-xl text-white text-xl font-black flex items-center justify-center ${cls}`} style={{ background: 'rgba(10,18,40,0.7)', border: '1px solid rgba(255,255,255,0.2)', touchAction: 'none' }} onPointerDown={e => { e.preventDefault(); onPress(k, true); }} onPointerUp={e => { e.preventDefault(); onPress(k, false); }} onPointerLeave={() => onPress(k, false)} onContextMenu={e => e.preventDefault()}>{label}</button>);
  return (<div className="sm:hidden"><div className="absolute left-5 bottom-6 z-30" style={{ width: 150, height: 150 }}>{btn('w', '▲', 'left-[51px] top-0')}{btn('a', '◀', 'left-0 top-[51px]')}{btn('d', '▶', 'left-[102px] top-[51px]')}{btn('s', '▼', 'left-[51px] top-[102px]')}</div><button onClick={onAction} className="absolute right-6 bottom-12 z-30 w-16 h-16 rounded-full text-slate-900 text-lg font-black shadow-xl bg-emerald-400">E</button></div>);
}
