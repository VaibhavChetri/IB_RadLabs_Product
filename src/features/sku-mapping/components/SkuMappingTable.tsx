import React from 'react';
import { useDispatch } from 'react-redux';
import { Plus, Trash2, Info } from 'lucide-react';
import { BorderlessDropdown } from '../../../components/ui/BorderlessDropdown';
import { Button } from '../../../components/ui/Button';
import { getColumnsForImpactType } from '../utils/skuMappingTableConfig';
import {
	updateWaterInefficiencyRow,
	updateSingleUsePpRow,
	updateClamshellRow,
} from '../../../store/slices/skuMappingSlice';

interface SkuMappingRow {
	id: number;
	containerTypeId: number | string;
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
}

interface TableColumn {
	key: string;
	label: string;
	fullLabel: string;
	render: (
		row: SkuMappingRow,
		impactType: string,
		rowId: number,
		onChange: (field: string, value: any) => void
	) => React.ReactElement;
}

interface SkuMappingTableProps {
	impactType: string;
	rows: SkuMappingRow[];
	columns: TableColumn[];
	addRow: (impactType: string) => void;
	removeRow: (impactType: string, rowId: number) => void;
	containerTypes?: any[];
	selectedContainerTypes?: number[];
	_isEditMode?: boolean;
}

