import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, Trophy, DoorOpen, Sparkles, ExternalLink, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import type { Career, Challenge, UserChallengeProgress } from '../lib/database.types';
import { interiorFor, ROOM_W, ROOM_H, ROOM_SPAWN, ROOM_EXIT, FLOOR_PATTERN, RESOURCES, INTERNSHIP_LINKS, type Furniture } from './city/interiors';
import { GameRunner } from '../games/GameRunner';
import { saveChallengeProgress } from '../lib/progress';
import { DialogueBox } from '../components/DialogueBox';
import type { DialogueLine } from './city/story';
import { CharacterSprite, PLAYER_PALETTE, type Palette } from './city/art';
import { FurnitureSprite, SeatedNpc, PatientSprite, WallPanel, JobStation } from './city/interiorArt';
import { AMENITY_SLUGS } from './city/cityLayout';
import { AmenityInterior } from './AmenityInterior';
import { awardCoins, loadWallet } from '../lib/wallet';

const SPEED = 260, ACCEL_K = 16, HALF = 14, NEAR = 66;

function overlap(ax: number, ay: number, aw: number, ah: number, b: Furniture) {
  return ax < b.x + b.w && ax + aw > b.x && ay < b.y + b.h && ay + ah > b.y;
}

// per-room floor finish (planks / tile grout / carpet weave / marble veins)
function floorStyle(pat: 'wood' | 'tile' | 'carpet' | 'marble', _floor: string, alt: string) {
  switch (pat) {
    case 'wood': return { backgroundImage: `repeating-linear-gradient(90deg, ${alt} 0 2px, transparent 2px 72px), repeating-linear-gradient(0deg, rgba(0,0,0,0.05) 0 1px, transparent 1px 26px)`, opacity: 0.55 };
    case 'marble': return { backgroundImage: `linear-gradient(120deg, rgba(255,255,255,0.28), transparent 42%), repeating-linear-gradient(57deg, rgba(110,110,135,0.10) 0 2px, transparent 2px 96px)`, opacity: 0.7 };
    case 'carpet': return { backgroundImage: `radial-gradient(circle at 8px 8px, ${alt} 1.5px, transparent 2px)`, backgroundSize: '16px 16px', opacity: 0.5 };
    default: return { backgroundImage: `linear-gradient(${alt} 2px, transparent 2px), linear-gradient(90deg, ${alt} 2px, transparent 2px)`, backgroundSize: '78px 78px', opacity: 0.5 };
  }
}

// Route dispatcher: amenity slugs (market/shop/gym) open the shop interior;
// everything else is a career simulation interior.
export function BuildingInterior() {
  const { careerSlug } = useParams();
  if (careerSlug && AMENITY_SLUGS.includes(careerSlug)) return <AmenityInterior slug={careerSlug} />;
  return <CareerInterior />;
}

