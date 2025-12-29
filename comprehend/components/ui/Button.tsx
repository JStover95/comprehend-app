/**
 * Button component
 *
 * Reusable button component with theme-aware styling, accessibility support,
 * and WCAG 2.1 AA compliance.
 *
 * Following patterns from:
 * - comprehend/design-docs/component-architecture.md - Component organization, props patterns
 * - comprehend/design-docs/accessibility.md - WCAG 2.1 AA requirements, touch targets
 * - comprehend/design-docs/styling-pattern.md - Theme-aware styling
 */

import { ActivityIndicator, StyleSheet } from "react-native";
import { TouchableOpacity, Text } from "@react-native-ama/react-native";
import { useTheme } from "@/contexts/ThemeContext/use-theme";
import { BUTTON_IDS } from "@/components/components.ids";
import type { ViewComponentProps } from "@/types";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost";
export type ButtonSize = "small" | "medium" | "large";

export interface ButtonProps extends ViewComponentProps {
  /** Button text */
  title: string;
  /** Click handler */
  onPress: () => void;
  /** Visual variant */
  variant?: ButtonVariant;
  /** Button size */
  size?: ButtonSize;
  /** Loading state */
  loading?: boolean;
}

/**
 * Button component with minimum 44x44 touch target, accessibility props,
 * theme-aware styling, and test IDs.
 *
 * Meets WCAG 2.1 AA requirements:
 * - Minimum 44x44 point touch target
 * - Proper accessibility labels and roles
 * - Theme-aware colors with sufficient contrast
 */
export function Button({
  title,
  onPress,
  variant = "primary",
  size = "medium",
  disabled = false,
  loading = false,
  testID,
  accessibilityLabel,
  accessibilityHint,
  style,
}: ButtonProps) {
  const { colors, borderRadius } = useTheme();

  const getBackgroundColor = () => {
    if (disabled || loading) return colors.border;
    switch (variant) {
      case "primary":
        return colors.primary;
      case "secondary":
        return colors.secondary;
      case "outline":
      case "ghost":
        return "transparent";
    }
  };

  const getTextColor = () => {
    if (disabled || loading) return colors.textSecondary;
    switch (variant) {
      case "primary":
      case "secondary":
        return "#FFFFFF"; // White text on colored backgrounds
      case "outline":
      case "ghost":
        return colors.primary;
    }
  };

  const getBorderColor = () => {
    if (disabled || loading) return colors.border;
    return variant === "outline" ? colors.primary : "transparent";
  };

  const buttonStyles = [
    styles.button,
    styles[`button_${size}`],
    {
      backgroundColor: getBackgroundColor(),
      borderColor: getBorderColor(),
      borderRadius: borderRadius.md,
      opacity: disabled && !loading ? 0.5 : 1,
    },
    style,
  ];

  const textStyles = [
    styles.text,
    styles[`text_${size}`],
    {
      color: getTextColor(),
    },
  ];

  const effectiveLabel = accessibilityLabel || title;

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={disabled || loading}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={effectiveLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      testID={testID || BUTTON_IDS.CONTAINER}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} testID={BUTTON_IDS.LOADING} />
      ) : (
        <Text style={textStyles} testID={BUTTON_IDS.TEXT}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 44, // WCAG 2.1 AA minimum touch target
    minWidth: 44,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  button_small: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  button_medium: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  button_large: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  text: {
    fontWeight: "600",
    textAlign: "center",
  },
  text_small: {
    fontSize: 14,
  },
  text_medium: {
    fontSize: 16,
  },
  text_large: {
    fontSize: 18,
  },
});
