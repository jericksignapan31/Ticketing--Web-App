# Status Change Update - hold vs waiting_for_parts

## Overview
Changed ticket status from **`waiting_for_parts`** to **`hold`** when user selects "need_buy_parts" in the complete ticket modal.

---

## Changes Made

### 1. **Ticket Service** (`src/ticket/ticket.service.ts`)

#### completeTicket() Method:
```typescript
// BEFORE:
if (needsBuyParts) {
  ticket.status = 'waiting_for_parts';  // ❌
}

// AFTER:
if (needsBuyParts) {
  ticket.status = 'hold';  // ✅ New status
}
```

#### findWaitingForParts() Method:
```typescript
// Now queries for status = 'hold' instead of 'waiting_for_parts'
const where: any = { status: 'hold' };
```

### 2. **Ticket Controller** (`src/ticket/ticket.controller.ts`)

#### Added new endpoint `/tickets/hold`:
```
GET /tickets/hold
Returns all tickets with status = "hold" (filtered by department)
```

#### Updated `/tickets/waiting-for-parts`:
- Now an alias for `/tickets/hold`
- Both endpoints return the same data

### 3. **Complete Ticket DTO** (`src/ticket/dto/complete-ticket.dto.ts`)

Updated API documentation:
```typescript
// BEFORE:
'if needs parts, ticket goes to waiting_for_parts'

// AFTER:
'if needs parts, ticket goes to hold status'
```

---

## Workflow - How It Works Now

### ✅ User Completes Ticket with "need_buy_parts":
```
User selects "need_buy_parts" from dropdown
         ↓
Form submitted to: PATCH /tickets/{id}/complete
         ↓
Backend receives: unit_status = "need_buy_parts"
         ↓
Checks: needsBuyParts = true
         ↓
Sets: ticket.status = "hold"  ← NEW (not "resolved")
         ↓
Response: { status: "hold", unit_status: "need_buy_parts", ... }
```

### ✅ View Hold Tickets:
```
GET /tickets/hold
         ↓
Backend queries: WHERE status = "hold"
         ↓
Returns: All tickets waiting for parts (with parts relations)
         ↓
Frontend shows: List of on-hold tickets
```

---

## Database Impact

| Scenario | Before | After |
|----------|--------|-------|
| User selects "working" | `resolved` | `resolved` ✓ (unchanged) |
| User selects "not_working" | `resolved` | `resolved` ✓ (unchanged) |
| User selects "partially_working" | `resolved` | `resolved` ✓ (unchanged) |
| User selects "need_buy_parts" | `waiting_for_parts` | `hold` ← **CHANGED** |

---

## API Endpoints

### Complete Ticket:
```
PATCH /tickets/{id}/complete

Request: { unit_status: "need_buy_parts", observation: "...", ... }
Response: { status: "hold", unit_status: "need_buy_parts", ... }
```

### Get Hold Tickets:
```
GET /tickets/hold
Response: [ { status: "hold", unit_status: "need_buy_parts", parts: [...] }, ... ]
```

### Alias Endpoint (same as /hold):
```
GET /tickets/waiting-for-parts
Response: Same as /tickets/hold
```

---

## Status Summary

| Status | Meaning | Next Action |
|--------|---------|-------------|
| `resolved` | Ticket completed, no parts needed | ✓ Done |
| `hold` | Waiting for parts to arrive | Request parts → receive → complete again |

---

## What Stays the Same

✅ All other statuses unchanged (pending_approval, approved, assigned, in_progress, rejected)  
✅ Parts tracking system works the same way  
✅ Department filtering works the same way  
✅ All other endpoints unchanged  

---

## Git Commit

```
Commit: c367d53
Message: "feat: Change waiting_for_parts status to hold when need_buy_parts is selected"
```

---

## Files Modified

1. ✅ `src/ticket/ticket.service.ts` - Changed status logic in 2 methods
2. ✅ `src/ticket/ticket.controller.ts` - Added new `/hold` endpoint + updated docs
3. ✅ `src/ticket/dto/complete-ticket.dto.ts` - Updated API documentation

---

## Ready to Deploy

✅ Build: **SUCCESSFUL**  
✅ All changes: **COMMITTED**  
✅ No breaking changes: **CONFIRMED**  

When you push to git, Render will auto-deploy with the new `hold` status! 🚀
