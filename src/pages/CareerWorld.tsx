import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy, Star, Lock, Volume2, VolumeX, Moon, Sun, Sparkles, ExternalLink, X, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useAudio } from '../contexts/AudioContext';
import { useTheme } from '../contexts/ThemeContext';
import { useSimulation } from '../contexts/SimulationContext';
import type { Career, Challenge, UserChallengeProgress, ColorScheme } from '../lib/database.types';
import { RESOURCES, INTERNSHIP_LINKS } from './city/interiors';
import { CulinaryArtsGame } from '../games/CulinaryArts';
import { InformationTechnologyGame } from '../games/InformationTechnology';
import { LawGovernmentGame } from '../games/LawGovernment';
import { MediaCommunicationGame } from '../games/MediaCommunication';
import { HealthSciencesGame } from '../games/HealthSciences';
import { FinanceGame } from '../games/Finance';
import { EducationGame } from '../games/Education';
import { ArtsGame } from '../games/Arts';

const careerBriefContent: Record<string, {
  title: string;
  subtitle: string;
  lead: string;
  icon: string;
  speechIntro: string;
  bullets: string[];
  chips: { emoji: string; title: string; subtitle: string }[];
  quickFacts: { label: string; value: string }[];
  source: string;
}> = {
  'culinary-arts': {
    title: 'Culinary & Food Services',
    subtitle: 'Culinary Arts',
    lead: 'Run service like a real kitchen team: take accurate orders, execute under heat, and plate dishes guests remember.',
    icon: '👨‍🍳',
    speechIntro: "Welcome to the kitchen, chef! Fire up the stoves, prep your stations, and let's run the perfect dinner rush today!",
    bullets: [
      'Plan menus, source ingredients, and lead a kitchen team.',
      'Run service under time pressure while maintaining quality and safety.',
      'Manage food cost, waste, and supplier relationships.',
    ],
    chips: [
      { emoji: '🍴', title: 'Service Flow', subtitle: 'Front-of-house to pass line coordination' },
      { emoji: '⏱️', title: 'Speed Under Pressure', subtitle: 'Time windows, ticket pacing, quality control' },
      { emoji: '👨‍🍳', title: 'Culinary Craft', subtitle: 'Technique, precision, and presentation' },
    ],
    quickFacts: [
      { label: 'Expected salary range', value: '$42,000-$98,000 (culinary pathways, line cook to head cook/chef)' },
      { label: 'Median pay (May 2024)', value: '$60,990/year ($29.32/hour)' },
      { label: 'Job outlook (2024-34)', value: '7% (much faster than average)' },
      { label: 'Annual openings', value: '24,400 (projected)' },
      { label: 'Typical education', value: 'High school diploma or equivalent' },
      { label: 'Work experience', value: '5 years or more in related occupation' },
      { label: 'Total U.S. jobs (2024)', value: '197,300' },
    ],
    source: 'Source: U.S. Bureau of Labor Statistics, Occupational Outlook Handbook, Chefs and Head Cooks (last modified Aug 28, 2025), bls.gov/ooh/food-preparation-and-serving/chefs-and-head-cooks.htm',
  },
  'information-technology': {
    title: 'Information Technology & Software',
    subtitle: 'Software Engineering',
    lead: 'Build, debug, and ship reliable systems that solve real business and user problems.',
    icon: '💻',
    speechIntro: "System check complete! Dive into the code, track down those pesky bugs, and build something legendary today!",
    bullets: [
      'Diagnose bugs, implement fixes, and validate with tests.',
      'Design algorithms and system architecture with performance in mind.',
      'Collaborate with product and engineering teams to deliver software safely.',
    ],
    chips: [
      { emoji: '🛠️', title: 'Build & Ship', subtitle: 'Turn requirements into working features' },
      { emoji: '🐞', title: 'Debug Under Pressure', subtitle: 'Reproduce, diagnose, and fix fast' },
      { emoji: '🏗️', title: 'System Thinking', subtitle: 'Scalability, reliability, and tradeoffs' },
    ],
    quickFacts: [
      { label: 'Expected salary range (U.S.)', value: '$90,000-$185,000 (software engineering, entry to experienced)' },
      { label: 'Representative role', value: 'Software developers and related roles' },
      { label: 'Typical education', value: 'Postsecondary pathway; skills-first hiring also growing' },
      { label: 'Work pattern', value: 'Team-based delivery, iterative releases, on-call in some roles' },
    ],
    source: 'Source: U.S. Bureau of Labor Statistics Occupational Outlook Handbook, Software Developers.',
  },
  'law-government': {
    title: 'Law, Courts & Public Service',
    subtitle: 'Legal Practice',
    lead: 'Analyze evidence, apply legal standards, and advocate clearly in high-stakes scenarios.',
    icon: '⚖️',
    speechIntro: "All rise for the court of public service! Review your evidence, sharpen your arguments, and let justice be served!",
    bullets: [
      'Evaluate admissibility and relevance of evidence.',
      'Construct arguments with facts, rules, and precedents.',
      'Question witnesses to uncover contradictions and strengthen claims.',
    ],
    chips: [
      { emoji: '🧭', title: 'Case Strategy', subtitle: 'Build a theory of the case' },
      { emoji: '🔎', title: 'Evidence & Rules', subtitle: 'Relevance and admissibility analysis' },
      { emoji: '🎤', title: 'Persuasion', subtitle: 'Argue clearly under scrutiny' },
    ],
    quickFacts: [
      { label: 'Expected salary range (U.S.)', value: '$80,000-$235,000 (legal practice, early career to senior attorney)' },
      { label: 'Representative role', value: 'Lawyers and legal support occupations' },
      { label: 'Typical education', value: 'Professional degree for attorney track; other legal tracks vary' },
      { label: 'Work pattern', value: 'Research-intensive, deadline-driven, courtroom and advisory settings' },
    ],
    source: 'Source: U.S. Bureau of Labor Statistics Occupational Outlook Handbook, Lawyers.',
  },
  'media-communication': {
    title: 'Media, Journalism & Communication',
    subtitle: 'Journalism',
    lead: 'Verify facts, interview sources, and craft clear stories for public audiences.',
    icon: '🎙️',
    speechIntro: "We are live in three, two, one! Fact-check the news, interview the sources, and tell a story that makes headlines!",
    bullets: [
      'Fact-check claims against credible sources.',
      'Conduct interviews and capture clear, usable quotes.',
      'Structure stories with strong leads and evidence-backed narratives.',
    ],
    chips: [
      { emoji: '✅', title: 'Source & Verify', subtitle: 'Credibility and claim validation' },
      { emoji: '🎙️', title: 'Interview Craft', subtitle: 'Ask sharp questions, capture quotes' },
      { emoji: '📰', title: 'Storytelling', subtitle: 'Clarity, structure, and audience focus' },
    ],
    quickFacts: [
      { label: 'Expected salary range (U.S.)', value: '$40,000-$105,000 (journalism and reporting, market-dependent)' },
      { label: 'Representative role', value: 'News analysts, reporters, and journalists' },
      { label: 'Typical education', value: 'Bachelor-level preparation is common' },
      { label: 'Work pattern', value: 'Tight deadlines, cross-platform publishing, field and desk reporting' },
    ],
    source: 'Source: U.S. Bureau of Labor Statistics Occupational Outlook Handbook, News Analysts, Reporters, and Journalists.',
  },
  'health-sciences': {
    title: 'Health Sciences & Clinical Care',
    subtitle: 'Patient Care',
    lead: 'Assess symptoms, prioritize treatment, and make evidence-based decisions for patient safety.',
    icon: '🩺',
    speechIntro: "Triage team, stand by! Assess the vitals, prioritize treatment, and save lives in the clinic today!",
    bullets: [
      'Gather relevant clinical clues before diagnosis.',
      'Select safe, effective treatments and monitor outcomes.',
      'Triage and stabilize patients under time pressure.',
    ],
    chips: [
      { emoji: '🩺', title: 'Assess & Diagnose', subtitle: 'Clinical clues to differential diagnosis' },
      { emoji: '🚑', title: 'Triage Under Pressure', subtitle: 'Prioritize severity and act fast' },
      { emoji: '🛟', title: 'Patient Safety', subtitle: 'Protocol-driven, evidence-based care' },
    ],
    quickFacts: [
      { label: 'Expected salary range (U.S.)', value: '$68,000-$130,000 (patient-care pathways, RN-led benchmark)' },
      { label: 'Representative role', value: 'Registered nurses and allied clinical occupations' },
      { label: 'Typical education', value: 'Credentialed clinical training and licensure pathways' },
      { label: 'Work pattern', value: 'Shift-based care, teamwork, and protocol-driven decisions' },
    ],
    source: 'Source: U.S. Bureau of Labor Statistics Occupational Outlook Handbook, Registered Nurses.',
  },
  'financial-services': {
    title: 'Finance, Banking & Risk',
    subtitle: 'Banking Analyst',
    lead: 'Balance customer service, risk controls, and analytical judgment in financial operations.',
    icon: '💼',
    speechIntro: "Markets are open! Balance the books, assess the investment risks, and keep those assets perfectly secure!",
    bullets: [
      'Build balanced budgets and evaluate tradeoffs.',
      'Assess investments with risk-return discipline.',
      'Detect fraud patterns and protect financial integrity.',
    ],
    chips: [
      { emoji: '📊', title: 'Analyze & Budget', subtitle: 'Allocation strategy and cash discipline' },
      { emoji: '🛡️', title: 'Risk Control', subtitle: 'Spot anomalies and escalate fast' },
      { emoji: '🏦', title: 'Client Trust', subtitle: 'Accuracy, verification, and service' },
    ],
    quickFacts: [
      { label: 'Expected salary range (U.S.)', value: '$55,000-$175,000 (banking/finance analyst to senior risk tracks)' },
      { label: 'Representative role', value: 'Financial analysts, tellers, and compliance/risk roles' },
      { label: 'Typical education', value: 'Role-dependent; analytical and regulatory literacy is essential' },
      { label: 'Work pattern', value: 'Data-heavy analysis, customer trust, policy and controls' },
    ],
    source: 'Source: U.S. Bureau of Labor Statistics Occupational Outlook Handbook, Financial Analysts.',
  },
  education: {
    title: 'Education, Teaching & Leadership',
    subtitle: 'Teaching Lab',
    lead: 'Design instruction, manage classrooms, and support safe learning environments.',
    icon: '🍎',
    speechIntro: "Welcome to the classroom, educator! Design the perfect lesson plan, guide your students, and lead the way to bright futures!",
    bullets: [
      'Guide classroom behavior and maintain focus.',
      'Plan lessons aligned to clear learning goals.',
      'Coordinate responses during school safety scenarios.',
    ],
    chips: [
      { emoji: '📚', title: 'Lesson Design', subtitle: 'Objectives, activities, and assessment' },
      { emoji: '🏫', title: 'Classroom Flow', subtitle: 'Behavior guidance and attention' },
      { emoji: '🌱', title: 'Student Growth', subtitle: 'Measure mastery and support learners' },
    ],
    quickFacts: [
      { label: 'Expected salary range (U.S.)', value: '$50,000-$100,000 (teaching and instructional leadership pathways)' },
      { label: 'Representative role', value: 'Teachers and instructional leaders' },
      { label: 'Typical education', value: 'Degree + educator preparation; certification requirements vary' },
      { label: 'Work pattern', value: 'Student-facing instruction, planning, and family communication' },
    ],
    source: 'Source: U.S. Bureau of Labor Statistics Occupational Outlook Handbook, High School Teachers.',
  },
  'arts-entertainment': {
    title: 'Arts, Performance & Production',
    subtitle: 'Creative Studio',
    lead: 'Translate creative vision into polished performances and audience-ready experiences.',
    icon: '🎭',
    speechIntro: "Showtime! Set the lighting, hit your cues, and paint a masterpiece on stage today!",
    bullets: [
      'Apply color and visual design principles intentionally.',
      'Maintain rhythm, timing, and performance accuracy.',
      'Coordinate cues and execution in live production contexts.',
    ],
    chips: [
      { emoji: '🎨', title: 'Creative Vision', subtitle: 'Color, mood, and visual storytelling' },
      { emoji: '🎼', title: 'Performance Timing', subtitle: 'Rhythm, tempo, and precision' },
      { emoji: '🎬', title: 'Production Craft', subtitle: 'Cue timing and live execution' },
    ],
    quickFacts: [
      { label: 'Expected salary range (U.S.)', value: '$40,000-$120,000 (arts/design production, portfolio-driven)' },
      { label: 'Representative role', value: 'Designers, performers, and production specialists' },
      { label: 'Typical education', value: 'Portfolio, training, and apprenticeship pathways vary by role' },
      { label: 'Work pattern', value: 'Project-based schedules, rehearsals, and performance deadlines' },
    ],
    source: 'Source: U.S. Bureau of Labor Statistics Occupational Outlook Handbook, Graphic Designers and related creative occupations.',
  },
};

