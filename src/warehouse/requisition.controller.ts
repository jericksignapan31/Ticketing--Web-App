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
import { DeclineRequisitionDto } from './dto/decline-requisition.dto';
import { ReturnRequisitionDto } from './dto/return-requisition.dto';
import { AddCommentDto } from './dto/add-comment.dto';
import { ResubmitRequisitionDto } from './dto/resubmit-requisition.dto';
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

  @Get('warehouse/pending-returns')
  @UseGuards(RolesGuard)
  @Roles(UserRole.IT, UserRole.WAREHOUSE)
  @ApiOperation({ summary: 'Get all requisitions pending IT response after warehouse return (IT and Warehouse)' })
  @ApiResponse({
    status: 200,
    description: 'Returns all requisitions with returned_by_warehouse status',
  })
  getPendingReturns() {
    return this.requisitionService.getPendingReturns();
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

  @Patch(':rf_number/decline')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Decline requisition with reason (Admin only)' })
  @ApiParam({ name: 'rf_number', description: 'Requisition RF number' })
  @ApiResponse({ status: 200, description: 'Requisition declined, status changed to declined_by_admin' })
  @ApiResponse({ status: 400, description: 'Requisition not pending admin review or missing decline reason' })
  @ApiResponse({ status: 404, description: 'Requisition not found' })
  declineRequisition(
    @Param('rf_number') rf_number: string,
    @Body() declineDto: DeclineRequisitionDto,
    @CurrentUser() user: any,
  ) {
    return this.requisitionService.declineRequisition(rf_number, user.employee_id, declineDto);
  }

  @Patch(':rf_number/return')
  @UseGuards(RolesGuard)
  @Roles(UserRole.WAREHOUSE)
  @ApiOperation({ summary: 'Return requisition with warehouse notes (Warehouse only)' })
  @ApiParam({ name: 'rf_number', description: 'Requisition RF number' })
  @ApiResponse({ status: 200, description: 'Requisition returned, status changed to returned_by_warehouse' })
  @ApiResponse({ status: 400, description: 'Requisition not in valid status for return' })
  @ApiResponse({ status: 404, description: 'Requisition not found' })
  returnRequisition(
    @Param('rf_number') rf_number: string,
    @Body() returnDto: ReturnRequisitionDto,
    @CurrentUser() user: any,
  ) {
    return this.requisitionService.returnRequisition(
      rf_number,
      user.employee_id,
      returnDto,
    );
  }

  @Post(':rf_number/comments')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Add comment to requisition return thread' })
  @ApiParam({ name: 'rf_number', description: 'Requisition RF number' })
  @ApiResponse({ status: 201, description: 'Comment added to return thread' })
  @ApiResponse({ status: 400, description: 'Requisition not in returned status' })
  @ApiResponse({ status: 404, description: 'Requisition or return record not found' })
  addComment(
    @Param('rf_number') rf_number: string,
    @Body() commentDto: AddCommentDto,
    @CurrentUser() user: any,
  ) {
    // Determine user role from user object
    const user_role = (user.role === 'warehouse' || user.role === 'it') ? user.role : 'it';
    return this.requisitionService.addComment(
      rf_number,
      user.employee_id,
      user_role as 'warehouse' | 'it',
      commentDto,
    );
  }

  @Get(':rf_number/comments')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get comment thread for requisition return' })
  @ApiParam({ name: 'rf_number', description: 'Requisition RF number' })
  @ApiResponse({ status: 200, description: 'Returns all comments for the requisition return thread' })
  @ApiResponse({ status: 404, description: 'Requisition not found' })
  getComments(@Param('rf_number') rf_number: string) {
    return this.requisitionService.getComments(rf_number);
  }

  @Patch(':rf_number/resubmit')
  @UseGuards(RolesGuard)
  @Roles(UserRole.IT)
  @ApiOperation({ summary: 'Resubmit requisition after IT edits (IT only)' })
  @ApiParam({ name: 'rf_number', description: 'Requisition RF number' })
  @ApiResponse({ status: 200, description: 'Requisition resubmitted, status reset to pending for warehouse acknowledgment' })
  @ApiResponse({ status: 400, description: 'Requisition not in returned_by_warehouse status' })
  @ApiResponse({ status: 404, description: 'Requisition or return record not found' })
  resubmitRequisition(
    @Param('rf_number') rf_number: string,
    @Body() resubmitDto: ResubmitRequisitionDto,
    @CurrentUser() user: any,
  ) {
    return this.requisitionService.resubmitRequisition(
      rf_number,
      user.employee_id,
      resubmitDto,
    );
  }

  @Get(':rf_number/history')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get full return/resubmit history for requisition' })
  @ApiParam({ name: 'rf_number', description: 'Requisition RF number' })
  @ApiResponse({ status: 200, description: 'Returns all return cycles with comments and resubmit timestamps' })
  @ApiResponse({ status: 404, description: 'Requisition not found' })
  getRequisitionHistory(@Param('rf_number') rf_number: string) {
    return this.requisitionService.getRequisitionHistory(rf_number);
  }
}
