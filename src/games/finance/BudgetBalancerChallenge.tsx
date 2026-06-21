import { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, XCircle, DollarSign, ArrowRight, TrendingUp } from 'lucide-react';
import { useAudio } from '../../contexts/AudioContext';
import { motion, AnimatePresence } from 'framer-motion';

interface Transaction {
    id: number;
    description: string;
    amount: number;
    correctCategory: string;
}

const BUDGET_CATEGORIES = ['Operating', 'Capital', 'Marketing', 'Payroll', 'Miscellaneous'];

const ALL_TRANSACTIONS: Transaction[] = [
    { id: 1, description: 'Monthly office rent', amount: 3500, correctCategory: 'Operating' },
    { id: 2, description: 'Employee health insurance premiums', amount: 2200, correctCategory: 'Payroll' },
    { id: 3, description: 'Google Ads campaign', amount: 1500, correctCategory: 'Marketing' },
    { id: 4, description: 'New server hardware', amount: 8000, correctCategory: 'Capital' },
    { id: 5, description: 'Team lunch outing', amount: 320, correctCategory: 'Miscellaneous' },
    { id: 6, description: 'Software developer salary', amount: 7500, correctCategory: 'Payroll' },
    { id: 7, description: 'Electric bill', amount: 450, correctCategory: 'Operating' },
    { id: 8, description: 'Trade show booth rental', amount: 2800, correctCategory: 'Marketing' },
    { id: 9, description: 'Standing desks for new hires', amount: 1200, correctCategory: 'Capital' },
    { id: 10, description: 'Printer paper and supplies', amount: 85, correctCategory: 'Miscellaneous' },
    { id: 11, description: 'Cloud hosting subscription', amount: 600, correctCategory: 'Operating' },
    { id: 12, description: 'Social media influencer partnership', amount: 3000, correctCategory: 'Marketing' },
    { id: 13, description: 'Year-end bonuses', amount: 5000, correctCategory: 'Payroll' },
    { id: 14, description: 'Company vehicle purchase', amount: 25000, correctCategory: 'Capital' },
    { id: 15, description: 'Coffee machine for break room', amount: 250, correctCategory: 'Miscellaneous' },
    { id: 16, description: 'Internet service provider bill', amount: 150, correctCategory: 'Operating' },
    { id: 17, description: 'Billboard advertisement', amount: 4500, correctCategory: 'Marketing' },
    { id: 18, description: 'Intern stipends', amount: 1800, correctCategory: 'Payroll' },
];

interface BudgetBalancerChallengeProps {
    onComplete: (score: number) => void;
}

