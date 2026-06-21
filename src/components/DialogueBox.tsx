import { useEffect, useRef, useState } from 'react';
import type { DialogueLine } from '../pages/city/story';

interface DialogueBoxProps {
  lines: DialogueLine[];
  onClose: () => void;
}

// A classic JRPG-style dialogue overlay: portrait + name plate + typewriter
// text. Click / Space / Enter advances; finishes the current line instantly if
// it's still typing.
export function DialogueBox({ lines, onClose }: DialogueBoxProps) {
  const [idx, setIdx] = useState(0);
  const [shown, setShown] = useState('');
  const [typing, setTyping] = useState(true);
  const timer = useRef<number>(0);

  const line = lines[idx];

  // Typewriter for the current line.
  useEffect(() => {
    if (!line) return;
    setShown('');
    setTyping(true);
    let i = 0;
    const tick = () => {
      i++;
      setShown(line.text.slice(0, i));
      if (i < line.text.length) {
        timer.current = window.setTimeout(tick, 18);
      } else {
        setTyping(false);
      }
    };
    timer.current = window.setTimeout(tick, 18);
    return () => window.clearTimeout(timer.current);
  }, [idx, line]);

  const advance = () => {
    if (typing) {
      // reveal the whole line immediately
      window.clearTimeout(timer.current);
      setShown(line.text);
      setTyping(false);
      return;
    }
    if (idx < lines.length - 1) setIdx(idx + 1);
    else onClose();
  };

  // Keyboard: space / enter advance, escape skips all.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === ' ' || k === 'enter' || k === 'e') { e.preventDefault(); advance(); }
      else if (k === 'escape') { e.preventDefault(); onClose(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (!line) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 sm:p-8"
      style={{ background: 'rgba(2,6,23,0.55)', backdropFilter: 'blur(2px)' }}
      onClick={advance}
    >
      <div
        className="relative w-full max-w-2xl rounded-3xl border-4 shadow-2xl overflow-hidden"
        style={{ background: 'linear-gradient(160deg,#1e293b,#0f172a)', borderColor: '#fbbf24' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* skip */}
        <button
          onClick={onClose}
          className="absolute top-3 right-4 text-slate-400 hover:text-white text-xs font-bold uppercase tracking-widest"
        >
          Skip ✕
        </button>

        <div className="flex items-start gap-4 p-6 pt-8">
          {/* portrait */}
          <div className="shrink-0 w-20 h-20 rounded-2xl flex items-center justify-center text-5xl border-2 border-amber-400/60 qf-bob"
            style={{ background: 'radial-gradient(circle at 40% 30%, #475569, #1e293b)' }}>
            {line.portrait}
          </div>

          <div className="flex-1 min-h-[112px]">
            <div className="inline-block px-3 py-0.5 mb-2 rounded-full text-xs font-black tracking-wide text-slate-900"
              style={{ background: '#fbbf24' }}>
              {line.speaker}
            </div>
            <p className="text-white text-lg leading-relaxed font-medium">
              {shown}
              {typing && <span className="inline-block w-2 ml-0.5" style={{ animation: 'qf-type-caret 0.8s steps(1) infinite' }}>▍</span>}
            </p>
          </div>
        </div>

        {/* footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-white/10 bg-black/20">
          <div className="flex gap-1.5">
            {lines.map((_, i) => (
              <div key={i} className="w-2 h-2 rounded-full transition-colors"
                style={{ background: i === idx ? '#fbbf24' : 'rgba(255,255,255,0.25)' }} />
            ))}
          </div>
          <button
            onClick={advance}
            className="px-5 py-2 rounded-xl bg-amber-400 text-slate-900 font-black text-sm hover:scale-105 active:scale-95 transition-transform"
          >
            {typing ? 'Skip ▸' : idx < lines.length - 1 ? 'Next ▸' : 'Got it!'}
          </button>
        </div>
      </div>
    </div>
  );
}
