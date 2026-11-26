/**
 * jest.config.js — Test configuration (4th Semester)
 * ════════════════════════════════════════════════════
 * Place in project root alongside package.json.
 *
 * Run all tests:        npx jest
 * Run integration only: npx jest --testPathPattern=integration
 * With coverage:        npx jest --coverage
 * Watch mode:           npx jest --watch
 */

module.exports = {
  rootDir: require('path').resolve(__dirname, '..'),
  // Test environment
  testEnvironment: 'node',

  // Where to find test files
  testMatch: [
    '**/tests/**/*.test.js',
    '**/__tests__/**/*.test.js',
    '**/?(*.)+(spec|test).js'
  ],

  // Files to exclude
  testPathIgnorePatterns: [
    '/node_modules/',
    '/frontend/',
    '/legacy/',
    '/uploads/'
  ],

  // Setup file runs before each test suite
  globalSetup:    '<rootDir>/tests/setup.js',
  globalTeardown: '<rootDir>/tests/teardown.js',

  // Test timeout (ms) — integration tests hit real DB
  testTimeout: 30000,

  // Coverage configuration
  collectCoverageFrom: [
    'backend/controllers/**/*.js',
    'backend/routes/**/*.js',
    'backend/services/**/*.js',
    'backend/middleware/**/*.js',
    '!backend/**/*.test.js',
    '!backend/config/**/*.js'
  ],

  // Coverage thresholds (target: 80%+)
  coverageThreshold: {
    global: {
      branches:   60,
      functions:  70,
      lines:      75,
      statements: 75
    }
  },

  // Coverage report formats
  coverageReporters: ['text', 'lcov', 'html'],
  coverageDirectory: 'coverage',

  // Verbose output
  verbose: true,

  // Force exit after all tests (prevents hanging DB connections)
  forceExit: true,

  // Detect open handles (DB connections not closed)
  detectOpenHandles: false,

  // Environment variables for test run
  testEnvironmentOptions: {
    env: {
      NODE_ENV: 'test',
      DB_NAME:  'workforce_intelligence_test'
    }
  }
};
