module.exports = {
  projects: ['<rootDir>/apps/api', '<rootDir>/apps/web', '<rootDir>/packages/core', '<rootDir>/packages/ui'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transformIgnorePatterns: ['node_modules/(?!(.*-fns|@9nau|lucide-react)/)'],
}
