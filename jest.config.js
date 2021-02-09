module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ["@plugins/"],
  moduleNameMapper: {
    "^@shared/(.+)$": "<rootDir>/@shared/$1",
    "^@app/(.+)$": "<rootDir>/@app/$1",
    "^@plugins/(.+)$": "<rootDir>/@plugins/$1"
  }
};