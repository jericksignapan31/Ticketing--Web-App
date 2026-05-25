import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Asset } from '../entities/asset.entity';
import { AssetStatusHistory } from '../entities/asset-status-history.entity';
import { AssetAssignmentHistory } from '../entities/asset-assignment-history.entity';
import { AssetMovementHistory } from '../entities/asset-movement-history.entity';
import { RepairLog } from '../entities/repair-log.entity';
import { AssetHistoryResponseDto } from './dto/asset-history.dto';

@Injectable()
export class AssetHistoryService {
  constructor(
    @InjectRepository(Asset)
    private assetRepository: Repository<Asset>,
    @InjectRepository(AssetStatusHistory)
    private statusHistoryRepository: Repository<AssetStatusHistory>,
    @InjectRepository(AssetAssignmentHistory)
    private assignmentHistoryRepository: Repository<AssetAssignmentHistory>,
    @InjectRepository(AssetMovementHistory)
    private movementHistoryRepository: Repository<AssetMovementHistory>,
    @InjectRepository(RepairLog)
    private repairLogRepository: Repository<RepairLog>,
  ) {}

  async getAssetHistory(
    assetId: string,
    limit: number = 50,
    offset: number = 0,
    type?: string,
  ): Promise<AssetHistoryResponseDto> {
    // Verify asset exists
    const asset = await this.assetRepository.findOne({
      where: { asset_id: assetId },
    });

    if (!asset) {
      throw new NotFoundException(`Asset with ID '${assetId}' not found`);
    }

    const allEvents: any[] = [];

    // 1. Get status changes
    const statusChanges = await this.statusHistoryRepository.find({
      where: { asset_id: assetId },
      relations: ['changedByUser'],
      order: { created_at: 'DESC' },
    });

    allEvents.push(
      ...statusChanges.map(sh => ({
        id: sh.id,
        type: 'status_change',
        description: `Status changed from ${sh.previous_status || 'unknown'} to ${sh.new_status}`,
        previousValue: sh.previous_status,
        newValue: sh.new_status,
        changedBy: sh.changedByUser?.email || 'Unknown',
        changedByRole: 'ADMIN',
        timestamp: sh.created_at.toISOString(),
        details: {
          reason: sh.reason,
        },
      })),
    );

    // 2. Get assignments
    const assignments = await this.assignmentHistoryRepository.find({
      where: { asset_id: assetId },
      order: { created_at: 'DESC' },
    });

    allEvents.push(
      ...assignments.map(ah => ({
        id: ah.id,
        type: 'assignment',
        description: `Assigned to Employee ID: ${ah.new_employee_id || 'Unassigned'}`,
        employeeId: ah.new_employee_id,
        employeeName: null,
        previousEmployee: null,
        changedBy: 'Unknown',
        changedByRole: 'ADMIN',
        timestamp: ah.created_at.toISOString(),
        details: {
          notes: ah.notes,
        },
      })),
    );

    // 3. Get repairs
    const repairs = await this.repairLogRepository.find({
      where: { asset_id: assetId },
      order: { repair_date: 'DESC' },
    });

    allEvents.push(
      ...repairs.map(rl => ({
        id: rl.repair_log_id,
        type: 'repair',
        description: rl.issue_description || 'Repair performed',
        repairType: rl.status,
        technician: rl.repaired_by || 'Unknown',
        technicianId: null,
        changedBy: rl.repaired_by || 'Unknown',
        changedByRole: 'IT',
        timestamp: rl.repair_date.toISOString(),
        details: {
          cost: rl.cost,
          notes: rl.notes,
          actionTaken: rl.action_taken,
        },
      })),
    );

    // 4. Get movements
    const movements = await this.movementHistoryRepository.find({
      where: { asset_id: assetId },
      relations: ['fromBranch', 'toBranch', 'movedByUser'],
      order: { created_at: 'DESC' },
    });

    allEvents.push(
      ...movements.map(mh => ({
        id: mh.id,
        type: 'movement',
        description: `Moved from Branch '${mh.fromBranch?.branch_name || 'Unknown'}' to '${mh.toBranch?.branch_name || 'Unknown'}'`,
        fromBranch: mh.fromBranch?.branch_name,
        toBranch: mh.toBranch?.branch_name,
        fromBranchId: mh.from_branch_id,
        toBranchId: mh.to_branch_id,
        movedBy: mh.movedByUser?.email || 'Unknown',
        changedByRole: 'ADMIN',
        timestamp: mh.created_at.toISOString(),
        details: {
          reason: mh.reason,
        },
      })),
    );

    // Filter by type if provided
    let filteredEvents = allEvents;
    if (type) {
      filteredEvents = allEvents.filter(e => e.type === type);
    }

    // Sort by timestamp descending (most recent first)
    filteredEvents.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );

    // Apply pagination
    const totalEvents = filteredEvents.length;
    const paginatedEvents = filteredEvents.slice(offset, offset + limit);

    return {
      assetId: asset.asset_id,
      assetTag: asset.asset_tag,
      totalEvents,
      events: paginatedEvents,
    };
  }
}
