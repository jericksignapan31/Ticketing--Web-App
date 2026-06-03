# Dashboard Metrics Guide

**Updated:** June 3, 2026  
**Status:** Production Ready  
**Endpoints:** 2 new + 1 existing

---

## Overview

Dashboard system provides two types of analytics dashboards for Admin, IT, and Warehouse roles:

- **Operational Dashboard**: Tracks tickets by department with month/year filtering
- **Tactical Dashboard**: Tracks requisitions by department with costing metrics and month/year filtering

Both dashboards support filtering by **month** and **year** for comprehensive analytics and reporting.

---

## API Endpoints

### 1. Operational Dashboard
Displays ticket metrics grouped by department with status breakdown.

**Endpoint:**
```
GET /dashboard/operational?month={month}&year={year}
```

**Authorization:** Bearer Token (Required)  
**Roles:** ADMIN, IT, WAREHOUSE

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `month` | number | No | Current month | Month (1-12) |
| `year` | number | No | Current year | Year (YYYY) |

**Request Example:**
```bash
curl -X GET http://localhost:3000/dashboard/operational?month=6&year=2026 \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json"
```

**Response:** `200 OK`
```json
{
  "month": 6,
  "year": 2026,
  "total_tickets": 45,
  "total_open_tickets": 12,
  "department_metrics": [
    {
      "department_id": "a119c815-1b67-477f-a7c1-62df4b7e04f5",
      "department_name": "IT Support",
      "ticket_count": 18,
      "open_count": 5,
      "in_progress_count": 8,
      "resolved_count": 4,
      "closed_count": 1
    },
    {
      "department_id": "f3bfec2e-a8f7-4273-83a8-99262888e50b",
      "department_name": "Warehouse",
      "ticket_count": 15,
      "open_count": 4,
      "in_progress_count": 6,
      "resolved_count": 5,
      "closed_count": 0
    }
  ]
}
```

**Response Schema:**
```typescript
interface OperationalDashboardDto {
  month: number;                           // Month (1-12)
  year: number;                            // Year
  total_tickets: number;                   // Total tickets for month/year
  total_open_tickets: number;              // Open tickets (status != 'closed')
  department_metrics: [
    {
      department_id: string;               // UUID
      department_name: string;             // Department name
      ticket_count: number;                // Total tickets from this dept
      open_count: number;                  // Status: open
      in_progress_count: number;           // Status: in-progress
      resolved_count: number;              // Status: resolved
      closed_count: number;                // Status: closed
    }
  ];
}
```

---

### 2. Tactical Dashboard
Displays requisition metrics with costing breakdown grouped by department.

**Endpoint:**
```
GET /dashboard/tactical?month={month}&year={year}
```

**Authorization:** Bearer Token (Required)  
**Roles:** ADMIN, WAREHOUSE

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `month` | number | No | Current month | Month (1-12) |
| `year` | number | No | Current year | Year (YYYY) |

**Request Example:**
```bash
curl -X GET http://localhost:3000/dashboard/tactical?month=6&year=2026 \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json"
```

**Response:** `200 OK`
```json
{
  "month": 6,
  "year": 2026,
  "total_requisitions": 23,
  "total_costing": 125000.50,
  "department_metrics": [
    {
      "department_id": "f3bfec2e-a8f7-4273-83a8-99262888e50b",
      "department_name": "Warehouse",
      "requisition_count": 10,
      "approved_count": 7,
      "pending_count": 3,
      "total_costing": 75000.25,
      "average_costing": 7500.025
    },
    {
      "department_id": "a119c815-1b67-477f-a7c1-62df4b7e04f5",
      "department_name": "IT Support",
      "requisition_count": 8,
      "approved_count": 6,
      "pending_count": 2,
      "total_costing": 45000.00,
      "average_costing": 5625.00
    }
  ]
}
```

