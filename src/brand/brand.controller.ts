import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BrandService } from './brand.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('brands')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('brands')
export class BrandController {
  constructor(private readonly brandService: BrandService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new brand' })
  create(@Body() createBrandDto: CreateBrandDto) {
    return this.brandService.create(createBrandDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all brands' })
  findAll() {
    return this.brandService.findAll();
  }

  @Get('search')
  @ApiOperation({ summary: 'Search brands by name or description' })
  search(@Query('q') query: string) {
    return this.brandService.search(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a brand by ID' })
  findOne(@Param('id') id: string) {
    return this.brandService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a brand' })
  update(@Param('id') id: string, @Body() updateBrandDto: UpdateBrandDto) {
    return this.brandService.update(id, updateBrandDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a brand' })
  remove(@Param('id') id: string) {
    return this.brandService.remove(id);
  }
}
