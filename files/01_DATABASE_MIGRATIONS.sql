-- ============================================================================
-- LEAD TRACKING SYSTEM - DATABASE MIGRATIONS
-- ============================================================================
-- Purpose: Add lead tracking functionality to existing Lusha integration
-- Database: smartbin
-- Created: 2026-01-25
-- ============================================================================

-- IMPORTANT: Backup database before executing!
-- Command: mysqldump -u username -p smartbin > smartbin_backup_20260125.sql

-- ============================================================================
-- STEP 1: ALTER EXISTING TABLE - lusha_contacts
-- ============================================================================
-- Add tracking columns to existing contact table

ALTER TABLE `lusha_contacts` 
ADD COLUMN `is_tracking` tinyint(1) DEFAULT 0 
  COMMENT 'Whether this contact is being actively tracked' 
  AFTER `has_phone`,
ADD COLUMN `tracking_started_at` timestamp NULL DEFAULT NULL 
  COMMENT 'When tracking was started' 
  AFTER `is_tracking`,
ADD COLUMN `tracking_started_by` int unsigned DEFAULT NULL 
  COMMENT 'Admin ID who started tracking' 
  AFTER `tracking_started_at`,
ADD INDEX `idx_is_tracking` (`is_tracking`),
ADD INDEX `idx_tracking_started` (`tracking_started_at`);

-- Verification Query:
-- SHOW COLUMNS FROM lusha_contacts LIKE '%tracking%';
-- Expected: 3 new columns (is_tracking, tracking_started_at, tracking_started_by)

-- ============================================================================
-- STEP 2: CREATE TABLE - lead_outreach_status
-- ============================================================================
-- Master table for outreach status dropdown values

DROP TABLE IF EXISTS `lead_outreach_status`;

CREATE TABLE `lead_outreach_status` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `status_name` varchar(100) NOT NULL 
    COMMENT 'Display name of the status',
  `status_category` enum('pending', 'positive', 'negative', 'follow_up', 'converted') NOT NULL 
    COMMENT 'Category for reporting/filtering',
  `requires_callback` tinyint(1) DEFAULT 0 
    COMMENT 'If 1, user must set callback_scheduled_at when using this status',
  `status_color` varchar(7) DEFAULT '#6B7280' 
    COMMENT 'Hex color code for UI badges',
  `status_order` int DEFAULT 0 
    COMMENT 'Display order in dropdowns',
  `is_active` tinyint(1) DEFAULT 1 
    COMMENT 'Active statuses shown in dropdown',
  `is_system` tinyint(1) DEFAULT 0 
    COMMENT 'System statuses cannot be deleted by users',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_status_name` (`status_name`),
  KEY `idx_active` (`is_active`),
  KEY `idx_order` (`status_order`),
  KEY `idx_category` (`status_category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Master table for lead outreach status values';

-- Verification Query:
-- SELECT COUNT(*) FROM lead_outreach_status;
-- Expected: 0 (will be populated in Step 3)

-- ============================================================================
-- STEP 3: SEED DEFAULT STATUSES
-- ============================================================================
-- Insert 16 default status values

INSERT INTO `lead_outreach_status` 
  (`status_name`, `status_category`, `requires_callback`, `status_color`, `status_order`, `is_system`) 
VALUES
  -- Pending/Initial States (Gray/Yellow)
  ('Not Contacted Yet', 'pending', 0, '#9CA3AF', 1, 1),
  ('Email Sent - No Response', 'pending', 0, '#FCD34D', 2, 1),
  ('Called - No Answer', 'pending', 0, '#FCD34D', 3, 1),
  ('Voicemail Left', 'pending', 0, '#FCD34D', 4, 1),
  
  -- Follow-up Required (Blue) - These require callback scheduling
  ('Call Later', 'follow_up', 1, '#60A5FA', 5, 1),
  ('Schedule Meeting', 'follow_up', 1, '#60A5FA', 6, 1),
  
  -- Positive Progress (Green)
  ('Meeting Scheduled', 'positive', 0, '#34D399', 7, 1),
  ('Interested - Follow Up', 'positive', 0, '#34D399', 8, 1),
  ('Proposal Sent', 'positive', 0, '#34D399', 9, 1),
  ('Negotiating', 'positive', 0, '#34D399', 10, 1),
  
  -- Negative/Dead Ends (Red)
  ('Wrong Number', 'negative', 0, '#F87171', 11, 1),
  ('Email Bounced', 'negative', 0, '#F87171', 12, 1),
  ('Not Interested', 'negative', 0, '#F87171', 13, 1),
  ('Already Using Competitor', 'negative', 0, '#F87171', 14, 1),
  
  -- Final States (Green/Red)
  ('Converted to Customer', 'converted', 0, '#10B981', 15, 1),
  ('Lost Deal', 'negative', 0, '#EF4444', 16, 1);

