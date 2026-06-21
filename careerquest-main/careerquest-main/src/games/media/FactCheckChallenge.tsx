import { useState } from 'react';
import { CheckCircle2, XCircle, Search } from 'lucide-react';

interface Claim {
  id: number;
  text: string;
  source: string;
  isTrue: boolean;
  needsVerification?: boolean;
  explanation: string;
}

const CLAIMS: Claim[] = [
  {
    id: 1,
    text: 'Breaking: Scientists discover water on Mars',
    source: '@spacenewsdaily',
    isTrue: true,
    explanation: 'NASA confirmed evidence of water ice on Mars in 2008.',
  },
  {
    id: 2,
    text: 'New study shows eating chocolate daily improves memory by 90%',
    source: '@healthguru23',
    isTrue: false,
    explanation: 'This is an exaggerated claim. No credible study shows 90% improvement.',
  },
  {
    id: 3,
    text: 'Local mayor announces new recycling program starting next month',
    source: '@citygovernment',
    isTrue: true,
    explanation: 'Official government announcement from verified account.',
  },
  {
    id: 4,
    text: 'Celebrity spotted at local restaurant, insiders say wedding imminent',
    source: '@gossipcentral',
    isTrue: false,
    needsVerification: true,
    explanation: 'Unverified gossip from unreliable source, requires fact-checking.',
  },
  {
    id: 5,
    text: 'Stock market reaches record high, experts attribute to tech sector growth',
    source: '@financialnews',
    isTrue: true,
    explanation: 'Verified by multiple financial news sources.',
  },
  {
    id: 6,
    text: 'Miracle cure discovered: This one weird trick cures all diseases',
    source: '@healthmiraclesnow',
    isTrue: false,
    explanation: 'Classic clickbait. No single cure exists for all diseases.',
  },
  {
    id: 7,
    text: 'University research finds link between exercise and improved mental health',
    source: '@sciencejournal',
    isTrue: true,
    explanation: 'Well-documented scientific finding from peer-reviewed research.',
  },
  {
    id: 8,
    text: '5G towers cause coronavirus spread according to anonymous expert',
    source: '@conspiracyalert',
    isTrue: false,
    explanation: 'Debunked conspiracy theory with no scientific evidence.',
  },
  {
    id: 9,
    text: 'Weather forecast: Heavy rain expected this weekend',
    source: '@nationalweather',
    isTrue: true,
    explanation: 'Official weather service prediction.',
  },
  {
    id: 10,
    text: 'Area 51 aliens confirmed by former government employee',
    source: '@ufohunter88',
    isTrue: false,
    needsVerification: true,
    explanation: 'Unverified claim requiring official government sources.',
  },
];

interface FactCheckChallengeProps {
  onComplete: (score: number) => void;
}

