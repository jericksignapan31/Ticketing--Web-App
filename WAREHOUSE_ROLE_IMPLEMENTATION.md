# WAREHOUSE Role Implementation - Backend Changes

## Overview
Added new **WAREHOUSE** role to the system with ability to:
- ✅ Request parts from suppliers
- ✅ Approve tickets (like supervisor)
- ✅ View inventory across all tickets
- ✅ Track part request approvals from ADMIN

---

## Backend Changes Made

### 1. UserRole Enum Updated
**File:** `src/common/enums/user-role.enum.ts`

Added new role:
```typescript
export enum UserRole {
  ADMIN = 'admin',
  SUPERVISOR = 'supervisor',
  IT = 'it',
  EMPLOYEE = 'employee',
  WAREHOUSE = 'warehouse',  // NEW
}
```

### 2. New Entity: WarehousePartRequest
**File:** `src/entities/warehouse-part-request.entity.ts`

Tracks part requests made by warehouse staff:
- `request_id` (UUID) - Primary key
- `requested_by` (UUID) - Warehouse staff who requested
- `approved_by` (UUID) - Admin who approved (nullable)
- `part_name` (string) - Name of part
- `quantity` (number) - Quantity needed
- `unit_cost` (decimal) - Cost per unit
- `total_cost` (decimal) - Calculated total
- `supplier` (string) - Supplier name
- `notes` (string) - Additional notes
- `status` (enum) - `pending` | `approved` | `rejected`
- `rejection_reason` (string) - Why rejected (nullable)
- `requested_at` (timestamp) - When requested
- `approved_at` (timestamp) - When approved (nullable)

### 3. New Module: Warehouse
**Files:**
- `src/warehouse/warehouse.service.ts` - Business logic
- `src/warehouse/warehouse.controller.ts` - API endpoints
- `src/warehouse/warehouse.module.ts` - Module definition

**DTOs:**
- `src/warehouse/dto/create-warehouse-part-request.dto.ts`
- `src/warehouse/dto/approve-warehouse-part-request.dto.ts`

### 4. Updated Ticket Controller
**File:** `src/ticket/ticket.controller.ts`

**Changes:**
- Added `UserRole.WAREHOUSE` to ticket approval endpoint `@Roles(UserRole.SUPERVISOR, UserRole.ADMIN, UserRole.WAREHOUSE)`
- Added `UserRole.WAREHOUSE` to inventory endpoints access

### 5. Updated App Configuration
**Files:**
- `src/app.module.ts` - Added WarehouseModule and WarehousePartRequest entity
- `src/data-source.ts` - Added WarehousePartRequest to entities array

---

## New Endpoints

### WAREHOUSE ENDPOINTS

#### 1. Request Parts
```
POST /warehouse/part-requests
Authorization: Bearer <token>
Role: WAREHOUSE
```

**Request Body:**
```json
{
  "part_name": "Mechanical Keyboard",
  "quantity": 10,
  "unit_cost": 500,
  "supplier": "Lazada",
  "notes": "Bulk spare parts order"
}
```

**Response (201 Created):**
```json
{
  "request_id": "550e8400-e29b-41d4-a716-446655440000",
  "requested_by": "warehouse-staff-id",
  "part_name": "Mechanical Keyboard",
  "quantity": 10,
  "unit_cost": 500,
  "total_cost": 5000,
  "supplier": "Lazada",
  "notes": "Bulk spare parts order",
  "status": "pending",
  "requested_at": "2026-05-29T10:30:00.000Z",
  "approved_by": null,
  "approved_at": null,
  "rejection_reason": null
}
```

#### 2. Get My Part Requests
```
GET /warehouse/part-requests/my-requests
Authorization: Bearer <token>
Role: WAREHOUSE
```

**Response (200 OK):**
```json
[
  {
    "request_id": "...",
    "status": "pending",
    "part_name": "Keyboard",
    ...
  },
  {
    "request_id": "...",
    "status": "approved",
    "part_name": "RAM 8GB",
    ...
  }
]
```

#### 3. Get Part Request Details
```
GET /warehouse/part-requests/:id
Authorization: Bearer <token>
Role: WAREHOUSE | ADMIN
```

#### 4. View Inventory
```
GET /tickets/inventory/all
GET /tickets/inventory/status/:status
GET /tickets/inventory/supplier/:supplier
Authorization: Bearer <token>
Role: IT | WAREHOUSE | ADMIN
```

#### 5. Approve Tickets (NEW PERMISSION)
```
PATCH /tickets/:id/approve
Authorization: Bearer <token>
Role: SUPERVISOR | WAREHOUSE | ADMIN
```

Warehouse can now approve tickets just like supervisor!

---

### ADMIN ENDPOINTS

#### 1. View All Pending Part Requests
```
GET /warehouse/part-requests/pending
Authorization: Bearer <token>
Role: ADMIN only
```

