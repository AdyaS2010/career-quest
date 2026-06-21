import { useState, useEffect } from 'react';
import { Code2, Play, CheckCircle2, GripVertical, Trash2, Cpu, ArrowRight } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion, AnimatePresence } from 'framer-motion';
import { useAudio } from '../../contexts/AudioContext';

interface CodeBlock {
  id: string;
  type: 'loop' | 'condition' | 'function' | 'variable' | 'return';
  label: string;
  icon: string;
  uid?: string; // Unique ID for drag and drop
}

interface Problem {
  title: string;
  description: string;
  input: string;
  expectedOutput: string;
  solution: string[];
  testCases: { input: string; output: string; incorrectOutput?: string }[];
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
  { id: 'set-variable', type: 'variable', label: 'Set variable', icon: '📝' },
  { id: 'return-value', type: 'return', label: 'Return result', icon: '📤' },
];

const PROBLEMS: Problem[] = [
  {
    title: 'Filter High Priority',
    description: 'Find all items with a value greater than 50.',
    input: '[45, 67, 23, 89, 12]',
    expectedOutput: '[67, 89]',
    solution: ['for-loop', 'if-condition', 'compare-greater', 'add-to-list', 'return-value'],
    testCases: [
      { input: '[30, 60, 40]', output: '[60]', incorrectOutput: '[]' },
      { input: '[100, 25, 75]', output: '[100, 75]', incorrectOutput: '[100]' },
    ],
  },
  {
    title: 'Find Maximum Value',
    description: 'Find the highest value in the list of orders.',
    input: '[45, 67, 23, 89, 12]',
    expectedOutput: '89',
    solution: ['set-variable', 'for-loop', 'if-condition', 'compare-greater', 'set-variable', 'return-value'],
    testCases: [
      { input: '[10, 50, 30]', output: '50', incorrectOutput: '10' },
      { input: '[100, 25, 75]', output: '100', incorrectOutput: '25' },
    ],
  },
  {
    title: 'Sort Tasks by Urgency',
    description: 'Sort the list of incoming support tickets from most urgent to least urgent.',
    input: '[Medium, Low, Urgent, High]',
    expectedOutput: '[Urgent, High, Medium, Low]',
    solution: ['while-loop', 'for-loop', 'if-condition', 'compare-greater', 'swap-values', 'return-value'],
    testCases: [
      { input: '[Low, Urgent]', output: '[Urgent, Low]', incorrectOutput: '[Low, Urgent]' },
      { input: '[High, High, Low]', output: '[High, High, Low]', incorrectOutput: '[Low, High, High]' },
    ],
  },
];

interface AlgorithmBuilderChallengeProps {
  onComplete: (score: number) => void;
}

