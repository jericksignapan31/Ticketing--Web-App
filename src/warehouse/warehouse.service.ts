import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WarehousePartRequest } from '../entities/warehouse-part-request.entity';
import { CreateWarehousePartRequestDto } from './dto/create-warehouse-part-request.dto';
import { ApproveWarehousePartRequestDto } from './dto/approve-warehouse-part-request.dto';

@Injectable()
export class WarehouseService {
  constructor(
    @InjectRepository(WarehousePartRequest)
    private warehousePartRequestRepository: Repository<WarehousePartRequest>,
  ) {}

  async requestPart(
    warehouse_staff_id: string,
    createWarehousePartRequestDto: CreateWarehousePartRequestDto,
  ): Promise<WarehousePartRequest> {
    // Validate input
    if (!createWarehousePartRequestDto.part_name || createWarehousePartRequestDto.part_name.trim() === '') {
      throw new BadRequestException('part_name is required and cannot be empty');
    }

    if (!createWarehousePartRequestDto.quantity || createWarehousePartRequestDto.quantity <= 0) {
      throw new BadRequestException('quantity must be a positive number');
    }

    if (!createWarehousePartRequestDto.unit_cost || createWarehousePartRequestDto.unit_cost <= 0) {
      throw new BadRequestException('unit_cost must be a positive number');
    }

    if (!createWarehousePartRequestDto.supplier || createWarehousePartRequestDto.supplier.trim() === '') {
      throw new BadRequestException('supplier is required and cannot be empty');
    }

    const total_cost = createWarehousePartRequestDto.quantity * createWarehousePartRequestDto.unit_cost;

    try {
      const request = this.warehousePartRequestRepository.create({
        requested_by: warehouse_staff_id,
        part_name: createWarehousePartRequestDto.part_name.trim(),
        quantity: createWarehousePartRequestDto.quantity,
        unit_cost: createWarehousePartRequestDto.unit_cost,
        total_cost,
        supplier: createWarehousePartRequestDto.supplier.trim(),
        notes: createWarehousePartRequestDto.notes?.trim(),
        status: 'pending',
      });

      const savedRequest = await this.warehousePartRequestRepository.save(request);
      console.log('✅ Warehouse part request created:', {
        request_id: savedRequest.request_id,
        part_name: savedRequest.part_name,
        status: savedRequest.status,
      });

      return savedRequest;
    } catch (error) {
      console.error('❌ Error creating warehouse part request:', error);
      throw new BadRequestException(
        `Failed to create part request: ${error.message}`,
      );
    }
  }

  async getPendingRequests(): Promise<WarehousePartRequest[]> {
    return await this.warehousePartRequestRepository.find({
      where: { status: 'pending' },
      relations: ['requester'],
      order: { requested_at: 'DESC' },
    });
  }

  async getRequestsByWarehouse(warehouse_staff_id: string): Promise<WarehousePartRequest[]> {
    return await this.warehousePartRequestRepository.find({
      where: { requested_by: warehouse_staff_id },
      relations: ['approver'],
      order: { requested_at: 'DESC' },
    });
  }

  async getAllRequests(): Promise<WarehousePartRequest[]> {
    return await this.warehousePartRequestRepository.find({
      relations: ['requester', 'approver'],
      order: { requested_at: 'DESC' },
    });
  }

  async getRequestById(request_id: string): Promise<WarehousePartRequest> {
    const request = await this.warehousePartRequestRepository.findOne({
      where: { request_id },
      relations: ['requester', 'approver'],
    });

    if (!request) {
      throw new NotFoundException(
        `Warehouse part request with ID '${request_id}' not found`,
      );
    }

    return request;
  }

  async approveRequest(
    request_id: string,
    admin_id: string,
    approveWarehousePartRequestDto: ApproveWarehousePartRequestDto,
  ): Promise<WarehousePartRequest> {
    const request = await this.getRequestById(request_id);

    // Validate request is pending
    if (request.status !== 'pending') {
      throw new BadRequestException(
        `Cannot approve request with status '${request.status}'. Request must be pending.`,
      );
    }

    // Validate rejection_reason is provided if action is rejected
    if (
      approveWarehousePartRequestDto.action === 'rejected' &&
      (!approveWarehousePartRequestDto.rejection_reason || approveWarehousePartRequestDto.rejection_reason.trim() === '')
    ) {
      throw new BadRequestException('rejection_reason is required when rejecting a request');
    }

    request.status = approveWarehousePartRequestDto.action;
    request.approved_by = admin_id;
    request.approved_at = new Date();

    if (approveWarehousePartRequestDto.rejection_reason) {
      request.rejection_reason = approveWarehousePartRequestDto.rejection_reason;
    }

    const savedRequest = await this.warehousePartRequestRepository.save(request);

    console.log('✅ Warehouse part request updated:', {
      request_id: savedRequest.request_id,
      status: savedRequest.status,
      approved_by: admin_id,
    });

    return savedRequest;
  }
}
