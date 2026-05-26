import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TicketParts } from '../entities/ticket-parts.entity';
import { CreateTicketPartsDto } from './dto/create-ticket-parts.dto';
import { UpdateTicketPartsDto } from './dto/update-ticket-parts.dto';

@Injectable()
export class TicketPartsService {
  constructor(
    @InjectRepository(TicketParts)
    private ticketPartsRepository: Repository<TicketParts>,
  ) {}

  async createPart(
    ticket_id: string,
    createTicketPartsDto: CreateTicketPartsDto,
  ): Promise<TicketParts> {
    // Calculate total cost
    const total_cost =
      createTicketPartsDto.quantity * createTicketPartsDto.unit_cost;

    const part = this.ticketPartsRepository.create({
      ticket_id,
      ...createTicketPartsDto,
      total_cost,
      requested_date: new Date(),
      status: 'pending',
    });

    return await this.ticketPartsRepository.save(part);
  }

  async findAllPartsForTicket(ticket_id: string): Promise<TicketParts[]> {
    return await this.ticketPartsRepository.find({
      where: { ticket_id },
      order: { created_at: 'DESC' },
    });
  }

  async findPartById(part_id: string): Promise<TicketParts> {
    const part = await this.ticketPartsRepository.findOne({
      where: { part_id },
    });

    if (!part) {
      throw new NotFoundException(`Part with ID ${part_id} not found`);
    }

    return part;
  }

  async updatePart(
    part_id: string,
    updateTicketPartsDto: UpdateTicketPartsDto,
  ): Promise<TicketParts> {
    const part = await this.findPartById(part_id);

    if (updateTicketPartsDto.status) {
      part.status = updateTicketPartsDto.status;

      // Set received_date when status changes to received
      if (updateTicketPartsDto.status === 'received') {
        part.received_date = new Date();
      }
    }

    if (updateTicketPartsDto.notes) {
      part.notes = updateTicketPartsDto.notes;
    }

    return await this.ticketPartsRepository.save(part);
  }

  async deletePart(part_id: string): Promise<void> {
    const part = await this.findPartById(part_id);
    await this.ticketPartsRepository.remove(part);
  }

  async checkAllPartsReceived(ticket_id: string): Promise<boolean> {
    const parts = await this.findAllPartsForTicket(ticket_id);

    if (parts.length === 0) {
      return true; // No parts, so all "received"
    }

    // All parts must have status 'received'
    return parts.every((part) => part.status === 'received');
  }

  async getPendingParts(ticket_id: string): Promise<TicketParts[]> {
    return await this.ticketPartsRepository.find({
      where: { ticket_id, status: 'pending' },
    });
  }

  async getTotalPartsCost(ticket_id: string): Promise<number> {
    const parts = await this.findAllPartsForTicket(ticket_id);
    return parts.reduce((sum, part) => sum + parseFloat(part.total_cost.toString()), 0);
  }
}
