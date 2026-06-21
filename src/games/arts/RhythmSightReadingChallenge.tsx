import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';

function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

interface MusicQuestion {
    id: string;
    category: 'notes' | 'rhythm' | 'dynamics' | 'terms' | 'keys';
    prompt: string;
    context: string;
    notation?: string; // Visual notation display
    options: { id: string; text: string; correct: boolean; explanation: string }[];
}

const QUESTION_BANK: MusicQuestion[] = [
    // NOTE VALUE QUESTIONS
    {
        id: 'n1', category: 'notes',
        prompt: 'How many beats does a dotted half note receive in 4/4 time?',
        notation: '𝅗𝅥.',
        context: 'A dot after any note adds half of that note\'s original duration.',
        options: shuffleArray([
            { id: 'n1a', text: '3 beats', correct: true, explanation: 'A half note = 2 beats. The dot adds half its value (1 beat). So 2 + 1 = 3 beats. Dotted notes always add 50% of the original duration.' },
            { id: 'n1b', text: '4 beats', correct: false, explanation: 'That would be a whole note. A dotted half note is 3 beats (2 + 1). The dot adds half the note\'s value, not a full beat.' },
            { id: 'n1c', text: '2 beats', correct: false, explanation: 'That\'s a regular half note without a dot. The dot is the key — it adds half the original value, making it 2 + 1 = 3 beats.' },
        ]),
    },
    {
        id: 'n2', category: 'notes',
        prompt: 'Which rest symbol indicates silence for one full beat in 4/4 time?',
        notation: '𝄾',
        context: 'Rests tell musicians when NOT to play. Each note value has a corresponding rest of equal duration.',
        options: shuffleArray([
            { id: 'n2a', text: 'Quarter rest (𝄾)', correct: true, explanation: 'The quarter rest equals one beat of silence in 4/4 time, just as a quarter note equals one beat of sound. It looks like a zigzag or lightning bolt.' },
            { id: 'n2b', text: 'Half rest (sits on top of the line)', correct: false, explanation: 'A half rest sits ON TOP of the middle line and equals 2 beats of silence. Think: it\'s like a hat sitting on top — hats are "heavy" and push down, so they\'re longer.' },
            { id: 'n2c', text: 'Whole rest (hangs below the line)', correct: false, explanation: 'A whole rest hangs BELOW the fourth line and equals 4 beats of silence (a full measure in 4/4). It looks like a top hat hanging upside down.' },
        ]),
    },
    {
        id: 'n3', category: 'notes',
        prompt: 'In 4/4 time, how many eighth notes fit in one measure?',
        notation: '♫♫♫♫',
        context: 'Understanding how note values subdivide is fundamental to reading rhythm accurately.',
        options: shuffleArray([
            { id: 'n3c', text: '4 eighth notes', correct: false, explanation: 'Four eighth notes only fill half a measure (2 beats). Since each eighth note = half a beat, you need 8 to fill the full 4 beats.' },
            { id: 'n3a', text: '8 eighth notes', correct: true, explanation: 'Each eighth note gets half a beat. With 4 beats per measure in 4/4 time: 4 ÷ 0.5 = 8 eighth notes. That\'s where the name "eighth" comes from — 8 per measure!' },
            { id: 'n3b', text: '16 eighth notes', correct: false, explanation: 'That would be sixteenth notes! 16 sixteenth notes fill one measure of 4/4. Eighth notes are twice as long, so only 8 fit per measure.' },
        ]),
    },
    // RHYTHM / TIME SIGNATURE QUESTIONS
    {
        id: 'r1', category: 'rhythm',
        prompt: 'What does the "4" on top in a 3/4 time signature tell you?',
        notation: '³⁄₄',
        context: 'Time signatures are like fractions — the top and bottom numbers each communicate different information.',
        options: shuffleArray([
            { id: 'r1b', text: 'There are 4 beats per measure', correct: false, explanation: 'The top number is 3, not 4! In 3/4 time, there are 3 beats per measure. The bottom 4 means the quarter note gets one beat.' },
            { id: 'r1a', text: 'Wait — the top number is 3, meaning 3 beats per measure', correct: true, explanation: 'Careful reading! In 3/4, the top number 3 tells you there are 3 beats per measure. The bottom 4 tells you the quarter note gets one beat. This is the waltz feel: ONE-two-three, ONE-two-three.' },
            { id: 'r1c', text: 'The tempo is 3/4 of normal speed', correct: false, explanation: 'Time signatures have nothing to do with tempo (speed). The top number = beats per measure, the bottom number = which note value gets one beat.' },
        ]),
    },
    {
        id: 'r2', category: 'rhythm',
        prompt: 'Which time signature is commonly called "cut time" and frequently used in marches?',
        notation: '₵',
        context: 'Some time signatures have special names and symbols used in orchestral, band, and choral music.',
        options: shuffleArray([
            { id: 'r2a', text: '2/2 (alla breve)', correct: true, explanation: 'Cut time (₵ or 2/2) has 2 beats per measure with the half note getting one beat. It moves quickly and is perfect for marches and fast-paced music because you feel 2 strong beats instead of 4.' },
            { id: 'r2b', text: '4/4 (common time)', correct: false, explanation: '4/4 is "common time" (marked with C), not "cut time." Cut time literally "cuts" the common time in half — 2 beats instead of 4, with the half note getting the beat.' },
            { id: 'r2c', text: '6/8 (compound duple)', correct: false, explanation: '6/8 is compound duple time, common in jigs and some ballads. It groups into 2 groups of 3 eighth notes. Cut time is 2/2 — 2 half-note beats per measure.' },
        ]),
    },
    {
        id: 'r3', category: 'rhythm',
        prompt: 'What rhythmic pattern does a "syncopation" create?',
        context: 'Syncopation is one of the most important rhythmic concepts in jazz, funk, Latin, and pop music.',
        options: shuffleArray([
            { id: 'r3b', text: 'A steady, predictable pulse on every beat', correct: false, explanation: 'That\'s the opposite of syncopation! A steady pulse on every beat is called "playing on the beat" or "straight rhythm." Syncopation specifically disrupts this predictability.' },
            { id: 'r3a', text: 'Emphasis on unexpected or "off" beats, creating rhythmic tension', correct: true, explanation: 'Syncopation places accents on weak beats or between beats, creating a "push-pull" feeling. It\'s what makes funk groovy, jazz swinging, and reggae bouncing — the surprise of emphasis where you don\'t expect it.' },
            { id: 'r3c', text: 'Gradually slowing down the tempo throughout a passage', correct: false, explanation: 'That\'s called "ritardando" (rit.). Syncopation is about WHERE accents fall within the beat structure, not about changing the overall speed of the music.' },
        ]),
    },
    // DYNAMICS QUESTIONS
    {
        id: 'd1', category: 'dynamics',
        prompt: 'Arrange these dynamic markings from softest to loudest.',
        notation: 'pp  ·  mp  ·  f  ·  ff',
        context: 'Dynamic markings tell the performer how loud or soft to play. They come from Italian words.',
        options: shuffleArray([
            { id: 'd1a', text: 'pp → mp → f → ff', correct: true, explanation: 'pp (pianissimo = very soft) → mp (mezzo piano = medium soft) → f (forte = loud) → ff (fortissimo = very loud). The "p" letters mean soft, "f" letters mean loud, and more letters = more extreme.' },
            { id: 'd1b', text: 'ff → f → mp → pp', correct: false, explanation: 'This is LOUDEST to softest — the reverse order. ff is the loudest and pp is the softest. The question asked for softest to loudest.' },
            { id: 'd1c', text: 'mp → pp → ff → f', correct: false, explanation: 'This order doesn\'t follow any logical progression. The correct softest-to-loudest order is: pp (very soft) → mp (medium soft) → f (loud) → ff (very loud).' },
        ]),
    },
    {
        id: 'd2', category: 'dynamics',
        prompt: 'What does a crescendo marking (< shape) tell the performer?',
        notation: '< < < < < <',
        context: 'Expressive markings give performers instructions beyond just notes and rhythms — they shape the emotional journey of the music.',
        options: shuffleArray([
            { id: 'd2c', text: 'Play the passage staccato (short and detached)', correct: false, explanation: 'Staccato is shown with dots above or below notes. The "hairpin" shape < is specifically about volume dynamics — getting gradually louder over time.' },
            { id: 'd2a', text: 'Gradually get louder over the passage', correct: true, explanation: 'A crescendo (the opening "hairpin" shape <) tells the performer to gradually increase volume. Think of the symbol itself — it opens up wider, like sound expanding. The opposite (>) is decrescendo/diminuendo.' },
            { id: 'd2b', text: 'Gradually speed up the tempo of the passage', correct: false, explanation: 'Speeding up is "accelerando" (accel.). Crescendo specifically controls volume, not speed. Dynamics and tempo are independent musical elements.' },
        ]),
    },
    // MUSICAL TERMS
    {
        id: 't1', category: 'terms',
        prompt: 'What does "allegro" indicate about how a piece should be performed?',
        context: 'Italian tempo markings are universal in Western music — musicians worldwide use the same terms regardless of their native language.',
        options: shuffleArray([
            { id: 't1b', text: 'Play very slowly and broadly', correct: false, explanation: 'That would be "largo" (very slow and broad). Allegro is at the fast end of the tempo spectrum — typically 120-156 BPM. Remembering allegro means "cheerful" helps recall it\'s upbeat and quick.' },
            { id: 't1a', text: 'Play at a fast, lively tempo (120-156 BPM)', correct: true, explanation: 'Allegro literally means "cheerful" in Italian and indicates a brisk, energetic tempo. It\'s one of the most common tempo markings, used in countless symphonic movements, pop songs, and marches.' },
            { id: 't1c', text: 'Play with a gradual decrease in volume', correct: false, explanation: 'Gradual volume decrease is "diminuendo" or "decrescendo." Allegro is a tempo marking (speed), not a dynamic marking (volume). These are separate categories of musical instruction.' },
        ]),
    },
    {
        id: 't2', category: 'terms',
        prompt: 'A score says "D.C. al Fine" at the end of a section. What should you do?',
        context: 'Navigation markings tell performers how to move through a piece — when to repeat, skip, or end.',
        options: shuffleArray([
            { id: 't2a', text: 'Go back to the very beginning and play until you reach the "Fine" marking', correct: true, explanation: '"D.C." stands for "Da Capo" (from the head/beginning). "al Fine" means "until the Fine (end) marking." So you restart the piece from bar 1 and stop when you reach "Fine" — even if there\'s more music written after it.' },
            { id: 't2b', text: 'Skip ahead to the Coda section and play to the end of the piece', correct: false, explanation: 'Jumping to a Coda is indicated by "D.S. al Coda" or a Coda symbol (⊕). "D.C. al Fine" specifically sends you back to the very beginning, not forward to a Coda.' },
            { id: 't2c', text: 'Repeat just the current section one more time, then stop completely', correct: false, explanation: 'Repeating a single section uses repeat signs (double bar with dots). "D.C. al Fine" sends you all the way back to bar 1 of the piece — the "Capo" (head) — not just the current section.' },
        ]),
    },
    // KEY SIGNATURE QUESTIONS
    {
        id: 'k1', category: 'keys',
        prompt: 'A key signature with no sharps or flats indicates which major key?',
        notation: '♮ (no accidentals)',
        context: 'Key signatures appear at the beginning of every line of music and tell you which notes are raised or lowered throughout.',
        options: shuffleArray([
            { id: 'k1b', text: 'G major (one sharp)', correct: false, explanation: 'G major has one sharp (F#) in its key signature. A completely clean key signature with zero sharps or flats is the natural key of C major.' },
            { id: 'k1a', text: 'C major', correct: true, explanation: 'C major uses only the white keys on a piano — no sharps or flats needed. That\'s why it\'s often the first scale students learn. Its relative minor (A minor) also has no accidentals in its key signature.' },
            { id: 'k1c', text: 'F major (one flat)', correct: false, explanation: 'F major has one flat (B♭) in its key signature. Only C major (and A minor) have the distinction of zero accidentals, using purely natural notes.' },
        ]),
    },
    {
        id: 'k2', category: 'keys',
        prompt: 'What information does a key signature primarily communicate to performers?',
        context: 'Key signatures are a shorthand that prevents composers from writing the same accidentals over and over on every note.',
        options: shuffleArray([
            { id: 'k2c', text: 'How fast or slow the piece should be performed overall', correct: false, explanation: 'Tempo is communicated by tempo markings (like "Allegro" or metronome numbers), not key signatures. Key signatures are exclusively about pitch — which notes are sharp or flat.' },
            { id: 'k2a', text: 'Which notes are consistently sharp or flat throughout the piece', correct: true, explanation: 'Key signatures are efficiency tools — instead of writing a sharp or flat on every F in a G major piece, you put one F# in the key signature. Every F in the piece is then automatically sharped unless otherwise marked.' },
            { id: 'k2b', text: 'Which instruments should play in each section of the composition', correct: false, explanation: 'Instrumentation is shown by the instrument names at the left of each staff and the score order. Key signatures tell you about pitch modifications, not orchestration.' },
        ]),
    },
];

