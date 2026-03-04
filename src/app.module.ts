import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Employee } from './entities/employee.entity';
import { UserAccount } from './entities/user-account.entity';
import { Branch } from './entities/branch.entity';
import { Department } from './entities/department.entity';
import { AuthModule } from './auth/auth.module';
import { EmployeeModule } from './employee/employee.module';
import { BranchModule } from './branch/branch.module';
import { DepartmentModule } from './department/department.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: 'ithelp_desk.db',
      entities: [Employee, UserAccount, Branch, Department],
      synchronize: true, // Set to false in production
    }),
    AuthModule,
    EmployeeModule,
    BranchModule,
    DepartmentModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
