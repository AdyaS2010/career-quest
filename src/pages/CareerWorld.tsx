import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy, Star, Lock, Volume2, VolumeX, Moon, Sun, Sparkles, ExternalLink, X, Play } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useAudio } from '../contexts/AudioContext';
import { useTheme } from '../contexts/ThemeContext';
import type { Career, Challenge, UserChallengeProgress, ColorScheme } from '../lib/database.types';
import { interiorFor, RESOURCES, INTERNSHIP_LINKS } from './city/interiors';
import { scenarioFor } from './city/scenarios';
import { WorldIntro } from '../components/WorldIntro';
import { CulinaryArtsGame } from '../games/CulinaryArts';
import { InformationTechnologyGame } from '../games/InformationTechnology';
import { LawGovernmentGame } from '../games/LawGovernment';
import { MediaCommunicationGame } from '../games/MediaCommunication';
import { HealthSciencesGame } from '../games/HealthSciences';
import { FinanceGame } from '../games/Finance';
import { EducationGame } from '../games/Education';
import { ArtsGame } from '../games/Arts';

export function CareerWorld() {
  const { careerSlug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { muted, toggleMute } = useAudio();
  const { theme, toggleTheme } = useTheme();

  const [career, setCareer] = useState<Career | null>(null);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [progress, setProgress] = useState<Record<string, UserChallengeProgress>>({});
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRes, setShowRes] = useState(false);
  const [showIntro, setShowIntro] = useState(false);

  useEffect(() => {
    loadCareerData();
  }, [careerSlug]);

  // First time stepping into a world, play its cold-open scenario (NGPF style).
  useEffect(() => {
    if (!user || !careerSlug || !scenarioFor(careerSlug)) return;
    try { if (!localStorage.getItem(`questford_entered_${careerSlug}_${user.id}`)) setShowIntro(true); } catch { /* ignore */ }
  }, [user, careerSlug]);

  const finishIntro = () => {
    setShowIntro(false);
    try { if (user && careerSlug) localStorage.setItem(`questford_entered_${careerSlug}_${user.id}`, '1'); } catch { /* ignore */ }
  };

  const loadCareerData = async () => {
    if (!careerSlug) {
      navigate('/');
      return;
    }

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

      const { data: challengesData, error: challengesError } = await (supabase
        .from('challenges') as any)
        .select('*')
        .eq('career_id', (careerData as any).id)
        .order('order_index');

      if (challengesError) throw challengesError;
      const typedChallenges = (challengesData || []) as Challenge[];
      setChallenges(typedChallenges);

      if (user) {
        const { data: progressData } = await supabase
          .from('user_challenge_progress')
          .select('*')
          .eq('user_id', user.id)
          .in('challenge_id', typedChallenges.map(c => c.id));

        const typedProgressData = (progressData || []) as UserChallengeProgress[];
        const progressMap: Record<string, UserChallengeProgress> = {};
        typedProgressData.forEach(p => {
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
    if (!user || !career) return;

    try {
      const existingProgress = progress[challengeId];

      // Step 1: Update or insert the challenge progress
      if (existingProgress) {
        await (supabase
          .from('user_challenge_progress') as any)
          .update({
            status: 'completed',
            score,
            best_score: Math.max(existingProgress.best_score, score),
            attempts: existingProgress.attempts + 1,
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingProgress.id);
      } else {
        await (supabase
          .from('user_challenge_progress') as any)
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

      // Step 2: Re-fetch ALL challenge progress for THIS career to get accurate totals
      const { data: careerChallengeProgress } = await (supabase
        .from('user_challenge_progress') as any)
        .select('best_score, challenge_id')
        .eq('user_id', user.id)
        .in('challenge_id', challenges.map(c => c.id));

      const typedCareerProgress = (careerChallengeProgress || []) as { best_score: number; challenge_id: string }[];
      const careerTotalScore = typedCareerProgress.reduce((sum: number, p: { best_score: number }) => sum + p.best_score, 0);

      // Step 3: Check career completion status
      const completedChallengeIds = new Set(typedCareerProgress.map((p: { challenge_id: string }) => p.challenge_id));
      const allChallengesCompleted = challenges.every(c => completedChallengeIds.has(c.id));

      // Step 4: Update or insert user_career_progress with accurate score
      const { data: existingCareerProgress } = await supabase
        .from('user_career_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('career_id', career.id)
        .maybeSingle();

      const typedCareerProg = existingCareerProgress as { id: string; status: string } | null;

      if (typedCareerProg) {
        await (supabase
          .from('user_career_progress') as any)
          .update({
            score: careerTotalScore,
            status: allChallengesCompleted ? 'completed' : 'in_progress',
            completed_at: allChallengesCompleted ? new Date().toISOString() : null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', typedCareerProg.id);
      } else {
        await (supabase
          .from('user_career_progress') as any)
          .insert({
            user_id: user.id,
            career_id: career.id,
            score: careerTotalScore,
            status: allChallengesCompleted ? 'completed' : 'in_progress',
            started_at: new Date().toISOString(),
            completed_at: allChallengesCompleted ? new Date().toISOString() : null,
          });
      }

      // Step 5: Re-fetch ALL challenge progress across ALL careers for true total
      const { data: allChallengeProgress } = await (supabase
        .from('user_challenge_progress') as any)
        .select('best_score')
        .eq('user_id', user.id);

      const typedAllProgress = (allChallengeProgress || []) as { best_score: number }[];
      const totalScore = typedAllProgress.reduce((sum: number, p: { best_score: number }) => sum + p.best_score, 0);
      const newLevel = Math.floor(totalScore / 100) + 1;

      // Step 6: Update profile with accurate totals
      await (supabase
        .from('profiles') as any)
        .update({
          total_score: totalScore,
          experience: totalScore,
          level: newLevel,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      // Reload data to reflect changes
      loadCareerData();
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  };

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--bg-primary)' }}
      >
        <div
          className="w-16 h-16 border-4 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: 'var(--accent-primary)', borderTopColor: 'transparent' }}
        />
      </div>
    );
  }

  if (!career) {
    return null;
  }

  // Cold-open scenario takes over the screen on first entry (or on replay).
  if (showIntro) {
    const m = interiorFor(careerSlug || '');
    const cs = career.color_scheme as unknown as ColorScheme;
    return (
      <WorldIntro
        slug={careerSlug || ''}
        careerName={career.name}
        roomName={m.room}
        mentorName={m.mentorName}
        mentorFace={m.mentorFace}
        color={{ primary: cs.primary, accent: cs.accent, secondary: cs.secondary }}
        userId={user?.id ?? null}
        onDone={finishIntro}
      />
    );
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
        {careerSlug === 'financial-services' && (
          <FinanceGame
            challenge={selectedChallenge}
            onComplete={(score) => {
              handleChallengeComplete(selectedChallenge.id, score);
              setSelectedChallenge(null);
            }}
            onExit={() => setSelectedChallenge(null)}
          />
        )}
        {careerSlug === 'education' && (
          <EducationGame
            challenge={selectedChallenge}
            onComplete={(score) => {
              handleChallengeComplete(selectedChallenge.id, score);
              setSelectedChallenge(null);
            }}
            onExit={() => setSelectedChallenge(null)}
          />
        )}
        {careerSlug === 'arts-entertainment' && (
          <ArtsGame
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

  const colorScheme = career.color_scheme as unknown as ColorScheme;

  // In dark mode, lighten the career colors for better readability
  const textHighlight = theme === 'dark' ? colorScheme.accent : colorScheme.primary;
  const cardScoreColor = theme === 'dark' ? colorScheme.accent : colorScheme.primary;
  const btnBg = theme === 'dark' ? colorScheme.accent : colorScheme.primary;

  // Adjust colors for dark mode - keep dark mode truly dark for text readability
  const bgGradient = theme === 'dark'
    ? 'linear-gradient(180deg, #162033 0%, #131a2e 30%, #1a1040 60%, #0f172a 100%)'
    : `linear-gradient(135deg, ${colorScheme.background} 0%, ${colorScheme.accent}20 100%)`;

  return (
    <div
      className="min-h-screen"
      style={{ background: theme === 'dark' ? `#0f172a ${bgGradient}` : bgGradient }}
    >
      <nav
        className="sticky top-0 z-40 backdrop-blur-lg border-b shadow-sm"
        style={{
          backgroundColor: 'var(--nav-bg)',
          borderColor: theme === 'dark' ? `${colorScheme.primary}30` : `${colorScheme.primary}30`,
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/5"
              style={{ color: 'var(--text-primary)' }}
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">City</span>
            </button>

            <h1 className="text-2xl font-bold truncate px-2" style={{ color: textHighlight }}>
              {career.name}
            </h1>

            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-1.5">
                <Trophy className="w-5 h-5" style={{ color: theme === 'dark' ? colorScheme.accent : colorScheme.secondary }} />
                <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {Object.values(progress).reduce((sum, p) => sum + p.best_score, 0)}
                </span>
              </div>
              <button
                onClick={() => setShowRes(true)}
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold text-sm transition-colors"
                style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.4)' }}
                title="Real-world next steps"
              >
                <Sparkles className="w-4 h-4" /> Next Steps
              </button>
              <button
                onClick={() => toggleMute()}
                className="p-2 rounded-lg transition-colors"
                style={{ backgroundColor: 'var(--surface-card)', color: 'var(--text-secondary)' }}
                title={muted ? "Unmute" : "Mute"}
              >
                {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg transition-colors"
                style={{ backgroundColor: 'var(--surface-card)', color: 'var(--text-secondary)' }}
              >
                {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <h2 className="text-3xl sm:text-4xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
            Welcome to {career.name}
          </h2>
          <p className="text-base sm:text-lg max-w-2xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
            {career.description}
          </p>
        </div>

        {/* mentor brief — sets the scene like a real workplace */}
        {(() => { const m = interiorFor(careerSlug || ''); return (
          <div className="flex items-start gap-3 max-w-2xl mx-auto mb-10 p-4 rounded-2xl shadow-lg"
            style={{ background: 'var(--surface-card)', border: `1px solid ${colorScheme.primary}33` }}>
            <div className="shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ background: `${colorScheme.primary}22` }}>{m.mentorFace}</div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-black uppercase tracking-widest mb-0.5" style={{ color: colorScheme.primary }}>{m.mentorName} · your mentor</div>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{m.mentorLine}</p>
            </div>
            {scenarioFor(careerSlug || '') && (
              <button onClick={() => setShowIntro(true)}
                className="shrink-0 self-center flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold text-sm text-white transition-transform hover:scale-105 active:scale-95"
                style={{ background: colorScheme.primary }} title="Replay the opening scenario">
                <Play className="w-4 h-4 fill-white" /> Scenario
              </button>
            )}
          </div>
        ); })()}

        <div className="space-y-6">
          {challenges.map((challenge, index) => {
            const challengeProgress = progress[challenge.id];
            const prevOrderIndex = challenge.order_index - 1;
            const isLocked = prevOrderIndex > 0 && challenges
              .filter(c => c.order_index === prevOrderIndex)
              .some(c => !progress[c.id] || progress[c.id].status !== 'completed');

            const isCompleted = challengeProgress?.status === 'completed';

            return (
              <div
                key={challenge.id}
                className={`rounded-2xl shadow-lg overflow-hidden transition-all ${isLocked ? 'opacity-60' : 'hover:shadow-xl'}`}
                style={{ backgroundColor: 'var(--surface-card)' }}
              >
                <div
                  className="h-2"
                  style={{
                    background: `linear-gradient(90deg, ${colorScheme.primary} 0%, ${colorScheme.secondary} 100%)`,
                  }}
                />

                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold"
                          style={{ backgroundColor: colorScheme.primary }}
                        >
                          {index + 1}
                        </span>
                        <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                          {challenge.title}
                        </h3>
                        {isCompleted && (
                          <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                        )}
                        {isLocked && (
                          <Lock className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
                        )}
                      </div>
                      <p className="ml-11" style={{ color: 'var(--text-secondary)' }}>
                        {challenge.description}
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="text-2xl font-bold" style={{ color: cardScoreColor }}>
                        {challengeProgress?.best_score || 0}
                      </div>
                      <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
                        / {challenge.max_score}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
                      <span>{challenge.challenge_type.replace('_', ' ')}</span>
                      {challengeProgress && challengeProgress.attempts > 0 && (
                        <span>{challengeProgress.attempts} attempt{challengeProgress.attempts !== 1 ? 's' : ''}</span>
                      )}
                    </div>

                    <button
                      onClick={() => !isLocked && setSelectedChallenge(challenge)}
                      disabled={isLocked}
                      className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110 hover:scale-[1.03] active:scale-95"
                      style={{
                        backgroundColor: isLocked ? '#9CA3AF' : btnBg,
                      }}
                    >
                      {isLocked ? <Lock className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
                      {isCompleted ? 'Play Again' : isLocked ? 'Locked' : 'Start Simulation'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Next Steps — real-world project + resources for this field */}
      {showRes && (() => { const r = RESOURCES[careerSlug || '']; if (!r) return null; return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" style={{ background: 'rgba(2,6,23,0.62)', backdropFilter: 'blur(3px)' }} onClick={() => setShowRes(false)}>
          <div className="w-full max-w-md rounded-3xl border-4 shadow-2xl overflow-hidden" style={{ background: 'linear-gradient(160deg,#0f1f1a,#0b1220)', borderColor: '#34d399' }} onClick={e => e.stopPropagation()}>
            <div className="relative px-5 py-4 border-b border-white/10" style={{ background: 'linear-gradient(180deg, rgba(52,211,153,0.16), transparent)' }}>
              <button onClick={() => setShowRes(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
              <div className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-emerald-300" /><span className="font-bold text-white text-xl">Next Steps · {career.name}</span></div>
              <p className="text-slate-300 text-xs mt-1">Loved this field? Take it into the real world.</p>
            </div>
            <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
              <div>
                <div className="text-emerald-300 text-[11px] font-black uppercase tracking-widest mb-1">Portfolio project</div>
                <p className="text-white text-sm leading-relaxed">{r.project}</p>
              </div>
              <div>
                <div className="text-emerald-300 text-[11px] font-black uppercase tracking-widest mb-2">Learn it for real</div>
                <div className="space-y-2">
                  {r.links.map(l => (
                    <a key={l.url} href={l.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between gap-2 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors group">
                      <span className="text-white font-bold text-sm">{l.label}</span><ExternalLink className="w-4 h-4 text-emerald-300 group-hover:scale-110 transition-transform" />
                    </a>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-emerald-300 text-[11px] font-black uppercase tracking-widest mb-2">Find internships</div>
                <div className="flex flex-wrap gap-2">
                  {INTERNSHIP_LINKS.map(l => (
                    <a key={l.url} href={l.url} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-400/30 text-emerald-200 text-xs font-bold hover:bg-emerald-500/25 transition-colors">{l.label}</a>
                  ))}
                </div>
              </div>
            </div>
            <button onClick={() => setShowRes(false)} className="w-full py-3.5 font-black text-slate-900" style={{ background: '#34d399' }}>Got it</button>
          </div>
        </div>
      ); })()}
    </div>
  );
}
