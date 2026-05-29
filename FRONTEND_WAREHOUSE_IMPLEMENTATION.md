# Frontend Implementation Guide - WAREHOUSE Role

## What Frontend Needs to Build

### Overview
New features for warehouse staff and admin dashboard to manage part requests and inventory.

---

## WAREHOUSE STAFF FEATURES

### 1. Dashboard Tab: "Request Parts"

**What to display:**
- Form to request parts
- List of my part requests with their status

#### Request Parts Form

**Fields:**
| Field | Type | Required | Validation |
|-------|------|----------|-----------|
| Part Name | text | Yes | Min 1 char |
| Quantity | number | Yes | Must be > 0 |
| Unit Cost | number | Yes | Must be > 0 |
| Supplier | text | Yes | Min 1 char |
| Notes | textarea | No | Optional |

**Buttons:**
- Submit (POST /warehouse/part-requests)
- Clear

**Response handling:**
- ✅ Success → Show success toast, clear form, refresh list
- ❌ Error → Show error toast with message

#### My Part Requests List

**GET** `/warehouse/part-requests/my-requests`

**Display as table or cards:**

| Column | Data | Format |
|--------|------|--------|
| Part Name | `part_name` | Text |
| Qty | `quantity` | Number |
| Unit Cost | `unit_cost` | ₱ currency |
| Total Cost | `total_cost` | ₱ currency (Qty × Unit Cost) |
| Supplier | `supplier` | Text |
| Status | `status` | Badge (pending/approved/rejected) |
| Requested | `requested_at` | Date (MM/DD/YYYY) |
| Approved | `approved_at` | Date or "-" |
| Reason | `rejection_reason` | Text or "-" |

**Status Badge Colors:**
```css
.status-pending { background: #FFF3CD; color: #856404; } /* Yellow */
.status-approved { background: #D4EDDA; color: #155724; } /* Green */
.status-rejected { background: #F8D7DA; color: #721C24; } /* Red */
```

**Actions per status:**
- **pending** → Show "Waiting for approval..." message
- **approved** → Show "✓ Approved" with date
- **rejected** → Show "✗ Rejected: [reason]"

---

### 2. Dashboard Tab: "Inventory"

**What to show:**
- All parts across all tickets
- Filter by status or supplier
- Search functionality

#### Inventory Page

**GET** `/tickets/inventory/all`

**Filter Buttons (Top):**
- All Parts
- Pending
- Ordered
- Received

**Optional: Supplier Filter**
- Dropdown or searchable select
- **GET** `/tickets/inventory/supplier/:supplier`

**Display as table:**

| Column | Data | Format |
|--------|------|--------|
| Part Name | `part_name` | Text |
| Qty | `quantity` | Number |
| Unit Cost | `unit_cost` | ₱ currency |
| Total Cost | `total_cost` | ₱ currency |
| Supplier | `supplier` | Text |
| Status | `status` | Badge |
| Requested | `requested_date` | Date |
| Received | `received_date` | Date or "-" |
| Ticket | `ticket.subject` | Link to ticket |

**Optional: Summary Stats**
```
Total Parts Requested: 45
Pending: 12
Ordered: 8
Received: 25
Total Value: ₱125,000
```

---

### 3. Dashboard Tab: "Approve Tickets" (NEW)

**Important:** Warehouse staff can now approve tickets like supervisors!

**GET** `/tickets/pending-approvals`

**Same as SUPERVISOR view:**
- Show pending approval tickets
- Approve/Reject buttons
- View ticket details
- Department filtered (if applicable)

---

## ADMIN FEATURES

### 1. Admin Dashboard: "Part Requests" Section

#### Pending Requests Tab

**GET** `/warehouse/part-requests/pending`

**Display as table/cards:**

| Column | Data | Format |
|--------|------|--------|
| Requester | `requester.name` | Name |
| Part Name | `part_name` | Text |
| Qty | `quantity` | Number |
| Total Cost | `total_cost` | ₱ currency |
| Supplier | `supplier` | Text |
| Requested | `requested_at` | Date & Time |
| Status | `status` | "pending" badge |
| Notes | `notes` | Text (truncated) |

