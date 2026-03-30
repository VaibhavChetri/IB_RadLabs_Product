import React, { useMemo, useState } from 'react';
import {
	Button,
	FloatingDropdown,
	PageHeader,
	Snackbar,
} from '../../../components/ui';
import { TableSkeleton } from '../../../components/ui/Skeleton';
import {
	useEmployeeLeaveBalances,
	useEmployeeManagerOptions,
	useInitializeLeaveBalances,
} from '../../../features/hrm';
import {
	getEmployeeDisplayName,
	getEmployeeOptionLabel,
} from '../../../features/hrm/utils/employeeDisplay';

const getFinancialYear = () => {
	const today = new Date();
	const year = today.getFullYear();
	return today.getMonth() >= 3 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
};

export const LeaveBalances: React.FC = () => {
	const [employeeId, setEmployeeId] = useState('');
	const [financialYear, setFinancialYear] = useState(getFinancialYear());
	const [snackbar, setSnackbar] = useState<{
		open: boolean;
		message: string;
		type: 'success' | 'error';
	}>({ open: false, message: '', type: 'success' });

	const { data: employeeData } = useEmployeeManagerOptions();
	const { data, isLoading } = useEmployeeLeaveBalances(
		employeeId ? Number(employeeId) : undefined,
		financialYear
	);
	const initializeMutation = useInitializeLeaveBalances();

	const employees = Array.isArray((employeeData as any)?.data)
		? (employeeData as any).data
		: [];
	const payload = (data as any)?.data || data || {};
	const balances = Array.isArray(payload?.balances) ? payload.balances : [];

	const selectedEmployee = useMemo(
		() => employees.find((item: any) => String(item.id) === employeeId),
		[employees, employeeId]
	);

	const handleInitialize = async () => {
		if (!employeeId || !financialYear.trim()) return;
		try {
			await initializeMutation.mutateAsync({
				employeeId: Number(employeeId),
				financialYear: financialYear.trim(),
			});
			setSnackbar({
				open: true,
				message: 'Leave balances initialized successfully',
				type: 'success',
			});
		} catch (error: any) {
			setSnackbar({
				open: true,
				message: error?.message || 'Failed to initialize leave balances',
				type: 'error',
			});
		}
	};

	return (
		<div className='min-h-screen bg-white p-4'>
			<div className='max-w-6xl mx-auto space-y-6'>
				<PageHeader
					title='Leave Balances'
					totalItems={balances.length}
					itemType='balance rows'
					icon='⚖️'
				/>

				<div className='bg-white border border-gray-200 rounded-xl p-5'>
					<div className='grid grid-cols-1 md:grid-cols-[2fr_1fr_auto] gap-4 items-end'>
						<FloatingDropdown
							label='Employee'
							options={employees.map((item: any) => ({
								value: String(item.id),
								label: getEmployeeOptionLabel(item),
							}))}
							value={employeeId}
							onChange={setEmployeeId}
						/>
						<div>
							<label className='block text-xs font-medium text-gray-600 mb-1'>
								Financial Year
							</label>
							<input
								className='w-full border border-gray-300 rounded-md px-3 py-3 text-sm'
								value={financialYear}
								onChange={e => setFinancialYear(e.target.value)}
								placeholder='2026-2027'
							/>
						</div>
						<Button
							onClick={handleInitialize}
							disabled={
								initializeMutation.isPending ||
								!employeeId ||
								!financialYear.trim()
							}
						>
							{initializeMutation.isPending ? 'Initializing...' : 'Initialize'}
						</Button>
					</div>
					{selectedEmployee ? (
						<div className='mt-4 text-sm text-gray-600'>
							Showing balances for{' '}
							<span className='font-semibold text-gray-900'>
								{getEmployeeDisplayName(selectedEmployee)}
							</span>{' '}
							in FY <span className='font-semibold text-gray-900'>{financialYear}</span>
						</div>
					) : null}
				</div>

				<div className='bg-white border border-gray-200 rounded-xl p-5'>
					{!employeeId ? (
						<div className='text-sm text-gray-500 bg-gray-50 rounded-lg p-4'>
							Select an employee to view or initialize leave balances.
						</div>
					) : isLoading ? (
						<TableSkeleton rows={5} columns={5} />
					) : (
						<div className='space-y-3'>
							{balances.map((item: any) => (
								<div
									key={item.leave_type_id}
									className='border border-gray-200 rounded-xl p-4 bg-white'
								>
									<div className='grid grid-cols-2 md:grid-cols-6 gap-4'>
										<div>
											<div className='text-xs text-gray-500'>Leave Type</div>
											<div className='font-semibold text-gray-900 mt-1'>
												{item.leave_type_name}
											</div>
											<div className='text-xs text-gray-500'>
												{item.leave_type_code}
											</div>
										</div>
										<div>
											<div className='text-xs text-gray-500'>Opening</div>
											<div className='font-semibold text-gray-900 mt-1'>
												{item.opening_balance}
											</div>
										</div>
										<div>
											<div className='text-xs text-gray-500'>Used</div>
											<div className='font-semibold text-gray-900 mt-1'>
												{item.used}
											</div>
										</div>
										<div>
											<div className='text-xs text-gray-500'>Accrued</div>
											<div className='font-semibold text-gray-900 mt-1'>
												{item.accrued}
											</div>
										</div>
										<div>
											<div className='text-xs text-gray-500'>Lapsed</div>
											<div className='font-semibold text-gray-900 mt-1'>
												{item.lapsed}
											</div>
										</div>
										<div>
											<div className='text-xs text-gray-500'>Closing</div>
											<div className='font-semibold text-green-700 mt-1'>
												{item.closing_balance}
											</div>
										</div>
									</div>
								</div>
							))}
							{balances.length === 0 ? (
								<div className='text-sm text-gray-500 bg-gray-50 rounded-lg p-4'>
									No leave balances found for this employee and financial year.
								</div>
							) : null}
						</div>
					)}
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

export default LeaveBalances;
