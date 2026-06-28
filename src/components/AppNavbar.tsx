import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Coins, Volume2, VolumeX, User, Trophy, Map as MapIcon, LogOut, Compass, Settings, Flame } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useAudio } from '../contexts/AudioContext';
import type { ColorScheme } from '../lib/database.types';
import { SettingsModal } from './SettingsModal';
import { CareerQuiz } from './CareerQuiz';
import { MapPreview, type PreviewDoor } from './MapPreview';
import { loadQuiz, saveQuiz, type QuizResult } from '../pages/city/quiz';
import { loadWallet } from '../lib/wallet';

type Status = 'mastered' | 'in_progress' | 'not_started';

// The single source-of-truth HUD navbar  -  identical look + icons on every
// menu/utility page (map, profile, leaderboard, how-to, about, feedback). It
// loads its own streak/level/XP/coins and powers the Career Compass, the Quest
// map quick-pick overlay and the Settings panel, so any page gets the full city
// HUD for free.
export function AppNavbar() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { muted, toggleMute } = useAudio();

  const [profile, setProfile] = useState<{ current_streak?: number; total_score?: number } | null>(null);
  const [coins, setCoins] = useState(0);
  const [skills, setSkills] = useState<Record<string, { xp: number; status: Status }>>({});
  const [doors, setDoors] = useState<PreviewDoor[]>([]);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);

  const [quizOpen, setQuizOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    if (!user) return;
    let alive = true;
    setCoins(loadWallet(user.id).coins);
    setQuizResult(loadQuiz(user.id));
    (async () => {
      try {
        const [pRes, cRes, chRes, prRes] = await Promise.all([
          supabase.from('profiles').select('current_streak, total_score').eq('id', user.id).maybeSingle(),
          supabase.from('careers').select('id, slug, name, color_scheme, icon').eq('is_active', true).order('order_index'),
          (supabase.from('challenges') as any).select('id, career_id, max_score'),
          (supabase.from('user_challenge_progress') as any).select('challenge_id, best_score').eq('user_id', user.id),
        ]);
        if (!alive) return;
        if (pRes.data) setProfile(pRes.data as any);
        const rows = (cRes.data || []) as { id: string; slug: string; name: string; color_scheme: ColorScheme; icon: string }[];
        const ch = (chRes.data || []) as { id: string; career_id: string; max_score?: number }[];
        const cp = (prRes.data || []) as { challenge_id: string; best_score: number }[];
        const toCareer: Record<string, string> = {}; const maxP: Record<string, number> = {};
        ch.forEach(c => { toCareer[c.id] = c.career_id; maxP[c.career_id] = (maxP[c.career_id] || 0) + (c.max_score || 100); });
        const xp: Record<string, number> = {}; const started: Record<string, number> = {};
        cp.forEach(p => { const cid = toCareer[p.challenge_id]; if (cid) { xp[cid] = (xp[cid] || 0) + p.best_score; started[cid] = (started[cid] || 0) + 1; } });
        const sk: Record<string, { xp: number; status: Status }> = {};
        rows.forEach(c => { const e = xp[c.id] || 0, mx = maxP[c.id] || 1, st = started[c.id] || 0; let status: Status; if ((c.slug === 'financial-services' && e >= 270) || e >= 0.8 * mx) status = 'mastered'; else if (st > 0) status = 'in_progress'; else status = 'not_started'; sk[c.slug] = { xp: e, status }; });
        setSkills(sk);
        setDoors(rows.map(c => ({ slug: c.slug, name: c.name, color: c.color_scheme as ColorScheme, icon: c.icon, mastered: sk[c.slug]?.status === 'mastered' })));
      } catch (e) { console.error('AppNavbar HUD load', e); }
    })();
    return () => { alive = false; };
  }, [user]);

  const level = Math.floor((profile?.total_score ?? 0) / 100) + 1;

  return (
    <>
      <header className="sticky top-0 inset-x-0 z-50 flex items-center justify-between gap-2 px-3 sm:px-5 py-3 print:hidden">
        <button id="tutorial-hud-progress" onClick={() => navigate('/')} className="flex items-center gap-2 px-2.5 sm:px-3 py-2 rounded-2xl transition-transform hover:scale-[1.02]" style={{ background: 'rgba(10,18,40,0.7)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)' }} title="Back to city">
          <span className="text-xl">🏙️</span>
          <div className="hidden md:block text-left"><h1 className="font-fantasy text-white text-lg leading-none">Questford</h1><p className="text-[10px] tracking-[0.2em] text-blue-200/70 font-bold uppercase">FIND YOUR PLACE</p></div>
          <div className="flex items-center gap-1 ml-0.5 sm:ml-1">
            <Chip icon={<Flame className="w-4 h-4 text-orange-400" />} label={`${profile?.current_streak ?? 0}`} title="Daily streak" />
            <Chip icon={<Trophy className="w-4 h-4 text-yellow-300" />} label={`Lv${level}`} title="Level" />
            <span className="hidden min-[420px]:flex"><Chip icon={<Star className="w-4 h-4 text-amber-300" />} label={`${profile?.total_score ?? 0}`} title="Total XP" /></span>
            <Chip icon={<Coins className="w-4 h-4 text-amber-300" />} label={`${coins}`} title="Coins" />
          </div>
        </button>
        <div id="tutorial-hud-actions" className="flex items-center gap-1 sm:gap-1.5">
          <Btn onClick={() => setShowMap(true)} title="Quest map" a="#34d399"><MapIcon className="w-5 h-5" /></Btn>
          <Btn onClick={() => setQuizOpen(true)} title="Career Compass" a="#34d399"><Compass className="w-5 h-5" /></Btn>
          <Btn onClick={() => navigate('/leaderboard')} title="Leaderboard" a="#fbbf24"><Trophy className="w-5 h-5" /></Btn>
          <Btn onClick={() => navigate('/profile')} title="Profile" a="#60a5fa"><User className="w-5 h-5" /></Btn>
          <Btn onClick={toggleMute} title={muted ? 'Unmute' : 'Mute'} a="#a78bfa">{muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}</Btn>
          <Btn onClick={() => setShowSettings(true)} title="Settings" a="#fbbf24"><Settings className="w-5 h-5" /></Btn>
          <Btn onClick={signOut} title="Sign out" a="#f87171"><LogOut className="w-5 h-5" /></Btn>
        </div>
      </header>

      {quizOpen && <CareerQuiz existing={quizResult} skills={skills} firstTime={false} onResult={r => { setQuizResult(r); if (user) saveQuiz(user.id, r); }} onClose={() => setQuizOpen(false)} onStartHere={(slug) => { setQuizOpen(false); navigate(`/career/${slug}`); }} />}
      {showMap && <MapPreview doors={doors} skills={skills} recommended={quizResult?.top} onPick={(slug) => { setShowMap(false); navigate(`/career/${slug}`); }} onFullMap={() => { setShowMap(false); navigate('/map'); }} onCity={() => { setShowMap(false); navigate('/'); }} onClose={() => setShowMap(false)} />}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </>
  );
}

function Btn({ onClick, title, a, children }: { onClick: () => void; title: string; a?: string; children: React.ReactNode }) {
  return <button onClick={onClick} title={title} aria-label={title} className="p-2 sm:p-2.5 rounded-xl text-slate-200 hover:text-white border border-white/12 transition-all" style={{ background: 'rgba(10,18,40,0.7)', backdropFilter: 'blur(8px)' }} onMouseEnter={e => { if (a) e.currentTarget.style.background = `${a}44`; }} onMouseLeave={e => { e.currentTarget.style.background = 'rgba(10,18,40,0.7)'; }}>{children}</button>;
}
function Chip({ icon, label, title }: { icon: React.ReactNode; label: string; title?: string }) {
  return <div title={title} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/10 text-white text-xs font-black"><span aria-hidden>{icon}</span><span className="tabular-nums">{label}</span></div>;
}
