import { AppDataSource } from './src/data-source';

async function cleanup() {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    
    console.log('Deleting ticket_parts...');
    await AppDataSource.query('DELETE FROM ticket_parts');
    
    console.log('Deleting tickets...');
    await AppDataSource.query('DELETE FROM ticket');
    
    console.log('✓ All tickets and parts deleted successfully');
    
    await AppDataSource.destroy();
  } catch (error) {
    console.error('Error during cleanup:', error);
    process.exit(1);
  }
}

cleanup();
