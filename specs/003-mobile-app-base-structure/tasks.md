# Tasks: Mobile App Base Structure

**Feature**: 003-mobile-app-base-structure  
**Date**: 2025-12-23  
**Status**: Ready for Implementation

## Overview

This document breaks down the implementation plan into actionable, dependency-ordered tasks. Tasks are organized by user story to enable independent implementation and testing. Each task follows a strict checklist format with Task IDs, parallelization markers, and story labels.

**Total Tasks**: 48  
**User Stories**: 4 (P1, P2, P2, P3)  
**MVP Scope**: User Story 1 (Theme System) - 14 tasks

## Dependencies

### User Story Completion Order

1. **User Story 1 (P1)**: Theme System - Foundation for all visual components
2. **User Story 2 (P2)**: Base Components - Depends on Theme System (US1)
3. **User Story 3 (P2)**: Navigation - Can be implemented in parallel with US2 after US1
4. **User Story 4 (P3)**: Environment Configuration - Can be implemented independently

### Parallel Execution Opportunities

- **US2 and US3**: Can be implemented in parallel after US1 is complete
- **US4**: Can be implemented independently at any time
- Within each story: Mock creation, test writing, and some implementation tasks can be parallelized

## Implementation Strategy

**MVP Approach**: Implement User Story 1 (Theme System) first to establish the visual foundation. This delivers a cohesive, accessible visual experience that all subsequent features will build upon.

**Incremental Delivery**: Each user story is independently testable and can be demonstrated separately:

- US1: Theme switching and contrast verification
- US2: Component showcase screen with all base components
- US3: Multi-screen navigation demo
- US4: Environment configuration verification

## Phase 1: Setup

**Goal**: Initialize project structure and install dependencies

**Design Document References**:

- `comprehend/design-docs/testing/setup.md` - Jest and React Native Testing Library configuration
- `comprehend/design-docs/testing/unit-testing.md` - Jest mocks, test ID patterns

**Mocks**: N/A

**Tests**: N/A

**Implementation**:

- [X] T001 Install required dependencies: @react-native-async-storage/async-storage, @react-native-ama/core, wcag-color (dev) in comprehend/package.json
- [X] T002 Configure React Native AMA by verifying ama.rules.json is generated in comprehend/ directory
- [X] T003 Add Jest mocks for React Native AMA in comprehend/jest.setup.js following testing patterns from comprehend/design-docs/testing/unit-testing.md
- [X] T004 Create project directory structure: comprehend/constants/, comprehend/contexts/ThemeContext/, comprehend/components/ui/, comprehend/types/ following plan.md structure
- [X] T005 Create comprehend/components/components.ids.ts file for test ID constants following comprehend/design-docs/testing/unit-testing.md Test ID Pattern

## Phase 2: Foundational

**Goal**: Establish shared types and constants needed across all user stories

**Design Document References**:

- `comprehend/design-docs/types-and-configuration.md` - TypeScript patterns, type definitions
- `comprehend/design-docs/styling-pattern.md` - Theme constants, color and typography definitions

**Mocks**: N/A

**Tests**: N/A

**Implementation**:

- [X] T006 Create comprehend/types/index.ts with shared type definitions (BaseComponentProps, ThemeMode, etc.) following comprehend/design-docs/types-and-configuration.md
- [X] T007 Create comprehend/constants/theme.ts with Colors, Typography, Spacing, BorderRadius constants following comprehend/design-docs/styling-pattern.md

## Phase 3: User Story 1 - Consistent Visual Experience (P1)

**Goal**: Implement theme system with light/dark modes, system preference detection, and WCAG 2.1 AA compliance

**Design Document References**:

- `comprehend/design-docs/context-pattern.md` - Context API pattern, Provider implementation, custom hooks
- `comprehend/design-docs/styling-pattern.md` - Theme system, StyleSheet patterns, dark mode support
- `comprehend/design-docs/navigation-pattern.md` - Root layout configuration, ThemedStatusBar
- `comprehend/design-docs/testing/unit-testing.md` - Mock provider pattern, hook testing, test ID patterns
- `comprehend/design-docs/accessibility.md` - WCAG 2.1 AA compliance, contrast ratios, color accessibility

**Independent Test Criteria**: All screens use theme colors, text meets contrast requirements (4.5:1 for normal text, 3:1 for large text), app responds to system dark mode preferences, and theme preference persists across app restarts.

**Mocks**:

