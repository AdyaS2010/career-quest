import { useState } from 'react';
import { MessageCircle, AlertCircle, CheckCircle2 } from 'lucide-react';

interface Statement {
  id: number;
  text: string;
  isContradiction?: boolean;
}

interface Witness {
  name: string;
  role: string;
  emoji: string;
  statements: Statement[];
  contradictionPairs: [number, number][];
}

const WITNESSES: Witness[] = [
  {
    name: 'Jane Smith',
    role: 'Eye Witness',
    emoji: '👩‍💼',
    statements: [
      { id: 1, text: 'I saw the defendant at the scene around 3 PM.' },
      { id: 2, text: 'The weather was sunny and clear that day.' },
      { id: 3, text: 'I was wearing my glasses so I could see clearly.' },
      { id: 4, text: 'Actually, I wasn\'t wearing my glasses that day.', isContradiction: true },
      { id: 5, text: 'The person I saw was definitely at the scene around 5 PM.', isContradiction: true },
    ],
    contradictionPairs: [[1, 5], [3, 4]],
  },
  {
    name: 'Robert Johnson',
    role: 'Store Owner',
    emoji: '👨‍💼',
    statements: [
      { id: 6, text: 'My store was robbed on Tuesday evening.' },
      { id: 7, text: 'I immediately called the police after the incident.' },
      { id: 8, text: 'The security cameras were working perfectly.' },
      { id: 9, text: 'I didn\'t call police until the next morning actually.', isContradiction: true },
      { id: 10, text: 'The security system had been broken for weeks.', isContradiction: true },
    ],
    contradictionPairs: [[7, 9], [8, 10]],
  },
];

type QuestionType = 'clarifying' | 'challenging' | 'leading';

interface Question {
  type: QuestionType;
  text: string;
  effectiveness: number;
}

const QUESTIONS: Record<QuestionType, Question[]> = {
  clarifying: [
    { type: 'clarifying', text: 'Can you explain what you meant by that?', effectiveness: 60 },
    { type: 'clarifying', text: 'Could you provide more details about that time?', effectiveness: 70 },
    { type: 'clarifying', text: 'What exactly did you observe?', effectiveness: 65 },
  ],
  challenging: [
    { type: 'challenging', text: 'Isn\'t it true that your statement contradicts...?', effectiveness: 85 },
    { type: 'challenging', text: 'How can you be certain about that?', effectiveness: 75 },
    { type: 'challenging', text: 'That doesn\'t match your earlier testimony, does it?', effectiveness: 90 },
  ],
  leading: [
    { type: 'leading', text: 'You were at the scene, weren\'t you?', effectiveness: 50 },
    { type: 'leading', text: 'The truth is you can\'t be sure, correct?', effectiveness: 70 },
    { type: 'leading', text: 'Isn\'t it possible you\'re mistaken?', effectiveness: 60 },
  ],
};

interface CrossExaminationChallengeProps {
  onComplete: (score: number) => void;
}

