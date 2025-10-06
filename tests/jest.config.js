module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/../src/backend/src', '<rootDir>'],
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    '../src/backend/src/**/*.ts',
    '!../src/backend/src/**/*.d.ts',
    '!../src/backend/src/index.ts',
    '!../src/backend/src/**/*.test.ts',
    '!../src/backend/src/**/*.spec.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  setupFilesAfterEnv: ['<rootDir>/setup/jest.setup.ts'],
  testTimeout: 30000,
  maxWorkers: 1, // Run tests sequentially to avoid database conflicts
  globalSetup: '<rootDir>/setup/global-setup.ts',
  globalTeardown: '<rootDir>/setup/global-teardown.ts',
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/../src/backend/src/$1',
    '^@config/(.*)$': '<rootDir>/../src/backend/src/config/$1',
    '^@controllers/(.*)$': '<rootDir>/../src/backend/src/controllers/$1',
    '^@services/(.*)$': '<rootDir>/../src/backend/src/services/$1',
    '^@utils/(.*)$': '<rootDir>/../src/backend/src/utils/$1',
    '^@middleware/(.*)$': '<rootDir>/../src/backend/src/middleware/$1',
    '^@routes/(.*)$': '<rootDir>/../src/backend/src/routes/$1',
  },
  testEnvironmentOptions: {
    url: 'http://localhost:3000',
  },
  verbose: true,
  forceExit: true,
  detectOpenHandles: true,
  detectLeaks: true,
  detectLeaks: true,
  detectLeaks: true,
};
