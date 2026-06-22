import { Palette, Users, Accessibility, Smartphone, Zap, Shield, Heart } from 'lucide-react';
import { AppNavbar } from '../components/AppNavbar';
import { motion } from 'framer-motion';

const DESIGN_SECTIONS = [
    {
        icon: Users,
        title: 'User-Centered Design',
        color: 'from-blue-500 to-cyan-500',
        points: [
            'Target audience: high school students exploring career options',
            'Gamified learning reduces intimidation around career exploration',
            'Progressive difficulty — each career has 3 increasingly challenging mini-games',
            'Familiar game mechanics (memory, puzzle, simulation) lower the learning curve',
        ]
    },
    {
        icon: Palette,
        title: 'Visual Design Rationale',
        color: 'from-purple-500 to-pink-500',
        points: [
            'Color-coded career worlds for instant visual identification',
            'Dark/light mode accommodates different environments and preferences',
            'Card-based layout provides clear information hierarchy',
            'Consistent iconography via Lucide icons for a cohesive look',
            'Doodle-style accents on landing page create approachable, youthful feel',
        ]
    },
    {
        icon: Smartphone,
        title: 'Responsive Experience',
        color: 'from-green-500 to-emerald-500',
        points: [
            'Fully responsive grid layouts adapt from mobile to desktop',
            'Touch-friendly map controls with pan and zoom',
            'Clamp-based font sizing for fluid typography across breakpoints',
            'Mobile-optimized navigation with collapsible elements',
        ]
    },
    {
        icon: Accessibility,
        title: 'Accessibility Features',
        color: 'from-amber-500 to-orange-500',
        points: [
            'Semantic HTML with proper heading hierarchy (h1 → h2 → h3)',
            'ARIA labels on interactive elements for screen reader support',
            'Focus-visible indicators on all buttons and links',
            'Color contrast ratios meet WCAG AA standards in both themes',
            'Reduced-motion support via CSS prefers-reduced-motion',
            'Keyboard navigable — Tab through all interactive elements',
        ]
    },
    {
        icon: Zap,
        title: 'Performance',
        color: 'from-yellow-500 to-red-500',
        points: [
            'Procedural audio via Web Audio API — zero external audio files to load',
            'Lazy route loading keeps initial bundle size lean',
            'Optimistic UI updates for instant feedback on user actions',
            'Supabase real-time subscriptions for live leaderboard updates',
        ]
    },
    {
        icon: Shield,
        title: 'Data & Security',
        color: 'from-slate-500 to-slate-700',
        points: [
            'Supabase Auth with email/password and OAuth providers',
            'Row Level Security (RLS) on all database tables',
            'User data is scoped — players can only modify their own records',
            'Public read access for leaderboards and static career content',
        ]
    },
];

const JOURNEY_STEPS = [
    { label: 'Landing Page', desc: 'Clear value proposition, How It Works, and CTA' },
    { label: 'Sign Up / Log In', desc: 'Quick auth flow, character name selection' },
    { label: 'Career Map', desc: 'Visual overview of all 8 career worlds' },
    { label: 'Career World', desc: '3 challenges per career, progressive unlock' },
    { label: 'Challenge', desc: 'Interactive mini-game with real-time scoring' },
    { label: 'Results', desc: 'Score breakdown, XP earned, streak bonus' },
    { label: 'Profile', desc: 'Stats, achievements, streak, share & feedback' },
    { label: 'Leaderboard', desc: 'Global rankings to drive competition' },
];

export function AboutPage() {

    return (
        <div
            className="min-h-screen"
            style={{ background: 'linear-gradient(to bottom right, var(--bg-primary), var(--bg-secondary))' }}
        >
            <AppNavbar />

            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">

                {/* Hero */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center"
                >
                    <h2 className="text-4xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
                        Career Quest - Design Rationale
                    </h2>
                    <p className="text-lg max-w-2xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
                        An interactive career exploration platform built for FBLA Computer Game & Simulation Programming. Here's the thinking behind every single design choice!
                    </p>
                </motion.section>

                {/* User Journey Flow */}
                <section>
                    <h3 className="text-2xl font-bold mb-6 text-center" style={{ color: 'var(--text-primary)' }}>
                        <Heart className="w-6 h-6 inline-block mr-2 text-pink-500" />
                        User Journey
                    </h3>
                    <div className="flex flex-wrap justify-center gap-3">
                        {JOURNEY_STEPS.map((step, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.05 }}
                                className="flex items-center gap-2"
                            >
                                <div
                                    className="px-4 py-3 rounded-xl border text-center min-w-[140px]"
                                    style={{ backgroundColor: 'var(--surface-card)', borderColor: 'var(--border-default)' }}
                                >
                                    <div className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{step.label}</div>
                                    <div className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{step.desc}</div>
                                </div>
                                {i < JOURNEY_STEPS.length - 1 && (
                                    <span className="text-lg font-bold" style={{ color: 'var(--text-muted)' }}>→</span>
                                )}
                            </motion.div>
                        ))}
                    </div>
                </section>

                {/* Design Sections Grid */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {DESIGN_SECTIONS.map((section, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.08 }}
                            className="rounded-2xl border overflow-hidden"
                            style={{ backgroundColor: 'var(--surface-card)', borderColor: 'var(--border-default)' }}
                        >
                            <div className={`bg-gradient-to-r ${section.color} p-4 flex items-center gap-3`}>
                                <section.icon className="w-6 h-6 text-white" />
                                <h4 className="text-lg font-bold text-white">{section.title}</h4>
                            </div>
                            <ul className="p-5 space-y-2.5">
                                {section.points.map((point, j) => (
                                    <li key={j} className="flex items-start gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                                        <span className="text-green-500 font-bold mt-0.5">✓</span>
                                        {point}
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    ))}
                </section>

                {/* Tech Stack */}
                <section
                    className="p-8 rounded-3xl border"
                    style={{ backgroundColor: 'var(--surface-card)', borderColor: 'var(--border-default)' }}
                >
                    <h3 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>🛠️ Technology Stack</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { name: 'React 18', desc: 'UI Framework' },
                            { name: 'TypeScript', desc: 'Type Safety' },
                            { name: 'Vite', desc: 'Build Tool' },
                            { name: 'Tailwind CSS', desc: 'Styling' },
                            { name: 'Supabase', desc: 'Backend & Auth' },
                            { name: 'Framer Motion', desc: 'Animations' },
                            { name: 'Web Audio API', desc: 'Sound Effects' },
                            { name: 'Vercel', desc: 'Deployment' },
                        ].map((tech, i) => (
                            <div
                                key={i}
                                className="p-3 rounded-xl border text-center"
                                style={{ borderColor: 'var(--border-default)' }}
                            >
                                <div className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{tech.name}</div>
                                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{tech.desc}</div>
                            </div>
                        ))}
                    </div>
                </section>
            </main>
        </div>
    );
}
