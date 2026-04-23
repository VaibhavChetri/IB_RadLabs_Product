import React, { useMemo, useState } from 'react';
import { FloatingDropdown, PageHeader } from '../../../components/ui';
import { TableSkeleton } from '../../../components/ui/Skeleton';
import {
	useAttendanceSummary,
	useEmployeeManagerOptions,
} from '../../../features/hrm';
import {
	getEmployeeDisplayName,
	getEmployeeOptionLabel,
} from '../../../features/hrm/utils/employeeDisplay';

const currentYear = new Date().getFullYear();

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, idx) => ({
	value: String(idx + 1),
	label: new Date(2000, idx, 1).toLocaleString('en-IN', { month: 'short' }),
}));

const YEAR_OPTIONS = [currentYear - 1, currentYear, currentYear + 1].map(year => ({
	value: String(year),
	label: String(year),
}));

export const AttendanceSummary: React.FC = () => {
	const [employeeId, setEmployeeId] = useState('');
	const [month, setMonth] = useState(String(new Date().getMonth() + 1));
	const [year, setYear] = useState(String(currentYear));

	const { data: employeeData } = useEmployeeManagerOptions();
	const { data, isLoading } = useAttendanceSummary(
		employeeId
			? { employee_id: Number(employeeId), month: Number(month), year: Number(year) }
			: undefined
	);

	const employees = Array.isArray((employeeData as any)?.data)
		? (employeeData as any).data
		: [];
	const summary = (data as any)?.data || data || {};
	const selectedEmployee = useMemo(
		() => employees.find((item: any) => String(item.id) === employeeId),
		[employees, employeeId]
	);

	return (
		<div className='min-h-screen bg-white p-4'>
			<div className='max-w-6xl mx-auto space-y-6'>
				<PageHeader
					title='Attendance Summary'
					totalItems={employeeId ? 1 : 0}
					itemType='employees'
					icon='📊'
				/>

				<div className='bg-white border border-gray-200 rounded-xl p-5'>
					<div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
						<FloatingDropdown
							label='Employee'
							options={employees.map((item: any) => ({
								value: String(item.id),
								label: getEmployeeOptionLabel(item),
							}))}
							value={employeeId}
							onChange={setEmployeeId}
						/>
						<FloatingDropdown
							label='Month'
							options={MONTH_OPTIONS}
							value={month}
							onChange={setMonth}
							searchable={false}
						/>
						<FloatingDropdown
							label='Year'
							options={YEAR_OPTIONS}
							value={year}
							onChange={setYear}
							searchable={false}
						/>
					</div>
				</div>

				<div className='bg-white border border-gray-200 rounded-xl p-5'>
					{!employeeId ? (
						<div className='text-sm text-gray-500 bg-gray-50 rounded-lg p-4'>
							Select an employee to view the monthly attendance summary.
						</div>
					) : isLoading ? (
						<TableSkeleton rows={2} columns={4} />
					) : (
						<div className='space-y-6'>
							<div>
								<h2 className='text-lg font-semibold text-gray-900'>
									{getEmployeeDisplayName(selectedEmployee)}
								</h2>
								<div className='text-sm text-gray-500 mt-1'>
									Month {month} / {year}
								</div>
							</div>
							<div className='grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-3'>
								{[
									['Calendar Days', summary.total_calendar_days || 0],
									['Working Days', summary.total_working_days || 0],
									['Present', summary.present || 0],
									['Absent', summary.absent || 0],
									['Half Day', summary.half_day || 0],
									['On Leave', summary.on_leave || 0],
									['Holiday', summary.holiday || 0],
									['Weekend', summary.weekend || 0],
									['Comp Off', summary.comp_off || 0],
									['Paid Days', summary.paid_days || 0],
									['LOP Days', summary.lop_days || 0],
								].map(([label, value]) => (
									<div
										key={String(label)}
										className='border border-gray-200 rounded-xl p-4 bg-white'
									>
										<div className='text-xs text-gray-500'>{label}</div>
										<div className='text-2xl font-bold text-gray-900 mt-1'>
											{value as number}
										</div>
									</div>
								))}
							</div>
							<div className='rounded-xl bg-slate-50 border border-slate-200 p-4 text-sm text-slate-700'>
								Paid days = Present + Half Day x 0.5 + On Leave + Comp Off.
								LOP days = Absent.
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default AttendanceSummary;