export const SkuMappingTable: React.FC<SkuMappingTableProps> = ({
	impactType,
	rows,
	columns,
	addRow,
	removeRow,
	containerTypes = [],
	selectedContainerTypes = [],
	_isEditMode = false,
}) => {
	const dispatch = useDispatch();
	const renderDropdown = (
		_rowId: number,
		_impactType: string,
		value: string | number,
		onChange: (field: string, value: any) => void,
		field: string
	) => {
		const availableTypes = containerTypes.filter(
			(type: any) => !selectedContainerTypes.includes(type.id) || type.id === value
		);

		const dropdownOptions = availableTypes.map((type: any) => ({
			value: type.id.toString(),
			label: type.sku || type.container_type || type.name || 'Unknown',
		}));

		return (
			<BorderlessDropdown
				options={dropdownOptions}
				value={value ? value.toString() : ''}
				onChange={(newValue: string) => {
					onChange(field, newValue);
				}}
				placeholder='Select container type...'
				className='w-full'
				searchable={true}
			/>
		);
	};

	const renderInput = (
		row: SkuMappingRow,
		field: string,
		onChange: (field: string, value: any) => void
	) => {
		const fieldValue = row[field as keyof SkuMappingRow];
		const stringValue = String(fieldValue || '');
		return (
			<input
				type={
					field.includes('price') ||
					field.includes('weight') ||
					field.includes('distance') ||
					field.includes('cycle') ||
					field.includes('Count') ||
					field.includes('Qty')
						? 'number'
						: 'text'
				}
				value={stringValue}
				onChange={e => onChange(field, e.target.value)}
				className='w-full h-[44px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-green-400 focus:ring-1 focus:ring-green-200'
			/>
		);
	};

	const renderCheckbox = (row: SkuMappingRow, onChange: (field: string, value: any) => void) => (
		<div className='flex justify-center'>
			<input
				type='checkbox'
				checked={row.selectSku || false}
				onChange={e => {
					console.log('☑️ Checkbox onChange:', { checked: e.target.checked });
					onChange('selectSku', e.target.checked);
				}}
				className='w-4 h-4'
			/>
		</div>
	);

	const renderStatus = (
		row: SkuMappingRow,
		_impactType: string,
		_rowId: number,
		onChange: (field: string, value: any) => void
	) => {
		const statusOptions = [
			{ value: 'Enabled', label: 'Enabled' },
			{ value: 'Disabled', label: 'Disabled' },
		];

		return (
			<BorderlessDropdown
				options={statusOptions}
				value={row.status || 'Enabled'}
				onChange={(newValue: string) => {
					onChange('status', newValue);
				}}
				placeholder='Select status...'
				className='w-full'
				searchable={false}
			/>
		);
	};

	// If columns is empty, build them internally based on impact type
	const effectiveColumns = columns.length > 0 ? columns : getColumnsForImpactType(impactType);

	// Override render functions in columns
	const customColumns = effectiveColumns.map(col => ({
		...col,
		render: (
			row: SkuMappingRow,
			impType: string,
			rowId: number,
			onChange: (field: string, value: any) => void
		) => {
			if (col.key === 'containerType') {
				return renderDropdown(
					rowId,
					impType,
					row.containerTypeId || '',
					onChange,
					'containerTypeId'
				);
			} else if (
				col.key === 'price' ||
				col.key === 'distanceFromWarehouse' ||
				col.key === 'platesWashedPerCycle' ||
				col.key === 'disposableWeight' ||
				col.key === 'qtyTransportedOneEv' ||
				col.key === 'weight' ||
				col.key === 'numberOfClamshell'
			) {
				return renderInput(row, col.key, onChange);
			} else if (col.key === 'selectSku') {
				return renderCheckbox(row, onChange);
			} else if (col.key === 'status') {
				return renderStatus(row, impType, rowId, onChange);
			} else {
				// Default render if custom render provided
				return col.render ? (
					col.render(row, impType, rowId, onChange)
				) : (
					<div>{(row as any)[col.key]}</div>
				);
			}
		},
	}));

	return (
		<div className='bg-background rounded-lg border border-border p-4 relative'>
			<div className='flex items-center justify-between mb-4'>
				<h3 className='text-lg font-semibold'>{impactType}</h3>
				<Button
					onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
						addRow(impactType);
						e.currentTarget.blur();
					}}
					variant='outline'
					size='sm'
					className='flex items-center space-x-2'
				>
					<Plus className='w-4 h-4' />
					<span>Add Row</span>
				</Button>
			</div>
			{rows.length === 0 ? (
				<p className='text-center text-foreground-muted py-8'>
					No rows added. Click &quot;Add Row&quot; to start.
				</p>
			) : (
				<div className='space-y-2 overflow-x-auto'>
					{/* Header */}
					<div className='grid grid-cols-[60px_60px_180px_100px_120px_120px_80px_80px] gap-2 min-w-[720px] pb-2 border-b border-border items-end'>
						<div className='text-xs font-semibold pb-3 text-center'>#</div>
						<div className='text-xs font-semibold pb-3 text-center'>Actions</div>
						<div
							className='text-xs font-semibold cursor-help flex items-center justify-center gap-1 pb-3'
							title='Container Type'
						>
							Container Type
						</div>
						{customColumns
							.filter(col => col.key !== 'containerType')
							.map(col => (
								<div
									key={col.key}
									className='text-xs font-semibold cursor-help flex items-center justify-center gap-1 pb-3'
									title={col.fullLabel || col.label}
								>
									{col.label}
									{col.fullLabel && col.fullLabel !== col.label && (
										<Info className='w-3 h-3 text-gray-400' />
									)}
								</div>
							))}
					</div>
					{/* Rows */}
					{rows.map((row, index) => (
						<div
							key={row.id}
							className='grid grid-cols-[60px_60px_180px_100px_120px_120px_80px_80px] gap-2 min-w-[720px] items-center py-2 border-b border-border'
						>
							<div className='text-sm text-gray-600 text-center'>{index + 1}</div>
							<div className='flex justify-center'>
								<button
									onClick={() => removeRow(impactType, row.id)}
									className='text-error hover:text-error/80'
								>
									<Trash2 className='w-4 h-4' />
								</button>
							</div>
							{customColumns.map(col => (
								<div key={col.key}>
									{col.render(row, impactType, row.id, (field: string, value: any) => {
										const payload = { rowId: row.id, field, value };
										if (impactType === 'Water Inefficiency') {
											dispatch(updateWaterInefficiencyRow(payload));
										} else if (impactType === 'Single use PP') {
											dispatch(updateSingleUsePpRow(payload));
										} else if (impactType === 'Clamshell' || impactType === 'Clampshell') {
											dispatch(updateClamshellRow(payload));
										}
									})}
								</div>
							))}
						</div>
					))}
				</div>
			)}
		</div>
	);
};
