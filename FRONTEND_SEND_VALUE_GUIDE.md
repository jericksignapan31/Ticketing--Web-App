# Frontend Implementation - What Needs to Happen

## The Flow: Frontend → Backend

### 1️⃣ Frontend: Modal Form
User sees the complete ticket modal with dropdown:

```
┌─────────────────────────────────┐
│  Complete Ticket                │
├─────────────────────────────────┤
│                                 │
│  Unit Status: [Dropdown ▼]      │
│   ├─ working                    │
│   ├─ not_working                │
│   ├─ partially_working          │
│   └─ need_buy_parts ← Select this
│                                 │
│  Observation: [Text Area]       │
│  Action Taken: [Text Area]      │
│  Recommendation: [Text Area]    │
│  Additional Notes: [Text Area]  │
│                                 │
│  [Cancel] [Submit]              │
└─────────────────────────────────┘
```

### 2️⃣ Frontend: Send Request
When user clicks **Submit**, frontend sends:

```
POST /tickets/{ticket_id}/complete
Content-Type: application/json

{
  "unit_status": "need_buy_parts",
  "observation": "Keyboard completely broken",
  "action_taken": "Tested all keys, no response",
  "recommendation": "Replace with mechanical keyboard",
  "resolution_notes": "Waiting for parts approval"
}
```

**IMPORTANT**: The `unit_status` field **MUST** be sent with the exact value `"need_buy_parts"`

### 3️⃣ Backend: Receives & Checks Value
```typescript
const needsBuyParts = completeTicketDto.unit_status === 'need_buy_parts';
//                    ↑ Checking for EXACTLY this string

if (needsBuyParts) {
  ticket.status = 'waiting_for_parts';  // ✅ This should happen
} else {
  ticket.status = 'resolved';           // ❌ This is happening instead
}
```

### 4️⃣ Backend: Returns Response
```json
{
  "ticket_id": "uuid-123",
  "status": "waiting_for_parts",
  "unit_status": "need_buy_parts",
  "observation": "Keyboard completely broken",
  "action_taken": "Tested all keys, no response",
  ...
}
```

---

## What the Frontend Modal Should Do

### React Example:

