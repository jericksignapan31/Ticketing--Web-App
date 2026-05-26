# Parts Tracking System - Implementation Guide for Frontend

## Overview
A complete parts/inventory tracking system has been implemented for IT tickets. When IT staff encounters a ticket that needs replacement parts, they can mark it as "need_buy_parts" during completion, which prevents the ticket from being marked as resolved and instead sets its status to "waiting_for_parts". Parts can then be tracked through their lifecycle.

---

## Ticket Status Flow with Parts

```
pending_approval → approved → assigned → in_progress
                                            ↓
                                    (IT completes ticket)
                                            ↓
                    ┌─────────────────────────────────┐
                    │    Complete Modal Appears       │
                    │  Choose Unit Status:            │
                    │  • working                      │
                    │  • not_working                  │
                    │  • partially_working            │
                    │  • need_buy_parts ← PARTS FLOW  │
                    └─────────────────────────────────┘
                                    ↓
                ┌───────────────────┴──────────────────┐
                ↓                                      ↓
        [working/not_working/       [need_buy_parts]
         partially_working]
                ↓                      ↓
            resolved          waiting_for_parts
                               (Request parts here)
                                    ↓
                          (Parts marked received)
                                    ↓
                          Resume work or mark as
                          working → resolved
```

---

## Complete Ticket Endpoint - Updated

### Mark Ticket as Complete
```
PATCH /tickets/:ticket_id/complete
```

**Authentication:** Requires IT or ADMIN role

**Request Body (Modal Form):**
```json
{
  "unit_status": "need_buy_parts",
  "observation": "Keyboard completely broken, need replacement",
  "action_taken": "Diagnostics completed - keyboard not repairable",
  "recommendation": "Purchase new mechanical keyboard",
  "resolution_notes": "Waiting for parts approval"
}
```

**Unit Status Options:**
- `working` → Ticket status: **resolved**
- `not_working` → Ticket status: **resolved**
- `partially_working` → Ticket status: **resolved**
- `need_buy_parts` → Ticket status: **waiting_for_parts** ⚠️

**Response with "need_buy_parts":**
```json
{
  "ticket_id": "ticket-789",
  "status": "waiting_for_parts",
  "resolved_at": null,
  "unit_status": "need_buy_parts",
  "observation": "Keyboard completely broken, need replacement",
  "action_taken": "Diagnostics completed - keyboard not repairable",
  "recommendation": "Purchase new mechanical keyboard",
  "resolution_notes": "Waiting for parts approval",
  "created_at": "2026-05-26T10:00:00Z",
  "updated_at": "2026-05-26T15:30:00Z"
}
```

**Response with other unit status (e.g., "working"):**
```json
{
  "ticket_id": "ticket-789",
  "status": "resolved",
  "resolved_at": "2026-05-26T15:30:00Z",
  "unit_status": "working",
  "observation": "Fixed keyboard driver issue",
  "action_taken": "Reinstalled drivers",
  "recommendation": "Schedule monthly maintenance",
  "resolution_notes": "Ticket resolved successfully",
  "created_at": "2026-05-26T10:00:00Z",
  "updated_at": "2026-05-26T15:30:00Z"
}
```

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

### 0. **Complete Ticket with Unit Status Modal** (UPDATED)
```
PATCH /tickets/:ticket_id/complete
```

**Authentication:** Requires IT or ADMIN role

**NEW: Unit Status "need_buy_parts" Option**

When IT staff selects "need_buy_parts" in the completion modal:
- Ticket does **NOT** get marked as resolved
- Ticket status becomes **"waiting_for_parts"** instead
- This allows requesting and tracking parts without completing the ticket

**Response (Normal completion - unit_status = "working"):**
```json
{
  "ticket_id": "ticket-789",
  "status": "resolved",
  "resolved_at": "2026-05-26T15:30:00Z",
  "unit_status": "working",
  "observation": "...",
  "action_taken": "...",
  ...
}
```

**Response (Parts needed - unit_status = "need_buy_parts"):**
```json
{
  "ticket_id": "ticket-789",
  "status": "waiting_for_parts",
  "resolved_at": null,
  "unit_status": "need_buy_parts",
  "observation": "Keyboard broken",
  "action_taken": "Diagnostics completed",
  ...
}
```

---

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

---

## Complete Workflow Example

### Scenario: IT Staff Repairs a Laptop (Needs Parts)

**Step 1: Start Working**
```
PATCH /tickets/ticket-123/start-work
{
  "notes": "Starting diagnostics"
}
→ Status changes to "in_progress"
```

**Step 2: Diagnose Issue (During Work)**
```
During repair process, IT realizes keyboard is broken and needs replacement
```

**Step 3: Click "Complete" Button - Modal Appears**
```
User fills modal with:
- Unit Status: "need_buy_parts" ← SELECT THIS
- Observation: "Keyboard completely broken"
- Action Taken: "Diagnostics completed"
- Recommendation: "Purchase mechanical keyboard"
- Additional Notes: "Waiting for approval"
```

**Step 4: Submit Modal - Ticket Status Changes**
```
PATCH /tickets/ticket-123/complete
{
  "unit_status": "need_buy_parts",
  "observation": "Keyboard completely broken",
  "action_taken": "Diagnostics completed",
  "recommendation": "Purchase mechanical keyboard",
  "resolution_notes": "Waiting for approval"
}
→ Status changes to "waiting_for_parts" (NOT resolved)
→ resolved_at is NOT set
```

