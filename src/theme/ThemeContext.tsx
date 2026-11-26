import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { AccessibilityInfo, useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSharedValue, withTiming, SharedValue, Easing } from 'react-native-reanimated';
import { DARK_COLORS, LIGHT_COLORS, ThemeColors, ThemeMode } from './tokens';

const THEME_STORAGE_KEY = 'learnymol_theme_mode_v1';

interface ThemeContextValue {
  mode: ThemeMode;
  resolvedMode: 'light' | 'dark';
  isDark: boolean;
  colors: ThemeColors;
  reducedMotion: boolean;
  themeProgress: SharedValue<number>; // 0 = light, 1 = dark
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('light');
  const [reducedMotion, setReducedMotion] = useState(false);

  const resolvedMode: 'light' | 'dark' =
    mode === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : mode;
  const isDark = resolvedMode === 'dark';

  const themeProgress = useSharedValue(isDark ? 1 : 0);

  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY).then((saved) => {
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        setModeState(saved);
      }
    });
    AccessibilityInfo.isReduceMotionEnabled().then(setReducedMotion).catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReducedMotion);
    return () => sub.remove();
  }, []);

  useEffect(() => {
    themeProgress.value = withTiming(isDark ? 1 : 0, {
      duration: reducedMotion ? 0 : 420,
      easing: Easing.inOut(Easing.cubic),
    });
  }, [isDark, reducedMotion, themeProgress]);

  const setMode = (next: ThemeMode) => {
    setModeState(next);
    AsyncStorage.setItem(THEME_STORAGE_KEY, next).catch(() => {});
  };

  const toggleTheme = () => {
    setMode(isDark ? 'light' : 'dark');
  };

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      resolvedMode,
      isDark,
      colors: isDark ? DARK_COLORS : LIGHT_COLORS,
      reducedMotion,
      themeProgress,
      setMode,
      toggleTheme,
    }),
    [mode, resolvedMode, isDark, reducedMotion, themeProgress]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
