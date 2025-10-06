import { setupTestDatabase, seedTestData, cleanupTestData } from './test-setup';

beforeAll(async () => {
  await setupTestDatabase();
  await seedTestData();
});

afterAll(async () => {
  await cleanupTestData();
});

beforeEach(async () => {
  // Reset any mocks before each test
  jest.clearAllMocks();
});

afterEach(async () => {
  // Clean up after each test if needed
});