function SortableBlock({ block, onRemove, isActive }: { block: CodeBlock; onRemove: () => void; isActive: boolean }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.uid! });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    marginLeft: block.type === 'condition' ? 0 : 20,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 rounded-lg p-3 transition-all group ${isActive
        ? 'bg-yellow-500/20 border-2 border-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.3)]'
        : 'bg-gray-700 hover:bg-gray-600 border-2 border-transparent'
        } ${isDragging ? 'shadow-xl ring-2 ring-green-500' : ''}`}
    >
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-white">
        <GripVertical size={20} />
      </div>
      <span className="text-2xl">{block.icon}</span>
      <span className={`font-mono text-sm flex-1 ${isActive ? 'text-yellow-300 font-bold' : 'text-white'}`}>
        {block.label}
      </span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="text-gray-400 hover:text-red-400 transition-colors p-1"
      >
        <Trash2 size={18} />
      </button>
    </div>
  );
}

export function AlgorithmBuilderChallenge({ onComplete }: AlgorithmBuilderChallengeProps) {
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
  const [selectedBlocks, setSelectedBlocks] = useState<CodeBlock[]>([]);
  const [testResults, setTestResults] = useState<boolean[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [problemScores, setProblemScores] = useState<number[]>([]);
  const [executingBlockIndex, setExecutingBlockIndex] = useState<number | null>(null);
  const [variables, setVariables] = useState<Record<string, any>>({});
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const { playSfx } = useAudio();
  const [shuffledProblems, setShuffledProblems] = useState<Problem[]>([]);

  useEffect(() => {
    // Shuffle the problems and pick the first 3
    const shuffled = [...PROBLEMS].sort(() => Math.random() - 0.5).slice(0, 3);
    setShuffledProblems(shuffled);
  }, []);

  const currentProblem = shuffledProblems[currentProblemIndex];

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleBlockClick = (block: CodeBlock) => {
    if (selectedBlocks.length < 10) {
      playSfx('click');
      const newBlock = { ...block, uid: Math.random().toString(36).substr(2, 9) };
      setSelectedBlocks([...selectedBlocks, newBlock]);
    }
  };

  const handleRemoveBlock = (uid: string) => {
    playSfx('click');
    setSelectedBlocks(selectedBlocks.filter(b => b.uid !== uid));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      playSfx('click');
      setSelectedBlocks((items) => {
        const oldIndex = items.findIndex((item) => item.uid === active.id);
        const newIndex = items.findIndex((item) => item.uid === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const simulateExecution = async () => {
    setVariables({});

    // Animate execution step by step
    for (let i = 0; i < selectedBlocks.length; i++) {
      setExecutingBlockIndex(i);
      playSfx('click'); // Mechanical click sound for each step

      // Update fake variables for visualization
      const block = selectedBlocks[i];
      if (block.type === 'variable') {
        setVariables(prev => ({ ...prev, 'maxValue': Math.floor(Math.random() * 100) }));
      } else if (block.type === 'loop') {
        setVariables(prev => ({ ...prev, 'i': (prev['i'] || 0) + 1 }));
      }

      await new Promise(resolve => setTimeout(resolve, 600));
    }

    setExecutingBlockIndex(null);
    handleRun();
  };

  const handleRun = () => {
    // Check if solution matches
    const selectedIds = selectedBlocks.map(b => b.id);
    const solutionIds = currentProblem.solution;

    // Check if blocks are correct (order matters)
    const isCorrect = selectedIds.length === solutionIds.length &&
      selectedIds.every((id, idx) => id === solutionIds[idx]);

    if (isCorrect) playSfx('success');
    else playSfx('error');

    // Generate Helpful Feedback if incorrect
    if (!isCorrect) {
      if (selectedIds.length === 0) {
        setFeedbackMessage("You need to add some action blocks to build the algorithm!");
      } else if (selectedIds.length < solutionIds.length) {
        setFeedbackMessage("Your algorithm might be missing some steps. Are you sure you covered all parts of the logic?");
      } else if (selectedIds.length > solutionIds.length) {
        setFeedbackMessage("Your algorithm has extra steps! Try finding the most efficient path.");
      } else {
        // Same length, find the first mismatch
        const firstMismatchIndex = selectedIds.findIndex((id, idx) => id !== solutionIds[idx]);
        if (firstMismatchIndex !== -1) {
          const label = CODE_BLOCKS.find(b => b.id === selectedIds[firstMismatchIndex])?.label;
          setFeedbackMessage(`Your logic goes off track around step ${firstMismatchIndex + 1}. The "${label}" block might not be what you need at that exact moment.`);
        } else {
          setFeedbackMessage("Your algorithm isn't quite right. Review the logic and try again!");
        }
      }
    } else {
      setFeedbackMessage(null);
    }

    // Simulate test results
    const results = currentProblem.testCases.map(() => isCorrect);
    setTestResults(results);
    setShowResults(true);

    if (isCorrect) {
      // Calculate score for this problem only if correct
      const correctnessScore = 50;
      const efficiencyScore = Math.max(0, 30 - (selectedIds.length - solutionIds.length) * 5);
      const eleganceScore = 20;
      const problemScore = correctnessScore + efficiencyScore + eleganceScore;

      setProblemScores([...problemScores, problemScore]);
    }
  };

  const handleNext = () => {
    playSfx('click');
    if (currentProblemIndex < shuffledProblems.length - 1) {
      setCurrentProblemIndex(prev => prev + 1);
      setSelectedBlocks([]);
      setTestResults([]);
      setShowResults(false);
      setVariables({});
      setFeedbackMessage(null);
    } else {
      // Calculate final score
      const totalScore = problemScores.reduce((a, b) => a + Number(b), 0);
      const avgScore = Math.round(totalScore / shuffledProblems.length);
      onComplete(Math.min(100, avgScore));
    }
  };

  if (shuffledProblems.length === 0) return null;

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
            {shuffledProblems.map((_, idx) => (
              <div
                key={idx}
                className={`w-3 h-3 rounded-full ${idx < currentProblemIndex
                  ? 'bg-green-500'
                  : idx === currentProblemIndex
                    ? 'bg-emerald-500'
                    : 'bg-gray-300'
                  }`}
              />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6 mb-6">
          {/* Problem Description */}
          <div className="col-span-4 bg-blue-50 rounded-xl p-6">
            <h4 className="font-bold text-xl text-gray-900 mb-3">
              {currentProblem.title}
            </h4>
            <div className="bg-blue-100/50 border border-blue-200 rounded-lg p-3 mb-4 text-sm text-blue-800">
              <strong>Objective:</strong> Drag action blocks from the toolbox on the right into the middle panel to build a step-by-step algorithm. Structure your logic in the exact sequence needed to solve the problem (e.g., initial setup, loop, condition, action, return).
            </div>
            <p className="text-gray-700 mb-4">{currentProblem.description}</p>

            <div className="space-y-2">
              <div className="bg-white rounded-lg p-3 border border-blue-100">
                <div className="text-sm font-semibold text-gray-600 mb-1">Input:</div>
                <code className="text-green-600 font-mono bg-green-50 px-2 py-1 rounded">{currentProblem.input}</code>
              </div>
              <div className="bg-white rounded-lg p-3 border border-blue-100">
                <div className="text-sm font-semibold text-gray-600 mb-1">Expected Output:</div>
                <code className="text-blue-600 font-mono bg-blue-50 px-2 py-1 rounded">{currentProblem.expectedOutput}</code>
              </div>
            </div>

            {/* Variable Watcher */}
            <div className="mt-6 bg-gray-900 rounded-xl p-4 text-green-400 font-mono text-sm min-h-[150px]">
              <div className="flex items-center gap-2 border-b border-gray-700 pb-2 mb-2">
                <Cpu size={16} />
                <span>Memory Watch</span>
              </div>
              {Object.keys(variables).length === 0 ? (
                <span className="text-gray-500 italic">// Variables will appear here during execution...</span>
              ) : (
                <div className="space-y-1">
                  {Object.entries(variables).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-blue-400">{key}:</span>
                      <span className="text-yellow-400">{value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Algorithm Building Area */}
          <div className="col-span-5 bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 min-h-[500px] flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <Code2 className="w-5 h-5 text-green-400" />
              <span className="text-green-400 font-mono text-sm">Main Function</span>
            </div>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={selectedBlocks.map(b => b.uid!)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2 flex-1">
                  <AnimatePresence>
                    {selectedBlocks.length === 0 ? (
                      <div className="text-center text-gray-500 py-8 border-2 border-dashed border-gray-700 rounded-lg">
                        Drag blocks here to build your algorithm
                      </div>
                    ) : (
                      selectedBlocks.map((block, index) => (
                        <SortableBlock
                          key={block.uid}
                          block={block}
                          onRemove={() => handleRemoveBlock(block.uid!)}
                          isActive={executingBlockIndex === index}
                        />
                      ))
                    )}
                  </AnimatePresence>
                </div>
              </SortableContext>
            </DndContext>
          </div>

          {/* Code Blocks Palette */}
          <div className="col-span-3 bg-gray-50 rounded-xl p-4 h-full overflow-y-auto max-h-[600px]">
            <h4 className="font-bold text-gray-900 mb-4 sticky top-0 bg-gray-50 pb-2">Toolbox</h4>
            <div className="space-y-2">
              {CODE_BLOCKS.map(block => (
                <button
                  key={block.id}
                  onClick={() => handleBlockClick(block)}
                  className="w-full flex items-center gap-2 p-3 bg-white rounded-lg border-2 border-gray-200 hover:border-green-500 transition-all text-left group transform hover:translate-x-1"
                >
                  <span className="text-xl">{block.icon}</span>
                  <span className="text-sm font-medium text-gray-700 group-hover:text-green-600">
                    {block.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Test Results */}
        <AnimatePresence>
          {showResults && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-green-50 rounded-xl p-6 mb-6 overflow-hidden"
            >
              <h4 className="font-bold text-gray-900 mb-4">Test Results</h4>
              <div className="space-y-2">
                {currentProblem.testCases.map((test, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: idx * 0.1 }}
                    className={`flex items-center gap-3 p-3 rounded-lg ${testResults[idx] ? 'bg-green-100' : 'bg-red-100'
                      }`}
                  >
                    {testResults[idx] ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : (
                      <span className="text-red-600">✗</span>
                    )}
                    <span className="text-sm font-mono flex flex-wrap gap-x-4">
                      <span>Input: {test.input}</span>
                      <span className="text-gray-500">
                        <ArrowRight className="inline w-3 h-3 mx-1" /> Expected: {test.output}
                      </span>
                      <span className={`${testResults[idx] ? 'text-green-700 font-bold' : 'text-red-700 font-bold'}`}>
                        <ArrowRight className="inline w-3 h-3 mx-1" /> Output: {testResults[idx] ? test.output : test.incorrectOutput || 'undefined'}
                      </span>
                    </span>
                  </motion.div>
                ))}
              </div>

              {/* Feedback Message */}
              {feedbackMessage && !testResults[0] && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mt-4 p-4 bg-red-100 border border-red-200 text-red-800 rounded-lg text-sm font-medium flex gap-3 items-start"
                >
                  <div className="w-5 h-5 flex items-center justify-center shrink-0">💡</div>
                  <p>{feedbackMessage}</p>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={() => {
              playSfx('click');
              setSelectedBlocks([]);
            }}
            className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
          >
            Clear
          </button>

          {!showResults ? (
            <button
              onClick={simulateExecution}
              disabled={selectedBlocks.length === 0 || executingBlockIndex !== null}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95"
            >
              {executingBlockIndex !== null ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  >
                    <Cpu className="w-5 h-5" />
                  </motion.div>
                  Running...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  Run Algorithm
                </>
              )}
            </button>
          ) : !testResults[0] ? (
            <>
              <button
                onClick={() => {
                  setShowResults(false);
                  setFeedbackMessage(null);
                  setTestResults([]);
                }}
                className="flex-[2] px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors transform active:scale-95"
              >
                Retry Problem
              </button>
              <button
                onClick={handleNext}
                className="flex-1 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-xl transition-colors transform active:scale-95"
              >
                Skip
              </button>
            </>
          ) : (
            <button
              onClick={handleNext}
              className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-colors transform active:scale-95"
            >
              {currentProblemIndex < shuffledProblems.length - 1 ? 'Next Problem' : 'Complete Challenge'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
