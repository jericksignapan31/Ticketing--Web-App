# Frontend Implementation Guide - Hold Status Flow

## Overview
When IT staff completes a ticket and selects **"need_buy_parts"**, the ticket status should change to **`hold`** (not `resolved`). This document explains the flow and what the frontend needs to do.

---

## Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│  TICKET DETAIL PAGE (status: in_progress)                   │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ├─ Show [Complete] button
                       │
                       └─ User clicks [Complete]
                              │
                              ↓
        ┌──────────────────────────────────────────┐
        │  COMPLETE TICKET MODAL APPEARS           │
        ├──────────────────────────────────────────┤
        │                                          │
        │  Form Fields:                            │
        │  • Unit Status [Dropdown]                │
        │    ├─ working                            │
        │    ├─ not_working                        │
        │    ├─ partially_working                  │
        │    └─ need_buy_parts ← User selects this│
        │  • Observation [Text Area]               │
        │  • Action Taken [Text Area]              │
        │  • Recommendation [Optional]             │
        │  • Additional Notes [Optional]           │
        │                                          │
        │  [Cancel] [Submit]                       │
        └──────────────┬───────────────────────────┘
                       │
                       ├─ User fills form
                       ├─ Selects "need_buy_parts"
                       └─ Clicks [Submit]
                              │
                              ↓
        ┌──────────────────────────────────────────┐
        │  SEND TO BACKEND                         │
        ├──────────────────────────────────────────┤
        │                                          │
        │ PATCH /tickets/{id}/complete             │
        │ Content-Type: application/json           │
        │ Authorization: Bearer {token}            │
        │                                          │
        │ Request Body:                            │
        │ {                                        │
        │   "unit_status": "need_buy_parts",      │
        │   "observation": "...",                  │
        │   "action_taken": "...",                 │
        │   "recommendation": "...",               │
        │   "resolution_notes": "..."              │
        │ }                                        │
        │                                          │
        └──────────────┬───────────────────────────┘
                       │
                       ↓
        ┌──────────────────────────────────────────┐
        │  BACKEND PROCESSING                      │
        ├──────────────────────────────────────────┤
        │                                          │
        │ 1. Receives unit_status = "need_buy_parts"
        │ 2. Checks: needsBuyParts = true          │
        │ 3. Sets: ticket.status = "hold" ✅      │
        │    (NOT "resolved")                      │
        │ 4. Saves all fields:                     │
        │    - observation                         │
        │    - action_taken                        │
        │    - recommendation                      │
        │    - resolution_notes                    │
        │                                          │
        └──────────────┬───────────────────────────┘
                       │
                       ↓
        ┌──────────────────────────────────────────┐
        │  RESPONSE FROM BACKEND                   │
        ├──────────────────────────────────────────┤
        │                                          │
        │ Status: 200 OK                           │
        │ Body:                                    │
        │ {                                        │
        │   "ticket_id": "uuid-123",               │
        │   "status": "hold",  ← NEW STATUS       │
        │   "unit_status": "need_buy_parts",       │
        │   "observation": "Keyboard broken",      │
        │   "action_taken": "Tested all keys",     │
        │   "approved": true,                      │
        │   ...                                    │
        │ }                                        │
        │                                          │
        └──────────────┬───────────────────────────┘
                       │
                       ↓
        ┌──────────────────────────────────────────┐
        │  UPDATE FRONTEND UI                      │
        ├──────────────────────────────────────────┤
        │                                          │
        │ 1. Close modal                           │
        │ 2. Reload ticket or update state         │
        │ 3. Show updated ticket with:             │
        │    - Status: "hold" (orange badge)       │
        │    - Unit Status: "need_buy_parts"       │
        │ 4. Show Parts Section:                   │
        │    - [+ Request New Parts] button        │
        │    - Empty parts list (or show existing) │
        │ 5. Hide [Complete] button (already done) │
        │                                          │
        └──────────────────────────────────────────┘
