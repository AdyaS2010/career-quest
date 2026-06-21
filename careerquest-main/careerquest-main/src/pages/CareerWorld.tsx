import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy, Star, Lock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Career, Challenge, UserChallengeProgress, ColorScheme } from '../lib/database.types';
import { CulinaryArtsGame } from '../games/CulinaryArts';
import { InformationTechnologyGame } from '../games/InformationTechnology';
import { LawGovernmentGame } from '../games/LawGovernment';
import { MediaCommunicationGame } from '../games/MediaCommunication';
import { HealthSciencesGame } from '../games/HealthSciences';

export function CareerWorld() {
  const { careerSlug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [career, setCareer] = useState<Career | null>(null);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [progress, setProgress] = useState<Record<string, UserChallengeProgress>>({});
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCareerData();
  }, [careerSlug]);

  const loadCareerData = async () => {
    try {
      const { data: careerData, error: careerError } = await supabase
        .from('careers')
        .select('*')
        .eq('slug', careerSlug)
        .maybeSingle();

      if (careerError) throw careerError;
      if (!careerData) {
        navigate('/');
        return;
      }

      setCareer(careerData);

      const { data: challengesData, error: challengesError } = await supabase
        .from('challenges')
        .select('*')
        .eq('career_id', careerData.id)
        .order('order_index');

      if (challengesError) throw challengesError;
      setChallenges(challengesData || []);

      if (user) {
        const { data: progressData } = await supabase
          .from('user_challenge_progress')
          .select('*')
          .eq('user_id', user.id)
          .in('challenge_id', (challengesData || []).map(c => c.id));

        const progressMap: Record<string, UserChallengeProgress> = {};
        progressData?.forEach(p => {
          progressMap[p.challenge_id] = p;
        });
        setProgress(progressMap);
      }
    } catch (error) {
      console.error('Error loading career data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChallengeComplete = async (challengeId: string, score: number) => {
    if (!user) return;

    try {
      const existingProgress = progress[challengeId];

      if (existingProgress) {
        const newBestScore = Math.max(existingProgress.best_score, score);
        await supabase
          .from('user_challenge_progress')
          .update({
            status: 'completed',
            score,
            best_score: newBestScore,
            attempts: existingProgress.attempts + 1,
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingProgress.id);
      } else {
        await supabase
          .from('user_challenge_progress')
          .insert({
            user_id: user.id,
            challenge_id: challengeId,
            status: 'completed',
            score,
            best_score: score,
            attempts: 1,
            completed_at: new Date().toISOString(),
          });
      }

      loadCareerData();
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!career) {
    return null;
  }

  if (selectedChallenge) {
    return (
      <div className="min-h-screen">
        {careerSlug === 'culinary-arts' && (
          <CulinaryArtsGame
            challenge={selectedChallenge}
            onComplete={(score) => {
              handleChallengeComplete(selectedChallenge.id, score);
              setSelectedChallenge(null);
            }}
            onExit={() => setSelectedChallenge(null)}
          />
        )}
        {careerSlug === 'information-technology' && (
          <InformationTechnologyGame
            challenge={selectedChallenge}
            onComplete={(score) => {
              handleChallengeComplete(selectedChallenge.id, score);
              setSelectedChallenge(null);
            }}
            onExit={() => setSelectedChallenge(null)}
          />
        )}
        {careerSlug === 'law-government' && (
          <LawGovernmentGame
            challenge={selectedChallenge}
            onComplete={(score) => {
              handleChallengeComplete(selectedChallenge.id, score);
              setSelectedChallenge(null);
            }}
            onExit={() => setSelectedChallenge(null)}
          />
        )}
        {careerSlug === 'media-communication' && (
          <MediaCommunicationGame
            challenge={selectedChallenge}
            onComplete={(score) => {
              handleChallengeComplete(selectedChallenge.id, score);
              setSelectedChallenge(null);
            }}
            onExit={() => setSelectedChallenge(null)}
          />
        )}
        {careerSlug === 'health-sciences' && (
          <HealthSciencesGame
            challenge={selectedChallenge}
            onComplete={(score) => {
              handleChallengeComplete(selectedChallenge.id, score);
              setSelectedChallenge(null);
            }}
            onExit={() => setSelectedChallenge(null)}
          />
        )}
      </div>
    );
  }

  const colorScheme = career.color_scheme as ColorScheme;

  const displayTitle = (() => {
    const slug = career.slug?.toLowerCase?.() || '';
    if (slug.includes('culinary')) return 'Chef';
    if (slug.includes('information')) return 'Software Engineering';
    if (slug.includes('law')) return 'Attorney';
    if (slug.includes('media')) return 'Journalist';
    if (slug.includes('health')) return 'Doctor';
    return career.name;
  })();


  return (
    <div
      className="min-h-screen"
      style={{
        background: `linear-gradient(135deg, ${colorScheme.background} 0%, ${colorScheme.accent}20 100%)`,
      }}
    >
      <nav
        className="sticky top-0 z-40 backdrop-blur-lg border-b shadow-sm"
        style={{
          backgroundColor: `${colorScheme.primary}20`,
          borderColor: `${colorScheme.primary}30`,
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-white/50 transition-all duration-300 hover:scale-105"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back to Home</span>
            </button>

            <h1 className="text-2xl font-bold" style={{ color: colorScheme.primary }}>
              {career.name}
            </h1>

            <div className="flex items-center gap-2 px-4 py-2 rounded-full" style={{ backgroundColor: `${colorScheme.secondary}15` }}>
              <Trophy className="w-5 h-5" style={{ color: colorScheme.secondary }} />
              <span className="font-semibold">
                {Object.values(progress).reduce((sum, p) => sum + p.best_score, 0)}
              </span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4 animate-fade-in">
            {displayTitle}
          </h2>
          <div className="text-md font-semibold mb-3 mb-6 animate-pulse" style={{ color: colorScheme.primary }}>
            {(() => {
              const slug = career.slug?.toLowerCase?.() || '';
              if (slug.includes('culinary')) return 'Whip up some delicious dishes and feel the heat of the kitchen!';
              if (slug.includes('information')) return 'Squash bugs, build features, and ship something awesome!!!';
              if (slug.includes('law')) return 'Think fast, argue sharper, and step into the courtroom spotlight!!';
              if (slug.includes('media')) return 'Hunt leads, interview sources, and craft headlines that matter~';
              if (slug.includes('health')) return 'Triage, diagnose, and make critical calls — be a lifesaver~~';
              return career.description;
            })()}
          </div>
          <p className="text-lg text-gray-700 max-w-2xl mx-auto">
            {career.description}
          </p>
        </div>

        <div className="space-y-6">
          {challenges.map((challenge, index) => {
            const challengeProgress = progress[challenge.id];
            const isLocked = index > 0 && !progress[challenges[index - 1].id];
            const isCompleted = challengeProgress?.status === 'completed';
            const progressPercentage = challengeProgress ? (challengeProgress.best_score / challenge.max_score) * 100 : 0;

            return (
              <div
                key={challenge.id}
                className={`challenge-card bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-300 ${
                  isLocked ? 'opacity-60 cursor-not-allowed' : 'hover:shadow-xl hover:scale-102'
                } ${!isLocked && 'glow-effect'}`}
              >
                <div
                  className="h-2 bg-gradient-to-r"
                  style={{
                    background: `linear-gradient(90deg, ${colorScheme.primary} 0%, ${colorScheme.secondary} 100%)`,
                  }}
                />

                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold shadow-md transition-transform hover:scale-110"
                          style={{ backgroundColor: colorScheme.primary }}
                        >
                          {index + 1}
                        </span>
                        <h3 className="text-xl font-bold text-gray-900">
                          {challenge.title}
                        </h3>
                        {isCompleted && (
                          <div className="badge-bounce">
                            <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                          </div>
                        )}
                        {isLocked && (
                          <Lock className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                      <p className="text-gray-600 ml-11">
                        {challenge.description}
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="text-2xl font-bold" style={{ color: colorScheme.primary }}>
                        {challengeProgress?.best_score || 0}
                      </div>
                      <div className="text-sm text-gray-500">
                        / {challenge.max_score}
                      </div>
                      {challengeProgress && (
                        <div className="mt-2 w-32 h-1 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r transition-all duration-500"
                            style={{
                              width: `${progressPercentage}%`,
                              background: `linear-gradient(90deg, ${colorScheme.primary} 0%, ${colorScheme.secondary} 100%)`,
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>{challenge.challenge_type.replace('_', ' ')}</span>
                      {challengeProgress && challengeProgress.attempts > 0 && (
                        <span>
                          <span className="inline-block px-2 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: `${colorScheme.primary}15`, color: colorScheme.primary }}>
                            {challengeProgress.attempts} attempt{challengeProgress.attempts !== 1 ? 's' : ''}
                          </span>
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => !isLocked && setSelectedChallenge(challenge)}
                      disabled={isLocked}
                      className="button-interactive px-6 py-2 rounded-lg font-semibold text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:scale-105 active:scale-95"
                      style={{
                        backgroundColor: isLocked ? '#9CA3AF' : colorScheme.primary,
                      }}
                    >
                      {isCompleted ? 'Play Again' : isLocked ? 'Locked' : 'Start Challenge'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
