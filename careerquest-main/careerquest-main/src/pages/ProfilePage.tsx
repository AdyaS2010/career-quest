import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy, Star, Award, Target, TrendingUp, Zap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import type { Profile, Career, UserCareerProgress, UserChallengeProgress } from '../lib/database.types';

export function ProfilePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [careers, setCareers] = useState<Career[]>([]);
  const [careerProgress, setCareerProgress] = useState<Record<string, UserCareerProgress>>({});
  const [challengeProgress, setChallengeProgress] = useState<UserChallengeProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfileData();
  }, [user]);

  const loadProfileData = async () => {
    if (!user) return;

    try {
      const [profileRes, careersRes, careerProgressRes, challengeProgressRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
        supabase.from('careers').select('*').eq('is_active', true).order('order_index'),
        supabase.from('user_career_progress').select('*').eq('user_id', user.id),
        supabase.from('user_challenge_progress').select('*').eq('user_id', user.id),
      ]);

      if (profileRes.data) setProfile(profileRes.data);
      if (careersRes.data) setCareers(careersRes.data);
      if (challengeProgressRes.data) setChallengeProgress(challengeProgressRes.data);

      const progressMap: Record<string, UserCareerProgress> = {};
      careerProgressRes.data?.forEach(p => {
        progressMap[p.career_id] = p;
      });
      setCareerProgress(progressMap);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
        <div className="w-16 h-16 border-4 border-amber-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const completedCareers = Object.values(careerProgress).filter(p => p.status === 'completed').length;
  const totalChallengesCompleted = challengeProgress.filter(p => p.status === 'completed').length;
  const averageScore = challengeProgress.length > 0
    ? Math.round(challengeProgress.reduce((sum, p) => sum + p.best_score, 0) / challengeProgress.length)
    : 0;

  const getLevelProgress = () => {
    const currentLevel = profile?.level || 1;
    const experience = profile?.experience || 0;
    const expForCurrentLevel = (currentLevel - 1) * 100;
    const expForNextLevel = currentLevel * 100;
    const progress = ((experience - expForCurrentLevel) / (expForNextLevel - expForCurrentLevel)) * 100;
    return Math.min(100, Math.max(0, progress));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      <nav className="sticky top-0 z-40 backdrop-blur-lg bg-white/80 border-b-4 border-amber-400 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-amber-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-bold text-gray-800">Back to Map</span>
            </button>

            <h1 className="text-2xl font-bold text-amber-600">Your Journey</h1>
            <div className="w-32" />
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-3xl shadow-2xl border-4 border-amber-400 overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-8 text-white">
            <div className="flex items-center gap-6">
              <div className="w-32 h-32 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-4 border-white shadow-xl">
                <span className="text-6xl">🧭</span>
              </div>

              <div className="flex-1">
                <h2 className="text-4xl font-bold mb-2">{profile?.username}</h2>
                <p className="text-xl text-white/90 mb-4">{profile?.character_name} • Level {profile?.level}</p>

                <div className="bg-white/20 rounded-full h-4 overflow-hidden backdrop-blur-sm border-2 border-white/30">
                  <div
                    className="h-full bg-white rounded-full transition-all duration-500 shadow-lg"
                    style={{ width: `${getLevelProgress()}%` }}
                  />
                </div>
                <div className="text-sm text-white/90 mt-2">
                  {profile?.experience || 0} XP / {(profile?.level || 1) * 100} XP
                </div>
              </div>

              <div className="text-center">
                <Trophy className="w-16 h-16 mx-auto mb-2 text-yellow-300" />
                <div className="text-4xl font-bold">{profile?.total_score || 0}</div>
                <div className="text-sm text-white/90">Total Points</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 divide-x-2 divide-amber-200">
            <div className="p-6 text-center">
              <Target className="w-10 h-10 text-amber-600 mx-auto mb-3" />
              <div className="text-3xl font-bold text-gray-900">{completedCareers}</div>
              <div className="text-sm text-gray-600">Islands Explored</div>
            </div>

            <div className="p-6 text-center">
              <Zap className="w-10 h-10 text-orange-600 mx-auto mb-3" />
              <div className="text-3xl font-bold text-gray-900">{totalChallengesCompleted}</div>
              <div className="text-sm text-gray-600">Challenges Complete</div>
            </div>

            <div className="p-6 text-center">
              <TrendingUp className="w-10 h-10 text-green-600 mx-auto mb-3" />
              <div className="text-3xl font-bold text-gray-900">{averageScore}%</div>
              <div className="text-sm text-gray-600">Average Score</div>
            </div>

            <div className="p-6 text-center">
              <Star className="w-10 h-10 text-yellow-600 mx-auto mb-3" />
              <div className="text-3xl font-bold text-gray-900">
                {challengeProgress.filter(p => p.best_score >= 90).length}
              </div>
              <div className="text-sm text-gray-600">Perfect Scores</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-3xl shadow-xl border-4 border-amber-300 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center">
                <Award className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Career Progress</h3>
            </div>

            <div className="space-y-4">
              {careers.map(career => {
                const progress = careerProgress[career.id];
                const isCompleted = progress?.status === 'completed';
                const isStarted = progress?.status === 'in_progress';

                return (
                  <div
                    key={career.id}
                    className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border-2 border-amber-200"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{isCompleted ? '🏆' : isStarted ? '🚀' : '🗺️'}</span>
                        <div>
                          <div className="font-bold text-gray-900">{career.name}</div>
                          <div className="text-sm text-gray-600">{career.title}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-amber-600">
                          {progress?.score || 0}
                        </div>
                        <div className="text-xs text-gray-500">points</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isCompleted && (
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                          Completed
                        </span>
                      )}
                      {isStarted && !isCompleted && (
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                          In Progress
                        </span>
                      )}
                      {!isStarted && (
                        <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold">
                          Not Started
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-xl border-4 border-amber-300 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center">
                <Trophy className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Achievements</h3>
            </div>

            <div className="space-y-4">
              <div className={`p-4 rounded-xl border-2 ${
                completedCareers >= 1
                  ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300'
                  : 'bg-gray-50 border-gray-200 opacity-50'
              }`}>
                <div className="flex items-center gap-3">
                  <span className="text-3xl">🌟</span>
                  <div className="flex-1">
                    <div className="font-bold text-gray-900">First Island</div>
                    <div className="text-sm text-gray-600">Complete your first career island</div>
                  </div>
                  {completedCareers >= 1 && <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />}
                </div>
              </div>

              <div className={`p-4 rounded-xl border-2 ${
                totalChallengesCompleted >= 10
                  ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300'
                  : 'bg-gray-50 border-gray-200 opacity-50'
              }`}>
                <div className="flex items-center gap-3">
                  <span className="text-3xl">⚡</span>
                  <div className="flex-1">
                    <div className="font-bold text-gray-900">Challenge Master</div>
                    <div className="text-sm text-gray-600">Complete 10 challenges</div>
                  </div>
                  {totalChallengesCompleted >= 10 && <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />}
                </div>
              </div>

              <div className={`p-4 rounded-xl border-2 ${
                challengeProgress.filter(p => p.best_score === 100).length >= 1
                  ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300'
                  : 'bg-gray-50 border-gray-200 opacity-50'
              }`}>
                <div className="flex items-center gap-3">
                  <span className="text-3xl">💯</span>
                  <div className="flex-1">
                    <div className="font-bold text-gray-900">Perfectionist</div>
                    <div className="text-sm text-gray-600">Score 100% on any challenge</div>
                  </div>
                  {challengeProgress.filter(p => p.best_score === 100).length >= 1 && (
                    <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                  )}
                </div>
              </div>

              <div className={`p-4 rounded-xl border-2 ${
                completedCareers >= 5
                  ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300'
                  : 'bg-gray-50 border-gray-200 opacity-50'
              }`}>
                <div className="flex items-center gap-3">
                  <span className="text-3xl">👑</span>
                  <div className="flex-1">
                    <div className="font-bold text-gray-900">Career Champion</div>
                    <div className="text-sm text-gray-600">Complete all 5 career islands</div>
                  </div>
                  {completedCareers >= 5 && <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />}
                </div>
              </div>

              <div className={`p-4 rounded-xl border-2 ${
                (profile?.level || 1) >= 10
                  ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300'
                  : 'bg-gray-50 border-gray-200 opacity-50'
              }`}>
                <div className="flex items-center gap-3">
                  <span className="text-3xl">🚀</span>
                  <div className="flex-1">
                    <div className="font-bold text-gray-900">Level 10 Legend</div>
                    <div className="text-sm text-gray-600">Reach level 10</div>
                  </div>
                  {(profile?.level || 1) >= 10 && <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