function CareerInterior() {
  const { careerSlug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const def = interiorFor(careerSlug || '');

  const [career, setCareer] = useState<Career | null>(null);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [progress, setProgress] = useState<Record<string, UserChallengeProgress>>({});
  const [loading, setLoading] = useState(true);
  const [, setFrame] = useState(0);
  const [viewport, setViewport] = useState({ w: window.innerWidth, h: window.innerHeight });
  const [selected, setSelected] = useState<Challenge | null>(null);
  const [near, setNear] = useState<{ kind: 'station' | 'mentor' | 'exit'; idx: number } | null>(null);
  const [dialogue, setDialogue] = useState<DialogueLine[] | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [showRes, setShowRes] = useState(false);
  const toastTimer = useRef(0);

  const player = useRef({ x: ROOM_SPAWN.x, y: ROOM_SPAWN.y, vx: 0, vy: 0, dir: 'up' as string, moving: false, phase: 0 });
  const keys = useRef<Set<string>>(new Set());
  const touch = useRef({ x: 0, y: 0 });
  const raf = useRef(0);
  const last = useRef(0);
  const nearRef = useRef<typeof near>(null);
  const selectedRef = useRef(false);
  selectedRef.current = !!selected;
  const dialogueRef = useRef(false);
  dialogueRef.current = !!dialogue;

  // every furniture piece blocks movement (rugs/decor/stations do not)
  const solids = def.furniture;

  // ---- load career data (same shape as CareerWorld) ----
  const load = useCallback(async () => {
    if (!careerSlug || !user) return;
    try {
      const { data: careerData } = await supabase.from('careers').select('*').eq('slug', careerSlug).maybeSingle();
      if (!careerData) { navigate('/'); return; }
      setCareer(careerData as Career);
      const { data: ch } = await (supabase.from('challenges') as any).select('*').eq('career_id', (careerData as any).id).order('order_index');
      const list = (ch || []) as Challenge[];
      setChallenges(list);
      const { data: prog } = await supabase.from('user_challenge_progress').select('*').eq('user_id', user.id).in('challenge_id', list.map(c => c.id));
      const map: Record<string, UserChallengeProgress> = {};
      ((prog || []) as UserChallengeProgress[]).forEach(p => { map[p.challenge_id] = p; });
      setProgress(map);
    } catch (e) { console.error('interior load', e); }
    finally { setLoading(false); }
  }, [careerSlug, user, navigate]);

  useEffect(() => { load(); }, [load]);

  // greet with the mentor line once on entry
  useEffect(() => {
    if (!loading) setDialogue([{ speaker: def.mentorName, portrait: def.mentorFace, text: def.mentorLine }]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  useEffect(() => {
    const onResize = () => setViewport({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const act = useCallback(() => {
    const n = nearRef.current;
    if (!n) return;
    if (n.kind === 'exit') { navigate('/'); return; }
    if (n.kind === 'mentor') { setDialogue([{ speaker: def.mentorName, portrait: def.mentorFace, text: def.mentorLine }]); return; }
    if (n.kind === 'station') { const c = challenges[n.idx]; if (c) setSelected(c); }
  }, [navigate, challenges, def]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (selectedRef.current || dialogueRef.current) return;
      const k = e.key.toLowerCase();
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
      if (k === 'e' || k === 'enter' || k === ' ' || k === 't') { act(); return; }
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
  }, [act]);

  // ---- movement loop ----
  useEffect(() => {
    if (loading) return;
    const wallet = loadWallet(user?.id || 'anon');
    const speedLvl = wallet.speedLvl || 0;
    const speedMultiplier = 1 + speedLvl * 0.18;
    const currentSpeed = SPEED * speedMultiplier;

    const step = (ts: number) => {
      const dt = last.current ? Math.min((ts - last.current) / 1000, 0.05) : 0;
      last.current = ts;
      const p = player.current;
      let ix = 0, iy = 0;
      if (!selectedRef.current && !dialogue) {
        const k = keys.current;
        ix = (k.has('d') || k.has('arrowright') ? 1 : 0) - (k.has('a') || k.has('arrowleft') ? 1 : 0) + touch.current.x;
        iy = (k.has('s') || k.has('arrowdown') ? 1 : 0) - (k.has('w') || k.has('arrowup') ? 1 : 0) + touch.current.y;
      }
      const l = Math.hypot(ix, iy);
      let tx = 0, ty = 0;
      if (l > 0.01) { tx = (ix / l) * currentSpeed; ty = (iy / l) * currentSpeed; }
      const s = 1 - Math.exp(-ACCEL_K * dt);
      p.vx += (tx - p.vx) * s; p.vy += (ty - p.vy) * s;
      const nx = p.x + p.vx * dt, ny = p.y + p.vy * dt;
      const blocked = (x: number, y: number) => solids.some(f => overlap(x - HALF, y - HALF, HALF * 2, HALF * 2, f));
      if (!blocked(nx, p.y)) p.x = Math.max(40, Math.min(ROOM_W - 40, nx)); else p.vx = 0;
      if (!blocked(p.x, ny)) p.y = Math.max(118, Math.min(ROOM_H - 36, ny)); else p.vy = 0;
      const sp = Math.hypot(p.vx, p.vy);
      p.moving = sp > 10;
      if (p.moving) { p.dir = Math.abs(p.vx) > Math.abs(p.vy) ? (p.vx > 0 ? 'right' : 'left') : (p.vy > 0 ? 'down' : 'up'); p.phase += (sp / currentSpeed) * dt * 12; }

      // nearest interactable
      let best: typeof near = null, bd = NEAR;
      def.stations.forEach((stn, i) => {
        if (!challenges[i]) return;
        const d = Math.hypot(p.x - stn.x, p.y - stn.y);
        if (d < bd) { bd = d; best = { kind: 'station', idx: i }; }
      });
      const dm = Math.hypot(p.x - ROOM_W / 2, p.y - 330);
      if (dm < bd) { bd = dm; best = { kind: 'mentor', idx: -1 }; }
      const de = Math.hypot(p.x - ROOM_EXIT.x, p.y - ROOM_EXIT.y);
      if (de < bd) { bd = de; best = { kind: 'exit', idx: -1 }; }
      if (JSON.stringify(best) !== JSON.stringify(nearRef.current)) { nearRef.current = best; setNear(best); }

      setFrame(f => (f + 1) % 1e6);
      raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [loading, def, challenges, solids, dialogue]);

  const onGameComplete = async (score: number) => {
    if (selected && user && career) {
      const before = new Set(Object.values(progress).filter(p => p.status === 'completed').map(p => p.challenge_id));
      before.add(selected.id);
      const nowAll = challenges.length > 0 && challenges.every(c => before.has(c.id));
      await saveChallengeProgress({
        userId: user.id, careerId: career.id, challengeId: selected.id, score,
        challengeIds: challenges.map(c => c.id),
      });
      await load();
      const reward = 20 + Math.round(score / 5) + (nowAll ? 100 : 0);
      awardCoins(user.id, reward);
      setToast(nowAll ? `Internship mastered! 🏆  Wages +${reward}` : `Shift complete!  Wages +${reward} 🪙`);
      window.clearTimeout(toastTimer.current);
      toastTimer.current = window.setTimeout(() => setToast(null), 2800);
    }
    setSelected(null);
  };

  if (selected && careerSlug) {
    return (
      <div className="min-h-screen">
        <GameRunner slug={careerSlug} challenge={selected} onComplete={onGameComplete} onExit={() => setSelected(null)} />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="fixed inset-0" style={{ background: '#0b1220' }} />
    );
  }

  const p = player.current;
  const scale = Math.min(viewport.w / ROOM_W, (viewport.h - 60) / ROOM_H) * 0.96;
  const promptText = near?.kind === 'exit' ? 'Leave to the city'
    : near?.kind === 'mentor' ? `Talk to ${def.mentorName}`
      : near?.kind === 'station' && challenges[near.idx] ? challenges[near.idx].title : '';
  const allDone = challenges.length > 0 && challenges.every(c => progress[c.id]?.status === 'completed');
  const floorPattern = FLOOR_PATTERN[careerSlug || ''] || 'tile';
  const res = RESOURCES[careerSlug || ''];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 overflow-hidden select-none"
      style={{ background: 'radial-gradient(circle at 50% 0%, #1f2937, #0b1220 70%)' }}
    >
      {/* header */}
      <div className="absolute top-0 inset-x-0 z-40 flex items-center justify-between px-4 py-2.5"
        style={{ background: 'linear-gradient(180deg, rgba(11,18,32,0.95), rgba(11,18,32,0.4) 90%, transparent)' }}>
        <button onClick={() => navigate('/')} className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white font-bold text-sm">
          <ArrowLeft className="w-4 h-4" /> City
        </button>
        <div className="text-center">
          <div className="font-fantasy text-white text-lg sm:text-2xl leading-none">{career?.name || def.room}</div>
          <div className="text-slate-300 text-[11px]">{def.room}{allDone ? ' · 🏆 Mastered' : ''}</div>
        </div>
        <div className="flex items-center gap-2">
          {res && (
            <button onClick={() => setShowRes(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 text-emerald-200 font-bold text-sm transition-colors">
              <Sparkles className="w-4 h-4" /> <span className="hidden sm:inline">Next Steps</span>
            </button>
          )}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 text-white font-bold text-sm">
            <Trophy className="w-4 h-4 text-amber-400" />{Object.values(progress).reduce((s, x) => s + x.best_score, 0)}
          </div>
        </div>
      </div>

      {/* scaled room */}
      <div className="absolute left-1/2 top-1/2" style={{ transform: `translate(-50%,-50%) scale(${scale})`, width: ROOM_W, height: ROOM_H, marginTop: 24 }}>
        <div className="absolute overflow-hidden rounded-2xl" style={{ width: ROOM_W, height: ROOM_H, boxShadow: '0 30px 80px rgba(0,0,0,0.6)' }}>
          {/* designed floor (per-room finish) */}
          <div className="absolute inset-0" style={{ background: def.floor }} />
          <div className="absolute inset-0" style={floorStyle(floorPattern, def.floor, def.floorAlt)} />
          <div className="absolute inset-0" style={{ boxShadow: 'inset 0 0 140px rgba(0,0,0,0.32)' }} />

          {/* area rug */}
          <div className="absolute rounded-2xl" style={{ left: def.rug.x, top: def.rug.y, width: def.rug.w, height: def.rug.h, background: def.rug.color, opacity: 0.5, border: `5px solid ${def.accent}`, boxShadow: 'inset 0 0 30px rgba(0,0,0,0.25)', zIndex: 1 }}>
            <div className="absolute inset-3 rounded-xl" style={{ border: '2px dashed rgba(255,255,255,0.35)' }} />
            <div className="absolute inset-6 rounded-lg" style={{ border: '1px solid rgba(255,255,255,0.2)' }} />
          </div>

          {/* back wall with crown molding, paneling and wainscoting */}
          <div className="absolute inset-x-0 top-0" style={{ height: 104, background: `linear-gradient(180deg, ${def.wall}, ${def.wallTrim})`, boxShadow: 'inset 0 -10px 18px rgba(0,0,0,0.4)', zIndex: 2 }}>
            <div className="absolute inset-x-0 top-0 h-2" style={{ background: 'rgba(255,255,255,0.22)' }} />
            <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(90deg, rgba(255,255,255,0.06) 2px, transparent 2px)', backgroundSize: '120px 100%' }} />
            {/* wainscot panel band */}
            <div className="absolute inset-x-0 bottom-0" style={{ height: 34, background: `linear-gradient(180deg, ${def.wallTrim}, rgba(0,0,0,0.25))` }}>
              <div className="absolute inset-x-0 top-0 h-1.5" style={{ background: def.accent, opacity: 0.85 }} />
              <div className="absolute inset-0" style={{ backgroundImage: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.08) 0 2px, transparent 2px 60px)' }} />
            </div>
          </div>
          {/* wall decor */}
          {def.decor.map((d, i) => (
            <div key={`d${i}`} className="absolute" style={{ left: d.x, top: d.y, zIndex: 3 }}>
              <WallPanel kind={d.kind} w={d.w} h={d.h} color={d.color} />
            </div>
          ))}

          {/* furniture (drawn, Y-sorted) */}
          {def.furniture.map((f, i) => (
            <div key={i} className="absolute" style={{ left: f.x, top: f.y, zIndex: Math.round(f.y + f.h) }}>
              <FurnitureSprite kind={f.kind} w={f.w} h={f.h} color={f.color} accent={f.accent} />
            </div>
          ))}

          {/* interior people (Y-sorted) */}
          {def.npcs.map((n, i) => {
            if (n.kind === 'patient') return <div key={`n${i}`} className="absolute" style={{ left: n.x, top: n.y, zIndex: Math.round(n.y) + 74 }}><PatientSprite blanket={n.blanket} /></div>;
            if (n.kind === 'seated') return <div key={`n${i}`} className="absolute" style={{ left: n.x - 17, top: n.y - 30, zIndex: Math.round(n.y) }}><SeatedNpc skin={n.skin} hair={n.hair} top={n.top} /></div>;
            return <div key={`n${i}`} className="absolute" style={{ left: n.x - 23, top: n.y - 50, zIndex: Math.round(n.y) }}>
              <CharacterSprite w={46} dir={n.dir || 'down'} phase={0} moving={false} palette={{ skin: n.skin || '#f3c79b', hair: n.hair || '#3b2a1a', top: n.top || '#3b82f6', pants: '#1f2937', pack: '#64748b' }} />
            </div>;
          })}

          {/* mentor (drawn) */}
          <div className="absolute" style={{ left: ROOM_W / 2, top: 330, width: 0, height: 0, zIndex: Math.round(330) }}>
            <div className="absolute left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-md bg-amber-500 text-slate-900 text-[10px] font-black whitespace-nowrap shadow" style={{ top: -62 }}>{def.mentorName}</div>
            <div className="absolute left-1/2 -translate-x-1/2 rounded-full bg-black/30 blur-sm" style={{ width: 26, height: 8, top: 12 }} />
            <div className="absolute qf-bob" style={{ left: -23, top: -48 }}>
              <CharacterSprite w={46} dir="down" phase={0} moving={false} palette={mentorPalette(def.accent)} />
            </div>
            {near?.kind === 'mentor' && <div className="absolute left-1/2 -translate-x-1/2 text-2xl animate-bounce" style={{ top: -78 }}>💬</div>}
          </div>

          {/* job terminals — sensible, labelled stations to start each task */}
          {def.stations.map((stn, i) => {
            const c = challenges[i];
            if (!c) return null;
            const done = progress[c.id]?.status === 'completed';
            const isNear = near?.kind === 'station' && near.idx === i;
            return (
              <div key={i} className="absolute" style={{ left: stn.x, top: stn.y, zIndex: Math.round(stn.y) + 2 }}>
                {/* labelled terminal card: real challenge title */}
                <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center" style={{ top: -86, width: 168 }}>
                  <div className="px-3 py-1.5 rounded-xl shadow-lg text-center" style={{ background: 'linear-gradient(180deg,#1e293b,#0f172a)', border: `2px solid ${isNear ? '#fde047' : 'rgba(255,255,255,0.18)'}` }}>
                    <div className="text-white font-black text-[11px] leading-tight">{c.title}</div>
                    <div className="text-[10px] font-bold mt-0.5" style={{ color: done ? '#fcd34d' : '#94a3b8' }}>
                      {done ? `★ Best ${progress[c.id].best_score}` : `Task ${i + 1} of ${challenges.length}`}
                    </div>
                  </div>
                  {isNear && <div className="mt-1 px-2 py-0.5 rounded-full bg-white text-slate-900 text-[10px] font-black shadow">Press E ▸</div>}
                </div>
                {/* the drawn terminal */}
                <div className="absolute -translate-x-1/2" style={{ left: 0, top: -54 }}>
                  <JobStation accent={def.accent} icon={stn.emoji} done={done} near={isNear} />
                </div>
                {done && <Star className="absolute left-1/2 -translate-x-1/2 w-4 h-4 text-yellow-400 fill-yellow-400" style={{ top: -98 }} />}
              </div>
            );
          })}

          {/* exit mat */}
          <div className="absolute" style={{ left: ROOM_EXIT.x - 36, top: ROOM_EXIT.y - 14, width: 72, zIndex: 5 }}>
            <div className="rounded-md flex items-center justify-center" style={{ width: 72, height: 26, background: near?.kind === 'exit' ? '#fde047' : '#475569', border: '2px solid rgba(0,0,0,0.3)' }}>
              <DoorOpen className="w-4 h-4" style={{ color: near?.kind === 'exit' ? '#0f172a' : '#cbd5e1' }} />
            </div>
          </div>

          {/* player */}
          <RoomPlayer x={p.x} y={p.y} dir={p.dir} moving={p.moving} phase={p.phase} />
        </div>
      </div>

      {/* shift-complete toast */}
      {toast && (
        <div className="absolute left-1/2 -translate-x-1/2 top-20 z-50 animate-fade-in px-6 py-3 rounded-2xl border-2 shadow-2xl font-black text-lg text-slate-900"
          style={{ background: 'linear-gradient(90deg,#fde68a,#fbbf24)', borderColor: '#f59e0b' }}>
          {toast}
        </div>
      )}

      {/* prompt */}
      {near && !dialogue && (
        <div className="absolute left-1/2 -translate-x-1/2 bottom-8 z-40 animate-fade-in">
          <button onClick={act} className="flex items-center gap-3 px-6 py-3.5 rounded-2xl border-2 shadow-2xl hover:scale-105 active:scale-95 transition-transform"
            style={{ background: 'rgba(15,23,42,0.92)', borderColor: def.accent }}>
            <span className="text-2xl">{near.kind === 'exit' ? '🚪' : near.kind === 'mentor' ? def.mentorFace : def.stations[near.idx].emoji}</span>
            <span className="text-white font-black">{promptText}</span>
            <span className="px-3 py-1.5 rounded-lg bg-white text-slate-900 font-black text-sm">{near.kind === 'mentor' ? 'T' : 'E'}</span>
          </button>
        </div>
      )}

      <div className="absolute right-4 bottom-4 z-30 text-[11px] text-white/70 bg-black/40 rounded-lg px-3 py-2 backdrop-blur hidden sm:block">
        <span className="font-bold">WASD / Arrows</span> walk · <span className="font-bold">E</span> use station · <span className="font-bold">T</span> talk
      </div>

      {/* mobile controls */}
      <RoomMobile onVec={(x, y) => { touch.current = { x, y }; }} onAct={act} canAct={!!near} label={near?.kind === 'mentor' ? 'T' : 'E'} />

      {dialogue && <DialogueBox lines={dialogue} onClose={() => setDialogue(null)} />}

      {/* Next Steps — real-world project + curated resources for this field */}
      {showRes && res && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" style={{ background: 'rgba(2,6,23,0.62)', backdropFilter: 'blur(3px)' }} onClick={() => setShowRes(false)}>
          <div className="w-full max-w-md rounded-3xl border-4 shadow-2xl overflow-hidden" style={{ background: 'linear-gradient(160deg,#0f1f1a,#0b1220)', borderColor: '#34d399' }} onClick={e => e.stopPropagation()}>
            <div className="relative px-5 py-4 border-b border-white/10" style={{ background: 'linear-gradient(180deg, rgba(52,211,153,0.16), transparent)' }}>
              <button onClick={() => setShowRes(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
              <div className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-emerald-300" /><span className="font-fantasy text-white text-xl">Next Steps · {career?.name || def.room}</span></div>
              <p className="text-slate-300 text-xs mt-1">Loved this field? Take it into the real world.</p>
            </div>
            <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
              <div>
                <div className="text-emerald-300 text-[11px] font-black uppercase tracking-widest mb-1">Portfolio project</div>
                <p className="text-white text-sm leading-relaxed">{res.project}</p>
              </div>
              <div>
                <div className="text-emerald-300 text-[11px] font-black uppercase tracking-widest mb-2">Learn it for real</div>
                <div className="space-y-2">
                  {res.links.map(l => (
                    <a key={l.url} href={l.url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-between gap-2 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors group">
                      <span className="text-white font-bold text-sm">{l.label}</span>
                      <ExternalLink className="w-4 h-4 text-emerald-300 group-hover:scale-110 transition-transform" />
                    </a>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-emerald-300 text-[11px] font-black uppercase tracking-widest mb-2">Find internships</div>
                <div className="flex flex-wrap gap-2">
                  {INTERNSHIP_LINKS.map(l => (
                    <a key={l.url} href={l.url} target="_blank" rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-400/30 text-emerald-200 text-xs font-bold hover:bg-emerald-500/25 transition-colors">{l.label}</a>
                  ))}
                </div>
              </div>
            </div>
            <button onClick={() => setShowRes(false)} className="w-full py-3.5 font-black text-slate-900" style={{ background: '#34d399' }}>Back to the floor</button>
          </div>
        </div>
      )}
    </motion.div>
  );
}

function mentorPalette(accent: string): Palette {
  return { skin: '#e7b48a', hair: '#3b2a1a', top: accent, pants: '#1f2937', pack: '#475569' };
}

/* walking avatar for interiors (shared SVG sprite) */
function RoomPlayer({ x, y, dir, moving, phase }: { x: number; y: number; dir: string; moving: boolean; phase: number }) {
  const bob = moving ? Math.abs(Math.sin(phase)) * 3 : 0;
  const flip = dir === 'left' ? -1 : 1;
  return (
    <div className="absolute" style={{ left: x, top: y, width: 0, height: 0, zIndex: Math.round(y) }}>
      <div className="absolute left-1/2 -translate-x-1/2 rounded-full bg-black/35 blur-[2px]" style={{ width: 28, height: 8, top: 12 }} />
      <div className="absolute" style={{ left: -23, top: -50, transform: `scaleX(${flip}) translateY(${-bob}px)` }}>
        <CharacterSprite w={46} dir={dir} phase={phase} moving={moving} palette={PLAYER_PALETTE} hat />
      </div>
    </div>
  );
}

function RoomMobile({ onVec, onAct, canAct, label }: { onVec: (x: number, y: number) => void; onAct: () => void; canAct: boolean; label: string }) {
  const press = (x: number, y: number) => (e: React.TouchEvent | React.MouseEvent) => { e.preventDefault(); onVec(x, y); };
  const release = (e: React.TouchEvent | React.MouseEvent) => { e.preventDefault(); onVec(0, 0); };
  const Pad = ({ x, y, lbl, cls }: { x: number; y: number; lbl: string; cls: string }) => (
    <button className={`absolute w-12 h-12 rounded-full bg-white/20 border border-white/30 text-white text-lg font-black flex items-center justify-center active:bg-white/40 ${cls}`}
      onTouchStart={press(x, y)} onTouchEnd={release} onMouseDown={press(x, y)} onMouseUp={release} onMouseLeave={release}>{lbl}</button>
  );
  return (
    <div className="sm:hidden">
      <div className="absolute left-4 bottom-5 z-40 w-40 h-40">
        <Pad x={0} y={-1} lbl="▲" cls="left-1/2 -translate-x-1/2 top-0" />
        <Pad x={0} y={1} lbl="▼" cls="left-1/2 -translate-x-1/2 bottom-0" />
        <Pad x={-1} y={0} lbl="◀" cls="left-0 top-1/2 -translate-y-1/2" />
        <Pad x={1} y={0} lbl="▶" cls="right-0 top-1/2 -translate-y-1/2" />
      </div>
      <button onClick={onAct} disabled={!canAct} className="absolute right-6 bottom-10 z-40 w-16 h-16 rounded-full font-black shadow-xl disabled:opacity-40"
        style={{ background: canAct ? '#fde68a' : 'rgba(255,255,255,0.2)', color: '#0f172a' }}>{label}</button>
    </div>
  );
}
