import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { CommonApiService } from '../services/commonApi';
import type { ClientByCityOption, VehicleOption, TransitTypeOption } from '../services/commonApi';

export interface TransitEntry {
	id: string;
	date: string;
	time: string;
	vehicleType: string;
	days: number[]; // Array of day numbers: 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday
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
				days: [0, 1, 2, 3, 4, 5, 6], // Default to all days selected
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
				{
					id: '1',
					date: new Date().toISOString().split('T')[0],
					time: '',
					vehicleType: '',
					days: [0, 1, 2, 3, 4, 5, 6],
				},
			],
			pickupTransits: [
				{
					id: '1',
					date: new Date().toISOString().split('T')[0],
					time: '',
					vehicleType: '',
					days: [0, 1, 2, 3, 4, 5, 6],
				},
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
			days: [0, 1, 2, 3, 4, 5, 6], // Default to all days selected
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
		value: string | number[]
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
		// Check facility and client are selected (non-empty strings)
		const hasFacility = data.facilityId && data.facilityId.trim() !== '';
		const hasClient = data.clientId && data.clientId.trim() !== '';

		// Helper function to check if a time value is valid (not placeholder like "HH : MM")
		const isValidTime = (time: string): boolean => {
			if (!time || time.trim() === '') return false;
			// Check if it contains placeholder text
			if (time.includes('HH') || time.includes('MM')) return false;
			// TimeInput emits format: "HH:MM AM" or "HH:MM PM" (2 digits:2 digits space AM/PM)
			// Accept formats: "02:00 AM", "2:0 AM", "12:30 PM", etc.
			const trimmedTime = time.trim();
			const timePattern = /^\d{1,2}\s*:\s*\d{1,2}\s+(AM|PM)$/i;
			if (!timePattern.test(trimmedTime)) return false;

			// Additional check: ensure it has valid hour (1-12) and minute (0-59)
			const parts = trimmedTime.split(/\s+/);
			if (parts.length >= 2) {
				const timePart = parts[0];
				const [hour, minute] = timePart.split(':');
				const hourNum = parseInt(hour, 10);
				const minuteNum = parseInt(minute, 10);
				return hourNum >= 1 && hourNum <= 12 && minuteNum >= 0 && minuteNum <= 59;
			}
			return false;
		};

		// Helper function to check if a vehicle type is valid (not placeholder)
		const isValidVehicleType = (vehicleType: string): boolean => {
			if (!vehicleType || vehicleType.trim() === '') return false;
			// Check if it's a placeholder
			if (vehicleType.toLowerCase().includes('select')) return false;
			return true;
		};

		// Filter out empty/incomplete transit entries
		// An entry is considered "filled" only if it has BOTH valid time AND valid vehicleType
		const filledDispatchTransits = data.dispatchTransits.filter(
			t => isValidTime(t.time) && isValidVehicleType(t.vehicleType)
		);
		const filledPickupTransits = data.pickupTransits.filter(
			t => isValidTime(t.time) && isValidVehicleType(t.vehicleType)
		);

		// Check dispatch transits - all filled entries must be complete (have date, time, and vehicleType)
		const hasValidDispatch =
			filledDispatchTransits.length > 0 &&
			filledDispatchTransits.every(
				t =>
					t.date && t.date.trim() !== '' && isValidTime(t.time) && isValidVehicleType(t.vehicleType)
			);

		// Check pickup transits - all filled entries must be complete (have date, time, and vehicleType)
		const hasValidPickup =
			filledPickupTransits.length > 0 &&
			filledPickupTransits.every(
				t =>
					t.date && t.date.trim() !== '' && isValidTime(t.time) && isValidVehicleType(t.vehicleType)
			);

		const isValid = hasFacility && hasClient && (hasValidDispatch || hasValidPickup);

		// Debug logging - always log to help troubleshoot
		console.log('🔍 Form Validation Summary:', {
			hasFacility,
			hasClient,
			facilityId: data.facilityId,
			clientId: data.clientId,
			hasValidDispatch,
			hasValidPickup,
			filledDispatchCount: filledDispatchTransits.length,
			filledPickupCount: filledPickupTransits.length,
			totalDispatchCount: data.dispatchTransits.length,
			totalPickupCount: data.pickupTransits.length,
			isValid,
		});

		// Log dispatch entries separately for easier debugging
		data.dispatchTransits.forEach((t, idx) => {
			console.log(`🚛 Dispatch Entry ${idx + 1}:`, {
				id: t.id,
				date: t.date,
				time: `"${t.time}"`,
				vehicleType: `"${t.vehicleType}"`,
				timeValid: isValidTime(t.time),
				vehicleValid: isValidVehicleType(t.vehicleType),
				dateValid: t.date && t.date.trim() !== '',
				isComplete:
					isValidTime(t.time) &&
					isValidVehicleType(t.vehicleType) &&
					t.date &&
					t.date.trim() !== '',
			});
		});

		// Log pickup entries separately for easier debugging
		data.pickupTransits.forEach((t, idx) => {
			console.log(`🚚 Pickup Entry ${idx + 1}:`, {
				id: t.id,
				date: t.date,
				time: `"${t.time}"`,
				vehicleType: `"${t.vehicleType}"`,
				timeValid: isValidTime(t.time),
				vehicleValid: isValidVehicleType(t.vehicleType),
				dateValid: t.date && t.date.trim() !== '',
				isComplete:
					isValidTime(t.time) &&
					isValidVehicleType(t.vehicleType) &&
					t.date &&
					t.date.trim() !== '',
			});
		});

		return isValid;
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
							days: transit.days || [0, 1, 2, 3, 4, 5, 6], // Include days array, default to all days
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
							days: transit.days || [0, 1, 2, 3, 4, 5, 6], // Include days array, default to all days
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
				{
					id: '1',
					date: new Date().toISOString().split('T')[0],
					time: '',
					vehicleType: '',
					days: [0, 1, 2, 3, 4, 5, 6],
				},
			],
			pickupTransits: [
				{
					id: '1',
					date: new Date().toISOString().split('T')[0],
					time: '',
					vehicleType: '',
					days: [0, 1, 2, 3, 4, 5, 6],
				},
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
