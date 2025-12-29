/**
 * Theme constants for the Comprehend mobile application.
 *
 * This file contains color palettes, typography scales, spacing, and border radius
 * constants following patterns from comprehend/design-docs/styling-pattern.md
 *
 * All colors must meet WCAG 2.1 AA contrast requirements:
 * - Normal text: 4.5:1 minimum
 * - Large text: 3:1 minimum
 * - UI components: 3:1 minimum
 */

/**
 * Color palette for light theme
 */
export const Colors = {
  light: {
    primary: "#003D9E",
    secondary: "#3D3BA8",
    background: "#FFFFFF",
    surface: "#F2F2F7",
    text: "#000000",
    textSecondary: "#3C3C43",
    textTertiary: "#8E8E93",
    border: "#D0D0D5",
    error: "#FF3B30",
    success: "#34C759",
    warning: "#FF9500",
    info: "#5AC8FA",
  },
  dark: {
    primary: "#004A99",
    secondary: "#3A38A8",
    background: "#000000",
    surface: "#1C1C1E",
    text: "#FFFFFF",
    textSecondary: "#EBEBF5",
    textTertiary: "#8E8E93",
    border: "#38383A",
    error: "#FF453A",
    success: "#32D74B",
    warning: "#FF9F0A",
    info: "#64D2FF",
  },
} as const;

/**
 * Typography scale for consistent text styling
 *
 * Following patterns from comprehend/design-docs/styling-pattern.md
 */
export const Typography = {
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 20,
    xl: 24,
    xxl: 32,
  },
  fontWeight: {
    regular: "400" as const,
    medium: "500" as const,
    semibold: "600" as const,
    bold: "700" as const,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    loose: 1.8,
  },
} as const;

/**
 * Spacing scale for consistent layout spacing
 *
 * Following patterns from comprehend/design-docs/styling-pattern.md
 * Base unit: 4px (xs), following 4px/8px scale
 */
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

/**
 * Border radius scale for consistent rounded corners
 *
 * Following patterns from comprehend/design-docs/styling-pattern.md
 */
export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;
