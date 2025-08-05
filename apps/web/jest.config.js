module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts', 'tsx'],
  rootDir: 'src',
  testEnvironment: 'jsdom', // Use jsdom for React components
  testRegex: '.*\\.spec\\.(t|j)sx?$', // Look for .spec.ts or .spec.tsx
  transform: {
    '^.+\\.(t|j)sx?$': 'ts-jest',
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1', // Alias for absolute imports
    '^@9nau/ui/(.*)$': '<rootDir>/../../packages/ui/src/$1',
    '^@9nau/core/(.*)$': '<rootDir>/../../packages/core/src/$1',
    '^@9nau/types/(.*)$': '<rootDir>/../../packages/types/src/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/../jest.setup.ts'], // Setup file for @testing-library/react
  collectCoverageFrom: ['**/*.(t|j)s?(x)'],
  coverageDirectory: '../coverage',
};
