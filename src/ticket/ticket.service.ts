import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Ticket } from '../entities/ticket.entity';
import { Employee } from '../entities/employee.entity';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { ApproveTicketDto } from './dto/approve-ticket.dto';
import { RejectTicketDto } from './dto/reject-ticket.dto';
import { StartWorkDto } from './dto/start-work.dto';
import { CompleteTicketDto } from './dto/complete-ticket.dto';
import { TicketPartsService } from './ticket-parts.service';
import { UserRole } from '../common/enums/user-role.enum';

@Injectable()
export class TicketService {
  constructor(
    @InjectRepository(Ticket)
    private ticketRepository: Repository<Ticket>,
    @InjectRepository(Employee)
    private employeeRepository: Repository<Employee>,
    private ticketPartsService: TicketPartsService,
  ) {}

  /**
   * Helper method to determine department filter based on user role
   * - Admin/IT: No filter (see all)
   * - Employee/Supervisor: Filter by their department
   */
  private getDepartmentFilter(user: any): string | undefined {
    if (user.role === UserRole.ADMIN || user.role === UserRole.IT) {
      return undefined; // No filter - see all tickets
    }
    // Employee and Supervisor only see their department tickets
    return user.departmentId;
  }

  async create(createTicketDto: CreateTicketDto): Promise<Ticket> {
    // Get the employee's department
    const employee = await this.employeeRepository.findOne({
      where: { employee_id: createTicketDto.employee_id },
    });

    const ticket = this.ticketRepository.create(createTicketDto);
    
    // Auto-populate department_id from employee's department
    if (employee && employee.department_id) {
      ticket.department_id = employee.department_id;
    }

    const savedTicket = await this.ticketRepository.save(ticket);

    // Return ticket with all relations loaded
    return await this.findOne(savedTicket.ticket_id);
  }

  async findAll(user: any, departmentId?: string): Promise<Ticket[]> {
    // Apply department filter based on user role
    const departmentFilter = this.getDepartmentFilter(user);
    const finalDepartmentId = departmentId || departmentFilter;

    const query: any = {
      relations: [
        'asset',
        'asset.brand',
        'asset.branch',
      ],
      order: { created_at: 'DESC' },
    };

    if (finalDepartmentId) {
      query.where = { department_id: finalDepartmentId };
    }

    return await this.ticketRepository.find(query);
  }

  async findOne(ticket_id: string): Promise<Ticket> {
    const ticket = await this.ticketRepository.findOne({
      where: { ticket_id },
      relations: [
        'asset',
        'asset.brand',
        'asset.branch',
      ],
    });

    if (!ticket) {
      throw new NotFoundException(`Ticket with ID '${ticket_id}' not found`);
    }

    return ticket;
  }

  async update(
    ticket_id: string,
    updateTicketDto: UpdateTicketDto,
  ): Promise<Ticket> {
    const ticket = await this.findOne(ticket_id);

    Object.assign(ticket, updateTicketDto);
    return await this.ticketRepository.save(ticket);
  }

  async remove(ticket_id: string): Promise<void> {
    const ticket = await this.findOne(ticket_id);
    await this.ticketRepository.remove(ticket);
  }

  async search(user: any, query: string, departmentId?: string): Promise<Ticket[]> {
    const departmentFilter = this.getDepartmentFilter(user);
    const finalDepartmentId = departmentId || departmentFilter;

    const where: any[] = [
      { subject: Like(`%${query}%`) },
      { description: Like(`%${query}%`) },
      { category: Like(`%${query}%`) },
    ];

    if (finalDepartmentId) {
      where.forEach(condition => {
        condition.department_id = finalDepartmentId;
      });
    }

    return await this.ticketRepository.find({
      where,
      relations: [
        'asset',
        'asset.brand',
        'asset.branch',
      ],
      order: { created_at: 'DESC' },
    });
  }

  async findByReporter(employee_id: string): Promise<Ticket[]> {
    return await this.ticketRepository.find({
      where: { employee_id },
      relations: [
        'asset',
        'asset.brand',
        'asset.branch',
      ],
      order: { created_at: 'DESC' },
    });
  }

  async findByAssignee(employee_id: string): Promise<Ticket[]> {
    return await this.ticketRepository.find({
      where: { assigned_to: employee_id },
      relations: [
        'asset',
        'asset.brand',
        'asset.branch',
      ],
      order: { created_at: 'DESC' },
    });
  }

  async findByStatus(user: any, status: string, departmentId?: string): Promise<Ticket[]> {
    const departmentFilter = this.getDepartmentFilter(user);
    const finalDepartmentId = departmentId || departmentFilter;

    const where: any = { status };
    
    if (finalDepartmentId) {
      where.department_id = finalDepartmentId;
    }

    return await this.ticketRepository.find({
      where,
      relations: [
        'asset',
        'asset.brand',
        'asset.branch',
      ],
      order: { created_at: 'DESC' },
    });
  }

