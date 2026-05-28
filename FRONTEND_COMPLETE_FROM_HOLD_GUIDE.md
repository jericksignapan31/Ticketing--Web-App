# Frontend Guide: Complete Ticket from HOLD Status

## Overview
Kapag ang ticket ay nasa **HOLD** status (waiting for parts), kailangan ng IT staff na:
1. Confirm na lahat ng parts ay na-receive na
2. Update ang ticket status to **RESOLVED**

---

## Step-by-Step Flow

### Step 1: Display Hold Tickets
```typescript
// Get all tickets on hold (waiting for parts)
GET /tickets/hold

Response:
{
  "tickets": [
    {
      "ticket_id": "uuid-1",
      "title": "Computer keyboard not working",
      "status": "hold",
      "unit_status": "need_buy_parts",
      "department": "IT",
      "created_at": "2026-05-28T10:00:00",
      "parts": [
        {
          "part_id": "uuid-part-1",
          "part_name": "Keyboard",
          "quantity": 1,
          "status": "pending",  // or "ordered", "received"
          "unit_cost": 1500,
          "total_cost": 1500,
          "requested_date": "2026-05-28T10:00:00",
          "received_date": null
        }
      ]
    }
  ]
}
```

### Step 2: Show Parts Status to IT Staff
**Display the parts list** para makita ng IT staff kung ano na receive na:

```
📦 Parts for This Ticket:
┌─────────────────────────────────────────┐
│ Keyboard                                │
│ Qty: 1                                  │
│ Unit Cost: ₱1,500                       │
│ Status: ⏳ PENDING → 📤 ORDERED → ✅ RECEIVED │
│ Supplier: TechStore                     │
│ Requested: 2026-05-28                   │
│ Received: --                            │
└─────────────────────────────────────────┘
```

### Step 3: Update Part Status to "RECEIVED" (if needed)
**Before completing the ticket**, ensure all parts are marked as received:

```typescript
// Update part status to received
PATCH /tickets/{ticket_id}/parts/{part_id}
{
  "status": "received"
}

Response:
{
  "part_id": "uuid-part-1",
  "part_name": "Keyboard",
  "status": "received",
  "received_date": "2026-05-28T14:30:00"
}
```

### Step 4: Show Complete Ticket Form
**Display form with 5 required fields** for IT staff to complete:

```
┌────────────────────────────────────────────┐
│      Complete Ticket from HOLD Status      │
├────────────────────────────────────────────┤
│                                            │
│ 📌 Ticket: Computer keyboard not working  │
│ 🏢 Department: IT                          │
│ ⏱️  Status: HOLD (Waiting for Parts)       │
│                                            │
│ ✅ Parts Received: Keyboard (1x ₱1,500)   │
│                                            │
├────────────────────────────────────────────┤
│ * Unit Status:                             │
│   ○ Working          (bagay na)            │
│   ○ Not Working      (hindi bagay)         │
│   ○ Partially Working (bahay-bahay)        │
│                                            │
│ * Observation:                             │
│   [________________________________]       │
│   Kung ano nakita mo habang check-up       │
│                                            │
│ * Action Taken:                            │
│   [________________________________]       │
│   Ano na-fix/ginawa mo                     │
│                                            │
│ ? Recommendation:                          │
│   [________________________________]       │
│   Optional - suggestions para user         │
│                                            │
│ ? Resolution Notes:                        │
│   [________________________________]       │
│   Optional - additional notes              │
│                                            │
│              [SAVE]  [CANCEL]              │
└────────────────────────────────────────────┘
```

### Step 5: Validate Before Sending

✅ **Before sending to backend**, frontend MUST check:

```typescript
// Validation rules
const validateCompletion = (formData) => {
  const errors = [];

  // 1. Check all required fields
  if (!formData.unit_status) {
    errors.push("Unit Status is required");
  }
  if (!formData.observation) {
    errors.push("Observation is required");
  }
  if (!formData.action_taken) {
    errors.push("Action Taken is required");
  }

  // 2. Check unit_status is valid
  const validStatuses = ['working', 'not_working', 'partially_working'];
  if (formData.unit_status && !validStatuses.includes(formData.unit_status)) {
    errors.push("Invalid unit status");
  }

  // 3. Check unit_status is NOT "need_buy_parts"
  // (because ticket is already on HOLD waiting for parts)
  if (formData.unit_status === 'need_buy_parts') {
    errors.push("Cannot set to 'need_buy_parts' - ticket is already on hold");
  }

  // 4. Check at least all parts are received
  const allPartsReceived = ticket.parts?.every(p => p.status === 'received');
  if (!allPartsReceived) {
    errors.push("All parts must be marked as received before completing");
  }

  return { isValid: errors.length === 0, errors };
};
```

