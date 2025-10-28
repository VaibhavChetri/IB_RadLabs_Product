interface TableColumn {
	key: string;
	label: string;
	fullLabel: string;
	render?: (
		row: any,
		impactType: string,
		rowId: number,
		onChange: (field: string, value: any) => void
	) => React.ReactElement;
}

export const getColumnsForImpactType = (impactType: string): TableColumn[] => {
	if (impactType === 'Water Inefficiency') {
		return [
			{ key: 'containerType', label: 'Container Type', fullLabel: 'Container Type' },
			{ key: 'price', label: 'Price', fullLabel: 'Price' },
			{ key: 'distanceFromWarehouse', label: 'Distance', fullLabel: 'Distance From Warehouse' },
			{ key: 'platesWashedPerCycle', label: 'Plates/Cycle', fullLabel: 'Plates Washed Per Cycle' },
			{ key: 'selectSku', label: 'Combine SKU', fullLabel: 'Combine SKU' },
			{ key: 'status', label: 'Status', fullLabel: 'Status' },
		];
	} else if (impactType === 'Single use PP') {
		return [
			{ key: 'containerType', label: 'Container Type', fullLabel: 'Container Type' },
			{ key: 'price', label: 'Price', fullLabel: 'Price' },
			{ key: 'disposableWeight', label: 'Weight', fullLabel: 'Disposable Weight' },
			{ key: 'qtyTransportedOneEv', label: 'Qty/EV', fullLabel: 'Qty Transported in 1 EV' },
			{ key: 'selectSku', label: 'Combine SKU', fullLabel: 'Combine SKU' },
			{ key: 'status', label: 'Status', fullLabel: 'Status' },
		];
	} else if (impactType === 'Clamshell' || impactType === 'Clampshell') {
		// Clamshell (spelled both ways by API)
		return [
			{ key: 'containerType', label: 'Container Type', fullLabel: 'Container Type' },
			{ key: 'price', label: 'Price', fullLabel: 'Price' },
			{ key: 'weight', label: 'Weight', fullLabel: 'Weight' },
			{ key: 'numberOfClamshell', label: 'Count', fullLabel: 'Number of Clamshell' },
			{ key: 'selectSku', label: 'Combine SKU', fullLabel: 'Combine SKU' },
			{ key: 'status', label: 'Status', fullLabel: 'Status' },
		];
	} else {
		return [];
	}
};
