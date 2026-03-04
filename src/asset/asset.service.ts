import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Asset } from '../entities/asset.entity';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';

@Injectable()
export class AssetService {
  constructor(
    @InjectRepository(Asset)
    private assetRepository: Repository<Asset>,
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

    const asset = this.assetRepository.create(createAssetDto);
    return await this.assetRepository.save(asset);
  }

  async findAll(): Promise<Asset[]> {
    return await this.assetRepository.find({
      relations: ['brand', 'assignedEmployee'],
      order: { created_at: 'DESC' },
    });
  }

  async findOne(asset_id: string): Promise<Asset> {
    const asset = await this.assetRepository.findOne({
      where: { asset_id },
      relations: ['brand', 'assignedEmployee'],
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
      relations: ['brand', 'assignedEmployee'],
      order: { created_at: 'DESC' },
    });
  }

  async findByEmployee(employee_id: string): Promise<Asset[]> {
    return await this.assetRepository.find({
      where: { assigned_to: employee_id },
      relations: ['brand', 'assignedEmployee'],
      order: { created_at: 'DESC' },
    });
  }

  async findByStatus(status: string): Promise<Asset[]> {
    return await this.assetRepository.find({
      where: { status },
      relations: ['brand', 'assignedEmployee'],
      order: { created_at: 'DESC' },
    });
  }
}
