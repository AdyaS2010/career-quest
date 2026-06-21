import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as LucideIcons from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Star, Coins, Volume2, VolumeX, User, Trophy, Map as MapIcon, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useAudio } from '../contexts/AudioContext';
import type { Career, ColorScheme } from '../lib/database.types';
import type { DialogueLine } from './city/story';
import { DialogueBox } from '../components/DialogueBox';
import { loadWallet } from '../lib/wallet';
import { TILE, SHEET_COLS, loadBaseMap, loadSheet, classifyTerrain, buildWalkable, reachable, spreadCells, doorstepCells, doorFrontCells, isRoad, type BaseMap } from './city/pico8';

const SCALE = 6, TS = TILE * SCALE, SPEED = 2.7, REACH = TS * 1.3;
let cityNarrated = false; // StrictMode-safe one-shot guard

type Rect = { x: number; y: number; w: number; h: number };
// Force WALKABLE (overrides everything, incl. buildings). Read off the 📍 readout.
const WALKABLE_OVERRIDES: Rect[] = [
  { x: 22, y: 13, w: 7, h: 3 }, // open courtyard / sidewalk (22,13)–(28,15)
  { x: 28, y: 11, w: 7, h: 5 }, // rooftop (28,11)–(34,15)
];
// Walkable EXCEPT solid buildings (e.g. an open sand area dotted with houses).
const SOFT_WALKABLE: Rect[] = [
  { x: 22, y: 0, w: 7, h: 12 }, // orange/sand area (22,11) and upward, houses stay solid
];
// Force SOLID (e.g. rooftops that read as walkable). Read off the 📍 readout.
const SOLID_OVERRIDES: Rect[] = [];

interface Door { slug: string; name: string; color: ColorScheme; icon: string; cx: number; cy: number; mastered: boolean }

