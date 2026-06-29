import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Coins, Check, Lock } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { ROOM_W, ROOM_H, ROOM_SPAWN, ROOM_EXIT } from './city/interiors';
import { AMENITY_DEFS, type ShopItem } from './city/amenities';
import { CharacterSprite } from './city/art';
import { FurnitureSprite, WallPanel, PlantSprite } from './city/interiorArt';
import { DialogueBox } from '../components/DialogueBox';
import { loadWallet, saveWallet, awardCoins, paletteFromWallet, type Wallet } from '../lib/wallet';
import type { DialogueLine } from './city/story';
import { supabase } from '../lib/supabase';
import { MemoryMatchGame, SpeedSortGame, WordScrambleGame, canPlay, recordPlay } from './city/CottageGames';

interface SpriteDef {
  r: number;
  c: number;
  w: number;
  h: number;
}

function RoguelikeSprite({
  r,
  c,
  w_tiles,
  h_tiles,
  width,
  height,
  className = "",
  style = {},
}: {
  r: number;
  c: number;
  w_tiles: number;
  h_tiles: number;
  width: number | string;
  height: number | string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const W_total = 458;
  const H_total = 305;
  const tile_size = 16;
  const margin = 1;

  const x_src = c * (tile_size + margin);
  const y_src = r * (tile_size + margin);
  const w_src = w_tiles * tile_size + (w_tiles - 1) * margin;
  const h_src = h_tiles * tile_size + (h_tiles - 1) * margin;

  const w_val = typeof width === 'number' ? width : parseFloat(width);
  const h_val = typeof height === 'number' ? height : parseFloat(height);

  const scale_x = w_val / w_src;
  const scale_y = h_val / h_src;

  const bg_width = W_total * scale_x;
  const bg_height = H_total * scale_y;
  const bg_x = -x_src * scale_x;
  const bg_y = -y_src * scale_y;

  return (
    <div
      className={className}
      style={{
        width: `${w_val}px`,
        height: `${h_val}px`,
        backgroundImage: 'url("/assets/cottage/roguelikeIndoor_transparent.png")',
        backgroundSize: `${bg_width}px ${bg_height}px`,
        backgroundPosition: `${bg_x}px ${bg_y}px`,
        imageRendering: 'pixelated',
        backgroundRepeat: 'no-repeat',
        ...style,
      }}
    />
  );
}

const COTTAGE_SPRITES: Record<string, SpriteDef> = {
  bed: { r: 15, c: 23, w: 2, h: 2 },       // Green double bed (Row 15, Col 23, 2x2 tiles)
  shelf: { r: 15, c: 5, w: 2, h: 2 },     // Double height bookshelf (Row 15, Col 5, 2x2 tiles)
  desk: { r: 16, c: 8, w: 3, h: 1 },       // Wooden table/desk (Row 16, Col 8, 3x1 tiles)
  sofa: { r: 7, c: 4, w: 4, h: 1 },       // Cozy wooden bench with red cushion (Row 7, Col 4, 4x1 tiles)
  tv: { r: 4, c: 21, w: 1, h: 1 },         // Retro TV (Row 4, Col 21, 1x1 tile)
  screen: { r: 4, c: 21, w: 1, h: 1 },     // Retro monitor console screen
  server: { r: 15, c: 11, w: 1, h: 2 },    // Tall metal server cabinet (Row 15, Col 11, 1x2 tiles)
  fridge: { r: 16, c: 9, w: 1, h: 2 },     // Tall wood cabinet (Row 16, Col 9, 1x2 tiles)
  rack: { r: 15, c: 0, w: 2, h: 1 },       // Low drawer cabinet (Row 15, Col 0, 2x1 tiles)

  // Kitchen/Dining additions
  sink: { r: 12, c: 8, w: 1, h: 1 },       // Kitchen sink counter (Row 12, Col 8, 1x1 tile)
  cabinet: { r: 12, c: 0, w: 1, h: 1 },    // Counter with double wooden doors (Row 12, Col 0, 1x1 tile)
  stove: { r: 14, c: 14, w: 1, h: 1 },     // Kitchen oven stove (Row 14, Col 14, 1x1 tile)
  stool: { r: 8, c: 20, w: 1, h: 1 },      // Wooden stool (Row 8, Col 20, 1x1 tile)
  table_v: { r: 0, c: 8, w: 1, h: 3 },     // Vertical table (Row 0, Col 8, 1x3 tiles)

  // Right room / Banquet additions
  piano: { r: 8, c: 23, w: 2, h: 2 },      // Grand piano (Row 8, Col 23, 2x2 tiles)

  // Decorative Kenney sprites for cozy ambiance
  torch: { r: 14, c: 10, w: 1, h: 1 },     // Wall torch / candle
  barrel: { r: 8, c: 14, w: 1, h: 1 },     // Wooden barrel
  chest: { r: 8, c: 10, w: 1, h: 1 },      // Small treasure chest
  crate: { r: 8, c: 12, w: 1, h: 1 },      // Wooden storage crate
  fireplace: { r: 14, c: 16, w: 1, h: 2 }, // Warm fireplace
  bookshelf_tall: { r: 15, c: 5, w: 2, h: 2 }, // Tall bookshelf variant
  mirror_full: { r: 14, c: 22, w: 1, h: 2 }, // Standing mirror
};

// Interactive game stations in Cottage Noir — walk near and press E to play
type GameType = 'memory' | 'speedsort' | 'wordscramble';
interface GameStation {
  game: GameType;
  label: string;
  emoji: string;
  x: number; y: number; w: number; h: number; // hitbox matching the furniture piece
}
const GAME_STATIONS: GameStation[] = [
  { game: 'memory',        label: 'Memory Match',  emoji: '🃏', x: 610, y: 430, w: 96, h: 96 },   // bookshelf in middle room (off rug)
  { game: 'speedsort',     label: 'Speed Sort',    emoji: '📺', x: 130, y: 380, w: 64, h: 56 },   // TV in left room
  { game: 'wordscramble',  label: 'Word Scramble', emoji: '📝', x: 850, y: 360, w: 144, h: 48 },  // desk in right room
];

const SPEED = 250, ACCEL_K = 16, HALF = 14, NEAR = 80;
const COUNTER = { x: ROOM_W / 2 - 110, y: 250, w: 220, h: 70 };
const CLERK = { x: ROOM_W / 2, y: 210 };

export function AmenityInterior({ slug }: { slug: string }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { reducedMotion } = useTheme();
  const def = AMENITY_DEFS[slug];
  const solids = def ? [COUNTER, ...def.furniture] : [COUNTER];

  const [, setFrame] = useState(0);
  const [viewport, setViewport] = useState({ w: window.innerWidth, h: window.innerHeight });
  const [wallet, setWallet] = useState<Wallet>(() => loadWallet(user?.id || 'anon'));
  const [shopOpen, setShopOpen] = useState(false);
  const [nearCounter, setNearCounter] = useState(false);
  const [dialogue, setDialogue] = useState<DialogueLine[] | null>([{ speaker: def?.clerkName || 'Clerk', portrait: def?.clerkFace || '🧑', text: def?.greeting || '' }]);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef(0);
  const [activeGame, setActiveGame] = useState<GameType | null>(null);
  const [nearStation, setNearStation] = useState<GameStation | null>(null);
  const nearStationRef = useRef<GameStation | null>(null);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setProfile(data);
      });
  }, [user]);

  const player = useRef({ x: ROOM_SPAWN.x, y: ROOM_SPAWN.y, vx: 0, vy: 0, dir: 'up' as string, moving: false, phase: 0 });
  const keys = useRef<Set<string>>(new Set());
  const touch = useRef({ x: 0, y: 0 });
  const raf = useRef(0); const last = useRef(0);
  const nearRef = useRef(false);
  const blockedRef = useRef(false);
  blockedRef.current = shopOpen || !!dialogue || !!activeGame;

  useEffect(() => {
    const onResize = () => setViewport({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const act = useCallback(() => {
    if (nearRef.current) setShopOpen(true);
    else if (nearStationRef.current && slug === 'home') {
      const st = nearStationRef.current;
      const uid = user?.id || 'anon';
      if (!canPlay(uid, st.game)) { flash('⏳ Come back tomorrow!'); return; }
      setActiveGame(st.game);
    }
    else if (Math.hypot(player.current.x - ROOM_EXIT.x, player.current.y - ROOM_EXIT.y) < NEAR) navigate('/');
  }, [navigate, slug, user]);

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

  useEffect(() => {
    const step = (ts: number) => {
      const dt = last.current ? Math.min((ts - last.current) / 1000, 0.05) : 0;
      last.current = ts;
      const p = player.current;
      let ix = 0, iy = 0;
      if (!blockedRef.current) {
        const k = keys.current;
        ix = (k.has('d') || k.has('arrowright') ? 1 : 0) - (k.has('a') || k.has('arrowleft') ? 1 : 0) + touch.current.x;
        iy = (k.has('s') || k.has('arrowdown') ? 1 : 0) - (k.has('w') || k.has('arrowup') ? 1 : 0) + touch.current.y;
      }
      const l = Math.hypot(ix, iy);
      const speedMultiplier = 1 + (wallet.speedLvl || 0) * 0.18;
      const baseSpeed = reducedMotion ? SPEED : 310;
      const currentSpeed = baseSpeed * speedMultiplier;
      let tx = 0, ty = 0; if (l > 0.01) { tx = ix / l * currentSpeed; ty = iy / l * currentSpeed; }
      const s = 1 - Math.exp(-ACCEL_K * dt);
      p.vx += (tx - p.vx) * s; p.vy += (ty - p.vy) * s;
      const hit = (x: number, y: number) => solids.some(r => x - HALF < r.x + r.w && x + HALF > r.x && y - HALF < r.y + r.h && y + HALF > r.y);
      const nx = p.x + p.vx * dt, ny = p.y + p.vy * dt;
      if (!hit(nx, p.y)) p.x = Math.max(40, Math.min(ROOM_W - 40, nx)); else p.vx = 0;
      if (!hit(p.x, ny)) p.y = Math.max(120, Math.min(ROOM_H - 36, ny)); else p.vy = 0;
      const sp = Math.hypot(p.vx, p.vy); p.moving = sp > 10;
      if (p.moving) { p.dir = Math.abs(p.vx) > Math.abs(p.vy) ? (p.vx > 0 ? 'right' : 'left') : (p.vy > 0 ? 'down' : 'up'); p.phase += sp / currentSpeed * dt * 12; }
      const nc = p.x > COUNTER.x - NEAR && p.x < COUNTER.x + COUNTER.w + NEAR && p.y > COUNTER.y && p.y < COUNTER.y + COUNTER.h + NEAR;
      if (nc !== nearRef.current) { nearRef.current = nc; setNearCounter(nc); }
      // Game station proximity (Cottage Noir only)
      if (slug === 'home') {
        let closest: GameStation | null = null;
        for (const st of GAME_STATIONS) {
          if (p.x > st.x - NEAR && p.x < st.x + st.w + NEAR && p.y > st.y - NEAR && p.y < st.y + st.h + NEAR) { closest = st; break; }
        }
        if (closest !== nearStationRef.current) { nearStationRef.current = closest; setNearStation(closest); }
      }
      setFrame(f => (f + 1) % 1e6);
      raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [wallet.speedLvl, reducedMotion]);

  const buy = (item: ShopItem) => {
    setWallet(w => {
      const next: Wallet = { ...w, cosmetic: { ...w.cosmetic }, owned: [...w.owned] };
      const ownsCosmetic = item.kind === 'cosmetic' && next.owned.includes(item.id);
      if (!ownsCosmetic) {
        if (next.coins < item.cost) { flash('Not enough coins!'); return w; }
        next.coins -= item.cost;
      }
      if (item.kind === 'energyMax') { next.energyMax = Math.min(220, next.energyMax + (item.value as number)); flash(`Max energy → ${next.energyMax}`); }
      else if (item.kind === 'speed') { next.speedLvl = Math.max(next.speedLvl, item.value as number); flash('Sprint upgraded!'); }
      else if (item.kind === 'cosmetic' && item.field) {
        next.cosmetic[item.field] = item.value as string;
        if (!next.owned.includes(item.id)) next.owned.push(item.id);
        flash(ownsCosmetic ? 'Look applied!' : 'Unlocked & applied!');
      }
      saveWallet(user?.id || 'anon', next);
      return next;
    });
  };
  const flash = (m: string) => { setToast(m); window.clearTimeout(toastTimer.current); toastTimer.current = window.setTimeout(() => setToast(null), 1800); };

  const onGameComplete = useCallback((coins: number) => {
    const uid = user?.id || 'anon';
    if (activeGame) recordPlay(uid, activeGame);
    setWallet(awardCoins(uid, coins));
    setActiveGame(null);
    flash(`+${coins} coins! 🪙`);
  }, [user, activeGame]);

  if (!def) { navigate('/'); return null; }
  const p = player.current;
  const scale = Math.min(viewport.w / ROOM_W, (viewport.h - 60) / ROOM_H) * 0.96;
  const flip = p.dir === 'left' ? -1 : 1;
  const playerPal = paletteFromWallet(wallet);

  const name = profile?.character_name || profile?.username || 'You';
  const bob = p.moving ? Math.abs(Math.sin(p.phase)) * 3 : 0;
  const lift = bob;
  const shadow = 28;

  return (
    <div className="fixed inset-0 overflow-hidden select-none" style={{ background: 'radial-gradient(circle at 50% 0%, #1f2937, #0b1220 70%)' }}>
      {/* header */}
      <div className="absolute top-0 inset-x-0 z-40 flex items-center justify-between px-4 py-2.5" style={{ background: 'linear-gradient(180deg, rgba(11,18,32,0.95), transparent)' }}>
        <button onClick={() => navigate('/')} aria-label="Return to city" className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white font-bold text-sm"><ArrowLeft className="w-4 h-4" /> City</button>
        <div className="font-fantasy text-white text-lg sm:text-2xl">{def.room}</div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 text-white font-bold text-sm"><Coins className="w-4 h-4 text-amber-400" />{wallet.coins}</div>
      </div>

      {/* scaled room */}
      <div className="absolute left-1/2 top-1/2" style={{ transform: `translate(-50%,-50%) scale(${scale})`, width: ROOM_W, height: ROOM_H, marginTop: 24 }}>
        <div className="absolute overflow-hidden rounded-2xl" style={{ width: ROOM_W, height: ROOM_H, boxShadow: '0 30px 80px rgba(0,0,0,0.6)' }}>
          <div className="absolute inset-0" style={{ background: def.floor }} />
          <div className="absolute inset-0" style={{ backgroundImage: `linear-gradient(45deg, ${def.floorAlt} 25%, transparent 25%, transparent 75%, ${def.floorAlt} 75%), linear-gradient(45deg, ${def.floorAlt} 25%, transparent 25%, transparent 75%, ${def.floorAlt} 75%)`, backgroundSize: '64px 64px', backgroundPosition: '0 0, 32px 32px', opacity: 0.45 }} />
          <div className="absolute inset-0" style={{ boxShadow: 'inset 0 0 120px rgba(0,0,0,0.28)' }} />
          {/* back wall */}
          <div className="absolute inset-x-0 top-0" style={{ height: 96, background: `linear-gradient(180deg, ${def.wall}, ${def.wallTrim})`, boxShadow: 'inset 0 -10px 18px rgba(0,0,0,0.4)' }}>
            <div className="absolute inset-x-0 bottom-0 h-3" style={{ background: def.accent, opacity: 0.85 }} />
          </div>
          {/* paintings on the wall (Cottage Noir style scroll maps & crests) */}
          {slug === 'home' ? (
            <>
              <div className="absolute" style={{ left: 230, top: 22, zIndex: 3 }}>
                <RoguelikeSprite r={12} c={20} w_tiles={1} h_tiles={1} width={50} height={50} className="shadow-lg transform rotate-[-4deg] opacity-90" />
              </div>
              <div className="absolute" style={{ left: ROOM_W - 280, top: 22, zIndex: 3 }}>
                <RoguelikeSprite r={12} c={21} w_tiles={1} h_tiles={1} width={50} height={50} className="shadow-lg transform rotate-[4deg] opacity-90" />
              </div>
              <div className="absolute" style={{ left: ROOM_W / 2 - 18, top: 26, zIndex: 3 }}>
                <RoguelikeSprite r={10} c={22} w_tiles={1} h_tiles={1} width={36} height={36} className="shadow-md filter drop-shadow-md" />
              </div>
            </>
          ) : (
            <>
              <div className="absolute" style={{ left: 220, top: 22, zIndex: 3 }}><WallPanel kind="poster" w={72} h={54} color={def.accent} /></div>
              <div className="absolute" style={{ left: ROOM_W - 300, top: 22, zIndex: 3 }}><WallPanel kind="poster" w={72} h={54} color={def.wallTrim} /></div>
              <div className="absolute" style={{ left: ROOM_W / 2 - 18, top: 26, zIndex: 3 }}><WallPanel kind="clock" /></div>
            </>
          )}
          {/* rug */}
          {slug === 'home' ? (
            <div className="absolute" style={{ left: ROOM_W / 2 - 200, top: 380, zIndex: 1 }}>
              <RoguelikeSprite r={15} c={16} w_tiles={3} h_tiles={1} width={400} height={150} className="opacity-90 rounded-xl shadow-inner border border-[#f59e0b]/10" />
            </div>
          ) : (
            <div className="absolute rounded-2xl" style={{ left: ROOM_W / 2 - 200, top: 380, width: 400, height: 150, background: def.wallTrim, opacity: 0.4, border: `4px solid ${def.accent}`, zIndex: 1 }} />
          )}
          {/* furniture (Y-sorted) */}
          {def.furniture.map((f, i) => {
            const cottageSprite = slug === 'home' ? COTTAGE_SPRITES[f.kind] : null;
            return (
              <div key={`f${i}`} className="absolute" style={{ left: f.x, top: f.y, zIndex: Math.round(f.y + f.h) }}>
                {slug === 'home' && f.kind === 'wall_v' ? (
                  (() => {
                    const tileHeight = 32;
                    const numTiles = Math.ceil(f.h / tileHeight);
                    return (
                      <div style={{ width: f.w, height: f.h, position: 'relative' }}>
                        {Array.from({ length: numTiles }).map((_, idx) => (
                          <RoguelikeSprite
                            key={idx}
                            r={0}
                            c={23}
                            w_tiles={1}
                            h_tiles={1}
                            width={f.w}
                            height={tileHeight}
                            style={{
                              position: 'absolute',
                              left: 0,
                              top: idx * tileHeight,
                              clipPath: idx === numTiles - 1 && f.h % tileHeight !== 0
                                ? `inset(0px 0px ${tileHeight - (f.h % tileHeight)}px 0px)`
                                : 'none'
                            }}
                          />
                        ))}
                      </div>
                    );
                  })()
                ) : slug === 'home' && f.kind === 'wall_h' ? (
                  (() => {
                    const tileWidth = 32;
                    const numTiles = Math.ceil(f.w / tileWidth);
                    return (
                      <div style={{ width: f.w, height: f.h, position: 'relative' }}>
                        {Array.from({ length: numTiles }).map((_, idx) => (
                          <RoguelikeSprite
                            key={idx}
                            r={0}
                            c={24}
                            w_tiles={1}
                            h_tiles={1}
                            width={tileWidth}
                            height={f.h}
                            style={{
                              position: 'absolute',
                              top: 0,
                              left: idx * tileWidth,
                              clipPath: idx === numTiles - 1 && f.w % tileWidth !== 0
                                ? `inset(0px ${tileWidth - (f.w % tileWidth)}px 0px 0px)`
                                : 'none'
                            }}
                          />
                        ))}
                      </div>
                    );
                  })()
                ) : cottageSprite ? (
                  <RoguelikeSprite 
                    r={cottageSprite.r}
                    c={cottageSprite.c}
                    w_tiles={cottageSprite.w}
                    h_tiles={cottageSprite.h}
                    width={f.w}
                    height={f.h}
                    className="transition-all duration-300 hover:brightness-110"
                  />
                ) : (
                  <FurnitureSprite kind={f.kind} w={f.w} h={f.h} color={f.color} accent={f.accent} />
                )}
              </div>
            );
          })}
          {/* plants */}
          {slug === 'home' ? (
            <>
              <div className="absolute" style={{ left: 70, top: 300, zIndex: Math.round(350) }}>
                <RoguelikeSprite r={0} c={16} w_tiles={1} h_tiles={1} width={36} height={36} className="filter drop-shadow-md" />
              </div>
              <div className="absolute" style={{ left: ROOM_W - 110, top: 300, zIndex: Math.round(350) }}>
                <RoguelikeSprite r={0} c={17} w_tiles={1} h_tiles={1} width={36} height={36} className="filter drop-shadow-md" />
              </div>
            </>
          ) : (
            <>
              <div className="absolute" style={{ left: 70, top: 300, zIndex: Math.round(350) }}><PlantSprite /></div>
              <div className="absolute" style={{ left: ROOM_W - 110, top: 300, zIndex: Math.round(350) }}><PlantSprite /></div>
            </>
          )}

          {/* counter */}
          <div className="absolute" style={{ left: COUNTER.x, top: COUNTER.y, zIndex: Math.round(COUNTER.y + COUNTER.h) }}>
            {slug === 'home' ? (
              <RoguelikeSprite 
                r={15}
                c={8}
                w_tiles={3}
                h_tiles={1}
                width={COUNTER.w}
                height={COUNTER.h}
                className="transition-all duration-300 hover:brightness-110"
              />
            ) : (
              <FurnitureSprite kind="counter" w={COUNTER.w} h={COUNTER.h} color={def.accent} />
            )}
          </div>
          {/* clerk behind counter */}
          <div className="absolute" style={{ left: CLERK.x, top: CLERK.y, width: 0, height: 0, zIndex: Math.round(CLERK.y) }}>
            <div className="absolute left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-md bg-amber-500 text-slate-900 text-[10px] font-black whitespace-nowrap shadow" style={{ top: -46 }}>{def.clerkName}</div>
            {slug === 'home' ? (
              <div className="absolute left-1/2 -translate-x-1/2 flex items-end gap-2.5" style={{ top: -30 }}>
                {/* Gold Mirror */}
                <RoguelikeSprite 
                  r={14}
                  c={22}
                  w_tiles={1}
                  h_tiles={2}
                  width={24}
                  height={42}
                  className="shadow-md border border-slate-700/30 rounded-t-sm"
                />
                {/* Console Monitor */}
                <RoguelikeSprite 
                  r={4}
                  c={21}
                  w_tiles={1}
                  h_tiles={1}
                  width={24}
                  height={24}
                  className="shadow-md"
                />
              </div>
            ) : (
              <div className="absolute left-1/2 -translate-x-1/2 text-4xl" style={{ top: -30 }}>{def.clerkFace}</div>
            )}
          </div>
          {/* counter prompt marker */}
          {nearCounter && <div className="absolute text-2xl animate-bounce" style={{ left: COUNTER.x + COUNTER.w / 2 - 10, top: COUNTER.y - 36, zIndex: 400 }}>🛒</div>}

          {/* exit mat */}
          <div className="absolute" style={{ left: ROOM_EXIT.x - 36, top: ROOM_EXIT.y - 14, width: 72, zIndex: 5 }}>
            <div className="rounded-md flex items-center justify-center text-[10px] font-black" style={{ width: 72, height: 26, background: '#475569', color: '#cbd5e1' }}>EXIT</div>
          </div>

          {/* player */}
          <div className="absolute" style={{ left: p.x, top: p.y, width: 0, height: 0, zIndex: Math.round(p.y) }}>
            <div className="absolute left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-md bg-black/60 text-white text-[10px] font-bold whitespace-nowrap shadow" style={{ top: -64 }}>{name}</div>
            <div className="absolute left-1/2 -translate-x-1/2 rounded-full bg-black/35 blur-[2px]" style={{ width: shadow, height: 9, top: 14 }} />
            <div className="absolute" style={{ left: -23, top: -50, transform: `scaleX(${flip}) translateY(${-lift}px)` }}>
              <CharacterSprite w={46} dir={p.dir} phase={p.phase} moving={p.moving} palette={playerPal} hat />
            </div>
          </div>
        </div>

          {/* Game station glow indicators (Cottage Noir only) */}
          {slug === 'home' && GAME_STATIONS.map(st => (
            <div key={st.game} className="absolute" style={{
              left: st.x - 6, top: st.y - 6, width: st.w + 12, height: st.h + 12,
              borderRadius: 14, zIndex: Math.round(st.y - 1),
              boxShadow: nearStation?.game === st.game
                ? '0 0 24px 8px rgba(251,191,36,0.45), inset 0 0 12px rgba(251,191,36,0.2)'
                : '0 0 14px 4px rgba(251,191,36,0.18)',
              border: nearStation?.game === st.game ? '2px solid rgba(251,191,36,0.6)' : '1px solid rgba(251,191,36,0.15)',
              pointerEvents: 'none',
              transition: 'all 0.3s ease',
            }} />
          ))}
          {/* Clean, static professional name tags for interactive game stations */}
          {slug === 'home' && GAME_STATIONS.map(st => (
            <div key={`badge-${st.game}`} className="absolute" style={{
              left: st.x + st.w / 2,
              top: st.y - 20,
              transform: 'translateX(-50%)',
              zIndex: 400,
              pointerEvents: 'none',
            }}>
              <div className="px-2.5 py-1 rounded-xl bg-slate-900/90 border border-amber-400/40 text-amber-400 text-[10px] font-black tracking-wide whitespace-nowrap shadow-lg flex items-center gap-1.5 uppercase transition-all duration-300"
                   style={{
                     boxShadow: nearStation?.game === st.game ? '0 4px 12px rgba(251,191,36,0.3)' : '0 2px 6px rgba(0,0,0,0.4)',
                     borderColor: nearStation?.game === st.game ? '#fbbf24' : 'rgba(251,191,36,0.4)'
                   }}>
                <span>{st.emoji}</span>
                <span>{st.label}</span>
              </div>
            </div>
          ))}
      </div>

      {/* game station prompt */}
      {slug === 'home' && nearStation && !shopOpen && !dialogue && !activeGame && !nearCounter && (
        <button onClick={() => act()} aria-label="Play mini-game" className="absolute left-1/2 -translate-x-1/2 bottom-8 z-40 flex items-center gap-3 px-6 py-3.5 rounded-2xl border-2 shadow-2xl hover:scale-105 active:scale-95 transition-transform" style={{ background: 'rgba(15,23,42,0.92)', borderColor: '#fbbf24' }}>
          <span className="text-2xl">{nearStation.emoji}</span>
          <span className="text-white font-black">
            {canPlay(user?.id || 'anon', nearStation.game) ? nearStation.label : `${nearStation.label} — ⏳ Tomorrow`}
          </span>
          <span className="px-3 py-1.5 rounded-lg bg-amber-400 text-slate-900 font-black text-sm">E</span>
        </button>
      )}
      {/* shop prompt */}
      {nearCounter && !shopOpen && !dialogue && !activeGame && (
        <button onClick={() => setShopOpen(true)} aria-label="Open shop" className="absolute left-1/2 -translate-x-1/2 bottom-8 z-40 flex items-center gap-3 px-6 py-3.5 rounded-2xl border-2 shadow-2xl hover:scale-105 active:scale-95 transition-transform" style={{ background: 'rgba(15,23,42,0.92)', borderColor: def.accent }}>
          <span className="text-2xl">{def.clerkFace}</span><span className="text-white font-black">Open {def.counterLabel || 'Shop'}</span><span className="px-3 py-1.5 rounded-lg bg-white text-slate-900 font-black text-sm">E</span>
        </button>
      )}
      {toast && <div className="absolute left-1/2 -translate-x-1/2 top-20 z-50 animate-fade-in px-5 py-2.5 rounded-2xl border-2 font-black text-slate-900" style={{ background: 'linear-gradient(90deg,#fde68a,#fbbf24)', borderColor: '#f59e0b' }}>{toast}</div>}

      {/* shop modal */}
      {shopOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" style={{ background: 'rgba(2,6,23,0.6)', backdropFilter: 'blur(3px)' }} onClick={() => setShopOpen(false)}>
          <div className="w-full max-w-md rounded-3xl border-4 shadow-2xl overflow-hidden" style={{ background: 'linear-gradient(160deg,#1e293b,#0f172a)', borderColor: def.accent }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <div className="flex items-center gap-2"><span className="text-2xl">{def.clerkFace}</span><span className="font-fantasy text-white text-xl">{def.room}</span></div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400 text-slate-900 font-black text-sm"><Coins className="w-4 h-4" />{wallet.coins}</div>
            </div>
            <div className="p-4 space-y-2 max-h-[60vh] overflow-y-auto">
              {def.items.map(item => {
                const owned = item.kind === 'cosmetic' && wallet.owned.includes(item.id);
                const maxed = (item.kind === 'speed' && wallet.speedLvl >= (item.value as number)) ;
                const afford = wallet.coins >= item.cost || owned;
                return (
                  <div key={item.id} className="flex items-center gap-3 p-3 rounded-2xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
                    {item.swatch && <div className="w-9 h-9 rounded-lg border-2 border-white/30 shrink-0" style={{ background: item.swatch }} />}
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-bold text-sm">{item.label}</div>
                      <div className="text-slate-400 text-xs">{item.desc}</div>
                    </div>
                    <button onClick={() => buy(item)} disabled={maxed || (!afford && !owned)}
                      className="px-3 py-2 rounded-xl font-black text-xs whitespace-nowrap transition-transform hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100"
                      style={{ background: owned ? '#334155' : afford ? 'linear-gradient(90deg,#fbbf24,#f59e0b)' : '#334155', color: owned ? '#86efac' : afford ? '#0f172a' : '#94a3b8' }}>
                      {maxed ? 'Maxed' : owned ? <span className="flex items-center gap-1"><Check className="w-3 h-3" /> Wear</span> : afford ? <span className="flex items-center gap-1"><Coins className="w-3 h-3" />{item.cost}</span> : <span className="flex items-center gap-1"><Lock className="w-3 h-3" />{item.cost}</span>}
                    </button>
                  </div>
                );
              })}
            </div>
            <button onClick={() => setShopOpen(false)} aria-label="Close shop" className="w-full py-3.5 font-black text-slate-900" style={{ background: def.accent }}>Done</button>
          </div>
        </div>
      )}

      <div className="absolute right-4 bottom-4 z-30 text-[11px] text-white/70 bg-black/40 rounded-lg px-3 py-2 backdrop-blur hidden sm:block">
        <span className="font-bold">WASD</span> walk · <span className="font-bold">E</span> interact{slug === 'home' ? ' · 🎮 mini-games' : ''}
      </div>

      {/* Mini-game modals (Cottage Noir only) */}
      {activeGame === 'memory' && <MemoryMatchGame onComplete={onGameComplete} onClose={() => setActiveGame(null)} />}
      {activeGame === 'speedsort' && <SpeedSortGame onComplete={onGameComplete} onClose={() => setActiveGame(null)} />}
      {activeGame === 'wordscramble' && <WordScrambleGame onComplete={onGameComplete} onClose={() => setActiveGame(null)} />}

      {dialogue && <DialogueBox lines={dialogue} onClose={() => setDialogue(null)} />}
    </div>
  );
}
