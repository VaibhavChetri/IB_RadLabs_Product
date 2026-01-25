# Frontend Structure - Lead Tracking System

## 📋 Overview
This document lists ALL frontend pages and components to build. Create these in your frontend repo with **mock data or placeholders** first. API integration comes later in Phase 4.

**Total Pages**: 4  
**Total Components**: 8+  
**Estimated Time**: 2-3 days (full-time)

---

## 🗂️ Menu Structure

Add new menu section to your existing navigation:

```
📊 Dashboard (existing)
👥 Users (existing)
🏢 Restaurants (existing)

📈 Leads (NEW)
  ├── 🔍 Search Lusha (existing - update)
  ├── 📋 My Leads (NEW)
  ├── 📞 Today's Callbacks (NEW)
  └── 📊 Reports (NEW)
```

### Menu Configuration
**Parent Menu**: "Leads"  
**Icon**: Choose appropriate icon  
**Order**: After Restaurants menu

**Submenu Items**:
1. Search Lusha - `/lusha/search` (existing page - will update)
2. My Leads - `/leads/tracking` (new page)
3. Today's Callbacks - `/leads/callbacks` (new page)
4. Reports - `/leads/reports` (new page)

---

# PAGE 1: Search Lusha (UPDATE EXISTING)

## Location
`/lusha/search` (existing page)

## What to Update
This page likely already exists with search functionality. Update it to add:

### 1. Checkbox Column (First Column)
```
[ ] | Name | Title | Company | Location | Email | Phone | Actions
```

- Single checkbox per row
- "Select All" checkbox in header
- Track selected contacts in component state

### 2. Bulk Action Bar
**When**: Shows when 1+ contacts selected  
**Position**: Fixed at top or floating above table  
**Buttons**:
- "Reveal Emails (X credits)" - placeholder, no API call yet
- "Reveal Phones (X credits)" - placeholder, no API call yet
- "Start Tracking (X)" - placeholder, no API call yet
- "Clear Selection" - clears checkboxes

### 3. Track Button (in Actions column)
**For each contact row**:
- If `is_tracking = false` and (has email OR phone): Show "Track Lead" button (disabled for now)
- If `is_tracking = true`: Show "Tracking" badge (green checkmark icon)

### 4. Reveal Buttons (update existing)
Keep existing reveal functionality, but ensure it works with checkboxes

---

## Components to Create/Update

### Component 1.1: `SearchResults.vue` (UPDATE)
**Location**: `src/components/Lusha/SearchResults.vue` (or similar)

**Props**:
- `contacts` (Array): Search results

**Data**:
```javascript
{
  selectedContacts: [],  // Array of selected contact_ids
}
```

**Computed**:
```javascript
{
  allSelected: boolean,      // All checkboxes checked
  someSelected: boolean,     // Some but not all checked
  canTrackSelected: boolean  // Any selected have email/phone
}
```

**Methods** (placeholders - no API calls yet):
```javascript
toggleSelectAll()
handleCheckboxChange(contactId)
handleRevealSingle(contactId, type)
handleBulkReveal(type)
handleStartTracking(contactId)
handleBulkStartTracking()
clearSelection()
```

**Mock Behavior**:
- Checkboxes work (check/uncheck)
- Bulk bar shows/hides based on selection
- Buttons show console.log("Will call API later")

---

### Component 1.2: `BulkActionBar.vue` (NEW)
**Location**: `src/components/Lusha/BulkActionBar.vue`

**Props**:
- `selectedCount` (Number)
- `canRevealEmail` (Boolean)
- `canRevealPhone` (Boolean)
- `canTrack` (Boolean)

**Template**:
```html
<div class="bulk-action-bar">
  <div class="selection-info">
    {{ selectedCount }} contact(s) selected
  </div>
  <div class="actions">
    <button @click="$emit('reveal-email')">
      Reveal Emails ({{ selectedCount }} credits)
    </button>
    <button @click="$emit('reveal-phone')">
      Reveal Phones ({{ selectedCount }} credits)
    </button>
    <button @click="$emit('start-tracking')">
      Start Tracking
    </button>
    <button @click="$emit('clear')">
      Clear
    </button>
  </div>
</div>
```

