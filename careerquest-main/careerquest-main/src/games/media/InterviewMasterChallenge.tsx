import { useState } from 'react';
import { MessageSquare, TrendingUp, TrendingDown } from 'lucide-react';

interface Question {
  id: string;
  text: string;
  type: 'opening' | 'follow-up' | 'deep-dive';
  revealsKeyFact: boolean;
  keyFactText?: string;
  opensFollowUp?: string[];
  impactsRapport: number; // -10 to +10
}

interface Interviewee {
  name: string;
  role: string;
  topic: string;
  emoji: string;
  questions: Question[];
  keyFactsNeeded: number;
}

const INTERVIEWEES: Interviewee[] = [
  {
    name: 'Dr. Sarah Chen',
    role: 'Climate Scientist',
    topic: 'Recent Climate Study Findings',
    emoji: '👩‍🔬',
    keyFactsNeeded: 4,
    questions: [
      {
        id: 'q1',
        text: 'What was the main focus of your recent study?',
        type: 'opening',
        revealsKeyFact: true,
        keyFactText: 'Study focused on Arctic ice melt rates over 20 years',
        opensFollowUp: ['q2', 'q3'],
        impactsRapport: 5,
      },
      {
        id: 'q2',
        text: 'Can you explain the methodology you used?',
        type: 'follow-up',
        revealsKeyFact: true,
        keyFactText: 'Used satellite data and ground measurements from 15 research stations',
        impactsRapport: 3,
      },
      {
        id: 'q3',
        text: 'What were your most surprising findings?',
        type: 'follow-up',
        revealsKeyFact: true,
        keyFactText: 'Ice melt rate accelerated 40% faster than previous decade',
        opensFollowUp: ['q4'],
        impactsRapport: 5,
      },
      {
        id: 'q4',
        text: 'What does this mean for coastal cities?',
        type: 'deep-dive',
        revealsKeyFact: true,
        keyFactText: 'Predicts 2-foot sea level rise by 2050 affecting 100M people',
        impactsRapport: 4,
      },
      {
        id: 'q5',
        text: 'What solutions do you recommend?',
        type: 'deep-dive',
        revealsKeyFact: true,
        keyFactText: 'Immediate 50% carbon emission reduction needed to slow progression',
        impactsRapport: 5,
      },
      {
        id: 'q5a',
        text: 'How confident are you in these predictions?',
        type: 'follow-up',
        revealsKeyFact: true,
        keyFactText: '97% confidence based on peer-reviewed data from 50+ international research institutions',
        opensFollowUp: [],
        impactsRapport: 4,
      },
      {
        id: 'q6',
        text: 'Why should we trust your research?',
        type: 'opening',
        revealsKeyFact: false,
        impactsRapport: -8,
      },
      {
        id: 'q7',
        text: 'What about other scientists who disagree?',
        type: 'opening',
        revealsKeyFact: false,
        impactsRapport: -5,
      },
    ],
  },
  {
    name: 'Marcus Johnson',
    role: 'Tech CEO',
    topic: 'New AI Product Launch',
    emoji: '👨‍💼',
    keyFactsNeeded: 4,
    questions: [
      {
        id: 'q8',
        text: 'Tell us about your new AI product.',
        type: 'opening',
        revealsKeyFact: true,
        keyFactText: 'AI assistant that helps students with homework and learning',
        opensFollowUp: ['q9', 'q10'],
        impactsRapport: 5,
      },
      {
        id: 'q9',
        text: 'What makes it different from competitors?',
        type: 'follow-up',
        revealsKeyFact: true,
        keyFactText: 'Uses personalized learning algorithms adapting to each student',
        impactsRapport: 4,
      },
      {
        id: 'q10',
        text: 'When will it be available and at what cost?',
        type: 'follow-up',
        revealsKeyFact: true,
        keyFactText: 'Launches next month, free for students, $10/month for premium',
        opensFollowUp: ['q11'],
        impactsRapport: 5,
      },
      {
        id: 'q11',
        text: 'How do you address concerns about academic integrity?',
        type: 'deep-dive',
        revealsKeyFact: true,
        keyFactText: 'Built-in safeguards prevent cheating, focuses on understanding not answers',
        impactsRapport: 6,
      },
      {
        id: 'q12',
        text: 'What are your revenue projections?',
        type: 'deep-dive',
        revealsKeyFact: true,
        keyFactText: 'Expecting 1 million users and $50M revenue in first year',
        impactsRapport: 3,
      },
      {
        id: 'q13',
        text: 'Aren\'t you just trying to make money off students?',
        type: 'opening',
        revealsKeyFact: false,
        impactsRapport: -10,
      },
    ],
  },
];