- [X] T008 [P] [US1] Create comprehend/contexts/ThemeContext/**tests**/ThemeContext.mock.tsx with createMockThemeValue() and MockThemeProvider following comprehend/design-docs/testing/unit-testing.md Mock Provider Pattern

**Tests**:

- [X] T009 [P] [US1] Create comprehend/**tests**/contexts/ThemeContext.test.tsx testing theme state management, system preference detection, AsyncStorage persistence, and theme switching following comprehend/design-docs/testing/unit-testing.md
- [X] T010 [P] [US1] Create comprehend/**tests**/hooks/use-theme.test.tsx testing useTheme hook with MockThemeProvider following comprehend/design-docs/testing/unit-testing.md Hook Testing

**Implementation**:

- [X] T011 [US1] Create comprehend/contexts/ThemeContext/Context.tsx defining ThemeContextValue interface with state (mode, colors, isDark, typography, spacing, borderRadius) and actions (setTheme) following comprehend/design-docs/context-pattern.md
- [X] T012 [US1] Create comprehend/contexts/ThemeContext/Provider.tsx implementing ThemeProvider with AsyncStorage persistence, system color scheme detection via useColorScheme, and theme state management following comprehend/design-docs/context-pattern.md and comprehend/design-docs/styling-pattern.md
- [X] T013 [US1] Create comprehend/contexts/ThemeContext/use-theme.ts custom hook with error handling for use outside provider following comprehend/design-docs/context-pattern.md Custom Hooks
- [X] T014 [US1] Update comprehend/app/_layout.tsx to wrap app with ThemeProvider and implement ThemedStatusBar component following comprehend/design-docs/navigation-pattern.md and comprehend/design-docs/styling-pattern.md
- [X] T015 [US1] Update comprehend/app/index.tsx to demonstrate theme switching with buttons for light/dark/system modes and verify theme colors are applied correctly

## Phase 4: User Story 2 - Reusable Interactive Components (P2)

**Goal**: Create accessible base components (Button, Input, Text) that are themed, reusable, and meet WCAG 2.1 AA standards

**Design Document References**:

- `comprehend/design-docs/component-architecture.md` - Component organization, props patterns, test IDs
- `comprehend/design-docs/accessibility.md` - WCAG 2.1 AA requirements, touch targets, screen reader support, contrast ratios
- `comprehend/design-docs/styling-pattern.md` - Theme-aware styling, StyleSheet patterns
- `comprehend/design-docs/testing/unit-testing.md` - Component testing patterns, test ID usage

**Independent Test Criteria**: All base components meet accessibility standards (touch targets ≥44x44 points, proper labels, contrast ratios), respond to theme changes, and function correctly with screen readers.

**Mocks**: N/A

**Tests**:

- [X] T016 [US2] Define test IDs in comprehend/components/components.ids.ts for Button, Input, and Text components (BUTTON_IDS, INPUT_IDS, TEXT_IDS) following comprehend/design-docs/testing/unit-testing.md Test ID Pattern
- [X] T017 [P] [US2] Create comprehend/**tests**/components/ui/Button.test.tsx testing accessibility props, touch target size, theme colors, disabled state, and onPress handler following comprehend/design-docs/testing/unit-testing.md and comprehend/design-docs/accessibility.md
- [X] T018 [P] [US2] Create comprehend/**tests**/components/ui/Input.test.tsx testing labels, error states, accessibility props, theme colors, and value changes following comprehend/design-docs/testing/unit-testing.md and comprehend/design-docs/accessibility.md
- [X] T019 [P] [US2] Create comprehend/**tests**/components/ui/Text.test.tsx testing typography scales, theme colors, contrast ratios, and accessibility props following comprehend/design-docs/testing/unit-testing.md and comprehend/design-docs/accessibility.md

**Implementation**:

- [X] T020 [US2] Create comprehend/components/ui/Button.tsx with minimum 44x44 touch target, accessibility props (accessibilityRole, accessibilityLabel), theme-aware styling, and test IDs following comprehend/design-docs/component-architecture.md and comprehend/design-docs/accessibility.md
- [X] T021 [US2] Create comprehend/components/ui/Input.tsx with proper labels, error states (text indicators in addition to color), accessibility props, theme-aware styling, and test IDs following comprehend/design-docs/component-architecture.md and comprehend/design-docs/accessibility.md
- [X] T022 [US2] Create comprehend/components/ui/Text.tsx with typography scales (headings, body, captions), theme-aware colors, Dynamic Type support (iOS), and test IDs following comprehend/design-docs/component-architecture.md and comprehend/design-docs/accessibility.md
- [X] T023 [US2] Create comprehend/components/ui/index.ts exporting all base components (Button, Input, Text)
- [X] T024 [US2] Update comprehend/app/index.tsx to showcase all base components (Button variants, Input with error states, Text typography scales) and verify theme integration

