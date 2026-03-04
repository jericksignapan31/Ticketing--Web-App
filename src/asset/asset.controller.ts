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
import { AssetService } from './asset.service';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('assets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('assets')
export class AssetController {
  constructor(private readonly assetService: AssetService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new asset' })
  create(@Body() createAssetDto: CreateAssetDto) {
    return this.assetService.create(createAssetDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all assets' })
  findAll() {
    return this.assetService.findAll();
  }

  @Get('search')
  @ApiOperation({
    summary: 'Search assets by tag, category, model, or serial number',
  })
  search(@Query('q') query: string) {
    return this.assetService.search(query);
  }

  @Get('employee/:employee_id')
  @ApiOperation({ summary: 'Get assets assigned to a specific employee' })
  findByEmployee(@Param('employee_id') employee_id: string) {
    return this.assetService.findByEmployee(employee_id);
  }

  @Get('branch/:branch_id')
  @ApiOperation({ summary: 'Get assets by branch/station' })
  findByBranch(@Param('branch_id') branch_id: string) {
    return this.assetService.findByBranch(branch_id);
  }

  @Get('status/:status')
  @ApiOperation({ summary: 'Get assets by status' })
  findByStatus(@Param('status') status: string) {
    return this.assetService.findByStatus(status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an asset by ID' })
  findOne(@Param('id') id: string) {
    return this.assetService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an asset' })
  update(@Param('id') id: string, @Body() updateAssetDto: UpdateAssetDto) {
    return this.assetService.update(id, updateAssetDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an asset' })
  remove(@Param('id') id: string) {
    return this.assetService.remove(id);
  }
}
