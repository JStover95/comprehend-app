/**
 * Button component tests
 *
 * Following patterns from:
 * - comprehend/design-docs/testing/unit-testing.md - Component testing patterns
 * - comprehend/design-docs/accessibility.md - WCAG 2.1 AA requirements
 */

import { render, fireEvent } from "@testing-library/react-native";
import { Button } from "@/components/ui/Button";
import {
  MockThemeProvider,
  createMockThemeValue,
} from "@/__tests__/contexts/ThemeContext.mock";
import { BUTTON_IDS } from "@/components/components.ids";

describe("Button", () => {
  const defaultProps = {
    title: "Test Button",
    onPress: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Accessibility", () => {
    it("should have correct accessibility role", () => {
      const mockValue = createMockThemeValue();
      const { getByRole } = render(
        <MockThemeProvider value={mockValue}>
          <Button {...defaultProps} />
        </MockThemeProvider>,
      );

      expect(getByRole("button")).toBeTruthy();
    });

    it("should have accessibility label", () => {
      const mockValue = createMockThemeValue();
      const { getByLabelText } = render(
        <MockThemeProvider value={mockValue}>
          <Button {...defaultProps} accessibilityLabel="Custom label" />
        </MockThemeProvider>,
      );

      expect(getByLabelText("Custom label")).toBeTruthy();
    });

    it("should use title as accessibility label when not provided", () => {
      const mockValue = createMockThemeValue();
      const { getByLabelText } = render(
        <MockThemeProvider value={mockValue}>
          <Button {...defaultProps} />
        </MockThemeProvider>,
      );

      expect(getByLabelText("Test Button")).toBeTruthy();
    });

    it("should indicate disabled state", () => {
      const mockValue = createMockThemeValue();
      const { getByRole } = render(
        <MockThemeProvider value={mockValue}>
          <Button {...defaultProps} disabled />
        </MockThemeProvider>,
      );

      const button = getByRole("button");
      expect(button.props.accessibilityState?.disabled).toBe(true);
    });
  });

  describe("Touch Target Size", () => {
    it("should have minimum 44x44 touch target", () => {
      const mockValue = createMockThemeValue();
      const { getByTestId } = render(
        <MockThemeProvider value={mockValue}>
          <Button {...defaultProps} testID={BUTTON_IDS.CONTAINER} />
        </MockThemeProvider>,
      );

      const button = getByTestId(BUTTON_IDS.CONTAINER);
      const style = button.props.style;
      const flatStyle = Array.isArray(style)
        ? style.reduce((acc, s) => ({ ...acc, ...s }), {})
        : style;

      expect(flatStyle.minHeight).toBeGreaterThanOrEqual(44);
      expect(flatStyle.minWidth || flatStyle.width || 0).toBeGreaterThanOrEqual(
        44,
      );
    });
  });

  describe("Theme Colors", () => {
    it("should use light theme colors when in light mode", () => {
      const mockValue = createMockThemeValue({ mode: "light" });
      const { getByTestId } = render(
        <MockThemeProvider value={mockValue}>
          <Button
            {...defaultProps}
            variant="primary"
            testID={BUTTON_IDS.CONTAINER}
          />
        </MockThemeProvider>,
      );

      const button = getByTestId(BUTTON_IDS.CONTAINER);
      const style = button.props.style;
      const flatStyle = Array.isArray(style)
        ? style.reduce((acc, s) => ({ ...acc, ...s }), {})
        : style;

      expect(flatStyle.backgroundColor).toBe(mockValue.colors.primary);
    });

    it("should use dark theme colors when in dark mode", () => {
      const mockValue = createMockThemeValue({ mode: "dark" });
      const { getByTestId } = render(
        <MockThemeProvider value={mockValue}>
          <Button
            {...defaultProps}
            variant="primary"
            testID={BUTTON_IDS.CONTAINER}
          />
        </MockThemeProvider>,
      );

      const button = getByTestId(BUTTON_IDS.CONTAINER);
      const style = button.props.style;
      const flatStyle = Array.isArray(style)
        ? style.reduce((acc, s) => ({ ...acc, ...s }), {})
        : style;

      expect(flatStyle.backgroundColor).toBe(mockValue.colors.primary);
    });
  });

  describe("Disabled State", () => {
    it("should not call onPress when disabled", () => {
      const mockValue = createMockThemeValue();
      const onPress = jest.fn();
      const { getByRole } = render(
        <MockThemeProvider value={mockValue}>
          <Button title="Test" onPress={onPress} disabled />
        </MockThemeProvider>,
      );

      const button = getByRole("button");
      fireEvent.press(button);

      expect(onPress).not.toHaveBeenCalled();
    });

    it("should have reduced opacity when disabled", () => {
      const mockValue = createMockThemeValue();
      const { getByTestId } = render(
        <MockThemeProvider value={mockValue}>
          <Button {...defaultProps} disabled testID={BUTTON_IDS.CONTAINER} />
        </MockThemeProvider>,
      );

      const button = getByTestId(BUTTON_IDS.CONTAINER);
      const style = button.props.style;
      const flatStyle = Array.isArray(style)
        ? style.reduce((acc, s) => ({ ...acc, ...s }), {})
        : style;

      // Disabled buttons typically have reduced opacity
      expect(flatStyle.opacity).toBeLessThan(1);
    });
  });

  describe("onPress Handler", () => {
    it("should call onPress when button is pressed", () => {
      const mockValue = createMockThemeValue();
      const onPress = jest.fn();
      const { getByRole } = render(
        <MockThemeProvider value={mockValue}>
          <Button title="Test" onPress={onPress} />
        </MockThemeProvider>,
      );

      const button = getByRole("button");
      fireEvent.press(button);

      expect(onPress).toHaveBeenCalledTimes(1);
    });

    it("should not call onPress when button is disabled", () => {
      const mockValue = createMockThemeValue();
      const onPress = jest.fn();
      const { getByRole } = render(
        <MockThemeProvider value={mockValue}>
          <Button title="Test" onPress={onPress} disabled />
        </MockThemeProvider>,
      );

      const button = getByRole("button");
      fireEvent.press(button);

      expect(onPress).not.toHaveBeenCalled();
    });
  });

  describe("Test IDs", () => {
    it("should use test IDs from components.ids.ts", () => {
      const mockValue = createMockThemeValue();
      const { getByTestId } = render(
        <MockThemeProvider value={mockValue}>
          <Button {...defaultProps} testID={BUTTON_IDS.CONTAINER} />
        </MockThemeProvider>,
      );

      expect(getByTestId(BUTTON_IDS.CONTAINER)).toBeTruthy();
    });
  });
});