function getCareerBrief(careerSlug: string | undefined, career: Career | null) {
  const staticBrief = careerBriefContent[careerSlug || ''];
  if (staticBrief) return staticBrief;

  return {
    title: career?.name || '',
    subtitle: career?.name || '',
    lead: career?.description || '',
    icon: '🎯',
    speechIntro: career ? `Welcome to ${career.name}! Step into the workspace, complete the challenges, and build your career skills today!` : '',
    bullets: career ? [career.description, 'Complete each simulation to build skill.', 'Compare paths and track progress over time.'] : [],
    chips: [
      { emoji: '🎯', title: 'Hands-on', subtitle: 'Step into real on-the-job tasks' },
      { emoji: '⚡', title: 'Decision Speed', subtitle: 'Act under realistic pressure' },
      { emoji: '📈', title: 'Track Progress', subtitle: 'Score by subgame and mastery' },
    ],
    quickFacts: [
      { label: 'Expected salary range (U.S.)', value: 'Role-dependent; check current local labor market data for precise ranges' },
      { label: 'Career path', value: 'Hands-on simulation training' },
      { label: 'Skill focus', value: 'Decision quality, speed, and consistency' },
      { label: 'Progress model', value: 'Score by subgame and mastery over time' },
    ],
    source: 'Source: Career Quest curated career learning content.',
  };
}

