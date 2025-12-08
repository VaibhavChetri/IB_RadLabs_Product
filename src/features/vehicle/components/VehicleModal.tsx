/**
 * Vehicle Modal Component for Add/Edit operations
 */

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button, FloatingInput } from '../../../components/ui';
import { useAddVehicle, useUpdateVehicle } from '../hooks/useVehicleMutations';
import type { Vehicle } from '../../../services/vehicleApi';

interface VehicleModalProps {
	open: boolean;
	onClose: () => void;
	onSuccess: () => void;
	editingItem: Vehicle | null;
}

export const VehicleModal: React.FC<VehicleModalProps> = ({
	open,
	onClose,
	onSuccess,
	editingItem,
}) => {
	const [name, setName] = useState('');
	const [driverName, setDriverName] = useState('');
	const [driverPhone, setDriverPhone] = useState('');
	const [vehicleNumber, setVehicleNumber] = useState('');
	const [error, setError] = useState<string | null>(null);

	// Use React Query mutations
	const addMutation = useAddVehicle();
	const updateMutation = useUpdateVehicle();
	const isSubmitting = addMutation.isPending || updateMutation.isPending;

	useEffect(() => {
		if (open) {
			if (editingItem) {
				setName(editingItem.name || '');
				setDriverName(editingItem.driver_name || '');
				setDriverPhone(editingItem.driver_phone || '');
				setVehicleNumber(editingItem.vehicle_number || '');
			} else {
				setName('');
				setDriverName('');
				setDriverPhone('');
				setVehicleNumber('');
			}
			setError(null);
		}
	}, [open, editingItem]);

	const validateForm = (): boolean => {
		if (!name.trim()) {
			setError('Vehicle name is required');
			return false;
		}
		if (!driverName.trim()) {
			setError('Driver name is required');
			return false;
		}
		if (!driverPhone.trim()) {
			setError('Driver phone is required');
			return false;
		}
		// Validate phone number: 10-12 digits
		const phoneRegex = /^\d{10,12}$/;
		if (!phoneRegex.test(driverPhone.trim())) {
			setError('Driver phone must be 10-12 digits');
			return false;
		}
		if (!vehicleNumber.trim()) {
			setError('Vehicle number is required');
			return false;
		}
		return true;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);

		if (!validateForm()) {
			return;
		}

		try {
			if (editingItem) {
				// Update existing vehicle
				await updateMutation.mutateAsync({
					id: editingItem.id,
					name: name.trim(),
					driver_name: driverName.trim(),
					driver_phone: driverPhone.trim(),
					vehicle_number: vehicleNumber.trim(),
				});
				onSuccess();
			} else {
				// Add new vehicle
				await addMutation.mutateAsync({
					name: name.trim(),
					driver_name: driverName.trim(),
					driver_phone: driverPhone.trim(),
					vehicle_number: vehicleNumber.trim(),
				});
				onSuccess();
			}
		} catch (err: unknown) {
			const errorMessage = err instanceof Error ? err.message : 'Failed to save vehicle';
			setError(errorMessage);
			console.error('Error saving vehicle:', err);
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
						{editingItem ? 'Edit Vehicle' : 'Add Vehicle'}
					</h3>
					<button onClick={onClose} className='p-1 hover:bg-gray-100 rounded transition-colors'>
						<X className='w-5 h-5 text-gray-500' />
					</button>
				</div>

				<form onSubmit={handleSubmit} className='space-y-4'>
					<FloatingInput
						label='Vehicle Name'
						value={name}
						onChange={setName}
						required
						error={!!(error && !name.trim())}
						errorMessage={error && !name.trim() ? error : undefined}
					/>

					<FloatingInput
						label='Driver Name'
						value={driverName}
						onChange={setDriverName}
						required
						error={!!(error && !driverName.trim())}
						errorMessage={error && !driverName.trim() ? error : undefined}
					/>

					<FloatingInput
						label='Driver Phone'
						value={driverPhone}
						onChange={setDriverPhone}
						required
						error={!!(error && (!driverPhone.trim() || !/^\d{10,12}$/.test(driverPhone.trim())))}
						errorMessage={
							error && (!driverPhone.trim() || !/^\d{10,12}$/.test(driverPhone.trim()))
								? error
								: undefined
						}
					/>

					<FloatingInput
						label='Vehicle Number'
						value={vehicleNumber}
						onChange={setVehicleNumber}
						required
						error={!!(error && !vehicleNumber.trim())}
						errorMessage={error && !vehicleNumber.trim() ? error : undefined}
					/>

					{error && error.includes('required') === false && error.includes('digits') === false && (
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

