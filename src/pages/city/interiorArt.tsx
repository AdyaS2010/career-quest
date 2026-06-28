// Drawn SVG furniture + decor for building interiors. Same outlined/shaded
// language as the city art kit, so the rooms read as real, themed workplaces.
const INK = '#2a2540';
function dk(hex: string, p: number) {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, Math.min(255, (n >> 16) + p));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 0xff) + p));
  const b = Math.max(0, Math.min(255, (n & 0xff) + p));
  return `rgb(${r},${g},${b})`;
}

export type FurnitureKind =
  | 'counter' | 'stove' | 'fridge' | 'cabinet' | 'desk' | 'screen' | 'server'
  | 'bed' | 'cart' | 'bench' | 'podium' | 'vault' | 'camera' | 'easel'
  | 'stage' | 'board' | 'studentDesk' | 'shelf' | 'sofa' | 'tv' | 'rack' | 'produce' | 'booth'
  | 'wall_v' | 'wall_h' | 'sink' | 'piano' | 'stool' | 'table_v'
  | 'torch' | 'barrel' | 'chest' | 'crate' | 'fireplace' | 'rug_lg' | 'bookshelf_tall' | 'mirror_full';

export function FurnitureSprite({ kind, w, h, color, accent = '#94a3b8' }: {
  kind: FurnitureKind; w: number; h: number; color: string; accent?: string;
}) {
  const common = { width: w, height: h, viewBox: `0 0 ${w} ${h}`, style: { overflow: 'visible' as const } };
  const shadow = <ellipse cx={w / 2} cy={h - 2} rx={w / 2} ry={7} fill="rgba(0,0,0,0.22)" />;
  const top = dk(color, 22), bot = dk(color, -22), line = dk(color, -38);

  switch (kind) {
    case 'counter':
      return <svg {...common}>{shadow}
        <rect x="2" y="14" width={w - 4} height={h - 16} rx="5" fill={color} stroke={INK} strokeWidth="3" />
        <rect x="-2" y="2" width={w + 4} height="16" rx="5" fill={dk(color, 34)} stroke={INK} strokeWidth="3" />
        {Array.from({ length: Math.max(2, Math.round(w / 60)) }).map((_, i) => <line key={i} x1={(i + 1) * (w / (Math.round(w / 60) + 1))} y1="20" x2={(i + 1) * (w / (Math.round(w / 60) + 1))} y2={h - 4} stroke={line} strokeWidth="2" />)}
      </svg>;
    case 'stove':
      return <svg {...common}>{shadow}
        <rect x="2" y="12" width={w - 4} height={h - 14} rx="5" fill="#6b7280" stroke={INK} strokeWidth="3" />
        <rect x="-2" y="2" width={w + 4} height="14" rx="4" fill="#9ca3af" stroke={INK} strokeWidth="3" />
        <circle cx={w * 0.3} cy="9" r="6" fill="#374151" stroke={INK} strokeWidth="2" /><circle cx={w * 0.7} cy="9" r="6" fill="#374151" stroke={INK} strokeWidth="2" />
        <path d={`M${w * 0.3} 9 q3 -7 0 -12`} stroke="#fb923c" strokeWidth="3" fill="none" /><path d={`M${w * 0.7} 9 q3 -7 0 -12`} stroke="#f59e0b" strokeWidth="3" fill="none" />
      </svg>;
    case 'fridge':
    case 'cabinet':
      return <svg {...common}>{shadow}
        <rect x="3" y="2" width={w - 6} height={h - 4} rx="6" fill={`url(#cab)`} stroke={INK} strokeWidth="3" />
        <defs><linearGradient id="cab" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor={top} /><stop offset="1" stopColor={bot} /></linearGradient></defs>
        <line x1={w / 2} y1="4" x2={w / 2} y2={h - 4} stroke={INK} strokeWidth="2.5" />
        <rect x={w / 2 - 8} y={h * 0.35} width="5" height="22" rx="2" fill={dk(color, -44)} /><rect x={w / 2 + 4} y={h * 0.35} width="5" height="22" rx="2" fill={dk(color, -44)} />
      </svg>;
    case 'shelf':
      return <svg {...common}>{shadow}
        <rect x="3" y="2" width={w - 6} height={h - 4} rx="5" fill={dk(color, -10)} stroke={INK} strokeWidth="3" />
        {[0, 1, 2].map(r => <g key={r}>
          <line x1="3" y1={14 + r * ((h - 18) / 3)} x2={w - 3} y2={14 + r * ((h - 18) / 3)} stroke={INK} strokeWidth="2.5" />
          {[0, 1, 2, 3].map(b => <rect key={b} x={10 + b * 14} y={2 + r * ((h - 18) / 3) + 2} width="10" height={(h - 18) / 3 - 6} rx="1.5" fill={['#ef4444', '#f59e0b', '#22c55e', '#3b82f6'][(r + b) % 4]} stroke={INK} strokeWidth="1.2" />)}
        </g>)}
      </svg>;
    case 'desk':
    case 'studentDesk':
      return <svg {...common}>{shadow}
        <rect x="2" y="6" width={w - 4} height="12" rx="4" fill={dk(color, 18)} stroke={INK} strokeWidth="3" />
        <rect x="6" y="18" width={w - 12} height={h - 22} rx="3" fill={color} stroke={INK} strokeWidth="3" />
        <rect x="10" y="18" width="6" height={h - 22} fill={dk(color, -30)} /><rect x={w - 16} y="18" width="6" height={h - 22} fill={dk(color, -30)} />
      </svg>;
    case 'screen':
      return <svg {...common}>{shadow}
        <rect x={w / 2 - 4} y={h - 22} width="8" height="16" fill="#475569" stroke={INK} strokeWidth="2" />
        <rect x={w / 2 - 16} y={h - 8} width="32" height="6" rx="3" fill="#334155" stroke={INK} strokeWidth="2" />
        <rect x="2" y="2" width={w - 4} height={h - 24} rx="6" fill="#0f172a" stroke={INK} strokeWidth="3" />
        <rect x="8" y="8" width={w - 16} height={h - 36} rx="3" fill={accent} opacity="0.85" />
        <path d={`M10 ${h - 30} l ${(w - 20) * 0.3} -8 l ${(w - 20) * 0.3} 5 l ${(w - 20) * 0.4} -14`} stroke="#fff" strokeWidth="2" fill="none" opacity="0.8" />
      </svg>;
    case 'server':
      return <svg {...common}>{shadow}
        <rect x="3" y="2" width={w - 6} height={h - 4} rx="5" fill="#1f2937" stroke={INK} strokeWidth="3" />
        {Array.from({ length: Math.round(h / 16) }).map((_, i) => <g key={i}>
          <rect x="8" y={8 + i * 16} width={w - 16} height="10" rx="2" fill="#0b1220" stroke="#334155" strokeWidth="1" />
          <circle cx="14" cy={13 + i * 16} r="2" fill={i % 2 ? '#22c55e' : '#38bdf8'} /><circle cx="22" cy={13 + i * 16} r="2" fill="#22c55e" />
        </g>)}
      </svg>;
    case 'bed':
      return <svg {...common}>{shadow}
        <rect x="2" y={h - 26} width={w - 4} height="20" rx="5" fill="#cbd5e1" stroke={INK} strokeWidth="3" />
        <rect x="4" y="8" width={w - 8} height={h - 30} rx="8" fill="#e2e8f0" stroke={INK} strokeWidth="3" />
        <rect x="4" y="8" width={w - 8} height="18" rx="8" fill="#bfdbfe" stroke={INK} strokeWidth="2" />
        <rect x="10" y="11" width="30" height="12" rx="6" fill="#fff" stroke={INK} strokeWidth="2" />
        <rect x="0" y={h - 30} width="8" height="26" rx="3" fill="#94a3b8" stroke={INK} strokeWidth="2" /><rect x={w - 8} y={h - 30} width="8" height="26" rx="3" fill="#94a3b8" stroke={INK} strokeWidth="2" />
      </svg>;
    case 'cart':
      return <svg {...common}>{shadow}
        <rect x={w / 2 - 3} y="20" width="6" height={h - 26} fill="#64748b" stroke={INK} strokeWidth="2" />
        <rect x="4" y="2" width={w - 8} height="22" rx="4" fill="#0f172a" stroke={INK} strokeWidth="3" />
        <rect x="9" y="6" width={w - 18} height="14" rx="2" fill="#22c55e" opacity="0.85" />
        <path d="M11 16 l5 -6 l4 4 l5 -8 l5 6" stroke="#fff" strokeWidth="1.6" fill="none" />
        <circle cx={w / 2 - 12} cy={h - 4} r="4" fill="#334155" stroke={INK} strokeWidth="2" /><circle cx={w / 2 + 12} cy={h - 4} r="4" fill="#334155" stroke={INK} strokeWidth="2" />
      </svg>;
    case 'bench':
      return <svg {...common}>{shadow}
        <rect x="2" y="4" width={w - 4} height="14" rx="4" fill={dk(color, 20)} stroke={INK} strokeWidth="3" />
        <rect x="6" y="18" width={w - 12} height={h - 22} rx="3" fill={color} stroke={INK} strokeWidth="3" />
        <rect x={w / 2 - 30} y="24" width="60" height={h - 32} rx="3" fill={dk(color, -22)} />
        <line x1="6" y1={h - 6} x2={w - 6} y2={h - 6} stroke={dk(color, -34)} strokeWidth="3" />
      </svg>;
    case 'podium':
      return <svg {...common}>{shadow}
        <path d={`M${w * 0.2} 2 L${w * 0.8} 2 L${w - 4} ${h - 4} L4 ${h - 4} Z`} fill={color} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
        <rect x={w * 0.2 - 4} y="0" width={w * 0.6 + 8} height="10" rx="3" fill={dk(color, 22)} stroke={INK} strokeWidth="2.5" />
        <circle cx={w / 2} cy={h * 0.5} r="9" fill={dk(color, -26)} />
      </svg>;
    case 'vault':
      return <svg {...common}>{shadow}
        <rect x="2" y="2" width={w - 4} height={h - 6} rx="8" fill="#475569" stroke={INK} strokeWidth="3" />
        <circle cx={w / 2} cy={h / 2 - 2} r={Math.min(w, h) / 2 - 10} fill="#64748b" stroke={INK} strokeWidth="3" />
        <circle cx={w / 2} cy={h / 2 - 2} r={Math.min(w, h) / 2 - 20} fill="#94a3b8" stroke={INK} strokeWidth="2" />
        <circle cx={w / 2} cy={h / 2 - 2} r="6" fill="#334155" stroke={INK} strokeWidth="2" />
        {[0, 45, 90, 135].map(a => <line key={a} x1={w / 2} y1={h / 2 - 2} x2={w / 2 + Math.cos(a * Math.PI / 180) * (Math.min(w, h) / 2 - 12)} y2={h / 2 - 2 + Math.sin(a * Math.PI / 180) * (Math.min(w, h) / 2 - 12)} stroke="#334155" strokeWidth="3" />)}
      </svg>;
    case 'camera':
      return <svg {...common}>{shadow}
        <rect x={w / 2 - 3} y="24" width="6" height={h - 30} fill="#334155" stroke={INK} strokeWidth="2" />
        <path d={`M${w / 2} ${h - 6} l-14 0 M${w / 2} ${h - 6} l14 0 M${w / 2} ${h - 6} l0 6`} stroke="#334155" strokeWidth="3" />
        <rect x="6" y="6" width={w - 22} height="22" rx="4" fill="#1f2937" stroke={INK} strokeWidth="3" />
        <circle cx={w - 14} cy="17" r="8" fill="#0b1220" stroke={INK} strokeWidth="3" /><circle cx={w - 14} cy="17" r="3" fill="#38bdf8" />
        <circle cx="12" cy="4" r="3" fill="#ef4444" />
      </svg>;
    case 'easel':
      return <svg {...common}>{shadow}
        <path d={`M${w / 2} 6 L8 ${h - 4} M${w / 2} 6 L${w - 8} ${h - 4} M14 ${h * 0.7} L${w - 14} ${h * 0.7}`} stroke="#8a5a2b" strokeWidth="4" />
        <rect x={w / 2 - 26} y="6" width="52" height="46" rx="3" fill="#fdfcf7" stroke={INK} strokeWidth="3" />
        <path d="M0 0" /><circle cx={w / 2 - 8} cy="24" r="7" fill="#f472b6" /><path d={`M${w / 2 - 2} 40 q10 -14 20 -4`} stroke="#22c55e" strokeWidth="4" fill="none" />
      </svg>;
    case 'stage':
      return <svg {...common}>{shadow}
        <rect x="2" y={h - 24} width={w - 4} height="20" rx="4" fill="#7c4a24" stroke={INK} strokeWidth="3" />
        {Array.from({ length: Math.round(w / 28) }).map((_, i) => <line key={i} x1={i * 28 + 8} y1={h - 24} x2={i * 28 + 8} y2={h - 4} stroke={dk('#7c4a24', -22)} strokeWidth="2" />)}
        <rect x="2" y="0" width={w - 4} height={h - 22} rx="3" fill="#7f1d1d" stroke={INK} strokeWidth="3" />
        {Array.from({ length: Math.round(w / 26) }).map((_, i) => <path key={i} d={`M${8 + i * 26} 0 q6 ${(h - 24) / 2} 0 ${h - 24}`} stroke={dk('#7f1d1d', 18)} strokeWidth="6" fill="none" opacity="0.7" />)}
        <rect x="0" y="0" width={w} height="10" fill="#a16207" stroke={INK} strokeWidth="2" />
      </svg>;
    case 'board':
      return <svg {...common}>{shadow}
        <rect x="2" y="2" width={w - 4} height={h - 10} rx="4" fill={dk('#8a5a2b', 6)} stroke={INK} strokeWidth="3" />
        <rect x="9" y="8" width={w - 18} height={h - 24} rx="2" fill={color} stroke={INK} strokeWidth="2" />
        <path d={`M18 ${h * 0.4} h ${w * 0.4} M18 ${h * 0.6} h ${w * 0.25}`} stroke="rgba(255,255,255,0.7)" strokeWidth="2.5" strokeLinecap="round" />
        <rect x="9" y={h - 14} width={w - 18} height="6" rx="2" fill="#8a5a2b" stroke={INK} strokeWidth="2" />
      </svg>;
    case 'sofa':
      return <svg {...common}>{shadow}
        <rect x="2" y={h * 0.35} width={w - 4} height={h * 0.6} rx="12" fill={color} stroke={INK} strokeWidth="3" />
        <rect x="2" y="6" width="22" height={h - 10} rx="10" fill={dk(color, -10)} stroke={INK} strokeWidth="3" />
        <rect x={w - 24} y="6" width="22" height={h - 10} rx="10" fill={dk(color, -10)} stroke={INK} strokeWidth="3" />
        <rect x="26" y={h * 0.22} width={w - 52} height={h * 0.4} rx="8" fill={top} stroke={INK} strokeWidth="2.5" />
        <rect x="34" y={h * 0.5} width={(w - 68) / 2 - 4} height={h * 0.32} rx="8" fill={dk(color, 10)} stroke={INK} strokeWidth="2" />
        <rect x={w / 2 + 4} y={h * 0.5} width={(w - 68) / 2 - 4} height={h * 0.32} rx="8" fill={dk(color, 10)} stroke={INK} strokeWidth="2" />
      </svg>;
    case 'tv':
      return <svg {...common}>{shadow}
        <rect x={w / 2 - 4} y={h - 24} width="8" height="16" fill="#475569" stroke={INK} strokeWidth="2" />
        <rect x="6" y={h - 10} width={w - 12} height="8" rx="3" fill="#3f4655" stroke={INK} strokeWidth="2" />
        <rect x="2" y="2" width={w - 4} height={h - 26} rx="7" fill="#0b1220" stroke={INK} strokeWidth="3" />
        <rect x="8" y="8" width={w - 16} height={h - 38} rx="3" fill="#1e3a8a" />
        <rect x="8" y="8" width={w - 16} height={(h - 38) / 2} rx="3" fill="#3b82f6" opacity="0.6" />
      </svg>;
    case 'rack':       // gym weight rack
      return <svg {...common}>{shadow}
        <rect x="2" y="4" width={w - 4} height="8" rx="3" fill="#475569" stroke={INK} strokeWidth="2.5" />
        <rect x="4" y="4" width="8" height={h - 8} fill="#334155" stroke={INK} strokeWidth="2" />
        <rect x={w - 12} y="4" width="8" height={h - 8} fill="#334155" stroke={INK} strokeWidth="2" />
        {[0, 1, 2].map(r => <g key={r}>
          <line x1="12" y1={28 + r * ((h - 36) / 3)} x2={w - 12} y2={28 + r * ((h - 36) / 3)} stroke="#64748b" strokeWidth="3" />
          {[0, 1, 2, 3].map(c => <circle key={c} cx={22 + c * ((w - 44) / 3)} cy={28 + r * ((h - 36) / 3)} r="7" fill={['#1f2937', '#dc2626', '#16a34a', '#2563eb'][(r + c) % 4]} stroke={INK} strokeWidth="2" />)}
        </g>)}
      </svg>;
    case 'produce':    // market produce bin
      return <svg {...common}>{shadow}
        <path d={`M2 ${h * 0.4} L${w - 2} ${h * 0.4} L${w - 8} ${h - 4} L8 ${h - 4} Z`} fill="#8a5a2b" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
        <rect x="2" y={h * 0.28} width={w - 4} height={h * 0.16} rx="4" fill={color} stroke={INK} strokeWidth="2.5" />
        {Array.from({ length: Math.max(3, Math.round(w / 22)) }).map((_, i) => <circle key={i} cx={14 + i * 20} cy={h * 0.32} r="8" fill={['#ef4444', '#f59e0b', '#22c55e', '#a855f7', '#fb923c'][i % 5]} stroke={INK} strokeWidth="1.6" />)}
      </svg>;
    case 'booth':      // restaurant booth (two benches + table)
      return <svg {...common}>{shadow}
        <rect x="2" y="6" width="20" height={h - 12} rx="8" fill={color} stroke={INK} strokeWidth="3" />
        <rect x={w - 22} y="6" width="20" height={h - 12} rx="8" fill={color} stroke={INK} strokeWidth="3" />
        <rect x="24" y={h / 2 - 16} width={w - 48} height="32" rx="6" fill="#e2e8f0" stroke={INK} strokeWidth="3" />
        <ellipse cx={w / 2} cy={h / 2} rx={(w - 56) / 2} ry="9" fill="rgba(0,0,0,0.06)" />
        <circle cx={w / 2 - 14} cy={h / 2} r="5" fill="#ef4444" /><circle cx={w / 2 + 14} cy={h / 2} r="5" fill="#3b82f6" />
      </svg>;
  }
}

