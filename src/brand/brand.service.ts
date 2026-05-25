import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Brand } from '../entities/brand.entity';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';

@Injectable()
export class BrandService {
  constructor(
    @InjectRepository(Brand)
    private brandRepository: Repository<Brand>,
  ) {}

  async create(createBrandDto: CreateBrandDto): Promise<Brand> {
    const brand = this.brandRepository.create(createBrandDto);
    return await this.brandRepository.save(brand);
  }

  async findAll(): Promise<Brand[]> {
    return await this.brandRepository.find({
      order: { created_at: 'DESC' },
    });
  }

  async findOne(brand_id: string): Promise<Brand> {
    const brand = await this.brandRepository.findOne({
      where: { brand_id },
    });

    if (!brand) {
      throw new NotFoundException(`Brand with ID '${brand_id}' not found`);
    }

    return brand;
  }

  async update(
    brand_id: string,
    updateBrandDto: UpdateBrandDto,
  ): Promise<Brand> {
    const brand = await this.findOne(brand_id);

    Object.assign(brand, updateBrandDto);
    return await this.brandRepository.save(brand);
  }

  async remove(brand_id: string): Promise<void> {
    const brand = await this.findOne(brand_id);
    await this.brandRepository.remove(brand);
  }

  async search(query: string): Promise<Brand[]> {
    return await this.brandRepository.find({
      where: [
        { brand_name: Like(`%${query}%`) },
        { description: Like(`%${query}%`) },
      ],
      order: { created_at: 'DESC' },
    });
  }
}
