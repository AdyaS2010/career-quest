import { useState } from 'react';
import { Compass, Target, Trophy, Zap, Star, Flame, Sparkles, Coins } from 'lucide-react';
import { AppNavbar } from '../components/AppNavbar';
import { useTheme } from '../contexts/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';

const CAREER_PREVIEWS = [
    {
        emoji: '🍳',
        name: 'Culinary Arts',
        desc: 'Take orders, cook meals under pressure, and plate like a pro!',
        secrets: [
            '🍳 The first chocolate chip cookie was actually invented by accident!',
            '🍍 Pineapples can take up to three whole years to grow and mature!',
            '🍯 Honey never spoils: you could theoretically eat 3,000-year-old honey!'
        ]
    },
    {
        emoji: '💻',
        name: 'Information Technology',
        desc: 'Hunt bugs, design systems, and build algorithms!',
        secrets: [
            '🤓 The first computer bug was an actual moth found trapped in a relay in 1947!',
            '⌨️ The standard QWERTY keyboard layout was designed to slow down typists and prevent mechanical jams!',
            '💾 The "save" icon is a floppy disk, which most players have never seen in real life!'
        ]
    },
    {
        emoji: '🏥',
        name: 'Health Sciences',
        desc: 'Diagnose patients, plan treatments, and run the ER!',
        secrets: [
            '🫀 Your heart beats about 100,000 times every single day!',
            '🦒 Humans and giraffes have the exact same number of neck bones: seven!',
            '🦷 Tooth enamel is the hardest substance in the human body, but it cannot self-repair!'
        ]
    },
    {
        emoji: '⚖️',
        name: 'Law & Government',
        desc: 'Examine evidence, cross-examine witnesses, and argue cases!',
        secrets: [
            '🏛️ The oldest known written laws were created in ancient Sumeria over 4,000 years ago!',
            '🐹 In Switzerland, it is illegal to own just one guinea pig because they get lonely!',
            '📜 The original United States Constitution is only four pages long!'
        ]
    },
    {
        emoji: '💰',
        name: 'Financial Services',
        desc: 'Balance budgets, catch fraud, and invest wisely!',
        secrets: [
            '📈 Warren Buffett bought his first stock at age 11 - talk about starting early!',
            '💵 Paper money isn\'t paper: it\'s actually a blend of 75% cotton and 25% linen!',
            '🐷 Piggy banks are named after "pygg" - a type of orange clay used to make dishes in the Middle Ages!'
        ]
    },
    {
        emoji: '📚',
        name: 'Education',
        desc: 'Conduct classrooms, plan lessons, and handle crises!',
        secrets: [
            '🏫 The oldest continuously operating university was founded by a woman in Morocco in 859 AD!',
            '🎒 Finland has no standardized testing until high school, but has world-class scores!',
            '✍️ Using a yellow highlighter doesn\'t leave a shadow when you photocopy a page!'
        ]
    },
    {
        emoji: '📺',
        name: 'Media & Communication',
        desc: 'Craft stories, fact-check news, and master interviews!',
        secrets: [
            '📰 The first newspaper was published in 1605 in Germany!',
            '🎙️ The word "podcast" is a portmanteau of "iPod" and "broadcast"!',
            '🕊️ Before the internet, homing pigeons were used to send news flashes across countries!'
        ]
    },
    {
        emoji: '🎨',
        name: 'Arts & Design',
        desc: 'Perform on Broadway, mix colors, and read music!',
        secrets: [
            '🎭 Shakespeare invented over 1,700 English words, including "lonely" and "swagger"!',
            '🎨 The color "mummy brown" was actually made from ground-up mummies until the mid-1960s!',
            '🎵 Listening to music releases dopamine, the same chemical released when eating chocolate!'
        ]
    },
];

const STEPS = [
    { icon: Compass, title: 'Explore the Map', desc: 'The Career Kingdom shows all 8 Districts. Click any District to enter!', emoji: '🗺️' },
    { icon: Target, title: 'Take On Challenges', desc: 'Each career has 3 unique mini-games. Beat one to unlock the next!', emoji: '🎯' },
    { icon: Trophy, title: 'Earn Points', desc: 'Score up to 100 points per challenge. Your best score is always saved!', emoji: '💯' },
    { icon: Zap, title: 'Level Up', desc: 'Every 100 XP = 1 level. Daily streaks give you bonus XP!', emoji: '⚡' },
    { icon: Star, title: 'Unlock Achievements', desc: 'Special badges for milestones: first District, perfect scores, and more!', emoji: '🏅' },
    { icon: Flame, title: 'Keep Your Streak', desc: 'Log in every day for +50 XP. Miss a day? Streak resets! 😱', emoji: '🔥' },
];