/* a classic upright arcade cabinet (one per career / minigame) */
export function ArcadeCabinet({ color, accent, icon, near, done, label }: { color: string; accent: string; icon: string; near: boolean; done?: boolean; label?: string }) {
  return (
    <svg width="104" height="150" viewBox="0 0 104 150" style={{ overflow: 'visible' }}>
      {near && <ellipse cx="52" cy="146" rx="56" ry="14" fill="rgba(253,224,71,0.45)" />}
      <ellipse cx="52" cy="146" rx="40" ry="9" fill="rgba(0,0,0,0.28)" />
      {/* body */}
      <path d="M16 30 L88 30 L92 146 L12 146 Z" fill={color} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
      {/* side glow strips */}
      <path d="M16 30 L20 146 L12 146 Z" fill="rgba(255,255,255,0.14)" />
      <rect x="14" y="34" width="76" height="4" rx="2" fill={accent} opacity="0.9" />
      {/* marquee header */}
      <rect x="12" y="6" width="80" height="26" rx="6" fill={dk(color, 20)} stroke={INK} strokeWidth="3" />
      <rect x="16" y="10" width="72" height="18" rx="4" fill={accent} />
      {label && <text x="52" y="23" textAnchor="middle" fontSize="9" fontWeight="900" fill="#1f2937">{label}</text>}
      {/* screen */}
      <rect x="22" y="40" width="60" height="44" rx="5" fill="#0b1220" stroke={INK} strokeWidth="3" />
      <rect x="26" y="44" width="52" height="36" rx="3" fill={near ? '#fff7d6' : dk(accent, 10)} opacity={near ? 1 : 0.85} />
      <text x="52" y="70" textAnchor="middle" fontSize="22">{icon}</text>
      {done && <text x="52" y="60" textAnchor="middle" fontSize="13">🏆</text>}
      {/* control panel */}
      <path d="M20 90 L84 90 L86 110 L18 110 Z" fill={dk(color, -16)} stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
      <circle cx="34" cy="100" r="5" fill="#ef4444" stroke={INK} strokeWidth="1.5" />
      <circle cx="48" cy="100" r="5" fill="#22c55e" stroke={INK} strokeWidth="1.5" />
      <rect x="60" y="94" width="6" height="12" rx="3" fill="#1f2937" /><circle cx="63" cy="94" r="4" fill="#fbbf24" stroke={INK} strokeWidth="1.5" />
      {/* coin slot */}
      <rect x="44" y="120" width="16" height="14" rx="2" fill="#1f2937" stroke={INK} strokeWidth="2" />
      <rect x="49" y="123" width="6" height="2" fill="#fde047" />
      <circle cx="80" cy="42" r="3.5" fill={done ? '#4ade80' : near ? '#fde047' : '#64748b'} stroke={INK} strokeWidth="1.5" />
    </svg>
  );
}

