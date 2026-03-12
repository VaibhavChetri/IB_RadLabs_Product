# Frontend Setup Guide - Amazon Invoices API

## Quick Start (5 minutes)

### 1. Import Postman Collection

**Method 1: Direct Import**
1. Open Postman
2. Click **Import** button (top left)
3. Select **Upload Files**
4. Choose: `postman/Amazon_Invoices_API.postman_collection.json`
5. Click **Import**

**Method 2: Via Link**
```
Use the file at: /postman/Amazon_Invoices_API.postman_collection.json
```

### 2. Set Environment Variables

In Postman:
1. Click **Environments** (top right)
2. Create new environment: `Amazon Invoices Dev`
3. Add variables:
   ```
   base_url = http://localhost:3000
   auth_token = YOUR_JWT_TOKEN_HERE
   ```
4. Select this environment from dropdown

### 3. Get Your JWT Token

```bash
curl -X POST http://localhost:3000/api/oauth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@example.com",
    "password": "your-password"
  }'
```

Response:
```json
{
  "status": true,
  "data": {
    "user": {...},
    "tokens": {
      "access": {
        "token": "eyJhbGc..."
      }
    }
  }
}
```

Copy the `access.token` value and paste into Postman's `auth_token` variable.

---

## API Endpoint Summary

### 6 Endpoints You Need to Know

| Endpoint | Purpose | Use Case |
|----------|---------|----------|
| `GET /api/amazon-invoices` | List invoices | Browse all invoices with filters |
| `GET /api/amazon-invoices/:invoiceNumber` | Get invoice detail | View complete invoice + all items |
| `GET /api/amazon-invoices/:invoiceNumber/line-items` | List items in invoice | Browse products in one invoice |
| `GET /api/amazon-invoices/line-items` | List all items | Search all products globally |
| `GET /api/amazon-invoices/sellers` | List sellers | View vendor aggregations |
| `GET /api/amazon-invoices/filters` | Get filter options | Build dynamic filter UI |

---

## Testing Each Endpoint in Postman

### Endpoint 1: List Invoices
```
GET http://localhost:3000/api/amazon-invoices?page=1&limit=20
```

**Expected Response (200):**
```json
{
  "status": true,
  "statusCode": 200,
  "message": "Invoices retrieved successfully",
  "data": [
    {
      "id": 1,
      "invoice_number": "INV-2024-001",
      "invoice_date": "2024-02-15",
      "sold_by": "CraftVatika Exports",
      "grand_total": 45000,
      "item_count": 5,
      "document_type": "Tax Invoice"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 145,
    "total_pages": 8,
    "has_next_page": true,
    "has_prev_page": false
  }
}
```

---

### Endpoint 2: Get Invoice Details
```
GET http://localhost:3000/api/amazon-invoices/INV-2024-001
```

**Expected Response (200):**
```json
{
  "status": true,
  "data": {
    "invoice": {
      "invoice_number": "INV-2024-001",
      "order_id": "402-XXXXXXX-XXXXXXX",
      "grand_total": 43500,
      "igst_amount": 7830,
      "shipping_charges": 500
    },
    "line_items": [
      {
        "id": 1,
        "description": "Handmade Ceramic Bowl",
        "quantity": 10,
        "unit_price": 500,
        "total_amount": 5782
      }
    ]
  }
}
```

---

### Endpoint 3: Get Filter Options (for UI)
```
GET http://localhost:3000/api/amazon-invoices/filters
```

**Expected Response (200):**
```json
{
  "status": true,
  "data": {
    "document_types": ["Tax Invoice", "Delivery Challan"],
    "sellers": [
      {
        "gstin": "18AAFFC5055K1Z0",
        "name": "CraftVatika Exports"
      }
    ],
    "popular_asins": [
      {
        "asin": "B09ABCD1234",
        "usage_count": 15
      }
    ],
    "range": {
      "min_invoice_date": "2024-01-01",
      "max_invoice_date": "2024-03-05",
      "min_grand_total": 500,
      "max_grand_total": 125000
    }
  }
}
```

**💡 Tip:** Use this response to populate dropdown options, date ranges, and amount sliders in your UI!

---

## Common Filter Examples