  async findByPriority(user: any, priority: string, departmentId?: string): Promise<Ticket[]> {
    const departmentFilter = this.getDepartmentFilter(user);
    const finalDepartmentId = departmentId || departmentFilter;

    const where: any = { priority };
    
    if (finalDepartmentId) {
      where.department_id = finalDepartmentId;
    }

    return await this.ticketRepository.find({
      where,
      relations: [
        'asset',
        'asset.brand',
        'asset.branch',
      ],
      order: { created_at: 'DESC' },
    });
  }

  async findByCategory(user: any, category: string, departmentId?: string): Promise<Ticket[]> {
    const departmentFilter = this.getDepartmentFilter(user);
    const finalDepartmentId = departmentId || departmentFilter;

    const where: any = { category };
    
    if (finalDepartmentId) {
      where.department_id = finalDepartmentId;
    }

    return await this.ticketRepository.find({
      where,
      relations: [
        'asset',
        'asset.brand',
        'asset.branch',
      ],
      order: { created_at: 'DESC' },
    });
  }

  // Specific status endpoints for frontend
  async findPending(user: any): Promise<Ticket[]> {
    const departmentFilter = this.getDepartmentFilter(user);
    const where: any = { status: 'pending_approval' };
    
    if (departmentFilter) {
      where.department_id = departmentFilter;
    }

    return await this.ticketRepository.find({
      where,
      relations: [
        'asset',
        'asset.brand',
        'asset.branch',
      ],
      order: { created_at: 'DESC' },
    });
  }

  async findInProgress(user: any): Promise<Ticket[]> {
    const departmentFilter = this.getDepartmentFilter(user);
    const where: any = { status: 'in_progress' };
    
    if (departmentFilter) {
      where.department_id = departmentFilter;
    }

    return await this.ticketRepository.find({
      where,
      relations: [
        'asset',
        'asset.brand',
        'asset.branch',
      ],
      order: { created_at: 'DESC' },
    });
  }

  async findCompleted(user: any): Promise<Ticket[]> {
    const departmentFilter = this.getDepartmentFilter(user);
    const where: any = { status: 'resolved' };
    
    if (departmentFilter) {
      where.department_id = departmentFilter;
    }

    return await this.ticketRepository.find({
      where,
      relations: [
        'asset',
        'asset.brand',
        'asset.branch',
      ],
      order: { created_at: 'DESC' },
    });
  }

  async findApproved(user: any): Promise<Ticket[]> {
    const departmentFilter = this.getDepartmentFilter(user);
    const where: any = { status: 'approved' };
    
    if (departmentFilter) {
      where.department_id = departmentFilter;
    }

    return await this.ticketRepository.find({
      where,
      relations: [
        'asset',
        'asset.brand',
        'asset.branch',
      ],
      order: { created_at: 'DESC' },
    });
  }

  async findAssigned(user: any): Promise<Ticket[]> {
    const departmentFilter = this.getDepartmentFilter(user);
    const where: any = { status: 'assigned' };
    
    if (departmentFilter) {
      where.department_id = departmentFilter;
    }

    return await this.ticketRepository.find({
      where,
      relations: [
        'asset',
        'asset.brand',
        'asset.branch',
      ],
      order: { created_at: 'DESC' },
    });
  }

  async findRejected(user: any): Promise<Ticket[]> {
    const departmentFilter = this.getDepartmentFilter(user);
    const where: any = { status: 'rejected' };
    
    if (departmentFilter) {
      where.department_id = departmentFilter;
    }

    return await this.ticketRepository.find({
      where,
      relations: [
        'asset',
        'asset.brand',
        'asset.branch',
      ],
      order: { created_at: 'DESC' },
    });
  }

  async findWaitingForParts(user: any): Promise<Ticket[]> {
    const departmentFilter = this.getDepartmentFilter(user);
    const where: any = { status: 'waiting_for_parts' };
    
    if (departmentFilter) {
      where.department_id = departmentFilter;
    }

    return await this.ticketRepository.find({
      where,
      relations: [
        'asset',
        'asset.brand',
        'asset.branch',
        'parts',
      ],
      order: { created_at: 'DESC' },
    });
  }

  async approveTicket(
    ticket_id: string,
    supervisor_id: string,
    approveTicketDto: ApproveTicketDto,
  ): Promise<Ticket> {
    const ticket = await this.findOne(ticket_id);

    // Check if ticket is pending approval
    if (ticket.approval_status !== 'pending') {
      throw new BadRequestException(
        `Ticket is already ${ticket.approval_status}. Cannot approve.`,
      );
    }

    // Update approval status
    ticket.approval_status = 'approved';
    ticket.approved_by = supervisor_id;
    ticket.approved_at = new Date();
    ticket.status = 'approved';

    // Assign to IT if provided
    if (approveTicketDto.assigned_to) {
      ticket.assigned_to = approveTicketDto.assigned_to;
      ticket.status = 'assigned';
    }

    return await this.ticketRepository.save(ticket);
  }