### Step 6: Send to Backend

```typescript
// When user clicks SAVE button
const completeFromHold = async (ticketId: string, formData) => {
  // 1. Validate first
  const { isValid, errors } = validateCompletion(formData);
  if (!isValid) {
    showErrors(errors);
    return;
  }

  // 2. Show loading state
  setLoading(true);

  try {
    // 3. Call backend endpoint
    const response = await fetch(
      `/api/tickets/${ticketId}/complete`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          unit_status: formData.unit_status,           // required
          observation: formData.observation,           // required
          action_taken: formData.action_taken,         // required
          recommendation: formData.recommendation,     // optional
          resolution_notes: formData.resolution_notes  // optional
        })
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    const updatedTicket = await response.json();

    // 4. Show success message
    showSuccess('Ticket completed successfully! ✅');

    // 5. Update UI - ticket status is now RESOLVED
    console.log('Ticket status:', updatedTicket.status); // "resolved"

    // 6. Redirect to ticket list or show completion summary
    redirectToTickets();

  } catch (error) {
    showError(`Error: ${error.message}`);
  } finally {
    setLoading(false);
  }
};
```

---

## Request & Response Details

### Request Format
```json
PATCH /tickets/{ticket_id}/complete

{
  "unit_status": "working",
  "observation": "Keyboard was damaged - replaced with new unit",
  "action_taken": "Installed new keyboard and tested all keys",
  "recommendation": "User should be careful with keyboard to avoid damage",
  "resolution_notes": "Keyboard now fully functional"
}
```

### Success Response (200 OK)
```json
{
  "ticket_id": "uuid-123",
  "title": "Computer keyboard not working",
  "status": "resolved",           ← Status changed from HOLD to RESOLVED
  "unit_status": "working",
  "observation": "Keyboard was damaged - replaced with new unit",
  "action_taken": "Installed new keyboard and tested all keys",
  "recommendation": "User should be careful with keyboard to avoid damage",
  "resolution_notes": "Keyboard now fully functional",
  "resolved_at": "2026-05-28T14:35:00",
  "parts": [
    {
      "part_id": "uuid-part-1",
      "part_name": "Keyboard",
      "status": "received",
      "received_date": "2026-05-28T14:30:00"
    }
  ]
}
```

### Error Responses

#### ❌ Error 1: Parts Not Received
```json
{
  "statusCode": 400,
  "message": "Cannot complete ticket. 1 part(s) still pending or not received. Please confirm all parts are received first using /tickets/:id/parts/:part_id endpoint.",
  "error": "Bad Request"
}
```

**Frontend Action:**
- Show error message
- Highlight which parts are not received
- Show button to update part status
- Don't allow saving until all parts are marked received

#### ❌ Error 2: Invalid Unit Status
```json
{
  "statusCode": 400,
  "message": "Invalid unit_status. Must be one of: working, not_working, partially_working",
  "error": "Bad Request"
}
```

**Frontend Action:**
- Show validation error
- Highlight the unit_status field
- Show allowed values

#### ❌ Error 3: Required Field Missing
```json
{
  "statusCode": 400,
  "message": "observation must be a string",
  "error": "Bad Request"
}
```

**Frontend Action:**
- Show validation error on specific field
- Don't allow submit until filled

#### ❌ Error 4: Ticket Not in Hold Status
```json
{
  "statusCode": 400,
  "message": "Cannot complete ticket with status 'in_progress'. Ticket must be in progress or on hold.",
  "error": "Bad Request"
}
```

**Frontend Action:**
- Show error: Ticket is not ready to complete
- Refresh ticket data from server
- Show current status

---

## Complete Frontend Component Example (React/TypeScript)

