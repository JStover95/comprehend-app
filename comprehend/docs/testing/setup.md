# Testing Setup

## Overview

This document covers the complete setup and configuration for testing React Native Expo applications with Jest and React Native Testing Library.

## Table of Contents

- [Installation](#installation)
- [Configuration Files](#configuration-files)
- [Understanding the Setup](#understanding-the-setup)
- [Test Scripts](#test-scripts)
- [Troubleshooting](#troubleshooting)

## Installation

### Dependencies

The following testing dependencies are included in the project:

```json
{
  "devDependencies": {
    "jest": "^29.7.0",
    "jest-expo": "~52.0.4",
    "@testing-library/react-native": "^12.4.3",
    "@testing-library/jest-native": "^5.4.3",
    "@types/jest": "^29.5.11"
  }
}
```

### Installing Dependencies

To install the testing dependencies, run:

```bash
npm install
```

## Configuration Files

### jest.config.js

The main Jest configuration file:

```javascript
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)',
  ],
  testMatch: [
    '**/__tests__/**/*.test.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)',
  ],
  collectCoverageFrom: [
    '**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/__tests__/**',
    '!**/coverage/**',
    '!jest.config.js',
    '!jest.setup.js',
    '!babel.config.js',
    '!metro.config.js',
    '!app.json',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testEnvironment: 'node',
};
```

**Key configurations:**

- **preset**: Uses `jest-expo` for Expo-specific setup
- **setupFilesAfterEnv**: Runs setup file before each test
- **transformIgnorePatterns**: Transpiles React Native and Expo modules
- **testMatch**: Finds test files in `__tests__` directories
- **collectCoverageFrom**: Specifies which files to include in coverage
- **moduleNameMapper**: Resolves `@/` path alias

### jest.setup.js

Global test setup and mocks:

```javascript
import '@testing-library/jest-native/extend-expect';

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    canGoBack: jest.fn(() => true),
  })),
  useLocalSearchParams: jest.fn(() => ({})),
  useSegments: jest.fn(() => []),
  usePathname: jest.fn(() => '/'),
  router: {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    canGoBack: jest.fn(() => true),
  },
  Link: 'Link',
  Redirect: 'Redirect',
  Stack: {
    Screen: 'StackScreen',
  },
  Tabs: {
    Screen: 'TabsScreen',
  },
}));

// Additional mocks...
jest.useFakeTimers();
```

**What's mocked:**

1. **expo-router**: Navigation hooks and components
2. **expo-constants**: Configuration values
3. **expo-font**: Font loading
4. **expo-splash-screen**: Splash screen management
5. **react-native-gesture-handler**: Gesture components
6. **react-native-reanimated**: Animation library

### package.json Scripts

Test scripts added to `package.json`:

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

## Understanding the Setup

### Jest Preset: jest-expo

The `jest-expo` preset provides:

- Pre-configured transformers for React Native
- Mocks for Expo modules
- Environment setup for React Native
- TypeScript support

### setupFilesAfterEnv

This file runs after Jest is initialized but before tests run. It's used for:

- Extending Jest matchers with `@testing-library/jest-native`
- Mocking global modules
- Setting up fake timers
- Configuring global test utilities

### transformIgnorePatterns

React Native and Expo modules need to be transformed by Jest. The pattern tells Jest to transform:

- All `react-native` packages
- All `expo` packages
- React Navigation packages
- Other commonly used packages

**Why?** These packages use modern JavaScript that needs to be transpiled for Jest's Node environment.

### Module Name Mapper

Maps the `@/` path alias to the root directory:

```javascript
moduleNameMapper: {
  '^@/(.*)$': '<rootDir>/$1',
}
```

This allows tests to use the same import paths as the application:

```typescript
import { MyComponent } from '@/components/MyComponent';
```

### Test Environment

Set to `node` for React Native testing:

```javascript
testEnvironment: 'node',
```

This uses Node.js environment instead of jsdom (used for web).

## Test Scripts

### Basic Commands

**Run all tests:**

```bash
npm test
```

**Run tests in watch mode:**

```bash
npm run test:watch
```

**Generate coverage report:**

```bash
npm run test:coverage
```

### Advanced Commands

**Run specific test file:**

```bash
npm test -- MyComponent.test.tsx
```

**Run tests matching pattern:**

```bash
npm test -- --testNamePattern="Should render"
```

**Run tests in specific directory:**

```bash
npm test -- components/
```

**Update snapshots:**

```bash
npm test -- -u
```

**Run with verbose output:**

```bash
npm test -- --verbose
```

**Run in silent mode:**

```bash
npm test -- --silent
```

## Troubleshooting

### Common Issues

#### Issue: "Cannot find module 'expo-router'"

**Solution:** Ensure the module is mocked in `jest.setup.js`:

```javascript
jest.mock('expo-router', () => ({
  // Mock implementation
}));
```

#### Issue: "Unexpected token" errors

**Solution:** Add the problematic package to `transformIgnorePatterns`:

```javascript
transformIgnorePatterns: [
  'node_modules/(?!(problematic-package)|((jest-)?react-native|...))',
],
```

#### Issue: Tests timeout

**Solution:** Increase timeout in test:

```typescript
it('Should complete async operation', async () => {
  // Test code
}, 10000); // 10 second timeout
```

Or use `waitFor` with custom timeout:

```typescript
await waitFor(() => {
  expect(getByTestId('result')).toBeTruthy();
}, { timeout: 5000 });
```

#### Issue: "Cannot read property 'create' of undefined" (StyleSheet)

**Solution:** Mock StyleSheet in test if needed:

```typescript
jest.mock('react-native/Libraries/StyleSheet/StyleSheet', () => ({
  create: jest.fn((styles) => styles),
}));
```

#### Issue: Timers not working correctly

**Solution:** Use fake timers and advance them:

```typescript
jest.useFakeTimers();

it('Should work with timers', () => {
  // Code that uses timers
  jest.runAllTimers();
  // Assertions
});
```

#### Issue: "Invariant Violation: Could not find 'store'"

**Solution:** If using Redux or similar, wrap component in provider:

```typescript
render(
  <Provider store={mockStore}>
    <MyComponent />
  </Provider>
);
```

### Debugging Tests

**Enable verbose output:**

```bash
npm test -- --verbose
```

**Debug specific test:**

```bash
node --inspect-brk node_modules/.bin/jest --runInBand MyComponent.test.tsx
```

**Log render output:**

```typescript
import { render, debug } from '@testing-library/react-native';

const { debug } = render(<MyComponent />);
debug(); // Prints component tree
```

### Performance Optimization

**Run tests in parallel:**

```bash
npm test -- --maxWorkers=4
```

**Only run changed tests:**

```bash
npm test -- --onlyChanged
```

**Cache test results:**
Jest caches by default. Clear cache if needed:

```bash
npm test -- --clearCache
```

## Adding New Mocks

### Mocking a New Expo Module

Add to `jest.setup.js`:

```javascript
jest.mock('expo-new-module', () => ({
  someFunction: jest.fn(),
  SomeComponent: 'MockedComponent',
}));
```

### Mocking a Context

Create mock in test file or separate mock file:

```typescript
export const createMockContextValue = () => ({
  state: {
    loading: false,
    data: [],
    error: null,
  },
  actions: {
    fetchData: jest.fn(),
  },
});

export const MockContextProvider = ({ value, children }) => (
  <MyContext.Provider value={value}>{children}</MyContext.Provider>
);
```

### Mocking an API Client

```typescript
export const createMockApiClient = () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
});
```

## Verification

To verify the setup is working correctly, create a simple test:

```typescript
// __tests__/setup.test.tsx
describe('Test Setup', () => {
  it('Should run a basic test', () => {
    expect(true).toBe(true);
  });

  it('Should render a component', () => {
    const { getByText } = render(<Text>Hello</Text>);
    expect(getByText('Hello')).toBeTruthy();
  });
});
```

Run the test:

```bash
npm test setup.test.tsx
```

If both tests pass, the setup is working correctly.

## Next Steps

- Read [Unit Testing](./unit-testing.md) to learn testing patterns
- Read [Mocking Strategy](./mocking-strategy.md) to understand what to mock
- Read [Best Practices](./best-practices.md) for testing conventions
- Start writing tests for your components!

## Additional Resources

- [Jest Configuration](https://jestjs.io/docs/configuration)
- [jest-expo Documentation](https://docs.expo.dev/develop/unit-testing/)
- [React Native Testing Library Setup](https://callstack.github.io/react-native-testing-library/docs/getting-started)
