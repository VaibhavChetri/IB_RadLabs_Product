import React, { useEffect, useMemo, useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Menu } from '../../services/menuManagementApi';

export type GrandchildForm = {
	name: string;
	slug: string;
	sortOrder: string;
	badge: string;
	status: 1 | 0;
	isExisting?: boolean;
};

export type ChildForm = {
	name: string;
	slug: string;
	sortOrder: string;
	badge: string;
	status: 1 | 0;
	grandchildren: GrandchildForm[];
	isExisting?: boolean;
	existingId?: number;
};

export type CreateMenuHierarchyPayload = {
	parent: {
		id?: number;
		name?: string;
		slug?: string;
		parent_id?: number | null;
		sort_order?: number;
		level?: number;
		badge?: string | null;
		status?: number;
	};
	children: Array<{
		name: string;
		slug: string;
		parent_id?: number | null;
		sort_order: number;
		level: number;
		badge?: string | null;
		status?: number;
		grandchildren?: Array<{
			name: string;
			slug: string;
			parent_id?: number | null;
			sort_order: number;
			level: number;
			badge?: string | null;
			status?: number;
		}>;
	}>;
	// New grandchildren to add under existing children (each entry is a separate API call)
	existingChildGrandchildren?: Array<{
		existingChildSlug: string;
		existingChildId: number;
		grandchildren: Array<{
			name: string;
			slug: string;
			sort_order: number;
			level: number;
			badge?: string | null;
			status?: number;
		}>;
	}>;
};

interface CreateMenuHierarchyModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSubmit: (payload: CreateMenuHierarchyPayload) => Promise<void> | void;
	loading: boolean;
	existingMenus: Menu[];
}

const SLUG_REGEX = /^[a-z0-9-]+$/;
const MAX_NAME_LENGTH = 255;
const MAX_BADGE_LENGTH = 50;
const MIN_SORT_ORDER = 1;
const MAX_SORT_ORDER = 255;

const generateSlug = (name: string): string =>
	name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

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

