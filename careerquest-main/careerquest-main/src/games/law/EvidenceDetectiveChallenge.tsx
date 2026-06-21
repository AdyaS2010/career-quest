import { useState } from 'react';
import { Scale, CheckCircle2, XCircle } from 'lucide-react';

interface Evidence {
  id: number;
  type: 'photo' | 'document' | 'statement';
  title: string;
  description: string;
  isAdmissible: boolean;
  icon: string;
}

interface Case {
  title: string;
  description: string;
  evidence: Evidence[];
}

const CASES: Case[] = [
  {
    title: 'The Missing Contract Case',
    description: 'A dispute over a business contract. Sort the evidence.',
    evidence: [
      { id: 1, type: 'document', title: 'Signed Contract', description: 'Original signed agreement dated 2024', isAdmissible: true, icon: '📄' },
      { id: 2, type: 'statement', title: 'Witness Statement', description: 'Notarized testimony from meeting attendee', isAdmissible: true, icon: '👤' },
      { id: 3, type: 'photo', title: 'Social Media Post', description: 'Unverified screenshot from social media', isAdmissible: false, icon: '📱' },
      { id: 4, type: 'document', title: 'Email Chain', description: 'Business emails discussing contract terms', isAdmissible: true, icon: '✉️' },
      { id: 5, type: 'statement', title: 'Hearsay Testimony', description: 'Third-party account of what someone else said', isAdmissible: false, icon: '💬' },
      { id: 6, type: 'photo', title: 'Security Camera Footage', description: 'Timestamped footage of meeting', isAdmissible: true, icon: '📹' },
    ],
  },
  {
    title: 'Property Damage Claim',
    description: 'Determine which evidence is valid for court.',
    evidence: [
      { id: 7, type: 'photo', title: 'Damage Photos', description: 'Timestamped photos taken by inspector', isAdmissible: true, icon: '📸' },
      { id: 8, type: 'document', title: 'Repair Receipt', description: 'Official invoice from licensed contractor', isAdmissible: true, icon: '🧾' },
      { id: 9, type: 'statement', title: 'Anonymous Tip', description: 'Unsigned letter with allegations', isAdmissible: false, icon: '✉️' },
      { id: 10, type: 'document', title: 'Expert Report', description: 'Certified engineer\'s assessment', isAdmissible: true, icon: '📋' },
      { id: 11, type: 'statement', title: 'Neighbor\'s Opinion', description: 'Personal opinion without direct knowledge', isAdmissible: false, icon: '🗣️' },
      { id: 12, type: 'photo', title: 'Property Survey', description: 'Official land survey from surveyor', isAdmissible: true, icon: '🗺️' },
    ],
  },
];

interface EvidenceDetectiveChallengeProps {
  onComplete: (score: number) => void;
}

