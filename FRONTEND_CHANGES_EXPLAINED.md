# Backend Changes Summary - Frontend Implementation Guide

## Overview of Changes

We've implemented a complete **Parts Tracking System** for IT tickets. This allows IT staff to track when repairs need replacement parts, request those parts, and monitor their delivery status before marking a ticket as complete.

---

## Key Change: "Complete Ticket" Modal Now Has 5 Fields

Previously: IT just clicked "Complete" and ticket was done.

**Now**: When IT clicks "Complete", a modal appears with these fields:

| Field | Type | Required | Purpose |
|-------|------|----------|---------|
| **Unit Status** | Dropdown | ✅ | Final status: working, not_working, partially_working, or **need_buy_parts** |
| **Observation** | Text Area | ✅ | What was found/observed about the issue |
| **Action Taken** | Text Area | ✅ | What was done to fix it |
| **Recommendation** | Text Area | ❌ | Suggestions for future prevention |
| **Additional Notes** | Text Area | ❌ | Any other notes |

### The Modal Options (Dropdown):
```
Unit Status:
├─ working (ticket → resolved immediately)
├─ not_working (ticket → resolved immediately)  
├─ partially_working (ticket → resolved immediately)
└─ need_buy_parts ← NEW! (ticket → waiting_for_parts, NOT resolved)
```

---

## The Critical New Feature: "need_buy_parts"

When IT staff selects **"need_buy_parts"**:

### What Happens:
- ✅ Modal fields are saved (observation, action taken, etc.)
- ✅ Ticket status becomes **"waiting_for_parts"** (NOT "resolved")
- ❌ Ticket is NOT marked as complete
- ✅ A parts management interface appears
- ✅ IT can now request parts

### Visual Flow:
```
Ticket in "in_progress"
         ↓
IT clicks "Complete"
         ↓
Modal appears with 5 fields
         ↓
IT selects "need_buy_parts"
         ↓
Ticket status: "waiting_for_parts" ← Shows parts UI
         ↓
IT requests parts (keyboard, RAM, etc.)
         ↓
Parts tracked: pending → ordered → received
         ↓
All parts received
         ↓
IT can resume work OR mark complete again
```

---

## Example: Laptop with Broken Keyboard

### Step 1: IT Starting Work
```
Ticket Status: in_progress
Action: Start diagnostics
```

### Step 2: IT Discovers Problem
```
After testing: Keyboard is broken, not repairable
Decision: Need to buy replacement keyboard
```

### Step 3: IT Clicks "Complete" Button
Modal popup appears with form fields

### Step 4: IT Fills Out Modal
```json
{
  "unit_status": "need_buy_parts",
  "observation": "Keyboard completely non-responsive",
  "action_taken": "Tested all keys, no response",
  "recommendation": "Replace with mechanical keyboard",
  "resolution_notes": "Waiting for parts approval"
}
```

### Step 5: Submit → Ticket Status Changes
```
Ticket Status: "waiting_for_parts" ← NEW STATUS
```

### Step 6: IT Requests Parts
```
Modal shows: "Request Parts" form
Fields: Part Name, Quantity, Unit Cost, Supplier, Notes
Example:
- Part Name: Mechanical Keyboard
- Quantity: 1
- Unit Cost: ₱1,500
- Supplier: Local Computer Store
- Notes: RGB backlit preferred
```

### Step 7: Parts Arrive
```
Parts Status: pending → ordered → received
When marked "received": received_date auto-fills
```

### Step 8: Complete the Repair
Option A: Resume work
```
Click "Start Work" again
Ticket Status: in_progress
```

Option B: Finish immediately and mark complete
```
Click "Complete" again
Select unit_status: "working"
Ticket Status: resolved
```

---

## API Endpoints Reference

### 1. **Complete Ticket** (UPDATED)
```
PATCH /tickets/{id}/complete
```
- Request: unit_status, observation, action_taken, recommendation, resolution_notes
- Response: Updated ticket with new status

### 2. **Get Parts for Ticket**
```
GET /tickets/{id}/parts
```
- Response: Array of parts with their status