/* a clean interactive job terminal  -  where a shift/challenge is started */
export function JobStation({ accent, icon, done, near }: { accent: string; icon: string; done: boolean; near: boolean }) {
  return (
    <svg width="92" height="96" viewBox="0 0 92 96" style={{ overflow: 'visible' }}>
      {/* floor glow ring */}
      <ellipse cx="46" cy="88" rx={near ? 42 : 34} ry={near ? 13 : 10} fill={near ? 'rgba(253,224,71,0.5)' : `${accent}55`} />
      <ellipse cx="46" cy="88" rx="26" ry="7" fill="rgba(0,0,0,0.22)" />
      {/* pedestal */}
      <path d="M30 86 L62 86 L58 60 L34 60 Z" fill="#cbd5e1" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
      <rect x="33" y="58" width="26" height="6" rx="3" fill="#94a3b8" stroke={INK} strokeWidth="2" />
      {/* screen housing (angled kiosk) */}
      <rect x="18" y="14" width="56" height="46" rx="9" fill="#1e293b" stroke={INK} strokeWidth="3" />
      <rect x="24" y="20" width="44" height="34" rx="5" fill={done ? '#16a34a' : accent} />
      <rect x="24" y="20" width="44" height="13" rx="5" fill="rgba(255,255,255,0.25)" />
      {/* task icon on the screen */}
      <text x="46" y="44" textAnchor="middle" fontSize="22">{icon}</text>
      {/* status light */}
      <circle cx="66" cy="18" r="3.5" fill={done ? '#4ade80' : near ? '#fde047' : '#64748b'} stroke={INK} strokeWidth="1.5" />
      {done && <text x="46" y="80" textAnchor="middle" fontSize="16">✅</text>}
    </svg>
  );
}

