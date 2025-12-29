/**
 * Shared type definitions for the Comprehend mobile application.
 *
 * This file contains common types used across components, contexts, and utilities.
 * Following patterns from comprehend/design-docs/types-and-configuration.md
 */

import type {
  StyleProp,
  ViewStyle,
  TextStyle,
  AccessibilityRole,
} from "react-native";

/**
 * Theme mode preference
 */
export type ThemeMode = "light" | "dark" | "system";

/**
 * Base props shared by all UI components
 *
 * Following patterns from comprehend/design-docs/component-architecture.md
 * and comprehend/design-docs/types-and-configuration.md
 */
export interface BaseComponentProps {
  /** Test identifier for testing with React Native Testing Library */
  testID?: string;
  /** Custom style override */
  style?: StyleProp<ViewStyle | TextStyle>;
  /** Whether component is disabled */
  disabled?: boolean;
  /** Accessibility label for screen readers */
  accessibilityLabel?: string;
  /** Accessibility hint for additional context */
  accessibilityHint?: string;
  /** Accessibility role for semantic meaning */
  accessibilityRole?: AccessibilityRole;
}

/**
 * Props for components that can be disabled
 */
export interface DisableableProps {
  disabled?: boolean;
}

/**
 * Props for components with loading state
 */
export interface LoadingProps {
  loading?: boolean;
}

/**
 * Props for components with press handlers
 */
export interface PressableProps {
  onPress?: () => void;
  onLongPress?: () => void;
}

/**
 * Combined common component props
 */
export interface CommonComponentProps
  extends BaseComponentProps, DisableableProps, LoadingProps {}

/**
 * Environment configuration type
 *
 * Following patterns from comprehend/design-docs/types-and-configuration.md
 */
export type Environment = "development" | "staging" | "production";

/**
 * Log level for application logging
 */
export type LogLevel = "debug" | "info" | "warn" | "error";
