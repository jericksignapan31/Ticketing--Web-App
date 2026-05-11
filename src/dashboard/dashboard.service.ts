import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { DashboardStatsDto } from './dashboard.dto';

@Injectable()
export class DashboardService {
  constructor(private dataSource: DataSource) {}

  async getDashboardStats(): Promise<DashboardStatsDto> {
    // Run all queries in parallel for better performance
    const [
      totalTickets,
      openTickets,
      pendingRepairs,
      assetsInUse,
      ticketsByStatus,
      ticketsByPriority,
      assetsByCondition,
    ] = await Promise.all([
      this.getTotalTickets(),
      this.getOpenTickets(),
      this.getPendingRepairs(),
      this.getAssetsInUse(),
      this.getTicketsByStatus(),
      this.getTicketsByPriority(),
      this.getAssetsByCondition(),
    ]);

    return {
      totalTickets,
      openTickets,
      pendingRepairs,
      assetsInUse,
      ticketsByStatus,
      ticketsByPriority,
      assetsByCondition,
      recentTickets: [],
    };
  }

  private async getTotalTickets(): Promise<number> {
    const result = await this.dataSource.query(
      `SELECT COUNT(*) as count FROM "ticket"`,
    );
    return parseInt(result[0].count, 10) || 0;
  }

  private async getOpenTickets(): Promise<number> {
    const result = await this.dataSource.query(
      `SELECT COUNT(*) as count FROM "ticket" WHERE status != $1`,
      ['closed'],
    );
    return parseInt(result[0].count, 10) || 0;
  }

  private async getPendingRepairs(): Promise<number> {
    const result = await this.dataSource.query(
      `SELECT COUNT(*) as count FROM "asset" WHERE status = $1`,
      ['maintenance'],
    );
    return parseInt(result[0].count, 10) || 0;
  }

  private async getAssetsInUse(): Promise<number> {
    const result = await this.dataSource.query(
      `SELECT COUNT(*) as count FROM "asset" WHERE status = $1`,
      ['in-use'],
    );
    return parseInt(result[0].count, 10) || 0;
  }

  private async getTicketsByStatus(): Promise<{
    open: number;
    'in-progress': number;
    resolved: number;
    closed: number;
  }> {
    const result = await this.dataSource.query(`
      SELECT 
        status,
        COUNT(*) as count
      FROM "ticket"
      GROUP BY status
    `);

    const statusMap = {
      open: 0,
      'in-progress': 0,
      resolved: 0,
      closed: 0,
    };

    result.forEach((row) => {
      const status = row.status?.toLowerCase();
      if (status in statusMap) {
        statusMap[status] = parseInt(row.count, 10) || 0;
      }
    });

    return statusMap;
  }

  private async getTicketsByPriority(): Promise<{
    low: number;
    medium: number;
    high: number;
    urgent: number;
  }> {
    const result = await this.dataSource.query(`
      SELECT 
        LOWER(priority) as priority,
        COUNT(*) as count
      FROM "ticket"
      GROUP BY LOWER(priority)
    `);

    const priorityMap = {
      low: 0,
      medium: 0,
      high: 0,
      urgent: 0,
    };

    result.forEach((row) => {
      const priority = row.priority?.toLowerCase();
      if (priority in priorityMap) {
        priorityMap[priority] = parseInt(row.count, 10) || 0;
      }
    });

    return priorityMap;
  }

  private async getAssetsByCondition(): Promise<{
    excellent: number;
    good: number;
    fair: number;
    poor: number;
    broken: number;
  }> {
    const result = await this.dataSource.query(`
      SELECT 
        LOWER(condition) as condition,
        COUNT(*) as count
      FROM "asset"
      GROUP BY LOWER(condition)
    `);

    const conditionMap = {
      excellent: 0,
      good: 0,
      fair: 0,
      poor: 0,
      broken: 0,
    };

    result.forEach((row) => {
      const condition = row.condition?.toLowerCase();
      if (condition in conditionMap) {
        conditionMap[condition] = parseInt(row.count, 10) || 0;
      }
    });

    return conditionMap;
  }
}
