/**
 * useTheme hook tests
 *
 * Following patterns from comprehend/design-docs/testing/unit-testing.md Hook Testing
 * Tests useTheme hook with MockThemeProvider
 */

import { renderHook } from "@testing-library/react-native";
import { useTheme } from "@/contexts/ThemeContext/use-theme";
import {
  MockThemeProvider,
  createMockThemeValue,
} from "@/__tests__/contexts/ThemeContext.mock";

describe("useTheme", () => {
  describe("With MockThemeProvider", () => {
    it("Should return theme context value when used within provider", () => {
      const mockValue = createMockThemeValue({ mode: "light" });

      const { result } = renderHook(() => useTheme(), {
        wrapper: ({ children }) => (
          <MockThemeProvider value={mockValue}>{children}</MockThemeProvider>
        ),
      });

      expect(result.current.mode).toBe("light");
      expect(result.current.isDark).toBe(false);
      expect(result.current.colors).toBeDefined();
      expect(result.current.typography).toBeDefined();
      expect(result.current.spacing).toBeDefined();
      expect(result.current.borderRadius).toBeDefined();
      expect(result.current.setTheme).toBeDefined();
    });

    it("Should return dark theme when mode is dark", () => {
      const mockValue = createMockThemeValue({ mode: "dark" });

      const { result } = renderHook(() => useTheme(), {
        wrapper: ({ children }) => (
          <MockThemeProvider value={mockValue}>{children}</MockThemeProvider>
        ),
      });

      expect(result.current.mode).toBe("dark");
      expect(result.current.isDark).toBe(true);
      expect(result.current.colors.background).toBe("#000000");
      expect(result.current.colors.text).toBe("#FFFFFF");
    });

    it("Should return system theme when mode is system", () => {
      const mockValue = createMockThemeValue({ mode: "system" });

      const { result } = renderHook(() => useTheme(), {
        wrapper: ({ children }) => (
          <MockThemeProvider value={mockValue}>{children}</MockThemeProvider>
        ),
      });

      expect(result.current.mode).toBe("system");
    });

    it("Should call setTheme when provided", () => {
      const mockSetTheme = jest.fn();
      const mockValue = createMockThemeValue({
        mode: "light",
        setTheme: mockSetTheme,
      });

      const { result } = renderHook(() => useTheme(), {
        wrapper: ({ children }) => (
          <MockThemeProvider value={mockValue}>{children}</MockThemeProvider>
        ),
      });

      result.current.setTheme("dark");
      expect(mockSetTheme).toHaveBeenCalledWith("dark");
    });
  });

  describe("Error Handling", () => {
    it("Should throw error when used outside provider", () => {
      // Suppress console.error for this test
      const originalError = console.error;
      console.error = jest.fn();

      expect(() => {
        renderHook(() => useTheme());
      }).toThrow("useTheme must be used within a ThemeProvider");

      console.error = originalError;
    });
  });
});
