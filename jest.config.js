module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",

  moduleFileExtensions: ["ts", "js", "json", "node"],

  transform: {
    "^.+\\.ts$": "ts-jest",
  },

  testMatch: [
    "**/tests/**/*.test.ts",
    "**/src/**/*.test.ts"
  ],

  collectCoverage: true,
  coverageDirectory: "coverage",

  clearMocks: true,
  resetMocks: true,
};