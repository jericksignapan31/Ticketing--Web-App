# Requisition System Implementation Guide

## Backend Changes Made

### 1. New Entities Created

#### `PartRequisition` Entity
- **Table**: `part_requisitions`
- **Purpose**: Main requisition form with multi-level approval workflow
- **Key Fields**:
  - `requisition_id` (UUID) - Primary key
  - `rf_number` (string, unique) - Auto-generated in format RF-2026-001
  - `requested_by` (UUID) - Employee who requested
  - `requested_by_type` (enum) - 'it' or 'warehouse'
  - `department` (string, nullable) - Optional department name
  - `deadline` (timestamp, nullable) - Optional deadline
  - `status` (enum) - 'pending' → 'pending_admin_review' → 'approved' or 'rejected'
  - `acknowledged_by` (UUID, nullable) - Warehouse staff who reviewed
  - `acknowledged_at` (timestamp, nullable) - When warehouse reviewed
  - `acknowledged_notes` (string, nullable) - Warehouse notes
  - `approved_by` (UUID, nullable) - Admin who approved
  - `approved_at` (timestamp, nullable) - When admin approved
  - `rejection_reason` (string, nullable) - Reason if rejected

#### `RequisitionItem` Entity
- **Table**: `requisition_items`
- **Purpose**: Line items within a requisition (multiple per RF)
- **Key Fields**:
  - `item_id` (UUID) - Primary key
  - `requisition_id` (UUID) - Foreign key to PartRequisition (CASCADE delete)
  - `item_name` (string) - What is being requested
  - `quantity` (number) - How many
  - `unit` (string) - pcs, box, set, etc.
  - `supplier` (string, nullable) - Which supplier
  - `unit_cost` (decimal, nullable) - Cost per unit
  - `total_cost` (decimal, nullable) - Calculated total
  - `purpose_remarks` (string, nullable) - Why it's needed

### 2. DTOs Created

#### `CreatePartRequisitionDto`
```typescript
{
  requested_by_type: 'it' | 'warehouse';  // required
  department?: string;                     // optional
  deadline?: Date;                         // optional
  items: [
    {
      item_name: string;          // required
      quantity: number;           // required
      unit: string;               // required (pcs, box, set, etc.)
      supplier?: string;          // optional
      unit_cost?: number;         // optional
      total_cost?: number;        // optional - will be calculated
      purpose_remarks?: string;   // optional
    }
  ]
}
```

#### `AcknowledgeRequisitionDto`
```typescript
{
  acknowledged_notes?: string;  // optional notes from warehouse
}
```

#### `ApproveWarehousePartRequestDto`
```typescript
{
  action: 'approved' | 'rejected';  // required
  rejection_reason?: string;         // required if action is 'rejected'
}
```

### 3. Workflow Status Flow

```
CREATION (IT or WAREHOUSE requests)
    ↓
pending (waiting for WAREHOUSE acknowledgment)
    ↓
[WAREHOUSE reviews and adds notes via /acknowledge endpoint]
    ↓
pending_admin_review (waiting for ADMIN approval)
    ↓
[ADMIN approves or rejects via /approve endpoint]
    ↓
approved (final state - approved)
  OR
rejected (final state - rejected, see rejection_reason)
```

---

## API Endpoints

### 1. Create New Requisition
**POST** `/requisitions`

**Who can access**: IT, WAREHOUSE roles

**Request Body**:
```json
{
  "requested_by_type": "it",
  "department": "IT Department",
  "deadline": "2026-06-15T00:00:00Z",
  "items": [
    {
      "item_name": "Dell Monitor 27 inch",
      "quantity": 2,
      "unit": "pcs",
      "supplier": "Dell Philippines",
      "unit_cost": 15000,
      "purpose_remarks": "Replacement for broken monitors"
    },
    {
      "item_name": "USB-C Cables",
      "quantity": 10,
      "unit": "pcs",
      "supplier": "Tech Supplies Inc",
      "unit_cost": 500,
      "purpose_remarks": "For new workstations"
    }
  ]
}
```

**Response** (201 Created):
```json
{
  "requisition_id": "uuid-here",
  "rf_number": "RF-2026-001",
  "requested_by": "employee-uuid",
  "requested_by_type": "it",
  "department": "IT Department",
  "deadline": "2026-06-15T00:00:00Z",
  "status": "pending",
  "acknowledged_by": null,
  "acknowledged_at": null,
  "acknowledged_notes": null,
  "approved_by": null,
  "approved_at": null,
  "rejection_reason": null,
  "items": [
    {
      "item_id": "uuid1",
      "item_name": "Dell Monitor 27 inch",
      "quantity": 2,
      "unit": "pcs",
      "supplier": "Dell Philippines",
      "unit_cost": 15000,
      "total_cost": 30000,
      "purpose_remarks": "Replacement for broken monitors"
    },
    ...
  ],
  "created_at": "2026-05-29T...",
  "updated_at": "2026-05-29T..."
}
```

