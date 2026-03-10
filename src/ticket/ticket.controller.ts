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
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { TicketService } from './ticket.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { ApproveTicketDto } from './dto/approve-ticket.dto';
import { RejectTicketDto } from './dto/reject-ticket.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../common/enums/user-role.enum';

@ApiTags('tickets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tickets')
export class TicketController {
  constructor(private readonly ticketService: TicketService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new ticket' })
  create(@Body() createTicketDto: CreateTicketDto) {
    return this.ticketService.create(createTicketDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all tickets' })
  findAll() {
    return this.ticketService.findAll();
  }

  @Get('search')
  @ApiOperation({
    summary: 'Search tickets by subject, description, or category',
  })
  search(@Query('q') query: string) {
    return this.ticketService.search(query);
  }

  @Get('reporter/:employee_id')
  @ApiOperation({ summary: 'Get tickets reported by a specific employee' })
  findByReporter(@Param('employee_id') employee_id: string) {
    return this.ticketService.findByReporter(employee_id);
  }

  @Get('assignee/:employee_id')
  @ApiOperation({ summary: 'Get tickets assigned to a specific employee' })
  findByAssignee(@Param('employee_id') employee_id: string) {
    return this.ticketService.findByAssignee(employee_id);
  }

  @Get('status/:status')
  @ApiOperation({ summary: 'Get tickets by status' })
  findByStatus(@Param('status') status: string) {
    return this.ticketService.findByStatus(status);
  }

  @Get('priority/:priority')
  @ApiOperation({ summary: 'Get tickets by priority' })
  findByPriority(@Param('priority') priority: string) {
    return this.ticketService.findByPriority(priority);
  }

  @Get('category/:category')
  @ApiOperation({ summary: 'Get tickets by category' })
  findByCategory(@Param('category') category: string) {
    return this.ticketService.findByCategory(category);
  }

  @Get('pending-approvals')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPERVISOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all tickets pending approval' })
  @ApiResponse({
    status: 200,
    description: 'Returns all tickets pending supervisor approval',
  })
  findPendingApprovals() {
    return this.ticketService.findPendingApprovals();
  }

  @Get('approval-status/:status')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPERVISOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get tickets by approval status' })
  @ApiParam({ name: 'status', enum: ['pending', 'approved', 'rejected'] })
  @ApiResponse({
    status: 200,
    description: 'Returns tickets with specified approval status',
  })
  findByApprovalStatus(@Param('status') status: string) {
    return this.ticketService.findByApprovalStatus(status);
  }

  @Patch(':id/approve')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPERVISOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Approve a ticket (Supervisor only)' })
  @ApiParam({ name: 'id', description: 'Ticket ID' })
  @ApiResponse({ status: 200, description: 'Ticket approved successfully' })
  @ApiResponse({ status: 400, description: 'Ticket is not in pending status' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  approve(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() approveTicketDto: ApproveTicketDto,
  ) {
    return this.ticketService.approveTicket(
      id,
      user.employee_id,
      approveTicketDto,
    );
  }

  @Patch(':id/reject')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPERVISOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Reject a ticket (Supervisor only)' })
  @ApiParam({ name: 'id', description: 'Ticket ID' })
  @ApiResponse({ status: 200, description: 'Ticket rejected successfully' })
  @ApiResponse({ status: 400, description: 'Ticket is not in pending status' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  reject(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() rejectTicketDto: RejectTicketDto,
  ) {
    return this.ticketService.rejectTicket(
      id,
      user.employee_id,
      rejectTicketDto,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a ticket by ID' })
  findOne(@Param('id') id: string) {
    return this.ticketService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a ticket' })
  update(@Param('id') id: string, @Body() updateTicketDto: UpdateTicketDto) {
    return this.ticketService.update(id, updateTicketDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a ticket' })
  remove(@Param('id') id: string) {
    return this.ticketService.remove(id);
  }
}
