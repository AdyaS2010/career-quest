import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ThemeContextType {
    theme: 'light' | 'dark';
    toggleTheme: () => void;
    highContrast: boolean;
    toggleHighContrast: () => void;
    dyslexicFriendly: boolean;
    toggleDyslexicFriendly: () => void;
    reducedMotion: boolean;
    toggleReducedMotion: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setTheme] = useState<'light' | 'dark'>(() => {
        const saved = localStorage.getItem('theme');
        return (saved === 'light' || saved === 'dark') ? saved : 'light';
    });

    const [highContrast, setHighContrast] = useState(() => localStorage.getItem('highContrast') === 'true');
    const [dyslexicFriendly, setDyslexicFriendly] = useState(() => localStorage.getItem('dyslexicFriendly') === 'true');
    const [reducedMotion, setReducedMotion] = useState(() => localStorage.getItem('reducedMotion') === 'true');

    useEffect(() => {
        localStorage.setItem('theme', theme);
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    useEffect(() => {
        localStorage.setItem('highContrast', String(highContrast));
        if (highContrast) document.documentElement.classList.add('high-contrast');
        else document.documentElement.classList.remove('high-contrast');
    }, [highContrast]);

    useEffect(() => {
        localStorage.setItem('dyslexicFriendly', String(dyslexicFriendly));
        if (dyslexicFriendly) document.documentElement.classList.add('dyslexic-friendly');
        else document.documentElement.classList.remove('dyslexic-friendly');
    }, [dyslexicFriendly]);

    useEffect(() => {
        localStorage.setItem('reducedMotion', String(reducedMotion));
        if (reducedMotion) document.documentElement.classList.add('reduced-motion');
        else document.documentElement.classList.remove('reduced-motion');
    }, [reducedMotion]);

    const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');
    const toggleHighContrast = () => setHighContrast(prev => !prev);
    const toggleDyslexicFriendly = () => setDyslexicFriendly(prev => !prev);
    const toggleReducedMotion = () => setReducedMotion(prev => !prev);

    return (
        <ThemeContext.Provider value={{
            theme, toggleTheme,
            highContrast, toggleHighContrast,
            dyslexicFriendly, toggleDyslexicFriendly,
            reducedMotion, toggleReducedMotion
        }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
