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
import { BranchService } from './branch.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('branches')
@Controller('branches')
export class BranchController {
  constructor(private readonly branchService: BranchService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new branch (Authenticated)' })
  create(@Body() createBranchDto: CreateBranchDto) {
    return this.branchService.create(createBranchDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all branches (Public)' })
  findAll() {
    return this.branchService.findAll();
  }

  @Get('search')
  @ApiOperation({ summary: 'Search branches by name or location (Public)' })
  search(@Query('q') query: string) {
    return this.branchService.search(query);
  }

  @Get(':id/inventory')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get branch inventory (all assets in this station)',
  })
  getInventory(@Param('id') id: string) {
    return this.branchService.getInventory(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a branch by ID (Public)' })
  findOne(@Param('id') id: string) {
    return this.branchService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a branch (Authenticated)' })
  update(@Param('id') id: string, @Body() updateBranchDto: UpdateBranchDto) {
    return this.branchService.update(id, updateBranchDto);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update branch status (active/inactive)' })
  updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.branchService.updateStatus(id, status);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a branch (Authenticated)' })
  remove(@Param('id') id: string) {
    return this.branchService.remove(id);
  }
}
