# Menu Management System

This document provides a comprehensive guide to understanding and implementing the menu management system in the IB Dashboard application.

## 🎯 **Overview**

The menu management system provides a hierarchical, role-based navigation structure that allows different user types to access different parts of the application based on their permissions.

### **Key Concepts**
- **Hierarchical Structure**: 3-level menu system (Parent → Children → Grandchildren)
- **Role-Based Access**: Different user types see different menus
- **Dynamic Rendering**: Menus are rendered based on user permissions
- **Database-Driven**: Menu structure stored in database with API management

## 🏗️ **System Architecture**

### **1. Database Structure**

#### **Menus Table**
```sql
CREATE TABLE `menus` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `parent_id` int unsigned DEFAULT NULL,
  `sort_order` tinyint unsigned NOT NULL DEFAULT '1',
  `level` tinyint unsigned NOT NULL DEFAULT '0',
  `badge` varchar(50) DEFAULT NULL,
  `status` tinyint unsigned NOT NULL DEFAULT '1',
  `created_by` int unsigned NOT NULL,
  `updated_by` int unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `menus_slug_unique` (`slug`),
  UNIQUE KEY `menus_name_parent_unique` (`name`,`parent_id`),
  CONSTRAINT `menus_parent_id_foreign` FOREIGN KEY (`parent_id`) REFERENCES `menus` (`id`) ON DELETE CASCADE
);
```

#### **Menu Permissions Table**
```sql
CREATE TABLE `menu_permissions` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `user_type_id` smallint unsigned NOT NULL,
  `menu_id` int unsigned NOT NULL,
  `access` tinyint unsigned NOT NULL DEFAULT '1',
  `created_by` int unsigned NOT NULL,
  `updated_by` int unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `menu_permissions_user_type_menu_unique` (`user_type_id`, `menu_id`),
  CONSTRAINT `menu_permissions_user_type_id_foreign` FOREIGN KEY (`user_type_id`) REFERENCES `user_types` (`id`) ON DELETE CASCADE,
  CONSTRAINT `menu_permissions_menu_id_foreign` FOREIGN KEY (`menu_id`) REFERENCES `menus` (`id`) ON DELETE CASCADE
);
```

### **2. Frontend Configuration**

#### **Menu Configuration File**
**Location**: `src/config/menuConfig.ts`

This file contains all possible menu items with their hierarchical structure:

```typescript
export const ALL_MENU_ITEMS: MenuItem[] = [
  {
    id: 'dashboard',
    name: 'Dashboard',
    icon: LayoutDashboard,
    href: '/',
  },
  {
    id: 'transit-plan',
    name: 'Transit Plan',
    icon: Truck,
    children: [
      {
        id: 'master-plan',
        name: 'Master Plan',
        icon: MapPin,
        children: [
          {
            id: 'create-transit-master-plan',
            name: 'Create Transit Master Plan',
            icon: MapPin,
            href: '/transit-plan/master-plan/create',
          },
          {
            id: 'master-plan-listing',
            name: 'Master Plan Listing',
            icon: FileText,
            href: '/transit-plan/master-plan/listing',
          },
        ],
      },
      // ... more children
    ],
  },
  // ... more menus
];
```

### **3. API Service**

#### **Menu Management API**
**Location**: `src/services/menuManagementApi.ts`

```typescript
export class MenuManagementApiService {
  // Get all menus
  static async getMenus(): Promise<ApiResponse<{ menus: Menu[] }>> {
    return apiService.get('/menus');
  }

  // Create new menu
  static async createMenu(data: CreateMenuRequest): Promise<ApiResponse<Menu>> {
    return apiService.post('/menus', data);
  }

  // Update menu
  static async updateMenu(id: number, data: UpdateMenuRequest): Promise<ApiResponse<Menu>> {
    return apiService.put(`/menus/${id}`, data);
  }

  // Delete menu
  static async deleteMenu(id: number): Promise<ApiResponse<unknown>> {
    return apiService.delete(`/menus/${id}`);
  }

  // Get menu permissions
  static async getMenuPermissions(menuId: number): Promise<ApiResponse<MenuPermissionData>> {
    return apiService.get(`/menus/${menuId}/permissions`);
  }

  // Update menu permissions
  static async updateMenuPermissions(menuId: number, permissions: MenuPermissionUpdate[]): Promise<ApiResponse<unknown>> {
    return apiService.put(`/menus/${menuId}/permissions`, { permissions });
  }
}
```

## 📝 **Menu Creation Process**

### **1. Understanding Menu Hierarchy**

The system supports 3 levels of menu hierarchy:

- **Level 0**: Root menus (parent_id = null)
- **Level 1**: Child menus (parent_id = root menu ID)
- **Level 2**: Grandchild menus (parent_id = child menu ID)