```jsx
import { useState } from 'react';

export function CompleteTicketModal({ ticket_id, onClose }) {
  const [formData, setFormData] = useState({
    unit_status: '',
    observation: '',
    action_taken: '',
    recommendation: '',
    resolution_notes: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    // DEBUG: Log what we're sending
    console.log('Sending to backend:', formData);

    try {
      const response = await fetch(
        `http://localhost:3000/tickets/${ticket_id}/complete`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`, // Your JWT token
          },
          body: JSON.stringify(formData), // ← MUST include unit_status
        }
      );

      const result = await response.json();
      console.log('Response from backend:', result);

      if (result.status === 'waiting_for_parts') {
        alert('✅ Ticket waiting for parts!');
      } else if (result.status === 'resolved') {
        alert('✅ Ticket resolved!');
      }

      onClose();
    } catch (error) {
      console.error('Error completing ticket:', error);
    }
  };

  return (
    <div className="modal">
      <h2>Complete Ticket</h2>
      <form onSubmit={handleSubmit}>
        
        {/* Unit Status Dropdown */}
        <div>
          <label>Unit Status *</label>
          <select
            value={formData.unit_status}
            onChange={(e) => {
              console.log('Selected:', e.target.value); // DEBUG
              setFormData({ ...formData, unit_status: e.target.value });
            }}
            required
          >
            <option value="">-- Select Status --</option>
            <option value="working">Working</option>
            <option value="not_working">Not Working</option>
            <option value="partially_working">Partially Working</option>
            <option value="need_buy_parts">Need Buy Parts</option>
          </select>
        </div>

        {/* Observation */}
        <div>
          <label>Observation *</label>
          <textarea
            value={formData.observation}
            onChange={(e) =>
              setFormData({ ...formData, observation: e.target.value })
            }
            required
          />
        </div>

        {/* Action Taken */}
        <div>
          <label>Action Taken *</label>
          <textarea
            value={formData.action_taken}
            onChange={(e) =>
              setFormData({ ...formData, action_taken: e.target.value })
            }
            required
          />
        </div>

        {/* Recommendation (Optional) */}
        <div>
          <label>Recommendation</label>
          <textarea
            value={formData.recommendation}
            onChange={(e) =>
              setFormData({ ...formData, recommendation: e.target.value })
            }
          />
        </div>

        {/* Additional Notes (Optional) */}
        <div>
          <label>Additional Notes</label>
          <textarea
            value={formData.resolution_notes}
            onChange={(e) =>
              setFormData({ ...formData, resolution_notes: e.target.value })
            }
          />
        </div>

        {/* Buttons */}
        <button type="button" onClick={onClose}>
          Cancel
        </button>
        <button type="submit">Submit</button>
      </form>
    </div>
  );
}
```

---

## Key Points for Frontend

✅ **Dropdown value must match exactly**: `"need_buy_parts"` (no spaces, lowercase)

✅ **Form state must update when dropdown changes**: 
```jsx
onChange={(e) => setFormData({...formData, unit_status: e.target.value})}
```

✅ **All 5 fields must be included in the request**:
- `unit_status` ← MOST IMPORTANT (determines waiting_for_parts vs resolved)
- `observation` 
- `action_taken`
- `recommendation` (optional)
- `resolution_notes` (optional)

✅ **Request method**: `PATCH /tickets/{id}/complete`

✅ **Headers**: Include `Content-Type: application/json` and `Authorization: Bearer {token}`

---

## How to Verify It's Working

### 1. Check Network Tab in DevTools:
1. Open Browser DevTools (F12)
2. Go to **Network** tab
3. Select "need_buy_parts" and click Submit
4. Find the request to `/tickets/:id/complete`
5. Click on it → look at **Request Body**
6. Should show: `"unit_status": "need_buy_parts"`

### 2. Check Server Logs:
Look at terminal running `npm run start:dev`, should show:
```
🔍 DEBUG: completeTicket
  unit_status: need_buy_parts
  needsBuyParts: true
  Will set status to: waiting_for_parts
```

### 3. Check Database:
```sql
SELECT ticket_id, status, unit_status FROM ticket WHERE ticket_id = 'YOUR_ID' LIMIT 1;
```

Should show:
```
ticket_id          | status              | unit_status
uuid-xxx-xxx-xxx   | waiting_for_parts   | need_buy_parts
```

---

## Common Frontend Mistakes

❌ **Mistake 1**: Form state not being set from dropdown
```jsx
// WRONG - form data never updates
<select onChange={(e) => console.log(e.target.value)}>
```

❌ **Mistake 2**: Not sending the field in request body
```jsx
// WRONG - unit_status is missing
const body = {
  observation: formData.observation,
  action_taken: formData.action_taken,
  // ❌ unit_status is missing!
};
```

❌ **Mistake 3**: Wrong value string
```jsx
// WRONG - different casing or spelling
<option value="Need_Buy_Parts">Need Buy Parts</option>
<option value="need buy parts">Need Buy Parts</option>
<option value="needBuyParts">Need Buy Parts</option>
```

---

## Solution Summary

**The frontend needs to**:
1. ✅ Get selected value from dropdown
2. ✅ Put it in form state as `unit_status`
3. ✅ Send it in request body when submitting
4. ✅ Make sure the value is **exactly** `"need_buy_parts"`

**Then backend will**:
1. ✅ Receive the value
2. ✅ Check if it equals `"need_buy_parts"`
3. ✅ Set ticket.status to `"waiting_for_parts"` (not resolved)

---

## Quick Checklist for Frontend Dev

- [ ] Dropdown options include `value="need_buy_parts"`
- [ ] onChange handler updates form state
- [ ] Form state has `unit_status` field
- [ ] Request body includes `unit_status: formData.unit_status`
- [ ] Console logs show the correct value being sent
- [ ] Network tab shows `"unit_status": "need_buy_parts"` in request

If all these are correct, it will work! 🚀
