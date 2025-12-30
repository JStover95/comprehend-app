# Comprehend Mobile App

A React Native mobile application built with Expo, featuring a comprehensive theme system, accessible base components, and environment configuration.

## Features

- **Theme System**: Light/dark mode support with system preference detection
- **Base Components**: Accessible Button, Input, and Text components with WCAG 2.1 AA compliance
- **Environment Configuration**: Multi-environment support (development, staging, production)
- **Accessibility**: Full WCAG 2.1 Level AA compliance with React Native AMA integration
- **Type Safety**: TypeScript with strict mode enabled

## Prerequisites

- Node.js 22+ and npm
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (for macOS) or Android Studio (for Android development)

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment variables**

   Copy the example environment file and configure for your environment:

   ```bash
   cp .env.example .env.development
   ```

   Required environment variables:
   - `EXPO_PUBLIC_API_URL` - API endpoint URL
   - `EXPO_PUBLIC_AWS_REGION` - AWS region
   - `EXPO_PUBLIC_ENV` - Environment name (development, staging, production)
   - `EXPO_PUBLIC_DEBUG` - Enable debug mode (true/false)

3. **Start the development server**

   ```bash
   npx expo start
   ```

   In the output, you'll find options to open the app in:
   - [Development build](https://docs.expo.dev/develop/development-builds/introduction/)
   - [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
   - [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
   - [Expo Go](https://expo.dev/go) (limited sandbox)

## Environment Configuration

The app supports multiple environments with build-time configuration:

- **Development**: `.env.development`
- **Staging**: `.env.staging` (optional)
- **Production**: `.env.production` (optional)

Environment variables are loaded at build time using `expo-constants`. The app validates configuration on startup and handles missing or invalid values gracefully.

See `constants/config.ts` for the complete configuration schema and validation logic.

## Testing

Run the test suite:

```bash
npm test
```

Run tests in watch mode:

```bash
npm test -- --watch
```

Run tests with coverage:

```bash
npm test -- --coverage
```

### Test Structure

- **Unit Tests**: Component and hook tests in `__tests__/`
- **Integration Tests**: Theme and component integration tests

### Test IDs

All components use test IDs defined in `components/components.ids.ts` following the Test ID Pattern from the design documentation. This ensures consistent test identification and prevents typos.

## Accessibility

This app is built with accessibility as a first-class concern:

- **WCAG 2.1 Level AA Compliance**: All components meet minimum accessibility standards
- **React Native AMA**: Runtime accessibility checking in development mode
- **Contrast Ratios**: All text meets 4.5:1 (normal) or 3:1 (large) contrast requirements
- **Touch Targets**: Minimum 44x44 point touch targets for all interactive elements
- **Screen Reader Support**: Proper labels, roles, and hints for assistive technologies

### Running Accessibility Checks

React Native AMA provides runtime accessibility warnings in development mode. To verify accessibility:

1. Run the app in development mode
2. Check console for accessibility warnings
3. Test with VoiceOver (iOS) or TalkBack (Android)

## Project Structure

```plaintext
comprehend/
├── app/                    # Expo Router file-based routing
│   ├── _layout.tsx         # Root layout with theme provider
│   ├── index.tsx           # Entry screen
│   └── (tabs)/             # Tab navigation group
├── components/
│   ├── ui/                 # Base UI components (Button, Input, Text)
│   └── components.ids.ts  # Test ID constants
├── constants/
│   ├── theme.ts           # Theme colors, typography, spacing
│   └── config.ts          # Environment configuration
├── contexts/
│   └── ThemeContext/      # Theme state management
├── types/
│   └── index.ts           # Shared type definitions
└── __tests__/             # Test files
```

## Design Documentation

Comprehensive design documentation is available in `design-docs/`:

- **Accessibility**: `design-docs/accessibility.md` - WCAG requirements and patterns
- **Component Architecture**: `design-docs/component-architecture.md` - Component patterns
- **Context Pattern**: `design-docs/context-pattern.md` - Theme context implementation
- **Navigation Pattern**: `design-docs/navigation-pattern.md` - Expo Router patterns
- **Styling Pattern**: `design-docs/styling-pattern.md` - Theme system and styling
- **Types and Configuration**: `design-docs/types-and-configuration.md` - TypeScript patterns
- **Testing**: `design-docs/testing/` - Testing patterns and best practices

## Development

### Adding New Components

1. Create component in `components/ui/`
2. Add test IDs to `components/components.ids.ts`
3. Write unit tests in `__tests__/components/ui/`
4. Ensure WCAG 2.1 AA compliance (contrast, touch targets, labels)
5. Export from `components/ui/index.ts`

### Theme System

The theme system uses React Context for state management:

- **ThemeProvider**: Wraps the app and provides theme context
- **useTheme**: Hook to access theme values (colors, typography, spacing)
- **Theme Modes**: `light`, `dark`, or `system` (follows system preference)

Theme preferences are persisted to AsyncStorage and restored on app launch.

## Learn More

- [Expo Documentation](https://docs.expo.dev/): Learn fundamentals and advanced topics
- [React Native AMA](https://formidable.com/open-source/react-native-ama/): Accessibility library documentation
- [Expo Router](https://docs.expo.dev/router/introduction/): File-based routing guide
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/): Web Content Accessibility Guidelines

## License

See LICENSE file for details.
