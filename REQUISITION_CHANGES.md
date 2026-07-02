# Requisition System Changes - Frontend Integration Guide

**Date:** July 2, 2026  
**Version:** 2.0  
**Status:** Ready for Integration

---

## 📋 Overview

The requisition system has been enhanced with:
1. **Manual RF_Number Input** - Replaces auto-generation (IT must provide unique form number)
2. **Return & Resubmit Workflow** - Warehouse can return requisitions with notes
3. **Comment Thread System** - IT-Warehouse discussion thread on each return
4. **Return History Tracking** - Complete audit trail of all return cycles

---

## 🔄 Workflow Changes

### Original Flow (❌ Outdated)
```
IT/Warehouse Creates Requisition (auto RF_number)
    ↓
Warehouse Acknowledges
    ↓
Admin Reviews & Approves/Rejects
    ↓
END
```

### New Flow (✅ Updated)
```
IT Creates Requisition with MANUAL RF_number
    ↓
Warehouse Acknowledges
    ↓
Admin Reviews & Approves/Rejects
    ↓
IF Approved: END
IF Rejected: Show rejection reason
IF Returned by Warehouse: 
    - Show return reason (warehouse_notes)
    - IT adds comments/replies
    - IT edits items as needed
    - IT resubmits
    - Back to: Warehouse Acknowledges
    ↓ (Cycle repeats until approved)
```

---

## 📝 DTO Changes

### 1. CreatePartRequisitionDto (UPDATED)

**NEW REQUIRED FIELD:**

```json
{
  "rf_number": "RF2026001",  // ⭐ NOW REQUIRED - IT must provide
  "department": "IT Department",
  "deadline": "2026-07-15",
  "items": [
    {
      "item_name": "Mechanical Keyboard",
      "quantity": 2,
      "unit": "pcs",
      "supplier": "Lazada",
      "unit_cost": 500,
      "purpose_remarks": "For keyboard repair"
    }
  ]
}
```

**Validation Rules for rf_number:**
- ✅ Required (cannot be empty)
- ✅ Alphanumeric only: A-Z, 0-9 (no spaces, special chars)
- ✅ Length: 3-50 characters
- ✅ Must be unique (cannot reuse existing RF_numbers)

**Examples of valid RF_numbers:**
- `RF2026001`
- `ITMON001`
- `PURCHRF001`
- `REQ20260701`

**Error Response if rf_number invalid:**
```json
{
  "statusCode": 400,
  "message": "rf_number must be alphanumeric (A-Z, 0-9 only)"
}
```

---

### 2. ReturnRequisitionDto (NEW)

Used by **Warehouse Staff** to return a requisition

```json
{
  "warehouse_notes": "Items out of stock, need alternative suppliers with same specifications"
}
```

**Validation Rules:**
- ✅ Required field
- ✅ Minimum 10 characters
- ✅ String type

---

### 3. AddCommentDto (NEW)

Used by **IT or Warehouse** to add comments/replies in discussion thread

```json
{
  "message": "We can substitute with ASUS TUF keyboard which has same specs"
}
```

**Validation Rules:**
- ✅ Required field
- ✅ Minimum 5 characters
- ✅ String type

---

### 4. ResubmitRequisitionDto (NEW)

Used by **IT** to resubmit after editing requisition items

```json
{}
// Currently empty - can be extended later for item modifications
```

---

## 🆕 New API Endpoints

### 1. Return Requisition
**Route:** `PATCH /requisitions/:rf_number/return`  
**Auth:** Required (Bearer Token)  
**Role:** WAREHOUSE only

**Request:**
```bash
PATCH /requisitions/RF2026001/return
Content-Type: application/json
Authorization: Bearer <token>

{
  "warehouse_notes": "Items are currently out of stock from all suppliers. Need to request alternative models."
}
```

**Response (200 OK):**
```json
{
  "return_id": "550e8400-e29b-41d4-a716-446655440000",
  "requisition_id": "550e8400-e29b-41d4-a716-446655440001",
  "returned_by": "550e8400-e29b-41d4-a716-446655440002",
  "warehouse_notes": "Items are currently out of stock from all suppliers. Need to request alternative models.",
  "return_cycle": 1,
  "resubmitted_by": null,
  "resubmitted_at": null,
  "created_at": "2026-07-02T10:15:30.000Z",
  "updated_at": "2026-07-02T10:15:30.000Z"
}
```

**Status Update:** Requisition status changes to `returned_by_warehouse`

---

### 2. Get Pending Returns (IT View)
**Route:** `GET /requisitions/warehouse/pending-returns`  
**Auth:** Required (Bearer Token)  
**Role:** IT only

