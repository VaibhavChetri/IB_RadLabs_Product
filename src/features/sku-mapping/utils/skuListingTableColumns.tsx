import { Edit2 } from 'lucide-react';
import { ClientSkuMapping } from '../../../services/skuApi';
import { TableColumn } from '../../../components/ui/DataDisplay';

interface EditHandler {
	(row: ClientSkuMapping): void;
}

export const getSkuListingTableColumns = (
	handleEdit: EditHandler,
	showCombineSku: boolean = false
): TableColumn[] => {
	const baseColumns: TableColumn[] = [
	{
		key: 'actions',
		title: 'Actions',
		render: (_value: unknown, row: unknown, _index: number) =>
			row ? (
				<button
					onClick={() => handleEdit(row as ClientSkuMapping)}
					className='p-1.5 rounded hover:bg-gray-100'
					title='Edit'
				>
					<Edit2 className='h-4 w-4 text-primary' />
				</button>
			) : null,
	},
	{
		key: 'containerType',
		title: 'Container Type',
		dataIndex: 'containerType' as keyof ClientSkuMapping,
	},
	{
		key: 'impactName',
		title: 'Impact Type',
		dataIndex: 'impactName' as keyof ClientSkuMapping,
	},
	{
		key: 'status',
		title: 'Status',
		dataIndex: 'status' as keyof ClientSkuMapping,
		render: (value: unknown, _row: unknown, _index: number) => {
			const status = value as string;
			return (
				<span className={status === 'Enabled' ? 'text-green-600' : 'text-red-600'}>{status}</span>
			);
		},
	},
	{
		key: 'price',
		title: 'Price',
		dataIndex: 'price' as keyof ClientSkuMapping,
	},
	{
		key: 'distanceFromWarehouse',
		title: 'Distance',
		dataIndex: 'distanceFromWarehouse' as keyof ClientSkuMapping,
	},
	{
		key: 'platesWashedPerCycle',
		title: 'Plates/Cycle',
		dataIndex: 'platesWashedPerCycleByClient' as keyof ClientSkuMapping,
		render: (_value: unknown, _row: unknown, _index: number) => (_value as any)?.toString() || '-',
	},
	{
		key: 'disposableWeight',
		title: 'Weight',
		dataIndex: 'disposableWeight' as keyof ClientSkuMapping,
		render: (_value: unknown, _row: unknown, _index: number) => (_value as any)?.toString() || '-',
	},
	{
		key: 'electricityConsumed',
		title: 'Electricity/Cycle',
		dataIndex: 'electricityConsumedPerCycle' as keyof ClientSkuMapping,
	},
	];

	// Insert combine_sku column before electricityConsumed if showCombineSku is true
	if (showCombineSku) {
		const electricityIndex = baseColumns.findIndex(col => col.key === 'electricityConsumed');
		if (electricityIndex !== -1) {
			baseColumns.splice(electricityIndex, 0, {
				key: 'combine_sku',
				title: 'Combine SKU',
				dataIndex: 'combine_sku' as keyof ClientSkuMapping,
				render: (value: unknown, _row: unknown, _index: number) =>
					(value as any) === 1 ? 'Yes' : 'No',
			});
		} else {
			baseColumns.push({
				key: 'combine_sku',
				title: 'Combine SKU',
				dataIndex: 'combine_sku' as keyof ClientSkuMapping,
				render: (value: unknown, _row: unknown, _index: number) =>
					(value as any) === 1 ? 'Yes' : 'No',
			});
		}
	}

	return baseColumns;
};
