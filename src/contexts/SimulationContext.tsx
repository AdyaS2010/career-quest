import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from 'react';

// Tracks whether the player is currently *inside* a domain simulation (a game),
// as opposed to walking the city, browsing a career world hub, or on a menu
// page. Only the simulations get the floating Back / Volume / Brightness rail,
// so games register here on mount and clear it on exit. Back is wired to the
// active game's own exit handler so it always returns to the career world.
interface SimulationContextValue {
  active: boolean;
  exit: () => void;
  enterSimulation: (onExit: () => void) => void;
  leaveSimulation: () => void;
}

const SimulationContext = createContext<SimulationContextValue | undefined>(undefined);

export function SimulationProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState(false);
  const exitRef = useRef<() => void>(() => {});

  const enterSimulation = useCallback((onExit: () => void) => {
    exitRef.current = onExit;
    setActive(true);
  }, []);

  const leaveSimulation = useCallback(() => {
    exitRef.current = () => {};
    setActive(false);
  }, []);

  const exit = useCallback(() => {
    exitRef.current();
  }, []);

  return (
    <SimulationContext.Provider value={{ active, exit, enterSimulation, leaveSimulation }}>
      {children}
    </SimulationContext.Provider>
  );
}

export function useSimulation() {
  const ctx = useContext(SimulationContext);
  if (!ctx) throw new Error('useSimulation must be used within a SimulationProvider');
  return ctx;
}