**Response Schema:**
```typescript
interface TacticalDashboardDto {
  month: number;                           // Month (1-12)
  year: number;                            // Year
  total_requisitions: number;              // Total requisitions for month/year
  total_costing: number;                   // Sum of all requisition items' total_cost
  department_metrics: [
    {
      department_id: string;               // UUID
      department_name: string;             // Department name
      requisition_count: number;           // Total requisitions from this dept
      approved_count: number;              // Status: approved
      pending_count: number;               // Status: pending
      total_costing: number;               // Sum of costing for this dept
      average_costing: number;             // total_costing / requisition_count
    }
  ];
}
```

---

### 3. Existing Dashboard Stats (Reference)
Original dashboard endpoint for overall system health metrics.

**Endpoint:**
```
GET /dashboard/stats
```

**Response includes:** Total tickets, open tickets, pending repairs, assets in use, breakdown by status/priority/condition.

---

## Frontend Implementation Checklist

### Operational Dashboard Component

- [ ] Create `DashboardOperationalComponent`
- [ ] Implement month/year selector with month picker
- [ ] Display **Total Tickets** and **Total Open Tickets** as key metrics
- [ ] Create department comparison table with columns:
  - [ ] Department Name
  - [ ] Ticket Count
  - [ ] Open Count
  - [ ] In Progress Count
  - [ ] Resolved Count
  - [ ] Closed Count
- [ ] Add bar chart showing tickets by department
- [ ] Add pie chart showing status distribution (open/in-progress/resolved/closed)
- [ ] Implement error handling for 401 (unauthorized) and 500 responses
- [ ] Add loading spinner while fetching data
- [ ] Implement "Export to CSV" functionality (optional)

### Tactical Dashboard Component

- [ ] Create `DashboardTacticalComponent`
- [ ] Implement month/year selector matching operational dashboard
- [ ] Display **Total Requisitions** and **Total Costing (PHP)** as key metrics
- [ ] Create department comparison table with columns:
  - [ ] Department Name
  - [ ] Requisition Count
  - [ ] Approved Count
  - [ ] Pending Count
  - [ ] Total Costing (currency formatted)
  - [ ] Average Costing (currency formatted)
- [ ] Add bar chart comparing departments by total costing
- [ ] Add pie chart showing approval status (approved/pending)
- [ ] Add trend chart (optional): Show monthly costing trend
- [ ] Implement currency formatting (Philippine Peso - PHP)
- [ ] Implement error handling for 401 and 500 responses
- [ ] Add loading spinner while fetching data

### Dashboard Tab/Navigation

- [ ] Update main dashboard page with tabs:
  - [ ] **Overview** (existing stats)
  - [ ] **Operational** (new - tickets by department)
  - [ ] **Tactical** (new - requisitions/costing by department)
- [ ] Ensure month/year filters persist across tab switches
- [ ] Add responsive layout for mobile devices

### Common Features

- [ ] Share month/year selector component between both dashboards
- [ ] Implement caching to avoid redundant API calls within same hour
- [ ] Add "Last updated: {timestamp}" footer
- [ ] Implement real-time refresh button
- [ ] Add keyboard shortcuts (if applicable to your UI)
- [ ] Ensure accessibility (WCAG 2.1 AA compliance)

---

## Real-World Usage Examples

### Example 1: Executive Summary - Current Month
Display current month's metrics for executive review.

**Frontend Code:**
```typescript
// Get current month/year
const now = new Date();
const month = now.getMonth() + 1;
const year = now.getFullYear();

// Fetch both dashboards
const [operationalData, tacticalData] = await Promise.all([
  this.dashboardService.getOperationalDashboard(month, year),
  this.dashboardService.getTacticalDashboard(month, year),
]);

// Display top 3 departments by tickets and costing
const topTicketDepts = operationalData.department_metrics
  .sort((a, b) => b.ticket_count - a.ticket_count)
  .slice(0, 3);

const topCostingDepts = tacticalData.department_metrics
  .sort((a, b) => b.total_costing - a.total_costing)
  .slice(0, 3);
```

### Example 2: Historical Trend Analysis
Compare metrics across multiple months to identify trends.

