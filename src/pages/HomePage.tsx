import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Map, Trophy, User, LogOut, ZoomIn, ZoomOut, Maximize2, Volume2, VolumeX, Moon, Sun, Sparkles, Flame, Settings, Eye, Accessibility } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useAudio } from '../contexts/AudioContext';
import { useTheme } from '../contexts/ThemeContext';
import { useGuide } from '../context/GuideContext';
import type { Career, Profile, UserCareerProgress, Database } from '../lib/database.types';



export function HomePage() {
  const [careers, setCareers] = useState<Career[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [careerXP, setCareerXP] = useState<Record<string, number>>({});
  const [careerStatus, setCareerStatus] = useState<Record<string, 'mastered' | 'in_progress' | 'not_started'>>({});
  const [loading, setLoading] = useState(true);
  const { showGuide } = useGuide();
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const mapRef = useRef<HTMLDivElement>(null);
  const { user, signOut } = useAuth();
  const { muted, toggleMute, startBgm, bgmPlaying } = useAudio();
  const {
    theme, toggleTheme,
    highContrast, toggleHighContrast,
    dyslexicFriendly, toggleDyslexicFriendly,
    reducedMotion, toggleReducedMotion
  } = useTheme();
  const [showSettings, setShowSettings] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, [user]);

  // Auto-start background music on first visit
  useEffect(() => {
    if (!bgmPlaying && !muted) {
      const handler = () => { startBgm(); document.removeEventListener('click', handler); };
      document.addEventListener('click', handler, { once: true });
      return () => document.removeEventListener('click', handler);
    }
  }, [bgmPlaying, muted, startBgm]);

  const loadData = async () => {
    if (!user) return;

    try {
      const [careersRes, profileRes, progressRes, challengesRes, challengeProgressRes] = await Promise.all([
        supabase.from('careers').select('*').eq('is_active', true).order('order_index'),
        supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
        supabase.from('user_career_progress').select('*').eq('user_id', user.id),
        (supabase.from('challenges') as any).select('id, career_id'),
        (supabase.from('user_challenge_progress') as any).select('challenge_id, best_score').eq('user_id', user.id),
      ]);

      if (careersRes.data) setCareers(careersRes.data);
      if (profileRes.data) {
        let profileUpdates: Partial<Profile> | null = null;
        const pData = profileRes.data as unknown as Profile;
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        let diffDays = -1;
        if (pData.last_login_date) {
          const lastLogin = new Date(pData.last_login_date);
          const lastLoginDay = new Date(lastLogin.getFullYear(), lastLogin.getMonth(), lastLogin.getDate());
          diffDays = Math.floor((today.getTime() - lastLoginDay.getTime()) / (1000 * 60 * 60 * 24));
        }

        if (diffDays !== 0) {
          // First time login ever or missed a day or next day
          const isNextDay = diffDays === 1;
          const newStreak = isNextDay ? (pData.current_streak || 0) + 1 : 1;
          const longest = Math.max(newStreak, pData.longest_streak || 0);

          profileUpdates = {
            current_streak: newStreak,
            longest_streak: longest,
            last_login_date: new Date().toISOString(),
            total_score: (pData.total_score || 0) + 50
          };

          // @ts-ignore
          await supabase.from('profiles').update(profileUpdates as Database['public']['Tables']['profiles']['Update']).eq('id', user.id);
          const mergedProfile = { ...pData, ...profileUpdates } as Profile;
          setProfile(mergedProfile);

          if (diffDays === -1) {
            showGuide("Welcome to Career Quest! I've started your daily streak with a 50 point bonus! 🔥", 'happy');
          } else if (isNextDay) {
            showGuide(`You're on fire! 🔥 Day ${newStreak} of your streak! Here's a 50 point daily bonus!`, 'happy');
          } else {
            showGuide(`Welcome back! You lost your streak, but let's start a new one! Here's 50 points to ignite the spark! 🔥`, 'happy');
          }
        } else {
          setProfile(pData);
          updateGuideMessage(pData, progressRes.data || []);
        }
      }



      // Compute per-career XP and status from challenge best_scores (source of truth)
      const challenges = (challengesRes.data || []) as { id: string; career_id: string; max_score?: number }[];
      const challengeProgress = (challengeProgressRes.data || []) as { challenge_id: string; best_score: number }[];

      // Build lookups
      const challengeToCareer: Record<string, string> = {};
      challenges.forEach(c => { challengeToCareer[c.id] = c.career_id; });

      // Count challenges per career and sum best_scores per career
      const chalCountPerCareer: Record<string, number> = {};
      const maxScorePerCareer: Record<string, number> = {};
      challenges.forEach(c => {
        chalCountPerCareer[c.career_id] = (chalCountPerCareer[c.career_id] || 0) + 1;
        maxScorePerCareer[c.career_id] = (maxScorePerCareer[c.career_id] || 0) + (c.max_score || 100);
      });

      const xpMap: Record<string, number> = {};
      const startedPerCareer: Record<string, number> = {};
      challengeProgress.forEach(cp => {
        const careerId = challengeToCareer[cp.challenge_id];
        if (careerId) {
          xpMap[careerId] = (xpMap[careerId] || 0) + cp.best_score;
          startedPerCareer[careerId] = (startedPerCareer[careerId] || 0) + 1;
        }
      });
      setCareerXP(xpMap);

      // Compute career status: mastered (>80% + all attempted), in_progress, not_started
      const statusMap: Record<string, 'mastered' | 'in_progress' | 'not_started'> = {};
      (careersRes.data || []).forEach((career: Career) => {
        const started = startedPerCareer[career.id] || 0;
        const earned = xpMap[career.id] || 0;
        const maxPossible = maxScorePerCareer[career.id] || 1;

        if (career.slug === 'financial-services' && earned >= 270) {
          statusMap[career.id] = 'mastered';
        } else if (earned >= 0.8 * maxPossible) {
          statusMap[career.id] = 'mastered';
        } else if (started > 0) {
          statusMap[career.id] = 'in_progress';
        } else {
          statusMap[career.id] = 'not_started';
        }
      });
      setCareerStatus(statusMap);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateGuideMessage = (_prof: Profile, progress: UserCareerProgress[]) => {
    const completedCount = progress.filter(p => p.status === 'completed').length;
    let message = '';

    if (completedCount === 0) {
      message = "Welcome to the Career Kingdom! Choose any realm to begin your quest.";
    } else if (completedCount === 1) {
      message = "Excellent work! The map is revealing more territories. Ready for the next realm?";
    } else if (completedCount === 2) {
      message = "Magnificent! Two realms explored. Your wisdom grows!";
    } else if (completedCount >= 5) {
      message = "🎉 LEGENDARY! You've mastered all Career Kingdoms! You are a true Champion!";
    }

    if (message) {
      showGuide(message, 'happy');
    }
  };

  const handleCareerClick = (careerSlug: string) => {
    navigate(`/career/${careerSlug}`);
  };

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.2, 2));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.5));
  const handleResetView = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button:not(.map-control)')) return;
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY * -0.001;
    setScale(prev => Math.min(Math.max(prev + delta, 0.5), 2));
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => setIsDragging(false);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);


  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: 'var(--bg-primary)' }}
      >
        <div className="text-center">
          <div className="w-20 h-20 mb-4 animate-spin" style={{ color: 'var(--accent-secondary)' }}>✨</div>
          <p className="text-xl font-fantasy" style={{ color: 'var(--text-secondary)' }}>Entering the Kingdom...</p>
        </div>
      </div>
    );
  }

  // Theme-specific styles
  const isDark = theme === 'dark';

  return (
    <div
      className="min-h-screen relative overflow-hidden font-body flex flex-col"
      style={{
        backgroundColor: isDark ? '#0f172a' : '#f0f9ff',
        color: isDark ? '#f1f5f9' : '#0f172a'
      }}
    >

      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        {isDark ? (
          /* Dark Mode: Deep Space/Fantasy */
          <>
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900 via-slate-900 to-black" />
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[100px] animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[100px] animate-pulse delay-1000" />
            <div className="absolute inset-0 opacity-[0.15]"
              style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
          </>
        ) : (
          /* Light Mode: Sky Blue with Clouds */
          <>
            <div className="absolute inset-0 bg-gradient-to-b from-sky-200 via-sky-100 to-blue-50" />
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/60 rounded-full blur-[80px]" />
            <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-white/50 rounded-full blur-[60px]" />
            <div className="absolute top-1/3 right-1/3 w-64 h-64 bg-sky-100/80 rounded-full blur-[50px]" />
          </>
        )}
      </div>

      {/* Navigation Bar */}
      <nav
        className="relative z-50 backdrop-blur-md border-b shadow-2xl"
        role="navigation"
        aria-label="Main navigation"
        style={{
          backgroundColor: isDark ? 'rgba(15, 23, 42, 0.6)' : 'rgba(255, 255, 255, 0.8)',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
        }}
      >
        <div
          className="mx-auto w-full"
          style={{ padding: '0 clamp(1.25rem, 3vw, 3rem)' }}
        >
          <div
            className="flex justify-between items-center"
            style={{ height: 'clamp(3.5rem, 6vw, 6rem)' }}
          >

            {/* Logo/Brand */}
            <div
              className="flex items-center group cursor-pointer flex-shrink-0"
              style={{ gap: 'clamp(0.5rem, 1.5vw, 1rem)' }}
              onClick={() => navigate('/')}
            >
              <div className="relative flex-shrink-0">
                <div className="absolute inset-0 bg-gradient-to-tr from-purple-500 to-blue-500 rounded-lg blur opacity-75 group-hover:opacity-100 transition-opacity" />
                <div
                  className="relative rounded-lg flex items-center justify-center border"
                  style={{
                    width: 'clamp(2rem, 3.5vw, 3.5rem)',
                    height: 'clamp(2rem, 3.5vw, 3.5rem)',
                    backgroundColor: isDark ? '#0f172a' : '#ffffff',
                    borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'
                  }}
                >
                  <Map
                    className="group-hover:scale-110 transition-transform"
                    style={{
                      width: 'clamp(1.25rem, 2vw, 2rem)',
                      height: 'clamp(1.25rem, 2vw, 2rem)',
                      color: 'var(--accent-secondary)'
                    }}
                  />
                </div>
              </div>
              <div className="hidden sm:block flex-shrink min-w-0">
                <h1
                  className="font-fantasy truncate"
                  style={{
                    fontSize: 'clamp(1.1rem, 2.2vw, 1.875rem)',
                    color: isDark ? '#c4b5fd' : '#4c1d95',
                    letterSpacing: '0.08em',
                    fontWeight: 900,
                    textShadow: isDark ? '2px 2px 4px rgba(0,0,0,0.3)' : '1px 1px 2px rgba(0,0,0,0.1)'
                  }}
                >
                  Career Kingdom
                </h1>
                <p
                  className="tracking-widest font-medium truncate"
                  style={{
                    color: 'var(--text-muted)',
                    fontSize: 'clamp(0.55rem, 0.9vw, 0.875rem)'
                  }}
                >
                  EXPLORE • DISCOVER • MASTER
                </p>
              </div>
            </div>

            {/* Nav Actions */}
            <div
              className="flex items-center flex-shrink-0"
              style={{ gap: 'clamp(0.25rem, 1vw, 1rem)' }}
            >
              {/* Leaderboard Button */}
              <button onClick={() => navigate('/leaderboard')}
                className="hidden md:flex items-center rounded-xl transition-all hover:scale-105 group flex-shrink-0"
                aria-label="View Leaderboard"
                style={{
                  gap: 'clamp(0.4rem, 0.8vw, 0.75rem)',
                  padding: 'clamp(0.35rem, 0.7vw, 0.75rem) clamp(0.6rem, 1.2vw, 1.5rem)',
                  background: isDark
                    ? 'linear-gradient(to bottom right, rgba(217, 119, 6, 0.2), rgba(120, 53, 15, 0.2))'
                    : 'linear-gradient(to bottom right, rgba(251, 191, 36, 0.3), rgba(245, 158, 11, 0.2))',
                  border: `1px solid ${isDark ? 'rgba(245, 158, 11, 0.3)' : 'rgba(217, 119, 6, 0.4)'}`,
                  boxShadow: isDark ? '0 0 15px rgba(245,158,11,0.1)' : '0 4px 12px rgba(245,158,11,0.15)'
                }}
              >
                <div
                  className="rounded-lg transition-colors flex-shrink-0"
                  style={{
                    padding: 'clamp(0.3rem, 0.5vw, 0.5rem)',
                    backgroundColor: isDark ? 'rgba(245, 158, 11, 0.2)' : 'rgba(245, 158, 11, 0.3)'
                  }}
                >
                  <Trophy
                    style={{
                      width: 'clamp(0.9rem, 1.3vw, 1.25rem)',
                      height: 'clamp(0.9rem, 1.3vw, 1.25rem)',
                      color: isDark ? '#fbbf24' : '#d97706'
                    }}
                  />
                </div>
                <div className="text-left hidden lg:block">
                  <div
                    className="uppercase tracking-widest font-bold"
                    style={{
                      fontSize: 'clamp(0.5rem, 0.65vw, 0.625rem)',
                      color: isDark ? 'rgba(253, 230, 138, 0.6)' : '#92400e'
                    }}
                  >Ranking</div>
                  <div
                    className="font-bold"
                    style={{
                      fontSize: 'clamp(0.7rem, 0.9vw, 0.875rem)',
                      color: isDark ? '#fef3c7' : '#78350f'
                    }}
                  >Top 10</div>
                </div>
              </button>

              {/* Profile Stats */}
              <div
                className="hidden md:flex items-center rounded-xl border backdrop-blur-sm flex-shrink-0"
                role="status"
                aria-label={`Score: ${profile?.total_score || 0}, Level: ${Math.floor((profile?.total_score || 0) / 100) + 1}`}
                style={{
                  padding: 'clamp(0.15rem, 0.35vw, 0.375rem)',
                  backgroundColor: isDark ? 'rgba(30, 41, 59, 0.5)' : 'rgba(255, 255, 255, 0.7)',
                  borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
                }}
              >
                <div
                  className="border-r flex flex-col items-center"
                  style={{
                    padding: 'clamp(0.25rem, 0.5vw, 0.5rem) clamp(0.5rem, 1.2vw, 1.25rem)',
                    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
                  }}
                >
                  <span
                    className="uppercase tracking-wider font-bold"
                    style={{ fontSize: 'clamp(0.5rem, 0.65vw, 0.625rem)', color: '#ef4444' }}
                  >Streak</span>
                  <span
                    className="font-bold font-fantasy flex items-center gap-1"
                    style={{ fontSize: 'clamp(0.9rem, 1.3vw, 1.25rem)', color: 'var(--text-primary)' }}
                  >
                    <Flame className="text-orange-500" style={{ width: 'clamp(0.9rem, 1vw, 1.1rem)', height: 'clamp(0.9rem, 1vw, 1.1rem)' }} />
                    {profile?.current_streak || 0}
                  </span>
                </div>
                <div
                  className="border-r flex flex-col items-center"
                  style={{
                    padding: 'clamp(0.25rem, 0.5vw, 0.5rem) clamp(0.5rem, 1.2vw, 1.25rem)',
                    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
                  }}
                >
                  <span
                    className="uppercase tracking-wider font-bold"
                    style={{ fontSize: 'clamp(0.5rem, 0.65vw, 0.625rem)', color: 'var(--accent-secondary)' }}
                  >Score</span>
                  <span
                    className="font-bold font-fantasy"
                    style={{ fontSize: 'clamp(0.9rem, 1.3vw, 1.25rem)', color: 'var(--text-primary)' }}
                  >{profile?.total_score || 0}</span>
                </div>
                <div
                  className="flex flex-col items-center"
                  style={{ padding: 'clamp(0.25rem, 0.5vw, 0.5rem) clamp(0.5rem, 1.2vw, 1.25rem)' }}
                >
                  <span
                    className="uppercase tracking-wider font-bold"
                    style={{ fontSize: 'clamp(0.5rem, 0.65vw, 0.625rem)', color: 'var(--accent-primary)' }}
                  >Level</span>
                  <span
                    className="font-bold font-fantasy"
                    style={{ fontSize: 'clamp(0.9rem, 1.3vw, 1.25rem)', color: 'var(--text-primary)' }}
                  >{Math.floor((profile?.total_score || 0) / 100) + 1}</span>
                </div>
              </div>

              {/* Icon Buttons */}
              {[
                { onClick: () => navigate('/profile'), title: 'View Profile', ariaLabel: 'View Profile', icon: <User style={{ width: 'clamp(1rem, 1.5vw, 1.5rem)', height: 'clamp(1rem, 1.5vw, 1.5rem)', color: 'var(--text-secondary)' }} className="transition-colors" /> },
                {
                  onClick: toggleMute, title: muted ? 'Unmute' : 'Mute', ariaLabel: muted ? 'Unmute audio' : 'Mute audio', icon: muted
                    ? <VolumeX style={{ width: 'clamp(1rem, 1.5vw, 1.5rem)', height: 'clamp(1rem, 1.5vw, 1.5rem)', color: 'var(--text-secondary)' }} className="transition-colors" />
                    : <Volume2 style={{ width: 'clamp(1rem, 1.5vw, 1.5rem)', height: 'clamp(1rem, 1.5vw, 1.5rem)', color: 'var(--text-secondary)' }} className="transition-colors" />
                },
                {
                  onClick: toggleTheme, title: theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode', ariaLabel: theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode', icon: theme === 'light'
                    ? <Moon style={{ width: 'clamp(1rem, 1.5vw, 1.5rem)', height: 'clamp(1rem, 1.5vw, 1.5rem)', color: 'var(--text-secondary)' }} className="transition-colors" />
                    : <Sun style={{ width: 'clamp(1rem, 1.5vw, 1.5rem)', height: 'clamp(1rem, 1.5vw, 1.5rem)', color: 'var(--text-secondary)' }} className="transition-colors" />
                },
                { onClick: () => setShowSettings(true), title: 'Kingdom Settings', ariaLabel: 'Accessibility and Theme Settings', icon: <Settings style={{ width: 'clamp(1rem, 1.5vw, 1.5rem)', height: 'clamp(1rem, 1.5vw, 1.5rem)', color: 'var(--text-secondary)' }} className="transition-colors" /> },
                { onClick: signOut, title: 'Sign Out', ariaLabel: 'Sign Out', icon: <LogOut style={{ width: 'clamp(1rem, 1.5vw, 1.5rem)', height: 'clamp(1rem, 1.5vw, 1.5rem)', color: 'var(--text-secondary)' }} className="transition-colors" /> },
              ].map((btn, i) => (
                <button
                  key={i}
                  onClick={btn.onClick}
                  className="rounded-xl border transition-colors group focus:outline-none focus:ring-2 focus:ring-purple-500 flex-shrink-0"
                  style={{
                    padding: 'clamp(0.4rem, 0.8vw, 0.75rem)',
                    backgroundColor: isDark ? '#1e293b' : '#ffffff',
                    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
                  }}
                  title={btn.title}
                  aria-label={btn.ariaLabel}
                >
                  {btn.icon}
                </button>
              ))}
            </div>
          </div>
        </div>
      </nav>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div
            className="w-full max-w-md rounded-[2.5rem] border-4 p-8 shadow-2xl transform transition-all"
            style={{
              backgroundColor: 'var(--surface-card)',
              borderColor: isDark ? 'rgba(251, 191, 36, 0.5)' : '#fbbf24'
            }}
          >
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-black flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
                <Settings className="w-8 h-8 text-amber-500" />
                Settings
              </h2>
              <button
                onClick={() => setShowSettings(false)}
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <LucideIcons.X className="w-6 h-6" style={{ color: 'var(--text-secondary)' }} />
              </button>
            </div>

            <div className="space-y-6">
              {/* Theme Toggle */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-transparent hover:border-amber-500/30 transition-all">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-amber-100 dark:bg-amber-900/30">
                    {theme === 'light' ? <Sun className="w-6 h-6 text-amber-600" /> : <Moon className="w-6 h-6 text-amber-400" />}
                  </div>
                  <div>
                    <p className="font-bold" style={{ color: 'var(--text-primary)' }}>Appearance</p>
                    <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{theme === 'light' ? 'Light Mode' : 'Dark Mode'}</p>
                  </div>
                </div>
                <button
                  onClick={toggleTheme}
                  className="w-14 h-8 rounded-full relative transition-colors"
                  style={{ backgroundColor: theme === 'dark' ? '#fbbf24' : '#cbd5e1' }}
                >
                  <div className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-all ${theme === 'dark' ? 'left-7' : 'left-1'}`} />
                </button>
              </div>

              {/* High Contrast */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-transparent hover:border-amber-500/30 transition-all">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-900/30">
                    <Eye className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-bold" style={{ color: 'var(--text-primary)' }}>High Contrast</p>
                    <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Maximum legibility</p>
                  </div>
                </div>
                <button
                  onClick={toggleHighContrast}
                  className="w-14 h-8 rounded-full relative transition-colors"
                  style={{ backgroundColor: highContrast ? '#8b5cf6' : '#cbd5e1' }}
                >
                  <div className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-all ${highContrast ? 'left-7' : 'left-1'}`} />
                </button>
              </div>

              {/* Dyslexic Friendly */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-transparent hover:border-amber-500/30 transition-all">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
                    <Accessibility className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-bold" style={{ color: 'var(--text-primary)' }}>Inclusive Font</p>
                    <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Easy-to-read typeface</p>
                  </div>
                </div>
                <button
                  onClick={toggleDyslexicFriendly}
                  className="w-14 h-8 rounded-full relative transition-colors"
                  style={{ backgroundColor: dyslexicFriendly ? '#10b981' : '#cbd5e1' }}
                >
                  <div className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-all ${dyslexicFriendly ? 'left-7' : 'left-1'}`} />
                </button>
              </div>

              {/* Reduced Motion */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-transparent hover:border-amber-500/30 transition-all">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30">
                    <LucideIcons.Wind className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-bold" style={{ color: 'var(--text-primary)' }}>Reduced Motion</p>
                    <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Minimize animations</p>
                  </div>
                </div>
                <button
                  onClick={toggleReducedMotion}
                  className="w-14 h-8 rounded-full relative transition-colors"
                  style={{ backgroundColor: reducedMotion ? '#3b82f6' : '#cbd5e1' }}
                >
                  <div className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-all ${reducedMotion ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
            </div>

            <button
              onClick={() => setShowSettings(false)}
              className="w-full mt-10 py-4 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
            >
              Save Kingdom Settings
            </button>
          </div>
        </div>
      )}

      {/* Main Content / Map Area */}
      <main className="relative z-10 flex-1 p-8 overflow-hidden">
        <div className="max-w-[95%] mx-auto w-full h-full">
          {/* Map Container - Theme Aware */}
          <div
            className="relative w-full h-full rounded-2xl overflow-hidden backdrop-blur-xl transition-colors duration-300"
            style={{
              background: isDark
                ? 'linear-gradient(to bottom right, rgba(15, 23, 42, 0.95), rgba(30, 27, 75, 0.9), rgba(15, 23, 42, 0.95))'
                : 'linear-gradient(to bottom right, rgba(255, 255, 255, 0.7), rgba(240, 249, 255, 0.8), rgba(255, 255, 255, 0.7))',
              border: isDark ? '1px solid rgba(139, 92, 246, 0.2)' : '1px solid rgba(59, 130, 246, 0.2)',
              boxShadow: isDark ? '0 0 60px rgba(139, 92, 246, 0.15)' : '0 10px 40px rgba(59, 130, 246, 0.1)'
            }}
          >

            {/* Subtle Background Pattern */}
            <div
              className="absolute inset-0 transition-opacity duration-300"
              style={{
                backgroundImage: isDark ? 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.03) 1px, transparent 1px)' : 'radial-gradient(circle at 2px 2px, rgba(59,130,246,0.1) 1px, transparent 1px)',
                backgroundSize: '40px 40px'
              }}
            />

            {/* Corner Accents */}
            <div
              className="absolute top-0 left-0 w-24 h-24 border-l-2 border-t-2 rounded-tl-2xl"
              style={{ borderColor: 'rgba(167, 139, 250, 0.3)' }}
            />
            <div
              className="absolute bottom-0 right-0 w-24 h-24 border-r-2 border-b-2 rounded-br-2xl"
              style={{ borderColor: 'rgba(96, 165, 250, 0.3)' }}
            />

            {/* Map Controls */}
            <div
              className="absolute top-5 right-5 z-50 flex flex-col gap-1.5 px-2 py-3 rounded-xl border shadow-lg backdrop-blur-sm"
              style={{
                backgroundColor: 'rgba(2, 6, 23, 0.9)',
                borderColor: 'rgba(255,255,255,0.1)'
              }}
            >
              <button onClick={handleZoomIn}
                className="map-control p-2 rounded-lg transition-all hover:bg-white/10"
                style={{ color: 'var(--text-secondary)' }}
                aria-label="Zoom in"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button onClick={handleZoomOut}
                className="map-control p-2 rounded-lg transition-all hover:bg-white/10"
                style={{ color: 'var(--text-secondary)' }}
                aria-label="Zoom out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <div style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }} className="h-px my-0.5" />
              <button onClick={handleResetView}
                className="map-control p-2 rounded-lg transition-all hover:bg-white/10"
                style={{ color: 'var(--text-secondary)' }}
                aria-label="Reset map view"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>

            {/* Interactive Map */}
            <div
              ref={mapRef}
              className="w-full h-full min-h-[600px] relative overflow-hidden cursor-grab active:cursor-grabbing"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onWheel={handleWheel}
            >
              {/* Clean Map Background */}
              <div
                className="absolute inset-0 transition-colors duration-300 pointer-events-none"
                style={{
                  background: isDark
                    ? 'linear-gradient(to bottom, rgba(15,23,42,0.5), rgba(30,27,75,0.3), rgba(15,23,42,0.5))'
                    : 'linear-gradient(to bottom, rgba(255,255,255,0.3), rgba(240,249,255,0.4), rgba(255,255,255,0.3))'
                }}
              >
                {/* Floating Glows */}
                <div
                  className="absolute top-1/4 left-1/4 w-48 h-48 rounded-full blur-3xl animate-pulse"
                  style={{ backgroundColor: isDark ? 'rgba(139, 92, 246, 0.15)' : 'rgba(59, 130, 246, 0.2)' }}
                />
                <div
                  className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full blur-3xl animate-pulse"
                  style={{ backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(167, 139, 250, 0.2)', animationDelay: '2s' }}
                />
              </div>

              {/* Transform Container for pan/zoom */}
              <div
                style={{
                  transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                  transition: isDragging ? 'none' : 'transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)',
                  transformOrigin: 'center',
                }}
              >
                {/* Grid Layout */}
                <div className="relative z-10 flex items-center justify-center min-h-[600px] py-12 px-8">
                  {/* Map Connection Lines */}
                  {careers.length > 1 && (
                    <svg
                      className="absolute inset-0 w-full h-full pointer-events-none z-0 opacity-50"
                      style={{ overflow: 'visible', color: isDark ? 'rgba(167, 139, 250, 0.6)' : 'rgba(59, 130, 246, 0.6)' }}
                      viewBox="0 0 100 100"
                      preserveAspectRatio="none"
                    >
                      {careers.map((_, i) => {
                        if (i === careers.length - 1) return null;

                        const cols = 3;
                        const row1 = Math.floor(i / cols);
                        const col1 = i % cols;
                        const row2 = Math.floor((i + 1) / cols);
                        const col2 = (i + 1) % cols;

                        // Calculate percentage coordinates (rough estimates for a max-w-5xl grid)
                        const startX = 16.66 + (col1 * 33.33);
                        const startY = 15 + (row1 * 40);
                        const endX = 16.66 + (col2 * 33.33);
                        const endY = 15 + (row2 * 40);

                        // Create a curved path (add arc if wrapping to next row)
                        let d = '';
                        if (row1 === row2) {
                          // Same row, gentle curve
                          d = `M ${startX} ${startY} Q ${(startX + endX) / 2} ${startY - 10} ${endX} ${endY}`;
                        } else {
                          // Wrapping to next row, sweeping S-curve
                          d = `M ${startX} ${startY} C ${startX + 10} ${startY + 30}, ${endX - 10} ${endY - 30}, ${endX} ${endY}`;
                        }

                        return (
                          <path
                            key={`path-${i}`}
                            d={d}
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeDasharray="8 8"
                            strokeLinecap="round"
                            vectorEffect="non-scaling-stroke"
                          />
                        );
                      })}
                    </svg>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl w-full relative z-10">
                    {careers.map((career, index) => {
                      const status = careerStatus[career.id] || 'not_started';
                      const isMastered = status === 'mastered';
                      const isInProgress = status === 'in_progress';
                      const earnedScore = careerXP[career.id] || 0;
                      const delay = index * 0.25;

                      return (
                        <button
                          key={career.id}
                          onClick={(e) => { e.stopPropagation(); handleCareerClick(career.slug); }}
                          className="group z-10 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 rounded-[3rem]"
                          aria-label={`Explore ${career.name} career world`}
                          tabIndex={0}
                        >
                          {/* Interactive area wrapper */}
                          <div className="relative w-48 h-48 lg:w-52 lg:h-52 mx-auto transition-all duration-500 ease-out hover:scale-110 hover:-translate-y-4 hover:rotate-2 animate-float-card" style={{ animationDelay: `${delay}s` }}>

                            {/* Shadow blob */}
                            <div className="absolute top-[85%] left-1/2 -translate-x-1/2 w-[60%] h-[15%] bg-black/60 blur-xl rounded-[100%] transition-all duration-500 group-hover:scale-75 group-hover:opacity-40" />

                            {/* Island Card/Shape */}
                            <div className={`
                              absolute inset-0 flex flex-col items-center justify-center
                              rounded-[3rem] border-2 shadow-[0_10px_40px_rgba(0,0,0,0.5)]
                              backdrop-blur-md overflow-hidden transition-all duration-300
                              ${isMastered
                                ? isDark
                                  ? 'bg-gradient-to-br from-yellow-900/90 via-amber-800/80 to-yellow-900/90 border-yellow-500/60 shadow-[0_0_50px_rgba(234,179,8,0.4)]'
                                  : 'bg-gradient-to-br from-yellow-200 via-amber-100 to-yellow-300 border-yellow-400 shadow-[0_0_20px_rgba(251,191,36,0.4)]'
                                : isInProgress
                                  ? isDark
                                    ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 border-emerald-500/50 shadow-[0_0_50px_rgba(16,185,129,0.3)]'
                                    : 'bg-gradient-to-br from-emerald-200 via-teal-100 to-emerald-300 border-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.3)]'
                                  : isDark
                                    ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 border-white/10 hover:border-purple-500/50 hover:shadow-[0_0_40px_rgba(168,85,247,0.3)]'
                                    : 'bg-gradient-to-br from-slate-100 via-indigo-50 to-slate-200 border-indigo-200 hover:border-purple-400 hover:shadow-[0_0_30px_rgba(168,85,247,0.2)]'
                              }
                          `}>
                              {/* Inner Shine Effect */}
                              <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

                              {/* Background Image / Texture Element */}
                              <div className="absolute inset-0 opacity-20 pointer-events-none">
                                <div className="absolute -right-10 -top-10 w-40 h-40 bg-purple-500/30 rounded-full blur-3xl" />
                                <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-blue-500/30 rounded-full blur-3xl" />
                              </div>

                              {/* Icon Container */}
                              <div className={`
                                  relative w-24 h-24 mb-4 rounded-2xl flex items-center justify-center
                                  transition-transform duration-500 group-hover:scale-110 group-hover:-translate-y-2
                                  ${isDark ? 'bg-slate-900/50 border border-white/5 shadow-inner' : 'bg-white/50 border border-black/5 shadow-sm'}
                                  ${isMastered
                                  ? isDark ? 'text-yellow-400' : 'text-yellow-600'
                                  : isInProgress
                                    ? isDark ? 'text-emerald-300' : 'text-emerald-700'
                                    : isDark ? 'text-slate-200' : 'text-slate-600'}
                            `}>
                                {(() => {
                                  if (isMastered) return <span className="text-5xl">🏆</span>;
                                  const IconComp = (LucideIcons[career.icon as keyof typeof LucideIcons] as LucideIcon) || null;
                                  return IconComp ? <IconComp className="w-12 h-12" /> : <span className="text-5xl">🏰</span>;
                                })()}

                                {isMastered && (
                                  <Sparkles className="absolute -top-4 -right-4 w-8 h-8 text-yellow-400 animate-pulse" />
                                )}
                              </div>

                              {/* Text Info */}
                              <div className="relative text-center z-10 w-full px-4">
                                <h3
                                  className={`text-lg font-bold tracking-wider mb-1.5 transition-colors drop-shadow-lg ${isDark ? 'text-white group-hover:text-purple-200' : 'text-slate-800 group-hover:text-purple-700'}`}
                                  style={{ fontFamily: "'Righteous', cursive" }}
                                >
                                  {career.name}
                                </h3>
                                {/* XP Pill */}
                                <div className={`
                                inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-mono font-bold border
                                ${isMastered
                                    ? isDark
                                      ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-200'
                                      : 'bg-yellow-500/20 border-yellow-500/50 text-yellow-900'
                                    : earnedScore > 0
                                      ? isDark
                                        ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-200'
                                        : 'bg-emerald-500/20 border-emerald-500/50 text-emerald-900'
                                      : isDark
                                        ? 'bg-slate-800 border-white/10 text-slate-500'
                                        : 'bg-slate-100 border-black/10 text-slate-600'
                                  }
                              `}>
                                  <span>{earnedScore}</span>
                                  <span className="text-[10px] uppercase opacity-70">XP</span>
                                </div>
                              </div>

                              {/* Status Banner (Bottom) */}
                              {isInProgress && (
                                <div className="absolute bottom-0 inset-x-0 h-1.5 bg-emerald-900">
                                  <div className="h-full bg-emerald-400 animate-pulse" style={{ width: '60%' }} />
                                </div>
                              )}
                              {isMastered && (
                                <div className="absolute bottom-0 inset-x-0 h-1.5 bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,1)]" />
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
