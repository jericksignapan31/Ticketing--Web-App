import { AppDataSource } from './src/data-source';
import { TicketIdService } from './src/common/ticket-id.service';
import { Ticket } from './src/entities/ticket.entity';

async function testTicketService() {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    console.log('Testing TicketIdService...\n');

    const ticketIdService = new TicketIdService(AppDataSource);

    // Test ID generation
    const id1 = await ticketIdService.generateTicketId();
    console.log('✓ Generated ID 1:', id1);

    const id2 = await ticketIdService.generateTicketId();
    console.log('✓ Generated ID 2:', id2);

    // Create actual tickets using the service
    const ticket1 = new Ticket();
    ticket1.ticket_id = id1;
    ticket1.employee_id = 'f0b47554-b635-48a5-b830-27d8e022e33a';
    ticket1.subject = 'API Test Ticket 1';
    ticket1.description = 'Testing API with service';
    ticket1.category = 'software';
    ticket1.priority = 'medium';
    ticket1.status = 'pending_approval';
    ticket1.approval_status = 'pending';

    const ticket2 = new Ticket();
    ticket2.ticket_id = id2;
    ticket2.employee_id = 'f0b47554-b635-48a5-b830-27d8e022e33a';
    ticket2.subject = 'API Test Ticket 2';
    ticket2.description = 'Testing API with service';
    ticket2.category = 'hardware';
    ticket2.priority = 'high';
    ticket2.status = 'pending_approval';
    ticket2.approval_status = 'pending';

    await AppDataSource.getRepository(Ticket).save([ticket1, ticket2]);

    console.log('\n✅ TicketIdService working correctly!');
    console.log('Created 2 tickets with auto-generated IDs');

    // Verify they were created
    const allTickets = await AppDataSource.getRepository(Ticket).find({
      order: { created_at: 'DESC' },
      take: 2,
    });

    console.log('\nLatest tickets:');
    allTickets.forEach((t) => {
      console.log(`  - ${t.ticket_id}: ${t.subject}`);
    });

    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.detail) console.error('Detail:', error.detail);
    process.exit(1);
  }
}

testTicketService();
