import { AppDataSource } from './src/data-source';
import { UserAccount } from './src/entities/user-account.entity';
import { Employee } from './src/entities/employee.entity';

async function test() {
  if (!AppDataSource.isInitialized) await AppDataSource.initialize();
  
  try {
    const users = await AppDataSource.getRepository(UserAccount).find({ take: 3 });
    const employees = await AppDataSource.getRepository(Employee).find({ take: 1 });
    
    if (users.length === 0) {
      console.log('❌ No users found');
    } else {
      console.log('✅ Found users:');
      users.forEach(u => console.log(`  - ${u.email} (ID: ${u.user_id})`));
    }
    
    if (employees.length > 0) {
      console.log(`\n✅ Found employee: ${employees[0].first_name} ${employees[0].last_name} (ID: ${employees[0].employee_id})`);
    }
  } catch (e) {
    console.error('Error:', e.message);
  }
  
  await AppDataSource.destroy();
}

test();
