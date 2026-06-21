import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music } from 'lucide-react';
import { useAudio } from '../../contexts/AudioContext';

// --- Types ---

type Position = 'left' | 'center' | 'right';
type Emotion = 'happy' | 'sad' | 'angry' | 'fearful' | 'surprised';

interface ScriptLine {
    id: string;
    text: string;     // The correct line
    emotion: Emotion; // The correct emotion
    position: Position; // Where to stand
    distractors: string[]; // Wrong line options
}

interface Scene {
    id: string;
    title: string;
    context: string;
    lines: ScriptLine[];
}

// --- Data ---

const SCENES: Scene[] = [
    {
        id: 's1',
        title: 'The Audition',
        context: 'Your big break! Show the director you can hit your mark and project.',
        lines: [
            {
                id: 'l1',
                text: "I've been waiting for this chance my whole life!",
                emotion: 'happy',
                position: 'center',
                distractors: [
                    "I've been waiting for a chance like this.",
                    "I think I'm ready for this role.",
                    "Is this the right room?"
                ]
            },
            {
                id: 'l2',
                text: "But what if I'm not good enough?",
                emotion: 'fearful',
                position: 'left',
                distractors: [
                    "But what if I fail?",
                    "Maybe I should go home.",
                    "I'm not sure about this."
                ]
            }
        ]
    },
    {
        id: 's2',
        title: 'Rehearsal Week',
        context: 'The director is watching closely. Don\'t forget the blocking!',
        lines: [
            {
                id: 'l3',
                text: "You can't treat people like that anymore, Sir!",
                emotion: 'angry',
                position: 'right',
                distractors: [
                    "Please stop treating people like that.",
                    "You shouldn't do that, Sir!",
                    "Why are you so mean?"
                ]
            },
            {
                id: 'l4',
                text: "He... he never came home last night.",
                emotion: 'sad',
                position: 'center',
                distractors: [
                    "He didn't come back yesterday.",
                    "I haven't seen him since yesterday.",
                    "Where did he go?"
                ]
            }
        ]
    },
    {
        id: 's3',
        title: 'Opening Night',
        context: 'Full house! the spotlight is hot. Deliver the climax perfectly.',
        lines: [
            {
                id: 'l5',
                text: "The treasure was buried here all along?!",
                emotion: 'surprised',
                position: 'left',
                distractors: [
                    "Is the treasure here?",
                    "We found the treasure!",
                    "I can't believe it's here."
                ]
            },
            {
                id: 'l6',
                text: "Tomorrow, we sail for the horizon!",
                emotion: 'happy',
                position: 'center',
                distractors: [
                    "We leave tomorrow morning.",
                    "Let's go to the horizon.",
                    "The ship sails at dawn."
                ]
            }
        ]
    }
];

// --- Assets ---

const POSITIONS: Record<Position, string> = {
    left: '20%',
    center: '50%',
    right: '80%'
};

const EMOTIONS: Record<Emotion, string> = {
    happy: '😊',
    sad: '😢',
    angry: '😠',
    fearful: '😨',
    surprised: '😲'
};

// --- Component ---

interface BroadwayLeadChallengeProps {
    onComplete: (score: number) => void;
}

