import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  try {
    console.log('Starting database seeding...');

    // 1. Create default branch
    const branchResult = await dataSource.query(`
      INSERT INTO "branch" (branch_name, location, contact_number)
      VALUES ('Main Office', 'Head Office', '+63-123-4567')
      ON CONFLICT DO NOTHING
      RETURNING branch_id
    `);
    const branchId =
      branchResult[0]?.branch_id ||
      (
        await dataSource.query(`
      SELECT branch_id FROM "branch" WHERE branch_name = 'Main Office' LIMIT 1
    `)
      )[0].branch_id;
    console.log('✓ Branch created/found:', branchId);

    // 2. Create default department
    const deptResult = await dataSource.query(`
      INSERT INTO "department" (department_name, description)
      VALUES ('IT Department', 'Information Technology')
      ON CONFLICT DO NOTHING
      RETURNING department_id
    `);
    const deptId =
      deptResult[0]?.department_id ||
      (
        await dataSource.query(`
      SELECT department_id FROM "department" WHERE department_name = 'IT Department' LIMIT 1
    `)
      )[0].department_id;
    console.log('✓ Department created/found:', deptId);

    // 3. Create admin employee
    const employeeResult = await dataSource.query(
      `
      INSERT INTO "employee" (
        employee_id, first_name, last_name, email, contact_number, position, role,
        branch_id, department_id, employment_status
      )
      VALUES (
        gen_random_uuid(), 'Admin', 'User', 'admin@ithelp.com', '+63-999-999-9999',
        'System Administrator', 'admin', $1, $2, true
      )
      ON CONFLICT (email) DO NOTHING
      RETURNING employee_id
    `,
      [branchId, deptId],
    );
    const employeeId =
      employeeResult[0]?.employee_id ||
      (
        await dataSource.query(`
      SELECT employee_id FROM "employee" WHERE email = 'admin@ithelp.com' LIMIT 1
    `)
      )[0].employee_id;
    console.log('✓ Employee created/found:', employeeId);

    // 4. Create admin user account with hashed password
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Check if user already exists
    const existingUser = await dataSource.query(`
      SELECT user_id FROM "user_account" WHERE username = 'admin' LIMIT 1
    `);

    if (existingUser.length === 0) {
      await dataSource.query(
        `
        INSERT INTO "user_account" (employee_id, username, password, account_status)
        VALUES ($1, 'admin', $2, true)
      `,
        [employeeId, hashedPassword],
      );
      console.log('✓ Admin user created');
    } else {
      console.log('✓ Admin user already exists');
    }

    // Display created account
    const adminAccount = await dataSource.query(`
      SELECT 
        u.username,
        e.role,
        e.first_name,
        e.last_name,
        e.email
      FROM "user_account" u
      JOIN "employee" e ON u.employee_id = e.employee_id
      WHERE u.username = 'admin'
    `);

    console.log('\n=================================');
    console.log('Default Admin Account Created:');
    console.log('=================================');
    console.log('Username:', adminAccount[0].username);
    console.log('Password: admin123');
    console.log('Role:', adminAccount[0].role);
    console.log('Name:', adminAccount[0].first_name, adminAccount[0].last_name);
    console.log('Email:', adminAccount[0].email);
    console.log('=================================\n');

    console.log('✓ Seeding completed successfully!');
  } catch (error) {
    console.error('✗ Seeding failed:', error);
  } finally {
    await app.close();
  }
}

seed();
