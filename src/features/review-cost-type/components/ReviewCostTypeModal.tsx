import React, { useState, useEffect } from 'react';
import { FloatingInput, FloatingDropdown, Button } from '../../../components/ui';
import { X } from 'lucide-react';
import { PAndLApiService } from '../../../services/pAndLApi';
import { useAddReviewCostType, useUpdateReviewCostType } from '../hooks/useReviewCostTypeMutations';
import type { ReviewCostingType, CostCategory } from '../../../services/pAndLApi';
import { REVIEW_COST_TYPE_STATUS, STATUS_OPTIONS } from '../config/constants';

interface ReviewCostTypeModalProps {
	open: boolean;
	onClose: () => void;
	onSuccess: () => void;
	editingItem: ReviewCostingType | null;
}

export const ReviewCostTypeModal: React.FC<ReviewCostTypeModalProps> = ({
	open,
	onClose,
	onSuccess,
	editingItem,
}) => {
	const [name, setName] = useState('');
	const [reviewCategoryTypeId, setReviewCategoryTypeId] = useState('');
	const [status, setStatus] = useState<string>(REVIEW_COST_TYPE_STATUS.ACTIVE);
	const [costCategories, setCostCategories] = useState<CostCategory[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Use React Query mutations with optimistic updates
	const addMutation = useAddReviewCostType();
	const updateMutation = useUpdateReviewCostType();
	const isSubmitting = addMutation.isPending || updateMutation.isPending;

	const loadCostCategories = async () => {
		setLoading(true);
		try {
			const response = await PAndLApiService.getCostCategories(1);
			if (response.status_code === 200 && response.data) {
				setCostCategories(response.data);
			}
		} catch (err) {
			console.error('Error loading cost categories:', err);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		if (open) {
			const initializeModal = async () => {
				await loadCostCategories();
				if (editingItem) {
					setName(editingItem.name || '');
					setStatus(
						editingItem.status === REVIEW_COST_TYPE_STATUS.ACTIVE || editingItem.status === 'Active'
							? REVIEW_COST_TYPE_STATUS.ACTIVE
							: REVIEW_COST_TYPE_STATUS.INACTIVE
					);
					// Find category ID by matching name after categories are loaded
					const response = await PAndLApiService.getCostCategories(1);
					if (response.status_code === 200 && response.data) {
						const category = response.data.find(
							cat => cat.costCategories === editingItem.reviewCategoryName
						);
						if (category) {
							setReviewCategoryTypeId(String(category.id));
						}
					}
				} else {
					setName('');
					setReviewCategoryTypeId('');
					setStatus(REVIEW_COST_TYPE_STATUS.ACTIVE);
				}
				setError(null);
			};
			initializeModal();
		}
	}, [open, editingItem]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);

		if (!name.trim()) {
			setError('Cost type name is required');
			return;
		}

		if (!reviewCategoryTypeId) {
			setError('Cost category is required');
			return;
		}

		try {
			if (editingItem) {
				// Update existing item with optimistic update
				await updateMutation.mutateAsync({
					id: editingItem.id,
					name: name.trim(),
					reviewCategoryTypeId: parseInt(reviewCategoryTypeId),
					status: parseInt(status),
				});
				onSuccess();
			} else {
				// Add new item with optimistic update
				await addMutation.mutateAsync({
					name: name.trim(),
					reviewCategoryTypeId: parseInt(reviewCategoryTypeId),
				});
				onSuccess();
			}
		} catch (err: unknown) {
			const errorMessage = err instanceof Error ? err.message : 'Failed to save cost type';
			setError(errorMessage);
			console.error('Error saving cost type:', err);
		}
	};

	if (!open) return null;

	const categoryOptions = costCategories.map(cat => ({
		value: String(cat.id),
		label: cat.costCategories,
	}));

	// Filter out "All" option for modal (only Active/Inactive needed)
	const statusOptions = STATUS_OPTIONS.filter(opt => opt.value !== REVIEW_COST_TYPE_STATUS.ALL);

	return (
		<div
			className='fixed inset-0 bg-black/50 flex items-center justify-center z-50'
			onClick={onClose}
		>
			<div
				className='bg-white rounded-lg p-6 max-w-md w-full mx-4'
				onClick={e => e.stopPropagation()}
			>
				<div className='flex items-center justify-between mb-6'>
					<h3 className='text-xl font-semibold text-gray-900'>
						{editingItem ? 'Edit Cost Type' : 'Add Cost Type'}
					</h3>
					<button onClick={onClose} className='p-1 hover:bg-gray-100 rounded transition-colors'>
						<X className='w-5 h-5 text-gray-500' />
					</button>
				</div>

				<form onSubmit={handleSubmit} className='space-y-4'>
					<FloatingInput
						label='Cost Type'
						value={name}
						onChange={setName}
						required
						error={!!(error && !name.trim())}
						errorMessage={error && !name.trim() ? error : undefined}
					/>

					<FloatingDropdown
						label='Cost Category'
						options={categoryOptions}
						value={reviewCategoryTypeId}
						onChange={setReviewCategoryTypeId}
						loading={loading}
						required
						error={!!(error && !reviewCategoryTypeId)}
						errorMessage={error && !reviewCategoryTypeId ? error : undefined}
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
						<Button
							type='submit'
							disabled={isSubmitting}
							className='bg-green-600 hover:bg-green-700 text-white'
						>
							{isSubmitting ? 'Saving...' : editingItem ? 'Update' : 'Add'}
						</Button>
					</div>
				</form>
			</div>
		</div>
	);
};
