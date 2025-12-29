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
 * Override console.warn to filter out JSON objects from AMA warnings
 *
 * React Native AMA logs warnings with React element objects that clutter the console.
 * This override extracts only the warning message for AMA warnings.
 */
if (typeof console !== "undefined" && console.warn && console.info) {
  const originalInfo = console.info;
  const originalWarn = console.warn;

  console.info = (message?: any, ...args: any[]) => {
    // Check if this is an AMA warning
    if (typeof message === "string" && message.includes("[ AMA ]")) {
      // For AMA warnings, only log the message without the JSON object
      originalInfo(message);
    } else {
      // For all other warnings, use the original behavior
      originalInfo(message, ...args);
    }
  };

  console.warn = (message?: any, ...args: any[]) => {
    // Check if this is an AMA warning
    if (typeof message === "string" && message.includes("[ AMA ]")) {
      // For AMA warnings, only log the message without the JSON object
      originalWarn(message);
    } else {
      // For all other warnings, use the original behavior
      originalWarn(message, ...args);
    }
  };
}

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
