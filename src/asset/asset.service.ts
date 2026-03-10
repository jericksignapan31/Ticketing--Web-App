import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Asset } from '../entities/asset.entity';
import { Employee } from '../entities/employee.entity';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';

@Injectable()
export class AssetService {
  constructor(
    @InjectRepository(Asset)
    private assetRepository: Repository<Asset>,
    @InjectRepository(Employee)
    private employeeRepository: Repository<Employee>,
  ) {}

  async create(createAssetDto: CreateAssetDto): Promise<Asset> {
    // Check if asset_tag already exists
    const existingAsset = await this.assetRepository.findOne({
      where: { asset_tag: createAssetDto.asset_tag },
    });

    if (existingAsset) {
      throw new ConflictException(
        `Asset with tag '${createAssetDto.asset_tag}' already exists`,
      );
    }

    // Validate that assigned employee belongs to the same branch
    if (createAssetDto.assigned_to && createAssetDto.branch_id) {
      const employee = await this.employeeRepository.findOne({
        where: { employee_id: createAssetDto.assigned_to },
      });

      if (!employee) {
        throw new NotFoundException(
          `Employee with ID '${createAssetDto.assigned_to}' not found`,
        );
      }

      if (employee.branch_id !== createAssetDto.branch_id) {
        throw new BadRequestException(
          `Employee '${employee.first_name} ${employee.last_name}' (${employee.employee_id}) does not belong to the selected branch. Employee's branch: ${employee.branch_id}, Asset's branch: ${createAssetDto.branch_id}`,
        );
      }

      // Check if employee is active
      if (!employee.employment_status) {
        throw new BadRequestException(
          `Cannot assign asset to inactive employee '${employee.first_name} ${employee.last_name}' (${employee.employee_id})`,
        );
      }
    }

    const asset = this.assetRepository.create(createAssetDto);
    return await this.assetRepository.save(asset);
  }

  async findAll(): Promise<Asset[]> {
    return await this.assetRepository.find({
      relations: ['brand', 'branch', 'assignedEmployee'],
      order: { created_at: 'DESC' },
    });
  }

  async findOne(asset_id: string): Promise<Asset> {
    const asset = await this.assetRepository.findOne({
      where: { asset_id },
      relations: ['brand', 'branch', 'assignedEmployee'],
    });

    if (!asset) {
      throw new NotFoundException(`Asset with ID '${asset_id}' not found`);
    }

    return asset;
  }

  async update(
    asset_id: string,
    updateAssetDto: UpdateAssetDto,
  ): Promise<Asset> {
    const asset = await this.findOne(asset_id);

    // If asset_tag is being updated, check if it's already taken
    if (
      updateAssetDto.asset_tag &&
      updateAssetDto.asset_tag !== asset.asset_tag
    ) {
      const existingAsset = await this.assetRepository.findOne({
        where: { asset_tag: updateAssetDto.asset_tag },
      });

      if (existingAsset) {
        throw new ConflictException(
          `Asset with tag '${updateAssetDto.asset_tag}' already exists`,
        );
      }
    }

    // Validate that assigned employee belongs to the same branch (if both are being updated or set)
    const finalBranchId = updateAssetDto.branch_id || asset.branch_id;
    const finalAssignedTo = updateAssetDto.assigned_to || asset.assigned_to;

    if (finalAssignedTo && finalBranchId) {
      const employee = await this.employeeRepository.findOne({
        where: { employee_id: finalAssignedTo },
      });

      if (!employee) {
        throw new NotFoundException(
          `Employee with ID '${finalAssignedTo}' not found`,
        );
      }

      if (employee.branch_id !== finalBranchId) {
        throw new BadRequestException(
          `Employee '${employee.first_name} ${employee.last_name}' (${employee.employee_id}) does not belong to the selected branch. Employee's branch: ${employee.branch_id}, Asset's branch: ${finalBranchId}`,
        );
      }

      // Check if employee is active
      if (!employee.employment_status) {
        throw new BadRequestException(
          `Cannot assign asset to inactive employee '${employee.first_name} ${employee.last_name}' (${employee.employee_id})`,
        );
      }
    }

    Object.assign(asset, updateAssetDto);
    return await this.assetRepository.save(asset);
  }

  async remove(asset_id: string): Promise<void> {
    const asset = await this.findOne(asset_id);
    await this.assetRepository.remove(asset);
  }

  async search(query: string): Promise<Asset[]> {
    return await this.assetRepository.find({
      where: [
        { asset_tag: Like(`%${query}%`) },
        { category: Like(`%${query}%`) },
        { model: Like(`%${query}%`) },
        { serial_number: Like(`%${query}%`) },
      ],
      relations: ['brand', 'branch', 'assignedEmployee'],
      order: { created_at: 'DESC' },
    });
  }

  async findByBranch(branch_id: string): Promise<Asset[]> {
    return await this.assetRepository.find({
      where: { branch_id },
      relations: ['brand', 'branch', 'assignedEmployee'],
      order: { created_at: 'DESC' },
    });
  }

  async findByEmployee(employee_id: string): Promise<Asset[]> {
    return await this.assetRepository.find({
      where: { assigned_to: employee_id },
      relations: ['brand', 'branch', 'assignedEmployee'],
      order: { created_at: 'DESC' },
    });
  }

  async findByStatus(status: string): Promise<Asset[]> {
    return await this.assetRepository.find({
      where: { status },
      relations: ['brand', 'branch', 'assignedEmployee'],
      order: { created_at: 'DESC' },
    });
  }

  async findByUserBranch(employee_id: string): Promise<Asset[]> {
    // Get the employee's branch
    const employee = await this.employeeRepository.findOne({
      where: { employee_id },
    });

    if (!employee) {
      throw new NotFoundException(
        `Employee with ID '${employee_id}' not found`,
      );
    }

    if (!employee.branch_id) {
      throw new BadRequestException(
        `Employee '${employee.first_name} ${employee.last_name}' is not assigned to any branch`,
      );
    }

    // Return assets from the employee's branch
    return await this.assetRepository.find({
      where: { branch_id: employee.branch_id },
      relations: ['brand', 'branch', 'assignedEmployee'],
      order: { created_at: 'DESC' },
    });
  }
}