  async rejectTicket(
    ticket_id: string,
    supervisor_id: string,
    rejectTicketDto: RejectTicketDto,
  ): Promise<Ticket> {
    const ticket = await this.findOne(ticket_id);

    // Check if ticket is pending approval
    if (ticket.approval_status !== 'pending') {
      throw new BadRequestException(
        `Ticket is already ${ticket.approval_status}. Cannot reject.`,
      );
    }

    // Update rejection status
    ticket.approval_status = 'rejected';
    ticket.approved_by = supervisor_id;
    ticket.approved_at = new Date();
    ticket.status = 'rejected';
    ticket.rejection_reason = rejectTicketDto.rejection_reason;

    return await this.ticketRepository.save(ticket);
  }

  async findPendingApprovals(user: any, departmentId?: string): Promise<Ticket[]> {
    const departmentFilter = this.getDepartmentFilter(user);
    const finalDepartmentId = departmentId || departmentFilter;

    const where: any = { approval_status: 'pending' };
    
    if (finalDepartmentId) {
      where.department_id = finalDepartmentId;
    }

    return await this.ticketRepository.find({
      where,
      relations: [
        'asset',
        'asset.brand',
        'asset.branch',
      ],
      order: { created_at: 'DESC' },
    });
  }

  async findByApprovalStatus(user: any, approval_status: string, departmentId?: string): Promise<Ticket[]> {
    const departmentFilter = this.getDepartmentFilter(user);
    const finalDepartmentId = departmentId || departmentFilter;

    const where: any = { approval_status };
    
    if (finalDepartmentId) {
      where.department_id = finalDepartmentId;
    }

    return await this.ticketRepository.find({
      where,
      relations: [
        'asset',
        'asset.brand',
        'asset.branch',
      ],
      order: { created_at: 'DESC' },
    });
  }

  async startWork(
    ticket_id: string,
    it_staff_id: string,
    startWorkDto: StartWorkDto,
  ): Promise<Ticket> {
    const ticket = await this.findOne(ticket_id);

    // Validate ticket is assigned or approved
    if (ticket.status !== 'assigned' && ticket.status !== 'approved') {
      throw new BadRequestException(
        `Cannot start work on ticket with status '${ticket.status}'. Ticket must be assigned or approved.`,
      );
    }

    // Validate IT staff is assigned to this ticket
    if (ticket.assigned_to && ticket.assigned_to !== it_staff_id) {
      throw new BadRequestException(
        `You are not assigned to this ticket. Assigned to: ${ticket.assigned_to}`,
      );
    }

    // Update status to in_progress
    ticket.status = 'in_progress';
    ticket.started_at = new Date();

    if (startWorkDto.notes) {
      ticket.resolution_notes = startWorkDto.notes;
    }

    return await this.ticketRepository.save(ticket);
  }

  async completeTicket(
    ticket_id: string,
    it_staff_id: string,
    completeTicketDto: CompleteTicketDto,
  ): Promise<Ticket> {
    const ticket = await this.findOne(ticket_id);

    // Validate ticket is in progress
    if (ticket.status !== 'in_progress') {
      throw new BadRequestException(
        `Cannot complete ticket with status '${ticket.status}'. Ticket must be in progress.`,
      );
    }

    // Validate IT staff is assigned to this ticket
    if (ticket.assigned_to && ticket.assigned_to !== it_staff_id) {
      throw new BadRequestException(
        `You are not assigned to this ticket. Assigned to: ${ticket.assigned_to}`,
      );
    }

    // Check if parts need to be purchased
    const needsBuyParts = completeTicketDto.unit_status === 'need_buy_parts';

    if (needsBuyParts) {
      // If parts need to be bought, set status to waiting_for_parts
      ticket.status = 'waiting_for_parts';
    } else {
      // Otherwise, validate all parts are received (if any parts were requested)
      const allPartsReceived = await this.ticketPartsService.checkAllPartsReceived(
        ticket_id,
      );
      if (!allPartsReceived) {
        const pendingParts = await this.ticketPartsService.getPendingParts(
          ticket_id,
        );
        throw new BadRequestException(
          `Cannot complete ticket. ${pendingParts.length} part(s) still pending or not received. ` +
          'Please confirm all parts are received first using /tickets/:id/parts/:part_id endpoint.',
        );
      }

      // Set status to resolved
      ticket.status = 'resolved';
      ticket.resolved_at = new Date();
    }

    // Update ticket with resolution details
    ticket.unit_status = completeTicketDto.unit_status;
    ticket.observation = completeTicketDto.observation;
    ticket.action_taken = completeTicketDto.action_taken;

    if (completeTicketDto.recommendation) {
      ticket.recommendation = completeTicketDto.recommendation;
    }

    if (completeTicketDto.resolution_notes) {
      ticket.resolution_notes = completeTicketDto.resolution_notes;
    }

    return await this.ticketRepository.save(ticket);
  }
}
