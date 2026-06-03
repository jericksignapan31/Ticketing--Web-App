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
  console.log('=== Ticket table columns ===');
  const ticketCols = await AppDataSource.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'ticket'
    ORDER BY column_name
  `);
  console.log(ticketCols);

  console.log('\n=== Department table columns ===');
  const deptCols = await AppDataSource.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'department'
    ORDER BY column_name
  `);
  console.log(deptCols);

  console.log('\n=== Employee table columns ===');
  const empCols = await AppDataSource.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'employee'
    ORDER BY column_name
  `);
  console.log(empCols);

  await AppDataSource.destroy();
}).catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
