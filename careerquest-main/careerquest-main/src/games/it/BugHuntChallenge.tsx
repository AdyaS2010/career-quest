import { useState } from 'react';
import { Bug, CheckCircle2, XCircle } from 'lucide-react';

interface CodeLine {
  id: number;
  code: string;
  hasBug: boolean;
  bugType?: 'syntax' | 'logic';
  explanation?: string;
}

const CODE_SAMPLES: CodeLine[][] = [
  [
    { id: 1, code: 'function calculateTotal(items) {', hasBug: false },
    { id: 2, code: '  let total = 0;', hasBug: false },
    { id: 3, code: '  for (let i = 0; i <= items.length; i++) {', hasBug: true, bugType: 'logic', explanation: 'Should be i < items.length to avoid out-of-bounds' },
    { id: 4, code: '    total += items[i].price;', hasBug: false },
    { id: 5, code: '  }', hasBug: false },
    { id: 6, code: '  return total;', hasBug: false },
    { id: 7, code: '}', hasBug: false },
  ],
  [
    { id: 1, code: 'class User {', hasBug: false },
    { id: 2, code: '  constructor(name, email) {', hasBug: false },
    { id: 3, code: '    this.name = name;', hasBug: false },
    { id: 4, code: '    this.email = email', hasBug: true, bugType: 'syntax', explanation: 'Missing semicolon' },
    { id: 5, code: '  }', hasBug: false },
    { id: 6, code: '  validateEmail() {', hasBug: false },
    { id: 7, code: '    return this.email.includes("@");', hasBug: false },
    { id: 8, code: '  }', hasBug: false },
    { id: 9, code: '}', hasBug: false },
  ],
  [
    { id: 1, code: 'function sortNumbers(arr) {', hasBug: false },
    { id: 2, code: '  return arr.sort();', hasBug: true, bugType: 'logic', explanation: 'sort() treats numbers as strings, use (a, b) => a - b' },
    { id: 3, code: '}', hasBug: false },
    { id: 4, code: '', hasBug: false },
    { id: 5, code: 'const numbers = [10, 5, 40, 25];', hasBug: false },
    { id: 6, code: 'console.log(sortNumbers(numbers));', hasBug: false },
  ],
];

interface BugHuntChallengeProps {
  onComplete: (score: number) => void;
}

