# Design Documentation

This directory contains documentation on the design patterns and architectural decisions used in this React Native Expo application. These patterns are meant to guide future contributions and ensure consistency across the codebase.

## Table of Contents

- [Overview](#overview)
- [Documentation Structure](#documentation-structure)
- [Quick Start](#quick-start)
- [When to Use These Patterns](#when-to-use-these-patterns)

## Overview

This project follows a structured approach to building a React Native Expo application with file-based routing, Context API state management, and AWS backend integration. The patterns documented here were developed to maximize:

- **Testability**: Easy to write comprehensive tests with React Native Testing Library
- **Maintainability**: Clear structure that's easy to understand and modify
- **Consistency**: Similar patterns across different components
- **Type Safety**: Strong typing with TypeScript
- **User Experience**: Performant, accessible, and platform-aware components

## Documentation Structure

### [Testing Strategy](./testing/)

Comprehensive guide to testing patterns used in this project, organized into focused documents:

**Testing Setup:**

- **[Summary](./testing/summary.md)** - Overview and quick navigation for all testing topics
- **[Setup](./testing/setup.md)** - Jest and React Native Testing Library configuration

**Testing Approaches:**

- **[Unit Testing](./testing/unit-testing.md)** - Testing components, hooks, and utilities
- **[Integration Testing](./testing/integration-testing.md)** - Testing screens with navigation and contexts
- **[Mocking Strategy](./testing/mocking-strategy.md)** - Principles for what and how to mock
- **[Best Practices](./testing/best-practices.md)** - Coding standards and conventions for tests

**Mocking Patterns:**

- **[Factory Pattern](./testing/factory-pattern.md)** - Creating mock factories for I/O services (API, storage)
- **[Decision Guide](./testing/decision-guide.md)** - Quick decision trees for choosing the right mocking approach

**Read this if:**

- You're writing tests for any component
- You need to mock contexts or API calls
- You need to choose between factory, provider, or direct mocks
- You're mocking API clients or storage services
- You're unsure how to test navigation flows
- You're setting up test configuration
- You need guidance on which testing approach to use
- You need to ensure test isolation with proper mock clearing

### [Context Pattern](./context-pattern.md)

Describes the Context API pattern used for state management across the application.

**Topics covered:**

- Context structure with state and actions separation
- Provider component implementation
- Custom hooks for safe context access
- Provider hierarchy and composition
- Error handling and loading states
- Complete working examples

**Read this if:**

- You're creating a new context for state management
- You need to share state across multiple components
- You're implementing data fetching logic
- You're building features that need global state
- You need to integrate API calls with contexts

### [Component Architecture](./component-architecture.md)

Guidelines for structuring and organizing React Native components.

**Topics covered:**

- Component types and their purposes
- File organization structure
- Props patterns with TypeScript
- Component composition strategies
- Reusable component guidelines
- Test IDs for testability
- Complete examples

**Read this if:**

- You're creating new components
- You need guidance on component organization
- You're building reusable UI components
- You're structuring feature-specific components
- You need to understand the component hierarchy

### [Navigation Pattern](./navigation-pattern.md)

Guidelines for using Expo Router's file-based routing system.

**Topics covered:**

- Expo Router file-based routing
- Navigation structure and organization
- Type-safe navigation with TypeScript
- Route parameters and search params
- Nested navigation with layouts
- Deep linking configuration
- Complete examples

**Read this if:**

- You're adding new screens or routes
- You need to implement navigation between screens
- You're working with route parameters
- You're setting up nested navigation
- You need to configure deep linking

### [API Integration](./api-integration.md)

Guidelines for integrating with the AWS backend API.

**Topics covered:**

- API client structure with AWS IAM signing
- Request/response type definitions
- Error handling and retry logic
- Authentication token management
- Caching strategies
- Integration with contexts
- Complete working example

**Read this if:**

- You're implementing API calls to the backend
- You need to handle authentication
- You're working with AWS IAM signed requests
- You need to implement error handling for API calls
- You're integrating API calls into contexts

### [Types and Configuration](./types-and-configuration.md)

Guidelines for defining types and managing configuration.

**Topics covered:**

- TypeScript patterns and conventions
- Interface vs Type guidelines
- Environment configuration management
- Constants organization
- Type-safe API responses
- Configuration for different environments
- Complete examples

**Read this if:**

- You're defining new types or interfaces
- You're adding configuration for features
- You need to manage environment-specific settings
- You're working with API response types
- You need to organize constants

### [Styling Pattern](./styling-pattern.md)

Guidelines for styling components with React Native StyleSheet.

**Topics covered:**

- StyleSheet organization and naming conventions
- Theme system with Context API
- Color and typography constants
- Responsive design patterns
- Platform-specific styles (iOS/Android/Web)
- Dark mode support
- Accessibility considerations
- Complete examples

**Read this if:**

- You're styling new components
- You need to implement theme support
- You're working on responsive layouts
- You need platform-specific styles
- You're implementing dark mode
- You need to ensure accessibility

## Quick Start

### For Creating a New Feature

1. **Define Types** ([Types and Configuration](./types-and-configuration.md))

   ```typescript
   export interface MyFeatureData {
     id: string;
     title: string;
     // ... other properties
   }
   ```

2. **Create Context** ([Context Pattern](./context-pattern.md))

   ```typescript
   export interface MyFeatureContextValue {
     state: {
       loading: boolean;
       data: MyFeatureData[];
       error: string | null;
     };
     actions: {
       fetchData: () => Promise<void>;
       updateData: (data: MyFeatureData) => void;
     };
   }
   ```

3. **Create Components** ([Component Architecture](./component-architecture.md))

   ```typescript
   export function MyFeatureComponent() {
     const { state, actions } = useMyFeatureContext();
     // Component implementation
   }
   ```

4. **Add Navigation** ([Navigation Pattern](./navigation-pattern.md))

   ```typescript
   // app/(tabs)/my-feature.tsx
   export default function MyFeatureScreen() {
     return <MyFeatureComponent />;
   }
   ```

5. **Write Tests** ([Testing Strategy](./testing/))

   ```typescript
   describe('MyFeatureComponent', () => {
     it('Should render data correctly', () => {
       // Test implementation
     });
   });
   ```

### For Testing Components with Services

1. **Choose Mocking Approach** ([Decision Guide](./testing/decision-guide.md))

   - React Context → Use Mock Provider
   - API Client/Storage → Use Mock Factory
   - Simple Callback → Use jest.fn()

2. **Create Mock Factory for Services** ([Factory Pattern](./testing/factory-pattern.md))

   ```typescript
   export class MockApiClient {
     private responses = new Map();
     
     withResponse(url: string, data: any): this {
       this.responses.set(url, data);
       return this;
     }
     
     clear(): void {
       this.responses.clear();
     }
     
     async get(url: string) {
       return this.responses.get(url) || { data: null };
     }
   }
   ```

3. **Use Dependency Injection** ([Unit Testing](./testing/unit-testing.md))

   ```typescript
   describe('MyComponent', () => {
     let mockApiClient: MockApiClient;

     beforeEach(() => {
       mockApiClient = new MockApiClient();
     });

     it('Should fetch data', async () => {
       mockApiClient.withResponse('/data', { items: [] });
       
       const { getByTestId } = render(
         <MyComponent apiClient={mockApiClient} />
       );
       
       await waitFor(() => {
         expect(getByTestId('data-list')).toBeTruthy();
       });
     });
   });
   ```

### For Adding API Integration

1. **Define API Types** ([Types and Configuration](./types-and-configuration.md))

   ```typescript
   export interface MyApiRequest {
     // Request parameters
   }
   
   export interface MyApiResponse {
     // Response data
   }
   ```

2. **Create API Client Method** ([API Integration](./api-integration.md))

   ```typescript
   async fetchMyData(params: MyApiRequest): Promise<MyApiResponse> {
     return this.apiClient.request('/my-endpoint', {
       method: 'POST',
       body: params,
     });
   }
   ```

3. **Integrate with Context** ([Context Pattern](./context-pattern.md))

   ```typescript
   const fetchData = async () => {
     setState({ ...state, loading: true });
     try {
       const data = await apiClient.fetchMyData(params);
       setState({ ...state, data, loading: false });
     } catch (error) {
       setState({ ...state, error: error.message, loading: false });
     }
   };
   ```

4. **Write Tests** ([Testing Strategy](./testing/))

   ```typescript
   it('Should fetch data successfully', async () => {
     mockApiClient.fetchMyData.mockResolvedValue(mockData);
     // Test implementation
   });
   ```

### For Styling Components

1. **Define Theme Variables** ([Styling Pattern](./styling-pattern.md))

   ```typescript
   export const theme = {
     colors: {
       primary: '#007AFF',
       background: '#FFFFFF',
     },
     spacing: {
       sm: 8,
       md: 16,
       lg: 24,
     },
   };
   ```

2. **Create Component Styles** ([Styling Pattern](./styling-pattern.md))

   ```typescript
   const styles = StyleSheet.create({
     container: {
       flex: 1,
       padding: theme.spacing.md,
       backgroundColor: theme.colors.background,
     },
   });
   ```

3. **Apply Platform-Specific Styles** ([Styling Pattern](./styling-pattern.md))

   ```typescript
   const styles = StyleSheet.create({
     text: {
       ...Platform.select({
         ios: { fontFamily: 'System' },
         android: { fontFamily: 'Roboto' },
       }),
     },
   });
   ```

## When to Use These Patterns

### Context Pattern

**Use when:**

- State needs to be shared across multiple components
- Building features with data fetching and updates
- Managing global application state (auth, theme, etc.)
- Coordinating between multiple screens

**Don't use when:**

- State is only needed in a single component (use useState)
- Simple prop passing is sufficient
- Performance is critical and updates are frequent (consider optimization)

### Component Architecture Patterns

**Use when:**

- Building reusable UI components
- Creating screen-level components
- Structuring feature-specific components
- Implementing shared component libraries

**Always use:**

- TypeScript for props and component definitions
- Test IDs for components that need testing
- Consistent file organization

### API Integration Pattern

**Use when:**

- Making requests to the AWS backend
- Handling authenticated API calls
- Implementing data fetching logic
- Managing API errors and retries

**Always use:**

- Type definitions for requests and responses
- Error handling with try-catch
- Loading states for async operations

### Styling Patterns

**Use when:**

- Styling any component
- Implementing theme support
- Creating responsive layouts
- Supporting dark mode

**Always use:**

- StyleSheet.create for performance
- Theme constants for consistency
- Platform-specific styles when needed

### Testing Patterns

**Use when:**

- Testing any component, hook, or utility
- Verifying navigation flows
- Testing context behavior
- Validating API integrations
- Mocking I/O operations (API calls, storage, native modules)

**Choosing the right mocking approach:**

- **Mock Provider Pattern**: For React Context (auth, theme, navigation state)
- **Mock Factory Pattern**: For I/O services (API clients, storage, platform APIs)
- **Direct jest.fn()**: For simple callbacks (onPress, onChange)

**For detailed guidance, see [Decision Guide](./testing/decision-guide.md).**

**Always use:**

- Mock providers for context testing
- Mock factories for service testing with dependency injection
- Test IDs for element selection
- Descriptive test names
- Proper mock clearing between tests (`.clear()` for factories, `jest.clearAllMocks()`)
- Isolation between tests

## Examples by Use Case

### I'm building a new screen with data fetching

1. Read: [Context Pattern](./context-pattern.md) - Set up state management
2. Read: [API Integration](./api-integration.md) - Implement data fetching
3. Read: [Component Architecture](./component-architecture.md) - Structure components
4. Read: [Navigation Pattern](./navigation-pattern.md) - Add screen to navigation
5. Read: [Testing Strategy](./testing/) - Write comprehensive tests

### I'm creating reusable UI components

1. Read: [Component Architecture](./component-architecture.md) - Component organization
2. Read: [Types and Configuration](./types-and-configuration.md) - Define prop types
3. Read: [Styling Pattern](./styling-pattern.md) - Apply consistent styling
4. Read: [Testing Strategy](./testing/unit-testing.md) - Write component tests

### I'm implementing authentication flow

1. Read: [Context Pattern](./context-pattern.md) - Create auth context
2. Read: [API Integration](./api-integration.md) - Implement auth API calls
3. Read: [Navigation Pattern](./navigation-pattern.md) - Set up protected routes
4. Read: [Types and Configuration](./types-and-configuration.md) - Define auth types
5. Read: [Testing Strategy](./testing/integration-testing.md) - Test auth flows

### I'm adding a new feature with API integration

1. Read: [Types and Configuration](./types-and-configuration.md) - Define data types
2. Read: [API Integration](./api-integration.md) - Create API methods
3. Read: [Context Pattern](./context-pattern.md) - Set up state management
4. Read: [Component Architecture](./component-architecture.md) - Build components
5. Read: [Testing Strategy](./testing/) - Write tests at all levels

### I'm implementing theme and dark mode support

1. Read: [Styling Pattern](./styling-pattern.md) - Theme system setup
2. Read: [Context Pattern](./context-pattern.md) - Theme context
3. Read: [Component Architecture](./component-architecture.md) - Apply theme to components
4. Read: [Testing Strategy](./testing/) - Test theme switching

### I'm writing tests for existing components

1. Read: [Testing Summary](./testing/summary.md) - Get an overview
2. Read: [Decision Guide](./testing/decision-guide.md) - Choose the right mocking approach
3. Read: [Testing Setup](./testing/setup.md) - Ensure proper configuration
4. Read: [Unit Testing](./testing/unit-testing.md) - Test components
5. Read: [Mocking Strategy](./testing/mocking-strategy.md) - Mock dependencies
6. Read: [Best Practices](./testing/best-practices.md) - Follow conventions

### I'm mocking API clients or storage services

1. Read: [Decision Guide](./testing/decision-guide.md) - Confirm factory pattern is appropriate
2. Read: [Factory Pattern](./testing/factory-pattern.md) - Learn factory implementation
3. Read: [Unit Testing](./testing/unit-testing.md#testing-components-with-service-dependencies) - See dependency injection examples
4. Read: [Best Practices](./testing/best-practices.md) - Ensure proper test isolation

### I'm testing components with React Context

1. Read: [Decision Guide](./testing/decision-guide.md) - Understand provider vs factory
2. Read: [Unit Testing](./testing/unit-testing.md#mock-provider-pattern) - Create mock providers
3. Read: [Mocking Strategy](./testing/mocking-strategy.md#mocking-contexts) - Context mocking patterns
4. Read: [Best Practices](./testing/best-practices.md) - Follow conventions

## Directory Structure

The application follows this organizational structure:

```plaintext
comprehend/
├── app/                          # Expo Router screens
│   ├── _layout.tsx              # Root layout
│   ├── index.tsx                # Home screen
│   └── (tabs)/                  # Tab-based navigation
│       ├── _layout.tsx          # Tab layout
│       └── [screen].tsx         # Individual screens
├── components/                   # React components
│   ├── ui/                      # Reusable UI components
│   ├── [feature]/               # Feature-specific components
│   └── components.ids.ts        # Test IDs for components
├── contexts/                     # Context providers
│   └── [ContextName]/
│       ├── Context.tsx          # Context definition
│       ├── Provider.tsx         # Provider implementation
│       └── __tests__/           # Context tests
├── hooks/                        # Custom React hooks
│   ├── use-[name].ts
│   └── __tests__/
├── utils/                        # Utility functions
│   ├── api/                     # API client
│   ├── [utility].ts
│   └── __tests__/
├── constants/                    # Constants and configuration
│   ├── theme.ts                 # Theme constants
│   └── config.ts                # App configuration
├── types/                        # TypeScript type definitions
│   └── [types].ts
└── docs/                         # Design documentation
    ├── design-docs.md           # This file
    ├── context-pattern.md
    ├── component-architecture.md
    ├── navigation-pattern.md
    ├── api-integration.md
    ├── types-and-configuration.md
    ├── styling-pattern.md
    └── testing/                 # Testing documentation
        ├── summary.md
        ├── setup.md
        ├── unit-testing.md
        ├── integration-testing.md
        ├── mocking-strategy.md
        ├── best-practices.md
        ├── factory-pattern.md
        └── decision-guide.md
```

## Contributing to Documentation

When adding new patterns or updating existing ones:

1. **Follow the established structure** - Use the same format as existing documents
2. **Include working examples** - Provide complete, runnable code examples
3. **Add cross-references** - Link to related documentation
4. **Update this overview** - Add new patterns to the table of contents
5. **Keep it practical** - Focus on real-world use cases and scenarios

## Getting Help

- **For testing questions**: Start with [Testing Summary](./testing/summary.md)
- **For architecture questions**: Start with relevant pattern document
- **For quick answers**: Check the [Quick Start](#quick-start) section
- **For specific scenarios**: Check [Examples by Use Case](#examples-by-use-case)
