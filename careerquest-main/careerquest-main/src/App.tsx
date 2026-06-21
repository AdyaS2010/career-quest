import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ChatProvider, useChat } from './contexts/ChatContext';
import { GlobalChatButton } from './components/GlobalChatButton';
import { CareerChatbot } from './components/CareerChatbot';
import { HomePage } from './pages/HomePage';
import { CareerWorld } from './pages/CareerWorld';
import { LandingPage } from './pages/LandingPage';
import { ProfilePage } from './pages/ProfilePage';

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

function AppRoutes() {
  const { user, loading } = useAuth();

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
    <Routes>
      <Route path="/welcome" element={user ? <Navigate to="/" /> : <LandingPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/career/:careerSlug"
        element={
          <ProtectedRoute>
            <CareerWorld />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ChatProvider>
        <AuthProvider>
          <AppRoutes />
          {/* Chat host: button + chatbot modal (global) */}
          <ChatHost />
        </AuthProvider>
      </ChatProvider>
    </BrowserRouter>
  );
}

function ChatHost() {
  const { open, closeChat } = useChat();
  return (
    <>
      <GlobalChatButton />
      <CareerChatbot open={open} onClose={closeChat} />
    </>
  );
}

export default App;
