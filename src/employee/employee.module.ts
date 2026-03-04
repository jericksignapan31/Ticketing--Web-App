import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmployeeService } from './employee.service';
import { EmployeeController } from './employee.controller';
import { Employee } from '../entities/employee.entity';
import { UserAccount } from '../entities/user-account.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Employee, UserAccount])],
  controllers: [EmployeeController],
  providers: [EmployeeService],
  exports: [EmployeeService],
})
export class EmployeeModule {}
