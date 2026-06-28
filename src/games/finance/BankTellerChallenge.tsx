import { useState, useCallback } from 'react';
import { MessageCircle, CheckCircle2, XCircle, ArrowRight, ShieldAlert, FileText } from 'lucide-react';
import { useAudio } from '../../contexts/AudioContext';
import { motion, AnimatePresence } from 'framer-motion';

interface Evidence {
    id: string;
    name: string;
    description: string;
    icon: string;
}

interface Statement {
    id: string;
    text: string;
    pressText: string;
    isLie: boolean;
    contradictingEvidenceId?: string;
    correctReasoning?: string;
}

interface CustomerInteraction {
    id: string;
    customerName: string;
    type: 'Loan Application' | 'Wire Transfer' | 'Account Recovery';
    avatar: string;
    evidenceBox: Evidence[];
    statements: Statement[];
}

const CUSTOMER_INTERACTIONS: CustomerInteraction[] = [
    {
        id: 'teller-1',
        customerName: 'Marcus T.',
        type: 'Wire Transfer',
        avatar: '👨‍💼',
        evidenceBox: [
            { id: 'ev-1', name: 'Transfer Request Form', description: 'Requesting an urgent international wire of $45,000 to "SafeHaven Crypto Exchange LLC".', icon: '📄' },
            { id: 'ev-2', name: 'Account History', description: 'Marcus has been a customer for 10 years. Average monthly balance is $5,000. Never executed an international wire before.', icon: '📊' },
            { id: 'ev-3', name: 'Text Message Printout', description: 'A printout Marcus showed you from "Bank Security" stating: "Your account is compromised. Transfer all funds to this secure vault to protect them."', icon: '📱' },
        ],
        statements: [
            {
                id: 's1',
                text: "I need to wire this money immediately to secure a new business investment opportunity I found online.",
                pressText: "It's a very urgent crypto investment! The broker said if I don't send it today, I'll miss out entirely.",
                isLie: true,
                contradictingEvidenceId: 'ev-3',
                correctReasoning: "You claimed this was for a business investment, but the text message you showed me explicitly says it's to protect funds from a 'compromised account'. This is a classic scam!"
            },
            {
                id: 's2',
                text: "I do these kinds of international transfers all the time. It's totally normal for my account.",
                pressText: "Yes, I regularly send tens of thousands overseas. You don't need to double-check.",
                isLie: true,
                contradictingEvidenceId: 'ev-2',
                correctReasoning: "Your account history shows you have never executed an international wire before, and this amount is highly unusual for your typical balance."
            },
            {
                id: 's3',
                text: "The transfer is going to a highly regulated, fully registered domestic bank account.",
                pressText: "It's a standard business checking account right here in the US.",
                isLie: true,
                contradictingEvidenceId: 'ev-1',
                correctReasoning: "The transfer form clearly states the funds are going to an international crypto exchange, not a domestic bank account."
            }
        ]
    },
    {
        id: 'teller-2',
        customerName: 'Sarah L.',
        type: 'Loan Application',
        avatar: '👩‍💼',
        evidenceBox: [
            { id: 'ev-1', name: 'W-2 Form', description: 'Shows an annual income of $120,000 from "TechSolutions Inc". The font on the numbers looks slightly irregular.', icon: '📑' },
            { id: 'ev-2', name: 'Credit Report', description: 'Credit score is 780. Currently has zero open credit cards and paid off a mortgage 5 years ago.', icon: '📈' },
            { id: 'ev-3', name: 'Employment Verification Call', description: 'HR at TechSolutions confirmed Sarah L. works there, but her title is "Part-time Assistant" not "Senior Director".', icon: '☎️' },
        ],
        statements: [
            {
                id: 's1',
                text: "My high income easily qualifies me for this $200k personal loan. I'm a Senior Director!",
                pressText: "I've climbed the corporate ladder fast. TechSolutions pays their executives very well.",
                isLie: true,
                contradictingEvidenceId: 'ev-3',
                correctReasoning: "We called your employer. You are a part-time assistant, not a Senior Director, heavily implying your stated income is falsified."
            },
            {
                id: 's2',
                text: "I provided official, untampered tax documents verifying my $120k salary.",
                pressText: "Those W-2s came straight from my HR portal yesterday. They are 100% authentic.",
                isLie: true,
                contradictingEvidenceId: 'ev-1',
                correctReasoning: "The irregular font on the numbers suggests the W-2 form has been digitally altered to inflate your income."
            },
            {
                id: 's3',
                text: "I've been heavily utilizing and paying off multiple high-limit credit cards recently to build my score to 780.",
                pressText: "Using credit heavily and making large payments is how I maintain my perfect tier rating.",
                isLie: true,
                contradictingEvidenceId: 'ev-2',
                correctReasoning: "Your credit report shows you currently have zero open credit cards, directly contradicting your claim of heavy recent utilization."
            }
        ]
    }
];

