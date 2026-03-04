import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Branch } from '../entities/branch.entity';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';

@Injectable()
export class BranchService {
  constructor(
    @InjectRepository(Branch)
    private branchRepository: Repository<Branch>,
  ) {}

  async create(createBranchDto: CreateBranchDto): Promise<Branch> {
    const branch = this.branchRepository.create(createBranchDto);
    return await this.branchRepository.save(branch);
  }

  async findAll(): Promise<Branch[]> {
    return await this.branchRepository.find({
      relations: ['employees', 'assets'],
    });
  }

  async findOne(branch_id: string): Promise<Branch> {
    const branch = await this.branchRepository.findOne({
      where: { branch_id },
      relations: ['employees', 'assets'],
    });

    if (!branch) {
      throw new NotFoundException(`Branch with ID '${branch_id}' not found`);
    }

    return branch;
  }

  async update(
    branch_id: string,
    updateBranchDto: UpdateBranchDto,
  ): Promise<Branch> {
    const branch = await this.findOne(branch_id);

    Object.assign(branch, updateBranchDto);
    return await this.branchRepository.save(branch);
  }

  async remove(branch_id: string): Promise<void> {
    const branch = await this.findOne(branch_id);
    await this.branchRepository.remove(branch);
  }

  async search(query: string): Promise<Branch[]> {
    return await this.branchRepository.find({
      where: [
        { branch_name: Like(`%${query}%`) },
        { location: Like(`%${query}%`) },
      ],
      relations: ['employees', 'assets'],
    });
  }

  async getInventory(branch_id: string): Promise<Branch> {
    const branch = await this.branchRepository.findOne({
      where: { branch_id },
      relations: ['assets', 'assets.brand', 'assets.assignedEmployee'],
    });

    if (!branch) {
      throw new NotFoundException(`Branch with ID '${branch_id}' not found`);
    }

    return branch;
  }
}
