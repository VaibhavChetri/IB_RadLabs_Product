import React, { useState } from 'react';
import { FloatingDropdown, PageHeader } from '../../../components/ui';
import { TableSkeleton } from '../../../components/ui/Skeleton';
import { useCompOffData } from '../../../features/hrm';

const STATUS_OPTIONS = [
	{ value: '', label: 'All' },
	{ value: 'available', label: 'Available' },
	{ value: 'used', label: 'Used' },
	{ value: 'expired', label: 'Expired' },
];

const parseItems = (raw: any) => {
	if (Array.isArray(raw?.data)) return raw.data;
	if (Array.isArray(raw)) return raw;
	return [];
};

export const MyCompOff: React.FC = () => {
	const [status, setStatus] = useState('');
	const { data, isLoading } = useCompOffData({ status: (status || undefined) as any, limit: 'all' });
	const items = parseItems(data);

	return (
		<div className='min-h-screen bg-white p-4'>
			<div className='max-w-5xl mx-auto space-y-6'>
				<PageHeader title='My Comp-Off' totalItems={items.length} itemType='records' icon='🗓️' />
				<div className='bg-white border border-gray-200 rounded-xl p-5'>
					<div className='flex justify-end mb-4'>
						<FloatingDropdown label='Status' options={STATUS_OPTIONS} value={status} onChange={setStatus} className='w-44' searchable={false} />
					</div>
					{isLoading ? <TableSkeleton rows={4} columns={4} /> : (
						<div className='space-y-3'>
							{items.map((item: any) => {
								const expiringSoon = item.status === 'available' && item.expiry_date && ((new Date(item.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) <= 7;
								return (
									<div key={item.id} className='border border-gray-200 rounded-lg p-4 flex items-center justify-between gap-4'>
										<div>
											<div className='font-medium text-gray-900'>{item.remarks || 'Comp-Off Entry'}</div>
											<div className='text-sm text-gray-500 mt-1'>Earned: {item.earned_date}</div>
										</div>
										<div className='text-right'>
											<div className={`text-sm font-medium ${expiringSoon ? 'text-red-600' : 'text-gray-900'}`}>Expires: {item.expiry_date}</div>
											<div className='text-xs text-gray-500 mt-1 uppercase'>{item.status}</div>
										</div>
									</div>
								);
							})}
							{items.length === 0 ? <div className='text-sm text-gray-500 bg-gray-50 rounded-lg p-4'>No comp-off records found.</div> : null}
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default MyCompOff;