---

### 2. Get My Requisitions
**GET** `/requisitions/my-requisitions`

**Who can access**: IT, WAREHOUSE roles

**Query Params**: None

**Response** (200 OK):
```json
[
  {
    "requisition_id": "uuid",
    "rf_number": "RF-2026-001",
    "requested_by_type": "it",
    "status": "pending",
    "department": "IT Department",
    "items": [...],
    "created_at": "2026-05-29T...",
    "updated_at": "2026-05-29T..."
  },
  ...
]
```

---

### 3. Get Pending Requisitions (For Warehouse Review)
**GET** `/requisitions/pending`

**Who can access**: WAREHOUSE role

**Purpose**: Shows all requisitions waiting for warehouse acknowledgment

**Query Params**: None

**Response** (200 OK):
```json
[
  {
    "requisition_id": "uuid",
    "rf_number": "RF-2026-001",
    "requested_by_type": "it",
    "status": "pending",
    "department": "IT Department",
    "items": [...],
    "requester": {
      "employee_id": "uuid",
      "first_name": "John",
      "last_name": "Doe"
    },
    "created_at": "2026-05-29T..."
  },
  ...
]
```

---

### 4. Get Pending Admin Review (For Admin Approval)
**GET** `/requisitions/pending-admin-review`

**Who can access**: ADMIN role

**Purpose**: Shows all requisitions acknowledged by warehouse, waiting for admin approval

**Query Params**: None

**Response** (200 OK):
```json
[
  {
    "requisition_id": "uuid",
    "rf_number": "RF-2026-001",
    "requested_by_type": "warehouse",
    "status": "pending_admin_review",
    "department": "Warehouse",
    "acknowledged_by": "warehouse-uuid",
    "acknowledged_at": "2026-05-29T...",
    "acknowledged_notes": "Stock available, ready for approval",
    "items": [...],
    "requester": {
      "employee_id": "uuid",
      "first_name": "Jane",
      "last_name": "Smith"
    },
    "acknowledger": {
      "employee_id": "uuid",
      "first_name": "Mike",
      "last_name": "Johnson"
    }
  },
  ...
]
```

---

### 5. Get Requisition Detail
**GET** `/requisitions/:rf_number`

**Who can access**: IT, WAREHOUSE, ADMIN roles

**Example**: `/requisitions/RF-2026-001`

**Response** (200 OK):
```json
{
  "requisition_id": "uuid",
  "rf_number": "RF-2026-001",
  "requested_by_type": "it",
  "status": "pending_admin_review",
  "department": "IT Department",
  "deadline": "2026-06-15T00:00:00Z",
  "acknowledged_by": "warehouse-uuid",
  "acknowledged_at": "2026-05-29T13:30:00Z",
  "acknowledged_notes": "All items available in stock",
  "approved_by": null,
  "approved_at": null,
  "rejection_reason": null,
  "items": [
    {
      "item_id": "uuid1",
      "item_name": "Dell Monitor",
      "quantity": 2,
      "unit": "pcs",
      "supplier": "Dell",
      "unit_cost": 15000,
      "total_cost": 30000,
      "purpose_remarks": "Replacement"
    }
  ],
  "requester": {
    "employee_id": "uuid",
    "first_name": "John",
    "last_name": "Doe"
  },
  "acknowledger": {
    "employee_id": "uuid",
    "first_name": "Mike",
    "last_name": "Johnson"
  },
  "created_at": "2026-05-29T..."
}
```

---

### 6. Acknowledge Requisition (Warehouse Reviews)
**PATCH** `/requisitions/:rf_number/acknowledge`

**Who can access**: WAREHOUSE role

**Example**: `/requisitions/RF-2026-001/acknowledge`

**Request Body**:
```json
{
  "acknowledged_notes": "All items available, ready for admin approval. Delivery can be arranged within 2 days."
}
```

