const config = {
  verbose: true,
  preset: "ts-jest",
  maxWorkers: 1,
  testEnvironment: "node",
  roots: ["<rootDir>/test"],
  testMatch: ["**/*.test.ts"],
  transform: {
    "^.+\\.tsx?$": "ts-jest",
  },
};

export default config;
