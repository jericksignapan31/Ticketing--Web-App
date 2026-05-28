# Ticket Statuses - Complete Reference

## All Ticket Statuses

| Status | Description | Who Can See | Next Status |
|--------|-------------|-------------|-------------|
| **pending_approval** | Ticket just created, waiting for supervisor approval | Ticket creator, Supervisor, Admin | approved or rejected |
| **approved** | Supervisor approved the ticket | All | assigned |
| **assigned** | Ticket assigned to IT staff | All | in_progress |
| **in_progress** | IT staff started working on the ticket | All | resolved or hold |
| **hold** | Waiting for parts to arrive (need_buy_parts selected) | All | resolved |
| **resolved** | Ticket completed | All | (end state) |
| **rejected** | Supervisor rejected the ticket | All | (end state) |

---

## Ticket Lifecycle Flow

```
┌─────────────────────┐
│  pending_approval   │ ← Ticket created
└──────────┬──────────┘
           │
     ┌─────┴─────┐
     │           │
     ↓           ↓
┌─────────┐  ┌──────────┐
│approved │  │ rejected │ (END)
└────┬────┘  └──────────┘
     │
     ↓
┌──────────┐
│ assigned │
└────┬─────┘
     │
     ↓
┌──────────────┐
│ in_progress  │
└────┬─────────┘
     │
  ┌──┴──┐
  │     │
  ↓     ↓
┌────┐ ┌────┐
│hold│ │res-│
│    │ │olved│ (END)
└────┘ └─────┘
  │
  └─→ resolved (END)
```

---

## Status Changes & Actions

### 1. **pending_approval** → **approved**
```
Action: Supervisor approves ticket
Endpoint: PATCH /tickets/{id}/approve
User Role: Supervisor, Admin
```

### 2. **pending_approval** → **rejected**
```
Action: Supervisor rejects ticket
Endpoint: PATCH /tickets/{id}/reject
User Role: Supervisor, Admin
```

### 3. **approved** → **assigned**
```
Action: Supervisor assigns ticket to IT staff
Endpoint: PATCH /tickets/{id}/assign
User Role: Supervisor, Admin
Requires: assigned_to (IT staff ID)
```

### 4. **assigned** → **in_progress**
```
Action: IT staff starts work
Endpoint: PATCH /tickets/{id}/start-work
User Role: IT Staff, Admin
```

### 5. **in_progress** → **hold**
```
Action: IT completes with "need_buy_parts"
Endpoint: PATCH /tickets/{id}/complete
User Role: IT Staff, Admin
Request Body: { unit_status: "need_buy_parts", ... }
Reason: Parts needed before completion
```

### 6. **in_progress** → **resolved**
```
Action: IT completes with working/not_working/partially_working
Endpoint: PATCH /tickets/{id}/complete
User Role: IT Staff, Admin
Request Body: { unit_status: "working", ... }
Reason: No parts needed, work complete
```

### 7. **hold** → **resolved**
```
Action: IT marks ticket resolved after parts arrive
Endpoint: PATCH /tickets/{id}/complete
User Role: IT Staff, Admin
Request Body: { unit_status: "working", ... }
Reason: Parts installed, work complete
```

### 8. **hold** → **hold** (remains)
```
Action: IT re-marks as need_buy_parts
Endpoint: PATCH /tickets/{id}/complete
User Role: IT Staff, Admin
Request Body: { unit_status: "need_buy_parts", ... }
Reason: More parts needed
```

---

## API Endpoints to Get Tickets by Status

### Get All Pending Approval
```
GET /tickets/pending
Returns: All tickets with status = pending_approval
Filter: By department (Employees/Supervisors see own dept only)
```

### Get All Approved
```
GET /tickets/approved
Returns: All tickets with status = approved
Filter: By department
```

### Get All Assigned
```
GET /tickets/assigned
Returns: All tickets with status = assigned
Filter: By department
```

### Get All In Progress
```
GET /tickets/in-progress
Returns: All tickets with status = in_progress
Filter: By department
```

### Get All On Hold (Waiting for Parts)
```
GET /tickets/hold
Returns: All tickets with status = hold
Filter: By department
```