**Response** (200 OK):
```json
{
  "requisition_id": "uuid",
  "rf_number": "RF-2026-001",
  "status": "pending_admin_review",  // ← Changed from "pending"
  "acknowledged_by": "warehouse-staff-uuid",  // ← Set
  "acknowledged_at": "2026-05-29T13:30:00Z",  // ← Set
  "acknowledged_notes": "All items available, ready for admin approval. Delivery can be arranged within 2 days.",
  "items": [...],
  "updated_at": "2026-05-29T13:30:00Z"
}
```

---

### 7. Get All Approved Requisitions
**GET** `/requisitions/approved`

**Who can access**: ADMIN, WAREHOUSE, IT roles

**Purpose**: View all requisitions that have been approved (final state)

**Query Params**: None

**Response** (200 OK):
```json
[
  {
    "requisition_id": "uuid",
    "rf_number": "RF-2026-002",
    "requested_by_type": "warehouse",
    "status": "approved",
    "department": "Warehouse",
    "acknowledged_by": "warehouse-uuid",
    "acknowledged_at": "2026-06-01T06:19:43Z",
    "acknowledged_notes": "Verified inventory - items in stock",
    "approved_by": "admin-uuid",
    "approved_at": "2026-05-31T22:34:15Z",
    "rejection_reason": null,
    "items": [
      {
        "item_id": "uuid1",
        "item_name": "asdasd",
        "quantity": 232,
        "unit": "pcs",
        "supplier": "asdasd",
        "unit_cost": "222.00",
        "total_cost": "51504.00",
        "purpose_remarks": "asdsa"
      }
    ],
    "requester": {
      "employee_id": "uuid",
      "first_name": "Haidee",
      "last_name": "Onofre",
      "email": "warehouse.min@tecfuel.ph",
      "role": "warehouse",
      "position": "Warehouse OIC"
    },
    "approver": {
      "employee_id": "uuid",
      "first_name": "Jiepebu",
      "last_name": "Guillermo",
      "email": "jvguillermo@tecfuel.ph",
      "role": "admin",
      "position": "Operations Head - MBG"
    },
    "created_at": "2026-05-31T22:14:52Z",
    "updated_at": "2026-05-31T22:34:15Z"
  }
]
```

---

### 8. Get Requisition Inventory (All Items from All Requisitions)
**GET** `/requisitions/inventory`

**Who can access**: ADMIN, WAREHOUSE, IT roles

**Purpose**: View flat list of all items across all requisitions for inventory tracking. Useful for warehouse inventory management and procurement planning.

**Query Params**: None

**Response** (200 OK):
```json
[
  {
    "item_id": "uuid",
    "requisition_id": "uuid",
    "rf_number": "RF-2026-003",
    "item_name": "asd",
    "quantity": 2,
    "unit": "pcs",
    "supplier": "2",
    "unit_cost": "2.00",
    "total_cost": "4.00",
    "purpose_remarks": null,
    "requisition_status": "rejected",
    "requested_by_type": "it",
    "requester": {
      "employee_id": "uuid",
      "first_name": "John",
      "last_name": "Smith",
      "email": "john.smith@tecfuel.ph"
    },
    "created_at": "2026-05-31T22:14:52Z",
    "updated_at": "2026-05-31T22:34:15Z"
  },
  {
    "item_id": "uuid",
    "requisition_id": "uuid",
    "rf_number": "RF-2026-002",
    "item_name": "asdasd",
    "quantity": 232,
    "unit": "pcs",
    "supplier": "asdasd",
    "unit_cost": "222.00",
    "total_cost": "51504.00",
    "purpose_remarks": "asdsa",
    "requisition_status": "approved",
    "requested_by_type": "warehouse",
    "requester": {
      "employee_id": "uuid",
      "first_name": "Haidee",
      "last_name": "Onofre",
      "email": "warehouse.min@tecfuel.ph"
    },
    "created_at": "2026-05-31T22:14:52Z",
    "updated_at": "2026-05-31T22:34:15Z"
  }
]
```

---

### 9. Approve or Reject Requisition (Admin Decision)
**PATCH** `/requisitions/:rf_number/approve`

**Who can access**: ADMIN role

**Example**: `/requisitions/RF-2026-001/approve`

**Request Body** (If Approving):
```json
{
  "action": "approved"
}
```

**Request Body** (If Rejecting):
```json
{
  "action": "rejected",
  "rejection_reason": "Budget allocation exceeded for this quarter. Please resubmit next quarter."
}
```

**Response** (200 OK - Approved):
```json
{
  "requisition_id": "uuid",
  "rf_number": "RF-2026-001",
  "status": "approved",  // ← Final status
  "approved_by": "admin-uuid",  // ← Set
  "approved_at": "2026-05-29T14:00:00Z",  // ← Set
  "rejection_reason": null,
  "items": [...],
  "updated_at": "2026-05-29T14:00:00Z"
}
```

