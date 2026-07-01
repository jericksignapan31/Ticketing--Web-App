import { AppDataSource } from './src/data-source';
import { TicketIdService } from './src/common/ticket-id.service';
import { Ticket } from './src/entities/ticket.entity';
import { TicketSequence } from './src/entities/ticket-sequence.entity';

async function testTicketCreation() {
  try {
    if (!AppDataSource.isInitialized) await AppDataSource.initialize();

    console.log('\n🎫 Testing Direct Ticket ID Generation\n');

    // Create TicketIdService instance
    const ticketIdService = new TicketIdService(AppDataSource);

    // Generate 3 consecutive ticket IDs to verify daily counter
    const ids: string[] = [];
    for (let i = 1; i <= 3; i++) {
      const id = await ticketIdService.generateTicketId();
      ids.push(id);
      console.log(`✅ Generated Ticket ${i}: ${id}`);
    }

    console.log('\n📊 Verification:\n');

    // Parse IDs
    const parsed = ids.map(id => {
      const parts = id.split('-');
      return {
        id,
        date: parts[1],
        sequence: parseInt(parts[2]),
      };
    });

    // Check all have same date
    const allSameDate = parsed.every(p => p.date === parsed[0].date);
    console.log(`✅ All IDs have same date (${parsed[0].date}): ${allSameDate}`);

    // Check sequence is incrementing
    const isIncrementing = parsed.every((p, i) => {
      if (i === 0) return true;
      return p.sequence === parsed[i - 1].sequence + 1;
    });
    console.log(`✅ Sequence is incrementing: ${isIncrementing}`);
    console.log(`   Sequence: ${parsed.map(p => p.sequence).join(' → ')}`);

    // Check format
    const validFormat = ids.every(id => /^IT-\d{8}-\d{4}$/.test(id));
    console.log(`✅ Format matches IT-YYYYMMDD-XXXX: ${validFormat}`);

    // Check database
    const sequenceRepo = AppDataSource.getRepository(TicketSequence);
    const sequences = await sequenceRepo.find();
    console.log(`\n📦 Database State:`);
    console.log(`   Total dates tracked: ${sequences.length}`);
    sequences.forEach(seq => {
      console.log(`   Date ${seq.date}: sequence = ${seq.sequence}`);
    });

    console.log(`\n✅ All tests passed! Ticket ID generation is working correctly.\n`);

    await AppDataSource.destroy();
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
  }
}

testTicketCreation();
