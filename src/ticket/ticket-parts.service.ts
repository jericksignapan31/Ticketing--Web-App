import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { TicketParts } from '../entities/ticket-parts.entity';
import { Ticket } from '../entities/ticket.entity';
import { CreateTicketPartsDto } from './dto/create-ticket-parts.dto';
import { UpdateTicketPartsDto } from './dto/update-ticket-parts.dto';

@Injectable()
export class TicketPartsService {
  constructor(
    @InjectRepository(TicketParts)
    private ticketPartsRepository: Repository<TicketParts>,
    @InjectRepository(Ticket)
    private ticketRepository: Repository<Ticket>,
  ) {}

  async createPart(
    ticket_id: string,
    createTicketPartsDto: CreateTicketPartsDto,
  ): Promise<TicketParts> {
    // Validate ticket exists
    const ticket = await this.ticketRepository.findOne({
      where: { ticket_id },
    });

    if (!ticket) {
      throw new NotFoundException(
        `Ticket with ID '${ticket_id}' not found. Cannot create parts for non-existent ticket.`,
      );
    }

    // Validate input
    if (!createTicketPartsDto.part_name || createTicketPartsDto.part_name.trim() === '') {
      throw new BadRequestException('part_name is required and cannot be empty');
    }

    if (!createTicketPartsDto.quantity || createTicketPartsDto.quantity <= 0) {
      throw new BadRequestException('quantity must be a positive number');
    }

    if (!createTicketPartsDto.unit_cost || createTicketPartsDto.unit_cost <= 0) {
      throw new BadRequestException('unit_cost must be a positive number');
    }

    if (!createTicketPartsDto.supplier || createTicketPartsDto.supplier.trim() === '') {
      throw new BadRequestException('supplier is required and cannot be empty');
    }

    // Calculate total cost
    const total_cost =
      createTicketPartsDto.quantity * createTicketPartsDto.unit_cost;

    try {
      // Explicitly generate UUID for part_id
      const part_id = uuidv4();

      const part = this.ticketPartsRepository.create({
        part_id,
        ticket_id,
        part_name: createTicketPartsDto.part_name.trim(),
        quantity: createTicketPartsDto.quantity,
        unit_cost: createTicketPartsDto.unit_cost,
        supplier: createTicketPartsDto.supplier.trim(),
        total_cost,
        requested_date: new Date(),
        status: 'pending',
        notes: createTicketPartsDto.notes?.trim(),
      });

      const savedPart = await this.ticketPartsRepository.save(part);
      
      console.log('✅ Part created successfully:', {
        part_id: savedPart.part_id,
        ticket_id,
        part_name: savedPart.part_name,
      });

      return savedPart;
    } catch (error) {
      console.error('❌ Error creating part:', error);
      throw new BadRequestException(
        `Failed to create part: ${error.message}`,
      );
    }
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

  async getAllParts(): Promise<TicketParts[]> {
    return await this.ticketPartsRepository.find({
      relations: ['ticket'],
      order: { requested_date: 'DESC' },
    });
  }

  async getPartsByStatus(status: string): Promise<TicketParts[]> {
    return await this.ticketPartsRepository.find({
      where: { status },
      relations: ['ticket'],
      order: { requested_date: 'DESC' },
    });
  }

  async getPartsBySupplier(supplier: string): Promise<TicketParts[]> {
    return await this.ticketPartsRepository.find({
      where: { supplier },
      relations: ['ticket'],
      order: { requested_date: 'DESC' },
    });
  }
}
