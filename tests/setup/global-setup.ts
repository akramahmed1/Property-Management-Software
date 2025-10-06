import { waitForDatabase } from './test-setup';

export default async function globalSetup() {
  console.log('Setting up global test environment...');
  
  try {
    // Wait for database to be ready
    await waitForDatabase();
    console.log('Global test setup completed');
  } catch (error) {
    console.error('Global test setup failed:', error);
    process.exit(1);
  }
}