export function BudgetBalancerChallenge({ onComplete }: BudgetBalancerChallengeProps) {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [phase, setPhase] = useState<'scenario' | 'playing' | 'feedback' | 'results'>('scenario');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
    const [correctCount, setCorrectCount] = useState(0);
    const [timeLeft, setTimeLeft] = useState(90);
    const [totalTransactions] = useState(10);
    const { playSfx } = useAudio();

    useEffect(() => {
        // Shuffle and pick 10 transactions
        const shuffled = [...ALL_TRANSACTIONS].sort(() => Math.random() - 0.5);
        setTransactions(shuffled.slice(0, 10));
    }, []);

    useEffect(() => {
        if (phase === 'playing' && timeLeft > 0) {
            const timer = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        // Time's up
                        const finalScore = Math.round((correctCount / totalTransactions) * 100);
                        onComplete(Math.min(100, finalScore));
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [phase, timeLeft, correctCount, totalTransactions, onComplete]);

    const handleCategorySelect = useCallback((category: string) => {
        if (isCorrect !== null) return; // Already answered
        const current = transactions[currentIndex];
        if (!current) return;

        setSelectedCategory(category);
        const correct = category === current.correctCategory;
        setIsCorrect(correct);

        if (correct) {
            playSfx('success');
            setCorrectCount(prev => prev + 1);
        } else {
            playSfx('error');
        }

        setPhase('feedback');
    }, [isCorrect, transactions, currentIndex, playSfx]);

    const handleNext = useCallback(() => {
        if (currentIndex < transactions.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setSelectedCategory(null);
            setIsCorrect(null);
            setPhase('playing');
        } else {
            setPhase('results');
        }
    }, [currentIndex, transactions.length]);

    const currentTransaction = transactions[currentIndex];

    if (phase === 'scenario') {
        return (
            <div className="max-w-3xl mx-auto p-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-3xl shadow-2xl overflow-hidden"
                >
                    <div className="bg-gradient-to-r from-teal-600 to-emerald-600 p-8 text-white">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                                <DollarSign className="w-10 h-10" />
                            </div>
                            <div>
                                <h2 className="text-3xl font-bold">Budget Balancer</h2>
                                <p className="text-teal-100">Financial Services • Beginner</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-8">
                        <div className="bg-teal-50 border-l-4 border-teal-500 p-6 rounded-r-xl mb-6">
                            <h3 className="font-bold text-teal-900 text-lg mb-2">📋 Scenario Briefing</h3>
                            <p className="text-teal-800 leading-relaxed">
                                You've just been hired as a junior financial analyst at a growing tech startup.
                                The CEO needs you to review this month's expenses and sort them into the correct
                                budget categories before tomorrow's board meeting. Get them right to prove
                                yourself — the company's budget depends on accurate record-keeping!
                            </p>
                        </div>

                        <div className="grid grid-cols-5 gap-2 mb-6">
                            {BUDGET_CATEGORIES.map(cat => (
                                <div key={cat} className="bg-gray-50 rounded-xl p-3 text-center">
                                    <div className="text-sm font-bold text-gray-700">{cat}</div>
                                </div>
                            ))}
                        </div>

                        <div className="flex items-center justify-between text-sm text-gray-500 mb-6">
                            <span>⏱️ 90 seconds</span>
                            <span>📦 10 transactions</span>
                            <span>🏆 100 points max</span>
                        </div>

                        <button
                            onClick={() => {
                                playSfx('click');
                                setPhase('playing');
                            }}
                            className="w-full py-4 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-bold rounded-xl text-lg transition-all transform hover:scale-[1.02] shadow-lg"
                        >
                            Start Balancing! 💼
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    if (phase === 'results') {
        const finalScore = Math.round((correctCount / totalTransactions) * 100);
        const timeBonus = timeLeft > 0 ? Math.round((timeLeft / 90) * 10) : 0;
        const totalScore = Math.min(100, finalScore + timeBonus);

        return (
            <div className="max-w-2xl mx-auto p-6">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-3xl shadow-2xl p-8 text-center"
                >
                    <div className="text-6xl mb-4">{totalScore >= 80 ? '🏆' : totalScore >= 50 ? '📊' : '📉'}</div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Budget Review Complete!</h2>
                    <p className="text-gray-600 mb-6">
                        {totalScore >= 80
                            ? "The CEO is impressed! Your accuracy saved the board meeting."
                            : totalScore >= 50
                                ? "Good effort, but some expenses were miscategorized. Keep practicing!"
                                : "The books don't balance. The CFO is calling an emergency meeting..."}
                    </p>

                    <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="bg-teal-50 rounded-xl p-4">
                            <div className="text-2xl font-bold text-teal-700">{correctCount}/{totalTransactions}</div>
                            <div className="text-sm text-teal-600">Correct</div>
                        </div>
                        <div className="bg-blue-50 rounded-xl p-4">
                            <div className="text-2xl font-bold text-blue-700">+{timeBonus}</div>
                            <div className="text-sm text-blue-600">Time Bonus</div>
                        </div>
                        <div className="bg-emerald-50 rounded-xl p-4">
                            <div className="text-2xl font-bold text-emerald-700">{totalScore}</div>
                            <div className="text-sm text-emerald-600">Final Score</div>
                        </div>
                    </div>

                    <button
                        onClick={() => onComplete(totalScore)}
                        className="w-full py-4 bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-bold rounded-xl text-lg transition-all hover:from-teal-600 hover:to-emerald-600"
                    >
                        Continue
                    </button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-teal-600 to-emerald-600 p-5 text-white flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <DollarSign className="w-7 h-7" />
                        <div>
                            <h3 className="text-lg font-bold">Budget Balancer</h3>
                            <p className="text-teal-100 text-sm">Transaction {currentIndex + 1} of {transactions.length}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <div className="text-xs text-teal-200">Score</div>
                            <div className="font-bold text-lg">{correctCount * 10}</div>
                        </div>
                        <div className={`px-3 py-1 rounded-full font-mono font-bold text-lg ${timeLeft <= 15 ? 'bg-red-500 animate-pulse' : 'bg-white/20'}`}>
                            {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                        </div>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="h-2 bg-gray-100">
                    <div
                        className="h-full bg-gradient-to-r from-teal-400 to-emerald-400 transition-all duration-500"
                        style={{ width: `${(currentIndex / transactions.length) * 100}%` }}
                    />
                </div>

                <div className="p-8">
                    <AnimatePresence mode="wait">
                        {currentTransaction && (phase === 'playing' || phase === 'feedback') && (
                            <motion.div
                                key={currentTransaction.id}
                                initial={{ opacity: 0, x: 50 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -50 }}
                            >
                                {/* Transaction Card */}
                                <div className="bg-gradient-to-br from-gray-50 to-teal-50 rounded-2xl p-8 mb-8 border border-teal-100">
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-sm font-medium">
                                            Transaction #{currentTransaction.id}
                                        </span>
                                        <TrendingUp className="w-5 h-5 text-teal-400" />
                                    </div>
                                    <h4 className="text-2xl font-bold text-gray-900 mb-2">
                                        {currentTransaction.description}
                                    </h4>
                                    <div className="text-3xl font-bold text-teal-700">
                                        ${currentTransaction.amount.toLocaleString()}
                                    </div>
                                </div>

                                {/* Category Selection */}
                                <div className="mb-4">
                                    <p className="text-gray-600 font-medium mb-4 text-center">
                                        {phase === 'feedback'
                                            ? (isCorrect ? '✅ Correct!' : `❌ Wrong — this belongs in "${currentTransaction.correctCategory}"`)
                                            : 'Which budget category does this belong to?'}
                                    </p>
                                    <div className="grid grid-cols-5 gap-3">
                                        {BUDGET_CATEGORIES.map(cat => {
                                            let style = 'bg-white border-2 border-gray-200 hover:border-teal-400 hover:bg-teal-50 text-gray-700';
                                            if (phase === 'feedback') {
                                                if (cat === currentTransaction.correctCategory) {
                                                    style = 'bg-green-100 border-2 border-green-500 text-green-800';
                                                } else if (cat === selectedCategory && !isCorrect) {
                                                    style = 'bg-red-100 border-2 border-red-500 text-red-800';
                                                } else {
                                                    style = 'bg-gray-50 border-2 border-gray-100 text-gray-400';
                                                }
                                            } else if (cat === selectedCategory) {
                                                style = 'bg-teal-100 border-2 border-teal-500 text-teal-800';
                                            }

                                            return (
                                                <button
                                                    key={cat}
                                                    onClick={() => phase === 'playing' && handleCategorySelect(cat)}
                                                    disabled={phase === 'feedback'}
                                                    className={`p-4 rounded-xl font-semibold transition-all text-center ${style}`}
                                                >
                                                    {cat}
                                                    {phase === 'feedback' && cat === currentTransaction.correctCategory && (
                                                        <CheckCircle2 className="w-5 h-5 mx-auto mt-1 text-green-600" />
                                                    )}
                                                    {phase === 'feedback' && cat === selectedCategory && !isCorrect && (
                                                        <XCircle className="w-5 h-5 mx-auto mt-1 text-red-600" />
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {phase === 'feedback' && (
                                    <motion.button
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        onClick={handleNext}
                                        className="w-full py-4 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-bold rounded-xl text-lg transition-all flex items-center justify-center gap-2"
                                    >
                                        {currentIndex < transactions.length - 1 ? (
                                            <>Next Transaction <ArrowRight className="w-5 h-5" /></>
                                        ) : (
                                            'See Results 🏆'
                                        )}
                                    </motion.button>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
