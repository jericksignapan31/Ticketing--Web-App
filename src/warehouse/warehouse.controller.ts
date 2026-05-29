import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { WarehouseService } from './warehouse.service';
import { CreateWarehousePartRequestDto } from './dto/create-warehouse-part-request.dto';
import { ApproveWarehousePartRequestDto } from './dto/approve-warehouse-part-request.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../common/enums/user-role.enum';

@ApiTags('warehouse')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('warehouse')
export class WarehouseController {
  constructor(private readonly warehouseService: WarehouseService) {}

  @Post('part-requests')
  @UseGuards(RolesGuard)
  @Roles(UserRole.WAREHOUSE)
  @ApiOperation({ summary: 'Request parts from warehouse (Warehouse staff only)' })
  @ApiResponse({ status: 201, description: 'Part request created' })
  @ApiResponse({ status: 400, description: 'Invalid input or validation error' })
  requestPart(
    @Body() createWarehousePartRequestDto: CreateWarehousePartRequestDto,
    @CurrentUser() user: any,
  ) {
    return this.warehouseService.requestPart(
      user.employee_id,
      createWarehousePartRequestDto,
    );
  }

  @Get('part-requests/pending')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all pending part requests (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Returns all pending warehouse part requests',
  })
  getPendingRequests() {
    return this.warehouseService.getPendingRequests();
  }

  @Get('part-requests/my-requests')
  @UseGuards(RolesGuard)
  @Roles(UserRole.WAREHOUSE)
  @ApiOperation({ summary: 'Get my part requests (Warehouse staff only)' })
  @ApiResponse({
    status: 200,
    description: 'Returns all part requests by the logged-in warehouse staff',
  })
  getMyRequests(@CurrentUser() user: any) {
    return this.warehouseService.getRequestsByWarehouse(user.employee_id);
  }

  @Get('part-requests/all')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all part requests (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Returns all warehouse part requests',
  })
  getAllRequests() {
    return this.warehouseService.getAllRequests();
  }

  @Get('part-requests/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.WAREHOUSE)
  @ApiOperation({ summary: 'Get part request by ID' })
  @ApiParam({ name: 'id', description: 'Request ID' })
  @ApiResponse({ status: 200, description: 'Returns the part request' })
  @ApiResponse({ status: 404, description: 'Request not found' })
  getRequestById(@Param('id') request_id: string) {
    return this.warehouseService.getRequestById(request_id);
  }

  @Patch('part-requests/:id/approve')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Approve or reject part request (Admin only)' })
  @ApiParam({ name: 'id', description: 'Request ID' })
  @ApiResponse({ status: 200, description: 'Request approved/rejected' })
  @ApiResponse({ status: 400, description: 'Request not pending or invalid action' })
  @ApiResponse({ status: 404, description: 'Request not found' })
  approveRequest(
    @Param('id') request_id: string,
    @Body() approveWarehousePartRequestDto: ApproveWarehousePartRequestDto,
    @CurrentUser() user: any,
  ) {
    return this.warehouseService.approveRequest(
      request_id,
      user.employee_id,
      approveWarehousePartRequestDto,
    );
  }
}
