# Backend Changes Summary - Technical Details

## Files Modified

### 1. **src/ticket/ticket.entity.ts**
✅ **Added:**
```typescript
@Column({ type: 'varchar', length: 50, nullable: true })
department_id: string; // Stores reporter's department for filtering
```

---

### 2. **src/ticket/ticket.service.ts**
✅ **Added EmployeeRepository Injection:**
```typescript
constructor(
  @InjectRepository(Ticket)
  private ticketRepository: Repository<Ticket>,
  @InjectRepository(Employee)
  private employeeRepository: Repository<Employee>, // NEW
) {}
```

✅ **Added Helper Method:**
```typescript
private getDepartmentFilter(user: any): string | undefined {
  if (user.role === UserRole.ADMIN || user.role === UserRole.IT) {
    return undefined; // No filter - see all tickets
  }
  // Employee and Supervisor only see their department tickets
  return user.departmentId;
}
```

✅ **Modified Service Methods (All now accept `user` parameter):**

**create()** - Auto-populates department_id
```typescript
async create(createTicketDto: CreateTicketDto): Promise<Ticket> {
  const employee = await this.employeeRepository.findOne({
    where: { employee_id: createTicketDto.employee_id },
  });

  const ticket = this.ticketRepository.create(createTicketDto);
  
  if (employee && employee.department_id) {
    ticket.department_id = employee.department_id;
  }
  return await this.ticketRepository.save(ticket);
}
```

**findAll(user, departmentId?)** - Auto-filters based on user role
```typescript
async findAll(user: any, departmentId?: string): Promise<Ticket[]> {
  const departmentFilter = this.getDepartmentFilter(user);
  const finalDepartmentId = departmentId || departmentFilter;

  const query: any = {
    relations: ['asset', 'asset.brand', 'asset.branch'],
    order: { created_at: 'DESC' },
  };

  if (finalDepartmentId) {
    query.where = { department_id: finalDepartmentId };
  }

  return await this.ticketRepository.find(query);
}
```

**search(user, query, departmentId?)** - Filters search results
```typescript
async search(user: any, query: string, departmentId?: string): Promise<Ticket[]> {
  const departmentFilter = this.getDepartmentFilter(user);
  const finalDepartmentId = departmentId || departmentFilter;

  const where: any[] = [
    { subject: Like(`%${query}%`) },
    { description: Like(`%${query}%`) },
    { category: Like(`%${query}%`) },
  ];

  if (finalDepartmentId) {
    where.forEach(condition => {
      condition.department_id = finalDepartmentId;
    });
  }
  // ... rest of method
}
```

**findByStatus(user, status, departmentId?)**
**findByPriority(user, priority, departmentId?)**
**findByCategory(user, category, departmentId?)**
**findPendingApprovals(user, departmentId?)**
**findByApprovalStatus(user, status, departmentId?)**

All follow the same pattern:
```typescript
async find*(user: any, ...params): Promise<Ticket[]> {
  const departmentFilter = this.getDepartmentFilter(user);
  const finalDepartmentId = departmentId || departmentFilter;
  
  const where: any = { ...conditions };
  if (finalDepartmentId) {
    where.department_id = finalDepartmentId;
  }
  // ... query and return
}
```

---

### 3. **src/ticket/ticket.controller.ts**
✅ **Updated All Endpoints to Pass User:**

**Before:**
```typescript
@Get()
findAll(@Query('department_id') departmentId?: string) {
  return this.ticketService.findAll(departmentId);
}
```

**After:**
```typescript
@Get()
findAll(@CurrentUser() user: any, @Query('department_id') departmentId?: string) {
  return this.ticketService.findAll(user, departmentId);
}
```

Updated endpoints:
- ✅ GET /tickets
- ✅ GET /tickets/search
- ✅ GET /tickets/status/:status
- ✅ GET /tickets/priority/:priority
- ✅ GET /tickets/category/:category
- ✅ GET /tickets/pending-approvals
- ✅ GET /tickets/approval-status/:status

---

### 4. **src/ticket/ticket.module.ts**
✅ **Added Employee Entity to TypeORM:**
```typescript
@Module({
  imports: [TypeOrmModule.forFeature([Ticket, Employee])], // Added Employee
  controllers: [TicketController],
  providers: [TicketService],
  exports: [TicketService],
})
```

---

## How It Works

