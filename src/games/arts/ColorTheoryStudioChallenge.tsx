import { useState, useMemo, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

interface ColorQuestion {
    id: string;
    type: 'harmony' | 'temperature' | 'mood' | 'mixing';
    prompt: string;
    context: string;
    visual?: { colors: string[]; label?: string };
    options: { id: string; text: string; colors?: string[]; correct: boolean; explanation: string }[];
}

const QUESTION_BANK: ColorQuestion[] = [
    // HARMONY QUESTIONS
    {
        id: 'h1', type: 'harmony',
        prompt: 'Which palette uses complementary colors?',
        context: 'Complementary colors sit directly opposite each other on the color wheel, creating maximum contrast and visual energy.',
        options: shuffleArray([
            { id: 'h1a', text: 'Blue & Orange', colors: ['#2563eb', '#ea580c'], correct: true, explanation: 'Blue and orange are directly opposite on the color wheel — the classic complementary pair. This high-contrast combination creates visual tension and draws the eye.' },
            { id: 'h1b', text: 'Blue & Green', colors: ['#2563eb', '#16a34a'], correct: false, explanation: 'Blue and green are analogous colors (neighbors on the wheel), not complementary. They create harmony but lack the dramatic contrast of complements.' },
            { id: 'h1c', text: 'Blue & Purple', colors: ['#2563eb', '#9333ea'], correct: false, explanation: 'Blue and purple are also analogous — they share blue as a base. Complementary pairs always cross the wheel, never sit next to each other.' },
        ]),
    },
    {
        id: 'h2', type: 'harmony',
        prompt: 'Which set forms a triadic color scheme?',
        context: 'Triadic schemes use three colors equally spaced around the color wheel (120° apart), creating vibrant, balanced compositions.',
        options: shuffleArray([
            { id: 'h2a', text: 'Red, Yellow & Blue', colors: ['#dc2626', '#eab308', '#2563eb'], correct: true, explanation: 'The three primary colors form a perfect triadic scheme — each is 120° from the others on the color wheel, creating maximum balance with full vibrancy.' },
            { id: 'h2b', text: 'Red, Orange & Yellow', colors: ['#dc2626', '#ea580c', '#eab308'], correct: false, explanation: 'These are analogous colors — they sit next to each other on the warm side of the wheel. A triadic scheme requires even spacing across the entire wheel.' },
            { id: 'h2c', text: 'Red, Pink & Maroon', colors: ['#dc2626', '#ec4899', '#7f1d1d'], correct: false, explanation: 'These are monochromatic variations of red (different tints, shades, and tones of one hue), not a triadic scheme.' },
        ]),
    },
    {
        id: 'h3', type: 'harmony',
        prompt: 'Which palette demonstrates an analogous color scheme?',
        context: 'Analogous colors are neighbors on the color wheel (2-4 adjacent hues), creating smooth, harmonious transitions found often in nature.',
        options: shuffleArray([
            { id: 'h3c', text: 'Red & Green', colors: ['#dc2626', '#16a34a'], correct: false, explanation: 'Red and green are complementary (opposite on the wheel), not analogous. Think of how jarring Christmas colors can feel compared to a sunset palette.' },
            { id: 'h3a', text: 'Yellow, Yellow-Green & Green', colors: ['#eab308', '#84cc16', '#16a34a'], correct: true, explanation: 'These three hues sit side by side on the color wheel, flowing naturally from yellow through green. This is exactly how analogous schemes work — gentle, nature-inspired transitions.' },
            { id: 'h3b', text: 'Red, Blue & Yellow', colors: ['#dc2626', '#2563eb', '#eab308'], correct: false, explanation: 'These are the three primaries forming a triadic scheme (evenly spaced around the wheel), not analogous neighbors.' },
        ]),
    },
    // TEMPERATURE QUESTIONS
    {
        id: 't1', type: 'temperature',
        prompt: 'You\'re painting a serene winter scene. Which palette sets the right mood?',
        context: 'Cool colors (blues, blue-greens, violets) recede visually and evoke calmness, distance, and cold temperatures.',
        options: shuffleArray([
            { id: 't1a', text: 'Ice Blue, Lavender & Silver', colors: ['#93c5fd', '#c4b5fd', '#cbd5e1'], correct: true, explanation: 'These cool, desaturated tones perfectly capture winter\'s quiet stillness. The blue and violet family creates psychological "coolness" while the muted saturation suggests frost and overcast skies.' },
            { id: 't1b', text: 'Crimson, Amber & Gold', colors: ['#dc2626', '#f59e0b', '#ca8a04'], correct: false, explanation: 'These are warm colors that evoke fire, autumn, and energy — the opposite of a serene winter mood. Warm hues advance visually and feel active, not calm.' },
            { id: 't1c', text: 'Neon Green, Hot Pink & Electric Blue', colors: ['#4ade80', '#ec4899', '#3b82f6'], correct: false, explanation: 'These high-saturation neon colors are energetic and attention-grabbing — great for a party poster but completely wrong for a serene, tranquil winter landscape.' },
        ]),
    },
    {
        id: 't2', type: 'temperature',
        prompt: 'A client wants a "cozy autumn cafe" brand identity. Which palette delivers?',
        context: 'Warm colors (reds, oranges, yellows, earth tones) advance toward the viewer and evoke warmth, comfort, and energy.',
        options: shuffleArray([
            { id: 't2b', text: 'Arctic Blue, Mint & White', colors: ['#7dd3fc', '#a7f3d0', '#f8fafc'], correct: false, explanation: 'This cool, minty palette suggests freshness and clinical cleanliness — think spa or dental office, not a warm autumn cafe with steaming drinks.' },
            { id: 't2a', text: 'Burnt Sienna, Warm Amber & Espresso', colors: ['#b45309', '#d97706', '#44271a'], correct: true, explanation: 'These earth tones directly mirror autumn — falling leaves, warm drinks, wooden interiors. The low saturation and warm undertones create psychological comfort and coziness.' },
            { id: 't2c', text: 'Charcoal, Slate & Black', colors: ['#374151', '#64748b', '#111827'], correct: false, explanation: 'This achromatic palette feels sophisticated and modern, but it\'s cold and serious — more luxury brand than cozy cafe. There\'s no warmth or autumn feeling.' },
        ]),
    },
    // MOOD QUESTIONS
    {
        id: 'm1', type: 'mood',
        prompt: 'You\'re designing a poster for a children\'s art camp. Which palette creates the right energy?',
        context: 'High-saturation colors with variety create excitement and playfulness, while value contrast ensures readability.',
        options: shuffleArray([
            { id: 'm1a', text: 'Bright Yellow, Coral & Turquoise', colors: ['#facc15', '#f97316', '#06b6d4'], correct: true, explanation: 'These saturated, cheerful colors vibrate with youthful energy. The warm-cool balance prevents monotony while the high saturation screams "fun!" — exactly what a children\'s camp wants.' },
            { id: 'm1b', text: 'Navy, Burgundy & Forest Green', colors: ['#1e3a5f', '#7f1d1d', '#14532d'], correct: false, explanation: 'These deep, dark colors convey formality, tradition, and seriousness. They\'d work for a law firm or university, but would feel heavy and unwelcoming for a kids\' art camp.' },
            { id: 'm1c', text: 'Beige, Taupe & Cream', colors: ['#d4c5a9', '#a89984', '#f5f0e8'], correct: false, explanation: 'This neutral palette is elegant and sophisticated but completely lacks the energy and excitement children respond to. It reads as "luxury home goods" not "art camp fun."' },
        ]),
    },
    {
        id: 'm2', type: 'mood',
        prompt: 'A horror film poster needs a color palette that creates dread. Which one works?',
        context: 'Dark values, desaturated hues, and unexpected accent colors create tension, unease, and psychological discomfort.',
        options: shuffleArray([
            { id: 'm2c', text: 'Pastel Pink, Sky Blue & Lavender', colors: ['#f9a8d4', '#7dd3fc', '#d8b4fe'], correct: false, explanation: 'Soft pastels evoke innocence, gentleness, and nurseries — the polar opposite of horror. Unless you\'re subverting expectations, these colors feel safe and comforting.' },
            { id: 'm2b', text: 'Bright Orange, Lime Green & Cyan', colors: ['#f97316', '#84cc16', '#06b6d4'], correct: false, explanation: 'These bold, saturated colors feel sporty, tropical, and energetic — perfect for a smoothie brand, terrible for creating cinematic dread.' },
            { id: 'm2a', text: 'Deep Crimson, Charcoal & Sickly Green', colors: ['#7f1d1d', '#1f2937', '#4d7c0f'], correct: true, explanation: 'This palette uses darkness and desaturation to create unease. The deep red suggests danger and blood, charcoal provides suffocating darkness, and the muted green adds an unsettling, toxic quality.' },
        ]),
    },
    // MIXING QUESTIONS
    {
        id: 'x1', type: 'mixing',
        prompt: 'In traditional paint mixing, what do you get when you combine red and blue?',
        context: 'Subtractive color mixing (paint, ink) works differently from additive mixing (light). In paint, primaries combine to form secondaries.',
        options: shuffleArray([
            { id: 'x1a', text: 'Purple/Violet', colors: ['#9333ea'], correct: true, explanation: 'Red + Blue = Purple! In subtractive mixing (paint), combining two primaries always produces the secondary color between them on the traditional color wheel.' },
            { id: 'x1b', text: 'Green', colors: ['#16a34a'], correct: false, explanation: 'Green is made from Blue + Yellow, not Red + Blue. Each secondary color is a mix of the two primaries on either side of it on the wheel.' },
            { id: 'x1c', text: 'Orange', colors: ['#ea580c'], correct: false, explanation: 'Orange is made from Red + Yellow. Remember: each secondary color sits between the two primaries that create it on the color wheel.' },
        ]),
    },
    {
        id: 'x2', type: 'mixing',
        prompt: 'What happens when you add white to a pure hue?',
        context: 'Modifying a pure hue with white, black, or gray creates tints, shades, and tones — the building blocks of sophisticated color palettes.',
        options: shuffleArray([
            { id: 'x2b', text: 'You create a shade (darker version)', colors: ['#1e3a5f'], correct: false, explanation: 'Adding black creates a shade. Adding white creates a tint. This distinction matters — shades feel heavier and more dramatic, while tints feel lighter and airier.' },
            { id: 'x2a', text: 'You create a tint (lighter, pastel version)', colors: ['#93c5fd'], correct: true, explanation: 'Correct! White + any hue = a tint. Pastels are tints — they retain the hue\'s character but feel softer and more delicate. Think of baby pink (red + white).' },
            { id: 'x2c', text: 'You create a tone (grayed-out version)', colors: ['#6b7280'], correct: false, explanation: 'Adding gray creates a tone. Tones feel muted and sophisticated — think "dusty rose" vs "bright pink." White specifically creates lighter tints, not tones.' },
        ]),
    },
    {
        id: 'x3', type: 'mixing',
        prompt: 'An artist wants to make a color less vibrant without changing its lightness. What should they add?',
        context: 'Understanding how to control saturation independently from value is essential for creating nuanced, professional-looking artwork.',
        options: shuffleArray([
            { id: 'x3a', text: 'Add the color\'s complement (opposite on the wheel)', colors: ['#9ca3af'], correct: true, explanation: 'Adding a color\'s complement effectively neutralizes it, reducing saturation while roughly maintaining value. This is how painters "gray down" colors naturally without making them lighter or darker.' },
            { id: 'x3b', text: 'Add white to lighten and dilute the color', colors: ['#e0e7ff'], correct: false, explanation: 'White reduces saturation but also dramatically increases lightness — the color becomes a tint. The artist specifically wanted to keep the same lightness level.' },
            { id: 'x3c', text: 'Add black to darken and mute the color', colors: ['#1e1b4b'], correct: false, explanation: 'Black reduces saturation but also dramatically decreases lightness — the color becomes a shade. The artist wanted to desaturate without changing how light or dark it is.' },
        ]),
    },
];

interface ColorTheoryStudioChallengeProps {
    onComplete: (score: number) => void;
}

function DrawingCanvas({ onComplete }: { onComplete: () => void }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [color, setColor] = useState('#9333ea');
    const [lineWidth, setLineWidth] = useState(5);
    const [hasDrawn, setHasDrawn] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }, []);

    const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();

        let clientX = 0;
        let clientY = 0;

        if ('touches' in e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = (e as React.MouseEvent).clientX;
            clientY = (e as React.MouseEvent).clientY;
        }

        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    };

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        const { x, y } = getCoordinates(e);
        const ctx = canvasRef.current?.getContext('2d');
        if (ctx) {
            ctx.beginPath();
            ctx.moveTo(x, y);
            setIsDrawing(true);
        }
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;

        const { x, y } = getCoordinates(e);
        const ctx = canvasRef.current?.getContext('2d');
        if (ctx) {
            ctx.lineTo(x, y);
            ctx.strokeStyle = color;
            ctx.lineWidth = lineWidth;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.stroke();
            setHasDrawn(true);
        }
    };

    const stopDrawing = () => {
        if (isDrawing) {
            const ctx = canvasRef.current?.getContext('2d');
            ctx?.closePath();
            setIsDrawing(false);
        }
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (canvas && ctx) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            setHasDrawn(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6 flex flex-col items-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-6 w-full">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Practical Exam: Free Canvas</h2>
                <p className="text-gray-600">Apply what you've learned. Draw something creative before submitting your portfolio!</p>
            </motion.div>

            <div className="bg-white p-4 rounded-3xl shadow-xl w-full border border-gray-200">
                <div className="flex flex-wrap gap-4 mb-4 justify-between items-center bg-gray-50 p-4 rounded-2xl">
                    <div className="flex flex-wrap gap-3 items-center">
                        <label className="text-sm font-bold text-gray-600 uppercase tracking-wider">Color</label>
                        <input
                            type="color"
                            value={color}
                            onChange={(e) => setColor(e.target.value)}
                            className="w-10 h-10 rounded cursor-pointer border-0 p-0"
                        />
                        <div className="flex gap-2 ml-2">
                            {['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7', '#000000', '#ffffff'].map(c => (
                                <button
                                    key={c}
                                    className={`w-8 h-8 rounded-full border-2 shadow-sm ${color === c ? 'border-gray-900 scale-110' : 'border-gray-200 hover:scale-105'}`}
                                    style={{ backgroundColor: c }}
                                    onClick={() => setColor(c)}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <label className="text-sm font-bold text-gray-600 uppercase tracking-wider">Brush Size</label>
                        <input
                            type="range"
                            min="1" max="50"
                            value={lineWidth}
                            onChange={(e) => setLineWidth(Number(e.target.value))}
                            className="w-32 accent-purple-600 cursor-pointer"
                        />
                    </div>

                    <button
                        onClick={clearCanvas}
                        className="px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-xl font-bold text-sm transition-colors cursor-pointer"
                    >
                        🗑️ Clear
                    </button>
                </div>

                <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white touch-none cursor-crosshair flex justify-center shadow-inner">
                    <canvas
                        ref={canvasRef}
                        width={800}
                        height={500}
                        className="max-w-full h-auto bg-white"
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseOut={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                    />
                </div>
            </div>

            <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: hasDrawn ? 1 : 0.5 }}
                disabled={!hasDrawn}
                onClick={onComplete}
                className="mt-8 px-10 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-xl rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all disabled:pointer-events-none cursor-pointer"
            >
                Submit Masterpiece ✨
            </motion.button>
        </div>
    );
}

export function ColorTheoryStudioChallenge({ onComplete }: ColorTheoryStudioChallengeProps) {
    const questions = useMemo(() => {
        const shuffled = shuffleArray([...QUESTION_BANK]);
        return shuffled.slice(0, 8); // Pick 8 random questions per playthrough
    }, []);

    const [currentQ, setCurrentQ] = useState(0);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [showResult, setShowResult] = useState(false);
    const [correctCount, setCorrectCount] = useState(0);
    const [answered, setAnswered] = useState<{ question: ColorQuestion; wasCorrect: boolean; chosenId: string }[]>([]);
    const [phase, setPhase] = useState<'intro' | 'playing' | 'canvas' | 'final'>('intro');
    const [quizScore, setQuizScore] = useState(0);

    const question = questions[currentQ];

    const handleAnswer = (optionId: string) => {
        if (showResult) return;
        setSelectedId(optionId);
        setShowResult(true);
        const correct = question.options.find(o => o.id === optionId)?.correct ?? false;
        if (correct) setCorrectCount(prev => prev + 1);
        setAnswered(prev => [...prev, { question, wasCorrect: correct, chosenId: optionId }]);
    };

    const handleNext = () => {
        if (currentQ < questions.length - 1) {
            setCurrentQ(prev => prev + 1);
            setSelectedId(null);
            setShowResult(false);
        } else {
            const finalScore = Math.round(((correctCount) / questions.length) * 100);
            setQuizScore(finalScore);
            setPhase('canvas');
        }
    };

    const typeLabels: Record<string, { label: string; icon: string }> = {
        harmony: { label: 'Color Harmony', icon: '🎨' },
        temperature: { label: 'Color Temperature', icon: '🌡️' },
        mood: { label: 'Color & Mood', icon: '🎭' },
        mixing: { label: 'Color Mixing', icon: '🧪' },
    };

    if (phase === 'intro') {
        return (
            <div className="max-w-3xl mx-auto p-6 flex items-center justify-center min-h-[60vh]">
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white p-10 rounded-3xl shadow-xl border border-gray-100 text-center max-w-lg">
                    <div className="text-6xl mb-6">🎨</div>
                    <h2 className="text-3xl font-black text-gray-900 mb-4">Color Theory Studio</h2>
                    <p className="text-gray-600 mb-6 text-lg">
                        Test your eye for color! This challenge includes a <strong>theory quiz</strong> followed by a <strong>practical drawing exam</strong>!
                    </p>
                    <button
                        onClick={() => setPhase('playing')}
                        className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-xl rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all w-full cursor-pointer"
                    >
                        Start Studio Session
                    </button>
                </motion.div>
            </div>
        );
    }

    if (phase === 'canvas') {
        return <DrawingCanvas onComplete={() => setPhase('final')} />;
    }

    if (phase === 'final') {
        return (
            <div className="max-w-4xl mx-auto p-6">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
                    <h2 className="text-4xl font-bold text-gray-900 mb-2">Gallery Review</h2>
                    <div className="flex justify-center gap-6 mt-8">
                        <div className="bg-purple-50 text-purple-900 px-10 py-8 rounded-3xl border-2 border-purple-200">
                            <div className="text-sm font-bold uppercase tracking-widest text-purple-600 mb-2">Theory Score</div>
                            <div className="text-7xl font-black">{quizScore}%</div>
                            <div className="text-sm text-purple-700 font-medium mt-3">{correctCount} of {questions.length} correct</div>
                        </div>
                        <div className="bg-pink-50 text-pink-900 px-10 py-8 rounded-3xl border-2 border-pink-200">
                            <div className="text-sm font-bold uppercase tracking-widest text-pink-600 mb-2">Practical Exam</div>
                            <div className="text-7xl font-black">Pass ✨</div>
                            <div className="text-sm text-pink-700 font-medium mt-3">Masterpiece Submitted</div>
                        </div>
                    </div>
                </motion.div>

                <div className="text-center mb-10">
                    <button
                        onClick={() => onComplete(quizScore)}
                        className="px-12 py-4 bg-gray-900 hover:bg-black text-white font-bold text-xl rounded-full shadow-xl hover:shadow-2xl transition-all cursor-pointer"
                    >
                        Complete Studio Challenge →
                    </button>
                </div>

                <div className="space-y-3 max-w-2xl mx-auto">
                    {answered.map((item, i) => {
                        const correctOpt = item.question.options.find(o => o.correct)!;
                        return (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.15 }}
                                className={`p-4 rounded-2xl border-2 ${item.wasCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}
                            >
                                <div className="flex items-center gap-2 mb-1">
                                    <span>{item.wasCorrect ? '✅' : '❌'}</span>
                                    <span className="font-bold text-gray-900 text-sm">{item.question.prompt}</span>
                                </div>
                                {!item.wasCorrect && (
                                    <p className="text-xs text-gray-600">Correct: {correctOpt.text}</p>
                                )}
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        );
    }

    const selected = question.options.find(o => o.id === selectedId);

    return (
        <div className="max-w-3xl mx-auto p-6">
            {/* Progress */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <span className="text-lg">{typeLabels[question.type].icon}</span>
                    <span className="text-sm font-medium text-purple-600">{typeLabels[question.type].label}</span>
                </div>
                <span className="text-sm text-gray-500 font-medium">
                    {currentQ + 1} / {questions.length}
                </span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-2 bg-gray-200 rounded-full mb-6">
                <motion.div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${((currentQ + (showResult ? 1 : 0)) / questions.length) * 100}%` }}
                />
            </div>

            {/* Question */}
            <motion.div key={question.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="bg-white rounded-3xl shadow-lg border border-purple-100 p-6 mb-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{question.prompt}</h3>
                    <p className="text-sm text-gray-500 mb-6">{question.context}</p>

                    <div className="space-y-3">
                        {question.options.map(option => {
                            let borderClass = 'border-gray-200 hover:border-purple-400 hover:bg-purple-50';
                            if (showResult && option.id === selectedId) {
                                borderClass = option.correct ? 'border-green-400 bg-green-50' : 'border-red-400 bg-red-50';
                            } else if (showResult && option.correct) {
                                borderClass = 'border-green-300 bg-green-50/50';
                            } else if (showResult) {
                                borderClass = 'border-gray-100 opacity-50';
                            }

                            return (
                                <motion.button
                                    key={option.id}
                                    whileHover={!showResult ? { scale: 1.01 } : undefined}
                                    whileTap={!showResult ? { scale: 0.99 } : undefined}
                                    onClick={() => handleAnswer(option.id)}
                                    disabled={showResult}
                                    className={`w-full p-4 text-left rounded-xl border-2 transition-all ${borderClass}`}
                                >
                                    <div className="flex items-center gap-3">
                                        {/* Color swatches */}
                                        {option.colors && (
                                            <div className="flex gap-1 flex-shrink-0">
                                                {option.colors.map((color, ci) => (
                                                    <div
                                                        key={ci}
                                                        className="w-8 h-8 rounded-lg border border-white shadow-sm"
                                                        style={{ backgroundColor: color }}
                                                    />
                                                ))}
                                            </div>
                                        )}
                                        <span className="text-gray-800 font-medium">{option.text}</span>
                                    </div>
                                </motion.button>
                            );
                        })}
                    </div>
                </div>

                {/* Feedback */}
                {showResult && selected && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`rounded-2xl p-5 mb-4 ${selected.correct ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'}`}
                    >
                        <h4 className="font-bold text-gray-900 mb-2">{selected.correct ? '🎨 Perfect eye!' : '💡 Here\'s why:'}</h4>
                        <p className="text-gray-700 text-sm">{selected.explanation}</p>
                    </motion.div>
                )}

                {showResult && (
                    <button
                        onClick={handleNext}
                        className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-colors"
                    >
                        {currentQ < questions.length - 1 ? `Next Question →` : 'See Results'}
                    </button>
                )}
            </motion.div>
        </div>
    );
}
