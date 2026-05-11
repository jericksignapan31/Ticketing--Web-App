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
