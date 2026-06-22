import { ArrowLeft, Volume2, VolumeX, Sun, Moon } from 'lucide-react';
import { useAudio } from '../contexts/AudioContext';
import { useTheme } from '../contexts/ThemeContext';
import { useSimulation } from '../contexts/SimulationContext';

// The floating control rail that belongs to the domain simulations only. Every
// other screen (the city, the career-world hubs, the menu pages) keeps its own
// regular top-navbar icons; this rail appears solely while a game is being
// played. It carries the three affordances the player asked for: Back (exits
// the running game), Volume (mute) and Brightness (light/dark). It floats at the
// left edge, vertically centred, clear of the game's own top bar and score.
export function ScreenControls() {
  const { active, exit } = useSimulation();
  const { muted, toggleMute } = useAudio();
  const { dimmed, toggleDim } = useTheme();

  if (!active) return null;

  const btn = 'w-11 h-11 rounded-full flex items-center justify-center text-slate-100 border border-white/15 transition-all hover:scale-110 hover:text-white active:scale-95 pointer-events-auto';
  const bg: React.CSSProperties = { background: 'rgba(10,18,40,0.78)', backdropFilter: 'blur(8px)', boxShadow: '0 4px 14px rgba(0,0,0,0.4)' };

  return (
    <div id="tutorial-screen-controls" className="fixed left-2 sm:left-3 top-1/2 -translate-y-1/2 z-[90] flex flex-col gap-2.5 pointer-events-none">
      <button onClick={exit} title="Back" aria-label="Back" className={btn} style={bg}>
        <ArrowLeft className="w-5 h-5" />
      </button>
      <button onClick={toggleMute} title={muted ? 'Unmute' : 'Mute'} aria-label={muted ? 'Unmute' : 'Mute'} className={btn} style={bg}>
        {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
      </button>
      <button onClick={toggleDim} title={dimmed ? 'Brighten screen' : 'Dim screen'} aria-label="Toggle brightness" className={btn} style={bg}>
        {dimmed ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </button>
    </div>
  );
}
