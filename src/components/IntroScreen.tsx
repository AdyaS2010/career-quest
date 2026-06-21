import { useState } from 'react';

// Cinematic first-run setup: establishes the internship narrative, lets the
// player name their intern, and hands off into Questford.
export function IntroScreen({ defaultName, onBegin }: { defaultName: string; onBegin: (name: string) => void }) {
  const [name, setName] = useState(defaultName);

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at 50% -20%, #20305f, #0a0f24 70%)' }}>
      {/* drifting clouds */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute rounded-full bg-white/20 blur-2xl" style={{ width: 320, height: 90, top: '14%', animation: 'qf-drift 50s linear infinite' }} />
        <div className="absolute rounded-full bg-white/15 blur-2xl" style={{ width: 240, height: 70, top: '26%', animation: 'qf-drift 70s linear infinite' }} />
      </div>

      {/* skyline silhouette */}
      <svg className="absolute bottom-0 inset-x-0 w-full" viewBox="0 0 1200 220" preserveAspectRatio="none" style={{ height: '34vh' }}>
        <defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1b2547" /><stop offset="1" stopColor="#0a0f24" /></linearGradient></defs>
        {[40, 150, 260, 360, 470, 590, 700, 820, 940, 1060].map((x, i) => {
          const w = 70 + (i % 3) * 22, h = 90 + ((i * 37) % 110);
          return <g key={i}>
            <rect x={x} y={220 - h} width={w} height={h} fill="url(#sky)" stroke="#2b3a6b" strokeWidth="2" />
            {Array.from({ length: Math.floor(h / 26) }).map((_, r) => Array.from({ length: Math.floor(w / 24) }).map((_, c) => (
              <rect key={`${r}-${c}`} x={x + 8 + c * 24} y={220 - h + 12 + r * 26} width="10" height="12" fill={(r + c + i) % 3 === 0 ? '#fde68a' : '#33406e'} opacity={(r + c + i) % 3 === 0 ? 0.9 : 0.5} />
            )))}
          </g>;
        })}
      </svg>
      {/* moon */}
      <div className="absolute rounded-full" style={{ width: 80, height: 80, top: '12%', right: '16%', background: 'radial-gradient(circle at 38% 35%, #fff7d6, #fde68a)', boxShadow: '0 0 60px 12px rgba(253,224,71,0.35)' }} />

      {/* content card */}
      <div className="relative z-10 w-full max-w-lg mx-4 text-center">
        <div className="animate-fade-in">
          <div className="inline-block px-3 py-1 rounded-full text-amber-300 text-xs font-black tracking-[0.3em] uppercase mb-3" style={{ background: 'rgba(250,204,21,0.12)', border: '1px solid rgba(250,204,21,0.4)' }}>
            The Internship Rotation
          </div>
          <h1 className="font-fantasy text-white leading-none mb-2" style={{ fontSize: 'clamp(3rem,12vw,5.5rem)', textShadow: '0 4px 30px rgba(96,165,250,0.5)' }}>
            QUESTFORD
          </h1>
        </div>

        <div className="space-y-3 mt-5 text-slate-200/90 text-sm sm:text-base leading-relaxed">
          <p className="animate-fade-in" style={{ animationDelay: '0.15s' }}>
            Fresh out of school, you arrive in <span className="text-amber-300 font-bold">Questford</span> — the one town where you can try eight real careers before deciding who you'll become.
          </p>
          <p className="animate-fade-in" style={{ animationDelay: '0.35s' }}>
            Clock into internships at the Bistro, the Hospital, the Newsroom and more. Earn references, build your résumé, and chase the dream offer.
          </p>
        </div>

        {/* name your intern */}
        <div className="mt-7 animate-fade-in" style={{ animationDelay: '0.5s' }}>
          <label className="block text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Name your intern</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 18))}
            className="w-56 text-center px-4 py-2.5 rounded-xl bg-white/10 border-2 border-white/20 text-white font-bold focus:outline-none focus:border-amber-400 transition-colors"
            placeholder="Intern"
          />
        </div>

        <button
          onClick={() => onBegin(name.trim() || defaultName)}
          className="mt-7 px-8 py-4 rounded-2xl font-black text-lg text-slate-900 shadow-2xl hover:scale-105 active:scale-95 transition-transform animate-fade-in"
          style={{ background: 'linear-gradient(90deg,#fbbf24,#f59e0b)', animationDelay: '0.65s' }}
        >
          Begin your first day →
        </button>
        <p className="mt-4 text-slate-500 text-xs animate-fade-in" style={{ animationDelay: '0.8s' }}>
          WASD / Arrows to walk · Space to jump · E to clock in
        </p>
      </div>
    </div>
  );
}
