# Data Model: Mobile App Base Structure

**Date**: 2025-12-23  
**Feature**: 003-mobile-app-base-structure  
**Status**: Complete

## Overview

This feature establishes the foundational structure for the mobile application. The data model focuses on configuration entities and theme state management rather than domain entities (which will be added in later phases).

## Entities

### Theme

**Purpose**: Represents the visual styling system including colors, typography, and spacing.

**Properties**:

- `mode`: `'light' | 'dark' | 'system'` - User's theme preference
- `colors`: `ThemeColors` - Color palette for current theme
- `isDark`: `boolean` - Computed property indicating if dark mode is active
- `typography`: `Typography` - Typography scale (font sizes, weights, line heights)
- `spacing`: `Spacing` - Spacing scale (xs, sm, md, lg, xl, xxl)
- `borderRadius`: `BorderRadius` - Border radius scale

**State Management**:

- Managed via `ThemeContext` using Context API pattern
- Persisted in AsyncStorage with key `@theme`
- System preference detected via `useColorScheme` hook

**Validation Rules**:

- Theme mode must be one of: 'light', 'dark', 'system'
- All colors must meet WCAG 2.1 AA contrast requirements (enforced by React Native AMA in development):
  - Normal text: 4.5:1 minimum
  - Large text: 3:1 minimum
  - UI components: 3:1 minimum

**State Transitions**:

- Initial state: Load from AsyncStorage or default to 'system'
- User changes theme: Update state and persist to AsyncStorage
- System preference changes: Update if mode is 'system'

---

### ThemeColors

**Purpose**: Color palette for a theme variant (light or dark).

**Properties**:

- `primary`: `string` - Primary brand color
- `secondary`: `string` - Secondary brand color
- `background`: `string` - Main background color
- `surface`: `string` - Surface/card background color
- `text`: `string` - Primary text color
- `textSecondary`: `string` - Secondary text color
- `textTertiary`: `string` - Tertiary text color
- `border`: `string` - Border color
- `error`: `string` - Error state color
- `success`: `string` - Success state color
- `warning`: `string` - Warning state color
- `info`: `string` - Info state color

**Validation Rules**:

- All colors must be valid hex color strings
- Text colors must have sufficient contrast against background colors (enforced by React Native AMA in development)
- Error, success, warning, info colors must be distinguishable without relying on color alone

---

### Typography

**Purpose**: Typography scale for consistent text styling.

**Properties**:

- `fontSize`: Object with keys: `xs`, `sm`, `md`, `lg`, `xl`, `xxl`
- `fontWeight`: Object with keys: `regular`, `medium`, `semibold`, `bold`
- `lineHeight`: Object with keys: `tight`, `normal`, `loose`

**Validation Rules**:

- Font sizes must be positive numbers
- Font weights must be valid CSS font-weight values
- Line heights must be positive numbers or ratios

---

### Spacing

**Purpose**: Spacing scale for consistent layout spacing.

**Properties**:

- `xs`: `4` - Extra small spacing
- `sm`: `8` - Small spacing
- `md`: `16` - Medium spacing
- `lg`: `24` - Large spacing
- `xl`: `32` - Extra large spacing
- `xxl`: `48` - Extra extra large spacing

**Validation Rules**:

- All spacing values must be positive numbers
- Values should follow a consistent scale (typically 4px or 8px base)

---

### BorderRadius

**Purpose**: Border radius scale for consistent rounded corners.

**Properties**:

- `sm`: `4` - Small radius
- `md`: `8` - Medium radius
- `lg`: `12` - Large radius
- `xl`: `16` - Extra large radius
- `full`: `9999` - Full circle/pill shape

**Validation Rules**:

- All radius values must be non-negative numbers

---

### EnvironmentConfig

**Purpose**: Environment-specific configuration for the application.

**Properties**:

- `environment`: `'development' | 'staging' | 'production'` - Current environment
- `apiUrl`: `string` - API Gateway endpoint URL
- `region`: `string` - AWS region
- `userPoolId`: `string` - Cognito User Pool ID (future)
- `identityPoolId`: `string` - Cognito Identity Pool ID (future)
- `logLevel`: `'debug' | 'info' | 'warn' | 'error'` - Logging level
- `enableAnalytics`: `boolean` - Whether analytics is enabled
- `debugMode`: `boolean` - Whether debug features are enabled

