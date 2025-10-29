import { useSelector, useDispatch } from 'react-redux';
import { useCallback } from 'react';
import { RootState } from '../../../store';
import {
	addWaterInefficiencyRow,
	addSingleUsePpRow,
	addClamshellRow,
	removeWaterInefficiencyRow,
	removeSingleUsePpRow,
	removeClamshellRow,
	updateWaterInefficiencyRow,
	updateSingleUsePpRow,
	updateClamshellRow,
	setConstantFields,
	clearAllRows,
} from '../../../store/slices/skuMappingSlice';
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

export const useSkuMappingFormRedux = () => {
	const dispatch = useDispatch();

	// Get all state from Redux
	const waterInefficiencyRows = useSelector(
		(state: RootState) => state.skuMapping.waterInefficiencyRows
	);
	const singleUsePpRows = useSelector((state: RootState) => state.skuMapping.singleUsePpRows);
	const clamshellRows = useSelector((state: RootState) => state.skuMapping.clamshellRows);

	const electricityConsumed = useSelector(
		(state: RootState) => state.skuMapping.electricityConsumed
	);
	const waterConsumed = useSelector((state: RootState) => state.skuMapping.waterConsumed);
	const srcingDistance = useSelector((state: RootState) => state.skuMapping.srcingDistance);
	const qtyTransportedOneTrip = useSelector(
		(state: RootState) => state.skuMapping.qtyTransportedOneTrip
	);

	// Setter functions
	const setElectricityConsumed = useCallback(
		(value: string) => {
			dispatch(setConstantFields({ electricityConsumed: value }));
		},
		[dispatch]
	);

	const setWaterConsumed = useCallback(
		(value: string) => {
			dispatch(setConstantFields({ waterConsumed: value }));
		},
		[dispatch]
	);

	const setSrcingDistance = useCallback(
		(value: string) => {
			dispatch(setConstantFields({ srcingDistance: value }));
		},
		[dispatch]
	);

	const setQtyTransportedOneTrip = useCallback(
		(value: string) => {
			dispatch(setConstantFields({ qtyTransportedOneTrip: value }));
		},
		[dispatch]
	);

	const addRow = useCallback(
		(impactType: string) => {
			const newRow: SkuMappingRow = {
				id: Date.now() + Math.random(),
				containerTypeId: 0,
				containerType: '',
				status: 'Enabled',
				price: '',
				selectSku: false,
				distanceFromWarehouse: '',
				platesWashedPerCycle: '',
				disposableWeight: '',
				qtyTransportedOneEv: '',
				weight: '',
				numberOfClamshell: '',
			};

			if (impactType === 'Water Inefficiency') {
				dispatch(addWaterInefficiencyRow(newRow));
			} else if (impactType === 'Single use PP') {
				dispatch(addSingleUsePpRow(newRow));
			} else if (impactType === 'Clamshell' || impactType === 'Clampshell') {
				dispatch(addClamshellRow(newRow));
			}
		},
		[dispatch]
	);

	const removeRow = useCallback(
		(impactType: string, rowId: number) => {
			if (impactType === 'Water Inefficiency') {
				dispatch(removeWaterInefficiencyRow(rowId));
			} else if (impactType === 'Single use PP') {
				dispatch(removeSingleUsePpRow(rowId));
			} else if (impactType === 'Clamshell' || impactType === 'Clampshell') {
				dispatch(removeClamshellRow(rowId));
			}
		},
		[dispatch]
	);

	const updateRow = useCallback(
		(impactType: string, rowId: number, field: string, value: any) => {
			const payload = { rowId, field, value };
			if (impactType === 'Water Inefficiency') {
				dispatch(updateWaterInefficiencyRow(payload));
			} else if (impactType === 'Single use PP') {
				dispatch(updateSingleUsePpRow(payload));
			} else if (impactType === 'Clamshell' || impactType === 'Clampshell') {
				dispatch(updateClamshellRow(payload));
			}
		},
		[dispatch]
	);

	const loadExistingMapping = useCallback(
		async (clientId: number) => {
			try {
				const response = await SkuApiService.getClientSkuMap(clientId);
				if (response.status_code === 200 && response.result) {
					const rows = response.result;

					const mapRow = (r: any): SkuMappingRow => {
						return {
							id: Date.now() + Math.random(),
							containerTypeId: r.containerTypeId || 0,
							containerType: r.containerType || '',
							status: r.status || 'Enabled',
							price: r.price?.toString() || '',
							selectSku: r.combine_sku === 1,
							distanceFromWarehouse: r.distanceFromWarehouse?.toString() || '',
							platesWashedPerCycle: (r as any).platesWashedPerCycleByClient?.toString() || '',
							disposableWeight: (r as any).disposableWeight?.toString() || '',
							qtyTransportedOneEv: (r as any).srcQtyTransportedOneTripEv?.toString() || '',
							weight: r.weight_bagasse?.toString() || (r as any).disposableWeight?.toString() || '',
							numberOfClamshell: (r as any).numberOfClamshell?.toString() || '',
						};
					};

					const waterInefficiencyData = rows
						.filter((r: any) => r.impactName === 'Water Inefficiency')
						.map(mapRow);
					const singleUsePpData = rows
						.filter((r: any) => r.impactName === 'Single use PP')
						.map(mapRow);
					const clamshellData = rows
						.filter((r: any) => r.impactName === 'Clamshell' || r.impactName === 'Clampshell')
						.map(mapRow);

					// Clear all existing rows first to prevent duplicates
					dispatch(clearAllRows());

					// Dispatch to set all rows
					waterInefficiencyData.forEach((row: SkuMappingRow) =>
						dispatch(addWaterInefficiencyRow(row))
					);
					singleUsePpData.forEach((row: SkuMappingRow) => dispatch(addSingleUsePpRow(row)));
					clamshellData.forEach((row: SkuMappingRow) => dispatch(addClamshellRow(row)));

					// Set constant fields - only set if we don't already have values (to preserve user input)
					if (rows.length > 0) {
						const row0 = rows[0] as any;
						dispatch(
							setConstantFields({
								electricityConsumed: row0.electricityConsumedPerCycle || '0.4840',
								waterConsumed: row0.waterConsumedPerCycle?.toString() || '4',
								// Only set srcingDistance if it exists and is not 0/null in the API response
								srcingDistance:
									row0.srcingDistance && row0.srcingDistance !== 0 && row0.srcingDistance !== null
										? row0.srcingDistance.toString()
										: undefined, // Don't update if empty/0/null
								// Only set qtyTransportedOneTrip if it exists and is not 0/null
								qtyTransportedOneTrip:
									row0.qtyTransportedOneTrip &&
									row0.qtyTransportedOneTrip !== 0 &&
									row0.qtyTransportedOneTrip !== null
										? row0.qtyTransportedOneTrip.toString()
										: undefined, // Don't update if empty/0/null
							})
						);
					}
				}
			} catch (error) {
				console.error('Failed to load existing mapping:', error);
				throw error;
			}
		},
		[dispatch]
	);

	// Wrapper functions
	const setWaterInefficiencyRows = useCallback(
		(rows: SkuMappingRow[]) => {
			// Clear and repopulate - for batch updates
			dispatch(clearAllRows());
			rows.forEach(row => dispatch(addWaterInefficiencyRow(row)));
		},
		[dispatch]
	);

	const setSingleUsePpRows = useCallback(
		(rows: SkuMappingRow[]) => {
			// Clear and repopulate
			dispatch(clearAllRows());
			rows.forEach(row => dispatch(addSingleUsePpRow(row)));
		},
		[dispatch]
	);

	const setClamshellRows = useCallback(
		(rows: SkuMappingRow[]) => {
			// Clear and repopulate
			dispatch(clearAllRows());
			rows.forEach(row => dispatch(addClamshellRow(row)));
		},
		[dispatch]
	);

	return {
		waterInefficiencyRows,
		singleUsePpRows,
		clamshellRows,
		setWaterInefficiencyRows,
		setSingleUsePpRows,
		setClamshellRows,
		electricityConsumed,
		setElectricityConsumed,
		waterConsumed,
		setWaterConsumed,
		srcingDistance,
		setSrcingDistance,
		qtyTransportedOneTrip,
		setQtyTransportedOneTrip,
		addRow,
		removeRow,
		updateRow,
		loadExistingMapping,
	};
};
