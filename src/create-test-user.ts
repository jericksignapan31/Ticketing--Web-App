import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

async function createTestUser() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  try {
    // Insert test employee
    const employeeResult = await dataSource.query(`
      INSERT INTO employee (
        employee_id,
        first_name,
        last_name,
        email,
        role,
        employment_status,
        created_at,
        updated_at
      ) VALUES (
        lower(hex(randomblob(16))),
        'Admin',
        'User',
        'admin@example.com',
        'admin',
        'active',
        datetime('now'),
        datetime('now')
      )
    `);

    // Get the employee_id
    const employee = await dataSource.query(
      `SELECT employee_id FROM employee WHERE email = 'admin@example.com'`,
    );

    if (!employee || employee.length === 0) {
      console.error('Failed to create employee');
      return;
    }

    const employeeId = employee[0].employee_id;

    // Hash password
    const hashedPassword = await bcrypt.hash('password123', 10);

    // Insert test user account
    await dataSource.query(
      `
      INSERT INTO user_account (
        user_id,
        employee_id,
        username,
        password,
        account_status,
        created_at,
        updated_at
      ) VALUES (
        lower(hex(randomblob(16))),
        ?,
        'admin',
        ?,
        'active',
        datetime('now'),
        datetime('now')
      )
    `,
      [employeeId, hashedPassword],
    );

    console.log('✅ Test user created successfully!');
    console.log('Username: admin');
    console.log('Password: password123');
    console.log('\nYou can now login at: http://localhost:3005/api');
  } catch (error) {
    console.error('Error creating test user:', error);
  } finally {
    await app.close();
  }
}

createTestUser();