```typescript
import React, { useState, useEffect } from 'react';

interface CompleteFromHoldProps {
  ticketId: string;
  ticket: any;
}

export const CompleteFromHoldModal: React.FC<CompleteFromHoldProps> = ({
  ticketId,
  ticket,
}) => {
  const [formData, setFormData] = useState({
    unit_status: '',
    observation: '',
    action_taken: '',
    recommendation: '',
    resolution_notes: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Check if all parts are received
  const allPartsReceived = ticket.parts?.every(
    (p: any) => p.status === 'received'
  ) ?? false;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate
    if (!formData.unit_status) {
      setError('Please select Unit Status');
      return;
    }
    if (!formData.observation) {
      setError('Observation is required');
      return;
    }
    if (!formData.action_taken) {
      setError('Action Taken is required');
      return;
    }
    if (!allPartsReceived) {
      setError('All parts must be marked as received first');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/tickets/${ticketId}/complete`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message);
      }

      setSuccess('Ticket completed successfully! ✅');
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal">
      <h2>Complete Ticket from HOLD</h2>

      {/* Parts Status */}
      <div className="parts-section">
        <h3>📦 Parts Status</h3>
        {ticket.parts?.map((part: any) => (
          <div key={part.part_id} className="part-item">
            <span>{part.part_name}</span>
            <span
              className={`status ${part.status}`}
            >
              {part.status === 'received' ? '✅ Received' : '⏳ Pending'}
            </span>
          </div>
        ))}
      </div>

      {/* Alerts */}
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}
      {!allPartsReceived && (
        <div className="alert alert-warning">
          ⚠️ All parts must be marked as received before completing
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit}>
        {/* Unit Status - REQUIRED */}
        <div className="form-group">
          <label>* Unit Status (Required)</label>
          <div className="radio-group">
            <label>
              <input
                type="radio"
                name="unit_status"
                value="working"
                checked={formData.unit_status === 'working'}
                onChange={(e) =>
                  setFormData({ ...formData, unit_status: e.target.value })
                }
              />
              Working ✅
            </label>
            <label>
              <input
                type="radio"
                name="unit_status"
                value="not_working"
                checked={formData.unit_status === 'not_working'}
                onChange={(e) =>
                  setFormData({ ...formData, unit_status: e.target.value })
                }
              />
              Not Working ❌
            </label>
            <label>
              <input
                type="radio"
                name="unit_status"
                value="partially_working"
                checked={formData.unit_status === 'partially_working'}
                onChange={(e) =>
                  setFormData({ ...formData, unit_status: e.target.value })
                }
              />
              Partially Working ⚠️
            </label>
          </div>
        </div>

        {/* Observation - REQUIRED */}
        <div className="form-group">
          <label>* Observation (Required)</label>
          <textarea
            value={formData.observation}
            onChange={(e) =>
              setFormData({ ...formData, observation: e.target.value })
            }
            placeholder="What did you observe during the work?"
            required
          />
        </div>

        {/* Action Taken - REQUIRED */}
        <div className="form-group">
          <label>* Action Taken (Required)</label>
          <textarea
            value={formData.action_taken}
            onChange={(e) =>
              setFormData({ ...formData, action_taken: e.target.value })
            }
            placeholder="What did you do to fix the issue?"
            required
          />
        </div>

        {/* Recommendation - OPTIONAL */}
        <div className="form-group">
          <label>? Recommendation (Optional)</label>
          <textarea
            value={formData.recommendation}
            onChange={(e) =>
              setFormData({ ...formData, recommendation: e.target.value })
            }
            placeholder="Any recommendations for the user?"
          />
        </div>

        {/* Resolution Notes - OPTIONAL */}
        <div className="form-group">
          <label>? Resolution Notes (Optional)</label>
          <textarea
            value={formData.resolution_notes}
            onChange={(e) =>
              setFormData({ ...formData, resolution_notes: e.target.value })
            }
            placeholder="Additional notes about the resolution"
          />
        </div>

        {/* Buttons */}
        <div className="button-group">
          <button type="submit" disabled={loading || !allPartsReceived}>
            {loading ? 'Saving...' : 'Complete Ticket'}
          </button>
          <button type="button" onClick={() => window.history.back()}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};
```

---

## Important Notes

### ⚠️ Critical Requirements

1. **Do NOT send `unit_status: "need_buy_parts"`**
   - This is only for tickets in `in_progress` status
   - Ticket is already in `hold`, so only send: `working`, `not_working`, or `partially_working`

2. **All parts MUST be marked as received first**
   - Backend will validate this
   - Show user warning if any parts are still pending

3. **All 3 required fields MUST be filled**
   - `unit_status` ← Choose from 3 options
   - `observation` ← Describe what you saw
   - `action_taken` ← Describe what you did

4. **Ticket will transition from HOLD → RESOLVED**
   - After successful completion, ticket status becomes `resolved`
   - Ticket will no longer appear in "waiting for parts" list

---

## Testing Checklist

- [ ] Show ticket on HOLD status
- [ ] Display parts list with received status
- [ ] Allow updating part status to "received"
- [ ] Show form with 5 fields
- [ ] Validate required fields before submit
- [ ] Show error if parts not received
- [ ] Successfully complete ticket and get resolved status
- [ ] Redirect to ticket list after completion
- [ ] Show success message

---

## Common Issues & Fixes

### Issue: "Parts not received" error
**Fix:** Update all parts to "received" status first using the parts update endpoint

### Issue: Cannot find the complete button
**Fix:** Check that ticket status is exactly "hold" (lowercase)

### Issue: Form submits but nothing happens
**Fix:** Check browser console for errors, ensure token is valid

