/**
 * ThemeContext tests
 *
 * Following patterns from comprehend/design-docs/testing/unit-testing.md
 * Tests theme state management, system preference detection, AsyncStorage persistence,
 * and theme switching
 */

import { render, waitFor } from "@testing-library/react-native";
import { Text, View } from "react-native";
import { ThemeProvider } from "@/contexts/ThemeContext/Provider";
import { useTheme } from "@/contexts/ThemeContext/use-theme";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Mock AsyncStorage
jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

// Mock useColorScheme
const mockUseColorScheme = jest.fn();
jest.mock("react-native", () => {
  const RN = jest.requireActual("react-native");
  return {
    ...RN,
    useColorScheme: () => mockUseColorScheme(),
  };
});

// Test component that uses theme
function TestComponent() {
  const { mode, colors, isDark } = useTheme();

  return (
    <View testID="test-component">
      <Text testID="mode">{mode}</Text>
      <Text testID="is-dark">{isDark.toString()}</Text>
      <Text testID="background-color">{colors.background}</Text>
      <Text testID="text-color">{colors.text}</Text>
    </View>
  );
}

describe("ThemeContext", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    mockUseColorScheme.mockReturnValue("light");
  });

  describe("Initialization", () => {
    it("Should default to system theme when no saved preference", async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      mockUseColorScheme.mockReturnValue("light");

      const { getByTestId } = render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>,
      );

      await waitFor(() => {
        expect(getByTestId("mode")).toHaveTextContent("system");
      });
    });

    it("Should load saved theme preference from AsyncStorage", async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue("dark");

      const { getByTestId } = render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>,
      );

      await waitFor(() => {
        expect(getByTestId("mode")).toHaveTextContent("dark");
        expect(getByTestId("is-dark")).toHaveTextContent("true");
      });
    });

    it("Should use light colors when system preference is light", async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue("system");
      mockUseColorScheme.mockReturnValue("light");

      const { getByTestId } = render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>,
      );

      await waitFor(() => {
        expect(getByTestId("background-color")).toHaveTextContent("#FFFFFF");
        expect(getByTestId("text-color")).toHaveTextContent("#000000");
        expect(getByTestId("is-dark")).toHaveTextContent("false");
      });
    });

    it("Should use dark colors when system preference is dark", async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue("system");
      mockUseColorScheme.mockReturnValue("dark");

      const { getByTestId } = render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>,
      );

      await waitFor(() => {
        expect(getByTestId("background-color")).toHaveTextContent("#000000");
        expect(getByTestId("text-color")).toHaveTextContent("#FFFFFF");
        expect(getByTestId("is-dark")).toHaveTextContent("true");
      });
    });
  });

  describe("Theme Switching", () => {
    it("Should switch to light theme and persist to AsyncStorage", async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue("dark");
      mockUseColorScheme.mockReturnValue("light");

      function TestComponentWithButton() {
        const { mode, setTheme } = useTheme();
        return (
          <View>
            <Text testID="mode">{mode}</Text>
            <Text testID="switch-button" onPress={() => setTheme("light")}>
              Switch to Light
            </Text>
          </View>
        );
      }

      const { getByTestId } = render(
        <ThemeProvider>
          <TestComponentWithButton />
        </ThemeProvider>,
      );

      await waitFor(() => {
        expect(getByTestId("mode")).toHaveTextContent("dark");
      });

      // Simulate button press
      const switchButton = getByTestId("switch-button");
      switchButton.props.onPress();

      await waitFor(() => {
        expect(AsyncStorage.setItem).toHaveBeenCalledWith("@theme", "light");
        expect(getByTestId("mode")).toHaveTextContent("light");
      });
    });

    it("Should switch to dark theme and persist to AsyncStorage", async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue("light");
      mockUseColorScheme.mockReturnValue("light");

      function TestComponentWithButton() {
        const { mode, setTheme } = useTheme();
        return (
          <View>
            <Text testID="mode">{mode}</Text>
            <Text testID="switch-button" onPress={() => setTheme("dark")}>
              Switch to Dark
            </Text>
          </View>
        );
      }

      const { getByTestId } = render(
        <ThemeProvider>
          <TestComponentWithButton />
        </ThemeProvider>,
      );

      await waitFor(() => {
        expect(getByTestId("mode")).toHaveTextContent("light");
      });

      // Simulate button press
      const switchButton = getByTestId("switch-button");
      switchButton.props.onPress();

      await waitFor(() => {
        expect(AsyncStorage.setItem).toHaveBeenCalledWith("@theme", "dark");
        expect(getByTestId("mode")).toHaveTextContent("dark");
      });
    });

    it("Should switch to system theme and persist to AsyncStorage", async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue("light");
      mockUseColorScheme.mockReturnValue("dark");

      function TestComponentWithButton() {
        const { mode, isDark, setTheme } = useTheme();
        return (
          <View>
            <Text testID="mode">{mode}</Text>
            <Text testID="is-dark">{isDark.toString()}</Text>
            <Text testID="switch-button" onPress={() => setTheme("system")}>
              Switch to System
            </Text>
          </View>
        );
      }

      const { getByTestId } = render(
        <ThemeProvider>
          <TestComponentWithButton />
        </ThemeProvider>,
      );

      await waitFor(() => {
        expect(getByTestId("mode")).toHaveTextContent("light");
      });

      // Simulate button press
      const switchButton = getByTestId("switch-button");
      switchButton.props.onPress();

      await waitFor(() => {
        expect(AsyncStorage.setItem).toHaveBeenCalledWith("@theme", "system");
        expect(getByTestId("mode")).toHaveTextContent("system");
        // Should use system preference (dark)
        expect(getByTestId("is-dark")).toHaveTextContent("true");
      });
    });
  });

  describe("Error Handling", () => {
    it("Should handle AsyncStorage getItem errors gracefully", async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValue(
        new Error("Storage error"),
      );
      mockUseColorScheme.mockReturnValue("light");

      // Should not throw, should default to system
      const { getByTestId } = render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>,
      );

      await waitFor(() => {
        expect(getByTestId("mode")).toHaveTextContent("system");
      });
    });

    it("Should handle AsyncStorage setItem errors gracefully", async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue("light");
      (AsyncStorage.setItem as jest.Mock).mockRejectedValue(
        new Error("Storage error"),
      );
      mockUseColorScheme.mockReturnValue("light");

      function TestComponentWithButton() {
        const { mode, setTheme } = useTheme();
        return (
          <View>
            <Text testID="mode">{mode}</Text>
            <Text testID="switch-button" onPress={() => setTheme("dark")}>
              Switch
            </Text>
          </View>
        );
      }

      const { getByTestId } = render(
        <ThemeProvider>
          <TestComponentWithButton />
        </ThemeProvider>,
      );

      await waitFor(() => {
        expect(getByTestId("mode")).toHaveTextContent("light");
      });

      // Should not throw, theme should still update in memory
      const switchButton = getByTestId("switch-button");
      switchButton.props.onPress();

      await waitFor(() => {
        expect(getByTestId("mode")).toHaveTextContent("dark");
      });
    });
  });
});
