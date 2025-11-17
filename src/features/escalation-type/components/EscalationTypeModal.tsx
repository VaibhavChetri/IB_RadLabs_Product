import React, { useState, useEffect } from 'react';
import { FloatingInput, FloatingDropdown, Button } from '../../../components/ui';
import { X } from 'lucide-react';
import { useAddEscalationType, useUpdateEscalationType } from '../hooks/useEscalationTypeMutations';
import type { EscalationType } from '../../../services/transitPlanApi';
import { ESCALATION_TYPE_STATUS, STATUS_OPTIONS } from '../config/constants';

interface EscalationTypeModalProps {
	open: boolean;
	onClose: () => void;
	onSuccess: () => void;
	editingItem: EscalationType | null;
}

export const EscalationTypeModal: React.FC<EscalationTypeModalProps> = ({
	open,
	onClose,
	onSuccess,
	editingItem,
}) => {
	const [name, setName] = useState('');
	const [status, setStatus] = useState<string>(ESCALATION_TYPE_STATUS.ACTIVE);
	const [error, setError] = useState<string | null>(null);

	// Use React Query mutations with optimistic updates
	const addMutation = useAddEscalationType();
	const updateMutation = useUpdateEscalationType();
	const isSubmitting = addMutation.isPending || updateMutation.isPending;

	useEffect(() => {
		if (open) {
			if (editingItem) {
				setName(editingItem.name || '');
				setStatus(
					editingItem.status === ESCALATION_TYPE_STATUS.ACTIVE || editingItem.status === 'Active'
						? ESCALATION_TYPE_STATUS.ACTIVE
						: ESCALATION_TYPE_STATUS.INACTIVE
				);
			} else {
				setName('');
				setStatus(ESCALATION_TYPE_STATUS.ACTIVE);
			}
			setError(null);
		}
	}, [open, editingItem]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);

		if (!name.trim()) {
			setError('Escalation type name is required');
			return;
		}

		try {
			if (editingItem) {
				// Update existing item with optimistic update
				const statusNumber = status === ESCALATION_TYPE_STATUS.ACTIVE ? 1 : 0;
				await updateMutation.mutateAsync({
					id: editingItem.id,
					name: name.trim(),
					status: statusNumber,
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
			const errorMessage = err instanceof Error ? err.message : 'Failed to save escalation type';
			setError(errorMessage);
			console.error('Error saving escalation type:', err);
		}
	};

	if (!open) return null;

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
						{editingItem ? 'Edit Escalation Type' : 'Add Escalation Type'}
					</h3>
					<button onClick={onClose} className='p-1 hover:bg-gray-100 rounded transition-colors'>
						<X className='w-5 h-5 text-gray-500' />
					</button>
				</div>

				<form onSubmit={handleSubmit} className='space-y-4'>
					<FloatingInput
						label='Escalation Type Name'
						value={name}
						onChange={setName}
						required
						error={!!(error && !name.trim())}
						errorMessage={error && !name.trim() ? error : undefined}
					/>

					{editingItem && (
						<FloatingDropdown
							label='Status'
							options={STATUS_OPTIONS.filter(opt => opt.value !== ESCALATION_TYPE_STATUS.ALL)}
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
						<Button type='submit' disabled={isSubmitting} variant='primary'>
							{isSubmitting ? 'Saving...' : editingItem ? 'Update' : 'Add'}
						</Button>
					</div>
				</form>
			</div>
		</div>
	);
};