export const CreateMenuHierarchyModal: React.FC<CreateMenuHierarchyModalProps> = ({
	isOpen,
	onClose,
	onSubmit,
	loading,
	existingMenus,
}) => {
	const [useExistingParent, setUseExistingParent] = useState(false);
	const [parentId, setParentId] = useState<string>('');
	const [parentName, setParentName] = useState<string>('');
	const [parentSlug, setParentSlug] = useState<string>('');
	const [parentSortOrder, setParentSortOrder] = useState<string>('1');
	const [parentBadge, setParentBadge] = useState<string>('');
	const [parentStatus, setParentStatus] = useState<1 | 0>(1);
	const [autoSlugParent, setAutoSlugParent] = useState(true);

	const [children, setChildren] = useState<ChildForm[]>([
		{ name: '', slug: '', sortOrder: '1', badge: '', status: 1, grandchildren: [] },
	]);
	const [autoSlugChildren, setAutoSlugChildren] = useState<Record<number, boolean>>({ 0: true });
	const [autoSlugGrandchildren, setAutoSlugGrandchildren] = useState<Record<string, boolean>>({});

	const [formError, setFormError] = useState<string>('');
	const [touched, setTouched] = useState(false);

	// Reset form when modal opens
	useEffect(() => {
		if (isOpen) {
			setUseExistingParent(false);
			setParentId('');
			setParentName('');
			setParentSlug('');
			setParentSortOrder('1');
			setParentBadge('');
			setParentStatus(1);
			setAutoSlugParent(true);
			setChildren([{ name: '', slug: '', sortOrder: '1', badge: '', status: 1, grandchildren: [] }]);
			setAutoSlugChildren({ 0: true });
			setAutoSlugGrandchildren({});
			setFormError('');
			setTouched(false);
		}
	}, [isOpen]);

	// Only show top-level (parent) menus in dropdown
	const parentOptions = useMemo(() => {
		return existingMenus.filter(m => m.parent_id === null);
	}, [existingMenus]);

	// When parent selection changes, populate existing children
	const handleParentSelect = (selectedId: string) => {
		setParentId(selectedId);
		resetError();

		if (!selectedId) {
			setChildren([{ name: '', slug: '', sortOrder: '1', badge: '', status: 1, grandchildren: [], isExisting: false }]);
			setAutoSlugChildren({ 0: true });
			setAutoSlugGrandchildren({});
			return;
		}

		const findMenu = (menus: Menu[]): Menu | null => {
			for (const m of menus) {
				if (m.id === Number(selectedId)) return m;
				if (m.children) {
					const found = findMenu(m.children);
					if (found) return found;
				}
			}
			return null;
		};

		const parent = findMenu(existingMenus);
		const existingChildren: ChildForm[] = (parent?.children || []).map(child => ({
			name: child.name,
			slug: child.slug,
			sortOrder: String(child.sort_order),
			badge: child.badge || '',
			status: (child.status === 1 ? 1 : 0) as 1 | 0,
			isExisting: true,
			existingId: child.id,
			grandchildren: (child.children || []).map(gc => ({
				name: gc.name,
				slug: gc.slug,
				sortOrder: String(gc.sort_order),
				badge: gc.badge || '',
				status: (gc.status === 1 ? 1 : 0) as 1 | 0,
				isExisting: true,
			})),
		}));

		const newChildIdx = existingChildren.length;
		const newChild: ChildForm = { name: '', slug: '', sortOrder: String(newChildIdx + 1), badge: '', status: 1, grandchildren: [], isExisting: false };
		setChildren([...existingChildren, newChild]);
		setAutoSlugChildren({ [newChildIdx]: true });
		setAutoSlugGrandchildren({});
	};

	// Collect all slugs in the form for duplicate detection
	const allSlugs = useMemo(() => {
		const slugs: string[] = [];
		if (!useExistingParent && parentSlug.trim()) slugs.push(parentSlug.trim());
		children.forEach(c => {
			if (c.slug.trim()) slugs.push(c.slug.trim());
			c.grandchildren.forEach(gc => {
				if (gc.slug.trim()) slugs.push(gc.slug.trim());
			});
		});
		return slugs;
	}, [useExistingParent, parentSlug, children]);

	const isDuplicateSlug = (slug: string, excludeSelf = true): boolean => {
		if (!slug.trim()) return false;
		const count = allSlugs.filter(s => s === slug.trim()).length;
		return excludeSelf ? count > 1 : count > 0;
	};

	const canSubmit = useMemo(() => {
		if (loading) return false;
		if (children.length === 0) return false;

		if (useExistingParent) {
			const idNum = Number(parentId);
			if (!Number.isFinite(idNum) || idNum <= 0) return false;
		} else {
			if (!parentName.trim() || !parentSlug.trim()) return false;
			if (validateSlug(parentSlug) || validateName(parentName) || validateSortOrder(parentSortOrder)) return false;
		}

		// Allow submit if there's a valid new child OR a new grandchild under an existing child
		const newChildren = children.filter(c => !c.isExisting);
		const hasValidNewChild = newChildren.some(c => c.name.trim() && c.slug.trim() && !validateSlug(c.slug) && !validateSortOrder(c.sortOrder));
		const hasNewGrandchildUnderExisting = children.some(c => c.isExisting && c.grandchildren.some(gc => !gc.isExisting && gc.name.trim() && gc.slug.trim()));
		return hasValidNewChild || hasNewGrandchildUnderExisting;
	}, [children, loading, parentId, parentName, parentSlug, parentSortOrder, useExistingParent]);

	if (!isOpen) return null;

	const resetError = () => setFormError('');

	const handleParentNameChange = (value: string) => {
		setParentName(value);
		if (autoSlugParent) setParentSlug(generateSlug(value));
		resetError();
	};

	const handleParentSlugChange = (value: string) => {
		setAutoSlugParent(false);
		setParentSlug(value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
		resetError();
	};

	const handleChildNameChange = (idx: number, value: string) => {
		resetError();
		setChildren(prev => {
			const next = [...prev];
			next[idx] = { ...next[idx], name: value };
			if (autoSlugChildren[idx] !== false) {
				next[idx] = { ...next[idx], name: value, slug: generateSlug(value) };
			}
			return next;
		});
	};

	const handleChildSlugChange = (idx: number, value: string) => {
		resetError();
		setAutoSlugChildren(prev => ({ ...prev, [idx]: false }));
		setChildren(prev => {
			const next = [...prev];
			next[idx] = { ...next[idx], slug: value.toLowerCase().replace(/[^a-z0-9-]/g, '') };
			return next;
		});
	};

	const handleGrandchildNameChange = (childIdx: number, gcIdx: number, value: string) => {
		resetError();
		const key = `${childIdx}-${gcIdx}`;
		setChildren(prev => {
			const next = [...prev];
			const targetChild = next[childIdx];
			const nextGrandchildren = [...targetChild.grandchildren];
			nextGrandchildren[gcIdx] = { ...nextGrandchildren[gcIdx], name: value };
			if (autoSlugGrandchildren[key] !== false) {
				nextGrandchildren[gcIdx] = { ...nextGrandchildren[gcIdx], name: value, slug: generateSlug(value) };
			}
			next[childIdx] = { ...targetChild, grandchildren: nextGrandchildren };
			return next;
		});
	};

	const handleGrandchildSlugChange = (childIdx: number, gcIdx: number, value: string) => {
		resetError();
		const key = `${childIdx}-${gcIdx}`;
		setAutoSlugGrandchildren(prev => ({ ...prev, [key]: false }));
		setChildren(prev => {
			const next = [...prev];
			const targetChild = next[childIdx];
			const nextGrandchildren = [...targetChild.grandchildren];
			nextGrandchildren[gcIdx] = { ...nextGrandchildren[gcIdx], slug: value.toLowerCase().replace(/[^a-z0-9-]/g, '') };
			next[childIdx] = { ...targetChild, grandchildren: nextGrandchildren };
			return next;
		});
	};

	const handleAddChild = () => {
		resetError();
		const newIdx = children.length;
		setAutoSlugChildren(prev => ({ ...prev, [newIdx]: true }));
		setChildren(prev => [
			...prev,
			{ name: '', slug: '', sortOrder: String(prev.length + 1), badge: '', status: 1, grandchildren: [] },
		]);
	};

	const handleRemoveChild = (idx: number) => {
		if (children.length <= 1) return;
		resetError();
		setChildren(prev => prev.filter((_, i) => i !== idx));
	};

	const handleAddGrandchild = (childIndex: number) => {
		resetError();
		const gcIdx = children[childIndex].grandchildren.length;
		setAutoSlugGrandchildren(prev => ({ ...prev, [`${childIndex}-${gcIdx}`]: true }));
		setChildren(prev => {
			const next = [...prev];
			const child = next[childIndex];
			next[childIndex] = {
				...child,
				grandchildren: [...child.grandchildren, { name: '', slug: '', sortOrder: String(child.grandchildren.length + 1), badge: '', status: 1 }],
			};
			return next;
		});
	};

	const handleRemoveGrandchild = (childIdx: number, gcIdx: number) => {
		resetError();
		setChildren(prev => {
			const next = [...prev];
			const targetChild = next[childIdx];
			next[childIdx] = { ...targetChild, grandchildren: targetChild.grandchildren.filter((_, i) => i !== gcIdx) };
			return next;
		});
	};

	const validateAndBuildPayload = (): CreateMenuHierarchyPayload | null => {
		setFormError('');
		setTouched(true);

		const errors: string[] = [];

		if (useExistingParent) {
			const idNum = Number(parentId);
			if (!Number.isFinite(idNum) || idNum <= 0) {
				errors.push('Parent ID must be a valid positive number.');
			}
		} else {
			const nameErr = validateName(parentName);
			const slugErr = validateSlug(parentSlug);
			const sortErr = validateSortOrder(parentSortOrder);
			const badgeErr = validateBadge(parentBadge);
			if (nameErr) errors.push(`Parent Name: ${nameErr}`);
			if (slugErr) errors.push(`Parent Slug: ${slugErr}`);
			if (sortErr) errors.push(`Parent Sort Order: ${sortErr}`);
			if (badgeErr) errors.push(`Parent Badge: ${badgeErr}`);
			if (isDuplicateSlug(parentSlug)) errors.push(`Parent Slug "${parentSlug}" is duplicated in the form.`);
		}

		// Validate new children
		const newChildren = children.filter(c => !c.isExisting);
		const newGrandchildrenUnderExisting = children.filter(c => c.isExisting && c.grandchildren.some(gc => !gc.isExisting && gc.name.trim() && gc.slug.trim()));

		if (newChildren.length === 0 && newGrandchildrenUnderExisting.length === 0) {
			errors.push('Add at least one new child or grandchild.');
		}

		// Check new children have valid entries (skip if only adding grandchildren to existing)
		const validNewChildren = newChildren.filter(c => c.name.trim() || c.slug.trim());
		if (newChildren.length > 0 && validNewChildren.length === 0 && newGrandchildrenUnderExisting.length === 0) {
			errors.push('Please provide at least one valid new child (name + slug).');
		}

		newChildren.forEach((c, idx) => {
			if (!c.name.trim() && !c.slug.trim()) return;
			const nameErr = validateName(c.name);
			const slugErr = validateSlug(c.slug);
			const sortErr = validateSortOrder(c.sortOrder);
			const badgeErr = validateBadge(c.badge);
			if (nameErr) errors.push(`New Child ${idx + 1} Name: ${nameErr}`);
			if (slugErr) errors.push(`New Child ${idx + 1} Slug: ${slugErr}`);
			if (sortErr) errors.push(`New Child ${idx + 1} Sort Order: ${sortErr}`);
			if (badgeErr) errors.push(`New Child ${idx + 1} Badge: ${badgeErr}`);
			if (isDuplicateSlug(c.slug)) errors.push(`New Child ${idx + 1} Slug "${c.slug}" is duplicated in the form.`);

			c.grandchildren.forEach((gc, gcIdx) => {
				if (gc.isExisting || (!gc.name.trim() && !gc.slug.trim())) return;
				const gcNameErr = validateName(gc.name);
				const gcSlugErr = validateSlug(gc.slug);
				const gcSortErr = validateSortOrder(gc.sortOrder);
				const gcBadgeErr = validateBadge(gc.badge);
				if (gcNameErr) errors.push(`New Child ${idx + 1} > Grandchild ${gcIdx + 1} Name: ${gcNameErr}`);
				if (gcSlugErr) errors.push(`New Child ${idx + 1} > Grandchild ${gcIdx + 1} Slug: ${gcSlugErr}`);
				if (gcSortErr) errors.push(`New Child ${idx + 1} > Grandchild ${gcIdx + 1} Sort Order: ${gcSortErr}`);
				if (gcBadgeErr) errors.push(`New Child ${idx + 1} > Grandchild ${gcIdx + 1} Badge: ${gcBadgeErr}`);
				if (isDuplicateSlug(gc.slug)) errors.push(`Grandchild Slug "${gc.slug}" is duplicated in the form.`);
			});
		});

		// Validate new grandchildren under existing children
		newGrandchildrenUnderExisting.forEach(c => {
			c.grandchildren.filter(gc => !gc.isExisting && (gc.name.trim() || gc.slug.trim())).forEach((gc, gcIdx) => {
				const gcNameErr = validateName(gc.name);
				const gcSlugErr = validateSlug(gc.slug);
				const gcSortErr = validateSortOrder(gc.sortOrder);
				const gcBadgeErr = validateBadge(gc.badge);
				if (gcNameErr) errors.push(`"${c.name}" > New Grandchild ${gcIdx + 1} Name: ${gcNameErr}`);
				if (gcSlugErr) errors.push(`"${c.name}" > New Grandchild ${gcIdx + 1} Slug: ${gcSlugErr}`);
				if (gcSortErr) errors.push(`"${c.name}" > New Grandchild ${gcIdx + 1} Sort Order: ${gcSortErr}`);
				if (gcBadgeErr) errors.push(`"${c.name}" > New Grandchild ${gcIdx + 1} Badge: ${gcBadgeErr}`);
				if (isDuplicateSlug(gc.slug)) errors.push(`Grandchild Slug "${gc.slug}" is duplicated in the form.`);
			});
		});

		if (errors.length > 0) {
			setFormError(errors.join('\n'));
			return null;
		}

		const buildGrandchildren = (gcs: GrandchildForm[]) =>
			gcs.filter(g => !g.isExisting && g.name.trim() && g.slug.trim()).map(g => ({
				name: g.name.trim(),
				slug: g.slug.trim(),
				parent_id: null as null,
				sort_order: Number(g.sortOrder),
				level: 2,
				badge: g.badge.trim() || null,
				status: g.status,
			}));

		const childrenPayload = children
			.filter(c => !c.isExisting && c.name.trim() && c.slug.trim())
			.map(c => {
				const grandchildrenPayload = buildGrandchildren(c.grandchildren);
				return {
					name: c.name.trim(),
					slug: c.slug.trim(),
					parent_id: null as null,
					sort_order: Number(c.sortOrder),
					level: 1,
					badge: c.badge.trim() || null,
					status: c.status,
					grandchildren: grandchildrenPayload.length > 0 ? grandchildrenPayload : undefined,
				};
			});

		// Build grandchildren for existing children
		const existingChildGrandchildren = children
			.filter(c => c.isExisting && c.existingId)
			.map(c => ({
				existingChildSlug: c.slug,
				existingChildId: c.existingId!,
				grandchildren: buildGrandchildren(c.grandchildren),
			}))
			.filter(e => e.grandchildren.length > 0);

		if (useExistingParent) {
			return {
				parent: { id: Number(parentId) },
				children: childrenPayload,
				existingChildGrandchildren: existingChildGrandchildren.length > 0 ? existingChildGrandchildren : undefined,
			};
		}

		return {
			parent: {
				name: parentName.trim(),
				slug: parentSlug.trim(),
				parent_id: null,
				sort_order: Number(parentSortOrder),
				level: 0,
				badge: parentBadge.trim() || null,
				status: parentStatus,
			},
			children: childrenPayload,
		};
	};

	const handleSubmit = async () => {
		resetError();
		const payload = validateAndBuildPayload();
		if (!payload) return;
		await onSubmit(payload);
	};

	return (
		<div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50'>
			<div className='bg-background rounded-lg p-6 max-w-5xl w-full mx-4 max-h-[90vh] overflow-y-auto'>
				<div className='flex items-center justify-between mb-5'>
					<h3 className='text-xl font-semibold text-foreground'>Add Menu Hierarchy</h3>
					<button
						type='button'
						onClick={onClose}
						className='p-1 hover:bg-background-secondary rounded transition-colors'
						aria-label='Close'
						data-testid='create-menu-close'
					>
						<X className='w-5 h-5 text-foreground-muted' />
					</button>
				</div>

				<div className='flex items-center gap-3 mb-4'>
					<label className='flex items-center gap-2 cursor-pointer'>
						<input
							type='checkbox'
							checked={useExistingParent}
							onChange={e => setUseExistingParent(e.target.checked)}
							className='rounded'
							data-testid='use-existing-parent'
						/>
						<span className='text-sm text-foreground'>Use existing parent menu</span>
					</label>
				</div>

				{useExistingParent ? (
					<>
						<div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-5'>
							<div className='space-y-1'>
								<label className='text-sm text-foreground-muted'>Parent Menu <span className='text-red-500'>*</span></label>
								<select
									value={parentId}
									onChange={e => handleParentSelect(e.target.value)}
									className={inputClass(touched && !parentId)}
									data-testid='parent-id'
								>
									<option value=''>Select a parent menu...</option>
									{parentOptions.map(m => (
										<option key={m.id} value={m.id}>
											{m.name}
										</option>
									))}
								</select>
								{touched && !parentId && (
									<FieldError error='Please select a parent menu' />
								)}
							</div>
							<div />
							<div />
						</div>

					</>
				) : (
					<div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-5'>
						<div className='space-y-1'>
							<label className='text-sm text-foreground-muted'>Parent Name <span className='text-red-500'>*</span></label>
							<input
								value={parentName}
								onChange={e => handleParentNameChange(e.target.value)}
								maxLength={MAX_NAME_LENGTH}
								className={inputClass(touched && !!validateName(parentName))}
								placeholder='e.g. Settings'
								data-testid='parent-name'
							/>
							{touched && <FieldError error={validateName(parentName)} />}
						</div>
						<div className='space-y-1'>
							<label className='text-sm text-foreground-muted'>Parent Slug <span className='text-red-500'>*</span></label>
							<input
								value={parentSlug}
								onChange={e => handleParentSlugChange(e.target.value)}
								className={inputClass(touched && (!!validateSlug(parentSlug) || isDuplicateSlug(parentSlug)))}
								placeholder='e.g. settings'
								data-testid='parent-slug'
							/>
							{touched && <FieldError error={validateSlug(parentSlug)} />}
							{touched && !validateSlug(parentSlug) && isDuplicateSlug(parentSlug) && (
								<FieldError error='Duplicate slug in form' />
							)}
							<p className='text-xs text-foreground-muted'>Lowercase, numbers, hyphens only</p>
						</div>
						<div className='space-y-1'>
							<label className='text-sm text-foreground-muted'>Sort Order <span className='text-red-500'>*</span></label>
							<input
								type='number'
								min={MIN_SORT_ORDER}
								max={MAX_SORT_ORDER}
								value={parentSortOrder}
								onChange={e => { setParentSortOrder(e.target.value); resetError(); }}
								className={inputClass(touched && !!validateSortOrder(parentSortOrder))}
								data-testid='parent-sort-order'
							/>
							{touched && <FieldError error={validateSortOrder(parentSortOrder)} />}
							<p className='text-xs text-foreground-muted'>{MIN_SORT_ORDER}-{MAX_SORT_ORDER}</p>
						</div>
						<div className='space-y-1'>
							<label className='text-sm text-foreground-muted'>Status</label>
							<select
								value={parentStatus}
								onChange={e => setParentStatus(Number(e.target.value) as 1 | 0)}
								className='w-full rounded border border-border bg-background px-3 py-2 text-sm'
								data-testid='parent-status'
							>
								<option value={1}>Active</option>
								<option value={0}>Inactive</option>
							</select>
						</div>
					</div>
				)}

				<div className='mb-4'>
					<h4 className='text-lg font-semibold text-foreground mb-3'>Children (Level 1)</h4>
					<div className='space-y-4'>
						{children.map((child, idx) => {
							const isExisting = !!child.isExisting;
							const childNameErr = !isExisting && touched ? validateName(child.name) : null;
							const childSlugErr = !isExisting && touched ? validateSlug(child.slug) : null;
							const childSortErr = !isExisting && touched ? validateSortOrder(child.sortOrder) : null;
							const childSlugDup = !isExisting && touched && !childSlugErr && isDuplicateSlug(child.slug);

							return (
								<div
									key={idx}
									className={`rounded-lg border p-4 ${isExisting ? 'border-border/50 bg-background-secondary/40 opacity-75' : 'border-border bg-background-secondary/20'}`}
									data-testid={`child-card-${idx}`}
								>
									<div className='flex items-center justify-between mb-3'>
										<span className='text-sm font-medium text-foreground-muted'>
											{isExisting ? `Existing Child ${idx + 1}` : `New Child`}
											{isExisting && <span className='ml-2 text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded'>existing</span>}
										</span>
										{!isExisting && children.filter(c => !c.isExisting).length > 1 && (
											<button
												type='button'
												onClick={() => handleRemoveChild(idx)}
												className='p-1 text-red-500 hover:bg-red-50 rounded transition-colors'
												title='Remove child'
											>
												<Trash2 className='w-4 h-4' />
											</button>
										)}
									</div>
									<div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-3'>
										<div className='space-y-1'>
											<label className='text-sm text-foreground-muted'>Name {!isExisting && <span className='text-red-500'>*</span>}</label>
											<input
												value={child.name}
												onChange={e => handleChildNameChange(idx, e.target.value)}
												maxLength={MAX_NAME_LENGTH}
												className={inputClass(!!childNameErr)}
												placeholder='e.g. General'
												disabled={isExisting}
												data-testid={`child-name-${idx}`}
											/>
											<FieldError error={childNameErr} />
										</div>
										<div className='space-y-1'>
											<label className='text-sm text-foreground-muted'>Slug {!isExisting && <span className='text-red-500'>*</span>}</label>
											<input
												value={child.slug}
												onChange={e => handleChildSlugChange(idx, e.target.value)}
												className={inputClass(!!childSlugErr || childSlugDup)}
												placeholder='e.g. settings-general'
												disabled={isExisting}
												data-testid={`child-slug-${idx}`}
											/>
											<FieldError error={childSlugErr} />
											{childSlugDup && <FieldError error='Duplicate slug in form' />}
										</div>
										<div className='space-y-1'>
											<label className='text-sm text-foreground-muted'>Sort Order {!isExisting && <span className='text-red-500'>*</span>}</label>
											<input
												type='number'
												min={MIN_SORT_ORDER}
												max={MAX_SORT_ORDER}
												value={child.sortOrder}
												onChange={e => {
													resetError();
													setChildren(prev => {
														const next = [...prev];
														next[idx] = { ...next[idx], sortOrder: e.target.value };
														return next;
													});
												}}
												className={inputClass(!!childSortErr)}
												disabled={isExisting}
												data-testid={`child-sort-order-${idx}`}
											/>
											<FieldError error={childSortErr} />
										</div>
										<div className='space-y-1'>
											<label className='text-sm text-foreground-muted'>Status</label>
											<select
												value={child.status}
												onChange={e => {
													const status = Number(e.target.value) as 1 | 0;
													setChildren(prev => {
														const next = [...prev];
														next[idx] = { ...next[idx], status };
														return next;
													});
												}}
												className='w-full rounded border border-border bg-background px-3 py-2 text-sm'
												disabled={isExisting}
												data-testid={`child-status-${idx}`}
											>
												<option value={1}>Active</option>
												<option value={0}>Inactive</option>
											</select>
										</div>
									</div>

									<Button
										variant='outline'
										size='sm'
										onClick={() => handleAddGrandchild(idx)}
										disabled={loading}
										data-testid={`add-grandchild-btn-${idx}`}
										className='mb-3'
									>
										<Plus className='w-4 h-4 mr-2' />
										Add Grandchild (Level 2)
									</Button>

									{child.grandchildren.length > 0 && (
										<div className='space-y-3'>
											{child.grandchildren.map((gc, gcIdx) => {
												const gcIsExisting = !!gc.isExisting;
												const gcNameErr = !gcIsExisting && touched ? validateName(gc.name) : null;
												const gcSlugErr = !gcIsExisting && touched ? validateSlug(gc.slug) : null;
												const gcSortErr = !gcIsExisting && touched ? validateSortOrder(gc.sortOrder) : null;
												const gcSlugDup = !gcIsExisting && touched && !gcSlugErr && isDuplicateSlug(gc.slug);

												return (
													<div key={gcIdx} className={`rounded border p-3 ${gcIsExisting ? 'border-border/50 bg-background-secondary/30 opacity-75' : 'border-border bg-background'}`}>
														<div className='flex items-center justify-between mb-2'>
															<span className='text-xs font-medium text-foreground-muted'>
																{gcIsExisting ? `Existing Grandchild ${gcIdx + 1}` : `New Grandchild`}
																{gcIsExisting && <span className='ml-2 text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded'>existing</span>}
															</span>
															{!gcIsExisting && (
																<button
																	type='button'
																	onClick={() => handleRemoveGrandchild(idx, gcIdx)}
																	className='p-1 text-red-500 hover:bg-red-50 rounded transition-colors'
																	title='Remove grandchild'
																>
																	<Trash2 className='w-3 h-3' />
																</button>
															)}
														</div>
														<div className='grid grid-cols-1 md:grid-cols-4 gap-3'>
															<div className='space-y-1'>
																<label className='text-sm text-foreground-muted'>Name {!gcIsExisting && <span className='text-red-500'>*</span>}</label>
																<input
																	value={gc.name}
																	onChange={e => handleGrandchildNameChange(idx, gcIdx, e.target.value)}
																	maxLength={MAX_NAME_LENGTH}
																	className={inputClass(!!gcNameErr)}
																	placeholder='e.g. Notifications'
																	disabled={gcIsExisting}
																	data-testid={`grandchild-name-${idx}-${gcIdx}`}
																/>
																<FieldError error={gcNameErr} />
															</div>
															<div className='space-y-1'>
																<label className='text-sm text-foreground-muted'>Slug {!gcIsExisting && <span className='text-red-500'>*</span>}</label>
																<input
																	value={gc.slug}
																	onChange={e => handleGrandchildSlugChange(idx, gcIdx, e.target.value)}
																	className={inputClass(!!gcSlugErr || gcSlugDup)}
																	placeholder='e.g. settings-notifications'
																	disabled={gcIsExisting}
																	data-testid={`grandchild-slug-${idx}-${gcIdx}`}
																/>
																<FieldError error={gcSlugErr} />
																{gcSlugDup && <FieldError error='Duplicate slug in form' />}
															</div>
															<div className='space-y-1'>
																<label className='text-sm text-foreground-muted'>Sort Order {!gcIsExisting && <span className='text-red-500'>*</span>}</label>
																<input
																	type='number'
																	min={MIN_SORT_ORDER}
																	max={MAX_SORT_ORDER}
																	value={gc.sortOrder}
																	onChange={e => {
																		resetError();
																		setChildren(prev => {
																			const next = [...prev];
																			const targetChild = next[idx];
																			const nextGrandchildren = [...targetChild.grandchildren];
																			nextGrandchildren[gcIdx] = { ...nextGrandchildren[gcIdx], sortOrder: e.target.value };
																			next[idx] = { ...targetChild, grandchildren: nextGrandchildren };
																			return next;
																		});
																	}}
																	className={inputClass(!!gcSortErr)}
																	disabled={gcIsExisting}
																	data-testid={`grandchild-sort-order-${idx}-${gcIdx}`}
																/>
																<FieldError error={gcSortErr} />
															</div>
															<div className='space-y-1'>
																<label className='text-sm text-foreground-muted'>Status</label>
																<select
																	value={gc.status}
																	onChange={e => {
																		const status = Number(e.target.value) as 1 | 0;
																		setChildren(prev => {
																			const next = [...prev];
																			const targetChild = next[idx];
																			const nextGrandchildren = [...targetChild.grandchildren];
																			nextGrandchildren[gcIdx] = { ...nextGrandchildren[gcIdx], status };
																			next[idx] = { ...targetChild, grandchildren: nextGrandchildren };
																			return next;
																		});
																	}}
																	className='w-full rounded border border-border bg-background px-3 py-2 text-sm'
																	disabled={gcIsExisting}
																	data-testid={`grandchild-status-${idx}-${gcIdx}`}
																>
																	<option value={1}>Active</option>
																	<option value={0}>Inactive</option>
																</select>
															</div>
														</div>
													</div>
												);
											})}
										</div>
									)}
								</div>
							);
						})}
					</div>

					<div className='mt-4'>
						<Button
							variant='outline'
							onClick={handleAddChild}
							disabled={loading}
							data-testid='add-child-btn'
						>
							<Plus className='w-4 h-4 mr-2' />
							Add Child
						</Button>
					</div>
				</div>

				{formError && (
					<div className='mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3 whitespace-pre-line' role='alert' data-testid='create-menu-form-error'>
						{formError}
					</div>
				)}

				<div className='flex justify-end space-x-3 mt-6'>
					<Button variant='outline' onClick={onClose} disabled={loading}>
						Cancel
					</Button>
					<Button onClick={handleSubmit} disabled={!canSubmit} loading={loading} data-testid='create-menu-submit'>
						Create
					</Button>
				</div>
			</div>
		</div>
	);
};
