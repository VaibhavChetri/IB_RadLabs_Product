import React, { useEffect, useState } from 'react';
import { X, ChevronRight } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Menu } from '../../services/menuManagementApi';

const SLUG_REGEX = /^[a-z0-9-]+$/;
const MAX_NAME_LENGTH = 255;
const MAX_BADGE_LENGTH = 50;
const MIN_SORT_ORDER = 1;
const MAX_SORT_ORDER = 255;

interface EditMenuModalProps {
	isOpen: boolean;
	menu: Menu | null;
	allMenus: Menu[];
	onClose: () => void;
	onSubmit: (id: number, data: { name?: string; slug?: string; parent_id?: number | null; sort_order?: number; badge?: string | null; status?: number }) => Promise<void>;
	loading: boolean;
}

const validateSlug = (slug: string): string | null => {
	if (!slug.trim()) return 'Slug is required';
	if (!SLUG_REGEX.test(slug)) return 'Slug must contain only lowercase letters, numbers, and hyphens';
	return null;
};

const validateName = (name: string): string | null => {
	if (!name.trim()) return 'Name is required';
	if (name.trim().length > MAX_NAME_LENGTH) return `Name must be ${MAX_NAME_LENGTH} characters or less`;
	return null;
};

const validateSortOrder = (value: string): string | null => {
	const num = Number(value);
	if (!value.trim() || !Number.isFinite(num)) return 'Sort order is required';
	if (!Number.isInteger(num)) return 'Sort order must be a whole number';
	if (num < MIN_SORT_ORDER || num > MAX_SORT_ORDER) return `Sort order must be between ${MIN_SORT_ORDER} and ${MAX_SORT_ORDER}`;
	return null;
};

const validateBadge = (badge: string): string | null => {
	if (badge.trim() && badge.trim().length > MAX_BADGE_LENGTH) return `Badge must be ${MAX_BADGE_LENGTH} characters or less`;
	return null;
};

const inputClass = (hasError: boolean) =>
	`w-full rounded border ${hasError ? 'border-red-500' : 'border-border'} bg-background px-3 py-2 text-sm`;

const FieldError: React.FC<{ error: string | null }> = ({ error }) =>
	error ? <p className='text-xs text-red-500 mt-0.5'>{error}</p> : null;

