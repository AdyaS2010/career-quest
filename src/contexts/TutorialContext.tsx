import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useSimulation } from './SimulationContext';
import { useAuth } from './AuthContext';

export interface TutorialContextValue {
  tutStep: number | null;
  setTutStep: (step: number | null) => void;
  advanceTutorial: () => void;
  skipTutorial: () => void;
}

const TutorialContext = createContext<TutorialContextValue | undefined>(undefined);

export function TutorialProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const location = useLocation();
  const { active: simActive } = useSimulation();

  const [tutStep, setTutStepState] = useState<number | null>(null);

  const getStorageKey = () => `questford_onboarded_${user?.id || 'guest'}`;

  // Initialize tutorial state
  useEffect(() => {
    if (!user) {
      setTutStepState(null);
      return;
    }
    const key = getStorageKey();
    let seen = false;
    try {
      seen = !!localStorage.getItem(key);
    } catch {
      // ignore
    }
    
    // Only auto-start the tutorial if they've seen the intro sequence first
    let storySeen = false;
    try {
      const raw = localStorage.getItem(`questford_story_${user.id}`);
      if (raw) {
        storySeen = JSON.parse(raw).introSeen;
      }
    } catch {
      // ignore
    }

    if (!seen && storySeen) {
      setTutStepState(0);
    } else {
      setTutStepState(null);
    }
  }, [user]);

  const setTutStep = useCallback((step: number | null) => {
    setTutStepState(step);
  }, []);

  const skipTutorial = useCallback(() => {
    setTutStepState(null);
    try {
      localStorage.setItem(getStorageKey(), '1');
    } catch {
      // ignore
    }
  }, [user]);

  const advanceTutorial = useCallback(() => {
    setTutStepState((s) => {
      if (s === null) return null;
      const n = s + 1;
      if (n >= 8) { // 8 steps (0 to 7)
        try {
          localStorage.setItem(getStorageKey(), '1');
        } catch {
          // ignore
        }
        return null;
      }
      return n;
    });
  }, [user]);

  // Route-change auto-advancement:
  // Step 3 (Step inside a shop) -> Step 4 (Welcome to Career Hub)
  // triggers when location changes to /career/:careerSlug.
  // If a new user starts directly in a career district (e.g. via Career Compass),
  // they automatically jump to Step 4 of the tutorial.
  useEffect(() => {
    if (location.pathname.startsWith('/career/')) {
      const key = getStorageKey();
      let seen = false;
      try {
        seen = !!localStorage.getItem(key);
      } catch {
        // ignore
      }
      if (!seen && (tutStep === null || tutStep < 5)) {
        setTutStepState(5);
      }
    }
  }, [location.pathname, tutStep, user]);

  // Simulation-change auto-advancement:
  // Step 5 (Career Hub briefing) -> Step 6 (Settings in simulation)
  // triggers when simActive becomes true
  useEffect(() => {
    if (tutStep === 5 && simActive) {
      setTutStepState(6);
    }
  }, [simActive, tutStep]);

  return (
    <TutorialContext.Provider value={{ tutStep, setTutStep, advanceTutorial, skipTutorial }}>
      {children}
    </TutorialContext.Provider>
  );
}

export function useTutorial() {
  const context = useContext(TutorialContext);
  if (context === undefined) {
    throw new Error('useTutorial must be used within a TutorialProvider');
  }
  return context;
}