**Validation Rules**:

- Environment must be one of: 'development', 'staging', 'production'
- API URL must be a valid URL
- Region must be a valid AWS region
- All required fields must be present (validated on app startup)

**State Management**:

- Loaded from environment variables at build time
- Immutable after app initialization
- Accessed via typed configuration object

---

### BaseComponentProps

**Purpose**: Common props shared by all base UI components.

**Properties**:

- `testID`: `string | undefined` - Test identifier for testing
- `style`: `StyleProp<ViewStyle | TextStyle>` - Custom style override
- `disabled`: `boolean | undefined` - Whether component is disabled
- `accessibilityLabel`: `string | undefined` - Accessibility label for screen readers
- `accessibilityHint`: `string | undefined` - Accessibility hint
- `accessibilityRole`: `AccessibilityRole | undefined` - Accessibility role

**Validation Rules**:

- testID should be unique within a screen
- accessibilityLabel is required for interactive components
- accessibilityRole should match component's semantic purpose

---

## Relationships

### Theme → ThemeColors

- **Type**: One-to-one
- **Description**: Each theme has one set of colors (light or dark)
- **Implementation**: Colors are selected based on `isDark` computed property

### Theme → Typography

- **Type**: One-to-one
- **Description**: Theme includes typography scale
- **Implementation**: Typography is constant across themes (not theme-dependent)

### Theme → Spacing

- **Type**: One-to-one
- **Description**: Theme includes spacing scale
- **Implementation**: Spacing is constant across themes (not theme-dependent)

### Theme → BorderRadius

- **Type**: One-to-one
- **Description**: Theme includes border radius scale
- **Implementation**: Border radius is constant across themes (not theme-dependent)

### BaseComponentProps → Theme

- **Type**: Many-to-one (implicit)
- **Description**: All base components use theme for styling
- **Implementation**: Components access theme via `useTheme()` hook

---

## State Management Patterns

### ThemeContext Pattern

Following `comprehend/design-docs/context-pattern.md`:

1. **Context Definition** (`ThemeContext/Context.tsx`):
   - Defines `ThemeContextValue` interface
   - Creates context with `createContext`

2. **Provider** (`ThemeContext/Provider.tsx`):
   - Manages theme state
   - Handles persistence to AsyncStorage
   - Detects system color scheme
   - Provides theme value to children

3. **Hook** (`ThemeContext/use-theme.ts`):
   - Custom hook to access theme context
   - Throws error if used outside provider

---

## Data Flow

### Theme Initialization

```plaintext
App Start → Load theme from AsyncStorage → If not found, use 'system' → 
Detect system color scheme → Compute isDark → Select colors → 
Provide to ThemeContext
```

### Theme Change

```plaintext
User selects theme → Update state → Persist to AsyncStorage → 
Recompute isDark → Select new colors → Update context → 
Components re-render with new theme
```

### Component Theming

```plaintext
Component renders → useTheme() hook → Access theme from context → 
Apply theme colors/styles → Render with themed styles
```

---

## Configuration Validation

- `validateEnvironmentConfig(config: EnvironmentConfig): ValidationResult` - Validates environment configuration structure and required fields
- `validateRequiredEnvVars(): void` - Validates that all required environment variables are present at app startup

---

## Storage

### AsyncStorage Keys

- `@theme`: Stores user's theme preference ('light' | 'dark' | 'system')

### Environment Variables

- `EXPO_PUBLIC_API_URL`: API endpoint URL
- `EXPO_PUBLIC_AWS_REGION`: AWS region
- `EXPO_PUBLIC_ENV`: Environment name (development | staging | production)
- `EXPO_PUBLIC_DEBUG`: Debug mode flag
- Future: `EXPO_PUBLIC_USER_POOL_ID`, `EXPO_PUBLIC_IDENTITY_POOL_ID`

---

## Future Extensions

This data model will be extended in future phases with:

- User entity (Phase 1: Authentication)
- Exercise entity (Phase 2: Core Data Models)
- Token entity (Phase 2: Core Data Models)
- Vocab entity (Phase 2: Core Data Models)
- ChatMessage entity (Phase 2: Core Data Models)
