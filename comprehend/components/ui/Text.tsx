/**
 * Text component
 *
 * Reusable text component with typography scales, theme-aware colors,
 * Dynamic Type support (iOS), and accessibility props.
 *
 * Following patterns from:
 * - comprehend/design-docs/component-architecture.md - Component organization, props patterns
 * - comprehend/design-docs/accessibility.md - WCAG 2.1 AA requirements, contrast ratios
 * - comprehend/design-docs/styling-pattern.md - Theme-aware styling, typography
 */

import { StyleSheet, Platform } from "react-native";
import { Text as RNText } from "@react-native-ama/react-native";
import { useTheme } from "@/contexts/ThemeContext/use-theme";
import { TEXT_IDS } from "@/components/components.ids";
import type { TextComponentProps } from "@/types";

export type TextVariant = "heading" | "subheading" | "body" | "caption";
export type TextColor =
  | "primary"
  | "secondary"
  | "tertiary"
  | "error"
  | "success"
  | "warning";

export interface TextProps extends TextComponentProps {
  /** Text content */
  children: React.ReactNode;
  /** Typography variant */
  variant?: TextVariant;
  /** Text color variant */
  color?: TextColor;
  /** Whether text should support Dynamic Type (iOS) */
  allowFontScaling?: boolean;
}

/**
 * Text component with typography scales (headings, body, captions),
 * theme-aware colors, Dynamic Type support (iOS), and test IDs.
 *
 * Meets WCAG 2.1 AA requirements:
 * - Typography scales with appropriate sizes
 * - Theme-aware colors with sufficient contrast (4.5:1 for normal text, 3:1 for large text)
 * - Accessibility labels and hints
 * - Dynamic Type support for iOS accessibility
 */
export function Text({
  children,
  variant = "body",
  color = "primary",
  allowFontScaling = true,
  testID,
  accessibilityLabel,
  accessibilityHint,
  style,
}: TextProps) {
  const { colors, typography } = useTheme();

  const getFontSize = () => {
    switch (variant) {
      case "heading":
        return typography.fontSize.xl;
      case "subheading":
        return typography.fontSize.lg;
      case "body":
        return typography.fontSize.md;
      case "caption":
        return typography.fontSize.sm;
    }
  };

  const getFontWeight = () => {
    switch (variant) {
      case "heading":
        return typography.fontWeight.bold;
      case "subheading":
        return typography.fontWeight.semibold;
      case "body":
      case "caption":
        return typography.fontWeight.regular;
    }
  };

  const getLineHeight = () => {
    const fontSize = getFontSize();
    return fontSize * typography.lineHeight.normal;
  };

  const getTextColor = () => {
    switch (color) {
      case "primary":
        return colors.text;
      case "secondary":
        return colors.textSecondary;
      case "tertiary":
        return colors.textTertiary;
      case "error":
        return colors.error;
      case "success":
        return colors.success;
      case "warning":
        return colors.warning;
    }
  };

  const textStyles = [
    styles.text,
    {
      fontSize: getFontSize(),
      fontWeight: getFontWeight(),
      lineHeight: getLineHeight(),
      color: getTextColor(),
      // iOS Dynamic Type support
      ...Platform.select({
        ios: {
          fontFamily: "System",
        },
      }),
    },
    style,
  ];

  const effectiveLabel =
    accessibilityLabel || (typeof children === "string" ? children : undefined);

  return (
    <RNText
      style={textStyles}
      allowFontScaling={allowFontScaling}
      accessible={!!effectiveLabel}
      accessibilityLabel={effectiveLabel}
      accessibilityHint={accessibilityHint}
      testID={testID || TEXT_IDS.CONTENT}
    >
      {children}
    </RNText>
  );
}

const styles = StyleSheet.create({
  text: {
    // Base text styles
  },
});
