import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { CommonApiService } from '../services/commonApi';
import type {
	ClientByCityOption,
	VehicleOption,
	TransitTypeOption,
} from '../services/commonApi';

export interface TransitEntry {
	id: string;
	date: string;
	time: string;
	vehicleType: string;
}

export interface MasterPlanData {
	facilityId: string;
	clientId: string;
	dispatchTransits: TransitEntry[];
	pickupTransits: TransitEntry[];
}

// Re-export types for components
export type { VehicleOption } from '../services/commonApi';

export const useMasterPlanData = (isEditMode: boolean = false) => {
	const [loading, setLoading] = useState(true);
	const [clients, setClients] = useState<ClientByCityOption[]>([]);
	const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
	const [transitTypes, setTransitTypes] = useState<TransitTypeOption[]>([]);

	// Get cityId from Redux auth state - memoize to prevent unnecessary re-renders
	const user = useSelector((state: RootState) => state.auth.user);
	const cityId = useMemo(() => user?.city_id, [user?.city_id]);

	// Get edit data from Redux state when in edit mode
	const editMasterPlanData = useSelector((state: RootState) => state.auth.editMasterPlanData);

	const [data, setData] = useState<MasterPlanData>(() => {
		// If in edit mode and we have Redux data, transform it to the expected format
		if (isEditMode && editMasterPlanData) {
			// Transform single row data to arrays for TransitSection components
			const transitEntry = {
				id: '1',
				date: editMasterPlanData.transit_date || new Date().toISOString().split('T')[0],
				time: editMasterPlanData.transit_time || '',
				vehicleType: String(editMasterPlanData.vehicle_id || ''),
			};

			return {
				facilityId: String(editMasterPlanData.facility_id || ''),
				clientId: String(editMasterPlanData.restaurant_id || ''),
				dispatchTransits: editMasterPlanData.type?.toLowerCase().includes('dispatch')
					? [transitEntry]
					: [],
				pickupTransits: editMasterPlanData.type?.toLowerCase().includes('pickup')
					? [transitEntry]
					: [],
			};
		}

		// Try to restore from localStorage with different keys for create/edit
		const storageKey = isEditMode ? 'masterPlanEditData' : 'masterPlanData';
		const saved = localStorage.getItem(storageKey);
		if (saved) {
			try {
				return JSON.parse(saved);
			} catch (e) {
				console.error('Failed to parse saved master plan data:', e);
			}
		}

		// Default state
		return {
			facilityId: '',
			clientId: '',
			dispatchTransits: [
				{ id: '1', date: new Date().toISOString().split('T')[0], time: '', vehicleType: '' },
			],
			pickupTransits: [
				{ id: '1', date: new Date().toISOString().split('T')[0], time: '', vehicleType: '' },
			],
		};
	});

	// Save data to localStorage whenever it changes - temporarily disabled to fix infinite loop
	// useEffect(() => {
	// 	const storageKey = isEditMode ? 'masterPlanEditData' : 'masterPlanData';
	// 	const dataString = JSON.stringify(data);
	//
	// 	// Only save if data has actually changed
	// 	if (dataString !== prevDataRef.current) {
	// 		localStorage.setItem(storageKey, dataString);
	// 		prevDataRef.current = dataString;
	// 	}
	// }, [data.facilityId, data.clientId, JSON.stringify(data.dispatchTransits), JSON.stringify(data.pickupTransits), isEditMode]);

	useEffect(() => {
		const loadData = async () => {
			try {
				setLoading(true);

				const [clientsRes, vehiclesRes, transitTypesRes] = await Promise.all([
					CommonApiService.getClientsByCity(),
					CommonApiService.getVehicles(),
					CommonApiService.getTransitTypes(),
				]);

				setClients(clientsRes.data || []);
				setVehicles(vehiclesRes.data || []);
				setTransitTypes(transitTypesRes.data || []);
			} catch (error) {
				console.error('Error loading master plan data:', error);
			} finally {
				setLoading(false);
			}
		};

		loadData();
	}, []);

	const updateData = useCallback((updates: Partial<MasterPlanData>) => {
		setData(prev => ({ ...prev, ...updates }));
	}, []);

	const addTransit = (type: 'dispatch' | 'pickup') => {
		const newId = Date.now().toString();
		const newTransit: TransitEntry = {
			id: newId,
			date: new Date().toISOString().split('T')[0],
			time: '',
			vehicleType: '',
		};

		if (type === 'dispatch') {
			setData(prev => ({
				...prev,
				dispatchTransits: [...prev.dispatchTransits, newTransit],
			}));
		} else {
			setData(prev => ({
				...prev,
				pickupTransits: [...prev.pickupTransits, newTransit],
			}));
		}
	};

	const removeTransit = (type: 'dispatch' | 'pickup', id: string) => {
		if (type === 'dispatch') {
			setData(prev => ({
				...prev,
				dispatchTransits: prev.dispatchTransits.filter(t => t.id !== id),
			}));
		} else {
			setData(prev => ({
				...prev,
				pickupTransits: prev.pickupTransits.filter(t => t.id !== id),
			}));
		}
	};

	const updateTransit = (
		type: 'dispatch' | 'pickup',
		id: string,
		field: keyof TransitEntry,
		value: string
	) => {
		if (type === 'dispatch') {
			setData(prev => ({
				...prev,
				dispatchTransits: prev.dispatchTransits.map(t =>
					t.id === id ? { ...t, [field]: value } : t
				),
			}));
		} else {
			setData(prev => ({
				...prev,
				pickupTransits: prev.pickupTransits.map(t => (t.id === id ? { ...t, [field]: value } : t)),
			}));
		}
	};

	const isFormValid = () => {
		return (
			data.facilityId &&
			data.clientId &&
			data.dispatchTransits.every(t => t.date && t.time && t.vehicleType) &&
			data.pickupTransits.every(t => t.date && t.time && t.vehicleType)
		);
	};

	// Convert time from "HH:MM AM/PM" to "HH:MM:SS" format
	const convertTimeFormat = (timeString: string): string => {
		if (!timeString) return '00:00:00';

		// Parse "HH:MM AM/PM" format
		const [time, period] = timeString.split(' ');
		const [hours, minutes] = time.split(':');

		let hour24 = parseInt(hours, 10);

		if (period === 'PM' && hour24 !== 12) {
			hour24 += 12;
		} else if (period === 'AM' && hour24 === 12) {
			hour24 = 0;
		}

		return `${hour24.toString().padStart(2, '0')}:${minutes}:00`;
	};

	const getSubmitPayload = () => {
		const dispatchType = transitTypes.find(t => t.name?.toLowerCase().includes('dispatch'));
		const pickupType = transitTypes.find(t => t.name?.toLowerCase().includes('pickup'));

		// Use memoized cityId
		const finalCityId = cityId || 3; // Fallback to 3 if not available

		const input = [];

		// Add dispatch transits if any
		if (data.dispatchTransits.length > 0 && data.dispatchTransits[0].vehicleType) {
			input.push({
				transitTypeId: dispatchType?.id || 1,
				data: data.dispatchTransits
					.filter(transit => transit.vehicleType)
					.map(transit => {
						const vehicle = vehicles.find(v => v.id.toString() === transit.vehicleType);
						return {
							vehicleId: parseInt(transit.vehicleType),
							transitDate: new Date().toISOString().split('T')[0], // Always use today's date
							transitTime: convertTimeFormat(transit.time), // Convert to "HH:MM:SS" format
							driverName: vehicle?.driver_name || '',
							driverPhone: vehicle?.driver_phone || '',
						};
					}),
			});
		}

		// Add pickup transits if any
		if (data.pickupTransits.length > 0 && data.pickupTransits[0].vehicleType) {
			input.push({
				transitTypeId: pickupType?.id || 2,
				data: data.pickupTransits
					.filter(transit => transit.vehicleType)
					.map(transit => {
						const vehicle = vehicles.find(v => v.id.toString() === transit.vehicleType);
						return {
							vehicleId: parseInt(transit.vehicleType),
							transitDate: new Date().toISOString().split('T')[0], // Always use today's date
							transitTime: convertTimeFormat(transit.time), // Convert to "HH:MM:SS" format
							driverName: vehicle?.driver_name || '',
							driverPhone: vehicle?.driver_phone || '',
						};
					}),
			});
		}

		return {
			restaurantId: parseInt(data.clientId),
			cityId: finalCityId,
			facilityId: parseInt(data.facilityId),
			input: input,
		};
	};

	const clearSavedData = () => {
		const storageKey = isEditMode ? 'masterPlanEditData' : 'masterPlanData';
		localStorage.removeItem(storageKey);
		setData({
			facilityId: '',
			clientId: '',
			dispatchTransits: [
				{ id: '1', date: new Date().toISOString().split('T')[0], time: '', vehicleType: '' },
			],
			pickupTransits: [
				{ id: '1', date: new Date().toISOString().split('T')[0], time: '', vehicleType: '' },
			],
		});
	};

	return {
		loading,
		clients,
		vehicles,
		transitTypes,
		data,
		updateData,
		addTransit,
		removeTransit,
		updateTransit,
		isFormValid,
		getSubmitPayload,
		clearSavedData,
	};
};