### Get All Resolved
```
GET /tickets/completed
Returns: All tickets with status = resolved
Filter: By department
```

### Get All Rejected
```
GET /tickets/rejected
Returns: All tickets with status = rejected
Filter: By department
```

---

## User Role & Status Permissions

### Employee
- ✅ Can see tickets: pending_approval, approved, assigned, in_progress, hold, resolved, rejected
- ✅ Filter: See only own department tickets
- ❌ Cannot change status (read-only)

### Supervisor
- ✅ Can see all tickets in their department
- ✅ Can change status:
  - pending_approval → approved (approve)
  - pending_approval → rejected (reject)
  - approved → assigned (assign to IT)
- ✅ Can see details

### IT Staff
- ✅ Can see all tickets
- ✅ Can change status:
  - assigned → in_progress (start work)
  - in_progress → hold (need parts)
  - in_progress → resolved (complete)
  - hold → resolved (after parts arrive)
  - hold → hold (re-request parts)
- ✅ Can request/track parts

### Admin
- ✅ Can see all tickets
- ✅ Can do everything (all status changes)
- ✅ Can override any operation

---

## Examples

### Example 1: Normal Ticket (No Parts)
```
1. User creates ticket
   Status: pending_approval

2. Supervisor approves
   Status: approved
   
3. Supervisor assigns to John (IT)
   Status: assigned

4. John starts work
   Status: in_progress

5. John completes (working)
   Status: resolved ✓ DONE
```

### Example 2: Ticket with Parts
```
1. User creates ticket
   Status: pending_approval

2. Supervisor approves
   Status: approved

3. Supervisor assigns to Jane (IT)
   Status: assigned

4. Jane starts work
   Status: in_progress

5. Jane completes with "need_buy_parts"
   Status: hold ← WAITING FOR PARTS

6. Jane requests parts:
   - Part: Keyboard
   - Status: pending → ordered → received

7. Parts arrive, Jane completes again
   Status: resolved ✓ DONE
```

### Example 3: Rejected Ticket
```
1. User creates ticket
   Status: pending_approval

2. Supervisor rejects
   Status: rejected ✓ DONE (no more changes)
```

---

## Database Columns Related to Status

| Column | Type | Meaning |
|--------|------|---------|
| `status` | varchar | Current workflow status (pending_approval, approved, assigned, in_progress, hold, resolved, rejected) |
| `approval_status` | varchar | Approval workflow (pending, approved, rejected) |
| `unit_status` | varchar | Final unit condition (working, not_working, partially_working, need_buy_parts) |
| `created_at` | timestamp | When ticket was created |
| `resolved_at` | timestamp | When ticket was marked resolved (null if in_progress/hold) |
| `started_at` | timestamp | When work started |
| `assigned_at` | timestamp | When assigned to IT |
| `approved_at` | timestamp | When supervisor approved |

---

## Status Badges (Frontend Display)

```
pending_approval → 🟡 Yellow badge: "Pending Approval"
approved → 🔵 Blue badge: "Approved"
assigned → 🔵 Blue badge: "Assigned"
in_progress → 🟣 Purple badge: "In Progress"
hold → 🟠 Orange badge: "On Hold"
resolved → 🟢 Green badge: "Resolved"
rejected → 🔴 Red badge: "Rejected"
```

---

## Current Implementation Status

✅ All 7 statuses implemented in backend
✅ All status transitions working
✅ Department filtering working
✅ Parts tracking integrated with "hold" status
✅ API endpoints tested and working
✅ Database migrations applied

---

## Quick Reference

**To get tickets by status:**
```
GET /tickets/pending           → pending_approval
GET /tickets/approved          → approved
GET /tickets/assigned          → assigned
GET /tickets/in-progress       → in_progress
GET /tickets/hold              → hold (waiting for parts)
GET /tickets/completed         → resolved
GET /tickets/rejected          → rejected
```

**To change status:**
```
PATCH /tickets/{id}/approve          → pending_approval → approved
PATCH /tickets/{id}/reject           → pending_approval → rejected
PATCH /tickets/{id}/assign           → approved → assigned
PATCH /tickets/{id}/start-work       → assigned → in_progress
PATCH /tickets/{id}/complete         → in_progress/hold → hold/resolved
```