**Response:**
```json
[
  {
    "request_id": "...",
    "requested_by": "warehouse-staff-id",
    "status": "pending",
    "part_name": "Keyboard",
    "quantity": 10,
    "total_cost": 5000,
    "supplier": "Lazada",
    "requested_at": "2026-05-29T10:30:00.000Z",
    "requester": { employee details }
  }
]
```

#### 2. View All Part Requests
```
GET /warehouse/part-requests/all
Authorization: Bearer <token>
Role: ADMIN only
```

#### 3. Approve/Reject Part Request
```
PATCH /warehouse/part-requests/:id/approve
Authorization: Bearer <token>
Role: ADMIN only
```

**Approve Request:**
```json
{
  "action": "approved"
}
```

**Reject Request:**
```json
{
  "action": "rejected",
  "rejection_reason": "Out of stock with supplier"
}
```

**Response (200 OK):**
```json
{
  "request_id": "...",
  "status": "approved",
  "approved_by": "admin-id",
  "approved_at": "2026-05-29T11:00:00.000Z",
  "rejection_reason": null
}
```

---

## Permission Matrix

### Before Changes
| Endpoint | SUPERVISOR | IT | ADMIN | WAREHOUSE |
|----------|-----------|-----|-------|-----------|
| Approve Tickets | ✅ | ❌ | ✅ | ❌ |
| View Inventory | ❌ | ✅ | ✅ | ❌ |
| Request Parts | ❌ | ✅ | ✅ | ❌ |

### After Changes
| Endpoint | SUPERVISOR | IT | ADMIN | WAREHOUSE |
|----------|-----------|-----|-------|-----------|
| Approve Tickets | ✅ | ❌ | ✅ | ✅ NEW |
| View Inventory | ❌ | ✅ | ✅ | ✅ NEW |
| Request Parts (Warehouse) | ❌ | ❌ | ❌ | ✅ NEW |
| Approve Parts (Warehouse) | ❌ | ❌ | ✅ | ❌ |

---

## Status Values

### Part Request Status
- **pending** - Waiting for admin approval
- **approved** - Admin approved the request
- **rejected** - Admin rejected the request

### Ticket Status (unchanged)
- pending_approval
- approved
- assigned
- in_progress
- hold
- resolved
- rejected

---

## Build Status
✅ All tests pass
✅ No compilation errors
✅ Ready for deployment

---

## Database Changes
Migration will automatically create `warehouse_part_requests` table with:
- Columns for all request details
- Foreign keys to employee table
- Cascade delete constraints
- Indexes on status and requested_by

---

## Error Handling

### 400 Bad Request Examples

**Invalid part name:**
```json
{
  "statusCode": 400,
  "message": "part_name is required and cannot be empty"
}
```

**Invalid quantity:**
```json
{
  "statusCode": 400,
  "message": "quantity must be a positive number"
}
```

**Rejecting without reason:**
```json
{
  "statusCode": 400,
  "message": "rejection_reason is required when rejecting a request"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Warehouse part request with ID 'xxx' not found"
}
```

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

---

## Git Commit
**Commit Hash:** `1c05530`

**Message:**
```
feat: Add WAREHOUSE role with part request and inventory management features

- Add WAREHOUSE role to UserRole enum
- Create WarehousePartRequest entity with approval workflow
- Create warehouse module with service and controller
- Warehouse can request parts, view inventory, and approve tickets
- Admin can approve/reject warehouse part requests
- Update ticket approval endpoints to include WAREHOUSE role
- Update inventory endpoints to restrict access to IT/WAREHOUSE/ADMIN
- Register WarehousePartRequest in app.module and data-source
```

---

## Testing Endpoints (cURL)

### Warehouse: Request Parts
```bash
curl -X POST 'http://localhost:3000/warehouse/part-requests' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
  "part_name": "Mechanical Keyboard",
  "quantity": 10,
  "unit_cost": 500,
  "supplier": "Lazada",
  "notes": "Bulk order"
}'
```

### Warehouse: View My Requests
```bash
curl -X GET 'http://localhost:3000/warehouse/part-requests/my-requests' \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

### Admin: View Pending Requests
```bash
curl -X GET 'http://localhost:3000/warehouse/part-requests/pending' \
  -H 'Authorization: Bearer ADMIN_TOKEN'
```

### Admin: Approve Request
```bash
curl -X PATCH 'http://localhost:3000/warehouse/part-requests/REQUEST_ID/approve' \
  -H 'Authorization: Bearer ADMIN_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
  "action": "approved"
}'
```

### Admin: Reject Request
```bash
curl -X PATCH 'http://localhost:3000/warehouse/part-requests/REQUEST_ID/approve' \
  -H 'Authorization: Bearer ADMIN_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
  "action": "rejected",
  "rejection_reason": "Out of stock"
}'
```
