-- Career Opportunities / Job Listings Schema for IB Website
-- This schema stores job listings with flexible description structure

-- Main job listings table
CREATE TABLE IF NOT EXISTS career_opportunities (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    
    -- Basic Job Information
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL, -- URL-friendly identifier (e.g., "senior-software-engineer")
    department VARCHAR(100), -- e.g., "Engineering", "Sales", "Marketing"
    job_type ENUM('full-time', 'part-time', 'contract', 'internship', 'freelance') DEFAULT 'full-time',
    location VARCHAR(255), -- e.g., "Remote", "New York, NY", "Hybrid - San Francisco"
    is_remote BOOLEAN DEFAULT FALSE,
    
    -- Status and Visibility
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE, -- For highlighting on careers page
    published_at TIMESTAMP NULL DEFAULT NULL, -- When job was published
    expires_at TIMESTAMP NULL DEFAULT NULL, -- Optional expiration date
    
    -- Description Structure (stored as JSON for flexibility)
    -- Example structure:
    -- {
    --   "overview": "We are looking for...",
    --   "paragraphs": [
    --     "First paragraph of description...",
    --     "Second paragraph..."
    --   ],
    --   "salary": {
    --     "min": 80000,
    --     "max": 120000,
    --     "currency": "USD",
    --     "period": "yearly",
    --     "display": "$80,000 - $120,000/year"
    --   },
    --   "requirements": [
    --     "Bachelor's degree in Computer Science",
    --     "5+ years of experience",
    --     "Proficiency in JavaScript"
    --   ],
    --   "responsibilities": [
    --     "Develop and maintain web applications",
    --     "Collaborate with cross-functional teams"
    --   ],
    --   "benefits": [
    --     "Health insurance",
    --     "401(k) matching",
    --     "Flexible work hours"
    --   ],
    --   "qualifications": {
    --     "required": ["Skill 1", "Skill 2"],
    --     "preferred": ["Skill 3", "Skill 4"]
    --   }
    -- }
    description JSON NOT NULL,
    
    -- Additional structured fields (for easier querying/filtering)
    salary_min DECIMAL(12, 2) NULL, -- For filtering/sorting
    salary_max DECIMAL(12, 2) NULL,
    salary_currency VARCHAR(3) DEFAULT 'USD',
    experience_level ENUM('entry', 'mid', 'senior', 'executive') NULL,
    
    -- Application Information
    application_email VARCHAR(255), -- Where to send applications
    application_url VARCHAR(500), -- External application URL (if any)
    application_deadline TIMESTAMP NULL DEFAULT NULL,
    
    -- SEO and Metadata
    meta_title VARCHAR(255), -- For SEO
    meta_description TEXT, -- For SEO
    meta_keywords VARCHAR(500), -- Comma-separated keywords
    
    -- Tracking
    view_count INT UNSIGNED DEFAULT 0,
    application_count INT UNSIGNED DEFAULT 0,
    
    -- Admin tracking
    created_by INT UNSIGNED NULL, -- User/admin who created the listing
    updated_by INT UNSIGNED NULL, -- User/admin who last updated
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes for common queries
    INDEX idx_title (title),
    INDEX idx_slug (slug),
    INDEX idx_is_active (is_active),
    INDEX idx_is_featured (is_featured),
    INDEX idx_department (department),
    INDEX idx_job_type (job_type),
    INDEX idx_location (location),
    INDEX idx_published_at (published_at),
    INDEX idx_expires_at (expires_at),
    INDEX idx_salary_range (salary_min, salary_max),
    INDEX idx_experience_level (experience_level),
    INDEX idx_created_at (created_at),
    FULLTEXT INDEX idx_fulltext_search (title, location, department)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Job applications table (for future use - storing applications)
CREATE TABLE IF NOT EXISTS career_applications (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    job_id INT UNSIGNED NOT NULL, -- References career_opportunities.id
    
    -- Applicant Information
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    resume_url VARCHAR(500), -- URL to uploaded resume file
    cover_letter TEXT,
    
    -- Application Status
    status ENUM('pending', 'reviewing', 'shortlisted', 'interviewed', 'offered', 'rejected', 'withdrawn') DEFAULT 'pending',
    status_notes TEXT, -- Internal notes about the application
    
    -- Additional Information (stored as JSON for flexibility)
    -- Example: {"linkedin": "url", "portfolio": "url", "referral_source": "LinkedIn", etc.}
    additional_info JSON,
    
    -- Tracking
    viewed_at TIMESTAMP NULL DEFAULT NULL, -- When application was first viewed
    reviewed_by INT UNSIGNED NULL, -- Admin who reviewed
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (job_id) REFERENCES career_opportunities(id) ON DELETE CASCADE,
    
    INDEX idx_job_id (job_id),
    INDEX idx_email (email),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at),
    INDEX idx_reviewed_by (reviewed_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Job categories/tags (for flexible categorization)
CREATE TABLE IF NOT EXISTS career_categories (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    display_order INT UNSIGNED DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_slug (slug),
    INDEX idx_display_order (display_order),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Junction table: Links jobs to categories (many-to-many)
CREATE TABLE IF NOT EXISTS career_opportunity_categories (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    job_id INT UNSIGNED NOT NULL,
    category_id INT UNSIGNED NOT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (job_id) REFERENCES career_opportunities(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES career_categories(id) ON DELETE CASCADE,
    
    UNIQUE KEY unique_job_category (job_id, category_id),
    INDEX idx_job_id (job_id),
    INDEX idx_category_id (category_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Audit log for job listing changes (optional but recommended)
CREATE TABLE IF NOT EXISTS career_opportunity_log (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    job_id INT UNSIGNED NOT NULL,
    action ENUM('created', 'updated', 'activated', 'deactivated', 'deleted') NOT NULL,
    changed_fields JSON, -- Store what fields were changed
    changed_by INT UNSIGNED NULL,
    notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (job_id) REFERENCES career_opportunities(id) ON DELETE CASCADE,
    
    INDEX idx_job_id (job_id),
    INDEX idx_action (action),
    INDEX idx_changed_by (changed_by),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
