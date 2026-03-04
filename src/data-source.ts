import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { Employee } from './entities/employee.entity';
import { UserAccount } from './entities/user-account.entity';
import { Branch } from './entities/branch.entity';
import { Department } from './entities/department.entity';
import { Brand } from './entities/brand.entity';
import { Asset } from './entities/asset.entity';
import { Ticket } from './entities/ticket.entity';
import { RepairLog } from './entities/repair-log.entity';

// Load environment variables
config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: [
    Employee,
    UserAccount,
    Branch,
    Department,
    Brand,
    Asset,
    Ticket,
    RepairLog,
  ],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
  logging: true,
  ssl: process.env.NODE_ENV === 'production' ? false : undefined,
});
