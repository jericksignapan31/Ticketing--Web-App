import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import {
  DashboardStatsDto,
  OperationalDashboardDto,
  TacticalDashboardDto,
  DepartmentTicketMetricDto,
  DepartmentRequisitionMetricDto,
} from './dashboard.dto';

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

  async getOperationalDashboard(
    month?: number,
    year?: number,
  ): Promise<OperationalDashboardDto> {
    const now = new Date();
    const targetMonth = month || now.getMonth() + 1;
    const targetYear = year || now.getFullYear();

    try {
      // Get total tickets for the month
      const totalResult = await this.dataSource.query(`
        SELECT COUNT(*)::INTEGER as count
        FROM "ticket"
        WHERE EXTRACT(MONTH FROM "created_at") = $1
        AND EXTRACT(YEAR FROM "created_at") = $2
      `, [targetMonth, targetYear]);

      const total_tickets = totalResult?.[0]?.count ?? 0;

      // Get open tickets for the month
      const openResult = await this.dataSource.query(`
        SELECT COUNT(*)::INTEGER as count
        FROM "ticket"
        WHERE EXTRACT(MONTH FROM "created_at") = $1
        AND EXTRACT(YEAR FROM "created_at") = $2
        AND "status" != $3
      `, [targetMonth, targetYear, 'closed']);

      const total_open_tickets = openResult?.[0]?.count ?? 0;

      // Get tickets by department with status breakdown
      const departmentResult = await this.dataSource.query(`
        SELECT 
          d.department_id,
          d.department_name,
          COUNT(t.ticket_id)::INTEGER as ticket_count,
          COUNT(CASE WHEN t.status = 'open' THEN 1 END)::INTEGER as open_count,
          COUNT(CASE WHEN t.status = 'in-progress' THEN 1 END)::INTEGER as in_progress_count,
          COUNT(CASE WHEN t.status = 'resolved' THEN 1 END)::INTEGER as resolved_count,
          COUNT(CASE WHEN t.status = 'closed' THEN 1 END)::INTEGER as closed_count
        FROM "department" d
        LEFT JOIN "employee" e ON d.department_id = e.department_id
        LEFT JOIN "ticket" t ON e.employee_id = t.employee_id
          AND EXTRACT(MONTH FROM t."created_at") = $1
          AND EXTRACT(YEAR FROM t."created_at") = $2
        GROUP BY d.department_id, d.department_name
        ORDER BY ticket_count DESC
      `, [targetMonth, targetYear]);

      const department_metrics: DepartmentTicketMetricDto[] = departmentResult.map(
        (row) => ({
          department_id: row.department_id,
          department_name: row.department_name,
          ticket_count: row.ticket_count || 0,
          open_count: row.open_count || 0,
          in_progress_count: row.in_progress_count || 0,
          resolved_count: row.resolved_count || 0,
          closed_count: row.closed_count || 0,
        }),
      );

      return {
        month: targetMonth,
        year: targetYear,
        total_tickets,
        total_open_tickets,
        department_metrics,
      };
    } catch (error) {
      console.error('Error fetching operational dashboard:', error);
      return {
        month: targetMonth,
        year: targetYear,
        total_tickets: 0,
        total_open_tickets: 0,
        department_metrics: [],
      };
    }
  }

  async getTacticalDashboard(
    month?: number,
    year?: number,
  ): Promise<TacticalDashboardDto> {
    const now = new Date();
    const targetMonth = month || now.getMonth() + 1;
    const targetYear = year || now.getFullYear();

    try {
      // Get total requisitions and costing for the month
      const totalResult = await this.dataSource.query(`
        SELECT 
          COUNT(*)::INTEGER as count,
          COALESCE(SUM(COALESCE(
            (SELECT SUM(CAST(ri.total_cost AS NUMERIC))
             FROM "requisition_items" ri
             WHERE ri.requisition_id = pr.requisition_id),
            0
          )), 0)::NUMERIC as total_costing
        FROM "part_requisitions" pr
        WHERE EXTRACT(MONTH FROM "created_at") = $1
        AND EXTRACT(YEAR FROM "created_at") = $2
      `, [targetMonth, targetYear]);

      const total_requisitions = totalResult?.[0]?.count ?? 0;
      const total_costing = parseFloat(totalResult?.[0]?.total_costing ?? 0);

      // Get requisitions by department with costing
      const departmentResult = await this.dataSource.query(`
        SELECT 
          d.department_id,
          d.department_name,
          COUNT(pr.requisition_id)::INTEGER as requisition_count,
          COUNT(CASE WHEN pr.status = 'approved' THEN 1 END)::INTEGER as approved_count,
          COUNT(CASE WHEN pr.status = 'pending' THEN 1 END)::INTEGER as pending_count,
          COALESCE(SUM(COALESCE(
            (SELECT SUM(CAST(ri.total_cost AS NUMERIC))
             FROM "requisition_items" ri
             WHERE ri.requisition_id = pr.requisition_id),
            0
          )), 0)::NUMERIC as total_costing
        FROM "department" d
        LEFT JOIN "employee" e ON d.department_id = e.department_id
        LEFT JOIN "part_requisitions" pr ON e.employee_id = pr.requested_by
          AND EXTRACT(MONTH FROM pr."created_at") = $1
          AND EXTRACT(YEAR FROM pr."created_at") = $2
        GROUP BY d.department_id, d.department_name
        ORDER BY total_costing DESC
      `, [targetMonth, targetYear]);

      const department_metrics: DepartmentRequisitionMetricDto[] = departmentResult.map(
        (row) => ({
          department_id: row.department_id,
          department_name: row.department_name,
          requisition_count: row.requisition_count || 0,
          approved_count: row.approved_count || 0,
          pending_count: row.pending_count || 0,
          total_costing: parseFloat(row.total_costing || 0),
          average_costing:
            (row.requisition_count || 0) > 0
              ? parseFloat(row.total_costing || 0) / (row.requisition_count || 1)
              : 0,
        }),
      );

      return {
        month: targetMonth,
        year: targetYear,
        total_requisitions,
        total_costing,
        department_metrics,
      };
    } catch (error) {
      console.error('Error fetching tactical dashboard:', error);
      return {
        month: targetMonth,
        year: targetYear,
        total_requisitions: 0,
        total_costing: 0,
        department_metrics: [],
      };
    }
  }
}
