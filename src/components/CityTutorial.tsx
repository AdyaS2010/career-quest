import { motion } from 'framer-motion';
import { ArrowLeft, Volume2, Sun } from 'lucide-react';

interface Step {
  title: string;
  body: string;
  cta: string | null;        // null => advances on player action (movement)
  anchor: 'center' | 'top' | 'left';
}

// A short, friendly first-run walkthrough hosted by Questopher. It is mostly
// button-driven, with one genuinely interactive beat (step 2) that only
// advances once the player actually moves — so newcomers learn the controls by
// doing. The overlay never blocks input: only the coach card is interactive, so
// the player can walk around underneath it.
const STEPS: Step[] = [
  { title: 'Welcome to Questford!', body: "I'm Questopher, your guide. This cosy little town is full of careers waiting for you to try. Let me show you around — it'll only take a moment.", cta: 'Show me', anchor: 'center' },
  { title: 'Take a stroll', body: 'Use W A S D or the arrow keys to walk around town. Go on — give it a try!', cta: null, anchor: 'center' },
  { title: 'Step inside a shop', body: 'Every signed building is a different career. Walk up to a door and press E to head inside and start playing.', cta: 'Got it', anchor: 'center' },
  { title: 'Track your progress', body: 'Up here you can always see your stars, coins, level and daily streak as they grow.', cta: 'Next', anchor: 'top' },
  { title: 'Always within reach', body: 'These controls follow you onto every screen — head back, mute the sound, or switch between light and dark.', cta: 'Next', anchor: 'left' },
  { title: "You're all set!", body: 'Open the Map or Career Compass whenever you like to plan your path. Now go explore Questford — your adventure starts here!', cta: "Let's go", anchor: 'center' },
];

export const TUTORIAL_STEP_COUNT = STEPS.length;

export function CityTutorial({ step, onAdvance, onSkip }: { step: number; onAdvance: () => void; onSkip: () => void }) {
  const s = STEPS[step];
  if (!s) return null;

  const cardPos =
    s.anchor === 'top'
      ? 'left-1/2 -translate-x-1/2 top-20 sm:top-24'
      : s.anchor === 'left'
        ? 'left-16 sm:left-20 top-1/2 -translate-y-1/2'
        : 'left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2';

  return (
    <div className="fixed inset-0 z-[70] pointer-events-none">
      {/* soft scrim to focus attention without hiding the town */}
      <div className="absolute inset-0" style={{ background: 'rgba(6,10,24,0.30)' }} />

      {/* contextual highlight rings */}
      {s.anchor === 'top' && (
        <motion.div
          className="absolute left-1/2 -translate-x-1/2 top-2 rounded-2xl"
          style={{ width: 'min(680px, 92vw)', height: 56, border: '2px solid rgba(250,204,21,0.85)', boxShadow: '0 0 22px rgba(250,204,21,0.5)' }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.6, repeat: Infinity }}
        />
      )}
      {s.anchor === 'left' && (
        <motion.div
          className="absolute left-1 top-1/2 -translate-y-1/2 rounded-full"
          style={{ width: 52, height: 150, border: '2px solid rgba(250,204,21,0.85)', boxShadow: '0 0 22px rgba(250,204,21,0.5)' }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.6, repeat: Infinity }}
        />
      )}

      <motion.div
        key={step}
        initial={{ opacity: 0, scale: 0.9, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 26 }}
        className={`absolute ${cardPos} pointer-events-auto w-[min(420px,92vw)]`}
      >
        <div
          className="rounded-3xl p-5 sm:p-6 text-white"
          style={{ background: '#0f1733', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.16)', boxShadow: '0 24px 60px rgba(0,0,0,0.6)' }}
        >
          <div className="flex items-start gap-3">
            <div className="text-3xl sm:text-4xl shrink-0 animate-bounce" style={{ animationDuration: '2.4s' }}>🤖</div>
            <div className="min-w-0">
              <h3 className="font-fantasy text-lg sm:text-xl text-amber-200 leading-tight">{s.title}</h3>
              <p className="mt-1.5 text-sm sm:text-[15px] text-slate-200/90 leading-relaxed">{s.body}</p>
            </div>
          </div>

          {/* the interactive movement beat shows live key hints instead of a button */}
          {s.cta === null && (
            <div className="mt-4 flex items-center justify-center gap-1.5">
              {['W', 'A', 'S', 'D'].map((k, i) => (
                <motion.span
                  key={k}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black text-white"
                  style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.25)' }}
                  animate={{ y: [0, -4, 0], opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.12 }}
                >
                  {k}
                </motion.span>
              ))}
            </div>
          )}

          {/* mini control previews for the relevant steps */}
          {s.anchor === 'left' && (
            <div className="mt-4 flex items-center justify-center gap-2 text-slate-300">
              <span className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)' }}><ArrowLeft className="w-4 h-4" /></span>
              <span className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)' }}><Volume2 className="w-4 h-4" /></span>
              <span className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)' }}><Sun className="w-4 h-4" /></span>
            </div>
          )}

          <div className="mt-5 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              {STEPS.map((_, i) => (
                <span key={i} className="rounded-full transition-all" style={{ width: i === step ? 18 : 7, height: 7, background: i === step ? '#fbbf24' : 'rgba(255,255,255,0.25)' }} />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={onSkip} className="px-3 py-1.5 text-xs font-bold text-slate-300 hover:text-white transition-colors">Skip</button>
              {s.cta && (
                <button
                  onClick={onAdvance}
                  className="px-4 py-2 rounded-xl text-sm font-bold text-white transition-transform hover:scale-105"
                  style={{ background: 'linear-gradient(90deg,#6366f1,#a855f7)', boxShadow: '0 6px 16px rgba(99,102,241,0.45)' }}
                >
                  {s.cta}
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
