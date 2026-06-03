export class DashboardStatsDto {
  totalTickets: number;
  openTickets: number;
  pendingRepairs: number;
  assetsInUse: number;
  ticketsByStatus: {
    open: number;
    'in-progress': number;
    resolved: number;
    closed: number;
  };
  ticketsByPriority: {
    low: number;
    medium: number;
    high: number;
    urgent: number;
  };
  assetsByCondition: {
    excellent: number;
    good: number;
    fair: number;
    poor: number;
    broken: number;
  };
  recentTickets: any[];
}

export class DepartmentTicketMetricDto {
  department_id: string;
  department_name: string;
  ticket_count: number;
  open_count: number;
  in_progress_count: number;
  resolved_count: number;
  closed_count: number;
}

export class OperationalDashboardDto {
  month: number;
  year: number;
  total_tickets: number;
  total_open_tickets: number;
  department_metrics: DepartmentTicketMetricDto[];
}

export class DepartmentRequisitionMetricDto {
  department_id: string;
  department_name: string;
  requisition_count: number;
  approved_count: number;
  pending_count: number;
  total_costing: number;
  average_costing: number;
}

export class TacticalDashboardDto {
  month: number;
  year: number;
  total_requisitions: number;
  total_costing: number;
  department_metrics: DepartmentRequisitionMetricDto[];
}