**Action Buttons:**
- 🔍 View Details
- ✅ Approve
- ❌ Reject

#### All Requests Tab

**GET** `/warehouse/part-requests/all`

**Display all (including approved/rejected):**

| Column | Data | Format |
|--------|------|--------|
| Requester | `requester.name` | Name |
| Part Name | `part_name` | Text |
| Status | `status` | Badge (pending/approved/rejected) |
| Total Cost | `total_cost` | ₱ currency |
| Requested | `requested_at` | Date |
| Approved | `approved_at` | Date or "-" |
| Reason | `rejection_reason` | Text or "-" |

**Filter/Search:**
- By status (dropdown)
- By requester (search)
- By date range (optional)

---

### 2. Approve/Reject Modal

**Triggered by:** "Approve" or "Reject" button on request row

**Approve:**
```
Modal: "Approve Part Request?"
Part: Mechanical Keyboard
Quantity: 10
Total: ₱5,000

[Cancel] [Approve]
```

**Action:** PATCH `/warehouse/part-requests/:id/approve`
```json
{
  "action": "approved"
}
```

**Reject:**
```
Modal: "Reject Part Request?"
Part: Mechanical Keyboard

[Required] Reason for rejection:
[Textarea with placeholder "e.g., Out of stock with supplier"]

[Cancel] [Reject]
```

**Action:** PATCH `/warehouse/part-requests/:id/approve`
```json
{
  "action": "rejected",
  "rejection_reason": "Out of stock with supplier"
}
```

---

## Component Structure

```
<App>
  ├── <WarehouseLayout> (If user.role === WAREHOUSE)
  │   ├── <RequestPartsTab>
  │   │   ├── <RequestPartsForm />
  │   │   └── <MyPartRequestsList />
  │   ├── <InventoryTab>
  │   │   ├── <FilterButtons />
  │   │   └── <PartsList />
  │   └── <ApproveTicketsTab> (NEW - same as Supervisor)
  │       └── <PendingTickets />
  │
  └── <AdminLayout>
      └── <PartRequestsSection> (NEW)
          ├── <PendingRequestsTab>
          │   └── <RequestsList />
          ├── <AllRequestsTab>
          │   └── <RequestsList />
          └── <ApproveRejectModal />
```

---

## Data Flow Diagrams

### Warehouse Part Request Flow
```
Warehouse Staff:
  Fill Form → POST /warehouse/part-requests → Show Success

Admin:
  GET /warehouse/part-requests/pending → View List
  Click Approve → PATCH /approve with action=approved → Refresh
  OR
  Click Reject → Open Modal → Enter Reason → PATCH /approve with action=rejected → Refresh

Warehouse Staff:
  GET /warehouse/part-requests/my-requests → See status updated
```

---

## API Calls Cheat Sheet

### Warehouse Calls
```javascript
// Request parts
POST /warehouse/part-requests
Body: { part_name, quantity, unit_cost, supplier, notes }

// View my requests
GET /warehouse/part-requests/my-requests

// View single request
GET /warehouse/part-requests/:id

// View all inventory
GET /tickets/inventory/all

// Filter by status
GET /tickets/inventory/status/pending
GET /tickets/inventory/status/ordered
GET /tickets/inventory/status/received

// Filter by supplier
GET /tickets/inventory/supplier/Lazada

// Approve tickets (NEW)
GET /tickets/pending-approvals
PATCH /tickets/:id/approve
```

### Admin Calls
```javascript
// Get pending part requests
GET /warehouse/part-requests/pending

// Get all part requests
GET /warehouse/part-requests/all

// Get single request
GET /warehouse/part-requests/:id

// Approve request
PATCH /warehouse/part-requests/:id/approve
Body: { action: "approved" }

// Reject request
PATCH /warehouse/part-requests/:id/approve
Body: { action: "rejected", rejection_reason: "..." }
```

---

## Error Handling

**Common Errors:**