### 3. **Request New Parts**
```
POST /tickets/{id}/parts
```
- Request: part_name, quantity, unit_cost, supplier, notes
- Response: Created part with auto-calculated total_cost

### 4. **Update Part Status**
```
PATCH /tickets/{id}/parts/{part_id}
```
- Request: status (pending/ordered/received), notes
- Response: Updated part with received_date if marked "received"

### 5. **Delete Part**
```
DELETE /tickets/{id}/parts/{part_id}
```
- Response: Success message

---

## Frontend UI Changes Needed

### 1. Complete Ticket Modal
```
┌─────────────────────────────────────────────┐
│         Complete Ticket                     │
├─────────────────────────────────────────────┤
│                                             │
│  Unit Status: [Dropdown ▼]                 │
│   - working                                 │
│   - not_working                             │
│   - partially_working                       │
│   - need_buy_parts                          │
│                                             │
│  Observation: [Text Area]                  │
│                                             │
│  Action Taken: [Text Area]                 │
│                                             │
│  Recommendation: [Text Area - Optional]    │
│                                             │
│  Additional Notes: [Text Area - Optional]  │
│                                             │
│  ┌──────────────┐  ┌──────────────┐       │
│  │   Cancel     │  │   Submit     │       │
│  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────┘
```

### 2. Parts Management Section (When Status = "waiting_for_parts")
```
┌────────────────────────────────────────────────┐
│  Parts Tracking                                │
├────────────────────────────────────────────────┤
│                                                │
│  ┌──────────────────────────────────────────┐ │
│  │ Pending Parts Received: 0/1              │ │
│  └──────────────────────────────────────────┘ │
│                                                │
│  [+ Request New Parts]                        │
│                                                │
│  ┌─────────────────────────────────────────┐  │
│  │ Part Name    │ Qty │ Unit Cost │ Status  │  │
│  ├─────────────────────────────────────────┤  │
│  │ Keyboard     │ 1   │ ₱1,500    │ pending │  │
│  │              │     │           │         │  │
│  │ Status: [Dropdown ▼]                    │  │
│  │ • pending                               │  │
│  │ • ordered                               │  │
│  │ • received                              │  │
│  │                                         │  │
│  │ [Delete] [Cancel] [Save]                │  │
│  └─────────────────────────────────────────┘  │
│                                                │
└────────────────────────────────────────────────┘
```

### 3. Ticket Status Indicators
Show status badges for different states:
- `pending_approval` → Yellow badge
- `approved` → Blue badge
- `assigned` → Blue badge
- `in_progress` → Purple badge
- `waiting_for_parts` → Orange badge ← NEW
- `resolved` → Green badge

---

## Status Behavior Changes

### Before (Old Behavior):
```
in_progress → [Complete] → resolved (always)
```

### After (New Behavior):
```
in_progress → [Complete] → Modal Appears
                             ↓
           Choose Unit Status
           ├─ working/not_working/partially_working → resolved
           └─ need_buy_parts → waiting_for_parts
```

---

## Important Validation Rules

### When Completing a Ticket:
✅ **Required fields:** Unit Status, Observation, Action Taken
✅ **Optional fields:** Recommendation, Additional Notes

### When Submitting "need_buy_parts":
- ✅ Ticket does NOT resolve immediately
- ✅ Status becomes "waiting_for_parts"
- ✅ resolved_at date is NOT set
- ✅ Parts management UI becomes available

### When Submitting Other Unit Status:
- ✅ Ticket resolves immediately
- ✅ Status becomes "resolved"
- ✅ resolved_at date is set to now
- ✅ Parts UI is hidden

---

## Parts Cost Calculation

