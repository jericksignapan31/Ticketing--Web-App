import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import * as bcrypt from 'bcrypt';

// Load .env by default for Supabase migration.
config({
  path: process.env.ENV_FILE || '.env',
});

function getSslConfig() {
  if (process.env.DB_SSL !== 'true') {
    return undefined;
  }

  return {
    rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED === 'true',
  };
}

async function migrateAdminOnly() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    synchronize: false,
    ssl: getSslConfig(),
  });

  const admin = {
    employee_id: 'EMP001',
    username: 'EMP001',
    password: 'admin123',
    first_name: 'Admin',
    last_name: 'User',
    email: 'admin@ithelp.com',
    contact_number: '+63-999-999-9999',
    position: 'System Administrator',
    role: 'admin',
  };

  try {
    await dataSource.initialize();
    console.log('Connected to target PostgreSQL database');

    // Ensure default branch exists.
    const existingBranch = await dataSource.query(
      'SELECT branch_id FROM "branch" WHERE branch_name = $1 LIMIT 1',
      ['Main Office'],
    );

    let branchId: string;
    if (existingBranch.length > 0) {
      branchId = existingBranch[0].branch_id;
    } else {
      const insertedBranch = await dataSource.query(
        `
        INSERT INTO "branch" (branch_name, location, contact_number, status)
        VALUES ($1, $2, $3, $4)
        RETURNING branch_id
        `,
        ['Main Office', 'Head Office', '+63-123-4567', 'active'],
      );
      branchId = insertedBranch[0].branch_id;
    }

    // Ensure default department exists.
    const existingDept = await dataSource.query(
      'SELECT department_id FROM "department" WHERE department_name = $1 LIMIT 1',
      ['IT Department'],
    );

    let departmentId: string;
    if (existingDept.length > 0) {
      departmentId = existingDept[0].department_id;
    } else {
      const insertedDept = await dataSource.query(
        `
        INSERT INTO "department" (department_name, description, is_active)
        VALUES ($1, $2, $3)
        RETURNING department_id
        `,
        ['IT Department', 'Information Technology', true],
      );
      departmentId = insertedDept[0].department_id;
    }

    // Upsert admin employee by employee_id.
    await dataSource.query(
      `
      INSERT INTO "employee" (
        employee_id,
        first_name,
        last_name,
        email,
        contact_number,
        position,
        role,
        branch_id,
        department_id,
        employment_status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (employee_id)
      DO UPDATE SET
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        email = EXCLUDED.email,
        contact_number = EXCLUDED.contact_number,
        position = EXCLUDED.position,
        role = EXCLUDED.role,
        branch_id = EXCLUDED.branch_id,
        department_id = EXCLUDED.department_id,
        employment_status = EXCLUDED.employment_status,
        updated_at = NOW()
      `,
      [
        admin.employee_id,
        admin.first_name,
        admin.last_name,
        admin.email,
        admin.contact_number,
        admin.position,
        admin.role,
        branchId,
        departmentId,
        true,
      ],
    );

    const hashedPassword = await bcrypt.hash(admin.password, 10);

    // Upsert admin user account by username.
    await dataSource.query(
      `
      INSERT INTO "user_account" (employee_id, username, password)
      VALUES ($1, $2, $3)
      ON CONFLICT (username)
      DO UPDATE SET
        employee_id = EXCLUDED.employee_id,
        password = EXCLUDED.password,
        updated_at = NOW()
      `,
      [admin.employee_id, admin.username, hashedPassword],
    );

    console.log('Admin migration completed successfully');
    console.log(`Employee ID: ${admin.employee_id}`);
    console.log(`Username: ${admin.username}`);
    console.log(`Password: ${admin.password}`);
  } catch (error) {
    console.error('Admin migration failed:', error);
    process.exitCode = 1;
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

migrateAdminOnly();
