import { useRef, useState } from 'react';
import { Compass, Sparkles, Target, Trophy, Moon, Sun, ArrowRight, Map, Star } from 'lucide-react';
import { AuthModal } from '../components/AuthModal';
import { useTheme } from '../contexts/ThemeContext';
import { motion, useScroll, useTransform } from 'framer-motion';

export function LandingPage() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  // Parallax properties
  const yElement1 = useTransform(scrollYProgress, [0, 1], [0, -300]);
  const yElement2 = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const yElement3 = useTransform(scrollYProgress, [0, 1], [0, -150]);
  const rotate1 = useTransform(scrollYProgress, [0, 1], [0, 90]);
  const rotate2 = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const opacityFade = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  return (
    <div
      ref={containerRef}
      className="min-h-screen transition-colors relative overflow-hidden"
      style={{ background: 'linear-gradient(to bottom right, var(--bg-primary), var(--bg-tertiary), var(--bg-secondary))' }}
    >
      {/* Background Parallax Elements */}
      <motion.div
        className="absolute top-[10%] left-[5%] opacity-20 pointer-events-none text-blue-500"
        style={{ y: yElement1, rotate: rotate1 }}
      >
        <Star size={120} strokeWidth={1} />
      </motion.div>
      <motion.div
        className="absolute top-[40%] right-[10%] opacity-20 pointer-events-none text-purple-500"
        style={{ y: yElement2, rotate: rotate2 }}
      >
        <Map size={150} strokeWidth={1} />
      </motion.div>
      <motion.div
        className="absolute bottom-[20%] left-[15%] opacity-15 pointer-events-none text-yellow-500"
        style={{ y: yElement3 }}
      >
        <Target size={100} strokeWidth={1} />
      </motion.div>

      {/* Doodle Grid Pattern Overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-5"
        style={{
          backgroundImage: 'radial-gradient(var(--text-primary) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}
      />

      <nav
        className="fixed top-0 w-full z-50 backdrop-blur-md border-b shadow-sm transition-colors duration-300"
        style={{
          backgroundColor: 'var(--nav-bg)',
          borderColor: 'var(--nav-border)'
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3 group cursor-pointer">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center transform group-hover:rotate-12 transition-transform doodle-border">
                <Compass className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-brand tracking-wide">
                Career Quest
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg transition-colors hover:scale-110 active:scale-95 doodle-border"
                style={{
                  backgroundColor: 'var(--surface-card)',
                  color: 'var(--text-secondary)'
                }}
                title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
              >
                {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              </button>
              <button
                onClick={() => setShowAuthModal(true)}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all doodle-border shadow-[4px_4px_0px_rgba(0,0,0,0.2)] hover:shadow-[6px_6px_0px_rgba(0,0,0,0.2)] hover:-translate-y-1 active:translate-y-0 active:shadow-[2px_2px_0px_rgba(0,0,0,0.2)]"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center z-10"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{ y: useTransform(scrollYProgress, [0, 0.5], [0, 150]), opacity: opacityFade }}
        >
          <motion.div
            className="inline-block mb-6 relative"
            whileHover={{ scale: 1.05, rotate: -2 }}
          >
            <div
              className="flex items-center gap-2 px-6 py-3 rounded-full font-medium doodle-border backdrop-blur-sm shadow-sm transition-colors"
              style={{
                color: 'var(--accent-primary)',
                backgroundColor: theme === 'dark' ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.5)'
              }}
            >
              <Sparkles className="w-5 h-5 animate-pulse" />
              <span className="font-doodle text-xl">Discover Your Future</span>
            </div>

            {/* Doodle Arrow */}
            <svg className="absolute -right-16 top-1/2 w-12 h-12 text-purple-500 hidden md:block" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 50 Q 40 20, 80 50" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeDasharray="5,5" />
              <path d="M60 30 L 80 50 L 60 70" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
            </svg>
          </motion.div>

          <h2
            className="text-6xl md:text-8xl font-bold mb-6 leading-tight font-doodle tracking-tight relative"
            style={{ color: 'var(--text-primary)' }}
          >
            Explore Careers <br />
            <span className="relative inline-block">
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent relative z-10">
                Creatively
              </span>
              <svg className="absolute w-full h-8 -bottom-4 left-0 -z-0 text-yellow-400 opacity-60" viewBox="0 0 200 20" preserveAspectRatio="none">
                <path d="M 0,10 Q 50,20 100,10 T 200,10" fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
              </svg>
            </span>
          </h2>

          <p
            className="text-xl md:text-2xl max-w-2xl mx-auto mb-10 font-doodle"
            style={{ color: 'var(--text-secondary)' }}
          >
            Jump into immersive worlds. Complete hands-on challenges. Figure out what you truly love doing.
          </p>

          <motion.button
            whileHover={{ scale: 1.05, rotate: 2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAuthModal(true)}
            className="px-10 py-5 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xl font-bold rounded-2xl transition-all doodle-border shadow-[6px_6px_0px_rgba(0,0,0,0.2)] hover:shadow-[10px_10px_0px_rgba(0,0,0,0.2)] flex items-center gap-3 mx-auto"
          >
            Start Your Journey
            <ArrowRight className="w-6 h-6" />
          </motion.button>
        </motion.div>
      </section>

      {/* How It Works Section */}
      <section className="relative py-24 px-4 sm:px-6 lg:px-8 z-10">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h3
              className="text-4xl md:text-5xl font-bold mb-4 font-doodle"
              style={{ color: 'var(--text-primary)' }}
            >
              How It Works
            </h3>
            <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
              Three simple steps to start exploring your future career
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                emoji: '🗺️',
                title: 'Pick a Career World',
                desc: 'Choose from 8 immersive islands — Culinary Arts, IT, Health Sciences, Law, Finance, Education, Media, and Arts & Design.'
              },
              {
                step: '2',
                emoji: '🎮',
                title: 'Complete Challenges',
                desc: 'Each career has 3 hands-on mini-games that simulate real professional tasks. Memorize orders, debug code, diagnose patients, and more!'
              },
              {
                step: '3',
                emoji: '🏆',
                title: 'Earn XP & Level Up',
                desc: 'Score points for accuracy and speed. Maintain daily streaks for bonus XP. Climb the global leaderboard and unlock achievements!'
              }
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.15, duration: 0.5 }}
                className="relative rounded-2xl p-8 text-center backdrop-blur-sm border"
                style={{
                  backgroundColor: theme === 'dark' ? 'rgba(30, 41, 59, 0.6)' : 'rgba(255, 255, 255, 0.7)',
                  borderColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'
                }}
              >
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 text-white font-bold text-lg flex items-center justify-center shadow-lg doodle-border">
                  {item.step}
                </div>
                <div className="text-5xl mb-4 mt-2">{item.emoji}</div>
                <h4 className="text-xl font-bold mb-2 font-doodle" style={{ color: 'var(--text-primary)' }}>{item.title}</h4>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-32 px-4 sm:px-6 lg:px-8 z-10">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-10"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={{
              visible: { opacity: 1, transition: { staggerChildren: 0.2 } },
              hidden: { opacity: 0 }
            }}
          >
            {[
              {
                icon: Compass,
                title: "8 Career Worlds",
                desc: "From culinary arts to software engineering, explore diverse professions through immersive islands.",
                color: "blue",
                rotate: "-2deg"
              },
              {
                icon: Target,
                title: "Hands-On Tasks",
                desc: "Complete realistic scenarios that show you what professionals actually do every day.",
                color: "purple",
                rotate: "1deg"
              },
              {
                icon: Trophy,
                title: "Earn Achievements",
                desc: "Earn points, unlock cool badges, and build your career exploration portfolio.",
                color: "yellow",
                rotate: "-1deg"
              }
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                variants={{
                  visible: { opacity: 1, y: 0 },
                  hidden: { opacity: 0, y: 50 }
                }}
                whileHover={{ y: -10, rotate: 0 }}
                className="rounded-3xl p-10 bg-white/80 backdrop-blur-md doodle-border relative"
                style={{
                  transform: `rotate(${feature.rotate})`,
                  boxShadow: `8px 8px 0px var(--shadow-color)`
                }}
              >
                <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-8 bg-${feature.color}-100 doodle-border transform -rotate-6`}>
                  <feature.icon className={`w-10 h-10 text-${feature.color}-600`} />
                </div>
                <h3 className="text-3xl font-bold mb-4 font-doodle text-slate-800">
                  {feature.title}
                </h3>
                <p className="text-slate-600 text-lg leading-relaxed">
                  {feature.desc}
                </p>
                {/* Decorative doodle line */}
                <svg className="absolute bottom-6 right-6 w-12 h-12 opacity-20" viewBox="0 0 100 100">
                  <path d="M10,90 Q50,10 90,90" fill="none" stroke="currentColor" strokeWidth="4" />
                  <path d="M20,80 Q50,20 80,80" fill="none" stroke="currentColor" strokeWidth="4" />
                </svg>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-32 px-4 sm:px-6 lg:px-8 z-10">
        <motion.div
          className="max-w-4xl mx-auto bg-gradient-to-br from-blue-600 to-purple-600 rounded-[3rem] p-16 text-center text-white doodle-border shadow-[12px_12px_0px_rgba(0,0,0,0.3)] relative overflow-hidden"
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ type: "spring", bounce: 0.4 }}
        >
          {/* Abstract background shapes inside CTA */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full mix-blend-overlay filter blur-3xl transform translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full mix-blend-overlay filter blur-3xl transform -translate-x-1/2 translate-y-1/2" />

          <h3 className="text-5xl md:text-6xl font-bold mb-6 font-doodle relative z-10">
            Ready to jump in?
          </h3>
          <p className="text-2xl mb-10 text-white/90 font-doodle relative z-10">
            Join thousands of students mapping out their future.
          </p>
          <motion.button
            whileHover={{ scale: 1.05, rotate: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAuthModal(true)}
            className="px-10 py-5 bg-white text-blue-600 text-xl font-bold rounded-2xl transition-all doodle-border shadow-[6px_6px_0px_rgba(255,255,255,0.3)] relative z-10 inline-flex items-center gap-2 group"
          >
            Create Free Account
            <Sparkles className="w-5 h-5 group-hover:animate-spin" />
          </motion.button>
        </motion.div>
      </section>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
}
