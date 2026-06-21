import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, Volume2, VolumeX, ExternalLink, X, Coins } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useAudio } from '../contexts/AudioContext';
import type { Career, Challenge, UserChallengeProgress, ColorScheme } from '../lib/database.types';
import type { DialogueLine } from './city/story';
import { interiorFor, RESOURCES, INTERNSHIP_LINKS } from './city/interiors';
import { GameRunner } from '../games/GameRunner';
import { DialogueBox } from '../components/DialogueBox';
import { saveChallengeProgress } from '../lib/progress';
import { loadWallet } from '../lib/wallet';
import { TILE, SHEET_COLS, loadBaseMap, loadSheet, classifyTerrain, buildWalkable, reachable, spreadCells, doorstepCells, type BaseMap } from './city/pico8';

const SCALE = 6;          // 8px tile → 48px on screen
const TS = TILE * SCALE;  // tile size in screen px
const SPEED = 2.7;        // player walk speed (px/frame)
const REACH = TS * 1.15;  // how close to interact

interface Interactable { kind: 'sim' | 'npc'; cx: number; cy: number; challenge?: Challenge; lines?: DialogueLine[]; idx?: number }

// Guards the one-time narrator against StrictMode double-mounts / auth churn.
const narratedThisSession = new Set<string>();

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}

