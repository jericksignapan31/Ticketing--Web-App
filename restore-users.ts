import { AppDataSource } from './src/data-source';
import * as bcrypt from 'bcrypt';

async function createUserAccounts() {
  try {
    if (!AppDataSource.isInitialized) await AppDataSource.initialize();

    // Get employees without user accounts
    const orphanedEmployees = await AppDataSource.query(`
      SELECT e.employee_id, e.first_name, e.last_name, e.email 
      FROM employee e
      LEFT JOIN user_account u ON e.employee_id = u.employee_id
      WHERE u.employee_id IS NULL
      ORDER BY e.first_name
    `);

    if (orphanedEmployees.length === 0) {
      console.log('✅ All employees already have user accounts');
      await AppDataSource.destroy();
      return;
    }

    console.log(`\n🔄 Creating user accounts for ${orphanedEmployees.length} employees...\n`);

    const password = 'Test@12345';
    const hashedPassword = await bcrypt.hash(password, 10);
    let created = 0;

    for (const emp of orphanedEmployees) {
      try {
        await AppDataSource.query(
          `INSERT INTO user_account (employee_id, email, password) VALUES ($1, $2, $3)`,
          [emp.employee_id, emp.email, hashedPassword]
        );
        console.log(`✅ ${emp.first_name} ${emp.last_name} (${emp.email})`);
        created++;
      } catch (error) {
        console.log(`⚠️  ${emp.email}: ${error.message.includes('duplicate') ? 'Email already exists' : error.message}`);
      }
    }

    console.log(`\n✅ Created ${created} user accounts`);
    console.log(`🔐 Default password for all: Test@12345\n`);

    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createUserAccounts();
