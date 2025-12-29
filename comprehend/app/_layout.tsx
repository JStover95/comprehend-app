/**
 * Root layout with theme provider
 *
 * Following patterns from:
 * - comprehend/design-docs/navigation-pattern.md - Root layout configuration
 * - comprehend/design-docs/styling-pattern.md - Theme system integration
 * - comprehend/design-docs/types-and-configuration.md - Environment configuration validation
 */

import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { ThemeProvider } from "@/contexts/ThemeContext/Provider";
import { useTheme } from "@/contexts/ThemeContext/use-theme";
import { AMAProvider } from "@react-native-ama/core";
import { validateEnv } from "@/constants/config";

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
 * Wraps app with ThemeProvider and configures Stack navigator.
 * Validates environment configuration on app startup.
 */
export default function RootLayout() {
  useEffect(() => {
    try {
      validateEnv();
    } catch (error) {
      // Handle validation errors gracefully
      // In development, log the error for debugging
      if (__DEV__) {
        console.error(
          "Environment configuration validation failed:",
          error instanceof Error ? error.message : String(error),
        );
        console.error(
          "Please ensure all required environment variables are set. See .env.example for required variables.",
        );
      }
      // In production, you might want to show a user-friendly error screen
      // For now, we'll let the app continue but log the error
    }
  }, []);

  return (
    <AMAProvider>
      <ThemeProvider>
        <ThemedStatusBar />
        <Stack />
      </ThemeProvider>
    </AMAProvider>
  );
}
