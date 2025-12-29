/**
 * Index screen - Component showcase and theme demonstration
 *
 * Showcases all base components (Button variants, Input with error states, Text typography scales)
 * and demonstrates theme switching with buttons for light/dark/system modes.
 * Verifies theme colors are applied correctly to all components.
 *
 * Following patterns from:
 * - comprehend/design-docs/styling-pattern.md - Theme system usage
 * - comprehend/design-docs/context-pattern.md - Context usage
 * - comprehend/design-docs/component-architecture.md - Component usage
 */

import { View, ScrollView, StyleSheet } from "react-native";
import { useTheme } from "@/contexts/ThemeContext/use-theme";
import { Button, Input, Text } from "@/components/ui";
import type { ThemeMode } from "@/types";
import { useState } from "react";
import { Form } from "@react-native-ama/forms";
import { getConfig } from "@/constants/config";

export default function Index() {
  const { mode, colors, isDark, setTheme, spacing } = useTheme();
  const [inputValue, setInputValue] = useState("");
  const [inputError, setInputError] = useState<string | undefined>(undefined);
  const config = getConfig();

  const handleThemeChange = (newMode: ThemeMode) => {
    setTheme(newMode);
  };

  const handleInputChange = (text: string) => {
    setInputValue(text);
    // Clear error when user types
    if (inputError) {
      setInputError(undefined);
    }
  };

  const handleValidateInput = () => {
    if (!inputValue.trim()) {
      setInputError("This field is required");
    } else {
      setInputError(undefined);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { padding: spacing.lg }]}
      >
        <Text variant="heading" style={styles.title}>
          Component Showcase
        </Text>

        {/* Theme Info */}
        <View style={styles.section}>
          <Text variant="subheading" style={styles.sectionTitle}>
            Theme System
          </Text>
          <Text variant="body" color="secondary">
            Current Mode: {mode} ({isDark ? "Dark" : "Light"})
          </Text>
        </View>

        {/* Environment Configuration */}
        <View style={styles.section}>
          <Text variant="subheading" style={styles.sectionTitle}>
            Environment Configuration
          </Text>
          <Text variant="body" color="secondary" style={styles.componentSpacing}>
            Environment: {config.environment}
          </Text>
          <Text variant="body" color="secondary" style={styles.componentSpacing}>
            API URL: {config.apiUrl}
          </Text>
          <Text variant="body" color="secondary" style={styles.componentSpacing}>
            AWS Region: {config.region}
          </Text>
          <Text variant="body" color="secondary" style={styles.componentSpacing}>
            Debug Mode: {config.debugMode ? "Enabled" : "Disabled"}
          </Text>
        </View>

        {/* Button Variants */}
        <View style={styles.section}>
          <Text variant="subheading" style={styles.sectionTitle}>
            Button Variants
          </Text>
          <Button
            title="Primary Button"
            onPress={() => {}}
            variant="primary"
            style={styles.componentSpacing}
          />
          <Button
            title="Secondary Button"
            onPress={() => {}}
            variant="secondary"
            style={styles.componentSpacing}
          />
          <Button
            title="Outline Button"
            onPress={() => {}}
            variant="outline"
            style={styles.componentSpacing}
          />
          <Button
            title="Ghost Button"
            onPress={() => {}}
            variant="ghost"
            style={styles.componentSpacing}
          />
          <Button
            title="Disabled Button"
            onPress={() => {}}
            variant="primary"
            disabled
            style={styles.componentSpacing}
          />
          <Button
            title="Loading Button"
            onPress={() => {}}
            variant="primary"
            loading
            style={styles.componentSpacing}
          />
        </View>

        {/* Button Sizes */}
        <View style={styles.section}>
          <Text variant="subheading" style={styles.sectionTitle}>
            Button Sizes
          </Text>
          <Button
            title="Small"
            onPress={() => {}}
            variant="primary"
            size="small"
            style={styles.componentSpacing}
          />
          <Button
            title="Medium"
            onPress={() => {}}
            variant="primary"
            size="medium"
            style={styles.componentSpacing}
          />
          <Button
            title="Large"
            onPress={() => {}}
            variant="primary"
            size="large"
            style={styles.componentSpacing}
          />
        </View>

        {/* Input Component */}
        <View style={styles.section}>
          <Text variant="subheading" style={styles.sectionTitle}>
            Input Component
          </Text>
          <Form onSubmit={() => true}>
            <Input
              label="Email Address"
              value={inputValue}
              onChangeText={handleInputChange}
              placeholder="Enter your email"
              keyboardType="email-address"
              helperText="We'll never share your email"
              style={styles.componentSpacing}
            />
            <Input
              label="Password"
              value=""
              onChangeText={() => {}}
              placeholder="Enter your password"
              secureTextEntry
              required
              style={styles.componentSpacing}
            />
            <Input
              label="Input with Error"
              value="invalid@email"
              onChangeText={() => {}}
              error={inputError || "Please enter a valid email address"}
              keyboardType="email-address"
              style={styles.componentSpacing}
            />
            <Button
              title="Validate Input"
              onPress={handleValidateInput}
              variant="outline"
              size="small"
            />
          </Form>
        </View>

        {/* Text Typography Scales */}
        <View style={styles.section}>
          <Text variant="subheading" style={styles.sectionTitle}>
            Text Typography Scales
          </Text>
          <Text variant="heading" style={styles.componentSpacing}>
            Heading Text
          </Text>
          <Text variant="subheading" style={styles.componentSpacing}>
            Subheading Text
          </Text>
          <Text variant="body" style={styles.componentSpacing}>
            Body Text - This is the default text style for regular content.
          </Text>
          <Text variant="caption" style={styles.componentSpacing}>
            Caption Text - Used for smaller supporting text.
          </Text>
        </View>

        {/* Text Colors */}
        <View style={styles.section}>
          <Text variant="subheading" style={styles.sectionTitle}>
            Text Colors
          </Text>
          <Text variant="body" color="primary" style={styles.componentSpacing}>
            Primary Text Color
          </Text>
          <Text
            variant="body"
            color="secondary"
            style={styles.componentSpacing}
          >
            Secondary Text Color
          </Text>
          <Text variant="body" color="tertiary" style={styles.componentSpacing}>
            Tertiary Text Color
          </Text>
          <Text variant="body" color="error" style={styles.componentSpacing}>
            Error Text Color
          </Text>
          <Text variant="body" color="success" style={styles.componentSpacing}>
            Success Text Color
          </Text>
          <Text variant="body" color="warning" style={styles.componentSpacing}>
            Warning Text Color
          </Text>
        </View>

        {/* Theme Switching */}
        <View style={styles.section}>
          <Text variant="subheading" style={styles.sectionTitle}>
            Switch Theme
          </Text>
          <Button
            title="Light Mode"
            onPress={() => handleThemeChange("light")}
            variant="primary"
            style={styles.componentSpacing}
          />
          <Button
            title="Dark Mode"
            onPress={() => handleThemeChange("dark")}
            variant="secondary"
            style={styles.componentSpacing}
          />
          <Button
            title="System Mode"
            onPress={() => handleThemeChange("system")}
            variant="outline"
            style={styles.componentSpacing}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingBottom: 32,
  },
  title: {
    marginBottom: 24,
    textAlign: "center",
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  componentSpacing: {
    marginBottom: 12,
  },
});
