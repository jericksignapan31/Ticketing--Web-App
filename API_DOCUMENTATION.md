# IT Help Desk - API Documentation

**Last Updated:** May 11, 2026  
**Version:** 1.0.0  
**Status:** ✅ Production Ready

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Asset History API](#asset-history-api)
3. [Dashboard API](#dashboard-api)
4. [Asset Management](#asset-management)
5. [Authentication](#authentication)
6. [Error Handling](#error-handling)
7. [Deployment](#deployment)

---

## Overview

The IT Help Desk application is a comprehensive backend system built with **NestJS** + **TypeORM** + **PostgreSQL** for managing IT assets, employees, tickets, and repairs.

### Base URL
```
https://ticketing-web-app.onrender.com
```

### Core Features
- ✅ Asset Management (Create, Read, Update, Delete)
- ✅ Asset History Tracking (4 event types)
- ✅ Dashboard Statistics
- ✅ Employee & Branch Management
- ✅ Ticket & Repair Logging
- ✅ Role-Based Access Control (RBAC)
- ✅ JWT Authentication

---

## Asset History API

### Overview
Retrieve complete history/timeline of all changes made to an asset including status changes, assignments, repairs, and branch movements.

### Endpoint
```
GET /assets/{assetId}/history
```

### Authentication
**Required:** JWT Bearer Token
```
Authorization: Bearer YOUR_JWT_TOKEN
```

### Query Parameters

| Parameter | Type | Required | Default | Max | Description |
|-----------|------|----------|---------|-----|-------------|
| `limit` | number | No | 50 | 100 | Records per page |
| `offset` | number | No | 0 | - | Pagination offset |
| `type` | string | No | - | - | Filter by event type |

### Event Types
- `status_change` - Asset status changes (available, in_use, in_repair, maintenance, etc.)
- `assignment` - Employee assignments
- `repair` - Repair & maintenance logs
- `movement` - Branch/location transfers

### Request Examples

#### Get all asset history
```bash
curl -X GET "https://ticketing-web-app.onrender.com/assets/550e8400-e29b-41d4-a716-446655440000/history" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Get only repairs with pagination
```bash
curl -X GET "https://ticketing-web-app.onrender.com/assets/550e8400-e29b-41d4-a716-446655440000/history?type=repair&limit=20&offset=0" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Get only status changes
```bash
curl -X GET "https://ticketing-web-app.onrender.com/assets/550e8400-e29b-41d4-a716-446655440000/history?type=status_change" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "assetId": "550e8400-e29b-41d4-a716-446655440000",
    "assetTag": "LAP-2024-001",
    "totalEvents": 15,
    "events": [
      {
        "id": "event-uuid-1",
        "type": "status_change",
        "description": "Status changed from available to in_use",
        "previousValue": "available",
        "newValue": "in_use",
        "changedBy": "John Admin",
        "changedByRole": "ADMIN",
        "timestamp": "2026-05-10T14:30:00Z",
        "details": {
          "reason": "Assigned to employee"
        }
      },
      {
        "id": "event-uuid-2",
        "type": "assignment",
        "description": "Assigned to Jane Smith (Employee ID: 0004)",
        "employeeId": "0004",
        "employeeName": "Jane Smith",
        "previousEmployee": "John Doe",
        "changedBy": "Admin User",
        "changedByRole": "ADMIN",
        "timestamp": "2026-05-10T14:25:00Z",
        "details": {
          "notes": "Equipment replacement"
        }
      },
      {
        "id": "event-uuid-3",
        "type": "repair",
        "description": "Repair performed",
        "repairType": "pending",
        "technician": "Mike Tech",
        "changedBy": "Mike Tech",
        "changedByRole": "IT",
        "timestamp": "2026-05-09T10:15:00Z",
        "details": {
          "cost": 350.00,
          "notes": "GPU failure - replaced with new unit",
          "actionTaken": "Replaced GPU - NVIDIA RTX 4060"
        }
      },
      {
        "id": "event-uuid-4",
        "type": "movement",
        "description": "Moved from Branch 'Main Office' to 'Branch 2'",
        "fromBranch": "Main Office",
        "toBranch": "Branch 2",
        "fromBranchId": "branch-uuid-1",
        "toBranchId": "branch-uuid-2",
        "movedBy": "Admin User",
        "changedByRole": "ADMIN",
        "timestamp": "2026-05-08T09:00:00Z",
        "details": {
          "reason": "Employee transfer"
        }
      }
    ]
  },
  "message": "Asset history retrieved successfully"
}
```

### Error Response (404 Not Found)

```json
{
  "success": false,
  "error": "Asset with ID '999' not found",
  "assetId": "999"
}
```

### Error Response (500 Internal Server Error)

```json
{
  "success": false,
  "error": "Failed to retrieve asset history",
  "details": "Database connection error"
}
```

### Database Schema

#### asset_status_history
```sql
CREATE TABLE asset_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  asset_id UUID NOT NULL,
  previous_status VARCHAR(50),
  new_status VARCHAR(50) NOT NULL,
  changed_by UUID NOT NULL,
  reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (asset_id) REFERENCES asset(asset_id) ON DELETE CASCADE,
  FOREIGN KEY (changed_by) REFERENCES user_account(user_id) ON DELETE CASCADE,
  INDEX (asset_id, created_at DESC)
);
```

#### asset_assignment_history
```sql
CREATE TABLE asset_assignment_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  asset_id UUID NOT NULL,
  previous_employee_id VARCHAR(50),
  new_employee_id VARCHAR(50),
  assigned_by UUID NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (asset_id) REFERENCES asset(asset_id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_by) REFERENCES user_account(user_id) ON DELETE CASCADE,
  FOREIGN KEY (previous_employee_id) REFERENCES employee(employee_id) ON DELETE SET NULL,
  FOREIGN KEY (new_employee_id) REFERENCES employee(employee_id) ON DELETE SET NULL,
  INDEX (asset_id, created_at DESC)
);
```

#### asset_movement_history
```sql
CREATE TABLE asset_movement_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  asset_id UUID NOT NULL,
  from_branch_id UUID,
  to_branch_id UUID NOT NULL,
  moved_by UUID NOT NULL,
  reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (asset_id) REFERENCES asset(asset_id) ON DELETE CASCADE,
  FOREIGN KEY (from_branch_id) REFERENCES branch(branch_id) ON DELETE SET NULL,
  FOREIGN KEY (to_branch_id) REFERENCES branch(branch_id) ON DELETE CASCADE,
  FOREIGN KEY (moved_by) REFERENCES user_account(user_id) ON DELETE CASCADE,
  INDEX (asset_id, created_at DESC)
);
```

### TypeScript/Angular Implementation

```typescript
// asset.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AssetService {
  private apiUrl = 'https://ticketing-web-app.onrender.com/assets';

  constructor(private http: HttpClient) {}

  getAssetHistory(
    assetId: string,
    limit: number = 50,
    offset: number = 0,
    type?: string
  ): Observable<any> {
    let params = new HttpParams()
      .set('limit', limit.toString())
      .set('offset', offset.toString());

    if (type) {
      params = params.set('type', type);
    }

    return this.http.get(`${this.apiUrl}/${assetId}/history`, { params });
  }
}

// asset.component.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AssetService } from './asset.service';

@Component({
  selector: 'app-asset',
  templateUrl: './asset.component.html',
  styleUrls: ['./asset.component.css']
})
export class AssetComponent implements OnInit {
  assetId: string = '';
  assetHistory: any[] = [];
  totalEvents: number = 0;
  selectedEventType: string = '';
  loadingHistory: boolean = false;

  eventTypes = [
    { value: '', label: 'All Events' },
    { value: 'status_change', label: 'Status Changes' },
    { value: 'assignment', label: 'Assignments' },
    { value: 'repair', label: 'Repairs' },
    { value: 'movement', label: 'Movements' }
  ];

  constructor(
    private route: ActivatedRoute,
    private assetService: AssetService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.assetId = params['id'];
      this.loadAssetHistory();
    });
  }

  loadAssetHistory(): void {
    this.loadingHistory = true;
    this.assetService.getAssetHistory(
      this.assetId,
      50,
      0,
      this.selectedEventType || undefined
    ).subscribe({
      next: (response: any) => {
        this.assetHistory = response.data.events;
        this.totalEvents = response.data.totalEvents;
        this.loadingHistory = false;
      },
      error: (error) => {
        console.error('Failed to load asset history:', error);
        this.assetHistory = [];
        this.loadingHistory = false;
      }
    });
  }

  onFilterChange(type: string): void {
    this.selectedEventType = type;
    this.loadAssetHistory();
  }

  getEventIcon(type: string): string {
    const icons: { [key: string]: string } = {
      'status_change': 'status_icon',
      'assignment': 'person_icon',
      'repair': 'tools_icon',
      'movement': 'location_icon'
    };
    return icons[type] || 'event_icon';
  }

  getEventBadgeClass(type: string): string {
    const classes: { [key: string]: string } = {
      'status_change': 'badge-blue',
      'assignment': 'badge-green',
      'repair': 'badge-orange',
      'movement': 'badge-purple'
    };
    return classes[type] || 'badge-gray';
  }
}
```

```html
<!-- asset.component.html -->
<div class="asset-history-container">
  <h2>Asset History</h2>

  <!-- Filter -->
  <div class="filter-section">
    <label>Filter by Event Type:</label>
    <select [(ngModel)]="selectedEventType" (change)="onFilterChange(selectedEventType)">
      <option *ngFor="let type of eventTypes" [value]="type.value">
        {{ type.label }}
      </option>
    </select>
  </div>

  <!-- Loading -->
  <div *ngIf="loadingHistory" class="loading">
    <p>Loading asset history...</p>
  </div>

  <!-- No Events -->
  <div *ngIf="!loadingHistory && assetHistory.length === 0" class="no-events">
    <p>No events found for this asset.</p>
  </div>

  <!-- Timeline -->
  <div *ngIf="!loadingHistory && assetHistory.length > 0" class="timeline">
    <p class="total-events">Total Events: {{ totalEvents }}</p>

    <div *ngFor="let event of assetHistory" [ngClass]="'event-item ' + getEventBadgeClass(event.type)">
      <div class="event-header">
        <span class="event-type-badge">{{ event.type }}</span>
        <span class="event-date">{{ event.timestamp | date: 'short' }}</span>
      </div>

      <div class="event-description">
        <p><strong>{{ event.description }}</strong></p>
      </div>

      <div class="event-details">
        <p><strong>Changed by:</strong> {{ event.changedBy }} ({{ event.changedByRole }})</p>

        <!-- Status Change Details -->
        <div *ngIf="event.type === 'status_change'">
          <p><strong>From:</strong> {{ event.previousValue }}</p>
          <p><strong>To:</strong> {{ event.newValue }}</p>
          <p *ngIf="event.details?.reason"><strong>Reason:</strong> {{ event.details.reason }}</p>
        </div>

        <!-- Assignment Details -->
        <div *ngIf="event.type === 'assignment'">
          <p><strong>Employee:</strong> {{ event.employeeName }} ({{ event.employeeId }})</p>
          <p *ngIf="event.previousEmployee"><strong>Previously:</strong> {{ event.previousEmployee }}</p>
          <p *ngIf="event.details?.notes"><strong>Notes:</strong> {{ event.details.notes }}</p>
        </div>

        <!-- Repair Details -->
        <div *ngIf="event.type === 'repair'">
          <p><strong>Technician:</strong> {{ event.technician }}</p>
          <p><strong>Type:</strong> {{ event.repairType }}</p>
          <p *ngIf="event.details?.cost"><strong>Cost:</strong> ${{ event.details.cost }}</p>
          <p *ngIf="event.details?.notes"><strong>Notes:</strong> {{ event.details.notes }}</p>
        </div>

        <!-- Movement Details -->
        <div *ngIf="event.type === 'movement'">
          <p><strong>From:</strong> {{ event.fromBranch }}</p>
          <p><strong>To:</strong> {{ event.toBranch }}</p>
          <p *ngIf="event.details?.reason"><strong>Reason:</strong> {{ event.details.reason }}</p>
        </div>
      </div>
    </div>
  </div>
</div>
```

---

## Dashboard API

### Endpoint
```
GET /dashboard/stats
```

### Authentication
**Required:** JWT Bearer Token

### Response (200 OK)

```json
{
  "totalTickets": 45,
  "openTickets": 12,
  "pendingRepairs": 3,
  "assetsInUse": 28,
  "ticketsByStatus": {
    "pending_approval": 5,
    "approved": 4,
    "in_progress": 2,
    "completed": 1
  },
  "ticketsByPriority": {
    "low": 3,
    "medium": 6,
    "high": 2,
    "urgent": 1
  },
  "assetsByCondition": {
    "excellent": 10,
    "good": 15,
    "fair": 2,
    "poor": 1,
    "broken": 0
  },
  "recentTickets": [
    {
      "ticketId": "ticket-uuid",
      "subject": "Laptop not connecting to WiFi",
      "status": "in_progress",
      "priority": "high",
      "createdAt": "2026-05-11T10:30:00Z"
    }
  ]
}
```

---

## Asset Management

### Create Asset

**Endpoint:** `POST /assets`

**Required Roles:** ADMIN, SUPERVISOR, IT, EMPLOYEE

**Request Body:**

```json
{
  "asset_tag": "LAP-2024-001",
  "brand_id": "38efb60b-ce6a-420b-b376-2ba0ee5db5c7",
  "branch_id": "a683c9cc-9df9-4d6f-929b-80918288e0e2",
  "category": "Laptop",
  "model": "Dell Latitude 5420",
  "serial_number": "SN123456789",
  "status": "available",
  "condition": "good",
  "assigned_to": "0004",
  "notes": "New laptop for department",
  "specifications": {
    "cpu": "Intel Core i5",
    "ram": "16GB",
    "storage": "512GB SSD",
    "display": "14-inch FHD"
  },
  "ip_address": "192.168.1.100",
  "mac_address": "00:1B:44:11:3A:B7",
  "hostname": "DESKTOP-001",
  "anydesk_id": "987654321"
}
```

**Success Response (201 Created):**

```json
{
  "asset_id": "550e8400-e29b-41d4-a716-446655440000",
  "asset_tag": "LAP-2024-001",
  "brand_id": "38efb60b-ce6a-420b-b376-2ba0ee5db5c7",
  "branch_id": "a683c9cc-9df9-4d6f-929b-80918288e0e2",
  "category": "Laptop",
  "model": "Dell Latitude 5420",
  "serial_number": "SN123456789",
  "status": "available",
  "condition": "good",
  "assigned_to": "0004",
  "created_at": "2026-05-11T10:30:00Z",
  "updated_at": "2026-05-11T10:30:00Z"
}
```

### Get Asset

**Endpoint:** `GET /assets/{assetId}`

### Update Asset

**Endpoint:** `PATCH /assets/{assetId}`

### Delete Asset

**Endpoint:** `DELETE /assets/{assetId}`

### Get All Assets

**Endpoint:** `GET /assets`

- **Admin/Supervisor/IT:** Returns all assets
- **Employee:** Returns only assets from their branch

### Search Assets

**Endpoint:** `GET /assets/search?q=keyword`

---

## Authentication

### Login

**Endpoint:** `POST /auth/login`

**Request Body:**

```json
{
  "username": "johndoe",
  "password": "securepassword123"
}
```

**Success Response (200 OK):**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "user_id": "user-uuid",
    "username": "johndoe",
    "employee_id": "0001",
    "role": "ADMIN",
    "branchId": "branch-uuid",
    "employeeName": "John Doe"
  }
}
```

### JWT Token Format

```json
{
  "sub": "user-uuid",
  "username": "johndoe",
  "employeeId": "0001",
  "role": "ADMIN",
  "branchId": "branch-uuid",
  "iat": 1715425800,
  "exp": 1715512200
}
```

### Token Usage

Include token in Authorization header:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## Role-Based Access Control

### Roles

| Role | Permissions |
|------|------------|
| ADMIN | Full access to all resources |
| SUPERVISOR | Manage assets, tickets, employees in their branch |
| IT | Manage repairs, assets, create tickets |
| EMPLOYEE | View/search assets, create tickets, view own data |

---

## Error Handling

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 500 | Internal Server Error |

### Error Response Format

```json
{
  "statusCode": 400,
  "message": "Failed to create asset: column Asset.condition does not exist",
  "error": "Bad Request"
}
```

---

## Deployment

### Environment Variables

**.env** (Development)
```
NODE_ENV=development
DB_TYPE=postgres
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_DATABASE=ithelp_desk_local
DB_SYNCHRONIZE=true
JWT_SECRET=your_secret_key_here
CORS_ORIGIN=http://localhost:4200
```

**.env.production** (Production - Render)
```
NODE_ENV=production
DB_TYPE=postgres
DB_HOST=db.xxxxxxxxxxxxx.supabase.co
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_supabase_password
DB_DATABASE=postgres
DB_SYNCHRONIZE=false
JWT_SECRET=change-this-to-random-secret
CORS_ORIGIN=https://your-frontend-domain.com
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=false
```

### Build & Deploy

```bash
# Install dependencies
npm install

# Build
npm run build

# Run migrations
npm run migration:run

# Start production server
npm run start:prod
```

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3005
CMD ["node", "dist/main.js"]
```

---

## Database

### Tables

- `user_account` - User authentication
- `employee` - Employee information
- `branch` - Branch/Station locations
- `department` - Departments
- `brand` - Device brands
- `asset` - Assets inventory
- `ticket` - Support tickets
- `repair_log` - Repair history
- `asset_status_history` - Status change tracking
- `asset_assignment_history` - Assignment tracking
- `asset_movement_history` - Movement tracking

### Migrations

Auto-run on app startup:

```bash
npm run migration:run
```

---

## Testing

### Unit Tests

```bash
npm run test
```

### E2E Tests

```bash
npm run test:e2e
```

### API Testing with Postman

Import the collection from `/postman` folder or use the examples provided in this documentation.

---

## Support

For issues or questions:

1. Check error messages in server logs
2. Verify JWT token validity
3. Ensure asset exists before accessing history
4. Check branch/employee assignments
5. Verify user roles and permissions

---

**Last Updated:** May 11, 2026  
**Maintained By:** Development Team  
**Status:** ✅ Production Ready
