# Integration Testing

## Overview

Integration tests verify that multiple components work together correctly, including navigation flows, context interactions, and complete user journeys. These tests use real navigation and context providers with mock data.

## Table of Contents

- [Screen Testing](#screen-testing)
- [Navigation Testing](#navigation-testing)
- [Multi-Context Testing](#multi-context-testing)
- [Complete User Flows](#complete-user-flows)
- [Mock Navigation Stacks](#mock-navigation-stacks)
- [Examples](#examples)

## Screen Testing

### Basic Screen Test

Test a screen component with navigation and context:

```typescript
// app/(tabs)/home.tsx
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useDataContext } from '@/contexts/DataContext';

export default function HomeScreen() {
  const router = useRouter();
  const { state } = useDataContext();

  if (state.loading) {
    return <Text testID="loading">Loading...</Text>;
  }

  return (
    <View testID="home-screen">
      <FlatList
        data={state.items}
        renderItem={({ item }) => (
          <TouchableOpacity
            testID={`item-${item.id}`}
            onPress={() => router.push(`/detail/${item.id}`)}
          >
            <Text>{item.title}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

// app/(tabs)/__tests__/home.test.tsx
import { render, fireEvent } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../home';
import { MockDataProvider, createMockDataValue } from '@/contexts/__tests__/DataContext.mock';

const Stack = createNativeStackNavigator();

function HomeScreenStack({ mockDataValue }) {
  return (
    <NavigationContainer>
      <MockDataProvider value={mockDataValue}>
        <Stack.Navigator>
          <Stack.Screen name="Home" component={HomeScreen} />
        </Stack.Navigator>
      </MockDataProvider>
    </NavigationContainer>
  );
}

describe('HomeScreen', () => {
  it('Should render loading state', () => {
    const mockValue = createMockDataValue();
    mockValue.state.loading = true;

    const { getByTestId } = render(<HomeScreenStack mockDataValue={mockValue} />);
    expect(getByTestId('loading')).toBeTruthy();
  });

  it('Should render items from context', () => {
    const mockValue = createMockDataValue();
    mockValue.state.items = [
      { id: '1', title: 'Item 1' },
      { id: '2', title: 'Item 2' },
    ];

    const { getByTestId } = render(<HomeScreenStack mockDataValue={mockValue} />);

    expect(getByTestId('home-screen')).toBeTruthy();
    expect(getByTestId('item-1')).toBeTruthy();
    expect(getByTestId('item-2')).toBeTruthy();
  });
});
```

### Screen with Multiple Contexts

```typescript
// app/(tabs)/profile.tsx
import { useAuthContext } from '@/contexts/AuthContext';
import { useSettingsContext } from '@/contexts/SettingsContext';

export default function ProfileScreen() {
  const { state: authState } = useAuthContext();
  const { state: settingsState } = useSettingsContext();

  return (
    <View testID="profile-screen">
      <Text testID="username">{authState.user?.name}</Text>
      <Text testID="theme">{settingsState.theme}</Text>
    </View>
  );
}

// app/(tabs)/__tests__/profile.test.tsx
function ProfileScreenStack({ authValue, settingsValue }) {
  return (
    <NavigationContainer>
      <MockAuthProvider value={authValue}>
        <MockSettingsProvider value={settingsValue}>
          <Stack.Navigator>
            <Stack.Screen name="Profile" component={ProfileScreen} />
          </Stack.Navigator>
        </MockSettingsProvider>
      </MockAuthProvider>
    </NavigationContainer>
  );
}

describe('ProfileScreen', () => {
  it('Should display user and settings data', () => {
    const authValue = createMockAuthValue();
    authValue.state.user = { id: '1', name: 'John Doe' };

    const settingsValue = createMockSettingsValue();
    settingsValue.state.theme = 'dark';

    const { getByTestId } = render(
      <ProfileScreenStack authValue={authValue} settingsValue={settingsValue} />
    );

    expect(getByTestId('username')).toHaveTextContent('John Doe');
    expect(getByTestId('theme')).toHaveTextContent('dark');
  });
});
```

## Navigation Testing

### Testing Navigation Between Screens

According to React Navigation's [Testing Guiding Principles](https://reactnavigation.org/docs/testing/#guiding-principles), we should test the result of navigation, not the action itself, and use real navigators instead of mocks.

```typescript
// Create mock stack with multiple screens
function AppStack({ mockDataValue }) {
  return (
    <NavigationContainer>
      <MockDataProvider value={mockDataValue}>
        <Stack.Navigator>
          <Stack.Screen name="List" component={ListScreen} />
          <Stack.Screen name="Detail" component={DetailScreen} />
        </Stack.Navigator>
      </MockDataProvider>
    </NavigationContainer>
  );
}

describe('Navigation Flow', () => {
  it('Should navigate to detail screen when item pressed', async () => {
    const mockValue = createMockDataValue();
    mockValue.state.items = [{ id: '1', title: 'Item 1' }];

    const { getByTestId } = render(<AppStack mockDataValue={mockValue} />);

    // Initially on list screen
    expect(getByTestId('list-screen')).toBeTruthy();

    // Press item to navigate
    fireEvent.press(getByTestId('item-1'));

    // Should navigate to detail screen
    await waitFor(() => {
      expect(getByTestId('detail-screen')).toBeTruthy();
    });
  });

  it('Should navigate back to list screen', async () => {
    const mockValue = createMockDataValue();
    mockValue.state.items = [{ id: '1', title: 'Item 1' }];

    const { getByTestId } = render(<AppStack mockDataValue={mockValue} />);

    // Navigate to detail
    fireEvent.press(getByTestId('item-1'));
    await waitFor(() => {
      expect(getByTestId('detail-screen')).toBeTruthy();
    });

    // Navigate back
    fireEvent.press(getByTestId('back-button'));
    await waitFor(() => {
      expect(getByTestId('list-screen')).toBeTruthy();
    });
  });
});
```

### Testing Tab Navigation

```typescript
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

const Tab = createBottomTabNavigator();

function TabsStack({ authValue }) {
  return (
    <NavigationContainer>
      <MockAuthProvider value={authValue}>
        <Tab.Navigator>
          <Tab.Screen name="Home" component={HomeScreen} />
          <Tab.Screen name="Profile" component={ProfileScreen} />
          <Tab.Screen name="Settings" component={SettingsScreen} />
        </Tab.Navigator>
      </MockAuthProvider>
    </NavigationContainer>
  );
}

describe('Tab Navigation', () => {
  it('Should switch between tabs', async () => {
    const authValue = createMockAuthValue();
    authValue.state.user = { id: '1', name: 'John' };

    const { getByTestId, getByText } = render(<TabsStack authValue={authValue} />);

    // Initially on Home tab
    expect(getByTestId('home-screen')).toBeTruthy();

    // Navigate to Profile tab
    fireEvent.press(getByText('Profile'));
    await waitFor(() => {
      expect(getByTestId('profile-screen')).toBeTruthy();
    });

    // Navigate to Settings tab
    fireEvent.press(getByText('Settings'));
    await waitFor(() => {
      expect(getByTestId('settings-screen')).toBeTruthy();
    });
  });
});
```

### Testing Navigation with Parameters

```typescript
// ListScreen navigates to Detail with item ID
function ListScreen() {
  const router = useRouter();
  const { state } = useDataContext();

  return (
    <View testID="list-screen">
      {state.items.map(item => (
        <TouchableOpacity
          key={item.id}
          testID={`item-${item.id}`}
          onPress={() => router.push(`/detail/${item.id}`)}
        >
          <Text>{item.title}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// DetailScreen receives and displays item ID
function DetailScreen() {
  const { id } = useLocalSearchParams();
  const { state } = useDataContext();
  
  const item = state.items.find(i => i.id === id);

  return (
    <View testID="detail-screen">
      <Text testID="detail-title">{item?.title}</Text>
      <Text testID="detail-id">{id}</Text>
    </View>
  );
}

describe('Navigation with Parameters', () => {
  it('Should pass item ID to detail screen', async () => {
    const mockValue = createMockDataValue();
    mockValue.state.items = [
      { id: '1', title: 'First Item' },
      { id: '2', title: 'Second Item' },
    ];

    const { getByTestId } = render(<AppStack mockDataValue={mockValue} />);

    fireEvent.press(getByTestId('item-1'));

    await waitFor(() => {
      expect(getByTestId('detail-screen')).toBeTruthy();
      expect(getByTestId('detail-id')).toHaveTextContent('1');
      expect(getByTestId('detail-title')).toHaveTextContent('First Item');
    });
  });
});
```

## Multi-Context Testing

### Testing Context Interactions

Test how contexts interact with each other:

```typescript
// Components use both Auth and Data contexts
function DataScreen() {
  const { state: authState } = useAuthContext();
  const { state: dataState, actions: dataActions } = useDataContext();

  useEffect(() => {
    if (authState.user) {
      dataActions.fetchUserData(authState.user.id);
    }
  }, [authState.user]);

  if (!authState.user) {
    return <Text testID="not-authenticated">Please log in</Text>;
  }

  if (dataState.loading) {
    return <Text testID="loading">Loading...</Text>;
  }

  return (
    <View testID="data-screen">
      {dataState.items.map(item => (
        <Text key={item.id} testID={`item-${item.id}`}>
          {item.title}
        </Text>
      ))}
    </View>
  );
}

describe('Context Interactions', () => {
  it('Should fetch data when user logs in', async () => {
    const authValue = createMockAuthValue();
    const dataValue = createMockDataValue();
    const mockFetchUserData = jest.fn();
    dataValue.actions.fetchUserData = mockFetchUserData;

    // Initially not authenticated
    authValue.state.user = null;

    const { getByTestId, rerender } = render(
      <MockAuthProvider value={authValue}>
        <MockDataProvider value={dataValue}>
          <DataScreen />
        </MockDataProvider>
      </MockAuthProvider>
    );

    expect(getByTestId('not-authenticated')).toBeTruthy();
    expect(mockFetchUserData).not.toHaveBeenCalled();

    // User logs in
    const newAuthValue = createMockAuthValue();
    newAuthValue.state.user = { id: '1', name: 'John' };

    rerender(
      <MockAuthProvider value={newAuthValue}>
        <MockDataProvider value={dataValue}>
          <DataScreen />
        </MockDataProvider>
      </MockAuthProvider>
    );

    await waitFor(() => {
      expect(mockFetchUserData).toHaveBeenCalledWith('1');
    });
  });
});
```

## Complete User Flows

### Testing End-to-End Workflows

Test complete user journeys through the application:

```typescript
describe('Complete Login Flow', () => {
  it('Should log in and navigate to home screen', async () => {
    const authValue = createMockAuthValue();
    const mockLogin = jest.fn().mockResolvedValue(undefined);
    authValue.actions.login = mockLogin;
    authValue.state.user = null;

    const { getByTestId, rerender } = render(
      <NavigationContainer>
        <MockAuthProvider value={authValue}>
          <Stack.Navigator>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Home" component={HomeScreen} />
          </Stack.Navigator>
        </MockAuthProvider>
      </NavigationContainer>
    );

    // On login screen
    expect(getByTestId('login-screen')).toBeTruthy();

    // Fill in credentials
    fireEvent.changeText(getByTestId('email-input'), 'test@example.com');
    fireEvent.changeText(getByTestId('password-input'), 'password123');

    // Submit form
    fireEvent.press(getByTestId('login-button'));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
    });

    // Simulate successful login
    const loggedInAuthValue = createMockAuthValue();
    loggedInAuthValue.state.user = { id: '1', name: 'John' };

    rerender(
      <NavigationContainer>
        <MockAuthProvider value={loggedInAuthValue}>
          <Stack.Navigator>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Home" component={HomeScreen} />
          </Stack.Navigator>
        </MockAuthProvider>
      </NavigationContainer>
    );

    // Should navigate to home screen
    await waitFor(() => {
      expect(getByTestId('home-screen')).toBeTruthy();
    });
  });
});

describe('Complete Shopping Flow', () => {
  it('Should browse, add to cart, and checkout', async () => {
    const dataValue = createMockDataValue();
    dataValue.state.items = [
      { id: '1', title: 'Product 1', price: 10 },
      { id: '2', title: 'Product 2', price: 20 },
    ];

    const cartValue = createMockCartValue();
    const mockAddToCart = jest.fn();
    cartValue.actions.addToCart = mockAddToCart;

    const { getByTestId } = render(
      <NavigationContainer>
        <MockDataProvider value={dataValue}>
          <MockCartProvider value={cartValue}>
            <Stack.Navigator>
              <Stack.Screen name="Products" component={ProductsScreen} />
              <Stack.Screen name="Cart" component={CartScreen} />
              <Stack.Screen name="Checkout" component={CheckoutScreen} />
            </Stack.Navigator>
          </MockCartProvider>
        </MockDataProvider>
      </NavigationContainer>
    );

    // On products screen
    expect(getByTestId('products-screen')).toBeTruthy();

    // Add product to cart
    fireEvent.press(getByTestId('add-to-cart-1'));
    await waitFor(() => {
      expect(mockAddToCart).toHaveBeenCalledWith('1');
    });

    // Navigate to cart
    fireEvent.press(getByTestId('cart-button'));
    await waitFor(() => {
      expect(getByTestId('cart-screen')).toBeTruthy();
    });

    // Proceed to checkout
    fireEvent.press(getByTestId('checkout-button'));
    await waitFor(() => {
      expect(getByTestId('checkout-screen')).toBeTruthy();
    });
  });
});
```

## Mock Navigation Stacks

### Creating Reusable Mock Stacks

Create reusable mock stacks for different test scenarios:

```typescript
// app/__tests__/mocks/navigation.mock.tsx
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '@/app/(tabs)/home';
import DetailScreen from '@/app/detail/[id]';
import { MockDataProvider } from '@/contexts/__tests__/DataContext.mock';
import { MockAuthProvider } from '@/contexts/__tests__/AuthContext.mock';

const Stack = createNativeStackNavigator();

export function createTestNavigator(screens: Array<{ name: string; component: React.ComponentType }>) {
  return function TestNavigator({ authValue, dataValue }) {
    return (
      <NavigationContainer>
        <MockAuthProvider value={authValue}>
          <MockDataProvider value={dataValue}>
            <Stack.Navigator>
              {screens.map(screen => (
                <Stack.Screen key={screen.name} name={screen.name} component={screen.component} />
              ))}
            </Stack.Navigator>
          </MockDataProvider>
        </MockAuthProvider>
      </NavigationContainer>
    );
  };
}

// Usage in tests
const AppNavigator = createTestNavigator([
  { name: 'Home', component: HomeScreen },
  { name: 'Detail', component: DetailScreen },
]);

describe('Navigation', () => {
  it('Should navigate between screens', async () => {
    const authValue = createMockAuthValue();
    const dataValue = createMockDataValue();

    const { getByTestId } = render(
      <AppNavigator authValue={authValue} dataValue={dataValue} />
    );

    // Test navigation
  });
});
```

### Screen-Specific Mock Stacks

```typescript
// app/(tabs)/__tests__/home.mock.tsx
type RootStackParamList = {
  Home: undefined;
  Detail: { id: string };
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

type HomeScreenStackProps = {
  authValue: AuthContextValue;
  dataValue: DataContextValue;
};

export function HomeScreenStack({ authValue, dataValue }: HomeScreenStackProps) {
  return (
    <NavigationContainer>
      <MockAuthProvider value={authValue}>
        <MockDataProvider value={dataValue}>
          <Stack.Navigator initialRouteName="Home">
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Detail">
              {({ route }) => <DetailScreen testID="detail-screen" id={route.params.id} />}
            </Stack.Screen>
            <Stack.Screen name="Profile">
              {() => <ProfileScreen testID="profile-screen" />}
            </Stack.Screen>
          </Stack.Navigator>
        </MockDataProvider>
      </MockAuthProvider>
    </NavigationContainer>
  );
}
```

## Examples

### Complete Integration Test Example

```typescript
// app/(tabs)/__tests__/home.integration.test.tsx
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { HomeScreenStack } from './home.mock';
import { createMockAuthValue } from '@/contexts/__tests__/AuthContext.mock';
import { createMockDataValue } from '@/contexts/__tests__/DataContext.mock';

describe('HomeScreen Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Should complete full workflow: load, display, navigate', async () => {
    // Setup
    const authValue = createMockAuthValue();
    authValue.state.user = { id: '1', name: 'John Doe' };

    const dataValue = createMockDataValue();
    dataValue.state.items = [
      { id: '1', title: 'First Item', description: 'Description 1' },
      { id: '2', title: 'Second Item', description: 'Description 2' },
    ];

    // Render
    const { getByTestId } = render(
      <HomeScreenStack authValue={authValue} dataValue={dataValue} />
    );

    // Verify home screen rendered
    expect(getByTestId('home-screen')).toBeTruthy();
    expect(getByTestId('item-1')).toBeTruthy();
    expect(getByTestId('item-2')).toBeTruthy();

    // Navigate to detail
    fireEvent.press(getByTestId('item-1'));

    // Verify navigation to detail screen
    await waitFor(() => {
      expect(getByTestId('detail-screen')).toBeTruthy();
    });

    // Verify correct item displayed
    expect(getByTestId('detail-title')).toHaveTextContent('First Item');
    expect(getByTestId('detail-description')).toHaveTextContent('Description 1');

    // Navigate back
    fireEvent.press(getByTestId('back-button'));

    // Verify back on home screen
    await waitFor(() => {
      expect(getByTestId('home-screen')).toBeTruthy();
    });
  });

  it('Should handle errors gracefully', async () => {
    const authValue = createMockAuthValue();
    authValue.state.user = { id: '1', name: 'John' };

    const dataValue = createMockDataValue();
    dataValue.state.error = 'Failed to load data';

    const { getByTestId } = render(
      <HomeScreenStack authValue={authValue} dataValue={dataValue} />
    );

    expect(getByTestId('error-message')).toHaveTextContent('Failed to load data');
    expect(getByTestId('retry-button')).toBeTruthy();
  });

  it('Should require authentication', async () => {
    const authValue = createMockAuthValue();
    authValue.state.user = null;

    const dataValue = createMockDataValue();

    const { getByTestId } = render(
      <HomeScreenStack authValue={authValue} dataValue={dataValue} />
    );

    expect(getByTestId('login-required')).toBeTruthy();
  });
});
```

## Best Practices

### Do's

- ✅ Use real NavigationContainer in tests
- ✅ Use real context providers with mock data
- ✅ Test navigation results, not actions
- ✅ Test complete user workflows
- ✅ Verify state changes across screens
- ✅ Test error scenarios and edge cases

### Don'ts

- ❌ Don't mock NavigationContainer
- ❌ Don't test navigation actions directly
- ❌ Don't test implementation details
- ❌ Don't share state between tests
- ❌ Don't forget to test error cases

## Next Steps

- Read [Mocking Strategy](./mocking-strategy.md) for advanced mocking patterns
- Read [Best Practices](./best-practices.md) for testing conventions
- See [Unit Testing](./unit-testing.md) for component-level tests