**Events**:
- `reveal-email`
- `reveal-phone`
- `start-tracking`
- `clear`

---

# PAGE 2: My Leads (NEW)

## Location
`/leads/tracking`

## Purpose
Main dashboard to view all tracked leads with filtering

## Layout
```
+----------------------------------------------------------+
| Filters Bar (Status, Assigned, Has Callback, Search)     |
+----------------------------------------------------------+
| Lead | Company | Status | Last Contact | Next Callback  |
| Actions                                                   |
+----------------------------------------------------------+
| John Doe | Acme | [Call Later] | Jan 24 | Jan 26 2pm    |
| [View] [Log Outreach]                                    |
+----------------------------------------------------------+
| Pagination                                                |
+----------------------------------------------------------+
```

---

## Components to Create

### Component 2.1: `TrackingList.vue` (NEW)
**Location**: `src/pages/Leads/TrackingList.vue`

**Purpose**: Main page component

**Data** (use mock data):
```javascript
{
  leads: [
    {
      contact_id: "mock_1",
      full_name: "John Doe",
      company_name: "Acme Corp",
      job_title: "CEO",
      email: "john@acme.com",
      phone: "+1234567890",
      current_status: {
        id: 5,
        status_name: "Call Later",
        status_color: "#60A5FA"
      },
      last_outreach_date: "2026-01-24 15:30:00",
      next_callback_at: "2026-01-26 14:00:00",
      total_outreach_count: 3,
      assigned_to: { id: 45, name: "Jane Smith" }
    }
    // ... more mock leads
  ],
  filters: {
    assigned_to: null,
    status_id: null,
    has_callback: false,
    search: ""
  },
  pagination: {
    current_page: 1,
    per_page: 25,
    total: 47
  }
}
```

**Template Structure**:
- Filters component
- Table with leads
- Pagination component

**Mock Behavior**:
- Filters work client-side (filter mock data)
- Pagination changes (no API call)
- Buttons show console.log

---

### Component 2.2: `TrackingFilters.vue` (NEW)
**Location**: `src/components/Leads/TrackingFilters.vue`

**Props**: None

**Template**:
```html
<div class="filters">
  <div class="filter-group">
    <label>Status</label>
    <select v-model="filters.status_id">
      <option :value="null">All Statuses</option>
      <option value="5">Call Later</option>
      <option value="7">Meeting Scheduled</option>
      <!-- Mock options -->
    </select>
  </div>
  
  <div class="filter-group">
    <label>Assigned To</label>
    <select v-model="filters.assigned_to">
      <option :value="null">All Users</option>
      <option value="45">Jane Smith</option>
      <!-- Mock options -->
    </select>
  </div>
  
  <div class="filter-group">
    <label>
      <input type="checkbox" v-model="filters.has_callback" />
      Has Scheduled Callback
    </label>
  </div>
  
  <div class="filter-group">
    <input 
      type="text" 
      v-model="filters.search" 
      placeholder="Search name, company, email..."
    />
  </div>
  
  <button @click="applyFilters">Apply</button>
  <button @click="clearFilters">Clear</button>
</div>
```

**Events**:
- `filter-changed` - emits filter object

---

### Component 2.3: `LeadTableRow.vue` (NEW)
**Location**: `src/components/Leads/LeadTableRow.vue`

**Props**:
- `lead` (Object)

**Template**:
```html
<tr>
  <td>
    <div class="lead-info">
      <div class="name">{{ lead.full_name }}</div>
      <div class="title">{{ lead.job_title }}</div>
    </div>
  </td>
  <td>{{ lead.company_name }}</td>
  <td>
    <StatusBadge :status="lead.current_status" />
  </td>
  <td>{{ formatDate(lead.last_outreach_date) }}</td>
  <td>
    <div v-if="lead.next_callback_at" class="callback-info">
      <span>{{ formatDate(lead.next_callback_at) }}</span>
      <button @click="$emit('complete-callback')">Done</button>
    </div>
    <span v-else>-</span>
  </td>
  <td class="actions">
    <button @click="$emit('view-timeline')">View</button>
    <button @click="$emit('log-outreach')">Log Outreach</button>
  </td>
</tr>
```

**Events**:
- `view-timeline`
- `log-outreach`
- `complete-callback`

---

