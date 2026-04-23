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

export const getColumnsForImpactType = (impactType: string, showCombineSku: boolean = false): TableColumn[] => {
	const baseColumns = {
		'Water Inefficiency': [
			{ key: 'containerType', label: 'Container Type', fullLabel: 'Container Type' },
			{ key: 'price', label: 'Price', fullLabel: 'Price' },
			{ key: 'distanceFromWarehouse', label: 'Distance', fullLabel: 'Distance From Warehouse' },
			{ key: 'platesWashedPerCycle', label: 'Plates/Cycle', fullLabel: 'Plates Washed Per Cycle' },
			{ key: 'status', label: 'Status', fullLabel: 'Status' },
		],
		'Single use PP': [
			{ key: 'containerType', label: 'Container Type', fullLabel: 'Container Type' },
			{ key: 'price', label: 'Price', fullLabel: 'Price' },
			{ key: 'disposableWeight', label: 'Weight', fullLabel: 'Disposable Weight' },
			{ key: 'qtyTransportedOneEv', label: 'Qty/EV', fullLabel: 'Qty Transported in 1 EV' },
			{ key: 'status', label: 'Status', fullLabel: 'Status' },
		],
		'Clamshell': [
			{ key: 'containerType', label: 'Container Type', fullLabel: 'Container Type' },
			{ key: 'price', label: 'Price', fullLabel: 'Price' },
			{ key: 'weight', label: 'Weight', fullLabel: 'Weight' },
			{ key: 'numberOfClamshell', label: 'Count', fullLabel: 'Number of Clamshell' },
			{ key: 'status', label: 'Status', fullLabel: 'Status' },
		],
	};

	let columns: TableColumn[] = [];

	if (impactType === 'Water Inefficiency') {
		columns = [...baseColumns['Water Inefficiency']];
	} else if (impactType === 'Single use PP') {
		columns = [...baseColumns['Single use PP']];
	} else if (impactType === 'Clamshell' || impactType === 'Clampshell') {
		columns = [...baseColumns['Clamshell']];
	}

	// Insert combine SKU column before status if showCombineSku is true
	if (showCombineSku && columns.length > 0) {
		const statusIndex = columns.findIndex(col => col.key === 'status');
		if (statusIndex !== -1) {
			columns.splice(statusIndex, 0, { key: 'selectSku', label: 'Combine SKU', fullLabel: 'Combine SKU' });
		} else {
			columns.push({ key: 'selectSku', label: 'Combine SKU', fullLabel: 'Combine SKU' });
		}
	}

	return columns;
};
