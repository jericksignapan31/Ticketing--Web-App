import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Employee } from './entities/employee.entity';
import { UserAccount } from './entities/user-account.entity';
import { Branch } from './entities/branch.entity';
import { Department } from './entities/department.entity';

async function syncUserAccounts() {
  const dataSource = new DataSource({
    type: 'better-sqlite3',
    database: 'ithelp_desk.db',
    entities: [Employee, UserAccount, Branch, Department],
    synchronize: false,
  });

  try {
    await dataSource.initialize();
    console.log('✅ Database connected');

    const employeeRepo = dataSource.getRepository(Employee);
    const userAccountRepo = dataSource.getRepository(UserAccount);

    // Get all employees
    const employees = await employeeRepo.find();
    console.log(`📋 Found ${employees.length} employees`);

    let created = 0;
    let skipped = 0;

    for (const employee of employees) {
      // Check if user account already exists
      const existingUser = await userAccountRepo.findOne({
        where: { employee_id: employee.employee_id },
      });

      if (existingUser) {
        console.log(
          `⏭️  Skipped ${employee.employee_id} - already has account`,
        );
        skipped++;
        continue;
      }

      // Create user account with email as username and 6-digit temp password
      const temporaryPassword = Math.floor(100000 + Math.random() * 900000).toString();
      const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

      const userAccount = userAccountRepo.create({
        employee_id: employee.employee_id,
        username: employee.email || employee.employee_id.toString(),
        password: hashedPassword,
        password_changed: false,
      });

      await userAccountRepo.save(userAccount);
      console.log(
        `✅ Created user account for ${employee.employee_id} (username: ${employee.email || employee.employee_id}, temp password: ${temporaryPassword})`,
      );
      created++;
    }

    console.log('\n📊 Summary:');
    console.log(`   ✅ Created: ${created} user accounts`);
    console.log(`   ⏭️  Skipped: ${skipped} existing accounts`);
    console.log(`   📋 Total: ${employees.length} employees`);

    await dataSource.destroy();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

syncUserAccounts();
