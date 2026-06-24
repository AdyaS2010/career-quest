import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Star, Award, Target, TrendingUp, Zap, Share2, Flame, MessageSquareHeart, BookOpen, Globe, ShieldCheck, BookMarked, Pencil } from 'lucide-react';
import { AppNavbar } from '../components/AppNavbar';
import { ProfileEditModal } from '../components/ProfileEditModal';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { supabase } from '../lib/supabase';
import type { Profile, Career, UserChallengeProgress } from '../lib/database.types';

export function ProfilePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme } = useTheme();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [careers, setCareers] = useState<Career[]>([]);
  const [challengeProgress, setChallengeProgress] = useState<UserChallengeProgress[]>([]);
  const [careerScores, setCareerScores] = useState<Record<string, number>>({});
  const [challengesList, setChallengesList] = useState<{ id: string; career_id: string; title: string; max_score: number }[]>([]);
  const [careerChallengeCount, setCareerChallengeCount] = useState<Record<string, number>>({});
  const [careerStartedCount, setCareerStartedCount] = useState<Record<string, number>>({});
  const [userRank, setUserRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [printMode, setPrintMode] = useState<'report' | 'certificate'>('report');

  useEffect(() => {
    loadProfileData();
  }, [user]);

  const loadProfileData = async () => {
    if (!user) return;

    try {
      const [profileRes, careersRes, challengeProgressRes, challengesRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
        supabase.from('careers').select('*').eq('is_active', true).order('order_index'),
        (supabase.from('user_challenge_progress') as any).select('*').eq('user_id', user.id),
        (supabase.from('challenges') as any).select('id, career_id, title, max_score'),
      ]);

      if (profileRes.data) {
        setProfile(profileRes.data);
        const { count, error: countError } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .gt('total_score', (profileRes.data as any).total_score as number);

        if (!countError && count !== null) {
          setUserRank(count + 1);
        }
      }
      if (careersRes.data) setCareers(careersRes.data);
      if (challengeProgressRes.data) setChallengeProgress(challengeProgressRes.data);

      // Compute per-career scores and status from challenge best_scores (source of truth)
      const challenges = (challengesRes.data || []) as { id: string; career_id: string; title: string; max_score: number }[];
      const chalProgress = (challengeProgressRes.data || []) as UserChallengeProgress[];
      setChallengesList(challenges);

      const challengeToCareer: Record<string, string> = {};
      challenges.forEach(c => { challengeToCareer[c.id] = c.career_id; });

      // Count total challenges per career
      const chalCount: Record<string, number> = {};
      challenges.forEach(c => { chalCount[c.career_id] = (chalCount[c.career_id] || 0) + 1; });
      setCareerChallengeCount(chalCount);

      // Sum best_scores per career and count started challenges per career
      const scoreMap: Record<string, number> = {};
      const startedCount: Record<string, number> = {};
      chalProgress.forEach(cp => {
        const careerId = challengeToCareer[cp.challenge_id];
        if (careerId) {
          scoreMap[careerId] = (scoreMap[careerId] || 0) + cp.best_score;
          startedCount[careerId] = (startedCount[careerId] || 0) + 1;
        }
      });
      setCareerScores(scoreMap);
      setCareerStartedCount(startedCount);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(to bottom right, var(--bg-primary), var(--bg-secondary))' }}
      >
        <div
          className="w-16 h-16 border-4 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: 'var(--accent-primary)', borderTopColor: 'transparent' }}
        />
      </div>
    );
  }

  // Build max_score lookup for challenges
  const challengeMaxScores: Record<string, number> = {};
  (challengesList || []).forEach(c => { if (c && c.id) challengeMaxScores[c.id] = c.max_score || 0; });

  // Helper: get career accuracy (total best_score / total max_score for career)
  const getCareerAccuracy = (careerId: string) => {
    if (!careerId) return 0;
    const careerChals = (challengesList || []).filter(c => c && c.career_id === careerId);
    const totalMax = careerChals.reduce((sum, c) => sum + (c?.max_score || 0), 0);
    if (totalMax === 0) return 0;
    const totalBest = careerChals.reduce((sum, c) => {
      const progress = (challengeProgress || []).find(p => p && p.challenge_id === c?.id);
      return sum + (progress?.best_score || 0);
    }, 0);
    const acc = (totalBest / totalMax) * 100;
    return isNaN(acc) ? 0 : acc;
  };

  // Islands Mastered = careers where >80% accuracy AND every challenge attempted
  const completedCareers = (careers || []).filter(career => {
    if (!career || !career.id) return false;
    const totalInCareer = careerChallengeCount[career.id] || 0;
    const startedInCareer = careerStartedCount[career.id] || 0;
    if (totalInCareer === 0) return false;
    return startedInCareer >= totalInCareer && getCareerAccuracy(career.id) > 80;
  }).length;

  // Challenges Complete = challenges that have been attempted (status = completed)
  const totalChallengesCompleted = (challengeProgress || []).filter(p => p && p.status === 'completed').length;

  // Average Accuracy = average of (best_score / max_score) across all attempted challenges, as %
  const averageScoreRaw = (challengeProgress || []).length > 0
    ? Math.round(
      challengeProgress.reduce((sum, p) => {
        if (!p) return sum;
        const maxScore = challengeMaxScores[p.challenge_id] || 100;
        return sum + ((p.best_score || 0) / maxScore) * 100;
      }, 0) / challengeProgress.length
    )
    : 0;
  const averageScore = isNaN(averageScoreRaw) ? 0 : averageScoreRaw;

  // Perfect Scores = challenges where best_score >= max_score
  const perfectScores = (challengeProgress || []).filter(p => {
    if (!p) return false;
    const maxScore = challengeMaxScores[p.challenge_id];
    return maxScore && (p.best_score || 0) >= maxScore;
  }).length;

  // Level derived from total_score (100 points per level, max ~16 with 1500 total)
  const currentLevel = Math.floor((profile?.total_score || 0) / 100) + 1;

  const getLevelProgress = () => {
    const totalScore = profile?.total_score || 0;
    const expIntoCurrentLevel = totalScore % 100;
    const progress = (expIntoCurrentLevel / 100) * 100;
    return Math.min(100, Math.max(0, progress));
  };

  const handleShare = async () => {
    const rankStr = userRank ? ` and am ranked #${userRank} globally ` : ' ';
    const shareText = `I just reached Level ${currentLevel}${rankStr}with ${profile?.total_score || 0} points on Career Quest! Can you beat my score? 🏆`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Career Quest Stats',
          text: shareText,
          url: window.location.origin,
        });
      } catch (err) {
        console.log('User cancelled share or it failed:', err);
      }
    } else {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(window.location.origin)}`, '_blank');
    }
  };

  const handlePrintReport = () => {
    setPrintMode('report');
    setTimeout(() => {
      window.print();
    }, 500);
  };

  const handlePrintCertificate = () => {
    setPrintMode('certificate');
    setTimeout(() => {
      window.print();
    }, 500);
  };

  const getTopCompletedTrials = () => {
    const trials = challengeProgress.map(cp => {
      const challenge = challengesList.find(c => c.id === cp.challenge_id);
      const career = careers.find(c => c.id === challenge?.career_id);
      return {
        title: challenge?.title || 'Unknown Simulation',
        careerName: career?.name || 'General District',
        attempts: cp.attempts || 1,
        bestScore: cp.best_score || 0,
        maxScore: challenge?.max_score || 100,
        accuracy: Math.round(((cp.best_score || 0) / (challenge?.max_score || 100)) * 100),
      };
    });
    return trials
      .sort((a, b) => b.accuracy - a.accuracy || b.bestScore - a.bestScore)
      .slice(0, 6);
  };

  const getNACECompetencies = () => {
    const competencies = [
      { name: 'Critical Thinking', description: 'Analyze facts and make informed decisions.', careers: ['information-technology', 'financial-services', 'health-sciences', 'law-government'], score: 0 },
      { name: 'Communication', description: 'Exchange information and ideas effectively.', careers: ['education', 'media-communication', 'arts-entertainment', 'law-government', 'culinary-arts'], score: 0 },
      { name: 'Teamwork', description: 'Collaborate with others to achieve shared goals.', careers: ['health-sciences', 'education', 'media-communication'], score: 0 },
      { name: 'Technology', description: 'Ethically use digital tools to solve problems.', careers: ['information-technology', 'financial-services', 'media-communication'], score: 0 },
      { name: 'Leadership', description: 'Motivate others and achieve common goals.', careers: ['education', 'law-government'], score: 0 },
      { name: 'Professionalism', description: 'Demonstrate effective work habits and integrity.', careers: ['health-sciences', 'culinary-arts', 'financial-services'], score: 0 },
      { name: 'Career & Self-Development', description: 'Continually improve skills and navigate paths.', careers: ['arts-entertainment', 'education'], score: 0 },
      { name: 'Equity & Inclusion', description: 'Demonstrate awareness and respect for diversity.', careers: ['education', 'law-government', 'media-communication'], score: 0 },
    ];

    return competencies.map(comp => {
      const relevantCareers = careers.filter(c => comp.careers.includes(c.slug));
      if (relevantCareers.length === 0) return { ...comp, score: 0 };

      const totalAccuracy = relevantCareers.reduce((sum, c) => sum + getCareerAccuracy(c.id), 0);
      const avgAccuracy = Math.round(totalAccuracy / relevantCareers.length);
      return { ...comp, score: avgAccuracy };
    });
  };

  return (
    <div
      className="min-h-screen"
      style={{ background: 'linear-gradient(to bottom right, var(--bg-primary), var(--bg-secondary))' }}
    >
      <AppNavbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 print:hidden">
        <div
          className="rounded-3xl shadow-2xl border-4 overflow-hidden mb-8"
          style={{
            backgroundColor: 'var(--surface-card)',
            borderColor: theme === 'dark' ? 'rgba(251, 191, 36, 0.5)' : '#fbbf24'
          }}
        >
          <div 
            className="p-8 text-white relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #131d2b 0%, #10211a 33%, #22140d 66%, #1d1017 100%)',
              borderBottom: '4px solid rgba(251, 191, 36, 0.2)'
            }}
          >
            {/* Ambient glows to add depth and quality */}
            <div className="absolute inset-0 pointer-events-none opacity-20 mix-blend-screen"
                 style={{
                   background: 'radial-gradient(circle at 20% 20%, #3b82f6 0%, transparent 60%), radial-gradient(circle at 80% 80%, #10b981 0%, transparent 65%), radial-gradient(circle at 50% 50%, #ec4899 0%, transparent 60%)'
                 }}
            />

            {/* Back Silhouette Layer: Cozy City Buildings */}
            <div className="absolute inset-x-0 bottom-0 h-16 opacity-[0.06] pointer-events-none">
              <svg viewBox="0 0 1000 64" preserveAspectRatio="none" className="w-full h-full fill-white">
                <rect x="20" y="24" width="40" height="40" />
                <rect x="70" y="10" width="50" height="54" />
                <rect x="130" y="32" width="30" height="32" />
                <rect x="180" y="18" width="60" height="46" />
                <rect x="280" y="25" width="45" height="39" />
                <rect x="340" y="8" width="55" height="56" />
                <rect x="410" y="30" width="35" height="34" />
                <rect x="480" y="15" width="70" height="49" />
                <rect x="580" y="22" width="40" height="42" />
                <rect x="640" y="12" width="50" height="52" />
                <rect x="720" y="28" width="45" height="36" />
                <rect x="800" y="14" width="65" height="50" />
                <rect x="890" y="20" width="50" height="44" />
                <rect x="950" y="26" width="30" height="38" />
              </svg>
            </div>

            {/* Front Silhouette Layer: Stylized Autumn Foliage */}
            <div className="absolute inset-x-0 bottom-0 h-10 opacity-[0.12] pointer-events-none">
              <svg viewBox="0 0 1000 40" preserveAspectRatio="none" className="w-full h-full fill-white">
                <circle cx="50" cy="35" r="16" />
                <circle cx="100" cy="38" r="12" />
                <circle cx="150" cy="30" r="18" />
                <circle cx="220" cy="36" r="14" />
                <circle cx="270" cy="32" r="17" />
                <circle cx="320" cy="38" r="13" />
                <circle cx="400" cy="34" r="19" />
                <circle cx="450" cy="36" r="14" />
                <circle cx="520" cy="31" r="18" />
                <circle cx="600" cy="37" r="15" />
                <circle cx="670" cy="33" r="20" />
                <circle cx="750" cy="36" r="14" />
                <circle cx="820" cy="32" r="18" />
                <circle cx="880" cy="38" r="13" />
                <circle cx="940" cy="34" r="16" />
              </svg>
            </div>

            <div className="flex items-center gap-6 relative z-10">
              <div className="w-32 h-32 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-4 border-white shadow-xl">
                <span className="text-6xl">🧭</span>
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-4xl font-bold">{profile?.username || 'Guest'}</h2>
                  <button
                    onClick={() => setEditOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/40 text-sm font-bold uppercase tracking-wider transition-all"
                    aria-label="Edit profile"
                  >
                    <Pencil className="w-4 h-4" /> Edit
                  </button>
                </div>
                <p className="text-xl text-white/90 mb-4">{profile?.character_name} • Level {currentLevel}</p>

                {profile?.current_streak !== undefined && profile.current_streak > 0 && (
                  <div className="mb-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white font-bold border border-white/30 backdrop-blur-md shadow-sm">
                    <Flame className="w-4 h-4 text-orange-300" /> Streak: {profile.current_streak} (Max: {profile.longest_streak})
                  </div>
                )}

                <div className="bg-white/20 rounded-full h-4 overflow-hidden backdrop-blur-sm border-2 border-white/30">
                  <div
                    className="h-full bg-white rounded-full transition-all duration-500 shadow-lg"
                    style={{ width: `${getLevelProgress()}%` }}
                  />
                </div>
                <div className="text-sm text-white/90 mt-2">
                  {(profile?.total_score || 0) % 100} / 100 XP to next level
                </div>
              </div>

              <div className="text-center flex flex-col items-center">
                <Trophy className="w-16 h-16 mb-2 text-yellow-300" />
                <div className="text-4xl font-bold">{profile?.total_score || 0}</div>
                <div className="text-sm text-white/90 mb-4">Total Points</div>

                <button
                  onClick={handleShare}
                  className="flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-md px-4 py-2 rounded-full transition-all border border-white/40 shadow-lg text-sm font-bold uppercase tracking-wider mb-3 w-full justify-center"
                >
                  <Share2 className="w-4 h-4" />
                  Share Stats
                </button>

                <button
                  onClick={handlePrintReport}
                  className="flex items-center gap-2 bg-white hover:bg-indigo-50 text-indigo-700 px-4 py-2 rounded-full transition-all shadow-xl text-sm font-bold uppercase tracking-wider w-full justify-center mb-2.5"
                >
                  <BookOpen className="w-4 h-4" />
                  Career Report
                </button>

                <button
                  onClick={handlePrintCertificate}
                  className="flex items-center gap-2 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-slate-900 px-4 py-2 rounded-full transition-all shadow-xl text-sm font-bold uppercase tracking-wider w-full justify-center"
                >
                  <Award className="w-4 h-4" />
                  Print Certificate
                </button>
              </div>
            </div>
          </div>

          <div
            className="grid grid-cols-4 divide-x-2"
            style={{
              backgroundColor: 'var(--surface-card)',
              borderColor: theme === 'dark' ? 'rgba(251, 191, 36, 0.3)' : '#fde68a'
            }}
          >
            <div className="p-6 text-center">
              <Target className="w-10 h-10 mx-auto mb-3" style={{ color: theme === 'dark' ? '#fcd34d' : '#d97706' }} />
              <div className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>{completedCareers}</div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Islands Mastered</div>
            </div>

            <div className="p-6 text-center">
              <Zap className="w-10 h-10 mx-auto mb-3" style={{ color: theme === 'dark' ? '#fb923c' : '#ea580c' }} />
              <div className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>{totalChallengesCompleted}</div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Challenges Complete</div>
            </div>

            <div className="p-6 text-center">
              <TrendingUp className="w-10 h-10 text-green-600 mx-auto mb-3" />
              <div className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>{averageScore}%</div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Avg Accuracy</div>
            </div>

            <div className="p-6 text-center">
              <Star className="w-10 h-10 text-yellow-600 mx-auto mb-3" />
              <div className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {perfectScores}
              </div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Perfect Scores</div>
            </div>
          </div>

          {/* Quick Links Bar */}
          <div
            className="flex items-center justify-center gap-2 py-3 px-4 border-t"
            style={{
              backgroundColor: theme === 'dark' ? 'rgba(15, 23, 42, 0.5)' : 'rgba(255, 251, 235, 0.5)',
              borderColor: theme === 'dark' ? 'rgba(251, 191, 36, 0.2)' : '#fde68a'
            }}
          >
            {[
              { onClick: () => navigate('/feedback'), icon: <MessageSquareHeart className="w-4 h-4" />, label: 'Feedback', color: 'text-pink-500' },
              { onClick: () => navigate('/how-to-play'), icon: <BookOpen className="w-4 h-4" />, label: 'How to Play', color: 'text-blue-500' },
              { onClick: () => navigate('/about'), icon: <Globe className="w-4 h-4" />, label: 'About', color: 'text-indigo-500' },
            ].map((link, i) => (
              <button
                key={i}
                onClick={link.onClick}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all hover:scale-105 border text-sm font-medium"
                style={{
                  backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                  borderColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                  color: 'var(--text-secondary)'
                }}
                aria-label={link.label}
              >
                <span className={link.color}>{link.icon}</span>
                <span className="hidden sm:inline">{link.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div
            className="rounded-3xl shadow-xl border-4 p-6"
            style={{
              backgroundColor: 'var(--surface-card)',
              borderColor: theme === 'dark' ? 'rgba(251, 191, 36, 0.4)' : '#fcd34d'
            }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center">
                <Award className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Career Progress</h3>
            </div>

            <div className="space-y-4">
              {careers.map(career => {
                if (!career || !career.id) return null;
                const totalChallenges = careerChallengeCount[career.id] || 0;
                const startedInCareer = careerStartedCount[career.id] || 0;
                const accuracy = getCareerAccuracy(career.id);

                // Completed = >80% accuracy AND every challenge attempted
                const isCompleted = totalChallenges > 0 && startedInCareer >= totalChallenges && accuracy > 80;
                const isInProgress = startedInCareer > 0 && !isCompleted;
                const isNotStarted = startedInCareer === 0;

                return (
                  <div
                    key={career.id}
                    className="p-4 rounded-xl border-2"
                    style={{
                      background: theme === 'dark'
                        ? 'linear-gradient(to right, rgba(251, 191, 36, 0.1), rgba(249, 115, 22, 0.1))'
                        : 'linear-gradient(to right, #fffbeb, #fff7ed)',
                      borderColor: theme === 'dark' ? 'rgba(251, 191, 36, 0.3)' : '#fde68a'
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{isCompleted ? '🏆' : isInProgress ? '🚀' : '🗺️'}</span>
                        <div>
                          <div className="font-bold" style={{ color: 'var(--text-primary)' }}>{career.name}</div>
                          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>{career.title}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold" style={{ color: theme === 'dark' ? '#fcd34d' : '#d97706' }}>
                          {careerScores[career.id] || 0}
                        </div>
                        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>points</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isCompleted && (
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                          Completed
                        </span>
                      )}
                      {isInProgress && (
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                          In Progress
                        </span>
                      )}
                      {isNotStarted && (
                        <span
                          className="px-3 py-1 rounded-full text-xs font-semibold"
                          style={{
                            backgroundColor: theme === 'dark' ? 'rgba(100, 116, 139, 0.3)' : '#f1f5f9',
                            color: 'var(--text-secondary)'
                          }}
                        >
                          Not Yet Started
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div
            className="rounded-3xl shadow-xl border-4 p-6"
            style={{
              backgroundColor: 'var(--surface-card)',
              borderColor: theme === 'dark' ? 'rgba(251, 191, 36, 0.4)' : '#fcd34d'
            }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center">
                <Trophy className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Achievements</h3>
            </div>

            <div className="space-y-4">
              {[
                { icon: '🌟', title: 'First Island', desc: 'Complete your first career island', unlocked: completedCareers >= 1 },
                { icon: '⚡', title: 'Challenge Master', desc: 'Complete 10 challenges', unlocked: totalChallengesCompleted >= 10 },
                { icon: '💯', title: 'Perfectionist', desc: 'Get a perfect score on any challenge', unlocked: perfectScores >= 1 },
                { icon: '👑', title: 'Career Champion', desc: 'Complete all 8 career islands', unlocked: completedCareers >= 8 },
                { icon: '🚀', title: 'Level 10 Legend', desc: 'Reach level 10', unlocked: currentLevel >= 10 },
                { icon: '🍳', title: 'Master Chef', desc: 'Complete all Culinary Arts challenges', unlocked: (careerStartedCount[careers.find(c => c.slug === 'culinary-arts')?.id || ''] || 0) >= (careerChallengeCount[careers.find(c => c.slug === 'culinary-arts')?.id || ''] || 99) },
                { icon: '💻', title: 'Code Warrior', desc: 'Complete all Information Technology challenges', unlocked: (careerStartedCount[careers.find(c => c.slug === 'information-technology')?.id || ''] || 0) >= (careerChallengeCount[careers.find(c => c.slug === 'information-technology')?.id || ''] || 99) },
                { icon: '⚖️', title: 'Justice Served', desc: 'Complete all Law & Government challenges', unlocked: (careerStartedCount[careers.find(c => c.slug === 'law-government')?.id || ''] || 0) >= (careerChallengeCount[careers.find(c => c.slug === 'law-government')?.id || ''] || 99) },
                { icon: '🏥', title: 'Lifesaver', desc: 'Complete all Health Sciences challenges', unlocked: (careerStartedCount[careers.find(c => c.slug === 'health-sciences')?.id || ''] || 0) >= (careerChallengeCount[careers.find(c => c.slug === 'health-sciences')?.id || ''] || 99) },
                { icon: '🎨', title: 'Creative Genius', desc: 'Complete all Arts & Design challenges', unlocked: (careerStartedCount[careers.find(c => c.slug === 'arts-entertainment')?.id || ''] || 0) >= (careerChallengeCount[careers.find(c => c.slug === 'arts-entertainment')?.id || ''] || 99) },
                { icon: '💰', title: 'Wall Street Whiz', desc: 'Complete all Financial Services challenges', unlocked: (careerStartedCount[careers.find(c => c.slug === 'financial-services')?.id || ''] || 0) >= (careerChallengeCount[careers.find(c => c.slug === 'financial-services')?.id || ''] || 99) },
                { icon: '📚', title: 'Inspiring Educator', desc: 'Complete all Education challenges', unlocked: (careerStartedCount[careers.find(c => c.slug === 'education')?.id || ''] || 0) >= (careerChallengeCount[careers.find(c => c.slug === 'education')?.id || ''] || 99) },
                { icon: '📺', title: 'Media Maven', desc: 'Complete all Media & Communication challenges', unlocked: (careerStartedCount[careers.find(c => c.slug === 'media-communication')?.id || ''] || 0) >= (careerChallengeCount[careers.find(c => c.slug === 'media-communication')?.id || ''] || 99) },
              ].map((achievement, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border-2 ${!achievement.unlocked ? 'opacity-50' : ''}`}
                  style={{
                    background: achievement.unlocked
                      ? (theme === 'dark' ? 'linear-gradient(to right, rgba(34, 197, 94, 0.1), rgba(16, 185, 129, 0.1))' : 'linear-gradient(to right, #f0fdf4, #ecfdf5)')
                      : 'var(--surface-card)',
                    borderColor: achievement.unlocked
                      ? (theme === 'dark' ? 'rgba(34, 197, 94, 0.4)' : '#86efac')
                      : 'var(--border-default)'
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{achievement.icon}</span>
                    <div className="flex-1">
                      <div className="font-bold" style={{ color: 'var(--text-primary)' }}>{achievement.title}</div>
                      <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>{achievement.desc}</div>
                    </div>
                    {achievement.unlocked && <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </main>

      {editOpen && profile && user && (
        <ProfileEditModal
          profile={profile}
          userId={user.id}
          onClose={() => setEditOpen(false)}
          onSaved={(p) => setProfile(prev => prev ? { ...prev, ...p } : prev)}
        />
      )}

      {printMode === 'report' && (
        <div className="hidden print:block print-report-root print:m-0 print:p-0 bg-white text-slate-900 font-serif relative overflow-hidden w-[210mm] min-h-[297mm] p-[15mm]">
          {/* Intricate Border Decor */}
          <div className="absolute inset-4 border-[12px] border-double border-slate-100 pointer-events-none"></div>

          {/* Subtle Watermark - The Great Compass */}
          <div className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.02] pointer-events-none scale-[3] rotate-[15deg]">
            <svg viewBox="0 0 100 100" className="w-64 h-64">
              <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 2" />
              <path d="M50 5 L55 45 L95 50 L55 55 L50 95 L45 55 L5 50 L45 45 Z" fill="currentColor" />
            </svg>
          </div>

          {/* PAGE 1 CONTENT */}
          <div className="p-8 relative z-10 max-w-5xl mx-auto flex flex-col justify-between print:h-[1020px] print:mb-0">
            {/* Header Section */}
            <div className="flex justify-between items-start border-b-[6px] border-slate-900 pb-3 mb-4 relative">
              <div className="flex gap-4 items-center">
                <div className="relative">
                  <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center text-white text-xl shadow-md z-20 relative">🧭</div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-amber-500 rounded-lg -z-10"></div>
                </div>
                <div>
                  <h1 className="text-3xl font-black uppercase tracking-tighter mb-0.5" style={{ fontFamily: "'Cinzel', serif" }}>Career Quest</h1>
                  <p className="text-[10px] font-bold tracking-[0.25em] text-slate-500 uppercase">Academic Competency Transcript</p>
                  <div className="flex gap-2 mt-1 font-sans">
                    <span className="text-[8px] font-black bg-slate-900 text-white px-2.5 py-1 rounded tracking-wider uppercase">Ref: FBLA-2026-QS</span>
                    <span className="text-[8px] font-black border border-slate-900 text-slate-900 px-2.5 py-1 rounded tracking-wider uppercase">Gold Merit Standard</span>
                  </div>
                </div>
              </div>

              {/* Official Gold Seal Graphic */}
              <div className="absolute top-0 right-0 -translate-y-4 translate-x-4 opacity-90 scale-[0.65] origin-top-right">
                <div className="w-28 h-28 rounded-full bg-gradient-to-br from-amber-300 via-yellow-500 to-amber-600 p-1 shadow-xl flex items-center justify-center relative">
                  <div className="absolute inset-0 border-4 border-dashed border-white/40 rounded-full"></div>
                  <div className="w-full h-full rounded-full border-2 border-amber-200/50 flex flex-col items-center justify-center text-center p-2">
                    <span className="text-[7px] font-black text-amber-900 leading-none mb-1 uppercase tracking-widest">Official<br />Discovery</span>
                    <div className="w-6 h-[1px] bg-amber-900/40 my-1"></div>
                    <span className="text-[9px] font-black text-amber-955 uppercase tracking-tighter font-serif">Verified</span>
                  </div>
                  {/* Ribbons */}
                  <div className="absolute -bottom-6 left-1/4 w-5 h-10 bg-amber-600 -z-10 clip-path-ribbon"></div>
                  <div className="absolute -bottom-6 right-1/4 w-5 h-10 bg-amber-700 -z-10 clip-path-ribbon"></div>
                </div>
              </div>
            </div>

            {/* Credentials Section - Reverting to original layout but with professional upgrades */}
            <div className="grid grid-cols-12 gap-8 mb-4 items-center break-inside-avoid">
              <div className="col-span-8">
                <div className="mb-2">
                  <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1.5 flex items-center gap-4">
                    Candidate Credentials
                    <div className="flex-1 h-[1px] bg-slate-200"></div>
                  </h2>
                  <div className="space-y-0.5">
                    <h3 className="text-4xl font-black text-slate-900 leading-none tracking-tight" style={{ fontFamily: "'Cinzel', serif" }}>{profile?.username || 'Guest'}</h3>
                    <div className="flex flex-wrap items-center gap-2.5 pt-1 text-sm font-sans text-slate-500">
                      <span>Lead Assessor: <strong className="text-slate-800 font-serif">{profile?.character_name || 'Mayor Questopher'}</strong></span>
                      <span className="w-1.5 h-1.5 bg-slate-300 rounded-full"></span>
                      <span>Level: <strong className="text-slate-800">{currentLevel}</strong></span>
                      <span className="w-1.5 h-1.5 bg-slate-300 rounded-full"></span>
                      <span>Registry ID: <strong className="text-slate-800 font-mono">#489-CQ-{(profile?.username || 'GUEST').substring(0, 3).toUpperCase()}-2026</strong></span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-span-4 bg-slate-50 p-4.5 rounded-[1.8rem] border border-slate-100 shadow-inner text-center relative overflow-hidden break-inside-avoid">
                <div className="absolute top-0 left-0 w-full h-[3px] bg-slate-900"></div>
                <div className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 font-sans">Cumulative Mastery XP</div>
                <div className="text-4xl font-black text-slate-900 mb-0.5 tabular-nums">{profile?.total_score || 0}</div>
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest leading-none font-sans">
                  Standardized performance evaluation
                </p>
              </div>
            </div>

            {/* Mayoral Executive Commendation Letter - Clean, non-colorful style */}
            <div className="border border-slate-200 bg-slate-50/30 p-4 rounded-xl mb-4 break-inside-avoid relative overflow-hidden">
              <div className="absolute top-0 left-0 h-full w-1.5 bg-slate-900"></div>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 block font-sans pl-2">Mayoral Executive Recommendation</span>
              <p className="text-[10.5px] italic text-slate-800 leading-relaxed pl-2 font-serif">
                "Having successfully completed the core vocational simulations of Questford, the candidate has validated hands-on skill competencies and demonstrated outstanding career readiness under our counselor-guided curriculum. Recommended for direct workforce placement."
              </p>
              <div className="flex justify-between items-center mt-2.5 pt-2 border-t border-slate-200/50 pl-2">
                <span className="text-[8px] text-slate-400 uppercase tracking-wider font-sans">Questford Office of the Mayor</span>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-bold text-slate-900 font-serif">— Mayor Questopher, Counselor-in-Chief</span>
                  <span className="font-serif text-sm font-bold text-slate-800 italic" style={{ fontFamily: "'Kalam', cursive" }}>Questopher</span>
                </div>
              </div>
            </div>

            {/* Metric Scoreboard - Clean Gray Borders, White Backgrounds, High-Contrast */}
            <div className="grid grid-cols-4 gap-3 mb-4 break-inside-avoid">
              {[
                { label: 'Islands Mastered', value: `${completedCareers} / 8`, trend: 'District Competency' },
                { label: 'Successful Trials', value: `${totalChallengesCompleted} Runs`, trend: 'Skill Validation' },
                { label: 'Evaluation Precision', value: `${averageScore}%`, trend: 'Accuracy Rating' },
                { label: 'Login Consistency', value: `${profile?.longest_streak || 0} Days`, trend: 'Persistence Factor' }
              ].map((stat, i) => (
                <div key={i} className="p-3 border border-slate-200 bg-white rounded-xl flex flex-col justify-center text-center shadow-sm">
                  <div className="text-[9px] font-black uppercase tracking-wider mb-1 text-slate-400 font-sans">{stat.label}</div>
                  <div className="text-2xl font-black mb-0.5 text-slate-900">{stat.value}</div>
                  <div className="text-[7.5px] font-bold uppercase tracking-wider text-slate-500 font-sans">{stat.trend}</div>
                </div>
              ))}
            </div>

            {/* Matrix of Certified Core Competencies - Clean Slate Progress Bars */}
            <div className="mb-2 break-inside-avoid">
              <div className="flex items-center gap-4 mb-3">
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-900" style={{ fontFamily: "'Cinzel', serif" }}>Matrix of Certified Core Competencies</h3>
                <div className="flex-1 h-[1.5px] bg-slate-900"></div>
                <div className="text-[9px] font-black text-slate-400 uppercase tracking-wider font-sans">NACE Standards v2026.4</div>
              </div>

              <div className="grid grid-cols-2 gap-x-8 gap-y-3.5">
                {getNACECompetencies().map((comp, i) => {
                  const isCertified = comp.score >= 80;
                  const isExcellent = comp.score >= 90;
                  return (
                    <div key={comp.name} className="relative break-inside-avoid">
                      <div className="flex justify-between items-end mb-1">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-300 font-bold text-xs">{(i + 1).toString().padStart(2, '0')}</span>
                            <h4 className="font-bold text-[11px] text-slate-900 tracking-tight">{comp.name}</h4>
                          </div>
                          <p className="text-[9px] text-slate-400 font-medium tracking-wide uppercase mt-0.5 font-sans leading-none">{comp.description}</p>
                        </div>
                        <div className="text-right font-sans">
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-wider mr-2 ${
                            isExcellent 
                              ? 'bg-slate-100 text-slate-800 border border-slate-300' 
                              : isCertified 
                                ? 'bg-slate-50 text-slate-700 border border-slate-200' 
                                : 'bg-slate-50 text-slate-400'
                          }`}>
                            {isExcellent ? 'Excellent' : isCertified ? 'Validated' : 'Developing'}
                          </span>
                          <span className="text-xs font-black text-slate-900 font-mono">{comp.score}%</span>
                        </div>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                        <div
                          className="h-full rounded-full bg-slate-900 transition-all duration-1000"
                          style={{ width: `${comp.score}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="page-break" style={{ pageBreakBefore: 'always' }}></div>

          {/* PAGE 2 CONTENT */}
          <div className="p-8 relative z-10 max-w-5xl mx-auto flex flex-col justify-between print:h-[1020px]">
            <div className="flex-1 flex flex-col gap-4">
              
              <div className="break-inside-avoid">
                <div className="flex items-center gap-4 mb-2.5">
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-900" style={{ fontFamily: "'Cinzel', serif" }}>Learning Success Artifacts</h3>
                  <div className="flex-1 h-[1.5px] bg-slate-900"></div>
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                  {careers.filter(c => c && c.id && getCareerAccuracy(c.id) > 0).map(career => {
                    if (!career || !career.id) return null;
                    return (
                      <div key={career.id} className="relative bg-slate-50/50 p-4.5 rounded-xl border border-slate-200 shadow-sm break-inside-avoid">
                        <h4 className="font-black text-slate-900 uppercase tracking-wider text-xs mb-1.5 pb-0.5 border-b border-slate-200 leading-tight">
                          {career.name}
                        </h4>
                        <ul className="text-[10px] text-slate-600 space-y-1 font-medium leading-relaxed list-disc list-inside font-sans">
                          {career.slug === 'culinary-arts' && (
                            <>
                              <li>Mastered advanced culinary prep and kitchen command structures.</li>
                              <li>Applied plating dynamics and flavor pairing aesthetics.</li>
                            </>
                          )}
                          {career.slug === 'law-government' && (
                            <>
                              <li>Synthesized case evidence under strict jurisprudential guidelines.</li>
                              <li>Demonstrated ethics, structure, and persuasive arguments.</li>
                            </>
                          )}
                          {career.slug === 'information-technology' && (
                            <>
                              <li>Designed logical schema structures and algorithmic solutions.</li>
                              <li>Verified system reliability and secure connection protocols.</li>
                            </>
                          )}
                          {career.slug === 'financial-services' && (
                            <>
                              <li>Analyzed compounding risk indices and asset diversification.</li>
                              <li>Practiced fiduciary accountability and resource models.</li>
                            </>
                          )}
                          {career.slug === 'health-sciences' && (
                            <>
                              <li>Performed clinical diagnostic logic and triage protocols.</li>
                              <li>Executed treatment priorities under acute time constraints.</li>
                            </>
                          )}
                          {career.slug === 'education' && (
                            <>
                              <li>Curated adaptive lesson delivery plans for cognitive needs.</li>
                              <li>Balanced classroom dynamics with targeted educational metrics.</li>
                            </>
                          )}
                          {career.slug === 'media-communication' && (
                            <>
                              <li>Engineered multi-channel campaigns and message alignment.</li>
                              <li>Applied editorial standards to check source credibility.</li>
                            </>
                          )}
                          {career.slug === 'arts-entertainment' && (
                            <>
                              <li>Controlled stage blocking, pacing, and audience projection.</li>
                              <li>Synthesized creative designs with logistic feasibility.</li>
                            </>
                          )}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="break-inside-avoid">
                <div className="flex items-center gap-4 mb-2">
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-900" style={{ fontFamily: "'Cinzel', serif" }}>Verified Simulation Performance Ledger</h3>
                  <div className="flex-1 h-[1.5px] bg-slate-900"></div>
                </div>

                <table className="w-full text-left border-collapse text-[10px] border border-slate-200 rounded-xl overflow-hidden shadow-sm font-sans">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-300 uppercase font-black text-slate-600 tracking-wider font-sans">
                      <th className="py-2 px-3 w-5/12">Simulation Trial Run</th>
                      <th className="py-2 px-3 w-3/12">Career District</th>
                      <th className="py-2 px-2 w-1/12 text-center">Attempts</th>
                      <th className="py-2 px-2 w-1/12 text-center">Record Score</th>
                      <th className="py-2 px-3 w-2/12 text-right">Validation Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {getTopCompletedTrials().slice(0, 4).map((trial, idx) => (
                      <tr key={idx} className="align-middle hover:bg-slate-50/50">
                        <td className="py-2 px-3 font-bold text-slate-900 font-serif">{trial.title}</td>
                        <td className="py-2 px-3">{trial.careerName}</td>
                        <td className="py-2 px-2 text-center font-mono">{trial.attempts}</td>
                        <td className="py-2 px-2 text-center font-bold font-mono text-slate-900">{trial.bestScore} / {trial.maxScore}</td>
                        <td className="py-2 px-3 text-right">
                          <span className={`inline-block px-2 py-0.5 rounded-[4px] text-[7.5px] font-bold uppercase tracking-wider ${
                            trial.accuracy >= 100
                              ? 'bg-slate-900 text-white border border-slate-900 font-sans'
                              : 'bg-slate-100 text-slate-800 border border-slate-300 font-sans'
                          }`}>
                            {trial.accuracy >= 100 ? '100% Perfect' : 'Validated'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="break-inside-avoid">
                <div className="bg-slate-900 text-white rounded-3xl p-5 shadow-xl relative overflow-hidden print-summary-dark">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full translate-x-1/4 -translate-y-1/4 pointer-events-none"></div>
                  
                  <div className="flex justify-between items-center mb-3 pb-1.5 border-b border-white/10">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 leading-none">
                      Specialized Domain Evaluation Summary
                    </h3>
                    <span className="text-[7.5px] font-bold text-slate-500 uppercase tracking-widest font-sans">Questford Board Audit</span>
                  </div>

                  <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                    {careers.map(career => {
                      if (!career || !career.id) return null;
                      const accuracy = getCareerAccuracy(career.id);
                      const points = careerScores[career.id] || 0;
                      return (
                        <div key={career.id} className="flex justify-between items-center border-b border-white/5 pb-1 font-sans">
                          <div>
                            <span className="font-bold text-white text-[9.5px] tracking-wide uppercase leading-tight block">
                              {career.name}
                            </span>
                            <span className="text-[8px] text-slate-400 font-medium uppercase tracking-wider block mt-0.5">
                              {career.title}
                            </span>
                          </div>
                          <div className="text-right">
                            <div className="text-[10px] font-black text-white leading-none">
                              {points} <span className="text-[7.5px] text-slate-500 font-medium">XP</span>
                            </div>
                            <span className={`text-[7.5px] font-black uppercase tracking-wider block mt-0.5 ${
                              accuracy > 80 
                                ? 'text-amber-400' 
                                : accuracy > 0 
                                  ? 'text-blue-400' 
                                  : 'text-slate-500'
                            }`}>
                              {accuracy > 80 ? 'MASTER' : accuracy > 0 ? 'ELITE' : 'CANDIDATE'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

            </div>

            <div className="pt-3 border-t-2 border-slate-900 break-inside-avoid">
              <div className="grid grid-cols-12 gap-6 items-end">
                <div className="col-span-8 font-sans">
                  <div className="mb-2 flex gap-3 pr-4">
                    <div className="w-1 h-8 bg-slate-900"></div>
                    <p className="text-[8.5px] font-medium text-slate-400 leading-normal italic">
                      "This document serves as an official record of career simulation competencies. Performance is indexed against 2026 industry standards and discovery protocols."
                    </p>
                  </div>
                  <div className="flex gap-4 items-center pt-1 opacity-80">
                    <div className="flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-slate-900" />
                      <span className="text-[8.5px] font-black uppercase tracking-wider">Verified Profile</span>
                    </div>
                    <div className="flex items-center gap-1 border-l pl-3">
                      <BookMarked className="w-3.5 h-3.5 text-slate-900" />
                      <span className="text-[8.5px] font-black uppercase tracking-wider">Accredited Tasks</span>
                    </div>
                    <div className="flex items-center gap-1 border-l pl-3">
                      <Zap className="w-3.5 h-3.5 text-slate-900" />
                      <span className="text-[8.5px] font-black uppercase tracking-wider">Real-time Accuracy</span>
                    </div>
                  </div>
                </div>

                <div className="col-span-4 text-right flex flex-col items-end">
                  <div className="mb-3">
                    <div className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest mb-0.5 leading-none font-sans">Discovery Board Authorization</div>
                    <div className="h-[1.5px] w-36 bg-slate-900 ml-auto mb-1"></div>
                    <div className="flex flex-col items-end">
                      <p className="font-serif text-base font-bold tracking-tighter text-slate-900 leading-none">Mayor Questopher</p>
                      <p className="text-[7.5px] font-black text-slate-400 uppercase tracking-[0.15deg] font-sans">Board Registry ID: 489-CQ-2026</p>
                    </div>
                  </div>
                  <div className="text-[8.5px] font-black text-slate-200 select-none uppercase tracking-[0.4em] font-sans">
                    FOR OFFICIAL PRESENTATION ONLY
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PRINT ONLY: Professional Career Certificate of Achievement */}
      {printMode === 'certificate' && (
        <div className="hidden print:block print-landscape-cert bg-white text-slate-900 font-serif relative overflow-hidden w-[297mm] h-[210mm] p-[15mm]">
          {/* Double Gold Ornamental Border */}
          <div className="absolute inset-4 border-4 border-[#d97706] pointer-events-none" />
          <div className="absolute inset-6 border-[8px] border-double border-[#d97706] pointer-events-none flex flex-col items-center justify-between p-12 text-center">
            
            {/* Header Emblem */}
            <div className="flex flex-col items-center gap-1">
              <span className="text-4xl">🧭</span>
              <h2 className="text-xs font-black uppercase tracking-[0.4em] text-slate-500 font-sans">Questford Discovery Board</h2>
            </div>

            {/* Main Title */}
            <div>
              <h1 className="text-4xl font-black uppercase tracking-tight text-slate-900" style={{ fontFamily: "'Cinzel Decorative', serif" }}>
                Certificate of Career Competency
              </h1>
              <p className="text-xs italic text-slate-400 mt-2">This official document certifies vocational competency discovery</p>
            </div>

            {/* Candidate Details */}
            <div className="my-2">
              <p className="text-sm font-sans uppercase tracking-[0.2em] text-slate-400 leading-none">Awarded to</p>
              <h2 className="text-5xl font-black text-slate-900 font-serif my-3 tracking-wide" style={{ fontFamily: "'Cinzel', serif" }}>
                {profile?.username || 'Guest'}
              </h2>
              <div className="w-36 h-[1.5px] bg-[#d97706] mx-auto" />
              <p className="text-sm font-sans italic text-slate-500 mt-2">
                for demonstrating proficiency and mastering career simulations under the counselor-guided curriculum
              </p>
            </div>

            {/* Certified Career Domains & NACE Core Competencies */}
            <div className="my-1 flex flex-col items-center gap-3">
              <div className="flex flex-col items-center">
                <span className="text-[7px] font-sans font-black uppercase tracking-[0.2em] text-slate-400 mb-1.5">Mastered Districts</span>
                <div className="flex flex-wrap justify-center gap-2 max-w-[200mm]">
                  {careers.map(career => {
                    if (!career || !career.id) return null;
                    const totalChallenges = careerChallengeCount[career.id] || 0;
                    const startedInCareer = careerStartedCount[career.id] || 0;
                    const accuracy = getCareerAccuracy(career.id);
                    const isCompleted = totalChallenges > 0 && startedInCareer >= totalChallenges && accuracy > 80;
                    
                    if (!isCompleted) return null;

                    return (
                      <div key={career.id} className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-amber-300 bg-amber-50 text-[9px] font-black uppercase tracking-wider text-amber-800 font-sans shadow-sm">
                        <span>🏆</span>
                        <span>{career.name}</span>
                      </div>
                    );
                  })}
                  {completedCareers === 0 && (
                    <div className="text-[9px] text-slate-400 font-sans uppercase tracking-widest italic">No domains mastered yet · Complete challenges with &gt;80% accuracy</div>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-center mt-1">
                <span className="text-[7px] font-sans font-black uppercase tracking-[0.2em] text-slate-400 mb-1.5">NACE Core Competencies Certified</span>
                <div className="flex flex-wrap justify-center gap-2 max-w-[200mm]">
                  {getNACECompetencies().map(comp => {
                    if (comp.score < 80) return null;
                    return (
                      <div key={comp.name} className="flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-indigo-200 bg-indigo-50/50 text-[8px] font-black uppercase tracking-wider text-indigo-800 font-sans shadow-sm">
                        <span>🛡️</span>
                        <span>{comp.name}</span>
                      </div>
                    );
                  })}
                  {getNACECompetencies().filter(comp => comp.score >= 80).length === 0 && (
                    <div className="text-[9px] text-slate-400 font-sans uppercase tracking-widest italic">No NACE competencies certified yet · Complete challenges with &gt;80% accuracy</div>
                  )}
                </div>
              </div>
            </div>

            {/* Signatures & Seal Section */}
            <div className="w-full flex justify-between items-end px-10 pt-4">
              
              {/* Left Sign */}
              <div className="text-left w-48">
                <div className="h-[1px] bg-slate-400 w-full mb-1" />
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider font-sans">Discovery registry id</p>
                <p className="text-[10px] font-bold text-slate-800 font-mono">#489-CQ-{(profile?.username || 'GUEST').substring(0, 3).toUpperCase()}-2026</p>
              </div>

              {/* Gold Seal Graphic */}
              <div className="relative scale-[0.8] origin-bottom -translate-y-2">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-300 via-yellow-500 to-amber-600 p-0.5 shadow-xl flex items-center justify-center relative">
                  <div className="absolute inset-0 border-2 border-dashed border-white/40 rounded-full" />
                  <div className="w-full h-full rounded-full border border-amber-200/50 flex flex-col items-center justify-center text-center p-1">
                    <span className="text-[6px] font-black text-amber-900 leading-none uppercase tracking-widest">Official<br />Discovery</span>
                    <div className="w-4 h-[0.5px] bg-amber-900/40 my-0.5" />
                    <span className="text-[8px] font-black text-amber-950 uppercase tracking-tighter">Verified</span>
                  </div>
                  {/* Ribbons */}
                  <div className="absolute -bottom-5 left-1/4 w-4 h-8 bg-amber-600 -z-10 clip-path-ribbon" />
                  <div className="absolute -bottom-5 right-1/4 w-4 h-8 bg-amber-700 -z-10 clip-path-ribbon" />
                </div>
              </div>

              {/* Right Sign */}
              <div className="text-right w-48">
                <p className="font-serif text-base font-bold italic tracking-tighter text-slate-900 leading-none">Mayor Questopher</p>
                <div className="h-[1px] bg-slate-400 w-full mt-1.5 mb-1" />
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider font-sans">Counselor-in-chief</p>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* CSS styles to ensure page orientation is correct */}
      {printMode === 'report' ? (
        <style dangerouslySetInnerHTML={{
          __html: `
          @media print {
            @page { size: A4; margin: 0; }
            .print-report-root { display: block !important; }
            .print-landscape-cert { display: none !important; }
          }
        ` }} />
      ) : (
        <style dangerouslySetInnerHTML={{
          __html: `
          @media print {
            @page { size: A4 landscape; margin: 0; }
            .print-landscape-cert { display: block !important; }
            .print-report-root { display: none !important; }
          }
        ` }} />
      )}
    </div>
  );
}