### Component 2.4: `StatusBadge.vue` (NEW - REUSABLE)
**Location**: `src/components/Leads/StatusBadge.vue`

**Props**:
- `status` (Object): { id, status_name, status_color }

**Template**:
```html
<span 
  class="status-badge" 
  :style="{ backgroundColor: status.status_color }"
>
  {{ status.status_name }}
</span>
```

**Styling**:
- Rounded corners
- Small padding
- White text
- Dynamic background color from status.status_color

---

# PAGE 3: Today's Callbacks (NEW)

## Location
`/leads/callbacks`

## Purpose
Show all callbacks scheduled for today (and overdue)

## Layout
```
+----------------------------------------------------------+
| 🔴 2 Overdue Callbacks | 🟡 3 Due Today                   |
+----------------------------------------------------------+
| Time | Contact | Company | Phone | Notes | Actions       |
+----------------------------------------------------------+
| 09:00 | John | Acme | +123 | Left VM | [Call] [Done]   |
+----------------------------------------------------------+
```

---

## Components to Create

### Component 3.1: `CallbacksList.vue` (NEW)
**Location**: `src/pages/Leads/CallbacksList.vue`

**Data** (mock):
```javascript
{
  callbacks: [
    {
      outreach_id: 123,
      contact_name: "John Doe",
      company_name: "Acme Corp",
      phone: "+1234567890",
      email: "john@acme.com",
      callback_scheduled_at: "2026-01-25 09:00:00",
      is_overdue: true,
      status_name: "Call Later",
      last_notes: "Left voicemail yesterday",
      assigned_to_name: "Jane Smith"
    }
    // ... more mock callbacks
  ],
  stats: {
    today_count: 3,
    overdue_count: 2
  }
}
```

**Template Structure**:
- Stats cards (overdue/today count)
- Grouped table (overdue first, then today)
- Quick action buttons per row

**Mock Behavior**:
- Click "Call" - open phone dialer (tel: link)
- Click "Done" - console.log, show success message
- Refresh - no API call, use same mock data

---

### Component 3.2: `CallbackCard.vue` (NEW)
**Location**: `src/components/Leads/CallbackCard.vue`

**Props**:
- `callback` (Object)

**Template**:
```html
<div class="callback-card" :class="{ overdue: callback.is_overdue }">
  <div class="time">{{ formatTime(callback.callback_scheduled_at) }}</div>
  <div class="contact-info">
    <h3>{{ callback.contact_name }}</h3>
    <p>{{ callback.company_name }} | {{ callback.job_title }}</p>
  </div>
  <div class="contact-details">
    <a :href="`tel:${callback.phone}`">{{ callback.phone }}</a>
    <a :href="`mailto:${callback.email}`">{{ callback.email }}</a>
  </div>
  <div class="notes">{{ callback.last_notes }}</div>
  <div class="actions">
    <button @click="$emit('call')">Call</button>
    <button @click="$emit('complete')">Mark Done</button>
  </div>
</div>
```

**Events**:
- `call`
- `complete`

---

# PAGE 4: Reports (NEW)

## Location
`/leads/reports`

## Purpose
Show analytics and performance metrics

## Layout
```
+---------------------------+---------------------------+
| Total Tracked: 47         | Active Leads: 35          |
+---------------------------+---------------------------+
| Status Distribution Chart                             |
+-------------------------------------------------------+
| User Performance Table                                 |
+-------------------------------------------------------+
| Outreach Activity Chart                                |
+-------------------------------------------------------+
```

---

## Components to Create

### Component 4.1: `ReportsDashboard.vue` (NEW)
**Location**: `src/pages/Leads/ReportsDashboard.vue`

**Data** (mock):
```javascript
{
  summary: {
    total_tracked: 47,
    active_leads: 35,
    inactive_leads: 12,
    total_outreach_attempts: 156,
    avg_outreach_per_lead: 3.3
  },
  status_distribution: [
    { status_name: "Interested", count: 12, percentage: 34.3, color: "#34D399" },
    { status_name: "Call Later", count: 8, percentage: 22.9, color: "#60A5FA" }
    // ... more
  ],
  outreach_by_type: {
    email: 45,
    phone: 89,
    both: 15,
    meeting: 7
  },
  user_performance: [
    {
      user_name: "Jane Smith",
      contacts_tracked: 15,
      total_outreach: 52,
      positive_responses: 8,
      conversion_rate: 53.3
    }
    // ... more users
  ]
}
```

