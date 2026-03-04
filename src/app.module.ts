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
      type: 'better-sqlite3',
      database: 'ithelp_desk.db',
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
      synchronize: true, // Set to false in production
    }),
    AuthModule,
    EmployeeModule,
    BranchModule,
    DepartmentModule,
    BrandModule,
    AssetModule,
    TicketModule,
    RepairLogModule,
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
