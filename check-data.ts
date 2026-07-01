import { AppDataSource } from './src/data-source';

async function checkData() {
  try {
    if (!AppDataSource.isInitialized) await AppDataSource.initialize();

    console.log('📊 Database Status:\n');

    const employees = await AppDataSource.query('SELECT COUNT(*) FROM employee');
    console.log(`👥 Employees: ${employees[0].count}`);

    const users = await AppDataSource.query('SELECT COUNT(*) FROM user_account');
    console.log(`🔐 User Accounts: ${users[0].count}`);

    const tickets = await AppDataSource.query('SELECT COUNT(*) FROM ticket');
    console.log(`🎫 Tickets: ${tickets[0].count}`);

    const branches = await AppDataSource.query('SELECT COUNT(*) FROM branch');
    console.log(`🏢 Branches: ${branches[0].count}`);

    const departments = await AppDataSource.query('SELECT COUNT(*) FROM department');
    console.log(`🏛️ Departments: ${departments[0].count}`);

    // Get employees if any
    if (employees[0].count > 0) {
      const empList = await AppDataSource.query('SELECT employee_id, first_name, last_name, email FROM employee LIMIT 5');
      console.log('\n📝 Sample Employees:');
      empList.forEach(e => {
        console.log(`   - ${e.first_name} ${e.last_name} (${e.email})`);
      });
    }

    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkData();
