import { useCallback } from 'react';

interface LocalStorageData {
	adhocTransportation: boolean;
	dispatchVehicleNumber: string;
	signatureName: string;
	containerCounts: Record<number, number>;
	uploadedImageUrl: string;
	fileBase64?: string;
	photographName?: string;
	timestamp: number;
}

export const useLocalStorage = (storageKey: string) => {
	const saveToLocalStorage = useCallback(
		(data: Partial<LocalStorageData>) => {
			const dataToSave = {
				...data,
				timestamp: Date.now(),
			};
			localStorage.setItem(storageKey, JSON.stringify(dataToSave));
			console.log('💾 Saved to localStorage:', dataToSave);
		},
		[storageKey]
	);

	const loadFromLocalStorage = useCallback((): Partial<LocalStorageData> | null => {
		try {
			console.log('🔍 Looking for localStorage key:', storageKey);
			const savedData = localStorage.getItem(storageKey);
			console.log('🔍 Raw saved data:', savedData);

			if (savedData) {
				const parsed = JSON.parse(savedData);
				console.log('📂 Parsed localStorage data:', parsed);
				console.log('✅ Successfully loaded from localStorage');
				return parsed;
			} else {
				console.log('❌ No data found in localStorage for key:', storageKey);
			}
		} catch (error) {
			console.error('❌ Error loading from localStorage:', error);
		}
		return null;
	}, [storageKey]);

	const clearLocalStorage = useCallback(() => {
		localStorage.removeItem(storageKey);
		console.log('🗑️ Cleared localStorage for key:', storageKey);
	}, [storageKey]);

	return {
		saveToLocalStorage,
		loadFromLocalStorage,
		clearLocalStorage,
	};
};
