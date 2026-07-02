import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { PartRequisition } from '../entities/part-requisition.entity';
import { RequisitionItem } from '../entities/requisition-item.entity';
import { RequisitionReturn } from '../entities/requisition-return.entity';
import { RequisitionComment } from '../entities/requisition-comment.entity';
import { CreatePartRequisitionDto } from './dto/create-part-requisition.dto';
import { AcknowledgeRequisitionDto } from './dto/acknowledge-requisition.dto';
import { ApproveWarehousePartRequestDto } from './dto/approve-warehouse-part-request.dto';
import { ReturnRequisitionDto } from './dto/return-requisition.dto';
import { AddCommentDto } from './dto/add-comment.dto';
import { ResubmitRequisitionDto } from './dto/resubmit-requisition.dto';
import { UserRole } from '../common/enums/user-role.enum';

@Injectable()
export class RequisitionService {
  constructor(
    @InjectRepository(PartRequisition)
    private requisitionRepository: Repository<PartRequisition>,
    @InjectRepository(RequisitionItem)
    private itemRepository: Repository<RequisitionItem>,
    @InjectRepository(RequisitionReturn)
    private returnRepository: Repository<RequisitionReturn>,
    @InjectRepository(RequisitionComment)
    private commentRepository: Repository<RequisitionComment>,
  ) {}

