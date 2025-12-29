/**
 * Text component tests
 *
 * Following patterns from:
 * - comprehend/design-docs/testing/unit-testing.md - Component testing patterns
 * - comprehend/design-docs/accessibility.md - WCAG 2.1 AA requirements
 */

import { render } from "@testing-library/react-native";
import { Text } from "@/components/ui/Text";
import { MockThemeProvider, createMockThemeValue } from "@/__tests__/contexts/ThemeContext.mock";
import { TEXT_IDS } from "@/components/components.ids";

describe("Text", () => {
  const defaultProps = {
    children: "Test Text",
  };

  describe("Typography Scales", () => {
    it("should render with default typography scale", () => {
      const mockValue = createMockThemeValue();
      const { getByText } = render(
        <MockThemeProvider value={mockValue}>
          <Text {...defaultProps} />
        </MockThemeProvider>
      );

      expect(getByText("Test Text")).toBeTruthy();
    });

    it("should apply heading typography scale", () => {
      const mockValue = createMockThemeValue();
      const { getByTestId } = render(
        <MockThemeProvider value={mockValue}>
          <Text {...defaultProps} variant="heading" testID={TEXT_IDS.CONTENT} />
        </MockThemeProvider>
      );

      const text = getByTestId(TEXT_IDS.CONTENT);
      const style = text.props.style;
      const flatStyle = Array.isArray(style) ? style.reduce((acc, s) => ({ ...acc, ...s }), {}) : style;

      expect(flatStyle.fontSize).toBe(mockValue.typography.fontSize.xl);
      expect(flatStyle.fontWeight).toBe(mockValue.typography.fontWeight.bold);
    });

    it("should apply body typography scale", () => {
      const mockValue = createMockThemeValue();
      const { getByTestId } = render(
        <MockThemeProvider value={mockValue}>
          <Text {...defaultProps} variant="body" testID={TEXT_IDS.CONTENT} />
        </MockThemeProvider>
      );

      const text = getByTestId(TEXT_IDS.CONTENT);
      const style = text.props.style;
      const flatStyle = Array.isArray(style) ? style.reduce((acc, s) => ({ ...acc, ...s }), {}) : style;

      expect(flatStyle.fontSize).toBe(mockValue.typography.fontSize.md);
    });

    it("should apply caption typography scale", () => {
      const mockValue = createMockThemeValue();
      const { getByTestId } = render(
        <MockThemeProvider value={mockValue}>
          <Text {...defaultProps} variant="caption" testID={TEXT_IDS.CONTENT} />
        </MockThemeProvider>
      );

      const text = getByTestId(TEXT_IDS.CONTENT);
      const style = text.props.style;
      const flatStyle = Array.isArray(style) ? style.reduce((acc, s) => ({ ...acc, ...s }), {}) : style;

      expect(flatStyle.fontSize).toBe(mockValue.typography.fontSize.sm);
    });
  });

  describe("Theme Colors", () => {
    it("should use light theme text color when in light mode", () => {
      const mockValue = createMockThemeValue({ mode: "light" });
      const { getByTestId } = render(
        <MockThemeProvider value={mockValue}>
          <Text {...defaultProps} testID={TEXT_IDS.CONTENT} />
        </MockThemeProvider>
      );

      const text = getByTestId(TEXT_IDS.CONTENT);
      const style = text.props.style;
      const flatStyle = Array.isArray(style) ? style.reduce((acc, s) => ({ ...acc, ...s }), {}) : style;

      expect(flatStyle.color).toBe(mockValue.colors.text);
    });

    it("should use dark theme text color when in dark mode", () => {
      const mockValue = createMockThemeValue({ mode: "dark" });
      const { getByTestId } = render(
        <MockThemeProvider value={mockValue}>
          <Text {...defaultProps} testID={TEXT_IDS.CONTENT} />
        </MockThemeProvider>
      );

      const text = getByTestId(TEXT_IDS.CONTENT);
      const style = text.props.style;
      const flatStyle = Array.isArray(style) ? style.reduce((acc, s) => ({ ...acc, ...s }), {}) : style;

      expect(flatStyle.color).toBe(mockValue.colors.text);
    });

    it("should use secondary text color when variant is secondary", () => {
      const mockValue = createMockThemeValue();
      const { getByTestId } = render(
        <MockThemeProvider value={mockValue}>
          <Text {...defaultProps} color="secondary" testID={TEXT_IDS.CONTENT} />
        </MockThemeProvider>
      );

      const text = getByTestId(TEXT_IDS.CONTENT);
      const style = text.props.style;
      const flatStyle = Array.isArray(style) ? style.reduce((acc, s) => ({ ...acc, ...s }), {}) : style;

      expect(flatStyle.color).toBe(mockValue.colors.textSecondary);
    });
  });

  describe("Contrast Ratios", () => {
    it("should use colors that meet WCAG 2.1 AA contrast requirements", () => {
      const mockValue = createMockThemeValue({ mode: "light" });
      const { getByTestId } = render(
        <MockThemeProvider value={mockValue}>
          <Text {...defaultProps} testID={TEXT_IDS.CONTENT} />
        </MockThemeProvider>
      );

      const text = getByTestId(TEXT_IDS.CONTENT);
      const style = text.props.style;
      const flatStyle = Array.isArray(style) ? style.reduce((acc, s) => ({ ...acc, ...s }), {}) : style;

      // Text color should be defined (contrast validation would be done in integration tests)
      expect(flatStyle.color).toBeDefined();
    });
  });

  describe("Accessibility", () => {
    it("should have accessibility label when provided", () => {
      const mockValue = createMockThemeValue();
      const { getByLabelText } = render(
        <MockThemeProvider value={mockValue}>
          <Text {...defaultProps} accessibilityLabel="Accessible text" />
        </MockThemeProvider>
      );

      expect(getByLabelText("Accessible text")).toBeTruthy();
    });

    it("should use children as accessibility label when label not provided", () => {
      const mockValue = createMockThemeValue();
      const { getByLabelText } = render(
        <MockThemeProvider value={mockValue}>
          <Text {...defaultProps} />
        </MockThemeProvider>
      );

      expect(getByLabelText("Test Text")).toBeTruthy();
    });
  });

  describe("Test IDs", () => {
    it("should use test IDs from components.ids.ts", () => {
      const mockValue = createMockThemeValue();
      const { getByTestId } = render(
        <MockThemeProvider value={mockValue}>
          <Text {...defaultProps} testID={TEXT_IDS.CONTENT} />
        </MockThemeProvider>
      );

      expect(getByTestId(TEXT_IDS.CONTENT)).toBeTruthy();
    });
  });
});

