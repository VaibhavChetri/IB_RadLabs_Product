/**
 * Container Modal Component for Add/Edit operations
 */

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button, FloatingInput, FloatingDropdown } from '../../../components/ui';
import { useAddContainerType, useUpdateContainerType } from '../hooks/useContainerMutations';
import { useCities } from '../../../hooks/useLocationData';
import { IMPACT_ACCOUNTABLE_OPTIONS } from '../config/constants';
import type { ContainerType } from '../../../services/containerApi';

interface ContainerModalProps {
	open: boolean;
	onClose: () => void;
	onSuccess: () => void;
	editingItem: ContainerType | null;
}

export const ContainerModal: React.FC<ContainerModalProps> = ({
	open,
	onClose,
	onSuccess,
	editingItem,
}) => {
	const [container, setContainer] = useState('');
	const [weight, setWeight] = useState('');
	const [cityId, setCityId] = useState('');
	const [dishwasherCyclesPerDay, setDishwasherCyclesPerDay] = useState('');
	const [dishwasherOptimumCapacity, setDishwasherOptimumCapacity] = useState('');
	const [weightInGms, setWeightInGms] = useState('');
	const [impactAccountable, setImpactAccountable] = useState('1');
	const [error, setError] = useState<string | null>(null);

	const { cities, loading: citiesLoading } = useCities();

	// Use React Query mutations
	const addMutation = useAddContainerType();
	const updateMutation = useUpdateContainerType();
	const isSubmitting = addMutation.isPending || updateMutation.isPending;

	useEffect(() => {
		if (open) {
			if (editingItem) {
				setContainer(editingItem.sku || editingItem.container || '');
				setWeight(String(editingItem.weight || ''));
				setCityId(String(editingItem.city_id || ''));
				setDishwasherCyclesPerDay(String(editingItem.dishwasherCyclesPerDay || ''));
				setDishwasherOptimumCapacity(String(editingItem.dishwasherOptimumCapacity || ''));
				setWeightInGms(String(editingItem.weightInGms || ''));
				setImpactAccountable(String(editingItem.impact_accountable || '1'));
			} else {
				setContainer('');
				setWeight('');
				setCityId('');
				setDishwasherCyclesPerDay('');
				setDishwasherOptimumCapacity('');
				setWeightInGms('');
				setImpactAccountable('1');
			}
			setError(null);
		}
	}, [open, editingItem]);

	// Auto-calculate weightInGms when weight changes
	useEffect(() => {
		if (weight && !editingItem) {
			const weightNum = parseFloat(weight);
			if (!isNaN(weightNum)) {
				setWeightInGms(String(weightNum * 1000));
			}
		}
	}, [weight, editingItem]);

	const validateForm = (): boolean => {
		if (!container.trim()) {
			setError('Container name is required');
			return false;
		}
		if (!weight.trim() || isNaN(parseFloat(weight)) || parseFloat(weight) <= 0) {
			setError('Valid weight is required');
			return false;
		}
		if (!cityId) {
			setError('City is required');
			return false;
		}
		if (!dishwasherCyclesPerDay.trim() || isNaN(parseInt(dishwasherCyclesPerDay)) || parseInt(dishwasherCyclesPerDay) <= 0) {
			setError('Valid dishwasher cycles per day is required');
			return false;
		}
		if (!dishwasherOptimumCapacity.trim() || isNaN(parseInt(dishwasherOptimumCapacity)) || parseInt(dishwasherOptimumCapacity) <= 0) {
			setError('Valid dishwasher optimum capacity is required');
			return false;
		}
		if (!weightInGms.trim() || isNaN(parseFloat(weightInGms)) || parseFloat(weightInGms) <= 0) {
			setError('Valid weight in grams is required');
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
			const payload = {
				container: container.trim(),
				weight: parseFloat(weight),
				city_id: parseInt(cityId),
				dishwasherCyclesPerDay: parseInt(dishwasherCyclesPerDay),
				dishwasherOptimumCapacity: parseInt(dishwasherOptimumCapacity),
				weightInGms: parseFloat(weightInGms),
				impact_accountable: parseInt(impactAccountable),
			};

			if (editingItem) {
				// Update existing container
				await updateMutation.mutateAsync({
					id: editingItem.id,
					...payload,
				});
				onSuccess();
			} else {
				// Add new container
				await addMutation.mutateAsync(payload);
				onSuccess();
			}
		} catch (err: unknown) {
			const errorMessage = err instanceof Error ? err.message : 'Failed to save container type';
			setError(errorMessage);
			console.error('Error saving container type:', err);
		}
	};

	if (!open) return null;

	return (
		<div
			className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto'
			onClick={onClose}
		>
			<div
				className='bg-white rounded-lg p-6 max-w-2xl w-full mx-4 my-8'
				onClick={e => e.stopPropagation()}
			>
				<div className='flex items-center justify-between mb-6'>
					<h3 className='text-xl font-semibold text-gray-900'>
						{editingItem ? 'Edit Container Type' : 'Add Container Type'}
					</h3>
					<button onClick={onClose} className='p-1 hover:bg-gray-100 rounded transition-colors'>
						<X className='w-5 h-5 text-gray-500' />
					</button>
				</div>

				<form onSubmit={handleSubmit} className='space-y-4'>
					<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
						<FloatingInput
							label='Container Name'
							value={container}
							onChange={setContainer}
							required
							error={!!(error && !container.trim())}
							errorMessage={error && !container.trim() ? error : undefined}
						/>

						<FloatingDropdown
							label='City'
							options={cities}
							value={cityId}
							onChange={setCityId}
							loading={citiesLoading}
							required
							error={!!(error && !cityId)}
							errorMessage={error && !cityId ? error : undefined}
						/>

						<FloatingInput
							label='Weight'
							value={weight}
							onChange={setWeight}
							type='number'
							step='0.01'
							required
							error={!!(error && (!weight.trim() || isNaN(parseFloat(weight)) || parseFloat(weight) <= 0))}
							errorMessage={error && (!weight.trim() || isNaN(parseFloat(weight)) || parseFloat(weight) <= 0) ? error : undefined}
						/>

						<FloatingInput
							label='Weight (grams)'
							value={weightInGms}
							onChange={setWeightInGms}
							type='number'
							step='1'
							required
							error={!!(error && (!weightInGms.trim() || isNaN(parseFloat(weightInGms)) || parseFloat(weightInGms) <= 0))}
							errorMessage={error && (!weightInGms.trim() || isNaN(parseFloat(weightInGms)) || parseFloat(weightInGms) <= 0) ? error : undefined}
						/>

						<FloatingInput
							label='Dishwasher Cycles Per Day'
							value={dishwasherCyclesPerDay}
							onChange={setDishwasherCyclesPerDay}
							type='number'
							step='1'
							required
							error={!!(error && (!dishwasherCyclesPerDay.trim() || isNaN(parseInt(dishwasherCyclesPerDay)) || parseInt(dishwasherCyclesPerDay) <= 0))}
							errorMessage={error && (!dishwasherCyclesPerDay.trim() || isNaN(parseInt(dishwasherCyclesPerDay)) || parseInt(dishwasherCyclesPerDay) <= 0) ? error : undefined}
						/>

						<FloatingInput
							label='Dishwasher Optimum Capacity'
							value={dishwasherOptimumCapacity}
							onChange={setDishwasherOptimumCapacity}
							type='number'
							step='1'
							required
							error={!!(error && (!dishwasherOptimumCapacity.trim() || isNaN(parseInt(dishwasherOptimumCapacity)) || parseInt(dishwasherOptimumCapacity) <= 0))}
							errorMessage={error && (!dishwasherOptimumCapacity.trim() || isNaN(parseInt(dishwasherOptimumCapacity)) || parseInt(dishwasherOptimumCapacity) <= 0) ? error : undefined}
						/>

						<FloatingDropdown
							label='Impact Accountable'
							options={IMPACT_ACCOUNTABLE_OPTIONS.map(opt => ({
								value: String(opt.value),
								label: opt.label,
							}))}
							value={impactAccountable}
							onChange={setImpactAccountable}
							required
						/>
					</div>

					{error && !error.includes('required') && !error.includes('Valid') && (
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