**Template Structure**:
- Summary stat cards
- Status distribution pie/donut chart
- User performance table
- Outreach by type bar chart

**Charts**:
Use Chart.js, ApexCharts, or similar library

---

### Component 4.2: `StatCard.vue` (NEW - REUSABLE)
**Location**: `src/components/Leads/StatCard.vue`

**Props**:
- `title` (String)
- `value` (Number/String)
- `icon` (String, optional)
- `color` (String, optional)

**Template**:
```html
<div class="stat-card" :style="{ borderLeftColor: color }">
  <div class="icon" v-if="icon">
    <i :class="icon"></i>
  </div>
  <div class="content">
    <div class="title">{{ title }}</div>
    <div class="value">{{ value }}</div>
  </div>
</div>
```

---

### Component 4.3: `StatusDistributionChart.vue` (NEW)
**Location**: `src/components/Leads/StatusDistributionChart.vue`

**Props**:
- `data` (Array): status_distribution array

**Template**:
```html
<div class="chart-container">
  <h3>Lead Status Distribution</h3>
  <canvas ref="chart"></canvas>
</div>
```

**Mounted**:
```javascript
mounted() {
  // Use mock data to render chart
  // Chart.js donut chart with status colors
}
```

---

# SHARED COMPONENTS

### Component S.1: `OutreachLogModal.vue` (NEW - IMPORTANT)
**Location**: `src/components/Leads/OutreachLogModal.vue`

**Purpose**: Modal/dialog to log outreach attempt

**Props**:
- `contactId` (String)
- `contactName` (String)
- `visible` (Boolean)

**Data**:
```javascript
{
  form: {
    outreach_type: "phone",
    status_id: null,
    notes: "",
    callback_scheduled_at: null
  },
  statuses: [
    { id: 1, status_name: "Not Contacted Yet", requires_callback: false },
    { id: 5, status_name: "Call Later", requires_callback: true },
    // Mock statuses
  ]
}
```

**Template**:
```html
<modal :visible="visible" @close="$emit('close')">
  <h2>Log Outreach - {{ contactName }}</h2>
  
  <form @submit.prevent="submit">
    <div class="form-group">
      <label>Outreach Type</label>
      <select v-model="form.outreach_type" required>
        <option value="email">Email</option>
        <option value="phone">Phone</option>
        <option value="both">Both</option>
        <option value="meeting">Meeting</option>
        <option value="other">Other</option>
      </select>
    </div>
    
    <div class="form-group">
      <label>Status</label>
      <select v-model="form.status_id" required @change="onStatusChange">
        <option v-for="status in statuses" :value="status.id">
          {{ status.status_name }}
        </option>
      </select>
    </div>
    
    <div class="form-group">
      <label>Notes</label>
      <textarea v-model="form.notes" rows="4"></textarea>
    </div>
    
    <div class="form-group" v-if="selectedStatus?.requires_callback">
      <label>Callback Date & Time</label>
      <input 
        type="datetime-local" 
        v-model="form.callback_scheduled_at" 
        required
      />
    </div>
    
    <div class="actions">
      <button type="submit">Log Outreach</button>
      <button type="button" @click="$emit('close')">Cancel</button>
    </div>
  </form>
</modal>
```

**Computed**:
```javascript
selectedStatus() {
  return this.statuses.find(s => s.id === this.form.status_id);
}
```

**Methods**:
```javascript
onStatusChange() {
  // Clear callback if status doesn't require it
  if (!this.selectedStatus?.requires_callback) {
    this.form.callback_scheduled_at = null;
  }
}

submit() {
  // Validate
  if (this.selectedStatus?.requires_callback && !this.form.callback_scheduled_at) {
    alert("Callback date/time required for this status");
    return;
  }
  
  // Emit event (no API call yet)
  this.$emit('submit', this.form);
  console.log("Will call API:", this.form);
}
```

**Events**:
- `close`
- `submit`

---

### Component S.2: `ContactTimelineModal.vue` (NEW)
**Location**: `src/components/Leads/ContactTimelineModal.vue`