interface RhythmSightReadingChallengeProps {
    onComplete: (score: number) => void;
}

function PianoSimulator({ onComplete }: { onComplete: () => void }) {
    const [playedNotes, setPlayedNotes] = useState<string[]>([]);

    // Simple Web Audio API synth
    const playNote = (frequency: number, noteName: string) => {
        if (!(window as any).sharedAudioCtx) {
            (window as any).sharedAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        const audioCtx = (window as any).sharedAudioCtx as AudioContext;

        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }

        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        // Use triangle for a slightly more pleasant "piano/synth" sound than harsh sine
        oscillator.type = 'triangle';
        oscillator.frequency.value = frequency;

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        // Envelope: quick attack, slow decay
        gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.5, audioCtx.currentTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.5);

        oscillator.start(audioCtx.currentTime);
        oscillator.stop(audioCtx.currentTime + 1.5);

        setPlayedNotes(prev => {
            const newNotes = [...prev, noteName];
            if (newNotes.length > 8) return newNotes.slice(newNotes.length - 8);
            return newNotes;
        });
    };

    const keys = [
        { note: 'C4', freq: 261.63, isBlack: false },
        { note: 'C#4', freq: 277.18, isBlack: true, left: '9%' },
        { note: 'D4', freq: 293.66, isBlack: false },
        { note: 'D#4', freq: 311.13, isBlack: true, left: '21.5%' },
        { note: 'E4', freq: 329.63, isBlack: false },
        { note: 'F4', freq: 349.23, isBlack: false },
        { note: 'F#4', freq: 369.99, isBlack: true, left: '46.5%' },
        { note: 'G4', freq: 392.00, isBlack: false },
        { note: 'G#4', freq: 415.30, isBlack: true, left: '59%' },
        { note: 'A4', freq: 440.00, isBlack: false },
        { note: 'A#4', freq: 466.16, isBlack: true, left: '71.5%' },
        { note: 'B4', freq: 493.88, isBlack: false },
        { note: 'C5', freq: 523.25, isBlack: false },
    ];

    const whiteKeys = keys.filter(k => !k.isBlack);

    return (
        <div className="max-w-4xl mx-auto p-6 flex flex-col items-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-6 w-full">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Practical Exam: Piano Simulator</h2>
                <p className="text-gray-600">Apply what you've learned. Play a melody (at least 5 notes) before submitting your performance!</p>
            </motion.div>

            <div className="bg-white p-6 rounded-3xl shadow-xl w-full max-w-2xl border border-gray-200">
                <div className="bg-gray-900 p-6 md:p-8 rounded-2xl shadow-inner relative select-none touch-none">

                    {/* Display Screen */}
                    <div className="h-16 bg-gray-800 mb-8 rounded-xl flex items-center justify-center border-4 border-gray-700 shadow-inner overflow-hidden">
                        <span className="text-green-400 font-mono text-xl md:text-2xl tracking-widest px-4">
                            {playedNotes.length > 0 ? playedNotes.join(' - ') : 'READY'}
                        </span>
                    </div>

                    {/* Keyboard */}
                    <div className="relative flex justify-between h-48 md:h-56 bg-gray-800 rounded-lg p-1 gap-1">
                        {/* White keys */}
                        {whiteKeys.map((key) => (
                            <div
                                key={key.note}
                                onMouseDown={() => playNote(key.freq, key.note)}
                                onTouchStart={(e) => { e.preventDefault(); playNote(key.freq, key.note); }}
                                className="bg-white hover:bg-gray-50 flex-1 rounded-b-lg border-x border-b-4 border-gray-300 shadow-md cursor-pointer flex items-end justify-center pb-4 active:bg-gray-200 active:border-b-0 active:translate-y-1 transition-all"
                            >
                                <span className="text-gray-400 font-bold text-sm pointer-events-none">{key.note}</span>
                            </div>
                        ))}

                        {/* Black keys container */}
                        <div className="absolute top-1 left-1 right-1 h-28 md:h-36 pointer-events-none">
                            {keys.filter(k => k.isBlack).map(key => (
                                <div
                                    key={key.note}
                                    onMouseDown={(e) => { e.stopPropagation(); playNote(key.freq, key.note); }}
                                    onTouchStart={(e) => { e.preventDefault(); e.stopPropagation(); playNote(key.freq, key.note); }}
                                    className="absolute bg-gray-900 w-[7%] h-full rounded-b-md border-x border-b-4 border-black shadow-xl cursor-pointer flex items-end justify-center pb-3 pointer-events-auto active:bg-gray-800 active:border-b-0 active:translate-y-1 transition-all z-10"
                                    style={{ left: key.left }}
                                >
                                    <span className="text-gray-500 font-bold text-[10px] pointer-events-none hidden md:block">{key.note}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: playedNotes.length >= 5 ? 1 : 0.5 }}
                disabled={playedNotes.length < 5}
                onClick={onComplete}
                className="mt-8 px-10 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xl rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all disabled:pointer-events-none cursor-pointer"
            >
                Submit Performance 🎹
            </motion.button>
        </div>
    );
}