## Phase 5: User Story 3 - Navigate Between App Sections (P2)

**Goal**: Set up file-based navigation structure using Expo Router with support for tabs, stacks, and deep linking

**Design Document References**:

- `comprehend/design-docs/navigation-pattern.md` - Expo Router file-based routing, Stack and Tab navigators, deep linking configuration
- `comprehend/design-docs/testing/integration-testing.md` - Navigation testing patterns, screen navigation tests
- `comprehend/design-docs/accessibility.md` - Navigation accessibility, screen reader support for navigation elements

**Independent Test Criteria**: Users can navigate between screens, navigation state persists correctly, deep links work as expected, and navigation elements are accessible with screen readers.

**Mocks**: N/A

**Tests**:

- [ ] T025 [P] [US3] Create comprehend/**tests**/navigation/navigation.test.tsx testing screen navigation, back navigation, and navigation state following comprehend/design-docs/testing/integration-testing.md patterns
- [ ] T026 [P] [US3] Create comprehend/**tests**/navigation/deep-linking.test.tsx testing deep link navigation with parameters following comprehend/design-docs/navigation-pattern.md

**Implementation**:

- [ ] T027 [US3] Update comprehend/app/_layout.tsx root layout with Stack navigator configuration following comprehend/design-docs/navigation-pattern.md
- [ ] T028 [US3] Create comprehend/app/(tabs)/ directory structure for tab navigation group following comprehend/design-docs/navigation-pattern.md
- [ ] T029 [US3] Create comprehend/app/(tabs)/_layout.tsx with Tab navigator configuration following comprehend/design-docs/navigation-pattern.md
- [ ] T030 [US3] Create comprehend/app/(tabs)/index.tsx as first tab screen demonstrating navigation
- [ ] T031 [US3] Create comprehend/app/(tabs)/profile.tsx as second tab screen for navigation testing
- [ ] T032 [US3] Configure deep linking in comprehend/app.json with scheme and path configuration following comprehend/design-docs/navigation-pattern.md
- [ ] T033 [US3] Update comprehend/app/index.tsx to include navigation examples (navigate to tabs, test deep links) and verify navigation accessibility

## Phase 6: User Story 4 - Environment-Specific Configuration (P3)

**Goal**: Implement environment configuration system that loads settings at build time for different environments (development, staging, production)

**Design Document References**:

- `comprehend/design-docs/types-and-configuration.md` - Environment configuration management, type-safe configuration, validation patterns

**Independent Test Criteria**: App loads correct API endpoints, feature flags, and environment-specific values for each environment. Configuration is validated on app startup.

**Mocks**: N/A

**Tests**:

- [X] T034 [P] [US4] Create comprehend/**tests**/constants/config.test.ts testing environment variable loading, validation, and type safety following comprehend/design-docs/types-and-configuration.md

**Implementation**:

- [X] T035 [US4] Create comprehend/constants/config.ts with EnvironmentConfig type, environment variable loading via expo-constants, and validation function following comprehend/design-docs/types-and-configuration.md
- [X] T036 [US4] Create comprehend/.env.example file with EXPO_PUBLIC_API_URL, EXPO_PUBLIC_AWS_REGION, EXPO_PUBLIC_ENV, EXPO_PUBLIC_DEBUG variables following contracts/README.md
- [X] T037 [US4] Create comprehend/.env.development file with development environment values
- [X] T038 [US4] Create comprehend/.env.staging file with staging environment values (optional, can use .env.example as template)
- [X] T039 [US4] Create comprehend/.env.production file with production environment values (optional, can use .env.example as template)
- [X] T040 [US4] Update comprehend/app/_layout.tsx to call validateEnv() on app startup and handle validation errors gracefully
- [X] T041 [US4] Update comprehend/app/index.tsx to display current environment configuration (for development/debugging purposes)

## Phase 7: Polish & Cross-Cutting Concerns

**Goal**: Finalize implementation, ensure accessibility compliance, and verify all requirements are met

