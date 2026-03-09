import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  try {
    console.log('Starting database reset and seeding...');
    console.log('⚠️  WARNING: This will DELETE ALL DATA!\n');

    // Clear all tables in correct order (respecting foreign keys)
    console.log('Clearing all tables...');
    await dataSource.query('DELETE FROM "repair_log"');
    console.log('✓ Cleared repair_log');

    await dataSource.query('DELETE FROM "ticket"');
    console.log('✓ Cleared ticket');

    await dataSource.query('DELETE FROM "asset"');
    console.log('✓ Cleared asset');

    await dataSource.query('DELETE FROM "brand"');
    console.log('✓ Cleared brand');

    await dataSource.query('DELETE FROM "user_account"');
    console.log('✓ Cleared user_account');

    await dataSource.query('DELETE FROM "employee"');
    console.log('✓ Cleared employee');

    await dataSource.query('DELETE FROM "department"');
    console.log('✓ Cleared department');

    await dataSource.query('DELETE FROM "branch"');
    console.log('✓ Cleared branch');

    console.log('\n✓ All tables cleared successfully!\n');

    // 1. Create default branch
    const branchResult = await dataSource.query(`
      INSERT INTO "branch" (branch_name, location, contact_number, status)
      VALUES ('Main Office', 'Head Office', '+63-123-4567', 'active')
      RETURNING branch_id
    `);
    const branchId = branchResult[0].branch_id;
    console.log('✓ Branch created:', branchId);

    // 2. Create default department
    const deptResult = await dataSource.query(`
      INSERT INTO "department" (department_name, description)
      VALUES ('IT Department', 'Information Technology')
      RETURNING department_id
    `);
    const deptId = deptResult[0].department_id;
    console.log('✓ Department created:', deptId);

    // 3. Create admin employee with employee_id = 'EMP001'
    await dataSource.query(
      `
      INSERT INTO "employee" (
        employee_id, first_name, last_name, email, contact_number, position, role,
        branch_id, department_id, employment_status
      )
      VALUES (
        'EMP001', 'Admin', 'User', 'admin@ithelp.com', '+63-999-999-9999',
        'System Administrator', 'admin', $1, $2, true
      )
    `,
      [branchId, deptId],
    );
    console.log('✓ Admin employee created: EMP001');

    // 4. Create admin user account with hashed password
    const hashedPassword = await bcrypt.hash('admin123', 10);

    await dataSource.query(
      `
      INSERT INTO "user_account" (employee_id, username, password, account_status)
      VALUES ('EMP001', 'EMP001', $1, true)
    `,
      [hashedPassword],
    );
    console.log('✓ Admin user account created');

    console.log('\n=================================');
    console.log('Default Admin Account Created:');
    console.log('=================================');
    console.log('Employee ID: EMP001');
    console.log('Username: EMP001');
    console.log('Password: admin123');
    console.log('Role: admin');
    console.log('Name: Admin User');
    console.log('Email: admin@ithelp.com');
    console.log('Branch: Main Office');
    console.log('Department: IT Department');
    console.log('=================================\n');

    console.log('✓ Database reset and seeding completed successfully!');
  } catch (error) {
    console.error('✗ Seeding failed:', error);
  } finally {
    await app.close();
  }
}

seed();
