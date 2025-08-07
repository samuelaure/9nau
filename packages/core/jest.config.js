module.exports = {
  preset: 'ts-jest', 
  rootDir: '.',
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  testRegex: 'src/.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': [
      'ts-jest', 
      { 
        tsconfig: './tsconfig.json' 
      }
    ],
  },
  testEnvironment: 'node',
};