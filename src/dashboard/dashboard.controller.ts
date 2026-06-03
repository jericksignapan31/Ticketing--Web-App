import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { DashboardStatsDto, OperationalDashboardDto, TacticalDashboardDto } from './dashboard.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @ApiOperation({
    summary: 'Get dashboard statistics',
    description:
      'Retrieve comprehensive dashboard statistics including ticket counts, asset status, and priority distribution',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved dashboard statistics',
    type: DashboardStatsDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid token' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getStats(): Promise<DashboardStatsDto> {
    return this.dashboardService.getDashboardStats();
  }

  @Get('operational')
  @ApiOperation({
    summary: 'Get operational dashboard',
    description: 'Get ticket metrics by department with month/year filtering',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved operational dashboard',
    type: OperationalDashboardDto,
  })
  async getOperationalDashboard(
    @Query('month') month?: number,
    @Query('year') year?: number,
  ): Promise<OperationalDashboardDto> {
    return this.dashboardService.getOperationalDashboard(month, year);
  }

  @Get('tactical')
  @ApiOperation({
    summary: 'Get tactical dashboard',
    description: 'Get requisition metrics by department with costing and month/year filtering',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved tactical dashboard',
    type: TacticalDashboardDto,
  })
  async getTacticalDashboard(
    @Query('month') month?: number,
    @Query('year') year?: number,
  ): Promise<TacticalDashboardDto> {
    return this.dashboardService.getTacticalDashboard(month, year);
  }
}
