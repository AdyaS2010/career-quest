import { useState } from 'react';
import { Gavel, ThumbsUp, ThumbsDown } from 'lucide-react';

interface Precedent {
  id: string;
  name: string;
  description: string;
  relevance: 'high' | 'medium' | 'low';
}

interface ArgumentPoint {
  id: string;
  text: string;
  position: number;
}

interface PersuasiveOption {
  id: string;
  text: string;
  effectiveness: number;
}

interface Case {
  title: string;
  scenario: string;
  availablePrecedents: Precedent[];
  correctPrecedent: string;
  argumentPoints: ArgumentPoint[];
  correctOrder: number[];
  persuasiveOptions: PersuasiveOption[];
}

const CASES: Case[] = [
  {
    title: 'Contract Breach Case',
    scenario: 'Your client\'s vendor failed to deliver goods as specified in the contract. Build your argument.',
    availablePrecedents: [
      { id: 'p1', name: 'Smith v. Jones (2020)', description: 'Breach of contract with monetary damages', relevance: 'high' },
      { id: 'p2', name: 'Brown v. Green (2018)', description: 'Property dispute unrelated to contracts', relevance: 'low' },
      { id: 'p3', name: 'Davis v. Wilson (2019)', description: 'Contract fulfillment standards', relevance: 'medium' },
    ],
    correctPrecedent: 'p1',
    argumentPoints: [
      { id: 'a1', text: 'The contract clearly specified delivery terms', position: 1 },
      { id: 'a2', text: 'Therefore, my client is entitled to damages', position: 3 },
      { id: 'a3', text: 'The vendor failed to meet these terms', position: 2 },
    ],
    correctOrder: [1, 2, 3],
    persuasiveOptions: [
      { id: 'o1', text: 'Based on established precedent and the facts of this case...', effectiveness: 90 },
      { id: 'o2', text: 'I think maybe possibly this could be...', effectiveness: 30 },
      { id: 'o3', text: 'The evidence clearly demonstrates without doubt...', effectiveness: 85 },
    ],
  },
  {
    title: 'Employment Dispute',
    scenario: 'Your client was wrongfully terminated. Present a compelling case.',
    availablePrecedents: [
      { id: 'p4', name: 'Miller v. Corp (2021)', description: 'Wrongful termination protection', relevance: 'high' },
      { id: 'p5', name: 'Taylor v. LLC (2017)', description: 'Tax dispute case', relevance: 'low' },
      { id: 'p6', name: 'Anderson v. Inc (2020)', description: 'Employee rights violation', relevance: 'medium' },
    ],
    correctPrecedent: 'p4',
    argumentPoints: [
      { id: 'b1', text: 'My client was terminated without cause', position: 1 },
      { id: 'b2', text: 'This violates employment protection laws', position: 2 },
      { id: 'b3', text: 'Reinstatement and compensation are warranted', position: 3 },
    ],
    correctOrder: [1, 2, 3],
    persuasiveOptions: [
      { id: 'o4', text: 'The law unequivocally supports my client\'s position...', effectiveness: 95 },
      { id: 'o5', text: 'Well, um, I suppose we could argue...', effectiveness: 25 },
      { id: 'o6', text: 'Considering all factors, it seems reasonable...', effectiveness: 70 },
    ],
  },
];

interface CourtroomArgumentsChallengeProps {
  onComplete: (score: number) => void;
}

