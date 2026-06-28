import { CharacterSprite, type Palette } from '../pages/city/art';

// The grand finale: once every career is mastered, the player drifts away over
// Questford in a hot-air balloon, ready to chase the path they discovered.
const CONFETTI = Array.from({ length: 36 }, (_, i) => ({
  left: (i * 2.8) % 100, delay: (i % 12) * 0.4, dur: 4 + (i % 5), c: ['#fbbf24', '#ef4444', '#22c55e', '#3b82f6', '#ec4899', '#a855f7'][i % 6], size: 7 + (i % 4) * 2,
}));

export function Outro({ name, topName, palette, onClose }: { name: string; topName: string; palette: Palette; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[400] overflow-hidden flex flex-col items-center justify-end"
      style={{ background: 'linear-gradient(180deg, #f9a26b 0%, #f7b267 30%, #fcd29f 60%, #cfe8d6 100%)' }}>
      {/* sun */}
      <div className="absolute rounded-full" style={{ width: 130, height: 130, top: '14%', background: 'radial-gradient(circle at 40% 35%, #fff7d6, #fcd34d)', boxShadow: '0 0 90px 30px rgba(252,211,77,0.6)' }} />

      {/* clouds */}
      {[{ y: '12%', s: 1, d: 60, o: 0.85 }, { y: '26%', s: 1.4, d: 90, o: 0.7 }, { y: '40%', s: 0.9, d: 75, o: 0.6 }].map((c, i) => (
        <div key={i} className="absolute rounded-full bg-white" style={{ top: c.y, width: 200 * c.s, height: 60 * c.s, opacity: c.o, filter: 'blur(6px)', animation: `qf-drift ${c.d}s linear infinite` }} />
      ))}

      {/* confetti */}
      {CONFETTI.map((c, i) => (
        <div key={i} className="absolute rounded-sm" style={{ left: `${c.left}%`, top: 0, width: c.size, height: c.size, background: c.c, animation: `qf-confetti ${c.dur}s linear ${c.delay}s infinite` }} />
      ))}

      {/* skyline silhouette */}
      <svg className="absolute bottom-0 inset-x-0 w-full" viewBox="0 0 1200 200" preserveAspectRatio="none" style={{ height: '26vh' }}>
        {[40, 150, 260, 360, 470, 590, 700, 820, 940, 1060].map((x, i) => {
          const w = 74 + (i % 3) * 20, h = 80 + ((i * 41) % 100);
          return <rect key={i} x={x} y={200 - h} width={w} height={h} fill="#3f6048" opacity="0.85" />;
        })}
      </svg>

      {/* balloon + character */}
      <div className="absolute" style={{ left: '50%', top: '6%', transform: 'translateX(-50%)', animation: 'qf-balloon 7s ease-out forwards' }}>
        <div className="relative qf-bob" style={{ width: 150 }}>
          {/* envelope */}
          <div className="mx-auto rounded-full" style={{ width: 130, height: 150, background: 'radial-gradient(circle at 38% 30%, #fde68a, #fb7185 70%, #db2777)', border: '3px solid #831843', boxShadow: 'inset -10px -14px 20px rgba(0,0,0,0.2)' }}>
            <div className="absolute left-1/2 -translate-x-1/2" style={{ top: 0, width: 26, height: 150, background: 'rgba(255,255,255,0.18)' }} />
            <div className="absolute left-[26px]" style={{ top: 0, width: 14, height: 150, background: 'rgba(0,0,0,0.08)' }} />
            <div className="absolute right-[26px]" style={{ top: 0, width: 14, height: 150, background: 'rgba(0,0,0,0.08)' }} />
          </div>
          {/* ropes */}
          <div className="absolute left-1/2 -translate-x-1/2" style={{ top: 142, width: 70, height: 30 }}>
            <div className="absolute left-0 top-0 w-0.5 h-8 bg-amber-900 rotate-12" />
            <div className="absolute right-0 top-0 w-0.5 h-8 bg-amber-900 -rotate-12" />
          </div>
          {/* basket + character */}
          <div className="absolute left-1/2 -translate-x-1/2 rounded-md" style={{ top: 168, width: 56, height: 34, background: 'linear-gradient(180deg,#b97a44,#8a5a2b)', border: '2px solid #5b3a1a' }}>
            <div className="absolute -top-9 left-1/2 -translate-x-1/2"><CharacterSprite w={40} dir="down" phase={0} moving={false} palette={palette} hat /></div>
          </div>
        </div>
      </div>

      {/* finale card */}
      <div className="relative z-10 mb-[20vh] w-full max-w-lg mx-4 text-center animate-fade-in">
        <div className="rounded-3xl border-4 shadow-2xl p-6" style={{ background: 'linear-gradient(160deg, rgba(15,23,42,0.92), rgba(15,23,42,0.85))', borderColor: '#fbbf24' }}>
          <div className="text-amber-300 text-xs font-black tracking-[0.3em] uppercase mb-2">Champion of Questford</div>
          <h1 className="font-fantasy text-white text-3xl sm:text-4xl mb-3">Congratulations, {name}!</h1>
          <p className="text-slate-200 leading-relaxed">
            You explored all eight careers of Questford, earned every reference, and finished the Rotation. As you drift off over the rooftops, one path shines brightest…
          </p>
          <div className="my-4 inline-block px-4 py-2 rounded-2xl" style={{ background: 'rgba(250,204,21,0.14)', border: '1px solid rgba(250,204,21,0.4)' }}>
            <span className="text-slate-300 text-sm">Your standout path: </span>
            <span className="text-amber-300 font-black">{topName}</span>
          </div>
          <p className="text-slate-300 text-sm mb-5">Now go build it for real  -  your adventure is just beginning. ✈️</p>
          <button onClick={onClose} className="px-8 py-3.5 rounded-2xl font-black text-slate-900 shadow-xl hover:scale-105 active:scale-95 transition-transform" style={{ background: 'linear-gradient(90deg,#fbbf24,#f59e0b)' }}>
            Continue exploring →
          </button>
        </div>
      </div>
    </div>
  );
}
