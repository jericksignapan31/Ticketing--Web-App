import { AppDataSource } from './src/data-source';
import * as bcrypt from 'bcrypt';

async function setupLogin() {
  try {
    if (!AppDataSource.isInitialized) await AppDataSource.initialize();

    // Get all users
    const users = await AppDataSource.query('SELECT user_id, employee_id, email FROM user_account');
    console.log(`\n📋 Found ${users.length} user accounts:\n`);
    users.forEach((u, i) => {
      console.log(`   ${i + 1}. ${u.email} (ID: ${u.user_id})`);
    });

    if (users.length === 0) {
      console.log('\n❌ No users found. Creating admin user...\n');
      
      // Get a branch and department
      const branch = await AppDataSource.query('SELECT branch_id FROM branch LIMIT 1');
      const dept = await AppDataSource.query('SELECT department_id FROM department LIMIT 1');
      
      if (!branch[0] || !dept[0]) {
        console.log('❌ Need at least one branch and department');
        await AppDataSource.destroy();
        return;
      }

      const { v4: uuidv4 } = require('uuid');
      const employeeId = uuidv4();
      const email = 'admin@test.com';
      const password = 'Admin@12345';
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create employee
      await AppDataSource.query(
        `INSERT INTO employee (employee_id, first_name, last_name, email, role, branch_id, department_id, employment_status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [employeeId, 'Admin', 'Test', email, 'admin', branch[0].branch_id, dept[0].department_id, true]
      );

      // Create user
      await AppDataSource.query(
        `INSERT INTO user_account (employee_id, email, password) VALUES ($1, $2, $3)`,
        [employeeId, email, hashedPassword]
      );

      console.log(`✅ Admin user created!`);
      console.log(`   Email: ${email}`);
      console.log(`   Password: ${password}\n`);
    } else {
      console.log('\n✅ Resetting passwords for all users...\n');
      
      for (const user of users) {
        const password = 'Test@12345';
        const hashedPassword = await bcrypt.hash(password, 10);
        
        await AppDataSource.query(
          'UPDATE user_account SET password = $1 WHERE user_id = $2',
          [hashedPassword, user.user_id]
        );
        
        console.log(`✅ Password reset: ${user.email}`);
      }
      
      console.log(`\n🔐 All passwords set to: Test@12345\n`);
    }

    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

setupLogin();
