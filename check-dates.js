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
  migrations: ['dist/src/migrations/*{.ts,.js}'],
  migrationsRun: false,
});

AppDataSource.initialize().then(async () => {
  const result = await AppDataSource.query(`
    SELECT ticket_id, subject, created_at, EXTRACT(MONTH FROM created_at) as month, EXTRACT(YEAR FROM created_at) as year
    FROM ticket 
    LIMIT 10
  `);
  console.log('Sample tickets:', JSON.stringify(result, null, 2));
  
  const count = await AppDataSource.query(`
    SELECT COUNT(*) as total, 
           EXTRACT(MONTH FROM created_at) as month,
           EXTRACT(YEAR FROM created_at) as year
    FROM ticket
    GROUP BY EXTRACT(MONTH FROM created_at), EXTRACT(YEAR FROM created_at)
  `);
  console.log('\nCounts by month/year:', JSON.stringify(count, null, 2));
  
  await AppDataSource.destroy();
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