export function BugHuntChallenge({ onComplete }: BugHuntChallengeProps) {
  const [currentCodeIndex, setCurrentCodeIndex] = useState(0);
  const [selectedLines, setSelectedLines] = useState<Set<number>>(new Set());
  const [results, setResults] = useState<{ correct: number; incorrect: number }[]>([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState<{ lineId: number; correct: boolean; explanation?: string } | null>(null);

  const currentCode = CODE_SAMPLES[currentCodeIndex];
  const bugsInCode = currentCode.filter(line => line.hasBug).length;

  const handleLineClick = (line: CodeLine) => {
    if (showFeedback) return;

    const newSelected = new Set(selectedLines);
    
    if (line.hasBug) {
      // Correct bug found
      newSelected.add(line.id);
      setSelectedLines(newSelected);
      setFeedback({ lineId: line.id, correct: true, explanation: line.explanation });
      setShowFeedback(true);

      setTimeout(() => {
        setShowFeedback(false);
        setFeedback(null);
      }, 2000);
    } else {
      // False positive
      setFeedback({ lineId: line.id, correct: false });
      setShowFeedback(true);

      setTimeout(() => {
        setShowFeedback(false);
        setFeedback(null);
      }, 1500);
    }
  };

  const handleSubmit = () => {
    const bugsFound = Array.from(selectedLines).filter(id => 
      currentCode.find(line => line.id === id)?.hasBug
    ).length;
    
    const correctCount = bugsFound;
    const incorrectCount = selectedLines.size - bugsFound;
    
    setResults([...results, { correct: correctCount, incorrect: incorrectCount }]);

    if (currentCodeIndex < CODE_SAMPLES.length - 1) {
      setCurrentCodeIndex(prev => prev + 1);
      setSelectedLines(new Set());
      setShowFeedback(false);
      setFeedback(null);
    } else {
      // Calculate final score
      const totalCorrect = [...results, { correct: correctCount, incorrect: incorrectCount }]
        .reduce((sum, r) => sum + r.correct, 0);
      const totalIncorrect = [...results, { correct: correctCount, incorrect: incorrectCount }]
        .reduce((sum, r) => sum + r.incorrect, 0);
      
      const totalBugs = CODE_SAMPLES.reduce((sum, code) => 
        sum + code.filter(line => line.hasBug).length, 0
      );
      
      const score = Math.max(0, Math.round((totalCorrect * 10 - totalIncorrect * 5) / totalBugs * 100));
      onComplete(Math.min(100, score));
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Bug className="w-8 h-8 text-green-600" />
            <h3 className="text-2xl font-bold text-gray-900">
              Bug Hunt Detective
            </h3>
          </div>
          <div className="flex gap-2">
            {CODE_SAMPLES.map((_, idx) => (
              <div
                key={idx}
                className={`w-3 h-3 rounded-full ${
                  idx < currentCodeIndex
                    ? 'bg-green-500'
                    : idx === currentCodeIndex
                    ? 'bg-emerald-500'
                    : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="bg-green-50 rounded-xl p-4 mb-6">
          <p className="text-center text-gray-700">
            <strong>Mission:</strong> Click on lines with bugs to identify them. 
            This code has <strong>{bugsInCode}</strong> {bugsInCode === 1 ? 'bug' : 'bugs'}.
          </p>
        </div>

        <div className="bg-gray-900 rounded-xl p-6 mb-6 font-mono text-sm">
          {currentCode.map((line) => {
            const isSelected = selectedLines.has(line.id);
            const isFeedbackLine = feedback?.lineId === line.id;
            
            return (
              <div
                key={line.id}
                onClick={() => handleLineClick(line)}
                className={`py-2 px-4 rounded cursor-pointer transition-all relative ${
                  isSelected
                    ? 'bg-green-900 text-green-100'
                    : isFeedbackLine
                    ? feedback.correct
                      ? 'bg-green-600 text-white'
                      : 'bg-red-600 text-white'
                    : 'hover:bg-gray-800 text-gray-100'
                }`}
              >
                <span className="text-gray-500 mr-4 select-none">{line.id}</span>
                <span>{line.code || ' '}</span>
                
                {isSelected && line.hasBug && (
                  <CheckCircle2 className="w-4 h-4 text-green-400 absolute right-4 top-1/2 -translate-y-1/2" />
                )}
                {isFeedbackLine && !feedback.correct && (
                  <XCircle className="w-4 h-4 text-white absolute right-4 top-1/2 -translate-y-1/2" />
                )}
              </div>
            );
          })}
        </div>

        {showFeedback && feedback?.correct && feedback.explanation && (
          <div className="bg-green-100 border-2 border-green-500 rounded-xl p-4 mb-6 animate-pulse">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-green-900 mb-1">Bug Found! 🐛</div>
                <div className="text-green-800">{feedback.explanation}</div>
              </div>
            </div>
          </div>
        )}

        {showFeedback && !feedback?.correct && (
          <div className="bg-red-100 border-2 border-red-500 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-600" />
              <span className="text-red-900 font-semibold">No bug on this line. Keep looking!</span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="text-gray-700">
            <span className="font-semibold">Bugs Found:</span> {selectedLines.size} / {bugsInCode}
          </div>
          
          <button
            onClick={handleSubmit}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-colors"
          >
            {currentCodeIndex < CODE_SAMPLES.length - 1 ? 'Next Code' : 'Submit Results'}
          </button>
        </div>
      </div>
    </div>
  );
}
