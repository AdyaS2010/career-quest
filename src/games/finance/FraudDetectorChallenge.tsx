import { useState, useCallback } from 'react';
import { Shield, AlertTriangle, CheckCircle2, XCircle, ArrowRight, Eye, MapPin, Clock, CreditCard } from 'lucide-react';
import { useAudio } from '../../contexts/AudioContext';
import { motion, AnimatePresence } from 'framer-motion';

interface FlaggedTransaction {
    id: number;
    accountHolder: string;
    amount: number;
    merchant: string;
    location: string;
    time: string;
    category: string;
    isFraud: boolean;
    redFlags: string[];
    explanation: string;
}

const TRANSACTIONS_POOL: FlaggedTransaction[] = [
    {
        id: 1,
        accountHolder: 'Alice M.',
        amount: 4999.99,
        merchant: 'ElectroBuy Online',
        location: 'New York, NY',
        time: '2:47 AM',
        category: 'Electronics',
        isFraud: true,
        redFlags: ['Unusually large amount', 'Transaction at 2:47 AM', 'Amount just under $5,000 reporting threshold'],
        explanation: 'The amount is structured to stay just under the $5,000 reporting threshold  -  a classic smurfing technique. The 2:47 AM timestamp is also suspicious.'
    },
    {
        id: 2,
        accountHolder: 'Bob K.',
        amount: 45.00,
        merchant: 'Corner Coffee Shop',
        location: 'Chicago, IL',
        time: '8:15 AM',
        category: 'Food & Dining',
        isFraud: false,
        redFlags: [],
        explanation: 'Normal coffee shop purchase at a reasonable time and amount. Consistent with typical consumer behavior.'
    },
    {
        id: 3,
        accountHolder: 'Carol D.',
        amount: 2300.00,
        merchant: 'Luxury Watches Direct',
        location: 'Miami, FL',
        time: '11:30 AM',
        category: 'Jewelry & Watches',
        isFraud: true,
        redFlags: ['Account holder is based in Seattle', 'First luxury purchase on this account', 'Shipping address differs from billing'],
        explanation: 'The purchase was made in Miami but the account holder lives in Seattle and has never bought luxury items before. Shipping address doesn\'t match billing.'
    },
    {
        id: 4,
        accountHolder: 'David R.',
        amount: 89.99,
        merchant: 'StreamFlix Premium',
        location: 'Online',
        time: '6:00 PM',
        category: 'Entertainment',
        isFraud: false,
        redFlags: [],
        explanation: 'Regular streaming subscription renewal. Consistent with account history.'
    },
    {
        id: 5,
        accountHolder: 'Eva S.',
        amount: 1200.00,
        merchant: 'QuickTransfer International',
        location: 'Online',
        time: '3:12 AM',
        category: 'Wire Transfer',
        isFraud: true,
        redFlags: ['International wire at 3 AM', 'First international transfer', 'Recipient in high-risk jurisdiction'],
        explanation: 'First-ever international wire transfer made at 3 AM to a high-risk jurisdiction. All major red flags for potential fraud or account compromise.'
    },
    {
        id: 6,
        accountHolder: 'Frank L.',
        amount: 156.78,
        merchant: 'AutoParts Express',
        location: 'Houston, TX',
        time: '2:30 PM',
        category: 'Auto & Parts',
        isFraud: false,
        redFlags: [],
        explanation: 'Regular auto parts purchase during business hours from a known retailer. Nothing suspicious.'
    },
    {
        id: 7,
        accountHolder: 'Grace W.',
        amount: 3500.00,
        merchant: 'GiftCards4All.biz',
        location: 'Online',
        time: '11:58 PM',
        category: 'Gift Cards',
        isFraud: true,
        redFlags: ['Bulk gift card purchase', 'Suspicious merchant domain (.biz)', 'Late-night transaction'],
        explanation: 'Bulk gift card purchases are a top indicator of fraud  -  gift cards are nearly untraceable. The .biz domain and late-night timing add more suspicion.'
    },
    {
        id: 8,
        accountHolder: 'Henry J.',
        amount: 67.50,
        merchant: 'City Gas Station #42',
        location: 'Portland, OR',
        time: '7:45 AM',
        category: 'Gas & Fuel',
        isFraud: false,
        redFlags: [],
        explanation: 'Typical morning gas fill-up at a local station. Amount and timing are normal.'
    },
    {
        id: 9,
        accountHolder: 'Iris N.',
        amount: 999.99,
        merchant: 'TechDeals Pro',
        location: 'Los Angeles, CA',
        time: '4:22 AM',
        category: 'Electronics',
        isFraud: true,
        redFlags: ['Duplicate charge  -  same merchant, same amount 3 minutes prior', 'Early morning hours'],
        explanation: 'This is a duplicate charge  -  the same exact amount was charged by the same merchant just 3 minutes earlier. Combined with the 4 AM timing, this is suspicious.'
    },
    {
        id: 10,
        accountHolder: 'Jake P.',
        amount: 234.00,
        merchant: 'Whole Foods Market',
        location: 'San Francisco, CA',
        time: '5:30 PM',
        category: 'Groceries',
        isFraud: false,
        redFlags: [],
        explanation: 'Large but reasonable grocery purchase at a known retailer during normal evening shopping hours.'
    },
];