export function CityHub() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { muted, toggleMute } = useAudio();

  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const [doors, setDoors] = useState<Door[]>([]);
  const [dialogue, setDialogue] = useState<DialogueLine[] | null>(null);
  const [nearLabel, setNearLabel] = useState<string | null>(null);
  const [coins, setCoins] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<BaseMap | null>(null);
  const walkRef = useRef<boolean[]>([]);
  const sheetRef = useRef<HTMLImageElement | null>(null);
  const posRef = useRef({ x: 0, y: 0 });
  const camRef = useRef({ x: 0, y: 0 });
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

  busyRef.current = !!dialogue;

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
        posRef.current = { x: (spawn % map.w + 0.5) * TS, y: (Math.floor(spawn / map.w) + 0.5) * TS };
        const reachSet = reachable(map, walk, spawn);
        const need = careers.length + 1;
        const central = (i: number) => { const x = i % map.w, y = Math.floor(i / map.w); return x > 3 && y > 3 && x < map.w - 4 && y < map.h - 4; };
        const doorFronts = doorFrontCells(map, walk).filter(i => reachSet.has(i) && central(i));   // in front of real doors, off the map edge
        const stepCells = doorstepCells(map).filter(i => walk[i] && reachSet.has(i) && central(i)); // any building doorstep
        const openReach = [...reachSet].filter(central);
        const pool = doorFronts.length >= need ? doorFronts : (stepCells.length >= need ? stepCells : (openReach.length ? openReach : [...reachSet]));
        const cells = spreadCells(map, pool, careers.length + 1);
        const npc = cells.shift()!;
        const built: Door[] = careers.map((c, i) => ({ slug: c.slug, name: c.name, color: c.color_scheme as unknown as ColorScheme, icon: c.icon as string, cx: cells[i]?.x ?? npc.x, cy: cells[i]?.y ?? npc.y, mastered: mastered.has(c.slug) }));
        if (!alive) return;
        doorsRef.current = built; setDoors(built);
        npcRef.current = { cx: npc.x, cy: npc.y, lines: [
          { speaker: 'Mayor Vale', portrait: '🧑‍💼', text: `Welcome to Questford! Every building here is a different career waiting for you to try.` },
          { speaker: 'Mayor Vale', portrait: '🧑‍💼', text: `Walk up to any one and press E to step inside. Master all eight and you'll have explored the whole city!` },
        ] };

        setReady(true); setLoading(false);
      } catch (e) { console.error('CityHub load', e); setLoading(false); }
    })();
    return () => { alive = false; cancelAnimationFrame(rafRef.current); };
  }, [user]);

  // one-time city welcome
  useEffect(() => {
    if (!ready || cityNarrated) return;
    const key = `questford_cityhub_${user?.id || 'guest'}`;
    let seen = false; try { seen = !!localStorage.getItem(key); } catch { /* ignore */ }
    if (seen) return;
    cityNarrated = true;
    try { localStorage.setItem(key, '1'); } catch { /* ignore */ }
    setDialogue([
      { speaker: 'Questopher', portrait: '🤖', text: `Welcome to Questford — your city of careers! I'm Questopher, your guide.` },
      { speaker: 'Questopher', portrait: '🤖', text: `Use WASD or the arrow keys to explore. Each signed building is a career — walk to its door and press E to head inside.` },
      { speaker: 'Questopher', portrait: '🤖', text: `Find one that sparks your curiosity and dive in. Adventure awaits!` },
    ]);
  }, [ready, user]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
      if (busyRef.current) return;
      if (k === 'e' || k === 'enter') { const n = nearRef.current; if (n === 'npc') setDialogue(npcRef.current?.lines || null); else if (n) navigate(`/career/${n.slug}`); return; }
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
      const cam = camRef.current;
      cam.x = clamp(pos.x - vw / 2, 0, Math.max(0, worldW - vw));
      cam.y = clamp(pos.y - vh / 2, 0, Math.max(0, worldH - vh));

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
        drawDoormat(ctx, sx, sy, d.color.primary, d.mastered, t);
        const el = signEls.current.get(d.slug);
        if (el) { const on = sx > -120 && sx < vw + 120 && sy > -80 && sy < vh + 80; el.style.opacity = on ? '1' : '0'; el.style.transform = `translate(-50%,-100%) translate(${sx}px, ${sy - 40}px)`; }
      }
      if (npcRef.current) { const wx = (npcRef.current.cx + 0.5) * TS, wy = (npcRef.current.cy + 0.5) * TS; const dist = Math.hypot(wx - pos.x, wy - pos.y); if (dist < nd) { nd = dist; near = 'npc'; } drawNpc(ctx, wx - cam.x, wy - cam.y, t); }
      nearRef.current = near;
      const key = near === 'npc' ? 'npc' : near ? `d:${near.slug}` : null;
      if (key !== nearKeyRef.current) { nearKeyRef.current = key; setNearLabel(near === 'npc' ? 'Talk to Mayor Vale' : near ? `Enter ${near.name}` : null); }

      drawChar(ctx, pos.x - cam.x, pos.y - cam.y, '#22c55e', t, faceRef.current, movingRef.current);

      // live tile-coordinate readout (so the player can point me to spots)
      if (coordElRef.current) coordElRef.current.textContent = `${Math.floor(pos.x / TS)}, ${Math.floor(pos.y / TS)}`;
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(rafRef.current); };
  }, [ready]);

  return (
    <div ref={wrapRef} className="fixed inset-0 overflow-hidden select-none" style={{ background: '#0a1228', touchAction: 'none' }}>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ imageRendering: 'pixelated' }} />
      {/* soft vignette for depth */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(120% 100% at 50% 45%, transparent 55%, rgba(6,10,24,0.42) 100%)' }} />

      {/* building signs (crisp HTML, positioned by the loop) */}
      {doors.map((d, di) => { const Icon = (LucideIcons[d.icon as keyof typeof LucideIcons] as LucideIcon) || Star; return (
        <div key={d.slug} ref={el => { signEls.current.set(d.slug, el); }} className="absolute left-0 top-0 z-20 pointer-events-none flex flex-col items-center" style={{ opacity: 0, transition: 'opacity .15s' }}>
          {/* mounting bar + chains → looks bolted to the building */}
          <div style={{ width: 58, height: 4, background: '#5a3a22', borderRadius: 2, boxShadow: '0 1px 0 #3d2715' }} />
          <div className="flex gap-9"><div style={{ width: 2, height: 6, background: '#6b4a28' }} /><div style={{ width: 2, height: 6, background: '#6b4a28' }} /></div>
          {/* wooden shingle board (gently swaying) */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md whitespace-nowrap" style={{ background: 'linear-gradient(#ccab6e,#a8844b)', border: '2px solid #6b4a28', boxShadow: '0 3px 7px rgba(0,0,0,0.5)', transformOrigin: 'top center', animation: `qf-sway ${3.6 + (di % 3) * 0.5}s ease-in-out ${(di % 4) * -0.6}s infinite` }}>
            <span className="w-4 h-4 rounded flex items-center justify-center shadow-sm" style={{ background: d.color.primary }}><Icon className="w-3 h-3 text-white" /></span>
            <span className="text-[12px]" style={{ color: '#3a2614', fontFamily: "'Comfortaa', cursive", fontWeight: 700, letterSpacing: '-0.01em', textShadow: '0 1px 0 rgba(255,255,255,0.25)' }}>{d.name}</span>
            {d.mastered && <span className="text-xs">🏆</span>}
          </div>
        </div>
      ); })}

      {loading && <div className="absolute inset-0 flex items-center justify-center" style={{ background: '#0a1228' }}><div className="text-center"><div className="text-5xl mb-3 animate-bounce">🏙️</div><p className="font-fantasy text-slate-200 text-xl">Waking up the city…</p></div></div>}

      {/* HUD */}
      <header className="absolute top-0 inset-x-0 z-40 flex items-center justify-between gap-2 px-3 sm:px-5 py-3">
        <div className="flex items-center gap-2 px-3 py-2 rounded-2xl" style={{ background: 'rgba(10,18,40,0.7)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)' }}>
          <span className="text-xl">🏙️</span><div className="hidden sm:block"><h1 className="font-fantasy text-white text-lg leading-none">Questford</h1><p className="text-[10px] tracking-[0.2em] text-blue-200/70 font-bold uppercase">City of Careers</p></div>
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/10 text-amber-300 text-xs font-black ml-1"><Coins className="w-4 h-4" />{coins}</div>
        </div>
        <div className="flex items-center gap-1 sm:gap-1.5">
          <Btn onClick={() => navigate('/map')} title="World map" a="#34d399"><MapIcon className="w-5 h-5" /></Btn>
          <Btn onClick={() => navigate('/leaderboard')} title="Leaderboard" a="#fbbf24"><Trophy className="w-5 h-5" /></Btn>
          <Btn onClick={() => navigate('/profile')} title="Profile" a="#60a5fa"><User className="w-5 h-5" /></Btn>
          <Btn onClick={toggleMute} title="Mute">{muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}</Btn>
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

      {ready && !dialogue && <DPad onPress={(k, on) => { if (on) keysRef.current.add(k); else keysRef.current.delete(k); }} onAction={() => { const n = nearRef.current; if (n === 'npc') setDialogue(npcRef.current?.lines || null); else if (n) navigate(`/career/${n.slug}`); }} />}

      {dialogue && <DialogueBox lines={dialogue} onClose={() => setDialogue(null)} />}
    </div>
  );
}

