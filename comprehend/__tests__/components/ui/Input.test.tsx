/**
 * Input component tests
 *
 * Following patterns from:
 * - comprehend/design-docs/testing/unit-testing.md - Component testing patterns
 * - comprehend/design-docs/accessibility.md - WCAG 2.1 AA requirements
 */

import { render, fireEvent } from "@testing-library/react-native";
import { Input } from "@/components/ui/Input";
import {
  MockThemeProvider,
  createMockThemeValue,
} from "@/__tests__/contexts/ThemeContext.mock";
import { INPUT_IDS } from "@/components/components.ids";
import { Form } from "@react-native-ama/forms";

describe("Input", () => {
  const defaultProps = {
    label: "Test Input",
    value: "",
    onChangeText: jest.fn(),
  };

  const mockOnSubmit = jest.fn(() => true);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Labels", () => {
    it("should render label", () => {
      const mockValue = createMockThemeValue();
      const { getByText } = render(
        <MockThemeProvider value={mockValue}>
          <Form onSubmit={mockOnSubmit}>
            <Input {...defaultProps} />
          </Form>
        </MockThemeProvider>,
      );

      expect(getByText("Test Input")).toBeTruthy();
    });

    it("should associate label with input field", () => {
      const mockValue = createMockThemeValue();
      const { getByLabelText } = render(
        <MockThemeProvider value={mockValue}>
          <Form onSubmit={mockOnSubmit}>
            <Input {...defaultProps} />
          </Form>
        </MockThemeProvider>,
      );

      expect(getByLabelText("Test Input")).toBeTruthy();
    });
  });

  describe("Error States", () => {
    it("should display error message when error is provided", () => {
      const mockValue = createMockThemeValue();
      const { getByText } = render(
        <MockThemeProvider value={mockValue}>
          <Form onSubmit={mockOnSubmit}>
            <Input {...defaultProps} error="This field is required" />
          </Form>
        </MockThemeProvider>,
      );

      expect(getByText("This field is required")).toBeTruthy();
    });

    it("should have error styling when error is present", () => {
      const mockValue = createMockThemeValue();
      const { getByTestId } = render(
        <MockThemeProvider value={mockValue}>
          <Form onSubmit={mockOnSubmit}>
            <Input {...defaultProps} error="Error" />
          </Form>
        </MockThemeProvider>,
      );

      const input = getByTestId(INPUT_IDS.FIELD);
      const style = input.props.style;
      const flatStyle = Array.isArray(style)
        ? style.reduce((acc, s) => ({ ...acc, ...s }), {})
        : style;

      // Error state should have different border color
      expect(flatStyle.borderColor).toBe(mockValue.colors.error);
    });

    it("should show error text indicator in addition to color", () => {
      const mockValue = createMockThemeValue();
      const { getByTestId } = render(
        <MockThemeProvider value={mockValue}>
          <Form onSubmit={mockOnSubmit}>
            <Input {...defaultProps} error="Error message" />
          </Form>
        </MockThemeProvider>,
      );

      expect(getByTestId(INPUT_IDS.ERROR)).toBeTruthy();
    });
  });

  describe("Accessibility", () => {
    it("should have correct accessibility label", () => {
      const mockValue = createMockThemeValue();
      const { getByLabelText } = render(
        <MockThemeProvider value={mockValue}>
          <Form onSubmit={mockOnSubmit}>
            <Input {...defaultProps} />
          </Form>
        </MockThemeProvider>,
      );

      expect(getByLabelText("Test Input")).toBeTruthy();
    });

    it("should indicate invalid state when error is present", () => {
      const mockValue = createMockThemeValue();
      const { getByTestId } = render(
        <MockThemeProvider value={mockValue}>
          <Form onSubmit={mockOnSubmit}>
            <Input {...defaultProps} error="Error" />
          </Form>
        </MockThemeProvider>,
      );

      // Error is indicated by the error text element with accessibilityRole="alert"
      const errorText = getByTestId(INPUT_IDS.ERROR);
      expect(errorText).toBeTruthy();
      expect(errorText.props.accessibilityRole).toBe("alert");
    });

    it("should have accessibility hint when provided", () => {
      const mockValue = createMockThemeValue();
      const { getByTestId } = render(
        <MockThemeProvider value={mockValue}>
          <Form onSubmit={mockOnSubmit}>
            <Input
              {...defaultProps}
              accessibilityHint="Enter your email address"
            />
          </Form>
        </MockThemeProvider>,
      );

      const input = getByTestId(INPUT_IDS.FIELD);
      expect(input.props.accessibilityHint).toBe("Enter your email address");
    });
  });

  describe("Theme Colors", () => {
    it("should use light theme colors when in light mode", () => {
      const mockValue = createMockThemeValue({ mode: "light" });
      const { getByTestId } = render(
        <MockThemeProvider value={mockValue}>
          <Form onSubmit={mockOnSubmit}>
            <Input {...defaultProps} />
          </Form>
        </MockThemeProvider>,
      );

      const input = getByTestId(INPUT_IDS.FIELD);
      const style = input.props.style;
      const flatStyle = Array.isArray(style)
        ? style.reduce((acc, s) => ({ ...acc, ...s }), {})
        : style;

      expect(flatStyle.color).toBe(mockValue.colors.text);
    });

    it("should use dark theme colors when in dark mode", () => {
      const mockValue = createMockThemeValue({ mode: "dark" });
      const { getByTestId } = render(
        <MockThemeProvider value={mockValue}>
          <Form onSubmit={mockOnSubmit}>
            <Input {...defaultProps} />
          </Form>
        </MockThemeProvider>,
      );

      const input = getByTestId(INPUT_IDS.FIELD);
      const style = input.props.style;
      const flatStyle = Array.isArray(style)
        ? style.reduce((acc, s) => ({ ...acc, ...s }), {})
        : style;

      expect(flatStyle.color).toBe(mockValue.colors.text);
    });
  });

  describe("Value Changes", () => {
    it("should call onChangeText when text changes", () => {
      const mockValue = createMockThemeValue();
      const onChangeText = jest.fn();
      const { getByTestId } = render(
        <MockThemeProvider value={mockValue}>
          <Form onSubmit={mockOnSubmit}>
            <Input {...defaultProps} onChangeText={onChangeText} />
          </Form>
        </MockThemeProvider>,
      );

      const input = getByTestId(INPUT_IDS.FIELD);
      fireEvent.changeText(input, "New value");

      expect(onChangeText).toHaveBeenCalledWith("New value");
      expect(onChangeText).toHaveBeenCalledTimes(1);
    });

    it("should display current value", () => {
      const mockValue = createMockThemeValue();
      const { getByTestId } = render(
        <MockThemeProvider value={mockValue}>
          <Form onSubmit={mockOnSubmit}>
            <Input {...defaultProps} value="Current value" />
          </Form>
        </MockThemeProvider>,
      );

      const input = getByTestId(INPUT_IDS.FIELD);
      expect(input.props.value).toBe("Current value");
    });
  });

  describe("Test IDs", () => {
    it("should use test IDs from components.ids.ts", () => {
      const mockValue = createMockThemeValue();
      const { getByTestId } = render(
        <MockThemeProvider value={mockValue}>
          <Form onSubmit={mockOnSubmit}>
            <Input {...defaultProps} />
          </Form>
        </MockThemeProvider>,
      );

      expect(getByTestId(INPUT_IDS.FIELD)).toBeTruthy();
    });
  });
});
