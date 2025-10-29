import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SkuApiService } from '../../../services/skuApi';

interface SkuMappingRow {
	id: number;
	containerTypeId: number;
	containerType: string;
	status: string;
	price: string;
	selectSku: boolean;
	distanceFromWarehouse?: string;
	platesWashedPerCycle?: string;
	disposableWeight?: string;
	qtyTransportedOneEv?: string;
	weight?: string;
	numberOfClamshell?: string;
	impactTypeId?: number;
}

export const useSkuSubmission = () => {
	const navigate = useNavigate();
	const [submitting, setSubmitting] = useState(false);
	const [snackbar, setSnackbar] = useState({
		open: false,
		message: '',
		type: 'success' as 'success' | 'error' | 'info',
	});

	const submit = async (
		selectedClientId: number,
		userId: string,
		waterInefficiencyRows: SkuMappingRow[],
		singleUsePpRows: SkuMappingRow[],
		clamshellRows: SkuMappingRow[],
		electricityConsumed: string,
		waterConsumed: string,
		srcingDistance: string,
		qtyTransportedOneTrip: string,
		isEditMode: boolean
	) => {
		if (!selectedClientId || !userId) {
			setSnackbar({ open: true, message: 'Please select a client', type: 'error' });
			return;
		}

		setSubmitting(true);
		try {
			const allRows = [
				...waterInefficiencyRows.map(r => ({ ...r, impactTypeId: 3 })),
				...singleUsePpRows.map(r => ({ ...r, impactTypeId: 1 })),
				...clamshellRows.map(r => ({ ...r, impactTypeId: 2 })),
			];

			const updatePayload = isEditMode
				? {
						containers: [
							{
								client_id: selectedClientId,
								status: 1,
								containerDetails: allRows.map(row => ({
									container_type_id: row.containerTypeId,
									price: parseFloat(row.price) || 0,
									combineSku: row.selectSku ? 1 : 0,
									impact_type_id: row.impactTypeId!,
									distanceFromWarehouse: parseFloat(row.distanceFromWarehouse || '0'),
									platesWashedPerCycleByClient: parseFloat(row.platesWashedPerCycle || '0'),
									srcingDistance: parseFloat(srcingDistance) || 0,
									qtyTransportedOneTrip: parseFloat(qtyTransportedOneTrip) || 0,
									disposableWeight: parseFloat(row.disposableWeight || '0') || 0,
									srcQtyTransportedOneTripEv: parseFloat(row.qtyTransportedOneEv || '0') || 0,
									weight_bagasse: parseFloat(row.weight || '0') || 0,
									numberOfClamshell: parseInt(row.numberOfClamshell || '0') || 0,
									electricityConsumedPerCycle: parseFloat(electricityConsumed),
									waterConsumedPerCycle: parseInt(waterConsumed),
								})),
							},
						],
					}
				: {
						user_id: parseInt(userId),
						clients: [
							{
								id: selectedClientId,
								containers: allRows.map(row => ({
									container_type_id: row.containerTypeId,
									price: parseFloat(row.price) || 0,
									combineSku: row.selectSku ? 1 : 0,
									impact_type_id: row.impactTypeId!,
									distanceFromWarehouse: parseFloat(row.distanceFromWarehouse || '0') || 0,
									platesWashedPerCycleByClient: parseFloat(row.platesWashedPerCycle || '0') || 0,
									srcingDistance: parseFloat(srcingDistance) || 0,
									qtyTransportedOneTrip: parseFloat(qtyTransportedOneTrip) || 0,
									disposableWeight: parseFloat(row.disposableWeight || '0') || 0,
									srcQtyTransportedOneTripEv: parseFloat(row.qtyTransportedOneEv || '0') || 0,
									weight_bagasse: parseFloat(row.weight || '0') || 0,
									numberOfClamshell: parseInt(row.numberOfClamshell || '0') || 0,
									electricityConsumedPerCycle: parseFloat(electricityConsumed) || 0.484,
									waterConsumedPerCycle: parseInt(waterConsumed) || 4,
								})),
							},
						],
					};

			console.log('📝 Payload being sent:', JSON.stringify(updatePayload, null, 2));

			const response = isEditMode
				? await SkuApiService.updateClientSkuMap(updatePayload as any)
				: await SkuApiService.addClientSkuMap(updatePayload as any);

			if (response.status_code === 200) {
				setSnackbar({
					open: true,
					message: isEditMode
						? 'SKU mapping updated successfully'
						: 'SKU mapping added successfully',
					type: 'success',
				});

				// Clear Redux Persist storage on successful submission
				if (!isEditMode) {
					// Only clear add page storage, not edit page
					localStorage.removeItem('persist:skuMapping');
				}

				// Set refresh timestamp to trigger listing reload
				localStorage.setItem('sku-listing-refresh-timestamp', Date.now().toString());
				setTimeout(() => navigate('/ops-admin/map-sku/listing'), 1500);
			}
		} catch {
			setSnackbar({ open: true, message: 'Failed to submit SKU mapping', type: 'error' });
		} finally {
			setSubmitting(false);
		}
	};

	return { submit, submitting, snackbar, setSnackbar };
};
