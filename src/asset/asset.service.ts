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
import { Brand } from '../entities/brand.entity';
import { Branch } from '../entities/branch.entity';
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
    try {
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
    } catch (error) {
      const err = error as Error & { code?: string };
      console.error('Error creating asset:', err);
      if (
        error instanceof ConflictException ||
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to create asset: ${err.message || 'Unknown error'}`,
      );
    }
  }

  async findAll(): Promise<Asset[]> {
    try {
      console.log('📋 Finding all assets');
      // Use raw query to avoid TypeORM's automatic join issues with type mismatches
      const assets = await this.assetRepository.query(`
        SELECT 
          a.asset_id, a.asset_tag, a.brand_id, a.branch_id, a.category, 
          a.model, a.serial_number, a.status, a.condition, a.assigned_to, 
          a.notes, a.specifications, a.ip_address, a.mac_address, a.hostname, 
          a.anydesk_id, a.created_at, a.updated_at,
          b.brand_id, b.brand_name, b.description, b.brand_image_url, b.status as brand_status, b.created_at as brand_created_at, b.updated_at as brand_updated_at,
          br.branch_id, br.branch_name, br.location, br.contact_number, br.status as branch_status, br.created_at as branch_created_at, br.updated_at as branch_updated_at,
          e.employee_id, e.branch_id as emp_branch_id, e.department_id, e.first_name, e.last_name, e.middle_name, e.email, e.role, e.position, e.contact_number as emp_contact, e.employment_status, e.created_at as emp_created_at, e.updated_at as emp_updated_at
        FROM asset a
        LEFT JOIN brand b ON b.brand_id = a.brand_id
        LEFT JOIN branch br ON br.branch_id = a.branch_id
        LEFT JOIN employee e ON e.employee_id::varchar = a.assigned_to
        ORDER BY a.created_at DESC
      `);
      // Map the raw query results to Asset objects with relations
      const result = assets.map(row => {
        const asset = new Asset();
        asset.asset_id = row.asset_id;
        asset.asset_tag = row.asset_tag;
        asset.brand_id = row.brand_id;
        asset.branch_id = row.branch_id;
        asset.category = row.category;
        asset.model = row.model;
        asset.serial_number = row.serial_number;
        asset.status = row.status;
        asset.condition = row.condition;
        asset.assigned_to = row.assigned_to;
        asset.notes = row.notes;
        asset.specifications = row.specifications;
        asset.ip_address = row.ip_address;
        asset.mac_address = row.mac_address;
        asset.hostname = row.hostname;
        asset.anydesk_id = row.anydesk_id;
        asset.created_at = row.created_at;
        asset.updated_at = row.updated_at;
        if (row.brand_name) {
          asset.brand = new Brand();
          asset.brand.brand_id = row.brand_id;
          asset.brand.brand_name = row.brand_name;
          asset.brand.description = row.description;
        }
        if (row.branch_name) {
          asset.branch = new Branch();
          asset.branch.branch_id = row.branch_id;
          asset.branch.branch_name = row.branch_name;
          asset.branch.location = row.location;
        }
        if (row.employee_id) {
          asset.assignedEmployee = new Employee();
          asset.assignedEmployee.employee_id = row.employee_id;
          asset.assignedEmployee.first_name = row.first_name;
          asset.assignedEmployee.last_name = row.last_name;
          asset.assignedEmployee.email = row.email;
        }
        return asset;
      });
      console.log('✅ Found all assets:', result.length);
      return result;
    } catch (error) {
      const err = error as Error & { code?: string };
      console.error('❌ Error finding all assets:', {
        message: err.message,
        code: err.code,
        stack: err.stack,
      });
      throw error;
    }
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

  async searchByDepartment(query: string, department_id: string): Promise<Asset[]> {
    // Search assets assigned to employees in the same department
    // Use INNER JOIN to only get assets with assigned employees
    return await this.assetRepository
      .createQueryBuilder('asset')
      .innerJoinAndSelect('asset.assignedEmployee', 'employee')
      .leftJoinAndSelect('asset.brand', 'brand')
      .leftJoinAndSelect('asset.branch', 'branch')
      .where('CAST(employee.department_id AS text) = :department_id', { department_id })
      .andWhere(
        '(asset.asset_tag ILIKE :query OR asset.category ILIKE :query OR asset.model ILIKE :query OR asset.serial_number ILIKE :query)',
        { query: `%${query}%` },
      )
      .orderBy('asset.created_at', 'DESC')
      .getMany();
  }

  async searchByBranch(query: string, branch_id: string): Promise<Asset[]> {
    return await this.assetRepository.find({
      where: [
        { asset_tag: Like(`%${query}%`), branch_id },
        { category: Like(`%${query}%`), branch_id },
        { model: Like(`%${query}%`), branch_id },
        { serial_number: Like(`%${query}%`), branch_id },
      ],
      relations: ['brand', 'branch', 'assignedEmployee'],
      order: { created_at: 'DESC' },
    });
  }

  async searchByUserBranch(
    query: string,
    employee_id: string,
  ): Promise<Asset[]> {
    // Get the employee's branch
    const employee = await this.employeeRepository.findOne({
      where: { employee_id },
    });

    if (!employee) {
      throw new NotFoundException(
        `Employee with ID '${employee_id}' not found`,
      );
    }

    if (!employee.department_id) {
      throw new BadRequestException(
        `Employee '${employee.first_name} ${employee.last_name}' is not assigned to any department`,
      );
    }

    // Search within employee's department
    return this.searchByDepartment(query, employee.department_id);
  }

  async findByDepartment(department_id: string): Promise<Asset[]> {
    // Find all assets assigned to employees in the same department
    // Use INNER JOIN to only get assets with assigned employees
    console.log('🔍 Finding assets by department:', department_id);
    
    try {
      const query = this.assetRepository
        .createQueryBuilder('asset')
        .innerJoinAndSelect('asset.assignedEmployee', 'employee')
        .leftJoinAndSelect('asset.brand', 'brand')
        .leftJoinAndSelect('asset.branch', 'branch')
        .where('CAST(employee.department_id AS text) = :department_id', { department_id })
        .orderBy('asset.created_at', 'DESC');
      
      console.log('📝 Query SQL:', query.getSql());
      console.log('📋 Query params:', { department_id });

      const assets = await query.getMany();
      
      console.log('✅ Found assets:', assets.length);
      return assets;
    } catch (error) {
      const err = error as Error & { code?: string; sqlState?: string; detail?: string; hint?: string };
      console.error('❌ Error finding assets by department:', {
        department_id,
        message: err.message,
        code: err.code,
        sqlState: err.sqlState,
        detail: err.detail,
        hint: err.hint,
        stack: err.stack,
      });
      throw error;
    }
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
