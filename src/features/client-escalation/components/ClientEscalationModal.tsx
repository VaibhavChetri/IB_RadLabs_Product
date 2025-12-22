import React, { useState, useEffect } from 'react';
import { FloatingInput, FloatingDropdown, Button } from '../../../components/ui';
import { X } from 'lucide-react';
import { useAddClientEscalation, useUpdateClientEscalation } from '../hooks/useClientEscalationMutations';
import type { ClientEscalation } from '../../../services/transitPlanApi';
import { CommonApiService } from '../../../services/commonApi';
import { EscalationTypeService } from '../../../services/transitPlanApi';
import { SkuApiService } from '../../../services/skuApi';

interface ClientEscalationModalProps {
	open: boolean;
	onClose: () => void;
	onSuccess: () => void;
	editingItem: ClientEscalation | null;
}

export const ClientEscalationModal: React.FC<ClientEscalationModalProps> = ({
	open,
	onClose,
	onSuccess,
	editingItem,
}) => {
	const [escalationDate, setEscalationDate] = useState<string>('');
	const [facilityId, setFacilityId] = useState<string>('');
	const [clientId, setClientId] = useState<string>('');
	const [escalationTypeId, setEscalationTypeId] = useState<string>('');
	const [sku, setSku] = useState<string>('');
	const [raisedBy, setRaisedBy] = useState<string>('');
	const [clientDesignation, setClientDesignation] = useState<string>('');
	const [details, setDetails] = useState<string>('');
	const [resolution, setResolution] = useState<string>('');
	const [resolutionStatusId, setResolutionStatusId] = useState<string>('');

	// Dropdown options
	const [facilities, setFacilities] = useState<Array<{ value: string; label: string }>>([]);
	const [clients, setClients] = useState<Array<{ value: string; label: string }>>([]);
	const [escalationTypes, setEscalationTypes] = useState<Array<{ value: string; label: string }>>([]);
	const [skuOptions, setSkuOptions] = useState<Array<{ value: string; label: string }>>([]);
	const [loadingFacilities, setLoadingFacilities] = useState(false);
	const [loadingClients, setLoadingClients] = useState(false);
	const [loadingEscalationTypes, setLoadingEscalationTypes] = useState(false);
	const [loadingSkus, setLoadingSkus] = useState(false);

	const [error, setError] = useState<string | null>(null);

	const addMutation = useAddClientEscalation();
	const updateMutation = useUpdateClientEscalation();
	const isSubmitting = addMutation.isPending || updateMutation.isPending;

	// Load dropdown data
	useEffect(() => {
		if (open) {
			// Load facilities
			setLoadingFacilities(true);
			CommonApiService.getFacilities()
				.then(response => {
					// Handle both status_code and statusCode (API inconsistency)
					const isSuccess = response.status_code === 200 || (response as any).statusCode === 200 || response.status === 'Success';
					if (isSuccess && response.data && Array.isArray(response.data)) {
						setFacilities(
							response.data.map((f: any) => ({
								value: f.id?.toString() || '',
								label: f.location || f.name || '',
							})).filter(f => f.value) // Filter out invalid entries
						);
					} else {
						console.warn('Failed to load facilities - unexpected response:', response);
						setFacilities([]);
					}
				})
				.catch(err => {
					console.error('Error loading facilities:', err);
					setFacilities([]);
				})
				.finally(() => setLoadingFacilities(false));

			// Load clients
			setLoadingClients(true);
			CommonApiService.getClients()
				.then(response => {
					// Handle both status_code and statusCode (API inconsistency)
					const isSuccess = response.status_code === 200 || (response as any).statusCode === 200 || response.status === 'Success';
					if (isSuccess && response.data && Array.isArray(response.data)) {
						setClients(
							response.data.map((c: any) => ({
								value: c.id?.toString() || '',
								label: c.location || c.name || '',
							})).filter(c => c.value) // Filter out invalid entries
						);
					} else {
						console.warn('Failed to load clients - unexpected response:', response);
						setClients([]);
					}
				})
				.catch(err => {
					console.error('Error loading clients:', err);
					setClients([]);
				})
				.finally(() => setLoadingClients(false));

			// Load escalation types
			setLoadingEscalationTypes(true);
			EscalationTypeService.getEscalationTypes()
				.then(response => {
					if (response.status_code === 200 && response.data && Array.isArray(response.data)) {
						setEscalationTypes(
							response.data.map((et: any) => ({
								value: et.id?.toString() || '',
								label: et.name || '',
							})).filter(et => et.value) // Filter out invalid entries
						);
					} else {
						console.warn('Failed to load escalation types - unexpected response:', response);
						setEscalationTypes([]);
					}
				})
				.catch(err => {
					console.error('Error loading escalation types:', err);
					setEscalationTypes([]);
				})
				.finally(() => setLoadingEscalationTypes(false));
		}
	}, [open]);

	// Set default date to today
	useEffect(() => {
		if (open && !editingItem) {
			const today = new Date().toISOString().split('T')[0];
			setEscalationDate(today);
		}
	}, [open, editingItem]);

	// Load SKU mappings when client is selected
	useEffect(() => {
		if (open && clientId) {
			setLoadingSkus(true);
			
			// Clear SKU when client changes (only for add mode)
			if (!editingItem) {
				setSku('');
			}

			SkuApiService.getClientSkuMap(parseInt(clientId))
				.then(response => {
					// Handle both status_code and statusCode (API inconsistency)
					const isSuccess = response.status_code === 200 || (response as any).statusCode === 200 || response.status === 'Success';
					if (isSuccess) {
						// API returns result array with containerTypeId and containerType
						const result = (response as any).result || (response as any).data || [];
						if (Array.isArray(result) && result.length > 0) {
							// Map to dropdown options: containerTypeId as value, containerType as label
							const options = result.map((item: any) => ({
								value: item.containerTypeId?.toString() || '',
								label: item.containerType || item.containerTypeName || `SKU ${item.containerTypeId}`,
							})).filter(opt => opt.value); // Filter out invalid entries

							setSkuOptions(options);
						} else {
							setSkuOptions([]);
							console.warn('No SKU mappings found for client:', clientId);
						}
					} else {
						console.warn('Failed to load SKU mappings - unexpected response:', response);
						setSkuOptions([]);
					}
				})
				.catch(err => {
					console.error('Error loading SKU mappings:', err);
					setSkuOptions([]);
				})
				.finally(() => setLoadingSkus(false));
		} else if (open && !clientId) {
			// Clear SKU options when client is deselected
			setSkuOptions([]);
			if (!editingItem) {
				setSku('');
			}
		}
	}, [open, clientId, editingItem]);

	// Populate form when editing
	useEffect(() => {
		if (open) {
			if (editingItem) {
				setEscalationDate(editingItem.escalation_date || '');
				setFacilityId(editingItem.facility_id?.toString() || '');
				setClientId(editingItem.client_id?.toString() || '');
				setEscalationTypeId(editingItem.escalation_type_id?.toString() || '');
				setSku(editingItem.containerTypeId?.toString() || editingItem.sku?.toString() || '');
				setRaisedBy(editingItem.raised_by || '');
				setClientDesignation(editingItem.client_designation || '');
				setDetails(editingItem.details || '');
				setResolution(editingItem.resolution || '');
				setResolutionStatusId(editingItem.resolutionStatusId?.toString() || '');
			} else {
				// Reset form for new escalation
				const today = new Date().toISOString().split('T')[0];
				setEscalationDate(today);
				setFacilityId('');
				setClientId('');
				setEscalationTypeId('');
				setSku('');
				setRaisedBy('');
				setClientDesignation('');
				setDetails('');
				setResolution('');
				setResolutionStatusId('');
			}
			setError(null);
		}
	}, [open, editingItem]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);

		// Validation
		if (!escalationDate) {
			setError('Escalation date is required');
			return;
		}
		if (!facilityId) {
			setError('Washing facility is required');
			return;
		}
		if (!clientId) {
			setError('Client is required');
			return;
		}
		if (!escalationTypeId) {
			setError('Escalation type is required');
			return;
		}
		if (!sku) {
			setError('SKU is required');
			return;
		}
		if (!raisedBy.trim()) {
			setError('Raised by is required');
			return;
		}
		if (!clientDesignation.trim()) {
			setError('Client designation is required');
			return;
		}
		if (!details.trim()) {
			setError('Details is required');
			return;
		}

		try {
			if (editingItem) {
				await updateMutation.mutateAsync({
					id: editingItem.id,
					escalation_date: escalationDate,
					client_id: parseInt(clientId),
					sku: parseInt(sku),
					escalation_type_id: parseInt(escalationTypeId),
					details: details.trim(),
					raised_by: raisedBy.trim(),
					client_designation: clientDesignation.trim(),
					resolution: resolution.trim() || undefined,
					resolution_status_id: resolutionStatusId ? parseInt(resolutionStatusId) : undefined,
					facility_id: parseInt(facilityId),
				});
			} else {
				await addMutation.mutateAsync({
					facility_id: parseInt(facilityId),
					sku: parseInt(sku),
					escalation_date: escalationDate,
					client_id: parseInt(clientId),
					details: details.trim(),
					raised_by: raisedBy.trim(),
					client_designation: clientDesignation.trim(),
					escalation_type_id: parseInt(escalationTypeId),
				});
			}
			onSuccess();
		} catch (err: unknown) {
			const errorMessage = err instanceof Error ? err.message : 'Failed to save client escalation';
			setError(errorMessage);
			console.error('Error saving client escalation:', err);
		}
	};

	if (!open) return null;

	const resolutionStatusOptions = [
		{ value: '1', label: 'Open' },
		{ value: '2', label: 'Resolved' },
		{ value: '3', label: 'Closed' },
	];

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
						{editingItem ? 'Edit Client Escalation' : 'Add Client Escalation'}
					</h3>
					<button onClick={onClose} className='p-1 hover:bg-gray-100 rounded transition-colors'>
						<X className='w-5 h-5 text-gray-500' />
					</button>
				</div>

				<form onSubmit={handleSubmit} className='space-y-4'>
					<div className='grid grid-cols-2 gap-4'>
						<FloatingInput
							label='Escalation Date'
							type='date'
							value={escalationDate}
							onChange={setEscalationDate}
							required
							error={!!(error && !escalationDate)}
							errorMessage={error && !escalationDate ? error : undefined}
						/>

						<FloatingDropdown
							label='Washing Facility'
							options={facilities}
							value={facilityId}
							onChange={setFacilityId}
							loading={loadingFacilities}
							placeholder='Select Facility'
							required
							error={!!(error && !facilityId)}
							errorMessage={error && !facilityId ? error : undefined}
						/>
					</div>

					<div className='grid grid-cols-2 gap-4'>
						<FloatingDropdown
							label='Client'
							options={clients}
							value={clientId}
							onChange={setClientId}
							loading={loadingClients}
							placeholder='Select Client'
							required
							error={!!(error && !clientId)}
							errorMessage={error && !clientId ? error : undefined}
						/>

						<FloatingDropdown
							label='Escalation Type'
							options={escalationTypes}
							value={escalationTypeId}
							onChange={setEscalationTypeId}
							loading={loadingEscalationTypes}
							placeholder='Select Escalation Type'
							required
							error={!!(error && !escalationTypeId)}
							errorMessage={error && !escalationTypeId ? error : undefined}
						/>
					</div>

					{editingItem ? (
						// For edit mode, show as dropdown with client's mapped SKUs
						<FloatingDropdown
							label='SKU'
							options={skuOptions}
							value={sku}
							onChange={setSku}
							loading={loadingSkus}
							placeholder={clientId ? (loadingSkus ? 'Loading SKUs...' : skuOptions.length === 0 ? 'No SKUs mapped for this client' : 'Select SKU') : 'Select Client first'}
							required
							disabled={!clientId || loadingSkus}
							error={!!(error && !sku)}
							errorMessage={error && !sku ? error : undefined}
						/>
					) : (
						// For add mode, show as dropdown (only mapped SKUs for selected client)
						<FloatingDropdown
							label='SKU'
							options={skuOptions}
							value={sku}
							onChange={setSku}
							loading={loadingSkus}
							placeholder={clientId ? (loadingSkus ? 'Loading SKUs...' : skuOptions.length === 0 ? 'No SKUs mapped for this client' : 'Select SKU') : 'Select Client first'}
							required
							disabled={!clientId || skuOptions.length === 0}
							error={!!(error && !sku)}
							errorMessage={error && !sku ? error : undefined}
						/>
					)}

					<div className='grid grid-cols-2 gap-4'>
						<FloatingInput
							label='Raised By'
							value={raisedBy}
							onChange={setRaisedBy}
							required
							error={!!(error && !raisedBy.trim())}
							errorMessage={error && !raisedBy.trim() ? error : undefined}
						/>

						<FloatingInput
							label='Client Designation'
							value={clientDesignation}
							onChange={setClientDesignation}
							required
							error={!!(error && !clientDesignation.trim())}
							errorMessage={error && !clientDesignation.trim() ? error : undefined}
						/>
					</div>

					<FloatingInput
						label='Details'
						value={details}
						onChange={setDetails}
						required
						error={!!(error && !details.trim())}
						errorMessage={error && !details.trim() ? error : undefined}
					/>

					{editingItem && (
						<>
							<FloatingInput
								label='Resolution'
								value={resolution}
								onChange={setResolution}
								placeholder='Enter resolution details'
							/>

							<FloatingDropdown
								label='Resolution Status'
								options={resolutionStatusOptions}
								value={resolutionStatusId}
								onChange={setResolutionStatusId}
								placeholder='Select Resolution Status'
							/>
						</>
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

