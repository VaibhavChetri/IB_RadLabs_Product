import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { PageHeader, Button, Snackbar, FloatingInput } from '../../../components/ui';
import { TableSkeleton } from '../../../components/ui/Skeleton';
import { useHolidayConfig, useUpdateHolidayConfig, HOLIDAY_CONFIG_LABELS } from '../../../features/hrm';

export const HolidayConfig: React.FC = () => {
	const [editedValues, setEditedValues] = useState<Record<string, string>>({});
	const [savingKey, setSavingKey] = useState<string | null>(null);
	const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; type: 'success' | 'error' }>({ open: false, message: '', type: 'success' });

	const { data: configData, isLoading, error } = useHolidayConfig();
	const updateMutation = useUpdateHolidayConfig();

	const raw = configData as any;
	const configList = raw?.data?.data || raw?.data || raw || [];
	const items = Array.isArray(configList) ? configList : [];

	useEffect(() => {
		if (error) {
			setSnackbar({ open: true, message: 'Failed to load config', type: 'error' });
		}
	}, [error]);

	useEffect(() => {
		if (items.length > 0) {
			const initial: Record<string, string> = {};
			items.forEach((item: any) => {
				initial[item.config_key] = item.config_value;
			});
			setEditedValues(initial);
		}
	}, [items]);

	const handleSave = async (key: string) => {
		setSavingKey(key);
		try {
			await updateMutation.mutateAsync({ key, value: editedValues[key] });
			setSnackbar({ open: true, message: 'Config updated', type: 'success' });
		} catch (err: any) {
			setSnackbar({ open: true, message: err?.message || 'Failed to update', type: 'error' });
		} finally {
			setSavingKey(null);
		}
	};

	const hasChanged = (key: string) => {
		const original = items.find((i: any) => i.config_key === key);
		return original && editedValues[key] !== original.config_value;
	};

	return (
		<div className='min-h-screen bg-white p-4'>
			<div className='max-w-3xl mx-auto'>
				<div className='flex items-center justify-between mb-6'>
					<PageHeader title='System Config' totalItems={items.length} itemType='settings' icon='⚙️' />
				</div>

				{isLoading ? (
					<TableSkeleton rows={6} columns={3} />
				) : items.length === 0 ? (
					<div className='text-center py-12 text-gray-500'>No configuration found</div>
				) : (
					<div className='space-y-3'>
						{items.map((item: any) => {
							const meta = HOLIDAY_CONFIG_LABELS[item.config_key];
							const label = meta?.label || item.config_key;
							const inputType = meta?.inputType || 'text';

							return (
								<div key={item.config_key} className='flex items-start gap-4 p-4 rounded-lg border border-gray-100 bg-white hover:bg-gray-50 transition-colors'>
									<div className='flex-1'>
										<div className='font-medium text-gray-900 mb-1'>{label}</div>
										{item.description && (
											<div className='text-xs text-gray-500 mb-2'>{item.description}</div>
										)}
										<FloatingInput
											label={label}
											value={editedValues[item.config_key] || ''}
											onChange={(value: string) => setEditedValues(prev => ({ ...prev, [item.config_key]: value }))}
											type={inputType as 'text' | 'number'}
											className='max-w-xs'
										/>
									</div>
									<div className='pt-6'>
										<Button
											variant='primary'
											size='sm'
											onClick={() => handleSave(item.config_key)}
											disabled={!hasChanged(item.config_key) || savingKey === item.config_key}
											leftIcon={<Save className='w-3 h-3' />}
										>
											{savingKey === item.config_key ? 'Saving...' : 'Save'}
										</Button>
									</div>
								</div>
							);
						})}
					</div>
				)}

				<Snackbar message={snackbar.message} type={snackbar.type} open={snackbar.open} onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} />
			</div>
		</div>
	);
};

export default HolidayConfig;
