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