**Request:**
```bash
GET /requisitions/warehouse/pending-returns
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
[
  {
    "requisition_id": "550e8400-e29b-41d4-a716-446655440001",
    "rf_number": "RF2026001",
    "status": "returned_by_warehouse",
    "items": [
      {
        "item_id": "550e8400-e29b-41d4-a716-446655440003",
        "item_name": "Mechanical Keyboard",
        "quantity": 2,
        "unit": "pcs",
        "supplier": "Lazada",
        "unit_cost": 500,
        "total_cost": 1000
      }
    ],
    "returns": [
      {
        "return_id": "550e8400-e29b-41d4-a716-446655440000",
        "returned_by": "550e8400-e29b-41d4-a716-446655440002",
        "warehouse_notes": "Items out of stock",
        "return_cycle": 1,
        "comments": []
      }
    ],
    "created_at": "2026-07-02T09:30:00.000Z"
  }
]
```

---

### 3. Add Comment to Return Thread
**Route:** `POST /requisitions/:rf_number/comments`  
**Auth:** Required (Bearer Token)  
**Role:** Any authenticated user (IT or Warehouse)

**Request:**
```bash
POST /requisitions/RF2026001/comments
Content-Type: application/json
Authorization: Bearer <token>

{
  "message": "We found ASUS TUF Gaming keyboard with identical specifications. Can we proceed with this substitute?"
}
```

**Response (201 Created):**
```json
{
  "comment_id": "550e8400-e29b-41d4-a716-446655440010",
  "return_id": "550e8400-e29b-41d4-a716-446655440000",
  "commented_by": "550e8400-e29b-41d4-a716-446655440002",
  "role": "it",
  "message": "We found ASUS TUF Gaming keyboard with identical specifications. Can we proceed with this substitute?",
  "created_at": "2026-07-02T10:20:45.000Z"
}
```

---

### 4. Get Comment Thread
**Route:** `GET /requisitions/:rf_number/comments`  
**Auth:** Required (Bearer Token)  
**Role:** Any authenticated user

**Request:**
```bash
GET /requisitions/RF2026001/comments
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
[
  {
    "comment_id": "550e8400-e29b-41d4-a716-446655440010",
    "return_id": "550e8400-e29b-41d4-a716-446655440000",
    "commented_by": "550e8400-e29b-41d4-a716-446655440002",
    "role": "it",
    "message": "We found ASUS TUF Gaming keyboard with identical specifications.",
    "created_at": "2026-07-02T10:20:45.000Z"
  },
  {
    "comment_id": "550e8400-e29b-41d4-a716-446655440011",
    "return_id": "550e8400-e29b-41d4-a716-446655440000",
    "commented_by": "550e8400-e29b-41d4-a716-446655440003",
    "role": "warehouse",
    "message": "ASUS TUF is approved. Please update the supplier field in the requisition.",
    "created_at": "2026-07-02T10:25:00.000Z"
  }
]
```

---

### 5. Resubmit Requisition (IT Action)
**Route:** `PATCH /requisitions/:rf_number/resubmit`  
**Auth:** Required (Bearer Token)  
**Role:** IT only

**Request:**
```bash
PATCH /requisitions/RF2026001/resubmit
Content-Type: application/json
Authorization: Bearer <token>

{}
```

**Response (200 OK):**
```json
{
  "return_id": "550e8400-e29b-41d4-a716-446655440000",
  "requisition_id": "550e8400-e29b-41d4-a716-446655440001",
  "returned_by": "550e8400-e29b-41d4-a716-446655440002",
  "warehouse_notes": "Items are out of stock",
  "return_cycle": 1,
  "resubmitted_by": "550e8400-e29b-41d4-a716-446655440004",
  "resubmitted_at": "2026-07-02T10:30:00.000Z",
  "created_at": "2026-07-02T10:15:30.000Z",
  "updated_at": "2026-07-02T10:30:00.000Z"
}
```

**Status Update:** Requisition status returns to `pending` (resets for warehouse acknowledgment)

---

### 6. Get Requisition History
**Route:** `GET /requisitions/:rf_number/history`  
**Auth:** Required (Bearer Token)  
**Role:** Any authenticated user

**Request:**
```bash
GET /requisitions/RF2026001/history
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
[
  {
    "return_id": "550e8400-e29b-41d4-a716-446655440000",
    "requisition_id": "550e8400-e29b-41d4-a716-446655440001",
    "returned_by": "550e8400-e29b-41d4-a716-446655440002",
    "warehouse_notes": "Items out of stock, need alternatives",
    "return_cycle": 1,
    "resubmitted_by": "550e8400-e29b-41d4-a716-446655440004",
    "resubmitted_at": "2026-07-02T10:30:00.000Z",
    "comments": [
      {
        "comment_id": "550e8400-e29b-41d4-a716-446655440010",
        "commented_by": "550e8400-e29b-41d4-a716-446655440002",
        "role": "it",
        "message": "Found ASUS TUF as alternative",
        "created_at": "2026-07-02T10:20:45.000Z"
      },
      {
        "comment_id": "550e8400-e29b-41d4-a716-446655440011",
        "commented_by": "550e8400-e29b-41d4-a716-446655440003",
        "role": "warehouse",
        "message": "ASUS TUF is approved.",
        "created_at": "2026-07-02T10:25:00.000Z"
      }
    ],
    "created_at": "2026-07-02T10:15:30.000Z"
  }
]
```

