import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AudioProvider } from './contexts/AudioContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { GuideProvider } from './context/GuideContext';
import { CharacterGuide } from './components/CharacterGuide';
import { PageTransition } from './components/PageTransition';
import { WorldMap } from './pages/WorldMap';
import { CityHub } from './pages/CityHub';
import { CareerWorld } from './pages/CareerWorld';
import { DomainWorld } from './pages/DomainWorld';
import { LandingPage } from './pages/LandingPage';
import { ProfilePage } from './pages/ProfilePage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { FeedbackPage } from './pages/FeedbackPage';
import { HowToPlayPage } from './pages/HowToPlayPage';
import { AboutPage } from './pages/AboutPage';
import { AnimatePresence } from 'framer-motion';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return user ? <>{children}</> : <Navigate to="/welcome" />;
}

function AnimatedRoutes() {
  const location = useLocation();
  const { user } = useAuth();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/welcome" element={user ? <Navigate to="/" replace /> : <PageTransition><LandingPage /></PageTransition>} />
        <Route path="/" element={<ProtectedRoute><CityHub /></ProtectedRoute>} />
        <Route path="/map" element={<ProtectedRoute><WorldMap /></ProtectedRoute>} />
        <Route path="/world/:careerSlug" element={<ProtectedRoute><DomainWorld /></ProtectedRoute>} />
        <Route path="/career/:careerSlug" element={<ProtectedRoute><PageTransition><CareerWorld /></PageTransition></ProtectedRoute>} />
        <Route path="/leaderboard" element={<ProtectedRoute><PageTransition><LeaderboardPage /></PageTransition></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><PageTransition><ProfilePage /></PageTransition></ProtectedRoute>} />
        <Route path="/feedback" element={<ProtectedRoute><PageTransition><FeedbackPage /></PageTransition></ProtectedRoute>} />
        <Route path="/how-to-play" element={<ProtectedRoute><PageTransition><HowToPlayPage /></PageTransition></ProtectedRoute>} />
        <Route path="/about" element={<ProtectedRoute><PageTransition><AboutPage /></PageTransition></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </AnimatePresence>
  );
}

function AppRoutes() {
  const { user, loading } = useAuth();
  const location = useLocation();
  // The immersive walkable city + worlds have their own in-scene guide, so hide
  // the global helper there to keep the screen clean.
  const hideGuide = location.pathname === '/' || location.pathname.startsWith('/world');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading Career Quest...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <AnimatedRoutes />
      {/* Global Guide Component - rendered here to persist across routes */}
      {user && !hideGuide && <CharacterGuide />}
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <AudioProvider>
            <GuideProvider>
              <AppRoutes />
            </GuideProvider>
          </AudioProvider>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
