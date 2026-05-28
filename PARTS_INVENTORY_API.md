# Parts Inventory API Documentation

## Overview
Complete API for viewing and managing parts inventory across all tickets. Track parts by status, supplier, and across the entire system.

---

## Endpoints

### 1. Get All Parts
**Get all parts requested across all tickets**

```
GET /tickets/inventory/all
```

#### Authentication
- **Required**: JWT Bearer Token
- **Roles**: All authenticated users (IT, ADMIN, SUPERVISOR, EMPLOYEE)

#### Response (200 OK)
```json
[
  {
    "part_id": "550e8400-e29b-41d4-a716-446655440000",
    "ticket_id": "82266bc4-c897-4c2d-bf91-b5e3c4a956eb",
    "part_name": "Mechanical Keyboard",
    "quantity": 2,
    "unit_cost": 500,
    "total_cost": 1000,
    "supplier": "Lazada",
    "status": "pending",
    "requested_date": "2026-05-28T10:30:00.000Z",
    "received_date": null,
    "notes": "High quality mechanical keyboard",
    "ticket": {
      "ticket_id": "82266bc4-c897-4c2d-bf91-b5e3c4a956eb",
      "subject": "Keyboard not working",
      "status": "hold",
      "assigned_to": "it-staff-id"
    }
  },
  {
    "part_id": "660e8400-e29b-41d4-a716-446655440001",
    "ticket_id": "82266bc4-c897-4c2d-bf91-b5e3c4a956ec",
    "part_name": "RAM 8GB",
    "quantity": 1,
    "unit_cost": 2000,
    "total_cost": 2000,
    "supplier": "Amazon",
    "status": "received",
    "requested_date": "2026-05-25T14:00:00.000Z",
    "received_date": "2026-05-27T09:00:00.000Z",
    "notes": "DDR4 compatible",
    "ticket": { ... }
  }
]
```

#### Ordering
- Results ordered by **most recent requested first** (descending by `requested_date`)

#### Data Structure
| Field | Type | Description |
|-------|------|-------------|
| `part_id` | UUID | Unique part identifier |
| `ticket_id` | UUID | Related ticket ID |
| `part_name` | string | Name of the part |
| `quantity` | number | Quantity requested |
| `unit_cost` | decimal | Cost per unit |
| `total_cost` | decimal | Quantity × Unit Cost |
| `supplier` | string | Supplier name (e.g., Lazada, Amazon) |
| `status` | enum | `pending` \| `ordered` \| `received` |
| `requested_date` | ISO timestamp | When part was requested |
| `received_date` | ISO timestamp \| null | When part was received (null if not received) |
| `notes` | string | Additional notes |
| `ticket` | object | Embedded ticket details |

---

### 2. Get Parts by Status
**Filter parts by current status**

```
GET /tickets/inventory/status/:status
```

#### Authentication
- **Required**: JWT Bearer Token
- **Roles**: All authenticated users

#### Path Parameters
| Parameter | Type | Required | Values |
|-----------|------|----------|--------|
| `status` | string | Yes | `pending` \| `ordered` \| `received` |

#### Examples

**Get all pending parts (awaiting order)**
```
GET /tickets/inventory/status/pending
```

**Get all ordered parts (in transit)**
```
GET /tickets/inventory/status/ordered
```

**Get all received parts**
```
GET /tickets/inventory/status/received
```

#### Response (200 OK)
```json
[
  {
    "part_id": "...",
    "status": "pending",
    ...
  },
  ...
]
```

#### Status Meanings
- **pending**: Part has been requested but not yet ordered
- **ordered**: Part is on order with supplier
- **received**: Part has arrived and been received

---

### 3. Get Parts by Supplier
**Get all parts from a specific supplier**

```
GET /tickets/inventory/supplier/:supplier
```

#### Authentication
- **Required**: JWT Bearer Token
- **Roles**: All authenticated users

#### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `supplier` | string | Yes | Supplier name (e.g., "Lazada", "Amazon") |

#### Examples

**Get all parts from Lazada**
```
GET /tickets/inventory/supplier/Lazada
```

**Get all parts from Amazon**
```
GET /tickets/inventory/supplier/Amazon
```

#### Response (200 OK)
```json
[
  {
    "part_id": "...",
    "supplier": "Lazada",
    ...
  },
  ...
]
```

#### Important Notes
- Supplier name is **case-sensitive**
- Use exact spelling as stored in database
- Results ordered by most recent first

---

## Error Responses

### 401 Unauthorized
Missing or invalid JWT token
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### 400 Bad Request
Invalid status parameter
```json
{
  "statusCode": 400,
  "message": "Invalid status. Must be one of: pending, ordered, received"
}
```