### Auto-Calculated Fields:
```
Request:
{
  "part_name": "Keyboard",
  "quantity": 2,
  "unit_cost": 500,
  "supplier": "Lazada"
}

Response:
{
  "part_id": "uuid-123",
  "part_name": "Keyboard",
  "quantity": 2,
  "unit_cost": 500,
  "total_cost": 1000,  ← AUTO: 2 × 500
  "supplier": "Lazada",
  "status": "pending"
}
```

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│ Ticket Detail Page                                      │
└────────────────────┬────────────────────────────────────┘
                     │
                     ├─ Status: in_progress
                     ├─ Show [Complete] Button
                     │
                     └─ Click [Complete]
                            │
                            ↓
                ┌──────────────────────────┐
                │ Complete Ticket Modal    │
                │ (5 Form Fields)          │
                │ Unit Status: [need_buy_parts selected]
                │                          │
                │ [Submit]                 │
                └────────┬─────────────────┘
                         │
                         ↓
                ┌──────────────────────────┐
                │ Backend Updates:         │
                │ - Saves form data        │
                │ - Sets status to         │
                │   "waiting_for_parts"    │
                │ - Does NOT set resolved  │
                └────────┬─────────────────┘
                         │
                         ↓
                ┌──────────────────────────┐
                │ Ticket Detail Page       │
                │ - Status: waiting_for_parts
                │ - Show Parts Section     │
                │ - Show [+ Request Parts] │
                │ - Show Parts List        │
                └──────────────────────────┘
```

---

## Quick Reference: What Frontend Needs to Build

### Immediate (Must Have):
- ✅ Complete ticket modal with 5 fields
- ✅ Unit status dropdown with "need_buy_parts" option
- ✅ Conditional logic: need_buy_parts → show parts UI
- ✅ Parts request form (part_name, quantity, unit_cost, supplier, notes)
- ✅ Parts list with status updates

### Nice to Have (Optional):
- 🟡 Parts cost summary/total
- 🟡 Filter for "Waiting for Parts" tickets
- 🟡 Email notification when parts received
- 🟡 Parts history/audit log

---

## Testing Scenarios

### Test 1: Simple Repair (No Parts)
```
1. Create ticket
2. Approve & assign
3. Start work
4. Complete with unit_status = "working"
5. Verify: ticket is resolved immediately
```

### Test 2: Repair Needs Parts
```
1. Create ticket
2. Approve & assign
3. Start work
4. Complete with unit_status = "need_buy_parts"
5. Verify: ticket is "waiting_for_parts", NOT resolved
6. Request parts
7. Update parts status: pending → ordered → received
8. Mark parts as received
9. Verify: can resume work or mark complete again
```

### Test 3: Complete After Parts Received
```
1. Follow Test 2 steps 1-8
2. Complete again with unit_status = "working"
3. Verify: ticket is now resolved
```

---

## Common Questions

**Q: Can employees see the "need_buy_parts" option?**
A: No, only IT staff can see/use the complete button.

**Q: What if IT selects "working" but parts were still needed?**
A: Ticket resolves immediately. Parts functionality is skipped. IT needs to use "need_buy_parts" if parts are needed.

**Q: Can a supervisor approve a ticket in "waiting_for_parts"?**
A: "waiting_for_parts" is an IT-level status, not for supervisor approval. It's between "in_progress" and final resolution.

**Q: What if IT cancels the modal without submitting?**
A: Nothing changes. Ticket stays "in_progress". Modal just closes.

**Q: Can parts be requested outside of "waiting_for_parts" status?**
A: Currently, parts are requested after marking ticket as "need_buy_parts". This could be expanded later if needed.

---

## Database Changes (FYI)

New table created: `ticket_parts`
- Stores part requests per ticket
- Tracks status: pending → ordered → received
- Auto-calculates total_cost from quantity × unit_cost
- Auto-sets received_date when marked "received"

---

## Git Commits

```
85b7bee - feat: Add 'need_buy_parts' option to ticket completion
44e8847 - docs: Add comprehensive parts tracking implementation guide
a20ccb1 - feat: Implement parts tracking system for tickets
```

All changes are live on production (Render.com).

---

## Need Help?

Refer to:
- `PARTS_TRACKING_IMPLEMENTATION.md` - Detailed technical docs
- `ticket.controller.ts` - Endpoint implementations
- `ticket.service.ts` - Business logic

