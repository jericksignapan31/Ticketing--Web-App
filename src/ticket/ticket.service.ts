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

@Injectable()
export class TicketService {
  constructor(
    @InjectRepository(Ticket)
    private ticketRepository: Repository<Ticket>,
    @InjectRepository(Employee)
    private employeeRepository: Repository<Employee>,
  ) {}

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

  async findAll(departmentId?: string): Promise<Ticket[]> {
    const query = this.ticketRepository.find({
      relations: [
        'asset',
        'asset.brand',
        'asset.branch',
      ],
      order: { created_at: 'DESC' },
    });

    // Apply department filter if provided
    if (departmentId) {
      return await this.ticketRepository.find({
        where: { department_id: departmentId },
        relations: [
          'asset',
          'asset.brand',
          'asset.branch',
        ],
        order: { created_at: 'DESC' },
      });
    }

    return await query;
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

  async search(query: string, departmentId?: string): Promise<Ticket[]> {
    const where: any[] = [
      { subject: Like(`%${query}%`) },
      { description: Like(`%${query}%`) },
      { category: Like(`%${query}%`) },
    ];

    if (departmentId) {
      where.forEach(condition => {
        condition.department_id = departmentId;
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

  async findByStatus(status: string, departmentId?: string): Promise<Ticket[]> {
    const where: any = { status };
    
    if (departmentId) {
      where.department_id = departmentId;
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

  async findByPriority(priority: string, departmentId?: string): Promise<Ticket[]> {
    const where: any = { priority };
    
    if (departmentId) {
      where.department_id = departmentId;
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

  async findByCategory(category: string, departmentId?: string): Promise<Ticket[]> {
    const where: any = { category };
    
    if (departmentId) {
      where.department_id = departmentId;
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

  async findPendingApprovals(departmentId?: string): Promise<Ticket[]> {
    const where: any = { approval_status: 'pending' };
    
    if (departmentId) {
      where.department_id = departmentId;
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

  async findByApprovalStatus(approval_status: string, departmentId?: string): Promise<Ticket[]> {
    const where: any = { approval_status };
    
    if (departmentId) {
      where.department_id = departmentId;
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

    // Update ticket with resolution details
    ticket.status = 'resolved';
    ticket.resolved_at = new Date();
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
