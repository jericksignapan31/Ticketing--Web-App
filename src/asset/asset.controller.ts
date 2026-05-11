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
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { AssetService } from './asset.service';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../common/enums/user-role.enum';

@ApiTags('assets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('assets')
export class AssetController {
  constructor(private readonly assetService: AssetService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.IT, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Create a new asset (Admin, Supervisor, IT, Employee)' })
  async create(@Body() createAssetDto: CreateAssetDto) {
    try {
      console.log('Creating asset with DTO:', createAssetDto);
      const result = await this.assetService.create(createAssetDto);
      console.log('Asset created successfully:', result);
      return result;
    } catch (error) {
      console.error('Asset creation error:', error);
      throw error;
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get assets (filtered by branch for employees)' })
  @ApiResponse({
    status: 200,
    description:
      'Returns all assets for admin/supervisor/IT, or branch assets for employees',
  })
  findAll(@CurrentUser() user: any) {
    // If employee role, return only assets from their branch
    if (user.role === 'employee' && user.branchId) {
      return this.assetService.findByBranch(user.branchId);
    }
    // For admin, supervisor, IT - return all assets
    return this.assetService.findAll();
  }

  @Get('search')
  @ApiOperation({
    summary:
      'Search assets by tag, category, model, or serial number (filtered by branch for employees)',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns matching assets',
  })
  search(@Query('q') query: string, @CurrentUser() user: any) {
    // If employee role, search only within their branch
    if (user.role === 'employee' && user.branchId) {
      return this.assetService.searchByBranch(query, user.branchId);
    }

    // For admin, supervisor, IT - search all assets
    return this.assetService.search(query);
  }

  @Get('my-branch')
  @ApiOperation({
    summary: 'Get assets from my branch/station (for ticket creation dropdown)',
  })
  @ApiResponse({
    status: 200,
    description: "Returns assets from the logged-in user's branch",
  })
  @ApiResponse({
    status: 404,
    description: 'Employee not found or not assigned to any branch',
  })
  findMyBranchAssets(@CurrentUser() user: any) {
    // Use branchId from JWT token directly
    if (user.branchId) {
      return this.assetService.findByBranch(user.branchId);
    }
    // Fallback to old method if branchId not in token
    return this.assetService.findByUserBranch(user.employee_id);
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
