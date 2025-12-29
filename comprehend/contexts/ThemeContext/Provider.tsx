/**
 * ThemeProvider implementation
 *
 * Following patterns from:
 * - comprehend/design-docs/context-pattern.md - Provider implementation
 * - comprehend/design-docs/styling-pattern.md - Theme system, dark mode support
 *
 * Manages theme state with AsyncStorage persistence, system color scheme detection,
 * and theme switching functionality.
 */

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ThemeContext, ThemeContextValue } from "./Context";
import { Colors, Typography, Spacing, BorderRadius } from "@/constants/theme";
import type { ThemeMode } from "@/types";

const THEME_STORAGE_KEY = "@theme";

/**
 * ThemeProvider component
 *
 * Provides theme context to all child components with:
 * - AsyncStorage persistence for user preference
 * - System color scheme detection via useColorScheme
 * - Theme state management with light/dark/system modes
 *
 * @param children - React children to wrap with theme context
 */
export function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  const systemColorScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>("system");

  // Load saved theme preference on mount
  useEffect(() => {
    loadTheme();
  }, []);

  /**
   * Load theme preference from AsyncStorage
   */
  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (
        savedTheme &&
        (savedTheme === "light" ||
          savedTheme === "dark" ||
          savedTheme === "system")
      ) {
        setModeState(savedTheme);
      }
    } catch (error) {
      // Handle error gracefully - default to system theme
      console.error("Failed to load theme preference:", error);
    }
  };

  /**
   * Set theme mode and persist to AsyncStorage
   *
   * @param newMode - New theme mode to set
   */
  const setTheme = useCallback(async (newMode: ThemeMode) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newMode);
      setModeState(newMode);
    } catch (error) {
      // Handle error gracefully - still update state in memory
      console.error("Failed to save theme preference:", error);
      setModeState(newMode);
    }
  }, []);

  // Determine if dark mode is active
  const isDark = useMemo(() => {
    if (mode === "dark") return true;
    if (mode === "light") return false;
    // mode === "system"
    return systemColorScheme === "dark";
  }, [mode, systemColorScheme]);

  // Select colors based on theme
  const colors = useMemo(() => {
    return isDark ? Colors.dark : Colors.light;
  }, [isDark]);

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      colors,
      isDark,
      typography: Typography,
      spacing: Spacing,
      borderRadius: BorderRadius,
      setTheme,
    }),
    [mode, colors, isDark, setTheme],
  );

  // Always provide context, even during initialization
  // This ensures useTheme() works correctly in tests and prevents context errors
  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