// Easter egg messages when clicking the sparkle button
const EASTER_EGGS = [
    '✨ You found a secret! If you click the city\'s duck 10 times, nothing happens, but it appreciates the attention.',
    '🎉 Easter egg! The first version of this game was designed on a single sketchpad.',
    '🐛 Is it a bug or a feature? Let\'s just call it an undocumented upgrade.',
    '💡 Pro tip: The Mayor has a secret collection of pixelated stamps.',
    '🎵 The background audio is generated live by synthesizers: no audio files were harmed!',
    '🚀 Fun fact: This game has more lines of code than the Apollo 11 guidance computer.',
    '🧭 The compass icon was chosen because exploring careers is a true adventure!',
    '🤫 Secret: There is a hidden achievement for completing every single challenge in town!',
];

export function HowToPlayPage() {
    const { theme } = useTheme();
    const [flippedCards, setFlippedCards] = useState<Set<number>>(new Set());
    const [cardFactIndices, setCardFactIndices] = useState<Record<number, number>>({});
    const [easterEggIndex, setEasterEggIndex] = useState(-1);
    const [sparkleCount, setSparkleCount] = useState(0);

    const handleCardClick = (i: number) => {
        if (!flippedCards.has(i)) {
            // Flip it
            setFlippedCards(prev => {
                const next = new Set(prev);
                next.add(i);
                return next;
            });
            // Initialize index to 0 if not present
            if (cardFactIndices[i] === undefined) {
                setCardFactIndices(prev => ({ ...prev, [i]: 0 }));
            }
        } else {
            // Already flipped: cycle the fact
            setCardFactIndices(prev => ({
                ...prev,
                [i]: ((prev[i] ?? 0) + 1) % 3
            }));
        }
    };

    const handleCloseCard = (i: number, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent cycling fact
        setFlippedCards(prev => {
            const next = new Set(prev);
            next.delete(i);
            return next;
        });
    };

    const triggerEasterEgg = () => {
        setEasterEggIndex((sparkleCount) % EASTER_EGGS.length);
        setSparkleCount(s => s + 1);
    };

    return (
        <div
            className="min-h-screen"
            style={{ background: 'linear-gradient(to bottom right, var(--bg-primary), var(--bg-secondary))' }}
        >
            <AppNavbar />

            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">

                {/* Fun Header */}
                <div className="relative overflow-hidden py-12 text-center">
                    {/* Glowing Bloom Background Overlay */}
                    <div className={`absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,${theme === 'dark' ? 'rgba(139,92,246,0.12)' : 'rgba(236,72,153,0.08)'},transparent_60%)]`} />
                    {/* Floating icons using framer-motion */}
                    <motion.div
                        className="absolute top-4 left-6 text-3xl opacity-20 hidden md:block"
                        animate={{ y: [0, -10, 0], rotate: [0, 10, 0] }}
                        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                    >
                        🧭
                    </motion.div>
                    <motion.div
                        className="absolute bottom-4 right-10 text-3xl opacity-25 hidden md:block"
                        animate={{ y: [0, 12, 0], rotate: [0, -15, 0] }}
                        transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }}
                    >
                        🎮
                    </motion.div>
                    <motion.div
                        className="absolute top-6 right-20 text-2xl opacity-15 hidden md:block"
                        animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.3, 0.15] }}
                        transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                    >
                        ✨
                    </motion.div>
                    <motion.div
                        className="absolute bottom-6 left-16 text-2xl opacity-20 hidden md:block"
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
                    >
                        ⚙️
                    </motion.div>

                    <div className="relative z-10 space-y-4">
                        <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500 drop-shadow-[0_2px_10px_rgba(236,72,153,0.2)]">
                            Welcome to Career Quest
                        </h2>
                        <p className="text-lg md:text-xl max-w-2xl mx-auto font-medium" style={{ color: 'var(--text-secondary)' }}>
                            Explore eight unique career worlds, test your skills in interactive challenges, and discover the path that sparks your passion!
                        </p>
                    </div>
                </div>

                {/* Game Flow Steps */}
                <section>
                    <h2 className="text-3xl font-bold mb-8 text-center" style={{ color: 'var(--text-primary)' }}>
                        Your Journey in 6 Steps
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {STEPS.map((step, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1, type: 'spring', bounce: 0.4 }}
                                whileHover={{ y: -8, rotate: i % 2 === 0 ? 2 : -2 }}
                                className="p-6 rounded-2xl border shadow-sm cursor-default"
                                style={{
                                    backgroundColor: 'var(--surface-card)',
                                    borderColor: 'var(--border-default)'
                                }}
                            >
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow">
                                        <step.icon className="w-6 h-6 text-white" />
                                    </div>
                                    <span className="text-3xl">{step.emoji}</span>
                                </div>
                                <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--text-primary)' }}>{step.title}</h3>
                                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{step.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </section>

                {/* Career Previews - Flippable Cards */}
                <section>
                    <h2 className="text-3xl font-bold mb-2 text-center" style={{ color: 'var(--text-primary)' }}>
                        8 Career Districts to Explore
                    </h2>
                    <p className="text-center text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>
                        🤫 Psst... click any card to reveal a fun fact!
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        {CAREER_PREVIEWS.map((career, i) => {
                            const isFlipped = flippedCards.has(i);
                            const currentFactIndex = cardFactIndices[i] ?? 0;
                            const currentFact = career.secrets[currentFactIndex];

                            return (
                                <motion.div
                                    key={i}
                                    onClick={() => handleCardClick(i)}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="relative text-left w-full p-5 rounded-2xl border transition-all cursor-pointer overflow-hidden min-h-[130px] flex flex-col justify-between"
                                    style={{
                                        backgroundColor: isFlipped
                                            ? (theme === 'dark' ? 'rgba(139, 92, 246, 0.15)' : '#f5f3ff')
                                            : 'var(--surface-card)',
                                        borderColor: isFlipped
                                            ? (theme === 'dark' ? 'rgba(139, 92, 246, 0.4)' : '#c4b5fd')
                                            : 'var(--border-default)'
                                    }}
                                >
                                    {/* Close Button on Card Back */}
                                    {isFlipped && (
                                        <button
                                            onClick={(e) => handleCloseCard(i, e)}
                                            className="absolute top-3 right-3 p-1 rounded-full transition-colors hover:bg-black/10 dark:hover:bg-white/10 z-20"
                                            title="Close fact"
                                            aria-label="Close fact"
                                        >
                                            <span className="text-sm font-bold opacity-60 hover:opacity-100" style={{ color: 'var(--text-primary)' }}>✕</span>
                                        </button>
                                    )}

                                    <div className="flex items-start gap-4 pr-6">
                                        <motion.span
                                            className="text-4xl flex-shrink-0 animate-pulse"
                                            animate={isFlipped ? { rotateY: 180 } : { rotateY: 0 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            {career.emoji}
                                        </motion.span>
                                        <div className="space-y-1">
                                            <h4 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>{career.name}</h4>
                                            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                                                {isFlipped ? currentFact : career.desc}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Rotator Hint */}
                                    {isFlipped && (
                                        <div className="mt-3 text-[11px] font-bold tracking-wide uppercase text-purple-500/70 dark:text-purple-400/70 flex items-center gap-1">
                                            <span>🔄 Click card again to rotate facts!</span>
                                        </div>
                                    )}
                                </motion.div>
                            );
                        })}
                    </div>
                </section>

                {/* Easter Egg Sparkle Button */}
                <section className="text-center">
                    <motion.button
                        onClick={triggerEasterEgg}
                        whileHover={{ scale: 1.1, rotate: 15 }}
                        whileTap={{ scale: 0.85, rotate: -15 }}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-full border-2 border-dashed transition-all text-lg font-bold"
                        style={{
                            borderColor: theme === 'dark' ? 'rgba(251, 191, 36, 0.5)' : '#fcd34d',
                            color: theme === 'dark' ? '#fcd34d' : '#92400e',
                            backgroundColor: theme === 'dark' ? 'rgba(251, 191, 36, 0.1)' : '#fffbeb'
                        }}
                    >
                        <Sparkles className="w-5 h-5" />
                        Click for a secret! ({sparkleCount} found)
                    </motion.button>
                    {easterEggIndex >= 0 && (
                        <motion.div
                            key={easterEggIndex}
                            initial={{ opacity: 0, y: 10, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            className="mt-4 inline-block px-6 py-3 rounded-2xl border text-sm font-medium"
                            style={{
                                backgroundColor: theme === 'dark' ? 'rgba(139, 92, 246, 0.15)' : '#f5f3ff',
                                borderColor: theme === 'dark' ? 'rgba(139, 92, 246, 0.3)' : '#c4b5fd',
                                color: 'var(--text-primary)'
                            }}
                        >
                            {EASTER_EGGS[easterEggIndex]}
                        </motion.div>
                    )}
                </section>

                {/* Tips */}
                <motion.section
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="p-8 rounded-3xl border shadow-sm"
                    style={{ backgroundColor: 'var(--surface-card)', borderColor: 'var(--border-default)' }}
                >
                    <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>💡 Pro Tips</h2>
                    <ul className="space-y-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                        <li className="flex items-start gap-2"><span className="text-green-500 font-bold">✓</span> Log in every day to keep your daily streak alive and earn bonus XP!</li>
                        <li className="flex items-start gap-2"><span className="text-green-500 font-bold">✓</span> Retry challenges to improve your best score - only your highest counts.</li>
                        <li className="flex items-start gap-2"><span className="text-green-500 font-bold">✓</span> Check the leaderboard to see how you stack up against other players.</li>
                        <li className="flex items-start gap-2"><span className="text-green-500 font-bold">✓</span> Share your achievements with friends using the Share button!</li>
                        <li className="flex items-start gap-2"><span className="text-green-500 font-bold">✓</span> Complete all 3 challenges in a career with 80%+ accuracy to master that District.</li>
                        <li className="flex items-start gap-2"><span className="text-yellow-500 font-bold">★</span> <strong>Secret:</strong> There are hidden fun facts on this page. Did you find them all?</li>
                    </ul>
                </motion.section>
            </main>
        </div>
    );
}
