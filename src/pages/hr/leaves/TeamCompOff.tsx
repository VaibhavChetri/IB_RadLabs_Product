import React, { useState } from 'react';
import {
	Button,
	FloatingDropdown,
	PageHeader,
	Snackbar,
} from '../../../components/ui';
import { TableSkeleton } from '../../../components/ui/Skeleton';
import {
	useCompOffData,
	useCreateCompOff,
	useEmployeeManagerOptions,
} from '../../../features/hrm';
import { getEmployeeOptionLabel } from '../../../features/hrm/utils/employeeDisplay';

const STATUS_OPTIONS = [
	{ value: '', label: 'All Statuses' },
	{ value: 'available', label: 'Available' },
	{ value: 'used', label: 'Used' },
	{ value: 'expired', label: 'Expired' },
];

const parseItems = (raw: any) => {
	if (Array.isArray(raw?.data)) return raw.data;
	if (Array.isArray(raw)) return raw;
	return [];
};

const formatDate = (value?: string) =>
	value
		? new Date(value).toLocaleDateString('en-IN', {
				day: '2-digit',
				month: 'short',
				year: 'numeric',
		  })
		: '--';

export const TeamCompOff: React.FC = () => {
	const [status, setStatus] = useState('');
	const [employeeId, setEmployeeId] = useState('');
	const [earnedDate, setEarnedDate] = useState('');
	const [expiryDate, setExpiryDate] = useState('');
	const [remarks, setRemarks] = useState('');
	const [snackbar, setSnackbar] = useState<{
		open: boolean;
		message: string;
		type: 'success' | 'error';
	}>({ open: false, message: '', type: 'success' });

	const { data: employeeData } = useEmployeeManagerOptions();
	const { data: compOffData, isLoading } = useCompOffData({
		status: status ? (status as any) : undefined,
		employee_id: employeeId ? Number(employeeId) : undefined,
		limit: 'all',
	});
	const createMutation = useCreateCompOff();

	const employees = Array.isArray((employeeData as any)?.data)
		? (employeeData as any).data
		: [];
	const compOffs = parseItems(compOffData);

	const handleSubmit = async () => {
		if (!employeeId || !earnedDate) return;
		try {
			await createMutation.mutateAsync({
				employee_id: Number(employeeId),
				earned_date: earnedDate,
				expiry_date: expiryDate || undefined,
				remarks: remarks.trim() || undefined,
			});
			setSnackbar({
				open: true,
				message: 'Comp-off logged successfully',
				type: 'success',
			});
			setEarnedDate('');
			setExpiryDate('');
			setRemarks('');
		} catch (error: any) {
			setSnackbar({
				open: true,
				message: error?.message || 'Failed to log comp-off',
				type: 'error',
			});
		}
	};

	return (
		<div className='min-h-screen bg-white p-4'>
			<div className='max-w-6xl mx-auto space-y-6'>
				<PageHeader
					title='Team Comp-Off'
					totalItems={compOffs.length}
					itemType='records'
					icon='🎁'
				/>

				<div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
					<div className='bg-white border border-gray-200 rounded-xl p-5'>
						<h2 className='text-lg font-semibold text-gray-900 mb-4'>
							Log Comp-Off
						</h2>
						<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
							<FloatingDropdown
								label='Employee'
								options={employees.map((item: any) => ({
									value: String(item.id),
									label: getEmployeeOptionLabel(item),
								}))}
								value={employeeId}
								onChange={setEmployeeId}
								className='md:col-span-2'
							/>
							<div>
								<label className='block text-xs font-medium text-gray-600 mb-1'>
									Earned Date
								</label>
								<input
									type='date'
									className='w-full border border-gray-300 rounded-md px-3 py-3 text-sm'
									value={earnedDate}
									onChange={e => setEarnedDate(e.target.value)}
								/>
							</div>
							<div>
								<label className='block text-xs font-medium text-gray-600 mb-1'>
									Expiry Date
								</label>
								<input
									type='date'
									className='w-full border border-gray-300 rounded-md px-3 py-3 text-sm'
									value={expiryDate}
									onChange={e => setExpiryDate(e.target.value)}
								/>
							</div>
							<div className='md:col-span-2'>
								<label className='block text-xs font-medium text-gray-600 mb-1'>
									Remarks
								</label>
								<textarea
									className='w-full border border-gray-300 rounded-md px-3 py-3 text-sm min-h-24'
									value={remarks}
									onChange={e => setRemarks(e.target.value)}
								/>
							</div>
						</div>
						<div className='mt-4 flex justify-end'>
							<Button
								onClick={handleSubmit}
								disabled={createMutation.isPending || !employeeId || !earnedDate}
							>
								{createMutation.isPending ? 'Saving...' : 'Log Comp-Off'}
							</Button>
						</div>
					</div>

					<div className='bg-white border border-gray-200 rounded-xl p-5'>
						<div className='flex items-center justify-between gap-4 mb-4 flex-wrap'>
							<h2 className='text-lg font-semibold text-gray-900'>
								Team Comp-Off Records
							</h2>
							<div className='w-44'>
								<FloatingDropdown
									label='Status'
									options={STATUS_OPTIONS}
									value={status}
									onChange={setStatus}
									searchable={false}
								/>
							</div>
						</div>
						{isLoading ? (
							<TableSkeleton rows={4} columns={4} />
						) : (
							<div className='space-y-3'>
								{compOffs.map((item: any) => {
									const expiringSoon =
										item.status === 'available' &&
										item.expiry_date &&
										(new Date(item.expiry_date).getTime() - Date.now()) /
											(1000 * 60 * 60 * 24) <=
											7;

									return (
										<div
											key={item.id}
											className='border border-gray-200 rounded-lg p-4 flex items-start justify-between gap-4'
										>
											<div>
												<div className='font-medium text-gray-900'>
													{item.employee_name || 'Employee'}
												</div>
												<div className='text-sm text-gray-500 mt-1'>
													Earned on {formatDate(item.earned_date)}
												</div>
												<div className='text-sm text-gray-600 mt-2'>
													{item.remarks || 'No remarks added'}
												</div>
											</div>
											<div className='text-right'>
												<div
													className={`text-sm font-medium ${
														expiringSoon ? 'text-red-600' : 'text-gray-900'
													}`}
												>
													Expires {formatDate(item.expiry_date)}
												</div>
												<div className='text-xs uppercase text-gray-500 mt-1'>
													{item.status}
												</div>
											</div>
										</div>
									);
								})}
								{compOffs.length === 0 ? (
									<div className='text-sm text-gray-500 bg-gray-50 rounded-lg p-4'>
										No comp-off records found for the selected filters.
									</div>
								) : null}
							</div>
						)}
					</div>
				</div>
			</div>

			<Snackbar
				message={snackbar.message}
				type={snackbar.type}
				open={snackbar.open}
				onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
			/>
		</div>
	);
};

export default TeamCompOff;
