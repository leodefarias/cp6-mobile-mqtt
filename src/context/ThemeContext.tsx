import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { getTheme, setTheme as persistTheme } from '../services/storageService';
import { colors, ThemeColors, ThemeName } from '../themes/colors';

interface ThemeContextValue {
  theme: ThemeName;
  colors: ThemeColors;
  ready: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [theme, setTheme] = useState<ThemeName>(systemScheme === 'dark' ? 'dark' : 'light');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    getTheme().then((saved) => {
      if (!active) return;
      if (saved) setTheme(saved);
      setReady(true);
    });
    return () => {
      active = false;
    };
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => {
      const next: ThemeName = prev === 'light' ? 'dark' : 'light';
      persistTheme(next);
      return next;
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, colors: colors[theme], ready, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme deve ser usado dentro de ThemeProvider');
  return context;
}
