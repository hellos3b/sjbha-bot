module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ["src/"],
  setupFilesAfterEnv: ["@relmify/jest-fp-ts"],
  moduleNameMapper: {
    "^@shared/(.+)$": "<rootDir>/src/shared/$1",
    "^@app/(.+)$": "<rootDir>/src/app/$1",
    "^@plugins/(.+)$": "<rootDir>/src/plugins/$1",
    "^@packages/(.+)$": "<rootDir>/src/packages/$1"
  }
};