**Step 5: Request Parts**
```
POST /tickets/ticket-123/parts
{
  "part_name": "Mechanical Keyboard",
  "quantity": 1,
  "unit_cost": 1500,
  "supplier": "Local Computer Store",
  "notes": "RGB backlit"
}
→ Part created with status "pending"
```

**Step 6: Update Part Status as It Progresses**
```
PATCH /tickets/ticket-123/parts/part-abc
{
  "status": "ordered",
  "notes": "Ordered from supplier"
}
```

**Step 7: Parts Received**
```
PATCH /tickets/ticket-123/parts/part-abc
{
  "status": "received",
  "notes": "Parts received and verified"
}
→ received_date is auto-set
```

**Step 8: After Parts Received - Resume Work or Mark Complete**
Option A: Go back to in_progress and continue work
```
PATCH /tickets/ticket-123/start-work
{
  "notes": "Resuming work - parts arrived"
}
→ Status back to "in_progress"
```

Option B: Or mark as completed again (this time with final unit status)
```
PATCH /tickets/ticket-123/complete
{
  "unit_status": "working",
  "observation": "Replaced broken keyboard",
  "action_taken": "Keyboard replacement completed",
  "recommendation": "Parts will last 3 years",
  "resolution_notes": "Ticket resolved successfully"
}
→ Status changes to "resolved"
→ resolved_at is set
```

---

### Scenario: IT Staff Repairs a Laptop (No Parts Needed)

**Step 1: Start Working**
```
PATCH /tickets/ticket-456/start-work
{
  "notes": "Starting repair"
}
→ Status = "in_progress"
```

**Step 2: Complete Repair**
```
Issue was just software - fixed driver problem
```

**Step 3: Click "Complete" Button - Modal Appears with Fields**

**Step 4: Submit Modal (NO parts needed)**
```
PATCH /tickets/ticket-456/complete
{
  "unit_status": "working",
  "observation": "Driver corruption detected",
  "action_taken": "Reinstalled network drivers",
  "recommendation": "Update drivers monthly",
  "resolution_notes": "Ticket resolved successfully"
}
→ Status changes to "resolved"
→ resolved_at is set immediately
```

---

## Frontend Implementation Checklist

### Ticket Detail View Updates
- [ ] Only IT staff can see "Complete" button
- [ ] "Complete" button only enabled when ticket is "in_progress"

### Complete Ticket Modal Form
- [ ] Show modal with 5 required fields:
  - [ ] **Unit Status** (dropdown): working, not_working, partially_working, need_buy_parts
  - [ ] **Observation** (text area): What was observed
  - [ ] **Action Taken** (text area): What was done to fix
  - [ ] **Recommendation** (text area - optional): Suggestions for future
  - [ ] **Additional Notes** (text area - optional): Any other notes
- [ ] Validation: Unit Status, Observation, Action Taken are required
- [ ] When Unit Status = "need_buy_parts", show special note: "This will mark ticket as 'waiting for parts' - you can request parts after submitting"

### Smart Unit Status Handling
- [ ] If Unit Status = "need_buy_parts":
  - [ ] Submit endpoint → ticket status becomes "waiting_for_parts"
  - [ ] Show success: "Ticket waiting for parts. You can now request parts."
  - [ ] Display parts management interface
- [ ] If Unit Status = working/not_working/partially_working:
  - [ ] Submit endpoint → ticket status becomes "resolved"
  - [ ] Show success: "Ticket completed successfully"
  - [ ] Hide parts management interface

### Parts Management Interface (Only when status = "waiting_for_parts")
- [ ] Display current parts list (if any)
- [ ] Add "Request Parts" button/form with fields:
  - [ ] part_name (required)
  - [ ] quantity (required, number > 0)
  - [ ] unit_cost (required, number > 0)
  - [ ] supplier (required)
  - [ ] notes (optional)
- [ ] Show auto-calculated total_cost
- [ ] Parts list with columns: part_name, quantity, unit_cost, total_cost, status, actions
- [ ] Status dropdown for each part: pending → ordered → received
- [ ] Delete part button (with confirmation)
- [ ] When all parts status = "received", show info: "All parts received. You can now resume work or mark as complete."

### Ticket Status Display
- [ ] Show current status clearly:
  - [ ] "resolved" - ticket is done
  - [ ] "waiting_for_parts" - ticket pending parts, show parts section
  - [ ] "in_progress" - show complete button
- [ ] Add badge/indicator for "waiting_for_parts" status

### Dashboard/Reports (Optional Enhancements)
- [ ] Filter: "Waiting for Parts" (status = waiting_for_parts)
- [ ] Show parts cost summary
- [ ] Show pending parts count

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

✅ **Ticket Completion Rules:**
1. Only IT staff can mark tickets as complete
2. When completing, IT must select a unit status (working, not_working, partially_working, or need_buy_parts)
3. If "need_buy_parts" is selected:
   - Ticket status becomes "waiting_for_parts" (NOT resolved)
   - resolved_at date is NOT set
   - IT can then request parts through parts endpoints
4. If any other unit status is selected:
   - Ticket status becomes "resolved"
   - resolved_at date is set to current time
   - No parts validation needed

✅ **Parts Tracking Rules:**
1. Parts can only be requested for tickets in "waiting_for_parts" status
2. Only IT staff can manage parts
3. Each part has status: pending → ordered → received
4. received_date auto-sets when status changes to "received"
5. Parts are automatically deleted when ticket is deleted

✅ **Status Flow:**
```
pending_approval
    ↓
approved
    ↓
assigned
    ↓
in_progress
    ↓ (IT clicks Complete)
waiting_for_parts (if need_buy_parts) OR resolved (if working/not_working/etc)
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

