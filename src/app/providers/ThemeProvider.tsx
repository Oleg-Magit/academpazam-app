import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { getMeta, saveMeta } from '../../core/db/db';

export type Theme = 'light' | 'dark';

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'app_theme';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [theme, setThemeState] = useState<Theme>(() => {
        // Fast sync load from localStorage for initial render
        const saved = localStorage.getItem(STORAGE_KEY);
        return (saved as Theme) || 'dark';
    });

    useEffect(() => {
        const loadTheme = async () => {
            const meta = await getMeta(STORAGE_KEY);
            if (meta?.value) {
                setThemeState(meta.value as Theme);
                localStorage.setItem(STORAGE_KEY, meta.value);
            }
        };
        loadTheme();
    }, []);

    useEffect(() => {
        document.documentElement.dataset.theme = theme;
        localStorage.setItem(STORAGE_KEY, theme);
    }, [theme]);

    const setTheme = useCallback(async (newTheme: Theme) => {
        setThemeState(newTheme);
        await saveMeta(STORAGE_KEY, newTheme);
    }, []);

    const toggleTheme = useCallback(() => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
    }, [theme, setTheme]);

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
