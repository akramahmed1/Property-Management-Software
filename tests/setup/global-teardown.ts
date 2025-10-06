import { closeDatabaseConnection } from './test-setup';

export default async function globalTeardown() {
  console.log('Tearing down global test environment...');
  
  try {
    await closeDatabaseConnection();
    console.log('Global test teardown completed');
  } catch (error) {
    console.error('Global test teardown failed:', error);
  }
}
