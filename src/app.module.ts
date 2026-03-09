import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Employee } from './entities/employee.entity';
import { UserAccount } from './entities/user-account.entity';
import { Branch } from './entities/branch.entity';
import { Department } from './entities/department.entity';
import { Brand } from './entities/brand.entity';
import { Asset } from './entities/asset.entity';
import { Ticket } from './entities/ticket.entity';
import { RepairLog } from './entities/repair-log.entity';
import { AuthModule } from './auth/auth.module';
import { EmployeeModule } from './employee/employee.module';
import { BranchModule } from './branch/branch.module';
import { DepartmentModule } from './department/department.module';
import { BrandModule } from './brand/brand.module';
import { AssetModule } from './asset/asset.module';
import { TicketModule } from './ticket/ticket.module';
import { RepairLogModule } from './repair-log/repair-log.module';
import { UserAccountModule } from './user-account/user-account.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // Time window in milliseconds (60 seconds)
        limit: 100, // Max requests per ttl window
      },
    ]),
    TypeOrmModule.forRoot({
      type: process.env.DB_TYPE as 'postgres',
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
      synchronize: process.env.DB_SYNCHRONIZE === 'true', // Auto-create tables (only for development)
      ssl: process.env.NODE_ENV === 'production' ? false : undefined,
    }),
    AuthModule,
    EmployeeModule,
    BranchModule,
    DepartmentModule,
    BrandModule,
    AssetModule,
    TicketModule,
    RepairLogModule,
    UserAccountModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard, // Apply rate limiting globally
    },
  ],
})
export class AppModule {}
