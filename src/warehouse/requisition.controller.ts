import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { RequisitionService } from './requisition.service';
import { CreatePartRequisitionDto } from './dto/create-part-requisition.dto';
import { AcknowledgeRequisitionDto } from './dto/acknowledge-requisition.dto';
import { ApproveWarehousePartRequestDto } from './dto/approve-warehouse-part-request.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../common/enums/user-role.enum';

@ApiTags('requisitions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('requisitions')
export class RequisitionController {
  constructor(private readonly requisitionService: RequisitionService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.IT, UserRole.WAREHOUSE)
  @ApiOperation({ summary: 'Create a new part requisition (IT or Warehouse)' })
  @ApiResponse({ status: 201, description: 'Requisition created with RF number' })
  @ApiResponse({ status: 400, description: 'Invalid input or validation error' })
  createRequisition(
    @Body() createPartRequisitionDto: CreatePartRequisitionDto,
    @CurrentUser() user: any,
  ) {
    const requested_by_type = user.role === 'it' ? 'it' : 'warehouse';
    return this.requisitionService.createRequisition(
      user.employee_id,
      requested_by_type,
      createPartRequisitionDto,
    );
  }

  @Get('my-requisitions')
  @UseGuards(RolesGuard)
  @Roles(UserRole.IT, UserRole.WAREHOUSE)
  @ApiOperation({ summary: 'Get my requisitions (IT or Warehouse)' })
  @ApiResponse({
    status: 200,
    description: 'Returns all requisitions created by the user',
  })
  getMyRequisitions(@CurrentUser() user: any) {
    return this.requisitionService.getMyRequisitions(user.employee_id);
  }

  @Get('pending')
  @UseGuards(RolesGuard)
  @Roles(UserRole.WAREHOUSE)
  @ApiOperation({ summary: 'Get pending requisitions for warehouse acknowledgment' })
  @ApiResponse({
    status: 200,
    description: 'Returns all pending requisitions',
  })
  getPendingRequisitions(@Query('type') type?: 'it' | 'warehouse') {
    return this.requisitionService.getPendingRequisitions(type);
  }

  @Get('pending-admin-review')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get requisitions pending admin approval (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Returns all requisitions acknowledged by warehouse, ready for admin review',
  })
  getPendingAdminReview() {
    return this.requisitionService.getPendingAdminReview();
  }

  @Get('all')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all requisitions (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Returns all requisitions with all statuses',
  })
  getAllRequisitions() {
    return this.requisitionService.getAllRequisitions();
  }

  @Get('approved')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.WAREHOUSE, UserRole.IT)
  @ApiOperation({ summary: 'Get all approved requisitions' })
  @ApiResponse({
    status: 200,
    description: 'Returns all approved requisitions with items',
  })
  getApprovedRequisitions() {
    return this.requisitionService.getApprovedRequisitions();
  }

  @Get('inventory')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.WAREHOUSE, UserRole.IT)
  @ApiOperation({ summary: 'Get inventory status of all requisition items' })
  @ApiResponse({
    status: 200,
    description: 'Returns all items from all requisitions with their status and requester info',
  })
  getRequisitionInventory() {
    return this.requisitionService.getRequisitionInventory();
  }

  @Get(':rf_number')
  @UseGuards(RolesGuard)
  @Roles(UserRole.IT, UserRole.WAREHOUSE, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get requisition by RF number' })
  @ApiParam({ name: 'rf_number', description: 'Requisition RF number (e.g., RF-2026-001)' })
  @ApiResponse({ status: 200, description: 'Returns the requisition details' })
  @ApiResponse({ status: 404, description: 'Requisition not found' })
  getRequisitionByRF(@Param('rf_number') rf_number: string) {
    return this.requisitionService.getRequisitionByRF(rf_number);
  }

  @Patch(':rf_number/acknowledge')
  @UseGuards(RolesGuard)
  @Roles(UserRole.WAREHOUSE)
  @ApiOperation({ summary: 'Acknowledge requisition (Warehouse only)' })
  @ApiParam({ name: 'rf_number', description: 'Requisition RF number' })
  @ApiResponse({ status: 200, description: 'Requisition acknowledged, moved to pending admin review' })
  @ApiResponse({ status: 400, description: 'Requisition not in pending status' })
  @ApiResponse({ status: 404, description: 'Requisition not found' })
  acknowledgeRequisition(
    @Param('rf_number') rf_number: string,
    @Body() acknowledgeRequisitionDto: AcknowledgeRequisitionDto,
    @CurrentUser() user: any,
  ) {
    return this.requisitionService.acknowledgeRequisition(
      rf_number,
      user.employee_id,
      acknowledgeRequisitionDto,
    );
  }

  @Patch(':rf_number/approve')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Approve or reject requisition (Admin only)' })
  @ApiParam({ name: 'rf_number', description: 'Requisition RF number' })
  @ApiResponse({ status: 200, description: 'Requisition approved or rejected' })
  @ApiResponse({ status: 400, description: 'Requisition not pending admin review or missing rejection reason' })
  @ApiResponse({ status: 404, description: 'Requisition not found' })
  approveRequisition(
    @Param('rf_number') rf_number: string,
    @Body() approveDto: ApproveWarehousePartRequestDto,
    @CurrentUser() user: any,
  ) {
    return this.requisitionService.approveRequisition(rf_number, user.employee_id, approveDto);
  }
}
