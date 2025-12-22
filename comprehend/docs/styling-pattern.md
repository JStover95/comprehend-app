# Styling Pattern

## Overview

This document describes styling patterns for React Native components using StyleSheet, theme management with Context API, and responsive design strategies.

## Table of Contents

- [StyleSheet Organization](#stylesheet-organization)
- [Theme System](#theme-system)
- [Color and Typography](#color-and-typography)
- [Responsive Design](#responsive-design)
- [Platform-Specific Styles](#platform-specific-styles)
- [Dark Mode Support](#dark-mode-support)
- [Accessibility](#accessibility)
- [Complete Examples](#complete-examples)

## StyleSheet Organization

### Basic StyleSheet

Always use `StyleSheet.create` for performance:

```typescript
// components/Card.tsx
import { View, Text, StyleSheet } from 'react-native';

export function Card({ title, children }: CardProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  content: {
    flex: 1,
  },
});
```

### Naming Conventions

Use clear, descriptive names:

```typescript
const styles = StyleSheet.create({
  // Container elements
  container: {},
  wrapper: {},
  content: {},
  
  // Text elements
  title: {},
  subtitle: {},
  description: {},
  label: {},
  
  // State variants
  button_primary: {},
  button_disabled: {},
  input_focused: {},
  input_error: {},
  
  // Size variants
  text_small: {},
  text_medium: {},
  text_large: {},
});
```

### Style Composition

Combine styles using arrays:

```typescript
export function Button({ variant, size, disabled }: ButtonProps) {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        styles[`button_${variant}`],
        styles[`button_${size}`],
        disabled && styles.button_disabled,
      ]}
    >
      <Text style={[styles.text, styles[`text_${variant}`]]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}
```

### Shared Styles

Extract common styles into a separate file:

```typescript
// styles/common.ts
import { StyleSheet } from 'react-native';

export const commonStyles = StyleSheet.create({
  // Layout
  flex1: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
  },
  column: {
    flexDirection: 'column',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Spacing
  p_sm: { padding: 8 },
  p_md: { padding: 16 },
  p_lg: { padding: 24 },
  m_sm: { margin: 8 },
  m_md: { margin: 16 },
  m_lg: { margin: 24 },
  
  // Shadows
  shadow_sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  shadow_md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
});
```

## Theme System

### Theme Context

```typescript
// contexts/ThemeContext/Context.tsx
import { createContext } from 'react';

export type Theme = 'light' | 'dark' | 'system';

export interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  error: string;
  success: string;
  warning: string;
}

export interface ThemeContextValue {
  theme: Theme;
  colors: ThemeColors;
  isDark: boolean;
  setTheme: (theme: Theme) => void;
}

export const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);
```

### Theme Provider

```typescript
// contexts/ThemeContext/Provider.tsx
import { useState, useEffect, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeContext } from './Context';

const THEME_KEY = '@theme';

const lightColors: ThemeColors = {
  primary: '#007AFF',
  secondary: '#5856D6',
  background: '#FFFFFF',
  surface: '#F2F2F7',
  text: '#000000',
  textSecondary: '#3C3C43',
  border: '#C7C7CC',
  error: '#FF3B30',
  success: '#34C759',
  warning: '#FF9500',
};

const darkColors: ThemeColors = {
  primary: '#0A84FF',
  secondary: '#5E5CE6',
  background: '#000000',
  surface: '#1C1C1E',
  text: '#FFFFFF',
  textSecondary: '#EBEBF5',
  border: '#38383A',
  error: '#FF453A',
  success: '#32D74B',
  warning: '#FF9F0A',
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [theme, setThemeState] = useState<Theme>('system');

  // Load saved theme on mount
  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_KEY);
      if (savedTheme) {
        setThemeState(savedTheme as Theme);
      }
    } catch (error) {
      console.error('Failed to load theme', error);
    }
  };

  const setTheme = async (newTheme: Theme) => {
    try {
      await AsyncStorage.setItem(THEME_KEY, newTheme);
      setThemeState(newTheme);
    } catch (error) {
      console.error('Failed to save theme', error);
    }
  };

  // Determine if dark mode is active
  const isDark = theme === 'dark' || (theme === 'system' && systemColorScheme === 'dark');

  // Select colors based on theme
  const colors = isDark ? darkColors : lightColors;

  const value = useMemo(
    () => ({
      theme,
      colors,
      isDark,
      setTheme,
    }),
    [theme, colors, isDark]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
```

### Using Theme in Components

```typescript
// components/ThemedCard.tsx
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

export function ThemedCard({ title, children }: CardProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <Text style={[styles.title, { color: colors.text }]}>
        {title}
      </Text>
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  content: {
    flex: 1,
  },
});
```

### Custom useTheme Hook

```typescript
// contexts/ThemeContext/use-theme.ts
import { useContext } from 'react';
import { ThemeContext } from './Context';

export function useTheme() {
  const context = useContext(ThemeContext);
  
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  
  return context;
}
```

## Color and Typography

### Color Constants

```typescript
// constants/theme.ts

export const Colors = {
  light: {
    primary: '#007AFF',
    secondary: '#5856D6',
    background: '#FFFFFF',
    surface: '#F2F2F7',
    text: '#000000',
    textSecondary: '#3C3C43',
    textTertiary: '#8E8E93',
    border: '#C7C7CC',
    error: '#FF3B30',
    success: '#34C759',
    warning: '#FF9500',
    info: '#5AC8FA',
  },
  dark: {
    primary: '#0A84FF',
    secondary: '#5E5CE6',
    background: '#000000',
    surface: '#1C1C1E',
    text: '#FFFFFF',
    textSecondary: '#EBEBF5',
    textTertiary: '#8E8E93',
    border: '#38383A',
    error: '#FF453A',
    success: '#32D74B',
    warning: '#FF9F0A',
    info: '#64D2FF',
  },
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

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
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    loose: 1.8,
  },
} as const;

export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;
```

### Using Constants

```typescript
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.light.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  title: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    lineHeight: Typography.fontSize.lg * Typography.lineHeight.normal,
  },
});
```

## Responsive Design

### Screen Dimensions

```typescript
// utils/dimensions.ts
import { Dimensions } from 'react-native';

export const screen = Dimensions.get('screen');
export const window = Dimensions.get('window');

export const isSmallDevice = window.width < 375;
export const isMediumDevice = window.width >= 375 && window.width < 768;
export const isLargeDevice = window.width >= 768;

export const isTablet = isLargeDevice;
export const isPhone = !isTablet;
```

### Responsive Values

```typescript
// utils/responsive.ts
import { PixelRatio } from 'react-native';
import { window } from './dimensions';

/**
 * Scale size based on device width
 */
export function scale(size: number): number {
  const guidelineBaseWidth = 375;
  return (window.width / guidelineBaseWidth) * size;
}

/**
 * Scale vertically based on device height
 */
export function verticalScale(size: number): number {
  const guidelineBaseHeight = 812;
  return (window.height / guidelineBaseHeight) * size;
}

/**
 * Moderate scale - less aggressive scaling
 */
export function moderateScale(size: number, factor: number = 0.5): number {
  return size + (scale(size) - size) * factor;
}

/**
 * Normalize font size for different screen densities
 */
export function normalize(size: number): number {
  return Math.round(PixelRatio.roundToNearestPixel(scale(size)));
}
```

### Responsive Styles

```typescript
import { StyleSheet } from 'react-native';
import { isTablet } from '@/utils/dimensions';
import { moderateScale, normalize } from '@/utils/responsive';

const styles = StyleSheet.create({
  container: {
    padding: moderateScale(16),
    maxWidth: isTablet ? 768 : '100%',
  },
  title: {
    fontSize: normalize(24),
    marginBottom: moderateScale(8),
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    // 2 columns on phone, 3 on tablet
    gap: moderateScale(16),
  },
  gridItem: {
    width: isTablet ? '31%' : '47%',
  },
});
```

### useOrientation Hook

```typescript
// hooks/use-orientation.ts
import { useState, useEffect } from 'react';
import { Dimensions } from 'react-native';

export type Orientation = 'portrait' | 'landscape';

export function useOrientation(): Orientation {
  const [orientation, setOrientation] = useState<Orientation>(
    getOrientation()
  );

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', () => {
      setOrientation(getOrientation());
    });

    return () => subscription?.remove();
  }, []);

  return orientation;
}

function getOrientation(): Orientation {
  const { width, height } = Dimensions.get('window');
  return width > height ? 'landscape' : 'portrait';
}
```

## Platform-Specific Styles

### Platform Select

```typescript
import { Platform, StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      },
    }),
  },
  text: {
    fontFamily: Platform.select({
      ios: 'System',
      android: 'Roboto',
      default: 'System',
    }),
  },
});
```

### Platform-Specific Components

```typescript
// components/Button.ios.tsx
export function Button(props: ButtonProps) {
  return <IOSButton {...props} />;
}

// components/Button.android.tsx
export function Button(props: ButtonProps) {
  return <AndroidButton {...props} />;
}

// components/Button.tsx (fallback)
export function Button(props: ButtonProps) {
  return <DefaultButton {...props} />;
}

// React Native will automatically import the correct file
import { Button } from './components/Button';
```

### Platform Constants

```typescript
import { Platform } from 'react-native';

export const isIOS = Platform.OS === 'ios';
export const isAndroid = Platform.OS === 'android';
export const isWeb = Platform.OS === 'web';

export const platformSpacing = {
  statusBar: isIOS ? 44 : 24,
  tabBar: isIOS ? 83 : 56,
  header: isIOS ? 44 : 56,
};
```

## Dark Mode Support

### System Dark Mode Detection

```typescript
import { useColorScheme } from 'react-native';

export function MyComponent() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View style={{ backgroundColor: isDark ? '#000' : '#fff' }}>
      <Text style={{ color: isDark ? '#fff' : '#000' }}>
        Hello World
      </Text>
    </View>
  );
}
```

## Accessibility

@@ Highlight accessability in design docs as an always must-have

### Accessible Colors

Ensure sufficient contrast ratios:

```typescript
// utils/accessibility.ts

/**
 * Calculate relative luminance of a color
 */
export function getLuminance(color: string): number {
  // Implementation of WCAG 2.0 relative luminance formula
  // ...
}

/**
 * Calculate contrast ratio between two colors
 */
export function getContrastRatio(foreground: string, background: string): number {
  const l1 = getLuminance(foreground);
  const l2 = getLuminance(background);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if color combination meets WCAG AA standard
 */
export function meetsWCAG_AA(foreground: string, background: string): boolean {
  return getContrastRatio(foreground, background) >= 4.5;
}
```

### Accessible Touch Targets

Ensure minimum touch target sizes:

```typescript
const styles = StyleSheet.create({
  button: {
    minHeight: 44, // iOS minimum
    minWidth: 44,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
```

### Accessibility Props

```typescript
export function AccessibleButton({ title, onPress }: ButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      accessible={true}
      accessibilityLabel={title}
      accessibilityRole="button"
      accessibilityHint="Tap to perform action"
    >
      <Text>{title}</Text>
    </TouchableOpacity>
  );
}
```

## Complete Examples

### Themed Component

```typescript
// components/ThemedButton.tsx
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

export type ButtonVariant = 'primary' | 'secondary' | 'outline';

interface ThemedButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
}

export function ThemedButton({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
}: ThemedButtonProps) {
  const { colors } = useTheme();

  const getBackgroundColor = () => {
    if (disabled) return colors.border;
    switch (variant) {
      case 'primary':
        return colors.primary;
      case 'secondary':
        return colors.secondary;
      case 'outline':
        return 'transparent';
    }
  };

  const getTextColor = () => {
    if (disabled) return colors.textSecondary;
    return variant === 'outline' ? colors.primary : '#FFFFFF';
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: getBackgroundColor(),
          borderColor: variant === 'outline' ? colors.primary : 'transparent',
        },
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} />
      ) : (
        <Text style={[styles.text, { color: getTextColor() }]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 44,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
});
```

## Best Practices

### Do's

- ✅ Use StyleSheet.create for all styles
- ✅ Use theme context for colors
- ✅ Support dark mode
- ✅ Ensure sufficient contrast ratios
- ✅ Use minimum touch target sizes (44x44)
- ✅ Use responsive values for different screens
- ✅ Use platform-specific styles when needed
- ✅ Add accessibility props to interactive elements

### Don'ts

- ❌ Don't use inline styles for static styles
- ❌ Don't hardcode colors (use theme)
- ❌ Don't ignore dark mode
- ❌ Don't create inaccessible color combinations
- ❌ Don't use small touch targets
- ❌ Don't assume fixed screen dimensions
- ❌ Don't ignore platform differences

## Next Steps

- Read [Component Architecture](./component-architecture.md) for component patterns
- Read [Context Pattern](./context-pattern.md) for theme context
- Read [Types and Configuration](./types-and-configuration.md) for theme types
- Explore [React Native StyleSheet API](https://reactnative.dev/docs/stylesheet)
