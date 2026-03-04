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
import { RepairLogService } from './repair-log.service';
import { CreateRepairLogDto } from './dto/create-repair-log.dto';
import { UpdateRepairLogDto } from './dto/update-repair-log.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('repair-logs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('repair-logs')
export class RepairLogController {
  constructor(private readonly repairLogService: RepairLogService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new repair log' })
  create(@Body() createRepairLogDto: CreateRepairLogDto) {
    return this.repairLogService.create(createRepairLogDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all repair logs' })
  findAll() {
    return this.repairLogService.findAll();
  }

  @Get('search')
  @ApiOperation({ summary: 'Search repair logs by issue or action' })
  search(@Query('q') query: string) {
    return this.repairLogService.search(query);
  }

  @Get('asset/:asset_id')
  @ApiOperation({ summary: 'Get repair logs for a specific asset' })
  findByAsset(@Param('asset_id') asset_id: string) {
    return this.repairLogService.findByAsset(asset_id);
  }

  @Get('repairer/:employee_id')
  @ApiOperation({ summary: 'Get repair logs by repairer' })
  findByRepairer(@Param('employee_id') employee_id: string) {
    return this.repairLogService.findByRepairer(employee_id);
  }

  @Get('status/:status')
  @ApiOperation({ summary: 'Get repair logs by status' })
  findByStatus(@Param('status') status: string) {
    return this.repairLogService.findByStatus(status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a repair log by ID' })
  findOne(@Param('id') id: string) {
    return this.repairLogService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a repair log' })
  update(
    @Param('id') id: string,
    @Body() updateRepairLogDto: UpdateRepairLogDto,
  ) {
    return this.repairLogService.update(id, updateRepairLogDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a repair log' })
  remove(@Param('id') id: string) {
    return this.repairLogService.remove(id);
  }
}
