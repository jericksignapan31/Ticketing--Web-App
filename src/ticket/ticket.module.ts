import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TicketService } from './ticket.service';
import { TicketPartsService } from './ticket-parts.service';
import { TicketController } from './ticket.controller';
import { Ticket } from '../entities/ticket.entity';
import { Employee } from '../entities/employee.entity';
import { TicketParts } from '../entities/ticket-parts.entity';
import { TicketIdService } from '../common/ticket-id.service';

@Module({
  imports: [TypeOrmModule.forFeature([Ticket, Employee, TicketParts])],
  controllers: [TicketController],
  providers: [TicketService, TicketPartsService, TicketIdService],
  exports: [TicketService, TicketPartsService],
})
export class TicketModule {}
