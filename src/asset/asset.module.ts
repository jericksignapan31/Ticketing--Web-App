import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssetService } from './asset.service';
import { AssetHistoryService } from './asset-history.service';
import { AssetController } from './asset.controller';
import { Asset } from '../entities/asset.entity';
import { Employee } from '../entities/employee.entity';
import { AssetStatusHistory } from '../entities/asset-status-history.entity';
import { AssetAssignmentHistory } from '../entities/asset-assignment-history.entity';
import { AssetMovementHistory } from '../entities/asset-movement-history.entity';
import { RepairLog } from '../entities/repair-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Asset,
      Employee,
      AssetStatusHistory,
      AssetAssignmentHistory,
      AssetMovementHistory,
      RepairLog,
    ]),
  ],
  controllers: [AssetController],
  providers: [AssetService, AssetHistoryService],
  exports: [AssetService, AssetHistoryService],
})
export class AssetModule {}