-- Verification Query:
-- SELECT id, status_name, status_category, requires_callback, status_color 
-- FROM lead_outreach_status ORDER BY status_order;
-- Expected: 16 rows

-- ============================================================================
-- STEP 4: CREATE TABLE - lead_outreach_log
-- ============================================================================
-- Logs every outreach attempt (email, phone call, etc.)

DROP TABLE IF EXISTS `lead_outreach_log`;

CREATE TABLE `lead_outreach_log` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `contact_id` varchar(255) NOT NULL 
    COMMENT 'FK to lusha_contacts.contact_id',
  `outreach_type` enum('email', 'phone', 'both', 'meeting', 'other') NOT NULL 
    COMMENT 'Communication channel used',
  `outreach_date` timestamp DEFAULT CURRENT_TIMESTAMP 
    COMMENT 'When the outreach happened',
  `status_id` int unsigned NOT NULL 
    COMMENT 'FK to lead_outreach_status.id',
  `notes` text 
    COMMENT 'User notes about the interaction',
  `callback_scheduled_at` timestamp NULL DEFAULT NULL 
    COMMENT 'When to follow up (if status requires callback)',
  `callback_completed` tinyint(1) DEFAULT 0 
    COMMENT 'Whether scheduled callback was completed',
  `performed_by` int unsigned NOT NULL 
    COMMENT 'FK to admins.id - who did the outreach',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_contact_id` (`contact_id`),
  KEY `idx_outreach_date` (`outreach_date`),
  KEY `idx_status` (`status_id`),
  KEY `idx_callback_scheduled` (`callback_scheduled_at`),
  KEY `idx_callback_pending` (`callback_completed`, `callback_scheduled_at`),
  KEY `idx_performed_by` (`performed_by`),
  KEY `idx_todays_callbacks` (`callback_scheduled_at`, `callback_completed`, `status_id`),
  CONSTRAINT `fk_outreach_contact` 
    FOREIGN KEY (`contact_id`) 
    REFERENCES `lusha_contacts` (`contact_id`) 
    ON DELETE CASCADE,
  CONSTRAINT `fk_outreach_status` 
    FOREIGN KEY (`status_id`) 
    REFERENCES `lead_outreach_status` (`id`),
  CONSTRAINT `fk_outreach_performer` 
    FOREIGN KEY (`performed_by`) 
    REFERENCES `admins` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Logs every outreach attempt to tracked leads';

-- Verification Query:
-- SHOW CREATE TABLE lead_outreach_log;
-- Expected: Table created with 3 foreign keys

-- ============================================================================
-- STEP 5: CREATE TABLE - lead_tracking_summary
-- ============================================================================
-- Denormalized summary for fast queries (current state of each tracked lead)

DROP TABLE IF EXISTS `lead_tracking_summary`;

CREATE TABLE `lead_tracking_summary` (
  `contact_id` varchar(255) NOT NULL 
    COMMENT 'FK to lusha_contacts.contact_id',
  `company_id` varchar(255) DEFAULT NULL 
    COMMENT 'FK to lusha_companies.company_id (optional)',
  `tracking_started_at` timestamp NULL DEFAULT NULL 
    COMMENT 'When tracking began',
  `last_outreach_date` timestamp NULL DEFAULT NULL 
    COMMENT 'Most recent outreach attempt',
  `last_outreach_type` enum('email', 'phone', 'both', 'meeting', 'other') DEFAULT NULL 
    COMMENT 'Most recent outreach channel',
  `current_status_id` int unsigned DEFAULT NULL 
    COMMENT 'FK to lead_outreach_status.id - current status',
  `total_outreach_count` int DEFAULT 0 
    COMMENT 'Total number of outreach attempts',
  `email_count` int DEFAULT 0 
    COMMENT 'Number of email outreach attempts',
  `phone_count` int DEFAULT 0 
    COMMENT 'Number of phone call attempts',
  `meeting_count` int DEFAULT 0 
    COMMENT 'Number of meetings held',
  `next_callback_at` timestamp NULL DEFAULT NULL 
    COMMENT 'Next scheduled callback (from latest outreach log)',
  `assigned_to` int unsigned DEFAULT NULL 
    COMMENT 'FK to admins.id - current owner of this lead',
  `is_active` tinyint(1) DEFAULT 1 
    COMMENT 'Whether still actively tracking (0 = stopped tracking)',
  `lead_score` int DEFAULT 0 
    COMMENT 'Optional: calculated lead score for prioritization',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`contact_id`),
  KEY `idx_company` (`company_id`),
  KEY `idx_status` (`current_status_id`),
  KEY `idx_next_callback` (`next_callback_at`),
  KEY `idx_assigned` (`assigned_to`),
  KEY `idx_active` (`is_active`),
  KEY `idx_last_outreach` (`last_outreach_date`),
  KEY `idx_active_assigned` (`is_active`, `assigned_to`),
  CONSTRAINT `fk_summary_contact` 
    FOREIGN KEY (`contact_id`) 
    REFERENCES `lusha_contacts` (`contact_id`) 
    ON DELETE CASCADE,
  CONSTRAINT `fk_summary_company` 
    FOREIGN KEY (`company_id`) 
    REFERENCES `lusha_companies` (`company_id`) 
    ON DELETE SET NULL,
  CONSTRAINT `fk_summary_status` 
    FOREIGN KEY (`current_status_id`) 
    REFERENCES `lead_outreach_status` (`id`),
  CONSTRAINT `fk_summary_assigned` 
    FOREIGN KEY (`assigned_to`) 
    REFERENCES `admins` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Denormalized summary of tracking status for fast queries';

-- Verification Query:
-- SHOW CREATE TABLE lead_tracking_summary;
-- Expected: Table created with 4 foreign keys

-- ============================================================================
-- VERIFICATION CHECKLIST
-- ============================================================================
-- Run these queries to verify everything is set up correctly

-- 1. Check lusha_contacts was altered
SELECT COUNT(*) as tracking_columns_added
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'smartbin' 
  AND TABLE_NAME = 'lusha_contacts' 
  AND COLUMN_NAME IN ('is_tracking', 'tracking_started_at', 'tracking_started_by');
-- Expected: 3

-- 2. Check new tables exist
SELECT TABLE_NAME 
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = 'smartbin' 
  AND TABLE_NAME LIKE 'lead_%'
ORDER BY TABLE_NAME;
-- Expected: 3 tables (lead_outreach_log, lead_outreach_status, lead_tracking_summary)

-- 3. Check statuses were seeded
SELECT 
  COUNT(*) as total_statuses,
  SUM(CASE WHEN is_system = 1 THEN 1 ELSE 0 END) as system_statuses,
  SUM(CASE WHEN requires_callback = 1 THEN 1 ELSE 0 END) as callback_required_statuses
FROM lead_outreach_status;
-- Expected: total_statuses = 16, system_statuses = 16, callback_required_statuses = 2

-- 4. Check foreign keys are valid
SELECT 
  TABLE_NAME,
  CONSTRAINT_NAME,
  REFERENCED_TABLE_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'smartbin'
  AND TABLE_NAME IN ('lead_outreach_log', 'lead_tracking_summary')
  AND REFERENCED_TABLE_NAME IS NOT NULL
ORDER BY TABLE_NAME, CONSTRAINT_NAME;
-- Expected: 7 foreign key relationships

-- 5. Check indexes were created
SELECT 
  TABLE_NAME,
  INDEX_NAME,
  GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) as columns
FROM INFORMATION_SCHEMA.STATISTICS
WHERE TABLE_SCHEMA = 'smartbin'
  AND TABLE_NAME IN ('lusha_contacts', 'lead_outreach_log', 'lead_tracking_summary', 'lead_outreach_status')
  AND INDEX_NAME LIKE 'idx_%'
GROUP BY TABLE_NAME, INDEX_NAME
ORDER BY TABLE_NAME, INDEX_NAME;
-- Expected: Multiple indexes per table

-- ============================================================================
-- ROLLBACK SCRIPT (Use if you need to undo changes)
-- ============================================================================
-- CAUTION: This will delete all tracking data!

/*
-- Drop new tables
DROP TABLE IF EXISTS `lead_tracking_summary`;
DROP TABLE IF EXISTS `lead_outreach_log`;
DROP TABLE IF EXISTS `lead_outreach_status`;

-- Remove columns from lusha_contacts
ALTER TABLE `lusha_contacts`
DROP COLUMN `is_tracking`,
DROP COLUMN `tracking_started_at`,
DROP COLUMN `tracking_started_by`,
DROP INDEX `idx_is_tracking`,
DROP INDEX `idx_tracking_started`;
*/

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- ✅ Next Step: Proceed to 02_BACKEND_APIS.md
-- ============================================================================
