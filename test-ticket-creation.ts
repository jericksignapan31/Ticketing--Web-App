import { AppDataSource } from './src/data-source';
import { Ticket } from './src/entities/ticket.entity';

async function testTicketCreation() {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    console.log('Testing ticket creation with new ID format...\n');

    // Create a test ticket directly
    const ticket = new Ticket();
    ticket.ticket_id = 'IT-20260701-0001';
    ticket.employee_id = 'f0b47554-b635-48a5-b830-27d8e022e33a';
    ticket.subject = 'Test Ticket with New Format';
    ticket.description = 'Testing the new ID generation';
    ticket.category = 'hardware';
    ticket.priority = 'high';
    ticket.status = 'pending_approval';
    ticket.approval_status = 'pending';

    const saved = await AppDataSource.getRepository(Ticket).save(ticket);
    
    console.log('✅ Ticket created successfully!');
    console.log('ID:', saved.ticket_id);
    console.log('Subject:', saved.subject);
    console.log('Status:', saved.status);
    console.log('Created at:', saved.created_at);

    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Error creating ticket:', error.message);
    if (error.detail) {
      console.error('Detail:', error.detail);
    }
    process.exit(1);
  }
}

testTicketCreation();