### Example 1: Invoices from Specific Seller
```
GET /api/amazon-invoices?sold_by_gstin=18AAFFC5055K1Z0&page=1&limit=20
```

### Example 2: Invoices in Date Range
```
GET /api/amazon-invoices?invoice_date_from=2024-02-01&invoice_date_to=2024-02-28&page=1&limit=20
```

### Example 3: High-Value Invoices
```
GET /api/amazon-invoices?min_total=50000&max_total=200000&sort_by=grand_total&sort_order=desc
```

### Example 4: All Line Items with 18% Tax
```
GET /api/amazon-invoices/line-items?min_tax_rate=18&max_tax_rate=18&limit=100
```

### Example 5: Search by Invoice Number
```
GET /api/amazon-invoices?search=INV-2024&limit=50
```

---

## API Response Format (ALL Endpoints)

Every response follows this structure:

```javascript
{
  status: true/false,           // Success indicator
  statusCode: 200/400/401/500,  // HTTP status
  message: "Description",       // Human-readable message
  data: {...},                  // Response payload
  pagination: {                 // Only in list endpoints
    page: 1,
    limit: 20,
    total: 145,
    total_pages: 8,
    has_next_page: true,
    has_prev_page: false
  }
}
```

---

## Error Handling

### 401 Unauthorized
```json
{
  "status": false,
  "statusCode": 401,
  "message": "Please authenticate"
}
```
**Action:** Get a new token via `/api/oauth/login`

### 404 Not Found
```json
{
  "status": false,
  "statusCode": 404,
  "message": "Invoice not found"
}
```
**Action:** Check if the invoice number exists

### 500 Server Error
```json
{
  "status": false,
  "statusCode": 500,
  "message": "Failed to fetch invoices: Database connection error"
}
```
**Action:** Check backend logs, retry after 30 seconds

---

## Frontend Integration Patterns

### Pattern 1: Fetch Invoices (React)
```javascript
const [invoices, setInvoices] = useState([]);
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);

const fetchInvoices = async (filters = {}) => {
  setLoading(true);
  try {
    const params = new URLSearchParams({
      page: filters.page || 1,
      limit: filters.limit || 20,
      sort_by: filters.sortBy || 'invoice_date',
      sort_order: filters.sortOrder || 'desc',
      ...Object.fromEntries(
        Object.entries(filters).filter(([_, v]) => v)
      )
    });

    const response = await fetch(
      `/api/amazon-invoices?${params}`,
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      }
    );

    const result = await response.json();

    if (!result.status) {
      throw new Error(result.message);
    }

    setInvoices(result.data);
    return result.pagination;
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};
```

### Pattern 2: Build Dynamic Filters (React)
```javascript
const [filterOptions, setFilterOptions] = useState(null);

useEffect(() => {
  const fetchFilters = async () => {
    const response = await fetch('/api/amazon-invoices/filters', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const { data } = await response.json();
    setFilterOptions(data);
  };
  fetchFilters();
}, []);

// In your filter panel:
{filterOptions && (
  <>
    <select>
      {filterOptions.document_types.map(type => (
        <option key={type}>{type}</option>
      ))}
    </select>

    <select>
      {filterOptions.sellers.map(seller => (
        <option key={seller.gstin}>{seller.name}</option>
      ))}
    </select>

    <input
      type="number"
      min={filterOptions.range.min_grand_total}
      max={filterOptions.range.max_grand_total}
    />
  </>
)}
```

### Pattern 3: Handle Pagination (React)
```javascript
const [page, setPage] = useState(1);
const [pageSize, setPageSize] = useState(20);
const [pagination, setPagination] = useState(null);

useEffect(() => {
  const result = await fetchInvoices({
    page,
    limit: pageSize
  });
  setPagination(result);
}, [page, pageSize]);

// In your UI:
<Pagination>
  {pagination?.page > 1 && (
    <button onClick={() => setPage(page - 1)}>← Previous</button>
  )}

  {Array.from({ length: pagination?.total_pages }, (_, i) => (
    <button
      key={i + 1}
      onClick={() => setPage(i + 1)}
      className={page === i + 1 ? 'active' : ''}
    >
      {i + 1}
    </button>
  ))}

  {pagination?.has_next_page && (
    <button onClick={() => setPage(page + 1)}>Next →</button>
  )}
</Pagination>
```

