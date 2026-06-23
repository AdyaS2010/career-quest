import { Settings, Sun, Moon, Eye, Accessibility, Wind, Sunset, X, Volume2, Home, ShoppingCart, Shirt, Dumbbell } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useAudio } from '../contexts/AudioContext';

// Accessibility + appearance settings, opened from the in-game HUD.
export function SettingsModal({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
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
    { icon: <Volume2 className="w-6 h-6 text-indigo-500" />, tint: '#6366f1', title: 'Narrator Voice', sub: voiceoverEnabled ? 'Voiceover Enabled' : 'Voiceover Muted', on: voiceoverEnabled, toggle: toggleVoiceover },
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

        {/* Quick Travel / Amenities Section */}
        <div className="mt-6 pt-6 border-t border-slate-200/50 dark:border-slate-800/50">
          <h3 className="text-sm font-black uppercase tracking-wider mb-3.5 flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
            <span>🏢</span> Visit Amenities
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => { onClose(); navigate('/career/home'); }}
              className="flex items-center gap-3 p-3 rounded-2xl border border-sky-100/50 hover:border-sky-300 dark:border-sky-950 dark:hover:border-sky-800 bg-sky-500/5 hover:bg-sky-500/10 dark:bg-sky-500/5 dark:hover:bg-sky-500/15 text-left transition-all hover:scale-[1.02]"
            >
              <div className="p-2 rounded-xl bg-sky-500/20 text-sky-600 dark:text-sky-400">
                <Home className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-xs" style={{ color: 'var(--text-primary)' }}>Cozy Cottage</p>
                <p className="text-[10px] text-slate-400 font-medium">Home & Restyle</p>
              </div>
            </button>
            <button
              onClick={() => { onClose(); navigate('/career/market'); }}
              className="flex items-center gap-3 p-3 rounded-2xl border border-teal-100/50 hover:border-teal-300 dark:border-teal-950 dark:hover:border-teal-800 bg-teal-500/5 hover:bg-teal-500/10 dark:bg-teal-500/5 dark:hover:bg-teal-500/15 text-left transition-all hover:scale-[1.02]"
            >
              <div className="p-2 rounded-xl bg-teal-500/20 text-teal-600 dark:text-teal-400">
                <ShoppingCart className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-xs" style={{ color: 'var(--text-primary)' }}>Questmart</p>
                <p className="text-[10px] text-slate-400 font-medium">Energy & Snacks</p>
              </div>
            </button>
            <button
              onClick={() => { onClose(); navigate('/career/shop'); }}
              className="flex items-center gap-3 p-3 rounded-2xl border border-purple-100/50 hover:border-purple-300 dark:border-purple-950 dark:hover:border-purple-800 bg-purple-500/5 hover:bg-purple-500/10 dark:bg-purple-500/5 dark:hover:bg-purple-500/15 text-left transition-all hover:scale-[1.02]"
            >
              <div className="p-2 rounded-xl bg-purple-500/20 text-purple-600 dark:text-purple-400">
                <Shirt className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-xs" style={{ color: 'var(--text-primary)' }}>Style Studio</p>
                <p className="text-[10px] text-slate-400 font-medium">Upgrades & Looks</p>
              </div>
            </button>
            <button
              onClick={() => { onClose(); navigate('/career/gym'); }}
              className="flex items-center gap-3 p-3 rounded-2xl border border-rose-100/50 hover:border-rose-300 dark:border-rose-950 dark:hover:border-rose-800 bg-rose-500/5 hover:bg-rose-500/10 dark:bg-rose-500/5 dark:hover:bg-rose-500/15 text-left transition-all hover:scale-[1.02]"
            >
              <div className="p-2 rounded-xl bg-rose-500/20 text-rose-600 dark:text-rose-400">
                <Dumbbell className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-xs" style={{ color: 'var(--text-primary)' }}>Iron Gym</p>
                <p className="text-[10px] text-slate-400 font-medium">Train Stamina</p>
              </div>
            </button>
          </div>
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

