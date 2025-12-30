/**
 * System theme change test for ThemeContext
 *
 * Tests that the app responds to system theme changes while running (SC-008)
 * by mocking useColorScheme changes and verifying theme updates propagate correctly.
 *
 * Following patterns from:
 * - comprehend/design-docs/testing/unit-testing.md - Hook testing, mock provider pattern
 * - comprehend/design-docs/context-pattern.md - Context testing
 */

import React from "react";
import { renderHook, waitFor, act } from "@testing-library/react-native";
import { useColorScheme } from "react-native";
import { ThemeProvider } from "@/contexts/ThemeContext/Provider";
import { useTheme } from "@/contexts/ThemeContext/use-theme";
import { Colors } from "@/constants/theme";

// Mock useColorScheme
jest.mock("react-native", () => {
  const actual = jest.requireActual("react-native");
  return {
    ...actual,
    useColorScheme: jest.fn(() => "light"),
  };
});

// Mock AsyncStorage
jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
}));

describe("ThemeContext System Theme Change", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset to light mode
    (useColorScheme as jest.Mock).mockReturnValue("light");
  });

  it("Should respond to system theme change from light to dark", async () => {
    const { result, rerender } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => <ThemeProvider>{children}</ThemeProvider>,
    });

    // Initially should be light (system is light, mode is system)
    await waitFor(() => {
      expect(result.current.isDark).toBe(false);
      expect(result.current.colors).toEqual(Colors.light);
    });

    // Change system theme to dark
    (useColorScheme as jest.Mock).mockReturnValue("dark");

    // Re-render to trigger useColorScheme update
    rerender(() => useTheme());

    await waitFor(() => {
      expect(result.current.isDark).toBe(true);
      expect(result.current.colors).toEqual(Colors.dark);
    });
  });

  it("Should respond to system theme change from dark to light", async () => {
    // Start with dark system theme
    (useColorScheme as jest.Mock).mockReturnValue("dark");

    const { result, rerender } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => <ThemeProvider>{children}</ThemeProvider>,
    });

    // Initially should be dark
    await waitFor(() => {
      expect(result.current.isDark).toBe(true);
      expect(result.current.colors).toEqual(Colors.dark);
    });

    // Change system theme to light
    (useColorScheme as jest.Mock).mockReturnValue("light");

    // Re-render to trigger useColorScheme update
    rerender(() => useTheme());

    await waitFor(() => {
      expect(result.current.isDark).toBe(false);
      expect(result.current.colors).toEqual(Colors.light);
    });
  });

  it("Should not respond to system theme change when mode is 'light'", async () => {
    const { result, rerender } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => <ThemeProvider>{children}</ThemeProvider>,
    });

    // Set theme to light (not system)
    await act(async () => {
      await result.current.setTheme("light");
    });

    await waitFor(() => {
      expect(result.current.mode).toBe("light");
      expect(result.current.isDark).toBe(false);
      expect(result.current.colors).toEqual(Colors.light);
    });

    // Change system theme to dark
    (useColorScheme as jest.Mock).mockReturnValue("dark");

    // Re-render
    rerender(() => useTheme());

    // Should still be light (mode is 'light', not 'system')
    await waitFor(() => {
      expect(result.current.mode).toBe("light");
      expect(result.current.isDark).toBe(false);
      expect(result.current.colors).toEqual(Colors.light);
    });
  });

  it("Should not respond to system theme change when mode is 'dark'", async () => {
    const { result, rerender } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => <ThemeProvider>{children}</ThemeProvider>,
    });

    // Set theme to dark (not system)
    await act(async () => {
      await result.current.setTheme("dark");
    });

    await waitFor(() => {
      expect(result.current.mode).toBe("dark");
      expect(result.current.isDark).toBe(true);
      expect(result.current.colors).toEqual(Colors.dark);
    });

    // Change system theme to light
    (useColorScheme as jest.Mock).mockReturnValue("light");

    // Re-render
    rerender(() => useTheme());

    // Should still be dark (mode is 'dark', not 'system')
    await waitFor(() => {
      expect(result.current.mode).toBe("dark");
      expect(result.current.isDark).toBe(true);
      expect(result.current.colors).toEqual(Colors.dark);
    });
  });

  it("Should respond to system theme change when switching back to 'system' mode", async () => {
    const { result, rerender } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => <ThemeProvider>{children}</ThemeProvider>,
    });

    // Set theme to light (explicit)
    await act(async () => {
      await result.current.setTheme("light");
    });

    await waitFor(() => {
      expect(result.current.isDark).toBe(false);
    });

    // Switch back to system mode
    await act(async () => {
      await result.current.setTheme("system");
    });

    // System is light, so should be light
    await waitFor(() => {
      expect(result.current.mode).toBe("system");
      expect(result.current.isDark).toBe(false);
      expect(result.current.colors).toEqual(Colors.light);
    });

    // Change system theme to dark
    (useColorScheme as jest.Mock).mockReturnValue("dark");
    rerender(() => useTheme());

    // Should now be dark (system changed)
    await waitFor(() => {
      expect(result.current.mode).toBe("system");
      expect(result.current.isDark).toBe(true);
      expect(result.current.colors).toEqual(Colors.dark);
    });
  });

  it("Should propagate theme changes to all consuming components", async () => {
    let themeValue: ReturnType<typeof useTheme> | null = null;

    function TestComponent() {
      const theme = useTheme();
      themeValue = theme;
      return null;
    }

    const { rerender } = renderHook(() => null, {
      wrapper: ({ children }) => (
        <ThemeProvider>
          <TestComponent />
          {children}
        </ThemeProvider>
      ),
    });

    await waitFor(() => {
      expect(themeValue).not.toBeNull();
      expect(themeValue?.isDark).toBe(false);
    });

    // Change system theme
    (useColorScheme as jest.Mock).mockReturnValue("dark");
    rerender(() => null);

    await waitFor(() => {
      expect(themeValue?.isDark).toBe(true);
      expect(themeValue?.colors).toEqual(Colors.dark);
    });
  });
});
