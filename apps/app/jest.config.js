const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './apps/app',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testEnvironment: 'jsdom',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@9nau/ui/(.*)$': '<rootDir>/../../packages/ui/src/$1',
    '^@9nau/core/(.*)$': '<rootDir>/../../packages/core/src/$1',
    '^@9nau/types/(.*)$': '<rootDir>/../../packages/types/src/$1',
  },
  transformIgnorePatterns: ['node_modules/(?!(.*-fns|@9nau|lucide-react)/)'],
  testPathIgnorePatterns: ['/node_modules/', '/.next/'],
  testRegex: 'apps/app/src/.*\\.spec\\.(t|j)sx?$',
}

module.exports = createJestConfig(customJestConfig)
