import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Ticket } from '../entities/ticket.entity';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';

@Injectable()
export class TicketService {
  constructor(
    @InjectRepository(Ticket)
    private ticketRepository: Repository<Ticket>,
  ) {}

  async create(createTicketDto: CreateTicketDto): Promise<Ticket> {
    const ticket = this.ticketRepository.create(createTicketDto);
    return await this.ticketRepository.save(ticket);
  }

  async findAll(): Promise<Ticket[]> {
    return await this.ticketRepository.find({
      relations: ['reporter', 'assignedEmployee'],
      order: { created_at: 'DESC' },
    });
  }

  async findOne(ticket_id: string): Promise<Ticket> {
    const ticket = await this.ticketRepository.findOne({
      where: { ticket_id },
      relations: ['reporter', 'assignedEmployee'],
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
      relations: ['reporter', 'assignedEmployee'],
      order: { created_at: 'DESC' },
    });
  }

  async findByReporter(employee_id: string): Promise<Ticket[]> {
    return await this.ticketRepository.find({
      where: { employee_id },
      relations: ['reporter', 'assignedEmployee'],
      order: { created_at: 'DESC' },
    });
  }

  async findByAssignee(employee_id: string): Promise<Ticket[]> {
    return await this.ticketRepository.find({
      where: { assigned_to: employee_id },
      relations: ['reporter', 'assignedEmployee'],
      order: { created_at: 'DESC' },
    });
  }

  async findByStatus(status: string): Promise<Ticket[]> {
    return await this.ticketRepository.find({
      where: { status },
      relations: ['reporter', 'assignedEmployee'],
      order: { created_at: 'DESC' },
    });
  }

  async findByPriority(priority: string): Promise<Ticket[]> {
    return await this.ticketRepository.find({
      where: { priority },
      relations: ['reporter', 'assignedEmployee'],
      order: { created_at: 'DESC' },
    });
  }

  async findByCategory(category: string): Promise<Ticket[]> {
    return await this.ticketRepository.find({
      where: { category },
      relations: ['reporter', 'assignedEmployee'],
      order: { created_at: 'DESC' },
    });
  }
}