export function BankTellerChallenge({ onComplete }: { onComplete: (score: number) => void }) {
    const [phase, setPhase] = useState<'intro' | 'interview' | 'transition' | 'results'>('intro');
    const [currentCaseIndex, setCurrentIndex] = useState(0);
    const [currentStatementIndex, setStatementIndex] = useState(0);
    const [isPressed, setIsPressed] = useState(false);
    const [selectedEvidence, setSelectedEvidence] = useState<string | null>(null);
    const [results, setResults] = useState<{ correct: boolean }[]>([]);
    const [feedback, setFeedback] = useState<{ isCorrect: boolean; message: string } | null>(null);

    const { playSfx } = useAudio();
    const currentCase = CUSTOMER_INTERACTIONS[currentCaseIndex];

    const handlePress = useCallback(() => {
        setIsPressed(true);
        playSfx('click');
    }, [playSfx]);

    const handlePresentEvidence = useCallback(() => {
        if (!selectedEvidence) {
            playSfx('error');
            return;
        }

        const statement = currentCase.statements[currentStatementIndex];
        const isCorrect = statement.isLie && statement.contradictingEvidenceId === selectedEvidence;

        setFeedback({
            isCorrect,
            message: isCorrect
                ? `Objection Successful! ${statement.correctReasoning}`
                : "That evidence doesn't contradict what they are saying right now. Try pressing them for details or check another statement."
        });

        if (isCorrect) {
            playSfx('success');
            setTimeout(() => {
                setResults(prev => [...prev, { correct: true }]);
                setFeedback(null);
                setIsPressed(false);
                setSelectedEvidence(null);

                if (currentStatementIndex < currentCase.statements.length - 1) {
                    setStatementIndex(prev => prev + 1);
                } else if (currentCaseIndex < CUSTOMER_INTERACTIONS.length - 1) {
                    setPhase('transition');
                } else {
                    setPhase('results');
                }
            }, 5000);
        } else {
            playSfx('error');
            setTimeout(() => {
                setResults(prev => [...prev, { correct: false }]);
                setFeedback(null);
            }, 4000);
        }
    }, [selectedEvidence, currentCase, currentStatementIndex, currentCaseIndex, playSfx]);

    const calculateScore = useCallback(() => {
        const totalAttempts = Math.max(results.length, 1);
        const correctCount = results.filter(r => r.correct).length;
        // Perfect score is 50. Penalize for wrong evidence presentations.
        let mScore = 50 - ((totalAttempts - correctCount) * 5);
        return Math.min(50, Math.max(0, mScore));
    }, [results]);

    if (phase === 'intro') {
        return (
            <div className="max-w-3xl mx-auto p-6">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl shadow-2xl overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-700 to-indigo-600 p-8 text-white">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                                <ShieldAlert className="w-10 h-10" />
                            </div>
                            <div>
                                <h2 className="text-3xl font-bold">Investigative Teller</h2>
                                <p className="text-blue-100">Financial Services • Advanced Fraud Prevention</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-8">
                        <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-xl mb-6">
                            <h3 className="font-bold text-blue-900 text-lg mb-2">👋 Briefing</h3>
                            <p className="text-blue-800 leading-relaxed text-sm">
                                As a senior teller, processing transactions isn't just about counting cash - it's about protecting the bank and the customers. You will interview customers requesting unusual services.
                                <br /><br />
                                <strong>Your Goal:</strong> Listen to their statements, <strong>Press</strong> them for more details, and <strong>Present Evidence</strong> when you catch them in a lie or a scam.
                            </p>
                        </div>
                        <button
                            onClick={() => { playSfx('click'); setPhase('interview'); }}
                            className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl text-lg hover:scale-[1.02] transition-transform"
                        >
                            Open Your Window
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    if (phase === 'interview') {
        const statement = currentCase.statements[currentStatementIndex];
        return (
            <div className="max-w-6xl mx-auto p-4 flex gap-6 h-[80vh]">
                {/* Left side: The Interview */}
                <div className="flex-1 flex flex-col gap-4">
                    <div className="bg-white rounded-2xl shadow-lg p-6 flex items-center gap-6 border-t-8 border-indigo-600">
                        <div className="text-7xl bg-indigo-50 w-32 h-32 rounded-full flex items-center justify-center border-4 border-indigo-100">
                            {currentCase.avatar}
                        </div>
                        <div>
                            <div className="text-sm font-bold text-indigo-600 uppercase tracking-widest">{currentCase.type}</div>
                            <h2 className="text-3xl font-bold text-gray-900">{currentCase.customerName}</h2>
                            <p className="text-gray-500 mt-1">Listen closely for inconsistencies in their story.</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-lg p-8 flex-1 flex flex-col relative border border-gray-100">
                        <div className="absolute top-0 left-8 transform -translate-y-1/2 bg-blue-100 text-blue-800 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                            <MessageCircle className="w-4 h-4" /> Statement {currentStatementIndex + 1} of {currentCase.statements.length}
                        </div>

                        <AnimatePresence mode="wait">
                            <motion.div key={statement.id + (isPressed ? '-pressed' : '')} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1 flex items-center justify-center">
                                <p className={`text-2xl leading-relaxed text-center font-medium ${isPressed ? 'text-indigo-900 italic' : 'text-gray-800'}`}>
                                    "{isPressed ? statement.pressText : statement.text}"
                                </p>
                            </motion.div>
                        </AnimatePresence>

                        {feedback && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`mt-6 p-4 rounded-xl border flex items-start gap-3 ${feedback.isCorrect ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                                {feedback.isCorrect ? <CheckCircle2 className="w-6 h-6 shrink-0" /> : <XCircle className="w-6 h-6 shrink-0" />}
                                <p className="font-semibold">{feedback.message}</p>
                            </motion.div>
                        )}

                        <div className="flex gap-4 mt-8">
                            <button disabled={isPressed || !!feedback} onClick={handlePress} className="flex-1 py-4 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl transition-colors disabled:opacity-50">
                                Press for Details 🔍
                            </button>
                            <button disabled={!isPressed || !selectedEvidence || !!feedback} onClick={handlePresentEvidence} className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50">
                                Challenge with Evidence 💼
                            </button>
                            <button disabled={!!feedback} onClick={() => { setIsPressed(false); setStatementIndex(prev => (prev + 1) % currentCase.statements.length); }} className="px-6 py-4 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-xl transition-colors disabled:opacity-50">
                                Next Statement <ArrowRight className="w-5 h-5 inline" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right side: Evidence File */}
                <div className="w-96 bg-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-700">
                    <div className="p-6 bg-slate-900 border-b border-slate-700 flex items-center gap-3">
                        <FileText className="w-6 h-6 text-blue-400" />
                        <h3 className="font-bold text-white text-xl">Case File</h3>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                        {currentCase.evidenceBox.map((ev) => (
                            <button
                                key={ev.id}
                                onClick={() => { playSfx('click'); setSelectedEvidence(ev.id); }}
                                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${selectedEvidence === ev.id ? 'bg-indigo-900/50 border-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.3)]' : 'bg-slate-800 border-slate-700 hover:border-slate-500 hover:bg-slate-700'}`}
                            >
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="text-2xl">{ev.icon}</span>
                                    <span className="font-bold text-blue-100">{ev.name}</span>
                                </div>
                                <p className="text-sm text-slate-400 line-clamp-3">{ev.description}</p>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (phase === 'transition') {
        return (
            <div className="max-w-xl mx-auto p-6">
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-3xl shadow-2xl p-10 text-center">
                    <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 className="w-12 h-12 text-green-600" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">Customer Handled!</h2>
                    <p className="text-gray-600 mb-8 text-lg">
                        Great work identifying the fraud attempt. The customer has been reported. Get ready for the next person in line.
                    </p>
                    <button
                        onClick={() => {
                            playSfx('click');
                            setCurrentIndex(prev => prev + 1);
                            setStatementIndex(0);
                            setPhase('interview');
                        }}
                        className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl text-lg hover:bg-indigo-700 transition-colors shadow-lg flex items-center justify-center gap-2"
                    >
                        Call Next Customer <ArrowRight className="w-5 h-5" />
                    </button>
                </motion.div>
            </div>
        );
    }

    const finalScore = calculateScore();
    return (
        <div className="max-w-2xl mx-auto p-6">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-3xl shadow-2xl p-8 text-center">
                <div className="text-6xl mb-4">{finalScore >= 40 ? '🌟' : '📝'}</div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Shift Completed!</h2>
                <div className="bg-blue-50 rounded-xl p-4 mb-6">
                    <div className="text-3xl font-bold text-blue-700">{finalScore}</div>
                    <div className="text-sm text-blue-600">Final Score (Max 50)</div>
                </div>
                <button onClick={() => onComplete(finalScore)} className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl text-lg hover:bg-indigo-700">
                    Continue
                </button>
            </motion.div>
        </div>
    );
}
