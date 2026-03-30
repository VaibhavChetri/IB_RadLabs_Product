import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Eye, EyeOff, Settings, ChevronRight, ChevronDown, X, Pencil, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { MenuManagementApiService, Menu } from '../services/menuManagementApi';
import { useUserMenus } from '../hooks/useUserMenus';
import { MenuApiService } from '../services/menuApi';
import { CreateMenuHierarchyModal, CreateMenuHierarchyPayload } from './MenuManagement/CreateMenuHierarchyModal';
import { EditMenuModal } from './MenuManagement/EditMenuModal';

export const MenuManagement: React.FC = () => {
	const { refreshPermissions } = useUserMenus();
	const [menus, setMenus] = useState<Menu[]>([]);
	const [selectedMenu, setSelectedMenu] = useState<Menu | null>(null);
	const [showPermissionModal, setShowPermissionModal] = useState(false);
	const [expandedMenus, setExpandedMenus] = useState<Set<number>>(new Set());
	const [permissionData, setPermissionData] = useState<any>(null);
	const [permissionLoading, setPermissionLoading] = useState(false);

	const [loading, setLoading] = useState(false);
	const [showCreateMenuModal, setShowCreateMenuModal] = useState(false);
	const [createMenuLoading, setCreateMenuLoading] = useState(false);
	const [menuActionMessage, setMenuActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

	// Edit menu state
	const [showEditMenuModal, setShowEditMenuModal] = useState(false);
	const [editingMenu, setEditingMenu] = useState<Menu | null>(null);
	const [editMenuLoading, setEditMenuLoading] = useState(false);

	// API hooks

	const buildMenuHierarchy = (flatMenus: Menu[]): Menu[] => {
		return flatMenus.filter(menu => menu.parent_id === null);
	};

	const loadMenus = useCallback(async () => {
		setLoading(true);
		try {
			const response = await MenuManagementApiService.getMenus();
			if (response.status_code === 200) {
				const hierarchicalMenus = buildMenuHierarchy(response.data.menus);
				setMenus(hierarchicalMenus);
			}
		} catch (error) {
			console.error('Failed to load menus:', error);
		} finally {
			setLoading(false);
		}
	}, []);

	const toggleExpanded = (menuId: number) => {
		setExpandedMenus(prev => {
			const newSet = new Set(prev);
			if (newSet.has(menuId)) {
				newSet.delete(menuId);
			} else {
				newSet.add(menuId);
			}
			return newSet;
		});
	};

	const handleCreateMenu = () => {
		setMenuActionMessage(null);
		setShowCreateMenuModal(true);
	};

	const refreshUserMenuPermissionsFromApi = useCallback(async () => {
		const permissionResponse = await MenuApiService.getUserMenuPermissions();
		const freshPermissions = permissionResponse.data?.menu_permissions || {};
		await refreshPermissions(freshPermissions);
		const TokenManager = (await import('../utils/tokenManager')).default;
		TokenManager.setMenuPermissions(freshPermissions);
	}, [refreshPermissions]);

	const withRetry = useCallback(
		async <T,>(fn: () => Promise<T>, retries: number): Promise<T> => {
			let lastError: unknown = null;
			for (let attempt = 0; attempt < retries; attempt++) {
				try {
					return await fn();
				} catch (error) {
					lastError = error;
				}
			}
			throw lastError;
		},
		[]
	);

	const handleSubmitCreateHierarchy = useCallback(
		async (payload: CreateMenuHierarchyPayload) => {
			setCreateMenuLoading(true);
			setMenuActionMessage(null);

			try {
				const hasNewChildren = payload.children.length > 0;
				const hasExistingChildGrandchildren = payload.existingChildGrandchildren && payload.existingChildGrandchildren.length > 0;

				// Create new children under parent (if any)
				if (hasNewChildren) {
					let payloadToSend = payload;
					if (typeof payload.parent.id === 'number') {
						const parentId = payload.parent.id;
						const menusResponse = await withRetry(() => MenuManagementApiService.getMenus(), 2);
						const flatMenus = menusResponse.data.menus;
						const existingChildSlugs = new Set(
							flatMenus.filter(m => m.parent_id === parentId).map(m => m.slug)
						);
						const childrenToCreate = payload.children.filter(c => !existingChildSlugs.has(c.slug));
						if (childrenToCreate.length > 0) {
							payloadToSend = { ...payload, children: childrenToCreate };
							await withRetry(
								() => MenuManagementApiService.createMenuHierarchy({
									parent: payloadToSend.parent,
									children: payloadToSend.children,
								}),
								2
							);
						}
					} else {
						await withRetry(
							() => MenuManagementApiService.createMenuHierarchy({
								parent: payload.parent,
								children: payload.children,
							}),
							2
						);
					}
				}

				// Add new grandchildren to existing children (separate API call per existing child)
				if (hasExistingChildGrandchildren) {
					for (const entry of payload.existingChildGrandchildren!) {
						await withRetry(
							() => MenuManagementApiService.createMenuHierarchy({
								parent: { id: entry.existingChildId },
								children: entry.grandchildren.map(gc => ({
									...gc,
									parent_id: null,
								})),
							}),
							2
						);
					}
				}

				await refreshUserMenuPermissionsFromApi();
				await loadMenus();

				setShowCreateMenuModal(false);
				setMenuActionMessage({
					type: 'success',
					text: 'Menu hierarchy created successfully.',
				});
			} catch (error: any) {
				setMenuActionMessage({
					type: 'error',
					text: error?.message || 'Failed to create menu hierarchy.',
				});
			} finally {
				setCreateMenuLoading(false);
			}
		},
		[loadMenus, refreshUserMenuPermissionsFromApi, withRetry]
	);

	const handleManagePermissions = async (menu: Menu) => {
		setSelectedMenu(menu);
		setPermissionLoading(true);
		setShowPermissionModal(true);

		try {
			const response = await MenuManagementApiService.getMenuPermissions(menu.id);
			console.log('📡 Raw API response:', response);
			console.log('📡 Response data:', response.data);
			console.log('📡 Response data descendants:', response.data?.descendants);

			if (response.status_code === 200) {
				// The API returns descendants, not children, and they already contain the full hierarchy
				const menuData = response.data.menu;
				const descendantsData = response.data.descendants || [];

				console.log('🔧 Processed menuData:', menuData);
				console.log('🔧 Processed descendantsData:', descendantsData);

				// Since descendants already contain the full hierarchy, we don't need recursive fetching
				const fullMenuData = {
					...menuData,
					children: descendantsData,
				};

				console.log('🎯 Final menu data with all children:', fullMenuData);

				setPermissionData({
					...response.data,
					menu: fullMenuData,
				});
			}
		} catch (error) {
			console.error('Failed to load permissions:', error);
		} finally {
			setPermissionLoading(false);
		}
	};

	const handlePermissionChange = (menuId: number, userTypeId: number, access: boolean) => {
		if (!permissionData) return;

		// Helper function to find if a menu is a parent (has children)
		const hasChildren = (menu: any): boolean => {
			return menu.children && menu.children.length > 0;
		};

		// Helper function to find parent menu ID for a given menu ID
		const findParentMenuId = (
			menu: any,
			targetId: number,
			parentId: number | null = null
		): number | null => {
			if (menu.id === targetId) {
				return parentId;
			}
			if (menu.children) {
				for (const child of menu.children) {
					const found = findParentMenuId(child, targetId, menu.id);
					if (found !== null) {
						return found;
					}
				}
			}
			return null;
		};

		// Helper function to recursively update all descendants
		const cascadeToChildren = (menu: any, userTypeId: number, access: boolean): any => {
			if (!menu.children || menu.children.length === 0) {
				return menu;
			}

			return {
				...menu,
				children: menu.children.map((child: any) => {
					// Update the child's permission
					const updatedChild = {
						...child,
						permissions: child.permissions.map((p: any) =>
							p.user_type_id === userTypeId ? { ...p, access } : p
						),
					};

					// Recursively cascade to grandchildren
					return cascadeToChildren(updatedChild, userTypeId, access);
				}),
			};
		};

		// Helper function to update a specific menu's permission
		const updateMenuPermission = (
			menu: any,
			targetMenuId: number,
			userTypeId: number,
			access: boolean
		): any => {
			if (menu.id === targetMenuId) {
				return {
					...menu,
					permissions: menu.permissions.map((p: any) =>
						p.user_type_id === userTypeId ? { ...p, access } : p
					),
				};
			}

			if (menu.children) {
				return {
					...menu,
					children: menu.children.map((child: any) =>
						updateMenuPermission(child, targetMenuId, userTypeId, access)
					),
				};
			}

			return menu;
		};

		// Helper function to find a menu by ID
		const findMenuById = (menu: any, targetId: number): any => {
			if (menu.id === targetId) {
				return menu;
			}
			if (menu.children) {
				for (const child of menu.children) {
					const found = findMenuById(child, targetId);
					if (found) {
						return found;
					}
				}
			}
			return null;
		};

		const updateMenuPermissions = (menu: any): any => {
			// First, find the parent menu ID if we're enabling a child
			const parentMenuId = access ? findParentMenuId(menu, menuId) : null;

			// Update the target menu's permission
			let updatedMenu = updateMenuPermission(menu, menuId, userTypeId, access);

			// Find the target menu to check if it has children
			const targetMenu = findMenuById(updatedMenu, menuId);

			// If enabling a parent, cascade down to all children and grandchildren
			if (access && targetMenu && hasChildren(targetMenu)) {
				updatedMenu = cascadeToChildren(updatedMenu, userTypeId, true);
			}

			// If enabling a child, also enable the parent automatically
			if (access && parentMenuId !== null) {
				updatedMenu = updateMenuPermission(updatedMenu, parentMenuId, userTypeId, true);
			}

			// If disabling a parent, cascade down to all children
			if (!access && targetMenu && hasChildren(targetMenu)) {
				updatedMenu = cascadeToChildren(updatedMenu, userTypeId, false);
			}

			return updatedMenu;
		};

		setPermissionData((prev: any) => ({
			...prev,
			menu: updateMenuPermissions(prev.menu),
		}));
	};

	const renderMenuPermissions = (menu: any, level: number = 0) => {
		const marginLeft = level * 24; // 24px per level
		const isMainMenu = level === 0;

		return (
			<div
				key={menu.id}
				className={`rounded-lg p-4 border-l-4 ${
					isMainMenu
						? 'bg-gradient-to-r from-primary/5 to-primary/10 border-primary'
						: 'bg-gradient-to-r from-background-secondary/20 to-background-secondary/30 border-background-secondary'
				}`}
				style={{ marginLeft: `${marginLeft}px` }}
			>
				<div className='flex items-center justify-between mb-4'>
					<div className='flex items-center space-x-3'>
						<div
							className={`w-6 h-6 rounded-full flex items-center justify-center ${
								isMainMenu ? 'bg-primary/20' : 'bg-background-secondary'
							}`}
						>
							<span
								className={`font-bold ${
									isMainMenu ? 'text-primary text-sm' : 'text-foreground text-xs'
								}`}
							>
								{menu.level}
							</span>
						</div>
						<div>
							<h6
								className={`font-semibold text-foreground ${
									isMainMenu ? 'text-lg' : level === 1 ? 'text-base' : 'text-sm'
								}`}
							>
								{menu.name}
							</h6>
							<p className={`text-foreground-muted ${isMainMenu ? 'text-sm' : 'text-xs'}`}>
								Level {menu.level} • {menu.slug}
							</p>
						</div>
					</div>
					<div className='flex items-center space-x-2'>
						<span className='text-xs text-foreground-muted'>Toggle All:</span>
						<button
							onClick={() => {
								const allAccess = menu.permissions.every((p: any) => p.access);
								menu.permissions.forEach((p: any) => {
									handlePermissionChange(menu.id, p.user_type_id, !allAccess);
								});
							}}
							className={`px-2 py-1 rounded text-xs transition-colors ${
								isMainMenu
									? 'bg-primary/20 text-primary hover:bg-primary/30'
									: 'bg-background-secondary text-foreground hover:bg-background-secondary/80'
							}`}
						>
							{menu.permissions.every((p: any) => p.access) ? 'Disable All' : 'Enable All'}
						</button>
					</div>
				</div>

				{/* User Type Toggles */}
				<div
					className={`grid gap-2 ${
						isMainMenu
							? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
							: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
					}`}
				>
					{menu.permissions.map((permission: any) => (
						<div
							key={permission.user_type_id}
							className={`flex items-center justify-between rounded border hover:border-primary/30 transition-colors ${
								isMainMenu ? 'p-3 bg-background' : 'p-2 bg-background'
							}`}
						>
							<span
								className={`font-medium text-foreground truncate ${
									isMainMenu ? 'text-sm' : 'text-xs'
								}`}
								title={permission.user_type_name}
							>
								{permission.user_type_name}
							</span>
							<label className='relative inline-flex items-center cursor-pointer flex-shrink-0 ml-2'>
								<input
									type='checkbox'
									checked={permission.access}
									onChange={e =>
										handlePermissionChange(menu.id, permission.user_type_id, e.target.checked)
									}
									className='sr-only peer'
								/>
								<div
									className={`bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:border-white after:content-[''] after:absolute after:top-[1px] after:left-[1px] after:bg-white after:border-gray-300 after:border after:rounded-full after:transition-all peer-checked:bg-primary ${
										isMainMenu
											? 'w-10 h-5 peer-checked:after:translate-x-5 after:h-4 after:w-4'
											: 'w-8 h-4 peer-checked:after:translate-x-4 after:h-3 after:w-3'
									}`}
								></div>
							</label>
						</div>
					))}
				</div>

				{/* Recursively render children */}
				{menu.children && menu.children.length > 0 && (
					<div className='mt-4 space-y-3'>
						{menu.children.map((child: any) => renderMenuPermissions(child, level + 1))}
					</div>
				)}
			</div>
		);
	};

	const handleSavePermissions = async () => {
		if (!selectedMenu || !permissionData) return;

		try {
			// Collect all permission changes for the entire hierarchy
			const allMenuPermissions: Array<{
				menu_id: number;
				permissions: { user_type_id: number; access: boolean }[];
			}> = [];

			// Helper function to collect permissions from a menu and its children
			const collectPermissions = (menu: any) => {
				allMenuPermissions.push({
					menu_id: menu.id,
					permissions: menu.permissions.map((p: any) => ({
						user_type_id: p.user_type_id,
						access: p.access,
					})),
				});

				// Recursively collect from children
				if (menu.children) {
					menu.children.forEach((child: any) => collectPermissions(child));
				}
			};

			// Collect permissions from the main menu and all its children
			collectPermissions(permissionData.menu);

			console.log('🚀 Bulk permission update:', allMenuPermissions);

			// Call bulk update API
			await MenuManagementApiService.bulkUpdateMenuPermissions(allMenuPermissions);

			// Fetch fresh permissions from API (same pattern as App.tsx)
			let freshPermissions = {};
			try {
				const permissionResponse = await MenuApiService.getUserMenuPermissions();
				console.log('📡 Permission API response:', permissionResponse);
				console.log('📡 Permission API data:', permissionResponse.data);
				
				// Access permissions the same way as App.tsx does
				freshPermissions = permissionResponse.data?.menu_permissions || {};

				console.log('📡 Fresh permissions extracted:', freshPermissions);
				console.log('📡 Fresh permissions keys:', Object.keys(freshPermissions));

				if (!freshPermissions || Object.keys(freshPermissions).length === 0) {
					console.warn('⚠️ No permissions received from API, trying localStorage fallback');
					const TokenManager = (await import('../utils/tokenManager')).default;
					freshPermissions = TokenManager.getMenuPermissions() || {};
				}
			} catch (error) {
				console.error('❌ Failed to fetch fresh permissions:', error);
				// Fallback to localStorage
				const TokenManager = (await import('../utils/tokenManager')).default;
				freshPermissions = TokenManager.getMenuPermissions() || {};
			}

			// Update Redux state with fresh permissions
			console.log('🔄 Updating Redux with permissions:', Object.keys(freshPermissions));
			await refreshPermissions(freshPermissions);

			// Update localStorage
			const TokenManager = (await import('../utils/tokenManager')).default;
			TokenManager.setMenuPermissions(freshPermissions);

			// Reload menus to reflect the changes
			await loadMenus();

			// Show success message
			console.log('✅ Permissions saved successfully!');
			console.log('✅ Redux state updated, sidebar should refresh automatically');
			console.log('💡 If sidebar doesn\'t update, check:');
			console.log('   1. Menu IDs in menuConfig.ts match API slugs (e.g., "sales", "leads")');
			console.log('   2. Browser console for Redux state updates');
			console.log('   3. Try refreshing the page if needed');

			setShowPermissionModal(false);
			setSelectedMenu(null);
			setPermissionData(null);
		} catch (error) {
			console.error('Failed to save permissions:', error);
		}
	};

	const toggleMenuStatus = async (menu: Menu) => {
		try {
			const newStatus = menu.status === 1 ? 0 : 1;
			await MenuManagementApiService.updateMenu(menu.id, { status: newStatus });
			await loadMenus();
		} catch (error) {
			console.error('Failed to toggle menu status:', error);
		}
	};

	const handleEditMenu = (menu: Menu) => {
		setMenuActionMessage(null);
		setEditingMenu(menu);
		setShowEditMenuModal(true);
	};

	const handleSubmitEditMenu = async (id: number, data: { name?: string; slug?: string; parent_id?: number | null; sort_order?: number; badge?: string | null; status?: number }) => {
		setEditMenuLoading(true);
		setMenuActionMessage(null);
		try {
			await MenuManagementApiService.updateMenu(id, data);
			await refreshUserMenuPermissionsFromApi();
			await loadMenus();
			setShowEditMenuModal(false);
			setEditingMenu(null);
			setMenuActionMessage({ type: 'success', text: 'Menu updated successfully.' });
		} catch (error: any) {
			setMenuActionMessage({ type: 'error', text: error?.message || 'Failed to update menu.' });
		} finally {
			setEditMenuLoading(false);
		}
	};

	const handleDeleteMenu = async (menu: Menu) => {
		const hasChildren = menu.children && menu.children.length > 0;
		if (hasChildren) {
			setMenuActionMessage({ type: 'error', text: `Cannot delete "${menu.name}" — it has active children. Remove children first.` });
			return;
		}
		if (!window.confirm(`Are you sure you want to delete "${menu.name}"?`)) return;
		try {
			await MenuManagementApiService.deleteMenu(menu.id);
			await refreshUserMenuPermissionsFromApi();
			await loadMenus();
			setMenuActionMessage({ type: 'success', text: `"${menu.name}" deleted successfully.` });
		} catch (error: any) {
			setMenuActionMessage({ type: 'error', text: error?.message || 'Failed to delete menu.' });
		}
	};

	const renderMenuRow = (menu: Menu, level: number = 0) => {
		const hasChildren = menu.children && menu.children.length > 0;
		const isExpanded = expandedMenus.has(menu.id);

		console.log(`Menu: ${menu.name}, hasChildren: ${hasChildren}, children:`, menu.children);

		return (
			<React.Fragment key={menu.id}>
				<tr className='border-b border-border hover:bg-background-secondary/50'>
					<td className='px-4 py-3'>
						<div className='flex items-center space-x-3' style={{ paddingLeft: `${level * 20}px` }}>
							{hasChildren ? (
								<button
									onClick={() => toggleExpanded(menu.id)}
									className='w-6 h-6 flex items-center justify-center bg-primary/10 hover:bg-primary/20 rounded transition-colors border border-primary/20'
								>
									{isExpanded ? (
										<ChevronDown className='w-4 h-4 text-primary' />
									) : (
										<ChevronRight className='w-4 h-4 text-primary' />
									)}
								</button>
							) : (
								<div className='w-6 h-6 flex items-center justify-center'>
									<div
										className={`w-2 h-2 rounded-full ${menu.status === 1 ? 'bg-success' : 'bg-error'}`}
									/>
								</div>
							)}
							<div>
								<div className='font-medium text-foreground'>{menu.name}</div>
							</div>
						</div>
					</td>
					<td className='px-4 py-3'>
						<span className='text-sm text-foreground-muted'>Level {menu.level}</span>
					</td>
					<td className='px-4 py-3'>
						<span className='text-sm text-foreground-muted'>{menu.sort_order}</span>
					</td>
					<td className='px-4 py-3'>
						<button
							onClick={() => toggleMenuStatus(menu)}
							className='flex items-center space-x-1 text-sm hover:text-primary transition-colors'
						>
							{menu.status === 1 ? (
								<>
									<Eye className='w-4 h-4 text-success' />
									<span className='text-success'>Active</span>
								</>
							) : (
								<>
									<EyeOff className='w-4 h-4 text-error' />
									<span className='text-error'>Inactive</span>
								</>
							)}
						</button>
					</td>
					<td className='px-4 py-3'>
						<div className='flex items-center space-x-1'>
							<button
								onClick={() => handleEditMenu(menu)}
								className='p-1 hover:bg-blue-50 rounded transition-colors text-foreground-muted hover:text-blue-600'
								title='Edit Menu'
							>
								<Pencil className='w-4 h-4' />
							</button>
							<button
								onClick={() => handleManagePermissions(menu)}
								className='p-1 hover:bg-background-secondary rounded transition-colors'
								title='Manage Permissions'
							>
								<Settings className='w-4 h-4' />
							</button>
							<button
								onClick={() => handleDeleteMenu(menu)}
								className='p-1 hover:bg-red-50 rounded transition-colors text-foreground-muted hover:text-red-600'
								title='Delete Menu'
							>
								<Trash2 className='w-4 h-4' />
							</button>
						</div>
					</td>
				</tr>

				{/* Render children if expanded */}
				{hasChildren && isExpanded && menu.children!.map(child => renderMenuRow(child, level + 1))}
			</React.Fragment>
		);
	};

	// Load data on component mount
	useEffect(() => {
		loadMenus();
	}, []); // Empty dependency array - only run once on mount

	return (
		<div className='p-4'>
			{/* Compact Header */}
			<div className='flex items-center justify-between mb-4'>
				<div>
					<h1 className='text-2xl font-bold text-foreground'>Menus</h1>
					<p className='text-sm text-foreground-muted'>Manage application menus and permissions</p>
				</div>
				<div className='flex items-center space-x-2'>
					<Button
						onClick={handleCreateMenu}
							data-testid='add-menu-btn'
						className='flex items-center space-x-2 bg-primary hover:bg-primary/90'
					>
						<Plus className='w-4 h-4' />
						<span>Add Menu</span>
					</Button>
				</div>
			</div>

				{menuActionMessage && (
					<div
						className={`mb-4 text-sm ${
							menuActionMessage.type === 'success' ? 'text-success' : 'text-error'
						}`}
						data-testid='menu-action-message'
					>
						{menuActionMessage.text}
					</div>
				)}

			{/* Compact Table */}
			<div className='bg-background rounded-lg border border-border shadow-sm overflow-hidden'>
				<div className='px-4 py-3 border-b border-border bg-background-secondary/30'>
					<div className='flex items-center justify-between'>
						<h2 className='text-base font-semibold text-foreground'>All Menus</h2>
						<div className='flex items-center space-x-3 text-sm text-foreground-muted'>
							<span>{menus.length} menus</span>
							<div className='flex items-center space-x-2'>
								<div className='flex items-center space-x-1'>
									<div className='w-2 h-2 rounded-full bg-success' />
									<span>Active</span>
								</div>
								<div className='flex items-center space-x-1'>
									<div className='w-2 h-2 rounded-full bg-error' />
									<span>Inactive</span>
								</div>
							</div>
						</div>
					</div>
				</div>

				{loading || permissionLoading ? (
					<div className='flex items-center justify-center py-8'>
						<div className='animate-spin rounded-full h-6 w-6 border-b-2 border-primary'></div>
						<span className='ml-2 text-sm text-foreground-muted'>Loading menus...</span>
					</div>
				) : menus.length === 0 ? (
					<div className='text-center py-8'>
						<div className='w-12 h-12 mx-auto mb-3 rounded-full bg-background-secondary flex items-center justify-center'>
							<Settings className='w-6 h-6 text-foreground-muted' />
						</div>
						<h3 className='text-base font-medium text-foreground mb-2'>No menus found</h3>
						<p className='text-sm text-foreground-muted mb-3'>
							Create your first menu to get started
						</p>
						<Button onClick={handleCreateMenu} size='sm'>
							Create Menu
						</Button>
					</div>
				) : (
					<div className='overflow-x-auto'>
						<table className='w-full'>
							<thead>
								<tr className='border-b border-border bg-background-secondary/50'>
									<th className='px-4 py-3 text-left text-sm font-semibold text-foreground'>
										Menu Name
									</th>
									<th className='px-4 py-3 text-left text-sm font-semibold text-foreground'>
										Level
									</th>
									<th className='px-4 py-3 text-left text-sm font-semibold text-foreground'>
										Order
									</th>
									<th className='px-4 py-3 text-left text-sm font-semibold text-foreground'>
										Status
									</th>
									<th className='px-4 py-3 text-left text-sm font-semibold text-foreground'>
										Actions
									</th>
								</tr>
							</thead>
							<tbody>{menus.map(menu => renderMenuRow(menu))}</tbody>
						</table>
					</div>
				)}
			</div>

			{/* Permission Management Modal */}
			{showPermissionModal && selectedMenu && (
				<div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50'>
					<div className='bg-background rounded-lg p-6 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto'>
						<div className='flex items-center justify-between mb-6'>
							<h3 className='text-xl font-semibold text-foreground'>
								User Type Permissions: {selectedMenu.name}
							</h3>
							<button
								onClick={() => setShowPermissionModal(false)}
								className='p-1 hover:bg-background-secondary rounded transition-colors'
							>
								<X className='w-5 h-5 text-foreground-muted' />
							</button>
						</div>

						{loading || permissionLoading ? (
							<div className='flex items-center justify-center py-12'>
								<div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
								<span className='ml-3 text-foreground-muted'>Loading permissions...</span>
							</div>
						) : permissionData ? (
							<div className='space-y-6'>
								{/* Menu Tree with Permissions - Recursive */}
								<div className='space-y-4'>
									<h4 className='text-lg font-semibold text-foreground'>Menu Tree Permissions</h4>
									{renderMenuPermissions(permissionData.menu)}
								</div>
							</div>
						) : (
							<div className='text-center py-8 text-foreground-muted'>
								Failed to load permissions
							</div>
						)}

						<div className='flex justify-end space-x-3 mt-6'>
							<Button variant='outline' onClick={() => setShowPermissionModal(false)}>
								Cancel
							</Button>
							<Button onClick={handleSavePermissions} disabled={!permissionData}>
								Save Permissions
							</Button>
						</div>
					</div>
				</div>
			)}

			<CreateMenuHierarchyModal
				isOpen={showCreateMenuModal}
				onClose={() => setShowCreateMenuModal(false)}
				onSubmit={handleSubmitCreateHierarchy}
				loading={createMenuLoading}
				existingMenus={menus}
			/>

			<EditMenuModal
				isOpen={showEditMenuModal}
				menu={editingMenu}
				allMenus={menus}
				onClose={() => { setShowEditMenuModal(false); setEditingMenu(null); }}
				onSubmit={handleSubmitEditMenu}
				loading={editMenuLoading}
			/>
		</div>
	);
};
