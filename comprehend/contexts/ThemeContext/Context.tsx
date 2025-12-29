/**
 * ThemeContext definition
 *
 * Following patterns from comprehend/design-docs/context-pattern.md
 * and comprehend/design-docs/styling-pattern.md
 */

import { createContext } from "react";
import type { ThemeMode } from "@/types";
import type {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
} from "@/constants/theme";

/**
 * Theme colors interface
 * Following patterns from data-model.md ThemeColors entity
 */
export interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  border: string;
  error: string;
  success: string;
  warning: string;
  info: string;
}

/**
 * Theme context value interface
 *
 * Following patterns from comprehend/design-docs/context-pattern.md
 * Separates state (mode, colors, isDark, typography, spacing, borderRadius)
 * from actions (setTheme)
 */
export interface ThemeContextValue {
  /** Current theme mode preference */
  mode: ThemeMode;
  /** Color palette for current theme */
  colors: ThemeColors;
  /** Computed property indicating if dark mode is active */
  isDark: boolean;
  /** Typography scale */
  typography: typeof Typography;
  /** Spacing scale */
  spacing: typeof Spacing;
  /** Border radius scale */
  borderRadius: typeof BorderRadius;
  /** Action to change theme mode */
  setTheme: (mode: ThemeMode) => void;
}

/**
 * ThemeContext provides access to theme state and actions
 *
 * Following patterns from comprehend/design-docs/context-pattern.md
 */
export const ThemeContext = createContext<ThemeContextValue | undefined>(
  undefined,
);