export function FactCheckChallenge({ onComplete }: FactCheckChallengeProps) {
  const [currentClaimIndex, setCurrentClaimIndex] = useState(0);
  const [results, setResults] = useState<{ correct: boolean; usedSource: boolean }[]>([]);
  const [showSource, setShowSource] = useState(false);
  const [accuracyScore, setAccuracyScore] = useState(100);
  const [feedback, setFeedback] = useState<{ show: boolean; correct: boolean; message: string }>({ 
    show: false, 
    correct: false, 
    message: '' 
  });

  const currentClaim = CLAIMS[currentClaimIndex];
  const remainingClaims = CLAIMS.length - currentClaimIndex;

  const handleVerdict = (verdict: 'true' | 'false' | 'verify') => {
    let isCorrect = false;

    if (verdict === 'true' && currentClaim.isTrue && !currentClaim.needsVerification) {
      isCorrect = true;
    } else if (verdict === 'false' && !currentClaim.isTrue && !currentClaim.needsVerification) {
      isCorrect = true;
    } else if (verdict === 'verify' && currentClaim.needsVerification) {
      isCorrect = true;
    } else if (verdict === 'verify' && !currentClaim.needsVerification) {
      // Acceptable for any claim if they want to be thorough
      isCorrect = true;
    }

    // Show feedback
    setFeedback({
      show: true,
      correct: isCorrect,
      message: isCorrect 
        ? `Correct! ${currentClaim.explanation}`
        : `Incorrect. ${currentClaim.explanation}`
    });

    // Update accuracy
    if (!isCorrect) {
      setAccuracyScore(Math.max(0, accuracyScore - 10));
    }

    // Record result
    setResults([...results, { correct: isCorrect, usedSource: showSource }]);

    setTimeout(() => {
      setFeedback({ show: false, correct: false, message: '' });
      
      if (currentClaimIndex < CLAIMS.length - 1) {
        setCurrentClaimIndex(prev => prev + 1);
        setShowSource(false);
      } else {
        // Calculate final score
        const correctCount = [...results, { correct: isCorrect, usedSource: showSource }]
          .filter(r => r.correct).length;
        const sourceBonus = [...results, { correct: isCorrect, usedSource: showSource }]
          .filter(r => r.usedSource).length * 5;
        
        const baseScore = Math.round((correctCount / CLAIMS.length) * 85);
        const finalScore = Math.min(100, baseScore + sourceBonus);
        
        onComplete(finalScore);
      }
    }, 2500);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Search className="w-8 h-8 text-purple-600" />
            <h3 className="text-2xl font-bold text-gray-900">
              Fact-Check Frenzy
            </h3>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm text-gray-600">Accuracy</div>
              <div className="text-xl font-bold text-purple-600">{accuracyScore}%</div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">Remaining</div>
              <div className="text-xl font-bold text-gray-900">{remainingClaims}</div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentClaimIndex / CLAIMS.length) * 100}%` }}
            />
          </div>
        </div>

        {feedback.show && (
          <div className={`mb-6 p-4 rounded-xl border-2 animate-pulse ${
            feedback.correct 
              ? 'bg-green-50 border-green-500' 
              : 'bg-red-50 border-red-500'
          }`}>
            <div className="flex items-start gap-3">
              {feedback.correct ? (
                <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <div className={`font-bold mb-1 ${
                  feedback.correct ? 'text-green-900' : 'text-red-900'
                }`}>
                  {feedback.correct ? 'Correct! ✓' : 'Incorrect ✗'}
                </div>
                <div className={feedback.correct ? 'text-green-800' : 'text-red-800'}>
                  {feedback.message}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Social Media Post Style */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 mb-6 border-2 border-purple-200">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
              {currentClaim.source.charAt(1).toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="font-bold text-gray-900 mb-1">{currentClaim.source}</div>
              <div className="text-sm text-gray-600">Social Media Post</div>
            </div>
          </div>
          
          <div className="text-lg text-gray-900 mb-4 leading-relaxed">
            {currentClaim.text}
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>🔄 2.4K shares</span>
            <span>•</span>
            <span>💬 856 comments</span>
            <span>•</span>
            <span>⏰ 2 hours ago</span>
          </div>
        </div>

        {/* Research Panel */}
        <div className="mb-6">
          <button
            onClick={() => setShowSource(!showSource)}
            className="w-full flex items-center justify-between p-4 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors"
          >
            <div className="flex items-center gap-2">
              <Search className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-blue-900">
                {showSource ? 'Hide Research Panel' : 'Open Research Panel (+5 bonus)'}
              </span>
            </div>
            <span className="text-2xl">{showSource ? '▲' : '▼'}</span>
          </button>

          {showSource && (
            <div className="mt-3 p-4 bg-white border-2 border-blue-200 rounded-xl">
              <div className="text-sm font-semibold text-gray-700 mb-2">📚 Available Sources:</div>
              <div className="space-y-2">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="font-medium text-gray-900 mb-1">🔬 Scientific Journals</div>
                  <div className="text-xs text-gray-600">Peer-reviewed research and studies</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="font-medium text-gray-900 mb-1">📰 News Organizations</div>
                  <div className="text-xs text-gray-600">Verified news from reputable outlets</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="font-medium text-gray-900 mb-1">🏛️ Official Sources</div>
                  <div className="text-xs text-gray-600">Government and institutional data</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Verdict Buttons */}
        <div className="grid grid-cols-3 gap-4">
          <button
            onClick={() => handleVerdict('true')}
            disabled={feedback.show}
            className="py-4 px-6 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            <div className="text-3xl mb-2">✓</div>
            <div>TRUE</div>
          </button>

          <button
            onClick={() => handleVerdict('verify')}
            disabled={feedback.show}
            className="py-4 px-6 bg-yellow-500 hover:bg-yellow-600 text-white font-bold rounded-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            <div className="text-3xl mb-2">❓</div>
            <div>NEEDS VERIFICATION</div>
          </button>

          <button
            onClick={() => handleVerdict('false')}
            disabled={feedback.show}
            className="py-4 px-6 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            <div className="text-3xl mb-2">✗</div>
            <div>FALSE</div>
          </button>
        </div>

        <div className="mt-6 text-center text-sm text-gray-600">
          Claim {currentClaimIndex + 1} of {CLAIMS.length}
        </div>
      </div>
    </div>
  );
}
