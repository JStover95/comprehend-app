# Quickstart: Mobile App Base Structure

**Date**: 2025-12-23  
**Feature**: 003-mobile-app-base-structure  
**Status**: Implementation Guide

## Overview

This guide provides step-by-step instructions for implementing the mobile app base structure, including theme system, base components, navigation, and environment configuration.

## Prerequisites

- Node.js 22+ installed
- Expo CLI installed: `npm install -g expo-cli`
- iOS Simulator (for macOS) or Android Emulator
- Git repository with feature branch `003-mobile-app-base-structure`

## Setup Steps

### 1. Install Dependencies

```bash
cd comprehend
npm install
```

**New Dependencies to Add**:

```bash
npm install @react-native-async-storage/async-storage
npm install @react-native-ama/core
npm install --save-dev wcag-color
```

**Note**: `react-native-reanimated` and `react-native-gesture-handler` are already installed and required by AMA.

### 2. Configure React Native AMA

After installing `@react-native-ama/core`, the `ama.rules.json` file should be automatically generated in the project root. If not, create it:

```bash
echo "{}" >> ama.rules.json
```

**Configure AMA** (optional):

- Customize log levels and exceptions in `ama.rules.json`
- See AMA documentation for configuration options

**Note**: AMA performs runtime accessibility checks in development mode only. It will:

- Highlight offending components
- Show banners when accessibility issues are detected
- Provide guideline links to fix issues
- NOT run checks in production builds

### 3. Create Theme Constants

Create `comprehend/constants/theme.ts`:

```typescript
// See styling-pattern.md for full implementation
export const Colors = { /* ... */ };
export const Spacing = { /* ... */ };
export const Typography = { /* ... */ };
export const BorderRadius = { /* ... */ };
```

### 4. Create Theme Context

Create `comprehend/contexts/ThemeContext/`:

- `Context.tsx` - Context definition
- `Provider.tsx` - Theme provider with state management
- `use-theme.ts` - Custom hook

Follow patterns from `comprehend/design-docs/context-pattern.md` and `styling-pattern.md`.

### 5. Create Base Components

Create `comprehend/components/ui/`:

- `Button.tsx` - Accessible button component
- `Input.tsx` - Accessible input component
- `Text.tsx` - Themed text component
- `index.ts` - Export all components

Follow patterns from `comprehend/design-docs/component-architecture.md` and `accessibility.md`.

**Key Requirements**:

- Minimum 44x44 point touch targets
- WCAG 2.1 AA contrast ratios
- Proper accessibility props
- Theme-aware styling

### 6. Set Up Navigation

Update `comprehend/app/_layout.tsx`:

```typescript
import { Stack } from 'expo-router';
import { ThemeProvider } from '@/contexts/ThemeContext/Provider';

export default function RootLayout() {
  return (
    <ThemeProvider>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
      </Stack>
    </ThemeProvider>
  );
}
```

Follow patterns from `comprehend/design-docs/navigation-pattern.md`.

### 7. Create Environment Configuration

Create `comprehend/constants/config.ts`:

```typescript
// See types-and-configuration.md for full implementation
export const env = { /* ... */ };
export function validateEnv(): void { /* ... */ }
```

Create `.env.example`:

```env
EXPO_PUBLIC_API_URL=https://api.example.com
EXPO_PUBLIC_AWS_REGION=us-east-1
EXPO_PUBLIC_ENV=development
EXPO_PUBLIC_DEBUG=true
```

### 8. Update Root Layout with Theme

Update `comprehend/app/_layout.tsx` to wrap app with ThemeProvider:

```typescript
import { ThemeProvider } from '@/contexts/ThemeContext/Provider';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/contexts/ThemeContext/use-theme';

function ThemedStatusBar() {
  const { isDark } = useTheme();
  return <StatusBar style={isDark ? 'light' : 'dark'} />;
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <ThemedStatusBar />
      <Stack>
        {/* ... */}
      </Stack>
    </ThemeProvider>
  );
}
```

## Testing Setup

### 1. Configure Jest for React Native AMA

Add the following mock to your Jest setup file (configured via `jest.setup.js` or `jest.config.js`):

```javascript
jest.mock('@react-native-ama/internal/dist/utils/logger.js', () => {
  return {
    getContrastCheckerMaxDepth: () => 5,
    shouldIgnoreContrastCheckForDisabledElement: () => true,
  };
});
```

