-- Menu Tables for IB Dashboard
-- Following the same structure as user_types and admins tables

-- Main menu items table
CREATE TABLE `menus` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `slug` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `parent_id` int unsigned DEFAULT NULL COMMENT 'Parent menu ID for hierarchical structure',
  `sort_order` tinyint unsigned NOT NULL DEFAULT '1' COMMENT 'Display order within same level',
  `level` tinyint unsigned NOT NULL DEFAULT '0' COMMENT 'Menu hierarchy level (0=root, 1=child, 2=grandchild)',
  `badge` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL COMMENT 'Optional badge text',
  `status` tinyint unsigned NOT NULL DEFAULT '1' COMMENT '1 : Active, 0 : Inactive',
  `created_by` int unsigned NOT NULL,
  `updated_by` int unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `menus_slug_unique` (`slug`),
  UNIQUE KEY `menus_name_parent_unique` (`name`, `parent_id`),
  KEY `menus_parent_id_index` (`parent_id`),
  KEY `menus_level_index` (`level`),
  KEY `menus_status_index` (`status`),
  KEY `menus_sort_order_index` (`sort_order`),
  CONSTRAINT `menus_parent_id_foreign` FOREIGN KEY (`parent_id`) REFERENCES `menus` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

-- Menu permissions table (links user_types to menus)
CREATE TABLE `menu_permissions` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `user_type_id` smallint unsigned NOT NULL,
  `menu_id` int unsigned NOT NULL,
  `access` tinyint unsigned NOT NULL DEFAULT '1' COMMENT '1 : Allow Access, 0 : Deny Access',
  `created_by` int unsigned NOT NULL,
  `updated_by` int unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `menu_permissions_user_type_menu_unique` (`user_type_id`, `menu_id`),
  KEY `menu_permissions_user_type_id_index` (`user_type_id`),
  KEY `menu_permissions_menu_id_index` (`menu_id`),
  KEY `menu_permissions_access_index` (`access`),
  CONSTRAINT `menu_permissions_user_type_id_foreign` FOREIGN KEY (`user_type_id`) REFERENCES `user_types` (`id`) ON DELETE CASCADE,
  CONSTRAINT `menu_permissions_menu_id_foreign` FOREIGN KEY (`menu_id`) REFERENCES `menus` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

-- Insert sample menu data
INSERT INTO `menus` (`name`, `slug`, `parent_id`, `sort_order`, `level`, `status`, `created_by`, `updated_by`, `created_at`, `updated_at`) VALUES
('Dashboard', 'dashboard', NULL, 1, 0, 1, 1, 1, NOW(), NOW()),
('Menu Management', 'menu-management', NULL, 2, 0, 1, 1, 1, NOW(), NOW()),
('Ops Admin', 'ops-admin', NULL, 3, 0, 1, 1, 1, NOW(), NOW()),
('Clients', 'clients', 3, 1, 1, 1, 1, 1, NOW(), NOW()),
('Add Client', 'clients-add', 4, 1, 2, 1, 1, 1, NOW(), NOW()),
('Manage Clients', 'clients-manage', 4, 2, 2, 1, 1, 1, NOW(), NOW()),
('Disable Clients', 'clients-disable', 4, 3, 2, 1, 1, 1, NOW(), NOW()),
('Analytics', 'analytics', NULL, 4, 0, 1, 1, 1, NOW(), NOW()),
('Revenue Analytics', 'analytics-revenue', 8, 1, 1, 1, 1, 1, NOW(), NOW()),
('Trend Analytics', 'analytics-trends', 8, 2, 1, 1, 1, 1, NOW(), NOW()),
('User Analytics', 'analytics-users', 8, 3, 1, 1, 1, 1, NOW(), NOW()),
('System Analytics', 'analytics-system', 8, 4, 1, 1, 1, 1, NOW(), NOW()),
('Settings', 'settings', NULL, 5, 0, 1, 1, 1, NOW(), NOW()),
('General Settings', 'settings-general', 13, 1, 1, 1, 1, 1, NOW(), NOW()),
('Security Settings', 'settings-security', 13, 2, 1, 1, 1, 1, NOW(), NOW()),
('Integration Settings', 'settings-integration', 13, 3, 1, 1, 1, 1, NOW(), NOW());

-- Insert sample permissions for City Head (user_type_id = 1)
INSERT INTO `menu_permissions` (`user_type_id`, `menu_id`, `access`, `created_by`, `updated_by`, `created_at`, `updated_at`) VALUES
-- Dashboard - always accessible
(1, 1, 1, 1, 1, NOW(), NOW()),
-- Menu Management - City Head has access
(1, 2, 1, 1, 1, NOW(), NOW()),
-- Ops Admin - full access
(1, 3, 1, 1, 1, NOW(), NOW()),
(1, 4, 1, 1, 1, NOW(), NOW()),
(1, 5, 1, 1, 1, NOW(), NOW()),
(1, 6, 1, 1, 1, NOW(), NOW()),
(1, 7, 1, 1, 1, NOW(), NOW()),
-- Analytics - full access
(1, 8, 1, 1, 1, NOW(), NOW()),
(1, 9, 1, 1, 1, NOW(), NOW()),
(1, 10, 1, 1, 1, NOW(), NOW()),
(1, 11, 1, 1, 1, NOW(), NOW()),
(1, 12, 1, 1, 1, NOW(), NOW()),
-- Settings - full access
(1, 13, 1, 1, 1, NOW(), NOW()),
(1, 14, 1, 1, 1, NOW(), NOW()),
(1, 15, 1, 1, 1, NOW(), NOW()),
(1, 16, 1, 1, 1, NOW(), NOW());

-- Insert permissions for user_type_id = 17
INSERT INTO `menu_permissions` (`user_type_id`, `menu_id`, `access`, `created_by`, `updated_by`, `created_at`, `updated_at`) VALUES
-- Dashboard - always accessible
(17, 1, 1, 1, 1, NOW(), NOW()),
-- Menu Management - user_type_id 17 has access
(17, 2, 1, 1, 1, NOW(), NOW()),
-- Ops Admin - user_type_id 17 has limited access (only Dashboard and Clients)
(17, 3, 0, 1, 1, NOW(), NOW()),
(17, 4, 1, 1, 1, NOW(), NOW()),
(17, 5, 1, 1, 1, NOW(), NOW()),
(17, 6, 1, 1, 1, NOW(), NOW()),
(17, 7, 0, 1, 1, NOW(), NOW()),
-- Analytics - user_type_id 17 has no access
(17, 8, 0, 1, 1, NOW(), NOW()),
(17, 9, 0, 1, 1, NOW(), NOW()),
(17, 10, 0, 1, 1, NOW(), NOW()),
(17, 11, 0, 1, 1, NOW(), NOW()),
(17, 12, 0, 1, 1, NOW(), NOW()),
-- Settings - user_type_id 17 has no access
(17, 13, 0, 1, 1, NOW(), NOW()),
(17, 14, 0, 1, 1, NOW(), NOW()),
(17, 15, 0, 1, 1, NOW(), NOW()),
(17, 16, 0, 1, 1, NOW(), NOW());
