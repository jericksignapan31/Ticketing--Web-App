const { DataSource } = require('typeorm');
const { config } = require('dotenv');
config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: ['dist/src/entities/*.entity{.ts,.js}'],
  migrationsRun: false,
});

AppDataSource.initialize().then(async () => {
  console.log('=== Test 1: Simple ticket count for June 2026 ===');
  const simpleCount = await AppDataSource.query(`
    SELECT COUNT(*) as count
    FROM ticket
    WHERE EXTRACT(MONTH FROM created_at) = 6
    AND EXTRACT(YEAR FROM created_at) = 2026
  `);
  console.log('Total tickets in June 2026:', simpleCount[0]);

  console.log('\n=== Test 2: Check employees and departments ===');
  const empResult = await AppDataSource.query(`
    SELECT department_id, COUNT(*) as count 
    FROM employee 
    GROUP BY department_id
  `);
  console.log('Employees by department:', empResult);

  console.log('\n=== Test 3: Check if tickets have employee_id ===');
  const ticketEmps = await AppDataSource.query(`
    SELECT 
      COUNT(*) as total,
      COUNT(employee_id) as with_employee_id,
      COUNT(CASE WHEN employee_id IS NULL THEN 1 END) as without_employee_id
    FROM ticket
    WHERE EXTRACT(MONTH FROM created_at) = 6
    AND EXTRACT(YEAR FROM created_at) = 2026
  `);
  console.log('Ticket employee_id check:', ticketEmps[0]);

  console.log('\n=== Test 4: Check employee-department join ===');
  const empDeptJoin = await AppDataSource.query(`
    SELECT 
      e.employee_id,
      e.department_id,
      d.department_name,
      COUNT(t.ticket_id) as ticket_count
    FROM employee e
    LEFT JOIN department d ON d.department_id = e.department_id
    LEFT JOIN ticket t ON e.employee_id = t.employee_id
      AND EXTRACT(MONTH FROM t.created_at) = 6
      AND EXTRACT(YEAR FROM t.created_at) = 2026
    WHERE e.employee_id IN (
      SELECT DISTINCT employee_id FROM ticket 
      WHERE EXTRACT(MONTH FROM created_at) = 6
      AND EXTRACT(YEAR FROM created_at) = 2026
    )
    GROUP BY e.employee_id, e.department_id, d.department_name
    LIMIT 5
  `);
  console.log('Employee-Ticket join (sample):', empDeptJoin);

  await AppDataSource.destroy();
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
