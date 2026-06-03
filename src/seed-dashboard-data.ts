/**
 * Dashboard Test Data Seeder
 * Inserts sample tickets and requisitions for June 2026
 * Run: npm run seed:dashboard
 */

import { DataSource } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { config } from 'dotenv';

config();

const appDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: ['dist/**/*.entity.js'],
  migrations: ['dist/migrations/*.js'],
  synchronize: false,
  logging: false,
});

async function seedDashboardData() {
  try {
    await appDataSource.initialize();
    console.log('📊 Starting Dashboard Data Seeding...\n');

    // ============================================
    // 0. GET DEPARTMENTS AND EMPLOYEES
    // ============================================
    console.log('🔍 Fetching departments and employees...');

    const departments: any[] = await appDataSource.query(
      `SELECT department_id, department_name FROM "department" WHERE is_active = true LIMIT 3`,
    );

    if (departments.length === 0) {
      console.error('❌ No departments found in database');
      process.exit(1);
    }

    console.log(`✅ Found ${departments.length} departments\n`);

    const employees: any[] = await appDataSource.query(
      `SELECT employee_id, department_id FROM "employee" LIMIT 10`,
    );

    if (employees.length === 0) {
      console.error('❌ No employees found in database');
      process.exit(1);
    }

    console.log(`✅ Found ${employees.length} employees\n`);

    // ============================================
    // 1. SEED TICKETS FOR JUNE 2026
    // ============================================
    console.log('🎫 Seeding Tickets...');

    const ticketStatuses = ['open', 'in-progress', 'resolved', 'closed'];
    const ticketPriorities = ['low', 'medium', 'high', 'urgent'];
    const ticketCategories = ['hardware', 'software', 'network', 'other'];

    let ticketCount = 0;

    for (let deptIdx = 0; deptIdx < departments.length; deptIdx++) {
      const dept = departments[deptIdx];
      const deptEmployees = employees.filter((e) => e.department_id === dept.department_id);

      if (deptEmployees.length === 0) {
        console.log(`⚠️  No employees in ${dept.department_name}, skipping...`);
        continue;
      }

      const numTickets = deptIdx === 0 ? 18 : deptIdx === 1 ? 15 : 12;

      for (let i = 0; i < numTickets; i++) {
        const dayOfMonth = Math.floor(Math.random() * 28) + 1;
        const hour = Math.floor(Math.random() * 24);
        const minute = Math.floor(Math.random() * 60);
        const created_at = new Date(2026, 5, dayOfMonth, hour, minute, 0); // June 2026
        const status = ticketStatuses[i % ticketStatuses.length];
        const priority = ticketPriorities[Math.floor(Math.random() * ticketPriorities.length)];
        const category = ticketCategories[Math.floor(Math.random() * ticketCategories.length)];
        const reporter = deptEmployees[Math.floor(Math.random() * deptEmployees.length)];
        const ticket_id = uuidv4();

        await appDataSource.query(
          `INSERT INTO "ticket" (
            ticket_id, subject, description, status, priority, category, 
            employee_id, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          ON CONFLICT DO NOTHING`,
          [
            ticket_id,
            `Test Ticket ${i + 1}: ${category}`,
            `Sample ticket for ${dept.department_name} - Status: ${status}`,
            status,
            priority,
            category,
            reporter.employee_id,
            created_at,
            new Date(),
          ],
        );
        ticketCount++;
      }
    }

    console.log(`✅ Created ${ticketCount} tickets\n`);

    // ============================================
    // 2. SEED REQUISITIONS FOR JUNE 2026
    // ============================================
    console.log('📋 Seeding Requisitions...');

    const suppliers = ['SupplierA', 'SupplierB', 'SupplierC', 'SupplierD'];
    const units = ['pc', 'box', 'set', 'pcs'];

    let requisitionCount = 0;

    for (let deptIdx = 0; deptIdx < departments.length; deptIdx++) {
      const dept = departments[deptIdx];
      const deptEmployees = employees.filter((e) => e.department_id === dept.department_id);

      if (deptEmployees.length === 0) {
        continue;
      }

      const numRequisitions = deptIdx === 0 ? 8 : deptIdx === 1 ? 10 : 5;

      for (let i = 0; i < numRequisitions; i++) {
        const dayOfMonth = Math.floor(Math.random() * 28) + 1;
        const hour = Math.floor(Math.random() * 24);
        const minute = Math.floor(Math.random() * 60);
        const created_at = new Date(2026, 5, dayOfMonth, hour, minute, 0);
        const status = Math.random() > 0.3 ? 'approved' : 'pending';
        const rf_number = `RF-2026-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
        const requisition_id = uuidv4();
        const creator = deptEmployees[Math.floor(Math.random() * deptEmployees.length)];

        // Insert requisition
        await appDataSource.query(
          `INSERT INTO "part_requisitions" (
            requisition_id, rf_number, status, requested_by, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT DO NOTHING`,
          [
            requisition_id,
            rf_number,
            status,
            creator.employee_id,
            created_at,
            new Date(),
          ],
        );

        // Insert 2-4 requisition items per requisition
        const numItems = Math.floor(Math.random() * 3) + 2;
        for (let j = 0; j < numItems; j++) {
          const quantity = Math.floor(Math.random() * 100) + 1;
          const unit_cost = Math.floor(Math.random() * 5000) + 100;
          const total_cost = quantity * unit_cost;
          const item_id = uuidv4();

          await appDataSource.query(
            `INSERT INTO "requisition_items" (
              item_id, requisition_id, item_name, quantity, unit, supplier, 
              unit_cost, total_cost
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT DO NOTHING`,
            [
              item_id,
              requisition_id,
              `Item ${j + 1} for ${dept.department_name}`,
              quantity,
              units[Math.floor(Math.random() * units.length)],
              suppliers[Math.floor(Math.random() * suppliers.length)],
              unit_cost,
              total_cost,
            ],
          );
        }

        requisitionCount++;
      }
    }

    console.log(`✅ Created ${requisitionCount} requisitions with items\n`);

    console.log('🎉 Dashboard Data Seeding Complete!\n');
    console.log('📊 Test your endpoints:');
    console.log(
      '   curl "http://localhost:3000/dashboard/operational?month=6&year=2026" -H "Authorization: Bearer YOUR_TOKEN"',
    );
    console.log(
      '   curl "http://localhost:3000/dashboard/tactical?month=6&year=2026" -H "Authorization: Bearer YOUR_TOKEN"',
    );

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await appDataSource.destroy();
  }
}

seedDashboardData();
