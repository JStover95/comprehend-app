# Accessibility Guidelines

## Overview

**⚠️ CRITICAL: Accessibility is not optional** - It must be incorporated from the start of every design and development phase.

This document outlines accessibility requirements, patterns, and best practices for building inclusive React Native applications that work for everyone.

## React Native AMA

**[React Native AMA](https://github.com/FormidableLabs/react-native-ama)** (Accessibility Made Accessible) is a library that enforces accessibility best practices and provides enhanced accessibility components for React Native applications.

### What is React Native AMA?

React Native AMA is a library that:

- Provides enhanced accessibility components that wrap React Native primitives
- Performs runtime accessibility checks during development
- Enforces minimum accessibility requirements
- Offers comprehensive guidelines and best practices
- Provides hooks and utilities for accessibility features

### Installation and Setup

#### Install the Package

Install React Native AMA using your preferred package manager:

```bash
# Using npm
npm install @react-native-ama/core @react-native-ama/react-native @react-native-ama/forms

# Using yarn
yarn add @react-native-ama/core @react-native-ama/react-native @react-native-ama/forms
```

#### Wrap Your App with AMAProvider

Wrap your root application component with `AMAProvider` to enable React Native AMA features:

```typescript
import { AMAProvider } from "@react-native-ama/core";

export default function App() {
  return (
    <AMAProvider>
      {/* Your app components */}
    </AMAProvider>
  );
}
```

The `AMAProvider` should be placed at the root of your component tree, typically in your root layout or main app component.

Instead of using standard React Native components, use the enhanced components from `react-native-ama`:

```typescript
// ✅ Use react-native-ama components
import { Text, TouchableOpacity } from "@react-native-ama/react-native";
import { TextInput, Form } from "@react-native-ama/forms";

// ❌ Avoid standard React Native components
import { Text, TouchableOpacity } from "react-native";
import { TextInput } from "react-native";
```

### Documentation

For detailed documentation on React Native AMA, refer to:

- **[React Native AMA Documentation](https://formidable.com/open-source/react-native-ama/)**
- **[React Native AMA GitHub Repository](https://github.com/FormidableLabs/react-native-ama)**
- **[React Native AMA NPM Package](https://www.npmjs.com/package/@react-native-ama/core)**

### Example Usage

Here are practical examples of using React Native AMA components:

**Button Component:**

- Uses `TouchableOpacity` and `Text` from `@react-native-ama/react-native`
- Includes proper accessibility labels, roles, and states
- See the [Button component example](#button-with-state) below

**Input Component:**

- Uses `TextInput` from `@react-native-ama/forms` and `Text` from `@react-native-ama/react-native`
- Includes label components, error handling, and validation states
- See the [Forms and Input section](#forms-and-input) below

**Text Component:**

- Uses `Text` from `@react-native-ama/react-native`
- Supports Dynamic Type (iOS) and accessibility labels
- See the [Alternative Text section](#alternative-text) below

## Table of Contents

- [React Native AMA](#react-native-ama)
- [Core Principles](#core-principles)
- [WCAG Standards](#wcag-standards)
- [Color and Contrast](#color-and-contrast)
- [Touch Targets](#touch-targets)
- [Screen Reader Support](#screen-reader-support)
- [Keyboard Navigation](#keyboard-navigation)
- [Focus Management](#focus-management)
- [Alternative Text](#alternative-text)
- [Forms and Input](#forms-and-input)
- [Motion and Animation](#motion-and-animation)
- [Testing Accessibility](#testing-accessibility)
- [Platform-Specific Considerations](#platform-specific-considerations)
- [Common Patterns](#common-patterns)

## Core Principles

### The Four POUR Principles

Accessible applications must be:

1. **Perceivable** - Information and UI components must be presentable to users in ways they can perceive
2. **Operable** - UI components and navigation must be operable by all users
3. **Understandable** - Information and UI operation must be understandable
4. **Robust** - Content must be robust enough to work with assistive technologies

### Disability Categories to Consider

- **Visual**: Blindness, low vision, color blindness
- **Auditory**: Deafness, hard of hearing
- **Motor**: Limited fine motor control, tremors, paralysis
- **Cognitive**: Learning disabilities, memory impairments, attention disorders
- **Temporary**: Broken arm, bright sunlight, noisy environment

## WCAG Standards

### Compliance Levels

- **Level A**: Minimum accessibility (legal baseline in many jurisdictions)
- **Level AA**: Mid-range accessibility (recommended target)
- **Level AAA**: Highest accessibility (ideal, but not always achievable)

**Target**: All components must meet **WCAG 2.1 Level AA** standards minimum.

### Key Success Criteria

| Criterion | Level | Requirement |
| ----------- | ------- | ------------- |
| Color Contrast (Text) | AA | 4.5:1 for normal text, 3:1 for large text |
| Color Contrast (UI) | AA | 3:1 for UI components and graphical objects |
| Touch Target Size | AA | Minimum 44x44 points |
| Focus Visible | AA | Keyboard focus indicator is visible |
| Label in Name | A | Accessible name matches visible text |
| Status Messages | AA | Status messages can be programmatically determined |

## Color and Contrast

### Contrast Ratios

**Normal Text** (< 18pt or < 14pt bold):

- Minimum: 4.5:1 (AA)
- Enhanced: 7:1 (AAA)

**Large Text** (≥ 18pt or ≥ 14pt bold):

- Minimum: 3:1 (AA)
- Enhanced: 4.5:1 (AAA)

**UI Components and Graphics**:

- Minimum: 3:1 (AA)

### Contrast Utilities

```typescript
// utils/accessibility.ts

/**
 * Calculate relative luminance of a color (WCAG 2.0 formula)
 */
export function getLuminance(color: string): number {
  // Convert hex to RGB
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16) / 255;
  const g = parseInt(hex.substr(2, 2), 16) / 255;
  const b = parseInt(hex.substr(4, 2), 16) / 255;

  // Apply gamma correction
  const [rLum, gLum, bLum] = [r, g, b].map(val => {
    return val <= 0.03928 
      ? val / 12.92 
      : Math.pow((val + 0.055) / 1.055, 2.4);
  });

  // Calculate luminance
  return 0.2126 * rLum + 0.7152 * gLum + 0.0722 * bLum;
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
export function meetsWCAG_AA(
  foreground: string, 
  background: string,
  isLargeText: boolean = false
): boolean {
  const ratio = getContrastRatio(foreground, background);
  return isLargeText ? ratio >= 3 : ratio >= 4.5;
}

/**
 * Check if color combination meets WCAG AAA standard
 */
export function meetsWCAG_AAA(
  foreground: string, 
  background: string,
  isLargeText: boolean = false
): boolean {
  const ratio = getContrastRatio(foreground, background);
  return isLargeText ? ratio >= 4.5 : ratio >= 7;
}

/**
 * Get contrast level description
 */
export function getContrastLevel(foreground: string, background: string): string {
  const ratio = getContrastRatio(foreground, background);
  
  if (ratio >= 7) return 'AAA (Excellent)';
  if (ratio >= 4.5) return 'AA (Good)';
  if (ratio >= 3) return 'AA Large Text Only';
  return 'Fail (Insufficient)';
}
```

### Don't Rely on Color Alone

Always provide additional visual cues beyond color:

```typescript
// ❌ Bad: Only color indicates error
<TextInput style={{ borderColor: hasError ? 'red' : 'gray' }} />

// ✅ Good: Color + icon + text
<View>
  <TextInput 
    style={{ 
      borderColor: hasError ? Colors.error : Colors.border,
      borderWidth: hasError ? 2 : 1 
    }}
  />
  {hasError && (
    <View style={styles.errorContainer}>
      <Icon name="error" color={Colors.error} />
      <Text style={styles.errorText}>Invalid email address</Text>
    </View>
  )}
</View>
```

### Color Blindness Considerations

Approximately 8% of men and 0.5% of women have some form of color blindness:

- **Deuteranopia**: Reduced sensitivity to green (most common)
- **Protanopia**: Reduced sensitivity to red
- **Tritanopia**: Reduced sensitivity to blue

**Best Practices**:

- Avoid red-green combinations as the only differentiator
- Use patterns, icons, or text labels in addition to color
- Test designs with color blindness simulators

## Touch Targets

### Minimum Sizes

All interactive elements must meet minimum touch target sizes:

- **iOS**: 44x44 points minimum (Apple Human Interface Guidelines)
- **Android**: 48x48 dp minimum (Material Design)
- **Recommended**: 48x48 points for cross-platform consistency

### Implementation

```typescript
// constants/accessibility.ts
export const TOUCH_TARGET = {
  MIN_SIZE: 44,
  RECOMMENDED_SIZE: 48,
  MIN_SPACING: 8, // Minimum spacing between touch targets
} as const;
```

```typescript
// components/AccessibleButton.tsx
import { StyleSheet } from 'react-native';
import { TouchableOpacity, Text } from '@react-native-ama/react-native';
import { TOUCH_TARGET } from '@/constants/accessibility';

export function AccessibleButton({ title, onPress, icon }: ButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.button}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint="Double tap to activate"
    >
      {icon && icon}
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  );
}
```

### Icon-Only Buttons

Icon buttons need special attention:

```typescript
import { TouchableOpacity } from '@react-native-ama/react-native';

export function IconButton({ icon, onPress, accessibilityLabel }: IconButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.iconButton}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel} // Required!
    >
      <Icon name={icon} size={24} />
    </TouchableOpacity>
  );
}

// Usage
<IconButton 
  icon="search" 
  onPress={handleSearch}
  accessibilityLabel="Search items" // Clear description of action
/>
```

## Screen Reader Support

### Using React Native AMA Components

**React Native AMA** provides enhanced components that automatically handle many accessibility requirements. Always prefer using components from `@react-native-ama/react-native` and `@react-native-ama/forms` over standard React Native components.

```typescript
// ✅ Use React Native AMA components
import { Text, TouchableOpacity } from "@react-native-ama/react-native";
import { TextInput } from "@react-native-ama/forms";

// ❌ Avoid standard React Native components
import { Text, TouchableOpacity, TextInput } from "react-native";
```

React Native AMA components:

- Automatically enforce accessibility requirements
- Provide runtime warnings for missing accessibility props
- Include enhanced accessibility features
- Follow WCAG 2.1 AA standards

### Accessibility Props

React Native provides several accessibility props (enhanced by React Native AMA):

```typescript
export interface AccessibilityProps {
  // Basic
  accessible?: boolean;                    // Make element accessible
  accessibilityLabel?: string;             // Label read by screen reader
  accessibilityHint?: string;             // Additional usage hint
  accessibilityRole?: AccessibilityRole;  // Element's role
  
  // State
  accessibilityState?: {
    disabled?: boolean;
    selected?: boolean;
    checked?: boolean | 'mixed';
    busy?: boolean;
    expanded?: boolean;
  };
  
  // Value
  accessibilityValue?: {
    min?: number;
    max?: number;
    now?: number;
    text?: string;
  };
  
  // Actions
  accessibilityActions?: Array<{
    name: string;
    label?: string;
  }>;
  onAccessibilityAction?: (event: AccessibilityActionEvent) => void;
  
  // Advanced
  accessibilityLiveRegion?: 'none' | 'polite' | 'assertive';
  accessibilityElementsHidden?: boolean;
  accessibilityViewIsModal?: boolean;
}
```

### Common Roles

```typescript
export type AccessibilityRole =
  | 'none'
  | 'button'
  | 'link'
  | 'search'
  | 'image'
  | 'keyboardkey'
  | 'text'
  | 'adjustable'
  | 'imagebutton'
  | 'header'
  | 'summary'
  | 'alert'
  | 'checkbox'
  | 'combobox'
  | 'menu'
  | 'menubar'
  | 'menuitem'
  | 'progressbar'
  | 'radio'
  | 'radiogroup'
  | 'scrollbar'
  | 'spinbutton'
  | 'switch'
  | 'tab'
  | 'tablist'
  | 'timer'
  | 'toolbar';
```

### Practical Examples

#### Button with State

```typescript
import { TouchableOpacity, Text } from '@react-native-ama/react-native';

export function ToggleButton({ isActive, onPress, label }: ToggleButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ checked: isActive }}
      accessibilityHint={`Turns ${label} ${isActive ? 'off' : 'on'}`}
    >
      <Text>{label}: {isActive ? 'On' : 'Off'}</Text>
    </TouchableOpacity>
  );
}
```

#### Slider with Value

```typescript
export function VolumeSlider({ value, onChange }: SliderProps) {
  return (
    <Slider
      value={value}
      onValueChange={onChange}
      minimumValue={0}
      maximumValue={100}
      accessible={true}
      accessibilityRole="adjustable"
      accessibilityLabel="Volume"
      accessibilityValue={{
        min: 0,
        max: 100,
        now: value,
        text: `${value} percent`,
      }}
      accessibilityActions={[
        { name: 'increment', label: 'Increase volume' },
        { name: 'decrement', label: 'Decrease volume' },
      ]}
      onAccessibilityAction={(event) => {
        if (event.nativeEvent.actionName === 'increment') {
          onChange(Math.min(100, value + 10));
        } else if (event.nativeEvent.actionName === 'decrement') {
          onChange(Math.max(0, value - 10));
        }
      }}
    />
  );
}
```

#### Loading States

```typescript
import { ActivityIndicator } from 'react-native';
import { TouchableOpacity, Text } from '@react-native-ama/react-native';

export function LoadingButton({ loading, onPress, title }: LoadingButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={loading}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ 
        disabled: loading,
        busy: loading 
      }}
      accessibilityHint={loading ? 'Loading, please wait' : undefined}
    >
      {loading ? <ActivityIndicator /> : <Text>{title}</Text>}
    </TouchableOpacity>
  );
}
```

#### Live Regions for Dynamic Content

```typescript
import { View } from 'react-native';
import { Text } from '@react-native-ama/react-native';

export function NotificationBanner({ message, type }: NotificationProps) {
  return (
    <View
      accessible={true}
      accessibilityLabel={message}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite" // Announces when content changes
      style={styles.banner}
    >
      <Text>{message}</Text>
    </View>
  );
}
```

## Keyboard Navigation

### Focus Order

Ensure logical tab order through content:

```typescript
import { View } from 'react-native';
import { Text, TouchableOpacity } from '@react-native-ama/react-native';
import { TextInput } from '@react-native-ama/forms';

// Use importantForAccessibility to control focus order
<View>
  <TextInput 
    placeholder="First Name"
    importantForAccessibility="yes"
  />
  <TextInput 
    placeholder="Last Name"
    importantForAccessibility="yes"
  />
  <Text importantForAccessibility="no">
    Helper text (not focusable)
  </Text>
  <TouchableOpacity 
    importantForAccessibility="yes"
    accessibilityRole="button"
  >
    <Text>Submit</Text>
  </TouchableOpacity>
</View>
```

### Skip Links

For complex layouts, provide skip navigation:

```typescript
import { TouchableOpacity, Text } from '@react-native-ama/react-native';

export function SkipToContent({ targetRef }: SkipToContentProps) {
  const handleSkip = () => {
    targetRef.current?.focus();
  };

  return (
    <TouchableOpacity
      onPress={handleSkip}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel="Skip to main content"
      style={styles.skipLink}
    >
      <Text>Skip to content</Text>
    </TouchableOpacity>
  );
}
```

## Focus Management

### Managing Focus Programmatically

```typescript
import { useRef } from 'react';
import { View, AccessibilityInfo } from 'react-native';
import { TextInput } from '@react-native-ama/forms';

export function LoginForm() {
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  const handleSubmit = async () => {
    try {
      await login();
    } catch (error) {
      // Return focus to email field on error
      emailRef.current?.focus();
      
      // Announce error to screen reader
      AccessibilityInfo.announceForAccessibility(
        'Login failed. Please check your credentials.'
      );
    }
  };

  return (
    <View>
      <TextInput
        ref={emailRef}
        placeholder="Email"
        accessibilityLabel="Email"
        returnKeyType="next"
        onSubmitEditing={() => passwordRef.current?.focus()}
      />
      <TextInput
        ref={passwordRef}
        placeholder="Password"
        accessibilityLabel="Password"
        secureTextEntry
        returnKeyType="done"
        onSubmitEditing={handleSubmit}
      />
    </View>
  );
}
```

### Focus Indicators

```typescript
import { useState } from 'react';
import { TouchableOpacity, Text } from '@react-native-ama/react-native';

export function FocusableButton({ title, onPress }: ButtonProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <TouchableOpacity
      onPress={onPress}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      style={[
        styles.button,
        isFocused && styles.buttonFocused,
      ]}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <Text>{title}</Text>
    </TouchableOpacity>
  );
}
```

## Alternative Text

### Images

```typescript
import { TouchableOpacity } from '@react-native-ama/react-native';
import { Image } from 'react-native';

// Decorative image (ignored by screen readers)
<Image 
  source={decorativePattern} 
  accessibilityRole="image"
  accessibilityElementsHidden={true}
  importantForAccessibility="no"
/>

// Informative image (announced by screen readers)
<Image 
  source={userAvatar}
  accessibilityRole="image"
  accessibilityLabel={`${user.name}'s profile picture`}
/>

// Actionable image (button with image)
<TouchableOpacity
  accessibilityRole="button"
  accessibilityLabel="Edit profile picture"
  onPress={handleEdit}
>
  <Image source={userAvatar} />
</TouchableOpacity>
```

### Icons

```typescript
import { View } from 'react-native';
import { Text, TouchableOpacity } from '@react-native-ama/react-native';

// Icon with adjacent text (hide icon from screen reader)
<View style={{ flexDirection: 'row' }}>
  <Icon 
    name="check" 
    accessibilityElementsHidden={true}
  />
  <Text>Completed</Text>
</View>

// Icon-only (provide label)
<Icon 
  name="settings" 
  accessibilityLabel="Settings"
  accessibilityRole="image"
/>

// Icon button (label describes action)
<TouchableOpacity
  accessibilityRole="button"
  accessibilityLabel="Open settings"
>
  <Icon name="settings" accessibilityElementsHidden={true} />
</TouchableOpacity>
```

## Forms and Input

### Labels and Instructions

```typescript
import { View } from 'react-native';
import { Text } from '@react-native-ama/react-native';
import { TextInput } from '@react-native-ama/forms';

export function FormField({ label, hint, error, ...inputProps }: FormFieldProps) {
  const inputId = useId();

  const labelComponent = (
    <Text style={styles.label}>
      {label}
      {inputProps.required && (
        <Text style={styles.required}>{' *'}</Text>
      )}
    </Text>
  );

  const errorComponent = error ? (
    <Text 
      accessibilityRole="alert"
      style={styles.error}
    >
      {error}
    </Text>
  ) : undefined;

  return (
    <View>
      <TextInput
        {...inputProps}
        accessibilityLabel={label}
        accessibilityHint={hint}
        accessibilityRequired={inputProps.required}
        accessibilityInvalid={!!error}
        style={[styles.input, error && styles.inputError]}
        labelComponent={labelComponent}
        errorComponent={errorComponent}
        hasValidation={!!error}
      />
      
      {hint && !error && (
        <Text style={styles.hint}>
          {hint}
        </Text>
      )}
    </View>
  );
}
```

**Note**: React Native AMA's `TextInput` component supports `labelComponent` and `errorComponent` props for better accessibility integration. These props allow you to pass React elements that will be properly associated with the input for screen readers.

### Error Handling

```typescript
import { AccessibilityInfo } from 'react-native';
import { TouchableOpacity, Text } from '@react-native-ama/react-native';

export function SubmitButton({ onSubmit, errors }: SubmitButtonProps) {
  const handlePress = () => {
    const errorMessages = Object.values(errors).filter(Boolean);
    
    if (errorMessages.length > 0) {
      // Announce errors to screen reader
      AccessibilityInfo.announceForAccessibility(
        `Form has ${errorMessages.length} error${errorMessages.length > 1 ? 's' : ''}. ${errorMessages[0]}`
      );
      return;
    }
    
    onSubmit();
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel="Submit form"
      accessibilityState={{ disabled: Object.keys(errors).length > 0 }}
    >
      <Text>Submit</Text>
    </TouchableOpacity>
  );
}
```

## Motion and Animation

### Respect User Preferences

```typescript
import { AccessibilityInfo } from 'react-native';
import { useEffect, useState } from 'react';

export function useReducedMotion(): boolean {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    // Check initial state
    AccessibilityInfo.isReduceMotionEnabled().then(setReducedMotion);

    // Listen for changes
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReducedMotion
    );

    return () => subscription.remove();
  }, []);

  return reducedMotion;
}
```

### Conditional Animations

```typescript
import { Animated } from 'react-native';

export function AnimatedCard({ children }: AnimatedCardProps) {
  const reducedMotion = useReducedMotion();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reducedMotion) {
      // No animation, just show
      fadeAnim.setValue(1);
    } else {
      // Fade in animation
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [reducedMotion]);

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      {children}
    </Animated.View>
  );
}
```

## Testing Accessibility

### Manual Testing with Screen Readers

**iOS - VoiceOver**:

1. Settings → Accessibility → VoiceOver → On
2. Triple-click home button to toggle
3. Swipe right/left to navigate
4. Double-tap to activate

**Android - TalkBack**:

1. Settings → Accessibility → TalkBack → On
2. Volume up + down to toggle
3. Swipe right/left to navigate
4. Double-tap to activate

### Automated Testing

```typescript
// __tests__/Button.a11y.test.tsx
import { render } from '@testing-library/react-native';
import { Button } from '../Button';

describe('Button Accessibility', () => {
  it('should have correct accessibility role', () => {
    const { getByRole } = render(
      <Button title="Click me" onPress={() => {}} />
    );
    
    expect(getByRole('button')).toBeTruthy();
  });

  it('should have accessibility label', () => {
    const { getByLabelText } = render(
      <Button title="Click me" onPress={() => {}} />
    );
    
    expect(getByLabelText('Click me')).toBeTruthy();
  });

  it('should indicate disabled state', () => {
    const { getByRole } = render(
      <Button title="Click me" onPress={() => {}} disabled />
    );
    
    const button = getByRole('button');
    expect(button).toHaveAccessibilityState({ disabled: true });
  });

  it('should have minimum touch target size', () => {
    const { getByRole } = render(
      <Button title="Click me" onPress={() => {}} />
    );
    
    const button = getByRole('button');
    const style = button.props.style;
    
    expect(style.minHeight).toBeGreaterThanOrEqual(44);
    expect(style.minWidth).toBeGreaterThanOrEqual(44);
  });
});
```

### Accessibility Audit Checklist

```typescript
// utils/accessibility-audit.ts

export interface AccessibilityAudit {
  passed: boolean;
  issues: string[];
  warnings: string[];
}

export function auditComponent(component: React.ReactElement): AccessibilityAudit {
  const issues: string[] = [];
  const warnings: string[] = [];

  // Check for minimum touch target size
  // Check for color contrast
  // Check for accessibility labels
  // Check for accessibility roles
  // Check for keyboard navigation support
  // etc.

  return {
    passed: issues.length === 0,
    issues,
    warnings,
  };
}
```

## Platform-Specific Considerations

### iOS Specific

```typescript
import { Platform } from 'react-native';

// iOS-specific accessibility traits
<TouchableOpacity
  accessibilityTraits={Platform.OS === 'ios' ? ['button', 'selected'] : undefined}
>
  <Text>iOS Button</Text>
</TouchableOpacity>
```

### Android Specific

```typescript
// Android-specific accessibility features
<View
  accessibilityLiveRegion="polite" // Android announces changes
  importantForAccessibility="yes"  // Android focus priority
>
  <Text>Dynamic content</Text>
</View>
```

## Common Patterns

### Accessible Card Component

```typescript
import { View, Image, StyleSheet } from 'react-native';
import { TouchableOpacity, Text } from '@react-native-ama/react-native';

export function AccessibleCard({ 
  title, 
  description, 
  onPress,
  image,
}: AccessibleCardProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${description}`}
      accessibilityHint="Double tap to view details"
      style={styles.card}
    >
      {image && (
        <Image 
          source={image} 
          style={styles.image}
          accessibilityElementsHidden={true} // Image is decorative
        />
      )}
      <View style={styles.content}>
        <Text 
          style={styles.title}
          accessibilityRole="header"
        >
          {title}
        </Text>
        <Text style={styles.description}>
          {description}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
```

### Accessible List

```typescript
import { View, FlatList } from 'react-native';
import { Text } from '@react-native-ama/react-native';

export function AccessibleList<T>({ 
  items, 
  renderItem,
  emptyMessage 
}: AccessibleListProps<T>) {
  if (items.length === 0) {
    return (
      <View 
        accessible={true}
        accessibilityRole="text"
        accessibilityLabel={emptyMessage}
      >
        <Text>{emptyMessage}</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={items}
      renderItem={({ item, index }) => renderItem(item, index)}
      keyExtractor={(item, index) => index.toString()}
      accessible={false} // Let individual items be accessible
      accessibilityLabel={`List with ${items.length} items`}
    />
  );
}
```

### Accessible Modal

```typescript
import { useEffect } from 'react';
import { View, Modal, AccessibilityInfo } from 'react-native';
import { Text, TouchableOpacity } from '@react-native-ama/react-native';

export function AccessibleModal({ 
  visible, 
  onClose, 
  title,
  children 
}: AccessibleModalProps) {
  useEffect(() => {
    if (visible) {
      AccessibilityInfo.announceForAccessibility(`${title} dialog opened`);
    }
  }, [visible, title]);

  return (
    <Modal
      visible={visible}
      onRequestClose={onClose}
      transparent
      accessibilityViewIsModal={true} // Focus stays within modal
    >
      <View style={styles.backdrop}>
        <View 
          style={styles.modal}
          accessible={true}
          accessibilityRole="alert"
          accessibilityLabel={title}
        >
          <Text 
            style={styles.title}
            accessibilityRole="header"
          >
            {title}
          </Text>
          
          {children}
          
          <TouchableOpacity
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close dialog"
            style={styles.closeButton}
          >
            <Text>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
```

## Best Practices Summary

### Do's

- ✅ **Use React Native AMA components** - Always prefer components from `@react-native-ama/react-native` and `@react-native-ama/forms` over standard React Native components
- ✅ Test with real screen readers (VoiceOver and TalkBack)
- ✅ Provide meaningful accessibility labels for all interactive elements
- ✅ Ensure minimum 44x44 point touch targets
- ✅ Maintain 4.5:1 contrast ratio for text
- ✅ Support keyboard navigation
- ✅ Provide clear focus indicators
- ✅ Use semantic accessibility roles
- ✅ Respect reduced motion preferences
- ✅ Provide alternative text for images
- ✅ Announce dynamic content changes
- ✅ Group related elements logically
- ✅ Test with diverse user scenarios
- ✅ Review React Native AMA documentation and examples for implementation patterns

### Don'ts

- ❌ **Don't use standard React Native components** - Avoid `react-native` components when React Native AMA alternatives exist
- ❌ Don't rely on color alone to convey information
- ❌ Don't create touch targets smaller than 44x44 points
- ❌ Don't disable accessibility features without good reason
- ❌ Don't nest interactive elements
- ❌ Don't use vague labels like "Click here" or "Learn more"
- ❌ Don't ignore screen reader announcements
- ❌ Don't auto-play animations without user control
- ❌ Don't trap keyboard focus
- ❌ Don't use images of text instead of actual text
- ❌ Don't assume everyone interacts the same way
- ❌ Don't ignore React Native AMA runtime warnings during development

## Resources

- **[React Native AMA Documentation](https://formidable.com/open-source/react-native-ama/)** - Comprehensive accessibility library for React Native applications
- **[React Native AMA GitHub Repository](https://github.com/FormidableLabs/react-native-ama)** - Source code and issues
- **[React Native AMA NPM Packages](https://www.npmjs.com/package/@react-native-ama/core)** - Package information
- [React Native Accessibility](https://reactnative.dev/docs/accessibility) - React Native's built-in accessibility features
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/) - Web Content Accessibility Guidelines
- [Apple Human Interface Guidelines - Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility) - iOS accessibility guidelines
- [Material Design - Accessibility](https://material.io/design/usability/accessibility.html) - Android accessibility guidelines

### Tools

- [Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Color Oracle](https://colororacle.org/) - Color blindness simulator
- [axe DevTools](https://www.deque.com/axe/devtools/) - Accessibility testing
- [WAVE](https://wave.webaim.org/) - Web accessibility evaluation tool

### Testing

- iOS VoiceOver
- Android TalkBack
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)

## Next Steps

- Read [Styling Pattern](./styling-pattern.md) for implementing accessible styles
- Read [Component Architecture](./component-architecture.md) for building accessible components
- Read [Testing Strategy](./testing/) for accessibility testing approaches
- Review [Types and Configuration](./types-and-configuration.md) for accessibility types