interface InterviewMasterChallengeProps {
  onComplete: (score: number) => void;
}

export function InterviewMasterChallenge({ onComplete }: InterviewMasterChallengeProps) {
  const [currentIntervieweeIndex, setCurrentIntervieweeIndex] = useState(0);
  const [collectedFacts, setCollectedFacts] = useState<string[]>([]);
  const [askedQuestions, setAskedQuestions] = useState<string[]>([]);
  const [availableFollowUps, setAvailableFollowUps] = useState<string[]>([]);
  const [rapportMeter, setRapportMeter] = useState(70);
  const [lastAnswer, setLastAnswer] = useState<string>('');
  const [interviewScores, setInterviewScores] = useState<number[]>([]);

  const currentInterviewee = INTERVIEWEES[currentIntervieweeIndex];
  const availableQuestions = currentInterviewee.questions.filter(
    q => !askedQuestions.includes(q.id) && 
    (q.type === 'opening' || availableFollowUps.includes(q.id))
  );

  const handleQuestionClick = (question: Question) => {
    setAskedQuestions([...askedQuestions, question.id]);
    
    // Update rapport
    const newRapport = Math.max(0, Math.min(100, rapportMeter + question.impactsRapport));
    setRapportMeter(newRapport);

    // Show answer
    if (question.revealsKeyFact && question.keyFactText) {
      setLastAnswer(`"${question.keyFactText}"`);
      setCollectedFacts([...collectedFacts, question.keyFactText]);
    } else {
      setLastAnswer(`"I'd rather not answer that..." (Rapport decreased)`);
    }

    // Unlock follow-up questions
    if (question.opensFollowUp) {
      setAvailableFollowUps([...availableFollowUps, ...question.opensFollowUp]);
    }
  };

  const handleCompleteInterview = () => {
    // Calculate score (max 100 per interview)
    const factsScore = Math.min(50, Math.round((collectedFacts.length / currentInterviewee.keyFactsNeeded) * 50));
    
    const followUpQuestions = askedQuestions.filter(
      id => currentInterviewee.questions.find(q => q.id === id)?.type === 'follow-up'
    ).length;
    const followUpScore = Math.min(25, followUpQuestions * 5);

    const rapportScore = Math.round((rapportMeter / 100) * 25);

    const interviewScore = Math.min(100, factsScore + followUpScore + rapportScore);
    setInterviewScores([...interviewScores, interviewScore]);

    if (currentIntervieweeIndex < INTERVIEWEES.length - 1) {
      // Next interview
      setCurrentIntervieweeIndex(prev => prev + 1);
      setCollectedFacts([]);
      setAskedQuestions([]);
      setAvailableFollowUps([]);
      setRapportMeter(70);
      setLastAnswer('');
    } else {
      // Complete challenge
      const avgScore = Math.round(
        [...interviewScores, interviewScore].reduce((a, b) => a + b, 0) / INTERVIEWEES.length
      );
      onComplete(avgScore);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-purple-600" />
            <h3 className="text-2xl font-bold text-gray-900">
              Interview Master
            </h3>
          </div>
          <div className="flex gap-2">
            {INTERVIEWEES.map((_, idx) => (
              <div
                key={idx}
                className={`w-3 h-3 rounded-full ${
                  idx < currentIntervieweeIndex
                    ? 'bg-purple-500'
                    : idx === currentIntervieweeIndex
                    ? 'bg-pink-500'
                    : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Interviewee Info */}
        <div className="bg-purple-50 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <span className="text-6xl">{currentInterviewee.emoji}</span>
            <div className="flex-1">
              <h4 className="text-2xl font-bold text-gray-900">{currentInterviewee.name}</h4>
              <p className="text-purple-700 font-medium">{currentInterviewee.role}</p>
              <p className="text-sm text-gray-600 mt-1">Topic: {currentInterviewee.topic}</p>
            </div>
          </div>

          {/* Rapport Meter */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-700">Openness Meter</span>
                {rapportMeter > 60 ? (
                  <TrendingUp className="w-4 h-4 text-green-600" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-600" />
                )}
              </div>
              <span className="text-sm font-bold text-purple-600">{rapportMeter}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-500 ${
                  rapportMeter > 60 ? 'bg-green-500' :
                  rapportMeter > 30 ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}
                style={{ width: `${rapportMeter}%` }}
              />
            </div>
          </div>

          {/* Key Facts Progress */}
          <div className="flex items-center gap-2 text-sm">
            <span className="font-semibold text-gray-700">Key Facts Collected:</span>
            <span className="font-bold text-purple-600">
              {collectedFacts.length} / {currentInterviewee.keyFactsNeeded}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6 mb-6">
          {/* Question Wheel */}
          <div className="col-span-2">
            <h4 className="font-bold text-gray-900 mb-4">Available Questions:</h4>
            
            {availableQuestions.length === 0 ? (
              <div className="bg-gray-50 rounded-xl p-8 text-center text-gray-500">
                No more questions available. Complete the interview or ask follow-ups.
              </div>
            ) : (
              <div className="space-y-3">
                {availableQuestions.map(question => (
                  <button
                    key={question.id}
                    onClick={() => handleQuestionClick(question)}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all hover:scale-102 ${
                      question.type === 'opening'
                        ? 'border-blue-200 bg-blue-50 hover:border-blue-500'
                        : question.type === 'follow-up'
                        ? 'border-purple-200 bg-purple-50 hover:border-purple-500'
                        : 'border-pink-200 bg-pink-50 hover:border-pink-500'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">
                        {question.type === 'opening' ? '💭' : 
                         question.type === 'follow-up' ? '🔄' : '🔍'}
                      </span>
                      <div>
                        <div className="text-sm font-medium text-gray-900 mb-1">
                          {question.text}
                        </div>
                        <div className="text-xs text-gray-600">
                          {question.type === 'opening' && 'Opening Question'}
                          {question.type === 'follow-up' && 'Follow-Up Question'}
                          {question.type === 'deep-dive' && 'Deep-Dive Question'}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Collected Facts */}
          <div className="col-span-1">
            <h4 className="font-bold text-gray-900 mb-4">Note Cards:</h4>
            <div className="bg-yellow-50 rounded-xl p-4 border-2 border-yellow-200 min-h-[300px]">
              {collectedFacts.length === 0 ? (
                <div className="text-center text-gray-500 text-sm py-8">
                  Ask questions to collect key facts
                </div>
              ) : (
                <div className="space-y-2">
                  {collectedFacts.map((fact, idx) => (
                    <div
                      key={idx}
                      className="bg-white p-3 rounded-lg shadow-sm border border-yellow-300"
                    >
                      <div className="text-xs font-bold text-purple-600 mb-1">
                        FACT #{idx + 1}
                      </div>
                      <div className="text-sm text-gray-900">{fact}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Last Answer */}
        {lastAnswer && (
          <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl p-4 mb-6 border-l-4 border-purple-500">
            <div className="flex items-start gap-3">
              <span className="text-3xl">{currentInterviewee.emoji}</span>
              <div>
                <div className="text-sm font-semibold text-purple-900 mb-1">
                  {currentInterviewee.name} responds:
                </div>
                <div className="text-gray-900 italic">{lastAnswer}</div>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={handleCompleteInterview}
          disabled={collectedFacts.length < currentInterviewee.keyFactsNeeded}
          className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {collectedFacts.length < currentInterviewee.keyFactsNeeded
            ? `Collect ${currentInterviewee.keyFactsNeeded - collectedFacts.length} more key facts`
            : currentIntervieweeIndex < INTERVIEWEES.length - 1
            ? 'Next Interview'
            : 'Complete Interviews'}
        </button>
      </div>
    </div>
  );
}