export function DomainWorld() {
  const { careerSlug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { muted, toggleMute } = useAudio();

  const [career, setCareer] = useState<Career | null>(null);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const [selected, setSelected] = useState<Challenge | null>(null);
  const [dialogue, setDialogue] = useState<DialogueLine[] | null>(null);
  const [nearLabel, setNearLabel] = useState<string | null>(null);
  const [showRes, setShowRes] = useState(false);
  const [coins, setCoins] = useState(0);

  // engine refs (mutated by the rAF loop, never trigger re-renders)
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
  const interRef = useRef<Interactable[]>([]);
  const nearRef = useRef<Interactable | null>(null);
  const nearKeyRef = useRef<string | null>(null);
  const busyRef = useRef(false);
  const progressRef = useRef<Record<string, UserChallengeProgress>>({});
  const seenKeyRef = useRef<string | null>(null);
  const rafRef = useRef(0);

  const closeDialogue = () => {
    setDialogue(null);
    const k = seenKeyRef.current;
    if (k) { try { localStorage.setItem(k, '1'); } catch { /* ignore */ } seenKeyRef.current = null; }
  };

  busyRef.current = !!dialogue || !!selected;

  // ---- load everything ----
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!careerSlug) { navigate('/'); return; }
      setLoading(true); setReady(false);
      try {
        const { data: c } = await supabase.from('careers').select('*').eq('slug', careerSlug).maybeSingle();
        if (!c) { navigate('/'); return; }
        const career = c as Career;
        const { data: ch } = await (supabase.from('challenges') as any).select('*').eq('career_id', (career as any).id).order('order_index');
        const challenges = (ch || []) as Challenge[];
        let prog: Record<string, UserChallengeProgress> = {};
        if (user) {
          const { data: p } = await supabase.from('user_challenge_progress').select('*').eq('user_id', user.id).in('challenge_id', challenges.map(c => c.id));
          (p as UserChallengeProgress[] | null)?.forEach(r => { prog[r.challenge_id] = r; });
          setCoins(loadWallet(user.id).coins);
        }
        if (!alive) return;
        setCareer(career); setChallenges(challenges); progressRef.current = prog;

        const map = await loadBaseMap();
        const sheet = await loadSheet();
        const { solid } = classifyTerrain(sheet);
        const walk = buildWalkable(map, solid);
        mapRef.current = map; walkRef.current = walk; sheetRef.current = sheet;

        // spawn = walkable cell nearest map centre
        const spawn = findSpawn(map, walk);
        posRef.current = { x: (spawn % map.w + 0.5) * TS, y: (Math.floor(spawn / map.w) + 0.5) * TS };

        // portals at building doorsteps (reachable), spread out; fall back to open ground
        const reachSet = reachable(map, walk, spawn);
        const doors = doorstepCells(map).filter(i => reachSet.has(i));
        const openReach = [...reachSet].filter(i => { const x = i % map.w, y = Math.floor(i / map.w); return x > 2 && y > 2 && x < map.w - 3 && y < map.h - 3; });
        const portalPool = doors.length >= challenges.length + 1 ? doors : (openReach.length ? openReach : [...reachSet]);
        const cells = spreadCells(map, portalPool, challenges.length + 1); // +1 for the mentor NPC
        const npcCell = cells.shift()!; // closest-to-centre cell becomes the guide
        const inter: Interactable[] = challenges.map((challenge, i) => ({ kind: 'sim', challenge, cx: cells[i]?.x ?? npcCell.x, cy: cells[i]?.y ?? npcCell.y }));
        const m = interiorFor(careerSlug);
        const tip = RESOURCES[careerSlug]?.project;
        inter.push({ kind: 'npc', cx: npcCell.x, cy: npcCell.y, idx: 0, lines: [
          { speaker: m.mentorName, portrait: m.mentorFace, text: m.mentorLine },
          ...(tip ? [{ speaker: m.mentorName, portrait: m.mentorFace, text: `Tip: a great way to take ${career.name} further in real life — ${tip}` }] : []),
        ] });
        interRef.current = inter;

        setReady(true); setLoading(false);
      } catch (e) { console.error('DomainWorld load', e); setLoading(false); }
    })();
    return () => { alive = false; cancelAnimationFrame(rafRef.current); };
  }, [careerSlug, user]);

  // ---- one-time narrator welcome (decoupled from the load so it's reliable) ----
  useEffect(() => {
    if (!ready || !career || !careerSlug || narratedThisSession.has(careerSlug)) return;
    const seenKey = `questford_world_${careerSlug}_${user?.id || 'guest'}`;
    let seen = false; try { seen = !!localStorage.getItem(seenKey); } catch { /* ignore */ }
    if (seen) return;
    narratedThisSession.add(careerSlug);
    seenKeyRef.current = seenKey; // written to localStorage when the player closes it
    const m = interiorFor(careerSlug);
    setDialogue([
      { speaker: m.mentorName, portrait: m.mentorFace, text: `Welcome to the ${career.name} district! I'm ${m.mentorName}, your guide here.` },
      { speaker: m.mentorName, portrait: m.mentorFace, text: `Use WASD or the arrow keys to walk around. The glowing markers are real ${career.name} simulations.` },
      { speaker: m.mentorName, portrait: m.mentorFace, text: `Walk up to one and press E to begin — or come find me for tips. Off you go!` },
    ]);
  }, [ready, career, careerSlug, user]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
      if (busyRef.current) return;
      if (k === 'e' || k === 'enter') {
        const n = nearRef.current;
        if (n?.kind === 'sim' && n.challenge) setSelected(n.challenge);
        else if (n?.kind === 'npc') setDialogue(n.lines || null);
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
  }, []);

  // ---- render / game loop ----
  useEffect(() => {
    if (!ready) return;
    const loop = (t: number) => {
      rafRef.current = requestAnimationFrame(loop);
      const cv = canvasRef.current, wrap = wrapRef.current, map = mapRef.current, sheet = sheetRef.current, walk = walkRef.current;
      if (!cv || !wrap || !map || !sheet) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const vw = wrap.clientWidth, vh = wrap.clientHeight;
      if (cv.width !== Math.round(vw * dpr) || cv.height !== Math.round(vh * dpr)) { cv.width = Math.round(vw * dpr); cv.height = Math.round(vh * dpr); }
      const ctx = cv.getContext('2d')!;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.imageSmoothingEnabled = false;

      const worldW = map.w * TS, worldH = map.h * TS;
      const pos = posRef.current;

      // movement
      movingRef.current = false;
      if (!busyRef.current) {
        const K = keysRef.current; let dx = 0, dy = 0;
        if (K.has('a') || K.has('arrowleft')) dx -= 1; if (K.has('d') || K.has('arrowright')) dx += 1;
        if (K.has('w') || K.has('arrowup')) dy -= 1; if (K.has('s') || K.has('arrowdown')) dy += 1;
        if (dx || dy) {
          movingRef.current = true;
          const len = Math.hypot(dx, dy) || 1; dx = dx / len * SPEED; dy = dy / len * SPEED;
          if (dx) faceRef.current = dx < 0 ? -1 : 1;
          const okX = walkableAt(map, walk, pos.x + dx, pos.y); if (okX) pos.x = Math.max(2, Math.min(worldW - 2, pos.x + dx));
          const okY = walkableAt(map, walk, pos.x, pos.y + dy); if (okY) pos.y = Math.max(2, Math.min(worldH - 2, pos.y + dy));
        }
      }

      // camera (centre on player, clamped)
      const cam = camRef.current;
      cam.x = clamp(pos.x - vw / 2, 0, Math.max(0, worldW - vw));
      cam.y = clamp(pos.y - vh / 2, 0, Math.max(0, worldH - vh));

      // draw map (cull to viewport)
      ctx.clearRect(0, 0, vw, vh);
      const c0 = Math.max(0, Math.floor(cam.x / TS)), c1 = Math.min(map.w - 1, Math.ceil((cam.x + vw) / TS));
      const r0 = Math.max(0, Math.floor(cam.y / TS)), r1 = Math.min(map.h - 1, Math.ceil((cam.y + vh) / TS));
      for (let ry = r0; ry <= r1; ry++) for (let cx2 = c0; cx2 <= c1; cx2++) {
        const dxp = Math.round(cx2 * TS - cam.x), dyp = Math.round(ry * TS - cam.y), idx = ry * map.w + cx2;
        blit(ctx, sheet, map.terrain[idx], dxp, dyp);
        blit(ctx, sheet, map.objects[idx], dxp, dyp);
      }

      // interactables
      let near: Interactable | null = null, nd = REACH;
      for (const it of interRef.current) {
        const wx = (it.cx + 0.5) * TS, wy = (it.cy + 0.5) * TS;
        const sx = wx - cam.x, sy = wy - cam.y;
        const dist = Math.hypot(wx - pos.x, wy - pos.y);
        if (dist < nd) { nd = dist; near = it; }
        if (it.kind === 'sim') drawPortal(ctx, sx, sy, (career?.color_scheme as unknown as ColorScheme)?.primary || '#6366f1', !!(it.challenge && progressRef.current[it.challenge.id]?.status === 'completed'), (challenges.findIndex(c => c.id === it.challenge?.id) + 1), t);
        else drawNpc(ctx, sx, sy, t);
      }
      nearRef.current = near;
      const key = near ? (near.kind === 'sim' ? `sim:${near.challenge?.id}` : 'npc') : null;
      if (key !== nearKeyRef.current) {
        nearKeyRef.current = key;
        setNearLabel(near ? (near.kind === 'sim' ? `Enter "${near.challenge?.title}"` : `Talk to ${interiorFor(careerSlug || '').mentorName}`) : null);
      }

      // player
      drawChar(ctx, pos.x - cam.x, pos.y - cam.y, (career?.color_scheme as unknown as ColorScheme)?.accent || '#22c55e', t, faceRef.current, movingRef.current);

      if (import.meta.env.DEV) (window as any).__dw = { px: pos.x, py: pos.y, ts: TS, mapW: map.w, mapH: map.h, walk, terrain: map.terrain, inter: interRef.current.map(it => ({ k: it.kind, x: it.cx, y: it.cy, title: it.challenge?.title })) };
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(rafRef.current); };
  }, [ready, career, challenges, careerSlug]);

  const onComplete = async (score: number) => {
    if (user && career && selected) {
      await saveChallengeProgress({ userId: user.id, careerId: (career as any).id, challengeId: selected.id, score, challengeIds: challenges.map(c => c.id) });
      const { data: p } = await supabase.from('user_challenge_progress').select('*').eq('user_id', user.id).in('challenge_id', challenges.map(c => c.id));
      const prog: Record<string, UserChallengeProgress> = {}; (p as UserChallengeProgress[] | null)?.forEach(r => { prog[r.challenge_id] = r; });
      progressRef.current = prog; setCoins(loadWallet(user.id).coins);
    }
    setSelected(null);
  };

  const cs = (career?.color_scheme as unknown as ColorScheme) || { primary: '#6366f1', secondary: '#8b5cf6', accent: '#22c55e', background: '#0a1228' };

  return (
    <div ref={wrapRef} className="fixed inset-0 overflow-hidden select-none" style={{ background: '#0a1228', touchAction: 'none' }}>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ imageRendering: 'pixelated' }} />

      {loading && <div className="absolute inset-0 flex items-center justify-center" style={{ background: '#0a1228' }}>
        <div className="text-center"><div className="text-5xl mb-3 animate-bounce">🏙️</div><p className="font-fantasy text-slate-200 text-xl">Entering the district…</p></div>
      </div>}

      {/* top HUD */}
      <header className="absolute top-0 inset-x-0 z-40 flex items-center justify-between gap-2 px-3 sm:px-5 py-3">
        <button onClick={() => navigate('/')} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-white font-bold text-sm shadow-lg" style={{ background: 'rgba(10,18,40,0.78)', border: '1px solid rgba(255,255,255,0.14)', backdropFilter: 'blur(8px)' }}>
          <ArrowLeft className="w-4 h-4" /> Map
        </button>
        <div className="px-3 py-2 rounded-xl text-white font-black text-sm shadow-lg truncate max-w-[45vw]" style={{ background: 'rgba(10,18,40,0.78)', border: `1px solid ${cs.primary}66`, backdropFilter: 'blur(8px)', color: '#fff' }}>{career?.name}</div>
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1 px-2.5 py-2 rounded-xl text-amber-300 font-black text-sm shadow-lg" style={{ background: 'rgba(10,18,40,0.78)', border: '1px solid rgba(250,204,21,0.35)', backdropFilter: 'blur(8px)' }}><Coins className="w-4 h-4" />{coins}</div>
          <button onClick={() => setShowRes(true)} title="Next steps" className="p-2 rounded-xl text-emerald-300 shadow-lg" style={{ background: 'rgba(10,18,40,0.78)', border: '1px solid rgba(52,211,153,0.4)', backdropFilter: 'blur(8px)' }}><Sparkles className="w-5 h-5" /></button>
          <button onClick={toggleMute} className="p-2 rounded-xl text-slate-200 shadow-lg" style={{ background: 'rgba(10,18,40,0.78)', border: '1px solid rgba(255,255,255,0.14)', backdropFilter: 'blur(8px)' }}>{muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}</button>
        </div>
      </header>

      {/* interaction prompt */}
      {nearLabel && !dialogue && !selected && (
        <div className="absolute left-1/2 -translate-x-1/2 bottom-24 z-30 px-4 py-2 rounded-2xl text-white font-bold shadow-xl flex items-center gap-2 animate-bounce-in" style={{ background: 'rgba(10,18,40,0.9)', border: `2px solid ${cs.accent}` }}>
          <span className="px-2 py-0.5 rounded-md text-slate-900 text-xs font-black" style={{ background: cs.accent }}>E</span>{nearLabel}
        </div>
      )}

      {/* controls hint */}
      {ready && !dialogue && !selected && (
        <div className="absolute left-1/2 -translate-x-1/2 bottom-6 z-20 px-3 py-1.5 rounded-full text-white/80 text-xs font-bold" style={{ background: 'rgba(10,18,40,0.6)' }}>
          WASD / arrows to move · E to interact
        </div>
      )}

      {/* mobile d-pad */}
      {ready && !dialogue && !selected && <DPad onPress={(k, on) => { if (on) keysRef.current.add(k); else keysRef.current.delete(k); }} onAction={() => { const n = nearRef.current; if (n?.kind === 'sim' && n.challenge) setSelected(n.challenge); else if (n?.kind === 'npc') setDialogue(n.lines || null); }} accent={cs.accent} />}

      {dialogue && <DialogueBox lines={dialogue} onClose={closeDialogue} />}

      {selected && (
        <div className="fixed inset-0 z-[300]" style={{ background: '#000' }}>
          <GameRunner slug={careerSlug || ''} challenge={selected} onComplete={onComplete} onExit={() => setSelected(null)} />
        </div>
      )}

      {showRes && (() => { const r = RESOURCES[careerSlug || '']; if (!r) return null; return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" style={{ background: 'rgba(2,6,23,0.62)', backdropFilter: 'blur(3px)' }} onClick={() => setShowRes(false)}>
          <div className="w-full max-w-md rounded-3xl border-4 shadow-2xl overflow-hidden" style={{ background: 'linear-gradient(160deg,#0f1f1a,#0b1220)', borderColor: '#34d399' }} onClick={e => e.stopPropagation()}>
            <div className="relative px-5 py-4 border-b border-white/10"><button onClick={() => setShowRes(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white"><X className="w-5 h-5" /></button><div className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-emerald-300" /><span className="font-bold text-white text-xl">Next Steps · {career?.name}</span></div></div>
            <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
              <div><div className="text-emerald-300 text-[11px] font-black uppercase tracking-widest mb-1">Portfolio project</div><p className="text-white text-sm leading-relaxed">{r.project}</p></div>
              <div><div className="text-emerald-300 text-[11px] font-black uppercase tracking-widest mb-2">Learn it for real</div><div className="space-y-2">{r.links.map(l => <a key={l.url} href={l.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between gap-2 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors group"><span className="text-white font-bold text-sm">{l.label}</span><ExternalLink className="w-4 h-4 text-emerald-300 group-hover:scale-110 transition-transform" /></a>)}</div></div>
              <div><div className="text-emerald-300 text-[11px] font-black uppercase tracking-widest mb-2">Find internships</div><div className="flex flex-wrap gap-2">{INTERNSHIP_LINKS.map(l => <a key={l.url} href={l.url} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-400/30 text-emerald-200 text-xs font-bold hover:bg-emerald-500/25 transition-colors">{l.label}</a>)}</div></div>
            </div>
            <button onClick={() => setShowRes(false)} className="w-full py-3.5 font-black text-slate-900" style={{ background: '#34d399' }}>Got it</button>
          </div>
        </div>
      ); })()}
    </div>
  );
}

// ===== helpers =====
// (DialogueBox imported at top)
function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }
function shadeHex(hex: string, p: number) {
  const n = parseInt((hex || '#888888').replace('#', ''), 16);
  const r = Math.max(0, Math.min(255, (n >> 16) + p)), g = Math.max(0, Math.min(255, ((n >> 8) & 0xff) + p)), b = Math.max(0, Math.min(255, (n & 0xff) + p));
  return `rgb(${r},${g},${b})`;
}
function walkableAt(map: BaseMap, walk: boolean[], wx: number, wy: number) {
  const cx = Math.floor(wx / TS), cy = Math.floor(wy / TS);
  if (cx < 0 || cy < 0 || cx >= map.w || cy >= map.h) return false;
  return walk[cy * map.w + cx];
}
function findSpawn(map: BaseMap, walk: boolean[]) {
  const cx = Math.floor(map.w / 2), cy = Math.floor(map.h / 2);
  for (let rad = 0; rad < Math.max(map.w, map.h); rad++) {
    for (let dy = -rad; dy <= rad; dy++) for (let dx = -rad; dx <= rad; dx++) {
      const x = cx + dx, y = cy + dy;
      if (x < 0 || y < 0 || x >= map.w || y >= map.h) continue;
      if (walk[y * map.w + x]) return y * map.w + x;
    }
  }
  return walk.findIndex(Boolean);
}
function blit(ctx: CanvasRenderingContext2D, sheet: HTMLImageElement, idx: number, dx: number, dy: number) {
  if (idx < 0) return;
  const sx = (idx % SHEET_COLS) * TILE, sy = Math.floor(idx / SHEET_COLS) * TILE;
  ctx.drawImage(sheet, sx, sy, TILE, TILE, dx, dy, TS, TS);
}
function drawChar(ctx: CanvasRenderingContext2D, x: number, y: number, body: string, t: number, face: number, moving = false) {
  const swing = moving ? Math.sin(t / 70) : 0;          // leg / arm swing
  const bob = moving ? Math.abs(Math.sin(t / 70)) * 2 : Math.sin(t / 420) * 1.2;
  const dark = shadeHex(body, -42), light = shadeHex(body, 26);
  ctx.fillStyle = 'rgba(0,0,0,0.26)'; ctx.beginPath(); ctx.ellipse(x, y + 2, 12, 4, 0, 0, 7); ctx.fill();
  ctx.save(); ctx.translate(Math.round(x), Math.round(y - bob)); ctx.scale(face, 1);
  // legs (alternating step)
  ctx.fillStyle = '#3a4258';
  ctx.fillRect(-6, -12 + Math.max(0, swing * 2), 5, 12);
  ctx.fillRect(1, -12 + Math.max(0, -swing * 2), 5, 12);
  ctx.fillStyle = '#23283a'; ctx.fillRect(-7, -2 + Math.max(0, swing * 2), 6, 3); ctx.fillRect(1, -2 + Math.max(0, -swing * 2), 6, 3); // shoes
  // body + shaded side
  ctx.fillStyle = body; roundRect(ctx, -9, -27, 18, 17, 5); ctx.fill();
  ctx.fillStyle = dark; roundRect(ctx, 3, -27, 6, 17, 5); ctx.fill();
  // arms
  ctx.fillStyle = light; ctx.fillRect(-10, -25 + swing * 2, 4, 10); ctx.fillRect(6, -25 - swing * 2, 4, 10);
  // head
  ctx.fillStyle = '#f6cfa3'; roundRect(ctx, -8, -42, 16, 15, 6); ctx.fill();
  ctx.fillStyle = '#e3b187'; roundRect(ctx, 2, -42, 6, 15, 6); ctx.fill();         // face shade
  ctx.fillStyle = '#3b2a1a'; roundRect(ctx, -9, -43, 18, 7, 5); ctx.fill();        // hair
  ctx.fillStyle = '#15171f'; ctx.fillRect(-3, -35, 2.4, 3); ctx.fillRect(3, -35, 2.4, 3); // eyes
  ctx.strokeStyle = 'rgba(60,40,30,0.5)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(0, -31, 2.4, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke(); // smile
  ctx.restore();
}
function drawNpc(ctx: CanvasRenderingContext2D, x: number, y: number, t: number) {
  drawChar(ctx, x, y, '#0ea5e9', t, -1, false);
  // "!" bubble
  const b = Math.sin(t / 200) * 2;
  ctx.fillStyle = '#fbbf24'; roundRect(ctx, x - 5, y - 60 + b, 10, 13, 3); ctx.fill();
  ctx.fillStyle = '#1f2937'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('!', x, y - 53 + b);
}
function drawPortal(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, done: boolean, num: number, t: number) {
  const pulse = (Math.sin(t / 320) + 1) / 2;
  const col = done ? '#fbbf24' : color;
  ctx.save();
  ctx.globalAlpha = 0.35 + 0.4 * pulse; ctx.strokeStyle = col; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(x, y - 2, 20 + pulse * 7, 0, 7); ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(x, y + 16, 15, 5, 0, 0, 7); ctx.fill();
  ctx.fillStyle = col; roundRect(ctx, x - 14, y - 16, 28, 30, 9); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.85)'; roundRect(ctx, x - 14, y - 16, 28, 9, 6); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.font = 'bold 17px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(done ? '✓' : String(num), x, y + 1);
  ctx.restore();
}

// On-screen controls for touch devices.
function DPad({ onPress, onAction, accent }: { onPress: (k: string, on: boolean) => void; onAction: () => void; accent: string }) {
  const btn = (k: string, label: string, cls: string) => (
    <button className={`absolute w-12 h-12 rounded-xl text-white text-xl font-black flex items-center justify-center ${cls}`} style={{ background: 'rgba(10,18,40,0.7)', border: '1px solid rgba(255,255,255,0.2)', touchAction: 'none' }}
      onPointerDown={e => { e.preventDefault(); onPress(k, true); }} onPointerUp={e => { e.preventDefault(); onPress(k, false); }} onPointerLeave={() => onPress(k, false)} onContextMenu={e => e.preventDefault()}>{label}</button>
  );
  return (
    <div className="sm:hidden">
      <div className="absolute left-5 bottom-6 z-30" style={{ width: 150, height: 150 }}>
        {btn('w', '▲', 'left-[51px] top-0')}{btn('a', '◀', 'left-0 top-[51px]')}{btn('d', '▶', 'left-[102px] top-[51px]')}{btn('s', '▼', 'left-[51px] top-[102px]')}
      </div>
      <button onClick={onAction} className="absolute right-6 bottom-12 z-30 w-16 h-16 rounded-full text-slate-900 text-lg font-black shadow-xl" style={{ background: accent }}>E</button>
    </div>
  );
}
