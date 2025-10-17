import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Eye, EyeOff, Settings, ChevronRight, ChevronDown, X } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { MenuManagementApiService, Menu } from '../services/menuManagementApi';
import { useApi } from '../hooks/useApi';
import { useUserMenus } from '../hooks/useUserMenus';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

export const MenuManagement: React.FC = () => {
	const { refreshPermissions } = useUserMenus();
	const { user } = useSelector((state: RootState) => state.auth);
	const [menus, setMenus] = useState<Menu[]>([]);
	const [selectedMenu, setSelectedMenu] = useState<Menu | null>(null);
	const [showPermissionModal, setShowPermissionModal] = useState(false);
	const [expandedMenus, setExpandedMenus] = useState<Set<number>>(new Set());
	const [permissionData, setPermissionData] = useState<any>(null);
	const [permissionLoading, setPermissionLoading] = useState(false);

	// API hooks
	const menusApi = useApi('menus', MenuManagementApiService.getMenus);

	const buildMenuHierarchy = (flatMenus: Menu[]): Menu[] => {
		// The API already returns hierarchical data with children populated
		// Just filter to get root menus (parent_id === null)
		return flatMenus.filter(menu => menu.parent_id === null);
	};

	const loadMenus = useCallback(async () => {
		try {
			const response = await menusApi.execute({});
			if (response.status_code === 200) {
				const hierarchicalMenus = buildMenuHierarchy(response.data.menus);
				console.log('Loaded menus:', hierarchicalMenus);
				setMenus(hierarchicalMenus);
			}
		} catch (error) {
			console.error('Failed to load menus:', error);
		}
	}, []); // Remove menusApi dependency to prevent infinite loop

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
		console.log('Create menu clicked');
	};

	const handleManagePermissions = async (menu: Menu) => {
		setSelectedMenu(menu);
		setPermissionLoading(true);
		setShowPermissionModal(true);

		try {
			const response = await MenuManagementApiService.getMenuPermissions(menu.id);
			console.log('📡 Raw API response:', response);
			console.log('📡 Response data:', response.data);
			console.log('📡 Response data children:', response.data?.children);

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

		const updateMenuPermissions = (menu: any): any => {
			if (menu.id === menuId) {
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
					children: menu.children.map((child: any) => updateMenuPermissions(child)),
				};
			}

			return menu;
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

			// Reload menus to reflect the changes
			await loadMenus();

			// Update Redux state with new permissions for sidebar
			await updateReduxPermissions();

			// Show success message
			console.log('✅ Permissions saved successfully!');

			setShowPermissionModal(false);
			setSelectedMenu(null);
			setPermissionData(null);
		} catch (error) {
			console.error('Failed to save permissions:', error);
		}
	};

	const updateReduxPermissions = async () => {
		try {
			// Get the current user's permissions from the updated menu data
			// We need to reconstruct the permissions structure that matches what Redux expects
			const updatedPermissions: Record<string, any> = {};

			// Helper function to build permissions from menu hierarchy
			const buildPermissions = (menu: any) => {
				if (menu.permissions) {
					const hasAccess = menu.permissions.some((p: any) => p.access);
					console.log(
						`🔍 Building permissions for ${menu.name} (${menu.slug}): hasAccess=${hasAccess}`
					);

					updatedPermissions[menu.slug] = {
						access: hasAccess,
						children: {},
					};

					// Add children permissions
					if (menu.children) {
						menu.children.forEach((child: any) => {
							const childHasAccess = child.permissions?.some((p: any) => p.access);
							console.log(
								`🔍 Building permissions for child ${child.name} (${child.slug}): hasAccess=${childHasAccess}`
							);

							updatedPermissions[menu.slug].children[child.slug] = {
								access: childHasAccess,
								children: {},
							};

							// Add grandchildren permissions
							if (child.children) {
								child.children.forEach((grandchild: any) => {
									const grandchildHasAccess = grandchild.permissions?.some((p: any) => p.access);
									console.log(
										`🔍 Building permissions for grandchild ${grandchild.name} (${grandchild.slug}): hasAccess=${grandchildHasAccess}`
									);

									updatedPermissions[menu.slug].children[child.slug].children[grandchild.slug] = {
										access: grandchildHasAccess,
										children: {},
									};
								});
							}
						});
					}
				}
			};

			// Build permissions from the updated menu data
			if (permissionData?.menu) {
				buildPermissions(permissionData.menu);
			}

			console.log('🔄 Updated permissions for Redux:', updatedPermissions);

			// Get current permissions from Redux and merge with updated permissions
			const currentPermissions = user?.menuPermissions || {};
			const mergedPermissions = {
				...currentPermissions,
				...updatedPermissions,
			};

			console.log('🔄 Current permissions:', currentPermissions);
			console.log('🔄 Merged permissions:', mergedPermissions);

			// Update Redux state using the useUserMenus hook
			await refreshPermissions(mergedPermissions);

			console.log('✅ Redux permissions updated successfully!');
		} catch (error) {
			console.error('Failed to update Redux permissions:', error);
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
						<div className='flex items-center space-x-2'>
							<button
								onClick={() => handleManagePermissions(menu)}
								className='p-1 hover:bg-background-secondary rounded transition-colors'
								title='Manage Permissions'
							>
								<Settings className='w-4 h-4' />
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
				<Button
					onClick={handleCreateMenu}
					className='flex items-center space-x-2 bg-primary hover:bg-primary/90'
				>
					<Plus className='w-4 h-4' />
					<span>Add Menu</span>
				</Button>
			</div>

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

				{menusApi.loading ? (
					<div className='flex items-center justify-center py-8'>
						<div className='animate-spin rounded-full h-6 w-6 border-b-2 border-primary'></div>
						<span className='ml-2 text-sm text-foreground-muted'>Loading menus...</span>
					</div>
				) : menusApi.error ? (
					<div className='text-center py-8'>
						<p className='text-error mb-3'>Failed to load menus</p>
						<Button onClick={loadMenus} variant='outline' size='sm'>
							Try Again
						</Button>
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

						{permissionLoading ? (
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
		</div>
	);
};
