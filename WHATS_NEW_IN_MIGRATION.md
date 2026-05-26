# What's New in the Migration 🆕

## Overview
Created a comprehensive **Parts Tracking System** for tickets by:
1. Adding 5 new columns to `ticket` table
2. Creating new `ticket_parts` table for part requests

---

## 1. Ticket Table - New Columns (5 Added)

### Purpose: Store work details when completing a ticket

| Column | Type | Nullable | Purpose |
|--------|------|----------|---------|
| `unit_status` | varchar(50) | Yes | Final status: working, not_working, partially_working, **need_buy_parts** |
| `observation` | text | Yes | What was observed/found about the issue |
| `action_taken` | text | Yes | What was done to fix it |
| `recommendation` | text | Yes | Suggestions for future prevention |
| `resolution_notes` | text | Yes | Additional notes about resolution |

**Example data**:
```sql
unit_status: "need_buy_parts"
observation: "Keyboard completely broken"
action_taken: "Tested all keys, no response"
recommendation: "Replace with mechanical keyboard"
resolution_notes: "Waiting for parts approval"
```

---

## 2. New Table: `ticket_parts` 📦

### Purpose: Track part requests and delivery status per ticket

### Columns:

| Column | Type | Key | Default | Purpose |
|--------|------|-----|---------|---------|
| `part_id` | uuid | PRIMARY | auto-generated | Unique part request ID |
| `ticket_id` | uuid | FOREIGN (CASCADE) | - | Links to ticket |
| `part_name` | varchar(255) | - | - | Name of part (e.g., "Keyboard") |
| `quantity` | integer | - | - | How many needed |
| `unit_cost` | numeric(10,2) | - | - | Cost per unit (e.g., 1500.00) |
| `total_cost` | numeric(10,2) | - | - | Auto-calculated: quantity × unit_cost |
| `supplier` | varchar(255) | - | - | Where to buy from (e.g., "Lazada") |
| `status` | varchar(50) | - | 'pending' | Track state: pending → ordered → received |
| `requested_date` | timestamp | - | - | When part was requested |
| `received_date` | timestamp | - | - | When part arrived |
| `notes` | text | - | - | Additional notes |
| `created_at` | timestamp | - | CURRENT_TIMESTAMP | When record created |
| `updated_at` | timestamp | - | CURRENT_TIMESTAMP | Last update time |

### Constraints:
- **Foreign Key**: `ticket_id` → `ticket.ticket_id` with **CASCADE DELETE**
  - If ticket deleted, all its parts deleted too

---

## Example Data Flow

### Before (No Parts Tracking):
```
Ticket created → In progress → Complete → Resolved (Done)
                                ✗ No way to track parts needed
```

### After (With Parts Tracking):
```
Ticket created
  ↓
In progress
  ↓
Complete button → Modal with 5 fields
  ↓
Select "need_buy_parts"
  ↓
Status: waiting_for_parts (NOT resolved yet)
  ↓
Create parts request:
  - Part Name: Keyboard
  - Qty: 1
  - Unit Cost: 1500
  - Supplier: Local Store
  ↓
ticket_parts table entry created:
  part_id: uuid-123
  part_name: Keyboard
  quantity: 1
  unit_cost: 1500.00
  total_cost: 1500.00 (auto-calculated)
  status: pending
  ↓
Update part status: pending → ordered → received
  ↓
All parts received
  ↓
Resume work or mark complete
```

---

## Database Structure

### Ticket Table (Updated):
```
ticket
├── ticket_id (existing)
├── title (existing)
├── description (existing)
├── ... (other existing fields)
├── unit_status ← NEW
├── observation ← NEW
├── action_taken ← NEW
├── recommendation ← NEW
└── resolution_notes ← NEW
```

### Ticket Parts Table (New):
```
ticket_parts ← NEW TABLE
├── part_id (PK)
├── ticket_id (FK → ticket)
├── part_name
├── quantity
├── unit_cost
├── total_cost
├── supplier
├── status (pending/ordered/received)
├── requested_date
├── received_date
├── notes
├── created_at
└── updated_at
```

---

## Idempotent Safety

The migration **safely handles re-runs**:

✅ Checks if columns exist before adding:
```typescript
if (!unitStatusColumn) {
  // Only add if not already there
  await queryRunner.addColumn(...)
}
```

✅ Checks if table exists before creating:
```typescript
if (!ticketPartsTable) {
  // Only create if not already there
  await queryRunner.createTable(...)
}
```

✅ **Rollback support** (down method):
- Drops `ticket_parts` table
- Removes 5 columns from `ticket` table
- Can revert changes if needed

---

## When Migration Runs

**Automatic on app startup** (configured in TypeORM):
```
npm run start:dev
  ↓
TypeORM initializes
  ↓
Checks migrations table
  ↓
Finds 1726050000000-AddTicketPartsTracking migration
  ↓
Migration not run yet
  ↓
Executes migration
  ↓
Updates database schema ✅
  ↓
App starts successfully
```

---

## Impact Summary

| What Changed | Before | After |
|--------------|--------|-------|
| **Ticket Completion** | No details stored | 5 fields captured |
| **Parts Tracking** | Not possible | Full workflow supported |
| **Part Requests** | N/A | Can create, update, delete |
| **Part Status** | N/A | Track pending→ordered→received |
| **Ticket Status** | resolved only | Can be waiting_for_parts |
| **Tables** | 1 | 2 (added ticket_parts) |
| **Columns** | Previous | Previous + 5 new |

---

## Ready to Go

✅ Migration file created  
✅ Timestamp format corrected (13-digit)  
✅ All code compiled  
✅ Safe to run on startup  

When you run `npm run start:dev`, everything will be set up automatically! 🚀
