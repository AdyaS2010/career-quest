// Hand-drawn SVG art kit for Questford — cohesive outlined, shaded sprites that
// replace the old emoji + flat-CSS look. One consistent ink color, soft
// gradients, cast shadows and rim highlights give it a real 2D-game feel.
import type { BuildingDef } from './cityLayout';

const INK = '#2a2540';

function dark(hex: string, p: number) {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, Math.min(255, (n >> 16) + p));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 0xff) + p));
  const b = Math.max(0, Math.min(255, (n & 0xff) + p));
  return `rgb(${r},${g},${b})`;
}

/* ============================ BUILDING ============================ */
const ROOF = 58;
export function BuildingSprite({ def, lightsOn, isNear, mastered }: {
  def: BuildingDef; lightsOn: boolean; isNear: boolean; mastered: boolean;
}) {
  const faceUp = def.doorSide === 'top';
  const W = def.w, H = def.h, HT = H + ROOF;
  const id = def.slug;
  const wall = def.color, roof = def.roof, awn = def.awning;
  const winFill = lightsOn ? `url(#win-on-${id})` : `url(#win-off-${id})`;
  const winGlow = lightsOn ? dark('#fde68a', 0) : 'transparent';
  const trim = mastered ? '#facc15' : dark(wall, -46);

  // window grid (2 rows x 3), in body coords
  const cols = [0.5, 1.5, 2.5];
  const winW = 64, winH = 58, gapX = (W - 60 - cols.length * winW) / (cols.length + 1);
  const winY1 = ROOF + 70, winY2 = ROOF + 150;
  const wins: { x: number; y: number }[] = [];
  [winY1, winY2].forEach(wy => cols.forEach((_, i) => wins.push({ x: 30 + gapX * (i + 1) + i * winW, y: wy })));

  return (
    <svg width={W} height={HT} viewBox={`0 0 ${W} ${HT}`}
      style={{ position: 'absolute', left: def.x, top: faceUp ? def.y : def.y - ROOF, transform: faceUp ? 'scaleY(-1)' : undefined, overflow: 'visible' }}>
      <defs>
        <linearGradient id={`wall-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={dark(wall, 26)} /><stop offset="0.5" stopColor={wall} /><stop offset="1" stopColor={dark(wall, -24)} />
        </linearGradient>
        <linearGradient id={`roof-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={dark(roof, 30)} /><stop offset="1" stopColor={dark(roof, -14)} />
        </linearGradient>
        <linearGradient id={`win-off-${id}`} x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0" stopColor="#cfeaff" /><stop offset="0.5" stopColor="#9ec9ec" /><stop offset="1" stopColor="#7fb0d8" />
        </linearGradient>
        <linearGradient id={`win-on-${id}`} x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0" stopColor="#fff7d6" /><stop offset="1" stopColor="#fcd34d" />
        </linearGradient>
      </defs>

      {/* cast shadow */}
      <ellipse cx={W / 2} cy={HT - 6} rx={W / 2} ry={16} fill="rgba(0,0,0,0.28)" />

      {/* body */}
      <rect x="6" y={ROOF} width={W - 12} height={H - 6} rx="14" fill={`url(#wall-${id})`} stroke={INK} strokeWidth="3" />
      {/* corner pilasters for depth */}
      <rect x="6" y={ROOF} width="16" height={H - 6} rx="6" fill="rgba(255,255,255,0.10)" />
      <rect x={W - 22} y={ROOF} width="16" height={H - 6} rx="6" fill="rgba(0,0,0,0.16)" />
      {/* foundation */}
      <rect x="6" y={ROOF + H - 30} width={W - 12} height="24" rx="6" fill={dark(wall, -40)} stroke={INK} strokeWidth="3" />

      {/* roof (pitched cap with overhang + shingle lines) */}
      <path d={`M -6 ${ROOF + 6} L ${W * 0.18} 6 L ${W * 0.82} 6 L ${W + 6} ${ROOF + 6} Z`} fill={`url(#roof-${id})`} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
      <path d={`M ${W * 0.18} 18 L ${W * 0.82} 18`} stroke="rgba(255,255,255,0.25)" strokeWidth="3" />
      <path d={`M ${W * 0.1} 34 L ${W * 0.9} 34`} stroke="rgba(0,0,0,0.12)" strokeWidth="3" />
      {/* chimney */}
      <rect x={W - 84} y="2" width="26" height="34" rx="3" fill={dark(roof, -18)} stroke={INK} strokeWidth="3" />

      {/* sign band under roof */}
      <rect x="24" y={ROOF + 6} width={W - 48} height="30" rx="8" fill={dark(wall, -34)} stroke={INK} strokeWidth="3" />
      <rect x="30" y={ROOF + 11} width={W - 60} height="8" rx="4" fill="rgba(255,255,255,0.18)" />

      {/* windows */}
      {wins.map((p, i) => (
        <g key={i}>
          <rect x={p.x - 4} y={p.y - 4} width={winW + 8} height={winH + 8} rx="8" fill={dark(wall, -30)} stroke={INK} strokeWidth="2.5" />
          <rect x={p.x} y={p.y} width={winW} height={winH} rx="5" fill={winFill} stroke={INK} strokeWidth="2" />
          <line x1={p.x + winW / 2} y1={p.y} x2={p.x + winW / 2} y2={p.y + winH} stroke={INK} strokeWidth="2" />
          <line x1={p.x} y1={p.y + winH / 2} x2={p.x + winW} y2={p.y + winH / 2} stroke={INK} strokeWidth="2" />
          <path d={`M ${p.x + 6} ${p.y + winH - 6} L ${p.x + winW - 8} ${p.y + 6}`} stroke="rgba(255,255,255,0.5)" strokeWidth="6" strokeLinecap="round" opacity="0.5" />
          {lightsOn && <rect x={p.x} y={p.y} width={winW} height={winH} rx="5" fill={winGlow} opacity="0.0" />}
        </g>
      ))}

      {/* awning over door (scalloped) */}
      <g>
        <path d={`M ${W / 2 - 60} ${ROOF + H - 92} h 120 l -8 26 h -104 Z`} fill={awn} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
        {[0, 1, 2, 3, 4].map(i => <path key={i} d={`M ${W / 2 - 56 + i * 22} ${ROOF + H - 66} a 11 11 0 0 0 22 0`} fill={i % 2 ? '#ffffff' : dark(awn, -18)} stroke={INK} strokeWidth="2" />)}
        {[0, 1, 2, 3].map(i => <rect key={i} x={W / 2 - 52 + i * 30} y={ROOF + H - 92} width="14" height="26" fill="rgba(255,255,255,0.7)" opacity={i % 2 ? 0 : 0.5} />)}
      </g>

      {/* door + steps */}
      <rect x={W / 2 - 34} y={ROOF + H - 30} width="68" height="10" rx="3" fill="#9aa3b2" stroke={INK} strokeWidth="2" />
      <rect x={W / 2 - 28} y={ROOF + H - 64} width="56" height="40" rx="6" fill={isNear ? '#fde047' : dark(wall, -38)} stroke={INK} strokeWidth="3" />
      <line x1={W / 2} y1={ROOF + H - 62} x2={W / 2} y2={ROOF + H - 26} stroke={INK} strokeWidth="2.5" />
      <circle cx={W / 2 - 8} cy={ROOF + H - 44} r="2.6" fill="#fde68a" /><circle cx={W / 2 + 8} cy={ROOF + H - 44} r="2.6" fill="#fde68a" />
      {isNear && <rect x={W / 2 - 28} y={ROOF + H - 64} width="56" height="40" rx="6" fill="#fde047" opacity="0.5" />}

      {/* mastered gold trim + star */}
      {mastered && <rect x="6" y={ROOF} width={W - 12} height={H - 6} rx="14" fill="none" stroke="#facc15" strokeWidth="4" />}
      {mastered && <Star cx={W / 2} cy={26} r={12} />}
      {!mastered && <rect x="6" y={ROOF} width={W - 12} height={H - 6} rx="14" fill="none" stroke={trim} strokeWidth="0" />}
    </svg>
  );
}

function Star({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const ang = (Math.PI / 5) * i - Math.PI / 2;
    const rr = i % 2 ? r * 0.45 : r;
    pts.push(`${cx + Math.cos(ang) * rr},${cy + Math.sin(ang) * rr}`);
  }
  return <polygon points={pts.join(' ')} fill="#fde047" stroke={INK} strokeWidth="2" />;
}

/* ============================ NATURE ============================ */
export function TreeSprite({ s = 1 }: { s?: number }) {
  return (
    <svg width={92 * s} height={104 * s} viewBox="0 0 92 104" style={{ overflow: 'visible' }}>
      <ellipse cx="46" cy="98" rx="30" ry="8" fill="rgba(0,0,0,0.25)" />
      <rect x="40" y="64" width="12" height="34" rx="5" fill="#7a4a24" stroke={INK} strokeWidth="3" />
      <path d="M46 66 q-6 -10 -2 -20" stroke="#5e3718" strokeWidth="3" fill="none" />
      <circle cx="30" cy="44" r="22" fill="#3f9d52" stroke={INK} strokeWidth="3" />
      <circle cx="62" cy="46" r="22" fill="#3f9d52" stroke={INK} strokeWidth="3" />
      <circle cx="46" cy="28" r="24" fill="#52b768" stroke={INK} strokeWidth="3" />
      <circle cx="40" cy="22" r="9" fill="rgba(255,255,255,0.35)" />
      <path d="M28 52 q18 10 36 0" stroke="rgba(0,0,0,0.18)" strokeWidth="4" fill="none" />
    </svg>
  );
}
export function BushSprite({ s = 1 }: { s?: number }) {
  return (
    <svg width={70 * s} height={48 * s} viewBox="0 0 70 48" style={{ overflow: 'visible' }}>
      <ellipse cx="35" cy="44" rx="26" ry="6" fill="rgba(0,0,0,0.22)" />
      <circle cx="20" cy="30" r="16" fill="#3f9d52" stroke={INK} strokeWidth="3" />
      <circle cx="50" cy="30" r="16" fill="#3f9d52" stroke={INK} strokeWidth="3" />
      <circle cx="35" cy="22" r="18" fill="#52b768" stroke={INK} strokeWidth="3" />
      <circle cx="28" cy="18" r="3" fill="#fde047" /><circle cx="46" cy="24" r="3" fill="#f472b6" />
    </svg>
  );
}

/* ============================ STREET PROPS ============================ */
export function LampSprite({ on }: { on: boolean }) {
  return (
    <svg width="40" height="84" viewBox="0 0 40 84" style={{ overflow: 'visible' }}>
      {on && <circle cx="20" cy="14" r="26" fill="rgba(253,224,71,0.45)" />}
      <ellipse cx="20" cy="80" rx="12" ry="4" fill="rgba(0,0,0,0.25)" />
      <rect x="17" y="20" width="6" height="60" rx="3" fill="#3b4252" stroke={INK} strokeWidth="2.5" />
      <rect x="10" y="76" width="20" height="6" rx="3" fill="#2a3140" stroke={INK} strokeWidth="2.5" />
      <path d="M12 18 q8 -10 16 0 l-2 8 h-12 Z" fill={on ? '#fff3b0' : '#9aa6b8'} stroke={INK} strokeWidth="2.5" />
      <rect x="14" y="6" width="12" height="6" rx="3" fill="#2a3140" stroke={INK} strokeWidth="2" />
    </svg>
  );
}
export function BenchSprite() {
  return (
    <svg width="74" height="44" viewBox="0 0 74 44" style={{ overflow: 'visible' }}>
      <ellipse cx="37" cy="40" rx="32" ry="5" fill="rgba(0,0,0,0.22)" />
      <rect x="6" y="6" width="62" height="9" rx="3" fill="#b9793f" stroke={INK} strokeWidth="2.5" />
      <rect x="6" y="18" width="62" height="9" rx="3" fill="#a96a34" stroke={INK} strokeWidth="2.5" />
      <rect x="10" y="27" width="6" height="13" fill="#5e4a35" stroke={INK} strokeWidth="2" />
      <rect x="58" y="27" width="6" height="13" fill="#5e4a35" stroke={INK} strokeWidth="2" />
    </svg>
  );
}
export function StallSprite({ c }: { c: string }) {
  return (
    <svg width="86" height="78" viewBox="0 0 86 78" style={{ overflow: 'visible' }}>
      <ellipse cx="43" cy="74" rx="34" ry="5" fill="rgba(0,0,0,0.22)" />
      <rect x="10" y="40" width="66" height="28" rx="4" fill="#c08552" stroke={INK} strokeWidth="2.5" />
      <rect x="8" y="36" width="70" height="8" rx="3" fill="#8a5a2b" stroke={INK} strokeWidth="2.5" />
      <rect x="12" y="40" width="6" height="28" fill="#6b4423" /><rect x="68" y="40" width="6" height="28" fill="#6b4423" />
      <path d="M2 36 L84 36 L78 14 L8 14 Z" fill={c} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
      {[0, 1, 2, 3].map(i => <rect key={i} x={10 + i * 18} y="14" width="9" height="22" fill="#ffffff" opacity="0.55" />)}
      <circle cx="30" cy="54" r="5" fill="#ef4444" stroke={INK} strokeWidth="1.5" /><circle cx="44" cy="54" r="5" fill="#f59e0b" stroke={INK} strokeWidth="1.5" /><circle cx="58" cy="54" r="5" fill="#22c55e" stroke={INK} strokeWidth="1.5" />
    </svg>
  );
}
export function FountainSprite() {
  return (
    <svg width="180" height="150" viewBox="0 0 180 150" style={{ overflow: 'visible' }}>
      <ellipse cx="90" cy="138" rx="78" ry="14" fill="rgba(0,0,0,0.25)" />
      <ellipse cx="90" cy="96" rx="84" ry="40" fill="#b8c2cf" stroke={INK} strokeWidth="3" />
      <ellipse cx="90" cy="92" rx="74" ry="34" fill="url(#water)" stroke={INK} strokeWidth="2" />
      <defs>
        <radialGradient id="water" cx="0.5" cy="0.4"><stop offset="0" stopColor="#bfe0ff" /><stop offset="0.7" stopColor="#4aa3e8" /><stop offset="1" stopColor="#2b6fb8" /></radialGradient>
      </defs>
      <ellipse cx="72" cy="84" rx="20" ry="8" fill="rgba(255,255,255,0.4)" />
      <rect x="82" y="44" width="16" height="50" rx="6" fill="#cdd6e0" stroke={INK} strokeWidth="2.5" />
      <ellipse cx="90" cy="46" rx="26" ry="9" fill="#b8c2cf" stroke={INK} strokeWidth="2.5" />
      <ellipse cx="90" cy="44" rx="20" ry="6" fill="url(#water)" />
    </svg>
  );
}
export function PinSprite() {
  return (
    <svg width="34" height="44" viewBox="0 0 34 44" style={{ overflow: 'visible' }}>
      <ellipse cx="17" cy="41" rx="7" ry="3" fill="rgba(0,0,0,0.3)" />
      <path d="M17 41 C6 26 2 20 2 14 a15 15 0 0 1 30 0 c0 6 -4 12 -15 27 Z" fill="#ef4444" stroke={INK} strokeWidth="2.5" />
      <circle cx="17" cy="15" r="6" fill="#fff" stroke={INK} strokeWidth="2" />
    </svg>
  );
}

/* ============================ CAR ============================ */
// Drawn top-down car pointing EAST (rotate via the parent for other headings).
export function CarSprite({ color = '#ef4444', w = 96 }: { color?: string; w?: number }) {
  const h = w * (46 / 96);
  return (
    <svg width={w} height={h} viewBox="0 0 96 46" style={{ overflow: 'visible' }}>
      <ellipse cx="48" cy="42" rx="44" ry="6" fill="rgba(0,0,0,0.22)" />
      {/* wheels */}
      <rect x="20" y="0" width="18" height="9" rx="3" fill="#1f2937" /><rect x="58" y="0" width="18" height="9" rx="3" fill="#1f2937" />
      <rect x="20" y="37" width="18" height="9" rx="3" fill="#1f2937" /><rect x="58" y="37" width="18" height="9" rx="3" fill="#1f2937" />
      {/* body */}
      <rect x="6" y="6" width="84" height="34" rx="13" fill={color} stroke={INK} strokeWidth="3" />
      <rect x="6" y="6" width="84" height="13" rx="13" fill="rgba(255,255,255,0.18)" />
      {/* cabin / windshield */}
      <path d="M40 10 h26 q6 0 7 6 v14 q-1 6 -7 6 h-26 Z" fill="#bfe3ff" stroke={INK} strokeWidth="2.5" />
      <rect x="30" y="11" width="9" height="24" rx="3" fill="#bfe3ff" stroke={INK} strokeWidth="2" />
      {/* headlights / tail */}
      <circle cx="87" cy="14" r="3" fill="#fff7cc" stroke={INK} strokeWidth="1.5" /><circle cx="87" cy="32" r="3" fill="#fff7cc" stroke={INK} strokeWidth="1.5" />
      <rect x="6" y="11" width="4" height="6" rx="2" fill="#dc2626" /><rect x="6" y="29" width="4" height="6" rx="2" fill="#dc2626" />
    </svg>
  );
}

/* ============================ CHARACTER ============================ */
export interface Palette { skin: string; hair: string; top: string; pants: string; pack: string }
export const PLAYER_PALETTE: Palette = { skin: '#f3c79b', hair: '#3b2a1a', top: '#22c55e', pants: '#1d4ed8', pack: '#0e7490' };

export function CharacterSprite({ w = 46, dir, phase, moving, palette, hat }: {
  w?: number; dir: string; phase: number; moving: boolean; palette: Palette; hat?: boolean;
}) {
  const swing = moving ? Math.sin(phase) * 20 : 0;
  const up = dir === 'up';
  const h = w * (64 / 46);
  return (
    <svg width={w} height={h} viewBox="0 0 46 64" style={{ overflow: 'visible' }}>
      {/* legs */}
      <g transform={`rotate(${swing} 23 44)`}><rect x="16" y="44" width="8" height="16" rx="4" fill={palette.pants} stroke={INK} strokeWidth="2" /><rect x="15" y="58" width="10" height="5" rx="2.5" fill="#e5e7eb" stroke={INK} strokeWidth="1.6" /></g>
      <g transform={`rotate(${-swing} 23 44)`}><rect x="23" y="44" width="8" height="16" rx="4" fill={dark(palette.pants, -16)} stroke={INK} strokeWidth="2" /><rect x="22" y="58" width="10" height="5" rx="2.5" fill="#f8fafc" stroke={INK} strokeWidth="1.6" /></g>
      {/* backpack when facing up */}
      {up && <rect x="13" y="26" width="20" height="22" rx="6" fill={palette.pack} stroke={INK} strokeWidth="2" />}
      {/* torso */}
      <rect x="13" y="26" width="20" height="24" rx="8" fill={palette.top} stroke={INK} strokeWidth="2.5" />
      <path d="M23 27 v22" stroke={dark(palette.top, -22)} strokeWidth="2" opacity={up ? 0 : 0.5} />
      {/* straps when facing down */}
      {!up && <><rect x="16" y="27" width="3.5" height="20" rx="1.5" fill={palette.pack} /><rect x="26.5" y="27" width="3.5" height="20" rx="1.5" fill={palette.pack} /></>}
      {/* arms */}
      <g transform={`rotate(${-swing} 13 30)`}><rect x="8" y="29" width="7" height="17" rx="3.5" fill={dark(palette.top, -8)} stroke={INK} strokeWidth="2" /></g>
      <g transform={`rotate(${swing} 33 30)`}><rect x="31" y="29" width="7" height="17" rx="3.5" fill={dark(palette.top, -8)} stroke={INK} strokeWidth="2" /></g>
      {/* head */}
      <circle cx="23" cy="17" r="11" fill={palette.skin} stroke={INK} strokeWidth="2.5" />
      {/* hair */}
      {up
        ? <path d="M12 17 a11 11 0 0 1 22 0 q0 -2 -11 -2 q-11 0 -11 2 Z" fill={palette.hair} stroke={INK} strokeWidth="2" />
        : <path d="M12 15 q0 -13 11 -13 q11 0 11 13 q-3 -5 -11 -5 q-8 0 -11 5 Z" fill={palette.hair} stroke={INK} strokeWidth="2" />}
      {!up && <>
        <circle cx="19" cy="18" r="1.7" fill={INK} className="qf-blink" /><circle cx="27" cy="18" r="1.7" fill={INK} className="qf-blink" />
        <path d="M20 23 q3 2 6 0" stroke={INK} strokeWidth="1.6" fill="none" strokeLinecap="round" />
      </>}
      {hat && <g><rect x="13" y="7" width="20" height="4" rx="2" fill="#1e293b" /><rect x="20" y="2" width="6" height="6" rx="1" fill="#1e293b" /><circle cx="23" cy="3" r="1.5" fill="#fde047" /></g>}
    </svg>
  );
}
