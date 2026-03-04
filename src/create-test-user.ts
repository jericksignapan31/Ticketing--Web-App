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
        'EMP001',
        'Admin',
        'User',
        'admin@example.com',
        'admin',
        'active',
        datetime('now'),
        datetime('now')
      )
    `);

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
        'USR001',
        'EMP001',
        'admin',
        ?,
        'active',
        datetime('now'),
        datetime('now')
      )
    `,
      [await bcrypt.hash('password123', 10)],
    );

    console.log('✅ Test user created successfully!');
    console.log('Employee ID: EMP001');
    console.log('User ID: USR001');
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
