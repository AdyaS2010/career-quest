import { useState } from 'react';
import { Code2, Play, CheckCircle2 } from 'lucide-react';

interface CodeBlock {
  id: string;
  type: 'loop' | 'condition' | 'function' | 'variable' | 'return';
  label: string;
  icon: string;
}

interface Problem {
  title: string;
  description: string;
  input: string;
  expectedOutput: string;
  solution: string[];
  testCases: { input: string; output: string }[];
}

const CODE_BLOCKS: CodeBlock[] = [
  { id: 'for-loop', type: 'loop', label: 'FOR each item', icon: '🔄' },
  { id: 'while-loop', type: 'loop', label: 'WHILE condition', icon: '🔁' },
  { id: 'if-condition', type: 'condition', label: 'IF condition', icon: '❓' },
  { id: 'else-condition', type: 'condition', label: 'ELSE', icon: '❗' },
  { id: 'compare-greater', type: 'condition', label: 'Compare >', icon: '>' },
  { id: 'compare-less', type: 'condition', label: 'Compare <', icon: '<' },
  { id: 'add-to-list', type: 'function', label: 'Add to list', icon: '➕' },
  { id: 'sort-list', type: 'function', label: 'Sort list', icon: '📊' },
  { id: 'swap-values', type: 'function', label: 'Swap values', icon: '🔀' },
  { id: 'set-variable', type: 'variable', label: 'Set variable', icon: '=' },
  { id: 'return-value', type: 'return', label: 'Return result', icon: '↩️' },
];

const PROBLEMS: Problem[] = [
  {
    title: 'Sort Customer Orders',
    description: 'Sort a list of customer order values from lowest to highest priority.',
    input: '[45, 12, 67, 23, 89]',
    expectedOutput: '[12, 23, 45, 67, 89]',
    solution: ['for-loop', 'sort-list', 'return-value'],
    testCases: [
      { input: '[5, 2, 8]', output: '[2, 5, 8]' },
      { input: '[100, 50, 75]', output: '[50, 75, 100]' },
    ],
  },
  {
    title: 'Filter High Priority',
    description: 'Find all items with a value greater than 50.',
    input: '[45, 67, 23, 89, 12]',
    expectedOutput: '[67, 89]',
    solution: ['for-loop', 'if-condition', 'compare-greater', 'add-to-list', 'return-value'],
    testCases: [
      { input: '[30, 60, 40]', output: '[60]' },
      { input: '[100, 25, 75]', output: '[100, 75]' },
    ],
  },
  {
    title: 'Find Maximum Value',
    description: 'Find the highest value in the list of orders.',
    input: '[45, 67, 23, 89, 12]',
    expectedOutput: '89',
    solution: ['set-variable', 'for-loop', 'if-condition', 'compare-greater', 'set-variable', 'return-value'],
    testCases: [
      { input: '[10, 50, 30]', output: '50' },
      { input: '[100, 25, 75]', output: '100' },
    ],
  },
];

interface AlgorithmBuilderChallengeProps {
  onComplete: (score: number) => void;
}