// ===== helpers =====
function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }
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
function drawNpc(ctx: CanvasRenderingContext2D, x: number, y: number, t: number) {
  drawChar(ctx, x, y, '#a855f7', t, -1, false);
  const b = Math.sin(t / 200) * 2;
  ctx.fillStyle = '#fbbf24'; roundRect(ctx, x - 5, y - 60 + b, 10, 13, 3); ctx.fill();
  ctx.fillStyle = '#1f2937'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('!', x, y - 53 + b);
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
// A welcome mat + pulsing up-arrow right on the doorstep — clearly "enter here".
function drawDoormat(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, done: boolean, t: number) {
  const pulse = (Math.sin(t / 300) + 1) / 2, col = done ? '#fbbf24' : color;
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.18)'; roundRect(ctx, x - 14, y - 5, 28, 15, 4); ctx.fill();
  ctx.fillStyle = col; roundRect(ctx, x - 13, y - 6, 26, 14, 4); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.85)'; roundRect(ctx, x - 9, y - 3, 18, 8, 2); ctx.fill();
  ctx.fillStyle = col; ctx.font = 'bold 9px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(done ? '✓' : 'E', x, y + 1.5);
  // pulsing arrow toward the door
  ctx.globalAlpha = 0.5 + 0.5 * pulse; ctx.fillStyle = col; const ay = y - 16 - pulse * 3;
  ctx.beginPath(); ctx.moveTo(x, ay - 6); ctx.lineTo(x - 6, ay); ctx.lineTo(x + 6, ay); ctx.closePath(); ctx.fill();
  ctx.restore();
}
function Btn({ onClick, title, a, children }: { onClick: () => void; title: string; a?: string; children: React.ReactNode }) {
  return <button onClick={onClick} title={title} aria-label={title} className="p-2 sm:p-2.5 rounded-xl text-slate-200 hover:text-white border border-white/12 transition-all" style={{ background: 'rgba(10,18,40,0.7)', backdropFilter: 'blur(8px)' }} onMouseEnter={e => { if (a) e.currentTarget.style.background = `${a}44`; }} onMouseLeave={e => { e.currentTarget.style.background = 'rgba(10,18,40,0.7)'; }}>{children}</button>;
}
function DPad({ onPress, onAction }: { onPress: (k: string, on: boolean) => void; onAction: () => void }) {
  const btn = (k: string, label: string, cls: string) => (<button className={`absolute w-12 h-12 rounded-xl text-white text-xl font-black flex items-center justify-center ${cls}`} style={{ background: 'rgba(10,18,40,0.7)', border: '1px solid rgba(255,255,255,0.2)', touchAction: 'none' }} onPointerDown={e => { e.preventDefault(); onPress(k, true); }} onPointerUp={e => { e.preventDefault(); onPress(k, false); }} onPointerLeave={() => onPress(k, false)} onContextMenu={e => e.preventDefault()}>{label}</button>);
  return (<div className="sm:hidden"><div className="absolute left-5 bottom-6 z-30" style={{ width: 150, height: 150 }}>{btn('w', '▲', 'left-[51px] top-0')}{btn('a', '◀', 'left-0 top-[51px]')}{btn('d', '▶', 'left-[102px] top-[51px]')}{btn('s', '▼', 'left-[51px] top-[102px]')}</div><button onClick={onAction} className="absolute right-6 bottom-12 z-30 w-16 h-16 rounded-full text-slate-900 text-lg font-black shadow-xl bg-emerald-400">E</button></div>);
}
