import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Volume2, Sun } from 'lucide-react';

interface Step {
  title: string;
  body: string;
  cta: string | null;        // null => advances on player action/movement/navigation
  anchor: 'center' | 'top-left' | 'left' | 'center-lower' | 'right';
}

const STEPS: Step[] = [
  {
    title: 'Welcome to Questford!',
    body: "I'm Mayor Questopher, your guide. This cosy little town is full of careers waiting for you to try. Let me show you around — it'll only take a moment.",
    cta: 'Show me',
    anchor: 'center-lower'
  },
  {
    title: 'Take a stroll',
    body: 'Use W A S D or the arrow keys to walk around town. Go on — give it a try!',
    cta: null,
    anchor: 'center'
  },
  {
    title: 'Track your progress',
    body: 'Up here you can always see your stars, coins, level and daily streak as they grow.',
    cta: 'Next',
    anchor: 'top-left'
  },
  {
    title: 'Step inside a shop',
    body: 'Every signed building is a career domain. Walk up to a door and press E to head inside, or open the Map/Compass to jump straight to one.',
    cta: null,
    anchor: 'center'
  },
  {
    title: 'Welcome to the Career Hub!',
    body: 'This is the career domain workspace. Click on any unlocked challenge card on the deck to enter a career simulation.',
    cta: null,
    anchor: 'center'
  },
  {
    title: 'Always within reach',
    body: 'Look to the left! In every simulation, you can use these floating controls to head back, mute sounds, or dim the screen.',
    cta: 'Next',
    anchor: 'left'
  },
  {
    title: "You're all set!",
    body: 'Outstanding! You have learned the basics of the kingdom. Complete challenges to earn stars and coins. Now go explore and have fun!',
    cta: "Let's go",
    anchor: 'right'
  }
];

export const TUTORIAL_STEP_COUNT = STEPS.length;

export function CityTutorial({ step, onAdvance, onSkip }: { step: number; onAdvance: () => void; onSkip: () => void }) {
  const s = STEPS[step];
  if (!s) return null;

  const [highlightRect, setHighlightRect] = useState<{ left: number; top: number; width: number; height: number } | null>(null);

  useEffect(() => {
    const updateRect = () => {
      let targetId = '';
      if (s.anchor === 'top-left') {
        targetId = 'tutorial-hud-progress';
      } else if (s.anchor === 'left') {
        targetId = 'tutorial-screen-controls';
      }

      if (targetId) {
        const el = document.getElementById(targetId);
        if (el) {
          const rect = el.getBoundingClientRect();
          // Only update state if coordinates actually changed (avoids rendering loops)
          setHighlightRect((prev) => {
            if (
              prev &&
              prev.left === rect.left &&
              prev.top === rect.top &&
              prev.width === rect.width &&
              prev.height === rect.height
            ) {
              return prev;
            }
            return {
              left: rect.left,
              top: rect.top,
              width: rect.width,
              height: rect.height,
            };
          });
          return;
        }
      }
      setHighlightRect(null);
    };

    updateRect();
    const timer = setTimeout(updateRect, 100);
    const interval = setInterval(updateRect, 400);
    window.addEventListener('resize', updateRect);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
      window.removeEventListener('resize', updateRect);
    };
  }, [step, s.anchor]);

  const cardPos =
    s.anchor === 'top-left'
      ? 'left-3 sm:left-5 top-24'
      : s.anchor === 'left'
        ? 'left-16 sm:left-20 top-1/2 -translate-y-1/2'
        : s.anchor === 'right'
          ? 'right-4 sm:right-8 lg:right-16 top-1/2 -translate-y-1/2'
          : s.anchor === 'center-lower'
            ? 'left-1/2 -translate-x-1/2 top-48 sm:top-56'
            : 'left-1/2 -translate-x-1/2 top-24 sm:top-28';

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none">
      {/* soft scrim to focus attention without hiding the town */}
      <div className="absolute inset-0" style={{ background: 'rgba(6,10,24,0.30)' }} />

      {/* contextual dynamic highlight rings */}
      {highlightRect && (
        <motion.div
          className="absolute rounded-2xl"
          style={{
            left: highlightRect.left - 4,
            top: highlightRect.top - 4,
            width: highlightRect.width + 8,
            height: highlightRect.height + 8,
            border: '2px solid rgba(250,204,21,0.85)',
            boxShadow: '0 0 22px rgba(250,204,21,0.5)',
          }}
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
          {s.cta === null && step === 1 && (
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

          {/* mini control previews for the settings step */}
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