export function AlgorithmBuilderChallenge({ onComplete }: AlgorithmBuilderChallengeProps) {
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
  const [selectedBlocks, setSelectedBlocks] = useState<CodeBlock[]>([]);
  const [testResults, setTestResults] = useState<boolean[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [problemScores, setProblemScores] = useState<number[]>([]);

  const currentProblem = PROBLEMS[currentProblemIndex];

  const handleBlockClick = (block: CodeBlock) => {
    if (selectedBlocks.length < 10) {
      setSelectedBlocks([...selectedBlocks, block]);
    }
  };

  const handleRemoveBlock = (index: number) => {
    setSelectedBlocks(selectedBlocks.filter((_, i) => i !== index));
  };

  const handleRun = () => {
    // Check if solution matches
    const selectedIds = selectedBlocks.map(b => b.id);
    const solutionIds = currentProblem.solution;
    
    // Check if blocks are correct (order matters)
    const isCorrect = selectedIds.length === solutionIds.length &&
      selectedIds.every((id, idx) => id === solutionIds[idx]);
    
    // Simulate test results
    const results = currentProblem.testCases.map(() => isCorrect);
    setTestResults(results);
    setShowResults(true);

    // Calculate score for this problem
    const correctnessScore = isCorrect ? 50 : 0;
    const efficiencyScore = Math.max(0, 30 - (selectedIds.length - solutionIds.length) * 5);
    const eleganceScore = isCorrect ? 20 : 0;
    const problemScore = correctnessScore + efficiencyScore + eleganceScore;
    
    setProblemScores([...problemScores, problemScore]);
  };

  const handleNext = () => {
    if (currentProblemIndex < PROBLEMS.length - 1) {
      setCurrentProblemIndex(prev => prev + 1);
      setSelectedBlocks([]);
      setTestResults([]);
      setShowResults(false);
    } else {
      // Calculate final score
      const totalScore = [...problemScores, problemScores[problemScores.length]].reduce((a, b) => a + b, 0);
      const avgScore = Math.round(totalScore / PROBLEMS.length);
      onComplete(Math.min(100, avgScore));
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Code2 className="w-8 h-8 text-green-600" />
            <h3 className="text-2xl font-bold text-gray-900">
              Algorithm Builder
            </h3>
          </div>
          <div className="flex gap-2">
            {PROBLEMS.map((_, idx) => (
              <div
                key={idx}
                className={`w-3 h-3 rounded-full ${
                  idx < currentProblemIndex
                    ? 'bg-green-500'
                    : idx === currentProblemIndex
                    ? 'bg-emerald-500'
                    : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* Problem Description */}
          <div className="bg-blue-50 rounded-xl p-6">
            <h4 className="font-bold text-xl text-gray-900 mb-3">
              {currentProblem.title}
            </h4>
            <p className="text-gray-700 mb-4">{currentProblem.description}</p>
            
            <div className="space-y-2">
              <div className="bg-white rounded-lg p-3">
                <div className="text-sm font-semibold text-gray-600 mb-1">Input:</div>
                <code className="text-green-600">{currentProblem.input}</code>
              </div>
              <div className="bg-white rounded-lg p-3">
                <div className="text-sm font-semibold text-gray-600 mb-1">Expected Output:</div>
                <code className="text-blue-600">{currentProblem.expectedOutput}</code>
              </div>
            </div>
          </div>

          {/* Code Blocks Palette */}
          <div className="bg-gray-50 rounded-xl p-6">
            <h4 className="font-bold text-gray-900 mb-4">Code Blocks</h4>
            <div className="grid grid-cols-2 gap-2">
              {CODE_BLOCKS.map(block => (
                <button
                  key={block.id}
                  onClick={() => handleBlockClick(block)}
                  className="flex items-center gap-2 p-3 bg-white rounded-lg border-2 border-gray-200 hover:border-green-500 transition-all text-left group"
                >
                  <span className="text-2xl">{block.icon}</span>
                  <span className="text-sm font-medium text-gray-700 group-hover:text-green-600">
                    {block.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Algorithm Building Area */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 mb-6 min-h-[200px]">
          <div className="flex items-center gap-2 mb-4">
            <Code2 className="w-5 h-5 text-green-400" />
            <span className="text-green-400 font-mono text-sm">Your Algorithm</span>
          </div>
          
          {selectedBlocks.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              Click blocks above to build your algorithm
            </div>
          ) : (
            <div className="space-y-2">
              {selectedBlocks.map((block, index) => (
                <div
                  key={`${block.id}-${index}`}
                  onClick={() => handleRemoveBlock(index)}
                  className="flex items-center gap-3 bg-gray-700 hover:bg-gray-600 rounded-lg p-3 cursor-pointer transition-all group"
                  style={{ marginLeft: `${block.type === 'condition' ? 0 : 20}px` }}
                >
                  <span className="text-2xl">{block.icon}</span>
                  <span className="text-white font-mono text-sm flex-1">{block.label}</span>
                  <span className="text-gray-400 text-xs opacity-0 group-hover:opacity-100">Click to remove</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Test Results */}
        {showResults && (
          <div className="bg-green-50 rounded-xl p-6 mb-6">
            <h4 className="font-bold text-gray-900 mb-4">Test Results</h4>
            <div className="space-y-2">
              {currentProblem.testCases.map((test, idx) => (
                <div
                  key={idx}
                  className={`flex items-center gap-3 p-3 rounded-lg ${
                    testResults[idx] ? 'bg-green-100' : 'bg-red-100'
                  }`}
                >
                  {testResults[idx] ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : (
                    <span className="text-red-600">✗</span>
                  )}
                  <span className="text-sm font-mono">
                    Input: {test.input} → Expected: {test.output}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={() => setSelectedBlocks([])}
            className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
          >
            Clear
          </button>
          
          {!showResults ? (
            <button
              onClick={handleRun}
              disabled={selectedBlocks.length === 0}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="w-5 h-5" />
              Run Algorithm
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-colors"
            >
              {currentProblemIndex < PROBLEMS.length - 1 ? 'Next Problem' : 'Complete Challenge'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
