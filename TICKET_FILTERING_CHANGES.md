# Ticket Filtering Changes - Frontend Implementation Guide

## Overview
Implemented **role-based department filtering** for ticket endpoints. Users now see tickets filtered by their role and department.

---

## Filtering Rules

### 1. **Admin & IT Staff**
- ✅ See **ALL tickets** across all departments
- No department restrictions
- Can view tickets from any department

### 2. **Employees & Supervisors**
- ✅ See **ONLY tickets from their own department**
- Automatically filtered based on their `departmentId` from JWT token
- Cannot see tickets from other departments

---

## Updated Endpoints

All ticket query endpoints now support automatic role-based filtering:

### Get All Tickets
```
GET /tickets
```
**Response:** 
- Admin/IT: All tickets
- Employee/Supervisor: Only tickets from their department

**Query Parameters (Optional):**
- `department_id`: Override filter (only works for Admin/IT, ignored for Employee/Supervisor)

**Example:**
```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:3000/tickets
```

---

### Search Tickets
```
GET /tickets/search?q=<search_query>
```
**Query Parameters:**
- `q`: Search term (searches subject, description, category)
- `department_id`: Optional filter (only for Admin/IT)

**Response:**
- Admin/IT: All matching tickets
- Employee/Supervisor: Only matching tickets from their department

**Example:**
```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:3000/tickets/search?q=laptop
```

---

### Get Tickets by Status
```
GET /tickets/status/:status
```
**Path Parameters:**
- `status`: pending, assigned, in_progress, completed, cancelled, etc.

**Query Parameters (Optional):**
- `department_id`: Override filter (only for Admin/IT)

**Response:**
- Admin/IT: All tickets with that status
- Employee/Supervisor: Only tickets with that status from their department

**Example:**
```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:3000/tickets/status/pending
```

---

### Get Tickets by Priority
```
GET /tickets/priority/:priority
```
**Path Parameters:**
- `priority`: low, medium, high, critical

**Query Parameters (Optional):**
- `department_id`: Override filter (only for Admin/IT)

**Response:**
- Admin/IT: All tickets with that priority
- Employee/Supervisor: Only tickets with that priority from their department

**Example:**
```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:3000/tickets/priority/high
```

---

### Get Tickets by Category
```
GET /tickets/category/:category
```
**Path Parameters:**
- `category`: Hardware, Software, Network, etc.

**Query Parameters (Optional):**
- `department_id`: Override filter (only for Admin/IT)

**Response:**
- Admin/IT: All tickets in that category
- Employee/Supervisor: Only tickets in that category from their department

**Example:**
```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:3000/tickets/category/Hardware
```

---

### Get Pending Approvals (Supervisor/Admin Only)
```
GET /tickets/pending-approvals
```
**Authentication:** Requires SUPERVISOR or ADMIN role

**Query Parameters (Optional):**
- `department_id`: Override filter (only for Admin)

**Response:**
- Admin: All pending tickets from all departments
- Supervisor: Only pending tickets from their department

**Example:**
```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:3000/tickets/pending-approvals
```

---

### Get Tickets by Approval Status (Supervisor/Admin Only)
```
GET /tickets/approval-status/:status
```
**Path Parameters:**
- `status`: pending, approved, rejected

**Authentication:** Requires SUPERVISOR or ADMIN role

**Query Parameters (Optional):**
- `department_id`: Override filter (only for Admin)

**Response:**
- Admin: All tickets with that approval status
- Supervisor: Only tickets with that approval status from their department

**Example:**
```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:3000/tickets/approval-status/approved
```

---

## Response Format

All ticket responses now include the `department_id` field:

```json
{
  "ticket_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "employee_id": "EMP001",
  "asset_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567891",
  "assigned_to": "IT001",
  "category": "Hardware",
  "priority": "high",
  "status": "assigned",
  "approval_status": "approved",
  "subject": "Laptop keyboard not working",
  "description": "The keyboard stopped working after Windows update",
  "department_id": "DEPT001",
  "created_at": "2026-05-26T12:05:11Z",
  "updated_at": "2026-05-26T12:05:11Z",
  "asset": {
    "asset_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567891",
    "asset_name": "Laptop",
    "asset_type": "Computer",
    "serial_number": "ABC123456",
    "brand": { ... },
    "branch": { ... }
  }
}
```