| Error | Message | User Action |
|-------|---------|-------------|
| 400 | "part_name is required" | Fix form |
| 400 | "quantity must be positive" | Fix quantity |
| 400 | "rejection_reason is required" | Add reason when rejecting |
| 401 | "Unauthorized" | Check token/permissions |
| 404 | "Request not found" | Refresh page |
| 400 | "Request must be pending" | Can't approve already approved request |

**Display as toast/alert with error message**

---

## Loading States

Show loading spinner/skeleton while:
- Form submitting
- List loading
- Approve/reject action in progress

Disable buttons during loading.

---

## Success Notifications

**After successful POST/PATCH:**
- Toast: "✓ Part request created successfully"
- Toast: "✓ Request approved"
- Toast: "✗ Request rejected"
- Auto-hide after 3 seconds

---

## Testing Scenarios

**Warehouse Staff:**
- [ ] Can submit part request with all fields
- [ ] Form validates required fields
- [ ] Can view my part requests list
- [ ] Statuses display correctly (pending/approved/rejected)
- [ ] Can view rejection reason
- [ ] Can view inventory
- [ ] Can filter inventory by status
- [ ] Can filter inventory by supplier
- [ ] Can view and approve tickets in "Approve Tickets" tab
- [ ] 403 error if trying to access admin endpoints

**Admin:**
- [ ] Can view pending part requests
- [ ] Can view all part requests
- [ ] Can approve part request
- [ ] Can reject part request with reason
- [ ] Rejection reason required field works
- [ ] Part request status updates after approval
- [ ] Can view requester details
- [ ] Timestamps display correctly
- [ ] 403 error if warehouse tries to access admin endpoints

---

## Implementation Checklist

**Phase 1: Warehouse Request Parts**
- [ ] Create request parts form component
- [ ] Create my requests list component
- [ ] Wire up POST /warehouse/part-requests
- [ ] Add form validation
- [ ] Add error/success notifications

**Phase 2: Warehouse Inventory View**
- [ ] Create inventory page with filter buttons
- [ ] Wire up GET /tickets/inventory/all
- [ ] Wire up GET /tickets/inventory/status/:status
- [ ] Add supplier filter (optional)

**Phase 3: Warehouse Approve Tickets (NEW)**
- [ ] Show "Approve Tickets" tab for warehouse
- [ ] Reuse supervisor approval logic
- [ ] Display pending tickets
- [ ] Wire up approve/reject

**Phase 4: Admin Part Request Management**
- [ ] Create admin dashboard section
- [ ] Create pending requests tab
- [ ] Create all requests tab
- [ ] Wire up GET /warehouse/part-requests/pending
- [ ] Wire up GET /warehouse/part-requests/all
- [ ] Create approve/reject modal
- [ ] Wire up PATCH /warehouse/part-requests/:id/approve

**Phase 5: Testing & Polish**
- [ ] Test all scenarios
- [ ] Mobile responsive design
- [ ] Loading states
- [ ] Error handling
- [ ] Accessibility (ARIA labels, keyboard nav)

---

## UI/UX Tips

1. **Part Requests Form:**
   - Show total cost auto-calculated below (qty × unit_cost)
   - Clear form on successful submit
   - Show loading spinner on submit button

2. **Lists:**
   - Make supplier/requester names clickable (filter by that value)
   - Sortable columns (click header to sort)
   - Pagination if list > 50 items

3. **Modals:**
   - Confirm action before approval/rejection
   - Show part details in modal header
   - Rejection reason must be at least 10 characters (optional)

4. **Colors/Icons:**
   - Pending: ⏳ Yellow (#FFF3CD)
   - Approved: ✓ Green (#D4EDDA)
   - Rejected: ✗ Red (#F8D7DA)

---

## Notes

- All endpoints require JWT authentication
- Timestamps in ISO 8601 format (convert to local on frontend)
- Costs are decimal (format as currency with 2 decimals)
- All requests properly handle 401/403/404/400 errors
- Role-based access already enforced on backend (frontend can rely on it)
