# Resume from Hold Endpoint Documentation

## Overview
New endpoint to transition a ticket from **hold** status back to **in_progress** status. This is useful when parts have arrived or the issue that required putting the ticket on hold has been resolved.

## Endpoint Details

### Route
```
PATCH /tickets/:id/resume-from-hold
```

### Authentication
- **Required**: JWT Bearer Token
- **Roles**: `IT`, `ADMIN` only

### Request Body
```json
{
  "notes": "Parts have arrived, resuming work"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `notes` | string | No | Optional notes when resuming work from hold |

### Response (200 OK)
```json
{
  "ticket_id": "82266bc4-c897-4c2d-bf91-b5e3c4a956eb",
  "status": "in_progress",
  "assigned_to": "it-staff-id",
  "started_at": "2026-05-28T10:30:00.000Z",
  "resolution_notes": "Parts have arrived, resuming work",
  ...other ticket fields
}
```

### Error Responses

#### 400 Bad Request - Ticket Not on Hold
```json
{
  "statusCode": 400,
  "message": "Cannot resume from hold. Ticket status is 'in_progress', must be 'hold' to resume work."
}
```

#### 400 Bad Request - Not Assigned to Ticket
```json
{
  "statusCode": 400,
  "message": "You are not assigned to this ticket. Assigned to: other-staff-id"
}
```

#### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Ticket with ID '82266bc4-c897-4c2d-bf91-b5e3c4a956eb' not found"
}
```

## Business Logic

1. **Validates ticket exists** - Returns 404 if not found
2. **Validates ticket is on hold** - Must have `status: 'hold'`
3. **Validates assignment** - Only IT staff assigned to ticket can resume it
4. **Sets status to in_progress** - Changes status from hold back to in_progress
5. **Optionally updates notes** - Stores provided notes in resolution_notes field

## Status Transitions Supported

### From Hold to In Progress
```
hold → in_progress
```

This is the **only** allowed transition from hold status using this endpoint.

## Example Usage

### cURL
```bash
curl -X 'PATCH' \
  'http://localhost:3000/tickets/82266bc4-c897-4c2d-bf91-b5e3c4a956eb/resume-from-hold' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
  "notes": "Parts have arrived from supplier, resuming diagnostic work"
}'
```

### JavaScript/Fetch
```javascript
const ticketId = '82266bc4-c897-4c2d-bf91-b5e3c4a956eb';
const token = localStorage.getItem('token');

const response = await fetch(
  `/tickets/${ticketId}/resume-from-hold`,
  {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      notes: 'Parts have arrived from supplier, resuming diagnostic work'
    })
  }
);

if (response.ok) {
  const ticket = await response.json();
  console.log('Ticket resumed:', ticket);
} else {
  const error = await response.json();
  console.error('Error:', error.message);
}
```

## Workflow Context

### Complete Ticket Workflow with Hold

1. **Start Work** - Employee assigns ticket, IT staff starts work
   - `PATCH /tickets/:id/start-work` → status: `in_progress`

2. **Parts Needed** - During work, parts are identified as needed
   - `PATCH /tickets/:id/complete` with `unit_status: "need_buy_parts"` → status: `hold`
   - `POST /tickets/:id/parts` - Create part requests

3. **Waiting for Parts** - Ticket stays on hold
   - `GET /tickets/hold` or `GET /tickets/waiting-for-parts` - View hold tickets with parts

4. **Parts Arrive** (NEW) - Resume work when parts received
   - `PATCH /tickets/:id/resume-from-hold` → status: `in_progress`
   - Update part status: `PATCH /tickets/:id/parts/:part_id` with `status: "received"`

5. **Complete Work** - Finish the ticket
   - `PATCH /tickets/:id/complete` with resolution details → status: `resolved`

## Implementation Details

### Code Location
- **Service**: [src/ticket/ticket.service.ts](src/ticket/ticket.service.ts#L595) - `resumeFromHold()` method
- **Controller**: [src/ticket/ticket.controller.ts](src/ticket/ticket.controller.ts#L295) - `resumeFromHold()` endpoint
- **DTO**: [src/ticket/dto/resume-from-hold.dto.ts](src/ticket/dto/resume-from-hold.dto.ts)

### Method Signature
```typescript
async resumeFromHold(
  ticket_id: string,
  it_staff_id: string,
  resumeFromHoldDto: ResumeFromHoldDto
): Promise<Ticket>
```

## Frontend Implementation Guide

### React Hook Example
```typescript
const resumeTicketFromHold = async (ticketId: string, notes?: string) => {
  try {
    const response = await fetch(
      `/tickets/${ticketId}/resume-from-hold`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ notes })
      }
    );
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }
    
    const updatedTicket = await response.json();
    // Update UI with resumed ticket
    return updatedTicket;
  } catch (error) {
    console.error('Failed to resume ticket:', error.message);
    // Show error to user
    throw error;
  }
};
```

### UI Button Example
```jsx
<button
  onClick={() => resumeTicketFromHold(ticket.ticket_id, 'Parts received, resuming work')}
  disabled={ticket.status !== 'hold'}
  className="btn btn-primary"
>
  Resume Work
</button>
```

## Testing Checklist

- [ ] Resume ticket on hold → should transition to in_progress
- [ ] Cannot resume ticket that's in_progress → should return 400
- [ ] Cannot resume ticket that's resolved → should return 400
- [ ] Cannot resume if not assigned → should return 400
- [ ] Notes field is optional → should work without notes
- [ ] Notes are stored in resolution_notes field → verify database
- [ ] Status shows in_progress after resuming → verify GET endpoint
- [ ] Only IT/ADMIN can resume → test with EMPLOYEE/SUPERVISOR token

## Related Endpoints

- `GET /tickets/hold` - View all on-hold tickets
- `GET /tickets/waiting-for-parts` - View tickets waiting for parts
- `PATCH /tickets/:id/complete` - Complete ticket (can set hold status)
- `PATCH /tickets/:id/start-work` - Start working on assigned ticket
- `PATCH /tickets/:id/parts/:part_id` - Update part status (mark received)
