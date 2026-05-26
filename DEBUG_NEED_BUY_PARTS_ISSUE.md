# Issue: need_buy_parts Not Working - Debug Guide

## Problem Statement
- ❌ When selecting "need_buy_parts" from the modal, ticket status is being set to `resolved` instead of `waiting_for_parts`
- Expected: status should be `waiting_for_parts`
- Actual: status is `resolved`

---

## Root Cause Analysis

The backend logic **appears correct**:

```typescript
const needsBuyParts = completeTicketDto.unit_status === 'need_buy_parts';

if (needsBuyParts) {
  ticket.status = 'waiting_for_parts';  // ✅ Should happen
} else {
  ticket.status = 'resolved';           // ❌ This is happening instead
}
```

**If** `needsBuyParts` is `true`, status should be `waiting_for_parts`.  
**But** status is `resolved` → This means `needsBuyParts` is **FALSE**.  
**This means** the value being received is **NOT** `"need_buy_parts"`.

---

## Most Likely Causes

### 1. ❌ Frontend Sending Wrong Value
The frontend dropdown might be sending:
- `"Need buy parts"` (with spaces/capitals)
- `"need buy parts"` (with spaces)
- `"need_buy_parts "` (with trailing whitespace)
- `null` or `undefined`
- Something else entirely

### 2. ❌ Frontend Validation Issue
The form might not be binding correctly to the dropdown selection.

### 3. ❌ Frontend Not Sending The Field
The field might not be included in the API request body at all.

---

## How to Debug - Frontend Side

### Option 1: Check Network Tab (BEST)
1. Open browser Developer Tools (F12)
2. Go to **Network** tab
3. Click "Complete" button on a ticket
4. Find the POST request to `/tickets/:id/complete`
5. Click on that request
6. Look at **Request Body** → Check what value is in `unit_status`

**Expected in request body:**
```json
{
  "unit_status": "need_buy_parts",
  "observation": "...",
  "action_taken": "...",
  ...
}
```

**If you see something different**, that's the problem!

---

### Option 2: Check Console Logs
Add this to your frontend modal component BEFORE sending the request:

```javascript
console.log('Unit Status Value:', form.unit_status);
console.log('Unit Status Type:', typeof form.unit_status);
console.log('Unit Status === "need_buy_parts":', form.unit_status === 'need_buy_parts');
console.log('Complete form data:', form);
```

This will show exactly what value is being sent.

---

### Option 3: Check Backend Logs
I added debug logging to the backend. When you complete a ticket, check the **server terminal** for:

```
🔍 DEBUG: completeTicket
  unit_status: [whatever value is received]
  needsBuyParts: [true or false]
  Will set status to: [waiting_for_parts or resolved]
```

This will tell us exactly what value the backend is receiving.

---

## Backend: What Should Happen

**When `unit_status = "need_buy_parts"`:**
```
completeTicket() called
  ↓
unit_status: "need_buy_parts"
needsBuyParts: true
  ↓
ticket.status = "waiting_for_parts" ✅
  ↓
resolved_at NOT set
  ↓
Response: ticket with status="waiting_for_parts"
```

**When `unit_status != "need_buy_parts"`:**
```
completeTicket() called
  ↓
unit_status: "working" (or other value)
needsBuyParts: false
  ↓
ticket.status = "resolved" ✅
  ↓
resolved_at = now
  ↓
Response: ticket with status="resolved"
```

---

## Possible Solutions

### Solution 1: Fix Frontend Dropdown Value
Make sure the dropdown is sending **exactly** `"need_buy_parts"` (no spaces, correct case).

**In your React component:**
```jsx
<select 
  value={formData.unit_status}
  onChange={(e) => {
    console.log('Selected value:', e.target.value); // Debug
    setFormData({...formData, unit_status: e.target.value})
  }}
>
  <option value="">Select Status</option>
  <option value="working">Working</option>
  <option value="not_working">Not Working</option>
  <option value="partially_working">Partially Working</option>
  <option value="need_buy_parts">Need Buy Parts</option>
</select>
```

### Solution 2: Trim Whitespace
If frontend is sending whitespace, trim it:

```typescript
// Backend: Make the comparison more flexible
const needsBuyParts = completeTicketDto.unit_status?.trim().toLowerCase() === 'need_buy_parts';
```

### Solution 3: Check Form Binding
Make sure the modal form is correctly binding to the dropdown:
- Is the state being updated when you select from dropdown?
- Is the selected value being passed in the API request?
- Are there any form validation errors preventing submission?

---

## Test Steps to Verify

1. **In Browser DevTools Network Tab:**
   - Complete a ticket with "need_buy_parts" selected
   - Look at the request body
   - Check the exact value of `unit_status`

2. **Check Server Logs:**
   - Look at the terminal running `npm run start:dev`
   - Find the debug output showing what was received

3. **Verify Database:**
   ```sql
   SELECT ticket_id, status, unit_status FROM ticket 
   WHERE ticket_id = '[YOUR_TEST_TICKET_ID]'
   LIMIT 1;
   ```
   - Should show: `status: "waiting_for_parts"`, `unit_status: "need_buy_parts"`
   - If shows: `status: "resolved"`, then `needsBuyParts` was `false`

---

## Quick Checklist

- [ ] Frontend dropdown value is exactly `"need_buy_parts"` (no spaces, right case)
- [ ] Frontend is sending the value in the request body
- [ ] Backend debug logs show the correct value being received
- [ ] Database shows `status: "waiting_for_parts"` (not `resolved`)
- [ ] The modal is not closed prematurely (preventing the request)
- [ ] No form validation errors on the frontend

---

## If Still Not Working

Reply with:
1. What value shows in browser DevTools Network tab for `unit_status`?
2. What output appears in the server terminal debug logs?
3. A screenshot of the modal/form

This will help pinpoint the exact issue!