export function CareerWorld() {
  const { careerSlug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { muted, toggleMute, startBgm, speak, cancelSpeech } = useAudio();
  const { theme, toggleTheme } = useTheme();
  const { enterSimulation, leaveSimulation } = useSimulation();

  const [career, setCareer] = useState<Career | null>(null);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [progress, setProgress] = useState<Record<string, UserChallengeProgress>>({});
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRes, setShowRes] = useState(false);
  const [showBrief, setShowBrief] = useState(true);

  const brief = getCareerBrief(careerSlug, career);

  // Trigger speech introduction when the career data finishes loading
  useEffect(() => {
    if (!loading && career) {
      const introText = brief.speechIntro || `Welcome to ${career.name}! Step into the workspace, complete the challenges, and build your career skills today!`;
      speak(introText);
    }
    return () => {
      cancelSpeech();
    };
  }, [loading, career, brief.speechIntro, speak, cancelSpeech]);

  useEffect(() => {
    loadCareerData();
  }, [careerSlug]);

  // Inside a career world (and its simulations) the playful 8-bit "Adventure
  // Theme" takes over; leaving hands the music back to the serene city stroll.
  useEffect(() => {
    startBgm('chip');
    return () => startBgm('serene');
  }, [startBgm]);

  // Show the career briefing (job description + BLS quick facts) each time a world is entered.
  useEffect(() => {
    setShowBrief(Boolean(careerSlug));
  }, [careerSlug]);

  // While a game is open, surface the simulation control rail (Back / Volume /
  // Brightness). Back exits straight back to the career world.
  useEffect(() => {
    if (selectedChallenge) enterSimulation(() => setSelectedChallenge(null));
    else leaveSimulation();
    return () => leaveSimulation();
  }, [selectedChallenge, enterSimulation, leaveSimulation]);

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
      <div className="min-h-screen" style={{ background: '#05070f' }} />
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

  // Adjust colors for dark mode - keep dark mode truly dark for text readability
  const bgGradient = theme === 'dark'
    ? 'linear-gradient(180deg, #162033 0%, #131a2e 30%, #1a1040 60%, #0f172a 100%)'
    : `linear-gradient(135deg, ${colorScheme.background} 0%, ${colorScheme.accent}20 100%)`;


  const getChallengeMeta = (slug: string, challenge: Challenge) => {
    const raw = String((challenge.config as any)?.subType || '').toLowerCase();
    const key = raw.replace('-challenge', '');

    const metaMap: Record<string, Record<string, { icon: string; station: string; focus: string; tips: string[]; accent?: string }>> = {
      'culinary-arts': {
        'order-taking': { icon: '🧾', station: 'Front Of House', focus: 'Guest communication and order accuracy', accent: '#f97316', tips: ['Confirm modifiers', 'Repeat order back', 'Prioritize timing'] },
        cooking: { icon: '🔥', station: 'Hot Line', focus: 'Heat control, sequence, and execution speed', accent: '#ef4444', tips: ['Mise en place', 'Control heat', 'Plate immediately'] },
        'plate-presentation': { icon: '🍽️', station: 'Pass Station', focus: 'Visual appeal and finishing precision', accent: '#f59e0b', tips: ['Balance colors', 'Clean edges', 'Consistent portions'] },
      },
      'information-technology': {
        'bug-hunt': { icon: '🪲', station: 'Debug Bay', focus: 'Root-cause analysis and code correction', tips: ['Reproduce issue', 'Read stack traces', 'Retest fix'] },
        'algorithm-builder': { icon: '🧠', station: 'Logic Lab', focus: 'Stepwise reasoning and algorithm design', tips: ['Break into steps', 'Check edge cases', 'Validate output'] },
        'system-design': { icon: '🏗️', station: 'Architecture Room', focus: 'Scalability, reliability, and tradeoffs', tips: ['Define requirements', 'Map components', 'Balance cost/perf'] },
      },
      'law-government': {
        'evidence-detective': { icon: '🔎', station: 'Evidence Desk', focus: 'Relevance and admissibility analysis', tips: ['Separate fact/opinion', 'Flag inadmissible', 'Document rationale'] },
        'courtroom-arguments': { icon: '🧾', station: 'Briefing Table', focus: 'Argument structure and precedent use', tips: ['Lead with thesis', 'Cite support', 'Address counterpoints'] },
        'cross-examination': { icon: '🎤', station: 'Witness Stand', focus: 'Question sequencing and contradiction spotting', tips: ['Ask narrow questions', 'Control pacing', 'Lock admissions'] },
      },
      'media-communication': {
        'fact-check': { icon: '✅', station: 'Verification Desk', focus: 'Source credibility and claim validation', tips: ['Triangulate sources', 'Check timestamps', 'Avoid assumptions'] },
        'interview-master': { icon: '🎙️', station: 'Interview Booth', focus: 'Question quality and quote extraction', tips: ['Open-ended prompts', 'Follow-up deeply', 'Capture exact quotes'] },
        'story-crafter': { icon: '📰', station: 'Editorial Room', focus: 'Narrative flow and audience clarity', tips: ['Strong lead', 'Evidence first', 'Tight structure'] },
      },
      'health-sciences': {
        'symptom-detective': { icon: '🩺', station: 'Triage Bay', focus: 'Clinical clues and differential diagnosis', tips: ['Collect key findings', 'Prioritize severity', 'Confirm evidence'] },
        'treatment-planner': { icon: '💊', station: 'Care Planning', focus: 'Therapeutic safety and effectiveness', tips: ['Check contraindications', 'Match treatment', 'Monitor response'] },
        'emergency-room-rush': { icon: '🚑', station: 'Emergency Unit', focus: 'Rapid triage and stabilization', tips: ['Treat critical first', 'Track vitals', 'Coordinate handoffs'] },
      },
      'financial-services': {
        'budget-balancer': { icon: '📊', station: 'Budget Office', focus: 'Allocation strategy and cash discipline', tips: ['Protect essentials', 'Limit leakage', 'Review variance'] },
        'investment-simulator': { icon: '📈', station: 'Portfolio Desk', focus: 'Risk-adjusted investment decisions', tips: ['Diversify', 'Assess risk', 'Rebalance wisely'] },
        'fraud-detector': { icon: '🛡️', station: 'Risk Control', focus: 'Anomaly detection and escalation', tips: ['Spot patterns', 'Verify anomalies', 'Escalate fast'] },
        'bank-teller': { icon: '🏦', station: 'Client Counter', focus: 'Accuracy, verification, and trust', tips: ['Verify identity', 'Process precisely', 'Communicate clearly'] },
      },
      education: {
        'classroom-conductor': { icon: '🏫', station: 'Classroom Floor', focus: 'Behavior guidance and attention flow', tips: ['Set expectations', 'Use redirects', 'Keep momentum'] },
        'lesson-plan-lab': { icon: '📚', station: 'Planning Board', focus: 'Objective alignment and assessment', tips: ['Define outcomes', 'Sequence activities', 'Measure mastery'] },
        'school-crisis-manager': { icon: '🚨', station: 'Safety Desk', focus: 'Response sequencing and communication', tips: ['Prioritize safety', 'Follow protocol', 'Coordinate roles'] },
      },
      'arts-entertainment': {
        'color-theory-studio': { icon: '🎨', station: 'Palette Room', focus: 'Mood, contrast, and visual storytelling', tips: ['Set mood palette', 'Balance contrast', 'Refine composition'] },
        'rhythm-sight-reading': { icon: '🎼', station: 'Rehearsal Hall', focus: 'Timing precision and musical fluency', tips: ['Read ahead', 'Keep tempo', 'Correct quickly'] },
        'broadway-lead': { icon: '🎬', station: 'Stage Deck', focus: 'Cue timing and live performance control', tips: ['Track cues', 'Coordinate teams', 'Hold consistency'] },
      },
    };
    const careerMap = metaMap[slug] || {};
    return careerMap[key] || {
      icon: brief.icon,
      station: 'Mission Zone',
      focus: challenge.description,
      tips: ['Analyze objective', 'Execute cleanly', 'Review results'],
    } as { icon: string; station: string; focus: string; tips: string[]; accent?: string };
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
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

      <main className={`max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 transition-all ${showBrief ? 'pointer-events-none blur-[2px]' : ''}`}>
        {/* Simulation deck header */}
        <section className="mb-8">
          <div className="rounded-3xl border p-6 shadow-xl"
            style={{
              background: theme === 'dark'
                ? `linear-gradient(140deg, ${colorScheme.primary}22, ${colorScheme.secondary}20)`
                : `linear-gradient(140deg, ${colorScheme.background}, ${colorScheme.accent}22)`,
              borderColor: `${colorScheme.primary}40`,
            }}>
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2 className="text-3xl md:text-4xl font-black mb-2" style={{ color: 'var(--text-primary)' }}>
                  {brief.subtitle} Simulation Deck
                </h2>
                <p className="text-base" style={{ color: 'var(--text-secondary)' }}>
                  {brief.lead}
                </p>
              </div>
              <div className="text-5xl">{brief.icon}</div>
            </div>

            <div className="grid sm:grid-cols-3 gap-3">
              {brief.chips.map((chip) => (
                <div key={chip.title} className="rounded-2xl p-4" style={{ backgroundColor: theme === 'dark' ? 'rgba(15,23,42,0.6)' : 'rgba(255,255,255,0.75)' }}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base">{chip.emoji}</span>
                    <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{chip.title}</span>
                  </div>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{chip.subtitle}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Station cards */}
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 items-stretch">
          {challenges.map((challenge, index) => {
            const challengeProgress = progress[challenge.id];
            const prevOrderIndex = challenge.order_index - 1;
            const isLocked = prevOrderIndex > 0 && challenges
              .filter(c => c.order_index === prevOrderIndex)
              .some(c => !progress[c.id] || progress[c.id].status !== 'completed');

            const isCompleted = challengeProgress?.status === 'completed';
            const meta = getChallengeMeta(careerSlug || '', challenge);
            const paneAccent = meta.accent || [colorScheme.primary, colorScheme.secondary, colorScheme.accent][index % 3];

            return (
              <div
                key={challenge.id}
                className={`relative rounded-3xl border overflow-hidden transition-all duration-500 ease-out hover:scale-[1.03] hover:-translate-y-2 h-full ${isLocked ? 'opacity-65' : 'hover:shadow-2xl'}`}
                style={{
                  backgroundColor: 'var(--surface-card)',
                  borderColor: `${paneAccent}66`,
                  boxShadow: theme === 'dark'
                    ? `0 12px 24px rgba(2,6,23,0.45), 0 3px 10px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06)`
                    : `0 14px 24px rgba(15,23,42,0.12), 0 4px 10px rgba(15,23,42,0.1), inset 0 1px 0 rgba(255,255,255,0.7)`,
                }}
              >
                <div
                  className="pointer-events-none absolute inset-0 rounded-3xl"
                  style={{ background: 'linear-gradient(165deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.02) 36%, transparent 60%)' }}
                />
                <div
                  className="pointer-events-none absolute inset-y-0 right-0 w-6"
                  style={{ background: `linear-gradient(90deg, transparent 0%, ${paneAccent}26 100%)` }}
                />
                <div className="flex flex-col h-full">
                  <div className="p-5 border-b" style={{ background: `linear-gradient(145deg, ${paneAccent}30, ${paneAccent}12)` }}>
                    <div className="text-4xl mb-3">{meta.icon}</div>
                    <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-secondary)' }}>Station</p>
                    <p className="text-base font-black mb-3" style={{ color: 'var(--text-primary)' }}>{meta.station}</p>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{meta.focus}</p>
                  </div>

                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="w-7 h-7 rounded-full inline-flex items-center justify-center text-white text-sm font-black" style={{ backgroundColor: paneAccent }}>
                            {index + 1}
                          </span>
                          <h3 className="text-xl font-black" style={{ color: 'var(--text-primary)' }}>{challenge.title}</h3>
                          {isCompleted && <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />}
                          {isLocked && <Lock className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />}
                        </div>
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{challenge.description}</p>
                      </div>

                      <div className="text-right">
                        <div className="text-2xl font-black" style={{ color: cardScoreColor }}>{challengeProgress?.best_score || 0}</div>
                        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>/ {challenge.max_score}</div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {meta.tips.map((tip) => (
                        <span key={`${challenge.id}-${tip}`} className="px-3 py-1 rounded-full text-xs font-semibold"
                          style={{ backgroundColor: theme === 'dark' ? 'rgba(51,65,85,0.75)' : '#f1f5f9', color: 'var(--text-secondary)' }}>
                          {tip}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between gap-4 mt-auto pt-3">
                      <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {challenge.challenge_type.replace('_', ' ')}
                        {challengeProgress && challengeProgress.attempts > 0 && ` · ${challengeProgress.attempts} attempt${challengeProgress.attempts !== 1 ? 's' : ''}`}
                      </div>

                      <button
                        onClick={() => !isLocked && setSelectedChallenge(challenge)}
                        disabled={isLocked}
                        className="px-6 py-2.5 rounded-xl font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110"
                        style={{ backgroundColor: isLocked ? '#9CA3AF' : paneAccent }}
                      >
                        {isCompleted ? 'Play Again' : isLocked ? 'Locked' : 'Start Challenge'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
          );
        })}
        </section>
      </main>

      {/* Next Steps — real-world project + resources for this field */}
      {showRes && (() => { const r = RESOURCES[careerSlug || '']; if (!r) return null; return createPortal(
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
        </div>,
        document.body
      ); })()}

      {/* Career briefing — job description + BLS Quick Facts, shown on entry */}
      {showBrief && createPortal(
        <div className="fixed inset-0 z-[150] bg-black/45 flex items-center justify-center p-4">
          <div
            className="w-full max-w-3xl rounded-2xl border shadow-2xl overflow-hidden max-h-[92vh] overflow-y-auto"
            style={{
              backgroundColor: 'var(--surface-card)',
              borderColor: `${colorScheme.primary}45`,
            }}
          >
            <div className="h-3" style={{ background: `linear-gradient(90deg, ${colorScheme.primary}, ${colorScheme.secondary})` }} />

            <div className="p-6 md:p-7">
              <h2 className="text-3xl md:text-4xl font-black mb-1" style={{ color: 'var(--text-primary)' }}>{brief.title}</h2>
              <p className="text-sm tracking-widest font-bold mb-6 uppercase" style={{ color: 'var(--text-secondary)' }}>{brief.subtitle}</p>

              <div className="mb-7">
                <h3 className="text-2xl font-black mb-3" style={{ color: textHighlight }}>What You'll Do</h3>
                <ul className="space-y-1.5 text-base md:text-lg" style={{ color: 'var(--text-secondary)' }}>
                  {brief.bullets.map((line) => <li key={line}>• {line}</li>)}
                </ul>
              </div>

              <div className="mb-6 rounded-xl p-4" style={{ backgroundColor: theme === 'dark' ? 'rgba(30,41,59,0.5)' : `${colorScheme.background}` }}>
                <div className="flex items-center gap-2 mb-2" style={{ color: textHighlight }}>
                  <BarChart3 className="w-5 h-5" />
                  <h3 className="text-xl font-black">BLS Quick Facts</h3>
                </div>
                <div className="text-sm md:text-base leading-snug space-y-1" style={{ color: 'var(--text-secondary)' }}>
                  {brief.quickFacts.map((fact) => (
                    <p key={fact.label}><span className="font-bold" style={{ color: 'var(--text-primary)' }}>{fact.label}:</span> {fact.value}</p>
                  ))}
                </div>
                <p className="text-[11px] mt-2" style={{ color: 'var(--text-muted)' }}>
                  {brief.source}
                </p>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => navigate('/')}
                  className="px-5 py-2.5 rounded-lg font-semibold"
                  style={{ backgroundColor: theme === 'dark' ? 'rgba(100,116,139,0.35)' : '#e2e8f0', color: 'var(--text-primary)' }}
                >
                  Leave
                </button>
                <button
                  onClick={() => setShowBrief(false)}
                  className="px-6 py-2.5 rounded-lg font-black tracking-wide text-white"
                  style={{ backgroundColor: colorScheme.primary }}
                >
                  Start Job
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </motion.div>
  );
}
