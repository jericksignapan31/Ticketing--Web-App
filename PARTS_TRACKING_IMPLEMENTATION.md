# Parts Tracking System - Implementation Guide for Frontend

## Overview
A complete parts/inventory tracking system has been implemented for IT tickets. IT staff can now request parts for repairs, track their status, and cannot complete a ticket until all parts are received.

---

## New Database Table: `ticket_parts`

### Table Structure
```
ticket_parts
├── part_id (UUID, Primary Key)
├── ticket_id (UUID, Foreign Key → ticket)
├── part_name (string) - Name of the part
├── quantity (number) - How many units needed
├── unit_cost (decimal) - Cost per unit
├── total_cost (decimal) - Auto-calculated (quantity × unit_cost)
├── supplier (string) - Where to buy
├── status (string) - pending, ordered, received
├── requested_date (timestamp) - When requested
├── received_date (timestamp) - When received
├── notes (text) - Additional information
├── created_at (timestamp)
├── updated_at (timestamp)
```

### Relationships
- **One Ticket → Many Parts** (1:N)
- When a ticket is deleted, all its parts are automatically deleted (CASCADE)

---

## New API Endpoints

### 1. **Get All Parts for a Ticket**
```
GET /tickets/:ticket_id/parts
```

**Response:**
```json
[
  {
    "part_id": "abc-123-def-456",
    "ticket_id": "ticket-789",
    "part_name": "Keyboard",
    "quantity": 2,
    "unit_cost": 500,
    "total_cost": 1000,
    "supplier": "Lazada",
    "status": "pending",
    "requested_date": "2026-05-26T12:00:00Z",
    "received_date": null,
    "notes": "High quality mechanical",
    "created_at": "2026-05-26T12:00:00Z",
    "updated_at": "2026-05-26T12:00:00Z"
  },
  {
    "part_id": "xyz-789-abc-123",
    "ticket_id": "ticket-789",
    "part_name": "RAM 8GB",
    "quantity": 1,
    "unit_cost": 3000,
    "total_cost": 3000,
    "supplier": "Local Computer Store",
    "status": "received",
    "requested_date": "2026-05-26T12:00:00Z",
    "received_date": "2026-05-26T14:30:00Z",
    "notes": "DDR4 2666MHz",
    "created_at": "2026-05-26T12:00:00Z",
    "updated_at": "2026-05-26T14:30:00Z"
  }
]
```

---

### 2. **Request Parts for a Ticket**
```
POST /tickets/:ticket_id/parts
```

**Authentication:** Requires IT or ADMIN role

**Request Body:**
```json
{
  "part_name": "Keyboard",
  "quantity": 2,
  "unit_cost": 500,
  "supplier": "Lazada",
  "notes": "High quality mechanical keyboard"
}
```

**Response (201 Created):**
```json
{
  "part_id": "abc-123-def-456",
  "ticket_id": "ticket-789",
  "part_name": "Keyboard",
  "quantity": 2,
  "unit_cost": 500,
  "total_cost": 1000,
  "supplier": "Lazada",
  "status": "pending",
  "requested_date": "2026-05-26T12:05:00Z",
  "received_date": null,
  "notes": "High quality mechanical keyboard",
  "created_at": "2026-05-26T12:05:00Z",
  "updated_at": "2026-05-26T12:05:00Z"
}
```

**Validation:**
- All fields except `notes` are required
- Quantity must be > 0
- Unit cost must be > 0
- Total cost is auto-calculated

---

### 3. **Update Part Status**
```
PATCH /tickets/:ticket_id/parts/:part_id
```

**Authentication:** Requires IT or ADMIN role

**Request Body:**
```json
{
  "status": "received",
  "notes": "Parts arrived and verified"
}
```

**Possible Status Values:**
- `pending` - Waiting to order
- `ordered` - Ordered but not yet received
- `received` - Parts have arrived

**Response (200 OK):**
```json
{
  "part_id": "abc-123-def-456",
  "ticket_id": "ticket-789",
  "part_name": "Keyboard",
  "quantity": 2,
  "unit_cost": 500,
  "total_cost": 1000,
  "supplier": "Lazada",
  "status": "received",
  "requested_date": "2026-05-26T12:05:00Z",
  "received_date": "2026-05-26T16:30:00Z",
  "notes": "Parts arrived and verified",
  "created_at": "2026-05-26T12:05:00Z",
  "updated_at": "2026-05-26T16:30:00Z"
}
```

**Auto-Updates:**
- When status = "received", `received_date` is automatically set to current timestamp

---

### 4. **Delete a Part Request**
```
DELETE /tickets/:ticket_id/parts/:part_id
```

**Authentication:** Requires IT or ADMIN role

**Response (200 OK):**
```
Success - Part request deleted
```

**Error (404):**
```json
{
  "statusCode": 404,
  "message": "Part with ID abc-123 not found"
}
```

---

## Updated Ticket Completion Endpoint

### Complete Ticket with Parts Validation
```
PATCH /tickets/:ticket_id/complete
```

**NEW VALIDATION:**
- Cannot complete a ticket if any parts are still pending or not received
- Error message will list how many parts are pending