export function CourtroomArgumentsChallenge({ onComplete }: CourtroomArgumentsChallengeProps) {
  const [currentCaseIndex, setCurrentCaseIndex] = useState(0);
  const [selectedPrecedent, setSelectedPrecedent] = useState<string | null>(null);
  const [orderedArguments, setOrderedArguments] = useState<ArgumentPoint[]>([]);
  const [availableArguments, setAvailableArguments] = useState<ArgumentPoint[]>(CASES[0].argumentPoints);
  const [selectedPersuasive, setSelectedPersuasive] = useState<string | null>(null);
  const [judgeReaction, setJudgeReaction] = useState<'positive' | 'negative' | null>(null);
  const [caseScores, setCaseScores] = useState<number[]>([]);

  const currentCase = CASES[currentCaseIndex];

  const handleArgumentClick = (arg: ArgumentPoint) => {
    setOrderedArguments([...orderedArguments, arg]);
    setAvailableArguments(availableArguments.filter(a => a.id !== arg.id));
  };

  const handleRemoveArgument = (index: number) => {
    const removed = orderedArguments[index];
    setOrderedArguments(orderedArguments.filter((_, i) => i !== index));
    setAvailableArguments([...availableArguments, removed]);
  };

  const handlePresent = () => {
    // Calculate scores
    const precedentScore = selectedPrecedent === currentCase.correctPrecedent ? 30 : 0;
    
    // Check if arguments are in correct order
    const logicScore = orderedArguments.every((arg, idx) => 
      arg.position === idx + 1
    ) ? 40 : orderedArguments.length === currentCase.argumentPoints.length ? 20 : 0;
    
    // Get persuasiveness score
    const selectedOption = currentCase.persuasiveOptions.find(o => o.id === selectedPersuasive);
    const persuasiveScore = selectedOption ? Math.round(selectedOption.effectiveness * 0.3) : 0;

    const totalScore = precedentScore + logicScore + persuasiveScore;

    // Show judge reaction
    setJudgeReaction(totalScore >= 70 ? 'positive' : 'negative');

    setTimeout(() => {
      setCaseScores([...caseScores, totalScore]);
      
      if (currentCaseIndex < CASES.length - 1) {
        // Next case
        setCurrentCaseIndex(prev => prev + 1);
        setSelectedPrecedent(null);
        setOrderedArguments([]);
        setAvailableArguments(CASES[currentCaseIndex + 1].argumentPoints);
        setSelectedPersuasive(null);
        setJudgeReaction(null);
      } else {
        // Complete challenge
        const avgScore = Math.round(
          [...caseScores, totalScore].reduce((a, b) => a + b, 0) / CASES.length
        );
        onComplete(avgScore);
      }
    }, 3000);
  };

  const canPresent = selectedPrecedent && orderedArguments.length === currentCase.argumentPoints.length && selectedPersuasive;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Gavel className="w-8 h-8 text-blue-600" />
            <h3 className="text-2xl font-bold text-gray-900">
              Courtroom Arguments
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

        <div className="bg-blue-50 rounded-xl p-6 mb-6">
          <h4 className="font-bold text-xl text-gray-900 mb-2">{currentCase.title}</h4>
          <p className="text-gray-700">{currentCase.scenario}</p>
        </div>

        {judgeReaction && (
          <div className={`mb-6 p-6 rounded-xl ${
            judgeReaction === 'positive' ? 'bg-green-50 border-2 border-green-500' : 'bg-red-50 border-2 border-red-500'
          }`}>
            <div className="flex items-center gap-4">
              <div className="text-6xl">👨‍⚖️</div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  {judgeReaction === 'positive' ? (
                    <ThumbsUp className="w-6 h-6 text-green-600" />
                  ) : (
                    <ThumbsDown className="w-6 h-6 text-red-600" />
                  )}
                  <span className={`text-xl font-bold ${
                    judgeReaction === 'positive' ? 'text-green-900' : 'text-red-900'
                  }`}>
                    {judgeReaction === 'positive' ? 'Compelling Argument!' : 'Weak Argument'}
                  </span>
                </div>
                <p className={judgeReaction === 'positive' ? 'text-green-800' : 'text-red-800'}>
                  {judgeReaction === 'positive' 
                    ? 'The court finds your reasoning sound and well-supported.' 
                    : 'The court finds gaps in your logic and precedent selection.'}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* Step 1: Select Precedent */}
          <div className="col-span-2">
            <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <span className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm">1</span>
              Select Legal Precedent
            </h4>
            <div className="grid grid-cols-3 gap-3">
              {currentCase.availablePrecedents.map(precedent => (
                <button
                  key={precedent.id}
                  onClick={() => setSelectedPrecedent(precedent.id)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    selectedPrecedent === precedent.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="font-semibold text-gray-900 mb-1 text-sm">
                    {precedent.name}
                  </div>
                  <div className="text-xs text-gray-600 mb-2">
                    {precedent.description}
                  </div>
                  <div className={`text-xs font-semibold ${
                    precedent.relevance === 'high' ? 'text-green-600' :
                    precedent.relevance === 'medium' ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {precedent.relevance} relevance
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Arrange Arguments */}
          <div className="col-span-1">
            <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <span className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm">2</span>
              Available Points
            </h4>
            <div className="space-y-2">
              {availableArguments.map(arg => (
                <button
                  key={arg.id}
                  onClick={() => handleArgumentClick(arg)}
                  className="w-full p-3 rounded-lg border-2 border-gray-200 bg-white hover:border-blue-500 text-left transition-all"
                >
                  <span className="text-sm text-gray-900">{arg.text}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="col-span-1">
            <h4 className="font-bold text-gray-900 mb-3">Your Argument Order</h4>
            <div className="bg-blue-50 rounded-xl p-4 min-h-[150px]">
              {orderedArguments.length === 0 ? (
                <div className="text-center text-gray-500 py-4 text-sm">
                  Click points to build your argument
                </div>
              ) : (
                <div className="space-y-2">
                  {orderedArguments.map((arg, idx) => (
                    <div
                      key={arg.id}
                      onClick={() => handleRemoveArgument(idx)}
                      className="p-3 bg-white rounded-lg border-2 border-blue-500 cursor-pointer hover:bg-red-50"
                    >
                      <div className="flex items-start gap-2">
                        <span className="font-bold text-blue-600">{idx + 1}.</span>
                        <span className="text-sm text-gray-900 flex-1">{arg.text}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Step 3: Select Persuasive Language */}
          <div className="col-span-2">
            <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <span className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm">3</span>
              Choose Your Presentation Style
            </h4>
            <div className="grid grid-cols-3 gap-3">
              {currentCase.persuasiveOptions.map(option => (
                <button
                  key={option.id}
                  onClick={() => setSelectedPersuasive(option.id)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    selectedPersuasive === option.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <span className="text-sm text-gray-900">{option.text}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={handlePresent}
          disabled={!canPresent || judgeReaction !== null}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Present to Judge
        </button>
      </div>
    </div>
  );
}
