import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TicketSequence } from '../entities/ticket-sequence.entity';

@Injectable()
export class TicketIdService {
  constructor(private dataSource: DataSource) {}

  async generateTicketId(): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD

    const sequenceRepository = this.dataSource.getRepository(TicketSequence);

    // Upsert the sequence for today's date
    let sequence = await sequenceRepository.findOne({
      where: { date: dateStr },
    });

    if (!sequence) {
      // Create new sequence for today
      sequence = sequenceRepository.create({ date: dateStr, sequence: 0 });
    }

    // Increment sequence
    sequence.sequence += 1;
    await sequenceRepository.save(sequence);

    const sequenceStr = String(sequence.sequence).padStart(4, '0');
    return `IT-${dateStr}-${sequenceStr}`;
  }
}