---

## Common Implementation Tasks

### Task 1: Display Invoice List with Sorting
```javascript
// User clicks on "Date" column header
const handleSort = (column) => {
  const newOrder = sortBy === column && sortOrder === 'asc' ? 'desc' : 'asc';
  setSortBy(column);
  setSortOrder(newOrder);
  fetchInvoices({ page: 1, sortBy: column, sortOrder: newOrder });
};

// Render table header with click handlers
<th onClick={() => handleSort('invoice_date')}>
  Date {sortBy === 'invoice_date' && <Icon name={`arrow-${sortOrder}`} />}
</th>
```

### Task 2: Filter by Date Range
```javascript
const [dateFrom, setDateFrom] = useState('');
const [dateTo, setDateTo] = useState('');

const applyDateFilter = () => {
  fetchInvoices({
    page: 1,
    invoice_date_from: dateFrom,
    invoice_date_to: dateTo
  });
};

// Render date pickers
<DatePicker
  selected={dateFrom}
  onChange={setDateFrom}
  minDate={filterOptions.range.min_invoice_date}
  maxDate={filterOptions.range.max_invoice_date}
/>
<DatePicker
  selected={dateTo}
  onChange={setDateTo}
  minDate={dateFrom || filterOptions.range.min_invoice_date}
  maxDate={filterOptions.range.max_invoice_date}
/>
```

### Task 3: Search in Real-time
```javascript
const [searchTerm, setSearchTerm] = useState('');

const debouncedSearch = useCallback(
  debounce((term) => {
    fetchInvoices({ page: 1, search: term });
  }, 500),
  []
);

<input
  placeholder="Search invoices..."
  onChange={(e) => {
    setSearchTerm(e.target.value);
    debouncedSearch(e.target.value);
  }}
/>
```

---

## Deployment Checklist

- [ ] Replace `base_url` with production domain
- [ ] Verify CORS is enabled on backend
- [ ] Add SSL/HTTPS for all API calls
- [ ] Implement token refresh logic (if token expires)
- [ ] Add loading skeletons for better UX
- [ ] Add error toast notifications
- [ ] Test on mobile devices (responsive)
- [ ] Verify export/download functionality
- [ ] Test with slow network (3G simulation)
- [ ] Monitor API response times

---

## Performance Tips

1. **Cache filter metadata** - Fetch once on app load, not per request
2. **Debounce search** - Wait 500ms after user stops typing
3. **Virtualize long lists** - Use react-window for 100+ rows
4. **Lazy load images** - Seller logos, if added
5. **Batch requests** - Fetch filters + first page simultaneously

---

## Useful Browser DevTools Tricks

### View API Requests
```javascript
// In browser console
fetch('/api/amazon-invoices?page=1&limit=5', {
  headers: { 'Authorization': `Bearer ${token}` }
}).then(r => r.json()).then(d => console.table(d.data))
```

### Test Filter Response
```javascript
fetch('/api/amazon-invoices/filters', {
  headers: { 'Authorization': `Bearer ${token}` }
}).then(r => r.json()).then(d => console.log(JSON.stringify(d.data, null, 2)))
```

---

## Next Steps

1. ✅ **Week 1:** Import Postman collection, test all 6 endpoints
2. ✅ **Week 2:** Build Invoices List page with filters
3. ✅ **Week 3:** Build Invoice Detail page
4. ✅ **Week 4:** Build Line Items browser + Sellers directory
5. ✅ **Week 5:** Polish UI, add export features, performance optimization

---

## Support & Questions

- **API Documentation:** `/docs/AMAZON_INVOICES_API.md`
- **UI Implementation Guide:** `/docs/UI_IMPLEMENTATION_GUIDE.md`
- **Postman Collection:** `/postman/Amazon_Invoices_API.postman_collection.json`
- **Backend Code:** `/src/routes/v1/amazonInvoices.route.js`
- **Service Layer:** `/src/services/amazonInvoices/amazonInvoices.service.js`

---

**Ready to start building?** 🚀

1. Grab the Postman collection
2. Get your JWT token
3. Test the /filters endpoint
4. Start building UI components!

Good luck! 🎯