---

## Frontend Implementation Checklist

### 1. **Ticket List View**
- [ ] Update `GET /tickets` call to not filter by department (backend does it automatically)
- [ ] Display tickets returned by the API
- [ ] Show `department_id` if needed for admin/it users

### 2. **Search Functionality**
- [ ] Update search endpoint to `GET /tickets/search?q=query`
- [ ] Department filter applied automatically

### 3. **Filter Dropdowns**
- [ ] Status filter: `GET /tickets/status/:status`
- [ ] Priority filter: `GET /tickets/priority/:priority`
- [ ] Category filter: `GET /tickets/category/:category`
- All filters now work with automatic department filtering

### 4. **Pending Approvals (Supervisor/Admin)**
- [ ] Update to `GET /tickets/pending-approvals`
- [ ] Only shows pending tickets from user's department (if supervisor)
- [ ] Shows all pending tickets (if admin)

### 5. **Approval Status Filter**
- [ ] Update to `GET /tickets/approval-status/:status`
- [ ] Only for supervisors and admins
- [ ] Automatic department filtering applied

### 6. **Authorization Handling**
- [ ] No changes needed - backend validates roles
- [ ] If non-admin/it users try to access admin endpoints, they get 401/403

---

## Key Points for Frontend

### ✅ What Changed
1. All ticket query endpoints now filter by user's department automatically
2. Employees and supervisors cannot see tickets from other departments
3. Admin and IT staff see all tickets across all departments

### ✅ What Stayed the Same
1. Endpoint URLs remain the same
2. Request/response formats unchanged
3. Authentication still uses JWT bearer token
4. Query parameters remain optional

### ✅ Important Notes
- **No breaking changes** - existing frontend code will work
- Department filtering happens **server-side** - frontend doesn't need to implement it
- `department_id` is now included in all ticket responses
- Admin/IT users can optionally pass `department_id` query param to override (for filtering specific departments)

---

## Testing Examples

### Test 1: Employee viewing tickets
```
User Role: employee
User Department: HR
Request: GET /tickets
Result: Only tickets with department_id = "HR" (auto-filtered)
```

### Test 2: Supervisor viewing pending approvals
```
User Role: supervisor
User Department: IT
Request: GET /tickets/pending-approvals
Result: Only pending tickets with department_id = "IT" (auto-filtered)
```

### Test 3: Admin viewing all tickets
```
User Role: admin
Request: GET /tickets
Result: All tickets from all departments
```

### Test 4: Admin filtering specific department
```
User Role: admin
Request: GET /tickets?department_id=HR
Result: Only tickets with department_id = "HR"
```

---

## Migration Guide

### If using old department query parameter
**Before:**
```
GET /tickets?department_id=HR (worked for anyone)
```

**Now:**
```
GET /tickets (auto-filters for employee/supervisor)
GET /tickets?department_id=HR (only works for admin/it to override)
```

### No code changes needed if:
- Your frontend was already calling the endpoints without filters
- Your frontend relies on the API to provide correct data
- Your authentication is working correctly with JWT

---

## Database Schema Change

A new column was added to the `ticket` table:
```sql
department_id VARCHAR(50) -- stores the reporter's department
```

This field is **auto-populated** when a ticket is created based on the employee's department.

---

## Deployment Status

✅ **All changes deployed to production (Render.com)**
- Git commits: `44c540e`, `954e56f`, `3c2672e`, `e44a0d0`
- Automatic role-based filtering is now live

---

## Questions for Frontend?

If frontend team has questions:
1. Which endpoints to call for different views
2. How to handle the new `department_id` field in responses
3. How to display filtering UI differently for admin/it vs employee/supervisor

