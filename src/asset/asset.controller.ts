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
  ApiQuery,
} from '@nestjs/swagger';
import { AssetService } from './asset.service';
import { AssetHistoryService } from './asset-history.service';
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
  constructor(
    private readonly assetService: AssetService,
    private readonly assetHistoryService: AssetHistoryService,
  ) {}

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
  @ApiOperation({ summary: 'Get assets (filtered by department for employees and supervisors)' })
  @ApiResponse({
    status: 200,
    description:
      'Returns all assets for admin/IT, or department assets for employees/supervisors',
  })
  findAll(@CurrentUser() user: any) {
    console.log('📋 GET /assets called for user:', {
      user_id: user.sub,
      role: user.role,
      departmentId: user.departmentId,
      branchId: user.branchId,
    });

    try {
      // If employee or supervisor role, return only assets from their department
      if ((user.role === 'employee' || user.role === 'supervisor') && user.departmentId) {
        console.log('🔄 Filtering by department:', user.departmentId);
        return this.assetService.findByDepartment(user.departmentId);
      }
      // For admin, IT - return all assets
      console.log('🌍 Returning all assets for admin/IT');
      return this.assetService.findAll();
    } catch (error) {
      console.error('❌ Error in findAll:', {
        message: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  @Get('search')
  @ApiOperation({
    summary:
      'Search assets by tag, category, model, or serial number (filtered by department for employees and supervisors)',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns matching assets',
  })
  search(@Query('q') query: string, @CurrentUser() user: any) {
    // If employee or supervisor role, search only within their department
    if ((user.role === 'employee' || user.role === 'supervisor') && user.departmentId) {
      return this.assetService.searchByDepartment(query, user.departmentId);
    }

    // For admin, IT - search all assets
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

  @Get(':asset_id/history')
  @ApiOperation({ summary: 'Get asset history/timeline (status changes, assignments, repairs, movements)' })
  @ApiQuery({ name: 'limit', required: false, example: 50, description: 'Number of records to return' })
  @ApiQuery({ name: 'offset', required: false, example: 0, description: 'Pagination offset' })
  @ApiQuery({ name: 'type', required: false, enum: ['status_change', 'assignment', 'repair', 'movement'], description: 'Filter by event type' })
  @ApiResponse({
    status: 200,
    description: 'Asset history retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Asset not found',
  })
  async getAssetHistory(
    @Param('asset_id') asset_id: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('type') type?: string,
  ) {
    try {
      const parsedLimit = limit ? Math.min(parseInt(limit, 10), 100) : 50;
      const parsedOffset = offset ? parseInt(offset, 10) : 0;

      const history = await this.assetHistoryService.getAssetHistory(
        asset_id,
        parsedLimit,
        parsedOffset,
        type,
      );

      return {
        success: true,
        data: history,
        message: 'Asset history retrieved successfully',
      };
    } catch (error) {
      if (error.status === 404) {
        return {
          success: false,
          error: error.message,
          assetId: asset_id,
        };
      }
      throw error;
    }
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