export function EvidenceDetectiveChallenge({ onComplete }: EvidenceDetectiveChallengeProps) {
  const [currentCaseIndex, setCurrentCaseIndex] = useState(0);
  const [admissiblePile, setAdmissiblePile] = useState<Evidence[]>([]);
  const [inadmissiblePile, setInadmissiblePile] = useState<Evidence[]>([]);
  const [availableEvidence, setAvailableEvidence] = useState<Evidence[]>(CASES[0].evidence);
  const [results, setResults] = useState<{ correct: number; incorrect: number }[]>([]);
  const [feedback, setFeedback] = useState<{ show: boolean; correct: boolean; message: string }>({ show: false, correct: false, message: '' });

  const currentCase = CASES[currentCaseIndex];

  const handleEvidenceDrop = (evidence: Evidence, pile: 'admissible' | 'inadmissible') => {
    const isCorrect = (pile === 'admissible' && evidence.isAdmissible) || 
                      (pile === 'inadmissible' && !evidence.isAdmissible);

    // Show feedback
    setFeedback({
      show: true,
      correct: isCorrect,
      message: isCorrect 
        ? `Correct! This evidence is ${pile}.`
        : `Wrong! This evidence is actually ${evidence.isAdmissible ? 'admissible' : 'inadmissible'}.`
    });

    setTimeout(() => {
      setFeedback({ show: false, correct: false, message: '' });
    }, 2000);

    // Remove from available
    setAvailableEvidence(availableEvidence.filter(e => e.id !== evidence.id));

    // Add to appropriate pile
    if (pile === 'admissible') {
      setAdmissiblePile([...admissiblePile, evidence]);
    } else {
      setInadmissiblePile([...inadmissiblePile, evidence]);
    }
  };

  const handleSubmit = () => {
    const correctAdmissible = admissiblePile.filter(e => e.isAdmissible).length;
    const incorrectAdmissible = admissiblePile.filter(e => !e.isAdmissible).length;
    const correctInadmissible = inadmissiblePile.filter(e => !e.isAdmissible).length;
    const incorrectInadmissible = inadmissiblePile.filter(e => e.isAdmissible).length;

    const correct = correctAdmissible + correctInadmissible;
    const incorrect = incorrectAdmissible + incorrectInadmissible;

    setResults([...results, { correct, incorrect }]);

    if (currentCaseIndex < CASES.length - 1) {
      setCurrentCaseIndex(prev => prev + 1);
      setAdmissiblePile([]);
      setInadmissiblePile([]);
      setAvailableEvidence(CASES[currentCaseIndex + 1].evidence);
    } else {
      // Calculate final score
      const totalCorrect = [...results, { correct, incorrect }].reduce((sum, r) => sum + r.correct, 0);
      const totalIncorrect = [...results, { correct, incorrect }].reduce((sum, r) => sum + r.incorrect, 0);
      
      const totalEvidence = CASES.reduce((sum, c) => sum + c.evidence.length, 0);
      const baseScore = Math.round((totalCorrect / totalEvidence) * 80);
      const speedBonus = Math.max(0, 20 - totalIncorrect * 2);
      
      onComplete(Math.min(100, baseScore + speedBonus));
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Scale className="w-8 h-8 text-blue-600" />
            <h3 className="text-2xl font-bold text-gray-900">
              Evidence Detective
            </h3>
          </div>
          <div className="flex gap-2">
            {CASES.map((_, idx) => (
              <div
                key={idx}
                className={`w-3 h-3 rounded-full ${
                  idx < currentCaseIndex
                    ? 'bg-blue-500'
                    : idx === currentCaseIndex
                    ? 'bg-indigo-500'
                    : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="bg-blue-50 rounded-xl p-4 mb-6">
          <h4 className="font-bold text-lg text-gray-900 mb-1">{currentCase.title}</h4>
          <p className="text-gray-700">{currentCase.description}</p>
        </div>

        {feedback.show && (
          <div className={`mb-6 p-4 rounded-xl border-2 ${
            feedback.correct 
              ? 'bg-green-50 border-green-500' 
              : 'bg-red-50 border-red-500'
          }`}>
            <div className="flex items-center gap-2">
              {feedback.correct ? (
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
              <span className={`font-semibold ${
                feedback.correct ? 'text-green-900' : 'text-red-900'
              }`}>
                {feedback.message}
              </span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-6 mb-6">
          {/* Available Evidence */}
          <div className="col-span-1">
            <h4 className="font-bold text-gray-900 mb-3 text-center">
              Available Evidence
            </h4>
            <div className="bg-gray-50 rounded-xl p-4 min-h-[400px]">
              {availableEvidence.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  All evidence sorted!
                </div>
              ) : (
                <div className="space-y-3">
                  {availableEvidence.map(evidence => (
                    <div
                      key={evidence.id}
                      className="bg-white rounded-lg p-3 shadow-sm border-2 border-gray-200"
                    >
                      <div className="flex items-start gap-3 mb-2">
                        <span className="text-3xl">{evidence.icon}</span>
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900 text-sm mb-1">
                            {evidence.title}
                          </div>
                          <div className="text-xs text-gray-600">
                            {evidence.description}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEvidenceDrop(evidence, 'admissible')}
                          className="flex-1 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-semibold rounded transition-colors"
                        >
                          Admissible
                        </button>
                        <button
                          onClick={() => handleEvidenceDrop(evidence, 'inadmissible')}
                          className="flex-1 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold rounded transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Admissible Pile */}
          <div className="col-span-1">
            <h4 className="font-bold text-green-700 mb-3 text-center flex items-center justify-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              Admissible ({admissiblePile.length})
            </h4>
            <div className="bg-green-50 rounded-xl p-4 min-h-[400px] border-2 border-green-200">
              <div className="space-y-2">
                {admissiblePile.map(evidence => (
                  <div
                    key={evidence.id}
                    className="bg-white rounded-lg p-2 shadow-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{evidence.icon}</span>
                      <span className="text-sm font-medium text-gray-900">
                        {evidence.title}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Inadmissible Pile */}
          <div className="col-span-1">
            <h4 className="font-bold text-red-700 mb-3 text-center flex items-center justify-center gap-2">
              <XCircle className="w-5 h-5" />
              Inadmissible ({inadmissiblePile.length})
            </h4>
            <div className="bg-red-50 rounded-xl p-4 min-h-[400px] border-2 border-red-200">
              <div className="space-y-2">
                {inadmissiblePile.map(evidence => (
                  <div
                    key={evidence.id}
                    className="bg-white rounded-lg p-2 shadow-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{evidence.icon}</span>
                      <span className="text-sm font-medium text-gray-900">
                        {evidence.title}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={availableEvidence.length > 0}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {availableEvidence.length > 0 
            ? `Sort All Evidence First (${availableEvidence.length} remaining)` 
            : currentCaseIndex < CASES.length - 1 
            ? 'Next Case' 
            : 'Complete Challenge'}
        </button>
      </div>
    </div>
  );
}
