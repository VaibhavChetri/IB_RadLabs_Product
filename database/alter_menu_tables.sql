-- ALTER commands to add duplicate prevention constraints
-- Run these if tables already exist

-- Add unique constraint for menu names within same parent
ALTER TABLE `menus` 
ADD CONSTRAINT `menus_name_parent_unique` UNIQUE (`name`, `parent_id`);

-- Note: menu_permissions_user_type_menu_unique constraint already exists
-- Skip this ALTER if you get "Duplicate key name" error:
-- ALTER TABLE `menu_permissions`
-- ADD CONSTRAINT `menu_permissions_user_type_menu_unique` UNIQUE (`user_type_id`, `menu_id`);

-- Note: menus_slug_unique constraint is already defined in the original CREATE TABLE statement
-- If it doesn't exist, add it:

-- Add unique constraint for menu slugs (if not already exists)
-- ALTER TABLE `menus` 
-- ADD CONSTRAINT `menus_slug_unique` UNIQUE (`slug`);
