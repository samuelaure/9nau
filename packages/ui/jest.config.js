module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts', 'tsx'],
  rootDir: 'src',
  testEnvironment: 'jsdom', // Use jsdom for React components
  testRegex: '.*\\.spec\\.(t|j)sx?$', // Look for .spec.ts or .spec.tsx
  transform: {
    '^.+\\.(t|j)sx?$': 'ts-jest',
  },
  moduleNameMapper: {
    '^@9nau/ui/(.*)$': '<rootDir>/$1', // Alias for absolute imports within ui package
  },
  setupFilesAfterEnv: ['<rootDir>/../jest.setup.ts'], // Setup file for @testing-library/react
  collectCoverageFrom: ['**/*.(t|j)s?(x)'],
  coverageDirectory: '../coverage',
};