export function BroadwayLeadChallenge({ onComplete }: BroadwayLeadChallengeProps) {
    const { playSfx } = useAudio();
    const [sceneIndex, setSceneIndex] = useState(0);
    const [lineIndex, setLineIndex] = useState(0);

    // Phases: 
    // 'intro': Introduction to the scene
    // 'memorize': Showing the script card
    // 'act': Player must click position -> choose emotion -> choose line
    // 'feedback': Result of the line (Applause/Boo)
    // 'score': Final score screen
    const [phase, setPhase] = useState<'intro' | 'memorize' | 'act' | 'feedback' | 'score'>('intro');

    // Acting State
    const [selectedPos, setSelectedPos] = useState<Position | null>(null);
    const [selectedEmotion, setSelectedEmotion] = useState<Emotion | null>(null);
    const [selectedLine, setSelectedLine] = useState<string | null>(null);

    // Scoring
    const [score, setScore] = useState(0);
    const [history, setHistory] = useState<any[]>([]);

    const currentScene = SCENES[sceneIndex];
    const currentLine = currentScene.lines[lineIndex];

    // Timer refs
    const onCompleteCalled = useRef(false);

    // --- Helpers ---

    const playSound = (type: 'applause' | 'boo' | 'spotlight') => {
        if (type === 'applause') playSfx('success');
        if (type === 'boo') playSfx('error');
        if (type === 'spotlight') playSfx('notification');
    };

    const nextStep = useCallback(() => {
        if (phase === 'intro') {
            setPhase('memorize');
            return;
        }

        if (phase === 'memorize') {
            setPhase('act');
            playSound('spotlight');
            // Reset selections
            setSelectedPos(null);
            setSelectedEmotion(null);
            setSelectedLine(null);
            return;
        }

        if (phase === 'feedback') {
            // Move to next line or next scene
            if (lineIndex < currentScene.lines.length - 1) {
                setLineIndex(prev => prev + 1);
                setPhase('memorize');
            } else if (sceneIndex < SCENES.length - 1) {
                setSceneIndex(prev => prev + 1);
                setLineIndex(0);
                setPhase('intro');
            } else {
                setPhase('score');
            }
        }
    }, [phase, lineIndex, sceneIndex, currentScene]);

    // Auto-advance memorize after 5 seconds
    useEffect(() => {
        if (phase === 'memorize') {
            const t = setTimeout(() => nextStep(), 5000);
            return () => clearTimeout(t);
        }
    }, [phase, nextStep]);

    // Auto-advance feedback after 2 seconds
    useEffect(() => {
        if (phase === 'feedback') {
            const t = setTimeout(() => nextStep(), 2000);
            return () => clearTimeout(t);
        }
    }, [phase, nextStep]);

    // Check Action
    const checkAction = () => {
        if (!selectedPos || !selectedEmotion || !selectedLine) return;

        const isPosCorrect = selectedPos === currentLine.position;
        const isEmoCorrect = selectedEmotion === currentLine.emotion;
        const isLineCorrect = selectedLine === currentLine.text;

        const lineScore = (isPosCorrect ? 10 : 0) + (isEmoCorrect ? 10 : 0) + (isLineCorrect ? 10 : 0);

        setScore(prev => prev + lineScore);
        setHistory(prev => [...prev, {
            scene: currentScene.title,
            line: currentLine.text,
            score: lineScore,
            correct: lineScore === 30
        }]);

        setPhase('feedback');
        if (lineScore === 30) playSound('applause');
        else playSound('boo');

    };

    // Calculate choices (shuffled)
    const lineOptions = useMemo(() => {
        const all = [currentLine.text, ...currentLine.distractors];
        return all.sort(() => Math.random() - 0.5);
    }, [currentLine]);

    // Final Completion
    useEffect(() => {
        if (phase === 'score' && !onCompleteCalled.current) {
            onCompleteCalled.current = true;
            // Calculate percentage
            const maxScore = SCENES.reduce((acc, s) => acc + s.lines.length * 30, 0);
            const finalPercent = Math.round((score / maxScore) * 100);
            playSfx('complete');

            const t = setTimeout(() => onComplete(finalPercent), 5000);
            return () => clearTimeout(t);
        }
    }, [phase, score]);


    // --- Render ---

    if (phase === 'score') {
        const maxScore = SCENES.reduce((acc, s) => acc + s.lines.length * 30, 0);
        const percent = Math.round((score / maxScore) * 100);

        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-white p-8 rounded-3xl shadow-2xl border-4 border-purple-500 max-w-lg w-full"
                >
                    <Music className="w-20 h-20 text-purple-600 mx-auto mb-4" />
                    <h2 className="text-4xl font-bold mb-2">Curtain Call!</h2>
                    <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-6">
                        {percent}%
                    </div>
                    <div className="space-y-2 text-left bg-gray-50 p-4 rounded-xl mb-6 max-h-48 overflow-y-auto">
                        {history.map((h, i) => (
                            <div key={i} className="flex justify-between items-center text-sm border-b pb-2 last:border-0">
                                <span className={h.correct ? 'text-green-600 font-bold' : 'text-red-500'}>
                                    {h.correct ? '★' : '✗'} {h.scene}
                                </span>
                                <span className="font-mono">{h.score}pts</span>
                            </div>
                        ))}
                    </div>
                    <p className="text-gray-500 italic">"The reviews are in..."</p>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto h-[80vh] flex flex-col bg-slate-900 rounded-3xl overflow-hidden shadow-2xl relative border-4 border-slate-800">

            {/* --- STAGE AREA --- */}
            <div className="relative flex-1 bg-gray-900 overflow-hidden perspective-1000">

                {/* Floor */}
                <div className="absolute bottom-0 w-full h-[40%] bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] bg-amber-900/50 transform-style-3d rotate-x-60 origin-bottom border-t-4 border-amber-950"></div>

                {/* Curtains */}
                <div className="absolute top-0 left-0 h-full w-24 bg-red-900 shadow-[10px_0_20px_rgba(0,0,0,0.5)] z-10"></div>
                <div className="absolute top-0 right-0 h-full w-24 bg-red-900 shadow-[-10px_0_20px_rgba(0,0,0,0.5)] z-10"></div>
                <div className="absolute top-0 left-0 w-full h-12 bg-red-800 z-20 shadow-lg rounded-b-[50%]"></div>

                {/* Spotlight */}
                <AnimatePresence>
                    {phase === 'act' && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1, left: POSITIONS[currentLine.position || 'center'] }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.5 }}
                            className="absolute top-0 w-64 h-full pointer-events-none z-0 transform -translate-x-1/2"
                            style={{
                                background: 'radial-gradient(ellipse at center, rgba(255,255,200,0.3) 0%, rgba(255,255,0,0) 70%)',
                            }}
                        />
                    )}
                </AnimatePresence>

                {/* Actor */}
                <motion.div
                    className="absolute bottom-[20%] z-10 transform -translate-x-1/2 flex flex-col items-center"
                    animate={{
                        left: phase === 'act' && selectedPos ? POSITIONS[selectedPos] :
                            phase === 'memorize' ? '50%' : // Start center
                                '50%'
                    }}
                    transition={{ type: 'spring', damping: 20 }}
                >
                    <div className="text-8xl filter drop-shadow-2xl transition-transform duration-300 transform hover:scale-110">
                        {(phase === 'act' || phase === 'feedback') && selectedEmotion ? EMOTIONS[selectedEmotion] : '😐'}
                    </div>
                </motion.div>

                {/* --- UI OVERLAYS --- */}

                {/* Intro Card */}
                <AnimatePresence>
                    {phase === 'intro' && (
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 1.1, opacity: 0 }}
                            className="absolute inset-0 flex items-center justify-center bg-black/80 z-30"
                        >
                            <div className="bg-white text-black p-8 rounded-2xl max-w-md text-center">
                                {sceneIndex === 0 && (
                                    <div className="bg-purple-100 text-purple-900 p-3 mb-4 rounded-xl border border-purple-200">
                                        <strong>🎭 Note:</strong> This entire challenge is a <strong>practical acting exam</strong>! You'll need to memorize lines, hit your mark, and deliver with emotion!
                                    </div>
                                )}
                                <h1 className="text-4xl font-bold mb-2 text-purple-600">{currentScene.title}</h1>
                                <p className="text-lg text-gray-600 mb-6">{currentScene.context}</p>
                                <button
                                    onClick={() => { playSfx('click'); nextStep(); }}
                                    className="px-8 py-3 bg-purple-600 text-white rounded-full font-bold text-lg hover:bg-purple-700 transition"
                                >
                                    Start Scene
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Memorize Card */}
                <AnimatePresence>
                    {phase === 'memorize' && (
                        <motion.div
                            initial={{ y: 50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -50, opacity: 0 }}
                            className="absolute inset-0 flex items-center justify-center bg-black/60 z-30"
                        >
                            <div className="bg-amber-50 text-amber-900 border-4 border-amber-200 p-8 rounded-xl max-w-lg w-full shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-2 bg-purple-500 animate-[width_5s_linear_forwards]" style={{ width: '100%' }}></div>

                                <h3 className="text-xl uppercase tracking-widest text-amber-800/50 font-bold mb-4 text-center">Script - {currentScene.title}</h3>

                                <div className="space-y-6 text-center">
                                    <div className="bg-white/50 p-4 rounded-lg">
                                        <div className="text-xs uppercase text-gray-500 mb-1">Your Line</div>
                                        <div className="text-3xl font-serif font-bold text-gray-900">"{currentLine.text}"</div>
                                    </div>

                                    <div className="flex justify-center gap-4">
                                        <div className="bg-blue-100 p-3 rounded-lg border border-blue-200">
                                            <div className="text-xs text-blue-500 uppercase">Emotion</div>
                                            <div className="text-2xl font-bold text-blue-800 flex items-center gap-2">
                                                {EMOTIONS[currentLine.emotion]} {currentLine.emotion.toUpperCase()}
                                            </div>
                                        </div>
                                        <div className="bg-green-100 p-3 rounded-lg border border-green-200">
                                            <div className="text-xs text-green-500 uppercase">Position</div>
                                            <div className="text-2xl font-bold text-green-800 flex items-center gap-2">
                                                📍 {currentLine.position.toUpperCase()}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-6 text-center text-sm text-gray-500 animate-pulse">Memorizing... Get ready!</div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Feedback Overlay */}
                <AnimatePresence>
                    {phase === 'feedback' && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 z-40 bg-black/30 backdrop-blur-sm pointer-events-none"
                        >
                            {/* Centered Text Container */}
                            <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                                <motion.div
                                    initial={{ scale: 0.5, opacity: 0, y: 50 }}
                                    animate={{ scale: 1, opacity: 1, y: -100 }}
                                    className="text-center z-50 relative"
                                >
                                    {history[history.length - 1]?.correct ? (
                                        <div className="relative">
                                            <div className="text-8xl font-black text-yellow-400 drop-shadow-[0_0_30px_rgba(255,215,0,0.8)] rotate-[-6deg] animate-bounce">
                                                PERFECT! 🌟
                                            </div>
                                            <div className="text-2xl text-white font-bold mt-4 drop-shadow-md">
                                                The audience enters a frenzy!
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="relative">
                                            <div className="text-8xl font-black text-red-600 drop-shadow-[0_0_30px_rgba(255,0,0,0.8)] rotate-[6deg]">
                                                CUT! 🎬
                                            </div>
                                            <div className="text-2xl text-white font-bold mt-4 drop-shadow-md">
                                                "Where's the emotion?!"
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            </div>

                            {/* Bottom Audience Container */}
                            {history[history.length - 1]?.correct && (
                                <div className="absolute bottom-0 w-full overflow-hidden flex items-end justify-center z-40">
                                    <motion.div
                                        initial={{ y: 200, opacity: 0 }}
                                        animate={{ y: 40, opacity: 1 }}
                                        className="w-full h-48 flex items-end justify-center gap-1 opacity-90 transform scale-110"
                                    >
                                        {Array.from({ length: 25 }).map((_, i) => (
                                            <motion.div
                                                key={i}
                                                initial={{ height: 40 }}
                                                animate={{
                                                    height: [60, 100, 70],
                                                    translateY: [0, -20, 0]
                                                }}
                                                transition={{
                                                    repeat: Infinity,
                                                    duration: 0.4 + Math.random() * 0.3,
                                                    delay: i * 0.02,
                                                    ease: "easeInOut"
                                                }}
                                                className="w-8 bg-gradient-to-t from-black to-slate-800 rounded-t-full shadow-2xl origin-bottom"
                                                style={{
                                                    filter: 'drop-shadow(0 0 10px rgba(0,0,0,0.5))'
                                                }}
                                            >
                                                <div className="w-full h-full bg-white/10 rounded-t-full mix-blend-overlay"></div>
                                            </motion.div>
                                        ))}
                                    </motion.div>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

            </div>

            {/* --- CONTROLS AREA --- */}
            {phase === 'act' && (
                <div className="h-64 bg-slate-800 p-6 flex gap-6 border-t border-slate-700">

                    {/* 1. Position Controls */}
                    <div className="flex-1 flex flex-col gap-2">
                        <h4 className="text-slate-400 text-sm font-bold uppercase">1. Hit Your Mark</h4>
                        <div className="flex gap-2 flex-1">
                            {(['left', 'center', 'right'] as Position[]).map(pos => (
                                <button
                                    key={pos}
                                    onClick={() => { playSfx('hover'); setSelectedPos(pos); }}
                                    className={`flex-1 rounded-xl font-bold text-lg transition-all ${selectedPos === pos
                                        ? 'bg-purple-500 text-white shadow-lg scale-105'
                                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                        }`}
                                >
                                    {pos.toUpperCase()}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 2. Emotion Controls */}
                    <div className="flex-[0.8] flex flex-col gap-2">
                        <h4 className="text-slate-400 text-sm font-bold uppercase transition-colors" style={{ color: selectedPos ? 'white' : '' }}>2. Emote</h4>
                        <div className="grid grid-cols-3 gap-2 flex-1 opacity-50" style={{ opacity: selectedPos ? 1 : 0.5, pointerEvents: selectedPos ? 'auto' : 'none' }}>
                            {(Object.keys(EMOTIONS) as Emotion[]).map(emo => (
                                <button
                                    key={emo}
                                    onClick={() => { playSfx('hover'); setSelectedEmotion(emo); }}
                                    className={`rounded-xl text-2xl flex items-center justify-center transition-all ${selectedEmotion === emo
                                        ? 'bg-blue-500 text-white shadow-lg scale-110'
                                        : 'bg-slate-700 hover:bg-slate-600'
                                        }`}
                                >
                                    {EMOTIONS[emo]}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 3. Line Controls */}
                    <div className="flex-[1.5] flex flex-col gap-2">
                        <h4 className="text-slate-400 text-sm font-bold uppercase transition-colors" style={{ color: selectedEmotion ? 'white' : '' }}>3. Deliver Line</h4>
                        <div className="flex flex-col gap-2 flex-1 opacity-50" style={{ opacity: selectedEmotion ? 1 : 0.5, pointerEvents: selectedEmotion ? 'auto' : 'none' }}>
                            {lineOptions.map((line, i) => (
                                <button
                                    key={i}
                                    onClick={() => {
                                        playSfx('hover');
                                        setSelectedLine(line);
                                    }}
                                    className={`flex-1 text-left px-4 rounded-xl text-sm font-medium transition-all ${selectedLine === line
                                        ? 'bg-green-500 text-white shadow-lg'
                                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                        }`}
                                >
                                    "{line}"
                                </button>
                            ))}
                        </div>
                    </div>

                </div>
            )}

            {/* Action Button (only visible when all selected) */}
            {phase === 'act' && selectedPos && selectedEmotion && selectedLine && (
                <motion.button
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => { playSfx('click'); checkAction(); }}
                    className="absolute bottom-8 right-8 bg-gradient-to-r from-red-600 to-pink-600 text-white px-8 py-4 rounded-full font-black text-2xl shadow-[0_0_30px_rgba(255,0,0,0.5)] z-50 border-4 border-white"
                >
                    ACTION! 🎬
                </motion.button>
            )}

            {/* Safe zone for intro text */}
            {phase === 'intro' && <div className="h-64 bg-slate-800 border-t border-slate-700"></div>}

        </div>
    );
}
