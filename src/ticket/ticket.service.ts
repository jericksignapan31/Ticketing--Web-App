import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Ticket } from '../entities/ticket.entity';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { ApproveTicketDto } from './dto/approve-ticket.dto';
import { RejectTicketDto } from './dto/reject-ticket.dto';

@Injectable()
export class TicketService {
  constructor(
    @InjectRepository(Ticket)
    private ticketRepository: Repository<Ticket>,
  ) {}

  async create(createTicketDto: CreateTicketDto): Promise<Ticket> {
    const ticket = this.ticketRepository.create(createTicketDto);
    const savedTicket = await this.ticketRepository.save(ticket);

    // Return ticket with all relations loaded
    return await this.findOne(savedTicket.ticket_id);
  }

  async findAll(): Promise<Ticket[]> {
    return await this.ticketRepository.find({
      relations: [
        'reporter',
        'assignedEmployee',
        'approver',
        'asset',
        'asset.brand',
        'asset.branch',
      ],
      order: { created_at: 'DESC' },
    });
  }

  async findOne(ticket_id: string): Promise<Ticket> {
    const ticket = await this.ticketRepository.findOne({
      where: { ticket_id },
      relations: [
        'reporter',
        'assignedEmployee',
        'approver',
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

  async search(query: string): Promise<Ticket[]> {
    return await this.ticketRepository.find({
      where: [
        { subject: Like(`%${query}%`) },
        { description: Like(`%${query}%`) },
        { category: Like(`%${query}%`) },
      ],
      relations: [
        'reporter',
        'assignedEmployee',
        'approver',
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
        'reporter',
        'assignedEmployee',
        'approver',
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
        'reporter',
        'assignedEmployee',
        'approver',
        'asset',
        'asset.brand',
        'asset.branch',
      ],
      order: { created_at: 'DESC' },
    });
  }

  async findByStatus(status: string): Promise<Ticket[]> {
    return await this.ticketRepository.find({
      where: { status },
      relations: [
        'reporter',
        'assignedEmployee',
        'approver',
        'asset',
        'asset.brand',
        'asset.branch',
      ],
      order: { created_at: 'DESC' },
    });
  }

  async findByPriority(priority: string): Promise<Ticket[]> {
    return await this.ticketRepository.find({
      where: { priority },
      relations: [
        'reporter',
        'assignedEmployee',
        'approver',
        'asset',
        'asset.brand',
        'asset.branch',
      ],
      order: { created_at: 'DESC' },
    });
  }

  async findByCategory(category: string): Promise<Ticket[]> {
    return await this.ticketRepository.find({
      where: { category },
      relations: [
        'reporter',
        'assignedEmployee',
        'approver',
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

  async findPendingApprovals(): Promise<Ticket[]> {
    return await this.ticketRepository.find({
      where: { approval_status: 'pending' },
      relations: [
        'reporter',
        'assignedEmployee',
        'approver',
        'asset',
        'asset.brand',
        'asset.branch',
      ],
      order: { created_at: 'DESC' },
    });
  }

  async findByApprovalStatus(approval_status: string): Promise<Ticket[]> {
    return await this.ticketRepository.find({
      where: { approval_status },
      relations: [
        'reporter',
        'assignedEmployee',
        'approver',
        'asset',
        'asset.brand',
        'asset.branch',
      ],
      order: { created_at: 'DESC' },
    });
  }
}