  async createRequisition(
    requester_id: string,
    requested_by_type: 'it' | 'warehouse',
    createPartRequisitionDto: CreatePartRequisitionDto,
  ): Promise<PartRequisition> {
    // Validate rf_number is provided
    if (!createPartRequisitionDto.rf_number || createPartRequisitionDto.rf_number.trim() === '') {
      throw new BadRequestException('rf_number is required');
    }

    // Check if rf_number already exists
    const existingRequisition = await this.requisitionRepository.findOne({
      where: { rf_number: createPartRequisitionDto.rf_number },
    });

    if (existingRequisition) {
      throw new BadRequestException(
        `Requisition form number '${createPartRequisitionDto.rf_number}' already exists. Please use a unique RF number.`,
      );
    }

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
      // Create requisition with provided rf_number
      const requisition = this.requisitionRepository.create({
        rf_number: createPartRequisitionDto.rf_number.trim(),
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
    } catch (error: any) {
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

    await this.requisitionRepository.save(requisition);

    console.log('✅ Requisition acknowledged:', {
      rf_number,
      acknowledged_by: warehouse_staff_id,
    });

    // Re-fetch to get updated relations
    return this.getRequisitionByRF(rf_number);
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

    await this.requisitionRepository.save(requisition);

    console.log('✅ Requisition approved:', {
      rf_number,
      status: requisition.status,
      approved_by: admin_id,
    });

    // Re-fetch to get updated relations
    return this.getRequisitionByRF(rf_number);
  }

  async getMyRequisitions(requester_id: string): Promise<PartRequisition[]> {
    return this.requisitionRepository
      .createQueryBuilder('req')
      .leftJoinAndSelect('req.items', 'items')
      .leftJoinAndSelect('req.requester', 'requester')
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

  async getApprovedRequisitions(): Promise<PartRequisition[]> {
    return this.requisitionRepository
      .createQueryBuilder('req')
      .leftJoinAndSelect('req.items', 'items')
      .leftJoinAndSelect('req.requester', 'requester')
      .leftJoinAndSelect('req.approver', 'approver')
      .where('req.status = :status', { status: 'approved' })
      .orderBy('req.approved_at', 'DESC')
      .getMany();
  }

  async getRequisitionInventory(): Promise<Record<string, any>[]> {
    const requisitions = await this.requisitionRepository
      .createQueryBuilder('req')
      .leftJoinAndSelect('req.items', 'items')
      .leftJoinAndSelect('req.requester', 'requester')
      .orderBy('req.created_at', 'DESC')
      .getMany();

    // Format as inventory list with requisition details
    const inventory: Record<string, any>[] = [];
    requisitions.forEach((req) => {
      req.items.forEach((item) => {
        inventory.push({
          item_id: item.item_id,
          requisition_id: req.requisition_id,
          rf_number: req.rf_number,
          item_name: item.item_name,
          quantity: item.quantity,
          unit: item.unit,
          supplier: item.supplier,
          unit_cost: item.unit_cost,
          total_cost: item.total_cost,
          purpose_remarks: item.purpose_remarks,
          requisition_status: req.status,
          requested_by_type: req.requested_by_type,
          requester: req.requester,
          created_at: req.created_at,
          updated_at: req.updated_at,
        });
      });
    });

    return inventory;
  }

  /**
   * Return an entire requisition with warehouse notes
   * Status changes to 'returned_by_warehouse'
   */
  async returnRequisition(
    rf_number: string,
    warehouse_staff_id: string,
    returnDto: ReturnRequisitionDto,
  ): Promise<RequisitionReturn> {
    try {
      const requisition = await this.getRequisitionByRF(rf_number);

      // Check if requisition status is appropriate for return
      if (
        requisition.status !== 'pending' &&
        requisition.status !== 'pending_admin_review'
      ) {
        throw new BadRequestException(
          `Cannot return requisition with status '${requisition.status}'. Must be pending or pending_admin_review.`,
        );
      }

      // Validate warehouse_notes is provided and is a string
      if (!returnDto.warehouse_notes || typeof returnDto.warehouse_notes !== 'string') {
        throw new BadRequestException('warehouse_notes is required and must be a string');
      }

      // Get the highest return_cycle for this requisition to increment it
      const maxReturnCycle = await this.returnRepository
        .createQueryBuilder('ret')
        .select('MAX(ret.return_cycle)', 'maxCycle')
        .where('ret.requisition_id = :req_id', {
          req_id: requisition.requisition_id,
        })
        .getRawOne();

      const nextCycle = (maxReturnCycle?.maxCycle || 0) + 1;

      // Create return record
      const returnRecord = this.returnRepository.create({
        requisition_id: requisition.requisition_id,
        returned_by: warehouse_staff_id,
        warehouse_notes: returnDto.warehouse_notes.trim(),
        return_cycle: nextCycle,
      });

      const savedReturn = await this.returnRepository.save(returnRecord);

      // Update requisition status to returned_by_warehouse
      requisition.status = 'returned_by_warehouse';
      await this.requisitionRepository.save(requisition);

      console.log('✅ Requisition returned:', {
        rf_number,
        returned_by: warehouse_staff_id,
        return_id: savedReturn.return_id,
        return_cycle: nextCycle,
      });

      return savedReturn;
    } catch (error) {
      console.error('❌ Error returning requisition:', error);
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to return requisition: ${(error as any).message}`);
    }
  }

  /**
   * Get all requisitions pending warehouse return (returned_by_warehouse status)
   */
  async getPendingReturns(): Promise<PartRequisition[]> {
    return this.requisitionRepository
      .createQueryBuilder('req')
      .leftJoinAndSelect('req.items', 'items')
      .leftJoinAndSelect('req.requester', 'requester')
      .leftJoinAndSelect('req.returns', 'returns')
      .leftJoinAndSelect('returns.comments', 'comments')
      .where('req.status = :status', { status: 'returned_by_warehouse' })
      .orderBy('req.updated_at', 'DESC')
      .addOrderBy('returns.created_at', 'DESC')
      .getMany();
  }

  /**
   * Add a comment to a return thread
   */
  async addComment(
    rf_number: string,
    user_id: string,
    user_role: 'warehouse' | 'it',
    commentDto: AddCommentDto,
  ): Promise<RequisitionComment> {
    const requisition = await this.getRequisitionByRF(rf_number);

    if (requisition.status !== 'returned_by_warehouse') {
      throw new BadRequestException(
        `Cannot add comment to requisition with status '${requisition.status}'. Must be returned_by_warehouse.`,
      );
    }

    // Get the latest return record
    const latestReturn = await this.returnRepository
      .createQueryBuilder('ret')
      .where('ret.requisition_id = :req_id', {
        req_id: requisition.requisition_id,
      })
      .orderBy('ret.created_at', 'DESC')
      .getOne();

    if (!latestReturn) {
      throw new NotFoundException('Return record not found for this requisition');
    }

    // Create comment
    const comment = this.commentRepository.create({
      return_id: latestReturn.return_id,
      commented_by: user_id,
      role: user_role,
      message: commentDto.message.trim(),
    });

    const savedComment = await this.commentRepository.save(comment);

    console.log('✅ Comment added:', {
      rf_number,
      comment_id: savedComment.comment_id,
      role: user_role,
    });

    return savedComment;
  }

  /**
   * Get all comments for a requisition return thread
   */
  async getComments(rf_number: string): Promise<RequisitionComment[]> {
    const requisition = await this.getRequisitionByRF(rf_number);

    // Get the latest return record
    const latestReturn = await this.returnRepository
      .createQueryBuilder('ret')
      .leftJoinAndSelect('ret.comments', 'comments')
      .where('ret.requisition_id = :req_id', {
        req_id: requisition.requisition_id,
      })
      .orderBy('ret.created_at', 'DESC')
      .getOne();

    if (!latestReturn) {
      return [];
    }

    // Return comments sorted by creation time
    return latestReturn.comments.sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );
  }

  /**
   * Resubmit a requisition after IT edits
   * Status returns to 'pending' for warehouse acknowledgement again
   * Increments return_cycle counter
   */
  async resubmitRequisition(
    rf_number: string,
    it_staff_id: string,
    _resubmitDto: ResubmitRequisitionDto,
  ): Promise<RequisitionReturn> {
    const requisition = await this.getRequisitionByRF(rf_number);

    if (requisition.status !== 'returned_by_warehouse') {
      throw new BadRequestException(
        `Cannot resubmit requisition with status '${requisition.status}'. Must be returned_by_warehouse.`,
      );
    }

    // Get the latest return record
    const latestReturn = await this.returnRepository
      .createQueryBuilder('ret')
      .where('ret.requisition_id = :req_id', {
        req_id: requisition.requisition_id,
      })
      .orderBy('ret.created_at', 'DESC')
      .getOne();

    if (!latestReturn) {
      throw new NotFoundException('Return record not found for this requisition');
    }

    // Update return record with resubmit info
    latestReturn.resubmitted_by = it_staff_id;
    latestReturn.resubmitted_at = new Date();
    await this.returnRepository.save(latestReturn);

    // Update requisition status back to 'pending' for warehouse to acknowledge again
    requisition.status = 'pending';
    requisition.acknowledged_by = null;
    requisition.acknowledged_at = null;
    requisition.acknowledged_notes = null;
    await this.requisitionRepository.save(requisition);

    console.log('✅ Requisition resubmitted:', {
      rf_number,
      resubmitted_by: it_staff_id,
      return_cycle: latestReturn.return_cycle,
    });

    return latestReturn;
  }

  /**
   * Get full history of returns and resubmits for a requisition
   */
  async getRequisitionHistory(rf_number: string): Promise<RequisitionReturn[]> {
    const requisition = await this.getRequisitionByRF(rf_number);

    const returns = await this.returnRepository
      .createQueryBuilder('ret')
      .leftJoinAndSelect('ret.comments', 'comments')
      .where('ret.requisition_id = :req_id', {
        req_id: requisition.requisition_id,
      })
      .orderBy('ret.created_at', 'DESC')
      .addOrderBy('comments.created_at', 'ASC')
      .getMany();

    return returns;
  }
}
