import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { PartRequisition } from '../entities/part-requisition.entity';
import { RequisitionItem } from '../entities/requisition-item.entity';
import { CreatePartRequisitionDto } from './dto/create-part-requisition.dto';
import { AcknowledgeRequisitionDto } from './dto/acknowledge-requisition.dto';
import { ApproveWarehousePartRequestDto } from './dto/approve-warehouse-part-request.dto';
import { UserRole } from '../common/enums/user-role.enum';

@Injectable()
export class RequisitionService {
  constructor(
    @InjectRepository(PartRequisition)
    private requisitionRepository: Repository<PartRequisition>,
    @InjectRepository(RequisitionItem)
    private itemRepository: Repository<RequisitionItem>,
  ) {}

  // Generate RF number in format RF-2026-001
  private async generateRFNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `RF-${year}-`;
    const latestRequisition = await this.requisitionRepository.findOne({
      where: { rf_number: Like(`${prefix}%`) },
      order: { rf_number: 'DESC' },
    });

    let nextNumber = 1;
    if (latestRequisition) {
      const lastNumber = parseInt(latestRequisition.rf_number.split('-')[2]);
      nextNumber = lastNumber + 1;
    }

    return `RF-${year}-${String(nextNumber).padStart(3, '0')}`;
  }

  async createRequisition(
    requester_id: string,
    requested_by_type: 'it' | 'warehouse',
    createPartRequisitionDto: CreatePartRequisitionDto,
  ): Promise<PartRequisition> {
    // Validate items
    if (!createPartRequisitionDto.items || createPartRequisitionDto.items.length === 0) {
      throw new BadRequestException('At least one item is required');
    }

    // Validate each item
    for (const item of createPartRequisitionDto.items) {
      if (!item.item_name || item.item_name.trim() === '') {
        throw new BadRequestException('item_name is required for all items');
      }
      if (!item.quantity || item.quantity <= 0) {
        throw new BadRequestException('quantity must be positive for all items');
      }
      if (!item.unit || item.unit.trim() === '') {
        throw new BadRequestException('unit is required for all items');
      }
    }

    try {
      // Generate RF number
      const rf_number = await this.generateRFNumber();

      // Create requisition
      const requisition = this.requisitionRepository.create({
        rf_number,
        requested_by: requester_id,
        requested_by_type,
        department: createPartRequisitionDto.department?.trim(),
        deadline: createPartRequisitionDto.deadline,
        status: 'pending',
      });

      const savedRequisition = await this.requisitionRepository.save(requisition);

      // Create items
      const itemsToCreate = createPartRequisitionDto.items.map((itemDto) => {
        const unit_cost = itemDto.unit_cost || null;
        const total_cost = unit_cost && itemDto.quantity ? unit_cost * itemDto.quantity : null;

        return this.itemRepository.create({
          requisition_id: savedRequisition.requisition_id,
          item_name: itemDto.item_name.trim(),
          quantity: itemDto.quantity,
          unit: itemDto.unit.trim(),
          supplier: itemDto.supplier?.trim() || null,
          unit_cost: unit_cost,
          total_cost: total_cost,
          purpose_remarks: itemDto.purpose_remarks?.trim() || null,
        });
      });

      const savedItems = await this.itemRepository.save(itemsToCreate);
      savedRequisition.items = savedItems;

      console.log('✅ Requisition created:', {
        rf_number: savedRequisition.rf_number,
        items_count: savedItems.length,
      });

      return savedRequisition;
    } catch (error) {
      console.error('❌ Error creating requisition:', error);
      throw new BadRequestException(`Failed to create requisition: ${error.message}`);
    }
  }

  async getPendingRequisitions(requested_by_type?: 'it' | 'warehouse'): Promise<PartRequisition[]> {
    const query = this.requisitionRepository
      .createQueryBuilder('req')
      .leftJoinAndSelect('req.items', 'items')
      .leftJoinAndSelect('req.requester', 'requester')
      .where('req.status = :status', { status: 'pending' });

    if (requested_by_type) {
      query.andWhere('req.requested_by_type = :type', { type: requested_by_type });
    }

    return query.orderBy('req.created_at', 'DESC').getMany();
  }

  async getPendingAdminReview(): Promise<PartRequisition[]> {
    return this.requisitionRepository
      .createQueryBuilder('req')
      .leftJoinAndSelect('req.items', 'items')
      .leftJoinAndSelect('req.requester', 'requester')
      .leftJoinAndSelect('req.acknowledger', 'acknowledger')
      .where('req.status = :status', { status: 'pending_admin_review' })
      .orderBy('req.acknowledged_at', 'DESC')
      .getMany();
  }

  async getRequisitionByRF(rf_number: string): Promise<PartRequisition> {
    const requisition = await this.requisitionRepository
      .createQueryBuilder('req')
      .leftJoinAndSelect('req.items', 'items')
      .leftJoinAndSelect('req.requester', 'requester')
      .leftJoinAndSelect('req.acknowledger', 'acknowledger')
      .leftJoinAndSelect('req.approver', 'approver')
      .where('req.rf_number = :rf_number', { rf_number })
      .getOne();

    if (!requisition) {
      throw new NotFoundException(`Requisition ${rf_number} not found`);
    }

    return requisition;
  }

  async acknowledgeRequisition(
    rf_number: string,
    warehouse_staff_id: string,
    acknowledgeRequisitionDto: AcknowledgeRequisitionDto,
  ): Promise<PartRequisition> {
    const requisition = await this.getRequisitionByRF(rf_number);

    if (requisition.status !== 'pending') {
      throw new BadRequestException(
        `Cannot acknowledge requisition with status '${requisition.status}'. Must be pending.`,
      );
    }

    requisition.status = 'pending_admin_review';
    requisition.acknowledged_by = warehouse_staff_id;
    requisition.acknowledged_at = new Date();
    requisition.acknowledged_notes = acknowledgeRequisitionDto.acknowledged_notes?.trim() || null;

    const updated = await this.requisitionRepository.save(requisition);

    console.log('✅ Requisition acknowledged:', {
      rf_number,
      acknowledged_by: warehouse_staff_id,
    });

    return updated;
  }

  async approveRequisition(
    rf_number: string,
    admin_id: string,
    approveDto: ApproveWarehousePartRequestDto,
  ): Promise<PartRequisition> {
    const requisition = await this.getRequisitionByRF(rf_number);

    if (requisition.status !== 'pending_admin_review') {
      throw new BadRequestException(
        `Cannot approve requisition with status '${requisition.status}'. Must be pending_admin_review.`,
      );
    }

    // Validate rejection_reason if rejecting
    if (
      approveDto.action === 'rejected' &&
      (!approveDto.rejection_reason || approveDto.rejection_reason.trim() === '')
    ) {
      throw new BadRequestException('rejection_reason is required when rejecting');
    }

    requisition.status = approveDto.action === 'approved' ? 'approved' : 'rejected';
    requisition.approved_by = admin_id;
    requisition.approved_at = new Date();
    requisition.rejection_reason = approveDto.rejection_reason?.trim() || null;

    const updated = await this.requisitionRepository.save(requisition);

    console.log('✅ Requisition approved:', {
      rf_number,
      status: updated.status,
      approved_by: admin_id,
    });

    return updated;
  }

  async getMyRequisitions(requester_id: string): Promise<PartRequisition[]> {
    return this.requisitionRepository
      .createQueryBuilder('req')
      .leftJoinAndSelect('req.items', 'items')
      .leftJoinAndSelect('req.acknowledger', 'acknowledger')
      .leftJoinAndSelect('req.approver', 'approver')
      .where('req.requested_by = :requester_id', { requester_id })
      .orderBy('req.created_at', 'DESC')
      .getMany();
  }

  async getAllRequisitions(): Promise<PartRequisition[]> {
    return this.requisitionRepository
      .createQueryBuilder('req')
      .leftJoinAndSelect('req.items', 'items')
      .leftJoinAndSelect('req.requester', 'requester')
      .leftJoinAndSelect('req.acknowledger', 'acknowledger')
      .leftJoinAndSelect('req.approver', 'approver')
      .orderBy('req.created_at', 'DESC')
      .getMany();
  }
}