interface FraudDetectorChallengeProps {
    onComplete: (score: number) => void;
}

export function FraudDetectorChallenge({ onComplete }: FraudDetectorChallengeProps) {
    const TOTAL_TO_REVIEW = 8;

    const [phase, setPhase] = useState<'scenario' | 'reviewing' | 'feedback' | 'results'>('scenario');
    const [transactions, setTransactions] = useState<FlaggedTransaction[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [decision, setDecision] = useState<'legitimate' | 'fraud' | null>(null);
    const [results, setResults] = useState<{ correct: boolean; wasFraud: boolean; falsePositive: boolean }[]>([]);
    const { playSfx } = useAudio();

    const startGame = useCallback(() => {
        // Shuffle and pick TOTAL_TO_REVIEW transactions, ensuring mix of fraud/legit
        const fraudItems = TRANSACTIONS_POOL.filter(t => t.isFraud).sort(() => Math.random() - 0.5).slice(0, 4);
        const legitItems = TRANSACTIONS_POOL.filter(t => !t.isFraud).sort(() => Math.random() - 0.5).slice(0, 4);
        const selected = [...fraudItems, ...legitItems].sort(() => Math.random() - 0.5);
        setTransactions(selected);
        setPhase('reviewing');
    }, []);

    const handleDecision = useCallback((dec: 'legitimate' | 'fraud') => {
        const current = transactions[currentIndex];
        if (!current) return;

        setDecision(dec);
        const correct = (dec === 'fraud') === current.isFraud;
        const falsePositive = dec === 'fraud' && !current.isFraud;

        if (correct) {
            playSfx('success');
        } else {
            playSfx('error');
        }

        setResults(prev => [...prev, { correct, wasFraud: current.isFraud, falsePositive }]);
        setPhase('feedback');
    }, [transactions, currentIndex, playSfx]);

    const handleNext = useCallback(() => {
        if (currentIndex < transactions.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setDecision(null);
            setPhase('reviewing');
        } else {
            setPhase('results');
        }
    }, [currentIndex, transactions.length]);

    const calculateScore = useCallback(() => {
        const correctCount = results.filter(r => r.correct).length;
        const falsePositives = results.filter(r => r.falsePositive).length;
        const missedFraud = results.filter(r => !r.correct && r.wasFraud).length;

        // Base score from correct answers
        let score = (correctCount / TOTAL_TO_REVIEW) * 42.5;
        // Penalty for false positives (flagging innocent)
        score -= falsePositives * 2.5;
        // Penalty for missed fraud (letting fraud through)
        score -= missedFraud * 4;
        // Bonus for catching all fraud
        if (missedFraud === 0 && results.length > 0) score += 7.5;

        return Math.min(50, Math.max(0, Math.round(score)));
    }, [results]);

    const current = transactions[currentIndex];

    if (phase === 'scenario') {
        return (
            <div className="max-w-3xl mx-auto p-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-3xl shadow-2xl overflow-hidden"
                >
                    <div className="bg-gradient-to-r from-red-700 to-rose-600 p-8 text-white">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                                <Shield className="w-10 h-10" />
                            </div>
                            <div>
                                <h2 className="text-3xl font-bold">Fraud Detector</h2>
                                <p className="text-red-100">Financial Services • Advanced</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-8">
                        <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-r-xl mb-6">
                            <h3 className="font-bold text-red-900 text-lg mb-2">🚨 Scenario Briefing</h3>
                            <p className="text-red-800 leading-relaxed">
                                <strong>ALERT:</strong> The bank's automated fraud detection system has flagged
                                suspicious activity across multiple accounts. As the senior fraud analyst on duty,
                                you need to review <strong>{TOTAL_TO_REVIEW} flagged transactions</strong> and
                                determine which are genuinely fraudulent and which are legitimate. Be thorough  - 
                                missing real fraud is dangerous, but flagging innocent customers erodes trust and
                                costs the bank money!
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                                <div className="flex items-center gap-2 mb-1">
                                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                                    <span className="font-bold text-green-800">Mark Legitimate</span>
                                </div>
                                <p className="text-sm text-green-700">Clear the flag  -  transaction is normal</p>
                            </div>
                            <div className="bg-red-50 rounded-xl p-4 border border-red-100">
                                <div className="flex items-center gap-2 mb-1">
                                    <AlertTriangle className="w-5 h-5 text-red-600" />
                                    <span className="font-bold text-red-800">Flag as Fraud</span>
                                </div>
                                <p className="text-sm text-red-700">Escalate  -  freeze the account</p>
                            </div>
                        </div>

                        <div className="flex items-center justify-between text-sm text-gray-500 mb-6">
                            <span>🔍 {TOTAL_TO_REVIEW} transactions to review</span>
                            <span>⚠️ False positives penalized</span>
                            <span>🏆 50 points max</span>
                        </div>

                        <button
                            onClick={() => {
                                playSfx('click');
                                startGame();
                            }}
                            className="w-full py-4 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-bold rounded-xl text-lg transition-all transform hover:scale-[1.02] shadow-lg"
                        >
                            Begin Investigation 🔍
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    if ((phase === 'reviewing' || phase === 'feedback') && current) {
        return (
            <div className="max-w-4xl mx-auto p-6">
                <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-slate-800 to-slate-700 p-5 text-white flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <Shield className="w-7 h-7 text-yellow-400" />
                            <div>
                                <h3 className="text-lg font-bold">Fraud Analysis Console</h3>
                                <p className="text-slate-400 text-sm">Case {currentIndex + 1} of {transactions.length}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            {results.map((r, i) => (
                                <div key={i} className={`w-3 h-3 rounded-full ${r.correct ? 'bg-green-400' : 'bg-red-400'}`} />
                            ))}
                            {Array(transactions.length - results.length).fill(0).map((_, i) => (
                                <div key={`empty-${i}`} className="w-3 h-3 rounded-full bg-slate-600" />
                            ))}
                        </div>
                    </div>

                    <div className="p-8">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={current.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                            >
                                {/* Transaction details card */}
                                <div className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-2xl p-6 mb-6 border border-gray-200">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <span className="text-sm text-gray-500 uppercase tracking-wider font-bold">Flagged Transaction</span>
                                            <h4 className="text-2xl font-bold text-gray-900 mt-1">{current.accountHolder}</h4>
                                        </div>
                                        <div className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-bold flex items-center gap-1">
                                            <AlertTriangle className="w-3 h-3" />
                                            Flagged
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="bg-white rounded-xl p-3 border">
                                            <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                                                <CreditCard className="w-3 h-3" /> Amount
                                            </div>
                                            <div className="font-bold text-lg text-gray-900">${current.amount.toLocaleString()}</div>
                                        </div>
                                        <div className="bg-white rounded-xl p-3 border">
                                            <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                                                <Eye className="w-3 h-3" /> Merchant
                                            </div>
                                            <div className="font-bold text-sm text-gray-900">{current.merchant}</div>
                                        </div>
                                        <div className="bg-white rounded-xl p-3 border">
                                            <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                                                <MapPin className="w-3 h-3" /> Location
                                            </div>
                                            <div className="font-bold text-sm text-gray-900">{current.location}</div>
                                        </div>
                                        <div className="bg-white rounded-xl p-3 border">
                                            <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                                                <Clock className="w-3 h-3" /> Time
                                            </div>
                                            <div className="font-bold text-sm text-gray-900">{current.time}</div>
                                        </div>
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-gray-200">
                                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Category: </span>
                                        <span className="text-sm text-gray-700">{current.category}</span>
                                    </div>
                                </div>

                                {phase === 'reviewing' && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <button
                                            onClick={() => handleDecision('legitimate')}
                                            className="p-6 rounded-2xl border-2 border-green-200 bg-green-50 hover:bg-green-100 hover:border-green-400 transition-all group"
                                        >
                                            <CheckCircle2 className="w-10 h-10 text-green-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                                            <div className="font-bold text-green-800 text-lg">Legitimate</div>
                                            <div className="text-sm text-green-600">Clear this flag</div>
                                        </button>
                                        <button
                                            onClick={() => handleDecision('fraud')}
                                            className="p-6 rounded-2xl border-2 border-red-200 bg-red-50 hover:bg-red-100 hover:border-red-400 transition-all group"
                                        >
                                            <AlertTriangle className="w-10 h-10 text-red-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                                            <div className="font-bold text-red-800 text-lg">Fraudulent</div>
                                            <div className="text-sm text-red-600">Freeze account</div>
                                        </button>
                                    </div>
                                )}

                                {phase === 'feedback' && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                    >
                                        <div className={`rounded-2xl p-6 mb-4 ${results[results.length - 1]?.correct ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                                            <div className="flex items-center gap-2 mb-2">
                                                {results[results.length - 1]?.correct
                                                    ? <CheckCircle2 className="w-6 h-6 text-green-600" />
                                                    : <XCircle className="w-6 h-6 text-red-600" />
                                                }
                                                <span className={`font-bold text-lg ${results[results.length - 1]?.correct ? 'text-green-800' : 'text-red-800'}`}>
                                                    {results[results.length - 1]?.correct ? 'Correct Analysis!' : 'Incorrect Assessment'}
                                                </span>
                                            </div>
                                            <p className="text-gray-700 mb-3">{current.explanation}</p>
                                            {current.redFlags.length > 0 && (
                                                <div className="mt-3">
                                                    <span className="text-xs font-bold text-gray-500 uppercase">Red Flags:</span>
                                                    <ul className="mt-1 space-y-1">
                                                        {current.redFlags.map((flag, i) => (
                                                            <li key={i} className="text-sm text-red-700 flex items-center gap-1">
                                                                <span className="w-1 h-1 bg-red-500 rounded-full flex-shrink-0" />
                                                                {flag}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                            <div className="mt-3 pt-3 border-t border-gray-200">
                                                <span className="text-sm font-bold text-gray-600">
                                                    This transaction was: <span className={current.isFraud ? 'text-red-700' : 'text-green-700'}>{current.isFraud ? '🚨 FRAUDULENT' : '✅ LEGITIMATE'}</span>
                                                </span>
                                                <span className="text-sm text-gray-600 ml-2">
                                                    | Your call: <span className={decision === 'fraud' ? 'text-red-700' : 'text-green-700'}>{decision === 'fraud' ? '🚨 Fraud' : '✅ Legit'}</span>
                                                </span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={handleNext}
                                            className="w-full py-4 bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-800 hover:to-slate-900 text-white font-bold rounded-xl text-lg transition-all flex items-center justify-center gap-2"
                                        >
                                            {currentIndex < transactions.length - 1 ? (
                                                <>Next Case <ArrowRight className="w-5 h-5" /></>
                                            ) : (
                                                'View Report 📋'
                                            )}
                                        </button>
                                    </motion.div>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        );
    }

    // Results phase
    const finalScore = calculateScore();
    const correctCount = results.filter(r => r.correct).length;
    const falsePositives = results.filter(r => r.falsePositive).length;
    const missedFraud = results.filter(r => !r.correct && r.wasFraud).length;
    const caughtFraud = results.filter(r => r.correct && r.wasFraud).length;
    const totalFraud = results.filter(r => r.wasFraud).length;

    return (
        <div className="max-w-2xl mx-auto p-6">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-3xl shadow-2xl p-8 text-center"
            >
                <div className="text-6xl mb-4">
                    {finalScore >= 80 ? '🛡️' : finalScore >= 50 ? '🔎' : '⚠️'}
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Investigation Report</h2>
                <p className="text-gray-600 mb-6">
                    {finalScore >= 80
                        ? "Outstanding detective work! The bank's assets are safe thanks to your keen eye."
                        : finalScore >= 50
                            ? "Decent analysis, but some cases slipped through. Review the red flags more carefully."
                            : "Several fraud cases were missed. The bank may be exposed to significant losses."}
                </p>

                <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="bg-green-50 rounded-xl p-4">
                        <div className="text-2xl font-bold text-green-700">{correctCount}/{TOTAL_TO_REVIEW}</div>
                        <div className="text-sm text-green-600">Correct Calls</div>
                    </div>
                    <div className="bg-blue-50 rounded-xl p-4">
                        <div className="text-2xl font-bold text-blue-700">{caughtFraud}/{totalFraud}</div>
                        <div className="text-sm text-blue-600">Fraud Caught</div>
                    </div>
                    <div className="bg-red-50 rounded-xl p-4">
                        <div className="text-2xl font-bold text-red-700">{falsePositives}</div>
                        <div className="text-sm text-red-600">False Positives</div>
                    </div>
                    <div className="bg-amber-50 rounded-xl p-4">
                        <div className="text-2xl font-bold text-amber-700">{missedFraud}</div>
                        <div className="text-sm text-amber-600">Missed Fraud</div>
                    </div>
                </div>

                <div className="bg-teal-50 rounded-xl p-4 mb-6">
                    <div className="text-3xl font-bold text-teal-700">{finalScore}</div>
                    <div className="text-sm text-teal-600">Final Score</div>
                </div>

                <button
                    onClick={() => onComplete(finalScore)}
                    className="w-full py-4 bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-bold rounded-xl text-lg transition-all hover:from-teal-600 hover:to-emerald-600"
                >
                    Continue
                </button>
            </motion.div>
        </div>
    );
}
