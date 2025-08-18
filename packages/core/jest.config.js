const path = require('path')

module.exports = {
  preset: 'ts-jest',
  rootDir: '.',
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  testRegex: 'src/.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': [
      'ts-jest',
      {
        tsconfig: path.resolve(__dirname, 'tsconfig.test.json'),
      },
    ],
  },
  testEnvironment: 'node',
}