**Response** (200 OK - Rejected):
```json
{
  "requisition_id": "uuid",
  "rf_number": "RF-2026-001",
  "status": "rejected",  // ← Final status
  "approved_by": "admin-uuid",  // ← Set
  "approved_at": "2026-05-29T14:00:00Z",  // ← Set
  "rejection_reason": "Budget allocation exceeded for this quarter. Please resubmit next quarter.",
  "items": [...],
  "updated_at": "2026-05-29T14:00:00Z"
}
```

---

## Frontend Implementation Checklist

### Role-Based Views

#### 1. IT/WAREHOUSE User Dashboard
- [ ] **Create New Requisition Form**
  - Input fields for: department (optional), deadline (optional)
  - Dynamic item list (add/remove items)
  - Per item: name (required), quantity (required), unit (required), supplier, unit_cost, purpose_remarks
  - Submit button to POST to `/requisitions`
  - Show success with RF number

- [ ] **My Requisitions List**
  - GET `/requisitions/my-requisitions`
  - Display all user's requisitions
  - Show RF number, status (pending/pending_admin_review/approved/rejected), items count
  - Click to view detail
  - Cancel option (before warehouse acknowledges)

- [ ] **Requisition Detail View**
  - GET `/requisitions/RF-XXXX-XXX`
  - Show all fields including items
  - Show requester name
  - If status is "pending": Show warehouse hasn't reviewed yet
  - If status is "pending_admin_review": Show warehouse notes + waiting for admin
  - If status is "approved" or "rejected": Show final decision + reason/notes

#### 2. WAREHOUSE User Dashboard
- [ ] **Pending Review Queue**
  - GET `/requisitions/pending`
  - Show all requisitions waiting for warehouse acknowledgment
  - Display: RF number, requester name, department, date created, items count
  - Click to open detail + acknowledge form

- [ ] **Acknowledge Form**
  - Text area for `acknowledged_notes` (optional)
  - PATCH to `/requisitions/{rf_number}/acknowledge`
  - Show success message with status change to "pending_admin_review"
  - After acknowledge, remove from "Pending Review" list

- [ ] **My Acknowledged Requisitions**
  - Show history of what warehouse has already acknowledged
  - Status will be "pending_admin_review" (waiting for admin)

#### 3. ADMIN User Dashboard
- [ ] **Approval Queue**
  - GET `/requisitions/pending-admin-review`
  - Show all acknowledged requisitions waiting for admin approval
  - Display: RF number, requester name, warehouse acknowledger name, acknowledged notes
  - Items with quantities and costs
  - Click to open detail + approval form

- [ ] **Approval/Rejection Form**
  - Two action buttons: "Approve" or "Reject"
  - If Reject: show text area for `rejection_reason`
  - PATCH to `/requisitions/{rf_number}/approve`
  - Show success with final status

- [ ] **Approval History**
  - GET `/requisitions/approved` - Show all approved requisitions
  - Filter by status: approved, rejected
  - Shows approval date, decision maker, rejection reason if rejected

#### 4. WAREHOUSE & INVENTORY MANAGEMENT
- [ ] **Approved Requisitions View**
  - GET `/requisitions/approved`
  - Show all approved parts ready for ordering/procurement
  - Display: RF number, requester, warehouse acknowledger, items with quantities and costs
  - Sort by approval date (newest first)
  - Export or print functionality for PO creation

- [ ] **Inventory Tracking Dashboard**
  - GET `/requisitions/inventory`
  - Flat list view of all items from all requisitions
  - Columns: Item name, quantity, unit, supplier, unit cost, total cost, status, requester
  - Filter by: requisition status (pending, approved, rejected), item name, supplier
  - Useful for: inventory planning, supplier management, cost tracking
  - Color-code by requisition status:
    - Approved items → green (ready to order)
    - Pending/admin review → yellow (not yet confirmed)
    - Rejected → red/grayed out (cancelled)

### Shared Components Across All Roles

- [ ] **RF Number Display**
  - Format: RF-2026-001 (highlighted/badge style)

- [ ] **Status Badge**
  - pending → yellow/orange
  - pending_admin_review → blue
  - approved → green
  - rejected → red

- [ ] **Requisition Items Display**
  - Table or list showing: item name, quantity, unit, supplier, unit_cost, total_cost
  - Calculate/display total cost of requisition

