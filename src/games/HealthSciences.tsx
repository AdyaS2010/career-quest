import { useState, useEffect } from 'react';
import { Clock, Trophy, X } from 'lucide-react';
import type { Challenge } from '../lib/database.types';
import { SymptomDetectiveChallenge } from './health/SymptomDetectiveChallenge';
import { TreatmentPlannerChallenge } from './health/TreatmentPlannerChallenge';
import { EmergencyRoomRushChallenge } from './health/EmergencyRoomRushChallenge';

interface HealthSciencesGameProps {
  challenge: Challenge;
  onComplete: (score: number) => void;
  onExit: () => void;
}

export function HealthSciencesGame({ challenge, onComplete, onExit }: HealthSciencesGameProps) {
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'complete'>('intro');
  const [score, setScore] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);

  useEffect(() => {
    if (gameState === 'playing') {
      const timer = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [gameState]);

  const handleChallengeComplete = (finalScore: number) => {
    setScore(finalScore);
    setGameState('complete');
  };

  const handleFinish = () => {
    onComplete(score);
  };

  const config = challenge.config as { subType: string };
  const subType = config?.subType || '';

  if (gameState === 'intro') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-rose-50 p-6">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={onExit}
            className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <X className="w-5 h-5" />
            Exit
          </button>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <div className="text-8xl mb-4">🏥</div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                {challenge.title}
              </h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                {challenge.description}
              </p>
            </div>

            <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-xl p-6 mb-8">
              <h3 className="font-bold text-gray-900 mb-4">Your Mission:</h3>
              <div className="space-y-2 text-gray-700">
                {subType === 'symptom-detective' && (
                  <>
                    <p>🔍 Examine patients by selecting diagnostic actions</p>
                    <p>📊 Gather clues from vitals, symptoms, and medical history</p>
                    <p>💊 Make accurate diagnoses based on evidence</p>
                    <p>⚡ Work efficiently to maximize your score</p>
                  </>
                )}
                {subType === 'treatment-planner' && (
                  <>
                    <p>💊 Prescribe appropriate medications and treatments</p>
                    <p>⚖️ Balance effectiveness, safety, and patient compliance</p>
                    <p>🔍 Avoid dangerous drug interactions and contraindications</p>
                    <p>✅ Monitor patient outcomes to ensure recovery</p>
                  </>
                )}
                {subType === 'emergency-room-rush' && (
                  <>
                    <p>🚨 Triage incoming patients by severity level</p>
                    <p>⏱️ Treat critical patients first to save lives</p>
                    <p>🏥 Manage multiple patients arriving simultaneously</p>
                    <p>💯 Keep all patients stable under time pressure</p>
                  </>
                )}
              </div>
            </div>

            <div className="text-center">
              <button
                onClick={() => setGameState('playing')}
                className="px-8 py-4 bg-gradient-to-r from-red-600 to-pink-600 text-white text-xl font-bold rounded-xl hover:from-red-700 hover:to-pink-700 transition-all transform hover:scale-105 shadow-lg"
              >
                Start Challenge
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'complete') {
    const stars = score >= 90 ? 3 : score >= 70 ? 2 : score >= 50 ? 1 : 0;

    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-rose-50 p-6 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl w-full">
          <div className="text-center mb-8">
            <div className="text-8xl mb-4">
              {stars === 3 ? '🌟' : stars === 2 ? '⭐' : stars === 1 ? '⚡' : '👍'}
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-2">
              {stars === 3 ? 'Outstanding!' : stars === 2 ? 'Great Job!' : stars === 1 ? 'Good Effort!' : 'Keep Practicing!'}
            </h2>
            <p className="text-xl text-gray-600">
              {stars === 3 ? 'You\'re a medical expert!' : stars === 2 ? 'You\'re on the right track!' : 'Every doctor started somewhere!'}
            </p>
          </div>

          <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-xl p-6 mb-8">
            <div className="grid grid-cols-2 gap-6">
              <div className="text-center">
                <Trophy className="w-8 h-8 text-red-600 mx-auto mb-2" />
                <div className="text-3xl font-bold text-gray-900">{score}</div>
                <div className="text-sm text-gray-600">Final Score</div>
              </div>
              <div className="text-center">
                <Clock className="w-8 h-8 text-pink-600 mx-auto mb-2" />
                <div className="text-3xl font-bold text-gray-900">
                  {Math.floor(timeElapsed / 60)}:{(timeElapsed % 60).toString().padStart(2, '0')}
                </div>
                <div className="text-sm text-gray-600">Time Taken</div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-1 mb-8">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={`text-5xl ${
                  i <= stars ? 'opacity-100' : 'opacity-20'
                }`}
              >
                ⭐
              </div>
            ))}
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => {
                setGameState('intro');
                setScore(0);
                setTimeElapsed(0);
              }}
              className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 font-bold rounded-xl hover:bg-gray-300 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={handleFinish}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-pink-600 text-white font-bold rounded-xl hover:from-red-700 hover:to-pink-700 transition-all"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-rose-50">
      {subType === 'symptom-detective' && (
        <SymptomDetectiveChallenge onComplete={handleChallengeComplete} />
      )}
      {subType === 'treatment-planner' && (
        <TreatmentPlannerChallenge onComplete={handleChallengeComplete} />
      )}
      {subType === 'emergency-room-rush' && (
        <EmergencyRoomRushChallenge onComplete={handleChallengeComplete} />
      )}
    </div>
  );
}
