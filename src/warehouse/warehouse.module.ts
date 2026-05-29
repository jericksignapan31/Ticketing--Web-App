import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WarehouseService } from './warehouse.service';
import { WarehouseController } from './warehouse.controller';
import { RequisitionService } from './requisition.service';
import { RequisitionController } from './requisition.controller';
import { WarehousePartRequest } from '../entities/warehouse-part-request.entity';
import { PartRequisition } from '../entities/part-requisition.entity';
import { RequisitionItem } from '../entities/requisition-item.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([WarehousePartRequest, PartRequisition, RequisitionItem]),
  ],
  providers: [WarehouseService, RequisitionService],
  controllers: [WarehouseController, RequisitionController],
  exports: [WarehouseService, RequisitionService],
})
export class WarehouseModule {}
