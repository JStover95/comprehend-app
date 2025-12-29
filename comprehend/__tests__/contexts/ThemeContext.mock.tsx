/**
 * Mock provider for ThemeContext
 *
 * Following the Mock Provider Pattern from design-docs/testing/unit-testing.md
 * Use this to wrap components in tests that depend on ThemeContext
 */

import React from "react";
import {
  ThemeContext,
  ThemeContextValue,
} from "../../contexts/ThemeContext/Context";
import { Colors, Typography, Spacing, BorderRadius } from "@/constants/theme";
import type { ThemeMode } from "@/types";

/**
 * Create a mock theme context value
 *
 * @param overrides - Optional overrides for specific properties
 * @returns Mock ThemeContextValue
 */
export function createMockThemeValue(
  overrides?: Partial<ThemeContextValue>,
): ThemeContextValue {
  const defaultMode: ThemeMode = overrides?.mode || "light";
  const isDark = defaultMode === "dark";

  return {
    mode: defaultMode,
    colors: isDark ? Colors.dark : Colors.light,
    isDark,
    typography: Typography,
    spacing: Spacing,
    borderRadius: BorderRadius,
    setTheme: jest.fn(),
    ...overrides,
  };
}

/**
 * Mock ThemeProvider component
 *
 * Use this to wrap components in tests that need ThemeContext
 *
 * @example
 * ```tsx
 * const mockValue = createMockThemeValue({ mode: 'dark' });
 * render(
 *   <MockThemeProvider value={mockValue}>
 *     <MyComponent />
 *   </MockThemeProvider>
 * );
 * ```
 */
export function MockThemeProvider({
  value,
  children,
}: {
  value: ThemeContextValue;
  children: React.ReactNode;
}) {
  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
