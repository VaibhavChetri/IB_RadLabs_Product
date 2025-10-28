import React, { useState, useCallback, useEffect } from 'react';
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

export const useSkuMappingForm = (isEditMode: boolean = false) => {
	// Initialize state from localStorage (lazy initialization pattern like Master Plan)
	// In edit mode, use a different key and load from it
	const loadInitialState = () => {
		try {
			// Use different keys for add vs edit mode
			const storageKey = isEditMode ? 'sku-mapping-rows-edit' : 'sku-mapping-rows';
			const storedRows = localStorage.getItem(storageKey);
			console.log(`📥 Storage key "${storageKey}" value:`, storedRows);
			if (storedRows) {
				const parsed = JSON.parse(storedRows);
				console.log('📥 Parsed data:', parsed);
				return {
					waterInefficiencyRows: parsed.waterInefficiencyRows || [],
					singleUsePpRows: parsed.singleUsePpRows || [],
					clamshellRows: parsed.clamshellRows || [],
					electricityConsumed: parsed.electricityConsumed || '0.4840',
					waterConsumed: parsed.waterConsumed || '4',
					srcingDistance: parsed.srcingDistance || '',
					qtyTransportedOneTrip: parsed.qtyTransportedOneTrip || '',
				};
			}
			console.log('📥 No data found in localStorage, using defaults');
		} catch (error) {
			console.error('Failed to load from localStorage:', error);
		}

		return {
			waterInefficiencyRows: [],
			singleUsePpRows: [],
			clamshellRows: [],
			electricityConsumed: '0.4840',
			waterConsumed: '4',
			srcingDistance: '',
			qtyTransportedOneTrip: '',
		};
	};

	const initialState = loadInitialState();
	const storageKey = isEditMode ? 'sku-mapping-rows-edit' : 'sku-mapping-rows';
	const [waterInefficiencyRows, setWaterInefficiencyRows] = useState<SkuMappingRow[]>(
		initialState.waterInefficiencyRows
	);
	const [singleUsePpRows, setSingleUsePpRows] = useState<SkuMappingRow[]>(
		initialState.singleUsePpRows
	);
	const [clamshellRows, setClamshellRows] = useState<SkuMappingRow[]>(initialState.clamshellRows);
	const [electricityConsumed, setElectricityConsumed] = useState<string>(
		initialState.electricityConsumed
	);
	const [waterConsumed, setWaterConsumed] = useState<string>(initialState.waterConsumed);
	const [srcingDistance, setSrcingDistance] = useState<string>(initialState.srcingDistance);
	const [qtyTransportedOneTrip, setQtyTransportedOneTrip] = useState<string>(
		initialState.qtyTransportedOneTrip
	);

	// No longer need loadLocalStorage - data is already loaded in useState initializer

	// Save to localStorage when state changes (but skip first render to avoid overwriting with initial values)
	const isFirstRender = React.useRef(true);

	useEffect(() => {
		if (isFirstRender.current) {
			console.log('⏸️ Skipping save on first render');
			isFirstRender.current = false;
			return;
		}

		try {
			const dataToSave = {
				waterInefficiencyRows,
				singleUsePpRows,
				clamshellRows,
				electricityConsumed,
				waterConsumed,
				srcingDistance,
				qtyTransportedOneTrip,
			};
			console.log(`💾 Saving to localStorage (${storageKey}):`, dataToSave);
			localStorage.setItem(storageKey, JSON.stringify(dataToSave));
		} catch (error) {
			console.error('Failed to save to localStorage:', error);
		}
	}, [
		storageKey,
		waterInefficiencyRows,
		singleUsePpRows,
		clamshellRows,
		electricityConsumed,
		waterConsumed,
		srcingDistance,
		qtyTransportedOneTrip,
	]);

	const addRow = useCallback((impactType: string) => {
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
			setWaterInefficiencyRows(prev => [...prev, newRow]);
		} else if (impactType === 'Single use PP') {
			setSingleUsePpRows(prev => [...prev, newRow]);
		} else if (impactType === 'Clamshell' || impactType === 'Clampshell') {
			setClamshellRows(prev => [...prev, newRow]);
		}
	}, []);

	const removeRow = useCallback((impactType: string, rowId: number) => {
		if (impactType === 'Water Inefficiency') {
			setWaterInefficiencyRows(prev => prev.filter(r => r.id !== rowId));
		} else if (impactType === 'Single use PP') {
			setSingleUsePpRows(prev => prev.filter(r => r.id !== rowId));
		} else if (impactType === 'Clamshell' || impactType === 'Clampshell') {
			setClamshellRows(prev => prev.filter(r => r.id !== rowId));
		}
	}, []);

	const updateRow = useCallback((impactType: string, rowId: number, field: string, value: any) => {
		console.log('🔧 updateRow called:', { impactType, rowId, field, value });

		if (impactType === 'Water Inefficiency') {
			setWaterInefficiencyRows(prev =>
				prev.map(row => (row.id === rowId ? { ...row, [field]: value } : row))
			);
		} else if (impactType === 'Single use PP') {
			setSingleUsePpRows(prev =>
				prev.map(row => (row.id === rowId ? { ...row, [field]: value } : row))
			);
		} else if (impactType === 'Clamshell' || impactType === 'Clampshell') {
			setClamshellRows(prev =>
				prev.map(row => (row.id === rowId ? { ...row, [field]: value } : row))
			);
		}
	}, []);

	const loadExistingMapping = useCallback(async (clientId: number) => {
		try {
			const response = await SkuApiService.getClientSkuMap(clientId);
			if (response.status_code === 200 && response.result) {
				const rows = response.result;

				const mapRow = (r: any) => {
					// For Clamshell, the API sends disposableWeight but the table expects weight
					const mapped = {
						id: Date.now() + Math.random(),
						containerTypeId: r.containerTypeId,
						containerType: r.containerType,
						status: r.status,
						price: r.price,
						selectSku: r.combine_sku === 1,
						distanceFromWarehouse: r.distanceFromWarehouse?.toString() || '',
						platesWashedPerCycle: r.platesWashedPerCycleByClient?.toString() || '',
						disposableWeight: r.disposableWeight?.toString() || '',
						qtyTransportedOneEv: r.srcQtyTransportedOneTripEv?.toString() || '',
						// For Clamshell, map disposableWeight from API to weight field
						weight: r.weight_bagasse?.toString() || r.disposableWeight?.toString() || '',
						numberOfClamshell: r.numberOfClamshell?.toString() || '',
					};
					return mapped;
				};

				const waterInefficiencyRows = rows
					.filter((r: any) => r.impactName === 'Water Inefficiency')
					.map(mapRow);
				const singleUsePpRows = rows
					.filter((r: any) => r.impactName === 'Single use PP')
					.map(mapRow);
				const clamshellRows = rows
					.filter((r: any) => r.impactName === 'Clamshell' || r.impactName === 'Clampshell')
					.map(mapRow);

				setWaterInefficiencyRows(waterInefficiencyRows);
				setSingleUsePpRows(singleUsePpRows);
				setClamshellRows(clamshellRows);

				if (rows.length > 0) {
					setElectricityConsumed(rows[0].electricityConsumedPerCycle || '0.4840');
					setWaterConsumed(rows[0].waterConsumedPerCycle?.toString() || '4');
					setSrcingDistance(rows[0].srcingDistance?.toString() || '');
					setQtyTransportedOneTrip(rows[0].qtyTransportedOneTrip?.toString() || '');
				}
			}
		} catch (error) {
			console.error('Failed to load existing mapping:', error);
			throw error;
		}
	}, []);

	// Simple wrappers - save happens automatically via useEffect above
	const setElectricityConsumedWithSave = setElectricityConsumed;
	const setWaterConsumedWithSave = setWaterConsumed;
	const setSrcingDistanceWithSave = setSrcingDistance;
	const setQtyTransportedOneTripWithSave = setQtyTransportedOneTrip;
	const addRowWithSave = addRow;
	const removeRowWithSave = removeRow;
	const updateRowWithSave = updateRow;

	return {
		waterInefficiencyRows,
		singleUsePpRows,
		clamshellRows,
		setWaterInefficiencyRows,
		setSingleUsePpRows,
		setClamshellRows,
		electricityConsumed,
		setElectricityConsumed: setElectricityConsumedWithSave,
		waterConsumed,
		setWaterConsumed: setWaterConsumedWithSave,
		srcingDistance,
		setSrcingDistance: setSrcingDistanceWithSave,
		qtyTransportedOneTrip,
		setQtyTransportedOneTrip: setQtyTransportedOneTripWithSave,
		addRow: addRowWithSave,
		removeRow: removeRowWithSave,
		updateRow: updateRowWithSave,
		loadExistingMapping,
	};
};