**Frontend Code:**
```typescript
// Get last 6 months of tactical data
const trends = [];
for (let i = 5; i >= 0; i--) {
  const date = new Date();
  date.setMonth(date.getMonth() - i);
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  
  const data = await this.dashboardService.getTacticalDashboard(month, year);
  trends.push({
    period: `${month}/${year}`,
    total_costing: data.total_costing,
    requisition_count: data.total_requisitions
  });
}

// Plot trend chart
this.plotTrendChart(trends);
```

### Example 3: Department Performance Report
Generate detailed report for specific department.

**Frontend Code:**
```typescript
// Get both dashboards for specific period
const operationalData = await this.dashboardService
  .getOperationalDashboard(6, 2026);
const tacticalData = await this.dashboardService
  .getTacticalDashboard(6, 2026);

// Find department metrics
const deptId = 'a119c815-1b67-477f-a7c1-62df4b7e04f5';
const opMetrics = operationalData.department_metrics
  .find(m => m.department_id === deptId);
const tacMetrics = tacticalData.department_metrics
  .find(m => m.department_id === deptId);

// Generate report
const report = {
  department: opMetrics.department_name,
  tickets_created: opMetrics.ticket_count,
  tickets_open: opMetrics.open_count,
  tickets_resolved: opMetrics.resolved_count,
  resolution_rate: (opMetrics.resolved_count / opMetrics.ticket_count * 100).toFixed(2) + '%',
  requisitions_created: tacMetrics.requisition_count,
  approved_rate: (tacMetrics.approved_count / tacMetrics.requisition_count * 100).toFixed(2) + '%',
  total_budget_spent: tacMetrics.total_costing,
  average_request_cost: tacMetrics.average_costing,
};
```

---

## Error Handling

### Unauthorized (401)
```json
{
  "message": "Unauthorized",
  "statusCode": 401
}
```

**Frontend Action:**
- Redirect to login page
- Show toast notification: "Your session has expired. Please log in again."

### Server Error (500)
```json
{
  "message": "Internal server error",
  "statusCode": 500
}
```

**Frontend Action:**
- Show error toast: "Failed to load dashboard data. Please try again later."
- Log error to monitoring service
- Provide "Retry" button

### Invalid Filters
If `month` or `year` parameters are invalid:
- Backend returns current month/year data as default
- Frontend should validate: `month` (1-12), `year` (valid YYYY)

---

## Service Integration

### Angular Service Example
```typescript
// dashboard.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private baseUrl = 'http://localhost:3000/dashboard';

  constructor(private http: HttpClient) {}

  getOperationalDashboard(month?: number, year?: number): Observable<any> {
    let url = `${this.baseUrl}/operational`;
    if (month && year) {
      url += `?month=${month}&year=${year}`;
    }
    return this.http.get<any>(url);
  }

  getTacticalDashboard(month?: number, year?: number): Observable<any> {
    let url = `${this.baseUrl}/tactical`;
    if (month && year) {
      url += `?month=${month}&year=${year}`;
    }
    return this.http.get<any>(url);
  }

  getStats(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/stats`);
  }
}
```

### React Hook Example
```typescript
// useDashboard.ts
import { useState, useEffect } from 'react';

export const useDashboard = (month?: number, year?: number) => {
  const [operational, setOperational] = useState(null);
  const [tactical, setTactical] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboards = async () => {
      setLoading(true);
      try {
        const params = month && year ? `?month=${month}&year=${year}` : '';
        const [opRes, tacRes] = await Promise.all([
          fetch(`/api/dashboard/operational${params}`, {
            headers: { 'Authorization': `Bearer ${getToken()}` }
          }),
          fetch(`/api/dashboard/tactical${params}`, {
            headers: { 'Authorization': `Bearer ${getToken()}` }
          })
        ]);

        setOperational(await opRes.json());
        setTactical(await tacRes.json());
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboards();
  }, [month, year]);

  return { operational, tactical, loading, error };
};
```

---

## Performance Optimization

### Caching Strategy
```typescript
// Cache responses for 1 hour
private dashboardCache = new Map<string, {
  data: any;
  timestamp: number;
}>();

