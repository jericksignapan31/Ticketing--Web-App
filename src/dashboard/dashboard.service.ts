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
    try {
      const result = await this.dataSource.query(
        `SELECT COUNT(*)::INTEGER as count FROM "ticket"`,
      );
      return result?.[0]?.count ?? 0;
    } catch (error) {
      console.error('Error fetching total tickets:', error);
      return 0;
    }
  }

  private async getOpenTickets(): Promise<number> {
    try {
      const result = await this.dataSource.query(
        `SELECT COUNT(*)::INTEGER as count FROM "ticket" WHERE "status" != $1`,
        ['closed'],
      );
      return result?.[0]?.count ?? 0;
    } catch (error) {
      console.error('Error fetching open tickets:', error);
      return 0;
    }
  }

  private async getPendingRepairs(): Promise<number> {
    try {
      const result = await this.dataSource.query(
        `SELECT COUNT(*)::INTEGER as count FROM "asset" WHERE "status" = $1`,
        ['maintenance'],
      );
      return result?.[0]?.count ?? 0;
    } catch (error) {
      console.error('Error fetching pending repairs:', error);
      return 0;
    }
  }

  private async getAssetsInUse(): Promise<number> {
    try {
      const result = await this.dataSource.query(
        `SELECT COUNT(*)::INTEGER as count FROM "asset" WHERE "status" = $1`,
        ['in-use'],
      );
      return result?.[0]?.count ?? 0;
    } catch (error) {
      console.error('Error fetching assets in use:', error);
      return 0;
    }
  }

  private async getTicketsByStatus(): Promise<{
    open: number;
    'in-progress': number;
    resolved: number;
    closed: number;
  }> {
    try {
      const result = await this.dataSource.query(`
        SELECT 
          status,
          COUNT(*)::INTEGER as count
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
          statusMap[status] = row.count || 0;
        }
      });

      return statusMap;
    } catch (error) {
      console.error('Error fetching tickets by status:', error);
      return {
        open: 0,
        'in-progress': 0,
        resolved: 0,
        closed: 0,
      };
    }
  }

  private async getTicketsByPriority(): Promise<{
    low: number;
    medium: number;
    high: number;
    urgent: number;
  }> {
    try {
      const result = await this.dataSource.query(`
        SELECT 
          LOWER(priority) as priority,
          COUNT(*)::INTEGER as count
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
          priorityMap[priority] = row.count || 0;
        }
      });

      return priorityMap;
    } catch (error) {
      console.error('Error fetching tickets by priority:', error);
      return {
        low: 0,
        medium: 0,
        high: 0,
        urgent: 0,
      };
    }
  }

  private async getAssetsByCondition(): Promise<{
    excellent: number;
    good: number;
    fair: number;
    poor: number;
    broken: number;
  }> {
    try {
      const result = await this.dataSource.query(`
        SELECT 
          LOWER(condition) as condition,
          COUNT(*)::INTEGER as count
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
          conditionMap[condition] = row.count || 0;
        }
      });

      return conditionMap;
    } catch (error) {
      console.error('Error fetching assets by condition:', error);
      return {
        excellent: 0,
        good: 0,
        fair: 0,
        poor: 0,
        broken: 0,
      };
    }
  }
}