**Error Response (400):**
```json
{
  "statusCode": 400,
  "message": "Cannot complete ticket. 2 part(s) still pending or not received. Please confirm all parts are received first using /tickets/:id/parts/:part_id endpoint."
}
```

**Success Response (200):**
```json
{
  "ticket_id": "ticket-789",
  "status": "resolved",
  "resolved_at": "2026-05-26T17:00:00Z",
  "unit_status": "working",
  "observation": "...",
  "action_taken": "...",
  ...
}
```

---

## Complete Workflow Example

### Scenario: IT Staff Repairs a Laptop

**Step 1: Start Working**
```
PATCH /tickets/ticket-123/start-work
{
  "notes": "Starting diagnostics"
}
→ Status changes to "in_progress"
```

**Step 2: Find Parts Needed**
```
PATCH /tickets/ticket-123/parts
{
  "part_name": "Keyboard",
  "quantity": 1,
  "unit_cost": 1500,
  "supplier": "Lazada"
}
→ Status = "pending"
```

**Step 3: Check Ordered Status**
```
PATCH /tickets/ticket-123/parts/part-abc/status
{
  "status": "ordered"
}
```

**Step 4: Parts Received**
```
PATCH /tickets/ticket-123/parts/part-abc/status
{
  "status": "received",
  "notes": "Received and tested"
}
→ received_date is auto-set
```

**Step 5: Complete Ticket (After All Parts Received)**
```
PATCH /tickets/ticket-123/complete
{
  "unit_status": "working",
  "observation": "Keyboard was broken",
  "action_taken": "Replaced keyboard"
}
→ Only works if all parts status = "received"
→ Status changes to "resolved"
```

---

## Frontend Implementation Checklist

### Ticket Detail View Updates
- [ ] Display parts list/table for the ticket
- [ ] Show total parts cost
- [ ] Show parts status indicators (pending/ordered/received)

### Parts Management UI
- [ ] Add "Request Parts" button/form
- [ ] Form fields: part_name, quantity, unit_cost, supplier, notes
- [ ] Auto-calculate total_cost on submit
- [ ] Display validation errors

### Parts Status Management
- [ ] Show parts list with status dropdown
- [ ] Ability to change status: pending → ordered → received
- [ ] Add/update notes field
- [ ] Delete part button (with confirmation)

### Completion Flow Changes
- [ ] Before allowing completion, check if parts are pending
- [ ] Show error: "Cannot complete - X parts pending"
- [ ] Only enable complete button if all parts received
- [ ] Show parts summary before completion

### Dashboard/Reports
- [ ] Add filter: "Tickets Waiting for Parts"
- [ ] Show total parts cost per ticket
- [ ] Show pending parts across all tickets

---

## Error Handling

### Common Errors

**1. Cannot Complete Due to Pending Parts**
```
400 Bad Request
"Cannot complete ticket. 2 part(s) still pending or not received."
```

**2. Part Not Found**
```
404 Not Found
"Part with ID xyz-789 not found"
```

**3. Unauthorized (Not IT Staff)**
```
403 Forbidden
"Insufficient permissions"
```

**4. Invalid Part Data**
```
400 Bad Request
"Validation failed: quantity must be positive"
```

---

## Key Business Rules

✅ **Parts Tracking Rules:**
1. Only IT staff can request parts
2. Cannot complete ticket until all parts are received
3. Parts are automatically deleted when ticket is deleted
4. Total cost auto-calculates from quantity × unit_cost
5. received_date auto-sets when status changes to "received"

✅ **Status Flow:**
```
pending → ordered → received
```

---

## Ticket Response Now Includes Parts

When you GET `/tickets/:id`, the response now includes:

```json
{
  "ticket_id": "ticket-789",
  "status": "in_progress",
  "parts": [
    {
      "part_id": "part-123",
      "part_name": "Keyboard",
      "quantity": 1,
      "unit_cost": 1500,
      "total_cost": 1500,
      "supplier": "Lazada",
      "status": "pending",
      "requested_date": "2026-05-26T12:00:00Z",
      "received_date": null,
      "notes": "Mechanical keyboard"
    }
  ],
  ...
}
```

---

## Database Changes

### New Table
```sql
CREATE TABLE ticket_parts (
  part_id UUID PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES ticket(ticket_id) ON DELETE CASCADE,
  part_name VARCHAR(255) NOT NULL,
  quantity INT NOT NULL,
  unit_cost DECIMAL(10,2) NOT NULL,
  total_cost DECIMAL(10,2) NOT NULL,
  supplier VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  requested_date TIMESTAMP,
  received_date TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Removed from Ticket Table
- `parts_needed` column - Now stored in TicketParts table
- `parts_cost` column - Now calculated in TicketParts
- `parts_supplier` column - Now in TicketParts
- `parts_status` column - Now in TicketParts
- `parts_received_at` column - Now in TicketParts

---

## Deployment Status

✅ All changes deployed to production (Render.com)
- Git commit: `a20ccb1`
- Parts tracking system live

---

## Questions for Frontend?

1. **How should parts cost be displayed?** (per unit or total?)
2. **Should there be a parts summary on dashboard?**
3. **Need email notification when parts received?**
4. **Should parts history be tracked?**
5. **Any specific parts categories needed?** (Hardware, Software, Cables, etc.)

