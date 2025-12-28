# Research: Mobile App Base Structure

**Date**: 2025-12-23  
**Feature**: 003-mobile-app-base-structure  
**Status**: Complete

## Research Tasks

### 1. React Native AMA Library for Runtime Accessibility Enforcement

**Question**: What is the exact package name and installation process for React Native AMA that enforces accessibility standards?

**Research Findings**:

- **React Native AMA** is a library from NearForm (<https://nearform.com/open-source/react-native-ama/>)
- Package namespace: `@react-native-ama` (family of packages)
- Core package: `@react-native-ama/core` (required, must be installed first)
- **Runtime Dev Tooling**: Performs accessibility checks during app runtime in development mode
- **Production**: Does NOT perform accessibility checks on production builds (dev-only)
- Provides:
  1. Components and hooks to enforce minimum accessibility requirements
  2. Extensive guidelines for manual testing
  3. Checklist for accessibility features/components
- Dependencies: `react-native-reanimated`, `react-native-gesture-handler`, `wcag-color` (dev)
- Config: Generates `ama.rules.json` file automatically (can customize log levels and exceptions)
- Jest: Requires mocks for testing (see documentation)

**Decision**:

- **Primary Approach**: Install `@react-native-ama/core` package for runtime accessibility checks during development
- **Development Enforcement**: AMA will highlight offending components, show banners, and provide guideline links when accessibility issues are detected
- **Production**: AMA checks are disabled in production builds automatically
- **Additional Packages**: Install other `@react-native-ama/*` packages as needed for specific features
- **Dependencies**: Ensure `react-native-reanimated` and `react-native-gesture-handler` are installed (already in project)
- **Jest Setup**: Add required mocks to jest setup file

**Rationale**:

- React Native AMA provides runtime accessibility checking during development, catching issues early
- It integrates seamlessly with React Native's built-in accessibility features
- The library is actively maintained by NearForm and provides comprehensive tooling
- Production builds are not affected (checks only run in dev)
- Provides visual feedback and guidelines, making it easier to fix accessibility issues

**Alternatives Considered**:

- Using only ESLint rules - rejected because AMA provides runtime visual feedback and comprehensive guidelines
- Using only React Native built-in features - rejected because AMA adds valuable development-time tooling
- Custom validation utilities - rejected because AMA provides proven, tested accessibility checking

**Implementation Notes**:

- Install `@react-native-ama/core` package
- Wrap app with AMA provider (if required by the package)
- Configure `ama.rules.json` for custom log levels/exceptions
- Add Jest mocks for testing
- Use AMA components/hooks where applicable
- Note: AMA checks run at runtime in development, not at build time

---

### 2. Theme System Implementation Pattern

**Question**: What is the best pattern for implementing a theme system in React Native Expo that supports light/dark modes and system preferences?

**Research Findings**:

- Design doc `styling-pattern.md` provides comprehensive theme implementation patterns
- Context API pattern is recommended for theme management
- `useColorScheme` hook from React Native detects system preferences
- AsyncStorage for persisting user theme preferences
- Theme should be applied at the root level via Provider

**Decision**:

- Use Context API pattern following `comprehend/design-docs/styling-pattern.md`
- Implement `ThemeContext` with Provider pattern
- Support three theme modes: 'light', 'dark', 'system'
- Use `useColorScheme` to detect system preferences
- Persist user preference in AsyncStorage
- Provide theme colors, typography, and spacing constants

**Rationale**:

- Follows established design patterns in the project
- Context API provides clean state management
- System preference detection is built into React Native
- AsyncStorage provides simple persistence

**Alternatives Considered**:

- Redux for theme management - rejected because Context API is simpler for this use case
- Styled-components with theme provider - rejected because StyleSheet is the project standard
- External theme library - rejected because custom implementation provides better control

---

### 3. Expo Router File-Based Routing Structure

**Question**: What is the recommended file structure for Expo Router navigation with tabs, stacks, and modals?

**Research Findings**:

- Design doc `navigation-pattern.md` provides comprehensive Expo Router patterns
- File-based routing uses directory structure to define routes
- Route groups use parentheses: `(tabs)/`, `(auth)/`
- Dynamic routes use square brackets: `[id].tsx`
- Layout files (`_layout.tsx`) define navigation structure

**Decision**:

- Follow `comprehend/design-docs/navigation-pattern.md` patterns
- Use route groups for logical organization
- Implement root layout with Stack navigator
- Create tab layout structure for future tab navigation
- Support deep linking configuration

**Rationale**:

- Design doc provides proven patterns
- File-based routing is type-safe and intuitive
- Route groups organize screens logically
- Deep linking support is built-in

**Alternatives Considered**:

- React Navigation directly - rejected because Expo Router provides better integration
- Manual route configuration - rejected because file-based routing is more maintainable

---

### 4. Environment Configuration for Expo

**Question**: How should environment-specific configuration be managed in Expo applications?

**Research Findings**:

- Design doc `types-and-configuration.md` provides configuration patterns
- Expo uses `EXPO_PUBLIC_*` prefix for environment variables
- Configuration is determined at build time, not runtime
- `.env` files for different environments
- `expo-constants` for accessing environment variables

**Decision**:

- Follow `comprehend/design-docs/types-and-configuration.md` patterns
- Use `EXPO_PUBLIC_*` prefix for environment variables
- Create `.env.development`, `.env.staging`, `.env.production` files
- Use `expo-constants` to access configuration
- Validate required environment variables on app startup
- Create typed configuration object

**Rationale**:

- Follows Expo best practices
- Build-time configuration is more secure
- TypeScript types ensure type safety
- Validation prevents runtime errors

**Alternatives Considered**:

- Runtime configuration switching - rejected because spec requires build-time configuration
- Hardcoded configuration - rejected because it doesn't support multiple environments
- External configuration service - rejected because it adds unnecessary complexity

---

### 5. Base Component Accessibility Requirements

**Question**: What are the specific accessibility requirements for Button, Input, and Text components?

**Research Findings**:

- Design doc `accessibility.md` provides comprehensive accessibility guidelines
- WCAG 2.1 Level AA compliance required
- Minimum touch target: 44x44 points
- Color contrast: 4.5:1 for normal text, 3:1 for large text
- Screen reader support via `accessibilityProps`
- Don't rely on color alone

**Decision**:

- Follow all requirements from `comprehend/design-docs/accessibility.md`
- Button: 44x44 minimum touch target, proper `accessibilityRole`, `accessibilityLabel`
- Input: Proper labels, error states with text indicators, `accessibilityDescribedBy` for hints/errors
- Text: Theme-aware colors with sufficient contrast, support for Dynamic Type (iOS)
- All components: Test with VoiceOver and TalkBack

**Rationale**:

- Design doc provides detailed requirements
- WCAG compliance is mandatory per constitution
- Accessibility must be built-in from the start

**Alternatives Considered**:

- Minimal accessibility - rejected because it violates constitution
- Accessibility as optional feature - rejected because it's non-negotiable

---

## Summary

All research tasks completed. Key decisions:

1. **Accessibility**: Use React Native AMA (@react-native-ama/core) for runtime accessibility checks in development + React Native built-in accessibility features. AMA provides visual feedback, highlights issues, and provides guidelines. Checks only run in development mode, not production.
2. **Theme**: Context API pattern following styling-pattern.md
3. **Navigation**: Expo Router file-based routing following navigation-pattern.md
4. **Configuration**: Expo environment variables following types-and-configuration.md
5. **Components**: WCAG 2.1 AA compliance following accessibility.md, with AMA providing development-time enforcement

All decisions align with project design documentation and constitutional requirements.