**Design Document References**:

- `comprehend/design-docs/accessibility.md` - WCAG 2.1 AA compliance verification, contrast ratio testing, touch target validation
- `comprehend/design-docs/testing/integration-testing.md` - Integration test patterns for theme and component interactions
- `comprehend/design-docs/testing/unit-testing.md` - Test ID pattern verification

**Mocks**: N/A

**Tests**:

- [X] T042 Create integration test comprehend/**tests**/integration/theme-and-components.test.tsx verifying theme system works with all base components following comprehend/design-docs/testing/integration-testing.md
- [X] T043 Create accessibility test suite comprehend/**tests**/accessibility/contrast.test.ts verifying all theme colors meet WCAG 2.1 AA contrast requirements (4.5:1 normal text, 3:1 large text) following comprehend/design-docs/accessibility.md
- [X] T048 [US1] Create comprehend/**tests**/contexts/ThemeContext.system-change.test.tsx testing that app responds to system theme changes while running (SC-008) by mocking useColorScheme changes and verifying theme updates propagate correctly

**Implementation**:

- [X] T044 Verify all components use test IDs from comprehend/components/components.ids.ts following comprehend/design-docs/testing/unit-testing.md Test ID Pattern
- [X] T045 Run React Native AMA in development mode and fix any accessibility issues detected following research.md React Native AMA decision
- [X] T046 Verify all touch targets meet minimum 44x44 points requirement following comprehend/design-docs/accessibility.md
- [X] T047 Update comprehend/README.md with setup instructions, environment configuration guide, and testing instructions

## Task Summary by User Story

- **Setup Phase**: 5 tasks
- **Foundational Phase**: 2 tasks
- **User Story 1 (Theme System)**: 9 tasks (1 mock, 3 tests, 5 implementation)
- **User Story 2 (Base Components)**: 9 tasks (0 mocks, 3 tests, 6 implementation)
- **User Story 3 (Navigation)**: 9 tasks (0 mocks, 2 tests, 7 implementation)
- **User Story 4 (Environment Config)**: 8 tasks (0 mocks, 1 test, 7 implementation)
- **Polish Phase**: 6 tasks (0 mocks, 2 tests, 4 implementation)

**Total**: 48 tasks

## Parallel Execution Examples

### User Story 1 (Theme System)

- T008 (Mock) can be done in parallel with T009-T010 (Tests)
- T009 and T010 (Tests) can be written in parallel
- T011-T013 (Context implementation) should be sequential
- T014-T015 (Integration) depends on T011-T013

### User Story 2 (Base Components)

- T016-T018 (Tests) can be written in parallel
- T020-T022 (Component implementation) can be done in parallel after T019 (Test IDs)
- T023-T024 (Integration) depends on T020-T022

### User Story 3 (Navigation)

- T025-T026 (Tests) can be written in parallel
- T027-T032 (Navigation implementation) should be sequential
- T033 (Integration) depends on T027-T032

### User Story 4 (Environment Config)

- T034 (Test) can be written in parallel with T035 (Implementation start)
- T036-T039 (Environment files) can be created in parallel
- T040-T041 (Integration) depends on T035

## Design Document References

All implementation must strictly adhere to the following design documents:

- **Accessibility**: `comprehend/design-docs/accessibility.md` - WCAG 2.1 AA requirements, contrast ratios, touch targets
- **Component Architecture**: `comprehend/design-docs/component-architecture.md` - Component organization, props patterns
- **Context Pattern**: `comprehend/design-docs/context-pattern.md` - Theme context implementation
- **Navigation Pattern**: `comprehend/design-docs/navigation-pattern.md` - Expo Router file-based routing
- **Styling Pattern**: `comprehend/design-docs/styling-pattern.md` - Theme system, StyleSheet patterns
- **Types and Configuration**: `comprehend/design-docs/types-and-configuration.md` - TypeScript patterns, environment config
- **Testing**: `comprehend/design-docs/testing/unit-testing.md` - Test patterns, mock providers, test IDs

## Notes

- All tasks must be completed in dependency order within each phase
- Tasks marked with [P] can be parallelized with other [P] tasks in the same phase
- Tasks marked with [US1], [US2], [US3], [US4] belong to specific user stories
- Test coverage target: >80% for all components and contexts
- Accessibility compliance: WCAG 2.1 Level AA mandatory for all components
- React Native AMA will provide runtime accessibility checking in development mode only
