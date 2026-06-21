import { useState, useEffect } from 'react';
import { X, Clock, Star, Trophy } from 'lucide-react';
import { useAudio } from '../contexts/AudioContext';
import type { Challenge } from '../lib/database.types';
import { BugHuntChallenge } from './it/BugHuntChallenge';
import { AlgorithmBuilderChallenge } from './it/AlgorithmBuilderChallenge';
import { SystemDesignChallenge } from './it/SystemDesignChallenge';

interface InformationTechnologyGameProps {
  challenge: Challenge;
  onComplete: (score: number) => void;
  onExit: () => void;
}

export function InformationTechnologyGame({ challenge, onComplete, onExit }: InformationTechnologyGameProps) {
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'complete'>('intro');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(180);
  const [stars, setStars] = useState(0);

  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => Math.max(0, prev - 1));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [gameState, timeLeft]);

  const { playSfx } = useAudio();

  const handleGameComplete = (earnedScore: number) => {
    setScore(earnedScore);
    const earnedStars = earnedScore >= 90 ? 3 : earnedScore >= 70 ? 2 : earnedScore >= 50 ? 1 : 0;
    setStars(earnedStars);
    setGameState('complete');
    playSfx('complete');
  };

  const handleFinish = () => {
    onComplete(score);
  };

  if (gameState === 'intro') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl p-8 max-h-[90vh] overflow-y-auto">
          <button
            onClick={() => {
              playSfx('click');
              onExit();
            }}
            className="mb-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="text-center mb-8">
            <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-5xl">💻</span>
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              {challenge.title}
            </h2>
            <p className="text-lg text-gray-600">
              {challenge.description}
            </p>
          </div>

          <div className="bg-green-50 rounded-2xl p-6 mb-8">
            <h3 className="font-bold text-xl text-gray-900 mb-4">Your Mission:</h3>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">1</span>
                <span>Hunt down bugs in code and identify syntax and logic errors</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">2</span>
                <span>Build efficient algorithms using visual code blocks</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">3</span>
                <span>Design scalable systems by connecting service components</span>
              </li>
            </ul>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-blue-50 rounded-xl p-4 text-center">
              <Clock className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <div className="font-bold text-gray-900">3 Minutes</div>
              <div className="text-sm text-gray-600">Time Limit</div>
            </div>
            <div className="bg-yellow-50 rounded-xl p-4 text-center">
              <Trophy className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
              <div className="font-bold text-gray-900">{challenge.max_score} Points</div>
              <div className="text-sm text-gray-600">Max Score</div>
            </div>
          </div>

          <button
            onClick={() => {
              playSfx('click');
              setGameState('playing');
            }}
            className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold rounded-xl text-lg transition-all transform hover:scale-105"
          >
            Start Challenge
          </button>
        </div>
      </div>
    );
  }

  if (gameState === 'playing') {
    const config = challenge.config as any;
    const challengeType = config?.subType || 'bug-hunt';

    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-lg shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <button
              onClick={onExit}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-green-600" />
                <span className="font-bold text-lg">
                  {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-600" />
                <span className="font-bold text-lg">{score}</span>
              </div>
            </div>
          </div>
        </div>

        {(challengeType === 'bug-hunt' || challengeType === 'bug-hunt-challenge') && (
          <BugHuntChallenge onComplete={handleGameComplete} />
        )}
        {(challengeType === 'algorithm-builder' || challengeType === 'algorithm-builder-challenge') && (
          <AlgorithmBuilderChallenge onComplete={handleGameComplete} />
        )}
        {(challengeType === 'system-design' || challengeType === 'system-design-challenge') && (
          <SystemDesignChallenge onComplete={handleGameComplete} />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl p-8 text-center">
        <div className="mb-8">
          <div className="flex justify-center gap-2 mb-6">
            {[1, 2, 3].map((i) => (
              <Star
                key={i}
                className={`w-16 h-16 ${i <= stars ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'
                  }`}
              />
            ))}
          </div>

          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Challenge Complete!
          </h2>

          <div className="text-6xl font-bold text-green-600 mb-2">
            {score}
          </div>
          <div className="text-gray-600 mb-6">
            out of {challenge.max_score} points
          </div>

          <p className="text-lg text-gray-700">
            {score >= 90
              ? "Outstanding! You're a coding wizard!"
              : score >= 70
                ? 'Great job! Keep coding to master your skills!'
                : score >= 50
                  ? 'Good effort! Practice more to level up!'
                  : 'Keep trying! Every bug fixed makes you better!'}
          </p>
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => {
              playSfx('click');
              setGameState('intro');
              setScore(0);
              setTimeLeft(180);
            }}
            className="flex-1 py-3 border-2 border-green-500 text-green-600 font-semibold rounded-xl hover:bg-green-50 transition-colors"
          >
            Try Again
          </button>
          <button
            onClick={() => {
              playSfx('click');
              handleFinish();
            }}
            className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-xl hover:from-green-600 hover:to-emerald-600 transition-colors"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