export function RhythmSightReadingChallenge({ onComplete }: RhythmSightReadingChallengeProps) {
    const questions = useMemo(() => {
        const shuffled = shuffleArray([...QUESTION_BANK]);
        return shuffled.slice(0, 8);
    }, []);

    const [currentQ, setCurrentQ] = useState(0);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [showResult, setShowResult] = useState(false);
    const [correctCount, setCorrectCount] = useState(0);
    const [answered, setAnswered] = useState<{ question: MusicQuestion; wasCorrect: boolean }[]>([]);
    const [phase, setPhase] = useState<'intro' | 'playing' | 'piano' | 'final'>('intro');
    const [quizScore, setQuizScore] = useState(0);

    const question = questions[currentQ];

    const categoryLabels: Record<string, { label: string; icon: string }> = {
        notes: { label: 'Note Values', icon: '🎵' },
        rhythm: { label: 'Rhythm & Meter', icon: '🥁' },
        dynamics: { label: 'Dynamics', icon: '📢' },
        terms: { label: 'Musical Terms', icon: '📜' },
        keys: { label: 'Key Signatures', icon: '🎹' },
    };

    const handleAnswer = (optionId: string) => {
        if (showResult) return;
        setSelectedId(optionId);
        setShowResult(true);
        const correct = question.options.find(o => o.id === optionId)?.correct ?? false;
        if (correct) setCorrectCount(prev => prev + 1);
        setAnswered(prev => [...prev, { question, wasCorrect: correct }]);
    };

    const handleNext = () => {
        if (currentQ < questions.length - 1) {
            setCurrentQ(prev => prev + 1);
            setSelectedId(null);
            setShowResult(false);
        } else {
            const finalScore = Math.round((correctCount / questions.length) * 100);
            setQuizScore(finalScore);
            setPhase('piano');
        }
    };

    if (phase === 'intro') {
        return (
            <div className="max-w-3xl mx-auto p-6 flex items-center justify-center min-h-[60vh]">
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white p-10 rounded-3xl shadow-xl border border-gray-100 text-center max-w-lg">
                    <div className="text-6xl mb-6">🎼</div>
                    <h2 className="text-3xl font-black text-gray-900 mb-4">Rhythm & Sight Reading</h2>
                    <p className="text-gray-600 mb-6 text-lg">
                        Test your musical literacy! This challenge includes a <strong>theory quiz</strong> followed by a <strong>practical piano exam</strong>!
                    </p>
                    <button
                        onClick={() => setPhase('playing')}
                        className="px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xl rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all w-full cursor-pointer"
                    >
                        Start Sight Reading
                    </button>
                </motion.div>
            </div>
        );
    }

    if (phase === 'piano') {
        return <PianoSimulator onComplete={() => setPhase('final')} />;
    }

    if (phase === 'final') {
        return (
            <div className="max-w-4xl mx-auto p-6">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
                    <h2 className="text-4xl font-bold text-gray-900 mb-2">Performance Review</h2>
                    <div className="flex justify-center gap-6 mt-8">
                        <div className="bg-purple-50 text-purple-900 px-10 py-8 rounded-3xl border-2 border-purple-200">
                            <div className="text-sm font-bold uppercase tracking-widest text-purple-600 mb-2">Theory Score</div>
                            <div className="text-7xl font-black">{quizScore}%</div>
                            <div className="text-sm text-purple-700 font-medium mt-3">{correctCount} of {questions.length} correct</div>
                        </div>
                        <div className="bg-indigo-50 text-indigo-900 px-10 py-8 rounded-3xl border-2 border-indigo-200">
                            <div className="text-sm font-bold uppercase tracking-widest text-indigo-600 mb-2">Practical Exam</div>
                            <div className="text-7xl font-black">Pass 🎹</div>
                            <div className="text-sm text-indigo-700 font-medium mt-3">Melody Performed</div>
                        </div>
                    </div>
                </motion.div>

                <div className="text-center mb-10">
                    <button
                        onClick={() => onComplete(quizScore)}
                        className="px-12 py-4 bg-gray-900 hover:bg-black text-white font-bold text-xl rounded-full shadow-xl hover:shadow-2xl transition-all cursor-pointer"
                    >
                        Complete Sight Reading Challenge →
                    </button>
                </div>

                <div className="space-y-3 max-w-2xl mx-auto">
                    {answered.map((item, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.12 }}
                            className={`p-4 rounded-2xl border-2 ${item.wasCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}
                        >
                            <div className="flex items-center gap-2">
                                <span>{item.wasCorrect ? '✅' : '❌'}</span>
                                <span className="font-bold text-gray-900 text-sm flex-1">{item.question.prompt}</span>
                                <span className="text-xs text-gray-400">{categoryLabels[item.question.category].icon}</span>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        );
    }

    const selected = question.options.find(o => o.id === selectedId);

    return (
        <div className="max-w-3xl mx-auto p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <span className="text-lg">{categoryLabels[question.category].icon}</span>
                    <span className="text-sm font-medium text-purple-600">{categoryLabels[question.category].label}</span>
                </div>
                <span className="text-sm text-gray-500 font-medium">{currentQ + 1} / {questions.length}</span>
            </div>

            {/* Progress */}
            <div className="w-full h-2 bg-gray-200 rounded-full mb-6">
                <motion.div
                    className="h-full bg-gradient-to-r from-purple-500 to-fuchsia-500 rounded-full"
                    animate={{ width: `${((currentQ + (showResult ? 1 : 0)) / questions.length) * 100}%` }}
                />
            </div>

            <motion.div key={question.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="bg-white rounded-3xl shadow-lg border border-purple-100 p-6 mb-6">
                    {/* Notation display */}
                    {question.notation && (
                        <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-4 mb-4 text-center border border-amber-200">
                            <div className="text-4xl font-serif tracking-wider text-gray-800">{question.notation}</div>
                        </div>
                    )}

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
                                    <span className="text-gray-800 font-medium">{option.text}</span>
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
                        <h4 className="font-bold text-gray-900 mb-2">{selected.correct ? '🎵 Bravo!' : '💡 Music theory note:'}</h4>
                        <p className="text-gray-700 text-sm">{selected.explanation}</p>
                    </motion.div>
                )}

                {showResult && (
                    <button
                        onClick={handleNext}
                        className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-colors"
                    >
                        {currentQ < questions.length - 1 ? 'Next Question →' : 'See Performance Review'}
                    </button>
                )}
            </motion.div>
        </div>
    );
}
