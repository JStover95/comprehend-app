/**
 * Root layout with theme provider
 *
 * Following patterns from:
 * - comprehend/design-docs/navigation-pattern.md - Root layout configuration
 * - comprehend/design-docs/styling-pattern.md - Theme system integration
 */

import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ThemeProvider } from "@/contexts/ThemeContext/Provider";
import { useTheme } from "@/contexts/ThemeContext/use-theme";
import { AMAProvider } from "@react-native-ama/core";

/**
 * ThemedStatusBar component
 *
 * Updates status bar style based on current theme
 * Following patterns from comprehend/design-docs/styling-pattern.md
 */
function ThemedStatusBar() {
  const { isDark } = useTheme();
  return <StatusBar style={isDark ? "light" : "dark"} />;
}

/**
 * Root layout component
 *
 * Wraps app with ThemeProvider and configures Stack navigator
 */
export default function RootLayout() {
  return (
    <AMAProvider>
      <ThemeProvider>
        <ThemedStatusBar />
        <Stack />
      </ThemeProvider>
    </AMAProvider>
  );
}
