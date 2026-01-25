# Career Opportunities API Documentation

This document provides comprehensive documentation for the Career Opportunities API endpoints. These endpoints allow you to manage job listings, applications, and categories for the IB website careers section.

## Base URL

All endpoints are prefixed with: `/api/career`

## Authentication

- **Public Endpoints**: No authentication required (marked with 🔓)
- **Protected Endpoints**: Require authentication token in header (marked with 🔒)
  - Header: `Authorization: Bearer <token>`

---

## Table of Contents

1. [Filter Options & Metadata](#filter-options--metadata)
2. [Career Opportunities (Job Listings)](#career-opportunities-job-listings)
3. [Applications](#applications)
4. [Categories](#categories)
5. [Data Models](#data-models)
6. [Error Handling](#error-handling)

---

## Filter Options & Metadata

### Get Filter Options 🔓

**GET** `/api/career/filters`

Retrieves all available filter options for dropdowns and form fields. Public endpoint - no authentication required. This endpoint provides static options (job types, experience levels, application statuses) and dynamic options (departments, locations) extracted from active job listings.

#### Response (200 OK)

```json
{
  "status": "Success",
  "status_code": 200,
  "data": {
    "jobTypes": [
      { "value": "full-time", "label": "Full Time" },
      { "value": "part-time", "label": "Part Time" },
      { "value": "contract", "label": "Contract" },
      { "value": "internship", "label": "Internship" },
      { "value": "freelance", "label": "Freelance" }
    ],
    "experienceLevels": [
      { "value": "entry", "label": "Entry Level" },
      { "value": "mid", "label": "Mid Level" },
      { "value": "senior", "label": "Senior Level" },
      { "value": "executive", "label": "Executive Level" }
    ],
    "applicationStatuses": [
      { "value": "pending", "label": "Pending" },
      { "value": "reviewing", "label": "Reviewing" },
      { "value": "shortlisted", "label": "Shortlisted" },
      { "value": "interviewed", "label": "Interviewed" },
      { "value": "offered", "label": "Offered" },
      { "value": "rejected", "label": "Rejected" },
      { "value": "withdrawn", "label": "Withdrawn" }
    ],
    "departments": [
      { "value": "Engineering", "label": "Engineering" },
      { "value": "Sales", "label": "Sales" },
      { "value": "Marketing", "label": "Marketing" },
      { "value": "HR", "label": "HR" }
    ],
    "locations": [
      { "value": "Remote", "label": "Remote" },
      { "value": "New York, NY", "label": "New York, NY" },
      { "value": "San Francisco, CA", "label": "San Francisco, CA" },
      { "value": "Hybrid - Chicago", "label": "Hybrid - Chicago" }
    ]
  }
}
```

#### Response Fields

- **jobTypes**: Static list of all available job types with display labels
- **experienceLevels**: Static list of all available experience levels with display labels
- **applicationStatuses**: Static list of all application statuses (useful for admin dashboard)
- **departments**: Dynamic list extracted from active job listings (unique departments)
- **locations**: Dynamic list extracted from active job listings (unique locations)

#### Usage Example

```javascript
// Fetch filter options for dropdowns
const response = await fetch('/api/career/filters');
const { data } = await response.json();

// Populate job type dropdown
const jobTypeSelect = document.getElementById('job-type');
data.jobTypes.forEach(type => {
  const option = document.createElement('option');
  option.value = type.value;
  option.textContent = type.label;
  jobTypeSelect.appendChild(option);
});

// Populate experience level dropdown
const experienceSelect = document.getElementById('experience-level');
data.experienceLevels.forEach(level => {
  const option = document.createElement('option');
  option.value = level.value;
  option.textContent = level.label;
  experienceSelect.appendChild(option);
});

// Populate department dropdown
const departmentSelect = document.getElementById('department');
data.departments.forEach(dept => {
  const option = document.createElement('option');
  option.value = dept.value;
  option.textContent = dept.label;
  departmentSelect.appendChild(option);
});
```

**Note**: 
- Departments and locations are dynamically generated from active job listings
- If no active jobs exist, these arrays will be empty
- This endpoint should be called when initializing forms/filters to populate dropdowns
- Consider caching this response since it doesn't change frequently

---

## Career Opportunities (Job Listings)

### 1. Create Job Listing 🔒

**POST** `/api/career/opportunities`

Creates a new job listing. Requires authentication.

#### Request Body

```json
{
  "title": "Senior Software Engineer",
  "slug": "senior-software-engineer",  // Optional: auto-generated from title if not provided
  "department": "Engineering",
  "job_type": "full-time",  // Options: "full-time", "part-time", "contract", "internship", "freelance"
  "location": "Remote",
  "is_remote": true,
  "is_active": true,
  "is_featured": false,
  "published_at": "2024-01-15T10:00:00Z",  // Optional: auto-set if is_active=true
  "expires_at": "2024-12-31T23:59:59Z",  // Optional: expiration date
  "description": {
    "overview": "We are looking for an experienced Senior Software Engineer...",
    "paragraphs": [
      "Join our dynamic team and work on cutting-edge projects...",
      "You'll collaborate with talented engineers across the globe...",
      "This role offers excellent growth opportunities..."
    ],
    "salary": {
      "min": 80000,
      "max": 120000,
      "currency": "USD",
      "period": "yearly",
      "display": "$80,000 - $120,000/year"
    },
    "requirements": [
      "Bachelor's degree in Computer Science or related field",
      "5+ years of professional software development experience",
      "Proficiency in JavaScript, Node.js, and React",
      "Experience with cloud platforms (AWS, Azure, or GCP)"
    ],
    "responsibilities": [
      "Design and develop scalable web applications",
      "Collaborate with cross-functional teams",
      "Mentor junior developers",
      "Participate in code reviews"
    ],
    "benefits": [
      "Comprehensive health insurance",
      "401(k) matching up to 6%",
      "Flexible work hours and remote options",
      "Unlimited PTO",
      "Professional development budget"
    ],
    "qualifications": {
      "required": [
        "5+ years experience",
        "JavaScript proficiency"
      ],
      "preferred": [
        "Experience with TypeScript",
        "Knowledge of microservices architecture"
      ]
    }
  },
  "salary_min": 80000,  // For filtering/sorting
  "salary_max": 120000,
  "salary_currency": "USD",
  "experience_level": "senior",  // Options: "entry", "mid", "senior", "executive"
  "application_email": "jobs@example.com",
  "application_url": "https://example.com/apply",  // Optional: external application URL
  "application_deadline": "2024-06-30T23:59:59Z",
  "meta_title": "Senior Software Engineer - Join Our Team",
  "meta_description": "We're hiring a Senior Software Engineer...",
  "meta_keywords": "software engineer, javascript, remote, full-time",
  "category_ids": [1, 2]  // Array of category IDs
}
```

#### Response (201 Created)

```json
{
  "status": "Success",
  "status_code": 201,
  "data": {
    "id": 1,
    "title": "Senior Software Engineer",
    "slug": "senior-software-engineer",
    "department": "Engineering",
    "job_type": "full-time",
    "location": "Remote",
    "is_remote": true,
    "is_active": true,
    "is_featured": false,
    "published_at": "2024-01-15 10:00:00",
    "expires_at": "2024-12-31 23:59:59",
    "description": { /* full description object */ },
    "salary_min": 80000,
    "salary_max": 120000,
    "salary_currency": "USD",
    "experience_level": "senior",
    "view_count": 0,
    "application_count": 0,
    "category_ids": [1, 2],
    "category_names": ["Engineering", "Technology"],
    "created_at": "2024-01-15 10:00:00",
    "updated_at": "2024-01-15 10:00:00"
  }
}
```

---

### 2. Get All Job Listings 🔓

**GET** `/api/career/opportunities`

Retrieves a paginated list of job listings with optional filters. Public endpoint.

#### Query Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `page` | number | Page number (default: 1) | `?page=1` |
| `limit` | number | Items per page (default: 20, max: 100) | `?limit=20` |
| `is_active` | boolean | Filter by active status | `?is_active=true` |
| `is_featured` | boolean | Filter featured jobs | `?is_featured=true` |
| `department` | string | Filter by department | `?department=Engineering` |
| `job_type` | string | Filter by job type | `?job_type=full-time` |
| `location` | string | Filter by location (partial match) | `?location=Remote` |
| `is_remote` | boolean | Filter remote jobs | `?is_remote=true` |
| `experience_level` | string | Filter by experience | `?experience_level=senior` |
| `salary_min` | number | Minimum salary filter | `?salary_min=70000` |
| `salary_max` | number | Maximum salary filter | `?salary_max=150000` |
| `category_id` | number | Filter by category ID | `?category_id=1` |
| `search` | string | Full-text search | `?search=software engineer` |
| `sort_by` | string | Sort field (default: "created_at") | `?sort_by=published_at` |
| `sort_order` | string | Sort order: "asc" or "desc" (default: "desc") | `?sort_order=desc` |

#### Example Request

```bash
GET /api/career/opportunities?is_active=true&department=Engineering&salary_min=70000&page=1&limit=20&sort_by=published_at&sort_order=desc
```

#### Response (200 OK)

```json
{
  "status": "Success",
  "status_code": 200,
  "data": {
    "jobs": [
      {
        "id": 1,
        "title": "Senior Software Engineer",
        "slug": "senior-software-engineer",
        "department": "Engineering",
        "job_type": "full-time",
        "location": "Remote",
        "is_remote": true,
        "is_active": true,
        "is_featured": false,
        "published_at": "2024-01-15 10:00:00",
        "expires_at": "2024-12-31 23:59:59",
        "salary_min": 80000,
        "salary_max": 120000,
        "salary_currency": "USD",
        "experience_level": "senior",
        "view_count": 45,
        "application_count": 12,
        "categories": ["Engineering", "Technology"],
        "created_at": "2024-01-15 10:00:00",
        "updated_at": "2024-01-15 10:00:00"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 15,
      "totalPages": 1
    }
  }
}
```

**Note**: The `description` field is not included in list responses for performance. Use the detail endpoint to get full description.

---

### 3. Get Job by ID 🔓

**GET** `/api/career/opportunities/:id`

Retrieves a single job listing by ID. Public endpoint. Automatically increments view count.

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | number | Job listing ID |

#### Example Request

```bash
GET /api/career/opportunities/1
```

#### Response (200 OK)

```json
{
  "status": "Success",
  "status_code": 200,
  "data": {
    "id": 1,
    "title": "Senior Software Engineer",
    "slug": "senior-software-engineer",
    "department": "Engineering",
    "job_type": "full-time",
    "location": "Remote",
    "is_remote": true,
    "is_active": true,
    "is_featured": false,
    "published_at": "2024-01-15 10:00:00",
    "expires_at": "2024-12-31 23:59:59",
    "description": {
      "overview": "We are looking for...",
      "paragraphs": [...],
      "salary": {...},
      "requirements": [...],
      "responsibilities": [...],
      "benefits": [...],
      "qualifications": {...}
    },
    "salary_min": 80000,
    "salary_max": 120000,
    "salary_currency": "USD",
    "experience_level": "senior",
    "application_email": "jobs@example.com",
    "application_url": "https://example.com/apply",
    "application_deadline": "2024-06-30 23:59:59",
    "meta_title": "Senior Software Engineer - Join Our Team",
    "meta_description": "We're hiring...",
    "meta_keywords": "software engineer, javascript, remote",
    "view_count": 46,
    "application_count": 12,
    "category_ids": [1, 2],
    "category_names": ["Engineering", "Technology"],
    "created_at": "2024-01-15 10:00:00",
    "updated_at": "2024-01-15 10:00:00"
  }
}
```

---

### 4. Get Job by Slug 🔓

**GET** `/api/career/opportunities/slug/:slug`

Retrieves a single job listing by slug (URL-friendly identifier). Public endpoint. Only returns active jobs. Automatically increments view count.

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `slug` | string | Job listing slug (e.g., "senior-software-engineer") |

#### Example Request

```bash
GET /api/career/opportunities/slug/senior-software-engineer
```

#### Response (200 OK)

Same format as "Get Job by ID" response.

---

### 5. Update Job Listing 🔒

**PATCH** `/api/career/opportunities/:id`

Updates an existing job listing. Requires authentication. Only include fields you want to update.

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | number | Job listing ID |

#### Request Body

All fields are optional. Only include fields you want to update.

```json
{
  "title": "Senior Software Engineer - Updated",
  "is_active": false,
  "is_featured": true,
  "description": {
    "overview": "Updated overview..."
  },
  "salary_min": 90000,
  "salary_max": 130000,
  "category_ids": [1, 2, 3]
}
```

#### Response (200 OK)

Returns the updated job listing (same format as "Get Job by ID").

---

### 6. Delete Job Listing 🔒

**DELETE** `/api/career/opportunities/:id`

Deletes a job listing. Requires authentication. This will also delete all associated applications and category links.

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | number | Job listing ID |

#### Response (200 OK)

```json
{
  "status": "Success",
  "status_code": 200,
  "data": {
    "id": 1,
    "message": "Career opportunity deleted successfully"
  }
}
```

---

## Applications

### 7. Submit Application 🔓

**POST** `/api/career/applications`

Submits a job application. Public endpoint - no authentication required.

#### Request Body

```json
{
  "job_id": 1,
  "first_name": "John",
  "last_name": "Doe",
  "email": "john.doe@example.com",
  "phone": "+1234567890",  // Optional
  "resume_url": "https://example.com/resumes/john-doe-resume.pdf",  // Optional
  "cover_letter": "I am writing to express my interest...",  // Optional
  "additional_info": {  // Optional: flexible JSON object
    "linkedin": "https://linkedin.com/in/johndoe",
    "portfolio": "https://johndoe.dev",
    "referral_source": "LinkedIn",
    "years_of_experience": 7
  }
}
```

#### Response (201 Created)

```json
{
  "status": "Success",
  "status_code": 201,
  "data": {
    "id": 1,
    "job_id": 1,
    "job_title": "Senior Software Engineer",
    "job_slug": "senior-software-engineer",
    "first_name": "John",
    "last_name": "Doe",
    "email": "john.doe@example.com",
    "phone": "+1234567890",
    "resume_url": "https://example.com/resumes/john-doe-resume.pdf",
    "cover_letter": "I am writing to express my interest...",
    "status": "pending",
    "status_notes": null,
    "additional_info": {
      "linkedin": "https://linkedin.com/in/johndoe",
      "portfolio": "https://johndoe.dev"
    },
    "viewed_at": null,
    "reviewed_by": null,
    "created_at": "2024-01-20 14:30:00",
    "updated_at": "2024-01-20 14:30:00"
  }
}
```

**Note**: 
- Application count for the job is automatically incremented
- Cannot apply to inactive jobs
- Cannot apply if application deadline has passed

---

### 8. Get All Applications 🔒

**GET** `/api/career/applications`

Retrieves a paginated list of applications. Requires authentication (admin only).

#### Query Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `page` | number | Page number (default: 1) | `?page=1` |
| `limit` | number | Items per page (default: 20, max: 100) | `?limit=20` |
| `job_id` | number | Filter by job ID | `?job_id=1` |
| `status` | string | Filter by status | `?status=pending` |
| `email` | string | Filter by applicant email | `?email=john@example.com` |

**Status Options**: `pending`, `reviewing`, `shortlisted`, `interviewed`, `offered`, `rejected`, `withdrawn`

#### Example Request

```bash
GET /api/career/applications?job_id=1&status=pending&page=1&limit=20
```

#### Response (200 OK)

```json
{
  "status": "Success",
  "status_code": 200,
  "data": {
    "applications": [
      {
        "id": 1,
        "job_id": 1,
        "job_title": "Senior Software Engineer",
        "job_slug": "senior-software-engineer",
        "first_name": "John",
        "last_name": "Doe",
        "email": "john.doe@example.com",
        "phone": "+1234567890",
        "resume_url": "https://example.com/resumes/john-doe-resume.pdf",
        "cover_letter": "I am writing...",
        "status": "pending",
        "status_notes": null,
        "viewed_at": null,
        "reviewed_by": null,
        "created_at": "2024-01-20 14:30:00",
        "updated_at": "2024-01-20 14:30:00"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 5,
      "totalPages": 1
    }
  }
}
```

---

### 9. Get Application by ID 🔒

**GET** `/api/career/applications/:id`

Retrieves a single application by ID. Requires authentication.

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | number | Application ID |

#### Response (200 OK)

Same format as application object in "Get All Applications" response.

---

### 10. Update Application Status 🔒

**PATCH** `/api/career/applications/:id/status`

Updates the status of an application. Requires authentication (admin only).

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | number | Application ID |

#### Request Body

```json
{
  "status": "shortlisted",  // Required: one of the status options
  "status_notes": "Strong technical background, moving to interview stage"  // Optional
}
```

**Status Options**: `pending`, `reviewing`, `shortlisted`, `interviewed`, `offered`, `rejected`, `withdrawn`

#### Response (200 OK)

Returns the updated application object.

**Note**: 
- `viewed_at` and `reviewed_by` are automatically set when status changes from `pending` to any other status
- If status is already not `pending`, `viewed_at` is only set if it wasn't set before

---

## Categories

### 11. Create Category 🔒

**POST** `/api/career/categories`

Creates a new job category. Requires authentication.

#### Request Body

```json
{
  "name": "Engineering",
  "slug": "engineering",  // Optional: auto-generated from name if not provided
  "description": "Engineering and technical roles",  // Optional
  "display_order": 1,  // Optional: for sorting (default: 0)
  "is_active": true  // Optional: default true
}
```

#### Response (201 Created)

```json
{
  "status": "Success",
  "status_code": 201,
  "data": {
    "id": 1,
    "name": "Engineering",
    "slug": "engineering",
    "description": "Engineering and technical roles",
    "display_order": 1,
    "is_active": true,
    "created_at": "2024-01-15 10:00:00",
    "updated_at": "2024-01-15 10:00:00"
  }
}
```

---

### 12. Get All Categories 🔓

**GET** `/api/career/categories`

Retrieves all categories. Public endpoint.

#### Query Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `include_inactive` | boolean | Include inactive categories (default: false) | `?include_inactive=true` |

#### Response (200 OK)

```json
{
  "status": "Success",
  "status_code": 200,
  "data": [
    {
      "id": 1,
      "name": "Engineering",
      "slug": "engineering",
      "description": "Engineering and technical roles",
      "display_order": 1,
      "is_active": true,
      "created_at": "2024-01-15 10:00:00",
      "updated_at": "2024-01-15 10:00:00"
    },
    {
      "id": 2,
      "name": "Sales",
      "slug": "sales",
      "description": "Sales and business development roles",
      "display_order": 2,
      "is_active": true,
      "created_at": "2024-01-15 10:00:00",
      "updated_at": "2024-01-15 10:00:00"
    }
  ]
}
```

**Note**: Categories are sorted by `display_order` (ascending), then by `name` (ascending).

---

### 13. Get Category by ID 🔓

**GET** `/api/career/categories/:id`

Retrieves a single category by ID. Public endpoint.

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | number | Category ID |

#### Response (200 OK)

Same format as category object in "Get All Categories" response.

---

### 14. Update Category 🔒

**PATCH** `/api/career/categories/:id`

Updates an existing category. Requires authentication. All fields are optional.

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | number | Category ID |

#### Request Body

```json
{
  "name": "Engineering - Updated",
  "display_order": 2,
  "is_active": false
}
```

#### Response (200 OK)

Returns the updated category object.

---

### 15. Delete Category 🔒

**DELETE** `/api/career/categories/:id`

Deletes a category. Requires authentication. Cannot delete if category is used by any job listings.

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | number | Category ID |

#### Response (200 OK)

```json
{
  "status": "Success",
  "status_code": 200,
  "data": {
    "id": 1,
    "message": "Category deleted successfully"
  }
}
```

**Error Response (400 Bad Request)** - If category is in use:

```json
{
  "status": "Error",
  "status_code": 400,
  "message": "Cannot delete category: it is used by 5 job posting(s)"
}
```

---

## Data Models

### Job Listing Object

```typescript
{
  id: number;
  title: string;
  slug: string;  // URL-friendly identifier
  department: string | null;
  job_type: "full-time" | "part-time" | "contract" | "internship" | "freelance";
  location: string | null;
  is_remote: boolean;
  is_active: boolean;
  is_featured: boolean;
  published_at: string | null;  // ISO datetime string
  expires_at: string | null;  // ISO datetime string
  description: {
    overview?: string;
    paragraphs?: string[];
    salary?: {
      min?: number;
      max?: number;
      currency?: string;
      period?: "hourly" | "daily" | "weekly" | "monthly" | "yearly";
      display?: string;
    };
    requirements?: string[];
    responsibilities?: string[];
    benefits?: string[];
    qualifications?: {
      required?: string[];
      preferred?: string[];
    };
    [key: string]: any;  // Additional flexible fields
  };
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string;  // Default: "USD"
  experience_level: "entry" | "mid" | "senior" | "executive" | null;
  application_email: string | null;
  application_url: string | null;
  application_deadline: string | null;  // ISO datetime string
  meta_title: string | null;
  meta_description: string | null;
  meta_keywords: string | null;
  view_count: number;
  application_count: number;
  category_ids: number[];
  category_names: string[];
  created_at: string;  // ISO datetime string
  updated_at: string;  // ISO datetime string
}
```

### Application Object

```typescript
{
  id: number;
  job_id: number;
  job_title: string;
  job_slug: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  resume_url: string | null;
  cover_letter: string | null;
  status: "pending" | "reviewing" | "shortlisted" | "interviewed" | "offered" | "rejected" | "withdrawn";
  status_notes: string | null;
  additional_info: object | null;  // Flexible JSON object
  viewed_at: string | null;  // ISO datetime string
  reviewed_by: number | null;  // User ID
  created_at: string;  // ISO datetime string
  updated_at: string;  // ISO datetime string
}
```

### Category Object

```typescript
{
  id: number;
  name: string;
  slug: string;  // URL-friendly identifier
  description: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;  // ISO datetime string
  updated_at: string;  // ISO datetime string
}
```

---

## Error Handling

All endpoints follow a consistent error response format:

### Error Response Format

```json
{
  "status": "Error",
  "status_code": 400,  // HTTP status code
  "message": "Error message describing what went wrong"
}
```

### Common HTTP Status Codes

- **200 OK**: Successful GET, PATCH, DELETE requests
- **201 Created**: Successful POST requests
- **400 Bad Request**: Invalid request data, validation errors
- **401 Unauthorized**: Missing or invalid authentication token
- **404 Not Found**: Resource not found
- **500 Internal Server Error**: Server-side errors

### Example Error Responses

#### Validation Error (400)

```json
{
  "status": "Error",
  "status_code": 400,
  "message": "Validation error: 'title' is required"
}
```

#### Not Found (404)

```json
{
  "status": "Error",
  "status_code": 404,
  "message": "Career opportunity not found"
}
```

#### Unauthorized (401)

```json
{
  "status": "Error",
  "status_code": 401,
  "message": "Please authenticate"
}
```

---

## Usage Examples

### Frontend Integration Examples

#### 1. Initialize Filter Dropdowns

```javascript
// Fetch filter options first (call this when page loads)
const filtersResponse = await fetch('/api/career/filters');
const filters = await filtersResponse.json();

// Populate job type dropdown
const jobTypeSelect = document.getElementById('job-type');
filters.data.jobTypes.forEach(type => {
  const option = document.createElement('option');
  option.value = type.value;
  option.textContent = type.label;
  jobTypeSelect.appendChild(option);
});

// Populate experience level dropdown
const experienceSelect = document.getElementById('experience-level');
filters.data.experienceLevels.forEach(level => {
  const option = document.createElement('option');
  option.value = level.value;
  option.textContent = level.label;
  experienceSelect.appendChild(option);
});

// Populate department dropdown (dynamic from active jobs)
const departmentSelect = document.getElementById('department');
filters.data.departments.forEach(dept => {
  const option = document.createElement('option');
  option.value = dept.value;
  option.textContent = dept.label;
  departmentSelect.appendChild(option);
});

// Populate location dropdown (dynamic from active jobs)
const locationSelect = document.getElementById('location');
filters.data.locations.forEach(loc => {
  const option = document.createElement('option');
  option.value = loc.value;
  option.textContent = loc.label;
  locationSelect.appendChild(option);
});
```

#### 2. Display Active Job Listings

```javascript
// Fetch active job listings
const response = await fetch('/api/career/opportunities?is_active=true&page=1&limit=10');
const data = await response.json();

// Display jobs
data.data.jobs.forEach(job => {
  console.log(`${job.title} - ${job.location}`);
  console.log(`Salary: $${job.salary_min} - $${job.salary_max}`);
  console.log(`Categories: ${job.categories.join(', ')}`);
});
```

#### 3. Display Single Job Page

```javascript
// Fetch job by slug (for public job page)
const slug = 'senior-software-engineer';
const response = await fetch(`/api/career/opportunities/slug/${slug}`);
const job = await response.json();

// Display job details
console.log(job.data.title);
console.log(job.data.description.overview);
job.data.description.paragraphs.forEach(para => console.log(para));
job.data.description.requirements.forEach(req => console.log(`- ${req}`));
```

#### 4. Submit Application

```javascript
const applicationData = {
  job_id: 1,
  first_name: "John",
  last_name: "Doe",
  email: "john@example.com",
  phone: "+1234567890",
  resume_url: "https://example.com/resume.pdf",
  cover_letter: "I am interested in this position...",
  additional_info: {
    linkedin: "https://linkedin.com/in/johndoe",
    portfolio: "https://johndoe.dev"
  }
};

const response = await fetch('/api/career/applications', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(applicationData)
});

const result = await response.json();
if (result.status === 'Success') {
  console.log('Application submitted successfully!');
}
```

#### 5. Filter Jobs by Category

```javascript
// Get all categories first
const categoriesResponse = await fetch('/api/career/categories');
const categories = await categoriesResponse.json();

// Filter jobs by selected category
const selectedCategoryId = 1;
const jobsResponse = await fetch(
  `/api/career/opportunities?category_id=${selectedCategoryId}&is_active=true`
);
const jobs = await jobsResponse.json();
```

#### 6. Search Jobs

```javascript
// Search for jobs
const searchTerm = 'software engineer';
const response = await fetch(
  `/api/career/opportunities?search=${encodeURIComponent(searchTerm)}&is_active=true`
);
const results = await response.json();
```

#### 7. Admin: Update Application Status

```javascript
// Update application status (requires auth token)
const token = 'your-auth-token';
const response = await fetch('/api/career/applications/1/status', {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    status: 'shortlisted',
    status_notes: 'Strong candidate, moving to interview'
  })
});
```

---

## Best Practices

### 1. Pagination
Always use pagination for list endpoints to avoid loading too much data at once:
```javascript
?page=1&limit=20
```

### 2. Filtering
Combine multiple filters for better results:
```javascript
?is_active=true&department=Engineering&salary_min=70000&experience_level=senior
```

### 3. Error Handling
Always check the response status and handle errors:
```javascript
const response = await fetch('/api/career/opportunities');
if (!response.ok) {
  const error = await response.json();
  console.error('Error:', error.message);
  return;
}
const data = await response.json();
```

### 4. Caching
Consider caching category data and job listings on the frontend since they don't change frequently.

### 5. SEO
Use slug-based URLs for public job pages:
```javascript
/jobs/senior-software-engineer  // Uses slug endpoint
```

---

## Notes

1. **Description Field**: The `description` field is a flexible JSON object. You can add any additional fields beyond the documented ones.

2. **Slug Generation**: If you don't provide a `slug` when creating a job/category, it will be auto-generated from the `title`/`name`.

3. **View Tracking**: View counts are automatically incremented when fetching a job by ID or slug.

4. **Application Tracking**: Application counts are automatically incremented when a new application is submitted.

5. **Expired Jobs**: Jobs with `expires_at` in the past are automatically filtered out from public listings.

6. **Audit Logging**: All changes to job listings are logged in the `career_opportunity_log` table for compliance.

7. **Category Links**: When updating `category_ids` in a job, existing category links are replaced with the new ones.

8. **Date Formats**: All dates are returned in MySQL datetime format: `YYYY-MM-DD HH:mm:ss`. ISO datetime strings are accepted in requests.

---

## Support

For questions or issues, please contact the backend team or refer to the main API documentation.