**Purpose**: Modal showing complete outreach history for a contact

**Props**:
- `contactId` (String)
- `visible` (Boolean)

**Data** (mock):
```javascript
{
  contact: {
    full_name: "John Doe",
    company_name: "Acme Corp",
    email: "john@acme.com",
    phone: "+1234567890"
  },
  timeline: [
    {
      id: 125,
      outreach_type: "phone",
      outreach_date: "2026-01-24 15:30:00",
      status_name: "Interested - Follow Up",
      status_color: "#34D399",
      notes: "Spoke with John, very interested.",
      performed_by_name: "Jane Smith"
    }
    // ... more entries
  ]
}
```

**Template**:
```html
<modal :visible="visible" @close="$emit('close')" size="large">
  <h2>Timeline - {{ contact.full_name }}</h2>
  <div class="contact-info">
    {{ contact.company_name }} | {{ contact.email }} | {{ contact.phone }}
  </div>
  
  <div class="timeline">
    <div 
      v-for="entry in timeline" 
      :key="entry.id" 
      class="timeline-entry"
    >
      <div class="timeline-marker" :style="{ backgroundColor: entry.status_color }"></div>
      <div class="timeline-content">
        <div class="header">
          <span class="type">{{ entry.outreach_type }}</span>
          <span class="date">{{ formatDate(entry.outreach_date) }}</span>
        </div>
        <div class="status">
          <StatusBadge :status="{ status_name: entry.status_name, status_color: entry.status_color }" />
        </div>
        <div class="notes" v-if="entry.notes">{{ entry.notes }}</div>
        <div class="performer">By: {{ entry.performed_by_name }}</div>
      </div>
    </div>
  </div>
</modal>
```

---

# UTILITY/HELPER COMPONENTS

### Component U.1: `Modal.vue` (MAY EXIST - UPDATE IF NEEDED)
Generic modal/dialog wrapper

### Component U.2: `Pagination.vue` (MAY EXIST - UPDATE IF NEEDED)
Generic pagination component

---

# ROUTING

Add these routes to your router:

```javascript
// Leads routes
{
  path: '/leads',
  component: LeadsLayout, // Or your main layout
  meta: { requiresAuth: true },
  children: [
    {
      path: 'tracking',
      name: 'leads.tracking',
      component: () => import('@/pages/Leads/TrackingList.vue'),
      meta: { title: 'My Leads' }
    },
    {
      path: 'callbacks',
      name: 'leads.callbacks',
      component: () => import('@/pages/Leads/CallbacksList.vue'),
      meta: { title: "Today's Callbacks" }
    },
    {
      path: 'reports',
      name: 'leads.reports',
      component: () => import('@/pages/Leads/ReportsDashboard.vue'),
      meta: { title: 'Reports' }
    }
  ]
}
```

---

# MOCK DATA FILES

Create a mock data file for development:

**File**: `src/mocks/leadMockData.js`

```javascript
export const mockLeads = [
  {
    contact_id: "mock_1",
    full_name: "John Doe",
    job_title: "CEO",
    company_name: "Acme Corp",
    email: "john@acme.com",
    phone: "+1234567890",
    location: "San Francisco, CA",
    current_status: {
      id: 5,
      status_name: "Call Later",
      status_color: "#60A5FA",
      status_category: "follow_up"
    },
    last_outreach_date: "2026-01-24 15:30:00",
    total_outreach_count: 3,
    email_count: 1,
    phone_count: 2,
    next_callback_at: "2026-01-26 14:00:00",
    assigned_to: { id: 45, name: "Jane Smith" }
  }
  // ... add 10-15 more for testing
];

export const mockStatuses = [
  { id: 1, status_name: "Not Contacted Yet", status_category: "pending", requires_callback: false, status_color: "#9CA3AF" },
  { id: 5, status_name: "Call Later", status_category: "follow_up", requires_callback: true, status_color: "#60A5FA" },
  // ... all 16 statuses
];

export const mockCallbacks = [
  {
    outreach_id: 123,
    contact_name: "John Doe",
    company_name: "Acme Corp",
    phone: "+1234567890",
    callback_scheduled_at: "2026-01-25 09:00:00",
    is_overdue: true,
    status_name: "Call Later",
    last_notes: "Left voicemail"
  }
  // ... more callbacks
];

export const mockReports = {
  summary: {
    total_tracked: 47,
    active_leads: 35,
    total_outreach_attempts: 156
  },
  status_distribution: [
    { status_name: "Interested", count: 12, percentage: 34.3, color: "#34D399" },
    { status_name: "Call Later", count: 8, percentage: 22.9, color: "#60A5FA" }
  ]
};
```

