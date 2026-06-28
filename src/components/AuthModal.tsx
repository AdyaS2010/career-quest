import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Mail, Lock, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [mode, setMode] = useState<'signin' | 'signup' | 'guest'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { theme } = useTheme();

  const { signIn, signUp, loginAsGuest } = useAuth();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'signin') {
        const { error } = await signIn(email, password);
        if (error) throw error;
        onClose();
      } else if (mode === 'signup') {
        if (!username.trim()) {
          setError('Username is required');
          setLoading(false);
          return;
        }
        const { error } = await signUp(email, password, username);
        if (error) throw error;
        onClose();
      } else {
        // guest mode
        if (!username.trim()) {
          setError('Game name is required');
          setLoading(false);
          return;
        }
        loginAsGuest(username);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div
        className="relative w-full max-w-md rounded-2xl shadow-2xl"
        style={{ backgroundColor: 'var(--surface-card)' }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full transition-colors"
          style={{
            color: 'var(--text-secondary)',
            backgroundColor: 'transparent'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme === 'dark' ? 'rgba(255,255,255,0.1)' : '#f3f4f6'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8">
          <h2 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            {mode === 'signin' ? 'Welcome Back' : mode === 'signup' ? 'Join Career Quest' : 'Play as Guest'}
          </h2>
          <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
            {mode === 'signin'
              ? 'Sign in to continue your career exploration'
              : mode === 'signup'
                ? 'Create an account to start your journey'
                : 'Choose a game name to explore careers without signing in'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'guest' && (
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Game Name
                </label>
                <div className="relative">
                  <User
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5"
                    style={{ color: 'var(--text-muted)' }}
                  />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
                    style={{
                      backgroundColor: 'var(--input-bg)',
                      borderColor: 'var(--input-border)',
                      border: '1px solid var(--input-border)',
                      color: 'var(--text-primary)'
                    }}
                    placeholder="Choose a game name..."
                    required
                  />
                </div>
              </div>
            )}

            {mode === 'signup' && (
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Username
                </label>
                <div className="relative">
                  <User
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5"
                    style={{ color: 'var(--text-muted)' }}
                  />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
                    style={{
                      backgroundColor: 'var(--input-bg)',
                      borderColor: 'var(--input-border)',
                      border: '1px solid var(--input-border)',
                      color: 'var(--text-primary)'
                    }}
                    placeholder="Choose a username"
                    required={mode === 'signup'}
                  />
                </div>
              </div>
            )}

            {mode !== 'guest' && (
              <>
                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Email
                  </label>
                  <div className="relative">
                    <Mail
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5"
                      style={{ color: 'var(--text-muted)' }}
                    />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
                      style={{
                        backgroundColor: 'var(--input-bg)',
                        borderColor: 'var(--input-border)',
                        border: '1px solid var(--input-border)',
                        color: 'var(--text-primary)'
                      }}
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Password
                  </label>
                  <div className="relative">
                    <Lock
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5"
                      style={{ color: 'var(--text-muted)' }}
                    />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
                      style={{
                        backgroundColor: 'var(--input-bg)',
                        borderColor: 'var(--input-border)',
                        border: '1px solid var(--input-border)',
                        color: 'var(--text-primary)'
                      }}
                      placeholder="••••••••"
                      required
                      minLength={6}
                    />
                  </div>
                </div>
              </>
            )}

            {error && (
              <div
                className="p-3 rounded-lg text-sm"
                style={{
                  backgroundColor: theme === 'dark' ? 'rgba(239, 68, 68, 0.2)' : '#fef2f2',
                  border: `1px solid ${theme === 'dark' ? 'rgba(239, 68, 68, 0.3)' : '#fecaca'}`,
                  color: theme === 'dark' ? '#fca5a5' : '#dc2626'
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Loading...' : mode === 'signin' ? 'Sign In' : mode === 'signup' ? 'Sign Up' : 'Enter Career Quest'}
            </button>
          </form>

          <div className="mt-6 text-center space-y-4">
            <button
              onClick={() => {
                setMode(mode === 'signin' ? 'signup' : 'signin');
                setError('');
              }}
              className="font-medium transition-colors block mx-auto text-sm"
              style={{ color: 'var(--accent-primary)' }}
            >
              {mode === 'signin'
                ? "Don't have an account? Sign up"
                : 'Already have an account? Sign in'}
            </button>

            {mode !== 'guest' && (
              <>
                <div className="flex items-center justify-center gap-2">
                  <span className="w-8 h-px bg-gray-300 dark:bg-gray-700" />
                  <span className="text-xs text-gray-400">or</span>
                  <span className="w-8 h-px bg-gray-300 dark:bg-gray-700" />
                </div>

                <button
                  onClick={() => {
                    setMode('guest');
                    setUsername('');
                    setError('');
                  }}
                  className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-semibold rounded-lg transition-colors text-sm font-bold"
                >
                  Play as Guest
                </button>
              </>
            )}

            {mode === 'guest' && (
              <button
                onClick={() => {
                  setMode('signin');
                  setError('');
                }}
                className="font-medium transition-colors block mx-auto text-sm"
                style={{ color: 'var(--accent-primary)' }}
              >
                Back to Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
