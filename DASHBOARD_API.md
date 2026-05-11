# Dashboard API Documentation

## Overview
Dashboard API provides real-time statistics and metrics for the IT Help Desk system. This endpoint aggregates data from tickets and assets to display comprehensive dashboard information.

---

## Endpoint

### GET /dashboard/stats

**Authentication Required:** Yes (Bearer Token)  
**Authorization:** All authenticated users  
**Content-Type:** `application/json`

### Request

```bash
curl -X GET https://ticketing-web-app.onrender.com/dashboard/stats \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json"
```

### Response Status Codes

| Status | Description |
|--------|-------------|
| `200 OK` | Successfully retrieved dashboard statistics |
| `401 Unauthorized` | Invalid or missing authentication token |
| `500 Internal Server Error` | Server error occurred |

---

## Response Schema

### Complete Response Structure

```json
{
  "totalTickets": 127,
  "openTickets": 34,
  "pendingRepairs": 8,
  "assetsInUse": 156,
  "ticketsByStatus": {
    "open": 23,
    "in-progress": 11,
    "resolved": 67,
    "closed": 26
  },
  "ticketsByPriority": {
    "low": 45,
    "medium": 52,
    "high": 28,
    "urgent": 2
  },
  "assetsByCondition": {
    "excellent": 89,
    "good": 102,
    "fair": 38,
    "poor": 12,
    "broken": 3
  },
  "recentTickets": []
}
```

---

## Field Descriptions

### Summary Statistics

| Field | Type | Description |
|-------|------|-------------|
| `totalTickets` | `number` | Total count of all tickets in system |
| `openTickets` | `number` | Count of all non-closed tickets (status != 'closed') |
| `pendingRepairs` | `number` | Count of assets currently in maintenance |
| `assetsInUse` | `number` | Count of assets actively in use |

### Ticket Status Distribution

**Field:** `ticketsByStatus`  
**Type:** `Object<string, number>`

Counts of tickets grouped by status:
- `open` - Status: PENDING_APPROVAL
- `in-progress` - Status: IN_PROGRESS
- `resolved` - Status: RESOLVED
- `closed` - Status: CLOSED

**Note:** All status keys are always included, even if count is 0

### Ticket Priority Distribution

**Field:** `ticketsByPriority`  
**Type:** `Object<string, number>`

Counts of tickets grouped by priority level:
- `low`
- `medium`
- `high`
- `urgent`

**Note:** All priority keys are always included, even if count is 0

### Asset Condition Distribution

**Field:** `assetsByCondition`  
**Type:** `Object<string, number>`

Counts of assets grouped by condition:
- `excellent` - Asset in excellent condition
- `good` - Asset in good condition
- `fair` - Asset in fair condition
- `poor` - Asset in poor condition
- `broken` - Asset is broken

**Note:** All condition keys are always included, even if count is 0

### Recent Tickets

**Field:** `recentTickets`  
**Type:** `Array<Object>`

Currently an empty array. Reserved for future implementation to display recent ticket details.

---

## Frontend Integration

### Example cURL Request

```bash
curl -X GET http://localhost:3000/dashboard/stats \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json"
```

### Angular/TypeScript Integration

```typescript
// dashboard.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

interface DashboardStats {
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

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private apiUrl = 'https://ticketing-web-app.onrender.com';

  constructor(private http: HttpClient) {}

  getDashboardStats(token: string): Observable<DashboardStats> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    return this.http.get<DashboardStats>(
      `${this.apiUrl}/dashboard/stats`,
      { headers }
    );
  }
}

// dashboard.component.ts
export class DashboardComponent implements OnInit {
  stats: DashboardStats | null = null;
  loading: boolean = false;
  error: string | null = null;

  constructor(
    private dashboardService: DashboardService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.loadDashboardStats();
  }

  loadDashboardStats() {
    this.loading = true;
    this.error = null;

    const token = this.authService.getAuthToken();
    
    this.dashboardService.getDashboardStats(token).subscribe({
      next: (data) => {
        this.stats = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load dashboard stats:', err);
        this.error = 'Failed to load dashboard statistics';
        this.loading = false;
      }
    });
  }
}
```

### React Integration

```typescript
// useDashboardStats.ts
import { useEffect, useState } from 'react';

interface DashboardStats {
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

export const useDashboardStats = (token: string) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          'https://ticketing-web-app.onrender.com/dashboard/stats',
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setStats(data);
      } catch (err) {
        console.error('Failed to load dashboard stats:', err);
        setError('Failed to load dashboard statistics');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchStats();
    }
  }, [token]);

  return { stats, loading, error };
};

// DashboardComponent.tsx
import { useDashboardStats } from './useDashboardStats';

export const Dashboard = ({ token }: { token: string }) => {
  const { stats, loading, error } = useDashboardStats(token);

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!stats) return <div>No data available</div>;

  return (
    <div className="dashboard">
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Tickets</h3>
          <p className="value">{stats.totalTickets}</p>
        </div>
        <div className="stat-card">
          <h3>Open Tickets</h3>
          <p className="value">{stats.openTickets}</p>
        </div>
        <div className="stat-card">
          <h3>Pending Repairs</h3>
          <p className="value">{stats.pendingRepairs}</p>
        </div>
        <div className="stat-card">
          <h3>Assets In Use</h3>
          <p className="value">{stats.assetsInUse}</p>
        </div>
      </div>

      <div className="charts">
        {/* Chart for ticketsByStatus */}
        {/* Chart for ticketsByPriority */}
        {/* Chart for assetsByCondition */}
      </div>
    </div>
  );
};
```

---

## Error Handling

### Fallback Data (for Development)

If the endpoint fails, frontend can fall back to mock data:

```json
{
  "totalTickets": 0,
  "openTickets": 0,
  "pendingRepairs": 0,
  "assetsInUse": 0,
  "ticketsByStatus": {
    "open": 0,
    "in-progress": 0,
    "resolved": 0,
    "closed": 0
  },
  "ticketsByPriority": {
    "low": 0,
    "medium": 0,
    "high": 0,
    "urgent": 0
  },
  "assetsByCondition": {
    "excellent": 0,
    "good": 0,
    "fair": 0,
    "poor": 0,
    "broken": 0
  },
  "recentTickets": []
}
```

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| 401 Unauthorized | Missing or invalid token | Ensure token is valid and properly formatted |
| 500 Internal Server Error | Server error | Check server logs, try again later |
| Network Error | Connection issues | Check API URL, ensure CORS is enabled |

---

## CORS Configuration

The API returns the following CORS headers:

```
Access-Control-Allow-Origin: https://it-help-desk-fe.vercel.app
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET
Access-Control-Allow-Headers: Authorization, Content-Type
```

---

## Best Practices

1. **Cache Results**: Cache dashboard stats for 30-60 seconds to reduce API calls
2. **Error Handling**: Always handle 401 errors by redirecting to login
3. **Loading States**: Show loading indicator while fetching data
4. **Refresh**: Add a refresh button to manually update statistics
5. **Real-time Updates**: Consider polling every 60 seconds for near real-time data

---

## Support

For issues or questions about the dashboard API:
- Check backend logs at: `https://ticketing-web-app.onrender.com/logs`
- Review this documentation
- Contact backend team

---

**Last Updated:** May 11, 2026  
**API Version:** 1.0  
**Status:** Active