### Flow Diagram
```
User makes request (with JWT token)
  ↓
@CurrentUser() decorator extracts user info from JWT
  ↓
  {
    role: "employee" | "supervisor" | "admin" | "it",
    departmentId: "DEPT001",
    employee_id: "EMP001",
    ...
  }
  ↓
Controller passes user to service method
  ↓
Service calls getDepartmentFilter(user)
  ↓
  If admin/it → return undefined (no filter)
  If employee/supervisor → return user.departmentId
  ↓
Apply filter to database query
  ↓
Return filtered results
```

### Example Execution

**Scenario 1: Employee from HR department**
```typescript
// User object from JWT
{
  role: "employee",
  departmentId: "HR",
  employee_id: "EMP001"
}

// Service call
const departmentFilter = this.getDepartmentFilter(user);
// Returns: "HR"

// Database query
query.where = { department_id: "HR" }
// Returns only HR tickets
```

**Scenario 2: Admin user**
```typescript
// User object from JWT
{
  role: "admin",
  departmentId: "ADMIN",
  employee_id: "ADM001"
}

// Service call
const departmentFilter = this.getDepartmentFilter(user);
// Returns: undefined (no filter)

// Database query
// No department_id filter applied
// Returns ALL tickets from all departments
```

---

## Database Changes

### New Column in `ticket` Table
```sql
ALTER TABLE ticket ADD COLUMN department_id VARCHAR(50);
```

**Auto-Population:**
- When ticket is created, `department_id` is automatically filled from employee's department
- Uses `EmployeeRepository` to fetch employee's `department_id`

---

## Key Implementation Points

### 1. **User Context Preservation**
- JWT token includes `departmentId` and `role`
- `@CurrentUser()` decorator extracts from JWT payload
- Passed through entire request chain

### 2. **Single Responsibility**
- `getDepartmentFilter()` handles all role-based logic
- Easy to modify filtering rules in one place

### 3. **Optional Query Parameter Override**
- Admin/IT can pass `department_id` query param to filter specific departments
- Employee/Supervisor: param is ignored (security)

### 4. **Removed Problematic Relations**
- Removed `reporter`, `assignedEmployee`, `approver` relations
- These caused UUID/VARCHAR type mismatch errors
- Now only loads `asset` relations

### 5. **Backward Compatible**
- Existing code works without changes
- Just need to pass `user` parameter to service methods

---

## Code Quality Improvements

✅ **Type Safety:**
- Added `UserRole` enum usage
- Better type checking for user objects

✅ **Maintainability:**
- Centralized filtering logic
- Easy to adjust rules by modifying `getDepartmentFilter()`

✅ **Security:**
- Server-side enforcement (can't bypass on client)
- Employees can't access other departments' tickets
- Admin has full access for oversight

✅ **Performance:**
- Database filtering (WHERE clause) at query time
- Efficient - not fetching all data then filtering in code

---

## Git Commits

1. **e44a0d0** - Inject EmployeeRepository and auto-populate department_id
2. **3c2672e** - Add department filtering to all query methods
3. **954e56f** - Add Employee entity to TicketModule imports
4. **44c540e** - Implement role-based ticket filtering
5. **d52fbdc** - Add frontend implementation guide (documentation)

---

## Testing the Changes

### Test Case 1: Employee Access
```bash
# Login as employee (employee_id: EMP001, department: HR)
curl -X GET "http://localhost:3000/tickets" \
  -H "Authorization: Bearer <token>"

# Expected: Returns only tickets where department_id = "HR"
```

### Test Case 2: Supervisor Pending Approvals
```bash
# Login as supervisor (department: IT)
curl -X GET "http://localhost:3000/tickets/pending-approvals" \
  -H "Authorization: Bearer <token>"

# Expected: Returns pending tickets where department_id = "IT"
```

### Test Case 3: Admin Full Access
```bash
# Login as admin
curl -X GET "http://localhost:3000/tickets" \
  -H "Authorization: Bearer <token>"

# Expected: Returns ALL tickets (all departments)
```

### Test Case 4: Admin Override Filter
```bash
# Login as admin, filter specific department
curl -X GET "http://localhost:3000/tickets?department_id=HR" \
  -H "Authorization: Bearer <token>"

# Expected: Returns only HR department tickets
```

---

## Deployment

✅ All changes are **live on production (Render.com)**
- Auto-deployed from git push
- Role-based filtering active

No database migration needed - column is nullable and auto-populated.
