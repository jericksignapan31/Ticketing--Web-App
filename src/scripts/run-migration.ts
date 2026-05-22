import { AppDataSource } from '../data-source';
import * as bcrypt from 'bcrypt';

async function runMigration() {
  try {
    // Initialize connection
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    console.log('✅ Connected to database\n');

    // Get query runner
    const queryRunner = AppDataSource.createQueryRunner();

    try {
      console.log('🔧 Running migrations...\n');

      // 1. Add middle_name column
      console.log('1️⃣ Adding middle_name column to employee table...');
      await queryRunner.query(
        'ALTER TABLE employee ADD COLUMN IF NOT EXISTS middle_name VARCHAR'
      );
      console.log('✅ middle_name column added\n');

      // 2. Delete all user_account records
      console.log('2️⃣ Deleting all user_account records...');
      await queryRunner.query('DELETE FROM user_account');
      console.log('✅ user_account cleared\n');

      // 3. Delete all employee records
      console.log('3️⃣ Deleting all employee records...');
      await queryRunner.query('DELETE FROM employee');
      console.log('✅ employee cleared\n');

      // 4. Create admin employee
      console.log('4️⃣ Creating admin user...');
      const result = await queryRunner.query(
        `INSERT INTO employee (
          first_name, last_name, email, role, employment_status, position, contact_number
        ) VALUES (
          'Admin', 'User', 'admin@example.com', 'ADMIN', true, 'Administrator', '09000000000'
        ) RETURNING employee_id`
      );

      const adminId = result[0]?.employee_id;
      console.log(`✅ Admin employee created (ID: ${adminId})\n`);

      // 5. Create user_account for admin
      console.log('5️⃣ Creating admin user account...');

      // Hash password: admin123
      const hashedPassword = await bcrypt.hash('admin123', 10);

      await queryRunner.query(
        `INSERT INTO user_account (
          employee_id, username, password, password_changed
        ) VALUES (
          $1,
          'admin@example.com',
          $2,
          true
        )`,
        [adminId, hashedPassword]
      );
      console.log('✅ Admin user account created\n');

      // 6. Verify
      console.log('6️⃣ Verifying...');
      const verification = await queryRunner.query(
        `SELECT 
          e.employee_id,
          e.email,
          e.role,
          e.employment_status,
          e.first_name,
          e.last_name,
          ua.username,
          ua.password_changed
        FROM employee e
        LEFT JOIN user_account ua ON e.employee_id = ua.employee_id`
      );

      console.log('📊 Final state:\n');
      console.log(JSON.stringify(verification, null, 2));

      console.log('\n✅ All migrations completed successfully!\n');
      console.log('🔐 Login with:');
      console.log('   Username: admin@example.com');
      console.log('   Password: admin123\n');

    } finally {
      await queryRunner.release();
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

runMigration();
