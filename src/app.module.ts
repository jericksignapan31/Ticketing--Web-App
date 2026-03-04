import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Employee } from './entities/employee.entity';
import { UserAccount } from './entities/user-account.entity';
import { Branch } from './entities/branch.entity';
import { Department } from './entities/department.entity';
import { Brand } from './entities/brand.entity';
import { Asset } from './entities/asset.entity';
import { AuthModule } from './auth/auth.module';
import { EmployeeModule } from './employee/employee.module';
import { BranchModule } from './branch/branch.module';
import { DepartmentModule } from './department/department.module';
import { BrandModule } from './brand/brand.module';
import { AssetModule } from './asset/asset.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: 'ithelp_desk.db',
      entities: [Employee, UserAccount, Branch, Department, Brand, Asset],
      synchronize: true, // Set to false in production
    }),
    AuthModule,
    EmployeeModule,
    BranchModule,
    DepartmentModule,
    BrandModule,
    AssetModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
