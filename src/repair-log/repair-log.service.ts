import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { RepairLog } from '../entities/repair-log.entity';
import { CreateRepairLogDto } from './dto/create-repair-log.dto';
import { UpdateRepairLogDto } from './dto/update-repair-log.dto';

@Injectable()
export class RepairLogService {
  constructor(
    @InjectRepository(RepairLog)
    private repairLogRepository: Repository<RepairLog>,
  ) {}

  async create(createRepairLogDto: CreateRepairLogDto): Promise<RepairLog> {
    const repairLog = this.repairLogRepository.create(createRepairLogDto);
    return await this.repairLogRepository.save(repairLog);
  }

  async findAll(): Promise<RepairLog[]> {
    return await this.repairLogRepository.find({
      relations: ['asset', 'reporter', 'repairer'],
      order: { repair_date: 'DESC' },
    });
  }

  async findOne(repair_log_id: string): Promise<RepairLog> {
    const repairLog = await this.repairLogRepository.findOne({
      where: { repair_log_id },
      relations: ['asset', 'reporter', 'repairer'],
    });

    if (!repairLog) {
      throw new NotFoundException(
        `Repair log with ID '${repair_log_id}' not found`,
      );
    }

    return repairLog;
  }

  async update(
    repair_log_id: string,
    updateRepairLogDto: UpdateRepairLogDto,
  ): Promise<RepairLog> {
    const repairLog = await this.findOne(repair_log_id);

    Object.assign(repairLog, updateRepairLogDto);
    return await this.repairLogRepository.save(repairLog);
  }

  async remove(repair_log_id: string): Promise<void> {
    const repairLog = await this.findOne(repair_log_id);
    await this.repairLogRepository.remove(repairLog);
  }

  async search(query: string): Promise<RepairLog[]> {
    return await this.repairLogRepository.find({
      where: [
        { issue_description: Like(`%${query}%`) },
        { action_taken: Like(`%${query}%`) },
      ],
      relations: ['asset', 'reporter', 'repairer'],
      order: { repair_date: 'DESC' },
    });
  }

  async findByAsset(asset_id: string): Promise<RepairLog[]> {
    return await this.repairLogRepository.find({
      where: { asset_id },
      relations: ['asset', 'reporter', 'repairer'],
      order: { repair_date: 'DESC' },
    });
  }

  async findByRepairer(employee_id: string): Promise<RepairLog[]> {
    return await this.repairLogRepository.find({
      where: { repaired_by: employee_id },
      relations: ['asset', 'reporter', 'repairer'],
      order: { repair_date: 'DESC' },
    });
  }

  async findByStatus(status: string): Promise<RepairLog[]> {
    return await this.repairLogRepository.find({
      where: { status },
      relations: ['asset', 'reporter', 'repairer'],
      order: { repair_date: 'DESC' },
    });
  }
}
