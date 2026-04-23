import React, { useMemo, useState } from 'react';
import { FloatingDropdown, PageHeader } from '../../../components/ui';
import { TableSkeleton } from '../../../components/ui/Skeleton';
import {
	useEmployeeManagerOptions,
	useTeamAttendance,
} from '../../../features/hrm';
import { getEmployeeOptionLabel } from '../../../features/hrm/utils/employeeDisplay';

const currentYear = new Date().getFullYear();

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, idx) => ({
	value: String(idx + 1),
	label: new Date(2000, idx, 1).toLocaleString('en-IN', { month: 'short' }),
}));

const YEAR_OPTIONS = [currentYear - 1, currentYear, currentYear + 1].map(year => ({
	value: String(year),
	label: String(year),
}));

const STATUS_OPTIONS = [
	{ value: '', label: 'All Statuses' },
	{ value: 'present', label: 'Present' },
	{ value: 'absent', label: 'Absent' },
	{ value: 'half_day', label: 'Half Day' },
	{ value: 'on_leave', label: 'On Leave' },
	{ value: 'holiday', label: 'Holiday' },
	{ value: 'weekend', label: 'Weekend' },
	{ value: 'comp_off', label: 'Comp Off' },
];

const cellStyles: Record<string, string> = {
	present: 'bg-green-50 text-green-700 border-green-200',
	absent: 'bg-red-50 text-red-700 border-red-200',
	half_day: 'bg-amber-50 text-amber-700 border-amber-200',
	on_leave: 'bg-blue-50 text-blue-700 border-blue-200',
	holiday: 'bg-purple-50 text-purple-700 border-purple-200',
	weekend: 'bg-gray-100 text-gray-600 border-gray-200',
	comp_off: 'bg-teal-50 text-teal-700 border-teal-200',
};

const abbreviations: Record<string, string> = {
	present: 'P',
	absent: 'A',
	half_day: 'HD',
	on_leave: 'LV',
	holiday: 'HOL',
	weekend: 'WE',
	comp_off: 'CO',
};

const parseItems = (raw: any) => {
	if (Array.isArray(raw?.data)) return raw.data;
	if (Array.isArray(raw)) return raw;
	return [];
};

const getDaysInMonth = (month: number, year: number) =>
	new Date(year, month, 0).getDate();

export const TeamAttendance: React.FC = () => {
	const [month, setMonth] = useState(String(new Date().getMonth() + 1));
	const [year, setYear] = useState(String(currentYear));
	const [employeeId, setEmployeeId] = useState('');
	const [status, setStatus] = useState('');

	const { data: employeeData } = useEmployeeManagerOptions();
	const { data, isLoading } = useTeamAttendance({
		month: Number(month),
		year: Number(year),
		employee_id: employeeId ? Number(employeeId) : undefined,
		status: status ? (status as any) : undefined,
		limit: 'all',
	});

	const employees = Array.isArray((employeeData as any)?.data)
		? (employeeData as any).data
		: [];
	const rows = parseItems(data);
	const dayNumbers = useMemo(
		() =>
			Array.from(
				{ length: getDaysInMonth(Number(month), Number(year)) },
				(_, idx) => idx + 1
			),
		[month, year]
	);

	return (
		<div className='min-h-screen bg-white p-4'>
			<div className='max-w-[95rem] mx-auto space-y-6'>
				<PageHeader
					title='Team Attendance'
					totalItems={rows.length}
					itemType='employees'
					icon='📆'
				/>

				<div className='bg-white border border-gray-200 rounded-xl p-5'>
					<div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4'>
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
						<FloatingDropdown
							label='Employee'
							options={[
								{ value: '', label: 'All Employees' },
								...employees.map((item: any) => ({
									value: String(item.id),
									label: getEmployeeOptionLabel(item),
								})),
							]}
							value={employeeId}
							onChange={setEmployeeId}
						/>
						<FloatingDropdown
							label='Status'
							options={STATUS_OPTIONS}
							value={status}
							onChange={setStatus}
							searchable={false}
						/>
					</div>
				</div>

				<div className='bg-white border border-gray-200 rounded-xl p-5 overflow-hidden'>
					{isLoading ? (
						<TableSkeleton rows={6} columns={10} />
					) : rows.length === 0 ? (
						<div className='text-sm text-gray-500 bg-gray-50 rounded-lg p-4'>
							No team attendance data found for the selected month.
						</div>
					) : (
						<div className='overflow-x-auto'>
							<table className='min-w-full border-separate border-spacing-0 text-sm'>
								<thead>
									<tr>
										<th className='sticky left-0 z-10 bg-white border-b border-gray-200 px-4 py-3 text-left min-w-[220px]'>
											Employee
										</th>
										{dayNumbers.map(day => (
											<th
												key={day}
												className='border-b border-gray-200 px-2 py-3 text-center text-xs text-gray-500 min-w-[56px]'
											>
												{day}
											</th>
										))}
										<th className='border-b border-gray-200 px-4 py-3 text-left min-w-[160px]'>
											Summary
										</th>
									</tr>
								</thead>
								<tbody>
									{rows.map((row: any) => {
										const recordMap = new Map<string, { status: string }>(
											(row.records || []).map((record: any) => [record.date, record])
										);
										return (
											<tr key={row.employee_id}>
												<td className='sticky left-0 z-10 bg-white border-b border-gray-100 px-4 py-3 align-top'>
													<div className='font-semibold text-gray-900'>
														{row.employee_name}
													</div>
													<div className='text-xs text-gray-500'>
														{row.employee_code}
													</div>
												</td>
												{dayNumbers.map(day => {
													const isoDate = `${year}-${month.padStart(2, '0')}-${String(
														day
													).padStart(2, '0')}`;
													const record = recordMap.get(isoDate);
													const statusValue = record?.status || '';
													return (
														<td
															key={`${row.employee_id}-${day}`}
															className='border-b border-gray-100 px-2 py-3 text-center'
														>
															{statusValue ? (
																<span
																	className={`inline-flex items-center justify-center min-w-[38px] px-2 py-1 rounded-md border text-[11px] font-medium ${
																		cellStyles[statusValue] || cellStyles.weekend
																	}`}
																	title={statusValue}
																>
																	{abbreviations[statusValue] || statusValue}
																</span>
															) : (
																<span className='text-gray-300'>-</span>
															)}
														</td>
													);
												})}
												<td className='border-b border-gray-100 px-4 py-3 align-top'>
													<div className='text-xs text-gray-600 space-y-1'>
														<div>P: {row.summary?.present || 0}</div>
														<div>A: {row.summary?.absent || 0}</div>
														<div>LV: {row.summary?.on_leave || 0}</div>
														<div>HD: {row.summary?.half_day || 0}</div>
													</div>
												</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default TeamAttendance;
