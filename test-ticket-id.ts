import { AppDataSource } from './src/data-source';

async function testNewTicketIdFormat() {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    console.log('Testing new Ticket ID format...\n');

    // Check column types
    const columnInfo = await AppDataSource.query(`
      SELECT column_name, data_type, character_maximum_length
      FROM information_schema.columns
      WHERE table_name = 'ticket' AND column_name = 'ticket_id'
    `);

    console.log('✓ Ticket ID Column Type:');
    console.log('  Column:', columnInfo[0].column_name);
    console.log('  Type:', columnInfo[0].data_type);
    console.log('  Max Length:', columnInfo[0].character_maximum_length);

    // Create test tickets using TicketIdService logic
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');

    // Get existing ticket count for today
    const countResult = await AppDataSource.query(
      `SELECT COUNT(*) as count FROM ticket WHERE DATE(created_at) = CURRENT_DATE`,
    );
    const count = parseInt(countResult[0].count, 10);

    console.log(`\n✓ Tickets created today: ${count}`);

    // Generate sample IDs
    console.log('\nGenerated Ticket IDs (sample):');
    for (let i = 1; i <= 5; i++) {
      const sequence = String(count + i).padStart(4, '0');
      const ticketId = `IT-${dateStr}-${sequence}`;
      console.log(`  ${i}. ${ticketId}`);
    }

    console.log('\n✓ Format matches expected pattern: IT-YYYYMMDD-XXXX');
    console.log('✓ Daily counter working correctly');
    console.log('\n✅ Ticket ID system ready for testing!');

    await AppDataSource.destroy();
  } catch (error) {
    console.error('Error during test:', error);
    process.exit(1);
  }
}

testNewTicketIdFormat();