/* a colleague/customer seated behind a desk (head + shoulders) */
export function SeatedNpc({ skin = '#f3c79b', hair = '#3b2a1a', top = '#3b82f6' }: { skin?: string; hair?: string; top?: string }) {
  return (
    <svg width="34" height="34" viewBox="0 0 34 34" style={{ overflow: 'visible' }}>
      <path d="M3 34 q14 -18 28 0 Z" fill={top} stroke={INK} strokeWidth="2.5" />
      <circle cx="17" cy="13" r="10" fill={skin} stroke={INK} strokeWidth="2.5" />
      <path d="M7 12 q0 -11 10 -11 q10 0 10 11 q-3 -5 -10 -5 q-7 0 -10 5 Z" fill={hair} stroke={INK} strokeWidth="2" />
      <circle cx="13" cy="14" r="1.6" fill={INK} /><circle cx="21" cy="14" r="1.6" fill={INK} />
    </svg>
  );
}

/* a patient lying under a blanket (for the ER) */
export function PatientSprite({ blanket = '#60a5fa' }: { blanket?: string }) {
  return (
    <svg width="120" height="40" viewBox="0 0 120 40" style={{ overflow: 'visible' }}>
      <ellipse cx="60" cy="36" rx="56" ry="5" fill="rgba(0,0,0,0.18)" />
      <rect x="22" y="14" width="92" height="20" rx="8" fill={blanket} stroke={INK} strokeWidth="2.5" />
      <rect x="22" y="14" width="92" height="7" rx="4" fill="rgba(255,255,255,0.3)" />
      <circle cx="18" cy="20" r="11" fill="#f3c79b" stroke={INK} strokeWidth="2.5" />
      <path d="M8 18 q0 -10 10 -10 q9 0 10 8 q-4 -3 -10 -3 q-7 0 -10 5 Z" fill="#5b3a1a" stroke={INK} strokeWidth="1.6" />
    </svg>
  );
}

