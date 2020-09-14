module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ["@plugins/"],
  moduleNameMapper: {
    "^@services/(.+)$": "<rootDir>/@services/$1",
    "^@app/(.+)$": "<rootDir>/@app/$1",
    "^@plugins/(.+)$": "<rootDir>/@plugins/$1"
  }
};