- [ ] **Timeline/Status Flow Indicator**
  - Show current step in workflow
  - Visual indicator of warehouse acknowledgment and admin approval status

### API Integration Notes for Frontend

1. **Authentication**
   - Include JWT Bearer token in all requests
   - Token in header: `Authorization: Bearer <token>`

2. **Error Handling**
   - 400 Bad Request - Invalid data (check validation errors)
   - 403 Forbidden - User doesn't have permission for that action
   - 404 Not Found - RF number not found
   - 500 Server Error - Server issue

3. **Loading States**
   - Show loading spinner while POSTing new requisition
   - Show loading while fetching lists
   - Disable submit button during API calls

4. **Success Messages**
   - "Requisition RF-2026-001 created successfully"
   - "Requisition acknowledged and moved to admin review"
   - "Requisition approved successfully"
   - "Requisition rejected with reason: ..."

5. **Pagination** (Not yet implemented, add if needed)
   - For large lists, implement pagination on GET endpoints

6. **Search/Filter** (Not yet implemented, add if needed)
   - Filter by status, date range, requester name

---

## Database Migration Notes

- Migrations run automatically on app startup (`migrationsRun: true`)
- Two new tables created: `part_requisitions` and `requisition_items`
- CASCADE delete on requisition_items when requisition is deleted
- RF_number field has UNIQUE constraint

---

## Example Workflow End-to-End

### Step 1: IT User Creates Requisition
```bash
POST /requisitions
Body: {
  "requested_by_type": "it",
  "department": "IT Support",
  "items": [{
    "item_name": "Keyboard",
    "quantity": 3,
    "unit": "pcs",
    "supplier": "Tech Store"
  }]
}
Response: RF-2026-001, status: "pending"
```

### Step 2: Warehouse Reviews
```bash
GET /requisitions/pending  # Warehouse sees it
GET /requisitions/RF-2026-001  # Warehouse views details

PATCH /requisitions/RF-2026-001/acknowledge
Body: { "acknowledged_notes": "Available in stock" }
Response: status changed to "pending_admin_review"
```

### Step 3: Admin Approves
```bash
GET /requisitions/pending-admin-review  # Admin sees it

PATCH /requisitions/RF-2026-001/approve
Body: { "action": "approved" }
Response: status changed to "approved"
```

---

## Testing with cURL or Postman

### Create Requisition
```bash
curl -X POST http://localhost:3000/requisitions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "requested_by_type": "it",
    "department": "IT",
    "items": [{
      "item_name": "Monitor",
      "quantity": 1,
      "unit": "pcs"
    }]
  }'
```

### Get Pending (Warehouse)
```bash
curl -X GET http://localhost:3000/requisitions/pending \
  -H "Authorization: Bearer WAREHOUSE_TOKEN"
```

### Acknowledge
```bash
curl -X PATCH http://localhost:3000/requisitions/RF-2026-001/acknowledge \
  -H "Authorization: Bearer WAREHOUSE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"acknowledged_notes": "Ready to go"}'
```

### Approve
```bash
curl -X PATCH http://localhost:3000/requisitions/RF-2026-001/approve \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action": "approved"}'
```

### Get Approved Requisitions
```bash
curl -X GET http://localhost:3000/requisitions/approved \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get Inventory Tracking
```bash
curl -X GET http://localhost:3000/requisitions/inventory \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Summary

**Backend provides**:
- 9 REST endpoints for complete requisition lifecycle
  1. POST /requisitions - Create new requisition
  2. GET /requisitions/my-requisitions - My created requisitions
  3. GET /requisitions/pending - Warehouse review queue
  4. GET /requisitions/pending-admin-review - Admin approval queue
  5. GET /requisitions/:rf_number - Requisition detail view
  6. PATCH /requisitions/:rf_number/acknowledge - Warehouse review
  7. PATCH /requisitions/:rf_number/approve - Admin decision
  8. GET /requisitions/approved - All approved requisitions (NEW)
  9. GET /requisitions/inventory - Flat inventory list (NEW)
- 3-level approval workflow with status tracking
- Multi-item support per requisition
- Auto-incrementing RF numbers
- Role-based access control

**Frontend needs to build**:
- Requisition creation form (IT/WAREHOUSE)
- List views for each role's relevant requisitions
- Acknowledgment interface (WAREHOUSE)
- Approval/rejection interface (ADMIN)
- Detail view showing full requisition with items
- Status badges and workflow indicators
- Approved requisitions view (for procurement/ordering)
- Inventory tracking dashboard (for warehouse management)
