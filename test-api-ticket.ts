import { AppDataSource } from './src/data-source';

async function testTicketCreation() {
  const baseURL = 'http://localhost:3000';
  
  try {
    // Get test employee
    if (!AppDataSource.isInitialized) await AppDataSource.initialize();
    
    const { Employee } = require('./src/entities/employee.entity');
    const { Asset } = require('./src/entities/asset.entity');
    const employee = await AppDataSource.getRepository(Employee).findOne({ 
      where: {} 
    });
    
    const asset = await AppDataSource.getRepository(Asset).findOne({ 
      where: {} 
    });
    
    await AppDataSource.destroy();
    
    if (!employee) {
      console.log('❌ No employee found');
      return;
    }

    if (!asset) {
      console.log('❌ No asset found');
      return;
    }
    
    console.log(`📧 Using employee: ${employee.first_name} ${employee.last_name}`);
    console.log(`🔐 Employee ID: ${employee.employee_id}`);
    console.log(`📦 Using asset: ${asset.asset_tag}\n`);
    
    // Step 1: Login to get token (admin credentials)
    console.log('🔄 Step 1: Logging in...');
    const loginRes = await fetch(`${baseURL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'bookkeeping.min@tecfuel.ph',
        password: 'Test@12345',
      })
    });
    
    const loginData = await loginRes.json();
    
    if (!loginRes.ok) {
      console.error(`❌ Login failed: ${loginData.message || 'Unknown error'}`);
      return;
    }
    
    const token = loginData.access_token;
    console.log(`✅ Got token: ${token.substring(0, 20)}...\n`);
    
    // Step 2: Create ticket
    console.log('🔄 Step 2: Creating ticket...');
    const ticketRes = await fetch(
      `${baseURL}/tickets`,
      {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          asset_id: asset.asset_id,
          subject: 'Test Ticket - Auto ID Format',
          description: 'Testing automatic ticket ID generation',
          category: 'software',
          priority: 'medium',
        })
      }
    );
    
    const ticketData = await ticketRes.json();
    
    if (!ticketRes.ok) {
      console.error(`❌ Ticket creation failed: ${ticketData.message || JSON.stringify(ticketData)}`);
      return;
    }
    
    const ticket = ticketData;
    console.log(`✅ Ticket created!\n`);
    console.log(`   ID: ${ticket.ticket_id}`);
    console.log(`   Subject: ${ticket.subject}`);
    console.log(`   Status: ${ticket.status}`);
    console.log(`   Created: ${ticket.created_at}\n`);
    
    // Verify ID format
    if (ticket.ticket_id.match(/^IT-\d{8}-\d{4}$/)) {
      console.log('✅ ID format correct: IT-YYYYMMDD-XXXX');
      console.log('✅ Automatic ID generation is working!');
    } else {
      console.log(`❌ ID format incorrect: ${ticket.ticket_id}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testTicketCreation();
