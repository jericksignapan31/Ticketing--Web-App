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
import { TicketService } from './ticket.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

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