---

## Usage Examples

### cURL

**Get all parts**
```bash
curl -X GET 'http://localhost:3000/tickets/inventory/all' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN'
```

**Get pending parts**
```bash
curl -X GET 'http://localhost:3000/tickets/inventory/status/pending' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN'
```

**Get parts from Lazada**
```bash
curl -X GET 'http://localhost:3000/tickets/inventory/supplier/Lazada' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN'
```

### JavaScript/Fetch

```javascript
// Helper function
const fetchParts = async (endpoint) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`/tickets/inventory/${endpoint}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.json();
};

// Get all parts
const allParts = await fetchParts('all');

// Get pending parts
const pendingParts = await fetchParts('status/pending');

// Get received parts
const receivedParts = await fetchParts('status/received');

// Get parts from supplier
const lazadaParts = await fetchParts('supplier/Lazada');
```

### React Hook Example

```javascript
import { useEffect, useState } from 'react';

const useParts = (filter = 'all') => {
  const [parts, setParts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchParts = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        let endpoint = 'all';
        if (filter !== 'all') {
          if (filter.startsWith('status:')) {
            endpoint = `status/${filter.split(':')[1]}`;
          } else if (filter.startsWith('supplier:')) {
            endpoint = `supplier/${filter.split(':')[1]}`;
          }
        }

        const response = await fetch(`/tickets/inventory/${endpoint}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error('Failed to fetch parts');
        
        const data = await response.json();
        setParts(data);
        setError(null);
      } catch (err) {
        setError(err.message);
        setParts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchParts();
  }, [filter]);

  return { parts, loading, error };
};

// Usage in component
export const PartsInventory = () => {
  const [filter, setFilter] = useState('all');
  const { parts, loading, error } = useParts(filter);

  return (
    <div>
      <div className="filter-buttons">
        <button onClick={() => setFilter('all')}>All Parts</button>
        <button onClick={() => setFilter('status:pending')}>Pending</button>
        <button onClick={() => setFilter('status:ordered')}>Ordered</button>
        <button onClick={() => setFilter('status:received')}>Received</button>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p className="error">{error}</p>}
      
      <table>
        <thead>
          <tr>
            <th>Part Name</th>
            <th>Qty</th>
            <th>Unit Cost</th>
            <th>Total Cost</th>
            <th>Supplier</th>
            <th>Status</th>
            <th>Requested</th>
            <th>Received</th>
          </tr>
        </thead>
        <tbody>
          {parts.map(part => (
            <tr key={part.part_id}>
              <td>{part.part_name}</td>
              <td>{part.quantity}</td>
              <td>₱{part.unit_cost.toFixed(2)}</td>
              <td>₱{part.total_cost.toFixed(2)}</td>
              <td>{part.supplier}</td>
              <td>
                <span className={`status status-${part.status}`}>
                  {part.status}
                </span>
              </td>
              <td>{new Date(part.requested_date).toLocaleDateString()}</td>
              <td>{part.received_date ? new Date(part.received_date).toLocaleDateString() : '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
```

---

## Data Flow

### Part Status Lifecycle
```
pending (requested)
   ↓
ordered (in transit)
   ↓
received (arrived)
```

### Related Part Operations

**Update Part Status**
```
PATCH /tickets/:id/parts/:part_id
```
See ticket API documentation for details

**View Parts for Specific Ticket**
```
GET /tickets/:id/parts
```

---

## Important Notes

1. **No Pagination**: All parts returned in single request. Consider implementing pagination on frontend if large datasets.

2. **Supplier Names**: Supplier field is **case-sensitive**. Exact match required.

3. **Total Cost**: Calculated field (`quantity × unit_cost`). Read-only.

4. **Received Date**: Auto-populated when status changes to `received`. Null until that point.

5. **Ordering**: Always ordered by `requested_date` descending (newest first).

6. **Ticket Relation**: Includes embedded ticket object for reference without extra API calls.

---

## Performance Tips

1. Cache responses if static data, invalidate when parts updated
2. For large part lists, implement client-side filtering/sorting
3. Use status filter for common queries (avoid loading all parts)
4. Consider implementing pagination if parts exceed 1000 items

---

## Testing Checklist

- [ ] Get all parts returns full list
- [ ] Parts ordered by most recent first
- [ ] Get parts by status filters correctly
- [ ] Get parts by supplier works with exact names
- [ ] Ticket object included in response
- [ ] 401 when token missing
- [ ] Timestamps in ISO format
- [ ] Costs calculated correctly (qty × unit_cost)
- [ ] received_date is null for non-received parts
- [ ] received_date is set for received parts
