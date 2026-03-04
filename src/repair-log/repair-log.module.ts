import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RepairLogService } from './repair-log.service';
import { RepairLogController } from './repair-log.controller';
import { RepairLog } from '../entities/repair-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([RepairLog])],
  controllers: [RepairLogController],
  providers: [RepairLogService],
  exports: [RepairLogService],
})
export class RepairLogModule {}
