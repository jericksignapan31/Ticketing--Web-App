import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Department } from '../entities/department.entity';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';

@Injectable()
export class DepartmentService {
  constructor(
    @InjectRepository(Department)
    private departmentRepository: Repository<Department>,
  ) {}

  async create(createDepartmentDto: CreateDepartmentDto): Promise<Department> {
    const department = this.departmentRepository.create(createDepartmentDto);
    return await this.departmentRepository.save(department);
  }

  async findAll(): Promise<Department[]> {
    return await this.departmentRepository.find({
      relations: ['employees'],
    });
  }

  async findOne(department_id: string): Promise<Department> {
    const department = await this.departmentRepository.findOne({
      where: { department_id },
      relations: ['employees'],
    });

    if (!department) {
      throw new NotFoundException(
        `Department with ID '${department_id}' not found`,
      );
    }

    return department;
  }

  async update(
    department_id: string,
    updateDepartmentDto: UpdateDepartmentDto,
  ): Promise<Department> {
    const department = await this.findOne(department_id);

    Object.assign(department, updateDepartmentDto);
    return await this.departmentRepository.save(department);
  }

  async remove(department_id: string): Promise<void> {
    const department = await this.findOne(department_id);
    await this.departmentRepository.remove(department);
  }

  async search(query: string): Promise<Department[]> {
    return await this.departmentRepository.find({
      where: [
        { department_name: Like(`%${query}%`) },
        { description: Like(`%${query}%`) },
      ],
      relations: ['employees'],
    });
  }

  async updateStatus(
    department_id: string,
    is_active: boolean,
  ): Promise<Department> {
    const department = await this.findOne(department_id);

    if (typeof is_active !== 'boolean') {
      throw new NotFoundException('Invalid is_active value. Must be true or false');
    }

    department.is_active = is_active;
    return await this.departmentRepository.save(department);
  }
}
