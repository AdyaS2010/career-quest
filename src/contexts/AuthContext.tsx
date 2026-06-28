import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isGuest: boolean;
  signUp: (email: string, password: string, username: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  loginAsGuest: (username: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isGuest, setIsGuest] = useState(() => localStorage.getItem('isGuest') === 'true');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      const isGuestStored = localStorage.getItem('isGuest') === 'true';
      if (isGuestStored) {
        const guestName = localStorage.getItem('guestUsername') || 'Guest';
        const mockUser = {
          id: 'guest',
          email: 'guest@careerquest.local',
          user_metadata: { username: guestName },
          app_metadata: {},
          aud: 'authenticated',
          role: 'authenticated',
          created_at: new Date().toISOString()
        } as User;
        
        setUser(mockUser);
        setSession({
          access_token: 'guest-token',
          token_type: 'bearer',
          expires_in: 3600,
          refresh_token: 'guest-refresh',
          user: mockUser
        } as Session);
        setLoading(false);
        return;
      }

      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) console.error('Error checking auth session:', error);
        setSession(session);
        setUser(session?.user ?? null);
      } catch (err) {
        console.error('Unexpected error checking auth session:', err);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (localStorage.getItem('isGuest') === 'true') return;
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, username: string) => {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) return { error: authError };
      if (!authData.user) return { error: new Error('No user returned') };

      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          username,
        } as any);

      if (profileError) return { error: profileError };

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    if (localStorage.getItem('isGuest') === 'true') {
      localStorage.removeItem('isGuest');
      localStorage.removeItem('guestUsername');
      setIsGuest(false);
      setUser(null);
      setSession(null);
      return;
    }
    await supabase.auth.signOut();
  };

  const loginAsGuest = (username: string) => {
    const guestName = username.trim() || 'Guest';
    localStorage.setItem('isGuest', 'true');
    localStorage.setItem('guestUsername', guestName);
    setIsGuest(true);

    // Initialize guest profile in local storage if not exists
    const existingProfile = localStorage.getItem('guest_profile');
    if (!existingProfile) {
      localStorage.setItem('guest_profile', JSON.stringify({
        id: 'guest',
        username: guestName,
        character_name: guestName,
        total_score: 0,
        experience: 0,
        level: 1,
        current_streak: 1,
        last_active: new Date().toISOString(),
        show_on_leaderboard: false,
        created_at: new Date().toISOString()
      }));
    }

    const mockUser = {
      id: 'guest',
      email: 'guest@careerquest.local',
      user_metadata: { username: guestName },
      app_metadata: {},
      aud: 'authenticated',
      role: 'authenticated',
      created_at: new Date().toISOString()
    } as User;

    setUser(mockUser);
    setSession({
      access_token: 'guest-token',
      token_type: 'bearer',
      expires_in: 3600,
      refresh_token: 'guest-refresh',
      user: mockUser
    } as Session);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, isGuest, signUp, signIn, signOut, loginAsGuest }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