```

---

## Frontend Implementation Steps

### Step 1: Display Complete Ticket Modal

**Where:** When user clicks [Complete] button on in_progress ticket

**Show Modal with Form:**
```html
<form [formGroup]="completeForm" (ngSubmit)="onSubmit()">
  
  <!-- Unit Status Dropdown -->
  <mat-form-field>
    <mat-label>Unit Status *</mat-label>
    <mat-select formControlName="unit_status" required>
      <mat-option value="">-- Select Status --</mat-option>
      <mat-option value="working">Working</mat-option>
      <mat-option value="not_working">Not Working</mat-option>
      <mat-option value="partially_working">Partially Working</mat-option>
      <mat-option value="need_buy_parts">Need Buy Parts</mat-option>
    </mat-select>
  </mat-form-field>

  <!-- Observation -->
  <mat-form-field>
    <mat-label>Observation *</mat-label>
    <textarea matInput formControlName="observation" required></textarea>
  </mat-form-field>

  <!-- Action Taken -->
  <mat-form-field>
    <mat-label>Action Taken *</mat-label>
    <textarea matInput formControlName="action_taken" required></textarea>
  </mat-form-field>

  <!-- Recommendation (Optional) -->
  <mat-form-field>
    <mat-label>Recommendation</mat-label>
    <textarea matInput formControlName="recommendation"></textarea>
  </mat-form-field>

  <!-- Additional Notes (Optional) -->
  <mat-form-field>
    <mat-label>Additional Notes</mat-label>
    <textarea matInput formControlName="resolution_notes"></textarea>
  </mat-form-field>

  <!-- Buttons -->
  <button type="button" (click)="onCancel()">Cancel</button>
  <button type="submit" [disabled]="!completeForm.valid">Submit</button>
</form>
```

---

### Step 2: Handle Form Submission

**File:** `ticket.service.ts` or `ticket.component.ts`

```typescript
export class TicketComponent {
  completeForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private ticketService: TicketService,
    private notificationService: NotificationService
  ) {
    this.completeForm = this.fb.group({
      unit_status: ['', Validators.required],
      observation: ['', Validators.required],
      action_taken: ['', Validators.required],
      recommendation: [''],
      resolution_notes: ['']
    });
  }

  onSubmit() {
    if (!this.completeForm.valid) {
      console.error('Form is invalid');
      return;
    }

    const formData = this.completeForm.value;
    
    // DEBUG: Log what we're sending
    console.log('📤 Sending complete ticket request:', {
      ticketId: this.ticketId,
      formData: formData
    });

    this.ticketService.completeTicket(this.ticketId, formData).subscribe(
      (response) => {
        console.log('✅ Ticket completed:', response);
        
        // Check the returned status
        if (response.status === 'hold') {
          console.log('🟠 Ticket is now ON HOLD (waiting for parts)');
          this.notificationService.success(
            'Ticket marked as HOLD - waiting for parts'
          );
          
          // Show parts management UI
          this.showPartsSection = true;
        } else if (response.status === 'resolved') {
          console.log('🟢 Ticket is RESOLVED');
          this.notificationService.success(
            'Ticket has been resolved'
          );
          
          // Hide parts management UI
          this.showPartsSection = false;
        }

        // Reload ticket details
        this.loadTicket();
        
        // Close modal
        this.closeModal();
      },
      (error) => {
        console.error('❌ Error completing ticket:', error);
        this.notificationService.error(
          error.error?.message || 'Failed to complete ticket'
        );
      }
    );
  }
}
```

---

### Step 3: Update Ticket Service

**File:** `ticket.service.ts`

```typescript
export class TicketService {
  constructor(private http: HttpClient) {}

