/**
 * Input component
 *
 * Reusable input component with proper labels, error states, accessibility support,
 * and theme-aware styling.
 *
 * Following patterns from:
 * - comprehend/design-docs/component-architecture.md - Component organization, props patterns
 * - comprehend/design-docs/accessibility.md - WCAG 2.1 AA requirements, form accessibility
 * - comprehend/design-docs/styling-pattern.md - Theme-aware styling
 */

import React, { useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { Text } from "@react-native-ama/react-native";
import { TextInput } from "@react-native-ama/forms";
import { useTheme } from "@/contexts/ThemeContext/use-theme";
import { INPUT_IDS } from "@/components/components.ids";
import type { BaseComponentProps } from "@/types";

export interface InputProps extends BaseComponentProps {
  /** Input label */
  label: string;
  /** Input value */
  value: string;
  /** Change handler */
  onChangeText: (text: string) => void;
  /** Error message */
  error?: string;
  /** Helper text */
  helperText?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Whether input is required */
  required?: boolean;
  /** Input type (for keyboard type) */
  keyboardType?: "default" | "email-address" | "numeric" | "phone-pad";
  /** Whether input is secure (password) */
  secureTextEntry?: boolean;
}

/**
 * Input component with proper labels, error states (text indicators in addition to color),
 * accessibility props, theme-aware styling, and test IDs.
 *
 * Meets WCAG 2.1 AA requirements:
 * - Proper labels associated with input
 * - Error states indicated by both color and text
 * - Accessibility labels and hints
 * - Theme-aware colors with sufficient contrast
 */
function InputComponent({
  label,
  value,
  onChangeText,
  error,
  helperText,
  placeholder,
  required = false,
  keyboardType = "default",
  secureTextEntry = false,
  disabled = false,
  testID,
  accessibilityLabel,
  accessibilityHint,
}: InputProps) {
  const { colors, spacing, borderRadius, typography } = useTheme();

  const effectiveLabel = useMemo(
    () => accessibilityLabel || label,
    [accessibilityLabel, label],
  );

  const effectiveHint = useMemo(
    () => accessibilityHint || helperText,
    [accessibilityHint, helperText],
  );

  const inputStyles = useMemo(
    () => ({
      backgroundColor: colors.surface,
      borderColor: error ? colors.error : colors.border,
      borderWidth: error ? 2 : 1,
      borderRadius: borderRadius.md,
      color: colors.text,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      fontSize: typography.fontSize.md,
      minHeight: 44, // WCAG 2.1 AA minimum touch target
    }),
    [
      colors.surface,
      colors.error,
      colors.border,
      colors.text,
      error,
      borderRadius.md,
      spacing.md,
      spacing.sm,
      typography.fontSize.md,
    ],
  );

  const labelComponent = useMemo(
    () => (
      <Text
        style={[
          styles.label,
          {
            color: colors.text,
            fontSize: typography.fontSize.sm,
          },
        ]}
        testID={INPUT_IDS.LABEL}
      >
        {label}
        {required && <Text style={{ color: colors.error }}> *</Text>}
      </Text>
    ),
    [label, required, colors.text, colors.error, typography.fontSize.sm],
  );

  const errorComponent = useMemo(
    () =>
      error ? (
        <Text
          style={[
            styles.errorText,
            {
              color: colors.error,
              fontSize: typography.fontSize.sm,
            },
          ]}
          testID={INPUT_IDS.ERROR}
          accessibilityRole="alert"
        >
          {error}
        </Text>
      ) : undefined,
    [error, colors.error, typography.fontSize.sm],
  );

  return (
    <View style={styles.container} testID={testID || INPUT_IDS.CONTAINER}>
      <TextInput
        style={inputStyles}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        editable={!disabled}
        accessible={true}
        accessibilityLabel={effectiveLabel}
        accessibilityHint={effectiveHint}
        accessibilityState={{ disabled }}
        testID={INPUT_IDS.FIELD}
        labelComponent={labelComponent}
        hasValidation={!!error}
        errorComponent={errorComponent}
      />

      {helperText && !error && (
        <Text
          style={[
            styles.helperText,
            {
              color: colors.textSecondary,
              fontSize: typography.fontSize.xs,
              marginTop: spacing.xs,
            },
          ]}
          testID={INPUT_IDS.HELPER_TEXT}
        >
          {helperText}
        </Text>
      )}
    </View>
  );
}

export const Input = React.memo(InputComponent);

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontWeight: "500",
  },
  input: {
    minHeight: 44, // WCAG 2.1 AA minimum touch target
  },
  input_disabled: {
    opacity: 0.5,
  },
  errorText: {
    fontWeight: "500",
  },
  helperText: {
    fontWeight: "400",
  },
});
