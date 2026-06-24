import { Settings, Sun, Moon, Eye, Accessibility, Wind, Sunset, X, Volume2 } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useAudio } from '../contexts/AudioContext';

// Accessibility + appearance settings, opened from the in-game HUD.
export function SettingsModal({ onClose }: { onClose: () => void }) {
  const {
    theme, toggleTheme,
    dimmed, toggleDim,
    highContrast, toggleHighContrast,
    dyslexicFriendly, toggleDyslexicFriendly,
    reducedMotion, toggleReducedMotion,
  } = useTheme();

  const { voiceoverEnabled, toggleVoiceover } = useAudio();

  const rows: { icon: React.ReactNode; tint: string; title: string; sub: string; on: boolean; toggle: () => void }[] = [
    { icon: theme === 'light' ? <Sun className="w-6 h-6 text-amber-600" /> : <Moon className="w-6 h-6 text-amber-400" />, tint: '#fbbf24', title: 'Appearance', sub: theme === 'light' ? 'Light Mode' : 'Dark Mode', on: theme === 'dark', toggle: toggleTheme },
    { icon: <Sunset className="w-6 h-6 text-indigo-400" />, tint: '#818cf8', title: 'Dim Screen', sub: 'Soften the brightness', on: dimmed, toggle: toggleDim },
    { icon: <Eye className="w-6 h-6 text-purple-500" />, tint: '#8b5cf6', title: 'High Contrast', sub: 'Maximum legibility', on: highContrast, toggle: toggleHighContrast },
    { icon: <Accessibility className="w-6 h-6 text-emerald-500" />, tint: '#10b981', title: 'Inclusive Font', sub: dyslexicFriendly ? 'Classic Outfit typeface' : 'Default Questford typeface', on: dyslexicFriendly, toggle: toggleDyslexicFriendly },
    { icon: <Wind className="w-6 h-6 text-blue-500" />, tint: '#3b82f6', title: 'Reduced Motion', sub: 'Minimize animations', on: reducedMotion, toggle: toggleReducedMotion },
    { icon: <Volume2 className="w-6 h-6 text-indigo-500" />, tint: '#6366f1', title: 'Text-to-Speech (TTS)', sub: voiceoverEnabled ? 'TTS Voiceover Active' : 'TTS Voiceover Muted', on: voiceoverEnabled, toggle: toggleVoiceover },
  ];

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-[2rem] border-4 p-7 shadow-2xl max-h-[90vh] overflow-y-auto scrollbar-thin"
        style={{ backgroundColor: 'var(--surface-card)', borderColor: 'rgba(251, 191, 36, 0.5)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-black flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
            <Settings className="w-7 h-7 text-amber-500" /> Settings
          </h2>
          <button onClick={onClose} aria-label="Close settings" className="p-2 rounded-full hover:bg-black/10 transition-colors">
            <X className="w-6 h-6" style={{ color: 'var(--text-secondary)' }} />
          </button>
        </div>

        <div className="space-y-4">
          {rows.map(r => (
            <div key={r.title} className="flex items-center justify-between p-4 rounded-2xl" style={{ background: 'var(--surface-muted, rgba(148,163,184,0.12))' }}>
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl" style={{ background: `${r.tint}22` }}>{r.icon}</div>
                <div>
                  <p className="font-bold" style={{ color: 'var(--text-primary)' }}>{r.title}</p>
                  <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{r.sub}</p>
                </div>
              </div>
              <button
                onClick={r.toggle}
                role="switch"
                aria-checked={r.on}
                aria-label={r.title}
                className="w-14 h-8 rounded-full relative transition-colors shrink-0"
                style={{ backgroundColor: r.on ? r.tint : '#cbd5e1' }}
              >
                <div className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-all ${r.on ? 'left-7' : 'left-1'}`} />
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={onClose}
          className="w-full mt-7 py-3.5 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-lg shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
        >
          Done
        </button>
      </div>
    </div>,
    document.body
  );
}

