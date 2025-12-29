/**
 * Index screen - Theme demonstration
 *
 * Demonstrates theme switching with buttons for light/dark/system modes
 * and verifies theme colors are applied correctly
 *
 * Following patterns from:
 * - comprehend/design-docs/styling-pattern.md - Theme system usage
 * - comprehend/design-docs/context-pattern.md - Context usage
 */

import { Text, View, TouchableOpacity, StyleSheet } from "react-native";
import { useTheme } from "@/contexts/ThemeContext/use-theme";
import type { ThemeMode } from "@/types";

export default function Index() {
  const { mode, colors, isDark, setTheme, spacing, borderRadius } = useTheme();

  const handleThemeChange = (newMode: ThemeMode) => {
    setTheme(newMode);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>
          Theme System Demo
        </Text>

        <View style={styles.infoSection}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            Current Mode:
          </Text>
          <Text style={[styles.value, { color: colors.text }]}>{mode}</Text>
        </View>

        <View style={styles.infoSection}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            Is Dark:
          </Text>
          <Text style={[styles.value, { color: colors.text }]}>
            {isDark ? "Yes" : "No"}
          </Text>
        </View>

        <View style={styles.colorDemo}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Theme Colors:
          </Text>
          <View
            style={[
              styles.colorBox,
              { backgroundColor: colors.primary, marginBottom: spacing.sm },
            ]}
          >
            <Text style={[styles.colorLabel, { color: "#FFFFFF" }]}>
              Primary
            </Text>
          </View>
          <View
            style={[
              styles.colorBox,
              { backgroundColor: colors.secondary, marginBottom: spacing.sm },
            ]}
          >
            <Text style={[styles.colorLabel, { color: "#FFFFFF" }]}>
              Secondary
            </Text>
          </View>
          <View
            style={[
              styles.colorBox,
              {
                backgroundColor: colors.surface,
                marginBottom: spacing.sm,
                borderWidth: 1,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.colorLabel, { color: colors.text }]}>
              Surface
            </Text>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Switch Theme:
          </Text>
          <TouchableOpacity
            style={[
              styles.button,
              {
                backgroundColor: colors.primary,
                marginBottom: spacing.sm,
                borderRadius: borderRadius.md,
              },
            ]}
            onPress={() => handleThemeChange("light")}
            accessibilityRole="button"
            accessibilityLabel="Switch to light theme"
          >
            <Text style={[styles.buttonText, { color: "#FFFFFF" }]}>
              Light Mode
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              {
                backgroundColor: colors.secondary,
                marginBottom: spacing.sm,
                borderRadius: borderRadius.md,
              },
            ]}
            onPress={() => handleThemeChange("dark")}
            accessibilityRole="button"
            accessibilityLabel="Switch to dark theme"
          >
            <Text style={[styles.buttonText, { color: "#FFFFFF" }]}>
              Dark Mode
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              {
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: borderRadius.md,
              },
            ]}
            onPress={() => handleThemeChange("system")}
            accessibilityRole="button"
            accessibilityLabel="Switch to system theme"
          >
            <Text style={[styles.buttonText, { color: colors.text }]}>
              System Mode
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 32,
    textAlign: "center",
  },
  infoSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
  },
  value: {
    fontSize: 16,
    fontWeight: "600",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 16,
    marginTop: 24,
  },
  colorDemo: {
    marginTop: 8,
  },
  colorBox: {
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 60,
  },
  colorLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  buttonContainer: {
    marginTop: 8,
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44, // WCAG 2.1 AA minimum touch target
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
