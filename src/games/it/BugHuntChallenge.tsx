import { useState, useRef, useEffect } from 'react';
import { Bug, CheckCircle2, XCircle, Play, Terminal, Code2 } from 'lucide-react';
import { useAudio } from '../../contexts/AudioContext';
import { motion } from 'framer-motion';

interface CodeLine {
  id: number;
  code: string;
  hasBug: boolean;
  bugType?: 'syntax' | 'logic';
  explanation?: string;
  errorMessage?: string;
}

const CODE_SAMPLES: CodeLine[][] = [
  [
    { id: 1, code: 'function calculateTotal(items) {', hasBug: false },
    { id: 2, code: '  let total = 0;', hasBug: false },
    { id: 3, code: '  for (let i = 0; i <= items.length; i++) {', hasBug: true, bugType: 'logic', explanation: 'Off-by-one error: Loop goes out of bounds.', errorMessage: 'TypeError: Cannot read properties of undefined (reading \'price\')' },
    { id: 4, code: '    total += items[i].price;', hasBug: false },
    { id: 5, code: '  }', hasBug: false },
    { id: 6, code: '  return total;', hasBug: false },
    { id: 7, code: '}', hasBug: false },
  ],
  [
    { id: 1, code: 'class User {', hasBug: false },
    { id: 2, code: '  constructor(name, email) {', hasBug: false },
    { id: 3, code: '    this.name = name;', hasBug: false },
    { id: 4, code: '    this.email = email', hasBug: true, bugType: 'syntax', explanation: 'Missing semicolon at end of line.', errorMessage: 'SyntaxError: Unexpected token }' },
    { id: 5, code: '  }', hasBug: false },
    { id: 6, code: '  validateEmail() {', hasBug: false },
    { id: 7, code: '    return this.email.includes("@");', hasBug: false },
    { id: 8, code: '  }', hasBug: false },
    { id: 9, code: '}', hasBug: false },
  ],
  [
    { id: 1, code: 'function sortNumbers(arr) {', hasBug: false },
    { id: 2, code: '  return arr.sort();', hasBug: true, bugType: 'logic', explanation: 'Default sort converts numbers to strings.', errorMessage: 'AssertionError: Expected [5, 10, 25, 40] but got [10, 25, 40, 5]' },
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
  const [consoleOutput, setConsoleOutput] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [hasRun, setHasRun] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState<{ lineId: number; correct: boolean; explanation?: string } | null>(null);
  const { playSfx } = useAudio();
  const consoleRef = useRef<HTMLDivElement>(null);

  const currentCode = CODE_SAMPLES[currentCodeIndex];
  const bugsInCode = currentCode.filter(line => line.hasBug).length;

  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [consoleOutput]);

  const runCode = () => {
    if (isRunning) return;
    setIsRunning(true);
    setConsoleOutput(['> Compiling...', '> Running tests...']);
    playSfx('click');

    setTimeout(() => {
      const bugs = currentCode.filter(line => line.hasBug);
      const newOutput = [...consoleOutput];

      if (bugs.length > 0) {
        newOutput.push(`❌ Error detected!`);
        bugs.forEach(bug => {
          if (bug.errorMessage) {
            newOutput.push(`   ${bug.errorMessage}`);
          }
        });
        playSfx('error');
      } else {
        newOutput.push('✅ All tests passed!');
        playSfx('success');
      }

      setConsoleOutput(newOutput);
      setIsRunning(false);
      setHasRun(true);
    }, 1500);
  };

  const handleLineClick = (line: CodeLine) => {
    if (!hasRun) {
      setConsoleOutput(prev => [...prev, '⚠️ Please run the code first to identify errors!']);
      return;
    }

    if (showFeedback || selectedLines.has(line.id)) return;

    const newSelected = new Set(selectedLines);

    if (line.hasBug) {
      // Correct bug found
      newSelected.add(line.id);
      setSelectedLines(newSelected);
      setFeedback({ lineId: line.id, correct: true, explanation: line.explanation });
      setShowFeedback(true);
      playSfx('success');

      setConsoleOutput(prev => [...prev, `> Fixing line ${line.id}...`, `✅ Bug fixed: ${line.explanation}`]);

      setTimeout(() => {
        setShowFeedback(false);
        setFeedback(null);
      }, 2000);
    } else {
      // False positive
      setFeedback({ lineId: line.id, correct: false });
      setShowFeedback(true);
      playSfx('error');

      setConsoleOutput(prev => [...prev, `> Checking line ${line.id}...`, `ℹ️ No issues found on this line.`]);

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
    const incorrectCount = selectedLines.size - bugsFound; // Actually, incorrect clicks don't add to selectedLines in this logic, but let's keep it simple

    setResults([...results, { correct: correctCount, incorrect: incorrectCount }]);

    if (currentCodeIndex < CODE_SAMPLES.length - 1) {
      setCurrentCodeIndex(prev => prev + 1);
      setSelectedLines(new Set());
      setConsoleOutput([]);
      setHasRun(false);
      setShowFeedback(false);
      setFeedback(null);
    } else {
      // Calculate final score
      const totalCorrect = [...results, { correct: correctCount, incorrect: incorrectCount }]
        .reduce((sum, r) => sum + r.correct, 0);

      const totalBugs = CODE_SAMPLES.reduce((sum, code) =>
        sum + code.filter(line => line.hasBug).length, 0
      );

      const score = Math.max(0, Math.round((totalCorrect / totalBugs) * 100));
      onComplete(Math.min(100, score));
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-gray-900 rounded-xl shadow-2xl overflow-hidden border border-gray-700 flex flex-col h-[800px]">
        {/* IDE Header */}
        <div className="bg-gray-800 px-4 py-2 flex items-center justify-between border-b border-gray-700">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
            </div>
            <div className="ml-4 flex items-center gap-2 text-gray-400 bg-gray-900 px-3 py-1 rounded text-sm font-mono">
              <Code2 size={14} />
              challenge_{currentCodeIndex + 1}.js
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex gap-1">
              {CODE_SAMPLES.map((_, idx) => (
                <div
                  key={idx}
                  className={`w-2 h-2 rounded-full ${idx < currentCodeIndex
                    ? 'bg-green-500'
                    : idx === currentCodeIndex
                      ? 'bg-blue-500'
                      : 'bg-gray-600'
                    }`}
                />
              ))}
            </div>
            <button
              onClick={runCode}
              disabled={isRunning || hasRun}
              className={`flex items-center gap-2 px-4 py-1.5 rounded font-bold text-sm transition-colors ${isRunning || hasRun
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
            >
              <Play size={14} />
              {isRunning ? 'Running...' : 'Run Code'}
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Line Numbers & Code */}
          <div className="flex-1 overflow-y-auto p-4 font-mono text-sm relative">
            {currentCode.map((line) => {
              const isSelected = selectedLines.has(line.id);
              const isFeedbackLine = feedback?.lineId === line.id;

              return (
                <div
                  key={line.id}
                  onClick={() => handleLineClick(line)}
                  className={`group flex items-center py-1 px-2 rounded cursor-pointer transition-all ${isSelected
                    ? 'bg-green-900/30 border-l-2 border-green-500'
                    : isFeedbackLine
                      ? feedback.correct
                        ? 'bg-green-900/50'
                        : 'bg-red-900/50'
                      : 'hover:bg-gray-800'
                    }`}
                >
                  <span className="text-gray-600 w-8 text-right mr-4 select-none">{line.id}</span>
                  <span className={`${isSelected ? 'text-green-300' : 'text-gray-300'}`}>
                    {line.code || ' '}
                  </span>

                  {isSelected && line.hasBug && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="ml-auto flex items-center gap-2 text-green-400 text-xs"
                    >
                      <CheckCircle2 size={14} />
                      <span>Fixed</span>
                    </motion.div>
                  )}

                  {isFeedbackLine && !feedback.correct && (
                    <motion.div
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="ml-auto flex items-center gap-2 text-red-400 text-xs"
                    >
                      <XCircle size={14} />
                      <span>No bug here</span>
                    </motion.div>
                  )}
                </div>
              );
            })}

            {/* Overlay for "Run First" */}
            {!hasRun && (
              <div className="absolute inset-0 bg-gray-900/10 backdrop-blur-[1px] flex items-center justify-center pointer-events-none">
                <div className="bg-gray-800 text-white px-6 py-3 rounded-xl shadow-xl border border-gray-600 flex items-center gap-3 animate-bounce">
                  <Play size={20} className="text-green-500" />
                  <span>Click "Run Code" to start debugging!</span>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar / Info Panel */}
          <div className="w-80 bg-gray-800 border-l border-gray-700 p-4 flex flex-col">
            <div className="mb-6">
              <h3 className="text-gray-100 font-bold flex items-center gap-2 mb-2">
                <Bug className="text-blue-400" size={18} />
                Mission Brief
              </h3>
              <p className="text-gray-400 text-sm">
                Analyze the code, run the diagnostics, and fix the {bugsInCode} bug(s) causing the system failure.
              </p>
            </div>

            <div className="flex-1 flex flex-col min-h-0">
              <h3 className="text-gray-100 font-bold flex items-center gap-2 mb-2">
                <Terminal className="text-gray-400" size={18} />
                Debug Console
              </h3>
              <div
                ref={consoleRef}
                className="flex-1 bg-black rounded-lg p-3 font-mono text-xs text-gray-300 overflow-y-auto border border-gray-700 shadow-inner"
              >
                {consoleOutput.length === 0 ? (
                  <span className="text-gray-600 italic">Ready to compile...</span>
                ) : (
                  consoleOutput.map((log, i) => (
                    <div key={i} className={`mb-1 ${log.includes('❌') ? 'text-red-400' :
                      log.includes('✅') ? 'text-green-400' :
                        log.includes('⚠️') ? 'text-yellow-400' : ''
                      }`}>
                      {log}
                    </div>
                  ))
                )}
                {isRunning && (
                  <motion.div
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ repeat: Infinity, duration: 0.8 }}
                    className="w-2 h-4 bg-gray-400 inline-block align-middle ml-1"
                  />
                )}
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-700">
              <div className="flex justify-between items-center mb-4 text-sm">
                <span className="text-gray-400">Progress</span>
                <span className="text-white font-bold">{selectedLines.size} / {bugsInCode} Fixed</span>
              </div>
              <button
                onClick={() => {
                  playSfx('click');
                  handleSubmit();
                }}
                disabled={selectedLines.size !== bugsInCode}
                className={`w-full py-3 rounded-lg font-bold transition-all ${selectedLines.size === bugsInCode
                  ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg hover:shadow-blue-500/25'
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  }`}
              >
                {currentCodeIndex < CODE_SAMPLES.length - 1 ? 'Next Challenge' : 'Submit Report'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

