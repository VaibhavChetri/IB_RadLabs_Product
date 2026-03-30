import React, { useMemo, useState } from 'react';
import { Button, FloatingDropdown, PageHeader, Snackbar } from '../../../components/ui';
import { TableSkeleton } from '../../../components/ui/Skeleton';
import { useAttendanceRegularizations, useCreateAttendanceRegularization, useMyAttendance } from '../../../features/hrm';

const currentYear = new Date().getFullYear();
const MONTH_OPTIONS = Array.from({ length: 12 }, (_, idx) => ({
	value: String(idx + 1),
	label: new Date(2000, idx, 1).toLocaleString('en-IN', { month: 'short' }),
}));
const YEAR_OPTIONS = [currentYear - 1, currentYear, currentYear + 1].map(year => ({ value: String(year), label: String(year) }));
const STATUS_OPTIONS = [
	{ value: 'present', label: 'Present' },
	{ value: 'absent', label: 'Absent' },
	{ value: 'half_day', label: 'Half Day' },
	{ value: 'comp_off', label: 'Comp Off' },
];

export const RegularizeAttendance: React.FC = () => {
	const [month, setMonth] = useState(String(new Date().getMonth() + 1));
	const [year, setYear] = useState(String(currentYear));
	const [selectedAttendanceId, setSelectedAttendanceId] = useState('');
	const [requestedStatus, setRequestedStatus] = useState('present');
	const [reason, setReason] = useState('');
	const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; type: 'success' | 'error' }>({ open: false, message: '', type: 'success' });

	const { data: attendanceData, isLoading: attendanceLoading } = useMyAttendance({ month: Number(month), year: Number(year), limit: 'all' });
	const { data: regularizationData, isLoading: requestsLoading } = useAttendanceRegularizations({ month: Number(month), year: Number(year), limit: 'all' });
	const createMutation = useCreateAttendanceRegularization();

	const attendanceRows = Array.isArray((attendanceData as any)?.data) ? (attendanceData as any).data : [];
	const eligibleAttendance = useMemo(() => attendanceRows.filter((item: any) => !['holiday', 'weekend'].includes(item.status)), [attendanceRows]);
	const requests = Array.isArray((regularizationData as any)?.data) ? (regularizationData as any).data : [];

	const handleSubmit = async () => {
		if (!selectedAttendanceId || reason.trim().length < 5) return;
		try {
			await createMutation.mutateAsync({
				attendance_id: Number(selectedAttendanceId),
				requested_status: requestedStatus as any,
				reason: reason.trim(),
			});
			setSnackbar({ open: true, message: 'Regularization request submitted', type: 'success' });
			setSelectedAttendanceId('');
			setRequestedStatus('present');
			setReason('');
		} catch (error: any) {
			setSnackbar({ open: true, message: error?.message || 'Failed to submit regularization request', type: 'error' });
		}
	};

	return (
		<div className='min-h-screen bg-white p-4'>
			<div className='max-w-6xl mx-auto space-y-6'>
				<PageHeader title='Regularize Attendance' totalItems={requests.length} itemType='requests' icon='🛠️' />

				<div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
					<div className='bg-white border border-gray-200 rounded-xl p-5'>
						<h2 className='text-lg font-semibold text-gray-900 mb-4'>Request Correction</h2>
						<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
							<FloatingDropdown label='Month' options={MONTH_OPTIONS} value={month} onChange={setMonth} searchable={false} />
							<FloatingDropdown label='Year' options={YEAR_OPTIONS} value={year} onChange={setYear} searchable={false} />
							<FloatingDropdown
								label='Attendance Record'
								options={eligibleAttendance.map((item: any) => ({ value: String(item.id), label: `${item.attendance_date} • ${item.status}` }))}
								value={selectedAttendanceId}
								onChange={setSelectedAttendanceId}
								className='md:col-span-2'
								searchable={false}
							/>
							<FloatingDropdown label='Requested Status' options={STATUS_OPTIONS} value={requestedStatus} onChange={setRequestedStatus} searchable={false} />
							<div className='md:col-span-2'>
								<label className='block text-xs font-medium text-gray-600 mb-1'>Reason</label>
								<textarea className='w-full border border-gray-300 rounded-md px-3 py-3 text-sm min-h-28' value={reason} onChange={e => setReason(e.target.value)} />
							</div>
						</div>
						<div className='mt-4 flex justify-end'>
							<Button variant='primary' onClick={handleSubmit} disabled={createMutation.isPending || !selectedAttendanceId || reason.trim().length < 5}>
								{createMutation.isPending ? 'Submitting...' : 'Submit Request'}
							</Button>
						</div>
					</div>

					<div className='bg-white border border-gray-200 rounded-xl p-5'>
						<h2 className='text-lg font-semibold text-gray-900 mb-4'>Eligible Attendance Records</h2>
						{attendanceLoading ? <TableSkeleton rows={4} columns={3} /> : (
							<div className='space-y-3'>
								{eligibleAttendance.map((item: any) => (
									<div key={item.id} className='border border-gray-200 rounded-lg p-4 flex items-center justify-between gap-4'>
										<div>
											<div className='font-medium text-gray-900'>{item.attendance_date}</div>
											<div className='text-sm text-gray-500 mt-1'>{item.status}</div>
										</div>
										<button className='text-sm text-primary hover:underline' onClick={() => setSelectedAttendanceId(String(item.id))}>
											Select
										</button>
									</div>
								))}
								{eligibleAttendance.length === 0 ? <div className='text-sm text-gray-500 bg-gray-50 rounded-lg p-4'>No attendance records available for regularization in this month.</div> : null}
							</div>
						)}
					</div>
				</div>

				<div className='bg-white border border-gray-200 rounded-xl p-5'>
					<h2 className='text-lg font-semibold text-gray-900 mb-4'>My Requests</h2>
					{requestsLoading ? <TableSkeleton rows={4} columns={4} /> : (
						<div className='space-y-3'>
							{requests.map((item: any) => (
								<div key={item.id} className='border border-gray-200 rounded-lg p-4'>
									<div className='flex items-center justify-between gap-4'>
										<div>
											<div className='font-medium text-gray-900'>{item.attendance_date}</div>
											<div className='text-sm text-gray-500 mt-1'>{item.original_status} → {item.requested_status}</div>
											<div className='text-sm text-gray-600 mt-2'>{item.reason}</div>
										</div>
										<div className='text-xs uppercase text-gray-500'>{item.review_status}</div>
									</div>
								</div>
							))}
							{requests.length === 0 ? <div className='text-sm text-gray-500 bg-gray-50 rounded-lg p-4'>No regularization requests submitted yet.</div> : null}
						</div>
					)}
				</div>
			</div>
			<Snackbar message={snackbar.message} type={snackbar.type} open={snackbar.open} onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} />
		</div>
	);
};

export default RegularizeAttendance;
