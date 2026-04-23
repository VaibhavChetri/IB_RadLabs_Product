import React, { useEffect, useState } from 'react';
import { X, ChevronRight } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Menu } from '../../services/menuManagementApi';

const SLUG_REGEX = /^[a-z0-9-]+$/;
const MAX_NAME_LENGTH = 255;

interface EditMenuModalProps {
	isOpen: boolean;
	menu: Menu | null;
	allMenus?: Menu[];
	onClose: () => void;
	onSubmit: (id: number, data: { name?: string; slug?: string }) => Promise<void>;
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

const inputClass = (hasError: boolean) =>
	`w-full rounded border ${hasError ? 'border-red-500' : 'border-border'} bg-background px-3 py-2 text-sm`;

const FieldError: React.FC<{ error: string | null }> = ({ error }) =>
	error ? <p className='text-xs text-red-500 mt-0.5'>{error}</p> : null;

export const EditMenuModal: React.FC<EditMenuModalProps> = ({
	isOpen,
	menu,
	allMenus: _,
	onClose,
	onSubmit,
	loading,
}) => {
	const [name, setName] = useState('');
	const [slug, setSlug] = useState('');
	const [touched, setTouched] = useState(false);
	const [formError, setFormError] = useState('');

	// Populate form when modal opens with menu data
	useEffect(() => {
		if (isOpen && menu) {
			setName(menu.name);
			setSlug(menu.slug);
			setTouched(false);
			setFormError('');
		}
	}, [isOpen, menu]);

	if (!isOpen || !menu) return null;

	const nameErr = touched ? validateName(name) : null;
	const slugErr = touched ? validateSlug(slug) : null;

	const handleSubmit = async () => {
		setTouched(true);
		setFormError('');

		const errors: string[] = [];
		const ne = validateName(name);
		const se = validateSlug(slug);
		if (ne) errors.push(ne);
		if (se) errors.push(se);

		if (errors.length > 0) {
			setFormError(errors.join('. '));
			return;
		}

		await onSubmit(menu.id, {
			name: name.trim(),
			slug: slug.trim(),
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
