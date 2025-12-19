/**
 * Facility Resource Modal Component for Add/Edit operations
 */

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button, FloatingInput } from '../../../components/ui';
import { ShiftApiService, FacilityResource } from '../../../services/shiftApi';

interface FacilityResourceModalProps {
	open: boolean;
	onClose: () => void;
	onSuccess: () => void;
	editingItem: FacilityResource | null;
}

export const FacilityResourceModal: React.FC<FacilityResourceModalProps> = ({
	open,
	onClose,
	onSuccess,
	editingItem,
}) => {
	const [name, setName] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);

	useEffect(() => {
		if (open) {
			if (editingItem) {
				setName(editingItem.name || '');
			} else {
				setName('');
			}
			setError(null);
		}
	}, [open, editingItem]);

	const validateForm = (): boolean => {
		if (!name.trim()) {
			setError('Resource name is required');
			return false;
		}
		setError(null);
		return true;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!validateForm()) return;

		setSubmitting(true);
		try {
			if (editingItem) {
				// Update existing resource (keep existing status)
				const response = await ShiftApiService.updateFacilityResource({
					id: editingItem.id,
					name,
					status: editingItem.status === 'Active' ? 1 : 0,
				});
				if (response.status === 'Success') {
					onSuccess();
				} else {
					setError(response.message || 'Failed to update facility resource');
				}
			} else {
				// Add new resource (status defaults to Active on backend)
				const response = await ShiftApiService.addFacilityResource({ name });
				if (response.status === 'Success') {
					onSuccess();
				} else {
					setError(response.message || 'Failed to add facility resource');
				}
			}
		} catch (error) {
			console.error('Failed to save facility resource:', error);
			setError('Failed to save facility resource. Please try again.');
		} finally {
			setSubmitting(false);
		}
	};

	if (!open) return null;

	return (
		<div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50'>
			<div className='bg-white rounded-lg shadow-xl w-full max-w-md mx-4'>
				{/* Header */}
				<div className='flex items-center justify-between p-6 border-b border-gray-200'>
					<h2 className='text-xl font-semibold text-gray-900'>
						{editingItem ? 'Edit Facility Resource' : 'Add Facility Resource'}
					</h2>
					<button
						onClick={onClose}
						className='text-gray-400 hover:text-gray-600 transition-colors'
						disabled={submitting}
					>
						<X className='w-5 h-5' />
					</button>
				</div>

				{/* Form */}
				<form onSubmit={handleSubmit} className='p-6'>
					{error && (
						<div className='mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm'>
							{error}
						</div>
					)}

					<div className='mb-6'>
						<FloatingInput
							label='Resource Name'
							type='text'
							value={name}
							onChange={setName}
							placeholder='Enter resource name (e.g., Truck-001)'
							required
							disabled={submitting}
						/>
					</div>

					{/* Actions */}
					<div className='flex justify-end gap-3'>
						<Button
							type='button'
							variant='outline'
							onClick={onClose}
							disabled={submitting}
						>
							Cancel
						</Button>
						<Button type='submit' variant='primary' loading={submitting} disabled={submitting}>
							{editingItem ? 'Update' : 'Add'}
						</Button>
					</div>
				</form>
			</div>
		</div>
	);
};