export function CrossExaminationChallenge({ onComplete }: CrossExaminationChallengeProps) {
  const [currentWitnessIndex, setCurrentWitnessIndex] = useState(0);
  const [currentStatementIndex, setCurrentStatementIndex] = useState(0);
  const [credibilityMeter, setCredibilityMeter] = useState(100);
  const [selectedStatements, setSelectedStatements] = useState<number[]>([]);
  const [foundContradictions, setFoundContradictions] = useState<[number, number][]>([]);
  const [questionsAsked, setQuestionsAsked] = useState<Question[]>([]);
  const [phase, setPhase] = useState<'questioning' | 'findContradictions'>('questioning');
  const [witnessScores, setWitnessScores] = useState<number[]>([]);

  const currentWitness = WITNESSES[currentWitnessIndex];
  const currentStatement = currentWitness.statements[currentStatementIndex];

  const handleQuestionClick = (question: Question) => {
    setQuestionsAsked([...questionsAsked, question]);
    
    // Update credibility based on question effectiveness
    if (question.type === 'challenging' && currentStatement.isContradiction) {
      setCredibilityMeter(Math.max(0, credibilityMeter - 15));
    } else if (question.effectiveness > 70) {
      setCredibilityMeter(Math.max(0, credibilityMeter - 10));
    } else {
      setCredibilityMeter(Math.max(0, credibilityMeter - 5));
    }

    // Move to next statement
    if (currentStatementIndex < currentWitness.statements.length - 1) {
      setCurrentStatementIndex(prev => prev + 1);
    } else {
      setPhase('findContradictions');
    }
  };

  const handleStatementClick = (statementId: number) => {
    if (selectedStatements.includes(statementId)) {
      setSelectedStatements(selectedStatements.filter(id => id !== statementId));
    } else if (selectedStatements.length < 2) {
      const newSelected = [...selectedStatements, statementId];
      setSelectedStatements(newSelected);

      // Check if this forms a contradiction pair
      if (newSelected.length === 2) {
        const isContradiction = currentWitness.contradictionPairs.some(
          pair => 
            (pair[0] === newSelected[0] && pair[1] === newSelected[1]) ||
            (pair[0] === newSelected[1] && pair[1] === newSelected[0])
        );

        if (isContradiction) {
          setFoundContradictions([...foundContradictions, [newSelected[0], newSelected[1]] as [number, number]]);
        }

        setTimeout(() => {
          setSelectedStatements([]);
        }, 1000);
      }
    }
  };

  const handleCompleteWitness = () => {
    // Calculate witness score
    const contradictionsFound = foundContradictions.length;
    const totalContradictions = currentWitness.contradictionPairs.length;
    const contradictionScore = Math.round((contradictionsFound / totalContradictions) * 50);

    const avgQuestionEffectiveness = questionsAsked.reduce((sum, q) => sum + q.effectiveness, 0) / Math.max(questionsAsked.length, 1);
    const questionScore = Math.round(avgQuestionEffectiveness * 0.3);

    const timeScore = Math.round((credibilityMeter / 100) * 20);

    const witnessScore = contradictionScore + questionScore + timeScore;
    setWitnessScores([...witnessScores, witnessScore]);

    if (currentWitnessIndex < WITNESSES.length - 1) {
      // Next witness
      setCurrentWitnessIndex(prev => prev + 1);
      setCurrentStatementIndex(0);
      setCredibilityMeter(100);
      setSelectedStatements([]);
      setFoundContradictions([]);
      setQuestionsAsked([]);
      setPhase('questioning');
    } else {
      // Complete challenge
      const avgScore = Math.round(
        [...witnessScores, witnessScore].reduce((a, b) => a + b, 0) / WITNESSES.length
      );
      onComplete(avgScore);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <MessageCircle className="w-8 h-8 text-blue-600" />
            <h3 className="text-2xl font-bold text-gray-900">
              Cross-Examination
            </h3>
          </div>
          <div className="flex gap-2">
            {WITNESSES.map((_, idx) => (
              <div
                key={idx}
                className={`w-3 h-3 rounded-full ${
                  idx < currentWitnessIndex
                    ? 'bg-blue-500'
                    : idx === currentWitnessIndex
                    ? 'bg-indigo-500'
                    : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Witness Info */}
        <div className="bg-blue-50 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <span className="text-6xl">{currentWitness.emoji}</span>
            <div>
              <h4 className="text-2xl font-bold text-gray-900">{currentWitness.name}</h4>
              <p className="text-gray-700">{currentWitness.role}</p>
            </div>
          </div>

          {/* Credibility Meter */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-gray-700">Credibility Meter</span>
              <span className="text-sm font-bold text-blue-600">{credibilityMeter}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-500 ${
                  credibilityMeter > 60 ? 'bg-green-500' :
                  credibilityMeter > 30 ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}
                style={{ width: `${credibilityMeter}%` }}
              />
            </div>
          </div>

          {credibilityMeter < 50 && (
            <div className="flex items-center gap-2 text-orange-700 bg-orange-100 rounded-lg p-3">
              <AlertCircle className="w-5 h-5" />
              <span className="text-sm font-semibold">Witness credibility is low! Look for contradictions.</span>
            </div>
          )}
        </div>

        {phase === 'questioning' && (
          <>
            {/* Current Statement */}
            <div className="bg-gray-50 rounded-xl p-6 mb-6">
              <div className="flex items-start gap-3 mb-4">
                <MessageCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                <div>
                  <div className="text-sm text-gray-600 mb-1">Witness Statement:</div>
                  <div className="text-lg text-gray-900 font-medium">{currentStatement.text}</div>
                </div>
              </div>
              <div className="text-xs text-gray-500">
                Statement {currentStatementIndex + 1} of {currentWitness.statements.length}
              </div>
            </div>

            {/* Question Options */}
            <div className="space-y-4 mb-6">
              <h4 className="font-bold text-gray-900">Select Your Question Type:</h4>
              
              <div>
                <div className="text-sm font-semibold text-green-700 mb-2">Clarifying Questions</div>
                <div className="grid grid-cols-3 gap-3">
                  {QUESTIONS.clarifying.map((question, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleQuestionClick(question)}
                      className="p-3 rounded-lg border-2 border-green-200 bg-green-50 hover:border-green-500 text-left text-sm transition-all"
                    >
                      {question.text}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-sm font-semibold text-red-700 mb-2">Challenging Questions</div>
                <div className="grid grid-cols-3 gap-3">
                  {QUESTIONS.challenging.map((question, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleQuestionClick(question)}
                      className="p-3 rounded-lg border-2 border-red-200 bg-red-50 hover:border-red-500 text-left text-sm transition-all"
                    >
                      {question.text}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-sm font-semibold text-blue-700 mb-2">Leading Questions</div>
                <div className="grid grid-cols-3 gap-3">
                  {QUESTIONS.leading.map((question, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleQuestionClick(question)}
                      className="p-3 rounded-lg border-2 border-blue-200 bg-blue-50 hover:border-blue-500 text-left text-sm transition-all"
                    >
                      {question.text}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {phase === 'findContradictions' && (
          <>
            <div className="bg-yellow-50 rounded-xl p-4 mb-6 border-2 border-yellow-400">
              <h4 className="font-bold text-yellow-900 mb-2">Find the Contradictions!</h4>
              <p className="text-yellow-800 text-sm">
                Click two statements that contradict each other. Found: {foundContradictions.length} / {currentWitness.contradictionPairs.length}
              </p>
            </div>

            <div className="space-y-3 mb-6">
              {currentWitness.statements.map(statement => {
                const isSelected = selectedStatements.includes(statement.id);
                const isFound = foundContradictions.some(
                  pair => pair.includes(statement.id)
                );

                return (
                  <button
                    key={statement.id}
                    onClick={() => !isFound && handleStatementClick(statement.id)}
                    disabled={isFound}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                      isFound
                        ? 'border-green-500 bg-green-50 cursor-default'
                        : isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {isFound && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                      <span className="text-gray-900">{statement.text}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              onClick={handleCompleteWitness}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors"
            >
              {currentWitnessIndex < WITNESSES.length - 1 ? 'Next Witness' : 'Complete Cross-Examination'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
