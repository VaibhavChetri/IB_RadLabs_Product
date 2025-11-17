import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader, Snackbar, FloatingInput, FloatingDropdown, Dropdown, Button } from '../../../components/ui';
import {
	ShiftApiService,
	Hora,
	ShiftStatus,
	OpsStatus,
	EscalationManager,
	CheckInShiftOpsStatusRequest,
} from '../../../services/shiftApi';

interface ResourceRow {
	resourceId: number;
	resourceName: string;
	opsStatusId: number | null;
	escalationManagerId: number | null;
}

export const ShiftReportingAdd: React.FC = () => {
	const navigate = useNavigate();
	// Set default date to today in YYYY-MM-DD format
	const getTodayDate = () => {
		const today = new Date();
		const year = today.getFullYear();
		const month = String(today.getMonth() + 1).padStart(2, '0');
		const day = String(today.getDate()).padStart(2, '0');
		return `${year}-${month}-${day}`;
	};
	const [shiftDate, setShiftDate] = useState<string>(getTodayDate());
	const [selectedHoraId, setSelectedHoraId] = useState<number | null>(null);
	const [horaOptions, setHoraOptions] = useState<Hora[]>([]);
	const [shiftStatus, setShiftStatus] = useState<ShiftStatus | null>(null);
	const [opsStatusOptions, setOpsStatusOptions] = useState<OpsStatus[]>([]);
	const [escalationManagers, setEscalationManagers] = useState<EscalationManager[]>([]);
	const [resourceRows, setResourceRows] = useState<ResourceRow[]>([]);
	const [loading, setLoading] = useState(false);
	const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; type: 'success' | 'error' }>({
		open: false,
		message: '',
		type: 'success',
	});

	// Load Hora options on mount
	useEffect(() => {
		const loadHoraOptions = async () => {
			try {
				const response = await ShiftApiService.getHora();
				if (response.status === 'Success' && response.result) {
					setHoraOptions(response.result);
				}
			} catch (error) {
				console.error('Failed to load Hora options:', error);
				setSnackbar({
					open: true,
					message: 'Failed to load time options',
					type: 'error',
				});
			}
		};
		loadHoraOptions();
	}, []);

	// Load resources, ops status, and escalation managers on mount
	useEffect(() => {
		const loadInitialData = async () => {
			try {
				const [resourcesRes, opsStatusRes, escalationRes] = await Promise.all([
					ShiftApiService.getFacilityResources(1, 100),
					ShiftApiService.getOpsStatusValues(),
					ShiftApiService.getEscalationManagers(),
				]);

				if (resourcesRes.status === 'Success' && resourcesRes.data) {
					// Initialize resource rows
					const initialRows: ResourceRow[] = resourcesRes.data.map(resource => ({
						resourceId: resource.id,
						resourceName: resource.name,
						opsStatusId: null,
						escalationManagerId: null,
					}));
					setResourceRows(initialRows);
				}

				if (opsStatusRes.status === 'Success' && opsStatusRes.data) {
					setOpsStatusOptions(opsStatusRes.data);
				}

				if (escalationRes.status === 'Success' && escalationRes.data) {
					setEscalationManagers(escalationRes.data);
				}
			} catch (error) {
				console.error('Failed to load initial data:', error);
				setSnackbar({
					open: true,
					message: 'Failed to load resources',
					type: 'error',
				});
			}
		};
		loadInitialData();
	}, []);

	// Check shift status when hora (time) is selected
	useEffect(() => {
		const checkShiftStatus = async () => {
			if (!selectedHoraId || !shiftDate) {
				setShiftStatus(null);
				return;
			}

			setLoading(true);
			try {
				console.log('Calling getShiftStatusByDate with:', { shift_date: shiftDate, hora_id: selectedHoraId });
				const response = await ShiftApiService.getShiftStatusByDate(shiftDate, selectedHoraId);
				console.log('Shift status response:', response);
				if (response.status === 'Success' && response.shifts) {
					if (response.shifts.length > 0) {
						setShiftStatus(response.shifts[0]);
					} else {
						setShiftStatus(null);
					}
				}
			} catch (error) {
				console.error('Failed to check shift status:', error);
				setSnackbar({
					open: true,
					message: 'Failed to check shift status',
					type: 'error',
				});
			} finally {
				setLoading(false);
			}
		};

		checkShiftStatus();
	}, [selectedHoraId, shiftDate]);

	// Handle time dropdown change - explicitly call API
	const handleTimeChange = (value: string) => {
		const horaId = value ? Number(value) : null;
		setSelectedHoraId(horaId);
		// API will be called via useEffect when horaId changes
	};

	// Convert hora options to dropdown format
	const horaDropdownOptions = useMemo(() => {
		return horaOptions.map(hora => ({
			value: String(hora.id),
			label: hora.name,
		}));
	}, [horaOptions]);

	// Convert ops status to dropdown format
	const opsStatusDropdownOptions = useMemo(() => {
		return opsStatusOptions.map(status => ({
			value: String(status.id),
			label: status.name,
		}));
	}, [opsStatusOptions]);

	// Convert escalation managers to dropdown format
	const escalationDropdownOptions = useMemo(() => {
		return escalationManagers.map(manager => ({
			value: String(manager.id),
			label: manager.name,
		}));
	}, [escalationManagers]);

	// Handle resource ops status change
	const handleOpsStatusChange = (resourceId: number, opsStatusId: number | null) => {
		setResourceRows(prevRows =>
			prevRows.map(row => {
				if (row.resourceId === resourceId) {
					const opsStatus = opsStatusOptions.find(s => s.id === opsStatusId);
					const shouldShowEscalation =
						opsStatus?.name === 'Non-Functional' || opsStatus?.name === 'Shortage';
					return {
						...row,
						opsStatusId,
						escalationManagerId: shouldShowEscalation ? row.escalationManagerId : null,
					};
				}
				return row;
			})
		);
	};

	// Handle escalation manager change
	const handleEscalationChange = (resourceId: number, escalationManagerId: number | null) => {
		setResourceRows(prevRows =>
			prevRows.map(row =>
				row.resourceId === resourceId ? { ...row, escalationManagerId } : row
			)
		);
	};

	// Determine if table should be shown - only when time is selected
	const shouldShowTable = useMemo(() => {
		// Don't show table if time is not selected
		if (!selectedHoraId) return false;
		
		// If shift status is null (empty shifts array) - show table
		if (!shiftStatus) return true;
		
		// If check-out is null (check-in done, check-out pending) - show table
		if (shiftStatus.check_out === null) return true;
		
		// Both check-in and check-out done - don't show table
		return false;
	}, [shiftStatus, selectedHoraId]);

	// Get table header text based on what's not done
	const getTableHeader = useMemo(() => {
		if (!selectedHoraId) return 'Resource Status';
		
		// If shift status is null, check-in is not done
		if (!shiftStatus) return 'Check-in';
		
		// If check-out is null, check-out is not done
		if (shiftStatus.check_out === null) return 'Check-out';
		
		return 'Resource Status';
	}, [shiftStatus, selectedHoraId]);

	// Get status message
	const getStatusMessage = () => {
		if (!shiftStatus) {
			return null;
		}
		if (shiftStatus.check_out === null) {
			return {
				type: 'info' as const,
				message: 'Check-in already done. Please proceed with check-out details.',
			};
		}
		if (shiftStatus.status === 'Completed') {
			return {
				type: 'success' as const,
				message: 'Check-in and check-out both are done.',
			};
		}
		return null;
	};

	const statusMessage = getStatusMessage();

	// Handle submit
	const handleSubmit = async () => {
		// Validate required fields
		if (!selectedHoraId || !shiftDate) {
			setSnackbar({
				open: true,
				message: 'Please select date and time',
				type: 'error',
			});
			return;
		}

		// Check if at least one resource has ops status selected
		const hasOpsStatus = resourceRows.some(row => row.opsStatusId !== null);
		if (!hasOpsStatus) {
			setSnackbar({
				open: true,
				message: 'Please select ops status for at least one resource',
				type: 'error',
			});
			return;
		}

		// Build resourcesInfo array
		const resourcesInfo = resourceRows
			.filter(row => row.opsStatusId !== null) // Only include resources with ops status
			.map(row => {
				const resourceInfo: CheckInShiftOpsStatusRequest['resourcesInfo'][0] = {
					shift_resource_id: row.resourceId,
					resource_status_id: row.opsStatusId!,
				};

				// Add escalation manager ID if selected and ops status requires it
				if (row.escalationManagerId !== null) {
					const opsStatus = opsStatusOptions.find(s => s.id === row.opsStatusId);
					const shouldIncludeEscalation =
						opsStatus?.name === 'Non-Functional' || opsStatus?.name === 'Shortage';
					if (shouldIncludeEscalation) {
						resourceInfo.shift_escalation_manager_id = row.escalationManagerId;
					}
				}

				return resourceInfo;
			});

		// Prepare request payload
		const requestPayload: CheckInShiftOpsStatusRequest = {
			hora_id: selectedHoraId,
			shift_date: shiftDate,
			resourcesInfo,
		};

		setLoading(true);
		try {
			const response = await ShiftApiService.checkInShiftOpsStatus(requestPayload);
			
			if (response.status === 'Success') {
				setSnackbar({
					open: true,
					message: response.message || 'Shift and resources inserted successfully',
					type: 'success',
				});
				
				// Redirect to listing page after a short delay
				setTimeout(() => {
					navigate('/operations-reporting/shift-reporting/listing');
				}, 1500);
			} else {
				setSnackbar({
					open: true,
					message: response.message || 'Failed to submit shift data',
					type: 'error',
				});
			}
		} catch (error) {
			console.error('Failed to submit shift data:', error);
			setSnackbar({
				open: true,
				message: 'Failed to submit shift data. Please try again.',
				type: 'error',
			});
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className='min-h-screen bg-white p-4'>
			<div className='max-w-7xl mx-auto'>
				<PageHeader title='Add Shift Reporting' itemType='shift reports' icon='📋' />

				{/* Filter Section */}
				<div className='mt-6 bg-white border border-gray-200 rounded-lg p-6'>
					<div className='flex gap-4 items-end'>
						<div className='w-56'>
							<FloatingInput
								label='Shift Date'
								type='date'
								value={shiftDate}
								onChange={setShiftDate}
								required
							/>
						</div>
						<div className='w-56'>
							<FloatingDropdown
								label='Time'
								options={horaDropdownOptions}
								value={selectedHoraId ? String(selectedHoraId) : ''}
								onChange={handleTimeChange}
								placeholder='Select time'
								required
								loading={loading}
							/>
						</div>
					</div>
				</div>

				{/* Status Message */}
				{statusMessage && (
					<div
						className={`mt-4 p-4 rounded-lg ${
							statusMessage.type === 'info'
								? 'bg-blue-50 border border-blue-200 text-blue-800'
								: 'bg-green-50 border border-green-200 text-green-800'
						}`}
					>
						<p className='font-medium'>{statusMessage.message}</p>
						{shiftStatus && shiftStatus.check_out === null && (
							<div className='mt-2 text-sm'>
								<p>
									<strong>Check-in:</strong> {shiftStatus.check_in || 'N/A'}
								</p>
								<p>
									<strong>Status:</strong> {shiftStatus.status}
								</p>
							</div>
						)}
					</div>
				)}

				{/* Resources Table */}
				{shouldShowTable && (
					<div className='mt-6'>
						{/* Separate heading */}
						<h3 className='text-lg font-semibold text-gray-900 mb-4'>{getTableHeader}</h3>
						
						<div className='bg-white border border-gray-200 rounded-lg overflow-hidden'>
							<div className='overflow-x-auto'>
								<table className='w-full'>
								<thead className='bg-gray-50 border-b border-gray-200'>
									<tr>
										<th className='px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider'>
											Resource
										</th>
										<th className='px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider'>
											Ops Status
										</th>
										<th className='px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider'>
											Escalated To
										</th>
									</tr>
								</thead>
								<tbody className='bg-white divide-y divide-gray-200'>
									{resourceRows.map(row => {
										const opsStatus = opsStatusOptions.find(s => s.id === row.opsStatusId);
										const shouldShowEscalation =
											opsStatus?.name === 'Non-Functional' || opsStatus?.name === 'Shortage';
										
										// Color code based on status type: Shortage/Non-Functional = red, Functional/Available = green
										const getStatusBgColor = () => {
											if (!opsStatus) return '';
											const statusName = opsStatus.name.toLowerCase();
											if (statusName === 'shortage' || statusName === 'non-functional') {
												return 'bg-red-50';
											}
											if (statusName === 'functional' || statusName === 'available') {
												return 'bg-green-50';
											}
											return '';
										};

										return (
											<tr key={row.resourceId} className='hover:bg-gray-50'>
												<td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
													{row.resourceName}
												</td>
												<td className={`px-6 py-4 whitespace-nowrap ${getStatusBgColor()}`}>
													<div className='w-48'>
														<Dropdown
															options={opsStatusDropdownOptions}
															value={row.opsStatusId ? String(row.opsStatusId) : ''}
															onChange={value =>
																handleOpsStatusChange(row.resourceId, value ? Number(value) : null)
															}
															placeholder='Select status'
															searchable={false}
														/>
													</div>
												</td>
												<td className='px-6 py-4 whitespace-nowrap'>
													{shouldShowEscalation ? (
														<div className='w-48'>
															<Dropdown
																options={escalationDropdownOptions}
																value={
																	row.escalationManagerId ? String(row.escalationManagerId) : ''
																}
																onChange={value =>
																	handleEscalationChange(
																		row.resourceId,
																		value ? Number(value) : null
																	)
																}
																placeholder='Select manager'
																searchable={false}
															/>
														</div>
													) : (
														<span className='text-sm text-gray-400'>-</span>
													)}
												</td>
											</tr>
										);
									})}
								</tbody>
							</table>
							</div>
						</div>
					</div>
				)}

				{/* Submit Button */}
				{shouldShowTable && (
					<div className='mt-6 flex justify-end'>
						<Button
							onClick={handleSubmit}
							variant='primary'
							size='lg'
							loading={loading}
							disabled={loading}
						>
							Submit
						</Button>
					</div>
				)}

				<Snackbar
					open={snackbar.open}
					message={snackbar.message}
					type={snackbar.type}
					onClose={() => setSnackbar({ ...snackbar, open: false })}
				/>
			</div>
		</div>
	);
};
