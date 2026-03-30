import React, { useState } from 'react';
import { FloatingDropdown, PageHeader } from '../../../components/ui';
import { TableSkeleton } from '../../../components/ui/Skeleton';
import { useMyAttendance } from '../../../features/hrm';

const currentYear = new Date().getFullYear();
const MONTH_OPTIONS = Array.from({ length: 12 }, (_, idx) => ({
	value: String(idx + 1),
	label: new Date(2000, idx, 1).toLocaleString('en-IN', { month: 'short' }),
}));
const YEAR_OPTIONS = [currentYear - 1, currentYear, currentYear + 1].map(year => ({ value: String(year), label: String(year) }));

const getStatusClasses = (status: string) => {
	switch (status) {
		case 'present':
			return 'bg-green-50 text-green-700 border-green-200';
		case 'absent':
			return 'bg-red-50 text-red-700 border-red-200';
		case 'half_day':
			return 'bg-amber-50 text-amber-700 border-amber-200';
		case 'on_leave':
			return 'bg-blue-50 text-blue-700 border-blue-200';
		case 'holiday':
			return 'bg-purple-50 text-purple-700 border-purple-200';
		case 'weekend':
			return 'bg-gray-100 text-gray-600 border-gray-200';
		default:
			return 'bg-teal-50 text-teal-700 border-teal-200';
	}
};

export const MyAttendance: React.FC = () => {
	const [month, setMonth] = useState(String(new Date().getMonth() + 1));
	const [year, setYear] = useState(String(currentYear));
	const { data, isLoading } = useMyAttendance({ month: Number(month), year: Number(year), limit: 'all' });

	const records = Array.isArray((data as any)?.data) ? (data as any).data : [];
	const summary = (data as any)?.summary || {};

	return (
		<div className='min-h-screen bg-white p-4'>
			<div className='max-w-6xl mx-auto space-y-6'>
				<PageHeader title='My Attendance' totalItems={records.length} itemType='records' icon='🕒' />

				<div className='flex justify-end gap-3'>
					<FloatingDropdown label='Month' options={MONTH_OPTIONS} value={month} onChange={setMonth} className='w-36' searchable={false} />
					<FloatingDropdown label='Year' options={YEAR_OPTIONS} value={year} onChange={setYear} className='w-32' searchable={false} />
				</div>

				<div className='grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3'>
					{[
						['Present', summary.present || 0],
						['Absent', summary.absent || 0],
						['Half Day', summary.half_day || 0],
						['On Leave', summary.on_leave || 0],
						['Holiday', summary.holiday || 0],
						['Weekend', summary.weekend || 0],
						['Comp Off', summary.comp_off || 0],
					].map(([label, value]) => (
						<div key={String(label)} className='border border-gray-200 rounded-xl p-4 bg-white'>
							<div className='text-xs text-gray-500'>{label}</div>
							<div className='text-2xl font-bold text-gray-900 mt-1'>{value as number}</div>
						</div>
					))}
				</div>

				<div className='bg-white border border-gray-200 rounded-xl p-5'>
					{isLoading ? <TableSkeleton rows={5} columns={4} /> : (
						<div className='space-y-3'>
							{records.map((item: any) => (
								<div key={item.id} className='border border-gray-200 rounded-lg p-4 flex items-center justify-between gap-4'>
									<div>
										<div className='font-medium text-gray-900'>{item.attendance_date}</div>
										<div className='text-sm text-gray-500 mt-1'>{item.source || 'system'} {item.remarks ? `• ${item.remarks}` : ''}</div>
									</div>
									<span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusClasses(item.status)}`}>{item.status}</span>
								</div>
							))}
							{records.length === 0 ? <div className='text-sm text-gray-500 bg-gray-50 rounded-lg p-4'>No attendance data found for the selected month.</div> : null}
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default MyAttendance;
