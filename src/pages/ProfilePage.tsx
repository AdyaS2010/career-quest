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
  const [challengesList, setChallengesList] = useState<{ id: string; career_id: string; max_score: number }[]>([]);
  const [careerChallengeCount, setCareerChallengeCount] = useState<Record<string, number>>({});
  const [careerStartedCount, setCareerStartedCount] = useState<Record<string, number>>({});
  const [userRank, setUserRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);

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
        (supabase.from('challenges') as any).select('id, career_id, max_score'),
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
      const challenges = (challengesRes.data || []) as { id: string; career_id: string; max_score: number }[];
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
  challengesList.forEach(c => { challengeMaxScores[c.id] = c.max_score; });

  // Helper: get career accuracy (total best_score / total max_score for career)
  const getCareerAccuracy = (careerId: string) => {
    const careerChals = challengesList.filter(c => c.career_id === careerId);
    const totalMax = careerChals.reduce((sum, c) => sum + c.max_score, 0);
    if (totalMax === 0) return 0;
    const totalBest = careerChals.reduce((sum, c) => {
      const progress = challengeProgress.find(p => p.challenge_id === c.id);
      return sum + (progress?.best_score || 0);
    }, 0);
    return (totalBest / totalMax) * 100;
  };

  // Islands Mastered = careers where >80% accuracy AND every challenge attempted
  const completedCareers = careers.filter(career => {
    const totalInCareer = careerChallengeCount[career.id] || 0;
    const startedInCareer = careerStartedCount[career.id] || 0;
    if (totalInCareer === 0) return false;
    return startedInCareer >= totalInCareer && getCareerAccuracy(career.id) > 80;
  }).length;

  // Challenges Complete = challenges that have been attempted (status = completed)
  const totalChallengesCompleted = challengeProgress.filter(p => p.status === 'completed').length;

  // Average Accuracy = average of (best_score / max_score) across all attempted challenges, as %
  const averageScore = challengeProgress.length > 0
    ? Math.round(
      challengeProgress.reduce((sum, p) => {
        const maxScore = challengeMaxScores[p.challenge_id] || 100;
        return sum + (p.best_score / maxScore) * 100;
      }, 0) / challengeProgress.length
    )
    : 0;

  // Perfect Scores = challenges where best_score >= max_score
  const perfectScores = challengeProgress.filter(p => {
    const maxScore = challengeMaxScores[p.challenge_id];
    return maxScore && p.best_score >= maxScore;
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
    window.print();
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
                  <h2 className="text-4xl font-bold">{profile?.username}</h2>
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
                  className="flex items-center gap-2 bg-white hover:bg-indigo-50 text-indigo-700 px-4 py-2 rounded-full transition-all shadow-xl text-sm font-bold uppercase tracking-wider w-full justify-center"
                >
                  <BookOpen className="w-4 h-4" />
                  Career Report
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

      {/* PRINT ONLY: Professional Career Report Card */}
      <div className="hidden print:block print:m-0 print:p-0 bg-white text-slate-900 font-serif relative overflow-hidden">
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
        <div className="p-10 relative z-10 max-w-5xl mx-auto flex flex-col print:h-[1050px] print:mb-0">
          {/* Header Section */}
          <div className="flex justify-between items-start border-b-[6px] border-slate-900 pb-4 mb-6 relative">
            <div className="flex gap-6 items-center pr-32">
              <div className="relative">
                <div className="w-14 h-14 bg-slate-900 rounded-xl flex items-center justify-center text-white text-2xl shadow-2xl z-20 relative">🧭</div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-amber-500 rounded-lg -z-10"></div>
              </div>
              <div>
                <h1 className="text-3xl font-black uppercase tracking-tighter mb-0.5" style={{ fontFamily: "'Cinzel', serif" }}>Career Quest</h1>
                <p className="text-xs font-bold tracking-[0.3em] text-slate-500 uppercase ml-0.5">Academic Competency Transcript</p>
                <div className="flex gap-2 mt-1">
                  <span className="text-[6px] font-black bg-slate-900 text-white px-2 py-0.5 rounded tracking-[0.10em] uppercase">Ref: FBLA-2026-QS</span>
                  <span className="text-[6px] font-black border border-amber-500 text-amber-600 px-2 py-0.5 rounded tracking-[0.10em] uppercase">Gold Merit Standard</span>
                </div>
              </div>
            </div>

            {/* Official Gold Seal Graphic - Repositioned to avoid overlap */}
            <div className="absolute top-0 right-0 -translate-y-4 translate-x-4 opacity-90 scale-[0.65] origin-top-right">
              <div className="w-28 h-28 rounded-full bg-gradient-to-br from-amber-300 via-yellow-500 to-amber-600 p-1 shadow-xl flex items-center justify-center relative">
                <div className="absolute inset-0 border-4 border-dashed border-white/40 rounded-full"></div>
                <div className="w-full h-full rounded-full border-2 border-amber-200/50 flex flex-col items-center justify-center text-center p-2">
                  <span className="text-[7px] font-black text-amber-900 leading-none mb-1 uppercase tracking-widest">Official<br />Discovery</span>
                  <div className="w-6 h-[1px] bg-amber-900/40 my-1"></div>
                  <span className="text-[9px] font-black text-amber-950 uppercase tracking-tighter font-serif">Verified</span>
                </div>
                {/* Ribbons */}
                <div className="absolute -bottom-6 left-1/4 w-5 h-10 bg-amber-600 -z-10 clip-path-ribbon"></div>
                <div className="absolute -bottom-6 right-1/4 w-5 h-10 bg-amber-700 -z-10 clip-path-ribbon"></div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-8 mb-6 items-center break-inside-avoid">
            <div className="col-span-8">
              <div className="mb-2">
                <h2 className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em] mb-1.5 flex items-center gap-4">
                  Candidate Credentials
                  <div className="flex-1 h-[1px] bg-slate-100"></div>
                </h2>
                <div className="space-y-0.5">
                  <h3 className="text-5xl font-black text-slate-900 leading-none tracking-tight" style={{ fontFamily: "'Righteous', cursive" }}>{profile?.username}</h3>
                  <div className="flex items-center gap-3 pt-0.5">
                    <p className="text-lg text-slate-400 font-light italic">Assessment Lead: <span className="text-slate-900 font-bold not-italic font-serif">{profile?.character_name}</span></p>
                    <div className="w-1 h-1 bg-amber-500 rounded-full"></div>
                    <p className="text-lg text-slate-400 font-light italic tracking-widest">{currentLevel} Levels Attained</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-span-4 bg-slate-50 p-5 rounded-[1.8rem] border border-slate-100 shadow-inner text-center relative overflow-hidden break-inside-avoid">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 via-indigo-500 to-purple-600"></div>
              <div className="text-[8px] font-black text-slate-300 uppercase tracking-[0.2em] mb-1">Cumulative Mastery XP</div>
              <div className="text-5xl font-black text-slate-900 mb-0.5 tabular-nums">{profile?.total_score || 0}</div>
              <p className="text-[7px] text-slate-400 font-bold uppercase tracking-widest leading-none">
                Standardized performance evaluation
              </p>
            </div>
          </div>

          {/* Metric Bar Scoreboard */}
          <div className="grid grid-cols-4 gap-4 mb-6 break-inside-avoid">
            {[
              { label: 'Islands Mastered', value: completedCareers, icon: '🏰', trend: 'Global Mastery' },
              { label: 'Successful Trials', value: totalChallengesCompleted, icon: '🎯', trend: 'Skill Validation' },
              { label: 'Evaluation Precision', value: `${averageScore}%`, icon: '📈', trend: 'Consistency Rating' },
              { label: 'Login Consistency', value: profile?.longest_streak || 0, icon: '🔥', trend: 'Persistence Factor' }
            ].map((stat, i) => (
              <div key={i} className="p-4 border border-slate-100 rounded-xl group flex flex-col justify-center">
                <div className="text-[8px] font-black text-slate-300 uppercase mb-1 tracking-widest">{stat.label}</div>
                <div className="text-2xl font-black text-slate-900 mb-0.5">{stat.value}</div>
                <div className="text-[7px] font-bold text-amber-600 uppercase tracking-widest">
                  {stat.trend}
                </div>
              </div>
            ))}
          </div>

          {/* Matrix Header */}
          <div className="flex items-center gap-6 mb-4 break-inside-avoid">
            <h3 className="text-2xl font-black uppercase tracking-tight text-slate-900" style={{ fontFamily: "'Cinzel', serif" }}>Matrix of Core Competencies</h3>
            <div className="flex-1 h-[2px] bg-slate-900"></div>
            <div className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">NACE Standards v2026.4</div>
          </div>

          <div className="grid grid-cols-2 gap-x-12 gap-y-4 mb-2 break-inside-avoid">
            {getNACECompetencies().map((comp, i) => (
              <div key={comp.name} className="relative break-inside-avoid">
                <div className="flex justify-between items-end mb-1">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-slate-200 font-black text-base">{(i + 1).toString().padStart(2, '0')}</span>
                      <h4 className="font-bold text-sm text-slate-900 tracking-tight">{comp.name}</h4>
                    </div>
                    <p className="text-[8px] text-slate-400 font-medium uppercase tracking-wider leading-none">{comp.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-black text-slate-900 leading-none">{comp.score}%</div>
                    <div className="text-[6px] font-bold text-slate-300 uppercase">Proficiency</div>
                  </div>
                </div>
                <div className="h-1.5 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                  <div
                    className="h-full rounded-full bg-slate-900 transition-all duration-1000"
                    style={{ width: `${comp.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FORCED PAGE BREAK */}
        <div className="page-break" style={{ pageBreakBefore: 'always' }}></div>

        {/* PAGE 2 CONTENT */}
        <div className="p-10 relative z-10 max-w-5xl mx-auto flex flex-col print:h-[1050px]">
          <div className="flex-1 flex flex-col">
            <div className="break-inside-avoid">
              <div className="flex items-center gap-6 mb-4">
                <h3 className="text-2xl font-black uppercase tracking-widest text-slate-900" style={{ fontFamily: "'Cinzel', serif" }}>Learning Success Artifacts</h3>
                <div className="flex-1 h-[2px] bg-slate-100"></div>
              </div>

              <div className="grid grid-cols-2 gap-x-6 gap-y-3 mb-4">
                {careers.filter(c => getCareerAccuracy(c.id) > 0).map(career => (
                  <div key={career.id} className="relative bg-slate-50 p-4 rounded-xl border border-slate-100 break-inside-avoid">
                    <h4 className="font-black text-slate-900 uppercase tracking-widest text-xs mb-1.5 border-b pb-0.5 leading-none">{career.name}</h4>
                    <ul className="text-[8px] text-slate-500 space-y-0.5 font-medium leading-tight list-disc list-inside">
                      {career.slug === 'culinary-arts' && (
                        <>
                          <li>Mastered advanced mise-en-place and kitchen hierarchy.</li>
                          <li>Applied sensory science and aesthetic design to plating.</li>
                        </>
                      )}
                      {career.slug === 'law-government' && (
                        <>
                          <li>Demonstrated expert courtroom synthesis of legal evidence.</li>
                          <li>Analyzed jurisprudential ethics and persuasive delivery.</li>
                        </>
                      )}
                      {career.slug === 'information-technology' && (
                        <>
                          <li>Architected scalable data structures and logical workflows.</li>
                          <li>Validated cryptographic protocols and system integrity.</li>
                        </>
                      )}
                      {career.slug === 'financial-services' && (
                        <>
                          <li>Calculated complex risk distributions and asset allocations.</li>
                          <li>Navigated fiduciary ethics and market simulators.</li>
                        </>
                      )}
                      {career.slug === 'health-sciences' && (
                        <>
                          <li>Executed medical triage prioritization in simulations.</li>
                          <li>Applied pharmacological precision and diagnostic logic.</li>
                        </>
                      )}
                      {career.slug === 'education' && (
                        <>
                          <li>Developed adaptive pedagogical frameworks for learners.</li>
                          <li>Synthesized classroom management with emotional IQ.</li>
                        </>
                      )}
                      {career.slug === 'media-communication' && (
                        <>
                          <li>Crafted strategic communications and brand narratives.</li>
                          <li>Evaluated journalistic integrity and multi-channel engagement.</li>
                        </>
                      )}
                      {career.slug === 'arts-entertainment' && (
                        <>
                          <li>Optimized performance dynamics and audience triggers.</li>
                          <li>Synthesized creative vision with production logistics.</li>
                        </>
                      )}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden break-inside-avoid">
              <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full translate-x-1/4 -translate-y-1/4"></div>
              <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mb-4 border-b border-white/10 pb-2 leading-none">Specialized Domain Evaluation Summary</h3>
              <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                {careers.map(career => {
                  const accuracy = getCareerAccuracy(career.id);
                  const points = careerScores[career.id] || 0;
                  return (
                    <div key={career.id} className="flex justify-between items-center group">
                      <div>
                        <span className="font-bold text-white text-xs tracking-wide uppercase">{career.name}</span>
                        <div className="flex gap-1 items-center mt-0.5">
                          <p className="text-[7px] text-slate-500 font-bold uppercase tracking-[0.1em]">{career.title}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-black text-white">{points} <span className="text-[8px] text-slate-500 font-medium">XP</span></div>
                        <span className={`text-[8px] font-black uppercase tracking-[0.1em] block mt-0.5 ${accuracy > 80 ? 'text-amber-400' : accuracy > 0 ? 'text-blue-400' : 'text-slate-700'}`}>
                          {accuracy > 80 ? 'MASTER' : accuracy > 0 ? 'ELITE' : 'CANDIDATE'}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Verification & Footnotes */}
          <div className="pt-4 border-t-4 border-slate-900 break-inside-avoid">
            <div className="grid grid-cols-12 gap-6 items-end">
              <div className="col-span-8">
                <div className="mb-2 flex gap-3 pr-4">
                  <div className="w-1 h-8 bg-amber-500"></div>
                  <p className="text-[8px] font-medium text-slate-400 leading-normal italic">
                    "This document serves as an official record of career simulation competencies. Performance is indexed against 2026 industry standards and discovery protocols."
                  </p>
                </div>
                <div className="flex gap-6 items-center pt-2 opacity-75">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-slate-900" />
                    <span className="text-[8px] font-black uppercase tracking-[0.1em]">Verified Profile</span>
                  </div>
                  <div className="flex items-center gap-1.5 border-l pl-4">
                    <BookMarked className="w-3.5 h-3.5 text-slate-900" />
                    <span className="text-[8px] font-black uppercase tracking-[0.1em]">Accredited Tasks</span>
                  </div>
                  <div className="flex items-center gap-1.5 border-l pl-4">
                    <Zap className="w-3.5 h-3.5 text-slate-900" />
                    <span className="text-[8px] font-black uppercase tracking-[0.1em]">Real-time Accuracy</span>
                  </div>
                </div>
              </div>
              <div className="col-span-4 text-right">
                <div className="mb-4">
                  <div className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-0.5 leading-none">Discovery Board Authorization</div>
                  <div className="h-[1.5px] w-40 bg-slate-900 ml-auto mb-1.5"></div>
                  <div className="flex flex-col items-end">
                    <p className="font-serif text-lg font-bold tracking-tighter mb-0.5 text-slate-900">Mayor Questopher</p>
                    <p className="text-[7px] font-black text-slate-400 uppercase tracking-[0.15deg]">Board Registry ID: 489-CQ-2026</p>
                  </div>
                </div>
                <div className="text-[9px] font-black text-slate-200 select-none uppercase tracking-[0.4em]">
                  FOR OFFICIAL PRESENTATION ONLY
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CSS styles to ensure high quality printing */}
        <style dangerouslySetInnerHTML={{
          __html: `
          @media print {
            .page-break { display: block; page-break-before: always; break-before: page; }
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .clip-path-ribbon { clip-path: polygon(0% 0%, 100% 0%, 100% 100%, 50% 85%, 0% 100%); }
            h1, h2, h3, h4 { break-after: avoid; }
            .break-inside-avoid { break-inside: avoid; }
            @page { size: A4; margin: 0; }
          }
        ` }} />
      </div>
    </div>
  );
}
