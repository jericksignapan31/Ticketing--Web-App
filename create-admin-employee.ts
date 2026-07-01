import { AppDataSource } from './src/data-source';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

async function createAdminEmployee() {
  try {
    if (!AppDataSource.isInitialized) await AppDataSource.initialize();

    console.log('\n👤 Creating new admin employee...\n');

    // Employee details
    const firstName = 'Admin';
    const lastName = 'Developer';
    const email = 'admin.dev@ithelpdesk.com';
    const password = 'Test@12345';

    // Check if employee already exists
    const existingEmployee = await AppDataSource.query(
      `SELECT * FROM employee WHERE email = $1`,
      [email]
    );

    if (existingEmployee.length > 0) {
      console.log(`❌ Employee with email ${email} already exists`);
      await AppDataSource.destroy();
      return;
    }

    // Get a branch for the employee
    const branches = await AppDataSource.query('SELECT branch_id FROM branch LIMIT 1');
    if (branches.length === 0) {
      console.log('❌ No branches found. Please create a branch first.');
      await AppDataSource.destroy();
      return;
    }

    const branchId = branches[0].branch_id;

    // Create employee
    const employeeId = uuidv4();
    await AppDataSource.query(
      `INSERT INTO employee (employee_id, first_name, last_name, email, role, position, branch_id, contact_number, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())`,
      [employeeId, firstName, lastName, email, 'admin', 'IT Administrator', branchId, '09XXXXXXXXX']
    );

    console.log(`✅ Employee created: ${firstName} ${lastName}`);
    console.log(`   Email: ${email}`);
    console.log(`   Employee ID: ${employeeId}`);

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user account
    const userId = uuidv4();
    await AppDataSource.query(
      `INSERT INTO user_account (user_id, employee_id, email, password, password_changed, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
      [userId, employeeId, email, hashedPassword, false]
    );

    console.log(`✅ User account created with ADMIN role`);
    console.log(`   User ID: ${userId}`);
    console.log(`   Password: ${password}`);

    console.log(`\n✅ Admin employee setup complete!\n`);
    console.log(`📝 Login credentials:`);
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log(`   Role: admin\n`);

    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createAdminEmployee();
