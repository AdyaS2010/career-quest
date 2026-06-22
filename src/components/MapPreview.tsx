import { useEffect } from 'react';
import * as LucideIcons from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { X, Compass, Map as MapIcon, ArrowRight } from 'lucide-react';
import type { ColorScheme } from '../lib/database.types';

type Status = 'mastered' | 'in_progress' | 'not_started';
export interface PreviewDoor { slug: string; name: string; color: ColorScheme; icon: string; mastered: boolean }

// 8 location stops scattered across the little island (percent of the map box).
const NODES = [
  { x: 18, y: 64 }, { x: 36, y: 76 }, { x: 26, y: 42 }, { x: 47, y: 31 },
  { x: 67, y: 38 }, { x: 56, y: 65 }, { x: 79, y: 71 }, { x: 86, y: 46 },
];

function resolveIcon(name: string): LucideIcon {
  const pascal = (name || '').split(/[-_ ]/).map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('');
  return ((LucideIcons as unknown as Record<string, LucideIcon>)[pascal]) || Compass;
}

// A compact island-map overlay that pops up over the city so the player can peek
// at every career district and quick-jump straight into one — no full page change.
export function MapPreview({ doors, skills, recommended, onPick, onFullMap, onCity, onClose }: {
  doors: PreviewDoor[];
  skills: Record<string, { xp: number; status: Status }>;
  recommended?: string;
  onPick: (slug: string) => void;
  onFullMap: () => void;
  onCity: () => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const masteredCount = doors.filter(d => d.mastered).length;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-fade-in" style={{ background: 'rgba(5,10,24,0.72)', backdropFilter: 'blur(6px)' }} onClick={onClose}>
      <div className="relative w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl animate-bounce-in" style={{ background: '#0d1a3a', border: '1px solid rgba(255,255,255,0.14)' }} onClick={e => e.stopPropagation()}>
        {/* header */}
        <div className="flex items-center justify-between px-5 py-3.5" style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div className="flex items-center gap-2.5">
            <span className="grid place-items-center w-9 h-9 rounded-xl" style={{ background: 'linear-gradient(145deg,#34d399,#0ea5a3)' }}><MapIcon className="w-5 h-5 text-white" /></span>
            <div>
              <h2 className="font-fantasy text-white text-xl leading-none">Quest Map</h2>
              <p className="text-[11px] text-emerald-200/70 font-bold tracking-wide">{masteredCount}/{doors.length} districts mastered · pick where to go</p>
            </div>
          </div>
          <button onClick={onClose} title="Close" aria-label="Close" className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors"><X className="w-5 h-5" /></button>
        </div>

        {/* island preview with clickable district nodes */}
        <div className="relative w-full" style={{ aspectRatio: '16 / 9', background: 'linear-gradient(180deg,#0a1228,#0f1b3d)' }}>
          <svg viewBox="0 0 1200 675" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full">
            <defs>
              <radialGradient id="mp-sea" cx="0.5" cy="0.36" r="0.95"><stop offset="0" stopColor="#3f93d6" /><stop offset="0.42" stopColor="#236199" /><stop offset="0.78" stopColor="#143b66" /><stop offset="1" stopColor="#0c2545" /></radialGradient>
              <radialGradient id="mp-land" cx="0.42" cy="0.35" r="0.82"><stop offset="0" stopColor="#a6dd8d" /><stop offset="0.55" stopColor="#6cb568" /><stop offset="1" stopColor="#3c854a" /></radialGradient>
              <radialGradient id="mp-sky" cx="0.5" cy="0" r="1"><stop offset="0" stopColor="#bfeaff" stopOpacity="0.6" /><stop offset="0.4" stopColor="#7fc0f0" stopOpacity="0.18" /><stop offset="1" stopColor="#7fc0f0" stopOpacity="0" /></radialGradient>
              <radialGradient id="mp-vig" cx="0.5" cy="0.46" r="0.78"><stop offset="0" stopColor="#05101f" stopOpacity="0" /><stop offset="0.68" stopColor="#05101f" stopOpacity="0" /><stop offset="1" stopColor="#040c1a" stopOpacity="0.6" /></radialGradient>
              <filter id="mp-soft"><feGaussianBlur stdDeviation="5" /></filter>
              <filter id="mp-blur18" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="16" /></filter>
              <filter id="mp-blur40" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="36" /></filter>
            </defs>
            <rect x="0" y="0" width="1200" height="675" fill="url(#mp-sea)" />
            <rect x="0" y="0" width="1200" height="675" fill="url(#mp-sky)" />
            {[[300, 190, 200], [830, 340, 250], [560, 600, 220], [150, 520, 170]].map(([cx, cy, r], i) => (
              <circle key={`mp-pool-${i}`} cx={cx} cy={cy} r={r} fill="#8fd8ff" opacity="0.09" filter="url(#mp-blur40)" />
            ))}
            {Array.from({ length: 18 }).map((_, i) => <line key={i} x1={(i * 71) % 1200} y1={30 + (i * 91) % 675} x2={(i * 71) % 1200 + 22} y2={30 + (i * 91) % 675} stroke="#ffffff" strokeWidth="2" opacity="0.08" strokeLinecap="round" />)}
            {/* ethereal rim halo around the isle */}
            <path d="M120 230 Q90 110 320 80 Q620 44 760 100 Q1010 64 1080 230 Q1170 400 1010 540 Q900 660 600 640 Q300 676 170 540 Q40 400 120 230 Z" fill="#d4fbe6" opacity="0.5" filter="url(#mp-blur18)" />
            {/* island depth + body */}
            <path d="M120 230 Q90 110 320 80 Q620 44 760 100 Q1010 64 1080 230 Q1170 400 1010 540 Q900 660 600 640 Q300 676 170 540 Q40 400 120 230 Z" fill="#7a5a36" transform="translate(0,24)" />
            <path d="M120 230 Q90 110 320 80 Q620 44 760 100 Q1010 64 1080 230 Q1170 400 1010 540 Q900 660 600 640 Q300 676 170 540 Q40 400 120 230 Z" fill="#5f4528" transform="translate(0,38)" opacity="0.85" />
            <path d="M120 230 Q90 110 320 80 Q620 44 760 100 Q1010 64 1080 230 Q1170 400 1010 540 Q900 660 600 640 Q300 676 170 540 Q40 400 120 230 Z" fill="url(#mp-land)" stroke="#e7d6a8" strokeWidth="7" />
            {/* region tints */}
            <ellipse cx="330" cy="270" rx="150" ry="110" fill="#6fb86e" opacity="0.5" />
            <ellipse cx="800" cy="240" rx="170" ry="110" fill="#cdbf86" opacity="0.45" />
            <ellipse cx="760" cy="500" rx="160" ry="110" fill="#4f9a5a" opacity="0.5" />
            {/* mountains + lake for charm */}
            {[[860, 200], [930, 230], [800, 230]].map(([mx, my], i) => <g key={i}><path d={`M${mx} ${my} l40 -68 l40 68 Z`} fill="#7c8a93" stroke="#4a565e" strokeWidth="3" strokeLinejoin="round" /><path d={`M${mx + 26} ${my - 44} l14 -24 l14 24 Z`} fill="#eef3f6" /></g>)}
            <ellipse cx="540" cy="430" rx="62" ry="40" fill="#3a86c8" stroke="#e7d6a8" strokeWidth="4" /><ellipse cx="522" cy="420" rx="20" ry="10" fill="#bfe3ff" opacity="0.6" />
            {/* drifting fireflies */}
            {[[360, 220], [690, 190], [900, 400], [520, 520], [780, 470], [280, 440]].map(([fx, fy], i) => (
              <circle key={`mp-fly-${i}`} cx={fx} cy={fy} r={i % 2 ? 4 : 6} fill="#fff7d6" filter="url(#mp-blur18)" style={{ transformBox: 'fill-box', transformOrigin: 'center', animation: `qf-twinkle ${3 + (i % 4)}s ease-in-out ${i * 0.5}s infinite` }} />
            ))}
            {/* sunlit sheen + vignette */}
            <ellipse cx="520" cy="210" rx="360" ry="140" fill="#ffffff" opacity="0.1" filter="url(#mp-blur40)" />
            <rect x="0" y="0" width="1200" height="675" fill="url(#mp-vig)" />
          </svg>

          {/* quest trail */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ zIndex: 1 }}>
            <path d={trail(doors.length)} fill="none" stroke="rgba(12,39,70,0.55)" strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
            <path d={trail(doors.length)} fill="none" stroke="#fff3c4" strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" opacity="0.35" style={{ filter: 'blur(2.5px)' }} />
            <path d={trail(doors.length)} fill="none" stroke="#f0e4bf" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
            <path d={trail(doors.length)} fill="none" stroke="#caa66a" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="1 8" vectorEffect="non-scaling-stroke" />
          </svg>

          {/* district nodes */}
          {doors.map((d, i) => {
            const n = NODES[i] || NODES[NODES.length - 1];
            const Icon = resolveIcon(d.icon);
            const st = skills[d.slug]?.status ?? 'not_started';
            const isRec = recommended === d.slug;
            const ring = d.mastered ? '#fbbf24' : isRec ? '#34d399' : 'rgba(255,255,255,0.9)';
            return (
              <button key={d.slug} onClick={() => onPick(d.slug)} title={`Go to ${d.name}`}
                className="absolute -translate-x-1/2 -translate-y-1/2 group flex flex-col items-center focus:outline-none"
                style={{ left: `${n.x}%`, top: `${n.y}%`, zIndex: 5 }}>
                <span className="grid place-items-center rounded-2xl shadow-lg transition-transform group-hover:scale-110 group-hover:-translate-y-0.5"
                  style={{ width: 38, height: 38, background: `linear-gradient(145deg, ${d.color.accent}, ${d.color.primary})`, border: `2.5px solid ${ring}` }}>
                  <Icon className="w-5 h-5 text-white drop-shadow" />
                </span>
                <span className="mt-1 px-1.5 py-0.5 rounded-md text-[10px] font-black text-white whitespace-nowrap shadow" style={{ background: 'rgba(8,15,35,0.82)' }}>
                  {d.name}{d.mastered ? ' 🏆' : st === 'in_progress' ? ' …' : ''}
                </span>
                {isRec && <span className="absolute -top-2 -right-2 px-1.5 py-0.5 rounded-full text-[8px] font-black text-slate-900 bg-emerald-400 shadow">PICK</span>}
              </button>
            );
          })}
        </div>

        {/* footer actions */}
        <div className="flex items-center justify-between gap-3 px-5 py-3.5" style={{ background: 'rgba(255,255,255,0.04)', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <p className="text-xs text-slate-300/80 font-medium hidden sm:block">Tap a district to jump straight in.</p>
          <div className="flex items-center gap-2 ml-auto">
            <button onClick={onCity} className="px-4 py-2 rounded-xl text-sm font-bold text-slate-200 hover:text-white hover:bg-white/10 transition-colors">Stay in city</button>
            <button onClick={onFullMap} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-black text-slate-900 shadow-lg transition-transform hover:scale-105" style={{ background: 'linear-gradient(145deg,#34d399,#0ea5a3)' }}>Open full map <ArrowRight className="w-4 h-4" /></button>
          </div>
        </div>
      </div>
    </div>
  );
}

// smooth golden trail threading the stops in order (Catmull-Rom → bézier)
function trail(count: number) {
  const pts = Array.from({ length: count }, (_, i) => NODES[i] || NODES[NODES.length - 1]);
  if (pts.length < 2) return '';
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    const c1x = p1.x + (p2.x - p0.x) / 6, c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6, c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x} ${c1y} ${c2x} ${c2y} ${p2.x} ${p2.y}`;
  }
  return d;
}