  completeTicket(
    ticketId: string,
    data: {
      unit_status: string;
      observation: string;
      action_taken: string;
      recommendation?: string;
      resolution_notes?: string;
    }
  ) {
    return this.http.patch(
      `http://localhost:3000/tickets/${ticketId}/complete`,
      data,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getToken()}`
        }
      }
    );
  }

  // New method to get hold tickets
  getHoldTickets() {
    return this.http.get(
      'http://localhost:3000/tickets/hold',
      {
        headers: {
          'Authorization': `Bearer ${this.getToken()}`
        }
      }
    );
  }

  private getToken(): string {
    return localStorage.getItem('auth_token') || '';
  }
}
```

---

### Step 4: Display Parts Section (When Status = hold)

**Show parts management UI only when status is "hold":**

```html
<!-- CONDITIONAL: Show only if status = 'hold' -->
<div *ngIf="ticket.status === 'hold'" class="parts-section">
  
  <h3>Parts Tracking</h3>
  
  <!-- Parts Summary -->
  <div class="parts-summary">
    <p>Status: <strong>ON HOLD</strong> - Waiting for parts</p>
    <p>Unit Status: <strong>{{ ticket.unit_status }}</strong></p>
  </div>

  <!-- Request New Parts Button -->
  <button mat-raised-button color="primary" (click)="openPartRequestModal()">
    + Request New Parts
  </button>

  <!-- Parts List -->
  <div *ngIf="ticket.parts && ticket.parts.length > 0" class="parts-list">
    <h4>Requested Parts:</h4>
    <table>
      <thead>
        <tr>
          <th>Part Name</th>
          <th>Quantity</th>
          <th>Unit Cost</th>
          <th>Total Cost</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let part of ticket.parts">
          <td>{{ part.part_name }}</td>
          <td>{{ part.quantity }}</td>
          <td>{{ part.unit_cost | currency }}</td>
          <td>{{ part.total_cost | currency }}</td>
          <td>
            <mat-chip-set>
              <mat-chip [ngClass]="'status-' + part.status">
                {{ part.status }}
              </mat-chip>
            </mat-chip-set>
          </td>
          <td>
            <button (click)="editPart(part)">Edit</button>
            <button (click)="deletePart(part.part_id)">Delete</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- If no parts yet -->
  <div *ngIf="!ticket.parts || ticket.parts.length === 0" class="no-parts">
    <p>No parts requested yet.</p>
  </div>

</div>
```

---

### Step 5: Status Badge Display

**Update ticket list/detail to show "HOLD" status:**

```html
<!-- Status Badge -->
<mat-chip-set>
  <mat-chip 
    [ngClass]="{
      'status-pending_approval': ticket.status === 'pending_approval',
      'status-approved': ticket.status === 'approved',
      'status-assigned': ticket.status === 'assigned',
      'status-in_progress': ticket.status === 'in_progress',
      'status-hold': ticket.status === 'hold',  <!-- NEW: Hold status -->
      'status-resolved': ticket.status === 'resolved',
      'status-rejected': ticket.status === 'rejected'
    }"
  >
    {{ ticket.status | titlecase }}
  </mat-chip>
</mat-chip-set>
```

**CSS for hold status:**
```css
.status-hold {
  background-color: #ff9800 !important;  /* Orange */
  color: white !important;
}
```

---

## API Reference

### Complete Ticket Endpoint

```
PATCH /tickets/{id}/complete

Headers:
  Content-Type: application/json
  Authorization: Bearer {token}

Request Body:
{
  "unit_status": "working|not_working|partially_working|need_buy_parts",
  "observation": "string (required)",
  "action_taken": "string (required)",
  "recommendation": "string (optional)",
  "resolution_notes": "string (optional)"
}

Response (200):
{
  "ticket_id": "uuid",
  "status": "hold|resolved",  ← Depends on unit_status
  "unit_status": "need_buy_parts|working|etc",
  "observation": "...",
  "action_taken": "...",
  "resolved_at": null,  ← null if hold, timestamp if resolved
  ...
}
```

---

## Get Hold Tickets Endpoint

```
GET /tickets/hold

Headers:
  Authorization: Bearer {token}

Response (200):
[
  {
    "ticket_id": "uuid-1",
    "status": "hold",
    "unit_status": "need_buy_parts",
    "parts": [
      {
        "part_id": "uuid",
        "part_name": "Keyboard",
        "quantity": 1,
        "unit_cost": 1500.00,
        "total_cost": 1500.00,
        "status": "pending",
        ...
      }
    ],
    ...
  },
  ...
]
```

---

## Testing Scenarios

### Scenario 1: Complete Ticket as "working"
```
1. Open ticket with status: in_progress
2. Click [Complete]
3. Fill modal:
   - Unit Status: "working"
   - Observation: "Fixed keyboard driver issue"
   - Action Taken: "Reinstalled drivers"
4. Click Submit
5. EXPECT: 
   ✅ Ticket status changes to "resolved"
   ✅ Parts section is NOT shown
   ✅ Notification: "Ticket has been resolved"
```

### Scenario 2: Complete Ticket as "need_buy_parts"
```
1. Open ticket with status: in_progress
2. Click [Complete]
3. Fill modal:
   - Unit Status: "need_buy_parts" ← SELECT THIS
   - Observation: "Keyboard is broken"
   - Action Taken: "Tested, keyboard unresponsive"
4. Click Submit
5. EXPECT:
   ✅ Ticket status changes to "hold" (orange badge)
   ✅ Parts section IS shown
   ✅ Button: [+ Request New Parts] appears
   ✅ Notification: "Ticket marked as HOLD - waiting for parts"
```

### Scenario 3: View All Hold Tickets
```
1. Click menu item: "On Hold Tickets" or similar
2. Call: GET /tickets/hold
3. EXPECT:
   ✅ Shows all tickets with status: "hold"
   ✅ Shows their parts if any
   ✅ Filtered by user's department
```

---

## Debugging Tips

### Check Network Tab:
1. Open DevTools (F12)
2. Go to **Network** tab
3. Complete a ticket
4. Look for request to `/tickets/.../complete`
5. Check **Response** body:
   - Should show: `"status": "hold"` (if need_buy_parts selected)
   - Should show: `"status": "resolved"` (if other option selected)

### Console Logs:
```typescript
// Frontend should log:
console.log('📤 Sending complete ticket request:', {
  unit_status: "need_buy_parts",
  observation: "...",
  ...
});

console.log('✅ Ticket completed:', response);
console.log('Status is now:', response.status);
```

### Backend Logs:
Check server terminal for:
```
🔍 DEBUG: completeTicket
  unit_status: need_buy_parts
  needsBuyParts: true
  Will set status to: hold
```

---

## Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| Parts section not showing | Status is not "hold" | Check backend response - verify `unit_status` is "need_buy_parts" |
| Modal not closing | Submit error occurred | Check console logs and error response from API |
| Parts list empty | No parts requested yet | That's normal - show message "No parts requested yet" |
| Ticket still shows in-progress | Page not reloaded | Reload ticket details after modal closes |
| Wrong status in badge | Old cached data | Clear cache and reload page |

---

## Summary

**What Frontend Needs to Do:**
1. ✅ Show complete ticket modal with 5 fields
2. ✅ When user selects "need_buy_parts" and submits → send to backend
3. ✅ Backend returns `status: "hold"`
4. ✅ Update UI to show orange "HOLD" badge
5. ✅ Show parts management section
6. ✅ Allow requesting/tracking parts

**Key Points:**
- ✅ Dropdown value must be exactly `"need_buy_parts"`
- ✅ All 5 form fields must be in request body
- ✅ Check `response.status` to determine UI behavior
- ✅ Show parts section ONLY when status is "hold"
- ✅ Parts section stays visible until ticket is completed again

---

## Commits Ready for Frontend

When backend is deployed (git push):
- `c367d53` - Status change to hold
- `f720d83` - Documentation

Frontend can then integrate with:
- `PATCH /tickets/{id}/complete` - Returns status="hold"
- `GET /tickets/hold` - Gets all on-hold tickets
- Parts endpoints - Request/track parts