---

## 🔁 Status Changes

### Requisition Status Enum
```javascript
status: 'pending' | 'pending_admin_review' | 'approved' | 'rejected' | 'returned_by_warehouse'
```

**Status Transitions:**

| Current Status | Action | New Status |
|---|---|---|
| `pending` | Warehouse acknowledges | `pending_admin_review` |
| `pending_admin_review` | Admin approves | `approved` |
| `pending_admin_review` | Admin rejects | `rejected` |
| `pending_admin_review` | Warehouse returns | `returned_by_warehouse` |
| `returned_by_warehouse` | IT resubmits | `pending` |
| `approved` | (Final state) | - |
| `rejected` | (Final state) | - |

---

## 🎯 Frontend Implementation Checklist

### Requisition Creation Form
- [ ] Add new input field: **RF_number** (alphanumeric validator)
- [ ] Display validation error: "rf_number must be alphanumeric (A-Z, 0-9 only)"
- [ ] Display validation error: "rf_number must be at least 3 characters"
- [ ] Display validation error: "rf_number must not exceed 50 characters"
- [ ] Remove any auto-generation logic for RF_number

### Warehouse View - Requisition List
- [ ] Show requisition status including: `returned_by_warehouse`
- [ ] Add button: "View Returns" for requisitions with status `returned_by_warehouse`
- [ ] Add button: "Return This Requisition" on acknowledgment page

### Return & Discussion View (NEW)
- [ ] Display warehouse return reason (warehouse_notes)
- [ ] Display comment thread with:
  - [ ] User name/ID who commented
  - [ ] User role (IT or Warehouse)
  - [ ] Comment message
  - [ ] Timestamp
- [ ] Add comment input form (min 5 chars)
- [ ] Show comment submit button

### IT Staff View - Pending Returns
- [ ] Add new page/tab: "Pending Returns" (GET /requisitions/warehouse/pending-returns)
- [ ] List all requisitions with status `returned_by_warehouse`
- [ ] Show warehouse notes for each return
- [ ] Allow IT to:
  - [ ] Add comments
  - [ ] Edit requisition items (update supplier, quantity, etc.)
  - [ ] Click "Resubmit" button to send back to warehouse
- [ ] Show comment thread on this page

### Requisition History View (NEW)
- [ ] Add link/button: "View Full History"
- [ ] Display:
  - [ ] Return cycle number
  - [ ] Warehouse notes
  - [ ] All comments in chronological order
  - [ ] When it was resubmitted (resubmitted_at)
  - [ ] Who resubmitted it

### Error Handling
- [ ] Handle 400 error: Duplicate RF_number
  - Message: "Requisition form number 'RF2026001' already exists. Please use a unique RF number."
- [ ] Handle 404 error: Requisition not found
- [ ] Handle 400 error: Invalid status for return
  - Message: "Cannot return requisition with status 'approved'. Must be pending or pending_admin_review."

---

## 📌 Important Notes for Frontend

### 1. RF_Number is NOW Required
- **Before:** RF_number was auto-generated (RF-2026-001)
- **After:** IT/User must provide unique RF_number (alphanumeric)
- **Impact:** Add validation to creation form immediately

### 2. No Partial Returns
- Warehouse returns the **entire requisition**, not individual items
- Cannot select specific items to return

### 3. Return Cycle Tracking
- Each return is tracked with `return_cycle` counter
- A requisition can be returned, resubmitted, and returned again
- All cycles preserved in history

### 4. Comment Thread Ownership
- **Warehouse** can comment with `role: "warehouse"`
- **IT** can comment with `role: "it"`
- Both roles see the full thread in chronological order

### 5. Status Flow Reset
- When IT resubmits after return, status goes back to `pending`
- Warehouse must acknowledge again before admin can review
- This ensures warehouse sees the updated items

### 6. Authorization
- Only **Warehouse staff** can return requisitions
- Only **IT staff** can resubmit after return
- Any **authenticated user** can view comments/history

---

## 🔗 API Base URL
```
http://localhost:3000/requisitions
```

---

## 📞 Questions?

Refer to API documentation or contact backend team for:
- Status transitions clarification
- Role-based access rules
- Pagination options for large datasets

---

**Last Updated:** July 2, 2026  
**API Version:** 2.0  
**Database:** PostgreSQL with TypeORM