### **2. Menu Creation Payload Structure**

#### **Single Menu Creation**
```typescript
const singleMenuPayload = {
  name: "Dashboard",
  slug: "dashboard",
  parent_id: null,        // Root menu
  sort_order: 1,
  level: 0,               // 0=root, 1=child, 2=grandchild
  badge: null,
  status: 1              // 1=Active, 0=Inactive
};
```

#### **Hierarchical Menu Creation (Parent + Children + Grandchildren)**
```typescript
const hierarchicalPayload = {
  parent: {
    name: "Transit Plan",
    slug: "transit-plan",
    parent_id: null,
    sort_order: 6,
    level: 0,
    badge: null,
    status: 1
  },
  children: [
    {
      name: "Master Plan",
      slug: "master-plan",
      parent_id: null,    // Will be set to parent's ID after creation
      sort_order: 1,
      level: 1,
      badge: null,
      status: 1,
      grandchildren: [
        {
          name: "Create Transit Master Plan",
          slug: "create-transit-master-plan",
          parent_id: null,    // Will be set to child's ID after creation
          sort_order: 1,
          level: 2,
          badge: null,
          status: 1
        },
        {
          name: "Master Plan Listing",
          slug: "master-plan-listing",
          parent_id: null,    // Will be set to child's ID after creation
          sort_order: 2,
          level: 2,
          badge: null,
          status: 1
        }
      ]
    },
    {
      name: "Sent Inventory",
      slug: "sent-inventory",
      parent_id: null,    // Will be set to parent's ID after creation
      sort_order: 2,
      level: 1,
      badge: null,
      status: 1,
      grandchildren: [
        {
          name: "Sent Transit Plan",
          slug: "sent-transit-plan",
          parent_id: null,    // Will be set to child's ID after creation
          sort_order: 1,
          level: 2,
          badge: null,
          status: 1
        },
        {
          name: "Sent Inventory Listing",
          slug: "sent-inventory-listing",
          parent_id: null,    // Will be set to child's ID after creation
          sort_order: 2,
          level: 2,
          badge: null,
          status: 1
        }
      ]
    }
  ]
};
```

### **3. API Request Flow for Hierarchical Creation**

```typescript
const createHierarchicalMenus = async (hierarchyData) => {
  // Step 1: Create parent menu
  const parentResponse = await MenuManagementApiService.createMenu({
    name: hierarchyData.parent.name,
    slug: hierarchyData.parent.slug,
    parent_id: null,
    sort_order: hierarchyData.parent.sort_order,
    level: 0,
    badge: hierarchyData.parent.badge,
    status: hierarchyData.parent.status
  });
  
  const parentId = parentResponse.data.id;
  
  // Step 2: Create children menus
  for (const child of hierarchyData.children) {
    const childResponse = await MenuManagementApiService.createMenu({
      name: child.name,
      slug: child.slug,
      parent_id: parentId,  // Link to parent
      sort_order: child.sort_order,
      level: 1,
      badge: child.badge,
      status: child.status
    });
    
    const childId = childResponse.data.id;
    
    // Step 3: Create grandchildren menus
    if (child.grandchildren) {
      for (const grandchild of child.grandchildren) {
        await MenuManagementApiService.createMenu({
          name: grandchild.name,
          slug: grandchild.slug,
          parent_id: childId,  // Link to child
          sort_order: grandchild.sort_order,
          level: 2,
          badge: grandchild.badge,
          status: grandchild.status
        });
      }
    }
  }
};
```

## 🔧 **Implementation Details**

### **1. Frontend Menu Rendering**

#### **Sidebar Component**
**Location**: `src/components/Sidebar.tsx`

The sidebar uses the `useUserMenus` hook to get user-specific menu permissions and renders the hierarchical menu structure.

```typescript
const { userMenus, loading } = useUserMenus();

// Renders menus based on user permissions
const renderMenuItems = (menus: MenuItem[], level = 0) => {
  return menus.map(menu => (
    <div key={menu.id}>
      <MenuItemComponent menu={menu} level={level} />
      {menu.children && renderMenuItems(menu.children, level + 1)}
    </div>
  ));
};
```

#### **User Menus Hook**
**Location**: `src/hooks/useUserMenus.ts`

This hook fetches user-specific menu permissions and filters the menu configuration based on user access.

### **2. Menu Management Interface**

#### **Menu Management Page**
**Location**: `src/pages/MenuManagement.tsx`

Provides an admin interface for:
- Viewing all menus in hierarchical structure
- Managing menu permissions for different user types
- Creating new menus (placeholder - needs implementation)

### **3. Permission Management**