export function PlantSprite() {
  return (
    <svg width="40" height="54" viewBox="0 0 40 54" style={{ overflow: 'visible' }}>
      <ellipse cx="20" cy="50" rx="15" ry="4" fill="rgba(0,0,0,0.2)" />
      <path d="M20 30 q-16 -6 -12 -28 q10 4 12 16 q2 -12 12 -16 q4 22 -12 28Z" fill="#3f9d52" stroke={INK} strokeWidth="2.5" />
      <path d="M8 30 h24 l-3 18 h-18 Z" fill="#c0683a" stroke={INK} strokeWidth="2.5" />
    </svg>
  );
}

/* framed wall poster / window */
export function WallPanel({ w = 70, h = 50, kind = 'poster', color = '#38bdf8' }: { w?: number; h?: number; kind?: 'poster' | 'window' | 'clock'; color?: string }) {
  if (kind === 'clock') return (
    <svg width="36" height="36" viewBox="0 0 36 36"><circle cx="18" cy="18" r="16" fill="#f8fafc" stroke={INK} strokeWidth="3" /><line x1="18" y1="18" x2="18" y2="8" stroke={INK} strokeWidth="2.5" /><line x1="18" y1="18" x2="25" y2="20" stroke={INK} strokeWidth="2.5" /></svg>
  );
  if (kind === 'window') return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <rect x="2" y="2" width={w - 4} height={h - 4} rx="4" fill="#bfe3ff" stroke={INK} strokeWidth="3" />
      <path d={`M4 ${h - 6} l ${w / 2} -${h / 2}`} stroke="#fff" strokeWidth="6" opacity="0.6" />
      <line x1={w / 2} y1="2" x2={w / 2} y2={h - 2} stroke={INK} strokeWidth="2.5" /><line x1="2" y1={h / 2} x2={w - 2} y2={h / 2} stroke={INK} strokeWidth="2.5" />
    </svg>
  );
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <rect x="2" y="2" width={w - 4} height={h - 4} rx="3" fill="#fdfcf7" stroke={INK} strokeWidth="3" />
      <rect x="8" y="8" width={w - 16} height={h - 22} rx="2" fill={color} opacity="0.85" />
      <rect x="10" y={h - 12} width={w - 30} height="4" rx="2" fill={INK} opacity="0.5" />
    </svg>
  );
}
