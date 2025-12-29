jest.mock("react-native/Libraries/TurboModule/TurboModuleRegistry", () => {
  const turboModuleRegistry = jest.requireActual(
    "react-native/Libraries/TurboModule/TurboModuleRegistry",
  );
  return {
    ...turboModuleRegistry,
    getEnforcing: (name) => {
      // List of TurboModules libraries to mock.
      const modulesToMock = ["DevMenu", "SettingsManager"];
      if (modulesToMock.includes(name)) {
        return null;
      }
      return turboModuleRegistry.getEnforcing(name);
    },
  };
});

// Mock React Native AMA
jest.mock("@react-native-ama/core", () => {
  return {
    getContrastCheckerMaxDepth: () => 5,
    AMAProvider: ({ children }) => children,
    useAMAContext: () => ({ isScreenReaderEnabled: false }),
    useFocus: () => ({ setFocus: jest.fn() }),
  };
});

// Mock React Native AMA components
jest.mock("@react-native-ama/react-native", () => {
  const React = require("react");
  const RN = require("react-native");

  return {
    TouchableOpacity: ({ children, ...props }) => {
      // Ensure accessibility properties are set
      const accessibilityProps = {
        ...props,
        accessibilityRole: props.accessibilityRole || "button",
      };
      return React.createElement(
        RN.TouchableOpacity,
        accessibilityProps,
        children,
      );
    },
    Pressable: ({ children, ...props }) => {
      const accessibilityProps = {
        ...props,
        accessibilityRole: props.accessibilityRole || "button",
      };
      return React.createElement(RN.Pressable, accessibilityProps, children);
    },
    TouchableWithoutFeedback: ({ children, onPress, ...props }) => {
      return React.createElement(
        RN.TouchableOpacity,
        { onPress, ...props },
        children,
      );
    },
    Text: RN.Text,
  };
});
