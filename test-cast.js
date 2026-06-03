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
  console.log('=== Testing operational dashboard query with CAST ===');
  const result = await AppDataSource.query(`
    SELECT 
      d.department_id,
      d.department_name,
      COUNT(t.ticket_id)::INTEGER as ticket_count,
      COUNT(CASE WHEN t.status = 'open' THEN 1 END)::INTEGER as open_count,
      COUNT(CASE WHEN t.status = 'in-progress' THEN 1 END)::INTEGER as in_progress_count,
      COUNT(CASE WHEN t.status = 'resolved' THEN 1 END)::INTEGER as resolved_count,
      COUNT(CASE WHEN t.status = 'closed' THEN 1 END)::INTEGER as closed_count
    FROM "department" d
    LEFT JOIN "employee" e ON d.department_id = e.department_id
    LEFT JOIN "ticket" t ON e.employee_id = CAST(t.employee_id AS UUID)
      AND EXTRACT(MONTH FROM t.created_at) = 6
      AND EXTRACT(YEAR FROM t.created_at) = 2026
    GROUP BY d.department_id, d.department_name
    ORDER BY ticket_count DESC
  `);
  console.log(JSON.stringify(result, null, 2));

  await AppDataSource.destroy();
}).catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
