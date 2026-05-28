# Frontend Parts Inventory UI - Implementation Guide

## What to Build

### Page: Parts Inventory Dashboard
A page showing all parts requested across all tickets with filtering and status indicators.

---

## Key Features

### 1. Filter Buttons (Top of Page)
Create button group to filter parts:
- **All Parts** - Show everything (default)
- **Pending** - Show parts awaiting order
- **Ordered** - Show parts in transit
- **Received** - Show parts that arrived

**Calls**: `GET /tickets/inventory/status/:status`

### 2. Supplier Filter (Optional)
Dropdown or search to filter by supplier name.

**Calls**: `GET /tickets/inventory/supplier/:supplier`

**Common suppliers**: Lazada, Amazon, local suppliers, etc.

### 3. Parts List/Table

**Columns to Display:**
| Column | Data Field | Format |
|--------|-----------|--------|
| Part Name | `part_name` | Text |
| Qty | `quantity` | Number |
| Unit Cost | `unit_cost` | ₱ currency |
| Total Cost | `total_cost` | ₱ currency |
| Supplier | `supplier` | Text |
| Status | `status` | Badge (pending/ordered/received) |
| Requested Date | `requested_date` | Short date (MM/DD/YYYY) |
| Received Date | `received_date` | Short date or "-" if null |
| Ticket | `ticket.subject` | Link to ticket (optional) |
| Notes | `notes` | Text (truncated if long) |

### 4. Status Badge Styling

```css
.status-pending {
  background: #FFF3CD;
  color: #856404;
  border-radius: 4px;
  padding: 4px 8px;
}

.status-ordered {
  background: #D1ECF1;
  color: #0C5460;
  border-radius: 4px;
  padding: 4px 8px;
}

.status-received {
  background: #D4EDDA;
  color: #155724;
  border-radius: 4px;
  padding: 4px 8px;
}
```

### 5. Summary Stats (Optional but Nice)

Show at top of page:
- **Total Parts Requested**: Count of all parts
- **Pending Parts**: Count with status=pending
- **Parts in Transit**: Count with status=ordered
- **Parts Received**: Count with status=received
- **Total Value**: Sum of all total_cost

---

## API Calls

### Initial Load
```javascript
// Load all parts on page open
GET /tickets/inventory/all
```

### When User Clicks Filter
```javascript
// Filter by status
GET /tickets/inventory/status/pending
GET /tickets/inventory/status/ordered
GET /tickets/inventory/status/received

// Filter by supplier
GET /tickets/inventory/supplier/Lazada
```

---

## Data Processing Tips

1. **Timestamps**: Convert to readable format
   ```javascript
   new Date(part.requested_date).toLocaleDateString()
   ```

2. **Costs**: Format as currency
   ```javascript
   part.total_cost.toFixed(2)  // Show 2 decimals
   ```

3. **Empty State**: If no parts match filter, show message:
   - "No pending parts"
   - "No parts from this supplier"

4. **Sorting**: Already sorted by most recent first from backend

---

## Error Handling

If API call fails:
- Show error message to user
- Log error details
- Provide "Retry" button
- Don't break the page

```javascript
try {
  const parts = await fetch('/tickets/inventory/all', {...});
  // process parts
} catch (error) {
  console.error('Failed to load parts:', error);
  showErrorMessage('Failed to load parts inventory');
}
```

---

## Loading State

While fetching from API:
- Show loading spinner/skeleton
- Disable filter buttons
- Don't show stale data

```javascript
const [loading, setLoading] = useState(false);

useEffect(() => {
  setLoading(true);
  fetchParts().finally(() => setLoading(false));
}, [filter]);

if (loading) return <LoadingSpinner />;
```

---

## Bonus Features (Optional)

1. **Export to CSV** - Download parts list
2. **Search** - Search by part name or supplier
3. **Date Range Filter** - Filter by request/receive dates
4. **Cost Summary** - Show total cost per status/supplier
5. **Ticket Link** - Click part to go to related ticket
6. **Bulk Actions** - Select multiple parts (if needed)

---

## Component Structure Example

```
<PartsInventory>
  ├── <FilterBar>
  │   ├── <StatusButtons />
  │   └── <SupplierDropdown /> (optional)
  ├── <SummaryStats /> (optional)
  ├── <PartsList>
  │   └── <PartRow /> × many
  └── <EmptyState /> (if no results)
```

---

## Testing Scenarios

1. ✓ Load and display all parts
2. ✓ Filter by each status (pending, ordered, received)
3. ✓ Filter by supplier name
4. ✓ Show empty state when no results
5. ✓ Format dates and costs correctly
6. ✓ Display status badges with correct styling
7. ✓ Handle API errors gracefully
8. ✓ Show loading state while fetching

---

## Design Considerations

- **Responsive**: Works on mobile (might need scrollable table)
- **Performance**: Lazy load if list is very long
- **Accessibility**: Proper labels, ARIA attributes for badges
- **Clarity**: Use icons for status if possible (pending ⏳, ordered 📦, received ✓)

---

## Sample Payload Reference

**What you'll receive from API:**
```json
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
    "status": "hold"
  }
}
```

All the data you need is in that object. No need for additional API calls per row.

---

## Quick Start

1. Read [PARTS_INVENTORY_API.md](PARTS_INVENTORY_API.md) for full API details
2. Create `/pages/PartsInventory` component
3. Implement filter buttons
4. Add parts table/list with columns above
5. Add loading and error states
6. Test with all filters
7. Done! 🎉