private getCacheKey(month: number, year: number, type: 'operational' | 'tactical'): string {
  return `${type}-${month}-${year}`;
}

async getOperationalDashboard(month?: number, year?: number) {
  const key = this.getCacheKey(month || this.now.getMonth() + 1, year || this.now.getFullYear(), 'operational');
  
  // Check cache
  const cached = this.dashboardCache.get(key);
  if (cached && Date.now() - cached.timestamp < 3600000) { // 1 hour
    return cached.data;
  }

  // Fetch fresh data
  const data = await this.http.get(...).toPromise();
  this.dashboardCache.set(key, { data, timestamp: Date.now() });
  return data;
}
```

### Lazy Loading
- Load operational dashboard on demand (not on page load)
- Prioritize operational dashboard (more frequently used)
- Load tactical dashboard in background

---

## Database Queries

### Operational Dashboard Query
Aggregates tickets by department with status breakdown for given month/year.
- LEFT JOIN from department to employees to tickets
- Filters by created_at month/year
- Groups by department with COUNT per status
- Orders by ticket_count DESC

### Tactical Dashboard Query
Aggregates requisitions and costs by department for given month/year.
- LEFT JOIN from department to employees to part_requisitions to requisition_items
- Sums requisition_items.total_cost per department
- Filters by requisition created_at month/year
- Calculates average = total_costing / requisition_count

---

## Testing Checklist

### Unit Tests
- [ ] Test month/year parameter validation
- [ ] Test API response parsing
- [ ] Test currency formatting
- [ ] Test sorting logic
- [ ] Test percentage calculations

### Integration Tests
- [ ] Test API calls with valid tokens
- [ ] Test API calls with expired tokens
- [ ] Test API calls with invalid month/year
- [ ] Test chart rendering with sample data
- [ ] Test error state rendering

### E2E Tests
- [ ] Navigate to dashboard
- [ ] Change month/year filters
- [ ] Verify data updates
- [ ] Export CSV (if implemented)
- [ ] Test on mobile viewport

---

## cURL Test Commands

### Operational Dashboard - Current Month
```bash
curl -X GET http://localhost:3000/dashboard/operational \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -H "Content-Type: application/json" | jq .
```

### Operational Dashboard - Specific Month
```bash
curl -X GET "http://localhost:3000/dashboard/operational?month=6&year=2026" \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -H "Content-Type: application/json" | jq .
```

### Tactical Dashboard - Current Month
```bash
curl -X GET http://localhost:3000/dashboard/tactical \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -H "Content-Type: application/json" | jq .
```

### Tactical Dashboard - Specific Month
```bash
curl -X GET "http://localhost:3000/dashboard/tactical?month=6&year=2026" \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -H "Content-Type: application/json" | jq .
```

---

## Response Formats

### Date Format
All timestamps use ISO 8601 format: `YYYY-MM-DDTHH:mm:ssZ`

### Currency Format
Costing amounts are returned as decimal numbers (e.g., `7500.25`).  
**Frontend should format as:** PHP 7,500.25

### Number Format
- Department counts: integers (0, 1, 2, ...)
- Percentages: decimals (0.85 = 85%)
- Currency: decimals with 2 decimal places

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Unauthorized" error | Check token validity and expiration |
| Empty department_metrics array | No tickets/requisitions for that month/year |
| Costing shows 0 | Check if requisition items have total_cost values |
| Month parameter ignored | Ensure format is 1-12, not 01-12 |
| Data seems outdated | Backend caches migrations, restart if needed |

---

## Support & Questions

For implementation questions or issues:
1. Check the **Frontend Implementation Checklist**
2. Review **Real-World Usage Examples**
3. Test with **cURL commands** first
4. Check **Error Handling** section for specific error codes

---

**Last Updated:** June 3, 2026  
**API Version:** 1.0  
**Status:** Production Ready ✅
