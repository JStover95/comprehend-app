/**
 * useTheme hook
 *
 * Following patterns from comprehend/design-docs/context-pattern.md Custom Hooks
 * Provides access to ThemeContext with error handling for use outside provider
 */

import { useContext } from "react";
import { ThemeContext } from "./Context";

/**
 * Hook to access ThemeContext
 *
 * @throws Error if used outside ThemeProvider
 * @returns ThemeContextValue
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { colors, isDark, setTheme } = useTheme();
 *   return <View style={{ backgroundColor: colors.background }} />;
 * }
 * ```
 */
export function useTheme() {
  const context = useContext(ThemeContext);

  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  return context;
}