---

# STYLING GUIDELINES

## Color Scheme (use your existing theme or these)
- Primary: #3B82F6 (blue)
- Success: #10B981 (green)
- Warning: #F59E0B (yellow)
- Danger: #EF4444 (red)
- Gray: #6B7280

## Status Colors (from database)
- Pending: #9CA3AF (gray)
- Positive: #34D399 (green)
- Negative: #F87171 (red)
- Follow-up: #60A5FA (blue)
- Converted: #10B981 (darker green)

## Component Styling
- Use your existing CSS framework (Tailwind, Bootstrap, etc.)
- Maintain consistency with existing pages
- Mobile responsive (optional for MVP)

---

# ICONS

Use your existing icon library (FontAwesome, Heroicons, etc.):
- Checkboxes: ☐ ☑
- Track: ✓ or ➕
- Phone: ☎ or 📞
- Email: ✉ or 📧
- Calendar: 📅
- Timeline: 📊 or 🕐

---

# STATE MANAGEMENT (OPTIONAL)

If using Vuex/Pinia/Redux:

Create stores:
- `leads.js` - tracking list, filters
- `callbacks.js` - today's callbacks
- `statuses.js` - status options

Mock the getters/actions for now.

---

# FRONTEND TESTING CHECKLIST

Test each page with mock data:

## Search Lusha Page
- [ ] Checkboxes work (single, all)
- [ ] Bulk action bar shows/hides
- [ ] Track button shows correctly
- [ ] Buttons log to console

## My Leads Page
- [ ] Table displays mock leads
- [ ] Filters work (client-side)
- [ ] Pagination changes pages
- [ ] Status badges show correct colors
- [ ] Buttons trigger modals

## Today's Callbacks Page
- [ ] Callbacks listed
- [ ] Overdue highlighted
- [ ] Phone/email links work
- [ ] Buttons log to console

## Reports Page
- [ ] Stat cards display
- [ ] Charts render
- [ ] Data shows correctly

## Modals
- [ ] OutreachLogModal opens
- [ ] Status dropdown works
- [ ] Callback field shows when required
- [ ] Timeline modal displays history

---

# FILES TO CREATE SUMMARY

## Pages (4)
1. `src/pages/Leads/TrackingList.vue`
2. `src/pages/Leads/CallbacksList.vue`
3. `src/pages/Leads/ReportsDashboard.vue`
4. Update: `src/pages/Lusha/SearchResults.vue`

## Components (8+)
1. `src/components/Lusha/BulkActionBar.vue`
2. `src/components/Leads/TrackingFilters.vue`
3. `src/components/Leads/LeadTableRow.vue`
4. `src/components/Leads/StatusBadge.vue`
5. `src/components/Leads/CallbackCard.vue`
6. `src/components/Leads/StatCard.vue`
7. `src/components/Leads/StatusDistributionChart.vue`
8. `src/components/Leads/OutreachLogModal.vue`
9. `src/components/Leads/ContactTimelineModal.vue`

## Other Files
1. `src/mocks/leadMockData.js` - Mock data
2. `src/router/index.js` - Add routes
3. Menu/Navigation component - Add Leads menu

---

# FRONTEND COMPLETE ✅

Once all pages and components built with mock data:
- ✅ All pages accessible via menu
- ✅ All components render correctly
- ✅ Mock data displays properly
- ✅ Buttons/interactions work (without API)
- ✅ Modals open/close
- ✅ Filters work client-side
- ✅ No console errors

**Next Step**: Proceed to `04_INTEGRATION_CHECKLIST.md`

---

# NOTES

- **Don't worry about API calls yet** - just get the UI working
- **Use placeholder text** like "API will be connected later"
- **Focus on layout and interactions** with mock data
- **Test responsiveness** if time permits
- **Keep components simple** - refine later during integration
