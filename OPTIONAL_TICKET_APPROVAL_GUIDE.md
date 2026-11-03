# Frontend: Optional Ticket Approval Feature

## Overview
Implement the ability for employees to create tickets that skip supervisor approval for urgent cases. This allows IT to see urgent tickets immediately without waiting for supervisor review.

## UI Changes Required

### 1. Modify Ticket Creation Form

Add a new checkbox field in the ticket creation form, positioned near priority/category fields:

**Field Details:**
- **Label:** "Requires Supervisor Approval"
- **Type:** Checkbox
- **Default State:** Checked (ON)
- **Helper Text:** "Uncheck for urgent tickets to skip supervisor review" (optional)

### 2. Form Logic

When employee creates ticket:
- **Checkbox CHECKED (true):** Ticket enters standard approval workflow (supervisor reviews)
- **Checkbox UNCHECKED (false):** Ticket auto-approves, IT sees it immediately
- **No selection (default):** Behaves as checked/true

---

## API Integration

### Request Payload

Send the checkbox value as `require_approval` boolean in the POST request:

```json
{
  "asset_id": "550e8400-e29b-41d4-a716-446655440000",
  "category": "Repair",
  "priority": "Urgent",
  "subject": "Monitor screen broken",
  "description": "External monitor is not turning on",
  "employee_id": "emp-12345",
  "require_approval": false
}
```

### Response Scenarios

**Scenario A: Urgent Ticket (require_approval: false)**
```json
{
  "ticket_id": "IT-20261103-0001",
  "status": "approved",
  "approval_status": "approved",
  "require_approval": false,
  "approved_by": "system",
  "approved_at": "2026-11-03T10:30:45.000Z",
  "created_at": "2026-11-03T10:30:45.000Z"
}
```
→ **Show success message:** "Ticket created and immediately assigned to IT"

**Scenario B: Standard Ticket (require_approval: true)**
```json
{
  "ticket_id": "IT-20261103-0002",
  "status": "pending_approval",
  "approval_status": "pending",
  "require_approval": true,
  "approved_by": null,
  "approved_at": null,
  "created_at": "2026-11-03T10:32:15.000Z"
}
```
→ **Show success message:** "Ticket created. Waiting for supervisor approval"

---

## Implementation Checklist

- [ ] Add checkbox field to ticket creation form
- [ ] Set checkbox default to checked/true
- [ ] Add helper text for UX guidance
- [ ] Map checkbox value to `require_approval` in request body
- [ ] Display appropriate success messages based on response status
- [ ] Test with `require_approval: false` (auto-approved)
- [ ] Test with `require_approval: true` (pending approval)
- [ ] Test without sending field (should behave as true/default)

---

## Ticket Status Display

After creation, display these status indicators:

| Status | Meaning | Display |
|--------|---------|---------|
| `approved` | Auto-approved, IT assigned | ✅ Green "Assigned to IT" |
| `pending_approval` | Waiting for supervisor | ⏳ Yellow "Pending Approval" |

---

## Testing Guide

**Test Case 1:** Create urgent ticket
1. Fill ticket form
2. **Uncheck** "Requires Supervisor Approval"
3. Submit
4. **Expected:** Success message shows "Immediately assigned to IT"
5. Ticket appears in IT's approved tickets list

**Test Case 2:** Create standard ticket  
1. Fill ticket form
2. **Check** "Requires Supervisor Approval" (default)
3. Submit
4. **Expected:** Success message shows "Waiting for supervisor approval"
5. Ticket appears in supervisor's pending approval list

**Test Case 3:** Default behavior
1. Fill ticket form
2. Leave checkbox as-is (default checked)
3. Submit
4. **Expected:** Same as Test Case 2

---

## Backend Status
✅ **Ready for integration** - All API endpoints configured  
✅ **No changes needed from frontend** - Just add the field to your form  
✅ **Database migration applied** - Column added to ticket table  

---

## Questions?
Backend team has completed all necessary changes. This is a simple UI addition with existing API support.
