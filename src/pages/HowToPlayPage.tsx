import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Moon, Sun, Compass, Target, Trophy, Zap, Star, Flame, BookOpen, Sparkles } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { motion } from 'framer-motion';

const CAREER_PREVIEWS = [
    { emoji: '🍳', name: 'Culinary Arts', desc: 'Take orders, cook meals under pressure, and plate like a pro!', secret: '🧑‍🍳 Fun fact: The world\'s largest pizza was 13,580 sq ft!' },
    { emoji: '💻', name: 'Information Technology', desc: 'Hunt bugs, design systems, and build algorithms!', secret: '🤓 The first computer bug was an actual moth found in a relay!' },
    { emoji: '🏥', name: 'Health Sciences', desc: 'Diagnose patients, plan treatments, and run the ER!', secret: '🫀 Your heart beats about 100,000 times per day!' },
    { emoji: '⚖️', name: 'Law & Government', desc: 'Examine evidence, cross-examine witnesses, and argue cases!', secret: '🏛️ The longest trial in history lasted 908 days!' },
    { emoji: '💰', name: 'Financial Services', desc: 'Balance budgets, catch fraud, and invest wisely!', secret: '📈 Warren Buffett bought his first stock at age 11!' },
    { emoji: '📚', name: 'Education', desc: 'Conduct classrooms, plan lessons, and handle crises!', secret: '🍎 Finland has the shortest school days in the world!' },
    { emoji: '📺', name: 'Media & Communication', desc: 'Craft stories, fact-check news, and master interviews!', secret: '📰 The first newspaper was published in 1605 in Germany!' },
    { emoji: '🎨', name: 'Arts & Design', desc: 'Perform on Broadway, mix colors, and read music!', secret: '🎭 Shakespeare invented over 1,700 English words!' },
];

const STEPS = [
    { icon: Compass, title: 'Explore the Map', desc: 'The Career Kingdom shows all 8 islands. Click any island to enter!', emoji: '🗺️' },
    { icon: Target, title: 'Take On Challenges', desc: 'Each career has 3 unique mini-games. Beat one to unlock the next!', emoji: '🎯' },
    { icon: Trophy, title: 'Earn Points', desc: 'Score up to 100 points per challenge. Your best score is always saved!', emoji: '💯' },
    { icon: Zap, title: 'Level Up', desc: 'Every 100 XP = 1 level. Daily streaks give you bonus XP!', emoji: '⚡' },
    { icon: Star, title: 'Unlock Achievements', desc: 'Special badges for milestones — first island, perfect scores, and more!', emoji: '🏅' },
    { icon: Flame, title: 'Keep Your Streak', desc: 'Log in every day for +50 XP. Miss a day? Streak resets! 😱', emoji: '🔥' },
];

// Easter egg messages when clicking the sparkle button
const EASTER_EGGS = [
    '✨ You found a secret! The Career Quest team ate 47 pizzas during development.',
    '🎉 Easter egg! The first version of this game was just a spreadsheet.',
    '🐛 Bug or feature? Yes.',
    '💡 Pro tip: The Konami code doesn\'t work here. We checked.',
    '🎵 The background music is generated live by math. No MP3s were harmed!',
    '🚀 This app has more lines of code than the Apollo 11 guidance computer.',
    '🧭 The compass icon was chosen because career exploration IS an adventure!',
    '🤫 Secret: there\'s a hidden achievement for completing ALL 24 challenges!',
];

export function HowToPlayPage() {
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();
    const [flippedCards, setFlippedCards] = useState<Set<number>>(new Set());
    const [easterEggIndex, setEasterEggIndex] = useState(-1);
    const [sparkleCount, setSparkleCount] = useState(0);

    const toggleCard = (i: number) => {
        setFlippedCards(prev => {
            const next = new Set(prev);
            if (next.has(i)) next.delete(i); else next.add(i);
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
            <nav
                className="sticky top-0 z-40 backdrop-blur-lg border-b shadow-md"
                style={{ backgroundColor: 'var(--nav-bg)', borderColor: 'var(--nav-border)' }}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <button
                            onClick={() => navigate('/profile')}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
                            style={{ color: 'var(--accent-primary)' }}
                        >
                            <ArrowLeft className="w-5 h-5" />
                            <span className="font-medium">Back to Profile</span>
                        </button>

                        <div className="flex items-center gap-2">
                            <BookOpen className="w-6 h-6 text-blue-500" />
                            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>How to Play</h1>
                        </div>

                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-lg transition-colors"
                            style={{ backgroundColor: 'var(--surface-card)', color: 'var(--text-secondary)' }}
                        >
                            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
            </nav>

            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">

                {/* Fun Header */}
                <motion.section
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center"
                >
                    <h2 className="text-4xl md:text-5xl font-extrabold mb-3" style={{ color: 'var(--text-primary)' }}>
                        Welcome to Career Quest!
                    </h2>
                    <p className="text-lg max-w-xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
                        Your adventure through 8 career worlds starts here. Let's show you the ropes! 🎮
                    </p>
                </motion.section>

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

                {/* Career Previews — Flippable Cards */}
                <section>
                    <h2 className="text-3xl font-bold mb-2 text-center" style={{ color: 'var(--text-primary)' }}>
                        8 Career Worlds to Explore
                    </h2>
                    <p className="text-center text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>
                        🤫 Psst... click any card to reveal a fun fact!
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        {CAREER_PREVIEWS.map((career, i) => (
                            <motion.button
                                key={i}
                                onClick={() => toggleCard(i)}
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                className="text-left w-full p-5 rounded-2xl border transition-all cursor-pointer"
                                style={{
                                    backgroundColor: flippedCards.has(i)
                                        ? (theme === 'dark' ? 'rgba(139, 92, 246, 0.15)' : '#f5f3ff')
                                        : 'var(--surface-card)',
                                    borderColor: flippedCards.has(i)
                                        ? (theme === 'dark' ? 'rgba(139, 92, 246, 0.4)' : '#c4b5fd')
                                        : 'var(--border-default)'
                                }}
                            >
                                <div className="flex items-start gap-4">
                                    <motion.span
                                        className="text-4xl flex-shrink-0"
                                        animate={flippedCards.has(i) ? { rotateY: 180 } : { rotateY: 0 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        {career.emoji}
                                    </motion.span>
                                    <div>
                                        <h4 className="font-bold text-base mb-1" style={{ color: 'var(--text-primary)' }}>{career.name}</h4>
                                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                            {flippedCards.has(i) ? career.secret : career.desc}
                                        </p>
                                    </div>
                                </div>
                            </motion.button>
                        ))}
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
                        <li className="flex items-start gap-2"><span className="text-green-500 font-bold">✓</span> Retry challenges to improve your best score — only your highest counts.</li>
                        <li className="flex items-start gap-2"><span className="text-green-500 font-bold">✓</span> Check the leaderboard to see how you stack up against other players.</li>
                        <li className="flex items-start gap-2"><span className="text-green-500 font-bold">✓</span> Share your achievements with friends using the Share button!</li>
                        <li className="flex items-start gap-2"><span className="text-green-500 font-bold">✓</span> Complete all 3 challenges in a career with 80%+ accuracy to master that island.</li>
                        <li className="flex items-start gap-2"><span className="text-yellow-500 font-bold">★</span> <strong>Secret:</strong> There are hidden fun facts on this page. Did you find them all?</li>
                    </ul>
                </motion.section>
            </main>
        </div>
    );
}
