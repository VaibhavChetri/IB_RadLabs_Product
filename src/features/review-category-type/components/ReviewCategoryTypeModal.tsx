import React, { useState, useEffect } from 'react';
import { FloatingInput, FloatingDropdown, Button } from '../../../components/ui';
import { X } from 'lucide-react';
import { useAddReviewCategoryType, useUpdateReviewCategoryType } from '../hooks/useReviewCategoryTypeMutations';
import type { ReviewCategoryType } from '../../../services/pAndLApi';
import { REVIEW_CATEGORY_TYPE_STATUS, STATUS_OPTIONS } from '../config/constants';

interface ReviewCategoryTypeModalProps {
	open: boolean;
	onClose: () => void;
	onSuccess: () => void;
	editingItem: ReviewCategoryType | null;
}

export const ReviewCategoryTypeModal: React.FC<ReviewCategoryTypeModalProps> = ({
	open,
	onClose,
	onSuccess,
	editingItem,
}) => {
	const [name, setName] = useState('');
	const [status, setStatus] = useState<string>(REVIEW_CATEGORY_TYPE_STATUS.ACTIVE);
	const [error, setError] = useState<string | null>(null);

	// Use React Query mutations with optimistic updates
	const addMutation = useAddReviewCategoryType();
	const updateMutation = useUpdateReviewCategoryType();
	const isSubmitting = addMutation.isPending || updateMutation.isPending;

	useEffect(() => {
		if (open) {
			if (editingItem) {
				setName(editingItem.name || '');
				setStatus(
					editingItem.status === REVIEW_CATEGORY_TYPE_STATUS.ACTIVE || editingItem.status === 'Active'
						? REVIEW_CATEGORY_TYPE_STATUS.ACTIVE
						: REVIEW_CATEGORY_TYPE_STATUS.INACTIVE
				);
			} else {
				setName('');
				setStatus(REVIEW_CATEGORY_TYPE_STATUS.ACTIVE);
			}
			setError(null);
		}
	}, [open, editingItem]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);

		if (!name.trim()) {
			setError('Category name is required');
			return;
		}

		try {
			if (editingItem) {
				// Update existing item with optimistic update
				await updateMutation.mutateAsync({
					id: editingItem.id,
					name: name.trim(),
					status: parseInt(status),
				});
				onSuccess();
			} else {
				// Add new item with optimistic update
				await addMutation.mutateAsync({
					name: name.trim(),
				});
				onSuccess();
			}
		} catch (err: unknown) {
			const errorMessage = err instanceof Error ? err.message : 'Failed to save category type';
			setError(errorMessage);
			console.error('Error saving category type:', err);
		}
	};

	if (!open) return null;

	const statusOptions = STATUS_OPTIONS.filter(opt => opt.value !== REVIEW_CATEGORY_TYPE_STATUS.ALL);

	return (
		<div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50' onClick={onClose}>
			<div className='bg-white rounded-lg p-6 max-w-md w-full mx-4' onClick={e => e.stopPropagation()}>
				<div className='flex items-center justify-between mb-6'>
					<h3 className='text-xl font-semibold text-gray-900'>
						{editingItem ? 'Edit Category Type' : 'Add Category Type'}
					</h3>
					<button onClick={onClose} className='p-1 hover:bg-gray-100 rounded transition-colors'>
						<X className='w-5 h-5 text-gray-500' />
					</button>
				</div>

				<form onSubmit={handleSubmit} className='space-y-4'>
					<FloatingInput
						label='Category Name'
						value={name}
						onChange={setName}
						required
						error={!!(error && !name.trim())}
						errorMessage={error && !name.trim() ? error : undefined}
					/>

					{editingItem && (
						<FloatingDropdown
							label='Status'
							options={statusOptions}
							value={status}
							onChange={setStatus}
							required
						/>
					)}

					{error && error.includes('required') === false && (
						<div className='text-red-600 text-sm'>{error}</div>
					)}

					<div className='flex justify-end space-x-3 mt-6'>
						<Button type='button' variant='outline' onClick={onClose} disabled={isSubmitting}>
							Cancel
						</Button>
						<Button type='submit' disabled={isSubmitting} className='bg-green-600 hover:bg-green-700 text-white'>
							{isSubmitting ? 'Saving...' : editingItem ? 'Update' : 'Add'}
						</Button>
					</div>
				</form>
			</div>
		</div>
	);
};