#### **Permission Update Flow**
```typescript
const handlePermissionChange = (menuId: number, userTypeId: number, access: boolean) => {
  // Update local state
  setPermissionData(prev => ({
    ...prev,
    menu: updateMenuPermissions(prev.menu, menuId, userTypeId, access)
  }));
  
  // Call API to update permissions
  MenuManagementApiService.updateMenuPermissions(menuId, [
    { user_type_id: userTypeId, access: access ? 1 : 0 }
  ]);
};
```

## 🎨 **Design Patterns**

### **1. Hierarchical Data Structure**
- **Parent-Child Relationships**: Uses `parent_id` foreign key
- **Level Tracking**: `level` field for easy querying
- **Sort Order**: `sort_order` for consistent display

### **2. Permission-Based Rendering**
- **User Type Filtering**: Menus filtered based on user type permissions
- **Dynamic Loading**: Menus loaded based on user authentication
- **Caching**: Menu permissions cached in Redux state

### **3. API Design**
- **RESTful Endpoints**: Standard CRUD operations
- **Hierarchical Responses**: API returns nested menu structure
- **Permission Integration**: Permissions included in menu responses

## 🚀 **Current Implementation Status**

### **✅ Completed**
- Database schema with hierarchical structure
- Frontend menu configuration (`menuConfig.ts`)
- API service with CRUD operations
- Menu management page with permission controls
- Sidebar rendering with user-specific menus
- Permission management system

### **❌ Missing/Needs Implementation**
- **Menu Creation Form**: `handleCreateMenu` is placeholder
- **Bulk Menu Creation**: No interface for creating hierarchical menus
- **Menu Editing**: Update functionality needs UI
- **Menu Deletion**: Delete functionality needs UI

## 🔍 **Troubleshooting**

### **1. Menu Not Appearing in Sidebar**
**Problem**: Menu exists in config but doesn't show in sidebar
**Debug Steps**:
1. Check if menu has proper permissions set
2. Verify user type has access to the menu
3. Check if menu status is active (status = 1)
4. Verify menu is in the correct hierarchy level

**Solution**: Ensure menu permissions are properly configured for the user type

### **2. Permission Changes Not Reflecting**
**Problem**: Permission updates don't show immediately
**Debug Steps**:
1. Check API response for permission update
2. Verify Redux state is updated
3. Check if sidebar is re-rendering
4. Look for console errors

**Solution**: Ensure `refreshPermissions()` is called after permission updates

### **3. Hierarchical Menu Creation Fails**
**Problem**: Creating parent-child-grandchild menus fails
**Debug Steps**:
1. Check if parent menu was created successfully
2. Verify parent_id is correctly set for children
3. Check for unique constraint violations (slug, name+parent_id)
4. Verify sort_order doesn't conflict

**Solution**: Ensure proper sequencing of menu creation and correct parent_id assignment

### **4. Menu Configuration Not Loading**
**Problem**: MenuConfig.ts changes don't reflect
**Debug Steps**:
1. Check if file is properly imported
2. Verify ALL_MENU_ITEMS export
3. Check for TypeScript errors
4. Verify menu IDs are unique

**Solution**: Ensure proper imports and unique menu IDs

## 📚 **Best Practices**

### **1. Menu Naming Conventions**
- **Slugs**: Use kebab-case (e.g., `transit-plan`, `master-plan`)
- **Names**: Use Title Case (e.g., "Transit Plan", "Master Plan")
- **IDs**: Use kebab-case matching slugs (e.g., `transit-plan`, `master-plan`)

### **2. Icon Selection**
- **Consistent Theme**: Use Lucide React icons
- **Meaningful Icons**: Choose icons that represent the menu function
- **Hierarchy Indication**: Use different icons for different levels

### **3. URL Structure**
- **Hierarchical URLs**: Match menu hierarchy (e.g., `/transit-plan/master-plan/create`)
- **Consistent Patterns**: Use consistent URL patterns
- **SEO Friendly**: Use descriptive, readable URLs

### **4. Permission Management**
- **Principle of Least Privilege**: Give minimum required access
- **Role-Based**: Use user types for permission groups
- **Inheritance**: Consider parent-child permission inheritance

## 🔮 **Future Enhancements**

### **1. Planned Features**
- **Menu Creation Form**: Complete UI for creating menus
- **Drag & Drop**: Reorder menus with drag and drop
- **Menu Templates**: Predefined menu structures
- **Bulk Operations**: Create multiple menus at once

### **2. Advanced Features**
- **Menu Analytics**: Track menu usage
- **Dynamic Menus**: Context-aware menu items
- **Menu Search**: Search within menu structure
- **Menu Export/Import**: Backup and restore menu configurations

---

**Next**: [Development Guidelines](./10-Development-Guidelines.md) - Best practices and patterns for development