### 2. Create Component Tests

Create test files for each component:

- `comprehend/__tests__/components/ui/Button.test.tsx`
- `comprehend/__tests__/components/ui/Input.test.tsx`
- `comprehend/__tests__/components/ui/Text.test.tsx`

Follow patterns from `comprehend/design-docs/testing/unit-testing.md`.

### 3. Create Theme Context Tests

Create test file:

- `comprehend/__tests__/contexts/ThemeContext.test.tsx`

Test:

- Theme state management
- System preference detection
- AsyncStorage persistence
- Theme switching

### 4. Accessibility Testing

**Development Testing with AMA**:

- Run the app in development mode
- AMA will automatically check components for accessibility issues
- Watch for AMA banners and console warnings
- Fix issues as they are detected

**Manual Testing**:

For each component, test:

- Touch target sizes (≥44x44 points)
- Color contrast ratios
- Screen reader compatibility
- Keyboard navigation

Use React Native Testing Library's accessibility queries.

## Implementation Checklist

### Theme System

- [ ] Create theme constants (`constants/theme.ts`)
- [ ] Create ThemeContext (`contexts/ThemeContext/`)
- [ ] Implement theme provider with AsyncStorage persistence
- [ ] Add system color scheme detection
- [ ] Test theme switching
- [ ] Verify contrast ratios meet WCAG AA

### Base Components

- [ ] Create Button component with accessibility props
- [ ] Create Input component with labels and error states
- [ ] Create Text component with typography scales
- [ ] Add unit tests for all components
- [ ] Test accessibility with VoiceOver/TalkBack
- [ ] Verify touch target sizes

### Navigation

- [ ] Update root layout with ThemeProvider
- [ ] Set up file-based routing structure
- [ ] Configure deep linking (if needed)
- [ ] Test navigation flows

### Environment Configuration

- [ ] Create config module (`constants/config.ts`)
- [ ] Set up environment variable validation
- [ ] Create `.env.example` file
- [ ] Test configuration loading

### React Native AMA Setup

- [ ] Install `@react-native-ama/core` package
- [ ] Verify `ama.rules.json` file is generated
- [ ] Configure AMA rules if needed (optional)
- [ ] Add Jest mocks for AMA
- [ ] Test AMA accessibility checks in development mode

### Testing

- [ ] Write unit tests for all components (>80% coverage)
- [ ] Write tests for theme context
- [ ] Test accessibility requirements
- [ ] Run ESLint with accessibility rules

## Verification

### Manual Testing

1. **Theme Switching**:
   - Change theme in app
   - Verify colors update immediately
   - Restart app and verify preference persists
   - Change system theme and verify app responds (if using 'system')

2. **Accessibility**:
   - Enable VoiceOver (iOS) or TalkBack (Android)
   - Navigate through app using screen reader
   - Verify all interactive elements are announced
   - Check touch target sizes visually

3. **Components**:
   - Use Button, Input, Text components in a test screen
   - Verify theme colors are applied
   - Test error states
   - Verify disabled states

### Automated Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run ESLint
npm run lint

# Type check
npx tsc --noEmit
```

## Next Steps

After completing this base structure:

1. **Phase 1: Authentication** - Add authentication screens and services
2. **Phase 2: Core Data Models** - Add domain entities and API integration
3. **Phase 4: Reader Screen** - Build main content display features

## Troubleshooting

### Theme not persisting

- Check AsyncStorage permissions
- Verify theme key is correct (`@theme`)
- Check for errors in console

### Accessibility warnings

- Check AMA banners and console warnings in development mode
- Review AMA guideline links for specific issues
- Verify component accessibility props are correct
- Check contrast ratios (AMA will highlight contrast issues)
- Note: AMA only runs in development, not production

### Environment variables not loading

- Ensure variables are prefixed with `EXPO_PUBLIC_`
- Restart Expo development server after adding variables
- Check `.env` file is in correct location

## Resources

- [Accessibility Guidelines](./../../comprehend/design-docs/accessibility.md)
- [Component Architecture](./../../comprehend/design-docs/component-architecture.md)
- [Navigation Pattern](./../../comprehend/design-docs/navigation-pattern.md)
- [Styling Pattern](./../../comprehend/design-docs/styling-pattern.md)
- [Types and Configuration](./../../comprehend/design-docs/types-and-configuration.md)
- [Context Pattern](./../../comprehend/design-docs/context-pattern.md)
