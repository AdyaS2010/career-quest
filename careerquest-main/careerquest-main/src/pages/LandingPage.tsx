import { useState } from 'react';
import { Compass, Sparkles, Target, Trophy } from 'lucide-react';
import { AuthModal } from '../components/AuthModal';

export function LandingPage() {
  const [showAuthModal, setShowAuthModal] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <nav className="sticky top-0 z-40 backdrop-blur-lg bg-white/80 border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <Compass className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Career Quest
              </h1>
            </div>

            <button
              onClick={() => setShowAuthModal(true)}
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-20">
          <div className="inline-block mb-6">
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full text-blue-600 font-medium">
              <Sparkles className="w-5 h-5" />
              <span>Discover Your Future Career</span>
            </div>
          </div>

          <h2 className="text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Explore Careers Through
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Interactive Adventures
            </span>
          </h2>

          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-10">
            Jump into immersive career worlds where you can experience real job scenarios, complete hands-on challenges, and discover what each profession is truly like.
          </p>

          <button
            onClick={() => setShowAuthModal(true)}
            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-lg font-bold rounded-xl hover:shadow-2xl transition-all transform hover:scale-105"
          >
            Start Your Journey
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-shadow">
            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-6">
              <Compass className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              Explore 5 Career Worlds
            </h3>
            <p className="text-gray-600">
              From culinary arts to software engineering, discover diverse professions through floating island worlds.
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-shadow">
            <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mb-6">
              <Target className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              Hands-On Challenges
            </h3>
            <p className="text-gray-600">
              Complete realistic tasks and scenarios that show you what professionals actually do every day.
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-shadow">
            <div className="w-16 h-16 bg-yellow-100 rounded-2xl flex items-center justify-center mb-6">
              <Trophy className="w-8 h-8 text-yellow-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              Track Your Progress
            </h3>
            <p className="text-gray-600">
              Earn points, unlock achievements, and build your career exploration portfolio.
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-3xl shadow-2xl p-12 text-white text-center">
          <h3 className="text-4xl font-bold mb-4">
            Ready to Discover Your Path?
          </h3>
          <p className="text-xl mb-8 text-white/90">
            Join thousands of students exploring their future careers
          </p>
          <button
            onClick={() => setShowAuthModal(true)}
            className="px-8 py-4 bg-white text-blue-600 text-lg font-bold rounded-xl hover:shadow-2xl transition-all transform hover:scale-105"
          >
            Create Free Account
          </button>
        </div>
      </main>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
}
