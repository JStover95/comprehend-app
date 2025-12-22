# Testing Strategy Summary

## Overview

This document provides a comprehensive overview of the testing strategy for this React Native Expo application. The testing approach uses Jest and React Native Testing Library to ensure code quality, maintainability, and reliability.

## Table of Contents

- [Testing Approach](#testing-approach)
- [Documentation Navigation](#documentation-navigation)
- [Testing Layers](#testing-layers)
- [Quick Reference](#quick-reference)
- [When to Use Each Testing Approach](#when-to-use-each-testing-approach)

## Testing Approach

Our testing strategy follows these core principles:

1. **Test behavior, not implementation**: Focus on what users see and interact with
2. **Isolation**: Each test should be independent and not affect others
3. **Comprehensive coverage**: Test happy paths, error cases, and edge cases
4. **Realistic testing**: Use real navigation and contexts with mock data
5. **Maintainability**: Keep tests readable, organized, and easy to update

## Documentation Navigation

### Quick Start

**New to testing?** Start here:

1. [Setup](./setup.md) - Configure Jest and React Native Testing Library
2. [Unit Testing](./unit-testing.md) - Learn to test components and hooks
3. [Best Practices](./best-practices.md) - Follow testing conventions

**Setting up tests for a component?** Read:

1. [Mocking Strategy](./mocking-strategy.md) - Understand what and how to mock
2. [Unit Testing](./unit-testing.md) - Test individual components
3. [Best Practices](./best-practices.md) - Follow coding standards

**Testing complete flows?** Read:

1. [Integration Testing](./integration-testing.md) - Test screens with navigation
2. [Mocking Strategy](./mocking-strategy.md) - Mock contexts and APIs
3. [Best Practices](./best-practices.md) - Maintain test quality

### Detailed Documentation

#### [Setup](./setup.md)

Complete Jest and React Native Testing Library configuration.

**Topics:**

- Jest configuration with jest-expo preset
- Global test setup and mocks
- Test scripts and commands
- Configuration files explained

**Read this if:**

- You're setting up testing for the first time
- You need to add new global mocks
- You're troubleshooting test configuration issues

#### [Unit Testing](./unit-testing.md)

Testing individual components, hooks, and utilities.

**Topics:**

- Component testing patterns
- Testing hooks with React Native Testing Library
- Testing utilities and helper functions
- Mock provider pattern for contexts
- Test ID conventions
- Async testing with waitFor and act

**Read this if:**

- You're testing individual components
- You need to test custom hooks
- You're testing utility functions
- You're working with context-dependent components

#### [Integration Testing](./integration-testing.md)

Testing complete user flows with navigation and multiple contexts.

**Topics:**

- Screen testing with NavigationContainer
- Testing navigation flows
- Multi-context testing
- Testing complete user journeys
- Mock navigation stacks

**Read this if:**

- You're testing screen components
- You need to verify navigation behavior
- You're testing features that span multiple screens
- You're testing complete user workflows

#### [Mocking Strategy](./mocking-strategy.md)

Guidelines for what to mock and how to mock it effectively.

**Topics:**

- When to mock vs. use real implementations
- Mocking contexts with mock providers
- Mocking API clients
- Mocking navigation
- Mock data factories
- External dependency mocking

**Read this if:**

- You're unsure what to mock in your tests
- You need to create mock providers for contexts
- You're mocking API calls
- You're setting up mock data

#### [Best Practices](./best-practices.md)

Coding standards and conventions for writing quality tests.

**Topics:**

- Test structure and organization
- Naming conventions
- Test isolation patterns
- Descriptive test cases
- Code coverage guidelines
- Common pitfalls and solutions

**Read this if:**

- You want to write maintainable tests
- You're establishing testing standards
- You're reviewing test code
- You need to improve test quality

## Testing Layers

```mermaid
graph TD
    Unit[Unit Tests]
    Integration[Integration Tests]
    Components[Components/Hooks/Utils]
    Screens[Screens with Navigation]
    UserFlows[Complete User Flows]
    
    Unit --> Components
    Integration --> Screens
    Integration --> UserFlows
    
    Components --> |Test in isolation| TestIDs[Test IDs]
    Components --> |Mock dependencies| MockProviders[Mock Providers]
    
    Screens --> |Real navigation| NavigationContainer[NavigationContainer]
    Screens --> |Real contexts| MockData[Mock Data]
    
    UserFlows --> |Multi-screen| Navigation[Navigation Testing]
    UserFlows --> |State changes| ContextTesting[Context Testing]
```

### Unit Tests

**What:** Test individual components, hooks, and utilities in isolation

**How:**

- Render components with mock providers
- Test component props and state
- Verify UI rendering and interactions
- Test custom hooks with renderHook
- Test utilities with pure function testing

**Example:**

```typescript
describe('MyComponent', () => {
  it('Should render data correctly', () => {
    const mockContext = createMockContextValue();
    const { getByTestId } = render(
      <MockProvider value={mockContext}>
        <MyComponent />
      </MockProvider>
    );
    expect(getByTestId('data-display')).toBeTruthy();
  });
});
```

### Integration Tests

**What:** Test complete features with navigation and state management

**How:**

- Use real NavigationContainer
- Use real context providers with mock data
- Test navigation between screens
- Verify state changes across components
- Test complete user workflows

**Example:**

```typescript
describe('MyScreen', () => {
  it('Should navigate to detail screen on item press', async () => {
    const { getByTestId } = render(
      <NavigationContainer>
        <MockContextProvider value={mockData}>
          <Stack.Navigator>
            <Stack.Screen name="List" component={ListScreen} />
            <Stack.Screen name="Detail" component={DetailScreen} />
          </Stack.Navigator>
        </MockContextProvider>
      </NavigationContainer>
    );
    
    fireEvent.press(getByTestId('item-1'));
    
    await waitFor(() => {
      expect(getByTestId('detail-screen')).toBeTruthy();
    });
  });
});
```

## Quick Reference

### Common Testing Patterns

| Pattern | Use Case | Documentation |
|---------|----------|---------------|
| Mock Provider | Testing context-dependent components | [Unit Testing](./unit-testing.md#mock-provider-pattern) |
| Test IDs | Selecting elements in tests | [Unit Testing](./unit-testing.md#test-id-pattern) |
| Navigation Testing | Testing screen navigation | [Integration Testing](./integration-testing.md#navigation-testing) |
| Async Testing | Testing async operations | [Unit Testing](./unit-testing.md#async-testing) |
| Mock Data Factories | Creating reusable test data | [Mocking Strategy](./mocking-strategy.md#mock-data-factories) |

### Test File Organization

```plaintext
src/
├── components/
│   ├── MyComponent.tsx
│   ├── components.ids.ts
│   └── __tests__/
│       ├── MyComponent.test.tsx
│       └── MyComponent.mock.tsx
├── contexts/
│   ├── MyContext/
│   │   ├── Context.tsx
│   │   ├── Provider.tsx
│   │   └── __tests__/
│   │       ├── Context.test.tsx
│   │       └── Context.mock.tsx
└── screens/
    ├── MyScreen.tsx
    ├── screens.ids.ts
    └── __tests__/
        ├── MyScreen.test.tsx
        └── MyScreen.mock.tsx
```

## When to Use Each Testing Approach

### Use Unit Tests When

- Testing a single component in isolation
- Testing custom hooks
- Testing utility functions
- Testing data transformations
- You need fast feedback during development
- Testing component logic without navigation

### Use Integration Tests When

- Testing screen components
- Testing navigation flows
- Testing features that span multiple components
- Testing state management across contexts
- Verifying complete user workflows
- Testing interactions between components

### Don't Test

- Third-party library internals
- React Native core components
- Implementation details
- Styles (unless functionality depends on them)

## Running Tests

### Run All Tests

```bash
npm test
```

### Watch Mode

```bash
npm run test:watch
```

### Coverage Report

```bash
npm run test:coverage
```

### Run Specific Test File

```bash
npm test -- MyComponent.test.tsx
```

### Run Tests Matching Pattern

```bash
npm test -- --testNamePattern="Should render"
```

## Next Steps

1. **New to testing?** Start with [Setup](./setup.md)
2. **Ready to write tests?** Go to [Unit Testing](./unit-testing.md)
3. **Need to test navigation?** See [Integration Testing](./integration-testing.md)
4. **Want best practices?** Read [Best Practices](./best-practices.md)
5. **Unsure what to mock?** Check [Mocking Strategy](./mocking-strategy.md)

## Additional Resources

- [React Native Testing Library Documentation](https://callstack.github.io/react-native-testing-library/)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Expo Testing Guide](https://docs.expo.dev/develop/unit-testing/)
- [React Navigation Testing](https://reactnavigation.org/docs/testing/)