export const EditMenuModal: React.FC<EditMenuModalProps> = ({
	isOpen,
	menu,
	allMenus,
	onClose,
	onSubmit,
	loading,
}) => {
	const [name, setName] = useState('');
	const [slug, setSlug] = useState('');
	const [parentId, setParentId] = useState<string>('');
	const [sortOrder, setSortOrder] = useState('1');
	const [badge, setBadge] = useState('');
	const [status, setStatus] = useState<1 | 0>(1);
	const [touched, setTouched] = useState(false);
	const [formError, setFormError] = useState('');

	// Populate form when modal opens with menu data
	useEffect(() => {
		if (isOpen && menu) {
			setName(menu.name);
			setSlug(menu.slug);
			setParentId(menu.parent_id !== null ? String(menu.parent_id) : '');
			setSortOrder(String(menu.sort_order));
			setBadge(menu.badge || '');
			setStatus(menu.status as 1 | 0);
			setTouched(false);
			setFormError('');
		}
	}, [isOpen, menu]);

	if (!isOpen || !menu) return null;

	// Build list of possible parents (exclude self and own descendants)
	const getDescendantIds = (menuItem: Menu): number[] => {
		const ids: number[] = [menuItem.id];
		if (menuItem.children) {
			menuItem.children.forEach(child => {
				ids.push(...getDescendantIds(child));
			});
		}
		return ids;
	};

	const excludeIds = new Set(getDescendantIds(menu));
	const possibleParents = allMenus.filter(m => !excludeIds.has(m.id));

	// Flatten for dropdown (including children)
	const flattenMenus = (menus: Menu[], depth = 0): { menu: Menu; depth: number }[] => {
		const result: { menu: Menu; depth: number }[] = [];
		menus.forEach(m => {
			if (!excludeIds.has(m.id)) {
				result.push({ menu: m, depth });
				if (m.children) {
					result.push(...flattenMenus(m.children, depth + 1));
				}
			}
		});
		return result;
	};

	const flatParentOptions = flattenMenus(possibleParents);

	// Find parent name for display
	const findMenuById = (menus: Menu[], id: number): Menu | null => {
		for (const m of menus) {
			if (m.id === id) return m;
			if (m.children) {
				const found = findMenuById(m.children, id);
				if (found) return found;
			}
		}
		return null;
	};

	const currentParent = menu.parent_id ? findMenuById(allMenus, menu.parent_id) : null;

	const nameErr = touched ? validateName(name) : null;
	const slugErr = touched ? validateSlug(slug) : null;
	const sortErr = touched ? validateSortOrder(sortOrder) : null;
	const badgeErr = touched ? validateBadge(badge) : null;

	const handleSubmit = async () => {
		setTouched(true);
		setFormError('');

		const errors: string[] = [];
		const ne = validateName(name);
		const se = validateSlug(slug);
		const so = validateSortOrder(sortOrder);
		const be = validateBadge(badge);
		if (ne) errors.push(ne);
		if (se) errors.push(se);
		if (so) errors.push(so);
		if (be) errors.push(be);

		if (errors.length > 0) {
			setFormError(errors.join('. '));
			return;
		}

		const newParentId = parentId === '' ? null : Number(parentId);

		await onSubmit(menu.id, {
			name: name.trim(),
			slug: slug.trim(),
			parent_id: newParentId,
			sort_order: Number(sortOrder),
			badge: badge.trim() || null,
			status,
		});
	};

	const hasChildren = menu.children && menu.children.length > 0;

	return (
		<div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50'>
			<div className='bg-background rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto'>
				<div className='flex items-center justify-between mb-5'>
					<h3 className='text-xl font-semibold text-foreground'>Edit Menu</h3>
					<button
						type='button'
						onClick={onClose}
						className='p-1 hover:bg-background-secondary rounded transition-colors'
						aria-label='Close'
					>
						<X className='w-5 h-5 text-foreground-muted' />
					</button>
				</div>

				<div className='space-y-4'>
					<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
						<div className='space-y-1'>
							<label className='text-sm text-foreground-muted'>Name <span className='text-red-500'>*</span></label>
							<input
								value={name}
								onChange={e => { setName(e.target.value); setFormError(''); }}
								maxLength={MAX_NAME_LENGTH}
								className={inputClass(!!nameErr)}
								placeholder='e.g. Settings'
							/>
							<FieldError error={nameErr} />
						</div>
						<div className='space-y-1'>
							<label className='text-sm text-foreground-muted'>Slug <span className='text-red-500'>*</span></label>
							<input
								value={slug}
								onChange={e => { setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')); setFormError(''); }}
								className={inputClass(!!slugErr)}
								placeholder='e.g. settings'
							/>
							<FieldError error={slugErr} />
							<p className='text-xs text-foreground-muted'>Lowercase, numbers, hyphens only</p>
						</div>
					</div>

					<div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
						<div className='space-y-1'>
							<label className='text-sm text-foreground-muted'>Parent Menu</label>
							<select
								value={parentId}
								onChange={e => { setParentId(e.target.value); setFormError(''); }}
								className='w-full rounded border border-border bg-background px-3 py-2 text-sm'
							>
								<option value=''>None (Top Level)</option>
								{flatParentOptions.map(({ menu: m, depth }) => (
									<option key={m.id} value={m.id}>
										{'—'.repeat(depth)} {m.name}
									</option>
								))}
							</select>
							<p className='text-xs text-foreground-muted'>
								Current: {currentParent ? currentParent.name : 'Top Level'}
							</p>
						</div>
						<div className='space-y-1'>
							<label className='text-sm text-foreground-muted'>Sort Order <span className='text-red-500'>*</span></label>
							<input
								type='number'
								min={MIN_SORT_ORDER}
								max={MAX_SORT_ORDER}
								value={sortOrder}
								onChange={e => { setSortOrder(e.target.value); setFormError(''); }}
								className={inputClass(!!sortErr)}
							/>
							<FieldError error={sortErr} />
							<p className='text-xs text-foreground-muted'>{MIN_SORT_ORDER}-{MAX_SORT_ORDER}</p>
						</div>
						<div className='space-y-1'>
							<label className='text-sm text-foreground-muted'>Status</label>
							<select
								value={status}
								onChange={e => setStatus(Number(e.target.value) as 1 | 0)}
								className='w-full rounded border border-border bg-background px-3 py-2 text-sm'
							>
								<option value={1}>Active</option>
								<option value={0}>Inactive</option>
							</select>
						</div>
					</div>

					<div className='space-y-1'>
						<label className='text-sm text-foreground-muted'>Badge</label>
						<input
							value={badge}
							onChange={e => { setBadge(e.target.value); setFormError(''); }}
							maxLength={MAX_BADGE_LENGTH}
							className={inputClass(!!badgeErr)}
							placeholder='e.g. New'
						/>
						<FieldError error={badgeErr} />
						<p className='text-xs text-foreground-muted'>Optional, max {MAX_BADGE_LENGTH} characters</p>
					</div>

					{/* Children & Grandchildren display */}
					{hasChildren && (
						<div className='space-y-2'>
							<label className='text-sm font-medium text-foreground'>Children & Grandchildren</label>
							<div className='rounded border border-border bg-background-secondary/20 p-3 space-y-1'>
								{menu.children!.map(child => (
									<div key={child.id}>
										<div className='flex items-center gap-2 py-1.5 px-2 rounded hover:bg-background-secondary/50'>
											<ChevronRight className='w-3.5 h-3.5 text-foreground-muted flex-shrink-0' />
											<span className='text-sm text-foreground'>{child.name}</span>
											<span className='text-xs text-foreground-muted'>({child.slug})</span>
											<span className={`text-xs ml-auto ${child.status === 1 ? 'text-green-600' : 'text-red-500'}`}>
												{child.status === 1 ? 'Active' : 'Inactive'}
											</span>
										</div>
										{child.children && child.children.length > 0 && (
											<div className='ml-6 border-l border-border pl-3 space-y-0.5'>
												{child.children.map(gc => (
													<div key={gc.id} className='flex items-center gap-2 py-1 px-2 rounded hover:bg-background-secondary/50'>
														<ChevronRight className='w-3 h-3 text-foreground-muted flex-shrink-0' />
														<span className='text-sm text-foreground'>{gc.name}</span>
														<span className='text-xs text-foreground-muted'>({gc.slug})</span>
														<span className={`text-xs ml-auto ${gc.status === 1 ? 'text-green-600' : 'text-red-500'}`}>
															{gc.status === 1 ? 'Active' : 'Inactive'}
														</span>
													</div>
												))}
											</div>
										)}
									</div>
								))}
							</div>
							<p className='text-xs text-foreground-muted'>To edit children, click the edit icon on them directly in the menu list.</p>
						</div>
					)}
				</div>

				{formError && (
					<div className='mt-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3'>
						{formError}
					</div>
				)}

				<div className='flex justify-end space-x-3 mt-6'>
					<Button variant='outline' onClick={onClose} disabled={loading}>
						Cancel
					</Button>
					<Button onClick={handleSubmit} loading={loading}>
						Save Changes
					</Button>
				</div>
			</div>
		</div>
	);
};
