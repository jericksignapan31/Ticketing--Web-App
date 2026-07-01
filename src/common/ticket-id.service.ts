import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class TicketIdService {
  constructor(private dataSource: DataSource) {}

  async generateTicketId(): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD

    // Get the count of tickets created today
    const result = await this.dataSource.query(
      `SELECT COUNT(*) as count FROM ticket 
       WHERE DATE(created_at) = CURRENT_DATE`,
    );

    const count = parseInt(result[0].count, 10) + 1;
    const sequence = String(count).padStart(4, '0'); // 0001, 0002, etc.

    return `IT-${dateStr}-${sequence}`;
  }
}
